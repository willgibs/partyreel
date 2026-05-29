-- Fast-follows — transactional email dedupe log.
-- sendOnce() inserts (kind, dedupe_key); the unique constraint makes re-sends a no-op,
-- so the daily lifecycle cron can call sendOnce every run and Resend is hit AT MOST ONCE
-- per state (frugality — Resend free tier is 3,000 emails/mo). Operator-internal: RLS on
-- with NO policies (deny-all) — written only by the service-role admin client (the cron /
-- email helper), same accepted pattern as public.reports.
create table public.sent_emails (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  kind text not null,
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (kind, dedupe_key)
);

create index sent_emails_profile_idx on public.sent_emails (profile_id);

alter table public.sent_emails enable row level security;
