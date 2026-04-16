"""Tests for canonical creator data shapes + circuit breaker."""

import time

import pytest

from backend.integrations.creator_data.base import (
    CreatorProfile,
    DiscoveryQuery,
    ProviderError,
)
from backend.integrations.creator_data.circuit import CircuitBreaker


# ─── CreatorProfile.merge ─────────────────────────────────────


def test_merge_populates_missing_fields():
    a = CreatorProfile(handle="ecosam", platform="instagram", follower_count=10_000)
    b = CreatorProfile(handle="ecosam", platform="instagram", bio="Zero-waste life", avg_engagement_rate=0.04)

    a.merge(b)

    assert a.follower_count == 10_000  # kept from a
    assert a.bio == "Zero-waste life"   # taken from b
    assert a.avg_engagement_rate == 0.04


def test_merge_overrides_with_non_empty_values():
    a = CreatorProfile(handle="ecosam", platform="instagram", follower_count=10_000)
    b = CreatorProfile(handle="ecosam", platform="instagram", follower_count=15_000)

    a.merge(b)
    assert a.follower_count == 15_000  # b's non-empty value wins


def test_merge_preserves_when_other_is_empty():
    a = CreatorProfile(handle="ecosam", platform="instagram", bio="Original")
    b = CreatorProfile(handle="ecosam", platform="instagram", bio=None)

    a.merge(b)
    assert a.bio == "Original"


def test_merge_tracks_provenance():
    import datetime as dt
    a = CreatorProfile(
        handle="ecosam",
        platform="instagram",
        sources={"scrapecreators": dt.datetime(2026, 4, 16)},
    )
    b = CreatorProfile(
        handle="ecosam",
        platform="instagram",
        sources={"ensembledata": dt.datetime(2026, 4, 16)},
    )

    a.merge(b)
    assert set(a.sources) == {"scrapecreators", "ensembledata"}


def test_merge_rejects_mismatched_keys():
    a = CreatorProfile(handle="ecosam", platform="instagram")
    b = CreatorProfile(handle="ecojen", platform="instagram")
    with pytest.raises(ValueError):
        a.merge(b)


# ─── DiscoveryQuery.cache_key ─────────────────────────────────


def test_cache_key_is_deterministic():
    q1 = DiscoveryQuery(
        hashtags=["sustainable", "eco"],
        platforms=["instagram", "tiktok"],
        min_followers=5000,
        geo="GB",
    )
    q2 = DiscoveryQuery(
        hashtags=["eco", "sustainable"],  # order-flipped
        platforms=["tiktok", "instagram"],
        min_followers=5000,
        geo="GB",
    )
    assert q1.cache_key() == q2.cache_key()


def test_cache_key_changes_with_params():
    base = DiscoveryQuery(hashtags=["eco"], min_followers=5000)
    other = DiscoveryQuery(hashtags=["eco"], min_followers=10_000)
    assert base.cache_key() != other.cache_key()


# ─── ProviderError ────────────────────────────────────────────


def test_provider_error_carries_name_and_retryable_flag():
    err = ProviderError("scrapecreators", "rate limited (429)")
    assert err.provider == "scrapecreators"
    assert err.retryable is True
    assert "scrapecreators" in str(err)

    err2 = ProviderError("apify", "bad auth", retryable=False)
    assert err2.retryable is False


# ─── CircuitBreaker ───────────────────────────────────────────


def test_circuit_opens_after_threshold():
    cb = CircuitBreaker(name="t", failure_threshold=3, reset_seconds=60)
    assert not cb.is_open()

    for _ in range(3):
        cb.record_failure()

    assert cb.is_open()
    assert cb.status()["failures"] == 3


def test_circuit_success_resets_count():
    cb = CircuitBreaker(name="t", failure_threshold=3, reset_seconds=60)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    assert cb.status()["failures"] == 0

    # 3 fresh failures needed to re-open
    cb.record_failure()
    cb.record_failure()
    assert not cb.is_open()
    cb.record_failure()
    assert cb.is_open()


def test_circuit_reopens_on_fresh_failure_after_cooldown(monkeypatch):
    """After cooldown the breaker half-opens; a single failure doesn't
    instantly re-trip — takes threshold-many again."""
    cb = CircuitBreaker(name="t", failure_threshold=2, reset_seconds=1)
    cb.record_failure()
    cb.record_failure()
    assert cb.is_open()

    # Simulate cooldown elapsed
    time.sleep(1.1)
    assert not cb.is_open()  # half-open

    # One failure isn't enough to re-trip
    cb.record_failure()
    assert not cb.is_open()

    # Second failure trips it again
    cb.record_failure()
    assert cb.is_open()
