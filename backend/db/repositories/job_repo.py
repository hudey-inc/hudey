"""Campaign job queue repository — Postgres-backed durable queue.

Replaces in-memory threading with a persistent job table so campaigns
survive server restarts on Railway / any single-instance deployment.
"""

from __future__ import annotations

import logging
import os
import socket
from datetime import datetime, timezone

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)

# Worker identity (hostname + PID) — used to claim jobs
WORKER_ID = f"{socket.gethostname()}-{os.getpid()}"

# Jobs locked for more than this many seconds are considered stale
STALE_LOCK_SECONDS = 600  # 10 minutes


def enqueue(campaign_id: str) -> str | None:
    """Add a campaign to the job queue. Returns job id or None."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("campaign_jobs")
            .upsert(
                {
                    "campaign_id": campaign_id,
                    "status": "queued",
                    "locked_by": None,
                    "locked_at": None,
                    "attempts": 0,
                    "last_error": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="campaign_id",
            )
            .execute()
        )
        if r.data:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to enqueue campaign job: %s", e)
    return None


def claim_next() -> dict | None:
    """Claim the oldest queued job. Returns the job row or None.

    Uses a two-step read-then-update with locked_by check to prevent
    double-claiming. In a single-worker setup (Railway) this is safe.
    """
    sb = get_supabase()
    if not sb:
        return None
    try:
        # Find oldest unclaimed queued job
        r = (
            sb.table("campaign_jobs")
            .select("*")
            .eq("status", "queued")
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )
        if not r.data:
            return None

        job = r.data[0]
        now = datetime.now(timezone.utc).isoformat()

        # Claim it
        r2 = (
            sb.table("campaign_jobs")
            .update(
                {
                    "status": "running",
                    "locked_by": WORKER_ID,
                    "locked_at": now,
                    "attempts": job["attempts"] + 1,
                    "updated_at": now,
                }
            )
            .eq("id", job["id"])
            .eq("status", "queued")  # Only if still queued (guard)
            .execute()
        )
        if r2.data:
            return r2.data[0]
        return None
    except Exception as e:
        logger.warning("Failed to claim job: %s", e)
        return None


def complete(job_id: str) -> bool:
    """Mark a job as completed."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        sb.table("campaign_jobs").update(
            {
                "status": "completed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", job_id).execute()
        return True
    except Exception as e:
        logger.warning("Failed to complete job %s: %s", job_id, e)
        return False


def fail(job_id: str, error: str, max_attempts: int = 3) -> bool:
    """Mark a job as failed. Re-queues if attempts < max."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        # Get current attempt count
        r = sb.table("campaign_jobs").select("attempts, max_attempts").eq("id", job_id).execute()
        if not r.data:
            return False

        attempts = r.data[0]["attempts"]
        max_att = r.data[0].get("max_attempts", max_attempts)
        new_status = "queued" if attempts < max_att else "failed"

        sb.table("campaign_jobs").update(
            {
                "status": new_status,
                "last_error": error[:500],
                "locked_by": None,
                "locked_at": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", job_id).execute()
        return True
    except Exception as e:
        logger.warning("Failed to mark job %s as failed: %s", job_id, e)
        return False


def recover_stale_jobs() -> int:
    """Re-queue jobs that were running but the worker died.

    Called on server startup to recover campaigns that were in-flight
    when the previous instance shut down.
    """
    sb = get_supabase()
    if not sb:
        return 0
    try:
        # Find all running jobs (previous worker died)
        r = (
            sb.table("campaign_jobs")
            .select("id, campaign_id, attempts, max_attempts")
            .eq("status", "running")
            .execute()
        )
        if not r.data:
            return 0

        count = 0
        for job in r.data:
            attempts = job["attempts"]
            max_att = job.get("max_attempts", 3)
            new_status = "queued" if attempts < max_att else "failed"

            sb.table("campaign_jobs").update(
                {
                    "status": new_status,
                    "locked_by": None,
                    "locked_at": None,
                    "last_error": "Worker died — recovered on startup",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", job["id"]).execute()

            # Also reset the campaign status back to running if re-queued
            if new_status == "queued":
                sb.table("campaigns").update(
                    {"status": "running", "agent_state": "brief_received"}
                ).eq("id", job["campaign_id"]).execute()

            count += 1
            logger.info(
                "Recovered stale job %s for campaign %s → %s",
                job["id"],
                job["campaign_id"],
                new_status,
            )
        return count
    except Exception as e:
        logger.warning("Failed to recover stale jobs: %s", e)
        return 0


def get_job_for_campaign(campaign_id: str) -> dict | None:
    """Get the current job for a campaign."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("campaign_jobs")
            .select("*")
            .eq("campaign_id", campaign_id)
            .limit(1)
            .execute()
        )
        return r.data[0] if r.data else None
    except Exception as e:
        logger.warning("Failed to get job for campaign %s: %s", campaign_id, e)
        return None
