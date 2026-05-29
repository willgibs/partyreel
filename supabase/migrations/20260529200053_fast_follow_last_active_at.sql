-- Free-tier inactivity removal — host activity clock.
-- profiles.last_active_at: bumped (throttled) on sign-in + any authenticated host page use
-- via touchHostActive(). The inactivity sweep treats an event as "active" if the LATEST of
-- {last_active_at, events.created_at/updated_at, the event's newest media.created_at} is
-- within 6 months — so uploads (media.created_at) and host edits (events.updated_at, via
-- set_updated_at) already count without bumping this column. Service-role-write-only (NOT
-- in the profiles update grant allowlist). Existing rows default to now() (a fresh clock,
-- so no one is removed for 6 months after this ships).
alter table public.profiles
  add column last_active_at timestamptz not null default now();
