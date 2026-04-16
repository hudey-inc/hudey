"""Tests for EnsembleDataProvider — TikTok discovery + audience demographics."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from backend.integrations.creator_data.base import (
    DiscoveryQuery,
    ProviderError,
)
from backend.integrations.creator_data.providers.ensembledata import (
    EnsembleDataProvider,
    _as_percent_map,
    _extract_handle,
    _iter_hashtag_posts,
    _map_audience,
)


# ─── Test helpers ─────────────────────────────────────────────


def _mk_provider(handler) -> EnsembleDataProvider:
    provider = EnsembleDataProvider(token="fake-test-token")
    transport = httpx.MockTransport(handler)
    provider._client = httpx.AsyncClient(transport=transport, base_url=provider.base_url)
    return provider


async def _drain_discover(provider, query):
    return [p async for p in provider.discover(query)]


# ─── discover() ───────────────────────────────────────────────


def test_discover_yields_unique_tiktok_handles():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/apis/tt/hashtag/posts"
        assert request.url.params["name"] == "sustainable"
        return httpx.Response(200, json={
            "data": {
                "aweme_list": [
                    {"author": {"unique_id": "ecosam", "nickname": "Eco Sam"}},
                    {"author": {"unique_id": "ecosam", "nickname": "dup"}},  # dedup
                    {"author": {"unique_id": "plasticfree", "nickname": "PF"}},
                ],
            },
        })

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["sustainable"], platforms=["tiktok"])
    profiles = asyncio.run(_drain_discover(provider, query))

    assert [p.handle for p in profiles] == ["ecosam", "plasticfree"]
    assert profiles[0].platform == "tiktok"
    assert profiles[0].display_name == "Eco Sam"
    assert "ensembledata" in profiles[0].sources


def test_discover_skips_when_platform_not_tiktok():
    """Don't waste credits if the caller didn't ask for TikTok."""
    def handler(request):  # pragma: no cover — should never fire
        raise AssertionError("handler called")

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["eco"], platforms=["instagram"])
    profiles = asyncio.run(_drain_discover(provider, query))
    assert profiles == []


def test_discover_skips_when_no_hashtags():
    def handler(request):  # pragma: no cover
        raise AssertionError("handler called")

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=[], platforms=["tiktok"])
    profiles = asyncio.run(_drain_discover(provider, query))
    assert profiles == []


def test_discover_respects_limit_across_hashtags():
    calls = []

    def handler(request):
        tag = request.url.params["name"]
        calls.append(tag)
        return httpx.Response(200, json={
            "data": {"posts": [
                {"author": {"unique_id": f"{tag}_user1"}},
                {"author": {"unique_id": f"{tag}_user2"}},
            ]},
        })

    provider = _mk_provider(handler)
    query = DiscoveryQuery(
        hashtags=["one", "two", "three"], platforms=["tiktok"], limit=3,
    )
    profiles = asyncio.run(_drain_discover(provider, query))
    assert len(profiles) == 3
    # Should stop after 2nd hashtag once limit is reached (3rd never fires)
    assert "three" not in calls


def test_discover_skips_hashtag_on_http_error_but_continues():
    responses = iter([
        httpx.Response(500, text="oops"),
        httpx.Response(200, json={"data": {"posts": [{"author": {"unique_id": "ok"}}]}}),
    ])

    def handler(request):
        return next(responses)

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["broken", "good"], platforms=["tiktok"])
    profiles = asyncio.run(_drain_discover(provider, query))
    assert [p.handle for p in profiles] == ["ok"]


def test_discover_raises_on_429():
    def handler(request):
        return httpx.Response(429, text="rate limited")

    provider = _mk_provider(handler)
    query = DiscoveryQuery(hashtags=["eco"], platforms=["tiktok"])
    with pytest.raises(ProviderError):
        asyncio.run(_drain_discover(provider, query))


def test_discover_raises_when_unconfigured():
    provider = EnsembleDataProvider(token="")

    async def drain():
        async for _ in provider.discover(DiscoveryQuery(hashtags=["eco"], platforms=["tiktok"])):
            pass

    with pytest.raises(ProviderError) as exc:
        asyncio.run(drain())
    assert exc.value.retryable is False


# ─── enrich_audience() ────────────────────────────────────────


def test_enrich_audience_tiktok_endpoint():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/apis/tt/user/info"
        assert request.url.params["username"] == "ecosam"
        return httpx.Response(200, json={
            "data": {
                "audience": {
                    "countries": {"GB": 0.42, "US": 0.18},
                    "age_bands": {"18-24": 0.3, "25-34": 0.5},
                    "gender": {"F": 0.6, "M": 0.4},
                    "authenticity_score": 87.5,
                },
            },
        })

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_audience("ecosam", "tiktok"))
    assert profile.audience_countries == {"GB": 0.42, "US": 0.18}
    assert profile.audience_age_bands == {"18-24": 0.3, "25-34": 0.5}
    assert profile.audience_gender == {"F": 0.6, "M": 0.4}
    assert profile.authenticity_score == pytest.approx(87.5)


def test_enrich_audience_accepts_list_shape_for_countries():
    """ED sometimes returns [{code, percent}] lists instead of dicts."""
    def handler(request):
        return httpx.Response(200, json={
            "audience": {
                "countries": [
                    {"code": "GB", "percent": 0.5},
                    {"code": "US", "percent": 0.25},
                    {"name": "garbage"},  # missing percent — skip
                ],
            },
        })

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_audience("x", "tiktok"))
    assert profile.audience_countries == {"GB": 0.5, "US": 0.25}


def test_enrich_audience_404_non_retryable():
    def handler(request):
        return httpx.Response(404)

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_audience("ghost", "tiktok"))
    assert exc.value.retryable is False


def test_enrich_audience_429_retryable():
    def handler(request):
        return httpx.Response(429)

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_audience("x", "tiktok"))
    assert exc.value.retryable is True


def test_enrich_audience_unsupported_platform():
    provider = EnsembleDataProvider(token="k")
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_audience("x", "mars"))  # type: ignore[arg-type]
    assert exc.value.retryable is False


def test_enrich_audience_raises_when_unconfigured():
    provider = EnsembleDataProvider(token="")
    with pytest.raises(ProviderError):
        asyncio.run(provider.enrich_audience("x", "tiktok"))


# ─── unsupported Protocol methods ─────────────────────────────


def test_enrich_profile_raises_not_implemented():
    provider = EnsembleDataProvider(token="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.enrich_profile("x", "tiktok"))


def test_fetch_recent_posts_raises_not_implemented():
    provider = EnsembleDataProvider(token="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.fetch_recent_posts("x", "tiktok"))


# ─── helpers ──────────────────────────────────────────────────


def test_iter_hashtag_posts_accepts_multiple_shapes():
    assert list(_iter_hashtag_posts({"data": {"aweme_list": [{"a": 1}]}})) == [{"a": 1}]
    assert list(_iter_hashtag_posts({"data": {"posts": [{"a": 2}]}})) == [{"a": 2}]
    assert list(_iter_hashtag_posts({"data": {"items": [{"a": 3}]}})) == [{"a": 3}]
    assert list(_iter_hashtag_posts({"data": [{"a": 4}]})) == [{"a": 4}]
    assert list(_iter_hashtag_posts({})) == []
    assert list(_iter_hashtag_posts({"data": {"posts": [1, {"x": 2}]}})) == [{"x": 2}]


def test_extract_handle_prefers_unique_id_then_username():
    assert _extract_handle({"author": {"unique_id": "a", "username": "b"}}) == "a"
    assert _extract_handle({"author": {"username": "b"}}) == "b"
    assert _extract_handle({"author": {"sec_uid": "c"}}) == "c"
    assert _extract_handle({"author": None}) is None
    assert _extract_handle({}) is None


def test_as_percent_map_skips_non_numeric_and_true_booleans():
    result = _as_percent_map({"GB": 0.5, "US": True, "X": "bad"})
    assert result == {"GB": 0.5}


def test_map_audience_empty_when_no_audience_field():
    profile = _map_audience({"data": {}}, handle="x", platform="tiktok")
    assert profile.audience_countries == {}
    assert profile.authenticity_score is None
