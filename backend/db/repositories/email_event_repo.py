"""Email event repository - track delivery status from Resend webhooks."""

from __future__ import annotations

import hashlib
import logging
from typing import Optional
from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def create_event(
    email_id: str,
    event_type: str,
    recipient: str = "",
    campaign_id: str = "",
    creator_id: str = "",
) -> Optional[str]:
    """Insert an email event. Returns event id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "email_id": email_id,
        "event_type": event_type,
        "recipient": recipient,
        "campaign_id": campaign_id,
        "creator_id": creator_id,
    }
    try:
        r = sb.table("email_events").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to insert email event: %s", e)
    return None


def get_events_by_campaign(campaign_id: str) -> list[dict]:
    """Get all email events for a campaign, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("email_events")
            .select("*")
            .eq("campaign_id", campaign_id)
            .order("created_at", desc=True)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to fetch email events: %s", e)
        return []


def get_delivery_summary(campaign_id: str) -> dict:
    """Aggregate email events into a delivery summary.

    Returns:
        {
            total_sent: int,
            delivered: int,
            opened: int,
            clicked: int,
            bounced: int,
            per_creator: [
                { creator_id, recipient, status, events: [...] }
            ]
        }
    """
    events = get_events_by_campaign(campaign_id)
    if not events:
        return {"total_sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "per_creator": []}

    # Group by creator_id (or email_id as fallback)
    creator_map: dict[str, dict] = {}
    for ev in events:
        key = ev.get("creator_id") or ev.get("email_id", "")
        if key not in creator_map:
            creator_map[key] = {
                "creator_id": ev.get("creator_id", ""),
                "email_id": ev.get("email_id", ""),
                "recipient": ev.get("recipient", ""),
                "events": [],
                "status": "sent",  # default
            }
        creator_map[key]["events"].append({
            "event_type": ev.get("event_type"),
            "created_at": ev.get("created_at"),
        })

    # Determine highest status per creator
    STATUS_PRIORITY = {"complained": 5, "bounced": 4, "clicked": 3, "opened": 2, "delivered": 1, "sent": 0}

    for info in creator_map.values():
        best = "sent"
        best_p = 0
        for e in info["events"]:
            et = e["event_type"]
            p = STATUS_PRIORITY.get(et, 0)
            if p > best_p:
                best = et
                best_p = p
        info["status"] = best

    # Aggregate counts
    counts = {"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "complained": 0}
    for info in creator_map.values():
        s = info["status"]
        if s in counts:
            counts[s] += 1
        # Accumulate: clicked implies opened implies delivered implies sent
        if s in ("clicked", "opened", "delivered"):
            counts["delivered"] = counts.get("delivered", 0)  # already counted via status
        counts["sent"] += 1  # every creator was sent to

    # Simpler: just count unique event types across all events
    total_sent = len(creator_map)
    type_counts = {"delivered": 0, "opened": 0, "clicked": 0, "bounced": 0}
    for info in creator_map.values():
        seen = set()
        for e in info["events"]:
            seen.add(e["event_type"])
        for t in type_counts:
            if t in seen:
                type_counts[t] += 1

    return {
        "total_sent": total_sent,
        "delivered": type_counts["delivered"],
        "opened": type_counts["opened"],
        "clicked": type_counts["clicked"],
        "bounced": type_counts["bounced"],
        "per_creator": list(creator_map.values()),
    }


def lookup_by_email_id(email_id: str) -> Optional[dict]:
    """Find campaign_id and creator_id for a Resend email_id by looking up sent events."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("email_events")
            .select("campaign_id, creator_id, recipient")
            .eq("email_id", email_id)
            .eq("event_type", "sent")
            .limit(1)
            .execute()
        )
        if r.data and len(r.data) > 0:
            return r.data[0]
    except Exception as e:
        logger.warning("Failed to lookup email_id %s: %s", email_id, e)
    return None


# ── Idempotency & Webhook Logging ────────────────────────────────


def event_exists(email_id: str, event_type: str) -> bool:
    """Check if an email event with this (email_id, event_type) already exists.

    Fail-open: returns False on error so events aren't silently dropped.
    """
    sb = get_supabase()
    if not sb:
        return False
    try:
        r = (
            sb.table("email_events")
            .select("id")
            .eq("email_id", email_id)
            .eq("event_type", event_type)
            .limit(1)
            .execute()
        )
        return bool(r.data and len(r.data) > 0)
    except Exception as e:
        logger.warning("Failed to check event existence: %s", e)
        return False


def inbound_reply_exists(dedup_key: str) -> bool:
    """Check if an inbound reply with this dedup key has already been processed."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        r = (
            sb.table("processed_inbound_replies")
            .select("id")
            .eq("dedup_key", dedup_key)
            .limit(1)
            .execute()
        )
        return bool(r.data and len(r.data) > 0)
    except Exception as e:
        logger.warning("Failed to check inbound reply existence: %s", e)
        return False


def record_inbound_reply(dedup_key: str, from_email: str = "") -> None:
    """Record that an inbound reply has been processed (for deduplication)."""
    sb = get_supabase()
    if not sb:
        return
    try:
        sb.table("processed_inbound_replies").insert({
            "dedup_key": dedup_key,
            "from_email": from_email,
        }).execute()
    except Exception as e:
        logger.warning("Failed to record inbound reply dedup: %s", e)


def log_webhook(
    endpoint: str,
    webhook_id: str,
    body_bytes: bytes,
    status_code: int,
    result: str,
) -> None:
    """Log a webhook request to webhook_log table. Non-fatal."""
    try:
        sb = get_supabase()
        if not sb:
            return
        sb.table("webhook_log").insert({
            "endpoint": endpoint,
            "webhook_id": webhook_id or "",
            "body_hash": hashlib.sha256(body_bytes).hexdigest(),
            "status_code": status_code,
            "result_summary": result[:255],
        }).execute()
    except Exception:
        pass  # Never let logging break webhooks
