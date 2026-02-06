"""FastAPI application - campaigns, approvals/webhooks, health."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import approvals, campaigns

app = FastAPI(title="Hudey API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(approvals.router)


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}
