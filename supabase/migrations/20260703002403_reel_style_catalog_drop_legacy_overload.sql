-- The new composer (upsert_reel_config with p_style_id + p_orientation) is live + live-verified, so the
-- legacy (p_theme) overload is no longer called by any client. Drop it to remove the ambiguous-overload
-- surface. The `theme` column stays (kept in sync with style_id) for any legacy reader.
drop function if exists public.upsert_reel_config(uuid, text, bigint, int, uuid);