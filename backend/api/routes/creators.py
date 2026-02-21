"""Creator discovery API — search, save/unsave, list saved, brand fit."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.rate_limit import default_limit, search_limit
from backend.api.schemas import BrandFitRequest, SearchCreatorsRequest
from backend.auth.current_brand import get_current_brand
from backend.db.client import get_supabase
from backend.db.repositories.creator_repo import upsert_creators

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/creators", tags=["creators"])


def _extract_image_url(c: dict) -> str | None:
    """Pull profile image URL from profile_data stored in the DB.

    DB layout: ``profile_data`` is the full Creator model_dump, so the raw
    InsightIQ payload lives at ``profile_data.profile_data``.  We check
    both levels so this works regardless of nesting.

    Falls back to unavatar.io which resolves social profile pictures by
    platform + username when no direct image URL is stored.
    """
    # Try top-level profile_data (direct InsightIQ response)
    pd = c.get("profile_data")
    if isinstance(pd, dict):
        # Check the raw InsightIQ response nested inside model_dump
        raw = pd.get("profile_data") if isinstance(pd.get("profile_data"), dict) else pd
        url = (
            raw.get("image_url")
            or raw.get("profile_image_url")
            or raw.get("picture_url")
            or raw.get("avatar_url")
            or raw.get("profile_picture_url")
        )
        if url:
            return url

    # Fallback: construct a URL via unavatar.io (resolves social avatars)
    username = c.get("username")
    platform = (c.get("platform") or "").lower()
    if username:
        # unavatar.io supports: instagram, youtube, twitter/x, tiktok, github, etc.
        platform_map = {
            "instagram": "instagram",
            "youtube": "youtube",
            "tiktok": "tiktok",
            "x": "twitter",
            "twitter": "twitter",
        }
        svc = platform_map.get(platform)
        if svc:
            return f"https://unavatar.io/{svc}/{username}"
        # Generic fallback
        return f"https://unavatar.io/{username}"

    return None


def _normalise_location(loc) -> str | None:
    """Turn a location value into a readable string.

    Handles:
    - Already a string → return as-is (unless it looks like a raw dict repr)
    - A dict like {city, state, country} → join non-null parts
    - None → None
    """
    if loc is None:
        return None
    if isinstance(loc, dict):
        parts = [loc.get("city"), loc.get("state"), loc.get("country")]
        return ", ".join(p for p in parts if p) or None
    s = str(loc)
    # Detect stringified dict from Python repr, e.g. "{'city': None, ...}"
    if s.startswith("{") and ":" in s:
        try:
            import ast
            parsed = ast.literal_eval(s)
            if isinstance(parsed, dict):
                parts = [parsed.get("city"), parsed.get("state"), parsed.get("country")]
                return ", ".join(str(p) for p in parts if p) or None
        except (ValueError, SyntaxError):
            pass
    return s if s else None


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
        "location": _normalise_location(c.get("location")),
        "email": c.get("email"),
        "is_saved": c.get("is_saved", False),
        "image_url": _extract_image_url(c),
        "brand_fit_score": c.get("brand_fit_score"),
    }


# ── Search ────────────────────────────────────────────────


@router.post("/search")
@search_limit
def search_creators(request: Request, body: SearchCreatorsRequest, brand: dict = Depends(get_current_brand)):
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
    platforms = body.platforms
    follower_min = body.follower_min
    follower_max = body.follower_max
    categories = body.categories or []
    locations = body.locations or []
    limit = body.limit

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


# ── Brand Fit Enrichment ──────────────────────────────────


@router.post("/brand-fit")
@search_limit
def enrich_brand_fit(request: Request, body: BrandFitRequest, brand: dict = Depends(get_current_brand)):
    """Run brand fit analysis on a batch of creators.

    Body: {
        creator_ids: ["uuid1", "uuid2", ...],  // max 10
        brand_name: "Acme Co",                  // optional, defaults to brand.name
        brand_description: "..."                // optional, built from brand info
    }

    Returns: { scores: { "uuid1": 72.5, "uuid2": null, ... } }

    Scores are persisted to the creators table for future lookups.
    Analysis is slow (~5-15s per creator) so we cap at 10 and run
    in parallel threads.
    """
    creator_ids = list(body.creator_ids)

    brand_name = body.brand_name or brand.get("name") or "Brand"
    brand_description = body.brand_description or " ".join(
        filter(None, [brand.get("name"), brand.get("industry")])
    )

    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")

    # Look up external_ids for the requested creators
    rows = (
        sb.table("creators")
        .select("id, external_id, platform, brand_fit_score")
        .in_("id", creator_ids)
        .execute()
    )
    if not rows.data:
        return {"scores": {}}

    from services.phyllo_client import PhylloClient

    client = PhylloClient()
    if not client.is_configured:
        return {"scores": {cid: None for cid in creator_ids}, "configured": False}

    if "sandbox" in client.base_url:
        return {"scores": {cid: None for cid in creator_ids}, "configured": True}

    # Build lookup: uuid → row
    id_to_row = {r["id"]: r for r in rows.data}

    # Skip creators that already have a score (cache hit)
    to_analyze = []
    scores: dict[str, float | None] = {}
    for cid in creator_ids:
        row = id_to_row.get(cid)
        if not row:
            scores[cid] = None
            continue
        if row.get("brand_fit_score") is not None:
            scores[cid] = float(row["brand_fit_score"])
            continue
        if not row.get("external_id"):
            scores[cid] = None
            continue
        to_analyze.append(row)

    def _analyze_one(row: dict) -> tuple[str, float | None]:
        """Run brand fit for a single creator. Thread-safe."""
        ext_id = row["external_id"]
        platform = (row.get("platform") or "").lower()
        wp_id = client.PLATFORM_IDS.get(platform)
        try:
            result = client.analyze_brand_fit(
                creator_id=ext_id,
                brand_name=brand_name,
                brand_description=brand_description,
                work_platform_id=wp_id,
                max_wait=45,
            )
            if result:
                score = (
                    result.get("brand_fit_score")
                    or result.get("score")
                    or result.get("overall_score")
                    or result.get("compatibility_score")
                )
                if score is not None:
                    score = float(score)
                    # Persist to DB
                    try:
                        sb.table("creators").update({
                            "brand_fit_score": score,
                            "brand_fit_data": result,
                        }).eq("id", row["id"]).execute()
                    except Exception as e:
                        logger.warning("Failed to persist brand fit for %s: %s", row["id"], e)
                    return row["id"], score
        except Exception as e:
            logger.warning("Brand fit failed for %s: %s", row["id"], e)
        return row["id"], None

    # Run in parallel (3 workers to respect rate limits)
    if to_analyze:
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(_analyze_one, r): r["id"] for r in to_analyze}
            for future in as_completed(futures):
                cid, score = future.result()
                scores[cid] = score

    return {"scores": scores, "configured": True}


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


@router.get("/{creator_id}/content")
def creator_content(
    creator_id: str,
    brand: dict = Depends(get_current_brand),  # noqa: ARG001 – auth guard
    limit: int = 20,
):
    """Fetch recent content/posts for a creator via InsightIQ.

    Returns a list of post objects with engagement metrics (likes, comments,
    shares, url, etc.).  The creator must exist in the local DB so we can
    resolve its ``external_id`` for the upstream API call.
    """
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database not configured")

    # Look up the creator row to get external_id + platform
    row = (
        sb.table("creators")
        .select("external_id, platform")
        .eq("id", creator_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Creator not found")

    creator = row.data[0]
    external_id = creator.get("external_id")
    platform = (creator.get("platform") or "").lower()

    if not external_id:
        return {"posts": [], "total": 0, "configured": True}

    from services.phyllo_client import PhylloClient

    client = PhylloClient()
    if not client.is_configured:
        return {"posts": [], "total": 0, "configured": False}

    capped_limit = min(int(limit), 50)
    posts = client.get_creator_content(external_id, platform, limit=capped_limit)

    # Normalise each post to a consistent shape
    normalised = []
    for p in posts:
        normalised.append({
            "id": p.get("id") or p.get("content_id") or p.get("external_id") or "",
            "url": p.get("url") or p.get("link") or p.get("permalink") or "",
            "title": p.get("title") or p.get("caption") or p.get("description") or "",
            "thumbnail": p.get("thumbnail_url") or p.get("image_url") or p.get("thumbnail") or "",
            "type": p.get("type") or p.get("content_type") or "post",
            "published_at": p.get("published_at") or p.get("created_at") or p.get("timestamp") or "",
            "likes": p.get("likes") or p.get("like_count") or 0,
            "comments": p.get("comments") or p.get("comment_count") or 0,
            "shares": p.get("shares") or p.get("share_count") or 0,
            "views": p.get("views") or p.get("view_count") or 0,
        })

    return {"posts": normalised, "total": len(normalised), "configured": True}


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
