-- =============================================================================================
-- DELETED COUNTS IN STORAGE (lane `trash-in-storage`, Will 2026-10-03: "Let's include trash in storage ... they only
-- ones who would be frustrated by not being able to use more that your full active storage space would be those
-- looking to abuse anyway. if you'd rather not have to delete permanently from your trash to free space, upgrade your
-- plan."). A plan's cap now holds everything a host keeps, her albums and her Deleted together, so a delete frees
-- nothing until an item leaves Deleted for good: her own Delete permanently or Empty Deleted, the 30-day purge, or, with
-- her setting on (the default), the oldest of Deleted making room for an upload that needs it. Restore always fits,
-- since what comes back is already counted. The standby budget (Deleted's own second cap, evicted nightly) and the
-- re-delete guard it would have needed both go: one number, everything kept, under the cap.
--
--   1. `profiles.make_room_from_deleted` (on by default, hers to write): Make room from Deleted.
--   2. Deleted, defined ONCE: `host_deleted_media(uuid)`, item by item, exactly what her two Deleted lists show, each
--      with when it entered Deleted. `host_storage_summary(uuid)` (DROP + CREATE: it gains `system_bytes`, the part
--      the over-capacity reduce put there) sums it beside `host_active_bytes`: the one read every figure she sees,
--      the storage guard and every cap check below make.
--   3. `host_room_used(uuid)`: the line an upload meets, what she keeps less Deleted while her setting lets an upload
--      make room from it. The presign's meter refuses past it; the three upload advisories answer "full" at it.
--   4. `leave_deleted(uuid, bigint, boolean)`: the one way out of Deleted ahead of its 30 days, oldest first, each item
--      asked (`purge_asked_at`) so its bytes stop counting at once and the night's purge deletes it, R2 first; an event
--      it empties leaves with its last item. `empty_deleted()`: the storage chart's Empty Deleted, all of it.
--   5. `create_media` and `create_media_as_host` (create or replace, signatures unchanged): the cap and its 10% read
--      everything stored; with the setting on and the file fitting beside what she keeps, `leave_deleted` frees what
--      the file needs, under the profiles lock they already take, and a refusal rolls any eviction back with it.
--   6. `meter_upload`: the room is `host_room_used`'s line, and a refusal carries `needed_bytes`, `deleted_bytes` and
--      `makes_room` for the owner's own words (the deployed parser reads only `ok` and `reason`).
--   7. `get_upload_context`, `get_upload_gate`, `get_host_upload_context`: "full" at the same line, so Require an upload
--      to view still fails open exactly when no upload can land.
--   8. `restore_media`, `restore_event`, `let_back_in`: no capacity gate, but for the over-capacity reduce's own
--      removals (what she keeps by choice plus the item, against the base cap, so an over-cap account cannot restore
--      its way back over); an item or event past its 30 days, or asked to leave, is no longer hers to bring back; each
--      takes the host's profiles row FIRST, so a restore and an upload's eviction never act on one row at once.
--      (`let_back_in` also stops trying to restore an asked row, which its CHECK refused with an error.)
--   9. `set_media_purge_at`: a guest's own withdrawal purges that night in every album (20261002200000 began it for a
--      camera's shot): it sits in no Deleted and counts in no plan, so nothing waits on it. A hold, an open report and
--      `kept_media_ids` keep it as they keep any row. Withdrawals made before the apply keep the window they were given.
--  10. `media.purge_asked_at`'s comment names its new writers.
--
-- WHAT DOES NOT CHANGE: no table gains a client grant but the one column above; no policy moves; `purge_media_now`,
-- `purge_media_rows`, `kept_media_ids` and the removed_media sweep's asked pass (which already deletes an asked row the
-- night nothing keeps it) are untouched; the monthly ingress meter still counts every upload and never refunds one;
-- `host_active_bytes` keeps its one definition of what her albums hold.
--
-- AN EXPAND, SO THE DEPLOYED BUILDS KEEP WORKING (milestone 34 on partyreel.com, build 50 on the alias, both on this
-- database): `host_storage_summary` keeps `active_bytes` and `standby_bytes` with their meanings (its readers take
-- fields by name, and `system_bytes` is a third they never ask for), and `standby_hosts` stays as it stands, so their
-- nightly standby sweep keeps running (it evicts Deleted past one cap, which the new cap leaves almost nothing to do).
-- What milestone 34 meets between the apply and the next milestone: the new cap on uploads (Deleted counts; with the
-- setting on by default, the oldest of Deleted makes room for an upload, so no party is refused by a full Deleted);
-- a restore with no capacity refusal; a guest's withdrawal purging that night; an event emptied of Deleted leaving its
-- Deleted list. Its own meter still prints active bytes and "+ X in Deleted (frees automatically)", and its storage
-- guard still reads active bytes (so it could sell a size that holds her albums but not her Deleted: she would then be
-- over and her uploads would take room from Deleted), until the lane's build ships. The contract migration after that
-- milestone drops `standby_hosts` (the lane's Deferred line).
--
-- ★ APPLY BEFORE THE LANE'S BUILD DEPLOYS: its code calls `empty_deleted` and `leave_deleted`, reads `system_bytes` and
-- writes `make_room_from_deleted`, each a 404 or a 42703 without this file. The deployed builds are safe on either side.
--
-- LOCKS AT APPLY: `profiles` (one ADD COLUMN with a constant default: metadata only, no rewrite, ACCESS EXCLUSIVE for an
-- instant) and catalog writes for the functions. No hot table is rewritten and no index is built.
--
-- ADVISORS (security): 19 / 4 / 35 -> 19 / 4 / 36: `empty_deleted` is an authenticated SECURITY DEFINER, so lint 0029
-- gains it (by design: Empty Deleted is the host's own act, authorized on auth.uid() inside). Every other new function is
-- the service role's or the owner's alone, in neither list; no table, policy or anon grant is added.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: md5 of each whitespace-collapsed prosrc this file replaces, as the repo leaves them (checked
--       live 2026-10-03): create_media e83666cdb565e7d631f33088ea97b276, create_media_as_host
--       21f0397fdb4ec7e6c46137163a7fb2de, meter_upload d13b9822f08880bd0375d01c7f660ef2, get_upload_context
--       69835576865f82eb5722523b17d8f4bb, get_upload_gate 15cbac05a0b77cc36b5406e1a6cb3c4a, get_host_upload_context
--       3271cdde311f5500f3304b3a442c9dce, restore_media a7eb3bbc2ea38628d8beef16088d67d0, restore_event
--       f5b7cc0071a75e2ffc982e8bb46b993d, let_back_in d8836dde6997819a1b0061b8f5705cbd, set_media_purge_at
--       14846b44a7e4157606e7867904627567, host_storage_summary c5d0716b8db9b2b592b3a8f0d300f759; and
--       `profiles.make_room_from_deleted`, `host_deleted_media`, `host_room_used`, `leave_deleted` and `empty_deleted`
--       do not exist.
--   (2) The rolled-back proof at the foot, in one execute_sql call (red without this file's statements, green with).
--   (3) Apply verbatim.  (4) get_advisors (security): the delta above.
--   (5) Regenerate src/lib/db/types.ts (profiles gains `make_room_from_deleted`; `host_storage_summary` gains
--       `system_bytes`; `empty_deleted`, `leave_deleted`, `host_room_used` and `host_deleted_media` appear), then drop
--       the lane's typed seams named in its handoff.
-- =============================================================================================

-- =============================================================================================
-- 1. Her setting: Make room from Deleted.
-- =============================================================================================
alter table public.profiles
  add column make_room_from_deleted boolean not null default true;

comment on column public.profiles.make_room_from_deleted is
  'Make room from Deleted (trash-in-storage, on by default): when an upload needs room under her cap, the oldest items in Deleted leave for good first (create_media* through leave_deleted), and the presign''s meter and the upload advisories leave Deleted out of the line an upload meets (host_room_used). Off, Deleted keeps everything for its 30 days and an upload that does not fit is refused. Hers to write: the one column grant below.';

-- Additive, as a host-writable column takes it (database-security.md): the table's UPDATE is already column-locked, so
-- this names one more column beside announcements_seen_at and welcomed_at, and her own row is all RLS lets her reach.
grant update (make_room_from_deleted) on public.profiles to authenticated;

-- =============================================================================================
-- 2. Deleted, defined once, and the one aggregate every figure and every cap check reads.
-- =============================================================================================
-- What her Deleted holds, item by item: exactly what her two Deleted lists show (each album's Deleted and the
-- dashboard's deleted events), each with the moment it entered Deleted. Never a guest's own withdrawal (final, for her
-- too), never an operator's removal (it left her view entirely), never a row asked to leave for good
-- (`purge_asked_at`), and nothing past its 30 days or inside an event past its own (the night's purge takes those).
-- Inside is from the window's start on (`>=`), as both lists read it. A held row counts while it is listed, as any
-- other, since a figure that skipped it would tell her a hold exists.
-- `binned_at` is the earlier of the item's removal and its event's deletion: the order Deleted empties in.
create function public.host_deleted_media(p_host_id uuid)
returns table (media_id uuid, file_size_bytes bigint, binned_at timestamptz, by_system boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id, m.file_size_bytes, least(m.removed_at, e.deleted_at), m.removed_by_system
    from public.media m
    join public.events e on e.id = m.event_id
   where e.host_id = p_host_id
     and (
       (m.status = 'removed'
          and not m.removed_by_uploader
          and not m.removed_by_admin
          and m.purge_asked_at is null
          and m.removed_at >= now() - interval '30 days'
          and (e.deleted_at is null or e.deleted_at >= now() - interval '30 days'))
       or (m.status <> 'removed' and e.deleted_at >= now() - interval '30 days')
     );
$$;

-- The owner's alone (database-security.md): only the definer bodies below read it, so no role PostgREST serves can
-- name it, nor page past its row cap.
revoke all on function public.host_deleted_media(uuid) from public, anon, authenticated, service_role;

comment on function public.host_deleted_media(uuid) is
  'Her Deleted, item by item (trash-in-storage): her own removals and the system''s inside their 30 days, and a deleted event''s own media inside the event''s 30 days; never a guest''s withdrawal, an operator''s removal or an asked row. binned_at is when each entered Deleted (the earlier of its removal and its event''s deletion), the order leave_deleted takes them in; by_system marks the over-capacity reduce''s removals. The one definition of Deleted: host_storage_summary sums it and leave_deleted drains it. The owner''s alone; SECURITY INVOKER.';

-- DROP + CREATE: a RETURNS TABLE cannot grow under create or replace (database-security.md), and it gains
-- `system_bytes`. The first two columns keep their names and meanings for the builds deployed today, which read them by
-- name: `active_bytes` is host_active_bytes (what her albums hold), `standby_bytes` (its old name, kept) is her Deleted.
drop function public.host_storage_summary(uuid);

create function public.host_storage_summary(p_host_id uuid)
returns table (active_bytes bigint, standby_bytes bigint, system_bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select public.host_active_bytes(p_host_id),
         coalesce(sum(d.file_size_bytes), 0)::bigint,
         coalesce(sum(d.file_size_bytes) filter (where d.by_system), 0)::bigint
    from public.host_deleted_media(p_host_id) d;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;
grant execute on function public.host_storage_summary(uuid) to service_role;

comment on function public.host_storage_summary(uuid) is
  'What a host stores, in one row (trash-in-storage): active_bytes (her albums, host_active_bytes), standby_bytes (her Deleted, the sum of host_deleted_media; the name kept for the deployed builds) and system_bytes (the part of Deleted the over-capacity reduce put there). Her plan''s cap holds active plus Deleted: every figure she sees, the storage guard and every cap check read this. Service-role only: the app proves the host with getUser() first.';

-- =============================================================================================
-- 3. The line an upload meets.
-- =============================================================================================
-- What a new upload must fit beside, under the cap and its 10%: everything she keeps, less Deleted while her setting
-- lets an upload make room from it (create_media* then evict exactly what the file needs). The presign's meter refuses
-- past it and the three upload advisories answer "full" at it, so none of them sends a guest to upload a file the
-- complete will refuse, nor holds one at Require an upload to view when no upload could land.
create function public.host_room_used(p_host_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select s.active_bytes + case when coalesce(p.make_room_from_deleted, true) then 0 else s.standby_bytes end
    from public.host_storage_summary(p_host_id) s
    left join public.profiles p on p.id = p_host_id;
$$;

revoke all on function public.host_room_used(uuid) from public, anon, authenticated;
grant execute on function public.host_room_used(uuid) to service_role;

comment on function public.host_room_used(uuid) is
  'The line an upload meets under the cap and its 10% (trash-in-storage): active bytes, plus Deleted unless her setting (profiles.make_room_from_deleted) lets an upload make room from it. meter_upload refuses past it; get_upload_context, get_upload_gate and get_host_upload_context answer full at it. Service-role only.';

-- =============================================================================================
-- 4. Leaving Deleted for good: the eviction, and Empty Deleted.
-- =============================================================================================
-- THE ONE WAY OUT OF DELETED AHEAD OF ITS 30 DAYS. Her Deleted, oldest first (`binned_at`; a deleted event's own items,
-- which entered together, largest first, so the fewest go), leaves for good until `p_bytes` have left (all of it when
-- null). Each item is ASKED (`purge_asked_at`; a deleted event's live item is removed in the same write, as the asked
-- CHECK requires), which takes it out of every host read, every figure and her meter at once (media_host_all,
-- host_deleted_media, media_release_meter); the removed_media sweep deletes its objects and its row that night, R2
-- first, or the night its keeper (a hold, an open report) lets go. A deleted event it empties leaves Deleted with its
-- last item: its deletion moves back a minute past the window's start (a minute, so no reader's clock, the app's
-- included, still reads it inside), so the dashboard's list, the bell, every figure and restore_event read it gone at
-- once, and the expired_events sweep takes it that night.
--   `p_system` false leaves the over-capacity reduce's own removals where they are: the reduce's first step (her own
-- Deleted goes before anything she kept) never takes back what its last run told her stays recoverable.
--   Locks: the host's profiles row first, every capacity decision's one lock order (already held inside create_media*
-- and the restores, so a restore and an eviction never act on one row at once), then only the media rows it can take
-- at once (SKIP LOCKED): a row a purge holds is leaving already, and a write holding a profiles row never waits on a
-- media row (purge_media_rows takes media before profiles).
create function public.leave_deleted(
  p_host_id uuid,
  p_bytes bigint,
  p_system boolean,
  out items integer,
  out freed_bytes bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r record;
  v_events uuid[] := '{}'::uuid[];
begin
  items := 0;
  freed_bytes := 0;
  if p_host_id is null or (p_bytes is not null and p_bytes <= 0) then
    return;
  end if;

  perform 1 from public.profiles where id = p_host_id for update;

  for r in
    select m.id, m.event_id, m.status, d.file_size_bytes
      from public.host_deleted_media(p_host_id) d
      join public.media m on m.id = d.media_id
     where coalesce(p_system, false) or not d.by_system
     order by d.binned_at, d.file_size_bytes desc, d.media_id
       for update of m skip locked
  loop
    if r.status = 'removed' then
      update public.media set purge_asked_at = now()
       where id = r.id and status = 'removed' and purge_asked_at is null;
    else
      update public.media set status = 'removed', removed_at = now(), purge_asked_at = now()
       where id = r.id and status <> 'removed';
      v_events := v_events || r.event_id;
    end if;
    if found then
      items := items + 1;
      freed_bytes := freed_bytes + r.file_size_bytes;
    end if;
    exit when p_bytes is not null and freed_bytes >= p_bytes;
  end loop;

  -- A deleted event left with nothing in Deleted leaves it too, with its last item.
  if cardinality(v_events) > 0 then
    update public.events e
       set deleted_at = now() - interval '30 days 1 minute'
     where e.id = any (v_events)
       and e.deleted_at >= now() - interval '30 days'
       and not exists (
         select 1
           from public.host_deleted_media(p_host_id) d
           join public.media m on m.id = d.media_id
          where m.event_id = e.id);
  end if;
end;
$$;

-- The service role's alone: create_media* and empty_deleted call it as the owner, and the over-capacity sweep calls it
-- on the admin client for a host it has proved over (its reduce's first step). Never a client role: it destroys.
revoke all on function public.leave_deleted(uuid, bigint, boolean) from public, anon, authenticated;
grant execute on function public.leave_deleted(uuid, bigint, boolean) to service_role;

comment on function public.leave_deleted(uuid, bigint, boolean) is
  'Her Deleted leaves for good, oldest first, until p_bytes have left (all of it when null), the over-capacity reduce''s own removals only when p_system (trash-in-storage). Each item is asked (purge_asked_at), so its bytes stop counting at once and the removed_media sweep deletes it, R2 first, that night or when its keeper lets go; a deleted event it empties leaves Deleted too. Takes the host''s profiles row first, then the media rows it can lock at once (SKIP LOCKED). Answers how many items left and their bytes. Service-role only.';

-- EMPTY DELETED (the storage chart's button): everything in her Deleted leaves for good at once, the system's own
-- removals included, and every deleted event still inside its 30 days leaves with it (one with nothing in it too).
-- Her own act on her own account: authorized on auth.uid() inside, so it is the one new authenticated definer.
create function public.empty_deleted()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_items integer;
  v_freed bigint;
  v_events integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The host's profiles row first (leave_deleted takes it again, a no-op), so the events counted are the ones that go.
  perform 1 from public.profiles where id = v_uid for update;
  select count(*) into v_events from public.events
   where host_id = v_uid and deleted_at >= now() - interval '30 days';

  select l.items, l.freed_bytes into v_items, v_freed from public.leave_deleted(v_uid, null, true) l;

  update public.events
     set deleted_at = now() - interval '30 days 1 minute'
   where host_id = v_uid
     and deleted_at >= now() - interval '30 days';

  return jsonb_build_object('ok', true, 'items', v_items, 'events', v_events, 'freed_bytes', v_freed);
end;
$$;

revoke all on function public.empty_deleted() from public, anon, authenticated;
grant execute on function public.empty_deleted() to authenticated;

comment on function public.empty_deleted() is
  'Empty Deleted (trash-in-storage): every item in the caller''s Deleted leaves for good (leave_deleted, the system''s removals included) and every deleted event inside its 30 days leaves with it. Its bytes stop counting at once; the night''s purge deletes the objects. Answers {ok, items, events, freed_bytes}, or {ok:false, reason:"unauthorized"} with no caller. Authenticated: her own act, authorized on auth.uid().';

-- =============================================================================================
-- 5. The writers: the cap holds everything stored, and Deleted makes room when her setting says so.
-- =============================================================================================
-- Each body is its 20261003110000 definition verbatim but for its two new variables and its cap block. Same
-- signatures, return types, language, volatility, security mode and empty search_path, so create or replace keeps their
-- ACLs; the grants are restated as they stand live, the service role's alone (the complete routes, on the admin
-- client).
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
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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
-- 6. The presign's meter: the line an upload meets, and a refusal with its numbers.
-- =============================================================================================
-- 20261003210500's body verbatim but for the setting it reads beside the plan and its room block.
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
  v_ingress_cap bigint;
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

  -- The month, advisory: the line create_media* hold at complete, read before a byte moves (NULL = unmetered: a paid
  -- profile with no cap on record fails open, as there).
  v_ingress_cap := public.monthly_ingress_cap(v_tier, v_storage_cap);
  if v_ingress_cap is not null and coalesce(v_ledger.cumulative_bytes, 0) + p_bytes > v_ingress_cap then
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
-- Each body is its newest definition verbatim (get_upload_context and get_upload_gate 20261002200000,
-- get_host_upload_context 20260729190000) but for its one storage line. Grants restated as they stand live: the guest's
-- context the anon capability read it has always been (database-security.md), the gate the service role's, the host's
-- context the authenticated host's.
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

  -- Already over the monthly ingress meter? (Free static / paid derived — ADR-0021.)
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
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

    v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
    if v_ingress_cap is not null then
      select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
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
-- 8. The restores: always fits, but for the over-capacity reduce's own removals.
-- =============================================================================================
-- restore_media and restore_event are 20260929140000's bodies, let_back_in 20260930130000's, each verbatim but for the
-- named changes: the profiles row first, the window, the gate gone (kept for a system removal alone), and let_back_in's
-- asked rows left where they are. Grants restated: the authenticated host's.
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
  v_kept bigint;
  v_target public.media_status;
begin
  -- QA #17, and the eviction (20261003220000): the host's profiles row FIRST, as every capacity decision takes it, so a
  -- restore never meets an upload making room from Deleted (leave_deleted, under the same lock) on one row, and two
  -- restores never read one figure. Her own row: the read below proves the item is hers.
  select * into v_profile from public.profiles where id = (select auth.uid()) for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false   -- a guest's self-deletion is private to the host
      and m.purge_asked_at is null;       -- her own Delete permanently: gone, even while it is kept
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
  -- ★ PAST ITS 30 DAYS IT IS LEAVING (20261003220000): out of her Deleted and out of what she is counted for, so no longer
  -- hers to bring back, even before the night's purge takes it.
  if v_media.removed_at is null or v_media.removed_at < now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;
  if v_media.removed_by_admin then
    return jsonb_build_object('ok', false, 'reason', 'admin_removed'); -- QA #8: operators only
  end if;

  -- ★ RESTORE ALWAYS FITS (20261003220000): her own removal already counts in what she stores, so bringing it back moves
  -- nothing her cap holds. The over-capacity reduce's removals alone keep a gate: what she keeps by choice (everything
  -- stored but those) plus this item, against the BASE cap, so an over-cap account cannot restore its way back over and
  -- wait out a fresh grace.
  if v_media.removed_by_system then
    v_cap := coalesce(v_profile.storage_cap_bytes,
                      (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
    if v_cap is not null then
      select s.active_bytes + s.standby_bytes - s.system_bytes into v_kept
        from public.host_storage_summary(v_event.host_id) s;
      if v_kept + v_media.file_size_bytes > v_cap then
        return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
          'needed_bytes', (v_kept + v_media.file_size_bytes) - v_cap);
      end if;
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
  v_max integer;
  v_event_count integer;
  v_still_removed integer;
  v_slug_released boolean := false;
begin
  -- QA #17, and the eviction (20261003220000): the caller's own profiles row FIRST, as every capacity decision takes it,
  -- so the slot count stays serialized against concurrent restores and creates, and an upload making room from Deleted
  -- (leave_deleted, under the same lock) never empties this event under the restore.
  select * into v_profile from public.profiles where id = (select auth.uid()) for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- ★ INSIDE ITS 30 DAYS (20261003220000): past them an event is leaving, out of her Deleted and her count (an emptied
  -- event's deletion moves back past the window's start), so it is not found, even before the night's purge.
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null
      and deleted_at >= now() - interval '30 days';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  -- event_slots (the stacked-pass count) overrides the static tier limit when present.
  v_max := coalesce(v_profile.event_slots, v_limits.max_events);
  if v_max is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_max then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_max);
    end if;
  end if;

  -- ★ RESTORE ALWAYS FITS (20261003220000): a deleted event's media already count in what she stores (her Deleted), so
  -- bringing the event back moves nothing her cap holds; the slot re-check above is its one gate.

  -- ★ THE SLUG FREED AT DELETION STAYS FREED. events_custom_slug_unique covers live events only,
  -- so another event may have claimed this one's custom link while it sat in Deleted; clearing
  -- deleted_at then trips that index, the one unique index an undelete can newly violate. Keep
  -- the link when it is still free; when it is taken, come back on the permanent link alone
  -- rather than refuse the restore.
  begin
    update public.events set deleted_at = null, purge_at = null
      where id = p_event_id and deleted_at is not null;
  exception when unique_violation then
    update public.events set deleted_at = null, purge_at = null, custom_slug = null
      where id = p_event_id and deleted_at is not null;
    v_slug_released := true;
  end;

  -- What stays behind in her Deleted, as her Deleted lists it: never a guest's own withdrawal, never an
  -- operator's removal, never one she asked to delete permanently, never a row past the window (a held one
  -- outlives it and must not be counted).
  select count(*) into v_still_removed from public.media
    where event_id = p_event_id
      and status = 'removed'
      and not removed_by_uploader
      and not removed_by_admin
      and purge_asked_at is null
      and removed_at >= now() - interval '30 days';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed,
    'custom_slug_released', v_slug_released);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

create or replace function public.let_back_in(p_block_id uuid, p_restore boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_block public.event_blocks;
  v_event public.events;
  v_profile public.profiles;
  v_media public.media;
  v_target public.media_status;
  v_restored integer := 0;
  v_admitted integer;
  v_opened integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select b.* into v_block
    from public.event_blocks b
    join public.events e on e.id = b.event_id
   where b.id = p_block_id and e.host_id = v_uid and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if coalesce(p_restore, false) and cardinality(v_block.removed_media_ids) > 0 then
    select * into v_event from public.events where id = v_block.event_id;
    -- The host's profiles row first, as every capacity decision takes it (an upload making room from Deleted holds it
    -- while it takes these rows, so the two never act on one row at once).
    select * into v_profile from public.profiles where id = v_event.host_id for update;
    -- ★ RESTORE ALWAYS FITS (20261003220000): what the block put in Deleted already counts in what she stores, so each
    -- comes back with no gate (`no_room` stays in the answer, always 0, for its callers). Never one that has left for
    -- good (asked: its CHECK would refuse the write) nor one past its 30 days (leaving: out of her count).
    for v_media in
      select m.*
        from public.media m
       where m.id = any (v_block.removed_media_ids)
         and m.event_id = v_block.event_id
         and m.status = 'removed'
         and m.removed_at = v_block.created_at
         and m.removed_at >= now() - interval '30 days'
         and not m.removed_by_uploader
         and not m.removed_by_admin
         and m.purge_asked_at is null
         and m.legal_hold_at is null
       order by m.created_at desc, m.id desc
       for update
    loop
      v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
      if v_target = 'removed' then
        v_target := 'approved'::public.media_status;
      end if;
      update public.media set status = v_target, removed_at = null
       where id = v_media.id and status = 'removed';
      v_restored := v_restored + 1;
    end loop;
  end if;

  delete from public.event_blocks where id = v_block.id;

  -- ★ BACK AT A PUBLIC DOOR (20260930130000): the door let in every ask no block held the moment it turned
  -- Public, and this one waited only on the block. With it gone the Public door lets her in, as it would have
  -- had the block never been there (anywhere else her ask stands, and the host answers it from the door).
  if exists (select 1 from public.events e where e.id = v_block.event_id and e.visibility = 'open') then
    with opened as (
      update public.guests g
         set admission = 'in'
        from public.event_door_asks(v_block.event_id) a
       where g.id = a.guest_id
      returning coalesce(g.user_id::text, g.id::text) as person
    )
    select count(distinct o.person)::integer into v_opened from opened o;
  end if;

  -- ★ BACK AT A LIST THAT NAMES THEM (20260929220000): with the block gone, a waiting newcomer the
  -- invite list names is let in by it, as she would have been the moment it named her.
  v_admitted := public.event_door_admit_listed(v_block.event_id);

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', 0, 'admitted', v_admitted + v_opened);
end;
$$;

revoke all on function public.let_back_in(uuid, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean) to authenticated;

-- =============================================================================================
-- 9. A guest's own withdrawal purges that night, in every album.
-- =============================================================================================
-- 20261002200000's trigger body but for the camera condition, which every withdrawal now meets. Trigger plumbing,
-- never callable as an RPC.
create or replace function public.set_media_purge_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'removed' then
    new.purge_at := coalesce(new.removed_at, now()) + interval '30 days';
    -- ★ A GUEST'S OWN WITHDRAWAL PURGES THAT NIGHT, IN EVERY ALBUM (20261003220000, trash-in-storage; 20261002200000
    -- began it for a camera's shot): it sits in no Deleted and counts in no plan, so nothing waits on it. A hold, an open
    -- report and kept_media_ids keep it as they keep any row.
    if new.removed_by_uploader then
      new.purge_at := coalesce(new.removed_at, now());
    end if;
  else
    new.purge_at := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_media_purge_at() from public, anon, authenticated;

-- =============================================================================================
-- 10. The asked column says who asks now.
-- =============================================================================================
comment on column public.media.purge_asked_at is
  'When this row was asked to leave for good while its bytes wait: her Delete permanently on a kept row, the removed_media sweep reaching a kept row past its window, or an item leaving Deleted ahead of its 30 days (leave_deleted: an upload making room, Empty Deleted, the over-capacity reduce''s first step). The row leaves every host read, her storage figures and her meter at once; the removed_media sweep deletes it, R2 first, that night or the night kept_media_ids lets it go. Service role and definer functions only; never granted to a client role.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own account (an auth user, so
-- handle_new_user makes her profile: a Pro host on a 1,000,000-byte cap, its 10% line at 1,100,000), her album, an
-- event to delete, one deleted 31 days ago and a guest ticket needing no address, and writes each step's items straight
-- in; every upload goes through the real create_media* and every act through the real RPC under her session. Each step
-- traps its own failure into the temp `proof` table; the final select is the answer. The RED run is the same call
-- without this file's statements (its helpers read the new column and the summary's third column only through dynamic
-- SQL and to_jsonb, so it fails on what it lacks, never on a parse).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- -- The fixtures' ids, and what the summary answers (its third column only where this file made it: to_jsonb reads it
-- -- in both runs, so the red run fails on what it lacks rather than on a parse).
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.sum(p_host uuid) returns jsonb language sql as $f$
--   select to_jsonb(s) || jsonb_build_object('stored', s.active_bytes + s.standby_bytes)
--     from public.host_storage_summary(p_host) s $f$;
--
-- -- Her setting, written where it exists (the red run has no column, so this is a no-op there).
-- create function pg_temp.setting(p_on boolean) returns void language plpgsql as $f$
-- begin
--   if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles'
--                and column_name = 'make_room_from_deleted') then
--     execute 'update public.profiles set make_room_from_deleted = $1 where id = $2' using p_on, pg_temp.fx('host');
--   end if;
-- end $f$;
--
-- -- A clean account for every step: no media, no block, no month; the cap 1,000,000 bytes (its 10% line 1,100,000); the
-- -- deleted event deleted a day ago, the old one 31 days ago; the meter far from zero; the setting as asked; no session.
-- create function pg_temp.reset(p_on boolean) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx('host');
-- begin
--   perform set_config('request.jwt.claims', '', true);
--   delete from public.event_blocks where event_id in (select id from public.events where host_id = h);
--   delete from public.media where event_id in (select id from public.events where host_id = h);
--   update public.events set deleted_at = now() - interval '1 day' where id = pg_temp.fx('gone');
--   update public.events set deleted_at = now() - interval '31 days' where id = pg_temp.fx('old');
--   delete from public.storage_ledger where host_id = h;
--   update public.profiles set storage_cap_bytes = 1000000, storage_used_bytes = 100000000 where id = h;
--   perform pg_temp.setting(p_on);
-- end $f$;
--
-- -- One item written straight in (no meter, no ledger): live, or removed p_days ago; the guest's upload when p_guest;
-- -- p_by names who removed it ('system', 'uploader', 'admin'), the host when null.
-- create function pg_temp.item(p_event uuid, p_bytes bigint, p_days numeric default null, p_by text default null,
--                              p_guest boolean default false)
-- returns uuid language plpgsql as $f$
-- declare mid uuid := gen_random_uuid();
-- begin
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status, removed_at,
--                             removed_by_system, removed_by_uploader, removed_by_admin)
--   values (mid, p_event, case when p_guest or p_by = 'uploader' then pg_temp.fx('guest') end, 'photo',
--           'events/' || p_event || '/photo/' || mid || '/original.jpg', p_bytes,
--           case when p_days is null then 'approved' else 'removed' end::public.media_status,
--           case when p_days is null then null else now() - p_days * interval '1 day' end,
--           coalesce(p_by = 'system', false), coalesce(p_by = 'uploader', false), coalesce(p_by = 'admin', false));
--   return mid;
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
-- create function pg_temp.meter(p_bytes bigint) returns jsonb language plpgsql as $f$
-- begin
--   return public.meter_upload(p_event_id => pg_temp.fx('album'), p_type => 'photo', p_bytes => p_bytes);
-- exception when others then
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
--
-- -- Her session (a JWT's claims for auth.uid()); the role itself is set in each block.
-- create function pg_temp.as_host() returns void language sql as $f$
--   select set_config('request.jwt.claims', json_build_object('sub', pg_temp.fx('host'), 'role', 'authenticated')::text, true);
-- $f$;
--
-- -- The fixtures: a fresh Pro host (an auth user, so handle_new_user makes her profile), her album, an event to delete,
-- -- an event deleted long ago, and one guest ticket on the album that needs no address.
-- do $$
-- declare h uuid := gen_random_uuid(); a uuid; g uuid; o uuid; gid uuid;
--   t text := 'deleted-counts-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values (h, 'deleted-counts-' || h || '@example.com', now());
--   insert into public.profiles (id, email, display_name) values (h, 'deleted-counts-' || h || '@example.com', 'Della Deleted')
--     on conflict (id) do update set display_name = excluded.display_name;
--   update public.profiles set tier = 'pro', storage_cap_bytes = 1000000 where id = h;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Deleted counts: the album', false) returning id into a;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Deleted counts: a deleted event', false) returning id into g;
--   insert into public.events (host_id, name, require_verified_email) values (h, 'Deleted counts: deleted long ago', false) returning id into o;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest') returning id into gid;
--   insert into fx values ('host', h, null), ('album', a, null), ('gone', g, null), ('old', o, null), ('guest', gid, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, format('host %s, album %s, deleted %s, long ago %s', h, a, g, o));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. The setting: a boolean, on by default, hers to write and nobody else's.
-- do $$
-- declare h uuid := pg_temp.fx('host'); c record; n int; bad text := '';
-- begin
--   select data_type, is_nullable, column_default into c from information_schema.columns
--    where table_schema = 'public' and table_name = 'profiles' and column_name = 'make_room_from_deleted';
--   if not found then raise exception 'no make_room_from_deleted column'; end if;
--   if c.data_type <> 'boolean' or c.is_nullable <> 'NO' or c.column_default <> 'true' then
--     bad := bad || format(' shape %s/%s/%s', c.data_type, c.is_nullable, c.column_default);
--   end if;
--   if not has_column_privilege('authenticated', 'public.profiles', 'make_room_from_deleted', 'UPDATE') then bad := bad || ' authenticated-cannot'; end if;
--   if has_column_privilege('anon', 'public.profiles', 'make_room_from_deleted', 'UPDATE') then bad := bad || ' anon-can'; end if;
--   if has_column_privilege('authenticated', 'public.profiles', 'storage_cap_bytes', 'UPDATE') then bad := bad || ' cap-writable'; end if;
--   perform pg_temp.as_host();
--   set local role authenticated;
--   execute 'update public.profiles set make_room_from_deleted = false where id = $1' using h;
--   get diagnostics n = row_count;
--   reset role;
--   if n <> 1 then bad := bad || ' her-own=' || n; end if;
--   set local role authenticated;
--   execute 'update public.profiles set make_room_from_deleted = false where id = $1'
--     using '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b'::uuid;
--   get diagnostics n = row_count;
--   reset role;
--   if n <> 0 then bad := bad || ' another-host''s=' || n; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('1 the setting: boolean, on by default, hers alone to write', true,
--     'authenticated holds UPDATE on the one column (not the cap); her row 1, another host''s 0');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the setting: boolean, on by default, hers alone to write', false, sqlerrm);
-- end $$;
--
-- -- 2. Deleted, defined once: what her lists show, never a withdrawal, a takedown, an asked or an expired row.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); g uuid := pg_temp.fx('gone'); s jsonb; ask uuid; bad text := '';
-- begin
--   perform pg_temp.reset(true);
--   perform pg_temp.item(a, 600000);               -- in her album
--   perform pg_temp.item(a, 200000, 3);            -- her removal, 3 days ago
--   perform pg_temp.item(a, 150000, 2);            -- her removal, 2 days ago
--   perform pg_temp.item(a, 30000, 1, 'system');   -- the over-capacity reduce's
--   perform pg_temp.item(g, 100000);               -- a deleted event's own
--   perform pg_temp.item(a, 50000, 1, 'uploader'); -- a guest's withdrawal: never hers
--   perform pg_temp.item(a, 70000, 1, 'admin');    -- an operator's removal: never hers
--   perform pg_temp.item(a, 80000, 31);            -- past its 30 days: leaving
--   ask := pg_temp.item(a, 40000, 1);              -- asked to leave for good
--   update public.media set purge_asked_at = now() where id = ask;
--   s := pg_temp.sum(h);
--   if (s->>'active_bytes')::bigint <> 600000 then bad := bad || ' active=' || (s->>'active_bytes'); end if;
--   if (s->>'standby_bytes')::bigint <> 480000 then bad := bad || ' deleted=' || (s->>'standby_bytes'); end if;
--   if (s->>'system_bytes') is distinct from '30000' then bad := bad || ' system=' || coalesce(s->>'system_bytes', 'none'); end if;
--   if public.host_active_bytes(h) <> 600000 then bad := bad || ' host_active_bytes=' || public.host_active_bytes(h); end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 Deleted, defined once: her lists, never a withdrawal, a takedown, an asked or an expired row', true, s::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 Deleted, defined once: her lists, never a withdrawal, a takedown, an asked or an expired row', false, sqlerrm);
-- end $$;
--
-- -- 3. The cap holds Deleted too (setting off): past the line refused, her upload and a guest's; at it admitted.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); g uuid := pg_temp.fx('gone');
--   r1 text; r2 text; r3 text; asked int; s jsonb;
-- begin
--   perform pg_temp.reset(false);
--   perform pg_temp.item(a, 600000); perform pg_temp.item(a, 200000, 3); perform pg_temp.item(a, 150000, 2);
--   perform pg_temp.item(g, 100000);                        -- stored 1,050,000 against the line of 1,100,000
--   r1 := pg_temp.put(100000, 'host');
--   r2 := pg_temp.put(100000, 'guest');
--   r3 := pg_temp.put(50000, 'guest');                      -- exactly at the line
--   select count(*) into asked from public.media m join public.events e on e.id = m.event_id
--    where e.host_id = h and m.purge_asked_at is not null;
--   s := pg_temp.sum(h);
--   if r1 <> '23514 Storage capacity exceeded for this plan.' or r2 <> '23514 Storage capacity exceeded for this plan.' then
--     raise exception 'past the line beside Deleted: host "%", guest "%"', r1, r2;
--   end if;
--   if r3 <> 'recorded' then raise exception 'at the line: %', r3; end if;
--   if asked <> 0 then raise exception 'the setting off took % from Deleted', asked; end if;
--   if (s->>'stored')::bigint <> 1100000 then raise exception 'stored %', s->>'stored'; end if;
--   insert into proof (step, ok, detail) values ('3 the cap holds Deleted (setting off): past it refused, host and guest; at it admitted; nothing taken', true,
--     format('host "%s", guest "%s", at the line %s, stored %s', r1, r2, r3, s->>'stored'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 the cap holds Deleted (setting off): past it refused, host and guest; at it admitted; nothing taken', false, sqlerrm);
-- end $$;
--
-- -- 4. A delete frees nothing: her Remove leaves what she stores unchanged, and the room it was to free stays refused.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); big uuid; s0 jsonb; s1 jsonb; r text; n int;
-- begin
--   perform pg_temp.reset(false);
--   big := pg_temp.item(a, 600000); perform pg_temp.item(a, 450000, 2);   -- stored 1,050,000
--   s0 := pg_temp.sum(h);
--   perform pg_temp.as_host();
--   set local role authenticated;
--   update public.media set status = 'removed', removed_at = now() where id = big;   -- her Remove, a PATCH under RLS
--   get diagnostics n = row_count;
--   reset role;
--   s1 := pg_temp.sum(h);
--   r := pg_temp.put(100000, 'host');
--   if n <> 1 then raise exception 'her Remove did not land'; end if;
--   if (s1->>'stored') <> (s0->>'stored') then raise exception 'stored moved on a delete: % -> %', s0->>'stored', s1->>'stored'; end if;
--   if r <> '23514 Storage capacity exceeded for this plan.' then raise exception 'the room a delete was to free: %', r; end if;
--   insert into proof (step, ok, detail) values ('4 a delete frees nothing: stored unchanged, the room still refused', true,
--     format('stored %s -> %s; active %s -> %s; then "%s"', s0->>'stored', s1->>'stored', s0->>'active_bytes', s1->>'active_bytes', r));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 a delete frees nothing: stored unchanged, the room still refused', false, sqlerrm);
-- end $$;
--
-- -- 5. Make room from Deleted (setting on): the oldest leave first, only what the file needs, her upload and a guest's; an
-- --    event emptied that way leaves too; her meter lets go of what left; past what Deleted can free, refused.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); g uuid := pg_temp.fx('gone');
--   d1 uuid; d2 uuid; x1 uuid; r1 text; r2 text; r3 text; m0 bigint; m1 bigint; s jsonb; gone_at timestamptz; bad text := '';
-- begin
--   perform pg_temp.reset(true);
--   perform pg_temp.item(a, 600000);
--   d1 := pg_temp.item(a, 200000, 3); d2 := pg_temp.item(a, 150000, 2); x1 := pg_temp.item(g, 100000);   -- stored 1,050,000
--   select storage_used_bytes into m0 from public.profiles where id = h;
--   r1 := pg_temp.put(200000, 'host');     -- needs 150,000: the oldest, d1 (200,000), leaves; nothing more
--   if r1 <> 'recorded' then bad := bad || ' host: ' || r1; end if;
--   if not exists (select 1 from public.media where id = d1 and purge_asked_at is not null) then bad := bad || ' d1-stayed'; end if;
--   if exists (select 1 from public.media where id in (d2, x1) and purge_asked_at is not null) then bad := bad || ' more-than-needed'; end if;
--   r2 := pg_temp.put(300000, 'guest');    -- needs 250,000: d2 (150,000), then the deleted event's x1 (100,000)
--   if r2 <> 'recorded' then bad := bad || ' guest: ' || r2; end if;
--   if (select count(*) from public.media where id in (d2, x1) and purge_asked_at is not null and status = 'removed') <> 2 then
--     bad := bad || ' d2-or-x1-stayed';
--   end if;
--   select deleted_at into gone_at from public.events where id = g;
--   if gone_at > now() - interval '30 days' then bad := bad || ' the-emptied-event-stayed'; end if;
--   r3 := pg_temp.put(1, 'host');          -- Deleted is empty and her albums sit at the line
--   if r3 <> '23514 Storage capacity exceeded for this plan.' then bad := bad || ' past-everything: ' || r3; end if;
--   s := pg_temp.sum(h);
--   select storage_used_bytes into m1 from public.profiles where id = h;
--   if (s->>'stored')::bigint <> 1100000 or (s->>'standby_bytes')::bigint <> 0 then bad := bad || ' figures ' || s::text; end if;
--   -- The meter: +500,000 the two uploads, -450,000 the three that left (media_release_meter).
--   if m1 - m0 <> 50000 then bad := bad || ' meter ' || (m1 - m0); end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('5 make room (setting on): oldest first, only what is needed, host and guest; the emptied event leaves; the meter lets go', true,
--     format('host "%s" took d1; guest "%s" took d2 and x1; then "%s"; stored %s, Deleted %s, meter %s', r1, r2, r3, s->>'stored', s->>'standby_bytes', m1 - m0));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 make room (setting on): oldest first, only what is needed, host and guest; the emptied event leaves; the meter lets go', false, sqlerrm);
-- end $$;
--
-- -- 6. Past what even an empty Deleted could free: refused, and nothing leaves.
-- do $$
-- declare a uuid := pg_temp.fx('album'); d1 uuid; r text;
-- begin
--   perform pg_temp.reset(true);
--   perform pg_temp.item(a, 1000000); d1 := pg_temp.item(a, 200000, 3);
--   r := pg_temp.put(150000, 'guest');
--   if r <> '23514 Storage capacity exceeded for this plan.' then raise exception 'past everything: %', r; end if;
--   if exists (select 1 from public.media where id = d1 and purge_asked_at is not null) then raise exception 'a refusal took from Deleted'; end if;
--   insert into proof (step, ok, detail) values ('6 past what Deleted could free: refused, nothing leaves', true, r);
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 past what Deleted could free: refused, nothing leaves', false, sqlerrm);
-- end $$;
--
-- -- 7. leave_deleted: oldest first; without p_system it leaves the over-capacity reduce's removals where they are.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); d1 uuid; d2 uuid; s1 uuid; l record; l2 record; bad text := '';
-- begin
--   perform pg_temp.reset(true);
--   s1 := pg_temp.item(a, 300000, 4, 'system'); d1 := pg_temp.item(a, 200000, 3); d2 := pg_temp.item(a, 100000, 1);
--   select * into l from public.leave_deleted(h, 250000, false);
--   if l.items <> 2 or l.freed_bytes <> 300000 then bad := bad || format(' first %s/%s', l.items, l.freed_bytes); end if;
--   if (select count(*) from public.media where id in (d1, d2) and purge_asked_at is not null) <> 2 then bad := bad || ' hers-stayed'; end if;
--   if exists (select 1 from public.media where id = s1 and purge_asked_at is not null) then bad := bad || ' the-system''s-left'; end if;
--   select * into l2 from public.leave_deleted(h, null, true);
--   if l2.items <> 1 or not exists (select 1 from public.media where id = s1 and purge_asked_at is not null) then bad := bad || ' all-of-it'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('7 leave_deleted: oldest first; the system''s removals only when asked', true,
--     format('her own: %s items, %s bytes (the system''s, older, stayed); then all: %s', l.items, l.freed_bytes, l2.items));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 leave_deleted: oldest first; the system''s removals only when asked', false, sqlerrm);
-- end $$;
--
-- -- 8. Empty Deleted: everything leaves at once, the deleted events with it; nobody signed in is refused; anon never.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); g uuid := pg_temp.fx('gone');
--   j0 jsonb; j jsonb; s jsonb; gone_at timestamptz; bad text := '';
-- begin
--   perform pg_temp.reset(true);
--   perform pg_temp.item(a, 400000); perform pg_temp.item(a, 200000, 3); perform pg_temp.item(g, 100000);
--   j0 := public.empty_deleted();
--   if j0 <> '{"ok": false, "reason": "unauthorized"}'::jsonb then bad := bad || ' signed-out ' || j0; end if;
--   perform pg_temp.as_host();
--   set local role authenticated;
--   j := public.empty_deleted();
--   reset role;
--   s := pg_temp.sum(h);
--   select deleted_at into gone_at from public.events where id = g;
--   if (j->>'ok')::boolean is not true or (j->>'items')::int <> 2 or (j->>'events')::int <> 1 or (j->>'freed_bytes')::bigint <> 300000 then
--     bad := bad || ' answer ' || j;
--   end if;
--   if (s->>'standby_bytes')::bigint <> 0 or (s->>'active_bytes')::bigint <> 400000 then bad := bad || ' figures ' || s; end if;
--   if gone_at > now() - interval '30 days' then bad := bad || ' the-event-stayed'; end if;
--   if has_function_privilege('anon', 'public.empty_deleted()', 'EXECUTE') then bad := bad || ' anon-executes'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('8 Empty Deleted: all of it at once, the events too; signed out refused; anon never', true, j::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 Empty Deleted: all of it at once, the events too; signed out refused; anon never', false, sqlerrm);
-- end $$;
--
-- -- 9. Restore always fits; the over-capacity reduce's removals keep the gate; past its 30 days it is not hers.
-- do $$
-- declare h uuid := pg_temp.fx('host'); a uuid := pg_temp.fx('album'); g uuid := pg_temp.fx('gone'); o uuid := pg_temp.fx('old');
--   d1 uuid; old1 uuid; s1 uuid; j1 jsonb; j2 jsonb; j3 jsonb; j4 jsonb; j5 jsonb; bad text := '';
-- begin
--   perform pg_temp.reset(true);
--   perform pg_temp.item(a, 950000); d1 := pg_temp.item(a, 100000, 1);   -- active 950,000: the old gate refused d1
--   old1 := pg_temp.item(a, 50000, 31);
--   s1 := pg_temp.item(a, 100000, 1, 'system');
--   perform pg_temp.item(g, 100000);
--   perform pg_temp.as_host();
--   set local role authenticated;
--   j1 := public.restore_media(d1);
--   j2 := public.restore_media(old1);
--   j3 := public.restore_media(s1);
--   j4 := public.restore_event(g);
--   j5 := public.restore_event(o);
--   reset role;
--   if j1 <> '{"ok": true, "status": "approved"}'::jsonb then bad := bad || ' hers: ' || j1; end if;
--   if j2 <> '{"ok": false, "reason": "not_found"}'::jsonb then bad := bad || ' past-30-days: ' || j2; end if;
--   if j3 <> '{"ok": false, "reason": "insufficient_space", "needed_bytes": 250000}'::jsonb then bad := bad || ' the-system''s: ' || j3; end if;
--   if (j4->>'ok')::boolean is not true then bad := bad || ' the-event: ' || j4; end if;
--   if j5 <> '{"ok": false, "reason": "not_found"}'::jsonb then bad := bad || ' the-old-event: ' || j5; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('9 restore always fits; the system''s removal keeps its gate; past 30 days not hers', true,
--     format('%s | %s | %s | %s | %s', j1, j2, j3, j4, j5));
-- exception when others then
--   insert into proof (step, ok, detail) values ('9 restore always fits; the system''s removal keeps its gate; past 30 days not hers', false, sqlerrm);
-- end $$;
--
-- -- 10. The presign's meter: the line follows the setting, and a refusal carries its numbers.
-- do $$
-- declare a uuid := pg_temp.fx('album'); j1 jsonb; j2 jsonb; j3 jsonb; j4 jsonb; bad text := '';
-- begin
--   perform pg_temp.reset(false);
--   perform pg_temp.item(a, 600000); perform pg_temp.item(a, 450000, 2);   -- stored 1,050,000; her albums 600,000
--   j1 := pg_temp.meter(200000);
--   j2 := pg_temp.meter(50000);
--   perform pg_temp.setting(true);
--   j3 := pg_temp.meter(200000);
--   j4 := pg_temp.meter(600000);
--   if j1 <> '{"ok": false, "reason": "storage", "needed_bytes": 150000, "deleted_bytes": 450000, "makes_room": false}'::jsonb then bad := bad || ' off: ' || j1; end if;
--   if j2 <> '{"ok": true}'::jsonb then bad := bad || ' off-at-the-line: ' || j2; end if;
--   if j3 <> '{"ok": true}'::jsonb then bad := bad || ' on: ' || j3; end if;
--   if j4 <> '{"ok": false, "reason": "storage", "needed_bytes": 100000, "deleted_bytes": 450000, "makes_room": true}'::jsonb then bad := bad || ' on-past: ' || j4; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('10 the meter: the line follows the setting; a refusal carries its numbers', true,
--     format('%s | %s | %s | %s', j1, j2, j3, j4));
-- exception when others then
--   insert into proof (step, ok, detail) values ('10 the meter: the line follows the setting; a refusal carries its numbers', false, sqlerrm);
-- end $$;
--
-- -- 11. The three advisories answer "full" at the same line.
-- do $$
-- declare a uuid := pg_temp.fx('album'); t text := (select txt from fx where k = 'ticket');
--   c1 text; g1 text; h1 text; c2 text; g2 text; h2 text;
-- begin
--   perform pg_temp.reset(false);
--   perform pg_temp.item(a, 600000); perform pg_temp.item(a, 500000, 2);   -- stored 1,100,000: at the line
--   c1 := public.get_upload_context(t, 'photo') ->> 'at_storage_cap';
--   g1 := public.get_upload_gate(a) ->> 'album_full';
--   perform pg_temp.as_host();
--   set local role authenticated;
--   h1 := public.get_host_upload_context(a, 'photo') ->> 'at_storage_cap';
--   reset role;
--   perform pg_temp.setting(true);
--   c2 := public.get_upload_context(t, 'photo') ->> 'at_storage_cap';
--   g2 := public.get_upload_gate(a) ->> 'album_full';
--   set local role authenticated;
--   h2 := public.get_host_upload_context(a, 'photo') ->> 'at_storage_cap';
--   reset role;
--   if c1 <> 'true' or g1 <> 'true' or h1 <> 'true' then raise exception 'off, full: guest %, gate %, host %', c1, g1, h1; end if;
--   if c2 <> 'false' or g2 <> 'false' or h2 <> 'false' then raise exception 'on, room to make: guest %, gate %, host %', c2, g2, h2; end if;
--   insert into proof (step, ok, detail) values ('11 the advisories answer full at the same line', true,
--     format('off: %s %s %s; on: %s %s %s', c1, g1, h1, c2, g2, h2));
-- exception when others then
--   insert into proof (step, ok, detail) values ('11 the advisories answer full at the same line', false, sqlerrm);
-- end $$;
--
-- -- 12. A guest's own withdrawal purges that night in an album with no camera; her own removal keeps its 30 days.
-- do $$
-- declare a uuid := pg_temp.fx('album'); w uuid; hr uuid; pw interval; ph interval;
-- begin
--   perform pg_temp.reset(true);
--   w := pg_temp.item(a, 10000, null, null, true); hr := pg_temp.item(a, 10000);
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true where id = w;
--   update public.media set status = 'removed', removed_at = now() where id = hr;
--   select purge_at - removed_at into pw from public.media where id = w;
--   select purge_at - removed_at into ph from public.media where id = hr;
--   if pw <> interval '0' then raise exception 'the withdrawal waits %', pw; end if;
--   if ph <> interval '30 days' then raise exception 'her removal waits %', ph; end if;
--   insert into proof (step, ok, detail) values ('12 a guest''s withdrawal purges that night (no camera); her removal keeps 30 days', true,
--     format('withdrawal +%s, hers +%s', pw, ph));
-- exception when others then
--   insert into proof (step, ok, detail) values ('12 a guest''s withdrawal purges that night (no camera); her removal keeps 30 days', false, sqlerrm);
-- end $$;
--
-- -- 13. Let back in: the block's uploads come back with no gate, never one that has left for good.
-- do $$
-- declare a uuid := pg_temp.fx('album'); b1 uuid; b2 uuid; jb jsonb; jl jsonb; bad text := '';
-- begin
--   perform pg_temp.reset(false);
--   perform pg_temp.item(a, 750000);
--   b1 := pg_temp.item(a, 300000, null, null, true); b2 := pg_temp.item(a, 50000, null, null, true);   -- stored 1,100,000
--   perform pg_temp.as_host();
--   set local role authenticated;
--   jb := public.block_from_event(p_media_id => b1);
--   reset role;
--   update public.media set purge_asked_at = now() where id = b2;    -- it left for good while the block stood
--   set local role authenticated;
--   jl := public.let_back_in((jb->>'block_id')::uuid, true);
--   reset role;
--   if (jb->>'removed')::int <> 2 then bad := bad || ' block ' || jb; end if;
--   if (jl->>'restored')::int <> 1 or (jl->>'no_room')::int <> 0 then bad := bad || ' let back in ' || jl; end if;
--   if not exists (select 1 from public.media where id = b1 and status = 'approved') then bad := bad || ' b1-stayed'; end if;
--   if not exists (select 1 from public.media where id = b2 and status = 'removed' and purge_asked_at is not null) then bad := bad || ' b2-came-back'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('13 let back in: no gate, never one that left for good', true, jl::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('13 let back in: no gate, never one that left for good', false, sqlerrm);
-- end $$;
--
-- -- 14. Who may call what, and how each runs.
-- do $$
-- declare bad text := ''; r record; want text;
-- begin
--   for r in
--     select p.oid::regprocedure::text as fn, coalesce(array_to_string(p.proacl, ','), 'null') as acl, p.prosecdef as definer,
--            array_to_string(p.proconfig, ',') as config
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('host_deleted_media', 'host_storage_summary', 'host_room_used', 'leave_deleted',
--        'empty_deleted', 'create_media', 'create_media_as_host', 'meter_upload', 'get_upload_context', 'get_upload_gate',
--        'get_host_upload_context', 'restore_media', 'restore_event', 'let_back_in', 'set_media_purge_at')
--   loop
--     if r.config is distinct from 'search_path=""' then bad := bad || ' ' || r.fn || ' path:' || coalesce(r.config, 'none'); end if;
--     want := case
--          when r.fn = 'host_deleted_media(uuid)' then 'postgres=X/postgres'
--          when r.fn in ('empty_deleted()', 'restore_media(uuid)', 'restore_event(uuid)', 'let_back_in(uuid,boolean)',
--                        'get_host_upload_context(uuid,media_type)')
--            then 'postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres'
--          when r.fn = 'get_upload_context(text,media_type)' then 'postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres'
--          else 'postgres=X/postgres,service_role=X/postgres' end;
--     if r.acl <> want then bad := bad || ' ' || r.fn || ' acl:' || r.acl; end if;
--     if r.definer is distinct from (r.fn not in ('host_deleted_media(uuid)', 'set_media_purge_at()')) then bad := bad || ' ' || r.fn || ' definer:' || r.definer; end if;
--   end loop;
--   if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
--         and p.proname in ('host_deleted_media', 'host_room_used', 'leave_deleted', 'empty_deleted')) <> 4 then bad := bad || ' the-four-new'; end if;
--   if pg_get_function_result('public.host_storage_summary(uuid)'::regprocedure) <> 'TABLE(active_bytes bigint, standby_bytes bigint, system_bytes bigint)' then
--     bad := bad || ' summary-shape';
--   end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('14 who may call what: each ACL, definer and pinned path', true, '15 functions');
-- exception when others then
--   insert into proof (step, ok, detail) values ('14 who may call what: each ACL, definer and pinned path', false, sqlerrm);
-- end $$;
--
-- -- 15. The bodies, for the apply's drift check (md5 of each whitespace-collapsed prosrc).
-- insert into proof (step, ok, detail)
-- select '15 the bodies', true,
--   string_agg(p.proname || ' ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), ', ' order by p.proname)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname in ('host_deleted_media', 'host_storage_summary', 'host_room_used', 'leave_deleted',
--    'empty_deleted', 'create_media', 'create_media_as_host', 'meter_upload', 'get_upload_context', 'get_upload_gate',
--    'get_host_upload_context', 'restore_media', 'restore_event', 'let_back_in', 'set_media_purge_at');
--
-- select n, step, ok, detail from proof order by n;
--
-- RESULT, 2026-10-03, nothing persisted by any run (afterwards no `make_room_from_deleted` column and none of the four
-- new functions exist, create_media still hashes e83666cd and host_storage_summary c5d0716b, and no "Deleted counts"
-- event or proof user is left). GREEN ran again on the final file, after every 30-day window was aligned on the lists'
-- own inclusive start (`>=`) and an emptied event moved a minute past it, with the same 15/15:
--   LIVE RED, without this file's statements: 13 of the 15 steps fail on what each lacks. 1 "no make_room_from_deleted
--     column"; 2 " system=none" (today's summary sums the same Deleted, 480,000, but has no third column); 3 "past the
--     line beside Deleted: host "recorded", guest "recorded"" (the cap read her albums alone); 4 "the room a delete was
--     to free: recorded"; 5 " d1-stayed d2-or-x1-stayed the-emptied-event-stayed figures {stored 1550000, active
--     1100000, Deleted 450000} meter 500000" (admitted past the cap, nothing left Deleted); 7 and 8 "function ... does
--     not exist"; 9 her restore refused insufficient_space (50,000) at a full account, the 31-day item restored, the
--     deleted event refused, the 31-day event restored; 10 " off: {ok: true} on-past: {ok: false, reason: storage}" (no
--     numbers); 11 "off, full: guest false, gate false, host false"; 12 "the withdrawal waits 30 days"; 13 "new row for
--     relation "media" violates check constraint "media_purge_asked_only_removed"" (today's Let back in errors on an
--     item that left for good, a latent bug this file closes); 14 get_upload_context's ACL in its old order, the four
--     new functions and the summary's shape missing. 6 holds in both runs by design (past everything, refused, nothing
--     leaves), and 15 read today's bodies, the drift hashes above.
--   LIVE GREEN, with them: 15/15. 2: active 600,000, Deleted 480,000 (the system's 30,000 of it), stored 1,080,000;
--     3: host and guest refused at 1,150,000, admitted at the line, nothing taken; 4: stored 1,050,000 before and after
--     her Remove (active 600,000 -> 0) and the room still refused; 5: her 200,000 took d1 (the oldest) alone, the
--     guest's 300,000 took d2 then x1, the emptied deleted event left Deleted, then 1 byte refused, stored 1,100,000,
--     Deleted 0, her meter +50,000 (+500,000 landed, -450,000 left); 6: refused, nothing left; 7: without p_system 2
--     items and 300,000 bytes (the system's older removal stayed), then with it the last; 8: signed out
--     {ok:false, reason:unauthorized}, then {ok, items 2, events 1, freed_bytes 300000}, Deleted 0, the event gone,
--     anon no EXECUTE; 9: {ok, approved} | {not_found} | {insufficient_space, needed_bytes 250000} | {ok,
--     media_still_removed 0} | {not_found}; 10: {storage, needed_bytes 150000, deleted_bytes 450000, makes_room
--     false} | {ok} | {ok} | {storage, needed_bytes 100000, deleted_bytes 450000, makes_room true}; 11: off true true
--     true, on false false false; 12: withdrawal +00:00:00, hers +30 days; 13: {ok, restored 1, no_room 0}; 14: every
--     ACL as restated, every definer and pinned path; 15 (md5 of each whitespace-collapsed prosrc, the file's own,
--     matched locally): create_media 48845304c94e0ce4fac32bac36df5350, create_media_as_host
--     d1f7c8775b0d54d4e8f6d41901efeba1, empty_deleted 7f9daee85ffa3873005f153fb250c2b5, get_host_upload_context
--     47f5299990c5ab234513ac232182bd21, get_upload_context 8d49526db8842f6f8f6432f0f781b9f4, get_upload_gate
--     ca02c6359e707e0494faa9ebe6ba5053, host_deleted_media 6551382586940f1110c50c0a8fa50cfe, host_room_used
--     27a7afbe085aef044ee0946426b86bf4, host_storage_summary 006d5319db9bd06cfebad85a2978abef, leave_deleted
--     d700496c307b2a1d8e9edd697cbdc199, let_back_in 21e12ae4bacc90d66b4702d1d40db722, meter_upload
--     6e160cf34895e482e4ef91bad6672160, restore_event 89a08ed92c61d9b8924e4f1410b89bb9, restore_media
--     eefa15da54e6ba88d22dc626b42028b6, set_media_purge_at f1c27be0a29cee7fea762e665cb3aa81.
-- =============================================================================================
