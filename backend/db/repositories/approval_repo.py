"""Approval repository - create, list, decide."""

from datetime import datetime, timezone
from backend.db.client import get_supabase


def create_approval(
    campaign_id: str,
    approval_type: str,
    payload: dict,
    *,
    subject: str = None,
    reasoning: str = None,
):
    """Insert an approval request. Returns approval id (UUID string) or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "campaign_id": campaign_id,
        "approval_type": approval_type,
        "subject": subject or f"{approval_type.replace('_', ' ').title()} approval",
        "payload": payload,
        "reasoning": reasoning,
        "status": "pending",
    }
    r = sb.table("approvals").insert(row).execute()
    if not r.data or len(r.data) == 0:
        return None
    return str(r.data[0]["id"])


def list_approvals(campaign_id: str):
    """List all approvals for a campaign, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    r = (
        sb.table("approvals")
        .select("*")
        .eq("campaign_id", campaign_id)
        .order("created_at", desc=True)
        .execute()
    )
    return r.data or []


def list_pending():
    """List all pending approvals across campaigns."""
    sb = get_supabase()
    if not sb:
        return []
    r = (
        sb.table("approvals")
        .select("*")
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return r.data or []


def get_approval(approval_id: str):
    """Get a single approval by id."""
    sb = get_supabase()
    if not sb:
        return None
    r = sb.table("approvals").select("*").eq("id", approval_id).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def decide_approval(approval_id: str, status: str, feedback: str = None):
    """Record an approval decision. Status must be 'approved' or 'rejected'."""
    sb = get_supabase()
    if not sb:
        return False
    now = datetime.now(timezone.utc).isoformat()
    updates = {
        "status": status,
        "feedback": feedback,
        "decided_at": now,
    }
    r = sb.table("approvals").update(updates).eq("id", approval_id).execute()
    return bool(r.data and len(r.data) > 0)
