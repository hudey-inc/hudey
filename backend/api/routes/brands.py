"""Brand API routes — profile read/update."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.rate_limit import default_limit
from backend.api.schemas import UpdateBrandRequest
from backend.auth.current_brand import get_current_brand
from backend.db.repositories.brand_repo import update_brand as repo_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.get("/me")
def get_my_brand(brand: dict = Depends(get_current_brand)):
    """Return the current user's brand profile."""
    return brand


@router.put("/me")
@default_limit
def update_my_brand(request: Request, body: UpdateBrandRequest, brand: dict = Depends(get_current_brand)):
    """Update current user's brand profile. Returns updated brand."""
    data = body.model_dump(exclude_none=True, exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = repo_update(brand["id"], data)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update brand")
    return updated
