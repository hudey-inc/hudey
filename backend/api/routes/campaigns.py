"""Campaign API routes."""

from fastapi import APIRouter, HTTPException

from backend.db.repositories.campaign_repo import (
    create_campaign as repo_create,
    get_campaign as repo_get,
    list_campaigns as repo_list,
    update_campaign as repo_update,
)

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("/")
@router.get("")
def list_campaigns():
    """List campaigns, newest first."""
    return repo_list()


@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    """Get campaign by id (UUID or short_id)."""
    row = repo_get(campaign_id)
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return row


@router.post("")
def create_campaign(body: dict):
    """Create campaign from brief and optional strategy. Returns { id }."""
    brief = body.get("brief", body)
    strategy = body.get("strategy", {})
    name = body.get("name") or (brief.get("name") if isinstance(brief, dict) else None)
    short_id = body.get("short_id")
    cid = repo_create(brief, strategy, short_id=short_id, name=name)
    if not cid:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"id": cid}


@router.put("/{campaign_id}")
def update_campaign(campaign_id: str, body: dict):
    """Update campaign status/fields."""
    ok = repo_update(campaign_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"ok": True}
