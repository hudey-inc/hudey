"""Campaign API routes."""

import logging
import threading

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

# Track running campaign threads (in-memory, single instance)
_running_campaigns: dict[str, threading.Thread] = {}


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
    """Trigger background campaign execution with web-based approvals."""
    campaign = repo_get(campaign_id, brand_id=brand["id"])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.get("status") == "running":
        raise HTTPException(status_code=409, detail="Campaign already running")

    if campaign_id in _running_campaigns and _running_campaigns[campaign_id].is_alive():
        raise HTTPException(status_code=409, detail="Campaign already running")

    brief_data = campaign.get("brief")
    if not brief_data:
        raise HTTPException(status_code=400, detail="Campaign has no brief")

    # Mark as running
    repo_update(campaign_id, {"status": "running", "agent_state": "brief_received"})

    def _run():
        try:
            from models.brief import CampaignBrief
            from agent.hudey_agent import HudeyAgent
            from tools.approval import WebApprovalTool
            from models.actions import AgentActionType
            from backend.db.repositories.campaign_repo import (
                update_campaign as db_update,
            )

            brief = CampaignBrief(**brief_data)
            agent = HudeyAgent(no_send=False)

            # Swap approval tool for web version
            web_approval = WebApprovalTool(campaign_db_id=campaign_id)
            agent.approval = web_approval
            agent.tool_map[AgentActionType.REQUEST_APPROVAL] = web_approval
            agent.tool_map[AgentActionType.REQUEST_TERMS_APPROVAL] = web_approval

            def _on_step(ctx):
                try:
                    db_update(campaign_id, {"agent_state": ctx.state.value})
                except Exception:
                    # Reset client on connection errors and retry once
                    try:
                        from backend.db.client import reset_supabase
                        reset_supabase()
                        db_update(campaign_id, {"agent_state": ctx.state.value})
                    except Exception:
                        pass

            context = agent.execute_campaign(brief, approve_all=False, on_step=_on_step)

            # Save result
            result = {
                "brief": context.brief.model_dump() if context.brief else None,
                "strategy": context.strategy.model_dump() if context.strategy else None,
                "creators_count": len(context.creators),
                "outreach_sent": context.outreach_sent,
                "report": context.report,
            }
            db_update(campaign_id, {
                "status": "completed",
                "agent_state": "completed",
                "result_json": result,
            })
            logger.info("Campaign %s completed", campaign_id)

        except Exception as e:
            logger.exception("Campaign %s failed: %s", campaign_id, e)
            try:
                from backend.db.repositories.campaign_repo import update_campaign as db_update
                db_update(campaign_id, {"status": "failed", "agent_state": f"error: {str(e)[:200]}"})
            except Exception:
                pass

    thread = threading.Thread(target=_run, daemon=True, name=f"campaign-{campaign_id[:8]}")
    thread.start()
    _running_campaigns[campaign_id] = thread

    return {"ok": True, "status": "running"}


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
