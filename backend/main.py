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
    """Temporary debug: test the full ES256 JWKS validation flow."""
    token = authorization.replace("Bearer ", "") if authorization else ""
    if not token:
        return {"error": "No token. Pass ?authorization=Bearer+<token>"}

    import traceback
    from jose import jwt as jose_jwt, JWTError, jwk
    import requests as req

    results = {}

    # Step 1: decode header
    try:
        header = jose_jwt.get_unverified_header(token)
        results["header"] = header
    except Exception as e:
        return {"error": f"Cannot decode header: {e}"}

    # Step 2: fetch JWKS
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    results["supabase_url_set"] = bool(supabase_url)
    if not supabase_url:
        return {**results, "error": "SUPABASE_URL not set"}

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = req.get(jwks_url, timeout=10)
        jwks_data = resp.json()
        results["jwks_keys_count"] = len(jwks_data.get("keys", []))
        results["jwks_kids"] = [k.get("kid") for k in jwks_data.get("keys", [])]
    except Exception as e:
        return {**results, "error": f"JWKS fetch failed: {e}"}

    # Step 3: find matching key
    kid = header.get("kid")
    key_data = None
    for k in jwks_data.get("keys", []):
        if k.get("kid") == kid:
            key_data = k
            break
    results["kid_match"] = key_data is not None
    if not key_data:
        return {**results, "error": f"No key matching kid={kid}"}

    # Step 4: construct key and verify
    try:
        public_key = jwk.construct(key_data, algorithm="ES256")
        results["key_constructed"] = True
    except Exception as e:
        return {**results, "error": f"Key construction failed: {e}", "traceback": traceback.format_exc()}

    try:
        payload = jose_jwt.decode(token, public_key, algorithms=["ES256"], audience="authenticated")
        results["validation"] = "SUCCESS"
        results["email"] = payload.get("email")
        results["role"] = payload.get("role")
    except Exception as e:
        results["validation"] = f"FAILED: {e}"
        results["traceback"] = traceback.format_exc()

    # Step 5: check DB
    try:
        from backend.db.client import get_supabase
        sb = get_supabase()
        results["db_connected"] = sb is not None
        results["supabase_service_key_set"] = bool(os.getenv("SUPABASE_SERVICE_KEY", "").strip())
    except Exception as e:
        results["db_error"] = str(e)

    return results
