-- Saved creators: per-brand favourites for reuse across campaigns.
-- Run in Supabase SQL editor.

create table if not exists saved_creators (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references brands(id) on delete cascade,
  creator_id uuid not null references creators(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(brand_id, creator_id)
);

create index if not exists idx_saved_creators_brand
  on saved_creators (brand_id, created_at desc);
