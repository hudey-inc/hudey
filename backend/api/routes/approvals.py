"""Approval and creator-response webhook routes."""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["approvals"])


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
