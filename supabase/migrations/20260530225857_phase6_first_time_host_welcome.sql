-- Phase 6 (first-time host welcome) — a once-only "seen the intro" marker.
--
-- New signups get NULL (handle_new_user doesn't set it) → the /dashboard page redirects them
-- to /welcome once. EXISTING hosts are backfilled to now() so they never see it. Host-writable
-- (the welcome's exits self-set it via RLS), added to the profiles column-grant allowlist —
-- tier/storage_*/is_admin stay OFF it (service-role/webhook-only).
alter table public.profiles add column welcomed_at timestamptz;

update public.profiles set welcomed_at = now() where welcomed_at is null;

grant update (welcomed_at) on public.profiles to authenticated;
