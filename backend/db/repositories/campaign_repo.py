"""Campaign repository - create, get, update, save result."""

from backend.db.client import get_supabase


def create_campaign(brief: dict, strategy: dict, *, short_id: str = None, name: str = None, brand_id: str = None):
    """Insert campaign; return campaign id (UUID string)."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "brief": brief,
        "name": name or (brief.get("name") or "Campaign"),
        "status": "draft",
    }
    if short_id:
        row["short_id"] = short_id
    if brand_id:
        row["brand_id"] = brand_id
    if strategy:
        row["target_audience"] = strategy.get("target_audience")
        row["deliverables"] = strategy.get("deliverables")
        row["timeline"] = strategy.get("timeline")
    r = sb.table("campaigns").insert(row).execute()
    if not r.data or len(r.data) == 0:
        return None
    return str(r.data[0]["id"])


def list_campaigns(limit: int = 50, brand_id: str = None):
    """List campaigns, newest first. Optionally filter by brand_id."""
    sb = get_supabase()
    if not sb:
        return []
    query = sb.table("campaigns").select("id, short_id, name, status, created_at")
    if brand_id:
        query = query.eq("brand_id", brand_id)
    r = query.order("created_at", desc=True).limit(limit).execute()
    return r.data or []


def get_campaign(campaign_id: str, brand_id: str = None):
    """Get campaign by UUID or short_id. Optionally verify brand ownership."""
    sb = get_supabase()
    if not sb:
        return None
    # Try UUID first
    if len(campaign_id) == 36 and campaign_id.count("-") == 4:
        r = sb.table("campaigns").select("*").eq("id", campaign_id).execute()
    else:
        r = sb.table("campaigns").select("*").eq("short_id", campaign_id).execute()
    if not r.data or len(r.data) == 0:
        return None
    row = r.data[0]
    # If brand_id provided, verify ownership
    if brand_id and row.get("brand_id") and row["brand_id"] != brand_id:
        return None
    return row


def update_campaign(campaign_id: str, updates: dict):
    """Update campaign by id (UUID or short_id)."""
    sb = get_supabase()
    if not sb:
        return False
    campaign = get_campaign(campaign_id)
    if not campaign:
        return False
    uuid_id = campaign["id"]
    sb.table("campaigns").update(updates).eq("id", uuid_id).execute()
    return True


def save_campaign_result(campaign_id: str, result: dict):
    """Persist full result JSON to campaigns. Creates campaign by short_id if not present (CLI run)."""
    sb = get_supabase()
    if not sb:
        return False
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    campaign = get_campaign(campaign_id)
    if campaign:
        sb.table("campaigns").update({
            "result_json": result,
            "status": "completed",
            "completed_at": now,
        }).eq("id", campaign["id"]).execute()
        return True
    # CLI-only run: insert row with short_id and result
    brief = result.get("brief") or {}
    name = (brief.get("brand_name") or "Campaign") if isinstance(brief, dict) else "Campaign"
    row = {
        "short_id": campaign_id,
        "name": name,
        "status": "completed",
        "result_json": result,
        "completed_at": now,
    }
    sb.table("campaigns").insert(row).execute()
    return True
