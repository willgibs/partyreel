-- =============================================================================================
-- THE PHONE-SIZE COPY (lane take-home-wiring; take-home r1, Will's desk on build 45, 2026-10-03:
-- `save=light`, `host=two`, and the same night "the phone-size copy never counts against a host's storage").
--
-- Every new photograph gets a third stored copy beside its original and its tile's preview: a 2048 px JPEG made in
-- the uploader's browser (src/lib/upload/preview.ts) and PUT straight to R2 at `events/<event>/photo/<id>/phone.jpg`
-- (src/lib/r2/keys.ts). It is what a guest's Save puts into Photos and what a host's Phone size takes home. Videos
-- stay as taken; no row is backfilled (every photograph today is test data, and a photograph without a copy falls
-- back to its original everywhere).
--
--   1. `media.phone_key` and `media.phone_bytes`, both or neither, a photograph's alone, its key its own, its bytes
--      within 4 MiB and half its original's: CHECKs on the row, so no writer can ever store an unbounded or a foreign
--      copy. NO client grant: the host's column-scoped SELECT (database-security.md) does not grow, so
--      `MEDIA_HOST_COLUMNS` and its parity test are untouched; every reader of the copy is the service role, after its
--      own route's authorization (the export routes, the purges).
--   2. `create_media` and `create_media_as_host`: DROP and CREATE (an argument list cannot change in place), each body
--      verbatim from 20261002200000 but for two defaulted arguments LAST (`p_phone_key`, `p_phone_bytes`), their
--      check beside the preview key's, and the two columns at the insert's end. ★ THE PHONE BYTES ARE NEVER METERED:
--      the ledger, `storage_used_bytes` and every cap still read `p_file_size_bytes` alone. Old callers keep working:
--      PostgREST resolves by argument NAME, and a body without the two names lands on the defaults.
--   3. Their grants, restated exactly (a DROP re-inherits PUBLIC's EXECUTE): service role only.
--
-- ★ APPLY BEFORE PUSH (database-security.md): the app names the two arguments whenever an upload has a copy, so a
-- deployment with this lane's code against a database without this file refuses those uploads (PGRST202), and its
-- purges read `phone_key` (42703). The reverse order is safe: today's app never names them.
--
-- The rolled-back proof is at the foot, with its results.
-- =============================================================================================

-- =============================================================================================
-- 1. The copy's two columns, and what a row may hold in them.
-- =============================================================================================
alter table public.media
  add column phone_key text,
  add column phone_bytes bigint;

alter table public.media
  add constraint media_phone_copy_pair
    check ((phone_key is null) = (phone_bytes is null)),
  add constraint media_phone_copy_key
    check (
      phone_key is null
      or (type = 'photo' and phone_key = 'events/' || event_id::text || '/photo/' || id::text || '/phone.jpg')
    ),
  add constraint media_phone_copy_bytes
    check (
      phone_bytes is null
      or (phone_bytes > 0 and phone_bytes <= 4194304 and phone_bytes * 2 <= file_size_bytes)
    );

comment on column public.media.phone_key is
  'The phone-size copy (take-home): a photograph''s 2048 px JPEG at events/<event_id>/photo/<id>/phone.jpg, made in the uploader''s browser. NULL when it has none (its original serves). Written only by create_media*, after the complete route''s HEAD. Every purge deletes it beside original_key and preview_key (lifecycle/reclaim.ts mediaKeysOf). No client grant.';
comment on column public.media.phone_bytes is
  'The phone-size copy''s bytes, as R2''s HEAD read them at complete: at most 4 MiB and half of file_size_bytes. NEVER METERED: no ledger, storage_used_bytes or cap reads it. NULL exactly when phone_key is.';

-- =============================================================================================
-- 2. The writers: the copy recorded in the same insert, never metered.
-- =============================================================================================
drop function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean);

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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

drop function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean);

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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

-- =============================================================================================
-- 3. Who may call them: the service role alone (the complete routes, on the admin client), as before.
-- =============================================================================================
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;
revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md "An unapplied migration is proved on the live schema"): one
-- execute_sql call, `begin;` + this file's statements + the steps below + `rollback;`, riding an existing test
-- album (the export wiring probe: live, open, upload capture, no develop time, its Pro host) and one of its
-- existing tickets. Each step traps its own failure into the temp `proof` table; the final select is the answer.
--
-- -- The phone copy's rolled-back proof (take-home-wiring). Rides an EXISTING test event (the export wiring probe:
-- -- live, open, upload capture, no develop time, a Pro host) and one of its existing tickets; everything is undone.
-- create temp table proof (n serial, step text, ok boolean, detail text);
--
-- create function pg_temp.host_try(p_media uuid, p_type public.media_type, p_size bigint, p_phone_key text, p_phone_bytes bigint)
-- returns text language plpgsql as $f$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_kind text := p_type::text;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   perform public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => p_media, p_type => p_type,
--     p_original_key => 'events/' || v_event || '/' || v_kind || '/' || p_media || '/original.jpg',
--     p_file_size_bytes => p_size,
--     p_phone_key => p_phone_key, p_phone_bytes => p_phone_bytes);
--   return 'accepted';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- 1. the columns: there, nullable, and no client role may read or write them
-- do $$
-- declare cols int; bad text := '';
-- begin
--   select count(*) into cols from information_schema.columns
--     where table_schema = 'public' and table_name = 'media' and column_name in ('phone_key', 'phone_bytes') and is_nullable = 'YES';
--   if cols <> 2 then bad := bad || ' columns=' || cols; end if;
--   if has_column_privilege('authenticated', 'public.media', 'phone_key', 'SELECT') then bad := bad || ' authenticated-reads'; end if;
--   if has_column_privilege('anon', 'public.media', 'phone_key', 'SELECT') then bad := bad || ' anon-reads'; end if;
--   if has_column_privilege('authenticated', 'public.media', 'phone_key', 'UPDATE') then bad := bad || ' authenticated-writes'; end if;
--   if not has_column_privilege('service_role', 'public.media', 'phone_bytes', 'SELECT') then bad := bad || ' service-cannot-read'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('1 two nullable columns, no client privilege', true, 'authenticated and anon hold nothing; the service role reads');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 two nullable columns, no client privilege', false, sqlerrm);
-- end $$;
--
-- -- 2. one signature each, the phone pair last, service role only
-- do $$
-- declare bad text := ''; r record;
-- begin
--   for r in select p.proname, p.pronargs, (p.proargnames)[p.pronargs - 1] as a1, (p.proargnames)[p.pronargs] as a2,
--                   array_to_string(p.proacl, ',') as acl, p.prosecdef
--            from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--            where n.nspname = 'public' and p.proname in ('create_media', 'create_media_as_host') loop
--     if r.a1 <> 'p_phone_key' or r.a2 <> 'p_phone_bytes' then bad := bad || ' ' || r.proname || '-args'; end if;
--     if r.acl is distinct from 'postgres=X/postgres,service_role=X/postgres' then bad := bad || ' ' || r.proname || '-acl:' || coalesce(r.acl, 'null'); end if;
--     if not r.prosecdef then bad := bad || ' ' || r.proname || '-not-definer'; end if;
--   end loop;
--   if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'create_media') <> 1 then bad := bad || ' create_media-overloads'; end if;
--   if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'create_media_as_host') <> 1 then bad := bad || ' as_host-overloads'; end if;
--   if (select pronargs from pg_proc where proname = 'create_media' and pronamespace = 'public'::regnamespace) <> 12 then bad := bad || ' create_media-arity'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 one signature each, the phone pair last, service role only', true, '12 and 13 arguments; EXECUTE postgres and service_role alone');
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 one signature each, the phone pair last, service role only', false, sqlerrm);
-- end $$;
--
-- -- 3. an old caller, naming no phone argument, still records (with no copy)
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; mid uuid := gen_random_uuid(); j jsonb;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   j := public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.jpg', p_file_size_bytes => 2000000,
--     p_preview_key => 'events/' || v_event || '/photo/' || mid || '/preview.webp', p_reel_eligible => true);
--   if not exists (select 1 from public.media where id = mid and phone_key is null and phone_bytes is null) then
--     raise exception 'no row, or a copy appeared: %', j;
--   end if;
--   insert into proof (step, ok, detail) values ('3 an old caller (no phone names) still records, with no copy', true, j::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 an old caller (no phone names) still records, with no copy', false, sqlerrm);
-- end $$;
--
-- -- 4. a host's photograph with its copy: recorded, and only the original metered
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; mid uuid := gen_random_uuid();
--         used0 bigint; used1 bigint; ledger0 bigint; ledger1 bigint; active0 bigint; active1 bigint; v_period text := to_char(now(), 'YYYY-MM');
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select storage_used_bytes into used0 from public.profiles where id = v_host;
--   select coalesce((select cumulative_bytes from public.storage_ledger where host_id = v_host and period = v_period), 0) into ledger0;
--   active0 := public.host_active_bytes(v_host);
--   perform public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.jpg', p_file_size_bytes => 3000000,
--     p_phone_key => 'events/' || v_event || '/photo/' || mid || '/phone.jpg', p_phone_bytes => 600000);
--   select storage_used_bytes into used1 from public.profiles where id = v_host;
--   select coalesce((select cumulative_bytes from public.storage_ledger where host_id = v_host and period = v_period), 0) into ledger1;
--   active1 := public.host_active_bytes(v_host);
--   if not exists (select 1 from public.media where id = mid and phone_key = 'events/' || v_event || '/photo/' || mid || '/phone.jpg' and phone_bytes = 600000) then
--     raise exception 'the copy was not recorded';
--   end if;
--   if used1 - used0 <> 3000000 or ledger1 - ledger0 <> 3000000 or active1 - active0 <> 3000000 then
--     raise exception 'metered: used +%, ledger +%, active +%', used1 - used0, ledger1 - ledger0, active1 - active0;
--   end if;
--   insert into proof (step, ok, detail) values ('4 the host''s copy recorded; only the original metered', true,
--     format('used +%s, ledger +%s, active +%s (the copy''s 600000 in none)', used1 - used0, ledger1 - ledger0, active1 - active0));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the host''s copy recorded; only the original metered', false, sqlerrm);
-- end $$;
--
-- -- 5. a guest's photograph with its copy (create_media), on an existing ticket of the album
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_token text; mid uuid := gen_random_uuid(); j jsonb; used0 bigint; used1 bigint; v_host uuid;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select g.session_token into v_token from public.guests g
--     where g.event_id = v_event and g.admission <> 'waiting' and not public.event_block_holds_row(g)
--     order by g.created_at limit 1;
--   if v_token is null then raise exception 'no ticket to ride'; end if;
--   select storage_used_bytes into used0 from public.profiles where id = v_host;
--   j := public.create_media(
--     p_session_token => v_token, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.heic', p_file_size_bytes => 2400000,
--     p_preview_key => 'events/' || v_event || '/photo/' || mid || '/preview.webp',
--     p_phone_key => 'events/' || v_event || '/photo/' || mid || '/phone.jpg', p_phone_bytes => 512000);
--   select storage_used_bytes into used1 from public.profiles where id = v_host;
--   if not exists (select 1 from public.media where id = mid and phone_bytes = 512000 and guest_id is not null) then
--     raise exception 'the guest''s copy was not recorded: %', j;
--   end if;
--   if used1 - used0 <> 2400000 then raise exception 'metered +%', used1 - used0; end if;
--   insert into proof (step, ok, detail) values ('5 a guest''s copy recorded by create_media; only the original metered', true, j::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 a guest''s copy recorded by create_media; only the original metered', false, sqlerrm);
-- end $$;
--
-- -- 6. every refusal, in one sentence a wrapper reads as bad_key
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; mid uuid; other uuid := gen_random_uuid(); bad text := ''; got text;
--         want text := '23514 Phone copy does not belong to this upload.';
--         own text; cases int := 0;
-- begin
--   -- a: the key alone
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'photo', 3000000, own, null); cases := cases + 1; if got <> want then bad := bad || ' key-alone:' || got; end if;
--   -- b: the bytes alone
--   mid := gen_random_uuid();
--   got := pg_temp.host_try(mid, 'photo', 3000000, null, 600000); cases := cases + 1; if got <> want then bad := bad || ' bytes-alone:' || got; end if;
--   -- c: a video's copy (videos stay as taken)
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/video/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'video', 30000000, own, 600000); cases := cases + 1; if got <> want then bad := bad || ' video:' || got; end if;
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'video', 30000000, own, 600000); cases := cases + 1; if got <> want then bad := bad || ' video-photo-key:' || got; end if;
--   -- d: another photograph's key in the same album (a plant its purge would delete)
--   mid := gen_random_uuid();
--   got := pg_temp.host_try(mid, 'photo', 3000000, 'events/' || v_event || '/photo/' || other || '/phone.jpg', 600000); cases := cases + 1; if got <> want then bad := bad || ' other-media:' || got; end if;
--   -- e: another album's key
--   mid := gen_random_uuid();
--   got := pg_temp.host_try(mid, 'photo', 3000000, 'events/' || other || '/photo/' || mid || '/phone.jpg', 600000); cases := cases + 1; if got <> want then bad := bad || ' other-event:' || got; end if;
--   -- f: another variant in its slot
--   mid := gen_random_uuid();
--   got := pg_temp.host_try(mid, 'photo', 3000000, 'events/' || v_event || '/photo/' || mid || '/preview.webp', 600000); cases := cases + 1; if got <> want then bad := bad || ' preview-slot:' || got; end if;
--   -- g: past 4 MiB, beside a big original
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'photo', 40000000, own, 4194305); cases := cases + 1; if got <> want then bad := bad || ' over-4mib:' || got; end if;
--   -- h: past half its original (exactly half is the line)
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'photo', 1000000, own, 500001); cases := cases + 1; if got <> want then bad := bad || ' over-half:' || got; end if;
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'photo', 1000000, own, 500000); cases := cases + 1; if got <> 'accepted' then bad := bad || ' exactly-half-refused:' || got; end if;
--   -- i: nothing at all, or less
--   mid := gen_random_uuid(); own := 'events/' || v_event || '/photo/' || mid || '/phone.jpg';
--   got := pg_temp.host_try(mid, 'photo', 3000000, own, 0); cases := cases + 1; if got <> want then bad := bad || ' zero:' || got; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('6 every refusal in one sentence (bad_key); exactly half is the line', true, cases || ' cases');
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 every refusal in one sentence (bad_key); exactly half is the line', false, sqlerrm);
-- end $$;
--
-- -- 7. the row itself refuses what no writer may store (the CHECKs, for any writer at all)
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; mid uuid := gen_random_uuid(); bad text := ''; st text;
-- begin
--   perform pg_temp.host_try(mid, 'photo', 3000000, 'events/' || v_event || '/photo/' || mid || '/phone.jpg', 600000);
--   begin update public.media set phone_key = 'events/' || v_event || '/photo/' || gen_random_uuid() || '/phone.jpg' where id = mid; bad := bad || ' foreign-key-stored';
--   exception when check_violation then null; end;
--   begin update public.media set phone_bytes = 1500001 where id = mid; bad := bad || ' over-half-stored';
--   exception when check_violation then null; end;
--   begin update public.media set phone_key = null where id = mid; bad := bad || ' half-pair-stored';
--   exception when check_violation then null; end;
--   begin update public.media set type = 'video' where id = mid; bad := bad || ' video-with-copy-stored';
--   exception when check_violation then null; end;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('7 the row refuses a foreign key, past half, half a pair, a video''s copy', true, '23514 each');
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 the row refuses a foreign key, past half, half a pair, a video''s copy', false, sqlerrm);
-- end $$;
--
-- -- 8. a purge frees the original's bytes, never the copy's
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; mid uuid := gen_random_uuid(); used0 bigint; used1 bigint; freed bigint;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   perform pg_temp.host_try(mid, 'photo', 3000000, 'events/' || v_event || '/photo/' || mid || '/phone.jpg', 600000);
--   select storage_used_bytes into used0 from public.profiles where id = v_host;
--   select coalesce(sum(r.freed_bytes), 0) into freed from public.purge_media_rows(array[mid]) r;
--   select storage_used_bytes into used1 from public.profiles where id = v_host;
--   if freed <> 3000000 or used0 - used1 <> 3000000 then raise exception 'freed %, used -%', freed, used0 - used1; end if;
--   insert into proof (step, ok, detail) values ('8 a purge frees the original''s bytes alone', true, format('freed %s', freed));
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 a purge frees the original''s bytes alone', false, sqlerrm);
-- end $$;
--
-- -- 9. the bodies are the file's
-- insert into proof (step, ok, detail)
-- select '9 the bodies are the file''s', true,
--   string_agg(p.proname || ' ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), ', ' order by p.proname)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname in ('create_media', 'create_media_as_host');
--
-- select n, step, ok, detail from proof order by n;
--
-- RESULT, 2026-10-03, nothing persisted by either run (afterwards no `phone_key` or `phone_bytes` column exists,
-- create_media and create_media_as_host still hash 591bcfd3 and d0deaf26, media holds its 1,671 rows and the host's
-- storage_used_bytes reads 234,291,862, as before):
--   LIVE RED, without this file's statements: 8/8 fail, each on what it lacks (1 and 3 and 7 `column "phone_key" ...
--     does not exist`; 2 the arguments and the arity; 4, 5 and every case of 6 `function public.create_media_as_host(...
--     p_phone_key => text, p_phone_bytes => ...) does not exist` (42883); 8 `freed 0`).
--   LIVE GREEN, with them: 9/9. 3: an old caller's row, no copy; 4: used +3,000,000, ledger +3,000,000, active
--     +3,000,000 (the copy's 600,000 in none); 5: a guest's copy by create_media, used +2,400,000; 6: 11 cases, ten
--     refused in the one sentence and exactly half accepted; 7: the four direct writes 23514; 8: freed 3,000,000;
--     9: create_media e83666cdb565e7d631f33088ea97b276, create_media_as_host 21f0397fdb4ec7e6c46137163a7fb2de (md5 of
--     each body's whitespace-collapsed prosrc), the file's own.
-- =============================================================================================
