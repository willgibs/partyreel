-- Server-mediate the media-write RPCs (H1: size-spoof cap-evasion). Part B of the pentest remediation.
--
-- ROOT CAUSE: create_media + create_media_as_host were EXECUTE-granted to anon/authenticated, so they were
-- directly callable via PostgREST, BYPASSING the complete-upload route's authoritative R2-HEAD size. A
-- client could supply a spoofed file_size_bytes (negative -> the 415962b CHECK now blocks; size=1 ->
-- undercount) and defeat the storage cap, whose meter is SUM(media.file_size_bytes) -> a cost bomb.
--
-- FIX: make BOTH media-write RPCs SERVICE-ROLE-ONLY. The Next complete-upload routes already HEAD R2 for
-- the real size and (after this change) call via the service-role admin client, so file_size_bytes is
-- always server-derived. The admin client has NO auth.uid(), so create_media_as_host's host-ownership
-- check moves to a TRUSTED p_host_id param the route derives from getUser(). create_media is
-- session-token-keyed (never reads auth.uid()) -> no signature change, just the grant lockdown.
-- (LESSON: enforce at the boundary the attacker actually reaches -- the anon RPC grant IS the surface.)

-- 1. Recreate create_media_as_host with a trusted p_host_id (replaces the internal auth.uid() ownership
--    check). Body is otherwise byte-for-byte the prior version.
drop function if exists public.create_media_as_host(uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer);

create function public.create_media_as_host(
  p_host_id uuid,
  p_event_id uuid,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status := 'approved'::public.media_status; -- host = moderator
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
begin
  -- Ownership via the join: p_host_id is the route's getUser()-verified host id (the service-role caller
  -- has no auth.uid()). A host can only create media on an event they own; a wrong p_host_id -> not found.
  select * into v_event from public.events
    where id = p_event_id and host_id = p_host_id and deleted_at is null;
  if not found then
    raise exception 'Event not found or not owned by you.' using errcode = 'no_data_found';
  end if;

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- Universal per-upload ceiling. NO per-event host cap here -- the host owns max_upload_bytes
  -- and is exempt (it bounds guest uploads only).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_limits.monthly_ingress_bytes then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status
  );

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$function$;

-- 2. Lock BOTH media-write RPCs to service-role-only (the routes call them via the admin client). Supabase
--    default privileges auto-grant new functions to anon/authenticated/service_role; revoke the
--    public-facing roles, keep service_role (mirrors the service-role-only purge_media_rows).
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;
revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer) to service_role;
