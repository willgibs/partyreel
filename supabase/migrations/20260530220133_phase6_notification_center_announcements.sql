-- Phase 6 (notification center) — broadcast announcements + a per-host read marker.
--
-- Derive-on-read notifications need NO feed table: the host alerts (uploads/over-cap/
-- pass-expiry) are computed on read from existing columns. The only new STATE is (a) a
-- global announcements table the operator publishes to, and (b) a per-host "seen" timestamp
-- so each account tracks its own read/unread.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  href text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index announcements_published_at_idx on public.announcements (published_at desc);

alter table public.announcements enable row level security;

-- Global: every signed-in host reads PUBLISHED announcements (the `<= now()` guard lets us
-- schedule). NO write policy — the operator publishes via the service-role admin client / SQL
-- (same trust model as reports). Because this table HAS a policy it gets no
-- rls_enabled_no_policy advisor INFO.
create policy announcements_read on public.announcements
  for select to authenticated
  using (published_at <= now());

-- Per-host read marker. Unread = published_at > coalesce(announcements_seen_at, '-infinity').
alter table public.profiles add column announcements_seen_at timestamptz;

-- The host self-bumps the marker when they open the notification panel. Add ONLY this column
-- to the writable allowlist (additive to the existing display_name/email grant);
-- tier/storage_*/is_admin stay OFF the list (service-role/webhook-only). The profiles_update_own
-- RLS policy still scopes the update to the host's own row.
grant update (announcements_seen_at) on public.profiles to authenticated;
