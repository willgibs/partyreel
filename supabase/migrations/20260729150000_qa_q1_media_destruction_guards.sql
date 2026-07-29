-- QA Q1 — stop destroying customer media (adversarial review 2026-07-29).
-- PENDING-APPLY: the Supabase MCP was bound to another project when this was authored. At apply
-- time: (1) diff BOTH function bodies below against live `pg_get_functiondef` and reconcile any
-- drift FIRST (the Phase-2 style-catalog migration taught us the repo file can lag live — the
-- pricing re-apply re-established parity; do NOT blindly overwrite live with a stale body); then
-- (2) apply_migration verbatim; (3) get_advisors (expect the UNCHANGED set — no new anon/authed
-- RPCs, no new tables; removed_by_system is a service-role-write-only column on an existing table);
-- (4) run the rolled-back contract check at the bottom; (5) run the prod AUDIT query for #1 and
-- report any planted cross-event preview_key rows before trusting the fix.
--
-- Closes two hand-verified criticals:
--   #1 create_media(_as_host) insert p_preview_key VERBATIM — no namespace binding — so any free
--      account can register events/<victim>/... as its own preview_key and, on permanent-delete,
--      wipe the victim's R2 object (both purge paths enumerate preview_key into deleteR2Objects).
--   #2 the standby-budget sweep re-collects the SAME rows sweepOverCapacity just soft-removed in
--      the same run and hard-deletes them minutes after the "recoverable for 30 days" email. A
--      service-role-only removed_by_system flag lets the standby bin exclude system-binned rows;
--      the TS belt (recently-deleted.ts) additionally never evicts anything binned in the last 24h.

-- ---------------------------------------------------------------------------------------------
-- #2 — removed_by_system: mark rows the cron auto-removed so the standby sweep never re-collects
-- them in the same run. Service-role/RPC-write-only (mirrors removed_by_uploader): NO grant to
-- authenticated, so a host cannot clear it to smuggle a row past the sweep exclusion. Additive +
-- defaulted → backfills false, behavior unchanged until the cron starts stamping it.
-- ---------------------------------------------------------------------------------------------
alter table public.media
  add column if not exists removed_by_system boolean not null default false;

comment on column public.media.removed_by_system is
  'True when the purge cron auto-removed this row (over-cap reduce). Service-role write only '
  '(no authenticated grant). The standby sweep excludes removed_by_system rows so it cannot '
  'hard-delete media the same run just told the host was recoverable for 30 days (QA #2).';

-- ---------------------------------------------------------------------------------------------
-- #1 — bind p_preview_key to the event, mirroring the existing p_original_key check. NULL stays
-- valid (preview is optional). This is the ONLY line added to each body; everything else below is
-- the current body, reproduced so CREATE OR REPLACE is a faithful superset (diff-against-live
-- first, per the header).
-- ---------------------------------------------------------------------------------------------

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
  -- QA #1: the preview key is a client-supplied R2 identifier stored verbatim and later fed to
  -- deleteR2Objects on permanent-delete. Bind it to the event exactly like original_key, or a
  -- host can plant a victim's key and destroy the victim's object from their own Trash.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
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

-- Re-assert the service-role-only posture (ADR-0016; MCP-applied SQL can inherit an anon grant).
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;

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
  -- QA #1 (host path): same client-supplied preview key, same event binding.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
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

revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- #43 — purge_media_rows: decrement from what was ACTUALLY DELETED, not from the pre-delete
-- snapshot. The old shape computed by_host from `target` while `del` deleted independently, so two
-- overlapping purge paths (the nightly cron and a host's "delete now", or two cron sweeps that
-- both reach the same row) could BOTH decrement storage_used_bytes while only one delete landed —
-- a silently shrinking cap the host can never reclaim. Feeding by_host off `del ... returning`
-- makes the accounting exactly-once: rows a concurrent transaction already removed are not
-- returned, so their bytes are not subtracted twice. Legal hold + grants unchanged.
-- ---------------------------------------------------------------------------------------------
create or replace function public.purge_media_rows(p_media_ids uuid[])
returns table (host_id uuid, freed_bytes bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with target as (
    select m.id
    from public.media m
    where m.id = any (p_media_ids)
      and m.legal_hold_at is null -- legal hold: never hard-delete a held row (ADR-0020)
  ),
  del as (
    delete from public.media m
    where m.id in (select id from target)
    returning m.event_id, m.file_size_bytes
  ),
  by_host as (
    select e.host_id as h, sum(d.file_size_bytes)::bigint as bytes
    from del d
    join public.events e on e.id = d.event_id
    group by e.host_id
  ),
  upd as (
    update public.profiles p
    set storage_used_bytes = greatest(0, p.storage_used_bytes - bh.bytes)
    from by_host bh
    where p.id = bh.h
    returning p.id as pid, bh.bytes as freed
  )
  select upd.pid, upd.freed from upd;
end;
$$;

revoke execute on function public.purge_media_rows(uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- ROLLED-BACK CONTRACT CHECK (run manually via execute_sql; nothing persists). Rides EXISTING
-- rows — creating an event trips the free-tier enforce_event_limit trigger. Fill in a real
-- guest session token + its event id + a foreign event id from the live DB before running.
-- ---------------------------------------------------------------------------------------------
-- do $$
-- declare
--   v_token text := '<a real guest session_token>';
--   v_event uuid := '<that guest''s event id>';
--   v_other uuid := '<a DIFFERENT event id>';
--   v_ok boolean;
-- begin
--   -- #1: a cross-event preview key must be refused.
--   begin
--     perform public.create_media(
--       v_token, gen_random_uuid(), 'photo',
--       'events/' || v_event::text || '/photo/' || gen_random_uuid()::text || '/original.jpg',
--       1024,
--       'events/' || v_other::text || '/photo/' || gen_random_uuid()::text || '/preview.webp');
--     raise exception 'FAIL: cross-event preview_key was accepted';
--   exception when check_violation then
--     raise notice 'OK: cross-event preview_key refused';
--   end;
--   -- #1: a matching-event preview key (and null) must still be accepted (smoke, then roll back).
--   perform public.create_media(
--     v_token, gen_random_uuid(), 'photo',
--     'events/' || v_event::text || '/photo/' || gen_random_uuid()::text || '/original.jpg',
--     1024, null);
--   raise notice 'OK: null preview_key accepted';
--   -- #2: removed_by_system exists, defaults false, and is NOT writable by authenticated.
--   select has_column_privilege('authenticated', 'public.media', 'removed_by_system', 'UPDATE')
--     into v_ok;
--   if v_ok then raise exception 'FAIL: authenticated can write removed_by_system'; end if;
--   raise notice 'OK: removed_by_system is not authenticated-writable';
--   raise exception 'ROLLBACK_OK';
-- exception when others then
--   if sqlerrm = 'ROLLBACK_OK' then raise notice 'contract check passed, rolled back';
--   else raise; end if;
-- end $$;

-- ---------------------------------------------------------------------------------------------
-- PROD AUDIT (run BEFORE trusting the fix — surfaces any already-planted cross-event preview keys):
--   select id, event_id, preview_key from public.media
--   where preview_key is not null
--     and preview_key not like 'events/' || event_id::text || '/%';
-- Zero rows = clean. Any row = a live attack artifact; investigate the owning event before purge.
-- ---------------------------------------------------------------------------------------------
