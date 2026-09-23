-- The storage meter's two numbers in ONE aggregate (a billing follow-on of the storage guard, Will's
-- rule of 2026-09-22: "no plan change leaves a host storing more than the new cap").
--
-- WHY: `getHostStorageSummary` (src/lib/db/queries/storage.ts) sums a host's media in Node from keyset
-- pages of 1,000 rows, because PostgREST silently caps a response at `max_rows`. It is correct, but a
-- 35,000-item account costs 35 round trips on every dashboard load, every account page, the plan
-- sheet's facts and both storage-guard routes. This function answers the same two numbers with one
-- SUM each, so the meter and the guard read one row whatever the album's size.
--
-- THE SAME DEFINITIONS AS `tallyStorageRows`, which every row falls into exactly one of:
--   * active_bytes  = non-removed media in NON-deleted events: what the cap enforces, byte for byte
--                     the `host_active_bytes(uuid)` helper the upload functions read (20260604002059);
--   * standby_bytes = everything else: removed media, or any media in a soft-deleted event (the
--                     "Recently deleted" bin the purge cron's standby budget bounds).
--
-- SHAPE: the `host_active_bytes` precedent exactly. SQL, stable, SECURITY DEFINER with an empty
-- search_path, REVOKED from public, anon and authenticated, so it appears in neither SECURITY DEFINER
-- advisor list (0028/0029): the app calls it through the service-role client AFTER `getUser()` has
-- proved whose storage it is (the host's own id, or any host's for the admin's account view). It is
-- never granted to a client role, since a caller-supplied host id would read anyone's totals.
--
-- APPLY PROTOCOL (database-security.md → Workflow): additive, nothing calls it yet, so the running
-- alias and partyreel.com are unaffected. (1) apply verbatim; (2) md5 and grants; (3) get_advisors
-- (no change expected); (4) the rolled-back check at the foot; (5) regenerate src/lib/db/types.ts.

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
    ), 0)::bigint as standby_bytes
  from public.media m
  join public.events e on e.id = m.event_id
  where e.host_id = p_host_id;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;

comment on function public.host_storage_summary(uuid) is
  'A host''s active and Recently deleted bytes in one aggregate (the storage meter and the storage guard). Service-role only: the app proves the host with getUser() first. Active matches host_active_bytes(uuid).';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate raise,
-- so nothing persists) ──────────────────────────────────────────────────────────────────────────────
-- do $$
-- declare
--   v_host uuid;
--   v_active bigint;
--   v_standby bigint;
--   v_hand_active bigint;
--   v_hand_standby bigint;
--   v_n int := 0;
-- begin
--   -- 1. for every host with media, the function equals host_active_bytes and a hand tally
--   for v_host in select distinct e.host_id from public.events e join public.media m on m.event_id = e.id loop
--     select s.active_bytes, s.standby_bytes into v_active, v_standby
--       from public.host_storage_summary(v_host) s;
--     if v_active <> public.host_active_bytes(v_host) then
--       raise exception 'FAIL: active % <> host_active_bytes % for %', v_active, public.host_active_bytes(v_host), v_host;
--     end if;
--     select coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed' and e.deleted_at is null), 0),
--            coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' or e.deleted_at is not null), 0)
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
--   -- 2. a host with no media reads zeros, never null
--   select s.active_bytes, s.standby_bytes into v_active, v_standby
--     from public.host_storage_summary(gen_random_uuid()) s;
--   if v_active <> 0 or v_standby <> 0 then raise exception 'FAIL: an unknown host read % / %', v_active, v_standby; end if;
--   raise notice 'OK: an unknown host reads 0 / 0';
--
--   -- 3. no client role can call it
--   if has_function_privilege('anon', 'public.host_storage_summary(uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.host_storage_summary(uuid)', 'execute') then
--     raise exception 'FAIL: a client role holds EXECUTE';
--   end if;
--   raise notice 'OK: anon and authenticated hold no EXECUTE';
--
--   raise exception 'ROLLED BACK — every host_storage_summary check held';
-- end $$;
