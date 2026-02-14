"""Campaign monitor repository — persist and retrieve monitoring snapshots.

Each monitoring run creates a snapshot with the full list of updates and
an aggregated summary. The latest snapshot represents the current state.
"""

from __future__ import annotations

import logging
from typing import Optional

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def save_monitor_snapshot(
    campaign_id: str,
    updates: list,
    summary: dict,
) -> Optional[str]:
    """Insert a new monitor snapshot. Returns snapshot id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "campaign_id": campaign_id,
        "snapshot_data": updates,
        "summary": summary,
    }
    try:
        r = sb.table("campaign_monitor_updates").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to save monitor snapshot: %s", e)
    return None


def get_latest_snapshot(campaign_id: str) -> Optional[dict]:
    """Get the most recent monitor snapshot for a campaign."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("campaign_monitor_updates")
            .select("*")
            .eq("campaign_id", campaign_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if r.data and len(r.data) > 0:
            return r.data[0]
    except Exception as e:
        logger.warning("Failed to get latest monitor snapshot: %s", e)
    return None


def get_monitor_summary(campaign_id: str) -> dict:
    """Get the summary from the latest monitor snapshot.

    Returns the summary dict or empty dict if no snapshot exists.
    """
    snapshot = get_latest_snapshot(campaign_id)
    if not snapshot:
        return {}
    return snapshot.get("summary") or {}


def get_monitor_updates(campaign_id: str) -> list:
    """Get the full updates from the latest monitor snapshot.

    Returns the list of update dicts or empty list.
    """
    snapshot = get_latest_snapshot(campaign_id)
    if not snapshot:
        return []
    return snapshot.get("snapshot_data") or []


def list_snapshots(campaign_id: str, limit: int = 10) -> list:
    """List monitor snapshots for a campaign, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("campaign_monitor_updates")
            .select("id, campaign_id, summary, created_at")
            .eq("campaign_id", campaign_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list monitor snapshots: %s", e)
        return []
