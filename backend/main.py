"""FastAPI application - campaigns, approvals/webhooks, health."""

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes import analytics, approvals, brands, campaigns, creators, notifications, paddle_webhooks, templates, webhooks

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

app.include_router(analytics.router)
app.include_router(approvals.router)
app.include_router(brands.router)
app.include_router(campaigns.router)
app.include_router(creators.router)
app.include_router(notifications.router)
app.include_router(paddle_webhooks.router)
app.include_router(templates.router)
app.include_router(webhooks.router)


@app.on_event("startup")
def _start_campaign_worker():
    """Launch the background campaign worker on server startup.

    The worker polls the campaign_jobs table and executes queued campaigns.
    On startup it also recovers any jobs that were in-flight when the
    previous server instance shut down (e.g. Railway redeploy).
    """
    try:
        from backend.worker import start_worker
        start_worker()
        logger.info("Campaign worker started")
    except Exception as e:
        logger.warning("Failed to start campaign worker: %s", e)


@app.on_event("shutdown")
def _stop_campaign_worker():
    """Gracefully stop the campaign worker."""
    try:
        from backend.worker import stop_worker
        stop_worker()
    except Exception:
        pass


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}
