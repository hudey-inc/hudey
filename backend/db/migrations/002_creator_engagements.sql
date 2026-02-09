-- Migration: Add creator_engagements table for tracking outreach status
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS creator_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    creator_id VARCHAR(255) NOT NULL,
    creator_name VARCHAR(255),
    creator_email VARCHAR(255),
    platform VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'contacted',
    -- status values: contacted, responded, negotiating, agreed, declined
    latest_proposal JSONB,
    terms JSONB,
    message_history JSONB DEFAULT '[]'::jsonb,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_engagements_campaign
    ON creator_engagements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creator_engagements_status
    ON creator_engagements(status);
