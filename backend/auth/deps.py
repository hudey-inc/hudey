"""Auth dependencies - JWT validation and current user extraction."""

import json
import logging
import os

import requests as http_requests
from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePublicKey
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Cache JWKS so we don't fetch on every request
_jwks_cache: dict | None = None
_public_keys_cache: dict = {}  # kid -> public key object


def _get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip()


def _get_jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip()


def _get_jwks() -> dict:
    """Fetch the JWKS from Supabase (cached after first call)."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    supabase_url = _get_supabase_url()
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL not configured",
        )

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = http_requests.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        logger.info("Fetched JWKS from %s (%d keys)", jwks_url, len(_jwks_cache.get("keys", [])))
        return _jwks_cache
    except Exception as e:
        logger.error("Failed to fetch JWKS from %s: %s", jwks_url, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch signing keys",
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
        # Clear cache and retry (key rotation)
        global _jwks_cache
        _jwks_cache = None
        jwks_data = _get_jwks()
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
    from cryptography.hazmat.primitives.asymmetric.ec import ECDSA
    from cryptography.hazmat.primitives.hashes import SHA256
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

    kid = header.get("kid")
    public_key = _get_ec_public_key(kid)
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
            detail="Invalid signature length",
            headers={"WWW-Authenticate": "Bearer"},
        )

    r = int.from_bytes(signature[:32], "big")
    s = int.from_bytes(signature[32:], "big")

    from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
    der_sig = encode_dss_signature(r, s)

    try:
        public_key.verify(der_sig, signing_input, ECDSA(SHA256()))
    except Exception:
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
