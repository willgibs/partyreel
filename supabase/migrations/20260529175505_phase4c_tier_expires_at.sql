-- Cut 4c — Event Pass term clock.
-- profiles.tier_expires_at: when an Event Pass (one-time purchase) lapses, the purge
-- cron's expiry sweep downgrades the profile to Free. null = no expiry (Free, or an
-- active Pro subscription). Service-role-write-only: NOT in the profiles update grant
-- allowlist (display_name, email), so the client can never set it (same protection
-- class as tier/storage_*); written only by the Stripe webhook + the expiry sweep
-- (both via the service-role admin client).
alter table public.profiles add column tier_expires_at timestamptz;
