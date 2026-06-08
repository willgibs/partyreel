-- Universal 10 GB per-upload ceiling + host-configurable per-event upload cap.
--
-- WHY: we're retiring the per-TYPE per-file limits (50 MB photo / 2 GB video / 5-min video)
-- in favour of ONE universal per-upload ceiling of 10 GB (10 GiB) for photos AND videos, with
-- the 5-minute video duration cap dropped entirely (size is the only gate). This removes
-- per-file friction and lets storage caps fill faster (an intentional upgrade nudge). Video
-- stays Pro-gated; the storage cap + monthly ingress meter are unchanged.
--
-- The original purpose of the per-file limit — stopping one guest from filling the host's paid
-- storage — is preserved by a NEW host-configurable per-event cap, events.max_upload_bytes:
--   • NULL  = no host cap (the universal 10 GB ceiling applies).
--   • set   = a stricter per-upload ceiling (25 MiB .. 10 GiB) the host chooses.
-- It constrains GUEST uploads only — the host's own batch uploads (create_media_as_host) are
-- EXEMPT, since the host owns the setting and can change it. Available to every tier (it's
-- host-protection / anti-abuse, not a premium feature).
--
-- SECURITY (heaviest red-teaming): the host cap is read from the event ROW inside the
-- SECURITY DEFINER RPC, NEVER accepted as a client/RPC parameter, so a guest cannot spoof it.
-- The authoritative size is the R2-HEAD measured file_size_bytes the complete-upload route
-- passes in (ADR-0014) — the client's declared size is never trusted. The effective guest
-- per-upload limit min(10 GB, host cap, remaining storage) is three AND-ed upper-bound checks
-- on that real size (the storage cap check is unchanged and supplies the "remaining" term).
--
-- ORPHANS: a rejected over-cap upload leaves an R2 object with no media row (the RPC rolls back
-- the same tx, so the ingress ledger is NOT bumped). That orphan is reclaimed by the existing
-- purge sweep; its max size grows 2 GB -> 10 GB. Dropping the duration cap removes one orphan
-- class entirely.
--
-- MECHANICS: add the column + a range CHECK + an ADDITIVE column grant (the table-level grant
-- was already revoked in 20260604163011_lock_down_events_write_grant — a column ACL exists, so
-- this adds to it; NOT the silent-no-op trap, which is the inverse: revoking a column under a
-- table grant). Then CREATE OR REPLACE the three affected upload RPCs (identical signatures +
-- jsonb returns => the anon/authenticated EXECUTE grants are preserved; do NOT drop them). Only
-- the limit logic changes; the video Pro-gate, ingress meter, storage-cap check, ledger/usage
-- writes are byte-for-byte unchanged from the prior head (20260604002059_active_bytes_cap_meter).
-- get_host_upload_context is intentionally NOT touched (the host is exempt from the host cap).
--
-- ⚠️ int4 overflow: 10 * 1024^3 = 10,737,418,240 overflows int4 even when assigned to a bigint,
-- so every 10 GiB literal is forced with `10::bigint * 1024 * 1024 * 1024`. Mirrors MAX_UPLOAD_BYTES
-- (= 10 * 1024**3) in src/lib/media/limits.ts.

-- --- 1. The host-configurable per-event cap column. -----------------------------------------
alter table public.events add column max_upload_bytes bigint;

comment on column public.events.max_upload_bytes is
  'Host-configurable per-upload size cap for GUEST uploads (bytes). NULL = no host cap (the universal 10 GB ceiling applies). Range 25 MiB .. 10 GiB (events_max_upload_bytes_range). The host''s own uploads are exempt.';

-- Floor 25 MiB (the smallest preset) so a direct PATCH cannot set a sub-photo cap that silently
-- denies every guest upload (that is what accepting_uploads=false is for). Ceiling 10 GiB.
alter table public.events add constraint events_max_upload_bytes_range
  check (max_upload_bytes is null
         or (max_upload_bytes between 26214400 and 10::bigint * 1024 * 1024 * 1024));

-- --- 2. Additive column grant (host-writable). ----------------------------------------------
grant insert (max_upload_bytes), update (max_upload_bytes) on public.events to authenticated;

-- --- 3. create_media (guest upload): universal ceiling + GUEST-ONLY host cap. ---------------
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
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  -- Universal per-upload ceiling (every tier, photo + video). Authoritative on the R2-HEAD size
  -- the complete route passes, never the client's claim (ADR-0014). The 'exceeds' wording routes
  -- to too_large in the mutation wrapper (and avoids 'limit'/'capacity', which mean cap_reached).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;
  -- Host-configurable per-event cap — GUESTS ONLY (create_media_as_host is exempt). NULL = no
  -- cap. Read from the event row, never client-supplied, so a guest cannot spoof a higher cap.
  if v_event.max_upload_bytes is not null
     and p_file_size_bytes > v_event.max_upload_bytes then
    raise exception 'File exceeds the size the host allows for this event.' using errcode = 'check_violation';
  end if;

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

-- --- 4. create_media_as_host (authenticated host upload): universal ceiling ONLY. -----------
-- The host's own uploads are EXEMPT from the per-event host cap (it constrains guests).
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
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  -- 3. Universal per-upload ceiling (every tier, photo + video). NO per-event host cap here —
  -- the host owns max_upload_bytes and is exempt from it (it bounds guest uploads only).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
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

-- --- 5. get_upload_context (guest presign pre-check): expose the guest-effective ceiling. ----
-- Returns max_upload_bytes = least(10 GiB, host cap) — the host CEILING, NOT remaining storage
-- (remaining stays behind at_storage_cap so a guest never learns the host's usage). Advisory:
-- create_media is authoritative.
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
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  -- Advisory: a free event can't take video (authoritative gate is in create_media). The
  -- per-upload ceiling is the host cap clamped to the universal 10 GiB (never remaining bytes).
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free'),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes))
  );
end;
$$;
