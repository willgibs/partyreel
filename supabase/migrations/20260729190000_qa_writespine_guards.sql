-- QA write-spine — harden the guest upload write path (adversarial review 2026-07-29).
--
-- PENDING-APPLY. At apply time: (1) diff EVERY replaced body below against live
-- `pg_get_functiondef` and reconcile drift FIRST (the repo file can lag live); (2) apply_migration
-- verbatim; (3) get_advisors; (4) run the rolled-back contract check at the bottom; (5) regenerate
-- src/lib/db/types.ts and drop the ONE pre-apply typing seam (the create_guest Args intersection
-- in src/lib/db/mutations/guest.ts).
--
-- PRE-FLIGHT ALREADY DONE (2026-07-29, so step 2 is not the first time this SQL is parsed): this
-- file was applied VERBATIM to a throwaway local PostgreSQL 17.10 cluster carrying a faithful
-- stand-in for the schema it touches (the real column types/defaults/constraints, the Supabase
-- roles, an auth.uid()/auth.users stub, the CURRENT bodies of every replaced function, the live
-- events + media trigger sets, and the touched grant state). Result: clean apply, and the contract
-- check passed VERBATIM — the password-without-proof / private / open mint matrix, the visibility
-- key on get_upload_context, the grant survivals, `for update` present in all five cap
-- definitions, plus exec probes THROUGH each lock (create_media happy path; restore_media honoring
-- the provenance target; restore_event whose ACT re-fired the locked un-delete trigger in the same
-- txn, confirming the re-lock is a no-op) and a TWO-SESSION probe in which a concurrent
-- create_media blocked ~1.5s on a held profiles lock before admitting — the serialization working.
-- It does NOT validate against live DRIFT, which is why step 1 stands.
--
-- EXPECTED ADVISOR DELTA: NONE. No new tables, no new RPCs. Specifically: get_upload_context
-- STAYS in lint 0028 (anon READ, by design — the grant below re-asserts it; do NOT service-role
-- it); restore_media / restore_event / get_host_upload_context stay in 0029 (authenticated);
-- create_media / create_media_as_host / create_guest stay service-role-only (in NEITHER list);
-- enforce_event_limit is a trigger function and must appear in neither.
--
-- Closes two findings (QA #6 is code-only and ships in the same round's app diff):
--
--   #17 cap row locks   — every capacity decision (storage cap, monthly ingress, event slots) was
--                         check-then-act with NO serialization, so two concurrent uploads (or
--                         restores, or event creates) under the same host could each read N-1 and
--                         both admit — over-cap admission by racing. Pattern D. The natural mutex
--                         is the host's profiles row (exactly one per host, always present; the
--                         aggregates themselves cannot be row-locked): every cap RPC now takes
--                         `for update` on it BEFORE reading the aggregate, so concurrent writers
--                         for one host serialize and the second reads the first's committed rows.
--                         This is the row lock QA Q3 explicitly deferred (20260729180000:203-206).
--   #18 locked uploads  — ADR-0023 ruling 2: the WRITE path must inherit the READ gate. A
--                         password/private event gated viewing but not uploading: create_guest
--                         minted a session for any link-holder, and an already-minted token kept
--                         presigning/completing forever even after the host locked the event (the
--                         exact remediation for a leaked link). create_guest now refuses `private`
--                         outright and requires proof-of-unlock for `password`; get_upload_context
--                         now returns `visibility` so the presign/complete routes can re-check the
--                         lock per request (the route gates are the primary enforcement; the RPC
--                         param is the belt so a future second caller cannot skip it).
--
-- ★ LOCK-ORDERING WHY (read before adding any lock): each function below takes exactly ONE
-- profiles-row lock (the host's) as its first lock, before touching media/ledger/events. Single
-- lock, single order — no deadlock is constructible. restore_event's ACT (the un-delete UPDATE)
-- re-fires enforce_event_limit via events_enforce_limit_on_undelete, which locks the SAME profiles
-- row in the SAME transaction — a same-txn re-lock is a no-op, not a deadlock. Keep it that way:
-- never lock a second host's profiles row inside these bodies.
--
-- DEPLOY WINDOW (state it, don't discover it): this applies BEFORE the app code deploys (house
-- ordering). In that window the deployed code calls create_guest WITHOUT p_unlock_proven, so the
-- default false means password-event guest mints refuse platform-wide until the new code is live.
-- Accepted: pre-launch, test data only, and the window is one session (apply at integration, alias
-- minutes later, M1.5 prod the same sitting). Open events — every real test album — are unaffected.
-- Do NOT stretch this window.

-- ---------------------------------------------------------------------------------------------
-- #17 — create_media: the host-profiles snapshot read gains `for update`. Body otherwise
-- reproduced from 20260729150000 (QA #1 preview-key binding KEPT — a file guard pins it).
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

-- ---------------------------------------------------------------------------------------------
-- #17 — create_media_as_host: same lock on the same snapshot read. Body from 20260729150000.
-- ---------------------------------------------------------------------------------------------
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
-- #17 — restore_media: the capacity re-admission check takes the same lock. Body from
-- 20260729180000 (the provenance refusals + honest-restore target — ALL KEPT, file-guard pinned).
-- ---------------------------------------------------------------------------------------------
create or replace function public.restore_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media;
  v_event public.events;
  v_profile public.profiles;
  v_cap bigint;
  v_active bigint;
  v_target public.media_status;
begin
  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false;   -- a guest's self-deletion is private to the host
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_event from public.events where id = v_media.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'event_deleted'); -- restore the event first
  end if;
  if v_media.status <> 'removed' then
    return jsonb_build_object('ok', false, 'reason', 'not_removed');
  end if;
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;
  if v_media.removed_by_admin then
    return jsonb_build_object('ok', false, 'reason', 'admin_removed'); -- QA #8: operators only
  end if;

  -- QA #17: lock the host's profiles row so a restore racing an upload (or another restore)
  -- cannot both read the same active-bytes figure and both admit.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  v_cap := coalesce(v_profile.storage_cap_bytes,
                    (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
  if v_cap is not null then
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_media.file_size_bytes > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_media.file_size_bytes) - v_cap);
    end if;
  end if;

  -- QA #24: back to where it was, not a blanket 'approved' (a hidden item stays hidden, a pending
  -- item stays pending). Pre-Q3 rows carry no stamp -> 'approved', the historical behavior.
  v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
  if v_target = 'removed' then
    v_target := 'approved'::public.media_status;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left).
  update public.media set status = v_target, removed_at = null
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true, 'status', v_target);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- #17 — restore_event: lock the caller's profiles row before the slot + capacity gates. Body from
-- 20260604031713. The ACT below re-fires enforce_event_limit (the un-delete trigger), which
-- re-locks the SAME row in the SAME transaction — a no-op (see the lock-ordering header).
-- ---------------------------------------------------------------------------------------------
create or replace function public.restore_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- QA #17: `for update` on the host's own profiles row (host_id = auth.uid() here, proven by the
  -- select above) serializes the slot count + capacity gate against concurrent restores/creates.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  if v_limits.max_events is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_limits.max_events then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_limits.max_events);
    end if;
  end if;

  -- Capacity gate on the media that RE-ACTIVE when deleted_at clears (non-removed in this event).
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    select coalesce(sum(file_size_bytes), 0)::bigint into v_returning
      from public.media where event_id = p_event_id and status <> 'removed';
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_returning > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_returning) - v_cap);
    end if;
  end if;

  update public.events set deleted_at = null, purge_at = null
    where id = p_event_id and deleted_at is not null;

  select count(*) into v_still_removed from public.media
    where event_id = p_event_id and status = 'removed';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- #17 — enforce_event_limit: the per-tier event-slot ceiling was pure check-then-act (both the
-- INSERT trigger and Q3's un-delete trigger), so two concurrent creates could each count N-1 and
-- both land. Lock the host's profiles row FIRST — same mutex, same single-lock order as the cap
-- RPCs above. The two trigger DEFINITIONS (events_enforce_limit, events_enforce_limit_on_undelete)
-- are unchanged; replacing the function body is enough. Body from 20260529003529.
-- ---------------------------------------------------------------------------------------------
create or replace function public.enforce_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_type;
  v_max integer;
  v_count integer;
begin
  -- QA #17: serialize concurrent slot decisions for this host before counting.
  perform 1 from public.profiles where id = new.host_id for update;

  select tier into v_tier from public.profiles where id = new.host_id;
  select max_events into v_max from public.tier_limits(v_tier);

  if v_max is not null then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and deleted_at is null;

    if v_count >= v_max then
      raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- Trigger functions are client-invisible machinery (20260529003631; the MCP anon-grant landmine).
revoke execute on function public.enforce_event_limit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- #18 — create_guest: refuse the mint the read gate would refuse. New p_unlock_proven parameter
-- (signature change -> drop + recreate). Body otherwise from 20260608230000.
-- ---------------------------------------------------------------------------------------------
drop function public.create_guest(text, uuid);

create function public.create_guest(
  p_qr_token text,
  p_user_id uuid default null,
  p_unlock_proven boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := p_user_id; -- the /api/guests route's getUser()-verified id (admin client has no auth.uid())
  v_email text;
  v_confirmed timestamptz;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- QA #18 (ADR-0023 ruling 2): the write path inherits the read gate. `private` NEVER mints — the
  -- /e/ page master-locks everyone including the owner (owner uploads ride the host routes), so a
  -- guest session for a private event has no legitimate caller. `password` requires proof of
  -- unlock: the route derives p_unlock_proven server-side (the HttpOnly unlock cookie, or event
  -- ownership — the owner reads the album without unlocking, so they upload without it too). The
  -- DB cannot read cookies, so this param is a belt against a FUTURE second caller skipping the
  -- route gate, not a client-forgeable input (create_guest stays service-role-only).
  if v_event.visibility = 'private' then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) then
    raise exception 'This event is locked. Enter the event password to upload.' using errcode = 'check_violation';
  end if;

  -- Verified email is SERVER-sourced: read auth.users for the trusted uid (definer privilege), never the
  -- client. (This is what closes the email-poisoning surface alongside capture_guest_email's new route.)
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- When the host disallows anonymous uploads, an account (a confirmed session) is required to upload.
  if not v_event.allow_anonymous_uploads and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires an account to upload.' using errcode = 'check_violation';
  end if;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id
  );
end;
$function$;

-- Service-role-only, as before (ADR-0016): the /api/guests route is the sole caller.
revoke execute on function public.create_guest(text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean) to service_role;

-- ---------------------------------------------------------------------------------------------
-- #18 — get_upload_context: expose the event's visibility so the guest presign/complete routes
-- can re-check the lock on EVERY request. This is what stops a grandfathered session token the
-- moment a host locks the event (the mint gate alone would let pre-lock tokens upload forever).
-- Disclosure is nil: the /e/ page already shows lock state to any link-holder. Same signature,
-- same jsonb return -> deployed code ignores the extra key during the deploy window. Body from
-- 20260707120000.
-- ---------------------------------------------------------------------------------------------
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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Already over the monthly ingress meter? (Free static / paid derived — ADR-0021.)
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media). The
  -- per-upload ceiling is the host cap clamped to the universal 10 GiB (never remaining bytes).
  -- QA #18: `visibility` lets the guest routes re-check the password/private lock per request.
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free'),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes))
  );
end;
$$;

-- ⚠️ 0028 landmine: get_upload_context is one of the FOUR anon READ RPCs (the session token IS the
-- authorization, ADR-0004). Anon (guests) + authenticated (a logged-in host acting as a guest) may
-- call it — re-assert, do NOT service-role it. Expect it to remain in the anon advisor list.
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Consistency fold-in — get_host_upload_context still read the STATIC v_limits.monthly_ingress_bytes,
-- which is NULL for every paid tier under ADR-0021, so the host presign advisory at_monthly_cap was
-- dead for paid hosts (enforcement in create_media_as_host is correct; only the advisory drifted).
-- Read the derived bound like the guest path above. Body from 20260604002059.
-- ---------------------------------------------------------------------------------------------
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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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

  -- The advisory mirrors the authoritative check in create_media_as_host: Free = the static
  -- 20 GB meter; paid = 3x the effective storage cap (ADR-0021). NULL = unmetered.
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media_as_host.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
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

-- Authenticated-family (lint 0029), as before.
revoke execute on function public.get_host_upload_context(uuid, public.media_type) from public, anon, authenticated;
grant execute on function public.get_host_upload_context(uuid, public.media_type) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER apply; nothing persists — it ends
-- in RAISE EXCEPTION). Rides an EXISTING event by UPDATE-ing its visibility inside the txn — never
-- INSERT an event in a check (enforce_event_limit trips, the Q1 lesson). Setting
-- visibility='password' requires event_password_hash (events_password_requires_hash), so both are
-- set together. Runs unimpersonated (postgres): the Q3 transition guard self-exempts for non-client
-- roles, so the UPDATEs pass. Fill in a real OPEN test event id before running.
-- ---------------------------------------------------------------------------------------------
-- do $$
-- declare
--   v_event_id uuid := '<an EXISTING open test event id>';
--   v_qr text;
--   v_mint jsonb;
--   v_token text;
--   v_ctx jsonb;
--   v_guests_before bigint;
--   v_guests_after bigint;
--   v_fn text;
-- begin
--   select qr_token into v_qr from public.events where id = v_event_id;
--   if v_qr is null then raise exception 'FAIL: fill in a real event id'; end if;
--   select count(*) into v_guests_before from public.guests;
--
--   -- Make the ride-along event password-locked + anonymous-friendly for the txn.
--   update public.events
--     set visibility = 'password', event_password_hash = 'contract-check-hash',
--         allow_anonymous_uploads = true
--     where id = v_event_id;
--
--   -- #18: password without proof -> refused.
--   begin
--     perform public.create_guest(v_qr, null, false);
--     raise exception 'FAIL: password mint accepted without proof';
--   exception when check_violation then
--     raise notice 'OK: password mint refused without proof';
--   end;
--
--   -- #18: password WITH proof -> mints.
--   v_mint := public.create_guest(v_qr, null, true);
--   v_token := v_mint->>'session_token';
--   raise notice 'OK: password mint accepted with proof';
--
--   -- #18: get_upload_context now reports visibility (and anon still holds EXECUTE).
--   v_ctx := public.get_upload_context(v_token, 'photo');
--   if v_ctx->>'visibility' is distinct from 'password' then
--     raise exception 'FAIL: get_upload_context visibility = %', v_ctx->>'visibility';
--   end if;
--   raise notice 'OK: get_upload_context returns visibility';
--   if not has_function_privilege('anon', 'public.get_upload_context(text, public.media_type)', 'execute') then
--     raise exception 'FAIL: anon lost EXECUTE on get_upload_context';
--   end if;
--   if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean)', 'execute')
--      or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean)', 'execute') then
--     raise exception 'FAIL: create_guest is not service-role-only';
--   end if;
--   raise notice 'OK: grants hold (anon reads context; create_guest service-role-only)';
--
--   -- #18: private -> refused even with "proof".
--   update public.events set visibility = 'private' where id = v_event_id;
--   begin
--     perform public.create_guest(v_qr, null, true);
--     raise exception 'FAIL: private mint accepted';
--   exception when check_violation then
--     raise notice 'OK: private mint refused';
--   end;
--
--   -- #18: open -> mints with the DEFAULT (old-code calling convention).
--   update public.events set visibility = 'open', event_password_hash = null where id = v_event_id;
--   perform public.create_guest(v_qr);
--   raise notice 'OK: open mint unaffected';
--
--   -- #17: the row lock is present in every cap definition.
--   for v_fn in
--     select unnest(array['create_media', 'create_media_as_host', 'restore_media',
--                         'restore_event', 'enforce_event_limit'])
--   loop
--     if not exists (
--       select 1 from pg_proc p
--       join pg_namespace n on n.oid = p.pronamespace
--       where n.nspname = 'public' and p.proname = v_fn and p.prosrc ilike '%for update%'
--     ) then
--       raise exception 'FAIL: % lost its for-update row lock', v_fn;
--     end if;
--   end loop;
--   raise notice 'OK: for-update present in all five cap definitions';
--
--   select count(*) into v_guests_after from public.guests;
--   raise notice 'guests before=% after=% (rollback discards the delta)', v_guests_before, v_guests_after;
--   raise exception 'ROLLBACK_OK';
-- exception when others then
--   if sqlerrm = 'ROLLBACK_OK' then raise notice 'contract check passed, rolled back';
--   else raise; end if;
-- end $$;
