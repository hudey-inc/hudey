"""Brand API routes — profile read/update."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand
from backend.db.repositories.brand_repo import update_brand as repo_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.get("/me")
def get_my_brand(brand: dict = Depends(get_current_brand)):
    """Return the current user's brand profile."""
    return brand


@router.put("/me")
def update_my_brand(body: dict, brand: dict = Depends(get_current_brand)):
    """Update current user's brand profile. Returns updated brand."""
    if not body:
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = repo_update(brand["id"], body)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update brand")
    return updated
