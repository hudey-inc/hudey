-- Migration: Enable Row Level Security on all tables
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
--
-- How it works:
--   auth.uid() returns the logged-in user's UUID (from the JWT in the anon key request).
--   We join through brands to verify the user owns the data.
--   The backend service key bypasses RLS entirely (expected behaviour).
--   The frontend anon key is subject to these policies.
--
-- NOTE: Some tables store campaign_id as text, others as UUID.
--   We use campaign_id::uuid casts where needed to avoid type mismatch errors.
--   If a table below doesn't exist in your database, skip that section.
--   Check with: SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- ============================================================
-- 1. BRANDS — users can only see/manage their own brand
-- ============================================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand"
    ON brands FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own brand"
    ON brands FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own brand"
    ON brands FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. CAMPAIGNS — users can only access campaigns belonging to their brand
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
    ON campaigns FOR SELECT
    USING (
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create campaigns for their brand"
    ON campaigns FOR INSERT
    WITH CHECK (
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own campaigns"
    ON campaigns FOR UPDATE
    USING (
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own campaigns"
    ON campaigns FOR DELETE
    USING (
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    );

-- ============================================================
-- 3. CREATOR ENGAGEMENTS — campaign_id is UUID (from migration 002)
-- ============================================================
ALTER TABLE creator_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view engagements for their campaigns"
    ON creator_engagements FOR SELECT
    USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create engagements for their campaigns"
    ON creator_engagements FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update engagements for their campaigns"
    ON creator_engagements FOR UPDATE
    USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 4. APPROVALS — campaign_id may be text, cast to UUID
-- ============================================================
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals for their campaigns"
    ON approvals FOR SELECT
    USING (
        campaign_id::uuid IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update approvals for their campaigns"
    ON approvals FOR UPDATE
    USING (
        campaign_id::uuid IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 5. EMAIL EVENTS — campaign_id may be text, cast to UUID
-- ============================================================
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email events for their campaigns"
    ON email_events FOR SELECT
    USING (
        campaign_id::uuid IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 6. AGENT ACTIONS — campaign_id is UUID (from schema.sql)
-- ============================================================
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent actions for their campaigns"
    ON agent_actions FOR SELECT
    USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 7. CAMPAIGN ASSIGNMENTS — campaign_id is UUID (from schema.sql)
-- ============================================================
ALTER TABLE campaign_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments for their campaigns"
    ON campaign_assignments FOR SELECT
    USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 8. CAMPAIGN REPORTS — campaign_id is UUID (from schema.sql)
-- ============================================================
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their campaigns"
    ON campaign_reports FOR SELECT
    USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- ============================================================
-- 9. CREATORS — shared lookup table, read-only for all authenticated users
-- ============================================================
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view creators"
    ON creators FOR SELECT
    USING ((auth.jwt() ->> 'role') = 'authenticated');
