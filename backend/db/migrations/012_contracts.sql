-- Migration 012: Clickwrap contract system
-- Stores contract templates and acceptance audit trails

-- ============================================================
-- 1. CONTRACT TEMPLATES — reusable contracts with structured clauses
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    clauses     JSONB NOT NULL DEFAULT '[]'::jsonb,
    version     INTEGER NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_brand
    ON contract_templates (brand_id, created_at DESC);

-- ============================================================
-- 2. CONTRACT ACCEPTANCES — audit trail for clickwrap acceptance
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_acceptances (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_template_id UUID NOT NULL REFERENCES contract_templates(id),
    campaign_id          UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    engagement_id        UUID NOT NULL REFERENCES creator_engagements(id) ON DELETE CASCADE,
    creator_id           VARCHAR(255) NOT NULL,
    clauses_snapshot     JSONB NOT NULL,
    content_hash         VARCHAR(128) NOT NULL,
    accepted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_by_ip       VARCHAR(45),
    accepted_by_ua       TEXT,
    brand_id             UUID NOT NULL REFERENCES brands(id),
    UNIQUE(engagement_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_campaign
    ON contract_acceptances (campaign_id);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_template
    ON contract_acceptances (contract_template_id);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_engagement
    ON contract_acceptances (engagement_id);

-- ============================================================
-- 3. ADD contract_template_id TO CAMPAIGNS
-- ============================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_template_id UUID REFERENCES contract_templates(id);
CREATE INDEX IF NOT EXISTS idx_campaigns_contract_template
    ON campaigns(contract_template_id) WHERE contract_template_id IS NOT NULL;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract templates"
    ON contract_templates FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can create contract templates for their brand"
    ON contract_templates FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own contract templates"
    ON contract_templates FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own contract templates"
    ON contract_templates FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contract acceptances for their brand"
    ON contract_acceptances FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can create contract acceptances for their campaigns"
    ON contract_acceptances FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));
