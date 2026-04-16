"""Per-provider circuit breaker.

Any of the bootstrapped providers (Apify, EnsembleData, ScrapeCreators) can
have a bad hour — actor broken, rate-limit spike, upstream outage. Wrapping
each in a circuit breaker prevents cascading failures through the pipeline:

- After N consecutive failures the breaker opens.
- While open, calls short-circuit (raise immediately) instead of burning
  request budget on a provider we already know is down.
- After a cool-down window the breaker transitions to "half-open" and lets
  the next call through. If it succeeds → closed; if it fails → opens again.

The orchestrator checks `is_open()` before dispatching and picks a fallback
provider when the primary is in timeout.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreaker:
    """Simple 3-state circuit breaker. Thread-safe."""

    name: str
    failure_threshold: int = 5
    reset_seconds: int = 300  # 5 min cooldown
    _fail_count: int = 0
    _opened_at: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def is_open(self) -> bool:
        """True if the breaker is currently blocking calls.

        Automatically transitions open → half-open when the cooldown
        expires (half-open is implicit: `_fail_count` gets reset so the
        next `record_failure` call restarts the trip sequence).
        """
        with self._lock:
            if self._fail_count < self.failure_threshold:
                return False
            if time.monotonic() - self._opened_at > self.reset_seconds:
                logger.info(
                    "circuit[%s]: cooldown elapsed, entering half-open",
                    self.name,
                )
                self._fail_count = 0
                self._opened_at = 0.0
                return False
            return True

    def record_failure(self) -> None:
        """Called by the orchestrator after a provider raises ProviderError."""
        with self._lock:
            self._fail_count += 1
            if self._fail_count == self.failure_threshold:
                self._opened_at = time.monotonic()
                logger.warning(
                    "circuit[%s]: opened after %d consecutive failures "
                    "(cooldown=%ds)",
                    self.name, self._fail_count, self.reset_seconds,
                )

    def record_success(self) -> None:
        """Called by the orchestrator after a successful provider call."""
        with self._lock:
            if self._fail_count > 0:
                logger.info("circuit[%s]: recovered, resetting", self.name)
            self._fail_count = 0
            self._opened_at = 0.0

    def status(self) -> dict:
        """Health snapshot for /health or metrics."""
        with self._lock:
            return {
                "name": self.name,
                "open": self._fail_count >= self.failure_threshold,
                "failures": self._fail_count,
                "threshold": self.failure_threshold,
            }
