"""EnsembleData — discovery + audience demographics (Layers 1 & 3).

Role in the stack:
    1. Layer 1 — TikTok hashtag / keyword search (their strongest surface).
    2. Layer 3 — Audience quality data (countries, age bands, authenticity)
       on Layer-2 survivors.

We deliberately do NOT use ED for basic profile enrichment — per-call cost
is higher than ScrapeCreators and SC already covers that layer cheaply.

Pricing note:
    Credit-based. TikTok hashtag search ~10 credits / 20 creators. Profile
    audience ~30 credits. Starter plans around $30/mo; scales linearly.

Docs:
    https://ensembledata.com/apis

Env vars:
    ENSEMBLEDATA_API_TOKEN   — required
    ENSEMBLEDATA_BASE_URL    — optional override
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

_DEFAULT_BASE_URL = "https://ensembledata.com/apis"
_DEFAULT_TIMEOUT = 25.0  # audience calls can be slow; give them room


class EnsembleDataProvider:
    """Discovery (TikTok) + audience demographics (all supported platforms)."""

    name = "ensembledata"

    def __init__(
        self,
        token: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = _DEFAULT_TIMEOUT,
    ) -> None:
        self.token = (token or os.getenv("ENSEMBLEDATA_API_TOKEN") or "").strip() or None
        self.base_url = (base_url or os.getenv("ENSEMBLEDATA_BASE_URL") or _DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
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
                        timeout=self.timeout,
                    )
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ─── Protocol methods ─────────────────────────────────────

    async def discover(self, query: DiscoveryQuery) -> AsyncIterator[CreatorProfile]:
        """Layer 1 — hashtag search on TikTok (ED's strongest surface).

        We iterate each hashtag sequentially inside this method (the caller
        already runs multiple providers in parallel, so there's no value in
        fanning out further here — and it keeps us from bursting ED's rate
        limits).
        """
        if not self.is_configured:
            raise ProviderError(self.name, "API token not configured", retryable=False)

        if "tiktok" not in query.platforms or not query.hashtags:
            return  # nothing to do; stay silent so orchestrator can move on

        seen: set[str] = set()
        emitted = 0
        client = await self._http()

        for tag in query.hashtags:
            if emitted >= query.limit:
                break
            try:
                resp = await client.get(
                    "/tt/hashtag/posts",
                    params={"name": tag.lstrip("#"), "token": self.token},
                )
            except httpx.HTTPError as e:
                logger.warning("ED hashtag fetch failed for #%s: %s", tag, e)
                continue

            if resp.status_code == 429:
                raise ProviderError(self.name, "rate limited (429)")
            if resp.status_code >= 400:
                logger.warning(
                    "ED hashtag #%s returned HTTP %d: %s",
                    tag, resp.status_code, resp.text[:200],
                )
                continue

            try:
                payload = resp.json()
            except ValueError:
                continue

            for post in _iter_hashtag_posts(payload):
                handle = _extract_handle(post)
                if not handle or handle in seen:
                    continue
                seen.add(handle)
                emitted += 1
                yield CreatorProfile(
                    handle=handle,
                    platform="tiktok",
                    display_name=post.get("author", {}).get("nickname") if isinstance(post.get("author"), dict) else None,
                    sources={"ensembledata": datetime.now(timezone.utc)},
                )
                if emitted >= query.limit:
                    return

    async def enrich_profile(self, handle: str, platform: Platform) -> CreatorProfile:
        """Not our best surface — ScrapeCreators is cheaper. Raise to route around."""
        raise NotImplementedError("use ScrapeCreatorsProvider for cheap profile enrichment")

    async def enrich_audience(self, handle: str, platform: Platform) -> CreatorProfile:
        """Layer 3 — audience countries, age bands, authenticity score."""
        if not self.is_configured:
            raise ProviderError(self.name, "API token not configured", retryable=False)

        endpoint = _audience_endpoint(platform)
        if endpoint is None:
            raise ProviderError(
                self.name, f"audience data not supported for '{platform}'",
                retryable=False,
            )

        try:
            client = await self._http()
            resp = await client.get(
                endpoint,
                params={"username": handle.lstrip("@"), "token": self.token},
            )
        except httpx.HTTPError as e:
            raise ProviderError(self.name, f"network error: {e}") from e

        if resp.status_code == 404:
            raise ProviderError(self.name, f"no audience data for {handle}", retryable=False)
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

        return _map_audience(data, handle=handle, platform=platform)

    async def fetch_recent_posts(
        self, handle: str, platform: Platform, limit: int = 30,
    ) -> list[dict]:
        raise NotImplementedError("use ApifyProvider for post-level content")


# ─── Helpers ────────────────────────────────────────────────


def _audience_endpoint(platform: Platform) -> Optional[str]:
    """Map platform → ED audience-demographics endpoint."""
    return {
        "tiktok": "/tt/user/info",
        "instagram": "/instagram/user/audience",
        "youtube": "/youtube/channel/audience",
    }.get(platform)


def _iter_hashtag_posts(payload):
    """Yield individual post dicts from ED's hashtag response shape."""
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, dict):
        posts = data.get("aweme_list") or data.get("posts") or data.get("items") or []
    elif isinstance(data, list):
        posts = data
    else:
        posts = []
    for p in posts:
        if isinstance(p, dict):
            yield p


def _extract_handle(post: dict) -> Optional[str]:
    author = post.get("author")
    if isinstance(author, dict):
        return (
            author.get("unique_id")
            or author.get("username")
            or author.get("sec_uid")
        )
    return None


def _map_audience(raw: dict, *, handle: str, platform: Platform) -> CreatorProfile:
    """Normalise ED audience payload into canonical profile shape."""
    data = raw.get("data") if isinstance(raw.get("data"), dict) else raw
    audience = data.get("audience") if isinstance(data.get("audience"), dict) else {}

    countries = _as_percent_map(audience.get("countries") or audience.get("geo"))
    ages = _as_percent_map(audience.get("age_bands") or audience.get("ages"))
    genders = _as_percent_map(audience.get("gender") or audience.get("genders"))
    auth = audience.get("authenticity_score") or data.get("authenticity_score")

    return CreatorProfile(
        handle=handle,
        platform=platform,
        audience_countries=countries,
        audience_age_bands=ages,
        audience_gender=genders,
        authenticity_score=float(auth) if auth is not None else None,
        sources={"ensembledata": datetime.now(timezone.utc)},
    )


def _as_percent_map(value) -> dict[str, float]:
    """Accept list-of-{key,pct} or dict-{key:pct}. Normalise to dict[str, float]."""
    if not value:
        return {}
    if isinstance(value, dict):
        return {str(k): float(v) for k, v in value.items() if _is_number(v)}
    if isinstance(value, list):
        out: dict[str, float] = {}
        for item in value:
            if not isinstance(item, dict):
                continue
            key = item.get("code") or item.get("name") or item.get("key")
            pct = item.get("percent") or item.get("percentage") or item.get("value")
            if key and _is_number(pct):
                out[str(key)] = float(pct)
        return out
    return {}


def _is_number(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)
