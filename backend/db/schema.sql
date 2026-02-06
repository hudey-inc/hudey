-- Hudey Supabase schema (run in Supabase SQL editor or via migration)
-- Adapted from Hudey_MVP_Architecture_GTM_Strategy.md

-- Brands/Clients
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    brand_voice JSONB,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns (short_id = agent campaign_id e.g. 8-char from CLI)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id VARCHAR(32) UNIQUE,
    brand_id UUID REFERENCES brands(id),
    name VARCHAR(255) NOT NULL,
    objective TEXT,
    brief JSONB,
    budget_gbp DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'draft',
    target_audience JSONB,
    deliverables JSONB,
    timeline JSONB,
    result_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Creators (cached from external APIs)
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE,
    platform VARCHAR(50),
    username VARCHAR(255),
    display_name VARCHAR(255),
    follower_count INTEGER,
    engagement_rate DECIMAL(5,4),
    categories JSONB,
    location VARCHAR(100),
    email VARCHAR(255),
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    profile_data JSONB
);

-- Campaign Assignments (creators assigned to campaigns)
CREATE TABLE IF NOT EXISTS campaign_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending_outreach',
    compensation_agreed DECIMAL(10,2),
    deliverables_agreed JSONB,
    outreach_history JSONB,
    content_posted JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Actions Log (full audit trail)
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    action_type VARCHAR(100),
    action_input JSONB,
    action_output JSONB,
    reasoning TEXT,
    required_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Reports
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    report_type VARCHAR(50),
    metrics JSONB,
    insights TEXT,
    recommendations TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: index for campaign lookups by short id (we use 8-char campaign_id in tools)
CREATE INDEX IF NOT EXISTS idx_campaigns_id ON campaigns(id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_campaign_id ON agent_actions(campaign_id);
