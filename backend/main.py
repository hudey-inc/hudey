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
    """Temporary debug endpoint — decode JWT without validation to inspect claims.
    Remove this endpoint after debugging is complete.
    """
    import base64
    import json

    from fastapi import Header

    token = authorization.replace("Bearer ", "") if authorization else ""
    if not token:
        return {"error": "No token provided. Pass Authorization header."}

    # Decode header and payload without signature verification
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {"error": f"Token has {len(parts)} parts, expected 3"}

        # Decode header
        header_b64 = parts[0] + "=" * (4 - len(parts[0]) % 4)
        header = json.loads(base64.urlsafe_b64decode(header_b64))

        # Decode payload
        payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))

        # Try validating with each secret variant
        from jose import jwt as jose_jwt, JWTError
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

        validation_results = []
        for label, key in [("raw", jwt_secret)]:
            try:
                jose_jwt.decode(token, key, algorithms=["HS256"], audience="authenticated")
                validation_results.append({"key": label, "result": "SUCCESS"})
            except JWTError as e:
                validation_results.append({"key": label, "result": str(e)})

        # Also try base64-decoded
        try:
            decoded_secret = base64.b64decode(jwt_secret).decode("utf-8")
            try:
                jose_jwt.decode(token, decoded_secret, algorithms=["HS256"], audience="authenticated")
                validation_results.append({"key": "base64_decoded", "result": "SUCCESS"})
            except JWTError as e:
                validation_results.append({"key": "base64_decoded", "result": str(e)})
        except Exception as e:
            validation_results.append({"key": "base64_decoded", "result": f"decode error: {e}"})

        # Try without audience check
        for label, key in [("raw_no_aud", jwt_secret)]:
            try:
                jose_jwt.decode(token, key, algorithms=["HS256"], options={"verify_aud": False})
                validation_results.append({"key": label, "result": "SUCCESS"})
            except JWTError as e:
                validation_results.append({"key": label, "result": str(e)})

        return {
            "header": header,
            "payload": {k: v for k, v in payload.items() if k != "sub"},  # hide user id
            "secret_first_4": jwt_secret[:4] + "..." if jwt_secret else "NOT SET",
            "validation": validation_results,
        }
    except Exception as e:
        return {"error": str(e)}
