"""Creator engagement repository - track outreach status per creator."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def upsert_engagement(campaign_id: str, creator_id: str, data: dict) -> Optional[str]:
    """Insert or update a creator engagement. Returns engagement id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "campaign_id": campaign_id,
        "creator_id": creator_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        **data,
    }
    try:
        r = (
            sb.table("creator_engagements")
            .upsert(row, on_conflict="campaign_id,creator_id")
            .execute()
        )
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to upsert engagement: %s", e)
    return None


def get_engagements(campaign_id: str) -> list[dict]:
    """List all engagements for a campaign, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("creator_engagements")
            .select("*")
            .eq("campaign_id", campaign_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to fetch engagements: %s", e)
        return []


def get_engagement(campaign_id: str, creator_id: str) -> Optional[dict]:
    """Get a single engagement by campaign + creator."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("creator_engagements")
            .select("*")
            .eq("campaign_id", campaign_id)
            .eq("creator_id", creator_id)
            .limit(1)
            .execute()
        )
        if r.data and len(r.data) > 0:
            return r.data[0]
    except Exception as e:
        logger.warning("Failed to fetch engagement: %s", e)
    return None


def update_status(
    campaign_id: str, creator_id: str, status: str, extras: Optional[dict] = None
) -> bool:
    """Update engagement status and optional extra fields."""
    sb = get_supabase()
    if not sb:
        return False
    updates = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if extras:
        updates.update(extras)
    try:
        sb.table("creator_engagements").update(updates).eq(
            "campaign_id", campaign_id
        ).eq("creator_id", creator_id).execute()
        return True
    except Exception as e:
        logger.warning("Failed to update engagement status: %s", e)
        return False


def append_message(campaign_id: str, creator_id: str, message: dict) -> bool:
    """Append a message to the engagement's message_history."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        # Read current history
        existing = get_engagement(campaign_id, creator_id)
        if not existing:
            return False
        history = existing.get("message_history") or []
        if not isinstance(history, list):
            history = []
        history.append(message)
        sb.table("creator_engagements").update({
            "message_history": history,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("campaign_id", campaign_id).eq("creator_id", creator_id).execute()
        return True
    except Exception as e:
        logger.warning("Failed to append message: %s", e)
        return False
