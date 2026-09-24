-- The 1,000-row cap, part 3 of 3: the sweeps' two discovery reads, as helpers the cap cannot cut
-- (Will, 2026-09-23: "Let's ensure we will not face any of those issues here").
--
-- WHY: PostgREST cuts every read at `max_rows` (1,000 here) silently, and two of the purge cron's
-- discovery reads return a row per ITEM where the sweep needs an answer per EVENT or per HOST:
--   1. THE LEGAL-HOLD PARTITION. The expired-events sweep (src/app/api/cron/purge/route.ts) and
--      account deletion (src/lib/lifecycle/account-deletion.ts, twice) read one row per HELD photo of
--      the candidate events and split the events with partitionEventsByHold
--      (src/lib/forensics/legal-hold.ts). Past 1,000 held rows the read ends early and an event whose
--      held rows fell past the cut reads as purgeable: its R2 objects are deleted and the event row's
--      cascade takes the held rows with it. A legal-hold breach, however unlikely; held_event_ids
--      answers the partition as one uuid[] of the events that hold anything.
--   2. THE STANDBY BUDGET'S HOST DISCOVERY. sweepStandbyBudget reads one row per removed photo and per
--      soft-deleted event, platform-wide, to learn which hosts have a Deleted bin at all; past 1,000
--      rows a host is never checked and the budget never evicts for them. standby_hosts answers it as
--      a keyset page of (host, bytes), the bytes being exactly what the budget counts.
--
-- purge_media_rows stays as it is (20260729150000): it returns one row per host among at most its own
-- input, and its SQL caller purge_media_now sums it; the cron's lane keeps each call to at most 1,000
-- ids.
--
-- SHAPE: both SECURITY INVOKER with an empty search_path, EXECUTE held by service_role alone (the cron
-- and account deletion run on the service-role client, which reads past RLS). INVOKER, so neither can
-- appear in a SECURITY DEFINER advisor list, and a grant that ever reached a client role by mistake
-- would read only what that role's own RLS shows. Both are additive: nothing deployed calls them.
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) apply verbatim (no function is replaced, so
-- there is no drift to check: the query below reads no row before, and after it reads
-- held_event_ids(uuid[]) 53178fabf1521aea676871e81935d814 and standby_hosts(uuid, integer)
-- e93f87159f884e9d7a2e8402ebef430c, the bodies' md5 on the local pre-flight);
--   select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('held_event_ids', 'standby_hosts');
-- (2) the grants: service_role only; (3) get_advisors, EXPECTED DELTA: NONE; (4) the rolled-back check
-- at the foot; (5) regenerate src/lib/db/types.ts (two new functions).

-- =============================================================================================
-- 1. held_event_ids: which of these events hold ANY media under legal hold, as ONE uuid[].
-- =============================================================================================
-- The input is the candidate events (the night's expired events, or an account's events); the answer
-- is the subset that holds at least one media row with `legal_hold_at` set, distinct and ordered by
-- id, `{}` when none do. The sweep skips those events WHOLE (the cascade is all-or-nothing) and they
-- re-enter it once the hold releases. The partial index media_legal_hold_idx serves the read, since
-- holds are rare.
create function public.held_event_ids(p_event_ids uuid[])
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
      and m.legal_hold_at is not null
  ) h;
$$;

revoke all on function public.held_event_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.held_event_ids(uuid[]) to service_role;

-- =============================================================================================
-- 2. standby_hosts: every host with standby bytes, and the bytes, paged on host id.
-- =============================================================================================
-- THE BYTES ARE EXACTLY WHAT THE STANDBY BUDGET COUNTS, the two disjoint arms of sweepStandbyBudget's
-- bin plus delete-final's rule:
--   * removed media (`status = 'removed'`), unless the system removed it (`removed_by_system`: the
--     over-capacity sweep's auto-reduce, which purges on its own schedule and must never blow the
--     budget it is meant to relieve) or its own guest withdrew it (`removed_by_uploader`: a guest's
--     delete is final and never counts in the host's budget; it purges on its 30-day purge_at through
--     the removed_media sweep), and never a held item;
--   * the media that is NOT removed in a soft-deleted event, never a held item.
-- Only hosts with more than zero bytes are listed: a host outside the list has nothing the budget
-- could evict. The keyset is host id (`host_id > p_after`, ordered by host id) and the limit rule is
-- the round's: `least(p_limit, 1000)` when given, everything when null. The cron reads each listed
-- host's cap and bin itself; the budget arithmetic stays in TypeScript (effectiveStorageCap and
-- RECENTLY_DELETED_BUDGET_MULTIPLIER have their homes there).
create function public.standby_hosts(p_after uuid default null, p_limit integer default null)
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
      (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader)
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

comment on function public.held_event_ids(uuid[]) is
  'The ids among the input that hold ANY media under legal hold, as one sorted uuid[] ({} when none). The purge sweeps skip those events whole. Service-role only; SECURITY INVOKER.';
comment on function public.standby_hosts(uuid, integer) is
  'Hosts with standby bytes as the purge cron''s budget counts them (removed media not removed by the system or withdrawn by its guest, plus the live media of a soft-deleted event; never a held item), keyset on host id with p_limit clamped to 1,000; a null p_limit reads everything. Service-role only; SECURITY INVOKER.';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate
-- raise, so nothing persists). It rides EXISTING rows: holds, a guest's withdrawal through the real
-- remove_my_upload_by_session, a host's removal, a system removal and a soft-deleted event are all
-- written inside the block and undone by the final raise. ────────────────────────────────────────
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   v_probe uuid;
--   v_host uuid;
--   v_other uuid;
--   v_clear uuid;
--   v_got uuid[];
--   v_hand uuid[];
--   v_rows integer;
--   v_figures jsonb;
--   v_paged jsonb;
--   v_page jsonb;
--   v_after uuid;
--   v_pages integer;
--   v_count integer;
--   v_media uuid;
--   v_token text;
--   v_bytes bigint;
--   v_result jsonb;
--   s0 bigint; s1 bigint; s2 bigint; s3 bigint; s4 bigint; s5 bigint;
--   v_system uuid;
--   v_live bigint;
-- begin
--   select e.id, e.host_id into v_probe, v_host from public.events e where e.qr_token = c_qr and e.deleted_at is null;
--   if v_probe is null then raise exception 'SETUP: the scale probe (qr %) is missing', c_qr; end if;
--   select e.id into v_other from public.events e
--    where e.id <> v_probe and exists (select 1 from public.media m where m.event_id = e.id)
--    order by e.created_at limit 1;
--   select e.id into v_clear from public.events e where e.id not in (v_probe, v_other) order by e.created_at limit 1;
--   if v_other is null or v_clear is null then raise exception 'SETUP: the check needs three events, two of them with media'; end if;
--
--   -- 1. held_event_ids: 1,100 held rows on the probe (past the cap, the breach case) and one on a
--   --    second event; a third event holds nothing, an unknown id and a null ride along.
--   update public.media m set legal_hold_at = now(), legal_hold_reason = 'row-cap check'
--    where m.id in (select x.id from public.media x where x.event_id = v_probe order by x.created_at, x.id limit 1100);
--   get diagnostics v_rows = row_count;
--   if v_rows <> 1100 then raise exception 'SETUP: % probe rows took a hold, not 1,100', v_rows; end if;
--   update public.media m set legal_hold_at = now(), legal_hold_reason = 'row-cap check'
--    where m.id = (select x.id from public.media x where x.event_id = v_other order by x.created_at, x.id limit 1);
--   get diagnostics v_rows = row_count;
--   if v_rows <> 1 then raise exception 'SETUP: the second event has no media to hold'; end if;
--   update public.media m set legal_hold_at = null, legal_hold_reason = null where m.event_id = v_clear;
--   select coalesce(array_agg(distinct m.event_id order by m.event_id), '{}') into v_hand
--     from public.media m
--    where m.event_id = any(array[v_probe, v_other, v_clear]) and m.legal_hold_at is not null;
--   set local role service_role;
--   v_got := public.held_event_ids(array[v_probe, v_other, v_clear, gen_random_uuid(), null::uuid]);
--   if public.held_event_ids(null) <> '{}'::uuid[] or public.held_event_ids('{}') <> '{}'::uuid[] then
--     raise exception 'FAIL: held_event_ids of nothing is not {}';
--   end if;
--   reset role;
--   if v_got <> v_hand or cardinality(v_got) <> 2 or not (v_probe = any(v_got)) or not (v_other = any(v_got)) then
--     raise exception 'FAIL: held_event_ids % differs from the hand tally % (the probe and the second event)', v_got, v_hand;
--   end if;
--   raise notice 'OK: held_event_ids names exactly the two events that hold anything (1,100 held rows on one)';
--   update public.media m set legal_hold_at = null, legal_hold_reason = null
--    where m.legal_hold_reason = 'row-cap check';
--
--   -- 2. standby_hosts against a hand tally of the same predicate, spelled as its two arms, paged at 1.
--   select coalesce(jsonb_object_agg(t.host_id, t.bytes), '{}') into v_figures
--     from (select a.host_id, sum(a.bytes) as bytes
--             from (select e.host_id, m.file_size_bytes as bytes
--                     from public.media m join public.events e on e.id = m.event_id
--                    where m.status = 'removed' and m.removed_by_system = false and m.removed_by_uploader = false
--                      and m.legal_hold_at is null
--                   union all
--                   select e.host_id, m.file_size_bytes
--                     from public.media m join public.events e on e.id = m.event_id
--                    where e.deleted_at is not null and m.status <> 'removed' and m.legal_hold_at is null) a
--            group by a.host_id
--           having sum(a.bytes) > 0) t;
--   set local role service_role;
--   v_paged := '{}'; v_after := null; v_pages := 0;
--   loop
--     select coalesce(jsonb_object_agg(r.host_id, r.standby_bytes), '{}'),
--            (array_agg(r.host_id order by r.host_id desc))[1],
--            count(*)
--       into v_page, v_after, v_count
--       from public.standby_hosts(v_after, 1) r;
--     exit when v_count = 0;
--     if v_count > 1 then raise exception 'FAIL: a standby page of % rows at p_limit 1', v_count; end if;
--     v_paged := v_paged || v_page;
--     v_pages := v_pages + 1;
--     if v_pages > 100000 then raise exception 'FAIL: the standby pages never ended'; end if;
--   end loop;
--   select count(*) into v_count from public.standby_hosts(null, 5000);
--   reset role;
--   if v_paged <> v_figures then
--     raise exception 'FAIL: standby_hosts paged at 1 % differs from the hand tally %', v_paged, v_figures;
--   end if;
--   if v_count <> (select count(*) from jsonb_object_keys(v_figures)) then
--     raise exception 'FAIL: p_limit 5000 listed % hosts, the hand tally %', v_count, (select count(*) from jsonb_object_keys(v_figures));
--   end if;
--   raise notice 'OK: standby_hosts equals the hand tally over % hosts, paged at 1: %', v_pages, v_figures;
--
--   -- 3. What moves a host's figure, through the paths that write it. The host: the owner of a live
--   --    upload on an unclaimed guest row (the withdrawal needs its session token).
--   select m.id, e.host_id, m.file_size_bytes, g.session_token into v_media, v_host, v_bytes, v_token
--     from public.media m
--     join public.guests g on g.id = m.guest_id and g.event_id = m.event_id
--     join public.events e on e.id = m.event_id
--    where m.status <> 'removed' and e.deleted_at is null and g.user_id is null and g.session_token is not null
--      and m.legal_hold_at is null and m.file_size_bytes > 0
--    order by m.created_at desc, m.id desc limit 1;
--   if v_media is null then raise exception 'SETUP: no live upload on an unclaimed guest row'; end if;
--   select coalesce(sum(r.standby_bytes), 0) into s0 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   -- a) the guest withdraws it (the real path): the host's figure does not move.
--   v_result := public.remove_my_upload_by_session(v_token, v_media);
--   if coalesce((v_result ->> 'ok')::boolean, false) is not true then raise exception 'SETUP: the withdrawal was refused: %', v_result; end if;
--   select coalesce(sum(r.standby_bytes), 0) into s1 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   if s1 <> s0 then raise exception 'FAIL: a guest''s withdrawal of % bytes moved the host''s figure % -> %', v_bytes, s0, s1; end if;
--   -- b) the host removes another live item: its bytes join the figure.
--   select m.id, m.file_size_bytes into v_media, v_bytes
--     from public.media m join public.events e on e.id = m.event_id
--    where e.host_id = v_host and e.deleted_at is null and m.status <> 'removed' and m.legal_hold_at is null
--      and m.file_size_bytes > 0
--    order by m.created_at desc, m.id desc limit 1;
--   update public.media set status = 'removed', removed_at = now() where id = v_media;
--   select coalesce(sum(r.standby_bytes), 0) into s2 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   if s2 <> s1 + v_bytes then raise exception 'FAIL: a host''s removal of % bytes moved the figure % -> %', v_bytes, s1, s2; end if;
--   -- c) the system removes a third: nothing moves.
--   select m.id into v_system
--     from public.media m join public.events e on e.id = m.event_id
--    where e.host_id = v_host and e.deleted_at is null and m.status <> 'removed' and m.legal_hold_at is null
--      and m.file_size_bytes > 0
--    order by m.created_at desc, m.id desc limit 1;
--   update public.media set status = 'removed', removed_at = now(), removed_by_system = true where id = v_system;
--   select coalesce(sum(r.standby_bytes), 0) into s3 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   if s3 <> s2 then raise exception 'FAIL: a system removal moved the figure % -> %', s2, s3; end if;
--   -- d) a hold on the host's removal takes it back out.
--   update public.media set legal_hold_at = now() where id = v_media;
--   select coalesce(sum(r.standby_bytes), 0) into s4 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   if s4 <> s2 - v_bytes then raise exception 'FAIL: a held removal still counts: % -> %', s2, s4; end if;
--   update public.media set legal_hold_at = null where id = v_media;
--   -- e) the host soft-deletes the event: its live, unheld media join the figure (the withdrawn and
--   --    the system-removed items stay out).
--   select coalesce(sum(m.file_size_bytes), 0) into v_live
--     from public.media m
--    where m.event_id = (select x.event_id from public.media x where x.id = v_media)
--      and m.status <> 'removed' and m.legal_hold_at is null;
--   update public.events set deleted_at = now() where id = (select x.event_id from public.media x where x.id = v_media);
--   select coalesce(sum(r.standby_bytes), 0) into s5 from public.standby_hosts(null, null) r where r.host_id = v_host;
--   if s5 <> s2 + v_live then
--     raise exception 'FAIL: soft-deleting the event (% live bytes) moved the figure % -> %', v_live, s2, s5;
--   end if;
--   raise notice 'OK: a withdrawal and a system removal move nothing; a host removal, a hold and a deleted event move exactly their bytes';
--
--   -- 4. The grants and the shapes: service_role alone; INVOKER; the search_path pinned.
--   if has_function_privilege('anon', 'public.held_event_ids(uuid[])', 'execute')
--      or has_function_privilege('authenticated', 'public.held_event_ids(uuid[])', 'execute')
--      or not has_function_privilege('service_role', 'public.held_event_ids(uuid[])', 'execute') then
--     raise exception 'FAIL: held_event_ids is not service_role only';
--   end if;
--   if has_function_privilege('anon', 'public.standby_hosts(uuid, integer)', 'execute')
--      or has_function_privilege('authenticated', 'public.standby_hosts(uuid, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.standby_hosts(uuid, integer)', 'execute') then
--     raise exception 'FAIL: standby_hosts is not service_role only';
--   end if;
--   if exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('held_event_ids', 'standby_hosts')
--        and (p.prosecdef or p.proconfig is distinct from array['search_path=""'])) then
--     raise exception 'FAIL: a sweep helper is SECURITY DEFINER or its search_path is not pinned';
--   end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('held_event_ids', 'standby_hosts')) <> 2 then
--     raise exception 'FAIL: expected exactly one signature per function';
--   end if;
--   raise notice 'OK: the grants, one signature each, INVOKER and the search_path';
--
--   raise exception 'ROLLED BACK: every row_cap_sweeps check held';
-- end $$;
