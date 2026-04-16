"""Canonical data shapes + Protocol for creator data providers.

Every concrete provider (ScrapeCreators, EnsembleData, Apify, future Modash)
fills in a **subset** of `CreatorProfile`. The orchestrator merges partial
profiles across providers by `(handle, platform)` to build a complete record.

Keeping the shape canonical means:

- Downstream code (ranking, outreach drafting, dashboard) never has to
  know which provider produced a given field.
- Swapping vendors later is a provider-class change, not a refactor.
- Partial failures degrade gracefully — missing fields stay `None` rather
  than crashing the pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, AsyncIterator, Optional

try:  # Python 3.9 lacks typing.Protocol runtime_checkable with async methods cleanly
    from typing import Literal, Protocol, runtime_checkable
except ImportError:  # pragma: no cover
    from typing_extensions import Literal, Protocol, runtime_checkable  # type: ignore


# ─── Types ───────────────────────────────────────────────────

Platform = Literal["instagram", "tiktok", "youtube"]


class ProviderError(Exception):
    """Raised when a provider call fails in an expected way (rate-limit, 4xx, timeout).

    The orchestrator treats these as recoverable — it records the failure on
    the circuit breaker and falls through to the next provider. Bugs in our
    own code still raise normal exceptions and surface in Sentry.
    """

    def __init__(self, provider: str, message: str, *, retryable: bool = True) -> None:
        super().__init__(f"[{provider}] {message}")
        self.provider = provider
        self.retryable = retryable


# ─── Canonical data shapes ───────────────────────────────────


@dataclass
class DiscoveryQuery:
    """Input to Layer 1 — what we're hunting for."""

    hashtags: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    platforms: list[Platform] = field(default_factory=lambda: ["instagram", "tiktok"])
    min_followers: int = 5_000
    max_followers: Optional[int] = None
    geo: Optional[str] = None  # ISO-3166-1 alpha-2, e.g. "GB"
    limit: int = 5_000

    def cache_key(self) -> str:
        """Deterministic key for caching same-query results."""
        parts = [
            ",".join(sorted(self.hashtags)),
            ",".join(sorted(self.keywords)),
            ",".join(sorted(self.platforms)),
            str(self.min_followers),
            str(self.max_followers or ""),
            self.geo or "",
            str(self.limit),
        ]
        return "|".join(parts)


@dataclass
class CreatorProfile:
    """Merged profile across all providers. Fields fill in as data arrives."""

    # Identity (always required)
    handle: str
    platform: Platform

    # Basics (Layer 2 — ScrapeCreators)
    display_name: Optional[str] = None
    bio: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    post_count: Optional[int] = None
    avg_engagement_rate: Optional[float] = None
    is_verified: Optional[bool] = None
    is_private: Optional[bool] = None
    profile_url: Optional[str] = None
    avatar_url: Optional[str] = None

    # Audience (Layer 3 — EnsembleData)
    audience_countries: dict[str, float] = field(default_factory=dict)
    audience_age_bands: dict[str, float] = field(default_factory=dict)
    audience_gender: dict[str, float] = field(default_factory=dict)
    authenticity_score: Optional[float] = None  # 0-100

    # Content intelligence (Layer 4 — Apify + Claude)
    recent_posts: list[dict] = field(default_factory=list)
    values_score: Optional[float] = None  # 0-100, our proprietary signal
    values_evidence: list[str] = field(default_factory=list)

    # Provenance (debugging + cache)
    sources: dict[str, datetime] = field(default_factory=dict)

    # ─── Helpers ───

    def merge(self, other: "CreatorProfile") -> "CreatorProfile":
        """Merge `other` into `self`. `other`'s non-empty fields win.

        Used by the orchestrator when two providers enrich the same creator
        (e.g. ScrapeCreators + EnsembleData both populate `follower_count`
        but only ED knows `audience_countries`).
        """
        if other.handle != self.handle or other.platform != self.platform:
            raise ValueError("cannot merge profiles for different (handle, platform)")

        for fname in self.__dataclass_fields__:
            # Identity is immutable; `sources` is merged (not overwritten)
            # below so we both providers' provenance survives.
            if fname in ("handle", "platform", "sources"):
                continue
            new_val = getattr(other, fname)
            if _is_populated(new_val):
                setattr(self, fname, new_val)

        self.sources.update(other.sources)
        return self


def _is_populated(value: Any) -> bool:
    """True if the value carries real data (not None, not empty collection)."""
    if value is None:
        return False
    if isinstance(value, (list, dict, set, tuple, str)) and len(value) == 0:
        return False
    return True


# ─── Protocol ────────────────────────────────────────────────


@runtime_checkable
class CreatorDataProvider(Protocol):
    """Capabilities a creator data vendor may implement.

    A provider only has to implement the methods it's genuinely good at.
    For the ones it can't do well, it should raise `NotImplementedError`
    and the orchestrator will route around it.

    All methods are async so the orchestrator can fan out in parallel.
    """

    name: str  # "scrapecreators", "apify", "ensembledata", "phyllo", ...

    async def discover(self, query: DiscoveryQuery) -> AsyncIterator[CreatorProfile]:
        """Layer 1 — yield candidate profiles (handle + platform at minimum)."""
        ...

    async def enrich_profile(self, handle: str, platform: Platform) -> CreatorProfile:
        """Layer 2 — populate basics (followers, engagement, bio)."""
        ...

    async def enrich_audience(self, handle: str, platform: Platform) -> CreatorProfile:
        """Layer 3 — populate audience demographics + authenticity."""
        ...

    async def fetch_recent_posts(
        self, handle: str, platform: Platform, limit: int = 30
    ) -> list[dict]:
        """Layer 4 — return up to `limit` most recent posts (caption, likes, date)."""
        ...
