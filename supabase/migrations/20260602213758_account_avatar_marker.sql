-- Avatar marker for profile photos (Phase 1 of the profile-photos work).
-- A non-null avatar_updated_at means an object exists at avatars/<id>/avatar.webp
-- (deterministic key, overwrite-on-replace = zero orphans); null = no avatar, so the UI
-- renders the initial-letter fallback. SERVICE-ROLE-WRITE-ONLY: deliberately NOT added to
-- the `grant update (...) on public.profiles to authenticated` allowlist, so only the
-- /api/account/avatar route (which writes BOTH the R2 object and this column together) can
-- set it -- the marker therefore stays in lockstep with the stored object. Mirrors the
-- last_active_at / storage_* columns. No backfill: every existing profile correctly starts
-- with no avatar (null).
alter table public.profiles
  add column avatar_updated_at timestamptz;
