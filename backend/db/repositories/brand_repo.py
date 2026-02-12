"""Brand repository - get and update brand profile."""

import logging

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)

# Fields that can be updated via the API
_ALLOWED_FIELDS = {"name", "industry", "contact_email", "brand_voice"}


def get_brand(brand_id: str):
    """Get brand by UUID. Returns dict or None."""
    sb = get_supabase()
    if not sb:
        return None
    r = sb.table("brands").select("*").eq("id", brand_id).execute()
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
