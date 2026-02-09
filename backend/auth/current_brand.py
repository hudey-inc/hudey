"""FastAPI dependency: resolve authenticated user's brand."""

from fastapi import Depends, HTTPException, status

from backend.auth.deps import get_current_user
from backend.auth.brand_resolver import get_or_create_brand


def get_current_brand(user: dict = Depends(get_current_user)) -> dict:
    """Return the current user's brand dict. Creates brand on first login."""
    import os
    from backend.db.client import get_supabase

    user_id = user.get("sub")
    email = user.get("email", "")

    # Pre-check: is Supabase even configured?
    sb = get_supabase()
    if sb is None:
        url_set = bool((os.getenv("SUPABASE_URL") or "").strip())
        key_set = bool((os.getenv("SUPABASE_SERVICE_KEY") or "").strip())
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not configured (SUPABASE_URL={'set' if url_set else 'MISSING'}, SUPABASE_SERVICE_KEY={'set' if key_set else 'MISSING'})",
        )

    brand = get_or_create_brand(user_id, email)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not resolve brand for user",
        )
    return brand
