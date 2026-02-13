-- Migration 008: Durable campaign job queue + atomic message append
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─────────────────────────────────────────────────────
-- 1. Campaign jobs table — Postgres-based durable queue
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- status: queued | running | completed | failed
    locked_by VARCHAR(100),       -- hostname/worker id that owns the job
    locked_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status ON campaign_jobs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_campaign ON campaign_jobs(campaign_id);

-- Add agent_state column to campaigns if it doesn't exist
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agent_state VARCHAR(50);

-- ─────────────────────────────────────────────────────
-- 2. Atomic JSONB append for message_history
-- ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION append_to_message_history(
    p_campaign_id UUID,
    p_creator_id VARCHAR,
    p_message JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE creator_engagements
    SET message_history = COALESCE(message_history, '[]'::jsonb) || jsonb_build_array(p_message),
        updated_at = NOW()
    WHERE campaign_id = p_campaign_id
      AND creator_id = p_creator_id;
END;
$$ LANGUAGE plpgsql;
