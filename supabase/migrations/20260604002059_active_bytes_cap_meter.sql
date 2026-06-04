-- Recovery / Recently Deleted — Phase 1: the storage cap now reads ACTIVE bytes.
--
-- WHY: the cap was enforced against profiles.storage_used_bytes — the PHYSICAL R2 counter,
-- which only drops at hard-purge (purge_media_rows). So soft-deleted/soft-removed media kept
-- counting against the cap until the purge cron reclaimed it: a host could NOT free cap room
-- by deleting. The Recovery initiative needs deletes to free cap room immediately, so the cap
-- now reads ACTIVE bytes = non-removed media in non-deleted events (the SAME definition the
-- over-capacity sweep + the admin account view already use; see lib/db/queries/accounts.ts).
--
-- storage_used_bytes KEEPS its invariant as the PHYSICAL meter — still incremented here on
-- create, still decremented ONLY in purge_media_rows. It simply stops being the cap meter.
-- The monthly INGRESS meter (storage_ledger.cumulative_bytes) is UNCHANGED: it stays the
-- delete->re-upload RATE defense. (The TOTAL deleted-but-stored footprint is bounded
-- separately by the Phase-2 cron standby-budget eviction — see the recovery plan.)
--
-- MECHANICS: a new host_active_bytes(uuid) helper centralizes the active-bytes SUM, and the
-- four upload functions are CREATE-OR-REPLACE'd (same signatures + jsonb returns -> the live
-- grants are preserved; do NOT drop them) swapping ONLY the cap comparison. Everything else —
-- the video Pro-gate, the universal per-file limits, the ingress meter, the ledger/usage
-- writes, the advisory video_blocked flag — is byte-for-byte unchanged from the prior head
-- (20260602062648_phase2a_video_pro_gate.sql).

-- --- Indexes supporting the active-bytes aggregate on the upload hot path. --------------
-- Partials (they do NOT duplicate media_event_id_status_idx / events_host_id_idx). This
-- feature grows the count of soft-deleted rows per host, so excluding them keeps the SUM cheap.
create index if not exists media_active_bytes_idx
  on public.media (event_id) include (file_size_bytes) where status <> 'removed';
create index if not exists events_host_active_idx
  on public.events (host_id) where deleted_at is null;

-- --- host_active_bytes(): the SINGLE source of "active bytes". -------------------------------
-- SECURITY DEFINER + search_path='' like the other helpers. REVOKED from anon/authenticated so
-- it never appears in the anon/authenticated SECURITY DEFINER advisor lints (0028/0029): it is
-- only ever called from inside the SECURITY DEFINER functions below, which run as the owner and
-- retain EXECUTE. Phase 3's restore RPCs reuse this same helper.
create or replace function public.host_active_bytes(p_host_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(m.file_size_bytes), 0)::bigint
  from public.media m
  join public.events e on e.id = m.event_id
  where e.host_id = p_host_id
    and e.deleted_at is null
    and m.status <> 'removed';
$$;

revoke all on function public.host_active_bytes(uuid) from public, anon, authenticated;

-- --- create_media (guest upload) ------------------------------------------------------------
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
    -- Recovery Phase 1: the cap reads ACTIVE bytes (host_active_bytes), NOT the physical
    -- storage_used_bytes — so removed/deleted media no longer counts and deleting frees room.
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
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

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$$;

-- --- create_media_as_host (authenticated host upload) ---------------------------------------
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
    -- Recovery Phase 1: cap reads ACTIVE bytes (host_active_bytes), not physical storage_used_bytes.
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
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

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$$;

-- --- get_upload_context (guest presign pre-check) -------------------------------------------
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
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
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

-- --- get_host_upload_context (host presign pre-check) ---------------------------------------
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
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media_as_host.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
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
