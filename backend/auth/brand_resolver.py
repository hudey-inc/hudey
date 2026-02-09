"""Resolve the authenticated user's brand, creating one on first login."""

import logging

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def get_or_create_brand(user_id: str, email: str) -> dict | None:
    """Return the user's brand row. Creates a default brand on first login."""
    sb = get_supabase()
    if not sb:
        return None

    try:
        # Look up existing brand by user_id
        result = sb.table("brands").select("*").eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
    except Exception as e:
        logger.warning("Brand lookup by user_id failed (column may not exist): %s", e)
        # If user_id column doesn't exist yet, return a fallback brand
        try:
            fallback = sb.table("brands").select("*").limit(1).execute()
            if fallback.data and len(fallback.data) > 0:
                return fallback.data[0]
        except Exception:
            pass

    # First login: create a default brand with user_id
    brand_name = email.split("@")[0].title() if email else "My Brand"
    try:
        insert = sb.table("brands").insert({
            "user_id": user_id,
            "name": brand_name,
        }).execute()
        if insert.data and len(insert.data) > 0:
            return insert.data[0]
    except Exception as e:
        logger.warning("Brand creation with user_id failed: %s", e)
        # Try without user_id (column may not exist yet)
        try:
            insert = sb.table("brands").insert({
                "name": brand_name,
            }).execute()
            if insert.data and len(insert.data) > 0:
                return insert.data[0]
        except Exception as e2:
            logger.error("Brand creation failed entirely: %s", e2)

    return None
