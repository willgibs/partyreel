-- ===========================================================================
-- Host-side media upload — the authenticated twin of the guest upload RPCs.
--
-- Until now media flowed one way: anonymous guests uploaded via create_media
-- (capability token), and the host only curated. This adds the reverse — a host
-- (e.g. handed a batch of finished photos by a hired photographer) uploads media
-- straight into their own event. The media table already anticipated this:
-- media.guest_id is `on delete set null` and documented "null when uploaded by the
-- host", so a host upload is simply a row with guest_id IS NULL.
--
-- WHY NEW RPCs (not a direct RLS insert): the media_host_all RLS policy would let a
-- host INSERT a media row, but the storage accounting (storage_ledger.cumulative_bytes
-- + profiles.storage_used_bytes) and the cap enforcement live INSIDE create_media, and
-- profiles.storage_used_bytes is RPC/service-role-write-only. A direct insert would
-- bypass all of that → unmetered free storage → breaks the storage-cap pricing +
-- anti-abuse model. So host uploads go through a SECURITY DEFINER RPC that does the
-- SAME accounting + caps as the guest path.
--
-- HOW THE HOST TWIN DIFFERS FROM create_media / get_upload_context:
--   - AUTH: ownership via auth.uid() + event_id (a verified host JWT), not a
--     capability session_token. auth.uid() reads the request JWT and resolves
--     correctly inside SECURITY DEFINER + `set search_path = ''` (the auth.* schema
--     is qualified) — verified live. This is the FIRST auth.uid()-in-SECURITY-DEFINER
--     function in this codebase (the guest RPCs all use capability tokens).
--   - STATUS: always 'approved' (the host IS the moderator — no moderation_mode
--     branch, no pending queue for their own uploads).
--   - guest_id: NULL (marks a host upload).
--   - accepting_uploads is NOT checked — that toggle is the GUEST-facing gate; the
--     host owns the event and can add to it even with guest uploads paused.
-- Everything else — key-prefix defense, universal per-file limits, the monthly
-- ingress meter, the storage cap + 10% buffer, the ledger upsert + usage bump,
-- idempotent-on-retry — is COPIED VERBATIM from create_media so the two paths can't
-- drift. The cap NUMBERS come from public.tier_limits(), which mirrors
-- lib/constants/tiers.ts (guarded by the Vitest parity test in tiers.test.ts).
--
-- INT4-OVERFLOW GOTCHA (bit create_media in Phase 2): `2 * 1024 * 1024 * 1024` (2 GB)
-- overflows int4 DURING declaration. Force bigint with `2::bigint * ...` (see below).
--
-- ADVISOR IMPACT (accepted by design — do NOT "fix"): both functions are SECURITY
-- DEFINER granted to `authenticated` ONLY (revoked from public/anon). They add 2
-- entries to advisor lint 0029 (authenticated_security_definer_function_executable)
-- and ZERO to lint 0028 (anon-executable, the "8 capability RPC" list). That is
-- intentional: each authorizes internally via auth.uid() event-ownership. Revoking
-- the authenticated grant would break host upload. Never grant to anon (a host upload
-- requires a verified auth.uid()).
-- ===========================================================================

-- --- 1. create_media_as_host() ---------------------------------------------
create function public.create_media_as_host(
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
  -- Universal media limits — mirror lib/media/limits.ts. 2::bigint avoids int4 overflow.
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024; -- 50 MB
  c_max_video_bytes constant bigint := 2::bigint * 1024 * 1024 * 1024; -- 2 GB
  c_max_video_seconds constant integer := 300; -- 5 min
begin
  -- 1. AUTHORIZATION: the caller must own a LIVE event. auth.uid() is the verified
  -- host JWT (works under SECURITY DEFINER + empty search_path). No accepting_uploads
  -- check — that is the GUEST gate; the host owns the event.
  select * into v_event from public.events
    where id = p_event_id and host_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Event not found or not owned by you.' using errcode = 'no_data_found';
  end if;

  -- 2. Defense-in-depth: the key MUST belong to this event (no cross-event writes).
  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- 3. Universal per-file limits (the client already checked these; we don't trust it).
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

  -- 4. Tier caps — host uploads COUNT against caps (anti-abuse parity with guests).
  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- 4a. Monthly INGRESS meter — bytes uploaded this period (never decrements).
  if v_limits.monthly_ingress_bytes is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_limits.monthly_ingress_bytes then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 4b. Total storage cap (account-level) + 10% overflow buffer before a hard block.
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    if v_profile.storage_used_bytes + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 5. Insert media (guest_id NULL = host upload, status always 'approved') + bump the
  -- ledger + usage atomically (one function = one tx). photo_count/video_count stay for
  -- analytics; enforcement is on bytes.
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

-- --- 2. get_host_upload_context() ------------------------------------------
-- Presign-time advisory pre-check (mirrors get_upload_context). Ownership-gated by
-- auth.uid(); returns NULL if the caller doesn't own a live event (route -> 404).
-- Reports whether the account is ALREADY at a cap so the route can reject BEFORE
-- issuing a presigned URL (minimizing orphaned R2 objects). Coarse by design (it
-- lacks the incoming file size); create_media_as_host stays authoritative. p_type is
-- kept for signature symmetry with get_upload_context (no per-type caps exist).
create function public.get_host_upload_context(
  p_event_id uuid,
  p_type public.media_type
)
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
    return null; -- not owned / not found / deleted -> route treats as not_owner (404)
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
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap
  );
end;
$$;

-- --- 3. Grants (security-critical) ------------------------------------------
-- A new function defaults to EXECUTE for PUBLIC. Revoke that, then grant to
-- authenticated ONLY. NEVER grant to anon — a host upload requires a verified
-- auth.uid(). (Mirrors the lock-down idiom used for purge_media_rows / record_link_hit,
-- but re-grants to authenticated instead of staying service-role-only.)
revoke execute on function public.create_media_as_host(uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer) to authenticated;

revoke execute on function public.get_host_upload_context(uuid, public.media_type) from public, anon, authenticated;
grant execute on function public.get_host_upload_context(uuid, public.media_type) to authenticated;
