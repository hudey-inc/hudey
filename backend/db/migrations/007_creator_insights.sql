-- Add InsightIQ enrichment fields to creators table
-- Brand fit score and full analysis data from InsightIQ Brand Fit API

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS brand_fit_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS brand_fit_data JSONB;

-- Add campaign insights table for Purchase Intent and Comments Relevance
-- Stores per-post analysis results from InsightIQ

CREATE TABLE IF NOT EXISTS campaign_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
    content_id VARCHAR(255),
    post_url TEXT,
    insight_type VARCHAR(50) NOT NULL, -- 'purchase_intent' or 'comments_relevance'
    score DECIMAL(5,2),
    data JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_insights_campaign_id ON campaign_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_insights_type ON campaign_insights(insight_type);

-- Add composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_campaign_insights_campaign_type
  ON campaign_insights(campaign_id, insight_type);
