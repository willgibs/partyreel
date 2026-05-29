-- Fast-follow — over-capacity grace clock.
-- profiles.storage_grace_until: set when a lapsed account is over its storage cap (a
-- downgrade or Event-Pass expiry leaves storage_used_bytes > the new cap). During the
-- grace, media stays fully accessible; the lifecycle cron emails warnings, then
-- auto-reduces (largest-first) once it passes. null = not in grace. Service-role-write-
-- only (NOT in the profiles update grant allowlist) — written only by the cron via the
-- admin client.
alter table public.profiles add column storage_grace_until timestamptz;
