"""Creator repository - upsert creators, get by campaign."""

from backend.db.client import get_supabase


def _creator_row(c):
    """Build row for creators table from creator dict."""
    return {
        "external_id": c.get("external_id") or c.get("id"),
        "platform": c.get("platform"),
        "username": c.get("username"),
        "display_name": c.get("display_name"),
        "follower_count": c.get("follower_count"),
        "engagement_rate": c.get("engagement_rate"),
        "categories": c.get("categories"),
        "location": c.get("location"),
        "email": c.get("email"),
        "profile_data": c,
    }


def upsert_creators(creators: list):
    """Upsert creators; return list of creator UUIDs."""
    sb = get_supabase()
    if not sb or not creators:
        return []
    ids = []
    for c in creators:
        row = _creator_row(c)
        ext = row.get("external_id") or row.get("username")
        if ext:
            r = sb.table("creators").upsert(
                row,
                on_conflict="external_id",
            ).execute()
        else:
            r = sb.table("creators").insert(row).execute()
        if r.data and len(r.data) > 0:
            ids.append(str(r.data[0]["id"]))
    return ids


def get_creators_by_campaign(campaign_id: str):
    """Get creators assigned to campaign via campaign_assignments."""
    sb = get_supabase()
    if not sb:
        return []
    # Try UUID first, then short_id — avoids f-string injection in .or_()
    campaign = sb.table("campaigns").select("id").eq("id", campaign_id).execute()
    if not campaign.data:
        campaign = sb.table("campaigns").select("id").eq("short_id", campaign_id).execute()
    if not campaign.data or len(campaign.data) == 0:
        return []
    uuid_id = campaign.data[0]["id"]
    r = sb.table("campaign_assignments").select("creator_id").eq("campaign_id", uuid_id).execute()
    if not r.data:
        return []
    creator_ids = [x["creator_id"] for x in r.data]
    creators = sb.table("creators").select("*").in_("id", creator_ids).execute()
    return creators.data or []
