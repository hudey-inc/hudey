"""Brand API routes — profile read/update, billing, Paddle portal."""

import logging
import os

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.rate_limit import default_limit
from backend.api.schemas import UpdateBrandRequest
from backend.auth.current_brand import get_current_brand
from backend.db.repositories.brand_repo import update_brand as repo_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.get("/me")
def get_my_brand(brand: dict = Depends(get_current_brand)):
    """Return the current user's brand profile."""
    return brand


@router.put("/me")
@default_limit
def update_my_brand(request: Request, body: UpdateBrandRequest, brand: dict = Depends(get_current_brand)):
    """Update current user's brand profile. Returns updated brand."""
    data = body.model_dump(exclude_none=True, exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = repo_update(brand["id"], data)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update brand")
    return updated


@router.get("/billing")
def get_billing(brand: dict = Depends(get_current_brand)):
    """Return payment history and billing summary for the brand.

    Aggregates paid campaigns from the campaigns table and returns:
    - transactions: list of individual payments (newest first)
    - summary: total_spent, campaigns_paid, last_payment_at
    """
    from backend.db.client import get_supabase

    sb = get_supabase()
    if not sb:
        return {"transactions": [], "summary": {"total_spent": 0, "campaigns_paid": 0, "last_payment_at": None}}

    try:
        rows = (
            sb.table("campaigns")
            .select("id, name, short_id, payment_status, paddle_transaction_id, amount_paid, paid_at")
            .eq("brand_id", brand["id"])
            .eq("payment_status", "paid")
            .order("paid_at", desc=True)
            .execute()
        )
    except Exception as e:
        logger.warning("Failed to fetch billing data: %s", e)
        return {"transactions": [], "summary": {"total_spent": 0, "campaigns_paid": 0, "last_payment_at": None}}

    payments = rows.data or []

    transactions = [
        {
            "campaign_id": p["id"],
            "campaign_name": p.get("name") or p.get("short_id") or "Campaign",
            "transaction_id": p.get("paddle_transaction_id"),
            "amount": float(p["amount_paid"]) if p.get("amount_paid") else 0,
            "paid_at": p.get("paid_at"),
        }
        for p in payments
    ]

    total_spent = sum(t["amount"] for t in transactions)
    last_payment_at = transactions[0]["paid_at"] if transactions else None

    return {
        "transactions": transactions,
        "summary": {
            "total_spent": round(total_spent, 2),
            "campaigns_paid": len(transactions),
            "last_payment_at": last_payment_at,
        },
    }


@router.post("/billing/portal")
@default_limit
def create_portal_session(request: Request, brand: dict = Depends(get_current_brand)):
    """Create a Paddle customer portal session.

    Returns { url } — a one-time authenticated link to the Paddle customer
    portal where users can view invoices, update payment methods, etc.

    Requires the brand to have a paddle_customer_id (set automatically
    on first payment via the Paddle webhook).
    """
    paddle_customer_id = brand.get("paddle_customer_id")
    if not paddle_customer_id:
        raise HTTPException(
            status_code=404,
            detail="No payment history found. A portal link will be available after your first payment.",
        )

    api_key = (os.getenv("PADDLE_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    paddle_env = (os.getenv("NEXT_PUBLIC_PADDLE_ENV") or "sandbox").strip()
    base_url = (
        "https://api.paddle.com"
        if paddle_env == "production"
        else "https://sandbox-api.paddle.com"
    )

    try:
        resp = http_requests.post(
            f"{base_url}/customers/{paddle_customer_id}/portal-sessions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        portal_url = (data.get("urls") or {}).get("general", {}).get("overview")
        if not portal_url:
            raise HTTPException(status_code=502, detail="Paddle did not return a portal URL")
        return {"url": portal_url}
    except http_requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 502
        logger.warning("Paddle portal session failed (%s): %s", status, e)
        raise HTTPException(status_code=502, detail="Failed to create billing portal session")
    except Exception as e:
        logger.warning("Paddle portal session error: %s", e)
        raise HTTPException(status_code=502, detail="Failed to create billing portal session")
