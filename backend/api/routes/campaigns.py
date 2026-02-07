"""Campaign API routes."""

import logging
import threading

from fastapi import APIRouter, HTTPException

from backend.db.repositories.campaign_repo import (
    create_campaign as repo_create,
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
def list_campaigns():
    """List campaigns, newest first."""
    return repo_list()


@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    """Get campaign by id (UUID or short_id)."""
    row = repo_get(campaign_id)
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return row


@router.post("")
def create_campaign(body: dict):
    """Create campaign from brief and optional strategy. Returns { id }."""
    brief = body.get("brief", body)
    strategy = body.get("strategy", {})
    name = body.get("name") or (brief.get("name") if isinstance(brief, dict) else None)
    short_id = body.get("short_id")
    cid = repo_create(brief, strategy, short_id=short_id, name=name)
    if not cid:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"id": cid}


@router.post("/{campaign_id}/run")
def run_campaign(campaign_id: str):
    """Trigger background campaign execution with web-based approvals."""
    campaign = repo_get(campaign_id)
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
                db_update(campaign_id, {"agent_state": ctx.state.value})

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


@router.put("/{campaign_id}")
def update_campaign(campaign_id: str, body: dict):
    """Update campaign status/fields."""
    ok = repo_update(campaign_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"ok": True}
