"""Creator data providers — bootstrapped stack (Apify + EnsembleData + ScrapeCreators).

The package exposes three specialist providers that can run concurrently and
feed each other through a staged pipeline:

    Layer 1 — Discovery    (Apify + EnsembleData)
    Layer 2 — Filter       (ScrapeCreators, cheap bulk enrichment)
    Layer 3 — Vet          (EnsembleData audience demographics)
    Layer 4 — Intelligence (Apify content + Claude values scorer)

Each provider implements the `CreatorDataProvider` Protocol but only the
methods it is actually good at. The `DiscoveryOrchestrator` picks the right
provider per layer, falls back via `CircuitBreaker` when one is unhealthy,
and caches by (handle, platform) so we never pay the same vendor twice.
"""

from .base import (
    CreatorDataProvider,
    CreatorProfile,
    DiscoveryQuery,
    Platform,
    ProviderError,
)
from .circuit import CircuitBreaker

__all__ = [
    "CreatorDataProvider",
    "CreatorProfile",
    "DiscoveryQuery",
    "Platform",
    "ProviderError",
    "CircuitBreaker",
]
