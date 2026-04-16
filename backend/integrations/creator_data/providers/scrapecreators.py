"""ScrapeCreators — cheap bulk enrichment (Layer 2).

Role in the stack:
    Given a list of (handle, platform) pairs from Layer 1 discovery, pull
    basic profile fields (followers, engagement rate, bio, verified flag) at
    a very low per-call cost. Used to cut a 5,000-handle list down to a few
    hundred before spending premium credits on EnsembleData / Apify.

Pricing note:
    Pay-as-you-go, ~$10 per 5,000 credits as of 2026-04.
    A single profile lookup is usually 1 credit.

Docs:
    https://scrapecreators.com/

Env vars:
    SCRAPECREATORS_API_KEY   — required to enable (absent = provider disabled)
    SCRAPECREATORS_BASE_URL  — optional override (default: api.scrapecreators.com/v1)
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import AsyncIterator, Optional

import httpx

from ..base import (
    CreatorProfile,
    DiscoveryQuery,
    Platform,
    ProviderError,
)

logger = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "https://api.scrapecreators.com/v1"
_DEFAULT_TIMEOUT = 15.0  # seconds — SC endpoints are fast, don't hang the pipeline


class ScrapeCreatorsProvider:
    """Cheap-and-fast profile enrichment. Not used for discovery."""

    name = "scrapecreators"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = _DEFAULT_TIMEOUT,
    ) -> None:
        self.api_key = (api_key or os.getenv("SCRAPECREATORS_API_KEY") or "").strip() or None
        self.base_url = (base_url or os.getenv("SCRAPECREATORS_BASE_URL") or _DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
        # Lock is built lazily inside ``_http`` — binding it to an event loop
        # in __init__ breaks Python 3.9 (Lock needs a running loop).
        self._lock: Optional[asyncio.Lock] = None

    @property
    def is_configured(self) -> bool:
        return self.api_key is not None

    async def _http(self) -> httpx.AsyncClient:
        """Lazy async client. One shared client per provider keeps keep-alive."""
        if self._client is None:
            if self._lock is None:
                self._lock = asyncio.Lock()
            async with self._lock:
                if self._client is None:
                    self._client = httpx.AsyncClient(
                        base_url=self.base_url,
                        timeout=self.timeout,
                        headers={"x-api-key": self.api_key or ""},
                    )
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ─── Protocol methods ─────────────────────────────────────

    async def discover(self, query: DiscoveryQuery) -> AsyncIterator[CreatorProfile]:
        """Not a discovery provider.

        ScrapeCreators is strictly handle → profile. It's the wrong shape for
        hashtag/keyword search. We raise so the orchestrator routes discovery
        to Apify/EnsembleData instead.
        """
        raise NotImplementedError("ScrapeCreators does not support discovery")
        if False:  # pragma: no cover — keeps this an async generator for type-check
            yield  # type: ignore

    async def enrich_profile(self, handle: str, platform: Platform) -> CreatorProfile:
        """Pull basic profile stats. Layer 2 of the pipeline."""
        if not self.is_configured:
            raise ProviderError(self.name, "API key not configured", retryable=False)

        endpoint = _profile_endpoint(platform)
        if endpoint is None:
            raise ProviderError(
                self.name, f"platform '{platform}' not supported", retryable=False,
            )

        try:
            client = await self._http()
            resp = await client.get(endpoint, params={"handle": handle.lstrip("@")})
        except httpx.HTTPError as e:
            raise ProviderError(self.name, f"network error: {e}") from e

        if resp.status_code == 404:
            raise ProviderError(self.name, f"profile not found: {handle}", retryable=False)
        if resp.status_code == 429:
            raise ProviderError(self.name, "rate limited (429)")
        if resp.status_code >= 400:
            raise ProviderError(
                self.name,
                f"HTTP {resp.status_code}: {resp.text[:200]}",
                retryable=resp.status_code >= 500,
            )

        try:
            data = resp.json()
        except ValueError as e:
            raise ProviderError(self.name, f"invalid JSON: {e}") from e

        return _map_profile(data, handle=handle, platform=platform)

    async def enrich_audience(self, handle: str, platform: Platform) -> CreatorProfile:
        """Not a strong suit — SC doesn't expose audience demographics."""
        raise NotImplementedError("ScrapeCreators lacks audience data; use EnsembleData")

    async def fetch_recent_posts(
        self, handle: str, platform: Platform, limit: int = 30,
    ) -> list[dict]:
        """Some endpoints exist but we prefer Apify for post-level content."""
        raise NotImplementedError("Use ApifyProvider for post-level content")


# ─── Helpers ────────────────────────────────────────────────


def _profile_endpoint(platform: Platform) -> Optional[str]:
    """Map platform → ScrapeCreators profile endpoint.

    These path names match the public ScrapeCreators API as of 2026-04.
    If SC renames or reshapes responses we only need to touch this file.
    """
    return {
        "instagram": "/instagram/profile",
        "tiktok": "/tiktok/profile",
        "youtube": "/youtube/channel",
    }.get(platform)


def _map_profile(raw: dict, *, handle: str, platform: Platform) -> CreatorProfile:
    """Normalise ScrapeCreators response into our canonical shape.

    SC responses are slightly different per platform so we coalesce fields.
    Missing fields stay `None` — downstream code already handles that.
    """
    data = raw.get("data") if isinstance(raw.get("data"), dict) else raw

    followers = (
        data.get("follower_count")
        or data.get("followers")
        or data.get("subscriber_count")
    )
    engagement = data.get("engagement_rate") or data.get("avg_engagement")

    # Careful: `x or y` short-circuits on explicit False, turning a legitimate
    # `is_verified: False` into None. Use _pick_first with explicit None check.
    verified = _pick_first(data, "is_verified", "verified")
    private = _pick_first(data, "is_private", "private")

    return CreatorProfile(
        handle=handle,
        platform=platform,
        display_name=data.get("full_name") or data.get("display_name") or data.get("name"),
        bio=data.get("biography") or data.get("bio") or data.get("description"),
        follower_count=int(followers) if followers is not None else None,
        following_count=int(data["following_count"]) if data.get("following_count") is not None else None,
        post_count=int(data["post_count"]) if data.get("post_count") is not None else None,
        avg_engagement_rate=float(engagement) if engagement is not None else None,
        is_verified=_as_bool(verified),
        is_private=_as_bool(private),
        profile_url=data.get("profile_url") or data.get("url"),
        avatar_url=data.get("profile_pic_url") or data.get("avatar_url"),
        sources={"scrapecreators": datetime.now(timezone.utc)},
    )


def _pick_first(data: dict, *keys: str):
    """Return the first key whose value isn't ``None``. Preserves explicit False."""
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def _as_bool(value) -> Optional[bool]:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in ("true", "yes", "1")
    return None
