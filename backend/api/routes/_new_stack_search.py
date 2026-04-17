"""Bridge between /api/creators/search and the new creator_data stack.

Previously this endpoint called the Phyllo (InsightIQ) client directly. The
new stack (Apify + EnsembleData + ScrapeCreators via DiscoveryOrchestrator)
produces the same ``CreatorProfile`` shape we already canonicalised, but we
need a thin translation layer so the existing frontend + DB code don't
change.

This module exposes:

  * ``new_stack_configured()`` — True if any of the new provider env vars
    are set. Used by the route to decide whether to use new stack or fall
    back to the legacy Phyllo path.
  * ``run_search(...)`` — async entry that runs the pipeline end-to-end and
    returns a list of dicts matching the shape ``upsert_creators`` expects.

We deliberately skip Layers 3+4 (audience vet + values scoring) in the
search endpoint because:

  - They take 10-60 seconds and the browser will time out.
  - They're more valuable at *campaign-shortlist* time, not discovery.
  - The UI today doesn't display those signals anyway.

Layer 1 (discover) + Layer 2 (filter_by_basics) give us: real handles,
followers, engagement rate, bio, avatar — which is exactly the search-
results shape the dashboard renders.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from backend.integrations.creator_data.base import (
    CreatorProfile,
    DiscoveryQuery,
    Platform,
)
from backend.integrations.creator_data.orchestrator import DiscoveryOrchestrator

logger = logging.getLogger(__name__)

# Cap for how much raw discovery volume we pull per search request. The
# orchestrator already has layer caps — this is just a hard ceiling on the
# DiscoveryQuery.limit we pass in, so the first layer doesn't fan out to
# 5,000 handles for a user who only wants 20 in the UI.
_DISCOVER_LIMIT_MULTIPLIER = 3  # 20 result UI → 60 candidates to filter down
_DISCOVER_LIMIT_MAX = 150


# ISO-3166-1 alpha-2 map. Frontend sends colloquial names (UK, USA); new
# stack uses alpha-2 codes for audience/geo. Unknown values pass through
# as-is so someone passing "GB" explicitly still works.
_GEO_ALIASES = {
    "uk": "GB",
    "united kingdom": "GB",
    "england": "GB",
    "great britain": "GB",
    "usa": "US",
    "united states": "US",
    "america": "US",
}


# Module-level singleton. DiscoveryOrchestrator caches httpx clients
# internally; sharing one across requests preserves keep-alive connections.
_orch_singleton: Optional[DiscoveryOrchestrator] = None


def _new_stack_env_keys() -> list[str]:
    """Which of the three new-stack providers have env vars set.

    Exposed for the /health payload so operators can see at a glance which
    provider Railway actually has creds for.
    """
    configured = []
    if (os.getenv("APIFY_TOKEN") or "").strip():
        configured.append("apify")
    if (os.getenv("ENSEMBLEDATA_API_TOKEN") or "").strip():
        configured.append("ensembledata")
    if (os.getenv("SCRAPECREATORS_API_KEY") or "").strip():
        configured.append("scrapecreators")
    return configured


def new_stack_configured() -> bool:
    """True if *any* new-stack provider has credentials configured.

    The orchestrator can run with just one — e.g. SC alone gives you
    enrichment but no discovery; ED alone gives TikTok discovery; Apify
    alone gives IG/YT discovery. Having any one is better than Phyllo-only.
    """
    return len(_new_stack_env_keys()) > 0


def get_orchestrator() -> DiscoveryOrchestrator:
    global _orch_singleton
    if _orch_singleton is None:
        _orch_singleton = DiscoveryOrchestrator()
    return _orch_singleton


def reset_orchestrator() -> None:
    """Test hook — forget the cached orchestrator so the next call rebuilds."""
    global _orch_singleton
    _orch_singleton = None


def _normalise_platform(p: str) -> Optional[Platform]:
    """Map loose frontend platform names to the Platform literal.

    Anything outside IG/TikTok/YT is dropped — the new stack doesn't cover
    those surfaces yet. The caller decides whether an empty platform list
    means "fall back to Phyllo".
    """
    key = (p or "").strip().lower()
    if key in ("instagram", "ig"):
        return "instagram"
    if key in ("tiktok", "tt"):
        return "tiktok"
    if key in ("youtube", "yt"):
        return "youtube"
    return None


def _normalise_geo(locations: Optional[list[str]]) -> Optional[str]:
    """Turn the frontend's first ``location`` entry into an ISO-2 code.

    The new-stack DiscoveryQuery takes a single ``geo``; we'd need a multi-
    country filter at the orchestrator level to support a list. First one
    wins for now — good enough for Hudey's UK-first cohort.
    """
    if not locations:
        return None
    raw = (locations[0] or "").strip()
    if not raw:
        return None
    return _GEO_ALIASES.get(raw.lower(), raw.upper() if len(raw) == 2 else raw)


def _profile_to_creator_dict(profile: CreatorProfile) -> dict:
    """Translate a new-stack ``CreatorProfile`` into the dict shape that
    ``upsert_creators`` / the DB / the frontend already consume.

    Matches the Phyllo mapping so the response looks identical to the UI
    regardless of which provider answered. Extra new-stack signals
    (authenticity, values, bio) go into ``profile_data`` so they're
    preserved for later display without requiring a DB migration.
    """
    sources = {
        name: ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        for name, ts in (profile.sources or {}).items()
    }
    return {
        # Use ``{platform}:{handle}`` so Instagram @foo and TikTok @foo
        # don't collide on the upsert's ``external_id`` conflict key.
        "external_id": f"{profile.platform}:{profile.handle}",
        "username": profile.handle,
        "platform": profile.platform,
        "display_name": profile.display_name or profile.handle,
        "follower_count": profile.follower_count or 0,
        "engagement_rate": profile.avg_engagement_rate,
        "categories": [],  # new stack doesn't classify — leave empty
        "location": None,  # no geo metadata from discovery/filter layers
        "email": None,
        "profile_data": {
            "image_url": profile.avatar_url,
            "profile_url": profile.profile_url,
            "bio": profile.bio,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
            "following_count": profile.following_count,
            "post_count": profile.post_count,
            "authenticity_score": profile.authenticity_score,
            "values_score": profile.values_score,
            "values_evidence": list(profile.values_evidence or []),
            "sources": sources,
        },
    }


async def run_search(
    *,
    platforms: list[str],
    follower_min: int,
    follower_max: int,
    categories: Optional[list[str]],
    locations: Optional[list[str]],
    limit: int,
) -> tuple[list[dict], dict]:
    """Run the new stack for a UI search request.

    Returns ``(creator_dicts, diagnostics)`` where diagnostics describes the
    funnel counts and any unhealthy providers so the endpoint can surface
    them for debugging.

    Falls through gracefully: if the pipeline yields zero results, the
    endpoint can still fall back to Phyllo. We don't raise on empty.
    """
    mapped_platforms = [p for p in (_normalise_platform(x) for x in platforms) if p]
    if not mapped_platforms:
        return [], {"reason": "no supported platforms in request", "configured": False}

    # Categories drive discovery — Apify+ED both need hashtags. Keywords also
    # land in the YouTube search actor input. If the UI didn't pass any, we
    # can't discover: signal the caller to fall back.
    tags = [c for c in (categories or []) if c and c.strip()]
    if not tags:
        return [], {
            "reason": "no categories/hashtags provided — new stack requires at least one",
            "configured": True,
        }

    query = DiscoveryQuery(
        hashtags=tags,
        keywords=tags,  # same terms feed YT keyword search
        platforms=mapped_platforms,
        min_followers=follower_min,
        max_followers=follower_max,
        geo=_normalise_geo(locations),
        limit=min(max(limit * _DISCOVER_LIMIT_MULTIPLIER, 30), _DISCOVER_LIMIT_MAX),
    )

    orch = get_orchestrator()

    try:
        # Layer 1: discover across configured providers.
        discovered = await orch.discover(query)
        # Layer 2: enrich + filter by follower band / ER / privacy.
        filtered = await orch.filter_by_basics(discovered, query)
    except Exception as e:
        # Unexpected — don't lose the failure. The caller will fall back to
        # Phyllo, but we want to know something broke.
        logger.exception("new_stack run_search failed: %s", e)
        return [], {"reason": f"pipeline error: {e}", "configured": True}

    # Rank by engagement rate and truncate to what the UI asked for.
    filtered.sort(key=lambda p: (p.avg_engagement_rate or 0), reverse=True)
    top = filtered[:limit]

    diagnostics = {
        "configured": True,
        "providers_enabled": _new_stack_env_keys(),
        "discovered": len(discovered),
        "after_filter": len(filtered),
        "returned": len(top),
        "breakers": {name: b.status() for name, b in orch._breakers.items()},
    }
    return [_profile_to_creator_dict(p) for p in top], diagnostics
