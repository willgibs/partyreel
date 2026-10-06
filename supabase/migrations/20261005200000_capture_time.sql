-- =============================================================================================
-- THE CAPTURE TIME (lane `capture-time`; Will's word on the calls lab's X7, 2026-10-05: "Yes, keep the capture time,
-- never the place or device"). A photograph's original says when it was taken; the uploader's browser reads it before
-- the strip, and the complete carries it as a claim the server holds to its bounds (src/lib/media/capture-time.ts: no
-- earlier than 1990-01-01, no later than the server's now plus a day; outside them, or malformed, it is none and the
-- arrival stands). Three parts:
--
--   1. `media.captured_at` (timestamptz, NULL for none), finite by CHECK, written once by create_media*. The host's
--      column-scoped SELECT grows by it (her album's manifest reads it on her RLS client: `MEDIA_HOST_COLUMNS` names it
--      in the same change, under its parity test); no client role writes it.
--   2. `create_media` and `create_media_as_host`: DROP and CREATE (an argument list cannot change in place), each body
--      verbatim from 20261005181000_billing_integrity but for one defaulted argument LAST, `p_captured_at timestamptz
--      default null`, and the column at the insert's end. Their grants restated exactly (a DROP re-inherits PUBLIC's
--      EXECUTE): the service role's alone. ★ THE UPLOAD'S HOT PATH GAINS NO CALL: the time rides the complete's own
--      write, so a guest's burst costs what it did.
--   3. `album_changes_since` (verbatim from 20261002200000_disposable_foundation) carries each change's capture time in
--      microseconds as its twelfth element, and `cloud_export_lease` (verbatim from 20261005120000_cloud_export) each
--      item's as `captured_at`, so a delta and a Drive lease name it with no further read: CREATE OR REPLACE, the same
--      signatures, their ACLs kept and restated as they stand live, the change log's comment saying its new shape.
--
-- ★ WHAT THE OLDER BUILD MEETS (partyreel.com runs milestone 37 against this database): an expand. Its completes send
-- the argument names they always did, which PostgREST resolves by NAME to the new functions, `p_captured_at` taking its
-- default: its uploads land as they do today, with no capture time. Its delta parser reads a change's first eleven
-- elements and never a twelfth; its album reads name only columns this file leaves alone; a lease item's new key is one
-- no build before this lane's reads. Nothing it calls loses a name, an answer's key or a refusal's words.
--
-- ★ APPLY BEFORE PUSH (database-security.md): this lane's build selects `captured_at` in both album manifests (a 42703
-- on every album read without the column) and names `p_captured_at` for an upload that kept a capture time (a PGRST202
-- without it). The reverse order is safe: no build before it names either.
--
-- LOCKS AT APPLY: the ADD COLUMN is catalog-only (nullable, no default) and the CHECK's validation reads media once
-- (every row NULL, so it passes), both under ACCESS EXCLUSIVE on a table of a few thousand rows: a moment. The two DROP
-- and CREATE pairs and the two replaces take no table lock.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: every body this file restates, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as each did on 2026-10-05:
--   create_media            c2b705ff11359cea24c5a0bbc92e7ceb  (20261005181000_billing_integrity)
--   create_media_as_host    e0d6dfea22d2a22516a3bcd9ed9346af  (20261005181000_billing_integrity)
--   album_changes_since     1f1d25a69a9e0c81f0b24a3a3605b401  (20261002200000_disposable_foundation)
--   cloud_export_lease      67e4a9aa4d0f370be29d347baf8581d8  (20261005120000_cloud_export)
-- and `media.captured_at` absent. Then the rolled-back proof at the foot of this file, RED without this file's
-- statements and GREEN with them; then apply verbatim; then get_advisors (EXPECTED DELTA: none, 26/4/36: no function
-- added, every grant restated as it stands, and a column grant moves no lint); then regenerate src/lib/db/types.ts
-- (`media.captured_at`, `p_captured_at` on both writers), which drops the lane's two typed seams (`createMedia` in
-- src/lib/db/mutations/guest.ts and `createMediaAsHost` in host-media.ts: their arguments fold back into the calls).
-- Applied, the four bodies hash as:
--   create_media            3b6fed8cac1368e7e0472acc3cbb2492
--   create_media_as_host    a2cac72021af2d039cf94aa4be52a201
--   album_changes_since     431ce33dac81cef84433ca4b19f02807
--   cloud_export_lease      c92cf0439d5b687adb6ca61da496c0aa
-- =============================================================================================

-- =============================================================================================
-- 1. The column, what a row may hold in it, and the host's read of it.
-- =============================================================================================
alter table public.media
  add column captured_at timestamptz;

-- A `timestamptz` admits 'infinity', which passes any comparison and is no instant (database-security.md, Gotchas);
-- how old or how far ahead a capture time may be is the app's (`src/lib/media/capture-time.ts`), never the column's.
alter table public.media
  add constraint media_captured_at_finite check (isfinite(captured_at));

comment on column public.media.captured_at is
  'When the original says it was taken (Will''s X7: keep the capture time, never the place or device): read in the uploader''s browser before the strip (Exif DateTimeOriginal with its zone, QuickTime''s creation date, the movie header''s, a WebM''s DateUTC), held on the server to [1990-01-01, now + 1 day] (src/lib/media/capture-time.ts), else NULL and the arrival (created_at) stands. Written once, by create_media*. The host reads it (her album''s manifest); no client writes it.';

-- The host's album manifest reads it on her own RLS client (`album-host.ts`): an additive column grant, never a
-- table-level revoke (that would cascade every other column away). `MEDIA_HOST_COLUMNS` names it in the same change.
grant select (captured_at) on public.media to authenticated;

-- =============================================================================================
-- 2. The writers: the capture time in the same insert, its argument defaulted LAST.
-- =============================================================================================
drop function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint);

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

drop function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint);

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
  p_phone_bytes bigint default null,
  p_captured_at timestamptz default null
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
  v_cap bigint;
  v_active bigint;
  v_deleted bigint;
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

  -- ★ THE SEAL (20261002200000): the host's own upload waits with everyone's for the album's develop time, so the
  -- album develops whole. Exempt from the roll, its ceiling and the camera video's bounds: it is her album.
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut the host saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes,
    captured_at
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes,
    p_captured_at
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

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz) to service_role;

-- =============================================================================================
-- 3. The readers: the album's change log and the Drive lease carry it, one field each, so a delta and a lease ask
--    nothing more (the manifests read the column itself).
-- =============================================================================================
create or replace function public.album_changes_since(
  p_event_id uuid,
  p_scope text,
  p_after bigint,
  p_limit integer default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'version', coalesce(s.version, 0),
    'album_max', coalesce(s.album_max, 0),
    'attr_version', coalesce(s.attr_version, 0),
    'watermark', case p_scope
      when 'host' then coalesce(s.host_watermark, 0)
      when 'album' then coalesce(s.album_watermark, 0)
      else 0
    end,
    'approved', case
      when p_scope = 'host' then (
        select count(*) from public.media m
         where m.event_id = p_event_id and m.status = 'approved')
      when p_scope = 'album' then (
        select count(*) from public.media m
          join public.events e on e.id = m.event_id
         where m.event_id = p_event_id and m.status = 'approved'
           and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid())))
    end,
    'hidden', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'hidden') end,
    'pending', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'pending') end,
    'waiting', case when p_scope = 'album' then (
      select jsonb_build_object(
               'count', coalesce(sum(x.n), 0)::bigint,
               'minutes', coalesce(jsonb_agg(jsonb_build_array(x.at, x.n) order by x.at), '[]'::jsonb))
        from (
          select (extract(epoch from date_trunc('minute', m.created_at)) * 1000)::bigint as at,
                 count(*) as n
            from public.media m
            join public.events e on e.id = m.event_id
           where m.event_id = p_event_id
             and (m.status = 'pending'
                  or (m.status = 'approved'
                      and m.sealed_until > now() and e.host_id is distinct from (select auth.uid())))
           group by 1
        ) x) end,
    'changes', coalesce((
      select jsonb_agg(
               jsonb_build_array(
                 c.media_id, c.v, m.status, m.type, m.width, m.height, m.duration_seconds,
                 m.preview_key is not null, m.reel_eligible,
                 (extract(epoch from m.created_at) * 1000000)::bigint,
                 case when p_scope = 'host' then m.guest_id end,
                 (extract(epoch from m.captured_at) * 1000000)::bigint)
               order by c.v, c.media_id)
        from (
          (select ch.media_id, ch.host_version as v
             from public.album_changes ch
            where p_scope = 'host'
              and ch.event_id = p_event_id
              and ch.host_version > p_after
            order by ch.host_version, ch.media_id
            limit case when p_limit is null then null else least(p_limit, 1000) end)
          union all
          (select ch.media_id, ch.album_version as v
             from public.album_changes ch
            where p_scope = 'album'
              and ch.event_id = p_event_id
              and ch.album_version > p_after
            order by ch.album_version, ch.media_id
            limit case when p_limit is null then null else least(p_limit, 1000) end)
        ) c
        left join public.media m on m.id = c.media_id
    ), '[]'::jsonb)
  )
  from (select 1) as one
  left join public.album_state s on s.event_id = p_event_id;
$$;

comment on function public.album_changes_since(uuid, text, bigint, integer) is
  'The paged album''s poll read, one jsonb in one snapshot: {version, album_max, attr_version, watermark, approved, hidden, pending, waiting, changes: [[media_id, version, status, type, width, height, duration_seconds, has_preview, reel_eligible, created_at_us, guest_id, captured_at_us], ...]}. p_scope ''album'' (guest: changes across what a guest sees, the approved count leaving sealed rows out, what waits {count, minutes}: held and sealed rows together) or ''host'' (every status change, three counts, guest_id). Keyset on the scope''s version after p_after, clamped to 1,000. SECURITY INVOKER, service role only: the route decides who may see the album.';

revoke all on function public.album_changes_since(uuid, text, bigint, integer) from public, anon, authenticated;
grant execute on function public.album_changes_since(uuid, text, bigint, integer) to service_role;

create or replace function public.cloud_export_lease(p_connection uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_now constant timestamptz := now();
  c_lease constant interval := interval '15 minutes';
  c_max_items constant integer := 10;
  c_max_bytes constant bigint := 1073741824;
  c_daily_cap constant bigint := 700::bigint * 1024 * 1024 * 1024;
  v_conn public.cloud_connections%rowtype;
  v_live integer;
  v_sent24 bigint;
  v_first_hour timestamptz;
  v_access jsonb;
  v_claim boolean := false;
  v_job public.cloud_exports%rowtype;
  v_event record;
  v_ids uuid[];
  v_gone integer;
  v_count integer;
  v_token uuid;
  v_items jsonb;
  v_tries integer;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('state', 'stopped', 'why', 'no_connection');
  end if;
  if not coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true) then
    return jsonb_build_object('state', 'paused', 'why', 'switch');
  end if;
  if v_conn.status = 'revoked' then
    return jsonb_build_object('state', 'paused', 'why', 'disconnected');
  end if;
  if v_conn.operator_paused_at is not null then
    return jsonb_build_object('state', 'paused', 'why', 'operator');
  end if;
  if v_conn.throttled_until > c_now then
    return jsonb_build_object('state', 'throttled', 'until', v_conn.throttled_until);
  end if;
  -- A quiet half hour gives her lanes back.
  if v_conn.concurrency < 3 and (v_conn.concurrency_until is null or v_conn.concurrency_until <= c_now) then
    update public.cloud_connections set concurrency = 3, concurrency_until = null where id = p_connection;
    v_conn.concurrency := 3;
  end if;

  select count(*) into v_live from public.cloud_export_leases l
   where l.connection_id = p_connection and l.leased_until > c_now;
  if v_live >= v_conn.concurrency then
    return jsonb_build_object('state', 'wait', 'why', 'lanes');
  end if;

  -- The token, decided before any work is taken: a refresh another caller is making means wait.
  -- (each answer names the account the seals are bound to: their associated data, `tokens.server.ts`)
  if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '20 minutes' then
    v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                   'expires_at', v_conn.access_expires_at, 'user_id', v_conn.user_id);
  elsif v_conn.refresh_claimed_until > c_now then
    if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '12 minutes' then
      v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                     'expires_at', v_conn.access_expires_at, 'user_id', v_conn.user_id);
    else
      return jsonb_build_object('state', 'wait', 'why', 'refresh');
    end if;
  else
    v_claim := true;
    v_access := jsonb_build_object('state', 'refresh', 'refresh_ct', v_conn.refresh_ct, 'user_id', v_conn.user_id);
  end if;

  -- Google's day: what this connection uploaded over the last 24 hours, stopped at 700 GB of its 750.
  select coalesce(sum(h.bytes), 0)::bigint, min(h.hour) into v_sent24, v_first_hour
    from public.cloud_export_sent_hours h
   where h.connection_id = p_connection and h.hour > c_now - interval '24 hours';
  if v_sent24 >= c_daily_cap then
    perform public.cloud_export_pause(p_connection, null, 'daily_limit', v_first_hour + interval '25 hours');
    return jsonb_build_object('state', 'paused', 'why', 'daily_limit');
  end if;

  for v_job in
    select j.* from public.cloud_exports j
     where j.connection_id = p_connection and j.status in ('sending', 'checking')
     order by j.created_at, j.id
  loop
    -- The album itself: gone to Deleted, purged or no longer hers ends the send.
    select e.deleted_at, e.host_id into v_event from public.events e where e.id = v_job.event_id;
    if v_job.event_id is null or not found or v_event.deleted_at is not null or v_event.host_id <> v_job.user_id then
      update public.cloud_exports
         set status = 'canceled', stop_reason = 'album_deleted', pause_reason = null, closed_at = c_now,
             attention_at = null
       where id = v_job.id;
      continue;
    end if;

    if v_job.status = 'checking' then
      if exists (select 1 from public.cloud_export_leases l
                  where l.job_id = v_job.id and l.kind = 'check' and l.leased_until > c_now) then
        continue;
      end if;
      select coalesce(jsonb_agg(jsonb_build_object(
               'media_id', s.media_id,
               'file_id', s.drive_file_id,
               'bytes', s.bytes,
               'md5', s.md5
             ) order by s.media_id), '[]'::jsonb)
        into v_items
        from (
          select i.media_id, i.drive_file_id, i.bytes, coalesce(i.drive_md5, i.worker_md5) as md5
            from public.cloud_export_items i
           where i.job_id = v_job.id and i.status = 'sent'
             and (v_job.check_after is null or i.media_id > v_job.check_after)
           order by i.media_id
           limit 100
        ) s;
      if jsonb_array_length(v_items) = 0 then
        perform public.cloud_export_settle(v_job.id);
        continue;
      end if;
      v_token := gen_random_uuid();
      insert into public.cloud_export_leases (token, connection_id, job_id, kind, leased_until)
      values (v_token, p_connection, v_job.id, 'check', c_now + c_lease);
      if v_claim then
        update public.cloud_connections set refresh_claimed_until = c_now + interval '30 seconds' where id = p_connection;
      end if;
      return jsonb_build_object(
        'state', 'check',
        'lease', v_token,
        'until', c_now + c_lease,
        'job_id', v_job.id,
        'folder_id', v_job.folder_id,
        'first', v_job.check_after is null,
        'items', v_items,
        'access', v_access
      );
    end if;

    -- A send: a batch of what is due, oldest first, re-read against media as it is taken.
    v_tries := 0;
    v_count := 0;
    loop
      v_tries := v_tries + 1;
      select coalesce(array_agg(s.media_id order by s.position), '{}') into v_ids
        from (
          select p.media_id, p.position,
                 row_number() over (order by p.position) as rn,
                 sum(p.bytes) over (order by p.position) as running
            from (
              select i.media_id, i.position, i.bytes
                from public.cloud_export_items i
               where i.job_id = v_job.id
                 and (i.status = 'pending' or (i.status = 'leased' and i.leased_until <= c_now))
                 and (i.not_before is null or i.not_before <= c_now)
               order by i.position
               limit c_max_items
               for update skip locked
            ) p
        ) s
       where s.rn = 1 or (s.running <= c_max_bytes and v_sent24 + s.running <= c_daily_cap);
      exit when cardinality(v_ids) = 0;

      with gone as (
        update public.cloud_export_items i
           set status = 'skipped', skip_reason = 'gone', lease_token = null, leased_until = null, session_uri = null,
               session_offset = null
         where i.job_id = v_job.id
           and i.media_id = any (v_ids)
           and not exists (
             select 1 from public.media m
              where m.id = i.media_id and m.event_id = v_job.event_id
                and m.status <> 'removed' and m.purge_asked_at is null
           )
        returning 1
      )
      select count(*) into v_gone from gone;
      if v_gone > 0 then
        update public.cloud_exports set items_skipped = items_skipped + v_gone where id = v_job.id;
      end if;

      v_token := gen_random_uuid();
      update public.cloud_export_items i
         set status = 'leased', lease_token = v_token, leased_until = c_now + c_lease, attempts = i.attempts + 1
       where i.job_id = v_job.id and i.media_id = any (v_ids) and i.status in ('pending', 'leased');
      get diagnostics v_count = row_count;
      exit when v_count > 0 or v_tries >= 5;
    end loop;

    if v_count = 0 then
      -- Nothing due: everything left is in other lanes' hands or waiting out a backoff, or nothing is left.
      perform public.cloud_export_settle(v_job.id);
      continue;
    end if;

    insert into public.cloud_export_leases (token, connection_id, job_id, kind, leased_until)
    values (v_token, p_connection, v_job.id, 'send', c_now + c_lease);

    select jsonb_agg(jsonb_build_object(
             'media_id', i.media_id,
             'key', m.original_key,
             'bytes', m.file_size_bytes,
             'type', m.type,
             'created_at', m.created_at,
             'captured_at', m.captured_at,
             'name', i.name,
             'attempts', i.attempts,
             'session_uri', i.session_uri,
             'session_offset', i.session_offset,
             'prior_file_id', (
               select pi.drive_file_id
                 from public.cloud_export_items pi
                 join public.cloud_exports pj on pj.id = pi.job_id
                where pi.media_id = i.media_id and pi.status = 'sent' and pj.connection_id = p_connection
                  and pj.id <> v_job.id
                order by pi.sent_at desc nulls last
                limit 1
             )
           ) order by i.position)
      into v_items
      from public.cloud_export_items i
      join public.media m on m.id = i.media_id
     where i.lease_token = v_token;

    if v_claim then
      update public.cloud_connections set refresh_claimed_until = c_now + interval '30 seconds' where id = p_connection;
    end if;
    return jsonb_build_object(
      'state', 'work',
      'lease', v_token,
      'until', c_now + c_lease,
      'job_id', v_job.id,
      'user_id', v_job.user_id,
      'event_id', v_job.event_id,
      'album_name', v_job.album_name,
      'tz', v_job.tz,
      'folder_id', v_job.folder_id,
      'items', v_items,
      'access', v_access
    );
  end loop;

  return jsonb_build_object('state', 'idle');
end;
$$;

revoke all on function public.cloud_export_lease(uuid) from public, anon, authenticated;
grant execute on function public.cloud_export_lease(uuid) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own host (an auth user, so
-- handle_new_user makes her profile; Pro, so her album takes clips), an album whose door asks no address and a guest
-- ticket on it, and uploads through the real writers: the guest's and the host's, each named with `p_captured_at` and
-- each named the older build's way. Then the change log, a Drive send's first lease, the CHECK, the signatures, the
-- grants and the four bodies' hashes. Each step traps its own failure into the temp `proof` table; the final select is
-- the answer. The RED run is the same call without this file's statements: everything this file adds is reached only
-- through dynamic SQL, so it fails on what it lacks, never on a parse.
--
-- RESULT, 2026-10-05 against the live schema (the drift read above clean first: the four bodies at their hashes, the
-- column absent):
--   RED  0/8: 1 no column, no CHECK; 2 and 3 "42883 function public.create_media(... p_captured_at => timestamp with
--        time zone) does not exist" (and create_media_as_host's alike); 4 the old argument lists stand, the new ones
--        missing; 5 no change of the album's (its uploads never landed); 6 the lease idle (nothing to send); 7 42703 no
--        column; 8 the four bodies at their old hashes.
--   GREEN 8/8 on this file (its statements verbatim, top-level comments aside), and nothing persisted after (no fixture
--        user or album; `media.captured_at` absent; the old create_media signature and album_changes_since's old hash
--        standing).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- -- The album log's deferred stamps fire as each statement ends, so a change reads inside this transaction.
-- set constraints all immediate;
--
-- -- 0. Fixtures: a host on Pro (an auth user, so handle_new_user makes her profile), her album (an open door that asks no
-- --    address), a guest ticket on it, and four uploads through the real writers: the guest's and the host's, each with a
-- --    capture time and without one (the older build's call, its twelve or thirteen names).
-- do $$
-- declare h uuid := gen_random_uuid(); a uuid; t text := 'capture-time-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into auth.users (id, aud, role, email, email_confirmed_at)
--   values (h, 'authenticated', 'authenticated', 'capture-time-' || h || '@example.com', now());
--   update public.profiles set display_name = 'Cap', tier = 'pro', storage_cap_bytes = 50::bigint * 1024 * 1024 * 1024
--    where id = h;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Capture time: the album', false)
--   returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest');
--   insert into fx values ('host', h, null), ('album', a, null), ('ticket', null, t),
--     ('g_time', gen_random_uuid(), null), ('g_none', gen_random_uuid(), null),
--     ('h_time', gen_random_uuid(), null), ('h_none', gen_random_uuid(), null);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, null);
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 1. The column: a nullable timestamptz, finite by CHECK; the host reads it and no client role writes it.
-- do $$
-- declare v_type text; v_null text; fail text := '';
-- begin
--   select data_type, is_nullable into v_type, v_null from information_schema.columns
--    where table_schema = 'public' and table_name = 'media' and column_name = 'captured_at';
--   if v_type is distinct from 'timestamp with time zone' or v_null is distinct from 'YES' then
--     fail := fail || format(' column %s/%s', v_type, v_null);
--   end if;
--   if not exists (select 1 from pg_constraint where conrelid = 'public.media'::regclass
--                   and conname = 'media_captured_at_finite' and contype = 'c') then
--     fail := fail || ' no finite check';
--   end if;
--   if v_type is not null then
--     if not has_column_privilege('authenticated', 'public.media', 'captured_at', 'select') then fail := fail || ' host cannot read'; end if;
--     if has_column_privilege('authenticated', 'public.media', 'captured_at', 'update')
--        or has_column_privilege('authenticated', 'public.media', 'captured_at', 'insert') then fail := fail || ' host writes'; end if;
--     if has_column_privilege('anon', 'public.media', 'captured_at', 'select') then fail := fail || ' anon reads'; end if;
--     if has_column_privilege('authenticated', 'public.media', 'legal_hold_at', 'select') then fail := fail || ' the hold widened'; end if;
--   end if;
--   insert into proof (step, ok, detail) values ('1 the column and its grant', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the column and its grant', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 2. The guest's writer: named with p_captured_at it stores the instant exactly; named the older build's way (no such
-- --    name) it lands as today, with none.
-- do $$
-- declare e uuid := pg_temp.fx('album'); m1 uuid := pg_temp.fx('g_time'); m2 uuid := pg_temp.fx('g_none');
--   t text := (select txt from fx where k = 'ticket'); got timestamptz; got2 timestamptz; fail text := '';
-- begin
--   execute 'select public.create_media(p_session_token => $1, p_media_id => $2, p_type => ''photo'',
--              p_original_key => $3, p_file_size_bytes => 4096, p_captured_at => $4)'
--     using t, m1, 'events/' || e || '/photo/' || m1 || '/original.jpg', '2026-10-04T01:14:05Z'::timestamptz;
--   perform public.create_media(p_session_token => t, p_media_id => m2, p_type => 'photo',
--     p_original_key => 'events/' || e || '/photo/' || m2 || '/original.jpg', p_file_size_bytes => 4096,
--     p_preview_key => null, p_duration_seconds => null, p_width => 640, p_height => 480, p_reel_eligible => true,
--     p_phone_key => null, p_phone_bytes => null);
--   execute 'select captured_at from public.media where id = $1' into got using m1;
--   execute 'select captured_at from public.media where id = $1' into got2 using m2;
--   if got is distinct from '2026-10-04T01:14:05Z'::timestamptz then fail := fail || format(' with: %s', got); end if;
--   if got2 is not null or not exists (select 1 from public.media where id = m2) then fail := fail || ' without'; end if;
--   insert into proof (step, ok, detail) values ('2 create_media', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 create_media', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 3. The host's writer, the same both ways (her thirteen names without it are the older build's call).
-- do $$
-- declare e uuid := pg_temp.fx('album'); h uuid := pg_temp.fx('host'); m1 uuid := pg_temp.fx('h_time');
--   m2 uuid := pg_temp.fx('h_none'); got timestamptz; got2 timestamptz; fail text := '';
-- begin
--   execute 'select public.create_media_as_host(p_host_id => $1, p_event_id => $2, p_media_id => $3, p_type => ''video'',
--              p_original_key => $4, p_file_size_bytes => 8192, p_duration_seconds => 3.5, p_captured_at => $5)'
--     using h, e, m1, 'events/' || e || '/video/' || m1 || '/original.mov', '2026-10-03T21:14:05-04:00'::timestamptz;
--   perform public.create_media_as_host(p_host_id => h, p_event_id => e, p_media_id => m2, p_type => 'photo',
--     p_original_key => 'events/' || e || '/photo/' || m2 || '/original.jpg', p_file_size_bytes => 8192,
--     p_preview_key => null, p_duration_seconds => null, p_width => 640, p_height => 480, p_reel_eligible => true,
--     p_phone_key => null, p_phone_bytes => null);
--   execute 'select captured_at from public.media where id = $1' into got using m1;
--   execute 'select captured_at from public.media where id = $1' into got2 using m2;
--   if got is distinct from '2026-10-04T01:14:05Z'::timestamptz then fail := fail || format(' with: %s', got); end if;
--   if got2 is not null or not exists (select 1 from public.media where id = m2) then fail := fail || ' without'; end if;
--   insert into proof (step, ok, detail) values ('3 create_media_as_host', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 create_media_as_host', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 4. The writers' signatures and grants: the old argument lists gone, the new ones the service role's alone.
-- do $$
-- declare fail text := ''; f text;
-- begin
--   if to_regprocedure('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)') is not null
--      or to_regprocedure('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)') is not null then
--     fail := fail || ' an old signature stands';
--   end if;
--   foreach f in array array[
--     'public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz)',
--     'public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz)'
--   ] loop
--     if to_regprocedure(f) is null then fail := fail || ' missing ' || f; continue; end if;
--     if not has_function_privilege('service_role', f, 'execute') then fail := fail || ' service ' || f; end if;
--     if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute')
--        or has_function_privilege('public', f, 'execute') then fail := fail || ' a client role ' || f; end if;
--     if not exists (select 1 from pg_proc p where p.oid = to_regprocedure(f)::oid and p.prosecdef
--                     and p.proconfig @> array['search_path=""']) then fail := fail || ' not a pinned definer ' || f; end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('4 the writers'' signatures and grants', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the writers'' signatures and grants', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 5. The album's change log: each change's twelfth element is its capture time in microseconds, null for none, its
-- --    first eleven as they were; a guest's delta the same.
-- do $$
-- declare r jsonb; c jsonb; fail text := ''; seen int := 0;
-- begin
--   r := public.album_changes_since(pg_temp.fx('album'), 'host', 0, null);
--   for c in select x from jsonb_array_elements(r -> 'changes') x loop
--     if jsonb_array_length(c) <> 12 then fail := fail || format(' length %s', jsonb_array_length(c)); exit; end if;
--     if (c ->> 0)::uuid in (pg_temp.fx('g_time'), pg_temp.fx('h_time')) then
--       seen := seen + 1;
--       if (c ->> 11)::bigint is distinct from (extract(epoch from '2026-10-04T01:14:05Z'::timestamptz) * 1000000)::bigint then
--         fail := fail || format(' %s carries %s', c ->> 0, c ->> 11);
--       end if;
--     elsif (c ->> 0)::uuid in (pg_temp.fx('g_none'), pg_temp.fx('h_none')) then
--       seen := seen + 1;
--       if jsonb_typeof(c -> 11) <> 'null' then fail := fail || format(' %s carries %s', c ->> 0, c ->> 11); end if;
--     end if;
--     if (c ->> 9) is null or jsonb_typeof(c -> 7) <> 'boolean' then fail := fail || ' the first eleven moved'; end if;
--   end loop;
--   if seen <> 4 then fail := fail || format(' saw %s of 4', seen); end if;
--   r := public.album_changes_since(pg_temp.fx('album'), 'album', 0, null);
--   if exists (select 1 from jsonb_array_elements(r -> 'changes') x where jsonb_array_length(x) <> 12) then
--     fail := fail || ' the guest scope''s shape';
--   end if;
--   insert into proof (step, ok, detail) values ('5 album_changes_since', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 album_changes_since', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 6. The Drive lease: her connection, a send of the album, and its first lease's items each carrying `captured_at`
-- --    (the host's two approved uploads; the guest's two wait in Review or land, whichever the album says).
-- do $$
-- declare h uuid := pg_temp.fx('host'); e uuid := pg_temp.fx('album'); v_conn uuid; v_job uuid; r jsonb; i jsonb;
--   fail text := ''; seen int := 0;
-- begin
--   v_conn := (public.cloud_connection_upsert(h, 'sub-capture', 'capture@example.com', true, null, '{}', 'v1.k.r.ct',
--              'v1.k.a.ct', now() + interval '1 hour', null) ->> 'connection_id')::uuid;
--   v_job := (public.cloud_export_create(h, e, false, 'UTC') ->> 'job_id')::uuid;
--   perform public.cloud_export_ready(v_job, 'folder-capture');
--   r := public.cloud_export_lease(v_conn);
--   if r ->> 'state' <> 'work' then fail := fail || format(' state %s', r ->> 'state'); end if;
--   for i in select x from jsonb_array_elements(coalesce(r -> 'items', '[]'::jsonb)) x loop
--     if not (i ? 'captured_at') then fail := fail || ' an item without the key'; exit; end if;
--     if (i ->> 'media_id')::uuid = pg_temp.fx('h_time') then
--       seen := seen + 1;
--       if (i ->> 'captured_at')::timestamptz is distinct from '2026-10-04T01:14:05Z'::timestamptz then
--         fail := fail || format(' carries %s', i ->> 'captured_at');
--       end if;
--     elsif (i ->> 'media_id')::uuid = pg_temp.fx('h_none') then
--       seen := seen + 1;
--       if jsonb_typeof(i -> 'captured_at') <> 'null' then fail := fail || ' a none carries one'; end if;
--     end if;
--   end loop;
--   if seen <> 2 then fail := fail || format(' saw %s of the host''s 2', seen); end if;
--   insert into proof (step, ok, detail) values ('6 cloud_export_lease', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 cloud_export_lease', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 7. What a row may hold: 'infinity' is refused (the CHECK), a NULL is fine.
-- do $$
-- declare ok boolean := false; detail text;
-- begin
--   begin
--     execute 'update public.media set captured_at = ''infinity'' where id = $1' using pg_temp.fx('h_none');
--     detail := 'infinity stored';
--   exception when check_violation then ok := true;
--   end;
--   insert into proof (step, ok, detail) values ('7 infinity refused', ok, detail);
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 infinity refused', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- -- 8. The restated bodies at the file's hashes, the readers' ACLs as they stood, every class kept.
-- do $$
-- declare fail text := ''; r record; expected text;
-- begin
--   for r in
--     select p.proname, md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) as h, p.proacl::text as acl
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('create_media', 'create_media_as_host', 'album_changes_since', 'cloud_export_lease')
--   loop
--     expected := case r.proname
--                   when 'create_media' then '3b6fed8cac1368e7e0472acc3cbb2492'
--                   when 'create_media_as_host' then 'a2cac72021af2d039cf94aa4be52a201'
--                   when 'album_changes_since' then '431ce33dac81cef84433ca4b19f02807'
--                   when 'cloud_export_lease' then 'c92cf0439d5b687adb6ca61da496c0aa' end;
--     if r.h is distinct from expected then
--       fail := fail || format(' %s at %s', r.proname, r.h);
--     end if;
--     if r.acl <> '{postgres=X/postgres,service_role=X/postgres}' then fail := fail || format(' %s acl %s', r.proname, r.acl); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('8 the bodies and their ACLs', fail = '', nullif(fail, ''));
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 the bodies and their ACLs', false, sqlstate || ' ' || sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
