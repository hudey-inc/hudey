"""Webhook handlers for email delivery events and inbound replies.

Includes Resend/Svix signature verification, idempotency checks,
proper HTTP status codes, and audit logging.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import time

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.db.repositories.email_event_repo import (
    create_event,
    event_exists,
    inbound_reply_exists,
    log_webhook,
    lookup_by_email_id,
    record_inbound_reply,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhooks"])

# Maximum age for webhook timestamps (replay protection)
_MAX_TIMESTAMP_AGE_SECONDS = 300  # 5 minutes


# ── Helpers ──────────────────────────────────────────────────────


def _verify_resend_signature(body_bytes: bytes, headers: dict) -> bool:
    """Verify Resend (Svix) webhook signature.

    If RESEND_WEBHOOK_SECRET is not configured, logs a warning and
    returns True (dev-mode pass-through).

    Signing scheme:
        payload  = "{webhook-id}.{webhook-timestamp}.{body}"
        sig      = HMAC-SHA256(base64_decode(secret), payload)
        header   = "v1,{base64(sig)}"
    """
    secret = (os.getenv("RESEND_WEBHOOK_SECRET") or "").strip()
    if not secret:
        logger.warning("RESEND_WEBHOOK_SECRET not set — skipping signature verification")
        return True

    webhook_id = headers.get("webhook-id", "")
    timestamp = headers.get("webhook-timestamp", "")
    signature_header = headers.get("webhook-signature", "")

    if not webhook_id or not timestamp or not signature_header:
        logger.warning("Missing Svix headers for signature verification")
        return False

    # Replay protection: reject timestamps older than 5 minutes
    try:
        ts = int(timestamp)
        now = int(time.time())
        if abs(now - ts) > _MAX_TIMESTAMP_AGE_SECONDS:
            logger.warning(
                "Webhook timestamp too old: %s (now=%s, diff=%ss)",
                timestamp, now, abs(now - ts),
            )
            return False
    except (ValueError, TypeError):
        logger.warning("Invalid webhook timestamp: %s", timestamp)
        return False

    # Strip "whsec_" prefix if present
    if secret.startswith("whsec_"):
        secret = secret[6:]

    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        logger.error("Failed to base64-decode RESEND_WEBHOOK_SECRET")
        return False

    # Construct signing payload
    body_str = body_bytes.decode("utf-8")
    payload = f"{webhook_id}.{timestamp}.{body_str}"
    expected_sig = base64.b64encode(
        hmac.new(secret_bytes, payload.encode("utf-8"), hashlib.sha256).digest()
    ).decode("utf-8")

    # Header may contain multiple signatures: "v1,sig1 v1,sig2"
    signatures = signature_header.split(" ")
    for sig in signatures:
        if sig.startswith("v1,"):
            raw_sig = sig[3:]
            if hmac.compare_digest(expected_sig, raw_sig):
                return True

    logger.warning("Webhook signature mismatch")
    return False


def _compute_inbound_dedup_key(
    from_email: str,
    body: str,
    message_id: str,
) -> str:
    """Compute a deduplication key for an inbound reply.

    Uses message_id if available, otherwise SHA-256 hash of from+body.
    """
    if message_id:
        return f"msgid:{message_id}"
    content = f"{from_email}:{body}"
    h = hashlib.sha256(content.encode("utf-8")).hexdigest()[:32]
    return f"hash:{h}"


def _svix_headers_present(headers: dict) -> bool:
    """Check if Svix signing headers are present (i.e. request is from Resend)."""
    return bool(
        headers.get("webhook-id")
        and headers.get("webhook-timestamp")
        and headers.get("webhook-signature")
    )


# ── Resend Delivery Events ───────────────────────────────────────


@router.post("/webhooks/resend")
async def resend_webhook(request: Request):
    """Handle Resend delivery event webhooks.

    Resend sends events like:
    {
        "type": "email.delivered",
        "created_at": "2024-01-01T00:00:00.000Z",
        "data": {
            "email_id": "...",
            "to": ["creator@example.com"],
            ...
        }
    }

    Event types: email.sent, email.delivered, email.delivery_delayed,
    email.opened, email.clicked, email.bounced, email.complained
    """
    body_bytes = await request.body()
    headers = dict(request.headers)
    webhook_id = headers.get("webhook-id", "")

    # 1. Verify signature
    if not _verify_resend_signature(body_bytes, headers):
        log_webhook("resend", webhook_id, body_bytes, 400, "bad_sig")
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})

    # 2. Parse JSON
    try:
        body = json.loads(body_bytes)
    except Exception:
        log_webhook("resend", webhook_id, body_bytes, 400, "bad_json")
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    # 3. Extract fields
    event_type_raw = body.get("type", "")
    data = body.get("data", {})
    email_id = data.get("email_id", "")

    if not event_type_raw or not email_id:
        logger.warning("Resend webhook missing type or email_id: %s", body)
        log_webhook("resend", webhook_id, body_bytes, 400, "missing_fields")
        return JSONResponse(
            status_code=400,
            content={"error": "Missing type or email_id"},
        )

    # Normalize: "email.delivered" -> "delivered"
    event_type = event_type_raw.replace("email.", "")

    # 4. Idempotency check
    if event_exists(email_id, event_type):
        logger.info("Duplicate resend event: %s/%s", email_id, event_type)
        log_webhook("resend", webhook_id, body_bytes, 200, "duplicate")
        return {"ok": True, "duplicate": True}

    # 5. Recipient
    to_list = data.get("to", [])
    recipient = to_list[0] if to_list else ""

    # Look up campaign/creator from our sent events
    lookup = lookup_by_email_id(email_id)
    campaign_id = lookup.get("campaign_id", "") if lookup else ""
    creator_id = lookup.get("creator_id", "") if lookup else ""

    # 6. Store the event
    event_id = create_event(
        email_id=email_id,
        event_type=event_type,
        recipient=recipient,
        campaign_id=campaign_id,
        creator_id=creator_id,
    )

    if not event_id:
        logger.error(
            "Failed to insert resend event: %s/%s",
            email_id, event_type,
        )
        log_webhook("resend", webhook_id, body_bytes, 500, "insert_failed")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to store event"},
        )

    logger.info(
        "Resend webhook: %s for email_id=%s, campaign=%s, creator=%s",
        event_type, email_id, campaign_id, creator_id,
    )

    log_webhook("resend", webhook_id, body_bytes, 200, "ok")
    return {"ok": True, "event_id": event_id}


# ── Inbound Email Replies ────────────────────────────────────────


@router.post("/webhooks/inbound")
async def inbound_email_webhook(request: Request):
    """Handle inbound email replies from creators.

    Accepts multiple payload formats:

    1. Resend Inbound Webhook:
       { "from": "creator@example.com", "to": "...", "subject": "...",
         "text": "...", "html": "...", "headers": {...} }

    2. Generic / forwarded:
       { "from_email": "creator@example.com", "body": "...",
         "message_id": "optional-in-reply-to", "timestamp": "..." }

    3. Instantly.ai webhook:
       { "event_type": "reply_received", "from_address": "...",
         "reply_body": "...", "in_reply_to": "...", "timestamp": "..." }

    Routes the reply through response_router.ingest_response() which
    handles campaign/creator resolution, message history append, and
    status update (contacted -> responded).
    """
    body_bytes = await request.body()
    headers = dict(request.headers)
    webhook_id = headers.get("webhook-id", "")

    # 1. Verify signature only if Svix headers are present (Resend-sourced)
    if _svix_headers_present(headers):
        if not _verify_resend_signature(body_bytes, headers):
            log_webhook("inbound", webhook_id, body_bytes, 400, "bad_sig")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid signature"},
            )

    # 2. Parse JSON
    try:
        body = json.loads(body_bytes)
    except Exception:
        log_webhook("inbound", webhook_id, body_bytes, 400, "bad_json")
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    # 3. Extract fields from various webhook formats
    from_email = (
        body.get("from_email")
        or body.get("from")
        or body.get("from_address")
        or ""
    )
    # Resend "from" can be "Name <email>" — extract just the email
    if "<" in from_email and ">" in from_email:
        from_email = from_email.split("<")[1].split(">")[0]
    from_email = from_email.strip().lower()

    reply_body = (
        body.get("body")
        or body.get("text")
        or body.get("reply_body")
        or ""
    ).strip()

    # Message ID for thread correlation
    message_id = (
        body.get("message_id")
        or body.get("in_reply_to")
        or ""
    )
    # Resend may provide message_id in headers
    if not message_id:
        payload_headers = body.get("headers", {})
        if isinstance(payload_headers, dict):
            message_id = (
                payload_headers.get("in-reply-to", "")
                or payload_headers.get("message-id", "")
            )
        elif isinstance(payload_headers, list):
            for h in payload_headers:
                name = (h.get("name") or "").lower()
                if name == "in-reply-to":
                    message_id = h.get("value", "")
                    break

    timestamp = body.get("timestamp") or body.get("created_at") or ""

    # 4. Validate required fields
    if not from_email or not reply_body:
        logger.warning(
            "Inbound webhook missing from_email or body: keys=%s",
            list(body.keys()),
        )
        log_webhook("inbound", webhook_id, body_bytes, 400, "missing_fields")
        return JSONResponse(
            status_code=400,
            content={"error": "Missing from_email or body"},
        )

    # 5. Deduplication check
    dedup_key = _compute_inbound_dedup_key(from_email, reply_body, message_id)
    if inbound_reply_exists(dedup_key):
        logger.info("Duplicate inbound reply: %s", dedup_key)
        log_webhook("inbound", webhook_id, body_bytes, 200, "duplicate")
        return {"ok": True, "duplicate": True}

    # 6. Route through response_router
    try:
        from services.response_router import ingest_response

        result = ingest_response(
            body=reply_body,
            message_id=message_id if message_id else None,
            from_email=from_email,
            timestamp=timestamp if timestamp else None,
        )

        if result.get("success"):
            # Record dedup key only after successful processing
            record_inbound_reply(dedup_key, from_email)

            logger.info(
                "Inbound reply routed: from=%s, campaign=%s, creator=%s",
                from_email,
                result.get("campaign_id"),
                result.get("creator_id"),
            )
            log_webhook("inbound", webhook_id, body_bytes, 200, "ok")
            return {
                "ok": True,
                "campaign_id": result.get("campaign_id"),
                "creator_id": result.get("creator_id"),
                "status": "responded",
            }
        else:
            # Routing failure is not retryable (e.g. unknown sender)
            logger.warning(
                "Inbound reply could not be routed: from=%s, error=%s",
                from_email,
                result.get("error"),
            )
            log_webhook("inbound", webhook_id, body_bytes, 200, "no_route")
            return {"ok": True, "routed": False, "reason": result.get("error")}

    except Exception as e:
        logger.exception("Error processing inbound reply from %s: %s", from_email, e)
        log_webhook("inbound", webhook_id, body_bytes, 500, f"error:{type(e).__name__}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal processing error"},
        )
