"""Campaign template API routes — save, list, apply reusable briefs."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/")
@router.get("")
def list_templates(brand: dict = Depends(get_current_brand)):
    """List all campaign templates for the authenticated brand."""
    from backend.db.repositories.template_repo import list_templates as repo_list
    return repo_list(brand_id=brand["id"])


@router.get("/{template_id}")
def get_template(template_id: str, brand: dict = Depends(get_current_brand)):
    """Get a single template by id."""
    from backend.db.repositories.template_repo import get_template as repo_get
    tmpl = repo_get(template_id, brand_id=brand["id"])
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl


@router.post("")
def create_template(body: dict, brand: dict = Depends(get_current_brand)):
    """Create a new campaign template.

    Body: { name: str, description?: str, brief: dict, strategy?: dict }
    Alternatively: { name: str, description?: str, campaign_id: str }
      — copies brief/strategy from an existing campaign.
    """
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required")

    # If campaign_id provided, copy brief from that campaign
    campaign_id = body.get("campaign_id")
    if campaign_id:
        from backend.db.repositories.campaign_repo import get_campaign
        campaign = get_campaign(campaign_id, brand_id=brand["id"])
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        brief = campaign.get("brief") or {}
        strategy = {
            "target_audience": campaign.get("target_audience"),
            "deliverables": campaign.get("deliverables"),
            "timeline": campaign.get("timeline"),
        }
    else:
        brief = body.get("brief")
        if not brief or not isinstance(brief, dict):
            raise HTTPException(status_code=400, detail="brief is required")
        strategy = body.get("strategy")

    from backend.db.repositories.template_repo import create_template as repo_create
    tid = repo_create(
        brand_id=brand["id"],
        name=name,
        brief=brief,
        description=body.get("description", ""),
        strategy=strategy,
    )
    if not tid:
        raise HTTPException(status_code=503, detail="Failed to create template")
    return {"id": tid}


@router.delete("/{template_id}")
def delete_template(template_id: str, brand: dict = Depends(get_current_brand)):
    """Delete a campaign template."""
    from backend.db.repositories.template_repo import delete_template as repo_delete
    ok = repo_delete(template_id, brand_id=brand["id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"ok": True}


@router.post("/{template_id}/create-campaign")
def create_campaign_from_template(
    template_id: str,
    body: dict,
    brand: dict = Depends(get_current_brand),
):
    """Create a new draft campaign from a template.

    Body: { name?: str, brief_overrides?: dict }
    """
    from backend.db.repositories.template_repo import get_template, increment_usage
    from backend.db.repositories.campaign_repo import create_campaign

    tmpl = get_template(template_id, brand_id=brand["id"])
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    brief = dict(tmpl.get("brief") or {})
    overrides = body.get("brief_overrides")
    if overrides and isinstance(overrides, dict):
        brief.update(overrides)

    strategy = tmpl.get("strategy") or {}
    name = body.get("name") or tmpl.get("name") or "Campaign"

    cid = create_campaign(brief, strategy, name=name, brand_id=brand["id"])
    if not cid:
        raise HTTPException(status_code=503, detail="Failed to create campaign")

    increment_usage(template_id)
    return {"id": cid, "template_id": template_id}
