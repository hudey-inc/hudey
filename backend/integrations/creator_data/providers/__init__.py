"""Concrete creator-data providers. Each is optional (keyed by env vars).

Imports are deferred (via attribute access below) so a broken/unavailable
provider module doesn't block the others from loading.
"""

from typing import Any


def __getattr__(name: str) -> Any:
    if name == "ScrapeCreatorsProvider":
        from .scrapecreators import ScrapeCreatorsProvider
        return ScrapeCreatorsProvider
    if name == "EnsembleDataProvider":
        from .ensembledata import EnsembleDataProvider
        return EnsembleDataProvider
    if name == "ApifyProvider":
        from .apify import ApifyProvider
        return ApifyProvider
    raise AttributeError(f"module '{__name__}' has no attribute {name!r}")


__all__ = ["ApifyProvider", "EnsembleDataProvider", "ScrapeCreatorsProvider"]
