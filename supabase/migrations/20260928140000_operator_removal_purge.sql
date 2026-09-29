-- AN OPERATOR'S REMOVAL LEAVES THE HOST'S VIEW ENTIRELY (Will, 2026-09-28, admin-triage r1's
-- `notice=deleted`, built as his note refines it): "No note to host, just removal - they'll likely
-- assume a guest deleted an upload of their own. However, in the case of a report leading to media
-- removal, it should be fully purged from the event, not moved to deleted. If there's CSAM uploaded and
-- we immediately takedown from a guest report, the host shouldn't have that visible in their deleted,
-- regardless of inability to recover."
--
-- WHY: an operator's takedown (`media.removed_by_admin`, stamped by both admin paths through
-- removalUpdate()) waited in the host's Deleted with a countdown, a Restore that restore_media always
-- refuses (`admin_removed`) and the bell's "about to be cleared" nudge; it counted in her meter's
-- "+ X in Deleted"; and her Delete permanently could destroy it, object and row, because
-- purge_media_now refused only a HELD row: the evidence could be gone before the runbook's hold. So from
-- the moment of the removal nothing the host reads holds the item and no path she drives can hard-delete
-- it. The event's copy waits out its own window (`purge_at`, trigger-derived: the removal + 30 days),
-- which is the operator's Undo (`closed=window`) and the runbook's time to hold and preserve, and then
-- the removed_media sweep purges it like any removal: on the purge sweep, never in the removal's own
-- request, and never while a hold stands.
--
-- WHAT CHANGES, one fact each:
--   1. media_host_all: the host's rows leave out an operator's removal (`status = 'removed' and
--      removed_by_admin`). RLS is the one read every host surface shares (the Deleted list and its links,
--      the bell, the purge wrapper's own selection, every host count), so the rule lives once, at the
--      boundary, and a future read cannot forget it (a guest's withdrawal is the cautionary tale: its
--      `removed_by_uploader = false` is a predicate each read must carry, and the one that forgot showed
--      a Restore that always fails). A policy may test a column its role cannot SELECT, so
--      `removed_by_admin` stays ungranted: the host can neither read the flag nor see the row it marks.
--   2. host_storage_summary: the Deleted figure is exactly what her two Deleted lists show: a removal
--      that is neither a guest's own withdrawal nor an operator's, and a deleted event's live media, each
--      inside the 30-day window. The window is what keeps a hold discreet: a held item outlives it, and a
--      figure that kept counting it after her list stopped showing it would be the one number telling her
--      something is held (the round's door holds the uploader's other items too, a host's own removal
--      among them).
--   3. restore_event: `media_still_removed` counts what her Deleted still shows of the event, by the same
--      rule. The count reaches her client; it counted withdrawals and takedowns too.
--   4. purge_media_now: never an operator's removal. The host's Delete permanently is R2-first in its
--      wrapper (purgeMediaNow), whose own RLS read (1) now leaves the row out; this is the DB boundary
--      behind it, as `legal_hold_at is null` is for a hold.
--   5. standby_hosts: never an operator's removal, so the standby budget neither charges one to the host
--      nor evicts one inside its window (sweepStandbyBudget's own bin read carries the same predicate).
--   6. held_event_ids: an event holding an operator's removal still inside its window is kept whole, as
--      a hold keeps it, by the expired-events sweep and account deletion. A host who deletes her account
--      the night after a takedown cannot take the evidence with her before the runbook preserves it (the
--      account's purge is immediate otherwise). Once the removal's purge_at passes, the removed_media
--      sweep takes it (unless held) and the event is free to go; a held one keeps the event as before.
--
-- WHAT DOES NOT CHANGE: no table, no column, no grant. The hold columns and removed_by_admin stay
-- unreadable by `authenticated`. restore_media already refuses an operator's removal (`admin_removed`,
-- the same discreet copy as a hold). The removed_media sweep already purges one at its purge_at and skips
-- a held row; purge_media_rows skips a held row; no sweep lists `preservation/`. The operator's reads and
-- writes are the service role's, past RLS, so the portal still sees and restores every removal.
-- `profiles.storage_used_bytes`, the physical meter, still counts the bytes until the purge.
--
-- SHAPE: every replaced function keeps its signature, return type, language, volatility, security mode
-- and empty search_path, so `create or replace` keeps its ACL; each block restates its grants exactly as
-- they stand live (2026-09-28), because a restated grant is the one a reviewer can read. The policy is an
-- ALTER, which keeps its name, command (ALL), role (authenticated) and WITH CHECK; only USING gains the
-- one conjunct. Each body is its newest definition with only the named change: host_storage_summary
-- 20260923160000, restore_event 20260928130000, purge_media_now 20260707150000, standby_hosts and
-- held_event_ids 20260924030000.
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) the bodies before, for the diff:
--   select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('host_storage_summary', 'restore_event', 'purge_media_now',
--      'standby_hosts', 'held_event_ids') order by 1;
--   select qual from pg_policies where schemaname = 'public' and tablename = 'media' and policyname = 'media_host_all';
-- (2) apply verbatim; (3) the same two reads after (five new md5s, the ACLs unchanged, the qual ending in
-- the removal conjunct); (4) get_advisors, EXPECTED DELTA: NONE (no function added, no grant moved, the
-- policy keeps its `(select auth.uid())`); (5) the rolled-back check at the foot; (6) regenerate
-- src/lib/db/types.ts (no change expected: no signature moved). The deployed build is safe on either side
-- of the apply: no TypeScript reads a changed signature, and the lane's code filters the same rows in its
-- own reads.

-- =============================================================================================
-- 1. media_host_all: an operator's removal is not the host's row.
-- =============================================================================================
alter policy media_host_all on public.media
  using (
    exists (
      select 1 from public.events e
      where e.id = media.event_id and e.host_id = (select auth.uid())
    )
    and not (media.status = 'removed' and media.removed_by_admin)
  );

comment on policy media_host_all on public.media is
  'A host reads and writes the media of her own events, never an operator''s removal (status removed and removed_by_admin): it leaves her album, her Deleted and every count at once, and the flag itself stays ungranted. Guest reads and writes go through SECURITY DEFINER RPCs.';

-- =============================================================================================
-- 2. host_storage_summary: the Deleted figure is what her two Deleted lists show.
-- =============================================================================================
-- Active is unchanged, byte for byte host_active_bytes(uuid). Deleted is the media bin
-- (listRecentlyDeletedMedia: removed, not withdrawn, not an operator's, removed inside the window; RLS
-- supplies the operator's arm there) plus the events bin's live media (listRecentlyDeletedEvents:
-- deleted inside the window). 30 days = RECENTLY_DELETED_WINDOW_DAYS, the same literal both purge_at
-- triggers carry.
create or replace function public.host_storage_summary(p_host_id uuid)
returns table (active_bytes bigint, standby_bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(m.file_size_bytes) filter (
      where m.status <> 'removed' and e.deleted_at is null
    ), 0)::bigint as active_bytes,
    coalesce(sum(m.file_size_bytes) filter (
      where (m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin and m.removed_at >= now() - interval '30 days')
         or (m.status <> 'removed' and e.deleted_at >= now() - interval '30 days')
    ), 0)::bigint as standby_bytes
  from public.media m
  join public.events e on e.id = m.event_id
  where e.host_id = p_host_id;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;
grant execute on function public.host_storage_summary(uuid) to service_role;

comment on function public.host_storage_summary(uuid) is
  'A host''s active and Deleted bytes in one aggregate (the storage meter and the storage guard). Active matches host_active_bytes(uuid). Deleted is exactly what her two Deleted lists show: a removal that is neither a guest''s own withdrawal nor an operator''s, and a deleted event''s live media, each inside the 30-day window. Service-role only: the app proves the host with getUser() first.';

-- =============================================================================================
-- 3. restore_event: what stays in Deleted is what her Deleted shows.
-- =============================================================================================
-- Byte-for-byte 20260928130000 except the closing count. The profiles lock, the slot re-check, the
-- capacity gate and the slug's release are untouched (migration-guards.test.ts pins the lock).
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
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
  v_slug_released boolean := false;
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
  -- event_slots (the stacked-pass count) overrides the static tier limit when present.
  v_max := coalesce(v_profile.event_slots, v_limits.max_events);
  if v_max is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_max then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_max);
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
  -- operator's removal, never a row past the window (a held one outlives it and must not be counted).
  select count(*) into v_still_removed from public.media
    where event_id = p_event_id
      and status = 'removed'
      and not removed_by_uploader
      and not removed_by_admin
      and removed_at >= now() - interval '30 days';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed,
    'custom_slug_released', v_slug_released);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

-- =============================================================================================
-- 4. purge_media_now: the host cannot end an operator's removal early.
-- =============================================================================================
-- Byte-for-byte 20260707150000 except the one predicate. An id the subset drops reads as purged 0,
-- exactly as a held id does, so the answer tells a takedown from nothing.
create or replace function public.purge_media_now(p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_freed bigint;
begin
  -- Validated subset: only the caller's OWN, status='removed', NOT-held media that is NOT an
  -- operator's removal (the DB boundary: an operator's removal waits out its window for the runbook).
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids
    from public.media m
    join public.events e on e.id = m.event_id
    where m.id = any(p_media_ids)
      and e.host_id = (select auth.uid())
      and m.status = 'removed'
      and not m.removed_by_admin
      and m.legal_hold_at is null; -- legal hold: not purgeable on demand (ADR-0020)

  if array_length(v_ids, 1) is null then
    return jsonb_build_object('ok', true, 'purged', 0, 'freed_bytes', 0);
  end if;

  -- Internal call into the service-role-only purge_media_rows (owner context).
  select coalesce(sum(freed_bytes), 0)::bigint into v_freed
    from public.purge_media_rows(v_ids);

  return jsonb_build_object('ok', true, 'purged', array_length(v_ids, 1), 'freed_bytes', v_freed);
end;
$$;

revoke execute on function public.purge_media_now(uuid[]) from public, anon, authenticated;
grant execute on function public.purge_media_now(uuid[]) to authenticated;

-- =============================================================================================
-- 5. standby_hosts: the standby budget never counts nor evicts an operator's removal.
-- =============================================================================================
-- Byte-for-byte 20260924030000 except the removed arm's fourth marker.
create or replace function public.standby_hosts(p_after uuid default null, p_limit integer default null)
returns table (host_id uuid, standby_bytes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.host_id, sum(m.file_size_bytes)::bigint
  from public.media m
  join public.events e on e.id = m.event_id
  where m.legal_hold_at is null
    and (
      (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader and not m.removed_by_admin)
      or (m.status <> 'removed' and e.deleted_at is not null)
    )
    and (p_after is null or e.host_id > p_after)
  group by e.host_id
  having sum(m.file_size_bytes) > 0
  order by e.host_id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.standby_hosts(uuid, integer) from public, anon, authenticated;
grant execute on function public.standby_hosts(uuid, integer) to service_role;

comment on function public.standby_hosts(uuid, integer) is
  'Hosts with standby bytes as the purge cron''s budget counts them (removed media not removed by the system, withdrawn by its guest or taken down by an operator, plus the live media of a soft-deleted event; never a held item), keyset on host id with p_limit clamped to 1,000; a null p_limit reads everything. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 6. held_event_ids: an operator's removal inside its window keeps its event, as a hold does.
-- =============================================================================================
-- Byte-for-byte 20260924030000 except the second arm. `purge_at > now()` is exactly "not yet due":
-- the removed_media sweep takes a removal once `purge_at <= now`, so the two never both hold a row.
create or replace function public.held_event_ids(p_event_ids uuid[])
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(h.event_id order by h.event_id), '{}'::uuid[])
  from (
    select distinct m.event_id
    from public.media m
    where m.event_id = any(p_event_ids)
      and (
        m.legal_hold_at is not null
        or (m.status = 'removed' and m.removed_by_admin and m.purge_at > now())
      )
  ) h;
$$;

revoke all on function public.held_event_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.held_event_ids(uuid[]) to service_role;

comment on function public.held_event_ids(uuid[]) is
  'The ids among the input that hold ANY media the purge must keep, as one sorted uuid[] ({} when none): media under legal hold, or an operator''s removal still inside its window (purge_at in the future: the runbook''s time to hold and preserve). The purge sweeps skip those events whole. Service-role only; SECURITY INVOKER.';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate raise,
-- so nothing persists). It rides EXISTING rows: the operator's removal, a hold, the host's own removal
-- and the window's end are all written inside the block and undone by the final raise. It picks the
-- newest event with two live, unheld items and no hold anywhere in it (disposable test data). ─────────
-- do $$
-- declare
--   v_event uuid;
--   v_host uuid;
--   v_target uuid;
--   v_other uuid;
--   v_target_bytes bigint;
--   v_other_bytes bigint;
--   v_seen integer;
--   v_ids uuid[];
--   v_result jsonb;
--   a0 bigint; s0 bigint; a1 bigint; s1 bigint; a2 bigint; s2 bigint;
--   v_budget0 bigint; v_budget1 bigint;
--   v_claims text;
-- begin
--   select e.id, e.host_id into v_event, v_host
--     from public.events e
--    where e.deleted_at is null
--      and (select count(*) from public.media m
--            where m.event_id = e.id and m.status <> 'removed' and m.legal_hold_at is null) >= 2
--      and not exists (select 1 from public.media m where m.event_id = e.id and m.legal_hold_at is not null)
--      and not exists (select 1 from public.media m where m.event_id = e.id and m.removed_by_admin)
--    order by e.created_at desc
--    limit 1;
--   if v_event is null then raise exception 'SETUP: no event with two live, unheld items'; end if;
--   select m.id, m.file_size_bytes into v_target, v_target_bytes from public.media m
--    where m.event_id = v_event and m.status <> 'removed' and m.legal_hold_at is null
--    order by m.created_at desc, m.id desc limit 1;
--   select m.id, m.file_size_bytes into v_other, v_other_bytes from public.media m
--    where m.event_id = v_event and m.status <> 'removed' and m.legal_hold_at is null and m.id <> v_target
--    order by m.created_at desc, m.id desc limit 1;
--   v_claims := json_build_object('sub', v_host, 'role', 'authenticated')::text;
--   perform set_config('request.jwt.claims', v_claims, true);
--   select s.active_bytes, s.standby_bytes into a0, s0 from public.host_storage_summary(v_host) s;
--   select coalesce(sum(h.standby_bytes), 0) into v_budget0 from public.standby_hosts() h where h.host_id = v_host;
--
--   -- 1. The operator's removal, as removalUpdate() writes it (the service role, past RLS).
--   update public.media set status = 'removed', removed_at = now(), removed_by_admin = true where id = v_target;
--
--   -- 2. As the host: the row is gone from every read she has (the album, her Deleted, the bell).
--   set local role authenticated;
--   select count(*) into v_seen from public.media where id = v_target;
--   if v_seen <> 0 then raise exception 'FAIL: the host still reads the operator''s removal'; end if;
--   select count(*) into v_seen from public.media
--    where event_id = v_event and status = 'removed' and removed_by_uploader = false
--      and removed_at >= now() - interval '30 days' and id = v_target;
--   if v_seen <> 0 then raise exception 'FAIL: the removal is in her Deleted'; end if;
--   -- 3. Her Delete permanently purges nothing, and her Restore is refused.
--   v_result := public.purge_media_now(array[v_target]);
--   if (v_result->>'purged')::int <> 0 then raise exception 'FAIL: the host purged a takedown: %', v_result; end if;
--   v_result := public.restore_media(v_target);
--   if coalesce((v_result->>'ok')::boolean, false) then raise exception 'FAIL: the host restored a takedown'; end if;
--   -- 4. Her own removal of the other item still reaches her Deleted (the rule hides nothing else).
--   update public.media set status = 'removed', removed_at = now() where id = v_other;
--   select count(*) into v_seen from public.media where id = v_other and status = 'removed';
--   if v_seen <> 1 then raise exception 'FAIL: the host lost her own removal'; end if;
--   reset role;
--   select count(*) into v_seen from public.media where id = v_target;
--   if v_seen <> 1 then raise exception 'FAIL: the takedown''s row did not survive the host'; end if;
--   raise notice 'OK: the takedown left her album and her Deleted, and she can neither purge nor restore it';
--
--   -- 5. Her figures: the takedown left active and never entered Deleted; her own removal moved across.
--   select s.active_bytes, s.standby_bytes into a1, s1 from public.host_storage_summary(v_host) s;
--   if a1 <> a0 - v_target_bytes - v_other_bytes or s1 <> s0 + v_other_bytes then
--     raise exception 'FAIL: active % -> %, Deleted % -> % (takedown %, her removal %)', a0, a1, s0, s1, v_target_bytes, v_other_bytes;
--   end if;
--   select coalesce(sum(h.standby_bytes), 0) into v_budget1 from public.standby_hosts() h where h.host_id = v_host;
--   if v_budget1 <> v_budget0 + v_other_bytes then
--     raise exception 'FAIL: the standby budget moved % -> %, expected + % only', v_budget0, v_budget1, v_other_bytes;
--   end if;
--   raise notice 'OK: her Deleted figure and the standby budget count her removal and never the takedown';
--
--   -- 6. Inside its window the takedown keeps its event from every event-level purge.
--   v_ids := public.held_event_ids(array[v_event]);
--   if not (v_event = any(v_ids)) then raise exception 'FAIL: an event with a takedown in its window reads purgeable'; end if;
--   -- ...and past it (the removal 31 days old), a plain takedown no longer does.
--   update public.media set removed_at = now() - interval '31 days' where id = v_target;
--   v_ids := public.held_event_ids(array[v_event]);
--   if v_event = any(v_ids) then raise exception 'FAIL: a takedown past its window still keeps its event'; end if;
--   raise notice 'OK: a takedown keeps its event for its window, then lets it go';
--
--   -- 7. A held row survives the purge past its window, and so does its preservation record.
--   update public.media set legal_hold_at = now(), legal_hold_reason = 'rolled-back check' where id = v_target;
--   if not exists (select 1 from public.upload_forensics where media_id = v_target) then
--     insert into public.upload_forensics (media_id, event_id, uploader_kind)
--       values (v_target, v_event, 'guest');
--   end if;
--   update public.upload_forensics set preserved_at = now(), preserved_original_key = 'preservation/check/original.jpg'
--    where media_id = v_target;
--   perform * from public.purge_media_rows(array[v_target]);
--   select count(*) into v_seen from public.media where id = v_target;
--   if v_seen <> 1 then raise exception 'FAIL: a held takedown was purged'; end if;
--   select count(*) into v_seen from public.upload_forensics
--    where media_id = v_target and preserved_original_key = 'preservation/check/original.jpg';
--   if v_seen <> 1 then raise exception 'FAIL: the preservation record did not survive'; end if;
--   v_ids := public.held_event_ids(array[v_event]);
--   if not (v_event = any(v_ids)) then raise exception 'FAIL: a held event reads purgeable'; end if;
--   raise notice 'OK: a held takedown and its preservation record survive the purge, and keep the event';
--
--   -- 8. The policy's shape, and the flag still unreadable by the host.
--   if (select qual from pg_policies where schemaname = 'public' and tablename = 'media'
--        and policyname = 'media_host_all') not like '%removed_by_admin%' then
--     raise exception 'FAIL: media_host_all does not name the operator''s removal';
--   end if;
--   if has_column_privilege('authenticated', 'public.media', 'removed_by_admin', 'select') then
--     raise exception 'FAIL: removed_by_admin became readable by the host';
--   end if;
--   raise notice 'OK: the policy carries the rule and the flag stays ungranted';
--
--   raise exception 'ROLLED BACK: every operator-removal check held';
-- end $$;
