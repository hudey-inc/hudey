-- Webhook reliability: idempotency, deduplication, audit logging.
-- Run in Supabase SQL editor.

-- 1. Clean up existing duplicate (email_id, event_type) rows,
--    keeping only the earliest record per pair.
delete from email_events
where id not in (
  select distinct on (email_id, event_type) id
  from email_events
  order by email_id, event_type, created_at asc
);

-- 2. Unique index on email_events for delivery event idempotency.
--    DB-level backstop: even if application check has a race condition,
--    the second INSERT is rejected.
create unique index if not exists idx_email_events_unique_event
  on email_events (email_id, event_type);

-- 3. Deduplication table for inbound email replies.
create table if not exists processed_inbound_replies (
  id         uuid primary key default gen_random_uuid(),
  dedup_key  varchar(255) not null unique,
  from_email varchar(255),
  created_at timestamptz not null default now()
);

comment on table processed_inbound_replies is
  'Deduplication tracker for inbound webhook replies. Safe to prune rows older than 7 days.';

-- 4. Webhook audit log for debugging.
create table if not exists webhook_log (
  id             uuid primary key default gen_random_uuid(),
  endpoint       varchar(100) not null,    -- 'resend' or 'inbound'
  webhook_id     varchar(255),             -- webhook-id header
  body_hash      varchar(64),              -- SHA-256 of request body
  status_code    smallint not null,        -- HTTP status returned
  result_summary varchar(255),             -- 'ok', 'duplicate', 'bad_sig', 'error'
  created_at     timestamptz not null default now()
);

create index if not exists idx_webhook_log_created
  on webhook_log (created_at desc);
