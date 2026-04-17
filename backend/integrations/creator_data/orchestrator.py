"""DiscoveryOrchestrator — stitches the 4-layer pipeline together.

Runs the specialist providers concurrently at each layer, merges partial
profiles by `(handle, platform)`, caches per-layer with different TTLs,
and falls through a circuit breaker when a provider is unhealthy.

Layers
------
1. **Discovery** (Apify + EnsembleData in parallel) — wide net, up to
   `query.limit` handles.
2. **Filter** (ScrapeCreators, high concurrency) — cheap enrichment to
   cull dead / too-small / low-ER creators.
3. **Vet** (EnsembleData, low concurrency) — audience demographics +
   authenticity on the Layer-2 survivors.
4. **Intelligence** (Apify + Claude via `values_scorer`) — post-level
   content analysis to produce the `values_score` that is Hudey's moat.

Partial failure is first-class. If any single provider goes down the
pipeline keeps running with whatever data the others produced; the
final `CreatorProfile` simply has `None` for fields no provider filled.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Optional

from backend.cache import TTLCache, cache_key

from .base import CreatorProfile, DiscoveryQuery, Platform, ProviderError
from .circuit import CircuitBreaker
from .providers import ApifyProvider, EnsembleDataProvider, ScrapeCreatorsProvider

logger = logging.getLogger(__name__)


# ─── Configuration ──────────────────────────────────────────

# How many handles to carry forward between layers. Each layer narrows the
# funnel by ~10×; the numbers below match the economics described in the
# architecture doc.
DEFAULT_LAYER_CAPS = {
    "discovery": 5_000,
    "filter": 500,
    "vet": 50,
    "intel": 20,
}

# Per-provider concurrency. Tuned to each vendor's rate limits — burst
# aggressively on the cheap one, throttle hard on the expensive one.
_SC_CONCURRENCY = 20   # ScrapeCreators: fast + cheap → burst
_ED_CONCURRENCY = 5    # EnsembleData: pricier per call → throttle
_APIFY_CONCURRENCY = 3  # Apify: slow compute units → hard throttle

# Cache TTLs by layer (seconds). Different data has different staleness.
_TTL_BASICS = 24 * 60 * 60          # followers / engagement — 24h
_TTL_AUDIENCE = 7 * 24 * 60 * 60    # audience demo — 7 days (shifts slowly)
_TTL_POSTS = 3 * 24 * 60 * 60       # post content — 3 days


# ─── Pipeline stats (for observability) ─────────────────────


@dataclass
class PipelineStats:
    """Funnel counts across layers. Returned alongside results."""

    discovered: int = 0
    after_filter: int = 0
    after_vet: int = 0
    after_intel: int = 0
    providers_unhealthy: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "discovered": self.discovered,
            "after_filter": self.after_filter,
            "after_vet": self.after_vet,
            "after_intel": self.after_intel,
            "providers_unhealthy": list(self.providers_unhealthy),
        }


# ─── Orchestrator ───────────────────────────────────────────


class DiscoveryOrchestrator:
    """Runs the 4-layer creator pipeline across stacked providers."""

    def __init__(
        self,
        apify: Optional[ApifyProvider] = None,
        ensembledata: Optional[EnsembleDataProvider] = None,
        scrapecreators: Optional[ScrapeCreatorsProvider] = None,
        cache: Optional[TTLCache] = None,
        layer_caps: Optional[dict] = None,
    ) -> None:
        self.apify = apify or ApifyProvider()
        self.ed = ensembledata or EnsembleDataProvider()
        self.sc = scrapecreators or ScrapeCreatorsProvider()
        # Shared cache across all layers — we namespace keys per provider+method
        self.cache = cache or TTLCache(default_ttl=_TTL_BASICS, max_size=2000)
        self.caps = {**DEFAULT_LAYER_CAPS, **(layer_caps or {})}

        self._breakers = {
            self.apify.name: CircuitBreaker(name=self.apify.name),
            self.ed.name: CircuitBreaker(name=self.ed.name),
            self.sc.name: CircuitBreaker(name=self.sc.name),
        }

    # ─── Public entrypoint ────────────────────────────────────

    async def run(
        self,
        query: DiscoveryQuery,
        brand_values: Optional[list[str]] = None,
    ) -> tuple[list[CreatorProfile], PipelineStats]:
        """End-to-end pipeline. Returns (results, funnel stats)."""
        stats = PipelineStats()

        discovered = await self.discover(query, stats=stats)
        stats.discovered = len(discovered)
        logger.info("orchestrator L1: %d handles discovered", stats.discovered)

        filtered = await self.filter_by_basics(discovered, query, stats=stats)
        stats.after_filter = len(filtered)
        logger.info("orchestrator L2: %d passed basics", stats.after_filter)

        # Rank by engagement rate before expensive layers
        filtered.sort(key=lambda p: (p.avg_engagement_rate or 0), reverse=True)
        top_for_vet = filtered[: self.caps["filter"]]

        vetted = await self.vet_audience(top_for_vet, query, stats=stats)
        stats.after_vet = len(vetted)
        logger.info("orchestrator L3: %d passed audience vet", stats.after_vet)

        top_for_intel = vetted[: self.caps["vet"]]
        scored = await self.score_values(top_for_intel, brand_values or [], stats=stats)
        scored.sort(key=lambda p: (p.values_score or 0), reverse=True)
        final = scored[: self.caps["intel"]]
        stats.after_intel = len(final)
        logger.info("orchestrator L4: returning top %d by values_score", stats.after_intel)

        return final, stats

    # ─── Layer 1: Discovery (Apify + ED in parallel) ─────────

    async def discover(
        self,
        query: DiscoveryQuery,
        *,
        stats: Optional[PipelineStats] = None,
    ) -> list[CreatorProfile]:
        """Fan out Apify (IG/YT) + EnsembleData (TikTok) discovery concurrently."""
        cache_k = f"disco:{query.cache_key()}"
        cached = self.cache.get(cache_k)
        if cached is not None:
            return list(cached)

        tasks = []
        provider_names = []
        if "instagram" in query.platforms or "youtube" in query.platforms:
            if not self._breakers[self.apify.name].is_open() and self.apify.is_configured:
                tasks.append(self._drain(self.apify, query))
                provider_names.append(self.apify.name)
        if "tiktok" in query.platforms:
            if not self._breakers[self.ed.name].is_open() and self.ed.is_configured:
                tasks.append(self._drain(self.ed, query))
                provider_names.append(self.ed.name)

        if not tasks:
            logger.warning("discover: no configured/healthy providers for query")
            return []

        results = await asyncio.gather(*tasks, return_exceptions=True)

        seen: set[tuple[str, Platform]] = set()
        merged: list[CreatorProfile] = []
        for name, r in zip(provider_names, results):
            if isinstance(r, ProviderError):
                logger.warning("discover[%s]: %s — degrading", name, r)
                self._breakers[name].record_failure()
                if stats is not None and name not in stats.providers_unhealthy:
                    stats.providers_unhealthy.append(name)
                continue
            if isinstance(r, Exception):
                logger.exception("discover[%s]: unexpected error", name)
                self._breakers[name].record_failure()
                continue
            self._breakers[name].record_success()
            for profile in r:
                key = (profile.handle, profile.platform)
                if key in seen:
                    continue
                seen.add(key)
                merged.append(profile)

        merged = merged[: self.caps["discovery"]]
        self.cache.set(cache_k, merged, ttl=_TTL_BASICS)
        return merged

    @staticmethod
    async def _drain(provider, query: DiscoveryQuery) -> list[CreatorProfile]:
        """Collect an async generator into a list."""
        out = [p async for p in provider.discover(query)]
        return out

    # ─── Layer 2: Filter (ScrapeCreators, high concurrency) ───

    async def filter_by_basics(
        self,
        profiles: list[CreatorProfile],
        query: DiscoveryQuery,
        *,
        stats: Optional[PipelineStats] = None,
    ) -> list[CreatorProfile]:
        """Enrich all discovered profiles via ScrapeCreators, then cut."""
        if not profiles:
            return []

        breaker = self._breakers[self.sc.name]
        if breaker.is_open():
            logger.warning("filter: ScrapeCreators breaker open — skipping enrichment")
            if stats is not None and self.sc.name not in stats.providers_unhealthy:
                stats.providers_unhealthy.append(self.sc.name)
            return profiles  # pass-through; downstream layers can still work

        sem = asyncio.Semaphore(_SC_CONCURRENCY)

        async def one(profile: CreatorProfile) -> Optional[CreatorProfile]:
            ck = f"sc:{profile.platform}:{profile.handle}"
            if (cached := self.cache.get(ck)) is not None:
                profile.merge(cached)
                return profile
            async with sem:
                try:
                    enriched = await self.sc.enrich_profile(profile.handle, profile.platform)
                    breaker.record_success()
                except ProviderError as e:
                    breaker.record_failure()
                    logger.debug("sc enrich %s/%s: %s", profile.platform, profile.handle, e)
                    # Keep the profile — just un-enriched. Downstream filter
                    # will drop it for missing followers.
                    return profile
                except Exception:
                    logger.exception("sc enrich unexpected error for %s", profile.handle)
                    return profile
            self.cache.set(ck, enriched, ttl=_TTL_BASICS)
            profile.merge(enriched)
            return profile

        enriched = await asyncio.gather(*[one(p) for p in profiles])

        min_f = query.min_followers
        max_f = query.max_followers or float("inf")
        survivors = []
        for p in enriched:
            if p is None:
                continue
            # Only filter on data we actually have. If ScrapeCreators failed
            # to enrich (rate-limit, unknown handle, small account), we still
            # surface the handle so the user sees *something* in the UI. Empty
            # results because of silent filter-drops is worse than showing
            # low-quality rows that the user can curate.
            if p.is_private is True:  # explicit True; None = unknown, keep
                continue
            if p.follower_count is not None:
                if p.follower_count < min_f or p.follower_count > max_f:
                    continue
            if p.avg_engagement_rate is not None and p.avg_engagement_rate < 0.01:
                continue
            survivors.append(p)
        return survivors

    # ─── Layer 3: Audience vetting (ED, low concurrency) ──────

    async def vet_audience(
        self,
        profiles: list[CreatorProfile],
        query: DiscoveryQuery,
        *,
        stats: Optional[PipelineStats] = None,
    ) -> list[CreatorProfile]:
        if not profiles:
            return []

        breaker = self._breakers[self.ed.name]
        if breaker.is_open():
            logger.warning("vet: EnsembleData breaker open — skipping audience vet")
            if stats is not None and self.ed.name not in stats.providers_unhealthy:
                stats.providers_unhealthy.append(self.ed.name)
            return profiles  # degrade: keep everyone, skip geo filter

        sem = asyncio.Semaphore(_ED_CONCURRENCY)

        async def one(profile: CreatorProfile) -> CreatorProfile:
            ck = f"ed:{profile.platform}:{profile.handle}"
            if (cached := self.cache.get(ck)) is not None:
                profile.merge(cached)
                return profile
            async with sem:
                try:
                    audience = await self.ed.enrich_audience(profile.handle, profile.platform)
                    breaker.record_success()
                except ProviderError as e:
                    breaker.record_failure()
                    logger.debug("ed vet %s/%s: %s", profile.platform, profile.handle, e)
                    return profile
                except NotImplementedError:
                    return profile
                except Exception:
                    logger.exception("ed vet unexpected error for %s", profile.handle)
                    return profile
            self.cache.set(ck, audience, ttl=_TTL_AUDIENCE)
            profile.merge(audience)
            return profile

        vetted = await asyncio.gather(*[one(p) for p in profiles])

        target_geo = query.geo
        if not target_geo:
            return list(vetted)

        # Keep a profile if its audience geo share for the target is ≥25%,
        # OR if we have no audience data at all (can't filter what we can't see).
        threshold = 0.25
        return [
            p for p in vetted
            if not p.audience_countries
            or p.audience_countries.get(target_geo, 0) >= threshold
        ]

    # ─── Layer 4: Content intelligence (Apify + Claude) ───────

    async def score_values(
        self,
        profiles: list[CreatorProfile],
        brand_values: list[str],
        *,
        stats: Optional[PipelineStats] = None,
    ) -> list[CreatorProfile]:
        if not profiles or not brand_values:
            return profiles

        # Lazy import to keep the core pipeline importable even if the scorer
        # module (which pulls in Anthropic SDK) is unavailable.
        try:
            from tools.values_scorer import score_creator_content
        except Exception as e:
            logger.warning("values_scorer unavailable: %s — skipping L4", e)
            return profiles

        breaker = self._breakers[self.apify.name]
        sem = asyncio.Semaphore(_APIFY_CONCURRENCY)

        async def one(profile: CreatorProfile) -> CreatorProfile:
            # Fetch posts (Apify)
            if not profile.recent_posts:
                posts_ck = f"apify:posts:{profile.platform}:{profile.handle}"
                cached_posts = self.cache.get(posts_ck)
                if cached_posts is not None:
                    profile.recent_posts = cached_posts
                elif not breaker.is_open():
                    async with sem:
                        try:
                            posts = await self.apify.fetch_recent_posts(
                                profile.handle, profile.platform, limit=30,
                            )
                            breaker.record_success()
                        except (ProviderError, NotImplementedError) as e:
                            breaker.record_failure()
                            logger.debug("apify posts %s: %s", profile.handle, e)
                            posts = []
                        except Exception:
                            logger.exception("apify posts unexpected for %s", profile.handle)
                            posts = []
                    if posts:
                        self.cache.set(posts_ck, posts, ttl=_TTL_POSTS)
                        profile.recent_posts = posts

            # Score via Claude (values_scorer handles its own errors)
            try:
                score, evidence = await score_creator_content(
                    profile.recent_posts, brand_values, profile_hint=profile.bio or "",
                )
                profile.values_score = score
                profile.values_evidence = evidence
            except Exception:
                logger.exception("values_scorer failed for %s — leaving unscored", profile.handle)

            return profile

        return list(await asyncio.gather(*[one(p) for p in profiles]))

    # ─── Health / observability ───────────────────────────────

    def health(self) -> dict:
        """Snapshot for /health — shows which providers are tripping."""
        return {
            "providers": {name: b.status() for name, b in self._breakers.items()},
            "cache": self.cache.stats(),
        }

    async def close(self) -> None:
        """Close all provider HTTP clients. Call on app shutdown."""
        for p in (self.apify, self.ed, self.sc):
            close = getattr(p, "close", None)
            if close is not None:
                try:
                    await close()
                except Exception:
                    logger.exception("failed to close provider %s", getattr(p, "name", "?"))


# ─── Convenience factory ────────────────────────────────────


def _build_default_orchestrator() -> DiscoveryOrchestrator:
    """Read config from env and build the orchestrator with defaults."""
    return DiscoveryOrchestrator()


# Small cache-hit helper used by some callers
__all__ = ["DiscoveryOrchestrator", "PipelineStats", "cache_key"]
