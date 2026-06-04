-- Phase 1.5 (security hotfix): lock down the host's direct write access to media.
--
-- Phase 1 (…_active_bytes_cap_meter) made the storage cap read SUM(media.file_size_bytes) of
-- non-removed media. But `media` kept Supabase's DEFAULT grant: `authenticated` held UPDATE on
-- EVERY column (+ INSERT + DELETE), and the media_host_all RLS policy gates the ROW by ownership
-- but NOT which columns change. So a host could PATCH their own media's file_size_bytes to 0 and
-- evade the active-bytes cap (confirmed via a rolled-back RLS test). `profiles` was already
-- correctly column-locked; `media` was not.
--
-- Hosts only MODERATE media (status, removed_at) via removeMedia / setMediaStatus /
-- approveAllPending. Every INSERT goes through the create_media* SECURITY DEFINER RPCs; every
-- hard-delete through purge_media_rows (service-role); admin moderation uses the service-role
-- client. So `authenticated` needs NO direct insert/delete and only a 2-column update. Revoke the
-- broad grant and re-grant ONLY the moderation columns (mirrors the profiles allowlist). SELECT is
-- left intact (the host grid + recovery bin read media via RLS).
--
-- Also closes: host-writable original_key/preview_key (cross-event read), direct INSERT (bypasses
-- the cap/ledger/video-gate/per-file limits), direct DELETE (bypasses the recovery soft-delete +
-- the storage_used_bytes accounting). NOTE: `events` has the same default-grant gap
-- (event_password_hash / custom_slug / qr_token / require_email) — deferred to a dedicated
-- post-roadmap security phase. `anon` has no media RLS write policy, so its (moot) table write
-- grants are left untouched here.
--
-- Phase 2 will extend this grant to (status, removed_at, purge_at) when it adds the column.

revoke insert, update, delete on public.media from authenticated;
grant update (status, removed_at) on public.media to authenticated;
