"""Campaign template repository — CRUD for reusable campaign templates."""

from __future__ import annotations

import logging
from typing import Optional

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def create_template(
    brand_id: str,
    name: str,
    brief: dict,
    *,
    description: str = "",
    strategy: Optional[dict] = None,
) -> Optional[str]:
    """Insert a campaign template. Returns template id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "brand_id": brand_id,
        "name": name,
        "description": description or "",
        "brief": brief,
    }
    if strategy:
        row["strategy"] = strategy
    try:
        r = sb.table("campaign_templates").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to create template: %s", e)
    return None


def list_templates(brand_id: str, limit: int = 50) -> list:
    """List templates for a brand, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("campaign_templates")
            .select("id, name, description, brief, strategy, usage_count, created_at")
            .eq("brand_id", brand_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list templates: %s", e)
        return []


def get_template(template_id: str, brand_id: str = None) -> Optional[dict]:
    """Get template by id. Verifies brand ownership if brand_id provided."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("campaign_templates")
            .select("*")
            .eq("id", template_id)
            .execute()
        )
        if not r.data or len(r.data) == 0:
            return None
        row = r.data[0]
        if brand_id and row.get("brand_id") and row["brand_id"] != brand_id:
            return None
        return row
    except Exception as e:
        logger.warning("Failed to get template: %s", e)
        return None


def delete_template(template_id: str, brand_id: str) -> bool:
    """Delete a template. Verifies brand ownership."""
    sb = get_supabase()
    if not sb:
        return False
    tmpl = get_template(template_id, brand_id=brand_id)
    if not tmpl:
        return False
    try:
        sb.table("campaign_templates").delete().eq("id", tmpl["id"]).execute()
        return True
    except Exception as e:
        logger.warning("Failed to delete template: %s", e)
        return False


def increment_usage(template_id: str) -> bool:
    """Increment the usage_count of a template."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        tmpl = get_template(template_id)
        if not tmpl:
            return False
        new_count = (tmpl.get("usage_count") or 0) + 1
        sb.table("campaign_templates").update({
            "usage_count": new_count,
        }).eq("id", template_id).execute()
        return True
    except Exception as e:
        logger.warning("Failed to increment template usage: %s", e)
        return False
