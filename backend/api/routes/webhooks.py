"""Webhook handlers for email delivery events and inbound replies."""

import logging
from fastapi import APIRouter, Request

from backend.db.repositories.email_event_repo import create_event, lookup_by_email_id

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhooks"])


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
    try:
        body = await request.json()
    except Exception:
        return {"error": "Invalid JSON"}

    event_type_raw = body.get("type", "")
    data = body.get("data", {})
    email_id = data.get("email_id", "")

    if not event_type_raw or not email_id:
        logger.warning("Resend webhook missing type or email_id: %s", body)
        return {"ok": True, "skipped": True}

    # Normalize: "email.delivered" -> "delivered"
    event_type = event_type_raw.replace("email.", "")

    # Recipient
    to_list = data.get("to", [])
    recipient = to_list[0] if to_list else ""

    # Look up campaign/creator from our sent events
    lookup = lookup_by_email_id(email_id)
    campaign_id = lookup.get("campaign_id", "") if lookup else ""
    creator_id = lookup.get("creator_id", "") if lookup else ""

    # Store the event
    event_id = create_event(
        email_id=email_id,
        event_type=event_type,
        recipient=recipient,
        campaign_id=campaign_id,
        creator_id=creator_id,
    )

    logger.info(
        "Resend webhook: %s for email_id=%s, campaign=%s, creator=%s",
        event_type, email_id, campaign_id, creator_id,
    )

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
    status update (contacted → responded).
    """
    try:
        body = await request.json()
    except Exception:
        return {"error": "Invalid JSON"}

    # ── Extract fields from various webhook formats ──

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
        headers = body.get("headers", {})
        if isinstance(headers, dict):
            message_id = headers.get("in-reply-to", "") or headers.get("message-id", "")
        elif isinstance(headers, list):
            for h in headers:
                name = (h.get("name") or "").lower()
                if name == "in-reply-to":
                    message_id = h.get("value", "")
                    break

    timestamp = body.get("timestamp") or body.get("created_at") or ""

    if not from_email or not reply_body:
        logger.warning("Inbound webhook missing from_email or body: keys=%s", list(body.keys()))
        return {"ok": True, "skipped": True, "reason": "Missing from_email or body"}

    # ── Route through response_router ──

    try:
        from services.response_router import ingest_response

        result = ingest_response(
            body=reply_body,
            message_id=message_id if message_id else None,
            from_email=from_email,
            timestamp=timestamp if timestamp else None,
        )

        if result.get("success"):
            logger.info(
                "Inbound reply routed: from=%s, campaign=%s, creator=%s",
                from_email,
                result.get("campaign_id"),
                result.get("creator_id"),
            )
            return {
                "ok": True,
                "campaign_id": result.get("campaign_id"),
                "creator_id": result.get("creator_id"),
                "status": "responded",
            }
        else:
            logger.warning(
                "Inbound reply could not be routed: from=%s, error=%s",
                from_email,
                result.get("error"),
            )
            return {"ok": True, "routed": False, "reason": result.get("error")}

    except Exception as e:
        logger.exception("Error processing inbound reply from %s: %s", from_email, e)
        return {"ok": True, "routed": False, "reason": str(e)}
