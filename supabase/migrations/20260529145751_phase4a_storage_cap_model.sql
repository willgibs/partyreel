-- Phase 4a — Storage-cap model rework (no Stripe yet).
--
-- Replaces the old per-event ITEM-CAP model with a TOTAL-STORAGE-CAP model plus a
-- monthly INGRESS-BYTES meter. Reworks three functions to match
-- lib/constants/tiers.ts (kept in lockstep by hand + a Vitest parity test):
--   1. tier_limits()       -> returns (max_events, monthly_ingress_bytes,
--                             default_storage_cap_bytes); drops the item-count columns.
--   2. create_media()      -> drops per-event item caps + count-based monthly caps;
--                             enforces a universal byte cap + a monthly ingress meter.
--   3. get_upload_context()-> reports at_storage_cap / at_monthly_cap (bytes) instead
--                             of at_event_cap / at_monthly_cap (counts).
--
-- THE THREE COUNTERS STAY DELIBERATELY DIFFERENT (do NOT reconcile them):
--   - per-event ITEM caps are GONE (the new cap is account-level bytes).
--   - storage_ledger.cumulative_bytes NEVER decrements -> it is now both the monthly
--     ingress meter AND the delete/re-upload churn defense.
--   - profiles.storage_used_bytes decrements ONLY when the purge cron hard-deletes
--     (purge_media_rows) -> it tracks bytes actually stored, and is what the cap reads.
--
-- The storage cap is account-level: coalesce(profiles.storage_cap_bytes, the tier
-- default). Free's default (2 GB) comes from tier_limits(), so NO backfill and NO
-- handle_new_user change are needed; the Stripe webhook (Phase 4b/4c) just writes
-- storage_cap_bytes for paid tiers. A 10% overflow buffer is allowed before a hard
-- block (crossing the BASE cap opens the over-capacity grace, a Phase-4 billing
-- state; crossing the buffer blocks new uploads here).
--
-- INT4-OVERFLOW GOTCHA (bit us in Phase 2): `2 * 1024 * 1024 * 1024` overflows int4
-- DURING declaration. Every GB constant below forces bigint with `N::bigint`.

-- --- 1. tier_limits() -------------------------------------------------------
-- The return columns change, so this is a DROP + CREATE (create-or-replace cannot
-- change a function's return type). enforce_event_limit() still reads max_events, so
-- it keeps working unchanged. PUBLIC EXECUTE (the prior default) is restored — the fn
-- only returns static limit numbers, no user data.
drop function if exists public.tier_limits(public.tier_type);
create function public.tier_limits(p_tier public.tier_type)
returns table (
  max_events integer,
  monthly_ingress_bytes bigint,
  default_storage_cap_bytes bigint
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
      when 'free' then 20::bigint * 1024 * 1024 * 1024 -- 20 GB monthly ingress
      else null -- pro / event_pass / max: unmetered
    end::bigint,
    case p_tier
      when 'free' then 2::bigint * 1024 * 1024 * 1024 -- 2 GB
      when 'event_pass' then 75::bigint * 1024 * 1024 * 1024 -- 75 GB
      else null -- pro: governed by profiles.storage_cap_bytes; max(retired): unused
    end::bigint;
$$;

-- --- 2. create_media() ------------------------------------------------------
-- Same signature -> create-or-replace preserves the anon/authenticated EXECUTE grants.
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
  -- Universal media limits — mirror lib/media/limits.ts. 2::bigint avoids int4 overflow.
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024; -- 50 MB
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

  -- 4a. Monthly INGRESS meter — bytes uploaded this period. cumulative_bytes never
  -- decrements, so this also defends against delete -> re-upload egress burn.
  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_limits.monthly_ingress_bytes then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 4b. Total storage cap (account-level). Effective cap = explicit override else the
  -- tier default. 10% overflow buffer before a hard block (see header).
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    if v_profile.storage_used_bytes + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 5. Status follows the event's moderation mode.
  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  -- 6. Insert media + bump the ledger + usage atomically (one function = one tx).
  -- photo_count/video_count stay for analytics; enforcement is on bytes now.
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

-- --- 3. get_upload_context() ------------------------------------------------
-- Same signature -> create-or-replace preserves the anon/authenticated grant. p_type
-- is retained for signature/grant stability (no per-type caps remain; the cap is
-- account-level bytes). Mirrors create_media's checks so the advisory pre-check and
-- the authoritative create_media check cannot drift. Coarse on purpose: it reports
-- whether the account is ALREADY at a cap (it lacks the incoming file size); a rare
-- "just-over" orphan is acceptable (the Phase-3 purge sweeps orphans).
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

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Already over the monthly ingress meter?
  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_limits.monthly_ingress_bytes;
  end if;

  -- Already at/over the storage cap (incl. the 10% buffer)?
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    v_at_storage_cap := v_profile.storage_used_bytes >= v_cap + (v_cap / 10);
  end if;

  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap
  );
end;
$$;
