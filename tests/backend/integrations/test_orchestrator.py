"""Tests for DiscoveryOrchestrator — the 4-layer pipeline stitching.

We don't hit the network here. Each provider is stubbed with a minimal class
that implements the `CreatorDataProvider` Protocol surface the orchestrator
touches. This lets us assert fan-out, merging, caching, circuit-breaker
fallback, layer capping, and partial-failure behaviour cheaply.
"""

from __future__ import annotations

import asyncio
from typing import AsyncIterator, Optional

import pytest

from backend.integrations.creator_data.base import (
    CreatorProfile,
    DiscoveryQuery,
    Platform,
    ProviderError,
)
from backend.integrations.creator_data.orchestrator import (
    DiscoveryOrchestrator,
    PipelineStats,
)


# ─── Stub providers ───────────────────────────────────────────


class _StubProvider:
    """Default behaviour is "configured, healthy, raises NotImplementedError".

    Each test overrides only the surface it cares about.
    """

    def __init__(self, name: str, configured: bool = True) -> None:
        self.name = name
        self.is_configured = configured
        self.close_called = False
        self.discover_payload: list[CreatorProfile] = []
        self.discover_raise: Optional[Exception] = None
        self.enrich_profile_map: dict[tuple[str, str], CreatorProfile] = {}
        self.enrich_profile_raise: Optional[Exception] = None
        self.enrich_audience_map: dict[tuple[str, str], CreatorProfile] = {}
        self.enrich_audience_raise: Optional[Exception] = None
        self.fetch_posts_map: dict[tuple[str, str], list[dict]] = {}
        self.fetch_posts_raise: Optional[Exception] = None
        # call counters
        self.enrich_profile_calls = 0
        self.enrich_audience_calls = 0
        self.fetch_posts_calls = 0

    async def discover(self, query: DiscoveryQuery) -> AsyncIterator[CreatorProfile]:
        if self.discover_raise is not None:
            raise self.discover_raise
        for p in self.discover_payload:
            yield p

    async def enrich_profile(self, handle: str, platform: Platform) -> CreatorProfile:
        self.enrich_profile_calls += 1
        if self.enrich_profile_raise is not None:
            raise self.enrich_profile_raise
        key = (handle, platform)
        if key in self.enrich_profile_map:
            return self.enrich_profile_map[key]
        raise NotImplementedError

    async def enrich_audience(self, handle: str, platform: Platform) -> CreatorProfile:
        self.enrich_audience_calls += 1
        if self.enrich_audience_raise is not None:
            raise self.enrich_audience_raise
        key = (handle, platform)
        if key in self.enrich_audience_map:
            return self.enrich_audience_map[key]
        raise NotImplementedError

    async def fetch_recent_posts(
        self, handle: str, platform: Platform, limit: int = 30,
    ) -> list[dict]:
        self.fetch_posts_calls += 1
        if self.fetch_posts_raise is not None:
            raise self.fetch_posts_raise
        return self.fetch_posts_map.get((handle, platform), [])

    async def close(self) -> None:
        self.close_called = True


def _orch(**overrides) -> tuple[DiscoveryOrchestrator, _StubProvider, _StubProvider, _StubProvider]:
    """Build an orchestrator with three stub providers."""
    apify = _StubProvider("apify")
    ed = _StubProvider("ensembledata")
    sc = _StubProvider("scrapecreators")
    for stub in (apify, ed, sc):
        for attr, val in overrides.get(stub.name, {}).items():
            setattr(stub, attr, val)
    orch = DiscoveryOrchestrator(apify=apify, ensembledata=ed, scrapecreators=sc)
    return orch, apify, ed, sc


def _profile(handle: str, platform: Platform = "instagram", **fields) -> CreatorProfile:
    return CreatorProfile(handle=handle, platform=platform, **fields)


# ─── Layer 1: discover() ──────────────────────────────────────


def test_discover_merges_and_dedupes_across_providers():
    orch, apify, ed, _ = _orch()
    apify.discover_payload = [
        _profile("ecosam", "instagram"),
        _profile("plasticfree", "instagram"),
    ]
    ed.discover_payload = [
        _profile("ttuser", "tiktok"),
        _profile("ecosam", "instagram"),  # dup across providers
    ]
    query = DiscoveryQuery(
        hashtags=["eco"], platforms=["instagram", "tiktok"], limit=100,
    )
    result = asyncio.run(orch.discover(query))
    handles = sorted((p.handle, p.platform) for p in result)
    assert handles == [
        ("ecosam", "instagram"),
        ("plasticfree", "instagram"),
        ("ttuser", "tiktok"),
    ]


def test_discover_uses_cache_on_second_call():
    orch, apify, _, _ = _orch()
    apify.discover_payload = [_profile("one", "instagram")]
    query = DiscoveryQuery(hashtags=["eco"], platforms=["instagram"])

    first = asyncio.run(orch.discover(query))
    apify.discover_payload = [_profile("two", "instagram")]  # would change if refetched
    second = asyncio.run(orch.discover(query))
    assert [p.handle for p in first] == [p.handle for p in second] == ["one"]


def test_discover_records_provider_error_on_circuit_and_continues():
    orch, apify, ed, _ = _orch()
    apify.discover_raise = ProviderError("apify", "boom")
    ed.discover_payload = [_profile("ttuser", "tiktok")]

    stats = PipelineStats()
    result = asyncio.run(orch.discover(
        DiscoveryQuery(hashtags=["eco"], platforms=["instagram", "tiktok"]),
        stats=stats,
    ))
    assert [p.handle for p in result] == ["ttuser"]
    assert "apify" in stats.providers_unhealthy
    assert orch._breakers["apify"].status()["failures"] == 1


def test_discover_skips_providers_with_open_breaker():
    orch, apify, ed, _ = _orch()
    apify.discover_payload = [_profile("never-seen", "instagram")]
    # Trip Apify's breaker manually
    for _ in range(orch._breakers["apify"].failure_threshold):
        orch._breakers["apify"].record_failure()
    assert orch._breakers["apify"].is_open()

    ed.discover_payload = [_profile("ttuser", "tiktok")]
    result = asyncio.run(orch.discover(
        DiscoveryQuery(hashtags=["eco"], platforms=["instagram", "tiktok"]),
    ))
    assert [p.handle for p in result] == ["ttuser"]


def test_discover_returns_empty_when_no_configured_providers():
    orch, apify, ed, _ = _orch()
    apify.is_configured = False
    ed.is_configured = False
    result = asyncio.run(orch.discover(
        DiscoveryQuery(hashtags=["eco"], platforms=["instagram", "tiktok"]),
    ))
    assert result == []


def test_discover_caps_by_layer_cap():
    orch, apify, _, _ = _orch()
    apify.discover_payload = [_profile(f"u{i}", "instagram") for i in range(20)]
    orch.caps["discovery"] = 5
    result = asyncio.run(orch.discover(
        DiscoveryQuery(hashtags=["eco"], platforms=["instagram"], limit=100),
    ))
    assert len(result) == 5


# ─── Layer 2: filter_by_basics() ──────────────────────────────


def test_filter_by_basics_enriches_and_cuts_by_follower_range():
    orch, _, _, sc = _orch()
    sc.enrich_profile_map = {
        ("a", "instagram"): _profile(
            "a", follower_count=15_000, avg_engagement_rate=0.05, is_private=False,
        ),
        ("b", "instagram"): _profile(
            "b", follower_count=2_000, avg_engagement_rate=0.08, is_private=False,
        ),  # too small
        ("c", "instagram"): _profile(
            "c", follower_count=50_000, avg_engagement_rate=0.005, is_private=False,
        ),  # ER too low
        ("d", "instagram"): _profile(
            "d", follower_count=20_000, avg_engagement_rate=0.03, is_private=True,
        ),  # private
    }
    profiles = [
        _profile("a"), _profile("b"), _profile("c"), _profile("d"),
    ]
    query = DiscoveryQuery(min_followers=5_000, max_followers=40_000)
    result = asyncio.run(orch.filter_by_basics(profiles, query))
    assert [p.handle for p in result] == ["a"]


def test_filter_by_basics_drops_when_breaker_open_returns_passthrough():
    orch, _, _, sc = _orch()
    sc.enrich_profile_map = {("a", "instagram"): _profile("a", follower_count=10_000)}
    # Open SC breaker
    for _ in range(orch._breakers[sc.name].failure_threshold):
        orch._breakers[sc.name].record_failure()

    profiles = [_profile("a")]
    stats = PipelineStats()
    result = asyncio.run(orch.filter_by_basics(
        profiles, DiscoveryQuery(min_followers=5_000), stats=stats,
    ))
    # Pass-through — we don't know followers, so we keep them for downstream
    assert result == profiles
    assert sc.enrich_profile_calls == 0
    assert "scrapecreators" in stats.providers_unhealthy


def test_filter_keeps_profile_unenriched_on_provider_error():
    """If SC fails for one handle, we still pass the profile through (un-enriched).

    The filter only rejects on data we actually have — missing
    follower_count / ER means "unknown", not "fail". Better to surface a
    handle without stats than silently drop it; the UI can curate.
    """
    orch, _, _, sc = _orch()
    sc.enrich_profile_raise = ProviderError("sc", "429")
    result = asyncio.run(orch.filter_by_basics(
        [_profile("a")], DiscoveryQuery(min_followers=5_000),
    ))
    # Un-enriched profile survives — we can't filter what we can't see.
    assert len(result) == 1
    assert result[0].handle == "a"
    assert result[0].follower_count is None
    # Breaker still ticked up on the provider error.
    assert orch._breakers[sc.name].status()["failures"] == 1


def test_filter_empty_input_returns_empty():
    orch, *_ = _orch()
    result = asyncio.run(orch.filter_by_basics([], DiscoveryQuery()))
    assert result == []


# ─── Layer 3: vet_audience() ──────────────────────────────────


def test_vet_audience_filters_by_geo_threshold():
    orch, _, ed, _ = _orch()
    ed.enrich_audience_map = {
        ("a", "instagram"): _profile("a", audience_countries={"GB": 0.4, "US": 0.6}),
        ("b", "instagram"): _profile("b", audience_countries={"GB": 0.1, "US": 0.9}),
    }
    profiles = [_profile("a"), _profile("b")]
    result = asyncio.run(orch.vet_audience(profiles, DiscoveryQuery(geo="GB")))
    assert [p.handle for p in result] == ["a"]


def test_vet_audience_keeps_profiles_without_audience_data():
    """Can't filter what we can't see — keep them and let the user judge."""
    orch, _, ed, _ = _orch()
    # ED raises NotImplementedError — leaves audience empty
    ed.enrich_audience_raise = NotImplementedError("no data")
    result = asyncio.run(orch.vet_audience(
        [_profile("a")], DiscoveryQuery(geo="GB"),
    ))
    assert [p.handle for p in result] == ["a"]


def test_vet_audience_passthrough_when_breaker_open():
    orch, _, ed, _ = _orch()
    for _ in range(orch._breakers[ed.name].failure_threshold):
        orch._breakers[ed.name].record_failure()
    profiles = [_profile("a"), _profile("b")]
    stats = PipelineStats()
    result = asyncio.run(orch.vet_audience(profiles, DiscoveryQuery(geo="GB"), stats=stats))
    assert result == profiles
    assert "ensembledata" in stats.providers_unhealthy
    assert ed.enrich_audience_calls == 0


def test_vet_audience_without_geo_returns_all_vetted():
    orch, _, ed, _ = _orch()
    ed.enrich_audience_map = {
        ("a", "instagram"): _profile("a", authenticity_score=90.0),
    }
    result = asyncio.run(orch.vet_audience([_profile("a")], DiscoveryQuery()))
    assert len(result) == 1
    assert result[0].authenticity_score == 90.0


def test_vet_audience_handles_provider_error_per_profile():
    orch, _, ed, _ = _orch()
    ed.enrich_audience_raise = ProviderError("ed", "boom")
    result = asyncio.run(orch.vet_audience(
        [_profile("a")], DiscoveryQuery(),  # no geo → all kept
    ))
    # Still in results, just unenriched
    assert [p.handle for p in result] == ["a"]


# ─── Layer 4: score_values() ──────────────────────────────────


def test_score_values_no_brand_values_returns_unchanged(monkeypatch):
    orch, *_ = _orch()
    profiles = [_profile("a")]
    result = asyncio.run(orch.score_values(profiles, brand_values=[]))
    assert result == profiles


def test_score_values_calls_scorer_and_sets_score(monkeypatch):
    orch, apify, _, _ = _orch()
    apify.fetch_posts_map = {
        ("a", "instagram"): [{"caption": "zero-waste linen tee"}],
    }

    calls = []

    async def fake_scorer(posts, brand_values, *, profile_hint=""):
        calls.append((posts, brand_values, profile_hint))
        return 82.0, ["zero-waste linen tee"]

    # Inject our fake into the tools.values_scorer module
    import sys
    import types
    mod = types.ModuleType("tools.values_scorer")
    mod.score_creator_content = fake_scorer
    # Ensure the parent "tools" namespace exists too
    parent = sys.modules.get("tools") or types.ModuleType("tools")
    parent.values_scorer = mod
    monkeypatch.setitem(sys.modules, "tools", parent)
    monkeypatch.setitem(sys.modules, "tools.values_scorer", mod)

    result = asyncio.run(orch.score_values(
        [_profile("a", bio="sustainable skincare")],
        brand_values=["sustainability"],
    ))
    assert result[0].values_score == 82.0
    assert result[0].values_evidence == ["zero-waste linen tee"]
    assert calls[0][2] == "sustainable skincare"


def test_score_values_survives_scorer_exception(monkeypatch):
    orch, apify, _, _ = _orch()
    apify.fetch_posts_map = {("a", "instagram"): [{"caption": "x"}]}

    async def broken_scorer(*args, **kwargs):
        raise RuntimeError("LLM exploded")

    import sys
    import types
    mod = types.ModuleType("tools.values_scorer")
    mod.score_creator_content = broken_scorer
    parent = sys.modules.get("tools") or types.ModuleType("tools")
    parent.values_scorer = mod
    monkeypatch.setitem(sys.modules, "tools", parent)
    monkeypatch.setitem(sys.modules, "tools.values_scorer", mod)

    result = asyncio.run(orch.score_values([_profile("a")], brand_values=["green"]))
    # Profile still returned — just unscored
    assert result[0].values_score is None


def test_score_values_skips_apify_posts_when_breaker_open(monkeypatch):
    orch, apify, _, _ = _orch()
    # Open Apify breaker
    for _ in range(orch._breakers[apify.name].failure_threshold):
        orch._breakers[apify.name].record_failure()
    apify.fetch_posts_map = {("a", "instagram"): [{"caption": "never"}]}

    async def fake_scorer(posts, brand_values, *, profile_hint=""):
        return (0.0 if not posts else 50.0), []

    import sys, types
    mod = types.ModuleType("tools.values_scorer")
    mod.score_creator_content = fake_scorer
    parent = sys.modules.get("tools") or types.ModuleType("tools")
    parent.values_scorer = mod
    monkeypatch.setitem(sys.modules, "tools", parent)
    monkeypatch.setitem(sys.modules, "tools.values_scorer", mod)

    result = asyncio.run(orch.score_values([_profile("a")], brand_values=["x"]))
    # No posts fetched (breaker open), scorer saw empty → score=0
    assert result[0].values_score == 0.0
    assert apify.fetch_posts_calls == 0


# ─── End-to-end run() ─────────────────────────────────────────


def test_run_full_pipeline_happy_path(monkeypatch):
    orch, apify, ed, sc = _orch()
    apify.discover_payload = [
        _profile("ecosam", "instagram"),
        _profile("plasticfree", "instagram"),
    ]
    ed.discover_payload = [_profile("ttuser", "tiktok")]
    sc.enrich_profile_map = {
        ("ecosam", "instagram"): _profile(
            "ecosam", "instagram",
            follower_count=15_000, avg_engagement_rate=0.06, is_private=False,
        ),
        ("plasticfree", "instagram"): _profile(
            "plasticfree", "instagram",
            follower_count=8_000, avg_engagement_rate=0.04, is_private=False,
        ),
        ("ttuser", "tiktok"): _profile(
            "ttuser", "tiktok",
            follower_count=500_000, avg_engagement_rate=0.001, is_private=False,
        ),  # ER too low → cut
    }
    ed.enrich_audience_map = {
        ("ecosam", "instagram"): _profile(
            "ecosam", "instagram", audience_countries={"GB": 0.5},
        ),
        ("plasticfree", "instagram"): _profile(
            "plasticfree", "instagram", audience_countries={"US": 0.9},
        ),  # GB only 0% → cut
    }
    apify.fetch_posts_map = {
        ("ecosam", "instagram"): [{"caption": "zero-waste denim"}],
    }

    async def fake_scorer(posts, brand_values, *, profile_hint=""):
        return (80.0, ["zero-waste denim"]) if posts else (0.0, [])

    import sys, types
    mod = types.ModuleType("tools.values_scorer")
    mod.score_creator_content = fake_scorer
    parent = sys.modules.get("tools") or types.ModuleType("tools")
    parent.values_scorer = mod
    monkeypatch.setitem(sys.modules, "tools", parent)
    monkeypatch.setitem(sys.modules, "tools.values_scorer", mod)

    query = DiscoveryQuery(
        hashtags=["eco"], platforms=["instagram", "tiktok"],
        min_followers=5_000, geo="GB",
    )
    results, stats = asyncio.run(orch.run(query, brand_values=["sustainability"]))

    assert [p.handle for p in results] == ["ecosam"]
    assert stats.discovered == 3
    assert stats.after_filter == 2  # ttuser failed ER cut
    assert stats.after_vet == 1      # plasticfree failed GB threshold
    assert stats.after_intel == 1
    assert results[0].values_score == 80.0


# ─── Health / close ───────────────────────────────────────────


def test_health_snapshot_shape():
    orch, *_ = _orch()
    h = orch.health()
    assert "providers" in h
    assert set(h["providers"].keys()) == {"apify", "ensembledata", "scrapecreators"}
    assert "cache" in h


def test_close_calls_all_providers():
    orch, apify, ed, sc = _orch()
    asyncio.run(orch.close())
    assert apify.close_called and ed.close_called and sc.close_called


# ─── PipelineStats ────────────────────────────────────────────


def test_pipeline_stats_as_dict_shape():
    stats = PipelineStats(discovered=10, after_filter=5, after_vet=2, after_intel=1)
    d = stats.as_dict()
    assert d["discovered"] == 10
    assert d["after_filter"] == 5
    assert d["after_vet"] == 2
    assert d["after_intel"] == 1
    assert d["providers_unhealthy"] == []
