"""Paddle webhook handler for payment events.

Verifies Paddle-Signature header using HMAC-SHA256, then updates
campaign payment status on transaction.completed events.
"""

import hashlib
import hmac
import json
import logging
import os
import time

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.db.repositories.campaign_repo import get_campaign, update_campaign

logger = logging.getLogger(__name__)
router = APIRouter(tags=["paddle-webhooks"])

# Maximum age for webhook timestamps (replay protection)
_MAX_TIMESTAMP_AGE_SECONDS = 300  # 5 minutes


def _verify_paddle_signature(body_bytes: bytes, signature_header: str) -> bool:
    """Verify Paddle webhook signature.

    Paddle-Signature header format: ts=<timestamp>;h1=<hash>
    Signed payload: timestamp + ":" + raw body
    Hash: HMAC-SHA256(secret, payload)
    """
    secret = (os.getenv("PADDLE_WEBHOOK_SECRET") or "").strip()
    if not secret:
        logger.warning("PADDLE_WEBHOOK_SECRET not set — skipping signature verification")
        return True

    if not signature_header:
        logger.warning("Missing Paddle-Signature header")
        return False

    # Parse ts and h1 from header
    parts = {}
    for part in signature_header.split(";"):
        if "=" in part:
            key, value = part.split("=", 1)
            parts[key.strip()] = value.strip()

    ts = parts.get("ts", "")
    h1 = parts.get("h1", "")

    if not ts or not h1:
        logger.warning("Paddle-Signature missing ts or h1: %s", signature_header)
        return False

    # Replay protection
    try:
        ts_int = int(ts)
        now = int(time.time())
        if abs(now - ts_int) > _MAX_TIMESTAMP_AGE_SECONDS:
            logger.warning(
                "Paddle webhook timestamp too old: %s (now=%s, diff=%ss)",
                ts, now, abs(now - ts_int),
            )
            return False
    except (ValueError, TypeError):
        logger.warning("Invalid Paddle webhook timestamp: %s", ts)
        return False

    # Compute expected signature
    body_str = body_bytes.decode("utf-8")
    payload = ts + ":" + body_str
    expected = hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if hmac.compare_digest(expected, h1):
        return True

    logger.warning("Paddle webhook signature mismatch")
    return False


@router.post("/webhooks/paddle")
async def paddle_webhook(request: Request):
    """Handle Paddle webhook events.

    Primary event: transaction.completed — marks campaign as paid.
    """
    body_bytes = await request.body()
    signature_header = request.headers.get("paddle-signature", "")

    # 1. Verify signature
    if not _verify_paddle_signature(body_bytes, signature_header):
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})

    # 2. Parse JSON
    try:
        body = json.loads(body_bytes)
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    event_type = body.get("event_type", "")
    data = body.get("data", {})

    logger.info("Paddle webhook received: %s", event_type)

    # 3. Handle transaction.completed
    if event_type == "transaction.completed":
        transaction_id = data.get("id", "")  # txn_...
        custom_data = data.get("custom_data") or {}
        campaign_id = custom_data.get("campaign_id", "")

        if not campaign_id:
            logger.warning("Paddle transaction.completed missing campaign_id in custom_data")
            return {"ok": True, "skipped": True, "reason": "no_campaign_id"}

        # Extract amount from totals
        details = data.get("details") or {}
        totals = details.get("totals") or {}
        # Paddle amounts are strings in lowest denomination (pence for GBP)
        amount_str = totals.get("grand_total", "0")
        try:
            amount_paid = int(amount_str) / 100  # pence to pounds
        except (ValueError, TypeError):
            amount_paid = 0

        # Idempotency: check if already processed
        campaign = get_campaign(campaign_id)
        if not campaign:
            logger.warning("Paddle webhook: campaign %s not found", campaign_id)
            return {"ok": True, "skipped": True, "reason": "campaign_not_found"}

        if campaign.get("paddle_transaction_id") == transaction_id:
            logger.info("Paddle webhook: duplicate transaction %s", transaction_id)
            return {"ok": True, "duplicate": True}

        # Update campaign payment status
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()

        update_campaign(campaign_id, {
            "payment_status": "paid",
            "paddle_transaction_id": transaction_id,
            "amount_paid": amount_paid,
            "paid_at": now,
        })

        logger.info(
            "Campaign %s marked as paid (txn=%s, amount=%.2f)",
            campaign_id, transaction_id, amount_paid,
        )
        return {"ok": True, "campaign_id": campaign_id, "payment_status": "paid"}

    # Other events — acknowledge but don't process
    return {"ok": True, "event_type": event_type, "handled": False}
