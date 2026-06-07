-- AI quota change requests (store admin → superadmin review)
-- Run in Supabase SQL Editor after superadmin_ai_quota.sql

create table if not exists ai_quota_requests (
  id                      uuid primary key default gen_random_uuid(),
  requested_by            uuid not null references profiles(id) on delete cascade,
  request_type            text not null check (request_type in ('extend', 'decrease')),
  usage_type              text not null check (usage_type in ('image', 'content', 'both')),
  requested_image_limit   int,
  requested_content_limit int,
  reason                  text not null,
  status                  text not null default 'pending'
                          check (status in ('pending', 'approved', 'denied', 'cancelled')),
  apply_on_approve        boolean,
  review_note             text,
  reviewed_by             uuid references profiles(id) on delete set null,
  reviewed_at             timestamptz,
  created_at              timestamptz default now()
);

create index if not exists idx_ai_quota_requests_status_created
  on ai_quota_requests(status, created_at desc);

create index if not exists idx_ai_quota_requests_requested_by
  on ai_quota_requests(requested_by, created_at desc);
