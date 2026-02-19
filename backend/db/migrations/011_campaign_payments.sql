-- Migration 011: Add payment tracking columns to campaigns table
-- Paddle per-campaign checkout integration

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paddle_transaction_id VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Index for quick lookups by payment status and transaction ID
CREATE INDEX IF NOT EXISTS idx_campaigns_payment_status ON campaigns(payment_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_paddle_txn ON campaigns(paddle_transaction_id) WHERE paddle_transaction_id IS NOT NULL;
