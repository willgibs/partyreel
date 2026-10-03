-- =============================================================================================
-- THE PRESIGN COUNTS (lane `upload-meter`, 2026-10-03; Will's pricing rethink, PRICING.md "What it costs us", the
-- levers' preconditions): the monthly meter sees every byte a host can make us store, and two unpublished breakers
-- far past any party stop a script.
--
--   1. `storage_ledger` gains the hourly breaker's clock hour and its count (`hour_started_at`, `hour_uploads`), on
--      the month's own row: the presign's one write carries them, so the breaker costs no second write.
--   2. `meter_upload(p_event_id, p_type, p_bytes)`, the presign's count: under the host's profiles lock (her one lock,
--      taken first, as every capacity decision takes it), refuse past the hour's 20,000 uploads (the breaker), past the
--      month's allowance (the published inequality, exactly as `create_media` read it at complete: the month's bytes
--      plus this file's past `monthly_ingress_cap()`) or past the storage cap and its 10% (`host_active_bytes()`, as
--      at complete), else add the DECLARED bytes and the item to the month's row. The presigned PUT binds its
--      Content-Length to those bytes (a multipart's parts each to theirs), so declared is real for every honest
--      client and an upper bound for any other. An upload refused later, abandoned, or retried has counted at its
--      presign: the meter never refunds (PRICING.md's Model). SECURITY DEFINER, the service role's alone: the presign
--      routes call it on the admin client with the event their own gates resolved (the guest's from her ticket, the
--      host's from her ownership).
--   3. `create_media` and `create_media_as_host`, replaced in place (their signatures untouched, their grants restated):
--      each body verbatim from 20261003110000 but for the monthly check and the ledger's write, which moved to the
--      presign, so a file is counted once and never again at complete. The storage cap still binds at complete, on
--      the HEAD's size, and `storage_used_bytes` stays the physical meter there.
--   4. `enforce_event_limit()`, replaced in place: verbatim from 20260827210000, then the daily breaker on a CREATION
--      only (`tg_op = 'INSERT'`; its undelete trigger is a restore, never a creation): an account's 100th event in any
--      24 hours is its last that day, a deleted one included (a create-and-delete loop counts), refused in words the
--      create action reads (`src/lib/db/mutations/events.ts`). After the plan's own limit, whose published sentence
--      is the truer one when both hold.
--
-- Neither breaker is published (PRICING.md, "(c) Bounds"); each number is this file's constant and its WHY.
--
-- ★ APPLY BEFORE PUSH (database-security.md, Workflow): the lane's presign calls `meter_upload` and fails CLOSED
-- without it (503, "Couldn't start the upload. Please try again."), so a deployment of that code against a database
-- without this file refuses every upload. The reverse order leaves a window: from this apply until a deployment runs
-- the lane's code, an upload that deployment starts counts nowhere (its old presign meters nothing; its complete no
-- longer does). partyreel.com shares this database with the alias, so redeploy it in the same sitting.
--
-- LOCKS AT APPLY: `storage_ledger` (two ADD COLUMNs with constant defaults, metadata only, and one CHECK validated
-- over its rows, a handful); three CREATE OR REPLACEs and one CREATE (catalog only). No hot table is rewritten.
--
-- ADVISORS: no delta expected (19 / 4 / 35). `meter_upload` is the service role's alone, so in neither 0028 nor 0029;
-- no table, policy or client grant is added.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: the three replaced bodies are the files' (md5 of the whitespace-collapsed prosrc):
--         create_media e83666cdb565e7d631f33088ea97b276, create_media_as_host 21f0397fdb4ec7e6c46137163a7fb2de,
--         enforce_event_limit 0bc037221ea8dbf348072024e173452a; `meter_upload` and the two columns do not exist.
--   (2) Apply verbatim.  (3) get_advisors (security): unchanged.
--   (4) Regenerate src/lib/db/types.ts (meter_upload joins Functions; storage_ledger gains its two columns), then drop
--       the typed seam in src/lib/upload/server-pipeline-meter.ts (`untyped`).
--   (5) The rolled-back check at the foot, in one execute_sql call.
-- =============================================================================================

-- =============================================================================================
-- 1. The hourly breaker's count, on the month's row.
-- =============================================================================================
alter table public.storage_ledger
  add column hour_started_at timestamptz,
  add column hour_uploads integer not null default 0;

alter table public.storage_ledger
  add constraint storage_ledger_hour_uploads_nonneg check (hour_uploads >= 0);

comment on column public.storage_ledger.hour_started_at is
  'The clock hour (UTC) hour_uploads counts, written by meter_upload at every presign. NULL until this month''s row meets its first presign.';
comment on column public.storage_ledger.hour_uploads is
  'Presigns admitted in hour_started_at, the hourly breaker''s count (meter_upload refuses the next past its constant). Restarts at 1 with each new hour.';

-- =============================================================================================
-- 2. The presign's count.
-- =============================================================================================
create function public.meter_upload(
  p_event_id uuid,
  p_type public.media_type,
  p_bytes bigint
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
  v_ledger public.storage_ledger;
  v_period text := to_char(now(), 'YYYY-MM'); -- the month's key, as every reader of the meter writes it
  v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');
  v_cap bigint;
  v_ingress_cap bigint;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  -- ★ THE HOURLY BREAKER: an account's uploads (her own and every guest's, into all her events) a clock hour. Far past
  -- any party: the 2,000-guest wedding averages about 2,000 an hour and might peak near 4,000, a venue holding three at
  -- once about 12,000; a script's tiny files stop here, and a real host never meets it (unpublished).
  c_uploads_an_hour constant integer := 20000;
begin
  if p_event_id is null or p_type is null or p_bytes is null or p_bytes < 1 or p_bytes > c_max_upload_bytes then
    raise exception 'meter_upload needs an event, a type and 1 to % bytes.', c_max_upload_bytes
      using errcode = 'invalid_parameter_value';
  end if;

  -- The event as the route's gates resolved it, read unlocked: an upload never locks the event row (a measured
  -- deadlock cycle with restores, purges and takedowns, 20261002200000).
  select * into v_event from public.events where id = p_event_id and deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'event_gone');
  end if;

  -- QA #17: the host's profiles row is the per-host mutex, and the first and only lock this takes, so two presigns
  -- never both read the month's last room and both spend it.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);
  select * into v_ledger from public.storage_ledger where host_id = v_event.host_id and period = v_period;

  -- The breaker first: a runaway past it pays this one read, never the storage sum below.
  if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  -- The month's allowance, the inequality create_media read at complete (NULL = unmetered: a paid profile with no cap
  -- on record fails open, as there).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null and coalesce(v_ledger.cumulative_bytes, 0) + p_bytes > v_ingress_cap then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;

  -- The storage it must fit, as create_media will judge it on the HEAD's size: refused here, before a byte moves and
  -- before the month is spent on a file the complete would refuse.
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null and public.host_active_bytes(v_event.host_id) + p_bytes > v_cap + (v_cap / 10) then
    return jsonb_build_object('ok', false, 'reason', 'storage');
  end if;

  -- The count: the declared bytes and the item, and the hour's tally (a new hour starts it again at one).
  insert into public.storage_ledger as l (
    host_id, period, cumulative_bytes, photo_count, video_count, hour_started_at, hour_uploads
  ) values (
    v_event.host_id, v_period, p_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end,
    v_hour, 1
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = l.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = l.photo_count + excluded.photo_count,
    video_count = l.video_count + excluded.video_count,
    hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end,
    hour_started_at = excluded.hour_started_at,
    updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.meter_upload(uuid, public.media_type, bigint) is
  'The presign''s count (upload-meter): under the host''s profiles lock, refuse past the hourly breaker, the month''s allowance or the storage cap and its 10%, else add the DECLARED bytes and the item to the month''s storage_ledger row. Never refunds. Service role only: the presign routes call it after their own gates.';

revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;
grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;

-- =============================================================================================
-- 3. The writers no longer count: the presign did.
-- =============================================================================================
create or replace function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true,
  p_phone_key text default null,
  p_phone_bytes bigint default null
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
  v_cap bigint;
  v_sealed_until timestamptz;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
  -- ★ THE CAMERA (20261002200000): its video's two bounds and the ceiling's multiple, each mirroring its one home
  -- under a parity test (src/lib/media/limits.ts, src/lib/disposable/roll.ts). The roll's size is the event's.
  c_camera_video_bytes constant bigint := 128::bigint * 1024 * 1024; -- mirrors CAMERA_VIDEO_MAX_BYTES
  c_camera_video_seconds constant double precision := 10.5; -- mirrors CAMERA_VIDEO_SECONDS + its grace
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000), the belt under get_upload_context's mask: a presign issued
  -- before the block, completed after it, lands nothing. The private album's words, which
  -- mapCheckViolation (src/lib/db/mutations/guest.ts) reads ahead of every other refusal.
  if public.event_block_holds_row(v_guest) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE DOOR (20260929120000), the same belt: a ticket waiting on the host adds nothing, and nor does
  -- anyone at an album that went Only me.
  if v_guest.admission = 'waiting' or (v_event.visibility = 'private' and v_event.gate is null) then
    raise exception 'This event is private.' using errcode = 'check_violation';
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

  -- ★ THE PHONE-SIZE COPY (20261003110000, take-home): a photograph's 2048 px JPEG, made in the uploader's browser and
  -- PUT beside the preview. It is never metered (no ledger, no storage_used_bytes, no cap reads it), so it is held
  -- here three ways, each a fact the complete route already checked on the R2 HEAD sizes (`phoneCopyFits`): its key
  -- is THIS photograph's own (`phone.jpg` beside its original: any other key names an object this upload never
  -- minted, and the purge would delete it), it comes with its bytes or not at all, and it is at most 4 MiB and at
  -- most half the original (an uncapped copy beside a tiny original would be storage nobody pays for). One sentence
  -- for every refusal, routed to bad_key by both wrappers' "does not belong".
  if p_phone_key is not null or p_phone_bytes is not null then
    if p_phone_key is null or p_phone_bytes is null
       or p_type <> 'photo'
       or p_phone_key <> 'events/' || v_event.id::text || '/photo/' || p_media_id::text || '/phone.jpg'
       or p_phone_bytes <= 0
       or p_phone_bytes > c_max_phone_bytes
       or p_phone_bytes * 2 > p_file_size_bytes then
      raise exception 'Phone copy does not belong to this upload.' using errcode = 'check_violation';
    end if;
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
  -- ★ THE VIDEOS SWITCH (20260929120000): a paid host can keep an album to photos. Guests only, like
  -- the per-upload cap: create_media_as_host is the host's own write and is exempt. The advisory is
  -- get_upload_context's `video_blocked`, worded around the event by the routes.
  if p_type = 'video' and not v_event.allow_videos then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- ★ THE CAMERA (20261002200000). A video is one shot of up to ten seconds: its length is the client's word, so its
  -- bytes are bounded too ("exceeds" and "longer than" route to too_large and too_long). Then the roll (guest_roll):
  -- her LIVE shots this period against its size, and every shot she has taken in it, removed or not, against three
  -- rolls' worth (the churn a freed frame opens). Counted AFTER the host's profiles lock above (every create_media of
  -- this album takes it first, so two completes of one guest are already serialized and each count reads the other's
  -- committed row, never both at 23) and under the roll's own advisory lock on her identity (the brief's, kept so the
  -- roll's serialization stays its own should the profiles lock ever move; taken after it, by nothing else, so it
  -- closes no cycle). Their own words (mapCheckViolation reads "roll"). The host's own uploads (create_media_as_host)
  -- are exempt from all four.
  if v_event.capture = 'camera' then
    if p_type = 'video' and p_file_size_bytes > c_camera_video_bytes then
      raise exception 'This video exceeds the 128 MB a camera shot can be.' using errcode = 'check_violation';
    end if;
    if p_type = 'video' and p_duration_seconds > c_camera_video_seconds then
      raise exception 'This video is longer than the 10 seconds a camera shot can be.' using errcode = 'check_violation';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('roll:' || coalesce(v_guest.user_id, v_guest.id)::text, 0));
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
    if v_live >= v_event.roll_size then
      raise exception 'You''ve taken all % shots on your roll.', v_event.roll_size using errcode = 'check_violation';
    end if;
    if v_taken >= v_event.roll_size * c_roll_retakes then
      raise exception 'You''ve used every retake this roll allows.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE MONTH WAS COUNTED AT THE PRESIGN (20261003210500, meter_upload): its declared bytes and the item, under this
  -- same lock, and never again here, so a completed file counts once and an abandoned one has already counted.

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

  -- ★ THE SEAL (20261002200000): a row added while the album's develop time is still ahead waits for it, whatever the
  -- capture and whatever the status (a held row approved later waits too). Read off the event row as this upload
  -- found it, unlocked: a host's save committing in the same instant can leave this one row on the old answer, and the
  -- album's next read heals it (develop_due).
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut someone saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes
  );

  -- ★ THE ROLL'S LEDGER (20261002200000): every shot taken in a camera's period, kept when the shot is removed or
  -- purged, so the ceiling above outlives the fast purge of a withdrawn shot. Her ticket's row, under the same locks.
  if v_event.capture = 'camera' then
    insert into public.camera_rolls as c (guest_id, sealed_from, taken)
    values (v_guest.id, v_event.sealed_from, 1)
    on conflict (guest_id, sealed_from) do update set taken = c.taken + 1;
  end if;

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
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
  p_height integer default null,
  p_reel_eligible boolean default true,
  p_phone_key text default null,
  p_phone_bytes bigint default null
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
  v_cap bigint;
  v_sealed_until timestamptz;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
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

  -- ★ THE PHONE-SIZE COPY (20261003110000, take-home): a photograph's 2048 px JPEG, made in the uploader's browser and
  -- PUT beside the preview. It is never metered (no ledger, no storage_used_bytes, no cap reads it), so it is held
  -- here three ways, each a fact the complete route already checked on the R2 HEAD sizes (`phoneCopyFits`): its key
  -- is THIS photograph's own (`phone.jpg` beside its original: any other key names an object this upload never
  -- minted, and the purge would delete it), it comes with its bytes or not at all, and it is at most 4 MiB and at
  -- most half the original (an uncapped copy beside a tiny original would be storage nobody pays for). One sentence
  -- for every refusal, routed to bad_key by both wrappers' "does not belong".
  if p_phone_key is not null or p_phone_bytes is not null then
    if p_phone_key is null or p_phone_bytes is null
       or p_type <> 'photo'
       or p_phone_key <> 'events/' || v_event.id::text || '/photo/' || p_media_id::text || '/phone.jpg'
       or p_phone_bytes <= 0
       or p_phone_bytes > c_max_phone_bytes
       or p_phone_bytes * 2 > p_file_size_bytes then
      raise exception 'Phone copy does not belong to this upload.' using errcode = 'check_violation';
    end if;
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

  -- ★ THE MONTH WAS COUNTED AT THE PRESIGN (20261003210500, meter_upload), as create_media's was: never again here.

  if v_cap is not null then
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE SEAL (20261002200000): the host's own upload waits with everyone's for the album's develop time, so the
  -- album develops whole. Exempt from the roll, its ceiling and the camera video's bounds: it is her album.
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut the host saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes
  );

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

-- Who may call them: the service role alone (the complete routes, on the admin client), restated as every replace of
-- theirs restates them.
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;
revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

-- =============================================================================================
-- 4. An account's events a day.
-- =============================================================================================
create or replace function public.enforce_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_type;
  v_slots integer;
  v_max integer;
  v_count integer;
  -- ★ THE DAILY BREAKER: an account's creations in any 24 hours. Far past any host (the busiest day on record is 34,
  -- the red-teams' own), so it stops a script and never a party; unpublished, and "unlimited events" stays true.
  c_events_a_day constant integer := 100;
begin
  -- QA #17: serialize concurrent slot decisions for this host before counting.
  perform 1 from public.profiles where id = new.host_id for update;

  select tier, event_slots into v_tier, v_slots from public.profiles where id = new.host_id;
  select coalesce(v_slots, max_events) into v_max from public.tier_limits(v_tier);

  if v_max is not null then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and deleted_at is null;

    if v_count >= v_max then
      raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max
        using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE DAILY BREAKER (20261003210500), on a creation only: the undelete trigger runs this body too, and a restore
  -- creates nothing. Every event the account created in the last 24 hours counts, a deleted one too (created_at is no
  -- client's to write), so a create-and-delete loop meets it as surely as a pile. Under the lock above, so two
  -- creations never both read 99. Its words are the refusal the create action shows (mutations/events.ts reads them).
  if tg_op = 'INSERT' then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and created_at > now() - interval '24 hours';

    if v_count >= c_events_a_day then
      raise exception 'You''ve created a lot of events today. Try again tomorrow.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- Trigger functions are client-invisible machinery (20260529003631), restated with the replace.
revoke execute on function public.enforce_event_limit() from public, anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one
-- execute_sql call, `begin;` + this file's statements + the steps below + `rollback;`, riding the export wiring probe
-- (340fcc7b-6c41-48f6-a143-6ef9f6724f4b: live, open, upload capture, no develop time, its Pro host) and one of its
-- tickets. Each step traps its own failure into the temp `proof` table; the final select is the answer. The RED run is
-- the same call without this file's statements.
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
--
-- create function pg_temp.ledger(p_host uuid)
-- returns table (bytes bigint, items bigint, hour_at timestamptz, hour_n integer)
-- language sql as $f$
--   select coalesce(sum(cumulative_bytes), 0)::bigint, coalesce(sum(photo_count + video_count), 0)::bigint,
--          max((to_jsonb(l) ->> 'hour_started_at')::timestamptz), max((to_jsonb(l) ->> 'hour_uploads')::integer)
--     from public.storage_ledger l where host_id = p_host and period = to_char(now(), 'YYYY-MM');
-- $f$;
--
-- create function pg_temp.meter(p_event uuid, p_type public.media_type, p_bytes bigint)
-- returns jsonb language plpgsql as $f$
-- begin
--   return public.meter_upload(p_event_id => p_event, p_type => p_type, p_bytes => p_bytes);
-- exception when others then
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
--
-- -- 1. the hour's two columns, and no client role reads the ledger
-- do $$
-- declare cols int; bad text := '';
-- begin
--   select count(*) into cols from information_schema.columns
--    where table_schema = 'public' and table_name = 'storage_ledger'
--      and ((column_name = 'hour_started_at' and data_type = 'timestamp with time zone' and is_nullable = 'YES')
--        or (column_name = 'hour_uploads' and data_type = 'integer' and is_nullable = 'NO' and column_default = '0'));
--   if cols <> 2 then bad := bad || ' columns=' || cols; end if;
--   if has_table_privilege('authenticated', 'public.storage_ledger', 'SELECT') then bad := bad || ' authenticated-reads'; end if;
--   if has_table_privilege('anon', 'public.storage_ledger', 'SELECT') then bad := bad || ' anon-reads'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('1 the hour''s two columns; no client role reads the ledger', true, 'hour_started_at timestamptz null, hour_uploads integer not null default 0');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the hour''s two columns; no client role reads the ledger', false, sqlerrm);
-- end $$;
--
-- -- 2. meter_upload: one signature, a definer with an empty search_path, the service role's alone
-- do $$
-- declare bad text := ''; r record; n int;
-- begin
--   select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'meter_upload';
--   if n <> 1 then raise exception 'overloads=%', n; end if;
--   select pg_get_function_identity_arguments(p.oid) as args, array_to_string(p.proacl, ',') as acl, p.prosecdef, p.proconfig
--     into r from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'meter_upload';
--   if r.args <> 'p_event_id uuid, p_type media_type, p_bytes bigint' then bad := bad || ' args:' || r.args; end if;
--   if r.acl is distinct from 'postgres=X/postgres,service_role=X/postgres' then bad := bad || ' acl:' || coalesce(r.acl, 'null'); end if;
--   if not r.prosecdef then bad := bad || ' not-definer'; end if;
--   if r.proconfig is distinct from array['search_path=""'] then bad := bad || ' config:' || coalesce(array_to_string(r.proconfig, ','), 'null'); end if;
--   if has_function_privilege('anon', 'public.meter_upload(uuid, public.media_type, bigint)', 'EXECUTE') then bad := bad || ' anon-executes'; end if;
--   if has_function_privilege('authenticated', 'public.meter_upload(uuid, public.media_type, bigint)', 'EXECUTE') then bad := bad || ' authenticated-executes'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 meter_upload: one signature, definer, empty search_path, service role alone', true, r.acl);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 meter_upload: one signature, definer, empty search_path, service role alone', false, sqlerrm);
-- end $$;
--
-- -- 3. a presign counts its declared bytes and the item, once, in this clock hour
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; a record; b record; j jsonb;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select * into a from pg_temp.ledger(v_host);
--   j := public.meter_upload(p_event_id => v_event, p_type => 'photo', p_bytes => 3000000);
--   select * into b from pg_temp.ledger(v_host);
--   if j <> '{"ok": true}'::jsonb then raise exception 'answer %', j; end if;
--   if b.bytes - a.bytes <> 3000000 or b.items - a.items <> 1 then raise exception 'bytes +%, items +%', b.bytes - a.bytes, b.items - a.items; end if;
--   if b.hour_at <> date_trunc('hour', now(), 'UTC') then raise exception 'hour %', b.hour_at; end if;
--   insert into proof (step, ok, detail) values ('3 a presign counts its declared bytes and the item, once', true,
--     format('bytes +%s, items +%s, hour %s (%s this hour)', b.bytes - a.bytes, b.items - a.items, b.hour_at, b.hour_n));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 a presign counts its declared bytes and the item, once', false, sqlerrm);
-- end $$;
--
-- -- 4. the complete counts nothing, host and guest: the ledger stands still; the physical meter and active bytes move
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_token text; mid uuid; gid uuid;
--         a record; b record; c record; used0 bigint; used1 bigint; act0 bigint; act1 bigint;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select g.session_token into v_token from public.guests g
--    where g.event_id = v_event and g.admission <> 'waiting' and not public.event_block_holds_row(g)
--    order by g.created_at limit 1;
--   if v_token is null then raise exception 'no ticket to ride'; end if;
--   select * into a from pg_temp.ledger(v_host);
--   select storage_used_bytes into used0 from public.profiles where id = v_host;
--   act0 := public.host_active_bytes(v_host);
--   mid := gen_random_uuid();
--   perform public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.jpg', p_file_size_bytes => 3000000);
--   select * into b from pg_temp.ledger(v_host);
--   gid := gen_random_uuid();
--   perform public.create_media(
--     p_session_token => v_token, p_media_id => gid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || gid || '/original.jpg', p_file_size_bytes => 2400000);
--   select * into c from pg_temp.ledger(v_host);
--   select storage_used_bytes into used1 from public.profiles where id = v_host;
--   act1 := public.host_active_bytes(v_host);
--   if b.bytes <> a.bytes or b.items <> a.items then raise exception 'the host''s complete counted bytes +%, items +%', b.bytes - a.bytes, b.items - a.items; end if;
--   if c.bytes <> b.bytes or c.items <> b.items then raise exception 'the guest''s complete counted bytes +%, items +%', c.bytes - b.bytes, c.items - b.items; end if;
--   if used1 - used0 <> 5400000 or act1 - act0 <> 5400000 then raise exception 'used +%, active +%', used1 - used0, act1 - act0; end if;
--   insert into proof (step, ok, detail) values ('4 the complete counts nothing (host and guest); physical and active bytes move', true,
--     format('ledger +%s bytes +%s items; storage_used +%s, active +%s', c.bytes - a.bytes, c.items - a.items, used1 - used0, act1 - act0));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the complete counts nothing (host and guest); physical and active bytes move', false, sqlerrm);
-- end $$;
--
-- -- 5. the month's line is today's: the month's bytes plus this file's past monthly_ingress_cap() refuse; exactly at it admits
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_cap bigint; j1 jsonb; j2 jsonb; b record;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select public.monthly_ingress_cap(p.tier, p.storage_cap_bytes) into v_cap from public.profiles p where p.id = v_host;
--   update public.storage_ledger set cumulative_bytes = v_cap - 1000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j1 := pg_temp.meter(v_event, 'photo', 1000);
--   j2 := pg_temp.meter(v_event, 'photo', 1);
--   select * into b from pg_temp.ledger(v_host);
--   if j1 <> '{"ok": true}'::jsonb then raise exception 'exactly at the line: %', j1; end if;
--   if j2 <> '{"ok": false, "reason": "monthly"}'::jsonb then raise exception 'one past it: %', j2; end if;
--   if b.bytes <> v_cap then raise exception 'ledger % against the cap %', b.bytes, v_cap; end if;
--   insert into proof (step, ok, detail) values ('5 the month''s line is today''s (exactly at it admits; one byte past refuses, uncounted)', true,
--     format('cap %s; at the line %s; past it %s; the ledger stays %s', v_cap, j1, j2, b.bytes));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 the month''s line is today''s (exactly at it admits; one byte past refuses, uncounted)', false, sqlerrm);
-- end $$;
--
-- -- 6. a file that will not fit the storage cap and its 10% is refused before it counts
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_active bigint; j1 jsonb; j2 jsonb; a record; b record;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   update public.storage_ledger set cumulative_bytes = 0 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   v_active := public.host_active_bytes(v_host);
--   update public.profiles set storage_cap_bytes = v_active where id = v_host;   -- the room left: exactly its 10%
--   select * into a from pg_temp.ledger(v_host);
--   j1 := pg_temp.meter(v_event, 'video', v_active / 10 + 1);
--   select * into b from pg_temp.ledger(v_host);
--   j2 := pg_temp.meter(v_event, 'video', v_active / 10);
--   if j1 <> '{"ok": false, "reason": "storage"}'::jsonb then raise exception 'one byte past the room: %', j1; end if;
--   if b.bytes <> a.bytes or b.items <> a.items then raise exception 'the refused file counted +%', b.bytes - a.bytes; end if;
--   if j2 <> '{"ok": true}'::jsonb then raise exception 'exactly the room: %', j2; end if;
--   insert into proof (step, ok, detail) values ('6 a file past the storage cap and its 10% is refused, uncounted; exactly the room admits', true,
--     format('active %s, room %s: past it %s, at it %s', v_active, v_active / 10, j1, j2));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 a file past the storage cap and its 10% is refused, uncounted; exactly the room admits', false, sqlerrm);
-- end $$;
--
-- -- 7. the hourly breaker: the 20,001st upload of a clock hour waits for the next; a new hour starts the count at one
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_hour timestamptz := date_trunc('hour', now(), 'UTC');
--         j1 jsonb; j2 jsonb; j3 jsonb; a record; b record; c record; d record; secs int;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   update public.profiles set storage_cap_bytes = 536870912000 where id = v_host;
--   update public.storage_ledger set hour_started_at = v_hour, hour_uploads = 20000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   select * into a from pg_temp.ledger(v_host);
--   j1 := pg_temp.meter(v_event, 'photo', 1);
--   select * into b from pg_temp.ledger(v_host);
--   if j1 ->> 'reason' is distinct from 'hourly' then raise exception 'at 20,000: %', j1; end if;
--   secs := (j1 ->> 'retry_after_sec')::int;
--   if secs < 1 or secs > 3600 then raise exception 'retry after %', secs; end if;
--   if b.bytes <> a.bytes or b.hour_n <> 20000 then raise exception 'the refused one counted (% bytes, % this hour)', b.bytes - a.bytes, b.hour_n; end if;
--   update public.storage_ledger set hour_uploads = 19999 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j2 := pg_temp.meter(v_event, 'photo', 1);
--   select * into c from pg_temp.ledger(v_host);
--   if j2 <> '{"ok": true}'::jsonb or c.hour_n <> 20000 then raise exception 'at 19,999: % (% this hour)', j2, c.hour_n; end if;
--   update public.storage_ledger set hour_started_at = v_hour - interval '1 hour', hour_uploads = 20000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j3 := pg_temp.meter(v_event, 'photo', 1);
--   select * into d from pg_temp.ledger(v_host);
--   if j3 <> '{"ok": true}'::jsonb or d.hour_n <> 1 or d.hour_at <> v_hour then raise exception 'a new hour: % (% at %)', j3, d.hour_n, d.hour_at; end if;
--   insert into proof (step, ok, detail) values ('7 the hourly breaker: the 20,001st waits for the next hour, uncounted; a new hour starts at one', true,
--     format('at 20,000 %s; at 19,999 ok and 20,000 after; a new hour %s at %s', j1, d.hour_n, d.hour_at));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 the hourly breaker: the 20,001st waits for the next hour, uncounted; a new hour starts at one', false, sqlerrm);
-- end $$;
--
-- -- 8. an event that is gone, or deleted, counts nothing
-- do $$
-- declare v_deleted uuid; j1 jsonb; j2 jsonb;
-- begin
--   select id into v_deleted from public.events where deleted_at is not null order by deleted_at desc limit 1;
--   j1 := pg_temp.meter(gen_random_uuid(), 'photo', 1000);
--   j2 := pg_temp.meter(v_deleted, 'photo', 1000);
--   if j1 <> '{"ok": false, "reason": "event_gone"}'::jsonb or j2 <> '{"ok": false, "reason": "event_gone"}'::jsonb then
--     raise exception 'unknown %, deleted %', j1, j2;
--   end if;
--   insert into proof (step, ok, detail) values ('8 an unknown or deleted event: event_gone, nothing counted', true, j1::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 an unknown or deleted event: event_gone, nothing counted', false, sqlerrm);
-- end $$;
--
-- -- 9. no bytes, past 10 GiB, or no type: refused as a caller's mistake
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; bad text := ''; got text;
-- begin
--   foreach got in array array[
--     pg_temp.meter(v_event, 'photo', 0)::text,
--     pg_temp.meter(v_event, 'photo', -1)::text,
--     pg_temp.meter(v_event, 'photo', 10737418241)::text,
--     pg_temp.meter(v_event, null, 1000)::text,
--     pg_temp.meter(null, 'photo', 1000)::text] loop
--     if got not like '%22023 meter_upload needs an event, a type and 1 to 10737418240 bytes.%' then bad := bad || ' ' || got; end if;
--   end loop;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('9 no bytes, past 10 GiB, no type or no event: 22023', true, '5 cases');
-- exception when others then
--   insert into proof (step, ok, detail) values ('9 no bytes, past 10 GiB, no type or no event: 22023', false, sqlerrm);
-- end $$;
--
-- -- 10. the complete no longer refuses on the month: the presign was the gate, and admitted what it counted
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_cap bigint; mid uuid := gen_random_uuid(); j jsonb; a record; b record;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select public.monthly_ingress_cap(p.tier, p.storage_cap_bytes) into v_cap from public.profiles p where p.id = v_host;
--   update public.storage_ledger set cumulative_bytes = v_cap + 1 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   select * into a from pg_temp.ledger(v_host);
--   j := public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.jpg', p_file_size_bytes => 3000000);
--   select * into b from pg_temp.ledger(v_host);
--   if b.bytes <> a.bytes then raise exception 'counted +%', b.bytes - a.bytes; end if;
--   insert into proof (step, ok, detail) values ('10 a complete past the month''s line still records, uncounted (the presign was the gate)', true, j::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('10 a complete past the month''s line still records, uncounted (the presign was the gate)', false, sqlerrm);
-- end $$;
--
-- -- 11. the daily breaker: an account's 101st creation in 24 hours is refused in words, a restore never; the plan's own
-- --     limit still speaks first on Free
-- do $$
-- declare v_pro uuid := '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b'; v_free uuid := '3fcf6405-ce4d-46ea-a11c-9ed68194b630';
--         n int; i int; got text := 'accepted'; restored uuid; free1 text := 'accepted'; free2 text := 'accepted';
-- begin
--   select count(*) into n from public.events where host_id = v_pro and created_at > now() - interval '24 hours';
--   for i in 1 .. 100 - n loop
--     insert into public.events (host_id, name) values (v_pro, 'Meter proof ' || i);
--   end loop;
--   begin
--     insert into public.events (host_id, name) values (v_pro, 'Meter proof 101');
--   exception when others then got := sqlstate || ' ' || sqlerrm;
--   end;
--   if got <> '23514 You''ve created a lot of events today. Try again tomorrow.' then raise exception 'the 101st: %', got; end if;
--   select id into restored from public.events where host_id = v_pro and deleted_at is not null order by deleted_at desc limit 1;
--   update public.events set deleted_at = null where id = restored;   -- a restore: the undelete trigger, never the breaker
--   begin
--     insert into public.events (host_id, name) values (v_free, 'Meter proof free 1');
--   exception when others then free1 := sqlstate || ' ' || sqlerrm;
--   end;
--   begin
--     insert into public.events (host_id, name) values (v_free, 'Meter proof free 2');
--   exception when others then free2 := sqlstate || ' ' || sqlerrm;
--   end;
--   if free1 <> 'accepted' or free2 not like '23514 Event limit reached for the free plan%' then raise exception 'free: %; %', free1, free2; end if;
--   insert into proof (step, ok, detail) values ('11 the 101st creation in 24 hours refused in words; a restore never; Free''s own limit first', true,
--     format('%s made before, %s now, the next: %s; restored %s; free: %s, then %s', n, 100, got, restored, free1, free2));
-- exception when others then
--   insert into proof (step, ok, detail) values ('11 the 101st creation in 24 hours refused in words; a restore never; Free''s own limit first', false, sqlerrm);
-- end $$;
--
-- -- 12. the bodies are the file's
-- insert into proof (step, ok, detail)
-- select '12 the bodies (md5 of the whitespace-collapsed prosrc)', true,
--   string_agg(p.proname || ' ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), ', ' order by p.proname)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname in ('meter_upload', 'create_media', 'create_media_as_host', 'enforce_event_limit');
--
-- select n, step, ok, detail from proof order by n;
--
-- RESULT, 2026-10-03, nothing persisted by either run (afterwards no `meter_upload` and no `hour_*` column exist, the
-- three bodies still hash e83666cd, 21f0397f and 0bc03722, no "Meter proof" event exists, the host's cap and her
-- month's ledger read as before, and the restored event is still deleted):
--   LIVE RED, without this file's statements: 11/11 fail, each on what it lacks (1 no columns; 2 no function; 3, 5, 6,
--     8 and 9 `function public.meter_upload(...) does not exist` (42883); 4 "the host's complete counted bytes +3000000,
--     items +1"; 7 `column "hour_started_at" ... does not exist`; 10 "Monthly upload limit reached for this plan."; 11
--     "the 101st: accepted").
--   LIVE GREEN, with them: 12/12. 3: bytes +3,000,000, items +1, this clock hour; 4: the complete +0 for the host's
--     and the guest's, storage_used and active +5,400,000; 5: at the line ok, one byte past `monthly`, the ledger at
--     the cap; 6: one byte past the room `storage`, uncounted, exactly the room ok; 7: at 20,000 `hourly` with
--     retry_after_sec 2,275, at 19,999 ok, a new hour back to 1; 8: event_gone twice; 9: five 22023s; 10: a complete
--     past the month records, uncounted; 11: 34 made, 66 more, the 101st "You've created a lot of events today. Try
--     again tomorrow." (23514), a restore passes, Free's own limit first; 12: create_media
--     81d65fec8d438eb6ddafcc558783774c, create_media_as_host db8c00fa1273d8aaa3918826af4f486b, enforce_event_limit
--     42fb725f629636855b4f19446f933a6f, meter_upload d70154094f239bcd4b66ec6b298c5893 (md5 of each body's
--     whitespace-collapsed prosrc), the file's own.
-- =============================================================================================
