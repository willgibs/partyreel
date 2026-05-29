-- ===========================================================================
-- get_upload_context — presign-time pre-check for the guest upload flow (Phase 2).
--
-- The /api/r2/presign-upload route must derive the R2 object key SERVER-SIDE from
-- the capability token (never trust a client key — ADR-0003/0004), so it needs to
-- resolve session_token -> event without giving anon any table access. This is
-- that resolver. It ALSO reports whether the host is already at a count cap so the
-- route can reject BEFORE issuing a presigned URL — minimizing orphaned R2 objects
-- (uploaded bytes that create_media would then reject).
--
-- The cap logic MIRRORS create_media exactly by reading the SAME source
-- (public.tier_limits + the same count queries), so the advisory pre-check and the
-- authoritative create_media check cannot drift. create_media remains the source of
-- truth; this is best-effort. The Max-tier per-BYTE storage cap is intentionally NOT
-- pre-checked here (it needs the incoming file size and is a rare edge) — create_media
-- enforces it; a rare orphan there is acceptable (Phase-3 purge cleans orphans).
--
-- Returns NULL for an unknown session (route -> 401). For a soft-deleted event it
-- returns { event_id, accepting_uploads:false, event_deleted:true } so the route can
-- 409 without leaking. Otherwise booleans only — no host internals are disclosed to
-- the anonymous guest.
--
-- SECURITY: SECURITY DEFINER + pinned search_path, executable by anon — the opaque
-- session_token IS the authorization (ADR-0004). This is the 5th such anon RPC, so
-- get_advisors now reports 5 accepted "SECURITY DEFINER exposed to anon" WARNs.
-- ===========================================================================
create or replace function public.get_upload_context(
  p_session_token text,
  p_type public.media_type
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_tier public.tier_type;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_count integer;
  v_at_event_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    return null; -- unknown session -> route treats as invalid_session (401)
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object(
      'event_id', v_event.id,
      'accepting_uploads', false,
      'event_deleted', true
    );
  end if;

  select tier into v_tier from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_tier);

  -- Count caps, per type. Mirrors create_media (per-event: everything not 'removed';
  -- monthly: the host's storage_ledger row for the current period).
  if p_type = 'photo' then
    if v_limits.per_event_photos is not null then
      select count(*) into v_count from public.media
        where event_id = v_event.id and type = 'photo' and status <> 'removed';
      v_at_event_cap := v_count >= v_limits.per_event_photos;
    end if;
    if v_limits.monthly_photos is not null then
      select coalesce(photo_count, 0) into v_count from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_count, 0) >= v_limits.monthly_photos;
    end if;
  else
    if v_limits.per_event_videos is not null then
      select count(*) into v_count from public.media
        where event_id = v_event.id and type = 'video' and status <> 'removed';
      v_at_event_cap := v_count >= v_limits.per_event_videos;
    end if;
    if v_limits.monthly_videos is not null then
      select coalesce(video_count, 0) into v_count from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_count, 0) >= v_limits.monthly_videos;
    end if;
  end if;

  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'at_event_cap', v_at_event_cap,
    'at_monthly_cap', v_at_monthly_cap
  );
end;
$$;

-- Anon (guests) + authenticated (a logged-in host acting as a guest) may call it.
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;
