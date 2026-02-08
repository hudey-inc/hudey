"""Approval and creator-response webhook routes."""

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand
from backend.db.repositories.approval_repo import (
    create_approval as repo_create,
    list_approvals as repo_list,
    list_pending as repo_pending,
    decide_approval as repo_decide,
)
from backend.db.repositories.campaign_repo import get_campaign as repo_get_campaign

router = APIRouter(tags=["approvals"])


# ── Approval CRUD (authenticated) ────────────────────────────


@router.get("/api/approvals/pending")
def pending_approvals(brand: dict = Depends(get_current_brand)):
    """List all pending approvals for the authenticated user's brand."""
    all_pending = repo_pending()
    brand_id = brand["id"]
    return [
        a for a in all_pending
        if _approval_belongs_to_brand(a, brand_id)
    ]


@router.get("/api/campaigns/{campaign_id}/approvals")
def campaign_approvals(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """List all approvals for a campaign, newest first."""
    campaign = repo_get_campaign(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return repo_list(campaign_id)


@router.post("/api/campaigns/{campaign_id}/approvals")
def create_approval(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """
    Create a new approval request (used by the agent).
    Body: { approval_type, payload, subject?, reasoning? }
    """
    campaign = repo_get_campaign(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    approval_type = body.get("approval_type")
    payload = body.get("payload")
    if not approval_type or payload is None:
        raise HTTPException(status_code=400, detail="approval_type and payload required")
    aid = repo_create(
        campaign_id=campaign_id,
        approval_type=approval_type,
        payload=payload,
        subject=body.get("subject"),
        reasoning=body.get("reasoning"),
    )
    if not aid:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"id": aid}


@router.put("/api/approvals/{approval_id}")
def decide_approval(approval_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """
    Submit an approval decision.
    Body: { status: 'approved' | 'rejected', feedback?: string }
    """
    status = body.get("status")
    if status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
    ok = repo_decide(approval_id, status, body.get("feedback"))
    if not ok:
        raise HTTPException(status_code=404, detail="Approval not found")
    return {"ok": True}


def _approval_belongs_to_brand(approval: dict, brand_id: str) -> bool:
    """Check if an approval's campaign belongs to the given brand."""
    campaign_id = approval.get("campaign_id")
    if not campaign_id:
        return False
    campaign = repo_get_campaign(campaign_id)
    return campaign is not None and campaign.get("brand_id") == brand_id


# ── Creator response webhooks (unauthenticated) ──────────────


def _creator_response(body: str, message_id: str = None, from_email: str = None, timestamp: str = None):
    from services.response_router import ingest_response
    return ingest_response(
        body=body,
        message_id=message_id,
        from_email=from_email,
        timestamp=timestamp,
    )


@router.post("/webhooks/creator-response")
def creator_response_webhook(body: dict):
    """
    Ingest creator reply (e.g. from Resend inbound or manual forwarding).
    JSON body: body (required), message_id, from_email, timestamp.
    """
    data = body or {}
    text = data.get("body", "")
    if not text:
        raise HTTPException(status_code=400, detail="body required")
    result = _creator_response(
        body=text,
        message_id=data.get("message_id"),
        from_email=data.get("from_email"),
        timestamp=data.get("timestamp"),
    )
    if result.get("success"):
        return result
    raise HTTPException(status_code=404, detail=result.get("error", "Not found"))


@router.post("/api/approvals/creator-response")
def creator_response_api(body: dict):
    """Alias for creator-response webhook."""
    return creator_response_webhook(body)


@router.get("/api/approvals/status")
def approvals_status():
    """Health check for approval service."""
    return {"status": "ok", "service": "approvals"}
