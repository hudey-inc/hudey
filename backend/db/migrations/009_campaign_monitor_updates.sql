-- Migration 009: Campaign monitor updates table
-- Stores snapshots of monitor data (posts, metrics, compliance) for each campaign.
-- Each row is a snapshot taken at a point in time. The latest snapshot is the current state.

CREATE TABLE IF NOT EXISTS campaign_monitor_updates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    snapshot_data   JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitor_updates_campaign
    ON campaign_monitor_updates (campaign_id, created_at DESC);

-- Comment for clarity
COMMENT ON TABLE campaign_monitor_updates IS 'Stores monitoring snapshots: creator posts, metrics, and compliance checks per campaign';
COMMENT ON COLUMN campaign_monitor_updates.snapshot_data IS 'Full array of monitor update objects (creator, posted, metrics, compliance)';
COMMENT ON COLUMN campaign_monitor_updates.summary IS 'Aggregated summary: total_likes, compliance_score, etc.';
