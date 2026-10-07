-- =============================================================================================
-- RE-SHOOTS, A FLAT 3 (lane `camera-wiring`; guest-moments r1's `limit=three` and `where=reel`, Will's word since
-- customize r1: "a flat 3 re-shoots at any roll size"). A guest's ceiling was three rolls' worth a period (72 shots on a
-- roll of 24), said only in Settings and met unsaid; it is the roll plus 3, so a roll of 24 takes at most 27 shots in
-- all, and her camera counts the 3 where she takes one back. Three bodies, each CREATE OR REPLACE under its own
-- signature, verbatim from its newest definition but for the lines named:
--
--   1. `create_media` (20261005200000_capture_time): `c_roll_reshoots` (mirrors ROLL_RESHOOTS,
--      src/lib/disposable/roll.ts) for `c_roll_retakes`, the ceiling `v_taken >= v_event.roll_size + c_roll_reshoots`
--      for `roll_size * c_roll_retakes`, and its refusal in the camera's own word, formatted from the constant: "You've
--      used all 3 re-shoots on your roll." (it said "You've used every retake this roll allows."). "roll" stays in it:
--      both builds' `mapCheckViolation` routes by that word.
--   2. `get_upload_context` (20261005181000_billing_integrity): the advisory ceiling the same, the roll plus 3.
--   3. `get_upload_gate` (20261005181000_billing_integrity): the ceiling the same, and the roll answers `period`, the
--      period it counts in (events.sealed_from in epoch ms): a key the camera compares and never a count, so a guest
--      whose roll started again (a develop time added mid-party, the camera started again) is told so once, on her
--      device (src/lib/guest/camera/fresh-roll.ts; `/api/guests/mine` hands the gate's roll through). The presign's
--      read needs no period and carries none.
-- Then the schema's own words for the ceiling: the comments on `events.capture` and on `camera_rolls`.
--
-- ★ WHAT THE OLDER BUILDS MEET (partyreel.com runs milestone 38 against this database, the alias bbfcc544): an expand.
-- No name, argument, key or grant they call moves, and `period` is a key no build before this lane's reads.
--   - Their camera counts the server's ceiling wherever the server has answered (`roll-view.ts`'s `server.ceiling`): it
--     stops at 27 on a roll of 24 and ends there in its own words ("You've used every retake this roll allows."),
--     assuming 72 only before its first read lands. A period already past its new ceiling stops at once (test data
--     only: PROGRAM.md, "Before launch there are no real users").
--   - Their Settings line says "up to 72 shots in all" (its client's own multiple) until this lane's build ships: the
--     one thing they say that the server no longer holds.
--   - Their presign refuses first, at the server's 27, in its own old sentence; a complete that races past it meets the
--     new one, which their `mapCheckViolation` routes by "roll" to `roll_spent` and says in its taxonomy's words
--     ("You've taken every shot on your roll."), since their `rollRefusalSentence` knows only the old.
--
-- APPLY ORDER: either way is safe, as no signature moves. This lane's build before the apply counts the server's old
-- ceiling as it stands (48 re-shoots on a roll of 24, said as such) and shows no fresh-roll panel (no `period` yet).
--
-- LOCKS AT APPLY: three CREATE OR REPLACE and two COMMENTs, catalog rows only: no table is locked.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: every body this file restates, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as each did on 2026-10-07:
--   create_media            3b6fed8cac1368e7e0472acc3cbb2492  (20261005200000_capture_time)
--   get_upload_context      3c4c792d30b37e61995206e5295d4e97  (20261005181000_billing_integrity)
--   get_upload_gate         4182fc78adb24e1b2400eca7dcb29b42  (20261005181000_billing_integrity)
-- Then the rolled-back proof at the foot of this file, RED without this file's statements and GREEN with them; then
-- apply verbatim; then get_advisors (EXPECTED DELTA: none, 27/4/36: no function added, every grant restated as it
-- stands); then regenerate src/lib/db/types.ts (EXPECTED: no change, the three keep their arguments and return jsonb).
-- Applied, the three bodies hash as:
--   create_media            efa26b84854061dd8124f9075ebf332c
--   get_upload_context      31e4d2a0eb1f9eadc9539ff02f0ef201
--   get_upload_gate         619931ad80208afcc6a29747cb86ca72
-- =============================================================================================

-- =============================================================================================
-- 1. The writer: the roll plus its 3 re-shoots, refused in the camera's own word.
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
  p_phone_bytes bigint default null,
  p_captured_at timestamptz default null
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
  v_cap bigint;
  v_active bigint;
  v_deleted bigint;
  v_sealed_until timestamptz;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
  -- ★ THE CAMERA (20261002200000; its clip 20261004120000; its re-shoots 20261007021000): its video's bounds and the
  -- re-shoots past the roll, each mirroring its one home under a parity test (src/lib/media/limits.ts,
  -- src/lib/disposable/roll.ts). The roll's size is the event's. The video's two refusals and the ceiling's below are
  -- formatted from these constants, so each check and its words are one literal (the grace is its own, so the mirror
  -- reads literally: seconds + grace).
  c_camera_video_bytes constant bigint := 384::bigint * 1024 * 1024; -- mirrors CAMERA_VIDEO_MAX_BYTES
  c_camera_video_seconds constant double precision := 30; -- mirrors CAMERA_VIDEO_SECONDS
  c_camera_video_grace constant double precision := 0.5; -- mirrors CAMERA_VIDEO_GRACE_SECONDS
  c_roll_reshoots constant integer := 3; -- mirrors ROLL_RESHOOTS
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
  -- her LIVE shots this period against its size, and every shot she has taken in it, removed or not, against the roll
  -- and its 3 re-shoots (the churn a freed frame opens: a flat 3 at any size, 20261007021000). Counted AFTER the host's
  -- profiles lock above (every create_media of this album takes it first, so two completes of one guest are already
  -- serialized and each count reads the other's committed row, never both at 23) and under the roll's own advisory
  -- lock on her identity (the brief's, kept so the roll's serialization stays its own should the profiles lock ever
  -- move; taken after it, by nothing else, so it closes no cycle). Their own words (mapCheckViolation reads "roll"). The
  -- host's own uploads (create_media_as_host) are exempt from all four.
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
    if v_taken >= v_event.roll_size + c_roll_reshoots then
      raise exception 'You''ve used all % re-shoots on your roll.', c_roll_reshoots using errcode = 'check_violation';
    end if;
  end if;

  -- ★ MAY THIS ACCOUNT STILL ADD (20261005181000): one question with one home (`uploads_refused`), which the
  -- presign's meter and the three upload advisories ask too, so the door, the presign and this complete agree. Her
  -- plan's own published number over its window, a calendar month or a pass's year (`upload_allowance`,
  -- `uploads_used`), never given back by a delete (NULL = unmetered: a paid profile with no cap on record fails open),
  -- and a pass the nightly recompute has not caught up with (`pass_lapsed`, the Advisor's Q26 F1: her profile still a
  -- pass's and no window of hers live, so the count below would land on no row). "limit" is the word both wrappers
  -- route to cap_reached.
  if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then
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
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes,
    captured_at
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes,
    p_captured_at
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

revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz) to service_role;

-- =============================================================================================
-- 2. The two advisories: the same ceiling, and the gate's period.
-- =============================================================================================

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
  v_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_roll_reshoots constant integer := 3; -- mirrors ROLL_RESHOOTS (src/lib/disposable/roll.ts)
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

  -- ★ THE DOOR (20260929120000), AS THIS TICKET SEES IT: waiting reads private; past a gate or the
  -- password reads open; Only me (private, no gate) stays private. Only this local copy moves.
  if v_guest.admission = 'waiting' then
    v_event.visibility := 'private';
  elsif v_event.gate is not null or v_event.visibility = 'password' then
    v_event.visibility := 'open';
  end if;

  -- ★ THE SNEAKY BLOCK (20260928120000): a ticket this event blocked (its row, the account holding it,
  -- or the address it proved) reads the event as PRIVATE, so presign and complete refuse it exactly as
  -- they refuse a private album, in the same words ("This event is private."). Only the local copy is
  -- masked, never the row. Asked after the door, so it wins over every door.
  if public.event_block_holds_row(v_guest) then
    v_event.visibility := 'private';
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- ★ Past the uploads line? The completes' own question (`uploads_refused`, 20261005181000), asked of the smallest
  -- file, one byte: her plan's own number over its window (NULL = unmetered), or a pass the nightly recompute has not
  -- caught up with, which read as room here while the presign refused it. `at_monthly_cap` keeps the wire's name,
  -- which the routes read, whatever the window.
  v_at_monthly_cap := coalesce(
    public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- The line an upload meets (`host_room_used`, 20261003220000): what she keeps, Deleted left out while her setting
    -- lets an upload make room from it. Mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video, nor one whose host switched videos off (authoritative
  -- gate is in create_media). The per-upload ceiling is the host cap clamped to the universal 10 GiB
  -- (never remaining bytes). QA #18: `visibility` lets the guest routes re-check the lock per request.
  -- The identity reshape: `require_verified_email` + `guest_verified` let them re-check the identity
  -- gate the same way (create_media stays authoritative for both).
  -- ★ THE CAMERA (20261002200000): `capture`, and this ticket's own `roll` ({used, cap, taken, ceiling}; NULL for free
  -- uploads), so the presign refuses the shot past either bound before its bytes move (create_media stays
  -- authoritative). Her own counts, to her own token.
  if v_event.capture = 'camera' then
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
  end if;
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'require_verified_email', v_event.require_verified_email,
    'guest_verified', (v_guest.verified_at is not null),
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and (v_profile.tier = 'free' or not v_event.allow_videos)),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes)),
    'capture', v_event.capture,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size + c_roll_reshoots) end
  );
end;
$$;

revoke all on function public.get_upload_context(text, public.media_type) from public, anon, authenticated;
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

create or replace function public.get_upload_gate(
  p_event_id uuid,
  p_session_token text default null,
  p_user_id uuid default null
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
  v_cap bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_ticket uuid;
  v_live integer;
  v_taken integer;
  c_roll_reshoots constant integer := 3; -- mirrors ROLL_RESHOOTS (src/lib/disposable/roll.ts)
begin
  select * into v_event from public.events where id = p_event_id and deleted_at is null;
  if not found then
    return jsonb_build_object('contributed', false, 'album_full', false, 'event_gone', true);
  end if;

  select exists (
    select 1
      from public.media m
      join public.guests g on g.id = m.guest_id
     where g.event_id = p_event_id
       and m.event_id = p_event_id
       and (
         (p_session_token is not null and length(p_session_token) >= 16
            and g.session_token = p_session_token and g.user_id is null)
         or (p_user_id is not null and g.user_id = p_user_id)
       )
       -- ★ OWN DELETES CLOSE IT (Will, 2026-09-22), the one change to this body. Pending, approved,
       -- hidden and a removal by anyone else all still count; only the guest's own removal does not.
       and not (m.status = 'removed' and m.removed_by_uploader)
  ) into v_contributed;

  if not v_contributed and v_event.accepting_uploads then
    select * into v_profile from public.profiles where id = v_event.host_id;
    select * into v_limits from public.tier_limits(v_profile.tier);

    -- ★ The uploads line, so the gate holds a guest exactly where the presign refuses: the completes' own question
    -- (`uploads_refused`, 20261005181000) asked of the smallest file, one byte, a lapsed pass included.
    v_at_monthly_cap := coalesce(
      public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      -- The line an upload meets (`host_room_used`, 20261003220000), so the gate fails open exactly when an upload
      -- would be refused: a guest is never held at a step she cannot pass.
      v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  -- ★ THE CAMERA (20261002200000): the viewer's roll, {used, cap, taken, ceiling}, by the same identities the
  -- contribution reads (the unclaimed ticket's row, the account's rows here). NULL for free uploads. ★ AND THE PERIOD
  -- IT COUNTS IN (20261007021000): `period`, events.sealed_from in epoch ms, a key the camera compares and never a
  -- count, so a guest whose roll started again (a develop time added mid-party, the camera started again) is told so
  -- once (src/lib/guest/camera/fresh-roll.ts). The album's own instant, no person's: the gate's read alone carries it.
  if v_event.capture = 'camera' then
    if p_session_token is not null and length(p_session_token) >= 16 then
      select g.id into v_ticket
        from public.guests g
       where g.event_id = p_event_id and g.session_token = p_session_token and g.user_id is null;
    end if;
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_ticket, p_user_id) r;
  end if;

  return jsonb_build_object(
    'contributed', v_contributed,
    'album_full', (v_at_storage_cap or v_at_monthly_cap),
    'event_gone', false,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size + c_roll_reshoots,
      'period', (extract(epoch from v_event.sealed_from) * 1000)::bigint) end
  );
end;
$$;

revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;

-- =============================================================================================
-- 3. What the schema says about it.
-- =============================================================================================
comment on column public.events.capture is
  'How guests add: upload (free uploads) or camera (the album''s camera: a guest holds at most roll_size live shots in the current period, and takes at most roll_size + 3 in it, her 3 re-shoots, counted by create_media). Host-written; events_reveal_stamp fills in the camera''s roll and stamps sealed_from with it.';

comment on table public.camera_rolls is
  'The camera''s ledger: every shot a guest''s ticket has taken in a period (events.sealed_from), kept when the shot is removed or purged, so create_media''s ceiling (roll_size + 3 a period: her 3 re-shoots) outlives the fast purge of a withdrawn shot. Written by create_media alone. Service role SELECT only (RLS on, no policy).';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own host (an auth user, so
-- handle_new_user makes her profile; Pro), an album whose camera holds a roll of 2 and whose door asks no address, and a
-- guest ticket on it, and shoots through the real writers: `create_media` (named the older build's way too) and her own
-- withdrawal, `remove_my_upload_by_session` (the camera's Take it back). Then the two advisories, the ceiling at film's
-- 24, the period a develop time moves, the signatures and grants, the bodies' hashes and the schema's words. Each step
-- traps its own failure into the temp `proof` table; the final select is the answer. The RED run is the same call
-- without this file's statements.
--
-- RESULT, 2026-10-07 against the live schema (the drift read above clean first: the three bodies at their hashes):
--   RED  2/7: 0 and 5 hold before as after (the fixtures; the signatures and grants this file restates as they stand);
--        1 "a sixth shot landed past the ceiling" (three rolls' worth of a roll of 2 is 6); 2 the advisories answer a
--        ceiling of 6 and no period; 3 "ceilings 72 and 72"; 4 no period to move; 6 the three bodies at their old
--        hashes and the old comments.
--   GREEN 7/7 on this file (its statements verbatim, top-level comments aside), and nothing persisted after (no fixture
--        user or album; the three bodies at their old hashes; the ledger's comment the old one).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text, num bigint);
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
--
-- -- 0. Fixtures: a host on Pro (an auth user, so handle_new_user makes her profile), her album with the camera on a roll
-- --    of 2, every shot straight in (a door that asks no address), and a guest ticket on it.
-- do $$
-- declare h uuid := gen_random_uuid(); a uuid; t text := 'reshoots-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into auth.users (id, aud, role, email, email_confirmed_at)
--   values (h, 'authenticated', 'authenticated', 'reshoots-' || h || '@example.com', now());
--   update public.profiles set display_name = 'Res', tier = 'pro', storage_cap_bytes = 50::bigint * 1024 * 1024 * 1024
--    where id = h;
--   insert into public.events (host_id, name, require_verified_email, capture, roll_size)
--   values (h, 'Re-shoots: the album', false, 'camera', 2)
--   returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest');
--   insert into fx (k, id, txt) values ('host', h, null), ('album', a, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, null);
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 1. The roll and its 3 re-shoots, through the real writers: two shots named the older build's way (twelve names), the
-- --    third refused in the roll's words; three take-backs (her own withdrawal, the camera's Take it back), each shot
-- --    again; a fourth take-back frees no shot: five taken on a roll of 2 is the ceiling, refused in the re-shoots' words.
-- do $$
-- declare e uuid := pg_temp.fx('album'); t text := (select txt from fx where k = 'ticket');
--   m uuid; shots uuid[] := '{}'; fail text := ''; i int; ok text;
-- begin
--   for i in 1..2 loop
--     m := gen_random_uuid();
--     perform public.create_media(p_session_token => t, p_media_id => m, p_type => 'photo',
--       p_original_key => 'events/' || e || '/photo/' || m || '/original.jpg', p_file_size_bytes => 4096,
--       p_preview_key => null, p_duration_seconds => null, p_width => 640, p_height => 480, p_reel_eligible => true,
--       p_phone_key => null, p_phone_bytes => null);
--     shots := shots || m;
--   end loop;
--   begin
--     m := gen_random_uuid();
--     perform public.create_media(p_session_token => t, p_media_id => m, p_type => 'photo',
--       p_original_key => 'events/' || e || '/photo/' || m || '/original.jpg', p_file_size_bytes => 4096);
--     fail := fail || ' a third shot landed on a roll of 2';
--   exception when check_violation then
--     if sqlerrm <> 'You''ve taken all 2 shots on your roll.' then fail := fail || ' the roll: ' || sqlerrm; end if;
--   end;
--   for i in 1..3 loop
--     ok := public.remove_my_upload_by_session(t, shots[array_length(shots, 1)]) ->> 'ok';
--     if ok is distinct from 'true' then fail := fail || format(' take-back %s: %s', i, ok); end if;
--     begin
--       m := gen_random_uuid();
--       perform public.create_media(p_session_token => t, p_media_id => m, p_type => 'photo',
--         p_original_key => 'events/' || e || '/photo/' || m || '/original.jpg', p_file_size_bytes => 4096);
--       shots := shots || m;
--     exception when check_violation then
--       fail := fail || format(' re-shoot %s refused: %s', i, sqlerrm);
--     end;
--   end loop;
--   perform public.remove_my_upload_by_session(t, shots[array_length(shots, 1)]);
--   begin
--     m := gen_random_uuid();
--     perform public.create_media(p_session_token => t, p_media_id => m, p_type => 'photo',
--       p_original_key => 'events/' || e || '/photo/' || m || '/original.jpg', p_file_size_bytes => 4096);
--     fail := fail || ' a sixth shot landed past the ceiling';
--   exception when check_violation then
--     if sqlerrm <> 'You''ve used all 3 re-shoots on your roll.' then fail := fail || ' the ceiling: ' || sqlerrm; end if;
--   end;
--   insert into proof (step, ok, detail) values ('1 the roll and its 3 re-shoots', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the roll and its 3 re-shoots', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 2. The two advisories say what the writer holds: 1 live of 2, 5 taken of 5; the gate also names the period it counts
-- --    in, the album's sealed_from in epoch ms, and answers a viewer with no ticket the same ceiling and period.
-- do $$
-- declare e uuid := pg_temp.fx('album'); t text := (select txt from fx where k = 'ticket'); c jsonb; g jsonb; g0 jsonb;
--   v_from bigint; fail text := '';
-- begin
--   select (extract(epoch from sealed_from) * 1000)::bigint into v_from from public.events where id = e;
--   c := public.get_upload_context(t, 'photo') -> 'roll';
--   g := public.get_upload_gate(e, t, null) -> 'roll';
--   g0 := public.get_upload_gate(e, null, null) -> 'roll';
--   if c is distinct from '{"used": 1, "cap": 2, "taken": 5, "ceiling": 5}'::jsonb then
--     fail := fail || ' context ' || coalesce(c::text, 'null');
--   end if;
--   if c ? 'period' then fail := fail || ' the presign carries a period'; end if;
--   if g is distinct from jsonb_build_object('used', 1, 'cap', 2, 'taken', 5, 'ceiling', 5, 'period', v_from) then
--     fail := fail || ' gate ' || coalesce(g::text, 'null');
--   end if;
--   if g0 is distinct from jsonb_build_object('used', 0, 'cap', 2, 'taken', 0, 'ceiling', 5, 'period', v_from) then
--     fail := fail || ' gate, no ticket ' || coalesce(g0::text, 'null');
--   end if;
--   if jsonb_typeof(g -> 'period') is distinct from 'number' then fail := fail || ' the period is no number'; end if;
--   insert into proof (step, ok, detail) values ('2 the advisories and the period', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 the advisories and the period', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 3. At film's 24 the ceiling reads 27 in both (never 72), and a roll's new size starts no period.
-- do $$
-- declare e uuid := pg_temp.fx('album'); t text := (select txt from fx where k = 'ticket'); before bigint;
--   c jsonb; g jsonb; fail text := '';
-- begin
--   before := (public.get_upload_gate(e, t, null) -> 'roll' ->> 'period')::bigint;
--   update public.events set roll_size = 24 where id = e;
--   c := public.get_upload_context(t, 'photo') -> 'roll';
--   g := public.get_upload_gate(e, t, null) -> 'roll';
--   if (c ->> 'ceiling')::int is distinct from 27 or (g ->> 'ceiling')::int is distinct from 27 then
--     fail := fail || format(' ceilings %s and %s', c ->> 'ceiling', g ->> 'ceiling');
--   end if;
--   if (c ->> 'cap')::int is distinct from 24 then fail := fail || ' cap ' || (c ->> 'cap'); end if;
--   if (g ->> 'period')::bigint is distinct from before then fail := fail || ' the size moved the period'; end if;
--   insert into proof (step, ok, detail) values ('3 film''s 24 is 27 in all', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 film''s 24 is 27 in all', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 4. A develop time added mid-party starts a new period, and the gate's period follows it. One transaction's now() is
-- --    one instant, so the running period is first set an hour back (sealed_from alone fires no stamp), as a party's is.
-- do $$
-- declare e uuid := pg_temp.fx('album'); t text := (select txt from fx where k = 'ticket'); earlier bigint; later bigint;
--   v_from bigint; fail text := '';
-- begin
--   update public.events set sealed_from = now() - interval '1 hour' where id = e;
--   earlier := (public.get_upload_gate(e, t, null) -> 'roll' ->> 'period')::bigint;
--   update public.events set develops_at = now() + interval '1 day' where id = e;
--   select (extract(epoch from sealed_from) * 1000)::bigint into v_from from public.events where id = e;
--   later := (public.get_upload_gate(e, t, null) -> 'roll' ->> 'period')::bigint;
--   if earlier is null or earlier is distinct from (extract(epoch from now() - interval '1 hour') * 1000)::bigint then
--     fail := fail || ' the running period ' || coalesce(earlier::text, 'none');
--   end if;
--   if later is null or later is not distinct from earlier then fail := fail || ' the period stood'; end if;
--   if later is distinct from v_from then fail := fail || ' the period is not the album''s'; end if;
--   insert into proof (step, ok, detail) values ('4 a develop time moves the period', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 a develop time moves the period', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 5. The three keep their signatures, their classes and their grants: the writer and the gate the service role's
-- --    alone, the presign's read anon's and authenticated's too (database-security.md's 0028 set); none PUBLIC's.
-- do $$
-- declare fail text := ''; f text; r record;
-- begin
--   for r in
--     select * from (values
--       ('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz)', false),
--       ('public.get_upload_context(text, public.media_type)', true),
--       ('public.get_upload_gate(uuid, text, uuid)', false)
--     ) as v(f, clients)
--   loop
--     f := r.f;
--     if to_regprocedure(f) is null then fail := fail || ' missing ' || f; continue; end if;
--     if not has_function_privilege('service_role', f, 'execute') then fail := fail || ' service ' || f; end if;
--     if has_function_privilege('anon', f, 'execute') is distinct from r.clients
--        or has_function_privilege('authenticated', f, 'execute') is distinct from r.clients then
--       fail := fail || ' client roles ' || f;
--     end if;
--     if exists (select 1 from pg_proc p, aclexplode(p.proacl) a
--                 where p.oid = to_regprocedure(f)::oid and a.grantee = 0) then
--       fail := fail || ' PUBLIC holds ' || f;
--     end if;
--     if not exists (select 1 from pg_proc p where p.oid = to_regprocedure(f)::oid and p.prosecdef
--                     and p.proconfig @> array['search_path=""']) then
--       fail := fail || ' not a pinned definer ' || f;
--     end if;
--   end loop;
--   if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('create_media', 'get_upload_context', 'get_upload_gate')) <> 3 then
--     fail := fail || ' an overload';
--   end if;
--   insert into proof (step, ok, detail) values ('5 signatures, classes and grants', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 signatures, classes and grants', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 6. The bodies at this file's hashes, and the schema's words for the ceiling.
-- do $$
-- declare fail text := ''; r record; expected text;
-- begin
--   for r in
--     select p.proname, md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) as h
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('create_media', 'get_upload_context', 'get_upload_gate')
--   loop
--     expected := case r.proname
--                   when 'create_media' then 'efa26b84854061dd8124f9075ebf332c'
--                   when 'get_upload_context' then '31e4d2a0eb1f9eadc9539ff02f0ef201'
--                   when 'get_upload_gate' then '619931ad80208afcc6a29747cb86ca72' end;
--     if r.h is distinct from expected then fail := fail || format(' %s at %s', r.proname, r.h); end if;
--   end loop;
--   if coalesce(col_description('public.events'::regclass,
--        (select attnum from pg_attribute where attrelid = 'public.events'::regclass and attname = 'capture')), '')
--      not like '%roll_size + 3 in it, her 3 re-shoots%' then
--     fail := fail || ' the capture''s comment';
--   end if;
--   if coalesce(obj_description('public.camera_rolls'::regclass, 'pg_class'), '') not like '%roll_size + 3 a period%' then
--     fail := fail || ' the ledger''s comment';
--   end if;
--   insert into proof (step, ok, detail) values ('6 the bodies and the schema''s words', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 the bodies and the schema''s words', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
