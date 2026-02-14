-- Migration 010: Campaign templates table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS campaign_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    brief       JSONB NOT NULL DEFAULT '{}'::jsonb,
    strategy    JSONB,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_brand
    ON campaign_templates (brand_id, created_at DESC);
