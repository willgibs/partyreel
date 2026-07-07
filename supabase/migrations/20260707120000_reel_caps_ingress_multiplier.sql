-- ADR-0021 (T1 ruling): reel length caps by tier + monthly ingress as a storage-cap multiplier.
--
-- Three changes, all mirroring src/lib/constants/tiers.ts (the human-authored source; the Vitest
-- parity test guards the pairing):
--   1. tier_limits() gains max_reel_seconds (free 30 / paid 60) + ingress_cap_multiplier (free null /
--      paid 3). monthly_ingress_bytes stays the STATIC meter (free 20 GB; paid null = derived).
--   2. monthly_ingress_cap() — the ONE derivation of a host's effective ingress bound (static for
--      Free; multiplier x the effective storage cap for paid). create_media, create_media_as_host,
--      and the get_upload_context advisory all switch to it, so a paid host's abuse bound scales
--      with the plan they pay for (300 GB / 1.5 TB / 6 TB / 225 GB) instead of being unmetered.
--   3. upsert_reel_config clamps p_length_seconds to the host's tier cap (never trust the client).
--
-- NOTE for the applier: the Phase-2 style-catalog migration (commit 0cfcc4f) that added
-- highlight_reels.style_id/orientation + the (p_style_id, p_orientation, ...) upsert_reel_config was
-- applied via MCP but its file was never committed, so section 5 below ALSO re-establishes
-- repo-file = applied-version parity for that function (same live signature, body reconstructed +
-- the new clamp).

-- --- 1. tier_limits(): + ingress_cap_multiplier + max_reel_seconds --------------------------------
-- Return-type change -> drop + recreate (create-or-replace can't alter a returns table). Callers all
-- `select * into <record>` and read columns BY NAME, so appending columns is safe. tier_limits() is
-- only ever called INSIDE security-definer fns; default function grants are unchanged on purpose
-- (mirrors the phase4a recreate).
drop function if exists public.tier_limits(public.tier_type);

create function public.tier_limits(p_tier public.tier_type)
returns table (
  max_events integer,
  monthly_ingress_bytes bigint,
  default_storage_cap_bytes bigint,
  ingress_cap_multiplier integer,
  max_reel_seconds integer
)
language sql
immutable
set search_path = ''
as $$
  select
    case p_tier
      when 'free' then 1
      when 'event_pass' then 1
      else null -- pro + max(retired): unlimited events
    end::integer,
    case p_tier
      when 'free' then 20::bigint * 1024 * 1024 * 1024 -- 20 GB static monthly ingress
      else null -- pro / event_pass / max: DERIVED (ingress_cap_multiplier x the effective storage cap)
    end::bigint,
    case p_tier
      when 'free' then 2::bigint * 1024 * 1024 * 1024 -- 2 GB
      when 'event_pass' then 75::bigint * 1024 * 1024 * 1024 -- 75 GB
      else null -- pro: governed by profiles.storage_cap_bytes; max(retired): unused
    end::bigint,
    case p_tier
      when 'free' then null -- free: the static monthly_ingress_bytes above applies
      else 3 -- ADR-0021: paid ingress = 3x the effective storage cap
    end::integer,
    case p_tier
      when 'free' then 30
      else 60 -- ADR-0021: paid reels run to 60s ('max' retired -> treated as pro)
    end::integer;
$$;

-- --- 2. monthly_ingress_cap(): the one derivation of a host's ingress bound -----------------------
-- Mirrors monthlyIngressCap() in tiers.ts. Free -> the static 20 GB. Paid -> multiplier x
-- coalesce(the profile's storage_cap_bytes, the tier default). A paid profile with NO cap on record
-- (the Stripe webhook writes it) yields NULL = unmetered: fail OPEN, never block a paying host on
-- missing data. int * bigint -> bigint, no int4 overflow.
create or replace function public.monthly_ingress_cap(
  p_tier public.tier_type,
  p_storage_cap_bytes bigint
)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    l.monthly_ingress_bytes,
    l.ingress_cap_multiplier::bigint
      * coalesce(p_storage_cap_bytes, l.default_storage_cap_bytes)
  )
  from public.tier_limits(p_tier) l;
$$;

-- --- 3. create_media + create_media_as_host: the multiplier-derived ingress bound -----------------
-- Bodies are byte-for-byte their latest versions (20260608120000 / 20260608210000) EXCEPT: the
-- effective storage cap (v_cap) is computed once up front, and the ingress check reads
-- monthly_ingress_cap() instead of the static column. Same signatures -> create-or-replace
-- preserves the service-role-only grants (both were locked down in 20260608210000).

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
  v_ingress_cap bigint;
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
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  -- Video is a PAID feature (Phase 2): a free host's event takes photos only, whether
  -- the guest OR the host uploads.
  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- Monthly ingress: Free = the static 20 GB meter; paid = 3x the effective storage cap
  -- (ADR-0021). NULL = unmetered (a paid profile with no cap on record fails open).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

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

create or replace function public.create_media_as_host(
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
  v_ingress_cap bigint;
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
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- Monthly ingress: Free = the static 20 GB meter; paid = 3x the effective storage cap
  -- (ADR-0021). NULL = unmetered (a paid profile with no cap on record fails open).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

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

-- --- 4. get_upload_context: the advisory mirrors the authoritative check --------------------------
-- Same body as 20260608120000 except at_monthly_cap reads the derived bound (a paid host near 3x
-- their cap should see the advisory agree with what create_media will enforce). Same signature ->
-- grants preserved.
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
  v_ingress_cap bigint;
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

  -- Already over the monthly ingress meter? (Free static / paid derived — ADR-0021.)
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
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

-- --- 5. upsert_reel_config: clamp p_length_seconds to the host's tier cap -------------------------
-- Recreates the LIVE (p_style_id, p_orientation, ...) signature (the uncommitted Phase-2 migration —
-- see the header note) with one change: p_length_seconds is clamped server-side. Auto (null) stays
-- null (the render/mint path clamps Auto to the cap at render time, so a later upgrade lengthens an
-- Auto reel with no re-save); junk (<= 0) is treated as Auto; an explicit length clamps to the tier
-- cap. Drop-by-type-signature first so this can never leave two overloads behind.
drop function if exists public.upsert_reel_config(uuid, text, text, bigint, int, uuid);

create function public.upsert_reel_config(
  p_event_id       uuid,
  p_style_id       text,
  p_orientation    text,
  p_seed           bigint,
  p_length_seconds int  default null,   -- null = auto length (fills up to the tier cap)
  p_cover_media_id uuid default null    -- null = no pinned cover (opener = first in order)
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := (select auth.uid());
  v_owns        boolean;
  v_cover       uuid := p_cover_media_id;
  v_max_seconds int;
  v_length      int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The caller must HOST the event (and it must not be deleted). Mirrors reorder_reel's event check.
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Soft-validate the cover belongs to this event, else null it (graceful, never rejects the save).
  if v_cover is not null and not exists (
    select 1 from public.media m where m.id = v_cover and m.event_id = p_event_id
  ) then
    v_cover := null;
  end if;

  -- Tier length clamp (ADR-0021): the composer disables what the tier can't pick, but the SERVER is
  -- the boundary — a crafted call storing 600s would defeat the cap the render path enforces.
  select t.max_reel_seconds into v_max_seconds
  from public.profiles pr, public.tier_limits(pr.tier) t
  where pr.id = v_uid;
  v_length := case
    when p_length_seconds is null or p_length_seconds <= 0 then null
    else least(p_length_seconds, coalesce(v_max_seconds, 30))
  end;

  insert into public.highlight_reels
    (event_id, style_id, theme, orientation, seed, length_seconds, cover_media_id, status)
  values
    (p_event_id, p_style_id, p_style_id, p_orientation, p_seed, v_length, v_cover, 'pending')
  on conflict (event_id) do update
    set style_id       = excluded.style_id,
        theme          = excluded.theme, -- legacy column, kept synced with style_id
        orientation    = excluded.orientation,
        seed           = excluded.seed,
        length_seconds = excluded.length_seconds,
        cover_media_id = excluded.cover_media_id,
        updated_at     = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Lockdown identical to the prior version: revoke the implicit grants (incl. the anon EXECUTE an
-- MCP-applied create would add), then grant ONLY to authenticated.
revoke all on function public.upsert_reel_config(uuid, text, text, bigint, int, uuid) from public, anon, authenticated;
grant execute on function public.upsert_reel_config(uuid, text, text, bigint, int, uuid) to authenticated;

-- monthly_ingress_cap is an internal helper (called only inside security-definer fns); strip the
-- default public grants so it appears in neither advisor list.
revoke all on function public.monthly_ingress_cap(public.tier_type, bigint) from public, anon, authenticated;
