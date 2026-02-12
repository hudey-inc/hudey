-- Notification system: persistent, event-driven notifications per brand.
-- Run in Supabase SQL editor.

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  type        text not null,           -- campaign_approval, creator_response, campaign_completion
  title       text not null,
  body        text,
  campaign_id uuid references campaigns(id) on delete cascade,
  link        text,                    -- relative frontend URL e.g. '/campaigns/abc'
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Fast listing: brand's notifications newest-first
create index idx_notifications_brand_created
  on notifications (brand_id, created_at desc);

-- Fast unread count
create index idx_notifications_brand_unread
  on notifications (brand_id)
  where is_read = false;
