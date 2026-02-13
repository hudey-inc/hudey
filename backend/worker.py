"""Background campaign worker — polls campaign_jobs table and executes.

Runs in a single daemon thread inside the FastAPI process. On startup,
recovers any stale jobs from a previous crashed instance. Then polls
every 5 seconds for new queued jobs and runs them sequentially.

This replaces the old approach of spawning one-off daemon threads per
campaign which were lost on server restart.
"""

from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger(__name__)

_worker_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _execute_campaign(campaign_id: str) -> None:
    """Run a single campaign (same logic as the old _run() inline function)."""
    from backend.db.repositories.campaign_repo import (
        get_campaign,
        update_campaign as db_update,
    )

    campaign = get_campaign(campaign_id)
    if not campaign:
        raise RuntimeError(f"Campaign {campaign_id} not found in DB")

    brief_data = campaign.get("brief")
    if not brief_data:
        raise RuntimeError(f"Campaign {campaign_id} has no brief")

    from models.brief import CampaignBrief
    from agent.hudey_agent import HudeyAgent
    from tools.approval import WebApprovalTool
    from models.actions import AgentActionType

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
    logger.info("Campaign %s completed via job queue", campaign_id)

    # Completion notification (non-fatal)
    try:
        from backend.db.repositories.notification_repo import maybe_create_notification
        cmp = get_campaign(campaign_id)
        if cmp and cmp.get("brand_id"):
            campaign_name = cmp.get("name", "Campaign")
            short_id = cmp.get("short_id") or campaign_id
            maybe_create_notification(
                brand_id=cmp["brand_id"],
                notification_type="campaign_completion",
                title=f"{campaign_name} completed",
                body="Campaign has finished running",
                campaign_id=campaign_id,
                link=f"/campaigns/{short_id}",
            )
    except Exception:
        pass


def _worker_loop() -> None:
    """Main worker loop — poll for jobs, execute them."""
    from backend.db.repositories import job_repo

    logger.info("Campaign worker started (id: %s)", job_repo.WORKER_ID)

    # Recover any stale jobs from a previous crash
    try:
        recovered = job_repo.recover_stale_jobs()
        if recovered:
            logger.info("Recovered %d stale campaign job(s)", recovered)
    except Exception as e:
        logger.warning("Failed to recover stale jobs on startup: %s", e)

    while not _stop_event.is_set():
        try:
            job = job_repo.claim_next()
            if not job:
                # No work — sleep and poll again
                _stop_event.wait(5)
                continue

            campaign_id = job["campaign_id"]
            job_id = job["id"]
            logger.info("Executing campaign %s (job %s, attempt %d)", campaign_id, job_id, job["attempts"])

            try:
                _execute_campaign(campaign_id)
                job_repo.complete(job_id)
            except Exception as e:
                logger.exception("Campaign %s failed: %s", campaign_id, e)
                job_repo.fail(job_id, str(e))
                # Also mark campaign as failed
                try:
                    from backend.db.repositories.campaign_repo import update_campaign
                    update_campaign(campaign_id, {
                        "status": "failed",
                        "agent_state": f"error: {str(e)[:200]}",
                    })
                except Exception:
                    pass

        except Exception as e:
            logger.exception("Worker loop error: %s", e)
            _stop_event.wait(10)  # Back off on unexpected errors


def start_worker() -> None:
    """Start the background campaign worker thread."""
    global _worker_thread
    if _worker_thread and _worker_thread.is_alive():
        logger.info("Campaign worker already running")
        return

    _stop_event.clear()
    _worker_thread = threading.Thread(
        target=_worker_loop,
        daemon=True,
        name="campaign-worker",
    )
    _worker_thread.start()
    logger.info("Campaign worker thread started")


def stop_worker() -> None:
    """Signal the worker to stop."""
    _stop_event.set()
    if _worker_thread:
        _worker_thread.join(timeout=5)
    logger.info("Campaign worker stopped")
