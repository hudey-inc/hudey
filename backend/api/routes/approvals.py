"""Approval and creator-response webhook routes."""

from fastapi import APIRouter, HTTPException

from backend.db.repositories.approval_repo import (
    create_approval as repo_create,
    list_approvals as repo_list,
    list_pending as repo_pending,
    decide_approval as repo_decide,
)

router = APIRouter(tags=["approvals"])


# ── Approval CRUD ──────────────────────────────────────────────


@router.get("/api/approvals/pending")
def pending_approvals():
    """List all pending approvals across campaigns."""
    return repo_pending()


@router.get("/api/campaigns/{campaign_id}/approvals")
def campaign_approvals(campaign_id: str):
    """List all approvals for a campaign, newest first."""
    return repo_list(campaign_id)


@router.post("/api/campaigns/{campaign_id}/approvals")
def create_approval(campaign_id: str, body: dict):
    """
    Create a new approval request (used by the agent).
    Body: { approval_type, payload, subject?, reasoning? }
    """
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
def decide_approval(approval_id: str, body: dict):
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


# ── Creator response webhooks (existing) ───────────────────────


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
