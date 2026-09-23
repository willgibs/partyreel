-- A guest's own withdrawal leaves the host's Deleted figure (delete-final, Will's note of 2026-09-23:
-- "if a guest deletes their own uploads, it should not be recoverable by the host ... I want it gone
-- everywhere, not still visible to the host as well").
--
-- WHY: `host_storage_summary` (20260923140000) answers the storage meter's two numbers, and its
-- standby_bytes was "everything that is not active": removed media, or any media in a soft-deleted
-- event. That set held a guest's own withdrawal too (a removed row marked `removed_by_uploader`, by
-- remove_my_upload's guest arm, remove_my_upload_by_session or disown_guest_rows_by_email), which the
-- host can neither see (listRecentlyDeletedMedia filters it) nor restore (restore_media refuses it).
-- So the dashboard meter's "+ X in Deleted" line counted bytes the host's Deleted never shows: on the
-- live data when this was written, one host's meter read 2.5 MB in Deleted while their Deleted held a
-- single 27 KB photo, the rest being four guests' withdrawals. A number that moves when a guest
-- changes their mind is the host still seeing the withdrawal.
--
-- THE DEFINITIONS AFTER THIS FILE (no row is counted twice):
--   * active_bytes  = unchanged: non-removed media in NON-deleted events, byte for byte the
--                     `host_active_bytes(uuid)` helper the upload functions enforce (20260604002059);
--   * standby_bytes = what the host can RESTORE: everything not active, less a guest's own
--                     withdrawal. A host's removal and the media of a soft-deleted event count here;
--                     a withdrawal counts in NEITHER number (it is not live, and it is not the host's
--                     to bring back).
--   The withdrawal predicate is the one get_upload_gate already reads for "the guest removed it
--   themselves" (`m.status = 'removed' and m.removed_by_uploader`), so a stale marker on a row that is
--   live again can never hide it from either number.
--
-- WHAT DOES NOT CHANGE: a withdrawn object stays stored until its purge_at (the 30-day hold) and
-- `storage_used_bytes`, the physical meter, counts it until the purge; the purge cron's own standby
-- BUDGET is TypeScript (sweepStandbyBudget) and takes the same rule in its own lane.
--
-- SHAPE: the same signature, return type and posture as 20260923140000: SQL, stable, SECURITY DEFINER
-- with an empty search_path, EXECUTE revoked from public, anon and authenticated and held by
-- service_role alone (re-stated below so this file stands on its own; a replace keeps the ACL). The
-- app's callers are unchanged: `getHostStorageSummary` after `getUser()`, and the admin's account view,
-- which reads only active_bytes.
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) apply verbatim; (2) the body's md5 and the
-- grants (service_role only); (3) get_advisors (no change expected: the function stays out of both
-- SECURITY DEFINER lists); (4) the rolled-back check at the foot; (5) regenerate src/lib/db/types.ts
-- (no change expected: the signature is the same).

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
      where not (m.status <> 'removed' and e.deleted_at is null)
        and not (m.status = 'removed' and m.removed_by_uploader)
    ), 0)::bigint as standby_bytes
  from public.media m
  join public.events e on e.id = m.event_id
  where e.host_id = p_host_id;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;
grant execute on function public.host_storage_summary(uuid) to service_role;

comment on function public.host_storage_summary(uuid) is
  'A host''s active and Deleted bytes in one aggregate (the storage meter and the storage guard). Active matches host_active_bytes(uuid). Deleted is only what the host can restore: a guest''s own withdrawal (status removed and removed_by_uploader) counts in neither number. Service-role only: the app proves the host with getUser() first.';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate raise,
-- so nothing persists). It rides the disposable test data: one live upload on an UNCLAIMED guest row
-- (a name-only guest), withdrawn through the real remove_my_upload_by_session, and a second live
-- upload of the same host removed the way the host's Remove writes it. ──────────────────────────────
-- do $$
-- declare
--   v_host uuid;
--   v_active bigint;
--   v_standby bigint;
--   v_hand_active bigint;
--   v_hand_standby bigint;
--   v_n int := 0;
--   v_media uuid;
--   v_event uuid;
--   v_token text;
--   v_bytes bigint;
--   v_other uuid;
--   v_other_bytes bigint;
--   v_event_live bigint;
--   v_result jsonb;
--   a0 bigint; s0 bigint; a1 bigint; s1 bigint; a2 bigint; s2 bigint; a3 bigint; s3 bigint;
-- begin
--   -- 1. For every host with media: active equals host_active_bytes, and both numbers equal a hand
--   --    tally written the other way round (the restorable set spelled as its two arms).
--   for v_host in select distinct e.host_id from public.events e join public.media m on m.event_id = e.id loop
--     select s.active_bytes, s.standby_bytes into v_active, v_standby
--       from public.host_storage_summary(v_host) s;
--     if v_active <> public.host_active_bytes(v_host) then
--       raise exception 'FAIL: active % <> host_active_bytes % for %', v_active, public.host_active_bytes(v_host), v_host;
--     end if;
--     select coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed' and e.deleted_at is null), 0),
--            coalesce(sum(m.file_size_bytes) filter (
--              where (m.status = 'removed' and not m.removed_by_uploader)
--                 or (e.deleted_at is not null and m.status <> 'removed')), 0)
--       into v_hand_active, v_hand_standby
--       from public.media m join public.events e on e.id = m.event_id
--      where e.host_id = v_host;
--     if v_active <> v_hand_active or v_standby <> v_hand_standby then
--       raise exception 'FAIL: % / % against the hand tally % / % for %',
--         v_active, v_standby, v_hand_active, v_hand_standby, v_host;
--     end if;
--     v_n := v_n + 1;
--   end loop;
--   raise notice 'OK: % hosts agree with host_active_bytes and a hand tally', v_n;
--
--   -- 2. A guest's withdrawal, through the real path: it leaves active and never enters standby.
--   select m.id, m.event_id, e.host_id, m.file_size_bytes, g.session_token
--     into v_media, v_event, v_host, v_bytes, v_token
--     from public.media m
--     join public.guests g on g.id = m.guest_id and g.event_id = m.event_id
--     join public.events e on e.id = m.event_id
--    where m.status <> 'removed' and e.deleted_at is null and g.user_id is null
--      and g.session_token is not null and m.legal_hold_at is null and m.file_size_bytes > 0
--    order by m.created_at desc
--    limit 1;
--   if v_media is null then raise exception 'SETUP: no live upload on an unclaimed guest row'; end if;
--   select s.active_bytes, s.standby_bytes into a0, s0 from public.host_storage_summary(v_host) s;
--   v_result := public.remove_my_upload_by_session(v_token, v_media);
--   if coalesce((v_result->>'ok')::boolean, false) is not true then
--     raise exception 'SETUP: the withdrawal was refused: %', v_result;
--   end if;
--   select s.active_bytes, s.standby_bytes into a1, s1 from public.host_storage_summary(v_host) s;
--   if a1 <> a0 - v_bytes or s1 <> s0 then
--     raise exception 'FAIL: a withdrawal of % moved active % -> % and standby % -> %', v_bytes, a0, a1, s0, s1;
--   end if;
--   if a1 <> public.host_active_bytes(v_host) then raise exception 'FAIL: active drifted from host_active_bytes'; end if;
--   raise notice 'OK: a guest''s withdrawal left active and never entered standby';
--
--   -- 3. A host's removal of another live upload: its bytes move from active to standby.
--   select m.id, m.file_size_bytes into v_other, v_other_bytes
--     from public.media m join public.events e on e.id = m.event_id
--    where e.host_id = v_host and e.deleted_at is null and m.status <> 'removed'
--      and m.legal_hold_at is null and m.file_size_bytes > 0 and m.id <> v_media
--    limit 1;
--   if v_other is null then raise exception 'SETUP: no second live upload for %', v_host; end if;
--   update public.media set status = 'removed', removed_at = now() where id = v_other;
--   select s.active_bytes, s.standby_bytes into a2, s2 from public.host_storage_summary(v_host) s;
--   if a2 <> a1 - v_other_bytes or s2 <> s1 + v_other_bytes then
--     raise exception 'FAIL: a host removal of % moved active % -> % and standby % -> %', v_other_bytes, a1, a2, s1, s2;
--   end if;
--   raise notice 'OK: a host removal moved its bytes from active to standby';
--
--   -- 4. Soft-delete the withdrawn upload's event: its live media join standby, the withdrawal still
--   --    counts in neither number.
--   select coalesce(sum(m.file_size_bytes), 0) into v_event_live
--     from public.media m where m.event_id = v_event and m.status <> 'removed';
--   update public.events set deleted_at = now() where id = v_event;
--   select s.active_bytes, s.standby_bytes into a3, s3 from public.host_storage_summary(v_host) s;
--   if a3 <> a2 - v_event_live or s3 <> s2 + v_event_live then
--     raise exception 'FAIL: soft-deleting the event (% live) moved active % -> % and standby % -> %',
--       v_event_live, a2, a3, s2, s3;
--   end if;
--   raise notice 'OK: a deleted event''s live media joined standby and the withdrawal stayed out';
--
--   -- 5. A host with no media reads zeros, never null.
--   select s.active_bytes, s.standby_bytes into v_active, v_standby
--     from public.host_storage_summary(gen_random_uuid()) s;
--   if v_active <> 0 or v_standby <> 0 then raise exception 'FAIL: an unknown host read % / %', v_active, v_standby; end if;
--   raise notice 'OK: an unknown host reads 0 / 0';
--
--   -- 6. No client role can call it; service_role can.
--   if has_function_privilege('anon', 'public.host_storage_summary(uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.host_storage_summary(uuid)', 'execute') then
--     raise exception 'FAIL: a client role holds EXECUTE';
--   end if;
--   if not has_function_privilege('service_role', 'public.host_storage_summary(uuid)', 'execute') then
--     raise exception 'FAIL: service_role lost EXECUTE';
--   end if;
--   raise notice 'OK: anon and authenticated hold no EXECUTE; service_role does';
--
--   raise exception 'ROLLED BACK: every host_storage_summary check held';
-- end $$;
