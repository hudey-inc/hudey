-- Migration 014: Add ON DELETE CASCADE to all FK constraints blocking user deletion
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Problem: Deleting a user from auth.users fails because brands.user_id
-- references it without CASCADE, and several downstream tables also lack
-- CASCADE on their FK constraints.
--
-- Fix: Drop and re-add each blocking constraint with ON DELETE CASCADE.
-- This lets Supabase cleanly delete a user and all their associated data.

-- ============================================================
-- 1. brands.user_id → auth.users(id)  [PRIMARY BLOCKER]
-- ============================================================
ALTER TABLE brands
    DROP CONSTRAINT IF EXISTS brands_user_id_fkey;
ALTER TABLE brands
    ADD CONSTRAINT brands_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 2. campaigns.brand_id → brands(id)
-- ============================================================
ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS campaigns_brand_id_fkey;
ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================
-- 3. creator_engagements.campaign_id → campaigns(id)
-- ============================================================
ALTER TABLE creator_engagements
    DROP CONSTRAINT IF EXISTS creator_engagements_campaign_id_fkey;
ALTER TABLE creator_engagements
    ADD CONSTRAINT creator_engagements_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- ============================================================
-- 4. contract_acceptances.contract_template_id → contract_templates(id)
-- ============================================================
ALTER TABLE contract_acceptances
    DROP CONSTRAINT IF EXISTS contract_acceptances_contract_template_id_fkey;
ALTER TABLE contract_acceptances
    ADD CONSTRAINT contract_acceptances_contract_template_id_fkey
    FOREIGN KEY (contract_template_id) REFERENCES contract_templates(id) ON DELETE CASCADE;

-- ============================================================
-- 5. contract_acceptances.brand_id → brands(id)
-- ============================================================
ALTER TABLE contract_acceptances
    DROP CONSTRAINT IF EXISTS contract_acceptances_brand_id_fkey;
ALTER TABLE contract_acceptances
    ADD CONSTRAINT contract_acceptances_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================
-- 6. campaigns.contract_template_id → contract_templates(id)
-- ============================================================
ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS campaigns_contract_template_id_fkey;
ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_contract_template_id_fkey
    FOREIGN KEY (contract_template_id) REFERENCES contract_templates(id) ON DELETE SET NULL;

-- ============================================================
-- 7. approvals.campaign_id → campaigns(id) (if missing CASCADE)
-- ============================================================
ALTER TABLE approvals
    DROP CONSTRAINT IF EXISTS approvals_campaign_id_fkey;
ALTER TABLE approvals
    ADD CONSTRAINT approvals_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
