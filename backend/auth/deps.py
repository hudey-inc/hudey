"""Auth dependencies - JWT validation and current user extraction."""

import logging
import os

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Cache JWKS so we don't fetch on every request
_jwks_cache: dict | None = None


def _get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip()


def _get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    return secret


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
        resp = requests.get(jwks_url, timeout=10)
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

    # Peek at the token header to determine the algorithm
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        logger.warning("Cannot decode JWT header: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = unverified_header.get("alg", "HS256")

    try:
        if alg == "ES256":
            payload = _verify_es256(token, unverified_header)
        else:
            payload = _verify_hs256(token)
    except HTTPException:
        raise
    except JWTError as e:
        logger.warning("JWT validation failed (alg=%s): %s", alg, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.exception("Unexpected error during JWT validation (alg=%s): %s", alg, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auth error: {type(e).__name__}: {e}",
        )

    return payload


def _verify_es256(token: str, header: dict) -> dict:
    """Verify an ES256-signed JWT using the Supabase JWKS."""
    jwks_data = _get_jwks()
    kid = header.get("kid")

    # Find the matching key
    key_data = None
    for k in jwks_data.get("keys", []):
        if k.get("kid") == kid:
            key_data = k
            break

    if not key_data:
        # Clear cache and retry in case keys were rotated
        global _jwks_cache
        _jwks_cache = None
        jwks_data = _get_jwks()
        for k in jwks_data.get("keys", []):
            if k.get("kid") == kid:
                key_data = k
                break

    if not key_data:
        logger.error("No matching JWK found for kid=%s", kid)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Construct the public key and verify
    try:
        public_key = jwk.construct(key_data, algorithm="ES256")
    except Exception as e:
        logger.error("Failed to construct EC key from JWKS: %s (key_data keys: %s)", e, list(key_data.keys()))
        raise

    payload = jwt.decode(
        token,
        public_key,
        algorithms=["ES256"],
        audience="authenticated",
    )
    return payload


def _verify_hs256(token: str) -> dict:
    """Verify an HS256-signed JWT using the JWT secret."""
    secret = _get_jwt_secret()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret not configured",
        )
    payload = jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience="authenticated",
    )
    return payload
