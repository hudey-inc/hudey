"""Auth dependencies - JWT validation and current user extraction."""

import base64
import logging
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

logger = logging.getLogger(__name__)
security = HTTPBearer()


def _get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret not configured",
        )
    return secret


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Decode and validate the Supabase JWT. Returns the payload dict.

    The payload contains:
    - sub: user UUID (same as auth.users.id)
    - email: user email
    - role: 'authenticated'
    - aud: 'authenticated'
    """
    token = credentials.credentials
    secret = _get_jwt_secret()

    # Try raw secret first, then base64-decoded (Supabase may use either)
    for attempt, key in enumerate(_secret_variants(secret)):
        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except JWTError as e:
            logger.warning("JWT validation attempt %d failed: %s", attempt + 1, e)
            last_error = e

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _secret_variants(secret: str) -> list[str]:
    """Return the raw secret and, if it looks base64-encoded, the decoded form."""
    variants = [secret]
    try:
        decoded = base64.b64decode(secret).decode("utf-8")
        if decoded != secret:
            variants.append(decoded)
    except Exception:
        pass
    return variants
