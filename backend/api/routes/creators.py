"""Creator discovery API — search, save/unsave, list saved."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand
from backend.db.client import get_supabase
from backend.db.repositories.creator_repo import upsert_creators

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/creators", tags=["creators"])


def _creator_to_dict(c) -> dict:
    """Normalise a creator row (dict or model) for JSON response."""
    if hasattr(c, "model_dump"):
        c = c.model_dump()
    return {
        "id": str(c.get("id", "")),
        "external_id": c.get("external_id"),
        "platform": c.get("platform", ""),
        "username": c.get("username", ""),
        "display_name": c.get("display_name") or c.get("username", ""),
        "follower_count": c.get("follower_count", 0),
        "engagement_rate": c.get("engagement_rate"),
        "categories": c.get("categories") or [],
        "location": c.get("location"),
        "email": c.get("email"),
        "is_saved": c.get("is_saved", False),
    }


# ── Search ────────────────────────────────────────────────


@router.post("/search")
def search_creators(body: dict, brand: dict = Depends(get_current_brand)):
    """Search creators via InsightIQ (Phyllo).

    Body: {
        platforms: ["instagram", "tiktok"],
        follower_min: 10000,
        follower_max: 500000,
        categories: ["fashion"],   // optional
        locations: ["UK"],         // optional
        limit: 20                  // optional, default 20, max 50
    }
    """
    platforms = body.get("platforms", [])
    follower_min = int(body.get("follower_min", 1000))
    follower_max = int(body.get("follower_max", 1_000_000))
    categories = body.get("categories") or []
    locations = body.get("locations") or []
    limit = min(int(body.get("limit", 20)), 50)

    if not platforms:
        raise HTTPException(status_code=400, detail="At least one platform is required")
    if follower_min >= follower_max:
        raise HTTPException(status_code=400, detail="follower_min must be less than follower_max")

    # Lazy import to keep startup light
    from services.phyllo_client import PhylloClient

    client = PhylloClient()
    if not client.is_configured:
        return {"creators": [], "total": 0, "configured": False}

    # Search via InsightIQ
    raw_results = client.search_creators(
        platforms=platforms,
        follower_min=follower_min,
        follower_max=follower_max,
        categories=categories or None,
        locations=locations or None,
        limit=limit,
    )

    if not raw_results:
        return {"creators": [], "total": 0, "configured": True}

    # Map to Creator models
    from tools.creator_discovery import _map_phyllo_to_creator

    mapped = [_map_phyllo_to_creator(r) for r in raw_results]

    # Cache to creators table (returns list of UUIDs)
    creator_dicts = [m.model_dump() for m in mapped]
    cached_ids = upsert_creators(creator_dicts)

    # Fetch cached rows to get DB-generated UUIDs
    sb = get_supabase()
    creators_out = []

    if sb and cached_ids:
        rows = (
            sb.table("creators")
            .select("*")
            .in_("id", cached_ids)
            .execute()
        )
        db_rows = {r["id"]: r for r in (rows.data or [])}

        # Check which are saved by this brand
        saved_rows = (
            sb.table("saved_creators")
            .select("creator_id")
            .eq("brand_id", brand["id"])
            .in_("creator_id", cached_ids)
            .execute()
        )
        saved_ids = {r["creator_id"] for r in (saved_rows.data or [])}

        for cid in cached_ids:
            row = db_rows.get(cid)
            if row:
                row["is_saved"] = cid in saved_ids
                creators_out.append(_creator_to_dict(row))
    else:
        # Fallback: return mapped data without DB ids
        for m in mapped:
            d = m.model_dump()
            d["is_saved"] = False
            creators_out.append(_creator_to_dict(d))

    return {"creators": creators_out, "total": len(creators_out), "configured": True}


# ── Saved Creators ────────────────────────────────────────


@router.get("/saved")
def list_saved_creators(brand: dict = Depends(get_current_brand)):
    """List saved (favourited) creators for the authenticated brand."""
    sb = get_supabase()
    if not sb:
        return []

    # Join saved_creators -> creators
    saved = (
        sb.table("saved_creators")
        .select("creator_id")
        .eq("brand_id", brand["id"])
        .order("created_at", desc=True)
        .execute()
    )

    if not saved.data:
        return []

    creator_ids = [r["creator_id"] for r in saved.data]
    rows = (
        sb.table("creators")
        .select("*")
        .in_("id", creator_ids)
        .execute()
    )

    # Maintain saved order
    id_to_row = {r["id"]: r for r in (rows.data or [])}
    result = []
    for cid in creator_ids:
        row = id_to_row.get(cid)
        if row:
            row["is_saved"] = True
            result.append(_creator_to_dict(row))

    return result


@router.post("/{creator_id}/save")
def save_creator(creator_id: str, brand: dict = Depends(get_current_brand)):
    """Save (favourite) a creator for the authenticated brand."""
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")

    # Verify creator exists
    check = sb.table("creators").select("id").eq("id", creator_id).limit(1).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Creator not found")

    # Upsert to handle duplicates gracefully
    sb.table("saved_creators").upsert(
        {"brand_id": brand["id"], "creator_id": creator_id},
        on_conflict="brand_id,creator_id",
    ).execute()

    return {"ok": True}


@router.delete("/{creator_id}/save")
def unsave_creator(creator_id: str, brand: dict = Depends(get_current_brand)):
    """Remove a creator from the authenticated brand's saved list."""
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")

    sb.table("saved_creators").delete().eq(
        "brand_id", brand["id"]
    ).eq("creator_id", creator_id).execute()

    return {"ok": True}
