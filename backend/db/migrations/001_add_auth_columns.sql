-- Migration: Add auth columns for user-scoped data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Add user_id to brands table (links Supabase Auth user to brand)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);

-- 2. Add brand_id to campaigns table if missing (links campaign to brand)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);

-- 3. Backfill: assign all existing campaigns to the first brand
-- (Run this only once, skip if campaigns already have brand_id set)
DO $$
DECLARE
    first_brand_id UUID;
BEGIN
    SELECT id INTO first_brand_id FROM brands ORDER BY created_at LIMIT 1;
    IF first_brand_id IS NOT NULL THEN
        UPDATE campaigns SET brand_id = first_brand_id WHERE brand_id IS NULL;
    END IF;
END $$;
