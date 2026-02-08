"""Resend email delivery webhook handler."""

import logging
from fastapi import APIRouter, Request

from backend.db.repositories.email_event_repo import create_event, lookup_by_email_id

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhooks"])


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
