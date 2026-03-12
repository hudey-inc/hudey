"""In-memory TTL cache for expensive API calls (InsightIQ, etc.).

Zero Supabase cost — trades cheap RAM for expensive API calls.
Thread-safe for use with the background campaign worker.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


class TTLCache:
    """Thread-safe in-memory cache with per-key TTL and LRU eviction."""

    def __init__(self, default_ttl: int = 3600, max_size: int = 500) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Retrieve a cached value. Returns None on miss or expiry."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None
            expires_at, value = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                self._misses += 1
                return None
            self._hits += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store a value with TTL (seconds). Evicts expired/oldest if full."""
        with self._lock:
            if len(self._store) >= self._max_size:
                self._evict_expired()
            # Still full — drop the entry closest to expiry
            if len(self._store) >= self._max_size:
                oldest = min(self._store, key=lambda k: self._store[k][0])
                del self._store[oldest]
            expires_at = time.monotonic() + (ttl or self._default_ttl)
            self._store[key] = (expires_at, value)

    def invalidate(self, key: str) -> None:
        """Remove a specific key."""
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Flush the entire cache."""
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    def _evict_expired(self) -> None:
        """Remove all expired entries (must hold lock)."""
        now = time.monotonic()
        expired = [k for k, (exp, _) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]

    def stats(self) -> dict:
        """Return cache health metrics."""
        with self._lock:
            now = time.monotonic()
            active = sum(1 for _, (exp, _) in self._store.items() if now <= exp)
            total = self._hits + self._misses
            return {
                "entries": active,
                "max_size": self._max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(self._hits / total, 2) if total > 0 else 0,
            }


def cache_key(*args: Any, **kwargs: Any) -> str:
    """Generate a deterministic cache key from arguments."""
    raw = json.dumps({"a": args, "k": kwargs}, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ── Shared cache instances ───────────────────────────────────

# Search results: 1 hour TTL, 200 slots
# Same search params → same InsightIQ results (creators don't change that fast)
search_cache = TTLCache(default_ttl=3600, max_size=200)

# Creator content/posts: 2 hour TTL, 500 slots
# Posts are fairly stable; avoids hammering InsightIQ per profile view
content_cache = TTLCache(default_ttl=7200, max_size=500)
