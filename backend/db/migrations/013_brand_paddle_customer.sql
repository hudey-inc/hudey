-- Migration 013: Add Paddle customer ID to brands table
-- Captured from transaction.completed webhook for customer portal sessions

ALTER TABLE brands ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_brands_paddle_customer ON brands(paddle_customer_id) WHERE paddle_customer_id IS NOT NULL;
