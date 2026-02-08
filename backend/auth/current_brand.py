"""FastAPI dependency: resolve authenticated user's brand."""

from fastapi import Depends, HTTPException, status

from backend.auth.deps import get_current_user
from backend.auth.brand_resolver import get_or_create_brand


def get_current_brand(user: dict = Depends(get_current_user)) -> dict:
    """Return the current user's brand dict. Creates brand on first login."""
    user_id = user.get("sub")
    email = user.get("email", "")
    brand = get_or_create_brand(user_id, email)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )
    return brand
