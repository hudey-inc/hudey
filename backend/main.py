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


@app.get("/debug/token")
def debug_token(authorization: str = ""):
    """Temporary debug: test the exact same auth flow as deps.py."""
    import traceback

    token = authorization.replace("Bearer ", "") if authorization else ""
    if not token:
        return {"error": "No token. Pass ?authorization=Bearer+<token>"}

    results = {}

    # Test the actual get_current_user code path
    try:
        from backend.auth.deps import get_current_user, _verify_es256, _get_ec_public_key
        import json
        import base64

        # Decode header
        header_b64 = token.split(".")[0]
        header_b64 += "=" * (4 - len(header_b64) % 4)
        header = json.loads(base64.urlsafe_b64decode(header_b64))
        results["header"] = header

        kid = header.get("kid")
        results["kid"] = kid

        # Test key retrieval
        try:
            pk = _get_ec_public_key(kid)
            results["public_key_type"] = str(type(pk))
            results["public_key_retrieved"] = pk is not None
        except Exception as e:
            results["key_error"] = f"{type(e).__name__}: {e}"
            results["key_traceback"] = traceback.format_exc()

        # Test full ES256 verification
        try:
            payload = _verify_es256(token, header)
            results["es256_validation"] = "SUCCESS"
            results["email"] = payload.get("email")
        except Exception as e:
            results["es256_error"] = f"{type(e).__name__}: {e}"
            results["es256_traceback"] = traceback.format_exc()

        # Test DB
        try:
            from backend.db.client import get_supabase
            sb = get_supabase()
            results["db_connected"] = sb is not None
        except Exception as e:
            results["db_error"] = str(e)

        # Test brand resolver
        if results.get("es256_validation") == "SUCCESS":
            try:
                from backend.auth.brand_resolver import get_or_create_brand
                payload = results.get("_payload", {})
                brand = get_or_create_brand(
                    results.get("email", "").split("@")[0],  # dummy
                    results.get("email", "")
                )
                results["brand"] = {"found": brand is not None, "id": brand.get("id") if brand else None}
            except Exception as e:
                results["brand_error"] = f"{type(e).__name__}: {e}"

    except Exception as e:
        results["error"] = f"{type(e).__name__}: {e}"
        results["traceback"] = traceback.format_exc()

    return results
