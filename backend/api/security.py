"""Security middleware — block malicious probes and sanitize requests.

Catches common injection patterns (SQL, OS command, XSS) early in the
request pipeline and returns 400 before they reach any business logic.
"""

import logging
import re
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# ── Patterns that should NEVER appear in legitimate request data ──

_INJECTION_PATTERNS = re.compile(
    r"|".join([
        # SQL injection probes
        r"WAITFOR\s+DELAY",
        r";\s*DROP\s+TABLE",
        r";\s*DELETE\s+FROM",
        r"UNION\s+SELECT",
        r"OR\s+1\s*=\s*1",
        r"'\s*OR\s+'",
        r"--\s*$",
        # OS command injection
        r"/etc/passwd",
        r"/etc/shadow",
        r"cmd\.exe",
        r"powershell",
        r"%SYSTEMROOT%",
        r"\bget-help\b",
        r"\|\s*cat\s",
        r";\s*cat\s",
        r"\|\s*type\s",
        r";\s*type\s",
        r"\$\(.*\)",
        r"`[^`]*`",
        # Path traversal
        r"\.\./\.\./",
        r"\.\.\\\.\.\\",
        # XSS probes
        r"<script[\s>]",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*=",
    ]),
    re.IGNORECASE,
)

# Max body size: 1 MB (prevents abuse via oversized payloads)
_MAX_BODY_SIZE = 1_048_576


class SecurityMiddleware(BaseHTTPMiddleware):
    """Reject requests containing injection payloads."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # ── Check URL path + query string ──
        raw_url = str(request.url)
        if _INJECTION_PATTERNS.search(raw_url):
            logger.warning(
                "Blocked malicious URL: %s %s from %s",
                request.method, request.url.path, request.client.host if request.client else "unknown",
            )
            return JSONResponse(
                status_code=400,
                content={"detail": "Bad request"},
            )

        # ── Check request body (POST/PUT/PATCH only) ──
        if request.method in ("POST", "PUT", "PATCH"):
            # Enforce max body size
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > _MAX_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request body too large"},
                )

            # Read and scan body
            try:
                body = await request.body()
                if body and _INJECTION_PATTERNS.search(body.decode("utf-8", errors="ignore")):
                    logger.warning(
                        "Blocked malicious body: %s %s from %s",
                        request.method, request.url.path,
                        request.client.host if request.client else "unknown",
                    )
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Bad request"},
                    )
            except Exception:
                pass  # If we can't read the body, let downstream handle it

        return await call_next(request)
