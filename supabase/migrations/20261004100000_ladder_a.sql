-- LADDER A (Will, 2026-10-03 23:58Z and 2026-10-04 02:50Z: "send it on pricing tier A with $99", the renewal at $19):
-- an event, or a year of them. Every number mirrors src/lib/constants/tiers.ts (the human-authored source), held by
-- tier-limits-parity.test.ts; the reasons are docs/PRICING.md's ("What it costs us") and the mechanism
-- docs/systems/billing-caps.md's.
--
--   1. tier_limits(): the pass's room 75 GB -> 25 GB, and the uploads allowance each tier sets on its own (Free 300 MB
--      a month, one pass 50 GB over its year) in place of the multiplier. Its return columns change (two go, one
--      comes), so it is dropped and created; nothing depends on it in pg_depend (read live), and every body that calls
--      it reads max_events, default_storage_cap_bytes or max_reel_seconds by name, which stay.
--   2. upload_allowance(tier, cap): what a host may upload in her window, her plan's own published number. Pro's is
--      its size's (50 GB -> 100 GB a month, 200 GB -> 200 GB, 1 TB -> 500 GB), a pass's is 50 GB for each pass her
--      room holds (passes stack). It replaces monthly_ingress_cap(), dropped in 8.
--   3. event_passes.uploaded_bytes: a pass's year is counted on the pass itself, so the window is the year she paid
--      for (from its purchase, or from the day a renewal's year opens), never the calendar's.
--   4. uploads_used(host, tier): what her window has used: this calendar month's ledger for Free and Pro, her live
--      passes' own counts for a pass holder.
--   5-7. The two writers, the presign's meter and the three advisories, each restated from its newest definition
--      (20261003220000_deleted_counts.sql) verbatim but for its allowance block (and, in the writers, the pass's count
--      after the ledger's). Same signatures, return types, language, volatility, security mode and empty search_path,
--      so create or replace keeps their ACLs; the grants are restated as they stand live.
--   8. monthly_ingress_cap() is dropped: nothing calls it once 5-7 land (pg_depend lists nothing).
--
-- ★ WHAT MILESTONE 35 MEETS between this apply and the next milestone (partyreel.com shares this database; nothing
-- there holds real data, Stripe is in TEST): an expand for every call it makes. No function it calls changes its
-- signature, its answer's keys or its refusal's routing: the presign's meter still answers reason 'monthly', the
-- advisories still answer at_monthly_cap, and the completes' new words, "Upload limit reached for this plan.", carry
-- the "limit" both wrappers route to cap_reached (mapCheckViolation, host-media.ts). Its numbers move: Free's
-- allowance is unchanged (300 MB a month); a Pro subscription it sells writes its old caps (100 GB, 500 GB, 2 TB),
-- which take the smallest Ladder A size that holds them (200 GB, 500 GB, 500 GB a month, from 3x the cap); a pass it
-- sells writes 75 GB a pass, which reads as three passes' worth (150 GB over the pass's year, counted from this apply).
-- Its site published no uploads number, so no promise it made moves. The new code reads nothing this file adds
-- (types.ts regenerates after it), so the two apply in either order; apply this BEFORE the lane's build deploys, so
-- the pricing page that publishes the allowances never runs over the multiplier.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: every body this file replaces or drops,
-- hashed live as md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it
-- did on 2026-10-04:
--   tier_limits             0faabb2e44e65e582d30ced26736829b  (20260928130000_free_shift)
--   monthly_ingress_cap     883aa11c837cf5b7e61ebab795392fde  (20260707120000_reel_caps_ingress_multiplier)
--   create_media            818b51597bb294cee2cf98decedb9d80  (20261003220000_deleted_counts)
--   create_media_as_host    4389fd6d8f400a40d5a8a769c934cd06  (20261003220000_deleted_counts)
--   meter_upload            55193b9ca68975e584a5eb60ef60a6a4  (20261003220000_deleted_counts)
--   get_upload_context      f46a589aff65511c9b22caa18153c725  (20261003220000_deleted_counts)
--   get_upload_gate         301a06c00a30c663d6aacf4629c19f4f  (20261003220000_deleted_counts)
--   get_host_upload_context ab177c6b46b01928264b3f2e1cb3f123  (20261003220000_deleted_counts)
-- Then the rolled-back proof at the foot of this file, RED without this file's statements and GREEN with them; then
-- apply verbatim; then get_advisors; then regenerate src/lib/db/types.ts (tier_limits' columns, uploaded_bytes, the
-- two new functions).

-- =============================================================================================
-- 1. tier_limits(): the pass at 25 GB, and the uploads each tier sets on its own.
-- =============================================================================================
-- The columns ARE the mirror: tier-limits-parity.test.ts parses this body (`case p_tier` lookups of integer literals)
-- and compares every value with tiers.ts. Pro's room and uploads are its size's, never a tier default, so both are
-- null here (profiles.storage_cap_bytes and upload_allowance carry them).
drop function public.tier_limits(public.tier_type);

create function public.tier_limits(p_tier public.tier_type)
returns table (
  max_events integer,
  default_storage_cap_bytes bigint,
  uploads_bytes bigint,
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
      when 'free' then 100::bigint * 1024 * 1024 -- 100 MB
      when 'event_pass' then 25::bigint * 1024 * 1024 * 1024 -- 25 GB, one pass's room (a stack's is the recompute's sum)
      else null -- pro: governed by profiles.storage_cap_bytes; max(retired): unused
    end::bigint,
    case p_tier
      when 'free' then 300::bigint * 1024 * 1024 -- 300 MB a calendar month
      when 'event_pass' then 50::bigint * 1024 * 1024 * 1024 -- 50 GB over each pass's own year
      else null -- pro: its size's own number (upload_allowance)
    end::bigint,
    case p_tier
      when 'free' then 60 -- a clip's length is no longer a paid line; its mark is
      else 60 -- ('max' retired -> treated as pro)
    end::integer;
$$;

-- As it stood (20260929160000_schema_pass): every caller is a definer body (it runs as the owner) or the service role.
revoke all on function public.tier_limits(public.tier_type) from public, anon, authenticated;
grant execute on function public.tier_limits(public.tier_type) to service_role;

-- =============================================================================================
-- 2. upload_allowance(): her plan's own uploads number, the line the upload RPCs refuse past.
-- =============================================================================================
-- Mirrors uploadAllowance() in tiers.ts, the Pro ladder included (the parity test reads its `when` steps).
--  - Pro: the smallest Ladder A size whose room holds her cap, the largest size's above them all. A cap between sizes
--    exists only on a subscription at a price no longer sold (or a hand-set comp), and the larger size's number fails
--    toward the host. No cap on record yet (the webhook writes it): NULL, unmetered, fail OPEN.
--  - A pass: one pass's allowance for each pass her room holds (the recompute writes a stack's rooms summed), never
--    fewer than one pass's.
--  - Free: its own number.
create function public.upload_allowance(p_tier public.tier_type, p_storage_cap_bytes bigint)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when p_tier in ('pro', 'max') then
      case
        when p_storage_cap_bytes is null then null
        when p_storage_cap_bytes <= 50::bigint * 1024 * 1024 * 1024 then 100::bigint * 1024 * 1024 * 1024 -- Pro 50 GB
        when p_storage_cap_bytes <= 200::bigint * 1024 * 1024 * 1024 then 200::bigint * 1024 * 1024 * 1024 -- Pro 200 GB
        else 500::bigint * 1024 * 1024 * 1024 -- Pro 1 TB, and any room past it
      end
    when p_tier = 'event_pass' then
      l.uploads_bytes
        * greatest(1, coalesce(p_storage_cap_bytes, l.default_storage_cap_bytes) / l.default_storage_cap_bytes)
    else l.uploads_bytes
  end
  from public.tier_limits(p_tier) l;
$$;

revoke all on function public.upload_allowance(public.tier_type, bigint) from public, anon, authenticated;
grant execute on function public.upload_allowance(public.tier_type, bigint) to service_role;

-- =============================================================================================
-- 3. A pass's year, counted on the pass.
-- =============================================================================================
-- A constant default on a new column is a catalog change, no rewrite. The table stays deny-all (20260827210000): the
-- writers (definer bodies) are its only incrementers, the webhook's insert takes the default, and its consume leaves
-- the count where it is.
alter table public.event_passes
  add column uploaded_bytes bigint not null default 0,
  add constraint event_passes_uploaded_bytes_nonneg check (uploaded_bytes >= 0);

comment on column public.event_passes.uploaded_bytes is
  'What this pass''s year has taken in uploads (every guest''s and the host''s, deletions never given back), counted by create_media* on the live pass that ends soonest. uploads_used() sums the live passes'' counts against upload_allowance() (50 GB a pass); a renewal''s year opens on its own row at zero. Definer bodies only; never granted to a client role.';

-- =============================================================================================
-- 4. uploads_used(): what her window has used.
-- =============================================================================================
-- Free and Pro: this calendar month's ledger (the key every writer writes, to_char(now(), 'YYYY-MM')), which never
-- decrements. A pass holder: her live passes' own counts, so a month's uploads never ration her event's night and an
-- old month never follows her into a pass. Invoker: only definer bodies call it, as the owner.
create function public.uploads_used(p_host_id uuid, p_tier public.tier_type)
returns bigint
language sql
stable
set search_path = ''
as $$
  select case
    when p_tier = 'event_pass' then
      (select coalesce(sum(p.uploaded_bytes), 0)::bigint
         from public.event_passes p
        where p.profile_id = p_host_id and p.consumed_at is null
          and p.start_at <= now() and p.expires_at > now())
    else
      coalesce((select l.cumulative_bytes
                  from public.storage_ledger l
                 where l.host_id = p_host_id and l.period = to_char(now(), 'YYYY-MM')), 0)
  end;
$$;

revoke all on function public.uploads_used(uuid, public.tier_type) from public, anon, authenticated;
grant execute on function public.uploads_used(uuid, public.tier_type) to service_role;

-- =============================================================================================
-- 5. The writers: the allowance over its window, and a pass holder's upload counted on her pass.
-- =============================================================================================
-- Each body is its 20261003220000 definition verbatim but for its allowance block (two variables renamed with it) and
-- the pass's count after the ledger's. Grants restated as they stand live: the service role's alone (the complete
-- routes, on the admin client).

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
  v_period text := to_char(now(), 'YYYY-MM');
  v_uploaded bigint;
  v_cap bigint;
  v_allowance bigint;
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

revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;
revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

-- =============================================================================================
-- 6. The presign's meter: the allowance over the same window, read before a byte moves.
-- =============================================================================================
-- 20261003220000's body verbatim but for its allowance block (its variable renamed with it).
create or replace function public.meter_upload(
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
  v_host uuid;
  v_tier public.tier_type;
  v_storage_cap bigint;
  v_make_room boolean;
  v_used bigint;
  v_deleted bigint;
  v_ledger public.storage_ledger;
  v_period text := to_char(now(), 'YYYY-MM'); -- the month's key, as every reader and writer of the meter writes it
  v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');
  v_cap bigint;
  v_allowance bigint;
  v_tallied integer;
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

  -- The event as the route's gates resolved it, and its host's plan: plain reads, no lock. An upload never locks the
  -- event row (a measured deadlock cycle, 20261002200000), and with no month to spend this needs no profiles lock.
  select e.host_id into v_host from public.events e where e.id = p_event_id and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'event_gone');
  end if;
  select p.tier, p.storage_cap_bytes, p.make_room_from_deleted into v_tier, v_storage_cap, v_make_room
    from public.profiles p where p.id = v_host;
  select * into v_ledger from public.storage_ledger where host_id = v_host and period = v_period;

  -- The breaker's early read: a runaway past it pays this one read, never the storage sum below.
  if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  -- The allowance, advisory: the line create_media* hold at complete, over the same window, read before a byte moves
  -- (NULL = unmetered: a paid profile with no cap on record fails open, as there). The reason keeps the wire's name,
  -- 'monthly', which the routes read, whatever the window (20261004100000: a pass counts its year).
  v_allowance := public.upload_allowance(v_tier, v_storage_cap);
  if v_allowance is not null and public.uploads_used(v_host, v_tier) + p_bytes > v_allowance then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;

  -- The room, advisory: the line an upload meets (`host_room_used`, 20261003220000: what she keeps, Deleted left out
  -- while her setting lets an upload make room from it) against the cap and its 10%, as create_media* will judge this
  -- file on its HEAD. A refusal carries what this file needs freed, what Deleted holds and whether Deleted could make the
  -- room, for the owner's own words (a guest's route names the album, never these). A Free profile's null cap is its
  -- plan's default (tier_limits), as every cap read takes it.
  v_cap := coalesce(v_storage_cap, (select l.default_storage_cap_bytes from public.tier_limits(v_tier) l));
  if v_cap is not null then
    v_used := public.host_room_used(v_host);
    if v_used + p_bytes > v_cap + (v_cap / 10) then
      select s.standby_bytes into v_deleted from public.host_storage_summary(v_host) s;
      return jsonb_build_object(
        'ok', false,
        'reason', 'storage',
        'needed_bytes', v_used + p_bytes - (v_cap + (v_cap / 10)),
        'deleted_bytes', v_deleted,
        'makes_room', coalesce(v_make_room, true)
      );
    end if;
  end if;

  -- The hour's tally, atomic on its own row: the upsert holds that row while it decides, and its WHERE refuses the
  -- 20,001st of an hour even when two presigns raced past the early read. A new hour starts the tally at one. The
  -- month's columns are never written here (a first presign of the month makes the row with their zero defaults).
  insert into public.storage_ledger as l (host_id, period, hour_started_at, hour_uploads)
  values (v_host, v_period, v_hour, 1)
  on conflict (host_id, period) do update set
    hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end,
    hour_started_at = excluded.hour_started_at
  where l.hour_started_at is distinct from excluded.hour_started_at or l.hour_uploads < c_uploads_an_hour
  returning l.hour_uploads into v_tallied;

  if v_tallied is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;
grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;

-- =============================================================================================
-- 7. The upload advisories: "full" at the same line.
-- =============================================================================================
-- Each body is its 20261003220000 definition verbatim but for its allowance block (the month's two variables and its
-- key gone with it). Grants restated as they stand live: the guest's context the anon capability read it has always
-- been (database-security.md), the gate the service role's, the host's context the authenticated host's.
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
  v_allowance bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
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

  -- Already at the uploads allowance? Her plan's own number over its window (20261004100000); `at_monthly_cap` keeps
  -- the wire's name, which the routes read, whatever the window.
  v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes);
  if v_allowance is not null then
    v_at_monthly_cap := public.uploads_used(v_event.host_id, v_profile.tier) >= v_allowance;
  end if;

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
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
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
  v_allowance bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_ticket uuid;
  v_live integer;
  v_taken integer;
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
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

    -- The uploads allowance over its window (20261004100000), the line the presign refuses past.
    v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes);
    if v_allowance is not null then
      v_at_monthly_cap := public.uploads_used(v_event.host_id, v_profile.tier) >= v_allowance;
    end if;

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      -- The line an upload meets (`host_room_used`, 20261003220000), so the gate fails open exactly when an upload
      -- would be refused: a guest is never held at a step she cannot pass.
      v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  -- ★ THE CAMERA (20261002200000): the viewer's roll, {used, cap, taken, ceiling}, by the same identities the
  -- contribution reads (the unclaimed ticket's row, the account's rows here). NULL for free uploads.
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
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
  );
end;
$$;

revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;

create or replace function public.get_host_upload_context(p_event_id uuid, p_type public.media_type)
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
  v_allowance bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = auth.uid() and deleted_at is null;
  if not found then
    return null;
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- The advisory mirrors the authoritative check in create_media_as_host: her plan's own uploads number over its
  -- window (20261004100000). NULL = unmetered.
  v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes);
  if v_allowance is not null then
    v_at_monthly_cap := public.uploads_used(v_event.host_id, v_profile.tier) >= v_allowance;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- The line an upload meets (`host_room_used`, 20261003220000), mirroring create_media_as_host.
    v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media_as_host).
  return jsonb_build_object(
    'event_id', v_event.id,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free')
  );
end;
$$;

revoke all on function public.get_host_upload_context(uuid, public.media_type) from public, anon, authenticated;
grant execute on function public.get_host_upload_context(uuid, public.media_type) to authenticated;

-- =============================================================================================
-- 8. The multiplier retires.
-- =============================================================================================
-- Nothing calls it once 5-7 land; pg_depend lists no dependent (read live 2026-10-04).
drop function public.monthly_ingress_cap(public.tier_type, bigint);

-- =============================================================================================
-- 9. What each new piece is, where an operator reads it.
-- =============================================================================================
comment on function public.tier_limits(public.tier_type) is
  'Ladder A''s per-tier constants (mirrors src/lib/constants/tiers.ts under tier-limits-parity.test.ts): events that may exist (null = unlimited), the default storage cap (null for Pro, whose cap is its size''s), the uploads a tier sets on its own (Free''s a month, ONE pass''s over its year; null for Pro, whose allowance is its size''s: upload_allowance), and a clip''s length.';

comment on function public.upload_allowance(public.tier_type, bigint) is
  'What a host may upload in her window (her plan''s published Uploads row): Free 300 MB a calendar month; a pass 50 GB over its own year for each pass her room holds; Pro its size''s, the smallest Ladder A size holding her cap (50 GB -> 100 GB, 200 GB -> 200 GB, larger -> 500 GB a month). NULL = unmetered (a Pro profile with no cap on record fails open). Mirrors uploadAllowance() in tiers.ts.';

comment on function public.uploads_used(uuid, public.tier_type) is
  'What a host''s uploads window has used, deletions never given back: this calendar month''s storage_ledger row for Free and Pro, her live passes'' event_passes.uploaded_bytes for a pass holder. Read against upload_allowance() by create_media*, meter_upload and the three upload advisories.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own account (an auth user, so
-- handle_new_user makes her profile), her album and a guest ticket needing no address, and sets each step's plan, ledger
-- and passes straight in; every upload goes through the real create_media* and every read through the real meter and
-- advisories (the host's under her session). Each step traps its own failure into the temp `proof` table; the final
-- select is the answer. The RED run is the same call without this file's statements: everything this file adds is
-- reached only through dynamic SQL and to_jsonb, so it fails on what it lacks, never on a parse.
--
-- RESULT, 2026-10-04 against the live schema (the drift read above clean first):
--   RED  0/10: 1 the old five columns; 2 no upload_allowance; 3 the same 300 MB line refused in the old words; 4 every
--        size admitting past its line (3x the cap); 5-7 no uploaded_bytes; 8 the two functions absent, the multiplier
--        still defined (the six restated ACLs already as named); 9 no column; 10 the drift read's hashes.
--   GREEN 10/10, nothing persisted after (tier_limits and create_media at their drift hashes, no upload_allowance, no
--        uploaded_bytes column, no fixture user).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- -- The fixtures' ids, and a few constants in bytes.
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.mb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024)::bigint $f$;
-- create function pg_temp.gb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024 * 1024)::bigint $f$;
--
-- -- A clean account on a plan: no media, no ledger, no passes; the tier and the cap as asked; no session.
-- create function pg_temp.reset(p_tier text, p_cap bigint) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx('host');
-- begin
--   perform set_config('request.jwt.claims', '', true);
--   delete from public.media where event_id in (select id from public.events where host_id = h);
--   delete from public.storage_ledger where host_id = h;
--   delete from public.event_passes where profile_id = h;
--   update public.profiles set tier = p_tier::public.tier_type, storage_cap_bytes = p_cap, storage_used_bytes = 0
--    where id = h;
-- end $f$;
--
-- -- The ledger's row for a period (this month's key unless named), at p_bytes.
-- create function pg_temp.ledger(p_bytes bigint, p_period text default null) returns void language sql as $f$
--   insert into public.storage_ledger (host_id, period, cumulative_bytes)
--   values (pg_temp.fx('host'), coalesce(p_period, to_char(now(), 'YYYY-MM')), p_bytes)
--   on conflict (host_id, period) do update set cumulative_bytes = excluded.cumulative_bytes;
-- $f$;
--
-- -- A pass row on her ledger: its window by offsets from now, its count where the column exists (the red run has none,
-- -- so a nonzero count fails there on what it lacks), consumed when asked.
-- create function pg_temp.pass(p_from interval, p_to interval, p_uploaded bigint default 0, p_consumed boolean default false,
--                              p_source text default 'initial')
-- returns uuid language plpgsql as $f$
-- declare pid uuid;
-- begin
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, consumed_at, consumed_reason)
--   values (pg_temp.fx('host'), now() + p_from, now() + p_to, 2900, p_source,
--           case when p_consumed then now() end, case when p_consumed then 'pro_credit' end)
--   returning id into pid;
--   if p_uploaded <> 0 then
--     execute 'update public.event_passes set uploaded_bytes = $1 where id = $2' using p_uploaded, pid;
--   end if;
--   return pid;
-- end $f$;
--
-- -- A pass's count (null where the column does not exist).
-- create function pg_temp.counted(p_pass uuid) returns bigint language plpgsql as $f$
-- declare v bigint;
-- begin
--   execute 'select uploaded_bytes from public.event_passes where id = $1' into v using p_pass;
--   return v;
-- exception when others then
--   return null;
-- end $f$;
--
-- -- An upload through the real writers: the host's own (create_media_as_host) or the guest's ticket (create_media).
-- create function pg_temp.put(p_bytes bigint, p_as text default 'host') returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := pg_temp.fx('album');
-- begin
--   if p_as = 'host' then
--     perform public.create_media_as_host(p_host_id => pg_temp.fx('host'), p_event_id => e, p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   else
--     perform public.create_media(p_session_token => (select txt from fx where k = 'ticket'), p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   end if;
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The presign's meter, and the three advisories' "full", each as its caller reads it.
-- create function pg_temp.meter(p_bytes bigint) returns text language plpgsql as $f$
-- begin
--   return coalesce(public.meter_upload(p_event_id => pg_temp.fx('album'), p_type => 'photo', p_bytes => p_bytes)->>'reason', 'ok');
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- create function pg_temp.full3() returns text language plpgsql as $f$
-- declare c text; g text; hc text;
--   a uuid := pg_temp.fx('album'); h uuid := pg_temp.fx('host'); t text := (select txt from fx where k = 'ticket');
-- begin
--   c := public.get_upload_context(t, 'photo')->>'at_monthly_cap';
--   g := public.get_upload_gate(a, 'ladder-a-nobody-' || md5(a::text), null)->>'album_full';
--   -- Her session for her own advisory (auth.uid()), every id read before the role changes.
--   perform set_config('request.jwt.claims', json_build_object('sub', h, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   hc := public.get_host_upload_context(a, 'photo')->>'at_monthly_cap';
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return format('context %s, gate %s, host %s', c, g, hc);
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The fixtures: a fresh host (an auth user, so handle_new_user makes her profile), her album, and one guest ticket on
-- -- it that needs no address.
-- do $$
-- declare h uuid := gen_random_uuid(); a uuid; gid uuid;
--   t text := 'ladder-a-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values (h, 'ladder-a-' || h || '@example.com', now());
--   insert into public.profiles (id, email, display_name) values (h, 'ladder-a-' || h || '@example.com', 'Lada Ladder')
--     on conflict (id) do update set display_name = excluded.display_name;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Ladder A: the album', false) returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest') returning id into gid;
--   insert into fx values ('host', h, null), ('album', a, null), ('guest', gid, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, format('host %s, album %s', h, a));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. tier_limits(): four columns, Ladder A's per-tier numbers (the retired max reads as Pro).
-- do $$
-- declare got text; want text;
-- begin
--   select string_agg(t || '=' || (select to_jsonb(l)::text from public.tier_limits(t::public.tier_type) l), ' ' order by t)
--     into got from unnest(array['event_pass', 'free', 'max', 'pro']) t;
--   want := 'event_pass={"max_events": 1, "uploads_bytes": 53687091200, "max_reel_seconds": 60, "default_storage_cap_bytes": 26843545600}'
--     || ' free={"max_events": 1, "uploads_bytes": 314572800, "max_reel_seconds": 60, "default_storage_cap_bytes": 104857600}'
--     || ' max={"max_events": null, "uploads_bytes": null, "max_reel_seconds": 60, "default_storage_cap_bytes": null}'
--     || ' pro={"max_events": null, "uploads_bytes": null, "max_reel_seconds": 60, "default_storage_cap_bytes": null}';
--   insert into proof (step, ok, detail) values ('1 tier_limits', got = want, got);
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 tier_limits', false, sqlerrm);
-- end $$;
--
-- -- 2. upload_allowance(): Free's own; Pro by the smallest size that holds the cap (the retired sizes included, and no
-- -- cap = unmetered); a pass per pass its room holds, never fewer than one.
-- do $$
-- declare r record; got bigint; bad text := '';
-- begin
--   for r in select * from (values
--       ('free', null::bigint, pg_temp.mb(300)),
--       ('free', pg_temp.mb(100), pg_temp.mb(300)),
--       ('pro', null, null),
--       ('pro', pg_temp.gb(50), pg_temp.gb(100)),
--       ('pro', pg_temp.gb(100), pg_temp.gb(200)),
--       ('pro', pg_temp.gb(200), pg_temp.gb(200)),
--       ('pro', pg_temp.gb(500), pg_temp.gb(500)),
--       ('pro', pg_temp.gb(1024), pg_temp.gb(500)),
--       ('pro', pg_temp.gb(2048), pg_temp.gb(500)),
--       ('max', pg_temp.gb(50), pg_temp.gb(100)),
--       ('event_pass', null, pg_temp.gb(50)),
--       ('event_pass', pg_temp.gb(25), pg_temp.gb(50)),
--       ('event_pass', pg_temp.gb(50), pg_temp.gb(100)),
--       ('event_pass', pg_temp.gb(75), pg_temp.gb(150)),
--       ('event_pass', pg_temp.gb(10), pg_temp.gb(50))
--     ) v(tier, cap, want)
--   loop
--     execute 'select public.upload_allowance($1::public.tier_type, $2)' into got using r.tier, r.cap;
--     if got is distinct from r.want then
--       bad := bad || format(' %s/%s=%s (want %s)', r.tier, r.cap, got, r.want);
--     end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('2 upload_allowance', bad = '', coalesce(nullif(bad, ''), '15 cases'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 upload_allowance', false, sqlerrm);
-- end $$;
--
-- -- 3. Free's month: 300 MB this calendar month; last month never counts; at the line exactly is admitted, a byte past
-- -- it is refused by both writers in the new words, the meter refuses it early, and the three advisories say full.
-- do $$
-- declare a text; b text; c text; m1 text; m2 text; f text;
-- begin
--   perform pg_temp.reset('free', null);
--   perform pg_temp.ledger(pg_temp.gb(10), to_char(now() - interval '1 month', 'YYYY-MM'));
--   perform pg_temp.ledger(pg_temp.mb(300) - 1000);
--   m1 := pg_temp.meter(1000);
--   a := pg_temp.put(1000, 'guest');
--   m2 := pg_temp.meter(1);
--   b := pg_temp.put(1, 'host');
--   c := pg_temp.put(1, 'guest');
--   f := pg_temp.full3();
--   insert into proof (step, ok, detail) values ('3 free month',
--     m1 = 'ok' and a = 'recorded' and m2 = 'monthly'
--       and b = '23514 Upload limit reached for this plan.' and c = '23514 Upload limit reached for this plan.'
--       and f = 'context true, gate true, host true',
--     format('meter %s; at the line %s; meter past %s; host %s; guest %s; %s', m1, a, m2, b, c, f));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 free month', false, sqlerrm);
-- end $$;
--
-- -- 4. Pro by size: each Ladder A size's own number a month, and the retired sizes' at the smallest size holding them;
-- -- a Pro profile with no cap on record is unmetered.
-- do $$
-- declare r record; a text; b text; m text; bad text := ''; u text;
-- begin
--   for r in select * from (values
--       (pg_temp.gb(50), pg_temp.gb(100)),
--       (pg_temp.gb(200), pg_temp.gb(200)),
--       (pg_temp.gb(1024), pg_temp.gb(500)),
--       (pg_temp.gb(100), pg_temp.gb(200)),
--       (pg_temp.gb(2048), pg_temp.gb(500))
--     ) v(cap, allowance)
--   loop
--     perform pg_temp.reset('pro', r.cap);
--     perform pg_temp.ledger(r.allowance - 1000);
--     a := pg_temp.put(1000, 'host');
--     m := pg_temp.meter(1);
--     b := pg_temp.put(1, 'guest');
--     if not (a = 'recorded' and m = 'monthly' and b = '23514 Upload limit reached for this plan.') then
--       bad := bad || format(' cap %s: %s / %s / %s;', r.cap, a, m, b);
--     end if;
--   end loop;
--   perform pg_temp.reset('pro', null);
--   perform pg_temp.ledger(pg_temp.gb(5000));
--   u := pg_temp.put(1000, 'host');
--   if u <> 'recorded' then bad := bad || ' no cap: ' || u; end if;
--   insert into proof (step, ok, detail) values ('4 pro by size', bad = '', coalesce(nullif(bad, ''), '5 sizes and no cap'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 pro by size', false, sqlerrm);
-- end $$;
--
-- -- 5. A pass's year: counted on the pass, never the month; at the line exactly is admitted, a byte past it refused; the
-- -- meter and the advisories agree; every upload still lands in the month's ledger as well.
-- do $$
-- declare p uuid; a text; b text; m text; f text; led bigint;
-- begin
--   perform pg_temp.reset('event_pass', pg_temp.gb(25));
--   p := pg_temp.pass(-interval '200 days', interval '165 days', pg_temp.gb(50) - 1000);
--   perform pg_temp.ledger(pg_temp.gb(10));
--   a := pg_temp.put(1000, 'guest');
--   m := pg_temp.meter(1);
--   b := pg_temp.put(1, 'host');
--   f := pg_temp.full3();
--   select cumulative_bytes into led from public.storage_ledger
--    where host_id = pg_temp.fx('host') and period = to_char(now(), 'YYYY-MM');
--   insert into proof (step, ok, detail) values ('5 pass year',
--     a = 'recorded' and m = 'monthly' and b = '23514 Upload limit reached for this plan.'
--       and f = 'context true, gate true, host true'
--       and pg_temp.counted(p) = pg_temp.gb(50) and led = pg_temp.gb(10) + 1000,
--     format('at the line %s; meter %s; past %s; %s; the pass %s; the month %s', a, m, b, f, pg_temp.counted(p), led));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 pass year', false, sqlerrm);
-- end $$;
--
-- -- 6. A stack: 50 GB a pass for two passes; an upload counts on the pass that ends soonest; past the stack's sum refused.
-- do $$
-- declare a1 uuid; b1 uuid; a text; b text;
-- begin
--   perform pg_temp.reset('event_pass', pg_temp.gb(50));
--   a1 := pg_temp.pass(-interval '355 days', interval '10 days', pg_temp.gb(60));
--   b1 := pg_temp.pass(-interval '65 days', interval '300 days', pg_temp.gb(40) - 1000);
--   a := pg_temp.put(1000, 'host');
--   b := pg_temp.put(1, 'guest');
--   insert into proof (step, ok, detail) values ('6 a stack',
--     a = 'recorded' and b = '23514 Upload limit reached for this plan.'
--       and pg_temp.counted(a1) = pg_temp.gb(60) + 1000 and pg_temp.counted(b1) = pg_temp.gb(40) - 1000,
--     format('at the line %s; past %s; soonest %s; later %s', a, b, pg_temp.counted(a1), pg_temp.counted(b1)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 a stack', false, sqlerrm);
-- end $$;
--
-- -- 7. What never counts and is never charged: an ended pass, a consumed pass, a renewal whose year has not opened.
-- -- And a pass the nightly sweep has not caught up with yet (her profile still a pass's, no window live) fails open.
-- do $$
-- declare live uuid; ended uuid; used uuid; ahead uuid; a text; b text; lc bigint;
-- begin
--   perform pg_temp.reset('event_pass', pg_temp.gb(25));
--   live := pg_temp.pass(-interval '10 days', interval '355 days');
--   ended := pg_temp.pass(-interval '400 days', -interval '1 day', pg_temp.gb(49));
--   used := pg_temp.pass(-interval '20 days', interval '345 days', pg_temp.gb(49), true);
--   ahead := pg_temp.pass(interval '355 days', interval '720 days', 0, false, 'renewal');
--   a := pg_temp.put(pg_temp.gb(2), 'host');
--   lc := pg_temp.counted(live);
--   delete from public.event_passes where id = live;
--   b := pg_temp.put(1000, 'guest');
--   insert into proof (step, ok, detail) values ('7 never counted',
--     a = 'recorded' and lc = pg_temp.gb(2) and b = 'recorded'
--       and pg_temp.counted(ended) = pg_temp.gb(49) and pg_temp.counted(used) = pg_temp.gb(49)
--       and pg_temp.counted(ahead) = 0,
--     format('2 GB %s, on the live pass %s; lapsed, unswept %s; ended %s, consumed %s, ahead %s',
--       a, lc, b, pg_temp.counted(ended), pg_temp.counted(used), pg_temp.counted(ahead)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 never counted', false, sqlerrm);
-- end $$;
--
-- -- 8. Every grant: the new functions the service role's alone, tier_limits as it stood, the six restated bodies' ACLs
-- -- unchanged, the multiplier gone, the new column no client role's.
-- do $$
-- declare r record; got text; bad text := '';
-- begin
--   for r in select * from (values
--       ('public.tier_limits(public.tier_type)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.upload_allowance(public.tier_type, bigint)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.uploads_used(uuid, public.tier_type)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.meter_upload(uuid, public.media_type, bigint)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.get_upload_context(text, public.media_type)', 'anon:EXECUTE authenticated:EXECUTE postgres:EXECUTE service_role:EXECUTE'),
--       ('public.get_upload_gate(uuid, text, uuid)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.get_host_upload_context(uuid, public.media_type)', 'authenticated:EXECUTE postgres:EXECUTE service_role:EXECUTE')
--     ) v(fn, want)
--   loop
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' '
--                       order by a.grantee::regrole::text || ':' || a.privilege_type) into got
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     if got is distinct from r.want then bad := bad || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   if to_regprocedure('public.monthly_ingress_cap(public.tier_type, bigint)') is not null then
--     bad := bad || ' monthly_ingress_cap still defined;';
--   end if;
--   if has_table_privilege('anon', 'public.event_passes', 'SELECT')
--      or has_table_privilege('authenticated', 'public.event_passes', 'SELECT') then
--     bad := bad || ' event_passes readable by a client role;';
--   end if;
--   begin
--     if has_column_privilege('authenticated', 'public.event_passes', 'uploaded_bytes', 'SELECT')
--        or has_column_privilege('authenticated', 'public.event_passes', 'uploaded_bytes', 'UPDATE') then
--       bad := bad || ' uploaded_bytes granted to authenticated;';
--     end if;
--   exception when others then
--     bad := bad || ' no uploaded_bytes column;';
--   end;
--   insert into proof (step, ok, detail) values ('8 grants', bad = '', coalesce(nullif(bad, ''), 'every grant as named'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 grants', false, sqlerrm);
-- end $$;
--
-- -- 9. Shapes: each body's language, volatility, security mode and empty search_path; the column's type, default and
-- -- check.
-- do $$
-- declare r record; got text; bad text := ''; c record;
-- begin
--   for r in select * from (values
--       ('public.tier_limits(public.tier_type)', 'sql i invoker'),
--       ('public.upload_allowance(public.tier_type, bigint)', 'sql i invoker'),
--       ('public.uploads_used(uuid, public.tier_type)', 'sql s invoker'),
--       ('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'plpgsql v definer'),
--       ('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'plpgsql v definer'),
--       ('public.meter_upload(uuid, public.media_type, bigint)', 'plpgsql v definer'),
--       ('public.get_upload_context(text, public.media_type)', 'plpgsql s definer'),
--       ('public.get_upload_gate(uuid, text, uuid)', 'plpgsql s definer'),
--       ('public.get_host_upload_context(uuid, public.media_type)', 'plpgsql s definer')
--     ) v(fn, want)
--   loop
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end
--       into got
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if got is distinct from r.want then bad := bad || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   select data_type, is_nullable, column_default into c from information_schema.columns
--    where table_schema = 'public' and table_name = 'event_passes' and column_name = 'uploaded_bytes';
--   if not found then bad := bad || ' no uploaded_bytes column;';
--   elsif c.data_type <> 'bigint' or c.is_nullable <> 'NO' or c.column_default <> '0' then
--     bad := bad || format(' column %s/%s/%s;', c.data_type, c.is_nullable, c.column_default);
--   end if;
--   begin
--     insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source)
--     values (pg_temp.fx('host'), now(), now() + interval '1 day', 0, 'initial');
--     execute 'update public.event_passes set uploaded_bytes = -1 where profile_id = $1' using pg_temp.fx('host');
--     bad := bad || ' a negative count was accepted;';
--   exception when check_violation then null;
--   end;
--   insert into proof (step, ok, detail) values ('9 shapes', bad = '', coalesce(nullif(bad, ''), '9 bodies and the column'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('9 shapes', false, sqlerrm);
-- end $$;
--
-- -- 10. The bodies are this file's: each prosrc, whitespace collapsed, hashes as the file's own text does.
-- do $$
-- declare r record; got text; bad text := '';
-- begin
--   for r in select * from (values
--       ('tier_limits', '134a9d0010f5bfa8cec1a782b8243170'),
--       ('upload_allowance', '55c7fef03305f30623cf283499be220d'),
--       ('uploads_used', 'a5c98a2f6218f34dac6c474fb920f358'),
--       ('create_media', '001a2fb25f037d9771e01937ff1ebe62'),
--       ('create_media_as_host', 'aaebac71ce6ffca96bbace4cd4f613e8'),
--       ('meter_upload', '00a25a0325274c2263ff6629e02b9af5'),
--       ('get_upload_context', 'efacd3e71988c0b75287e2a7458120e2'),
--       ('get_upload_gate', '940a580ebb39e76c6c9fcdf98ca7178e'),
--       ('get_host_upload_context', '9595099976250f04f29f456b5a4b3a5f')
--     ) v(fn, want)
--   loop
--     select md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) into got
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = r.fn;
--     if got is distinct from r.want then bad := bad || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('10 bodies', bad = '', coalesce(nullif(bad, ''), '9 hashes, the file''s own'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('10 bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
