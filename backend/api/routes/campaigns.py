"""Campaign API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand
from backend.db.repositories.campaign_repo import (
    create_campaign as repo_create,
    delete_campaign as repo_delete,
    get_campaign as repo_get,
    list_campaigns as repo_list,
    update_campaign as repo_update,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("/")
@router.get("")
def list_campaigns(brand: dict = Depends(get_current_brand)):
    """List campaigns for the authenticated user's brand, newest first."""
    return repo_list(brand_id=brand["id"])


@router.get("/{campaign_id}")
def get_campaign(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get campaign by id (UUID or short_id). Verifies brand ownership."""
    row = repo_get(campaign_id, brand_id=brand["id"])
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return row


@router.post("")
def create_campaign(body: dict, brand: dict = Depends(get_current_brand)):
    """Create campaign from brief and optional strategy. Returns { id }."""
    brief = body.get("brief", body)
    strategy = body.get("strategy", {})
    name = body.get("name") or (brief.get("name") if isinstance(brief, dict) else None)
    short_id = body.get("short_id")
    cid = repo_create(brief, strategy, short_id=short_id, name=name, brand_id=brand["id"])
    if not cid:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"id": cid}


@router.post("/{campaign_id}/run")
def run_campaign(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Trigger background campaign execution with web-based approvals.

    Enqueues the campaign into the durable Postgres job queue.
    The background worker picks it up and executes it. If the server
    restarts, the job is recovered automatically on next startup.
    """
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.get("status") == "running":
        raise HTTPException(status_code=409, detail="Campaign already running")

    brief_data = campaign.get("brief")
    if not brief_data:
        raise HTTPException(status_code=400, detail="Campaign has no brief")

    # Check if already queued
    from backend.db.repositories.job_repo import enqueue, get_job_for_campaign

    existing_job = get_job_for_campaign(campaign["id"])
    if existing_job and existing_job["status"] in ("queued", "running"):
        raise HTTPException(status_code=409, detail="Campaign already queued or running")

    # Mark as running and enqueue
    repo_update(campaign_id, {"status": "running", "agent_state": "brief_received"})
    job_id = enqueue(campaign["id"])
    if not job_id:
        raise HTTPException(status_code=503, detail="Failed to enqueue campaign job")

    logger.info("Campaign %s enqueued as job %s", campaign_id, job_id)
    return {"ok": True, "status": "running", "job_id": job_id}


@router.get("/{campaign_id}/monitor")
def campaign_monitor(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get the latest monitoring data for a campaign.

    Returns the most recent snapshot with post metrics, compliance data,
    and an aggregated summary.
    """
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from backend.db.repositories.monitor_repo import get_latest_snapshot

    snapshot = get_latest_snapshot(campaign["id"])
    if not snapshot:
        # Fall back to result_json if no DB snapshot
        result = campaign.get("result_json") or {}
        report = result.get("report") or {}
        return {
            "updates": [],
            "summary": report.get("metrics") or {},
            "snapshot_id": None,
            "created_at": None,
        }
    return {
        "updates": snapshot.get("snapshot_data") or [],
        "summary": snapshot.get("summary") or {},
        "snapshot_id": snapshot.get("id"),
        "created_at": snapshot.get("created_at"),
    }


@router.get("/{campaign_id}/insights")
def campaign_insights(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get campaign insights (purchase intent + comments relevance).

    Returns aggregated insights from the campaign_insights table.
    """
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from backend.db.repositories.insights_repo import get_insights_summary, get_insights

    summary = get_insights_summary(campaign["id"])
    raw_insights = get_insights(campaign["id"])

    return {
        "summary": summary,
        "insights": raw_insights,
        "campaign_id": campaign["id"],
    }


@router.get("/{campaign_id}/report")
def campaign_report(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get the full campaign report.

    Combines monitoring data, campaign insights, and AI-generated analysis
    from result_json.
    """
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    result = campaign.get("result_json") or {}
    report = result.get("report") or {}

    # Enrich with latest monitoring data
    from backend.db.repositories.monitor_repo import get_monitor_summary
    from backend.db.repositories.insights_repo import get_insights_summary

    monitor_summary = get_monitor_summary(campaign["id"])
    insights_summary = get_insights_summary(campaign["id"])

    return {
        "report": report,
        "monitor_summary": monitor_summary,
        "insights_summary": insights_summary,
        "campaign_id": campaign["id"],
        "status": campaign.get("status"),
        "completed_at": campaign.get("completed_at"),
    }


@router.get("/{campaign_id}/email-events")
def campaign_email_events(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get email delivery tracking summary for a campaign."""
    from backend.db.repositories.email_event_repo import get_delivery_summary
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return get_delivery_summary(campaign["id"])


@router.get("/{campaign_id}/engagements")
def campaign_engagements(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Get creator engagement status for a campaign."""
    from backend.db.repositories.engagement_repo import get_engagements
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return get_engagements(campaign["id"])


@router.post("/{campaign_id}/reply")
def reply_to_creator(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Send a reply to a creator within a campaign thread.

    Body: { creator_id: str, message: str }

    Appends the message to the engagement's message_history,
    optionally sends via Resend, and returns the updated engagement.
    """
    from datetime import datetime, timezone
    from backend.db.repositories.engagement_repo import (
        get_engagement,
        append_message,
        update_status,
    )

    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    creator_id = body.get("creator_id", "").strip()
    message_text = body.get("message", "").strip()

    if not creator_id or not message_text:
        raise HTTPException(status_code=400, detail="creator_id and message are required")

    db_campaign_id = campaign["id"]
    engagement = get_engagement(db_campaign_id, creator_id)
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found for this creator")

    ts = datetime.now(timezone.utc).isoformat()

    # Append brand message to history
    msg = {"from": "brand", "body": message_text, "timestamp": ts}
    append_message(db_campaign_id, creator_id, msg)

    # If the engagement was "responded", advance to "negotiating"
    current_status = engagement.get("status", "contacted")
    if current_status == "responded":
        update_status(db_campaign_id, creator_id, "negotiating")

    # Attempt to send via Resend if email is available
    email_id = None
    creator_email = engagement.get("creator_email", "")
    if creator_email:
        try:
            import os
            resend_key = os.getenv("RESEND_API_KEY", "")
            if resend_key:
                import resend
                resend.api_key = resend_key

                from_addr = os.getenv("OUTREACH_FROM_EMAIL", "outreach@hudey.co")
                campaign_name = campaign.get("name") or "your campaign"
                subject = f"Re: {campaign_name}"

                r = resend.Emails.send({
                    "from": from_addr,
                    "to": [creator_email],
                    "subject": subject,
                    "text": message_text,
                    "headers": {"X-Entity-Ref-ID": db_campaign_id},
                })
                email_id = r.get("id") if isinstance(r, dict) else None
                logger.info("Reply sent via Resend to %s (email_id=%s)", creator_email, email_id)
        except Exception as e:
            logger.warning("Failed to send reply via Resend to %s: %s", creator_email, e)

    return {
        "ok": True,
        "email_id": email_id,
        "message": msg,
        "status": "negotiating" if current_status == "responded" else current_status,
    }


@router.post("/{campaign_id}/negotiate")
def generate_counter_offer(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Generate an AI counter-offer for a creator negotiation.

    Body: { creator_id: str }

    Uses Claude to analyze the conversation thread and campaign context,
    then drafts a professional counter-offer with proposed terms.
    Returns the draft for human review before sending.
    """
    from backend.db.repositories.engagement_repo import get_engagement

    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    creator_id = body.get("creator_id", "").strip()
    if not creator_id:
        raise HTTPException(status_code=400, detail="creator_id is required")

    db_campaign_id = campaign["id"]
    engagement = get_engagement(db_campaign_id, creator_id)
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    # Build context for the negotiation tool
    brief_data = campaign.get("brief", {})
    if not brief_data:
        raise HTTPException(status_code=400, detail="Campaign has no brief")

    try:
        from models.brief import CampaignBrief
        from models.campaign import CreatorEngagement as EngModel
        from models.context import CampaignContext
        from tools.negotiation import NegotiationTool, score_offer

        brief = CampaignBrief(**brief_data)
        context = CampaignContext(campaign_id=db_campaign_id, brief=brief)

        eng_model = EngModel(
            creator_id=creator_id,
            status=engagement.get("status", "responded"),
            latest_proposal=engagement.get("latest_proposal"),
            terms=engagement.get("terms"),
            message_history=engagement.get("message_history") or [],
            response_timestamp=engagement.get("response_timestamp"),
            notes=engagement.get("notes"),
        )

        tool = NegotiationTool()
        counter_offer = tool.compose_counter_offer(eng_model, context)
        proposal = counter_offer.get("proposed_terms", {})
        score = score_offer(proposal, context)

        return {
            "ok": True,
            "counter_offer": counter_offer,
            "score": score,
            "creator_id": creator_id,
        }
    except Exception as e:
        logger.exception("Failed to generate counter-offer for %s: %s", creator_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to generate counter-offer: {str(e)}")


@router.post("/{campaign_id}/send-counter-offer")
def send_counter_offer(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Send an approved counter-offer to a creator.

    Body: {
        creator_id: str,
        subject: str,
        message: str,
        proposed_terms: { fee_gbp: number, deliverables: [...], deadline: str }
    }

    Appends the counter-offer to the thread, updates proposed terms,
    advances status to negotiating, and sends via Resend if email available.
    """
    from datetime import datetime, timezone
    from backend.db.repositories.engagement_repo import (
        get_engagement,
        append_message,
        update_status,
    )

    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    creator_id = body.get("creator_id", "").strip()
    message_text = body.get("message", "").strip()
    subject = body.get("subject", "").strip()
    proposed_terms = body.get("proposed_terms", {})

    if not creator_id or not message_text:
        raise HTTPException(status_code=400, detail="creator_id and message are required")

    db_campaign_id = campaign["id"]
    engagement = get_engagement(db_campaign_id, creator_id)
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    ts = datetime.now(timezone.utc).isoformat()

    # Append brand counter-offer to history
    msg = {"from": "brand", "body": message_text, "timestamp": ts}
    append_message(db_campaign_id, creator_id, msg)

    # Update status and proposed terms
    extras = {}
    if proposed_terms:
        extras["latest_proposal"] = proposed_terms
    update_status(db_campaign_id, creator_id, "negotiating", extras if extras else None)

    # Send via Resend
    email_id = None
    creator_email = engagement.get("creator_email", "")
    if creator_email:
        try:
            import os
            resend_key = os.getenv("RESEND_API_KEY", "")
            if resend_key:
                import resend
                resend.api_key = resend_key
                from_addr = os.getenv("OUTREACH_FROM_EMAIL", "outreach@hudey.co")
                r = resend.Emails.send({
                    "from": from_addr,
                    "to": [creator_email],
                    "subject": subject or f"Re: Partnership with {campaign.get('name', 'your campaign')}",
                    "text": message_text,
                    "headers": {"X-Entity-Ref-ID": db_campaign_id},
                })
                email_id = r.get("id") if isinstance(r, dict) else None
                logger.info("Counter-offer sent via Resend to %s (email_id=%s)", creator_email, email_id)
        except Exception as e:
            logger.warning("Failed to send counter-offer via Resend to %s: %s", creator_email, e)

    return {
        "ok": True,
        "email_id": email_id,
        "message": msg,
        "status": "negotiating",
        "proposed_terms": proposed_terms,
    }


@router.post("/{campaign_id}/accept-terms")
def accept_terms(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Accept negotiation terms for a creator engagement.

    Body: {
        creator_id: str,
        terms: { fee_gbp: number, deliverables: [...], deadline: str }
    }

    Sets agreed terms, advances status to agreed, and optionally sends
    a confirmation message to the creator.
    """
    from datetime import datetime, timezone
    from backend.db.repositories.engagement_repo import (
        get_engagement,
        append_message,
        update_status,
    )

    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    creator_id = body.get("creator_id", "").strip()
    terms = body.get("terms", {})

    if not creator_id:
        raise HTTPException(status_code=400, detail="creator_id is required")

    db_campaign_id = campaign["id"]
    engagement = get_engagement(db_campaign_id, creator_id)
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    ts = datetime.now(timezone.utc).isoformat()

    # Use provided terms, or fall back to latest_proposal
    final_terms = terms if terms else (engagement.get("latest_proposal") or {})

    # Update status to agreed with final terms
    update_status(db_campaign_id, creator_id, "agreed", {"terms": final_terms})

    # Append system message to thread
    fee_str = ""
    if final_terms.get("fee_gbp"):
        fee_str = f" at £{final_terms['fee_gbp']}"
    elif final_terms.get("fee"):
        fee_str = f" at £{final_terms['fee']}"
    system_msg = {"from": "brand", "body": f"✅ Deal agreed{fee_str}. Terms confirmed.", "timestamp": ts}
    append_message(db_campaign_id, creator_id, system_msg)

    # Optionally send confirmation email
    email_id = None
    creator_email = engagement.get("creator_email", "")
    if creator_email and body.get("send_confirmation", True):
        try:
            import os
            resend_key = os.getenv("RESEND_API_KEY", "")
            if resend_key:
                import resend
                resend.api_key = resend_key
                from_addr = os.getenv("OUTREACH_FROM_EMAIL", "outreach@hudey.co")
                brand_name = (campaign.get("brief") or {}).get("brand_name", "our team")
                confirmation_text = (
                    f"Great news! We're happy to confirm the partnership.\n\n"
                    f"Agreed terms:\n"
                    f"- Fee: £{final_terms.get('fee_gbp') or final_terms.get('fee', 'TBD')}\n"
                    f"- Deliverables: {', '.join(final_terms.get('deliverables', ['TBD']))}\n"
                    f"- Deadline: {final_terms.get('deadline', 'TBD')}\n\n"
                    f"We'll be in touch with next steps shortly.\n\n"
                    f"Best,\n{brand_name}"
                )
                r = resend.Emails.send({
                    "from": from_addr,
                    "to": [creator_email],
                    "subject": f"Partnership Confirmed — {campaign.get('name', 'Campaign')}",
                    "text": confirmation_text,
                    "headers": {"X-Entity-Ref-ID": db_campaign_id},
                })
                email_id = r.get("id") if isinstance(r, dict) else None
        except Exception as e:
            logger.warning("Failed to send confirmation to %s: %s", creator_email, e)

    return {
        "ok": True,
        "email_id": email_id,
        "status": "agreed",
        "terms": final_terms,
    }


@router.patch("/{campaign_id}/engagements/{creator_id}/status")
def update_engagement_status(
    campaign_id: str,
    creator_id: str,
    body: dict,
    brand: dict = Depends(get_current_brand),
):
    """Update engagement status manually.

    Body: { status: "negotiating" | "agreed" | "declined", terms?: {...} }
    """
    from backend.db.repositories.engagement_repo import update_status, get_engagement

    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    new_status = body.get("status", "").strip()
    valid_statuses = {"contacted", "responded", "negotiating", "agreed", "declined"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    db_campaign_id = campaign["id"]
    engagement = get_engagement(db_campaign_id, creator_id)
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    extras = {}
    if body.get("terms"):
        extras["terms"] = body["terms"]
    if body.get("latest_proposal"):
        extras["latest_proposal"] = body["latest_proposal"]

    ok = update_status(db_campaign_id, creator_id, new_status, extras if extras else None)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update status")

    return {"ok": True, "status": new_status}


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str, brand: dict = Depends(get_current_brand)):
    """Delete campaign. Verifies brand ownership. Prevents deletion of running campaigns."""
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("status") == "running":
        raise HTTPException(status_code=409, detail="Cannot delete a running campaign")
    ok = repo_delete(campaign_id, brand_id=brand["id"])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete campaign")
    return {"ok": True}


@router.put("/{campaign_id}")
def update_campaign(campaign_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Update campaign status/fields. Verifies brand ownership."""
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    ok = repo_update(campaign_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"ok": True}
