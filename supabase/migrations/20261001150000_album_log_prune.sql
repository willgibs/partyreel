-- =============================================================================================
-- THE ALBUM CHANGE LOG, PRUNED UNDER A WATERMARK (lane `crumbs-37`, ROADMAP's line from `album-pages`).
--
-- `album_changes` keeps one row per item that ever changed, and the row outlives its item: a purged
-- item's row is its tombstone, how a client that has not heard yet learns the item left. Nothing ever
-- deleted one, so the log grew by every item ever purged from a living album, for good. This file lets
-- a job delete them without ever leaving a client with a silent gap:
--
--   1. album_state gains two WATERMARKS, one per scope: host_watermark (the host's `version` counter)
--      and album_watermark (the guest album's `album_max`). Every change row ever pruned had its
--      host_version at or below the first and its album_version (when it had one) at or below the
--      second. A client holding a version BELOW its scope's watermark may have missed a pruned row, so
--      the planner (`planAlbumSync`, src/lib/events/album-sync.ts) answers it with the album whole (a
--      fresh manifest); a client at or above it missed nothing (every pruned row was at or below what it
--      holds), so its delta stands. Zero until the first prune, which is the truth: nothing pruned.
--   2. album_changes_since answers the asked scope's watermark, read in the same snapshot as the
--      versions and the changes, so a prune that commits between two reads is wholly seen or wholly not.
--      Otherwise byte for byte 20260926100000's body.
--   3. album_prune_tombstones(p_after, p_limit): the purge cron's album-log sweep, one call a batch. It
--      takes the albums the next p_limit rows of the log after the album p_after touch, each WHOLE (so a
--      pass resumes on an album boundary, a uuid the run row can carry), and for each one holding a
--      tombstone (a row whose media row is gone) raises the watermarks to the deleted rows' versions
--      and deletes them, in one transaction. A live item's row is never pruned, so a delta from at or
--      above the watermark is exactly the delta it always was.
--   4. The sweep's kill switch, `purge_album_log_enabled`, seeded ON (`ops_flags`, admin-observability.md).
--
-- WHY A TOMBSTONE CAN GO AT ALL. Its versions are the ones its removal stamped (a purge takes a removed
-- row, which sits outside both scopes, so the purge itself stamps nothing): a client that has synced
-- since that removal already applied it, and one that has not is below the watermark the prune raises,
-- so it resyncs. And it is frozen: no row is ever stamped again once its media row is gone, so what the
-- prune read is what it deletes (the delete re-asks that the media row is still gone all the same).
--
-- ★ LOCK ORDER, AS THE ALBUM ROWS' RULE (20260926100000's header, database-security.md): a transaction
-- holding an album row waits on nothing but album rows. The prune takes the album's album_state row
-- FIRST (`for no key update`, the lock the flush's upsert takes, so the two serialize per album), then
-- its change rows, the same order as every stamp (the flush locks album_state before it upserts a
-- change) and as an event's hard delete (its cascade deletes album_state, then album_changes); it
-- reads media and takes no lock there. A call takes its albums in event-id order, the flush's order,
-- so no two can wait on each other in a cycle. Readers take no row locks.
--
-- AN EXPAND: the deployed code never calls the prune, and parseAlbumRead reads a missing `watermark` as
-- zero, so partyreel.com and the alias read exactly what they read today until the code that prunes
-- ships; then a client below a watermark gets the manifest it would have got past 500 changes.
--
-- LOCKS AT APPLY: `alter table album_state add column ... default 0` takes ACCESS EXCLUSIVE on
-- album_state for an instant (a constant default rewrites nothing), so a commit that bumps an album
-- waits that instant; nothing else here locks a table.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: album_state has no *_watermark column, no album_prune_tombstones exists, and
--       album_changes_since's prosrc is 20260926100000's:
--         select column_name from information_schema.columns
--          where table_schema = 'public' and table_name = 'album_state' order by ordinal_position;
--       reads event_id, version, album_max, attr_version, updated_at.
--   (2) Apply verbatim.
--   (3) get_advisors: EXPECTED DELTA none (the prune is SECURITY DEFINER and service_role's alone, so it
--       is in neither 0028 nor 0029; no table, policy or client grant is added).
--   (4) Regenerate src/lib/db/types.ts: album_state's two columns and album_prune_tombstones.
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

-- =============================================================================================
-- 1. The watermarks.
-- =============================================================================================
alter table public.album_state
  add column host_watermark bigint not null default 0,
  add column album_watermark bigint not null default 0;

comment on column public.album_state.host_watermark is
  'Every album_changes row album_prune_tombstones deleted had host_version at or below this: a host client holding a lower version is sent the album whole (planAlbumSync). Raised only by the prune, never lowered.';
comment on column public.album_state.album_watermark is
  'Every album_changes row album_prune_tombstones deleted had album_version (when set) at or below this: a guest client holding a lower album_max is sent the album whole (planAlbumSync). Raised only by the prune, never lowered.';

-- =============================================================================================
-- 2. The reader: 20260926100000's body, answering the asked scope's watermark beside the versions.
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
    'approved', case when p_scope in ('album', 'host') then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'approved') end,
    'hidden', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'hidden') end,
    'pending', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'pending') end,
    'changes', coalesce((
      select jsonb_agg(
               jsonb_build_array(
                 c.media_id, c.v, m.status, m.type, m.width, m.height, m.duration_seconds,
                 m.preview_key is not null, m.reel_eligible,
                 (extract(epoch from m.created_at) * 1000000)::bigint,
                 case when p_scope = 'host' then m.guest_id end)
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
  'The paged album''s poll read, one jsonb in one snapshot: {version, album_max, attr_version, watermark, approved, hidden, pending, changes: [[media_id, version, status, type, width, height, duration_seconds, has_preview, reel_eligible, created_at_us, guest_id], ...]}. watermark is the asked scope''s (host_watermark or album_watermark): a client below it is sent the album whole. p_scope ''album'' (guest: changes across approved, the approved count) or ''host'' (every status change, three counts, guest_id). Keyset on the scope''s version after p_after, clamped to 1,000. SECURITY INVOKER, service role only: the route decides who may see the album.';

-- =============================================================================================
-- 3. The prune.
-- =============================================================================================
-- One call is one transaction over a handful of albums:
--   * THE ALBUMS: those the next p_limit rows of the log after the album p_after touch (the primary
--     key's order, an index range scan), each taken WHOLE, so the call ends on an album boundary and
--     `last` is where the next one starts. An album larger than p_limit is one call by itself.
--   * THE TOMBSTONES: each album's rows whose media row is gone, found with no lock (a left join on
--     media's primary key), its examined rows counted beside them.
--   * PER ALBUM WITH ONE, in event-id order: its album_state row locked first, the tombstones deleted
--     (re-asking that each media row is still gone), and the watermarks raised to the highest version
--     among the rows actually deleted, never lowered. Both land at the call's commit, together.
-- It answers {albums, examined, pruned, pruned_albums, last}: `last` null means the log has no album
-- after p_after, the pass is complete. p_limit is clamped to 1 .. 50,000 (a null asks for 5,000).
create function public.album_prune_tombstones(
  p_after uuid default null,
  p_limit integer default 5000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit constant integer := least(greatest(coalesce(p_limit, 5000), 1), 50000);
  v_albums uuid[];
  v_examined bigint := 0;
  v_pruned bigint := 0;
  v_pruned_albums integer := 0;
  v_top_host bigint;
  v_top_album bigint;
  v_n integer;
  r record;
begin
  select coalesce(array_agg(distinct w.event_id), '{}'::uuid[])
    into v_albums
    from (
      select c.event_id
        from public.album_changes c
       where p_after is null or c.event_id > p_after
       order by c.event_id, c.media_id
       limit v_limit
    ) w;

  for r in
    select c.event_id,
           count(*) as examined,
           array_agg(c.media_id) filter (where m.id is null) as gone
      from public.album_changes c
      left join public.media m on m.id = c.media_id
     where c.event_id = any (v_albums)
     group by c.event_id
     order by c.event_id
  loop
    v_examined := v_examined + r.examined;
    continue when r.gone is null;

    -- The album's version row first, the lock the flush's upsert takes: the album rows' one order.
    perform 1 from public.album_state s where s.event_id = r.event_id for no key update;

    with pruned as (
      delete from public.album_changes c
       where c.event_id = r.event_id
         and c.media_id = any (r.gone)
         and not exists (select 1 from public.media m where m.id = c.media_id)
      returning c.host_version, c.album_version
    )
    select count(*), max(p.host_version), max(p.album_version)
      into v_n, v_top_host, v_top_album
      from pruned p;

    if v_n > 0 then
      update public.album_state s
         set host_watermark = greatest(s.host_watermark, v_top_host),
             album_watermark = greatest(s.album_watermark, coalesce(v_top_album, 0))
       where s.event_id = r.event_id;
      v_pruned := v_pruned + v_n;
      v_pruned_albums := v_pruned_albums + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'albums', cardinality(v_albums),
    'examined', v_examined,
    'pruned', v_pruned,
    'pruned_albums', v_pruned_albums,
    -- uuid has no max(): the greatest by order.
    'last', (select x.a from unnest(v_albums) as x(a) order by x.a desc limit 1)
  );
end;
$$;

comment on function public.album_prune_tombstones(uuid, integer) is
  'The purge cron''s album-log sweep, one batch: the albums the next p_limit change rows after the album p_after touch, each whole; per album holding a tombstone (a change row whose media row is gone), its album_state row locked first, the tombstones deleted and the watermarks raised to the deleted rows'' versions, in one transaction. Answers {albums, examined, pruned, pruned_albums, last}; last null ends a pass. SECURITY DEFINER (album_changes is deny-all, service_role SELECT only), service role only.';

-- =============================================================================================
-- 4. The sweep's kill switch, seeded ON like every sub-sweep's (a missing row reads as enabled too).
-- =============================================================================================
insert into public.ops_flags (key, enabled) values ('purge_album_log_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- Grants: the reader restated as it stands; the prune never a client role's.
-- =============================================================================================
revoke all on function public.album_changes_since(uuid, text, bigint, integer) from public, anon, authenticated;
grant execute on function public.album_changes_since(uuid, text, bigint, integer) to service_role;
revoke all on function public.album_prune_tombstones(uuid, integer) from public, anon, authenticated;
grant execute on function public.album_prune_tombstones(uuid, integer) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). It rides the scale probe
-- (event 14bb4318-80cd-4eed-b219-92c097ee16c7, willg97's: 1,145 approved, 20 held, 35 removed), makes
-- three tombstones there (three approved photographs removed, then purged through purge_media_rows),
-- prunes the whole log, and checks: the probe's three rows gone and its watermarks at their removal's
-- versions; no live item's row touched anywhere; every tombstone in the log gone and every album's
-- watermark covering what it lost; the reader answering each scope's watermark; a second pass pruning
-- nothing; a cursor past the probe never examining it; the client roles refused. `set constraints all
-- immediate` makes each statement one flush of one transaction, as in 20260926100000's check.
-- The error it ends on must read `ROLLED BACK: every album-log check held {...}`.
-- The lane ran it (1) on a throwaway local cluster (Postgres 17) holding a stand-in of the album tables
-- and the live bodies of their triggers, with the file applied verbatim and a concurrent stress of the
-- prune beside every writer shape (see the lane's handoff), and (2) on the live project BEFORE the apply
-- (2026-10-01): red on today's schema, then green with the file's statements at the head of the same
-- transaction, rolled back.
-- =============================================================================================
-- do $check$
-- declare
--   c_event constant uuid := '14bb4318-80cd-4eed-b219-92c097ee16c7';
--   v_v bigint;
--   v_a bigint;
--   v_gone uuid[];
--   v_live_before bigint;
--   v_live_after bigint;
--   v_j jsonb;
--   v_pass jsonb;
--   v_n bigint;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   if not exists (select 1 from public.events e where e.id = c_event and e.deleted_at is null) then
--     raise exception 'SETUP: the scale probe % is not a live event', c_event;
--   end if;
--
--   -- ── 1. The columns: two bigint watermarks, not null, zero by default ──
--   select count(*) into v_n from information_schema.columns
--    where table_schema = 'public' and table_name = 'album_state'
--      and column_name in ('host_watermark', 'album_watermark')
--      and data_type = 'bigint' and is_nullable = 'NO' and column_default = '0';
--   if v_n <> 2 then raise exception 'FAIL 1: album_state has % of its two watermarks', v_n; end if;
--
--   -- ── 2. The prune: definer, pinned, the service role's alone; the switch seeded ON ──
--   if not exists (select 1 from pg_proc p
--                   where p.oid = to_regprocedure('public.album_prune_tombstones(uuid, integer)')
--                     and p.prosecdef and p.proconfig @> array['search_path=""'])
--      or has_function_privilege('anon', 'public.album_prune_tombstones(uuid, integer)', 'execute')
--      or has_function_privilege('authenticated', 'public.album_prune_tombstones(uuid, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.album_prune_tombstones(uuid, integer)', 'execute')
--      or has_function_privilege('anon', 'public.album_changes_since(uuid, text, bigint, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.album_changes_since(uuid, text, bigint, integer)', 'execute') then
--     raise exception 'FAIL 2: the prune or the reader has the wrong class or grants';
--   end if;
--   if not coalesce((select f.enabled from public.ops_flags f where f.key = 'purge_album_log_enabled'), false) then
--     raise exception 'FAIL 2: the sweep''s switch is not seeded on';
--   end if;
--
--   -- ── 3. The reader answers each scope's watermark ──
--   v_j := public.album_changes_since(c_event, 'album', 0, 0);
--   if not (v_j ? 'watermark') or (v_j ->> 'watermark')::bigint <> (select s.album_watermark from public.album_state s where s.event_id = c_event) then
--     raise exception 'FAIL 3: the album read answers no watermark: %', v_j - 'changes';
--   end if;
--
--   -- ── 4. Three tombstones on the probe: removed (one version, both scopes), then purged (no stamp) ──
--   set constraints all immediate;
--   select array_agg(x.id) into v_gone from (
--     select m.id from public.media m where m.event_id = c_event and m.status = 'approved'
--      order by m.created_at desc, m.id desc limit 3) x;
--   update public.media set status = 'removed', removed_at = now() where id = any (v_gone);
--   select s.version, s.album_max into v_v, v_a from public.album_state s where s.event_id = c_event;
--   perform public.purge_media_rows(v_gone);
--   if exists (select 1 from public.media where id = any (v_gone))
--      or (select count(*) from public.album_changes c where c.event_id = c_event and c.media_id = any (v_gone)) <> 3 then
--     raise exception 'SETUP 4: the three are not tombstones';
--   end if;
--   select count(*) into v_live_before from public.album_changes c
--    where exists (select 1 from public.media m where m.id = c.media_id);
--
--   -- ── 5. One whole pass of the log, in batches as the sweep calls it ──
--   v_pass := jsonb_build_object('albums', 0, 'pruned', 0, 'calls', 0);
--   v_j := public.album_prune_tombstones(null, 500);
--   loop
--     v_pass := jsonb_build_object(
--       'albums', (v_pass ->> 'albums')::bigint + (v_j ->> 'albums')::bigint,
--       'pruned', (v_pass ->> 'pruned')::bigint + (v_j ->> 'pruned')::bigint,
--       'calls', (v_pass ->> 'calls')::bigint + 1);
--     exit when v_j -> 'last' = 'null'::jsonb;
--     v_j := public.album_prune_tombstones((v_j ->> 'last')::uuid, 500);
--   end loop;
--   v_report := v_report || jsonb_build_object('pass', v_pass);
--
--   -- a) the probe's three are gone, its watermarks exactly their removal's versions
--   if exists (select 1 from public.album_changes c where c.media_id = any (v_gone))
--      or (select format('%s/%s', s.host_watermark, s.album_watermark) from public.album_state s where s.event_id = c_event)
--         <> format('%s/%s', v_v, v_a) then
--     raise exception 'FAIL 5a: the probe reads %', (select to_jsonb(s) from public.album_state s where s.event_id = c_event);
--   end if;
--   -- b) no live item's row went anywhere
--   select count(*) into v_live_after from public.album_changes c
--    where exists (select 1 from public.media m where m.id = c.media_id);
--   if v_live_after <> v_live_before then
--     raise exception 'FAIL 5b: % live rows before, % after', v_live_before, v_live_after;
--   end if;
--   -- c) no tombstone is left in the log, and no album's watermark is above its own version
--   if exists (select 1 from public.album_changes c where not exists (select 1 from public.media m where m.id = c.media_id))
--      or exists (select 1 from public.album_state s where s.host_watermark > s.version or s.album_watermark > s.album_max) then
--     raise exception 'FAIL 5c: a tombstone stayed, or a watermark passed its version';
--   end if;
--
--   -- ── 6. The reader after: each scope's own watermark; a client below it would resync ──
--   v_j := public.album_changes_since(c_event, 'host', 0, 0);
--   if (v_j ->> 'watermark')::bigint <> v_v then raise exception 'FAIL 6: the host read %', v_j - 'changes'; end if;
--   v_j := public.album_changes_since(c_event, 'album', 0, 0);
--   if (v_j ->> 'watermark')::bigint <> v_a then raise exception 'FAIL 6: the album read %', v_j - 'changes'; end if;
--   v_report := v_report || jsonb_build_object('probe', jsonb_build_array(v_v, v_a));
--
--   -- ── 7. A second pass prunes nothing and moves no watermark; a cursor past the probe never reads it ──
--   v_j := public.album_prune_tombstones(null, 50000);
--   if (v_j ->> 'pruned')::bigint <> 0 then raise exception 'FAIL 7: a second pass pruned %', v_j; end if;
--   v_j := public.album_prune_tombstones(c_event, 50000);
--   if (v_j ->> 'last') is not null and (v_j ->> 'last')::uuid <= c_event then
--     raise exception 'FAIL 7: a cursor past the probe read %', v_j;
--   end if;
--
--   -- ── 8. The client roles are refused the prune ──
--   set local role authenticated;
--   begin
--     perform public.album_prune_tombstones(null, 1);
--     raise exception 'FAIL 8: authenticated ran the prune';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   set local role anon;
--   begin
--     perform public.album_prune_tombstones(null, 1);
--     raise exception 'FAIL 8: anon ran the prune';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--
--   raise exception 'ROLLED BACK: every album-log check held %', v_report;
-- end
-- $check$;
