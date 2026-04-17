"""Apify — discovery (IG/YT) + post-level content scraping (Layers 1 & 4).

Role in the stack:
    1. Layer 1 — Instagram + YouTube hashtag / keyword / lookalike discovery
       via Apify actors. Apify hosts thousands of community-maintained
       actors — we pick one per platform and treat them as configurable.
    2. Layer 4 — Pull recent posts (captions, likes, dates) for creators
       that survived Layers 2 & 3. The post text is what feeds the Claude
       values-scorer (Hudey's proprietary signal).

Pricing note:
    Pay-per-compute-unit. A single discovery run (~1k handles) usually
    costs $0.05–$0.30 depending on the actor. Post scrapes are cheaper
    per-profile at ~$0.05.

Docs:
    https://docs.apify.com/api/v2

Env vars:
    APIFY_TOKEN                    — required
    APIFY_IG_HASHTAG_ACTOR_ID      — override default IG hashtag actor
    APIFY_YT_SEARCH_ACTOR_ID       — override default YouTube search actor
    APIFY_IG_POSTS_ACTOR_ID        — override default IG posts actor
    APIFY_TIMEOUT_SECS             — run timeout (default 120)

Why we pass actor IDs through env vars:
    Apify's community actors occasionally break, deprecate, or get renamed.
    Surfacing the IDs as config means we can swap without a deploy — just
    rotate the env var to a working alternative.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, AsyncIterator, Optional

import httpx

from ..base import (
    CreatorProfile,
    DiscoveryQuery,
    Platform,
    ProviderError,
)

logger = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "https://api.apify.com/v2"
_DEFAULT_TIMEOUT = 30.0  # HTTP read timeout — actor run polling is long-lived

# Sensible defaults for well-known community actors as of 2026-04. Override
# via env if any of these change identity or get deprecated.
_DEFAULT_IG_HASHTAG_ACTOR = "apify~instagram-hashtag-scraper"
_DEFAULT_IG_SEARCH_ACTOR = "apify~instagram-scraper"  # flagship, returns full profiles
_DEFAULT_YT_SEARCH_ACTOR = "streamers~youtube-scraper"
_DEFAULT_IG_POSTS_ACTOR = "apify~instagram-post-scraper"

# Discovery mode for Instagram:
#   - "user_search" (default, new): use apify/instagram-scraper with
#     searchType=user. Returns full profiles (followers, bio, verified)
#     in one call — so the dashboard shows rich data even without Layer 2.
#     Costs ~$0.25 per 1000 results; paid actor but still cheap.
#   - "hashtag_posts" (legacy): use apify/instagram-hashtag-scraper.
#     Returns only post-owner handles; Layer 2 must enrich. Free but
#     produces the "handles with no profile info" UX problem.
_IG_MODE_USER_SEARCH = "user_search"
_IG_MODE_HASHTAG_POSTS = "hashtag_posts"


class ApifyProvider:
    """Discovery + deep content via Apify actors."""

    name = "apify"

    def __init__(
        self,
        token: Optional[str] = None,
        base_url: Optional[str] = None,
        ig_hashtag_actor: Optional[str] = None,
        ig_search_actor: Optional[str] = None,
        yt_search_actor: Optional[str] = None,
        ig_posts_actor: Optional[str] = None,
        ig_discovery_mode: Optional[str] = None,
        run_timeout_secs: Optional[int] = None,
        http_timeout: float = _DEFAULT_TIMEOUT,
    ) -> None:
        self.token = (token or os.getenv("APIFY_TOKEN") or "").strip() or None
        self.base_url = (base_url or os.getenv("APIFY_BASE_URL") or _DEFAULT_BASE_URL).rstrip("/")
        self.ig_hashtag_actor = ig_hashtag_actor or os.getenv("APIFY_IG_HASHTAG_ACTOR_ID") or _DEFAULT_IG_HASHTAG_ACTOR
        self.ig_search_actor = ig_search_actor or os.getenv("APIFY_IG_SEARCH_ACTOR_ID") or _DEFAULT_IG_SEARCH_ACTOR
        self.yt_search_actor = yt_search_actor or os.getenv("APIFY_YT_SEARCH_ACTOR_ID") or _DEFAULT_YT_SEARCH_ACTOR
        self.ig_posts_actor = ig_posts_actor or os.getenv("APIFY_IG_POSTS_ACTOR_ID") or _DEFAULT_IG_POSTS_ACTOR
        self.ig_discovery_mode = (
            ig_discovery_mode
            or os.getenv("APIFY_IG_DISCOVERY_MODE")
            or _IG_MODE_USER_SEARCH
        ).strip().lower()
        self.run_timeout_secs = int(run_timeout_secs or os.getenv("APIFY_TIMEOUT_SECS") or 120)
        self.http_timeout = http_timeout
        self._client: Optional[httpx.AsyncClient] = None
        # Lock is built lazily inside ``_http`` — see note on Python 3.9.
        self._lock: Optional[asyncio.Lock] = None

    @property
    def is_configured(self) -> bool:
        return self.token is not None

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            if self._lock is None:
                self._lock = asyncio.Lock()
            async with self._lock:
                if self._client is None:
                    self._client = httpx.AsyncClient(
                        base_url=self.base_url,
                        timeout=self.http_timeout,
                    )
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ─── Protocol methods ─────────────────────────────────────

    async def discover(self, query: DiscoveryQuery) -> AsyncIterator[CreatorProfile]:
        """Layer 1 — run IG + YouTube discovery actors in parallel.

        We fan IG and YT out concurrently inside this method so the caller
        gets a single async iterator it can drain as items come in.
        """
        if not self.is_configured:
            raise ProviderError(self.name, "API token not configured", retryable=False)

        tasks: list[asyncio.Task] = []
        if "instagram" in query.platforms and (query.hashtags or query.keywords):
            if self.ig_discovery_mode == _IG_MODE_HASHTAG_POSTS:
                tasks.append(asyncio.create_task(self._ig_hashtag_run(query)))
            else:
                # Default: user-search mode — returns full profiles in one call.
                tasks.append(asyncio.create_task(self._ig_user_search_run(query)))
        if "youtube" in query.platforms and (query.keywords or query.hashtags):
            tasks.append(asyncio.create_task(self._yt_search_run(query)))

        if not tasks:
            return

        seen: set[tuple[str, Platform]] = set()
        emitted = 0
        for coro in asyncio.as_completed(tasks):
            try:
                items = await coro
            except ProviderError:
                raise
            except Exception as e:
                logger.warning("Apify discovery sub-task failed: %s", e)
                continue
            for profile in items:
                key = (profile.handle, profile.platform)
                if key in seen:
                    continue
                seen.add(key)
                emitted += 1
                yield profile
                if emitted >= query.limit:
                    return

    async def enrich_profile(self, handle: str, platform: Platform) -> CreatorProfile:
        """Apify can do it, but it's slow + pricey. Route to ScrapeCreators."""
        raise NotImplementedError("use ScrapeCreatorsProvider for profile enrichment")

    async def enrich_audience(self, handle: str, platform: Platform) -> CreatorProfile:
        raise NotImplementedError("use EnsembleDataProvider for audience data")

    async def fetch_recent_posts(
        self, handle: str, platform: Platform, limit: int = 30,
    ) -> list[dict]:
        """Layer 4 — pull recent posts for content analysis."""
        if not self.is_configured:
            raise ProviderError(self.name, "API token not configured", retryable=False)

        if platform != "instagram":
            # We only wire IG today. Extend later if TikTok/YT content becomes
            # part of the scoring pipeline.
            raise NotImplementedError(f"post scraping not wired for {platform}")

        actor_input = {
            "username": [handle.lstrip("@")],
            "resultsLimit": limit,
        }
        dataset = await self._run_actor(self.ig_posts_actor, actor_input)
        # Each item is a post dict — pass through as-is; values_scorer expects
        # raw-ish dicts so it can look at captions/hashtags/comments.
        return list(dataset)

    # ─── Internals: actor orchestration ───────────────────────

    async def _ig_hashtag_run(self, query: DiscoveryQuery) -> list[CreatorProfile]:
        actor_input = {
            "hashtags": [h.lstrip("#") for h in query.hashtags],
            "resultsType": "posts",
            "resultsLimit": min(query.limit, 1000),
        }
        raw = await self._run_actor(self.ig_hashtag_actor, actor_input)
        return _parse_ig_hashtag_items(raw)

    async def _ig_user_search_run(self, query: DiscoveryQuery) -> list[CreatorProfile]:
        """Search IG's user index for each query term via apify/instagram-scraper.

        Unlike hashtag-post scraping, this returns real creator profiles
        (not random posters) along with full profile metadata — so Layer 2
        enrichment becomes optional.
        """
        # IG's search bar takes one term at a time; fan out per term.
        terms = [t.lstrip("#") for t in (query.keywords or query.hashtags) if t and t.strip()]
        if not terms:
            return []

        # Divide the result budget across terms so we don't blow past the limit.
        per_term = max(min(query.limit, 100) // max(len(terms), 1), 5)

        async def run_one(term: str) -> list[dict]:
            actor_input = {
                "search": term,
                "searchType": "user",
                "searchLimit": per_term,
                "resultsType": "details",
                "resultsLimit": per_term,
            }
            return await self._run_actor(self.ig_search_actor, actor_input)

        # ``return_exceptions=True`` so one bad search term doesn't kill the
        # whole fan-out. But if EVERY term failed, propagate the first error
        # so the orchestrator can trip the circuit breaker.
        results = await asyncio.gather(
            *[run_one(t) for t in terms], return_exceptions=True,
        )
        merged: list[dict] = []
        errors: list[BaseException] = []
        for term, r in zip(terms, results):
            if isinstance(r, Exception):
                errors.append(r)
                logger.warning("Apify user-search for %r failed: %s", term, r)
                continue
            merged.extend(r)
        if not merged and errors:
            # Re-raise the first error so the orchestrator records a failure.
            first = errors[0]
            if isinstance(first, ProviderError):
                raise first
            raise ProviderError(self.name, f"user-search failed: {first}") from first
        return _parse_ig_user_search_items(merged)

    async def _yt_search_run(self, query: DiscoveryQuery) -> list[CreatorProfile]:
        search_terms = query.keywords or [f"#{h}" for h in query.hashtags]
        actor_input = {
            "searchQueries": search_terms,
            "maxResults": min(query.limit, 500),
            "searchType": "video",
        }
        raw = await self._run_actor(self.yt_search_actor, actor_input)
        return _parse_yt_search_items(raw)

    async def _run_actor(self, actor_id: str, actor_input: dict) -> list[dict]:
        """Run an actor synchronously and return its dataset items.

        Apify offers a `/run-sync-get-dataset-items` endpoint that blocks
        until the run finishes and returns the dataset in one response.
        For our volumes this is simpler than polling — and the 120s timeout
        acts as a natural circuit breaker.
        """
        client = await self._http()
        path = f"/acts/{actor_id}/run-sync-get-dataset-items"
        try:
            resp = await client.post(
                path,
                params={"token": self.token, "timeout": str(self.run_timeout_secs)},
                json=actor_input,
                timeout=self.run_timeout_secs + 10,
            )
        except httpx.HTTPError as e:
            raise ProviderError(self.name, f"network error running {actor_id}: {e}") from e

        if resp.status_code == 429:
            raise ProviderError(self.name, "rate limited (429)")
        if resp.status_code >= 400:
            raise ProviderError(
                self.name,
                f"actor {actor_id} HTTP {resp.status_code}: {resp.text[:200]}",
                retryable=resp.status_code >= 500,
            )

        try:
            data = resp.json()
        except ValueError as e:
            raise ProviderError(self.name, f"invalid JSON from {actor_id}: {e}") from e

        if isinstance(data, list):
            return data
        # Some actors wrap results
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return data["items"]
        return []


# ─── Parsers ─────────────────────────────────────────────────


def _parse_ig_user_search_items(items: list[dict]) -> list[CreatorProfile]:
    """Extract full profile data from apify/instagram-scraper user-search output.

    The flagship scraper emits rich per-user objects — we map every field we
    care about into the CreatorProfile so the dashboard shows real stats
    without needing Layer 2 enrichment.

    Falls back gracefully: any missing field stays None. Also deduplicates
    by handle (IG returns the same user across multiple search terms).
    """
    now = datetime.now(timezone.utc)
    seen: set[str] = set()
    out: list[CreatorProfile] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        handle = (
            item.get("username")
            or item.get("ownerUsername")
            or _nested(item, "owner", "username")
        )
        if not handle or handle in seen:
            continue
        seen.add(handle)

        # Field names follow apify/instagram-scraper's "details" output.
        # Coalesce across naming variants since actors occasionally rename.
        followers = (
            item.get("followersCount")
            or item.get("follower_count")
            or _nested(item, "edge_followed_by", "count")
        )
        following = (
            item.get("followsCount")
            or item.get("following_count")
            or _nested(item, "edge_follow", "count")
        )
        posts = (
            item.get("postsCount")
            or item.get("media_count")
            or _nested(item, "edge_owner_to_timeline_media", "count")
        )

        out.append(CreatorProfile(
            handle=str(handle),
            platform="instagram",
            display_name=item.get("fullName") or item.get("full_name") or item.get("ownerFullName"),
            bio=item.get("biography") or item.get("bio"),
            follower_count=int(followers) if isinstance(followers, (int, float)) else None,
            following_count=int(following) if isinstance(following, (int, float)) else None,
            post_count=int(posts) if isinstance(posts, (int, float)) else None,
            avatar_url=item.get("profilePicUrl") or item.get("profile_pic_url"),
            profile_url=item.get("url") or f"https://instagram.com/{handle}",
            is_private=item.get("private") if item.get("private") is not None else item.get("is_private"),
            is_verified=item.get("verified") if item.get("verified") is not None else item.get("is_verified"),
            sources={"apify": now},
        ))
    return out


def _parse_ig_hashtag_items(items: list[dict]) -> list[CreatorProfile]:
    """Extract unique creator handles from IG hashtag actor output."""
    now = datetime.now(timezone.utc)
    seen: set[str] = set()
    out: list[CreatorProfile] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        owner = item.get("ownerUsername") or item.get("username") or _nested(item, "owner", "username")
        if not owner or owner in seen:
            continue
        seen.add(owner)
        out.append(CreatorProfile(
            handle=str(owner),
            platform="instagram",
            display_name=item.get("ownerFullName") or _nested(item, "owner", "full_name"),
            sources={"apify": now},
        ))
    return out


def _parse_yt_search_items(items: list[dict]) -> list[CreatorProfile]:
    """Extract unique channels from YouTube search actor output."""
    now = datetime.now(timezone.utc)
    seen: set[str] = set()
    out: list[CreatorProfile] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        channel = (
            item.get("channelName")
            or item.get("channel")
            or _nested(item, "author", "name")
        )
        if not channel or channel in seen:
            continue
        seen.add(channel)
        out.append(CreatorProfile(
            handle=str(channel),
            platform="youtube",
            display_name=channel if isinstance(channel, str) else None,
            sources={"apify": now},
        ))
    return out


def _nested(d: dict, *path: str) -> Any:
    """Safe nested lookup: `_nested(d, 'owner', 'username')`."""
    cur: Any = d
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur
