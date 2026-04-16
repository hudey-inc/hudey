"""Tests for ScrapeCreatorsProvider — cheap bulk enrichment (Layer 2).

We use ``httpx.MockTransport`` to stub the HTTP surface so tests are
deterministic and offline. The provider's lazy ``_http()`` builder is
bypassed by setting ``_client`` directly after construction.
"""

from __future__ import annotations

import asyncio

import httpx
import pytest

from backend.integrations.creator_data.base import (
    CreatorProfile,
    DiscoveryQuery,
    ProviderError,
)
from backend.integrations.creator_data.providers.scrapecreators import (
    ScrapeCreatorsProvider,
    _map_profile,
)


# ─── Test helpers ─────────────────────────────────────────────


def _mk_provider(handler) -> ScrapeCreatorsProvider:
    """Build a provider wired to a MockTransport handler."""
    provider = ScrapeCreatorsProvider(api_key="fake-test-key")
    transport = httpx.MockTransport(handler)
    provider._client = httpx.AsyncClient(
        transport=transport,
        base_url=provider.base_url,
        headers={"x-api-key": provider.api_key or ""},
    )
    return provider


# ─── enrich_profile — success ─────────────────────────────────


def test_enrich_profile_maps_instagram_response():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/instagram/profile"
        assert request.url.params["handle"] == "ecosam"
        return httpx.Response(200, json={
            "full_name": "Eco Sam",
            "biography": "Zero-waste life 🌱",
            "follower_count": 12_500,
            "following_count": 310,
            "post_count": 420,
            "engagement_rate": 0.037,
            "is_verified": False,
            "is_private": False,
            "profile_pic_url": "https://example.com/p.jpg",
        })

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_profile("ecosam", "instagram"))

    assert profile.handle == "ecosam"
    assert profile.platform == "instagram"
    assert profile.display_name == "Eco Sam"
    assert profile.bio == "Zero-waste life 🌱"
    assert profile.follower_count == 12_500
    assert profile.following_count == 310
    assert profile.post_count == 420
    assert profile.avg_engagement_rate == pytest.approx(0.037)
    assert profile.is_verified is False
    assert profile.is_private is False
    assert profile.avatar_url == "https://example.com/p.jpg"
    assert "scrapecreators" in profile.sources


def test_enrich_profile_strips_leading_at_sign():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["handle"] = request.url.params["handle"]
        return httpx.Response(200, json={"follower_count": 1})

    provider = _mk_provider(handler)
    asyncio.run(provider.enrich_profile("@withAt", "instagram"))
    assert captured["handle"] == "withAt"


def test_enrich_profile_accepts_wrapped_data_payload():
    """SC sometimes wraps fields under ``data``."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": {"follower_count": 999}})

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_profile("x", "instagram"))
    assert profile.follower_count == 999


def test_enrich_profile_uses_tiktok_endpoint():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/tiktok/profile"
        return httpx.Response(200, json={"followers": 8000, "avg_engagement": 0.05})

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_profile("ttuser", "tiktok"))
    assert profile.follower_count == 8000
    assert profile.avg_engagement_rate == pytest.approx(0.05)


def test_enrich_profile_uses_youtube_endpoint_and_subscriber_field():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/youtube/channel"
        return httpx.Response(200, json={"subscriber_count": 100_000, "description": "green tech"})

    provider = _mk_provider(handler)
    profile = asyncio.run(provider.enrich_profile("GreenTech", "youtube"))
    assert profile.follower_count == 100_000
    assert profile.bio == "green tech"


# ─── enrich_profile — error paths ─────────────────────────────


def test_enrich_profile_raises_when_unconfigured():
    provider = ScrapeCreatorsProvider(api_key="")  # no key
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("x", "instagram"))
    assert exc.value.retryable is False
    assert exc.value.provider == "scrapecreators"


def test_enrich_profile_404_non_retryable():
    def handler(request):
        return httpx.Response(404, text="not found")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("ghost", "instagram"))
    assert exc.value.retryable is False


def test_enrich_profile_429_retryable():
    def handler(request):
        return httpx.Response(429, text="rate limited")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("x", "instagram"))
    assert exc.value.retryable is True


def test_enrich_profile_500_retryable():
    def handler(request):
        return httpx.Response(503, text="boom")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("x", "instagram"))
    assert exc.value.retryable is True


def test_enrich_profile_400_non_retryable():
    def handler(request):
        return httpx.Response(400, text="bad input")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("x", "instagram"))
    assert exc.value.retryable is False


def test_enrich_profile_unsupported_platform():
    provider = ScrapeCreatorsProvider(api_key="k")
    with pytest.raises(ProviderError) as exc:
        asyncio.run(provider.enrich_profile("x", "mars"))  # type: ignore[arg-type]
    assert exc.value.retryable is False


def test_enrich_profile_invalid_json_raises_provider_error():
    def handler(request):
        return httpx.Response(200, text="not-json")

    provider = _mk_provider(handler)
    with pytest.raises(ProviderError):
        asyncio.run(provider.enrich_profile("x", "instagram"))


# ─── unsupported Protocol methods ─────────────────────────────


def test_discover_raises_not_implemented():
    provider = ScrapeCreatorsProvider(api_key="k")

    async def drain():
        # merely calling ``discover(...)`` returns an async generator; we have
        # to drive it to raise.
        async for _ in provider.discover(DiscoveryQuery(hashtags=["eco"])):
            pass

    with pytest.raises(NotImplementedError):
        asyncio.run(drain())


def test_enrich_audience_raises_not_implemented():
    provider = ScrapeCreatorsProvider(api_key="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.enrich_audience("x", "instagram"))


def test_fetch_recent_posts_raises_not_implemented():
    provider = ScrapeCreatorsProvider(api_key="k")
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.fetch_recent_posts("x", "instagram"))


# ─── mapping helpers ──────────────────────────────────────────


def test_map_profile_handles_booleans_in_many_shapes():
    profile = _map_profile(
        {"is_verified": "true", "is_private": 1, "follower_count": 100},
        handle="x", platform="instagram",
    )
    assert profile.is_verified is True
    assert profile.is_private is True


def test_map_profile_none_follower_count_stays_none():
    profile = _map_profile({}, handle="x", platform="instagram")
    assert profile.follower_count is None
    assert profile.avg_engagement_rate is None
