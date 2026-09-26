-- =============================================================================================
-- THE LIVE REEL, part 1 of 2: the EXPAND (lane `reel-migration`).
--
-- The reel is reconceived (Will, 2026-09-22): "a dynamically created, faster-paced slideshow ...
-- that randomizes all the current/existing (not hidden) media in the event gallery for an
-- immediately watchable reel anytime", composed on the viewer's own device and never stored ("we
-- never have to deal with reel storage files"). A CUT is a clip anyone renders on their own device;
-- on a paid event they can save it to the album as an ordinary video. This file lands that data
-- model BESIDE the stored reel, which leaves in part 2 (20260924110000_live_reel_drop.sql) once
-- the wiring is red-teamed:
--   1. events.reel_style_id, events.show_reel   the host's default mood (NULL = the default one)
--                                                and the reel's off switch (default on), both
--                                                host-written by column grant.
--   2. media.reel_eligible                      "plays in the live reel": default true, every
--                                                existing row backfilled true; false only for a cut.
--   3. create_media                             + p_reel_eligible boolean default true, LAST.
--   4. create_media_as_host                     + the same parameter.
--   5. get_event_media_by_qr_token              the guest album also returns reel_eligible.
--   6. get_event_by_qr_token                    the guest event also returns show_reel and
--                                                reel_style_id.
--   7. ops_flags 'live_reel_enabled'            the platform lever, seeded on.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT UNTOUCHED. partyreel.com (milestone-28) and the
-- launch-prep alias keep calling today's shapes, so every change is additive from their side:
--   * The two events columns carry defaults, so an insert naming neither lands a correct row, and
--     no deployed code reads them.
--   * create_media and create_media_as_host gain ONE parameter, LAST, with a DEFAULT. PostgREST
--     resolves an RPC by its argument NAMES and refuses a second function of the same name that a
--     call could match (PGRST203), so each is a DROP + CREATE of its one signature inside this
--     file's transaction. The deployed builds' named arguments resolve to the new function and land
--     reel_eligible = true, which is right for everything they upload (no deployed build makes a cut).
--   * The two guest reads only GROW their RETURNS TABLE, the new columns last. Both readers
--     (getEventByQrToken and getEventMediaByQrToken, src/lib/db/queries/guest-events.ts) map named
--     fields, so an extra key is ignored until the wiring reads it.
--   * The ops_flags row is an INSERT beside reel_render_enabled, never a rename, so neither build
--     ever meets a missing flag.
--   * NOT touched: media.highlight_score, clip_start_seconds and clip_end_seconds (they sit in the
--     host's column-scoped SELECT grant and MEDIA_HOST_COLUMNS, where a stale list is a runtime 400
--     on every host read; a later change drops them), and tier_limits().max_reel_seconds (it becomes
--     the cut's length cap).
--
-- ★ THE BACKFILL TOUCHES reel_eligible ALONE (section 2). media carries five row triggers (the live
-- catalog, 2026-09-24), and two of them would write a second column on every row:
--   media_set_updated_at                BEFORE UPDATE, `new.updated_at = now()` unconditionally. It
--                                       would move every row's updated_at, which the gallery ETag
--                                       fingerprint and the host's recency reads key on. PAUSED for
--                                       the one statement.
--   media_set_purge_at                  BEFORE INSERT OR UPDATE, re-derives purge_at from status and
--                                       removed_at. A no-op on today's rows (0 of 1,290 diverge), but
--                                       a removed row with a null removed_at would take now() + 30
--                                       days. The backfill changes neither input, so there is
--                                       nothing to re-derive: PAUSED for the statement too.
--   media_guard_privileged_transitions  BEFORE UPDATE, skips a CLIENT write (authenticated, anon) to
--                                       a held row. A migration runs as postgres, which the guard
--                                       passes first, so a held row is backfilled like any other
--                                       (0 held today). Left on.
--   media_derive_removal_provenance     BEFORE INSERT OR UPDATE, acts only when status enters or
--                                       leaves 'removed'. A no-op here. Left on.
--   media_gallery_doorbell              AFTER, per row, rings only when the approved set changes (old
--                                       vs new status). A no-op here, so no guest tab wakes. Left on.
-- Both paused triggers are re-enabled in this same transaction, so no committed state ever has them
-- off; the rolled-back proof compared every row's (id, updated_at, purge_at) before and after.
--
-- LOCKS: `alter table` holds ACCESS EXCLUSIVE on events and media until this transaction commits
-- (the backfill is 1,290 rows today), so every read of the two tables waits that long: a plain
-- apply at today's traffic.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-24):
--         create_media (9 args)                  40051356341c181a2e3207fc54470669  (20260921150000)
--         create_media_as_host (10 args)         f0081879fc670f77cf147c1456bd9e9b  (20260729190000)
--         get_event_media_by_qr_token (4 args)   a6b29838596a5a19f419919d2a149278  (20260924010000)
--         get_event_by_qr_token (1 arg)          49dfa8b305c1bcb54d4415e26283c689  (20260923150000)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public'
--          and p.proname in ('create_media', 'create_media_as_host', 'get_event_media_by_qr_token', 'get_event_by_qr_token');
--   (2) Apply verbatim. The same query then reads the four new signatures and no other, each body's
--       md5 as this file's (measured on the local pre-flight):
--         create_media (10 args)                 e4947c742f3d8be5fe2c93e11b1816a5
--         create_media_as_host (11 args)         6ce738cc759eabb584fda44c040234d5
--         get_event_media_by_qr_token (4 args)   761378943be63576d2a427a2c69620ec
--         get_event_by_qr_token (1 arg)          be4ec8731968894473dc2c78b30acc26
--   (3) The grants are the ones each function carries today, restated in full because a drop takes
--       them and a create inherits EXECUTE for PUBLIC, anon, authenticated and service_role (Postgres's
--       own default plus the project's default privileges):
--         create_media, create_media_as_host   postgres, service_role
--         get_event_media_by_qr_token          postgres, anon, authenticated, service_role
--         get_event_by_qr_token                postgres, PUBLIC, anon, authenticated, service_role
--   (4) get_advisors. EXPECTED DELTA: NONE. 0028 stays the same five anon reads, 0029 the same 32;
--       create_media and create_media_as_host stay in neither list; no table is created, so
--       rls_enabled_no_policy stays 15.
--   (5) Regenerate src/lib/db/types.ts BEFORE the wiring lanes are cut: the two events columns, the
--       two new parameters and the two grown RETURNS TABLEs.
--   (6) The rolled-back check at the foot (it rides the scale probe and ends in a deliberate raise).
-- =============================================================================================

-- =============================================================================================
-- 1. events: the host's default mood and the off switch.
-- =============================================================================================
-- reel_style_id carries NO check, like qr_style: the Server Function that writes it validates it
-- against the style catalog and the engine falls back to the default mood for an unknown id, so a
-- new mood never needs a migration. show_reel defaults ON (Will: "A switch, default on").
alter table public.events
  add column reel_style_id text,
  add column show_reel boolean not null default true;

comment on column public.events.reel_style_id is
  'The host''s default mood for the live reel: a style id from the app''s style catalog. NULL = the default mood. App-validated by the Server Function that writes it, NOT a CHECK or an enum, so a new mood never needs a migration; the engine falls back to the default mood for an unknown id. A viewer can switch moods on their own device as the reel plays; that choice is never written here.';
comment on column public.events.show_reel is
  'The host''s switch for the live reel on the album, default ON. The reel stores nothing: each viewer''s device composes it from the album''s approved media whose reel_eligible is true.';

-- Host-writable by COLUMN grant, insert and update, beside show_guest_list. SELECT on events is
-- table-level for authenticated (RLS scopes it to the host's own rows), so the host reads both with
-- no grant. ★ A bare additive grant and nothing else: a table-level revoke here would cascade to
-- every column grant on events and take the host app down (database-security.md, Gotchas).
grant insert (show_reel, reel_style_id), update (show_reel, reel_style_id) on public.events to authenticated;

-- =============================================================================================
-- 2. media.reel_eligible: "plays in the live reel".
-- =============================================================================================
-- It shipped as dead scaffold, false on every row. It now reads "plays in the live reel": true for
-- every upload, false only for a cut someone saved to the album, so the live reel never plays a
-- reel. The default first (every row inserted from here on is eligible), then the backfill.
-- ★ WITHOUT THE BACKFILL EVERY EXISTING ALBUM'S REEL IS EMPTY. The two triggers that would write a
-- second column are paused for the one statement (the header has the finding).
alter table public.media alter column reel_eligible set default true;

alter table public.media
  disable trigger media_set_updated_at,
  disable trigger media_set_purge_at;

update public.media set reel_eligible = true where not reel_eligible;

alter table public.media
  enable trigger media_set_updated_at,
  enable trigger media_set_purge_at;

comment on column public.media.reel_eligible is
  'Plays in the live reel. TRUE for every upload; FALSE only for a cut (a clip rendered on a device) someone saved to the album, so the live reel never plays a reel. WRITE-ONCE: create_media and create_media_as_host write it from p_reel_eligible (default true) and no client role can update it, so it rides OUTSIDE the gallery ETag fingerprint, like width and height.';

-- =============================================================================================
-- 3. create_media: p_reel_eligible, the guest path.
-- =============================================================================================
-- Body carried VERBATIM from 20260921150000 (every guard: the refusals on a deleted, closed or
-- identity-gated event and their wording, the event binding of both keys, the 10 GB ceiling, the
-- host's per-event cap, QA #17's `for update` lock, the paid-only video gate, the monthly ingress
-- meter, the active-bytes cap), changed in two places: the insert writes reel_eligible, and the one
-- comment that described an older build is reworded to the rule it states. A cut is a video, so the
-- video gate already keeps saving one to a paid event. coalesce(p_reel_eligible, true): an explicit
-- null means what an omitted argument means.
drop function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer);

create function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true
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

  -- THE IDENTITY GATE (2026-09-21): the switch gates every upload, so flipping it ON mid-party
  -- stops the next upload from a guest who never proved an email. ★ The wording carries two
  -- contracts: it opens with "not accepting uploads", so a caller that knows only that substring
  -- still refuses the upload, and it names "verified email", which mapCheckViolation
  -- (src/lib/db/mutations/guest.ts) tests ABOVE its general "not accepting" branch to map it to
  -- verification_required. A Vitest guard (src/lib/db/migration-guards.test.ts) pins both halves.
  if v_event.require_verified_email and v_guest.verified_at is null then
    raise exception 'This event is not accepting uploads without a verified email.' using errcode = 'check_violation';
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

  -- QA #17: `for update` serializes concurrent cap decisions for THIS host (the profiles row is
  -- the per-host mutex). Every read below it then sees the previous writer's committed rows.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
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

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut someone saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true)
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

-- Service-role-only, as before (in NEITHER advisor list): the upload-complete route is the caller,
-- with the R2-HEAD size. The drop took the grants, and the create inherited client ones.
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) to service_role;

-- =============================================================================================
-- 4. create_media_as_host: the same parameter, the host path.
-- =============================================================================================
-- Body carried VERBATIM from 20260729190000 (the ownership join on the route's getUser() id, the
-- event binding of both keys, the 10 GB ceiling, QA #17's lock, the video gate, the ingress meter,
-- the active-bytes cap), changed in one place: the insert writes reel_eligible.
drop function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer);

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
  p_height integer default null,
  p_reel_eligible boolean default true
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

  -- QA #17: the same per-host profiles-row lock as create_media (one mutex per host, one lock
  -- order everywhere).
  select * into v_profile from public.profiles where id = v_event.host_id for update;
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

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut the host saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true)
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

revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) to service_role;

-- =============================================================================================
-- 5. get_event_media_by_qr_token: the guest album also returns reel_eligible.
-- =============================================================================================
-- Carried from 20260924010000: SQL, stable, SECURITY DEFINER (the anon capability read: the opaque
-- qr token plus `visibility = 'open'` IS the authorization), an empty search_path, the same four
-- parameters, the same four gates, the same keyset order and cursor, the same clamp (a null p_limit
-- reads everything). ONE change: reel_eligible joins the RETURNS TABLE, last, which is a drop and a
-- create because a RETURNS TABLE cannot grow under create-or-replace. The album still shows every
-- approved item, cuts included; the live reel leaves the cuts out on the viewer's device.
drop function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer);
create function public.get_event_media_by_qr_token(
  p_qr_token text,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default null
)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  width integer,
  height integer,
  duration_seconds double precision,
  created_at timestamptz,
  reel_eligible boolean
)
language sql
stable
security definer
set search_path to ''
as $$
  select m.id, m.type, m.original_key, m.preview_key, m.width, m.height, m.duration_seconds, m.created_at,
         m.reel_eligible
  from public.media m
  where m.event_id = (
      select e.id
      from public.events e
      where e.qr_token = p_qr_token
        and e.visibility = 'open'
        and e.deleted_at is null
    )
    and m.status = 'approved'
    and (p_before_created_at is null
         or (m.created_at, m.id) < (p_before_created_at, p_before_id))
  order by m.created_at desc, m.id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;
-- Public open-album read (by design anon-accessible: the visibility='open' gate IS the boundary),
-- one of the five 0028 anon reads. The grants as the live catalog holds them: anon, authenticated
-- and service_role, never PUBLIC.
revoke all on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) from public;
grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to anon, authenticated;
grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to service_role;

comment on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) is
  'The guest album (open events): approved media newest first, ordered created_at desc, id desc, each with reel_eligible (false only for a cut). Pages on the last row''s (created_at, id) with p_limit clamped to 1,000; a null p_limit reads everything.';

-- =============================================================================================
-- 6. get_event_by_qr_token: the guest event also returns show_reel and reel_style_id.
-- =============================================================================================
-- Carried from 20260923150000 with the QA #40 redaction verbatim: a non-owner of a gated event gets
-- no description, date, custom slug or host name, and no name for private. The two new columns are
-- appended UNREDACTED: like qr_style and moderation_mode they are presentation settings, never the
-- identifying metadata the redaction withholds, so an unlocked viewer's page reads them with no
-- second read. A drop and a create, because a RETURNS TABLE cannot grow under create-or-replace.
drop function public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end,
         e.show_reel, e.reel_style_id
  from public.events e
  left join public.profiles p on p.id = e.host_id
  cross join lateral (
    select
      (e.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (e.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

-- One of the five accepted 0028 anon reads (the opaque token IS the authorization): the guest page
-- calls it on the anon/user client. Re-granted because the drop took the grant.
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;
-- And the rest of today's ACL, restated so the recreate matches it by statement rather than by the
-- project's default privileges: service_role, and PUBLIC, which the 20260923150000 recreate
-- inherited from Postgres's own default for a new function and never revoked. PUBLIC adds nothing
-- the three client roles do not already hold; revoking it would be a change of its own.
grant execute on function public.get_event_by_qr_token(text) to public, service_role;

-- =============================================================================================
-- 7. ops_flags: live_reel_enabled, the platform lever.
-- =============================================================================================
-- The live reel runs a decode loop on every guest device, so the platform keeps a switch for it
-- (deny-all table: the service role reads it, the /admin toggle writes it). Seeded ON. An INSERT
-- beside reel_render_enabled, never a rename: the wiring reads this row from its first alias build,
-- the deployed code keeps reading its own until part 2 deletes it, and neither build meets a
-- missing flag.
insert into public.ops_flags (key, enabled) values ('live_reel_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). It rides the scale probe
-- (event "Scale probe", qr d02631f1bfb3455188d224e41bf9510f, willg97's: a pre-migration album of
-- more than 1,000 approved items), a name-only guest it mints, the probe's host for the host's
-- writes and a random id for a stranger. The error it ends on must read
-- `ROLLED BACK: every live_reel_expand check held {...}`.
-- The lane ran this same block BEFORE the apply on the live project, with this file's statements
-- executed at its head and the before-state captured ahead of them (every recreated function's
-- grants, every media row's (id, updated_at, purge_at)).
-- =============================================================================================
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   -- The EXECUTE grantees each recreated function carries today (the live catalog, 2026-09-24),
--   -- which its drop and create must restore exactly. Sorted in the C collation.
--   c_acl constant jsonb := jsonb_build_object(
--     'create_media', jsonb_build_array('postgres', 'service_role'),
--     'create_media_as_host', jsonb_build_array('postgres', 'service_role'),
--     'get_event_by_qr_token', jsonb_build_array('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role'),
--     'get_event_media_by_qr_token', jsonb_build_array('anon', 'authenticated', 'postgres', 'service_role'));
--   c_fns constant text[] := array['create_media', 'create_media_as_host', 'get_event_by_qr_token', 'get_event_media_by_qr_token'];
--   v_event public.events;
--   v_token text;
--   v_cut uuid := gen_random_uuid();
--   v_plain uuid := gen_random_uuid();
--   v_nulled uuid := gen_random_uuid();
--   v_host_cut uuid := gen_random_uuid();
--   v_host_plain uuid := gen_random_uuid();
--   v_total integer;
--   v_eligible integer;
--   v_n integer;
--   v_json jsonb;
--   v_acl jsonb;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   select * into v_event from public.events
--    where qr_token = c_qr and visibility = 'open' and deleted_at is null;
--   if v_event.id is null then raise exception 'SETUP: the scale probe (qr %) is not an open, live event', c_qr; end if;
--
--   -- ── 1. The shapes: the three columns, their comments, the paused triggers back on, the flag ──
--   select jsonb_object_agg(c.table_name || '.' || c.column_name,
--            c.data_type || ' ' || c.is_nullable || ' ' || coalesce(c.column_default, 'no default'))
--     into v_json
--     from information_schema.columns c
--    where c.table_schema = 'public'
--      and (c.table_name, c.column_name) in (('events', 'show_reel'), ('events', 'reel_style_id'), ('media', 'reel_eligible'));
--   if v_json is distinct from jsonb_build_object(
--        'events.show_reel', 'boolean NO true',
--        'events.reel_style_id', 'text YES no default',
--        'media.reel_eligible', 'boolean NO true') then
--     raise exception 'FAIL: the columns read %', v_json;
--   end if;
--   if col_description('public.events'::regclass, (select attnum from pg_attribute where attrelid = 'public.events'::regclass and attname = 'show_reel')) is null
--      or col_description('public.events'::regclass, (select attnum from pg_attribute where attrelid = 'public.events'::regclass and attname = 'reel_style_id')) is null
--      or col_description('public.media'::regclass, (select attnum from pg_attribute where attrelid = 'public.media'::regclass and attname = 'reel_eligible')) is null then
--     raise exception 'FAIL: a new or repurposed column carries no comment';
--   end if;
--   if (select count(*) from pg_trigger
--        where tgrelid = 'public.media'::regclass and tgname in ('media_set_updated_at', 'media_set_purge_at') and tgenabled = 'O') <> 2 then
--     raise exception 'FAIL: a media trigger the backfill paused is not back on';
--   end if;
--   if (select enabled from public.ops_flags where key = 'live_reel_enabled') is distinct from true
--      or not exists (select 1 from public.ops_flags where key = 'reel_render_enabled') then
--     raise exception 'FAIL: live_reel_enabled is not seeded on beside reel_render_enabled';
--   end if;
--   raise notice 'OK: the columns, their comments, the triggers and the flag';
--
--   -- ── 2. The backfill: a pre-migration album answers true for every approved item ──
--   select count(*), count(*) filter (where r.reel_eligible) into v_total, v_eligible
--     from public.get_event_media_by_qr_token(c_qr) r;
--   if v_total <= 1000 or v_eligible <> v_total then
--     raise exception 'FAIL: the probe answered % of % approved items reel_eligible', v_eligible, v_total;
--   end if;
--   -- Zero until the wiring lets a cut in: nothing written before this file can be one.
--   select count(*) into v_n from public.media m where not m.reel_eligible;
--   v_report := v_report || jsonb_build_object('probe_approved', v_total, 'probe_eligible', v_eligible, 'media_not_eligible', v_n);
--   raise notice 'OK: the probe''s % approved items all play in the live reel', v_total;
--
--   -- ── 3. A cut lands false and reads back false; every deployed call shape lands true ──
--   -- Live moderation for the ride, so a guest's upload lands approved and the album returns it.
--   update public.events set moderation_mode = 'live' where id = v_event.id;
--   v_token := public.create_guest(p_qr_token => c_qr, p_display_name => 'Reel check')->>'session_token';
--   -- A cut (a video rendered on a device, saved to the album): p_reel_eligible => false.
--   perform public.create_media(p_session_token => v_token, p_media_id => v_cut, p_type => 'video',
--     p_original_key => 'events/' || v_event.id || '/video/' || v_cut || '/original.mp4',
--     p_file_size_bytes => 10, p_duration_seconds => 12, p_reel_eligible => false);
--   -- The deployed build's call: its nine named arguments, no p_reel_eligible.
--   perform public.create_media(p_session_token => v_token, p_media_id => v_plain, p_type => 'photo',
--     p_original_key => 'events/' || v_event.id || '/photo/' || v_plain || '/original.jpg',
--     p_file_size_bytes => 10, p_preview_key => null, p_duration_seconds => null, p_width => 4, p_height => 3);
--   -- An explicit null reads as the default.
--   perform public.create_media(p_session_token => v_token, p_media_id => v_nulled, p_type => 'photo',
--     p_original_key => 'events/' || v_event.id || '/photo/' || v_nulled || '/original.jpg',
--     p_file_size_bytes => 10, p_reel_eligible => null);
--   -- The host path, a cut and the deployed call.
--   perform public.create_media_as_host(p_host_id => v_event.host_id, p_event_id => v_event.id, p_media_id => v_host_cut,
--     p_type => 'video', p_original_key => 'events/' || v_event.id || '/video/' || v_host_cut || '/original.mp4',
--     p_file_size_bytes => 10, p_duration_seconds => 12, p_reel_eligible => false);
--   perform public.create_media_as_host(p_host_id => v_event.host_id, p_event_id => v_event.id, p_media_id => v_host_plain,
--     p_type => 'photo', p_original_key => 'events/' || v_event.id || '/photo/' || v_host_plain || '/original.jpg',
--     p_file_size_bytes => 10);
--   -- Read back as a guest's browser does: anon, through the album's first page.
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   select jsonb_object_agg(r.id, r.reel_eligible) into v_json
--     from public.get_event_media_by_qr_token(c_qr, null, null, 10) r
--    where r.id in (v_cut, v_plain, v_nulled, v_host_cut, v_host_plain);
--   reset role;
--   if v_json is distinct from jsonb_build_object(v_cut, false, v_plain, true, v_nulled, true, v_host_cut, false, v_host_plain, true) then
--     raise exception 'FAIL: the album answered %', v_json;
--   end if;
--   v_report := v_report || jsonb_build_object('album_reads', jsonb_build_object(
--     'guest_cut', v_json -> v_cut::text, 'guest_deployed_call', v_json -> v_plain::text, 'guest_null', v_json -> v_nulled::text,
--     'host_cut', v_json -> v_host_cut::text, 'host_deployed_call', v_json -> v_host_plain::text));
--   raise notice 'OK: a cut reads false, every deployed call shape true';
--
--   -- ── 4. The host writes both settings; anon reads both; nobody else writes them ──
--   perform set_config('request.jwt.claims', json_build_object('sub', v_event.host_id, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.events set show_reel = false, reel_style_id = 'reel-check-mood' where id = v_event.id;
--   get diagnostics v_n = row_count;
--   reset role;
--   if v_n <> 1 then raise exception 'FAIL: the host''s write of show_reel and reel_style_id touched % rows', v_n; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.events set show_reel = true, reel_style_id = null where id = v_event.id;
--   get diagnostics v_n = row_count;
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL: a stranger''s write reached the probe (% rows)', v_n; end if;
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   begin
--     update public.events set show_reel = true where id = v_event.id;
--     raise exception 'FAIL: anon wrote events.show_reel';
--   exception when insufficient_privilege then null;
--   end;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if (v_json ->> 'show_reel')::boolean is distinct from false or v_json ->> 'reel_style_id' is distinct from 'reel-check-mood' then
--     raise exception 'FAIL: anon read show_reel = %, reel_style_id = %', v_json ->> 'show_reel', v_json ->> 'reel_style_id';
--   end if;
--   if not (v_json ?& array['id', 'name', 'description', 'moderation_mode', 'visibility', 'has_password',
--       'accepting_uploads', 'require_verified_email', 'require_upload_to_view', 'event_date', 'qr_style',
--       'qr_token', 'custom_slug', 'host_display_name', 'show_reel', 'reel_style_id']) then
--     raise exception 'FAIL: get_event_by_qr_token lost a key (%)', v_json;
--   end if;
--   v_report := v_report || jsonb_build_object('anon_reads_open', jsonb_build_object(
--     'show_reel', v_json -> 'show_reel', 'reel_style_id', v_json -> 'reel_style_id', 'keys', (select count(*) from jsonb_object_keys(v_json))));
--   -- QA #40 survived the recreate: a password event withholds its metadata from a non-owner, never the reel settings.
--   update public.events set visibility = 'password', event_password_hash = 'reel-check-hash', description = 'Reel check'
--    where id = v_event.id;
--   set local role anon;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if v_json ->> 'description' is not null or v_json ->> 'host_display_name' is not null or v_json ->> 'custom_slug' is not null
--      or v_json ->> 'name' is null or (v_json ->> 'show_reel')::boolean is distinct from false
--      or v_json ->> 'reel_style_id' is distinct from 'reel-check-mood' then
--     raise exception 'FAIL: the gated payload reads %', v_json;
--   end if;
--   v_report := v_report || jsonb_build_object('anon_reads_password', jsonb_build_object(
--     'description', v_json -> 'description', 'host_display_name', v_json -> 'host_display_name',
--     'name_present', v_json ->> 'name' is not null, 'show_reel', v_json -> 'show_reel', 'reel_style_id', v_json -> 'reel_style_id'));
--   if not has_column_privilege('authenticated', 'public.events', 'show_reel', 'insert')
--      or not has_column_privilege('authenticated', 'public.events', 'show_reel', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'reel_style_id', 'insert')
--      or not has_column_privilege('authenticated', 'public.events', 'reel_style_id', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'show_guest_list', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'require_upload_to_view', 'update')
--      or has_column_privilege('authenticated', 'public.events', 'custom_slug', 'update')
--      or has_column_privilege('anon', 'public.events', 'show_reel', 'update')
--      or has_column_privilege('authenticated', 'public.media', 'reel_eligible', 'update')
--      or not has_column_privilege('authenticated', 'public.media', 'reel_eligible', 'select') then
--     raise exception 'FAIL: a column grant moved';
--   end if;
--   raise notice 'OK: the host writes both, a stranger and anon cannot, anon reads both, QA #40 holds';
--
--   -- ── 5. The grants, the security modes, one signature each ──
--   select jsonb_object_agg(p.proname, (
--            select jsonb_agg(x.g order by x.g collate "C")
--              from (select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as g
--                      from aclexplode(p.proacl) a
--                     where a.privilege_type = 'EXECUTE') x))
--     into v_acl
--     from pg_proc p
--    where p.pronamespace = 'public'::regnamespace and p.proname = any(c_fns);
--   if v_acl is distinct from c_acl then raise exception 'FAIL: the grants read % (want %)', v_acl, c_acl; end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = any(c_fns)) <> 4 then
--     raise exception 'FAIL: expected exactly one signature per function (PostgREST refuses overloads)';
--   end if;
--   if exists (select 1 from pg_proc p
--               where p.pronamespace = 'public'::regnamespace and p.proname = any(c_fns)
--                 and (not p.prosecdef or p.proconfig is distinct from array['search_path=""'])) then
--     raise exception 'FAIL: a function lost SECURITY DEFINER or its empty search_path';
--   end if;
--   if to_regprocedure('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean)') is null
--      or to_regprocedure('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean)') is null
--      or to_regprocedure('public.get_event_media_by_qr_token(text, timestamptz, uuid, integer)') is null
--      or to_regprocedure('public.get_event_by_qr_token(text)') is null then
--     raise exception 'FAIL: a signature is missing';
--   end if;
--   v_report := v_report || jsonb_build_object('grants', v_acl, 'md5', (
--     select jsonb_object_agg(p.proname, md5(p.prosrc)) from pg_proc p
--      where p.pronamespace = 'public'::regnamespace and p.proname = any(c_fns)));
--   raise notice 'OK: the grants as before, SECURITY DEFINER and an empty search_path, one signature each';
--
--   raise exception 'ROLLED BACK: every live_reel_expand check held %', v_report;
-- end $$;
