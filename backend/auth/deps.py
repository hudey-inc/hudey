"""Auth dependencies - JWT validation and current user extraction."""

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
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        logger.warning("JWT validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
