"""Rate limiting middleware using slowapi.

Limits are per-user (via JWT sub claim) for authenticated routes,
and per-IP for unauthenticated routes like webhooks.

Tiers:
- Default: 60/minute per user
- Search / brand-fit: 10/minute (expensive upstream API calls)
- Webhooks: 30/minute per IP
"""

from __future__ import annotations

import logging

from fastapi import Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


def _get_user_or_ip(request: Request) -> str:
    """Extract user id from JWT for authenticated routes, fall back to IP.

    We only *decode* the JWT payload here (no signature verification) — the
    route itself validates the token properly via `get_current_user`. This is
    purely for picking a rate-limit bucket.

    Malformed tokens fall through to IP-based limiting. We log at DEBUG so
    noisy client bugs don't spam production logs, but the failure isn't
    silent if you need to investigate.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return get_remote_address(request)

    token = auth[7:]
    try:
        import base64
        import binascii
        import json

        parts = token.split(".")
        if len(parts) < 2:
            raise ValueError("JWT must have at least header.payload")
        payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        sub = payload.get("sub")
        if sub:
            return f"user:{sub}"
        logger.debug("Rate-limit key: bearer token has no sub claim; falling back to IP")
    except (ValueError, binascii.Error, json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.debug("Rate-limit key: malformed bearer token (%s); falling back to IP", e)
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip)

# Re-usable decorators for different tiers
default_limit = limiter.limit("60/minute")
search_limit = limiter.limit("10/minute")
webhook_limit = limiter.limit("30/minute")


async def rate_limit_exceeded_handler(
    request: Request,
    exc: RateLimitExceeded,
) -> JSONResponse:
    """Return a clean 429 with Retry-After header."""
    retry_after = getattr(exc, "retry_after", 60)
    logger.warning(
        "Rate limit exceeded: %s %s (key=%s)",
        request.method,
        request.url.path,
        _get_user_or_ip(request),
    )
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded. Try again in {retry_after} seconds."},
        headers={"Retry-After": str(retry_after)},
    )
