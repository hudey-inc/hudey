"""Tests for the ``_new_stack_search`` bridge module.

This is the thin translation layer between the search endpoint's request
shape and the ``DiscoveryOrchestrator``. The orchestrator itself is covered
in tests/backend/integrations/test_orchestrator.py — here we only verify:

- env detection (``new_stack_configured`` / ``_new_stack_env_keys``)
- input normalisation (platform aliases, geo aliases)
- profile → creator-dict translation
- the ``run_search`` entry point against a stub orchestrator (no real
  providers touched).
"""

from __future__ import annotations

import asyncio
from unittest.mock import patch

import pytest

from backend.api.routes import _new_stack_search as ns
from backend.integrations.creator_data.base import CreatorProfile, DiscoveryQuery


# ── env detection ───────────────────────────────────────────

def test_new_stack_configured_false_by_default(monkeypatch):
    for k in ("APIFY_TOKEN", "ENSEMBLEDATA_API_TOKEN", "SCRAPECREATORS_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    assert ns.new_stack_configured() is False
    assert ns._new_stack_env_keys() == []


def test_new_stack_configured_true_when_any_provider_set(monkeypatch):
    monkeypatch.delenv("APIFY_TOKEN", raising=False)
    monkeypatch.delenv("ENSEMBLEDATA_API_TOKEN", raising=False)
    monkeypatch.setenv("SCRAPECREATORS_API_KEY", "sc-token")
    assert ns.new_stack_configured() is True
    assert ns._new_stack_env_keys() == ["scrapecreators"]


def test_new_stack_configured_all_three(monkeypatch):
    monkeypatch.setenv("APIFY_TOKEN", "apify")
    monkeypatch.setenv("ENSEMBLEDATA_API_TOKEN", "ed")
    monkeypatch.setenv("SCRAPECREATORS_API_KEY", "sc")
    assert sorted(ns._new_stack_env_keys()) == ["apify", "ensembledata", "scrapecreators"]


def test_blank_env_var_treated_as_unset(monkeypatch):
    monkeypatch.setenv("APIFY_TOKEN", "   ")
    monkeypatch.delenv("ENSEMBLEDATA_API_TOKEN", raising=False)
    monkeypatch.delenv("SCRAPECREATORS_API_KEY", raising=False)
    assert ns.new_stack_configured() is False


# ── platform normalisation ──────────────────────────────────

def test_normalise_platform_aliases():
    assert ns._normalise_platform("Instagram") == "instagram"
    assert ns._normalise_platform("ig") == "instagram"
    assert ns._normalise_platform("TikTok") == "tiktok"
    assert ns._normalise_platform("tt") == "tiktok"
    assert ns._normalise_platform("YouTube") == "youtube"
    assert ns._normalise_platform("yt") == "youtube"


def test_normalise_platform_drops_unknown():
    assert ns._normalise_platform("twitter") is None
    assert ns._normalise_platform("") is None
    assert ns._normalise_platform("   ") is None


# ── geo normalisation ───────────────────────────────────────

def test_normalise_geo_alias_lookup():
    assert ns._normalise_geo(["UK"]) == "GB"
    assert ns._normalise_geo(["united kingdom"]) == "GB"
    assert ns._normalise_geo(["USA"]) == "US"
    assert ns._normalise_geo(["america"]) == "US"


def test_normalise_geo_two_letter_passthrough():
    # If user provides an ISO alpha-2 we didn't alias, upper-case it.
    assert ns._normalise_geo(["fr"]) == "FR"
    assert ns._normalise_geo(["de"]) == "DE"


def test_normalise_geo_empty_returns_none():
    assert ns._normalise_geo(None) is None
    assert ns._normalise_geo([]) is None
    assert ns._normalise_geo([""]) is None
    assert ns._normalise_geo(["   "]) is None


def test_normalise_geo_takes_first_entry():
    # Multi-country not supported yet — first one wins.
    assert ns._normalise_geo(["UK", "US"]) == "GB"


# ── profile → dict ──────────────────────────────────────────

def test_profile_to_creator_dict_uses_platform_scoped_external_id():
    p = CreatorProfile(
        handle="foo", platform="instagram", follower_count=10_000,
        avg_engagement_rate=0.05,
    )
    d = ns._profile_to_creator_dict(p)
    # {platform}:{handle} keeps IG/TikTok duplicates apart on upsert.
    assert d["external_id"] == "instagram:foo"
    assert d["platform"] == "instagram"
    assert d["username"] == "foo"
    assert d["display_name"] == "foo"  # falls back to handle when absent
    assert d["follower_count"] == 10_000
    assert d["engagement_rate"] == 0.05


def test_profile_to_creator_dict_preserves_explicit_display_name():
    p = CreatorProfile(handle="foo", platform="tiktok", display_name="Foo Official")
    assert ns._profile_to_creator_dict(p)["display_name"] == "Foo Official"


def test_profile_to_creator_dict_carries_extras_in_profile_data():
    p = CreatorProfile(
        handle="bar",
        platform="youtube",
        bio="sustainable creator",
        is_verified=True,
        is_private=False,
        authenticity_score=87.5,
        values_score=42.0,
        values_evidence=["uses #sustainablefashion"],
        avatar_url="https://cdn/.../bar.jpg",
        profile_url="https://youtube.com/@bar",
    )
    d = ns._profile_to_creator_dict(p)
    pd = d["profile_data"]
    assert pd["bio"] == "sustainable creator"
    assert pd["is_verified"] is True
    assert pd["is_private"] is False
    assert pd["authenticity_score"] == 87.5
    assert pd["values_score"] == 42.0
    assert pd["values_evidence"] == ["uses #sustainablefashion"]
    assert pd["image_url"] == "https://cdn/.../bar.jpg"
    assert pd["profile_url"] == "https://youtube.com/@bar"


def test_profile_to_creator_dict_defaults_none_follower_count_to_zero():
    # DB column is NOT NULL — the mapper must not leak None through.
    p = CreatorProfile(handle="foo", platform="instagram", follower_count=None)
    assert ns._profile_to_creator_dict(p)["follower_count"] == 0


# ── run_search integration (stub orchestrator) ─────────────

class _StubOrch:
    """Minimal DiscoveryOrchestrator stand-in.

    Returns whatever profiles the test injects. Records the last query so we
    can assert the mapping from endpoint → DiscoveryQuery is correct.
    """

    def __init__(self, profiles=None):
        self._profiles = profiles or []
        self.last_query: DiscoveryQuery | None = None
        self._breakers: dict = {}

    async def discover(self, q):
        self.last_query = q
        return list(self._profiles)

    async def filter_by_basics(self, profiles, q):
        # pass-through; real orchestrator drops private / out-of-band rows.
        return list(profiles)


@pytest.fixture
def reset_singleton():
    ns.reset_orchestrator()
    yield
    ns.reset_orchestrator()


def test_run_search_returns_empty_when_no_supported_platforms(reset_singleton):
    # "twitter" isn't covered by the new stack — caller should fall back.
    result, diag = asyncio.run(ns.run_search(
        platforms=["twitter"],
        follower_min=1_000, follower_max=1_000_000,
        categories=["fashion"], locations=None, limit=20,
    ))
    assert result == []
    assert diag["configured"] is False
    assert "no supported platforms" in diag["reason"]


def test_run_search_returns_empty_when_no_categories(reset_singleton):
    # Orchestrator needs hashtags for discovery. Route should fall back.
    result, diag = asyncio.run(ns.run_search(
        platforms=["instagram"],
        follower_min=1_000, follower_max=1_000_000,
        categories=None, locations=None, limit=20,
    ))
    assert result == []
    assert diag["configured"] is True
    assert "categories" in diag["reason"]


def test_run_search_happy_path_sorts_by_engagement(reset_singleton):
    low_er = CreatorProfile(handle="low", platform="instagram", avg_engagement_rate=0.01)
    high_er = CreatorProfile(handle="high", platform="instagram", avg_engagement_rate=0.08)
    mid_er = CreatorProfile(handle="mid", platform="instagram", avg_engagement_rate=0.04)

    stub = _StubOrch(profiles=[low_er, high_er, mid_er])
    with patch.object(ns, "get_orchestrator", return_value=stub):
        result, diag = asyncio.run(ns.run_search(
            platforms=["instagram"],
            follower_min=1_000, follower_max=1_000_000,
            categories=["fashion"], locations=["UK"], limit=20,
        ))

    # Sorted high-to-low ER.
    assert [r["username"] for r in result] == ["high", "mid", "low"]
    # DiscoveryQuery built correctly.
    q = stub.last_query
    assert q.hashtags == ["fashion"]
    assert q.keywords == ["fashion"]
    assert q.platforms == ["instagram"]
    assert q.min_followers == 1_000
    assert q.max_followers == 1_000_000
    assert q.geo == "GB"
    # Diagnostics carry funnel counts.
    assert diag["discovered"] == 3
    assert diag["after_filter"] == 3
    assert diag["returned"] == 3


def test_run_search_truncates_to_limit(reset_singleton):
    profiles = [
        CreatorProfile(handle=f"u{i}", platform="instagram", avg_engagement_rate=i / 100)
        for i in range(10)
    ]
    stub = _StubOrch(profiles=profiles)
    with patch.object(ns, "get_orchestrator", return_value=stub):
        result, diag = asyncio.run(ns.run_search(
            platforms=["instagram"],
            follower_min=0, follower_max=1_000_000,
            categories=["anything"], locations=None, limit=3,
        ))
    assert len(result) == 3
    # Highest-ER three.
    assert [r["username"] for r in result] == ["u9", "u8", "u7"]
    assert diag["returned"] == 3


def test_run_search_swallows_pipeline_error_into_diagnostics(reset_singleton):
    class _Boom(_StubOrch):
        async def discover(self, q):
            raise RuntimeError("apify unreachable")

    with patch.object(ns, "get_orchestrator", return_value=_Boom()):
        result, diag = asyncio.run(ns.run_search(
            platforms=["instagram"],
            follower_min=1_000, follower_max=1_000_000,
            categories=["fashion"], locations=None, limit=20,
        ))
    # Don't raise — caller needs to fall back to Phyllo.
    assert result == []
    assert "pipeline error" in diag["reason"]
    assert diag["configured"] is True


def test_run_search_discover_limit_is_capped(reset_singleton):
    stub = _StubOrch(profiles=[])
    with patch.object(ns, "get_orchestrator", return_value=stub):
        asyncio.run(ns.run_search(
            platforms=["instagram"],
            follower_min=0, follower_max=None,
            categories=["x"], locations=None, limit=500,  # absurdly large
        ))
    assert stub.last_query.limit == ns._DISCOVER_LIMIT_MAX


def test_get_orchestrator_is_singleton(reset_singleton):
    a = ns.get_orchestrator()
    b = ns.get_orchestrator()
    assert a is b


def test_reset_orchestrator_clears_singleton(reset_singleton):
    a = ns.get_orchestrator()
    ns.reset_orchestrator()
    b = ns.get_orchestrator()
    assert a is not b
