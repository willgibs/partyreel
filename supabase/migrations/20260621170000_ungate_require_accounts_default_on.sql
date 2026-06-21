-- Un-gate "Require accounts to upload" (allow_anonymous_uploads) + flip the default ON.
--
-- WHY: requiring guest accounts was a Pro-only feature (incentivize upgrades for safety),
-- but anonymous uploads capture no emails, so FREE events seeded no new account-holders
-- and the growth loop stalled. Make it FREE for any tier and DEFAULT-ON (require accounts):
-- safety + guest-email capture grows the platform; allowing anonymous uploads becomes an
-- opt-in toggle (with an in-app consequence confirmation, UploadsSection).
--
-- This drops the Pro gate ONLY. Password + custom_slug stay Pro-gated (via their own
-- set_event_password / set_event_slug RPCs, NOT this trigger). The flag's ENFORCEMENT is
-- unchanged: the gallery teaser-gate (resolveGalleryAccess) and the create_guest email
-- check still require a verified account to upload when allow_anonymous_uploads = false.

-- 1. Drop the Pro gate. enforce_event_pro_gates() gated ONLY allow_anonymous_uploads, so
--    its trigger + function go away entirely.
drop trigger if exists events_enforce_pro_gates on public.events;
drop function if exists public.enforce_event_pro_gates();

-- 2. Default ON = require accounts (allow_anonymous_uploads defaults to false) for NEW
--    events. Existing rows keep their current value (no backfill - the default governs
--    inserts only).
alter table public.events alter column allow_anonymous_uploads set default false;
