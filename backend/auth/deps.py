"""Auth dependencies - JWT validation and current user extraction."""

import json
import logging
import os
import time
from typing import Optional

import requests as http_requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Cache JWKS so we don't fetch on every request
_jwks_cache: Optional[dict] = None
_jwks_cached_at: float = 0.0  # epoch seconds; used to serve stale cache on transient failures
_public_keys_cache: dict = {}  # kid -> public key object

# How long a cached JWKS is considered fresh. After this window we try to
# refetch, but if the refetch fails we keep serving the stale cache for up to
# JWKS_STALE_OK_SECONDS — better to accept a slightly outdated key list than
# to 500 every auth'd request during a brief Supabase blip.
JWKS_FRESH_SECONDS = 60 * 60  # 1h
JWKS_STALE_OK_SECONDS = 60 * 60 * 24  # 24h

# Retry config for the JWKS HTTP fetch itself.
_JWKS_RETRIES = 3
_JWKS_BACKOFF_SECONDS = 0.5
_JWKS_REQUEST_TIMEOUT = 5


def _get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip()


def _get_jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip()


def _fetch_jwks_with_retries(jwks_url: str) -> dict:
    """GET the JWKS document with short exponential-ish backoff.

    Raises the last exception if all attempts fail. Keep the per-attempt
    timeout small so a slow upstream doesn't stall every incoming request.
    """
    last_err: Optional[Exception] = None
    for attempt in range(1, _JWKS_RETRIES + 1):
        try:
            resp = http_requests.get(jwks_url, timeout=_JWKS_REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_err = e
            if attempt < _JWKS_RETRIES:
                delay = _JWKS_BACKOFF_SECONDS * attempt
                logger.warning(
                    "JWKS fetch attempt %d/%d failed (%s) — retrying in %.2fs",
                    attempt, _JWKS_RETRIES, e, delay,
                )
                time.sleep(delay)
            else:
                logger.error(
                    "JWKS fetch failed after %d attempts: %s", _JWKS_RETRIES, e,
                )
    assert last_err is not None
    raise last_err


def _get_jwks(force_refresh: bool = False) -> dict:
    """Return the JWKS document, refreshing from Supabase when needed.

    Behavior:
    - Serve from cache if fresh (< JWKS_FRESH_SECONDS old) and not forced.
    - Otherwise try to refetch with retries.
    - If refetch fails but we have a stale cache younger than
      JWKS_STALE_OK_SECONDS, keep serving it rather than 500ing every request.
    - Only raise 500 if we have no usable cache at all.
    """
    global _jwks_cache, _jwks_cached_at

    now = time.time()
    cache_age = now - _jwks_cached_at if _jwks_cache else float("inf")

    if _jwks_cache and not force_refresh and cache_age < JWKS_FRESH_SECONDS:
        return _jwks_cache

    supabase_url = _get_supabase_url()
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL not configured",
        )

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        jwks = _fetch_jwks_with_retries(jwks_url)
        _jwks_cache = jwks
        _jwks_cached_at = now
        logger.info(
            "Fetched JWKS from %s (%d keys)", jwks_url, len(jwks.get("keys", [])),
        )
        return _jwks_cache
    except Exception as e:
        # Fall back to stale cache if we have one within the grace window.
        if _jwks_cache and cache_age < JWKS_STALE_OK_SECONDS:
            logger.warning(
                "JWKS refresh failed (%s); serving stale cache (age=%.0fs)",
                e, cache_age,
            )
            return _jwks_cache
        logger.error("Failed to fetch JWKS from %s and no usable cache: %s", jwks_url, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Signing keys temporarily unavailable",
        )


def _get_ec_public_key(kid: str):
    """Get the EC public key for a given kid, using cache."""
    if kid in _public_keys_cache:
        return _public_keys_cache[kid]

    jwks_data = _get_jwks()
    key_data = None
    for k in jwks_data.get("keys", []):
        if k.get("kid") == kid:
            key_data = k
            break

    if not key_data:
        # Unknown kid — likely key rotation. Force a fresh fetch.
        jwks_data = _get_jwks(force_refresh=True)
        for k in jwks_data.get("keys", []):
            if k.get("kid") == kid:
                key_data = k
                break

    if not key_data:
        return None

    # Build EC public key from JWK using cryptography library directly
    from cryptography.hazmat.primitives.asymmetric.ec import (
        SECP256R1,
        EllipticCurvePublicNumbers,
    )
    import base64

    def _b64url_decode(s):
        s = s + "=" * (4 - len(s) % 4)
        return base64.urlsafe_b64decode(s)

    x = int.from_bytes(_b64url_decode(key_data["x"]), "big")
    y = int.from_bytes(_b64url_decode(key_data["y"]), "big")

    public_numbers = EllipticCurvePublicNumbers(x, y, SECP256R1())
    public_key = public_numbers.public_key()

    _public_keys_cache[kid] = public_key
    return public_key


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Decode and validate the Supabase JWT. Returns the payload dict.

    Supports both:
    - ES256 (asymmetric) — newer Supabase projects, validated via JWKS
    - HS256 (symmetric) — older projects, validated via JWT secret

    The payload contains:
    - sub: user UUID (same as auth.users.id)
    - email: user email
    - role: 'authenticated'
    - aud: 'authenticated'
    """
    token = credentials.credentials

    # Decode header without verification
    try:
        import base64
        header_b64 = token.split(".")[0]
        header_b64 += "=" * (4 - len(header_b64) % 4)
        header = json.loads(base64.urlsafe_b64decode(header_b64))
    except Exception as e:
        logger.warning("Cannot decode JWT header: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = header.get("alg", "HS256")

    try:
        if alg == "ES256":
            payload = _verify_es256(token, header)
        else:
            payload = _verify_hs256(token)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("JWT validation failed (alg=%s): %s", alg, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def _verify_es256(token: str, header: dict) -> dict:
    """Verify an ES256-signed JWT using cryptography + manual validation."""
    import base64
    import time

    try:
        from cryptography.hazmat.primitives.asymmetric.ec import ECDSA
        from cryptography.hazmat.primitives.hashes import SHA256
        from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
    except ImportError as e:
        logger.error("cryptography library not available: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server crypto library missing: {e}",
        )

    kid = header.get("kid")
    try:
        public_key = _get_ec_public_key(kid)
    except Exception as e:
        logger.exception("Failed to get EC public key for kid=%s: %s", kid, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Key retrieval error: {type(e).__name__}: {e}",
        )

    if not public_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Split token
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify signature
    signing_input = f"{parts[0]}.{parts[1]}".encode("ascii")
    sig_b64 = parts[2] + "=" * (4 - len(parts[2]) % 4)
    signature = base64.urlsafe_b64decode(sig_b64)

    # ES256 signature is r || s, each 32 bytes
    if len(signature) != 64:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid signature length ({len(signature)} bytes, expected 64)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    r = int.from_bytes(signature[:32], "big")
    s = int.from_bytes(signature[32:], "big")
    der_sig = encode_dss_signature(r, s)

    try:
        public_key.verify(der_sig, signing_input, ECDSA(SHA256()))
    except Exception as e:
        logger.warning("ES256 signature verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and validate payload
    payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64))

    # Validate claims
    now = time.time()
    if payload.get("exp", 0) < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("aud") != "authenticated":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid audience",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def _verify_hs256(token: str) -> dict:
    """Verify an HS256-signed JWT using the JWT secret."""
    from jose import jwt as jose_jwt

    secret = _get_jwt_secret()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret not configured",
        )
    payload = jose_jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience="authenticated",
    )
    return payload
