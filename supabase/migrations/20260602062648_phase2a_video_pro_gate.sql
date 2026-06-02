-- Phase 2a: video uploads are a PAID feature. Block on a free host for EVERYONE
-- (guest + host). It is a tier compare (v_profile.tier = 'free'), mirroring the
-- password / require_email gates — NO tier_limits() change. The universal 5-min /
-- 2-GB video limits are SEPARATE and still apply to paid videos.
--
-- Authoritative gate lives in create_media + create_media_as_host (at the TOP of the
-- tier-caps block, right after v_profile loads — NOT in the universal-limits block,
-- where v_profile.tier isn't loaded yet). The pre-check RPCs gain an advisory
-- `video_blocked` flag so the presign routes can fail fast. All four are
-- create-or-replace (same signatures / jsonb returns) so grants are preserved.

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
  v_month_bytes bigint;
  v_cap bigint;
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024;
  c_max_video_bytes constant bigint := 2::bigint * 1024 * 1024 * 1024;
  c_max_video_seconds constant integer := 300;
begin
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

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- Universal per-file limits (apply to every tier).
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

  -- Tier caps. Load host profile + limits.
  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Video is a PAID feature (Phase 2): a free host's event takes photos only, whether
  -- the guest OR the host uploads.
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
    if v_profile.storage_used_bytes + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

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

create or replace function public.create_media_as_host(
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
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status := 'approved'::public.media_status; -- host = moderator
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024; -- 50 MB
  c_max_video_bytes constant bigint := 2::bigint * 1024 * 1024 * 1024; -- 2 GB
  c_max_video_seconds constant integer := 300; -- 5 min
begin
  -- 1. AUTHORIZATION: caller must own a LIVE event.
  select * into v_event from public.events
    where id = p_event_id and host_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Event not found or not owned by you.' using errcode = 'no_data_found';
  end if;

  -- 2. Key MUST belong to this event (no cross-event writes).
  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- 3. Universal per-file limits.
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

  -- 4. Tier caps — host uploads COUNT against caps (anti-abuse parity).
  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Video is a PAID feature (Phase 2): even the host can't add video to a free event.
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
    if v_profile.storage_used_bytes + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 5. Insert (guest_id NULL = host upload, status always approved) + ledger + usage.
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
$$;

create or replace function public.get_upload_context(p_session_token text, p_type public.media_type)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    return null;
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object(
      'event_id', v_event.id,
      'accepting_uploads', false,
      'event_deleted', true
    );
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_limits.monthly_ingress_bytes;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    v_at_storage_cap := v_profile.storage_used_bytes >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media).
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free')
  );
end;
$$;

create or replace function public.get_host_upload_context(p_event_id uuid, p_type public.media_type)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = auth.uid() and deleted_at is null;
  if not found then
    return null;
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_limits.monthly_ingress_bytes;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    v_at_storage_cap := v_profile.storage_used_bytes >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media_as_host).
  return jsonb_build_object(
    'event_id', v_event.id,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free')
  );
end;
$$;
