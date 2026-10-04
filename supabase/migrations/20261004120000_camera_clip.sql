-- CAMERA CLIP (Will's yes, 2026-10-04: "if easily manageable, i think this is a win-win. hosts get longer videos of
-- special moments, we max storage more easily with great performance."): the album camera's held clip runs to thirty
-- seconds at about 5 Mbps (about 19 MB), and the server's bound says so. One body changes, create_media, restated from
-- its newest definition (20261004100000_ladder_a.sql, live at the hash below) verbatim but for its camera block, which
-- the Advisor's Q26 asked to harden so the next restatement is not fragile:
--
--   1. The clip's seconds, 10.5 -> 30, with the grace its own constant (c_camera_video_grace, 0.5): the check reads
--      `p_duration_seconds > c_camera_video_seconds + c_camera_video_grace`, so the mirror of CAMERA_VIDEO_SECONDS and
--      CAMERA_VIDEO_GRACE_SECONDS (src/lib/media/limits.ts) is literal, not a sum folded into 10.5, and roll.test.ts
--      reads each SQL constant beside its TypeScript twin.
--   2. The clip's byte bound, 128 -> 384 MB, by the reasoning it was set with: a clip's length is the client's word, so
--      its bytes are the cost bound; 128 MB held ten seconds of 4K at 60 fps from any current phone (about 13 MB a
--      second), and thirty seconds of the same is three times that. The real clip is about 19 MB (the recorder asks
--      5 Mbps, src/lib/guest/camera/recorder.ts), so this is what a client that lies about the length can spend a
--      shot, never what the camera makes. It opens no loophole: every byte counts against the host's room and her
--      plan's uploads whatever the shot's size.
--   3. Both refusals are built with format() from those constants, so one literal drives the check and its words
--      (before, each number lived in its constant and again in its sentence). The words the guest wrapper routes by
--      stay in them ("exceeds" -> too_large, "longer than" -> too_long: mapCheckViolation,
--      src/lib/db/mutations/guest.ts); the roll's two sentences and c_roll_retakes (3) are untouched (re-shoots become
--      a flat 3 with the confirm that warns of it, not here).
--
-- The diff against ladder_a's body is those hunks only: the constants, the camera block's lead comment (ten -> thirty)
-- and the two refusals. Same signature, return type, language, volatility, security mode and empty search_path, so
-- create or replace keeps the owner and the ACL; the grants are restated as they stand live. No column, type or other
-- body moves, so there is nothing to regenerate in src/lib/db/types.ts.
--
-- ★ WHAT MILESTONE 35 AND THE ALIAS MEET between this apply and the next milestone (partyreel.com shares this
-- database; nothing there holds real data): an expand. Their camera still ends itself at ten seconds and records about
-- 10 MB, and their presign still refuses a clip past ten and a half seconds or 128 MB in its own words before any byte
-- moves, so a longer bound here refuses nothing they send and loosens nothing they promise. The other order is the one
-- to avoid: the build that films thirty seconds, deployed before this apply, would have its longer clips refused at the
-- complete wherever the file reports its length (an MP4 does: "longer than the 10 seconds", after the bytes moved), so
-- apply this BEFORE that build deploys.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: the body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on 2026-10-04
-- at 05:52Z, and again at 06:54Z after the proof below had run and rolled back (the file's own text hashes to it too;
-- the other eight ladder_a bodies, which this file leaves alone, equal theirs: proof step 7):
--   create_media            db4049b720413ce04a29afb553c2e83b  (20261004100000_ladder_a)
-- The live attributes it restates: plpgsql, volatile, security definer, search_path "", owner postgres, EXECUTE held by
-- postgres and service_role alone (no PUBLIC, anon or authenticated), one overload, no comment. Then the rolled-back
-- proof at the foot of this file, RED without this file's statements and GREEN with them; then apply verbatim; then
-- get_advisors (no delta expected: no grant, table or signature moves).

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
  v_period text := to_char(now(), 'YYYY-MM');
  v_uploaded bigint;
  v_cap bigint;
  v_allowance bigint;
  v_active bigint;
  v_deleted bigint;
  v_sealed_until timestamptz;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
  -- ★ THE CAMERA (20261002200000; its clip 20261004120000): its video's bounds and the ceiling's multiple, each
  -- mirroring its one home under a parity test (src/lib/media/limits.ts, src/lib/disposable/roll.ts). The roll's size is
  -- the event's. The video's two refusals below are formatted from these constants, so the check and its words are one
  -- literal (the grace is its own, so the mirror reads literally: seconds + grace).
  c_camera_video_bytes constant bigint := 384::bigint * 1024 * 1024; -- mirrors CAMERA_VIDEO_MAX_BYTES
  c_camera_video_seconds constant double precision := 30; -- mirrors CAMERA_VIDEO_SECONDS
  c_camera_video_grace constant double precision := 0.5; -- mirrors CAMERA_VIDEO_GRACE_SECONDS
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

  -- ★ THE CAMERA (20261002200000). A video is one shot of up to thirty seconds: its length is the client's word, so its
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
      raise exception using
        message = format('This video exceeds the %s MB a camera shot can be.', c_camera_video_bytes / (1024 * 1024)),
        errcode = 'check_violation';
    end if;
    if p_type = 'video' and p_duration_seconds > c_camera_video_seconds + c_camera_video_grace then
      raise exception using
        message = format('This video is longer than the %s seconds a camera shot can be.', c_camera_video_seconds),
        errcode = 'check_violation';
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

  -- ★ THE UPLOADS ALLOWANCE (20261004100000, Ladder A): her plan's own published number over its window, a calendar
  -- month or a pass's year (`upload_allowance`, `uploads_used`), never given back by a delete. NULL = unmetered (a paid
  -- profile with no cap on record fails open). "limit" is the word both wrappers route to cap_reached.
  v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes);
  if v_allowance is not null then
    v_uploaded := public.uploads_used(v_event.host_id, v_profile.tier);
    if v_uploaded + p_file_size_bytes > v_allowance then
      raise exception 'Upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;
  -- ★ A LAPSED PASS (the Advisor's Q26 F1): her last live pass has ended and the nightly recompute has not moved her to
  -- Free yet, so no live pass holds her allowance and the count below would land on no row. Refused in the allowance's
  -- words until the recompute moves her plan, never an upload counted nowhere for up to a day.
  if v_profile.tier = 'event_pass' and not exists (
    select 1 from public.event_passes q
     where q.profile_id = v_event.host_id and q.consumed_at is null
       and q.start_at <= now() and q.expires_at > now()) then
    raise exception 'Upload limit reached for this plan.' using errcode = 'check_violation';
  end if;

  -- ★ DELETED COUNTS (20261003220000, trash-in-storage): the cap and its 10% hold everything she keeps, her albums and
  -- her Deleted together (`host_storage_summary`, the one read every cap check makes). With her setting on and this
  -- file fitting beside what she keeps, the oldest of Deleted leaves for good first, as much as the file needs
  -- (`leave_deleted`: its bytes stop counting at once, and R2 follows in the night's purge); otherwise it is refused,
  -- and the refusal rolls back any eviction with it. Under the profiles lock above, so two completes never both free
  -- the same room.
  if v_cap is not null then
    select s.active_bytes, s.standby_bytes into v_active, v_deleted
      from public.host_storage_summary(v_event.host_id) s;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10)
       and v_profile.make_room_from_deleted
       and v_active + p_file_size_bytes <= v_cap + (v_cap / 10) then
      perform public.leave_deleted(v_event.host_id,
        v_active + v_deleted + p_file_size_bytes - (v_cap + (v_cap / 10)), true);
      select s.active_bytes, s.standby_bytes into v_active, v_deleted
        from public.host_storage_summary(v_event.host_id) s;
    end if;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10) then
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

  -- ★ A PASS'S YEAR (20261004100000): a pass holder's upload also counts on her live pass that ends soonest, the count
  -- `uploads_used` reads for her, so her allowance runs over the year she paid for, never the calendar's. A renewal's
  -- year opens on its own row at zero, and a pass that ends takes its count with it. Under the profiles lock above.
  if v_profile.tier = 'event_pass' then
    update public.event_passes p set uploaded_bytes = p.uploaded_bytes + p_file_size_bytes
     where p.id = (select q.id from public.event_passes q
                    where q.profile_id = v_event.host_id and q.consumed_at is null
                      and q.start_at <= now() and q.expires_at > now()
                    order by q.expires_at, q.id
                    limit 1);
  end if;

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

-- As they stand live (20261004100000_ladder_a.sql restated them): the service role's alone, the complete route's, on the
-- admin client. A guest never calls this; create_media_as_host is untouched.
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own account (an auth user, so
-- handle_new_user makes her profile, set to Pro so video is allowed), a camera album and an album of free uploads, and a
-- guest ticket on each that needs no address; every upload goes through the real create_media (and, for the host's own,
-- create_media_as_host). Each step traps its own failure into the temp `proof` table; the final select is the answer.
-- The RED run is the same call without this file's statements: it fails on what this file changes, never on a parse.
--
-- RESULT, 2026-10-04 against the live schema (the drift read clean before, and again after both runs):
--   RED   4 of 8 rows red, each on what it lacks: 1 every clip from 29 s to 31 s refused in the old words ("longer
--         than the 10 seconds"); 2 129 MB, 384 MB and 384 MB + 1 all refused "exceeds the 128 MB"; 3 nothing formatted
--         from a constant, no grace constant, 10.5 and 128 MB; 7 create_media at db4049b720413ce04a29afb553c2e83b,
--         ladder_a's own body. Steps 4 (the roll and the photos), 5 (a camera album's guest video alone) and 6 (holders
--         and shapes) hold what must not change, so they pass without this file's statements too.
--   GREEN 8 of 8 on this file: a 29 s, 30 s and 30.5 s clip land, 30.6 s and 31 s are refused "longer than the 30
--         seconds a camera shot can be."; 129 MB and 384 MB land, 384 MB + 1 byte is refused "exceeds the 384 MB a
--         camera shot can be."; a 400 MB photo lands and a roll of 2 refuses its third shot in the roll's words; a
--         free-upload guest's 90 s 500 MB video and the host's own 120 s 500 MB video land; both writers keep their
--         shape and their holders; the nine hashes are this file's and ladder_a's. Nothing persisted after (create_media
--         back at db4049b7, no fixture user, event or ticket, the ACL as it was).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- -- The fixtures' ids, and megabytes in bytes.
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.mb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024)::bigint $f$;
--
-- -- A guest's upload through the real create_media, on the ticket named: its kind, its bytes and (a video's) the length
-- -- the client says. 'recorded', or the refusal as the wrapper reads it: the sqlstate and the words.
-- create function pg_temp.put(p_ticket text, p_type text, p_bytes bigint, p_seconds double precision default null)
-- returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := (select g.event_id from public.guests g where g.session_token = p_ticket);
-- begin
--   perform public.create_media(p_session_token => p_ticket, p_media_id => mid, p_type => p_type::public.media_type,
--     p_original_key => 'events/' || e || '/' || p_type || '/' || mid || '/original.' || case when p_type = 'video' then 'mp4' else 'jpg' end,
--     p_file_size_bytes => p_bytes, p_duration_seconds => p_seconds);
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The host's own upload through create_media_as_host (exempt from the camera's lines).
-- create function pg_temp.put_host(p_event uuid, p_type text, p_bytes bigint, p_seconds double precision default null)
-- returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid();
-- begin
--   perform public.create_media_as_host(p_host_id => pg_temp.fx('host'), p_event_id => p_event, p_media_id => mid,
--     p_type => p_type::public.media_type,
--     p_original_key => 'events/' || p_event || '/' || p_type || '/' || mid || '/original.' || case when p_type = 'video' then 'mp4' else 'jpg' end,
--     p_file_size_bytes => p_bytes, p_duration_seconds => p_seconds);
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The fixtures: a fresh paid host (an auth user, so handle_new_user makes her profile; Pro on a 50 GB room, since a
-- -- video is a paid feature and her month's allowance is 100 GB), her camera album (the stamp gives it a roll of 24) and
-- -- an album of free uploads, each with guest tickets that need no address.
-- do $$
-- declare h uuid := gen_random_uuid(); cam uuid; up uuid; g1 uuid; g2 uuid; g3 uuid;
--   t1 text := 'camera-clip-' || replace(gen_random_uuid()::text, '-', '');
--   t2 text := 'camera-clip-' || replace(gen_random_uuid()::text, '-', '');
--   t3 text := 'camera-clip-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values (h, 'camera-clip-' || h || '@example.com', now());
--   insert into public.profiles (id, email, display_name) values (h, 'camera-clip-' || h || '@example.com', 'Cam Clip')
--     on conflict (id) do update set display_name = excluded.display_name;
--   update public.profiles set tier = 'pro', storage_cap_bytes = 50::bigint * 1024 * 1024 * 1024 where id = h;
--   insert into public.events (host_id, name, require_verified_email, capture) values (h, 'Camera clip: the camera', false, 'camera') returning id into cam;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Camera clip: free uploads', false) returning id into up;
--   insert into public.guests (event_id, session_token, display_name) values (cam, t1, 'Gus Guest') returning id into g1;
--   insert into public.guests (event_id, session_token, display_name) values (cam, t2, 'Gwen Guest') returning id into g2;
--   insert into public.guests (event_id, session_token, display_name) values (up, t3, 'Gil Guest') returning id into g3;
--   insert into fx values ('host', h, null), ('camera', cam, null), ('uploads', up, null), ('g1', g1, null), ('g2', g2, null),
--     ('g3', g3, null), ('t1', null, t1), ('t2', null, t2), ('t3', null, t3);
--   insert into proof (step, ok, detail) values ('0 fixtures',
--     (select roll_size = 24 and capture = 'camera' from public.events where id = cam),
--     format('host %s, camera album %s (roll %s), free-upload album %s', h, cam, (select roll_size from public.events where id = cam), up));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. The clip's length: a 29 s clip lands, and so do 30 s and 30.5 s (the grace); 30.6 s and 31 s are refused in the
-- -- words, the number named from the constant.
-- do $$
-- declare t text := (select txt from fx where k = 't1'); a text; b text; c text; d text; e text;
--   sentence constant text := '23514 This video is longer than the 30 seconds a camera shot can be.';
-- begin
--   a := pg_temp.put(t, 'video', pg_temp.mb(19), 29);
--   b := pg_temp.put(t, 'video', pg_temp.mb(19), 30);
--   c := pg_temp.put(t, 'video', pg_temp.mb(19), 30.5);
--   d := pg_temp.put(t, 'video', pg_temp.mb(19), 30.6);
--   e := pg_temp.put(t, 'video', pg_temp.mb(19), 31);
--   insert into proof (step, ok, detail) values ('1 the clip''s length',
--     a = 'recorded' and b = 'recorded' and c = 'recorded' and d = sentence and e = sentence,
--     format('29 s: %s; 30 s: %s; 30.5 s: %s; 30.6 s: %s; 31 s: %s', a, b, c, d, e));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the clip''s length', false, sqlerrm);
-- end $$;
--
-- -- 2. The clip's bytes: 129 MB (past the old bound) lands, 384 MB lands exactly, one byte past it is refused in the
-- -- words, the number named from the constant.
-- do $$
-- declare t text := (select txt from fx where k = 't1'); a text; b text; c text;
-- begin
--   a := pg_temp.put(t, 'video', pg_temp.mb(129), 20);
--   b := pg_temp.put(t, 'video', pg_temp.mb(384), 20);
--   c := pg_temp.put(t, 'video', pg_temp.mb(384) + 1, 20);
--   insert into proof (step, ok, detail) values ('2 the clip''s bytes',
--     a = 'recorded' and b = 'recorded' and c = '23514 This video exceeds the 384 MB a camera shot can be.',
--     format('129 MB: %s; 384 MB: %s; 384 MB + 1: %s', a, b, c));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 the clip''s bytes', false, sqlerrm);
-- end $$;
--
-- -- 3. One literal drives the check and its words: both refusals are formatted from the constants (no number in either
-- -- sentence), the grace is its own constant and the sum is written, and each refusal still carries the word the guest
-- -- wrapper routes by and none routed ahead of it ("verified email", "roll", "not accepting", "no longer exists",
-- -- "does not belong"; "exceeds" is read before "longer than").
-- do $$
-- declare t text := (select txt from fx where k = 't1'); src text; big text; long text; bad text := ''; w text;
-- begin
--   select p.prosrc into src from pg_proc p where p.oid = to_regprocedure(
--     'public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)');
--   if position('format(''This video exceeds the %s MB a camera shot can be.'', c_camera_video_bytes / (1024 * 1024))' in src) = 0 then
--     bad := bad || ' bytes sentence not formatted from the constant;';
--   end if;
--   if position('format(''This video is longer than the %s seconds a camera shot can be.'', c_camera_video_seconds)' in src) = 0 then
--     bad := bad || ' seconds sentence not formatted from the constant;';
--   end if;
--   if position('p_duration_seconds > c_camera_video_seconds + c_camera_video_grace' in src) = 0 then
--     bad := bad || ' the check is not seconds + grace;';
--   end if;
--   if position('c_camera_video_grace constant double precision := 0.5;' in src) = 0 then bad := bad || ' no grace constant;'; end if;
--   if position('c_camera_video_seconds constant double precision := 30;' in src) = 0 then bad := bad || ' seconds is not 30;'; end if;
--   if position('c_camera_video_bytes constant bigint := 384::bigint * 1024 * 1024;' in src) = 0 then bad := bad || ' bytes is not 384 MB;'; end if;
--   big := substr(pg_temp.put(t, 'video', pg_temp.mb(384) + 1, 20), 7);
--   long := substr(pg_temp.put(t, 'video', pg_temp.mb(19), 31), 7);
--   foreach w in array array['verified email', 'roll', 'not accepting', 'no longer exists', 'does not belong'] loop
--     if big like '%' || w || '%' then bad := bad || format(' bytes sentence says "%s";', w); end if;
--     if long like '%' || w || '%' then bad := bad || format(' seconds sentence says "%s";', w); end if;
--   end loop;
--   if big not like '%exceeds%' then bad := bad || ' bytes sentence lacks "exceeds";'; end if;
--   if long not like '%longer than%' or long like '%exceeds%' then bad := bad || ' seconds sentence is not "longer than" alone;'; end if;
--   insert into proof (step, ok, detail) values ('3 one literal, the check and its words', bad = '', coalesce(nullif(bad, ''), big || ' / ' || long));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 one literal, the check and its words', false, sqlerrm);
-- end $$;
--
-- -- 4. The camera's other lines are as they were: a photo (any size) is no clip, so the video's bound never reads it; the
-- -- roll still refuses the shot past it in its own words (a roll of 2, on a ticket of her own), and the retake line and its
-- -- multiple of three are still in the body, untouched.
-- do $$
-- declare t1 text := (select txt from fx where k = 't1'); t2 text := (select txt from fx where k = 't2'); src text;
--   p text; a text; b text; c text; bad text := '';
-- begin
--   p := pg_temp.put(t1, 'photo', pg_temp.mb(400));
--   update public.events set roll_size = 2 where id = pg_temp.fx('camera');
--   a := pg_temp.put(t2, 'photo', pg_temp.mb(1));
--   b := pg_temp.put(t2, 'photo', pg_temp.mb(1));
--   c := pg_temp.put(t2, 'video', pg_temp.mb(1), 5);
--   select p2.prosrc into src from pg_proc p2 where p2.oid = to_regprocedure(
--     'public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)');
--   if position('c_roll_retakes constant integer := 3;' in src) = 0 then bad := bad || ' c_roll_retakes is not 3;'; end if;
--   if position('v_taken >= v_event.roll_size * c_roll_retakes' in src) = 0 then bad := bad || ' the ceiling moved;'; end if;
--   if position('raise exception ''You''''ve taken all % shots on your roll.'', v_event.roll_size using errcode = ''check_violation'';' in src) = 0 then
--     bad := bad || ' the roll sentence moved;';
--   end if;
--   if position('raise exception ''You''''ve used every retake this roll allows.'' using errcode = ''check_violation'';' in src) = 0 then
--     bad := bad || ' the retake sentence moved;';
--   end if;
--   insert into proof (step, ok, detail) values ('4 the roll and the photos as they were',
--     p = 'recorded' and a = 'recorded' and b = 'recorded' and c = '23514 You''ve taken all 2 shots on your roll.' and bad = '',
--     format('a 400 MB photo: %s; roll of 2: %s, %s, then %s;%s', p, a, b, c, bad));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the roll and the photos as they were', false, sqlerrm);
-- end $$;
--
-- -- 5. The bound is a camera album's guest video alone: the same guest video in an album of free uploads (90 s, 500 MB)
-- -- lands, and the host's own upload into the camera album (120 s, 500 MB, through create_media_as_host) lands.
-- do $$
-- declare a text; b text;
-- begin
--   a := pg_temp.put((select txt from fx where k = 't3'), 'video', pg_temp.mb(500), 90);
--   b := pg_temp.put_host(pg_temp.fx('camera'), 'video', pg_temp.mb(500), 120);
--   insert into proof (step, ok, detail) values ('5 a camera album''s guest video alone',
--     a = 'recorded' and b = 'recorded', format('free-upload guest, 90 s and 500 MB: %s; the host''s own, 120 s and 500 MB: %s', a, b));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 a camera album''s guest video alone', false, sqlerrm);
-- end $$;
--
-- -- 6. The holders and shapes are exactly as they stood: create_media and create_media_as_host keep one overload each,
-- -- plpgsql, volatile, security definer, an empty search_path, the owner's and the service role's EXECUTE alone (no PUBLIC,
-- -- anon or authenticated, by ACL and by has_function_privilege), and the same owner.
-- do $$
-- declare r record; got text; acl text; bad text := ''; n int;
-- begin
--   for r in select * from (values
--       ('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'create_media'),
--       ('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'create_media_as_host')
--     ) v(fn, name)
--   loop
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end || ' ' || pg_get_userbyid(p.proowner)
--       into got
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if got is distinct from 'plpgsql v definer postgres' then bad := bad || format(' %s shape=%s;', r.name, got); end if;
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' ' order by a.grantee::regrole::text || ':' || a.privilege_type) into acl
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     if acl is distinct from 'postgres:EXECUTE service_role:EXECUTE' then bad := bad || format(' %s acl=%s;', r.name, acl); end if;
--     if has_function_privilege('anon', to_regprocedure(r.fn), 'EXECUTE') or has_function_privilege('authenticated', to_regprocedure(r.fn), 'EXECUTE') then
--       bad := bad || format(' %s executable by a client role;', r.name);
--     end if;
--     select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = r.name;
--     if n <> 1 then bad := bad || format(' %s has %s overloads;', r.name, n); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('6 holders and shapes', bad = '', coalesce(nullif(bad, ''), 'both writers as they stood: plpgsql v definer, search_path "", postgres and service_role alone'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 holders and shapes', false, sqlerrm);
-- end $$;
--
-- -- 7. The bodies: create_media is this file's own and the eight others ladder_a's (each prosrc, whitespace collapsed,
-- -- hashed as the file's own text does): nothing else moved.
-- do $$
-- declare r record; got text; bad text := '';
-- begin
--   for r in select * from (values
--       ('create_media', 'fab801fcc4ec47e30cd106fb4182ea52'),
--       ('create_media_as_host', '60112e2b73dd40b4d97e1504734453b5'),
--       ('meter_upload', '00a25a0325274c2263ff6629e02b9af5'),
--       ('get_upload_context', 'efacd3e71988c0b75287e2a7458120e2'),
--       ('get_upload_gate', '940a580ebb39e76c6c9fcdf98ca7178e'),
--       ('get_host_upload_context', '9595099976250f04f29f456b5a4b3a5f'),
--       ('tier_limits', '134a9d0010f5bfa8cec1a782b8243170'),
--       ('upload_allowance', '55c7fef03305f30623cf283499be220d'),
--       ('uploads_used', 'a5c98a2f6218f34dac6c474fb920f358')
--     ) v(fn, want)
--   loop
--     select md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) into got
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = r.fn;
--     if got is distinct from r.want then bad := bad || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('7 bodies', bad = '', coalesce(nullif(bad, ''), '9 hashes: create_media this file''s, the other eight ladder_a''s'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
