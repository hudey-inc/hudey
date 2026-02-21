"""Approval and creator-response webhook routes."""

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.rate_limit import default_limit, webhook_limit
from backend.api.schemas import CreateApprovalRequest, CreatorResponseRequest, DecideApprovalRequest
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
@default_limit
def create_approval(request: Request, campaign_id: str, body: CreateApprovalRequest, brand: dict = Depends(get_current_brand)):
    """
    Create a new approval request (used by the agent).
    Body: { approval_type, payload, subject?, reasoning? }
    """
    campaign = repo_get_campaign(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    aid = repo_create(
        campaign_id=campaign_id,
        approval_type=body.approval_type,
        payload=body.payload,
        subject=body.subject,
        reasoning=body.reasoning,
    )
    if not aid:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"id": aid}


@router.put("/api/approvals/{approval_id}")
@default_limit
def decide_approval(request: Request, approval_id: str, body: DecideApprovalRequest, brand: dict = Depends(get_current_brand)):
    """
    Submit an approval decision.
    Body: { status: 'approved' | 'rejected', feedback?: string }
    """
    ok = repo_decide(approval_id, body.status, body.feedback)
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
@webhook_limit
def creator_response_webhook(request: Request, body: CreatorResponseRequest):
    """
    Ingest creator reply (e.g. from Resend inbound or manual forwarding).
    JSON body: body (required), message_id, from_email, timestamp.
    """
    result = _creator_response(
        body=body.body,
        message_id=body.message_id,
        from_email=body.from_email,
        timestamp=body.timestamp,
    )
    if result.get("success"):
        return result
    raise HTTPException(status_code=404, detail=result.get("error", "Not found"))


@router.post("/api/approvals/creator-response")
@webhook_limit
def creator_response_api(request: Request, body: CreatorResponseRequest):
    """Alias for creator-response webhook."""
    return creator_response_webhook(request, body)


@router.get("/api/approvals/status")
def approvals_status():
    """Health check for approval service."""
    return {"status": "ok", "service": "approvals"}
