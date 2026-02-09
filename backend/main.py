"""FastAPI application - campaigns, approvals/webhooks, health."""

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes import approvals, campaigns, webhooks

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Hudey API")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all: log and return JSON instead of bare 500."""
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal error: {type(exc).__name__}: {exc}"},
    )

# CORS: allow frontend origin (restrict in production)
_origins = [
    "http://localhost:3000",
    "https://app.hudey.co",
]
_frontend_url = (os.getenv("FRONTEND_URL") or "").strip()
if _frontend_url and _frontend_url not in _origins:
    _origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(approvals.router)
app.include_router(campaigns.router)
app.include_router(webhooks.router)


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}
