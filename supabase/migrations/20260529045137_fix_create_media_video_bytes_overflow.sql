-- Fix: create_media threw `integer out of range` on EVERY call (caught by the
-- Phase 2 RPC-contract test). The constant `c_max_video_bytes := 2 * 1024 * 1024
-- * 1024` is evaluated in int4 arithmetic, and 2147483648 overflows int4
-- (max 2147483647) during DECLARE initialization — before the body runs — so no
-- upload could ever be recorded. Force bigint arithmetic with `2::bigint`.
--
-- Only that one line changes; the rest of the function is reproduced verbatim
-- (create or replace requires the full definition; the anon/authenticated EXECUTE
-- grants persist across replace).
create or replace function public.create_media(
  p_session_token text,
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
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status;
  v_period text := to_char(now(), 'YYYY-MM');
  v_count integer;
  -- Universal media limits — mirror lib/media/limits.ts.
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024; -- 50 MB
  -- 2::bigint forces bigint arithmetic; `2 * 1024 * 1024 * 1024` overflows int4.
  c_max_video_bytes constant bigint := 2::bigint * 1024 * 1024 * 1024; -- 2 GB
  c_max_video_seconds constant integer := 300; -- 5 min
begin
  -- 1. Validate the capability token + event state.
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  if not v_event.accepting_uploads then
    raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
  end if;

  -- 2. Defense-in-depth: the key MUST belong to this event (no cross-event writes).
  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- 3. Universal limits (the client already checked these; we don't trust it).
  if p_type = 'photo' and p_file_size_bytes > c_max_photo_bytes then
    raise exception 'Photo exceeds the 50 MB limit.' using errcode = 'check_violation';
  end if;
  if p_type = 'video' then
    if p_file_size_bytes > c_max_video_bytes then
      raise exception 'Video exceeds the 2 GB limit.' using errcode = 'check_violation';
    end if;
    if p_duration_seconds is not null and p_duration_seconds > c_max_video_seconds then
      raise exception 'Video is longer than 5 minutes.' using errcode = 'check_violation';
    end if;
  end if;

  -- 4. Tier caps. Load host profile + limits.
  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- 4a. Per-event caps (count everything not 'removed').
  if p_type = 'photo' and v_limits.per_event_photos is not null then
    select count(*) into v_count from public.media
      where event_id = v_event.id and type = 'photo' and status <> 'removed';
    if v_count >= v_limits.per_event_photos then
      raise exception 'This event has reached its photo limit (%).', v_limits.per_event_photos using errcode = 'check_violation';
    end if;
  elsif p_type = 'video' and v_limits.per_event_videos is not null then
    select count(*) into v_count from public.media
      where event_id = v_event.id and type = 'video' and status <> 'removed';
    if v_count >= v_limits.per_event_videos then
      raise exception 'This event has reached its video limit (%).', v_limits.per_event_videos using errcode = 'check_violation';
    end if;
  end if;

  -- 4b. Monthly caps (per host; counters never decrement -> churn-proof).
  if p_type = 'photo' and v_limits.monthly_photos is not null then
    select coalesce(photo_count, 0) into v_count from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_count, 0) >= v_limits.monthly_photos then
      raise exception 'Monthly photo upload limit reached (%).', v_limits.monthly_photos using errcode = 'check_violation';
    end if;
  elsif p_type = 'video' and v_limits.monthly_videos is not null then
    select coalesce(video_count, 0) into v_count from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_count, 0) >= v_limits.monthly_videos then
      raise exception 'Monthly video upload limit reached (%).', v_limits.monthly_videos using errcode = 'check_violation';
    end if;
  end if;

  -- 4c. Max-tier total storage cap.
  if v_limits.has_storage_cap and v_profile.storage_cap_bytes is not null then
    if v_profile.storage_used_bytes + p_file_size_bytes > v_profile.storage_cap_bytes then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 5. Status follows the event's moderation mode.
  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  -- 6. Insert media + bump the ledger + usage atomically (one function = one tx).
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
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
$$;