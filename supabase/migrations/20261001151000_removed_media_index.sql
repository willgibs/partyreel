-- =============================================================================================
-- THE REMOVED-MEDIA INDEX THE NIGHTLY HOST DISCOVERY AND THE REMOVED-MEDIA SWEEP SHARE (lane `crumbs-37`,
-- ROADMAP's Performance line).
--
-- standby_hosts (the standby-budget sweep's host discovery, a page of hosts at a time) read the bin through
-- one OR across media and events: a removed row its host removed, or a live row of a soft-deleted event. No
-- index serves an OR across two tables, so every page scanned every media row platform-wide (the live plan
-- on 2026-10-01: a Seq Scan on media, the OR a join filter; on a 1,200,000-row stand-in, a Parallel Seq
-- Scan reading all 1,200,000 to keep 50,730). Past about a million rows that spends the sweep's share on
-- rows no bin holds. So:
--
--   1. media_removed_idx (purge_at, id) WHERE status = 'removed': the removed rows, in the order the
--      removed_media sweep pages them, REPLACING media_purge_at_idx (purge_at) WHERE purge_at IS NOT NULL.
--      The two hold the same rows (set_media_purge_at sets purge_at exactly when a row is removed and clears
--      it on every other status: 67 of 67 removed rows live carry one, and no other row does), so the swap
--      writes nothing more on any status change. Every reader of media.purge_at already says status =
--      'removed' (the sweep's page and its count, defer_kept_due_media, held_event_ids, the bell's soonest
--      purge), so each keeps an index: the sweep's pages read it (a Bitmap Index Scan on the stand-in), and
--      the bell's soonest purge walks it in order.
--   2. standby_hosts takes its rows from the bin's two halves, each by its own index, and applies the
--      budget's predicate (20260929140000's, byte for byte) over them: the removed rows (media_removed_idx),
--      and the live rows of each soft-deleted event (the events first, then each one's live media by an index
--      on event_id, a LATERAL read fenced with `offset 0` so the planner cannot fold it back into a hash join
--      over the whole table). Every row the predicate accepts is in one half (its first arm asks
--      status = 'removed', its second status <> 'removed' with a deleted event), and the halves never
--      overlap, so the hosts and their bytes are exactly today's: on the stand-in, 5,000 hosts and
--      132,203,373,604 bytes either way, no host apart. The plan there: a Bitmap Index Scan on
--      media_removed_idx (40,000 rows) and a Nested Loop over the 185 deleted events, each a Bitmap Index
--      Scan on media_active_bytes_idx; 26 ms where the OR took 80, and no read of a row outside the bin.
--
-- Signature, class and grants unchanged (SECURITY INVOKER, service role only), so the advisors move not at
-- all, and no deployed caller changes.
--
-- LOCKS AT APPLY: `create index` (not concurrently: apply_migration runs in a transaction) holds SHARE on
-- media while it builds over the removed rows (67 today: an instant), blocking writes to media for that
-- instant; `drop index` takes ACCESS EXCLUSIVE on media for an instant.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: media_purge_at_idx is `(purge_at) WHERE (purge_at IS NOT NULL)` and no
--       media_removed_idx exists (select indexname, indexdef from pg_indexes where tablename = 'media');
--       standby_hosts' prosrc is 20260929140000's; every removed row has a purge_at and no other does
--       (select count(*) from media where (status = 'removed') <> (purge_at is not null) reads 0).
--   (2) Apply verbatim.
--   (3) get_advisors: EXPECTED DELTA none (performance: an unused-index notice for media_removed_idx may
--       show until the sweep's first night reads it, as media_purge_at_idx's would).
--   (4) Types unchanged (no column, no signature).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

create index media_removed_idx on public.media (purge_at, id) where status = 'removed';

drop index public.media_purge_at_idx;

create or replace function public.standby_hosts(p_after uuid default null, p_limit integer default null)
returns table (host_id uuid, standby_bytes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.host_id, sum(m.file_size_bytes)::bigint
  from (
    select r.event_id, r.status, r.file_size_bytes, r.legal_hold_at, r.removed_by_system,
           r.removed_by_uploader, r.removed_by_admin, r.purge_asked_at
      from public.media r
     where r.status = 'removed'
    union all
    select l.event_id, l.status, l.file_size_bytes, l.legal_hold_at, l.removed_by_system,
           l.removed_by_uploader, l.removed_by_admin, l.purge_asked_at
      from public.events d
      cross join lateral (
        select x.event_id, x.status, x.file_size_bytes, x.legal_hold_at, x.removed_by_system,
               x.removed_by_uploader, x.removed_by_admin, x.purge_asked_at
          from public.media x
         where x.event_id = d.id
           and x.status <> 'removed'
        offset 0
      ) l
     where d.deleted_at is not null
  ) m
  join public.events e on e.id = m.event_id
  where m.legal_hold_at is null
    and (
      (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null)
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
  'Hosts with standby bytes as the purge cron''s budget counts them (removed media not removed by the system, withdrawn by its guest, taken down by an operator or asked to be deleted permanently, plus the live media of a soft-deleted event; never a held item), read from the bin''s two halves by index (media_removed_idx, and each deleted event''s live media), keyset on host id with p_limit clamped to 1,000; a null p_limit reads everything. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). Today's body is inlined below
-- as the reference (`v_old`), and both bodies are asked of the live data, whole and page by page. The live
-- tables are far too small for the planner to prefer an index on its own (it seq-scans 1,500 rows, rightly),
-- so the plans are read with `enable_seqscan` off, which shows what the indexes CAN serve: the deployed body
-- (its own prosrc, so the check reads what runs) reads media only through indexes, its removed half through
-- media_removed_idx; the removed_media sweep's page reads media_removed_idx.
-- The error it ends on must read `ROLLED BACK: every removed-media-index check held {...}`.
-- The lane ran it on a throwaway local cluster (Postgres 17) with the file applied verbatim, and on the live
-- project BEFORE the apply (2026-10-01): red on today's schema, then green with the file's statements at the
-- head of the same transaction, rolled back.
-- =============================================================================================
-- do $check$
-- declare
--   v_old constant text := $old$
--     select e.host_id, sum(m.file_size_bytes)::bigint as standby_bytes
--     from public.media m
--     join public.events e on e.id = m.event_id
--     where m.legal_hold_at is null
--       and (
--         (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null)
--         or (m.status <> 'removed' and e.deleted_at is not null)
--       )
--     group by e.host_id
--     having sum(m.file_size_bytes) > 0
--   $old$;
--   v_body text;
--   v_plan text;
--   v_n bigint;
--   v_hosts bigint;
--   v_page uuid;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   -- ── 1. The index: the removed rows keyed (purge_at, id); the old purge_at index gone ──
--   if (select pg_get_indexdef(i.indexrelid) from pg_index i
--        where i.indexrelid = to_regclass('public.media_removed_idx'))
--      is distinct from 'CREATE INDEX media_removed_idx ON public.media USING btree (purge_at, id) WHERE (status = ''removed''::media_status)' then
--     raise exception 'FAIL 1: media_removed_idx is missing or not the removed rows keyed (purge_at, id)';
--   end if;
--   if to_regclass('public.media_purge_at_idx') is not null then
--     raise exception 'FAIL 1: media_purge_at_idx still stands beside it';
--   end if;
--   -- The two held the same rows: a removed row always has a purge_at, and no other row does.
--   select count(*) into v_n from public.media where (status = 'removed') <> (purge_at is not null);
--   if v_n <> 0 then raise exception 'FAIL 1: % rows where removed and purge_at disagree', v_n; end if;
--
--   -- ── 2. standby_hosts answers exactly what today's body answers, whole and page by page ──
--   execute format('select count(*) from ((%s) except (select * from public.standby_hosts(null, null))) d', v_old) into v_n;
--   if v_n <> 0 then raise exception 'FAIL 2: % hosts of today''s answer are missing or differ', v_n; end if;
--   execute format('select count(*) from ((select * from public.standby_hosts(null, null)) except (%s)) d', v_old) into v_n;
--   if v_n <> 0 then raise exception 'FAIL 2: % hosts are new or differ', v_n; end if;
--   select count(*) into v_hosts from public.standby_hosts(null, null);
--   v_page := null;
--   v_n := 0;
--   loop
--     select max(h.host_id::text)::uuid into v_page from public.standby_hosts(v_page, 1) h;
--     exit when v_page is null;
--     v_n := v_n + 1;
--     exit when v_n > v_hosts;
--   end loop;
--   if v_n <> v_hosts then raise exception 'FAIL 2: one host a page walked % pages of % hosts', v_n, v_hosts; end if;
--   v_report := v_report || jsonb_build_object('hosts', v_hosts);
--
--   -- ── 3. The plans, with seq scans off: what each index can serve ──
--   set local enable_seqscan = off;
--   select p.prosrc into v_body from pg_proc p where p.oid = 'public.standby_hosts(uuid, integer)'::regprocedure;
--   v_body := replace(replace(rtrim(btrim(v_body, E' \n'), ';'), 'p_after', 'null::uuid'), 'p_limit', 'null::integer');
--   execute 'explain (format json) ' || v_body into v_plan;
--   if v_plan not like '%"Index Name": "media_removed_idx"%'
--      or v_plan ~ '"Node Type": "Seq Scan",[^}]*"Relation Name": "media"' then
--     raise exception 'FAIL 3: standby_hosts reads media other than through an index: %', v_plan;
--   end if;
--   execute $q$explain (format json)
--     select id, original_key, preview_key, purge_at from public.media
--      where status = 'removed' and purge_at is not null and purge_at <= now() and legal_hold_at is null
--      order by purge_at asc, id asc limit 1000$q$ into v_plan;
--   if v_plan not like '%"Index Name": "media_removed_idx"%' then
--     raise exception 'FAIL 3: the removed_media sweep''s page does not read media_removed_idx: %', v_plan;
--   end if;
--   reset enable_seqscan;
--
--   -- ── 4. Still the service role's alone ──
--   if has_function_privilege('anon', 'public.standby_hosts(uuid, integer)', 'execute')
--      or has_function_privilege('authenticated', 'public.standby_hosts(uuid, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.standby_hosts(uuid, integer)', 'execute') then
--     raise exception 'FAIL 4: standby_hosts'' grants moved';
--   end if;
--
--   raise exception 'ROLLED BACK: every removed-media-index check held %', v_report;
-- end
-- $check$;
