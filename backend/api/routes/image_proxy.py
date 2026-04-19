"""Thin image proxy for creator avatars.

Why:
    Instagram / TikTok / YouTube profile-pic CDN URLs refuse cross-origin
    browser loads without platform cookies. When Apify returns us a
    ``profilePicUrl`` the URL is valid server-side but 403s in the browser,
    so avatars fall through to letter placeholders.

    Proxying the fetch through our own domain strips the cross-origin
    constraint. The backend holds the connection to Instagram, streams
    the bytes back, and sets cache headers so the browser re-uses the
    image instead of hitting us every paint.

Safety:
    This is a classic "open proxy" attack target if we don't constrain
    what URLs can be fetched. We allow-list a small set of known CDN
    hosts (Instagram, TikTok, YouTube, unavatar) and reject anything
    else outright.
"""

from __future__ import annotations

import logging
from typing import Optional
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query, Response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/image", tags=["image-proxy"])

# Allow-list of hosts we'll proxy. Kept narrow — anyone who wants to proxy
# from a new CDN needs an explicit code change, not just a request param.
_ALLOWED_HOST_SUFFIXES = (
    "cdninstagram.com",
    "fbcdn.net",
    "instagram.com",
    "tiktokcdn.com",
    "tiktokcdn-us.com",
    "ttwstatic.com",
    "ytimg.com",
    "ggpht.com",
    "googleusercontent.com",
    "unavatar.io",
)

# How long the browser can cache proxied images. Profile pics change rarely.
_BROWSER_CACHE_SECS = 60 * 60 * 6  # 6 hours

# Cap request size. A profile pic shouldn't exceed a few hundred KB; anything
# bigger is either an attack or an honest mistake we'd rather reject.
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB

_HTTP_TIMEOUT = 15.0


def _is_allowed(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    return any(host == s or host.endswith("." + s) for s in _ALLOWED_HOST_SUFFIXES)


@router.get("/proxy")
async def proxy_image(url: str = Query(..., description="Absolute image URL to proxy")):
    """Fetch ``url`` server-side and stream the bytes back to the browser.

    - Only hosts in the allow-list are proxied; everything else → 400.
    - Non-2xx from the upstream → that status is returned to the browser.
    - Response is cached in the browser for 6 hours so we're not hit again
      on every re-render.
    """
    if not _is_allowed(url):
        raise HTTPException(status_code=400, detail="URL host not allowed")

    # The vendor CDNs often reject empty / generic user-agents. Pretend to
    # be a normal browser so Instagram doesn't block us outright.
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(
            timeout=_HTTP_TIMEOUT,
            follow_redirects=True,
        ) as client:
            r = await client.get(url, headers=headers)
    except httpx.HTTPError as e:
        logger.info("image-proxy network error for %s: %s", url, e)
        raise HTTPException(status_code=502, detail="upstream fetch failed") from e

    if r.status_code >= 400:
        # Don't echo the upstream body — it's often HTML or a redirect page.
        raise HTTPException(status_code=r.status_code, detail="upstream returned error")

    # Guard against absurdly large responses. Most profile pics are <200 KB.
    content = r.content
    if len(content) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="image too large")

    content_type = r.headers.get("content-type", "image/jpeg")
    # Reject non-image content types so we can't be tricked into serving HTML.
    if not content_type.lower().startswith("image/"):
        raise HTTPException(status_code=415, detail="upstream did not return an image")

    return Response(
        content=content,
        media_type=content_type,
        headers={
            # Public cache — these URLs aren't user-specific.
            "Cache-Control": f"public, max-age={_BROWSER_CACHE_SECS}, s-maxage={_BROWSER_CACHE_SECS}",
        },
    )
