"""Notification repository - create, list, mark read."""

import logging
from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def create_notification(
    brand_id: str,
    notification_type: str,
    title: str,
    body: str = None,
    campaign_id: str = None,
    link: str = None,
):
    """Insert a notification. Returns notification id (UUID string) or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "brand_id": brand_id,
        "type": notification_type,
        "title": title,
        "body": body,
        "campaign_id": campaign_id,
        "link": link,
        "is_read": False,
    }
    try:
        r = sb.table("notifications").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to create notification: %s", e)
    return None


def list_notifications(brand_id: str, limit: int = 50):
    """List notifications for a brand, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("notifications")
            .select("*")
            .eq("brand_id", brand_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list notifications: %s", e)
        return []


def count_unread(brand_id: str) -> int:
    """Count unread notifications for a brand."""
    sb = get_supabase()
    if not sb:
        return 0
    try:
        r = (
            sb.table("notifications")
            .select("id")
            .eq("brand_id", brand_id)
            .eq("is_read", False)
            .execute()
        )
        return len(r.data) if r.data else 0
    except Exception as e:
        logger.warning("Failed to count unread notifications: %s", e)
        return 0


def mark_read(notification_id: str, brand_id: str) -> bool:
    """Mark a single notification as read. Brand_id enforces ownership."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        r = (
            sb.table("notifications")
            .update({"is_read": True})
            .eq("id", notification_id)
            .eq("brand_id", brand_id)
            .execute()
        )
        return bool(r.data and len(r.data) > 0)
    except Exception as e:
        logger.warning("Failed to mark notification read: %s", e)
        return False


def mark_all_read(brand_id: str) -> bool:
    """Mark all unread notifications as read for a brand."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        sb.table("notifications").update({"is_read": True}).eq(
            "brand_id", brand_id
        ).eq("is_read", False).execute()
        return True
    except Exception as e:
        logger.warning("Failed to mark all notifications read: %s", e)
        return False


def maybe_create_notification(
    brand_id: str,
    notification_type: str,
    title: str,
    body: str = None,
    campaign_id: str = None,
    link: str = None,
):
    """Create a notification only if the brand's preferences allow it.

    Maps notification_type to preference keys:
      campaign_approval  -> campaign_approvals
      creator_response   -> creator_responses
      campaign_completion -> campaign_completion
    """
    from backend.db.repositories.brand_repo import get_brand

    pref_map = {
        "campaign_approval": "campaign_approvals",
        "creator_response": "creator_responses",
        "campaign_completion": "campaign_completion",
    }
    pref_key = pref_map.get(notification_type)

    if pref_key:
        brand = get_brand(brand_id)
        if brand:
            voice = brand.get("brand_voice") or {}
            prefs = voice.get("notification_preferences") or {}
            # Default to True if not explicitly set to False
            if prefs.get(pref_key) is False:
                return None  # User opted out

    return create_notification(
        brand_id=brand_id,
        notification_type=notification_type,
        title=title,
        body=body,
        campaign_id=campaign_id,
        link=link,
    )
