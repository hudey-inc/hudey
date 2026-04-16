"""Tests for ApifyProvider — IG/YT discovery + IG post scraping."""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from backend.integrations.creator_data.base import (
    DiscoveryQuery,
    ProviderError,
)
from backend.integrations.creator_data.providers.apify import (
    ApifyProvider,
    _nested,
    _parse_ig_hashtag_items,
    _parse_yt_search_items,
)


# ─── Test helpers ─────────────────────────────────────────────


def _mk_provider(handler, **kwargs) -> ApifyProvider:
    provider = ApifyProvider(
        token="fake-test-token",
        run_timeout_secs=1,  # keep test snappy
        http_timeout=5.0,
        **kwargs,
    )
    transport = httpx.MockTransport(handler)
    provider._client = httpx.AsyncClient(transport=transport, base_url=provider.base_url)
    return provider


async def _drain_discover(provider, query):
    return [p async for p in provider.discover(query)]


# ─── discover() ───────────────────────────────────────────────


def test_discover_ig_hashtag_run():
    def handler(request: httpx.Request) -> httpx.Response:
        # Path should look like /v2/acts/{actor_id}/run-sync-get-dataset-items
        assert "run-sync-get-dataset-items" in request.url.path
        return httpx.Response(200, json=[
            {"ownerUsername": "ecosam", "ownerFullName": "Eco Sam"},
            {"ownerUsername": "ecosam"},  # dedup
            {"ownerUsername": "plasticfree"},
        ])

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["sustainable"], platforms=["instagram"])
    profiles = asyncio.run(_drain_discover(provider, query))
    handles = [p.handle for p in profiles]
    assert handles == ["ecosam", "plasticfree"]
    assert profiles[0].display_name == "Eco Sam"
    assert profiles[0].platform == "instagram"


def test_discover_yt_uses_keywords_when_available():
    captured_payloads = []

    def handler(request):
        payload = json.loads(request.content.decode()) if request.content else {}
        captured_payloads.append(payload)
        return httpx.Response(200, json=[
            {"channelName": "Green Tech Channel"},
            {"channel": "Another Channel"},
        ])

    provider = _mk_provider(handler)
    query = DiscoveryQuery(
        hashtags=["eco"], keywords=["sustainable tech"], platforms=["youtube"],
    )
    profiles = asyncio.run(_drain_discover(provider, query))
    assert {p.handle for p in profiles} == {"Green Tech Channel", "Another Channel"}
    # Keywords win over hashtags for YT search
    assert captured_payloads[0]["searchQueries"] == ["sustainable tech"]


def test_discover_yt_falls_back_to_hashtags():
    captured = {}

    def handler(request):
        payload = json.loads(request.content.decode()) if request.content else {}
        captured["payload"] = payload
        return httpx.Response(200, json=[])

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["eco"], platforms=["youtube"])
    asyncio.run(_drain_discover(provider, query))
    assert captured["payload"]["searchQueries"] == ["#eco"]


def test_discover_skips_platforms_not_requested():
    calls = {"count": 0}

    def handler(request):
        calls["count"] += 1
        return httpx.Response(200, json=[])

    provider = _mk_provider(handler)
    # TikTok-only query — Apify should make zero calls
    query = DiscoveryQuery(hashtags=["eco"], platforms=["tiktok"])
    profiles = asyncio.run(_drain_discover(provider, query))
    assert profiles == []
    assert calls["count"] == 0


def test_discover_raises_when_unconfigured():
    provider = ApifyProvider(token="")

    async def drain():
        async for _ in provider.discover(DiscoveryQuery(hashtags=["eco"])):
            pass

    with pytest.raises(ProviderError) as exc:
        asyncio.run(drain())
    assert exc.value.retryable is False


def test_discover_respects_limit():
    def handler(request):
        return httpx.Response(200, json=[
            {"ownerUsername": f"u{i}"} for i in range(100)
        ])

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["eco"], platforms=["instagram"], limit=10)
    profiles = asyncio.run(_drain_discover(provider, query))
    assert len(profiles) == 10


def test_discover_propagates_provider_error_from_actor():
    def handler(request):
        return httpx.Response(429, text="rate limited")

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["eco"], platforms=["instagram"])
    with pytest.raises(ProviderError):
        asyncio.run(_drain_discover(provider, query))


# ─── fetch_recent_posts() ─────────────────────────────────────


def test_fetch_recent_posts_returns_dataset():
    def handler(request: httpx.Request) -> httpx.Response:
        # Body should contain {username, resultsLimit}
        body = json.loads(request.content.decode())
        assert body["username"] == ["ecosam"]
        assert body["resultsLimit"] == 30
        return httpx.Response(200, json=[
            {"caption": "reclaimed denim fit 🌱", "likesCount": 250},
            {"caption": "behind the scenes", "likesCount": 98},
        ])

    provider = _mk_provider(handler)
    posts = asyncio.run(provider.fetch_recent_posts("ecosam", "instagram", limit=30))
    assert len(posts) == 2
    assert posts[0]["caption"].startswith("reclaimed denim")


def test_fetch_recent_posts_unwraps_items_wrapper():
    def handler(request):
        return httpx.Response(200, json={"items": [{"caption": "x"}]})

    provider = _mk_provider(handler)
    posts = asyncio.run(provider.fetch_recent_posts("ecosam", "instagram"))
    assert posts == [{"caption": "x"}]


def test_fetch_recent_posts_ignores_unknown_wrapper_shapes():
    def handler(request):
        return httpx.Response(200, json={"garbage": "data"})

    provider = _mk_provider(handler)
    posts = asyncio.run(provider.fetch_recent_posts("ecosam", "instagram"))
    assert posts == []


def test_fetch_recent_posts_raises_on_bad_json():
    def handler(request):
        return httpx.Response(200, text="not-json-at-all")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError):
        asyncio.run(provider.fetch_recent_posts("ecosam", "instagram"))


def test_fetch_recent_posts_raises_on_500():
    def handler(request):
        return httpx.Response(502, text="gateway")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.fetch_recent_posts("ecosam", "instagram"))
    assert exc.value.retryable is True


def test_fetch_recent_posts_non_instagram_not_implemented():
    provider = ApifyProvider(token="k")  # configured, to bypass unconfigured branch
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.fetch_recent_posts("x", "tiktok"))
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.fetch_recent_posts("x", "youtube"))


def test_fetch_recent_posts_raises_when_unconfigured():
    provider = ApifyProvider(token="")
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.fetch_recent_posts("x", "instagram"))
    assert exc.value.retryable is False


# ─── unsupported Protocol methods ─────────────────────────────


def test_enrich_profile_raises_not_implemented():
    provider = ApifyProvider(token="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.enrich_profile("x", "instagram"))


def test_enrich_audience_raises_not_implemented():
    provider = ApifyProvider(token="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.enrich_audience("x", "instagram"))


# ─── parsers ──────────────────────────────────────────────────


def test_parse_ig_hashtag_items_dedups_and_extracts_name():
    items = [
        {"ownerUsername": "a", "ownerFullName": "Alice"},
        {"ownerUsername": "a"},  # dup
        {"username": "b"},
        {"owner": {"username": "c", "full_name": "Cee"}},
        {"junk": "skip-me"},  # no owner info
        "not a dict",
    ]
    profiles = _parse_ig_hashtag_items(items)
    handles = [p.handle for p in profiles]
    assert handles == ["a", "b", "c"]
    assert profiles[0].display_name == "Alice"
    assert profiles[2].display_name == "Cee"


def test_parse_yt_search_items_prefers_channel_name():
    items = [
        {"channelName": "X"},
        {"channel": "Y"},
        {"author": {"name": "Z"}},
        {"channelName": "X"},  # dup
        {"nothing": True},
    ]
    profiles = _parse_yt_search_items(items)
    handles = [p.handle for p in profiles]
    assert handles == ["X", "Y", "Z"]


def test_nested_lookup_handles_missing_keys():
    assert _nested({"a": {"b": 1}}, "a", "b") == 1
    assert _nested({"a": {"b": 1}}, "a", "c") is None
    assert _nested({}, "a", "b") is None
    assert _nested({"a": "not-a-dict"}, "a", "b") is None
