"""FastAPI application - campaigns, approvals/webhooks, health."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import approvals, campaigns, webhooks

app = FastAPI(title="Hudey API")

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
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    return {
        "status": "ok",
        "jwt_configured": bool(jwt_secret),
        "jwt_length": len(jwt_secret),
    }
