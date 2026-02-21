"""Brand repository - get and update brand profile."""

import logging

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)

# Fields that can be updated via the user-facing API
_ALLOWED_FIELDS = {"name", "industry", "contact_email", "brand_voice"}

# Fields that can be set by internal processes (webhooks, background jobs)
_INTERNAL_FIELDS = _ALLOWED_FIELDS | {"paddle_customer_id"}


def get_brand(brand_id: str):
    """Get brand by UUID. Returns dict or None."""
    sb = get_supabase()
    if not sb:
        return None
    r = sb.table("brands").select("*").eq("id", brand_id).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def get_brand_by_user(user_id: str):
    """Get brand by Supabase auth user_id. Returns dict or None."""
    sb = get_supabase()
    if not sb:
        return None
    r = sb.table("brands").select("*").eq("user_id", user_id).limit(1).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def update_brand(brand_id: str, updates: dict):
    """Update brand by id. Only whitelisted fields are written. Returns updated row or None."""
    sb = get_supabase()
    if not sb:
        return None
    safe = {k: v for k, v in updates.items() if k in _ALLOWED_FIELDS}
    if not safe:
        return None
    r = sb.table("brands").update(safe).eq("id", brand_id).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def update_brand_internal(brand_id: str, updates: dict):
    """Update brand with internal fields (e.g. paddle_customer_id from webhook).

    Uses a broader field whitelist than the user-facing update.
    """
    sb = get_supabase()
    if not sb:
        return None
    safe = {k: v for k, v in updates.items() if k in _INTERNAL_FIELDS}
    if not safe:
        return None
    try:
        r = sb.table("brands").update(safe).eq("id", brand_id).execute()
        if not r.data or len(r.data) == 0:
            return None
        return r.data[0]
    except Exception as e:
        logger.warning("Failed to update brand %s internally: %s", brand_id, e)
        return None
