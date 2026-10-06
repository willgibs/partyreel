-- =============================================================================================
-- UPLOAD SUMS (lane `upload-sums`; PRICING.md's lever 7, "The dashboard and the storage list page"). What a host
-- stores, summed per event and per host by the database itself, so the reads that ask it stop walking every item she
-- owns: an upload's three reads through `host_storage_summary` (the upload context, `meter_upload`, then `create_media*`
-- under her lock) and the size list's per-event totals (`readStorageEvents`). A 5,000-event account then costs what a
-- 50-event one does. The answers do not change: the walk stays the one definition, and the sums are proved against it.
-- The mechanism is docs/systems/billing-caps.md's (the cap meter) and lifecycle-recovery.md's (Deleted, the purge,
-- restore); the lock order and grants database-security.md's.
--
--   1. TWO TABLES OF SUMS. `event_storage_sums`, a row per event holding anything counted: its live items
--      (`status <> 'removed'`), its binned ones (a removal that is neither the guest's own withdrawal, nor an
--      operator's, nor asked to leave for good: what Deleted can hold) and the part of those the over-capacity reduce
--      removed, each in bytes and items, and `binned_since`, its oldest binned item's removal. `host_storage_sums`, the
--      same six over every event of hers, deleted ones included. The host reads her own events' live totals under RLS
--      (the size list); nothing else of either is any client role's.
--   2. KEPT EXACT BY ONE TRIGGER BODY ON `media`, for every writer at once: after each INSERT, UPDATE and DELETE (three
--      triggers, since Postgres gives transition tables to a one-event trigger only), once a statement, off its
--      transition tables (each row's part in, its old part out, by event). WHY A TRIGGER rather than
--      the writing functions: bytes move through a dozen writers (both completes, the host's Remove and the guest's
--      withdrawal as client writes, the restores, block and Let back in, the operator's removal and restore, Delete
--      permanently, leave_deleted, the purge, an event's cascade, account deletion), and a sum one of them forgot would
--      drift with nothing to say so. WHY ONCE A STATEMENT: the purge and Empty Deleted move thousands of rows in a
--      call, and a statement's change is folded per event before a sum row is touched. A statement that moves nothing
--      (a seal, a caption time, a reel flag) is folded to nothing and touches no lock.
--   3. TIME IS READ, NEVER STORED. Deleted's edge moves with the clock (an item leaves at 30 days with no write), so no
--      sum can hold it. The sums hold what is binned whatever its age, and `host_storage_summary` takes off, at read
--      time, the binned items already past their 30 days (found through `binned_since` and one partial index, so only
--      the events holding one are visited: normally none, since the night's purge takes them) and her deleted events
--      by their own window (found by a partial index of her deleted events: normally a handful).
--   4. A BACKFILL, under a lock that holds every media write until the transaction ends, so no write lands between
--      the sums and the trigger.
--   5. `host_storage_summary` (create or replace, same signature and columns) reads the sums. The walk it replaces is
--      kept verbatim as `host_storage_walk` (the owner's alone), the one definition the sums are proved against.
--   6. THE RECONCILIATION, never a silent fix: `storage_sums_drift(after, limit)` compares, host by host, the sums
--      with the walk (the summary's three figures, each event's six and its `binned_since`, her total against her
--      events') and answers who drifted, fixing nothing. `rebuild_storage_sums(host)` is the operator's fix for one
--      host, rebuilt from the walk under her lock, answering what it read before and after. Both the service role's.
--      (The nightly call, its `/admin/jobs` signal and the Rebuild control are TypeScript outside this lane: its
--      manifest's Questions.)
--
-- ★ THE LOCK ORDER (database-security.md): her profiles row first, then her sums. The trigger takes the profiles row
-- of every host its statement touched (FOR NO KEY UPDATE, ordered by id, so two statements that touch two hosts never
-- take them in opposite orders) before it writes a sum row, so a sum row is only ever written under her profiles lock:
-- re-taking it where it is held already (create_media*, the restores, leave_deleted, empty_deleted, the over-capacity
-- reduce) is free, and two writers on one account serialize at the lock every capacity decision already takes. A
-- writer that holds media rows when its trigger asks for her profiles row (a client's Remove, the guest's withdrawal,
-- the purge) takes them in the order purge_media_rows and media_release_meter already do (media, then profiles); and
-- whoever holds a profiles row first never waits on a media row it could skip (leave_deleted's SKIP LOCKED). FOR NO
-- KEY UPDATE, not FOR UPDATE: it excludes every other writer of the row the same, and leaves the key-share locks an
-- insert referencing her (a new event) takes unblocked.
--
-- ★ NO FOREIGN KEY FROM THE SUMS TO `events`: an event's deletion cascades to its media and would cascade to its sum
-- row too, in an order Postgres does not promise, and a media trigger meeting the sum row gone could not name her to
-- take the event off her total. Instead the trigger, meeting an event that is gone, takes its whole row off her total
-- and deletes it; a row whose six figures reach zero is deleted too, so a row exists only while its event holds
-- something counted. `host_storage_sums` cascades with her profiles row (account deletion), and the trigger only
-- ever INSERTS a sum row for an event its statement's new rows name (which exists, and so does she).
--
-- WHAT DOES NOT CHANGE: what any figure says. `host_active_bytes`, `host_deleted_media`, `host_room_used`,
-- `leave_deleted`, `empty_deleted`, `meter_upload`, `create_media*` and the three advisories keep their bodies (each
-- reads `host_storage_summary`, whose answer is the walk's); no policy moves on an existing table; no grant moves on
-- an existing object.
--
-- MEASURED on a throwaway Postgres 16 stand-in (2026-10-06; the touched tables' columns, constraints and indexes, the
-- current bodies of every function read here; 1,002 hosts, 25,050 events, 905,000 media), warm:
--   the summary, 50 events (5,000 items)        before 1,429 buffers, 3.5 ms (every item read twice, by index)
--                                               after      21 buffers, 0.7 ms
--   the summary, 5,000 events (500,000 items)   before 54,143 buffers, 228 ms
--                                               after     618 buffers, 1.8 ms (60 deleted events and 55 with an
--                                               aged removal read by key: the night's purge leaves that near none)
--   a media write's trigger                     about 0.3 ms a statement (2,000 single-row Removes 37 ms -> 657 ms)
--   Empty Deleted, a 2,000-item batch           0.65 s -> 1.5 s (each item one statement; 8 s is the timeout)
--   the backfill                                905,000 media in 1.2 s
-- And a pgbench stress (8 clients, 30 s: uploads under her lock, Removes, restores, evictions, the purge, event and
-- account deletions): no deadlock, storage_sums_drift empty after.
--
-- WHAT THE DEPLOYED BUILDS MEET (partyreel.com and the alias share this database): the same figures, cheaper; every
-- media write carries the statement trigger (above). Their size list keeps walking media until this lane's build
-- ships. ★ APPLY BEFORE THIS LANE'S BUILD DEPLOYS: its `readStorageEvents` reads
-- `event_storage_sums`, a PGRST205 without this file.
--
-- LOCKS AT APPLY: `media` SHARE ROW EXCLUSIVE (the trigger, then the backfill holds it: media writes wait, reads do
-- not) and `events` SHARE (its index), both until the commit; two new tables; one index on each of `media` (its binned
-- rows) and `events` (its deleted rows), each partial. At today's size (zero real users) an instant.
--
-- ADVISORS (security): no new SECURITY DEFINER callable by anon or authenticated (the trigger function is no
-- client's; the reconciliation, the rebuild and the summary are the service role's; the walk is the owner's);
-- `host_storage_sums` joins the accepted deny-all `rls_enabled_no_policy` set beside `job_runs`;
-- `event_storage_sums` carries one policy (her own rows) and three column grants.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) of the one body this file replaces must
--       equal its newest repo definition: host_storage_summary 30b70bbe84e35dfc0662eda92ab7fa5c (20261003220000,
--       computed from the repo; the lane had no SQL access). And `event_storage_sums`, `host_storage_sums`,
--       `media_storage_sums`, `host_storage_walk`, `storage_sums_drift` and `rebuild_storage_sums` do not exist.
--   (2) The rolled-back proof at the foot, in one execute_sql call (RED without this file's statements, GREEN with).
--   (3) Apply verbatim.  (4) get_advisors (security): the delta above.  (5) Regenerate src/lib/db/types.ts (the two
--       tables and three functions), which drops the lane's typed seam (`sumsDb` in storage-list.ts).
-- =============================================================================================

-- =============================================================================================
-- 1. The sums.
-- =============================================================================================
create table public.event_storage_sums (
  event_id uuid primary key,
  host_id uuid not null,
  live_bytes bigint not null default 0,
  live_count integer not null default 0,
  binned_bytes bigint not null default 0,
  binned_count integer not null default 0,
  system_bytes bigint not null default 0,
  system_count integer not null default 0,
  -- The oldest binned item's removal (-infinity for one with none recorded), null when nothing is binned: the summary
  -- visits an event's binned rows only once this falls past the 30 days.
  binned_since timestamptz
);

create table public.host_storage_sums (
  host_id uuid primary key references public.profiles (id) on delete cascade,
  live_bytes bigint not null default 0,
  live_count integer not null default 0,
  binned_bytes bigint not null default 0,
  binned_count integer not null default 0,
  system_bytes bigint not null default 0,
  system_count integer not null default 0
);

-- The size list reads her rows by host (keyset on event_id); the summary reads the few whose binned items aged.
create index event_storage_sums_host_idx on public.event_storage_sums (host_id, event_id);
create index event_storage_sums_aged_idx on public.event_storage_sums (host_id, binned_since)
  where binned_since is not null;

-- Her deleted events, by host: the summary's window over them, without visiting her live ones.
create index events_host_deleted_idx on public.events (host_id) include (deleted_at) where deleted_at is not null;

-- An event's binned rows by removal: the trigger's `binned_since` and the summary's aged rows, each one index range.
-- The predicate is spelled exactly as every reader spells it, so the planner proves it.
create index media_binned_idx on public.media (event_id, removed_at nulls first)
  where status = 'removed' and not removed_by_uploader and not removed_by_admin and purge_asked_at is null;

alter table public.event_storage_sums enable row level security;
alter table public.host_storage_sums enable row level security;

-- The size list's one read (storage-list.ts): her own events' live totals, under RLS after getUser(). A column grant,
-- so nothing of Deleted's figures nor binned_since reaches a client; host_id because the read filters on it.
revoke all on public.event_storage_sums from public, anon, authenticated, service_role;
revoke all on public.host_storage_sums from public, anon, authenticated, service_role;
grant select (event_id, host_id, live_bytes, live_count) on public.event_storage_sums to authenticated;

create policy event_storage_sums_host_read on public.event_storage_sums
  for select to authenticated
  using (host_id = (select auth.uid()));

comment on table public.event_storage_sums is
  'Per event, what it stores (upload-sums): live items, binned items (removed, not withdrawn, not an operator''s, not asked: what Deleted can hold) and the over-capacity reduce''s among them, in bytes and items, and binned_since (the oldest binned removal). Kept by the media_storage_sums trigger; a row only while its event holds something counted. The host reads her own events'' live totals (event_id, host_id, live_bytes, live_count) under RLS; storage_sums_drift proves it against the walk.';
comment on table public.host_storage_sums is
  'Per host, the sum of her events'' event_storage_sums rows, deleted events included (upload-sums): host_storage_summary reads it, taking off at read time what the clock moved out of Deleted. Kept by the media_storage_sums trigger under her profiles lock; deny-all, read by definer bodies only.';

-- =============================================================================================
-- 2. The trigger: every write to media, folded per event, under her profiles lock.
-- =============================================================================================
create function public.media_storage_sums()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  v_changes jsonb;
  r record;
begin
  -- The statement's rows, each new one's part in (+1) and each old one's out (-1). Postgres gives a trigger with
  -- transition tables one event only, so three triggers share this body and each reads the tables its event has (an
  -- INSERT no old rows, a DELETE no new ones); plpgsql plans a statement when it first runs, so the branch not taken
  -- never names a table its trigger lacks.
  if tg_op in ('INSERT', 'UPDATE') then
    select v_rows || coalesce(jsonb_agg(jsonb_build_object('event_id', n.event_id, 'id', n.id, 'sgn', 1,
             'b', n.file_size_bytes, 'live', n.status <> 'removed',
             'binned', n.status = 'removed' and not n.removed_by_uploader and not n.removed_by_admin
                       and n.purge_asked_at is null,
             'sys', n.removed_by_system, 'removed_at', n.removed_at)), '[]'::jsonb)
      into v_rows
      from new_rows n;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    select v_rows || coalesce(jsonb_agg(jsonb_build_object('event_id', o.event_id, 'id', o.id, 'sgn', -1,
             'b', o.file_size_bytes, 'live', o.status <> 'removed',
             'binned', o.status = 'removed' and not o.removed_by_uploader and not o.removed_by_admin
                       and o.purge_asked_at is null,
             'sys', o.removed_by_system, 'removed_at', o.removed_at)), '[]'::jsonb)
      into v_rows
      from old_rows o;
  end if;

  -- What the statement changed, by event, and whether a binned row came, went or changed its removal (`moved`:
  -- binned_since is read again). A row the statement left as it was cancels itself out.
  with x as (
    select * from jsonb_to_recordset(v_rows) as t(event_id uuid, id uuid, sgn integer, b bigint, live boolean,
                                                  binned boolean, sys boolean, removed_at timestamptz)
  ),
  moved as (
    select distinct x.event_id from x where x.binned group by x.event_id, x.id, x.removed_at having sum(x.sgn) <> 0
  ),
  d as (
    select x.event_id,
           coalesce(sum(x.sgn * x.b) filter (where x.live), 0)::bigint as live_bytes,
           coalesce(sum(x.sgn) filter (where x.live), 0)::integer as live_count,
           coalesce(sum(x.sgn * x.b) filter (where x.binned), 0)::bigint as binned_bytes,
           coalesce(sum(x.sgn) filter (where x.binned), 0)::integer as binned_count,
           coalesce(sum(x.sgn * x.b) filter (where x.binned and x.sys), 0)::bigint as system_bytes,
           coalesce(sum(x.sgn) filter (where x.binned and x.sys), 0)::integer as system_count,
           bool_or(x.sgn = 1) as named_new
      from x
     group by x.event_id
  )
  -- Each event's owner and presence by its key (a lateral apiece, `offset 0` so neither is flattened into a join: the
  -- planner cannot size a jsonb set and would scan every event to hash it).
  select jsonb_agg(jsonb_build_object(
           'event_id', d.event_id,
           'host_id', coalesce(s.host_id, e.host_id),
           'present', e.id is not null,
           'named_new', d.named_new,
           'moved', exists (select 1 from moved mv where mv.event_id = d.event_id),
           'live_bytes', d.live_bytes, 'live_count', d.live_count,
           'binned_bytes', d.binned_bytes, 'binned_count', d.binned_count,
           'system_bytes', d.system_bytes, 'system_count', d.system_count)
         order by d.event_id)
    into v_changes
    from d
    left join lateral (select x.host_id from public.event_storage_sums x where x.event_id = d.event_id offset 0) s
      on true
    left join lateral (select x.id, x.host_id from public.events x where x.id = d.event_id offset 0) e on true
   where (d.live_bytes, d.live_count, d.binned_bytes, d.binned_count, d.system_bytes, d.system_count)
           <> (0::bigint, 0, 0::bigint, 0, 0::bigint, 0)
      or exists (select 1 from moved mv where mv.event_id = d.event_id)
      or e.id is null;

  if v_changes is null then
    return null;
  end if;

  -- Her profiles row first, every host's in id order: the one lock order every capacity decision takes.
  perform 1
    from public.profiles p
   where p.id in (select (c ->> 'host_id')::uuid from jsonb_array_elements(v_changes) c)
   order by p.id
     for no key update;

  for r in
    select *
      from jsonb_to_recordset(v_changes) as c(
        event_id uuid, host_id uuid, present boolean, named_new boolean, moved boolean,
        live_bytes bigint, live_count integer, binned_bytes bigint, binned_count integer,
        system_bytes bigint, system_count integer)
  loop
    if r.host_id is null then
      -- An event already gone with no sum row: its figures left her total with that row.
      continue;
    end if;

    if not r.present then
      -- The event is gone (its cascade, or the account's): its whole row leaves her total, whatever this statement
      -- carried, so a row is never left behind its event.
      with gone as (
        delete from public.event_storage_sums s where s.event_id = r.event_id returning s.*
      )
      update public.host_storage_sums h
         set live_bytes = h.live_bytes - g.live_bytes, live_count = h.live_count - g.live_count,
             binned_bytes = h.binned_bytes - g.binned_bytes, binned_count = h.binned_count - g.binned_count,
             system_bytes = h.system_bytes - g.system_bytes, system_count = h.system_count - g.system_count
        from gone g
       where h.host_id = g.host_id;
      continue;
    end if;

    if r.named_new then
      -- The statement's new rows name this event, so it exists and so does she: a missing row is made.
      insert into public.event_storage_sums as s
        (event_id, host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count)
      values (r.event_id, r.host_id, r.live_bytes, r.live_count, r.binned_bytes, r.binned_count, r.system_bytes,
              r.system_count)
      on conflict (event_id) do update
        set live_bytes = s.live_bytes + excluded.live_bytes, live_count = s.live_count + excluded.live_count,
            binned_bytes = s.binned_bytes + excluded.binned_bytes,
            binned_count = s.binned_count + excluded.binned_count,
            system_bytes = s.system_bytes + excluded.system_bytes,
            system_count = s.system_count + excluded.system_count;
      insert into public.host_storage_sums as h
        (host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count)
      values (r.host_id, r.live_bytes, r.live_count, r.binned_bytes, r.binned_count, r.system_bytes, r.system_count)
      on conflict (host_id) do update
        set live_bytes = h.live_bytes + excluded.live_bytes, live_count = h.live_count + excluded.live_count,
            binned_bytes = h.binned_bytes + excluded.binned_bytes,
            binned_count = h.binned_count + excluded.binned_count,
            system_bytes = h.system_bytes + excluded.system_bytes,
            system_count = h.system_count + excluded.system_count;
    else
      -- Old rows only (a delete): rows that left; a row is never made for them (her profile may be leaving too).
      update public.event_storage_sums s
         set live_bytes = s.live_bytes + r.live_bytes, live_count = s.live_count + r.live_count,
             binned_bytes = s.binned_bytes + r.binned_bytes, binned_count = s.binned_count + r.binned_count,
             system_bytes = s.system_bytes + r.system_bytes, system_count = s.system_count + r.system_count
       where s.event_id = r.event_id;
      update public.host_storage_sums h
         set live_bytes = h.live_bytes + r.live_bytes, live_count = h.live_count + r.live_count,
             binned_bytes = h.binned_bytes + r.binned_bytes, binned_count = h.binned_count + r.binned_count,
             system_bytes = h.system_bytes + r.system_bytes, system_count = h.system_count + r.system_count
       where h.host_id = r.host_id;
    end if;

    if r.moved then
      update public.event_storage_sums s
         set binned_since = (
               select coalesce(m.removed_at, '-infinity'::timestamptz)
                 from public.media m
                where m.event_id = r.event_id
                  and m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
                  and m.purge_asked_at is null
                order by m.removed_at nulls first
                limit 1)
       where s.event_id = r.event_id;
    end if;

    -- Nothing counted left in it: the row goes (only an exact zero, so a drifted row stays for the reconciliation).
    delete from public.event_storage_sums s
     where s.event_id = r.event_id
       and (s.live_bytes, s.live_count, s.binned_bytes, s.binned_count, s.system_bytes, s.system_count)
           = (0::bigint, 0, 0::bigint, 0, 0::bigint, 0);
  end loop;

  return null;
end;
$$;

revoke all on function public.media_storage_sums() from public, anon, authenticated, service_role;

comment on function public.media_storage_sums() is
  'Keeps event_storage_sums and host_storage_sums exact (upload-sums): once a media statement, its transition tables folded per event (new rows in, old rows out), her profiles row taken first (FOR NO KEY UPDATE, hosts in id order), then her sums; an event gone takes its whole row off her total; a row at zero goes. A statement that moves nothing counted takes no lock. SECURITY DEFINER (client roles write media under RLS and reach no sum); no role may call it.';

-- The backfill below and the trigger take one lock that holds every media write until the commit, so no write lands
-- between them; reads go on.
lock table public.media in share row exclusive mode;

create trigger media_storage_sums_insert
  after insert on public.media
  referencing new table as new_rows
  for each statement
  execute function public.media_storage_sums();

create trigger media_storage_sums_update
  after update on public.media
  referencing old table as old_rows new table as new_rows
  for each statement
  execute function public.media_storage_sums();

create trigger media_storage_sums_delete
  after delete on public.media
  referencing old table as old_rows
  for each statement
  execute function public.media_storage_sums();

-- =============================================================================================
-- 3. The backfill: every event holding anything counted, and every host's total of them.
-- =============================================================================================
insert into public.event_storage_sums
  (event_id, host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count, binned_since)
select m.event_id, e.host_id,
       coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed'), 0),
       count(*) filter (where m.status <> 'removed'),
       coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
         and not m.removed_by_admin and m.purge_asked_at is null), 0),
       count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
         and m.purge_asked_at is null),
       coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
         and not m.removed_by_admin and m.purge_asked_at is null and m.removed_by_system), 0),
       count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
         and m.purge_asked_at is null and m.removed_by_system),
       min(coalesce(m.removed_at, '-infinity'::timestamptz)) filter (where m.status = 'removed'
         and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null)
  from public.media m
  join public.events e on e.id = m.event_id
 group by m.event_id, e.host_id
having count(*) filter (where m.status <> 'removed' or (m.status = 'removed' and not m.removed_by_uploader
         and not m.removed_by_admin and m.purge_asked_at is null)) > 0;

insert into public.host_storage_sums
  (host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count)
select s.host_id, sum(s.live_bytes), sum(s.live_count), sum(s.binned_bytes), sum(s.binned_count),
       sum(s.system_bytes), sum(s.system_count)
  from public.event_storage_sums s
 group by s.host_id;

-- =============================================================================================
-- 4. The walk, kept: the one definition the sums answer to.
-- =============================================================================================
-- host_storage_summary's body before this file, verbatim: her albums (`host_active_bytes`) beside the sum of her
-- Deleted (`host_deleted_media`). It reads every item she owns, so nothing on a request's path calls it: the
-- reconciliation, the rebuild and the proofs do. The owner's alone (only definer bodies read it); SECURITY INVOKER.
create function public.host_storage_walk(
  p_host_id uuid,
  out active_bytes bigint,
  out standby_bytes bigint,
  out system_bytes bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select public.host_active_bytes(p_host_id),
         coalesce(sum(d.file_size_bytes), 0)::bigint,
         coalesce(sum(d.file_size_bytes) filter (where d.by_system), 0)::bigint
    from public.host_deleted_media(p_host_id) d;
$$;

revoke all on function public.host_storage_walk(uuid) from public, anon, authenticated, service_role;

comment on function public.host_storage_walk(uuid) is
  'What a host stores, walked item by item (upload-sums): host_active_bytes beside the sums of host_deleted_media, host_storage_summary''s body before 20261006180000. The one definition the sums answer to: storage_sums_drift and rebuild_storage_sums read it, nothing on a request''s path. The owner''s alone; SECURITY INVOKER.';

-- =============================================================================================
-- 5. The summary reads the sums.
-- =============================================================================================
-- Same signature, columns and meanings (create or replace: its grants stand, restated below). From her total over
-- every event of hers:
--   active   = her live items, less those in her deleted events (any age: a deleted event's items are never her albums);
--   Deleted  = her binned items in events not deleted or inside their own 30 days, less the binned items past their
--              own 30 days (the aged read), plus the live items of her deleted events inside their 30 days;
--   system   = the same over the over-capacity reduce's binned items.
-- Which is host_deleted_media's two arms, term for term (the proofs hold the two to the walk on every state).
create or replace function public.host_storage_summary(p_host_id uuid)
returns table (active_bytes bigint, standby_bytes bigint, system_bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with gone as (
    -- Her deleted events (events_host_deleted_idx): their live items are never her albums; inside their 30 days they
    -- are Deleted; past them, nothing of theirs counts until the night's purge takes them. Each event's row by its key
    -- (the lateral), so the read is her deleted events however large the table grows, never a scan of it.
    select coalesce(sum(s.live_bytes), 0) as live_bytes,
           coalesce(sum(s.live_bytes) filter (where e.deleted_at >= now() - interval '30 days'), 0) as inside_live,
           coalesce(sum(s.binned_bytes) filter (where e.deleted_at < now() - interval '30 days'), 0) as past_binned,
           coalesce(sum(s.system_bytes) filter (where e.deleted_at < now() - interval '30 days'), 0) as past_system
      from public.events e
     cross join lateral (
            select x.live_bytes, x.binned_bytes, x.system_bytes
              from public.event_storage_sums x
             where x.event_id = e.id
            offset 0) s
     where e.host_id = p_host_id
       and e.deleted_at is not null
  ),
  aged as (
    -- Binned items past their own 30 days in events that still count (event_storage_sums_aged_idx, then
    -- media_binned_idx): only events whose oldest removal passed the edge, normally none.
    select coalesce(sum(m.file_size_bytes), 0) as bytes,
           coalesce(sum(m.file_size_bytes) filter (where m.removed_by_system), 0) as system_bytes
      from public.event_storage_sums s
      join public.events e on e.id = s.event_id
      join public.media m on m.event_id = s.event_id
     where s.host_id = p_host_id
       and s.binned_since < now() - interval '30 days'
       and (e.deleted_at is null or e.deleted_at >= now() - interval '30 days')
       and m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null
       and (m.removed_at < now() - interval '30 days' or m.removed_at is null)
  )
  select (coalesce(h.live_bytes, 0) - gone.live_bytes)::bigint,
         (coalesce(h.binned_bytes, 0) - gone.past_binned - aged.bytes + gone.inside_live)::bigint,
         (coalesce(h.system_bytes, 0) - gone.past_system - aged.system_bytes)::bigint
    from gone
   cross join aged
    left join public.host_storage_sums h on h.host_id = p_host_id;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;
grant execute on function public.host_storage_summary(uuid) to service_role;

comment on function public.host_storage_summary(uuid) is
  'What a host stores, in one row (trash-in-storage; read off the sums by upload-sums): active_bytes (her albums, host_active_bytes''s figure), standby_bytes (her Deleted, host_deleted_media''s; the name kept for the deployed builds) and system_bytes (the part of Deleted the over-capacity reduce put there). Reads host_storage_sums, her deleted events'' rows and the binned items past their 30 days, never every item: host_storage_walk is the walk it answers to (storage_sums_drift). Her plan''s cap holds active plus Deleted: every figure she sees, the storage guard and every cap check read this. Service-role only: the app proves the host with getUser() first.';

-- =============================================================================================
-- 6. The reconciliation (never a fix) and the operator's rebuild.
-- =============================================================================================
-- Each host from `p_after` on (keyset on her id, `p_limit` a call, 1 to 1,000, 100 when null), compared in one
-- snapshot (STABLE): the summary against the walk, each of her event rows against her media walked by event, and
-- her total against her event rows. Answers {checked, next_after (null at the end), drifted: [{host_id, summary,
-- walk, events, total}]}, `events` counting her event rows that disagree (an orphan row and a missing one included)
-- and `total` whether her host row disagrees with them. It writes nothing: the sweep that calls it raises the signal,
-- and the operator's rebuild is the fix.
create function public.storage_sums_drift(p_after uuid default null, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hosts uuid[];
  v_host uuid;
  v_sums record;
  v_walk record;
  v_events integer;
  v_total boolean;
  v_drifted jsonb := '[]'::jsonb;
begin
  select coalesce(array_agg(p.id order by p.id), '{}'::uuid[]) into v_hosts
    from (select p.id from public.profiles p
           where p_after is null or p.id > p_after
           order by p.id
           limit least(greatest(coalesce(p_limit, 100), 1), 1000)) p;

  foreach v_host in array v_hosts loop
    select * into v_sums from public.host_storage_summary(v_host);
    select * into v_walk from public.host_storage_walk(v_host);

    with w as (
      select m.event_id,
             coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed'), 0)::bigint as live_bytes,
             (count(*) filter (where m.status <> 'removed'))::integer as live_count,
             coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
               and not m.removed_by_admin and m.purge_asked_at is null), 0)::bigint as binned_bytes,
             (count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
               and m.purge_asked_at is null))::integer as binned_count,
             coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
               and not m.removed_by_admin and m.purge_asked_at is null and m.removed_by_system), 0)::bigint
               as system_bytes,
             (count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
               and m.purge_asked_at is null and m.removed_by_system))::integer as system_count,
             min(coalesce(m.removed_at, '-infinity'::timestamptz)) filter (where m.status = 'removed'
               and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null) as binned_since
        from public.media m
        join public.events e on e.id = m.event_id
       where e.host_id = v_host
       group by m.event_id
      having count(*) filter (where m.status <> 'removed' or (m.status = 'removed' and not m.removed_by_uploader
               and not m.removed_by_admin and m.purge_asked_at is null)) > 0
    ),
    s as (
      select s.event_id, s.live_bytes, s.live_count, s.binned_bytes, s.binned_count, s.system_bytes, s.system_count,
             s.binned_since
        from public.event_storage_sums s
       where s.host_id = v_host
          or s.event_id in (select w.event_id from w)
    )
    select count(*)::integer into v_events
      from w full join s on s.event_id = w.event_id
     where (w.live_bytes, w.live_count, w.binned_bytes, w.binned_count, w.system_bytes, w.system_count,
            w.binned_since)
           is distinct from
           (s.live_bytes, s.live_count, s.binned_bytes, s.binned_count, s.system_bytes, s.system_count,
            s.binned_since);

    select (h.live_bytes, h.live_count, h.binned_bytes, h.binned_count, h.system_bytes, h.system_count)
           is distinct from
           (t.live_bytes, t.live_count, t.binned_bytes, t.binned_count, t.system_bytes, t.system_count)
      into v_total
      from (select coalesce(sum(s.live_bytes), 0)::bigint as live_bytes, coalesce(sum(s.live_count), 0)::integer
                     as live_count,
                   coalesce(sum(s.binned_bytes), 0)::bigint as binned_bytes,
                   coalesce(sum(s.binned_count), 0)::integer as binned_count,
                   coalesce(sum(s.system_bytes), 0)::bigint as system_bytes,
                   coalesce(sum(s.system_count), 0)::integer as system_count
              from public.event_storage_sums s where s.host_id = v_host) t
      left join lateral (
             select coalesce(x.live_bytes, 0) as live_bytes, coalesce(x.live_count, 0) as live_count,
                    coalesce(x.binned_bytes, 0) as binned_bytes, coalesce(x.binned_count, 0) as binned_count,
                    coalesce(x.system_bytes, 0) as system_bytes, coalesce(x.system_count, 0) as system_count
               from (select 1) one
               left join public.host_storage_sums x on x.host_id = v_host) h on true;

    if v_events > 0 or v_total
       or (v_sums.active_bytes, v_sums.standby_bytes, v_sums.system_bytes)
          is distinct from (v_walk.active_bytes, v_walk.standby_bytes, v_walk.system_bytes) then
      v_drifted := v_drifted || jsonb_build_object(
        'host_id', v_host,
        'summary', jsonb_build_object('active_bytes', v_sums.active_bytes, 'standby_bytes', v_sums.standby_bytes,
                                      'system_bytes', v_sums.system_bytes),
        'walk', jsonb_build_object('active_bytes', v_walk.active_bytes, 'standby_bytes', v_walk.standby_bytes,
                                   'system_bytes', v_walk.system_bytes),
        'events', v_events,
        'total', v_total);
    end if;
  end loop;

  return jsonb_build_object(
    'checked', cardinality(v_hosts),
    'next_after', case when cardinality(v_hosts) >= least(greatest(coalesce(p_limit, 100), 1), 1000)
                       then v_hosts[cardinality(v_hosts)] end,
    'drifted', v_drifted);
end;
$$;

revoke all on function public.storage_sums_drift(uuid, integer) from public, anon, authenticated;
grant execute on function public.storage_sums_drift(uuid, integer) to service_role;

comment on function public.storage_sums_drift(uuid, integer) is
  'The sums'' reconciliation (upload-sums), never a fix: hosts from p_after on, p_limit a call (1 to 1,000), each compared in one snapshot with the walk (the summary against host_storage_walk, her event rows against her media by event, her total against her event rows). Answers {checked, next_after, drifted: [{host_id, summary, walk, events, total}]}; the caller raises the signal and rebuild_storage_sums is the operator''s fix. Service-role only.';

-- THE OPERATOR'S FIX for one host the reconciliation names: her profiles row first (so no writer of hers moves a sum
-- meanwhile: each waits at its trigger and applies its own change after), her rows dropped and made again from her
-- media. Answers {ok, host_id, before, after}, each the summary's three figures, so the operator's record says what
-- moved. Writes nothing for a host with no profile.
create function public.rebuild_storage_sums(p_host_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  perform 1 from public.profiles where id = p_host_id for no key update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_host');
  end if;

  select to_jsonb(s) into v_before from public.host_storage_summary(p_host_id) s;

  delete from public.event_storage_sums s
   where s.host_id = p_host_id
      or s.event_id in (select e.id from public.events e where e.host_id = p_host_id);
  delete from public.host_storage_sums where host_id = p_host_id;

  insert into public.event_storage_sums
    (event_id, host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count, binned_since)
  select m.event_id, e.host_id,
         coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed'), 0),
         count(*) filter (where m.status <> 'removed'),
         coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
           and not m.removed_by_admin and m.purge_asked_at is null), 0),
         count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
           and m.purge_asked_at is null),
         coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
           and not m.removed_by_admin and m.purge_asked_at is null and m.removed_by_system), 0),
         count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
           and m.purge_asked_at is null and m.removed_by_system),
         min(coalesce(m.removed_at, '-infinity'::timestamptz)) filter (where m.status = 'removed'
           and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null)
    from public.media m
    join public.events e on e.id = m.event_id
   where e.host_id = p_host_id
   group by m.event_id, e.host_id
  having count(*) filter (where m.status <> 'removed' or (m.status = 'removed' and not m.removed_by_uploader
           and not m.removed_by_admin and m.purge_asked_at is null)) > 0;

  insert into public.host_storage_sums
    (host_id, live_bytes, live_count, binned_bytes, binned_count, system_bytes, system_count)
  select p_host_id, coalesce(sum(s.live_bytes), 0), coalesce(sum(s.live_count), 0),
         coalesce(sum(s.binned_bytes), 0), coalesce(sum(s.binned_count), 0),
         coalesce(sum(s.system_bytes), 0), coalesce(sum(s.system_count), 0)
    from public.event_storage_sums s
   where s.host_id = p_host_id;

  select to_jsonb(s) into v_after from public.host_storage_summary(p_host_id) s;
  return jsonb_build_object('ok', true, 'host_id', p_host_id, 'before', v_before, 'after', v_after);
end;
$$;

revoke all on function public.rebuild_storage_sums(uuid) from public, anon, authenticated;
grant execute on function public.rebuild_storage_sums(uuid) to service_role;

comment on function public.rebuild_storage_sums(uuid) is
  'The operator''s fix for a host storage_sums_drift names (upload-sums): her profiles row first, her sum rows made again from her media. Answers {ok, host_id, before, after} (the summary''s figures each side), or {ok:false, reason:"no_host"}. Service-role only.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call. RED: `begin;` + the block below + `rollback;`. GREEN: `begin;` + this file's statements + the block below +
-- `rollback;`. It makes its own two hosts (auth users, so handle_new_user makes their profiles), writes media straight
-- in, in every state the sums sort on, and after each act holds both hosts' sums to the walk: the summary against
-- host_active_bytes and host_deleted_media, each event's row against her media walked by event, her total against her
-- event rows. The new functions are called as their callers call them (the service role; Empty Deleted as her), through
-- dynamic SQL, so the RED run fails on what it lacks, never on a parse. Each step traps its own failure into the temp
-- `proof` table; the final select is the answer.
--
-- RUN ON THE LANE'S STAND-IN ONLY (Postgres 16: the touched tables and the current bodies, not the live schema; the
-- lane had no SQL access). What each live run must show:
--   RED   0 true; 1 to 4g false, each "error 42P01 relation "public.event_storage_sums" does not exist" (the acts
--         themselves land: 4d leave_deleted and 4e Empty Deleted answer as today); 5 false (42883: no
--         storage_sums_drift); 6 false (no table, no functions: the ACL lines empty).
--   GREEN 0 to 6 all true: 1 to 4g "A and B: the sums are the walk" after every act (uploads in every state; a
--         Remove, a restore, sizes moved, a removal crossing its 30 days and back; a withdrawal, an operator's removal
--         and restore, Delete permanently, the reduce in one statement over two hosts, a statement that moves nothing;
--         an album deleted and restored, deleted events crossing their 30 days each way, leave_deleted, Empty
--         Deleted, the purge's delete, an event's hard delete); 5 "N hosts at parity" (EVERY host on the database:
--         the backfill on the live data; record N), the knock named for B alone (1 event row, her total), left as it
--         stood, rebuilt to parity; 6 her own live totals only, binned_bytes and host_storage_sums 42501 to her, anon
--         42501, the five functions' ACLs exact. Nothing persists after the rollback (no fixture user, no sum rows of
--         theirs; the backfill's rows roll back with the file).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid);
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
--
-- -- One item written straight in: its state is what the trigger and both reads sort on. p_days back for a removal
-- -- (null removed_at when p_days is null and the state removes it).
-- create function pg_temp.item(p_event text, p_bytes bigint, p_state text default 'live', p_days numeric default 0)
-- returns uuid language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := pg_temp.fx(p_event);
-- begin
--   insert into public.media (id, event_id, type, original_key, file_size_bytes, status, removed_at,
--                             removed_by_uploader, removed_by_admin, removed_by_system, purge_asked_at)
--   values (mid, e, 'photo', 'events/' || e || '/photo/' || mid || '/original.jpg', p_bytes,
--           case p_state when 'live' then 'approved' when 'pending' then 'pending' when 'hidden' then 'hidden'
--                        else 'removed' end::public.media_status,
--           case when p_state in ('live', 'pending', 'hidden') then null
--                when p_days is null then null else now() - p_days * interval '1 day' end,
--           p_state = 'uploader', p_state = 'admin', p_state = 'system', case when p_state = 'asked' then now() end);
--   insert into fx values (p_event || ':' || mid, mid);
--   return mid;
-- end $f$;
--
-- -- Where the sums and the walk disagree for one host, in words ('' when they agree): the summary's three figures
-- -- against host_active_bytes and host_deleted_media (the walk, which the RED run has too), each event's row against her
-- -- media walked by event, and her total against her event rows. Dynamic, so the RED run fails on what it lacks.
-- create function pg_temp.parity(p_host uuid) returns text language plpgsql as $f$
-- declare s text; w text; ev integer; tot text; fail text := '';
-- begin
--   select format('%s/%s/%s', x.active_bytes, x.standby_bytes, x.system_bytes) into s
--     from public.host_storage_summary(p_host) x;
--   select format('%s/%s/%s', public.host_active_bytes(p_host), coalesce(sum(d.file_size_bytes), 0),
--                 coalesce(sum(d.file_size_bytes) filter (where d.by_system), 0)) into w
--     from public.host_deleted_media(p_host) d;
--   if s is distinct from w then fail := fail || format(' summary %s walk %s;', s, w); end if;
--   execute $q$
--     with w as (
--       select m.event_id,
--              coalesce(sum(m.file_size_bytes) filter (where m.status <> 'removed'), 0)::bigint lb,
--              (count(*) filter (where m.status <> 'removed'))::integer lc,
--              coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
--                and not m.removed_by_admin and m.purge_asked_at is null), 0)::bigint bb,
--              (count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
--                and m.purge_asked_at is null))::integer bc,
--              coalesce(sum(m.file_size_bytes) filter (where m.status = 'removed' and not m.removed_by_uploader
--                and not m.removed_by_admin and m.purge_asked_at is null and m.removed_by_system), 0)::bigint sb,
--              (count(*) filter (where m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin
--                and m.purge_asked_at is null and m.removed_by_system))::integer sc,
--              min(coalesce(m.removed_at, '-infinity')) filter (where m.status = 'removed' and not m.removed_by_uploader
--                and not m.removed_by_admin and m.purge_asked_at is null) bs
--         from public.media m join public.events e on e.id = m.event_id
--        where e.host_id = $1
--        group by m.event_id
--       having count(*) filter (where m.status <> 'removed' or (not m.removed_by_uploader and not m.removed_by_admin
--                and m.purge_asked_at is null)) > 0)
--     select count(*)::integer
--       from w full join (select * from public.event_storage_sums where host_id = $1) s on s.event_id = w.event_id
--      where (w.lb, w.lc, w.bb, w.bc, w.sb, w.sc, w.bs) is distinct from
--            (s.live_bytes, s.live_count, s.binned_bytes, s.binned_count, s.system_bytes, s.system_count, s.binned_since)
--   $q$ into ev using p_host;
--   if ev <> 0 then fail := fail || format(' %s event rows off;', ev); end if;
--   execute $q$
--     select format('%s', (h.live_bytes, h.live_count, h.binned_bytes, h.binned_count, h.system_bytes, h.system_count)
--              is distinct from (t.lb, t.lc, t.bb, t.bc, t.sb, t.sc))
--       from (select coalesce(sum(live_bytes), 0)::bigint lb, coalesce(sum(live_count), 0)::integer lc,
--                    coalesce(sum(binned_bytes), 0)::bigint bb, coalesce(sum(binned_count), 0)::integer bc,
--                    coalesce(sum(system_bytes), 0)::bigint sb, coalesce(sum(system_count), 0)::integer sc
--               from public.event_storage_sums where host_id = $1) t
--       left join public.host_storage_sums h on h.host_id = $1
--   $q$ into tot using p_host;
--   if tot = 'true' then fail := fail || ' her total is not her events'' rows;'; end if;
--   return btrim(fail);
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- After each act, both hosts at parity, or the step says where not.
-- create function pg_temp.step(p_step text) returns void language plpgsql as $f$
-- declare a text := pg_temp.parity(pg_temp.fx('a')); b text := pg_temp.parity(pg_temp.fx('b'));
-- begin
--   insert into proof (step, ok, detail) values (p_step, a = '' and b = '',
--     coalesce(nullif(btrim(case when a <> '' then 'A: ' || a else '' end || ' '
--                           || case when b <> '' then 'B: ' || b else '' end), ''), 'A and B: the sums are the walk'));
-- end $f$;
--
-- -- Calls as their callers make them: dynamic (the RED run lacks the function), an error in words.
-- create function pg_temp.svc(p_sql text, p_arg uuid default null) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   set local role service_role;
--   execute p_sql into got using p_arg;
--   reset role;
--   return coalesce(got, 'null');
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.as_host(p_host uuid, p_sql text) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   perform set_config('request.jwt.claims', json_build_object('sub', p_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   execute p_sql into got;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return coalesce(got, 'null');
-- exception when others then
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- 0. Two hosts. A: two albums, an event deleted 5 days ago (inside its 30 days) and one deleted 40 days ago (past
-- -- them, not yet swept), each holding every state; B: one album (the cross-tenant control).
-- do $$
-- declare k text; h uuid; e uuid;
-- begin
--   foreach k in array array['a', 'b'] loop
--     h := gen_random_uuid();
--     execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--       using h, 'upload-sums-' || h || '@example.com';
--     insert into public.profiles (id, email, display_name) values (h, 'upload-sums-' || h || '@example.com', 'Sums ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     update public.profiles set tier = 'pro', storage_cap_bytes = 1000000000000 where id = h;
--     insert into fx values (k, h);
--   end loop;
--   foreach k in array array['a1', 'a2', 'ad', 'ap', 'b1'] loop
--     insert into public.events (host_id, name, require_verified_email)
--     values (pg_temp.fx(left(k, 1)), 'Upload sums: ' || k, false) returning id into e;
--     insert into fx values (k, e);
--   end loop;
--   update public.events set deleted_at = now() - interval '5 days' where id = pg_temp.fx('ad');
--   update public.events set deleted_at = now() - interval '40 days' where id = pg_temp.fx('ap');
--   insert into proof (step, ok, detail) values ('0 fixtures', true, 'hosts A and B, five events');
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. Uploads (the trigger's INSERT): every state in every kind of event, removals inside their 30 days and past them.
-- do $$
-- declare k text;
-- begin
--   foreach k in array array['a1', 'ad', 'ap'] loop
--     perform pg_temp.item(k, 1000);
--     perform pg_temp.item(k, 1001, 'pending');
--     perform pg_temp.item(k, 1002, 'hidden');
--     perform pg_temp.item(k, 2000, 'host', 3);
--     perform pg_temp.item(k, 2001, 'host', 31);
--     perform pg_temp.item(k, 2002, 'host', null);
--     perform pg_temp.item(k, 3000, 'system', 4);
--     perform pg_temp.item(k, 3001, 'system', 35);
--     perform pg_temp.item(k, 4000, 'uploader', 1);
--     perform pg_temp.item(k, 5000, 'admin', 1);
--     perform pg_temp.item(k, 6000, 'asked', 1);
--   end loop;
--   perform pg_temp.item('a2', 7000);
--   perform pg_temp.item('b1', 8000);
--   perform pg_temp.item('b1', 8001, 'host', 2);
--   perform pg_temp.step('1 uploads, every state');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 uploads, every state', false, sqlerrm);
-- end $$;
--
-- -- 2. Her acts on her album: a Remove, a restore, a size corrected, a removal's time moved past its 30 days (the
-- -- clock, as the night would find it) and back.
-- do $$
-- declare m uuid;
-- begin
--   update public.media set status = 'removed', removed_at = now()
--    where event_id = pg_temp.fx('a1') and status = 'approved';
--   perform pg_temp.step('2a a Remove');
--   update public.media set status = 'approved', removed_at = null, removed_by_system = false
--    where event_id = pg_temp.fx('a1') and status = 'removed' and file_size_bytes = 1000;
--   perform pg_temp.step('2b a restore');
--   update public.media set file_size_bytes = file_size_bytes + 7 where event_id = pg_temp.fx('a1');
--   perform pg_temp.step('2c every size in an album moved');
--   select id into m from public.media where event_id = pg_temp.fx('a1') and status = 'removed'
--      and not removed_by_uploader and not removed_by_admin and purge_asked_at is null
--    order by removed_at desc nulls last limit 1;
--   update public.media set removed_at = now() - interval '45 days' where id = m;
--   perform pg_temp.step('2d a removal past its 30 days');
--   update public.media set removed_at = now() where id = m;
--   perform pg_temp.step('2e and inside them again');
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 her acts', false, sqlerrm);
-- end $$;
--
-- -- 3. Everyone else's: the guest's withdrawal, an operator's removal and restore, Delete permanently (asked), the
-- -- over-capacity reduce, all in one statement across both hosts too.
-- do $$
-- begin
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true
--    where event_id = pg_temp.fx('a1') and status = 'pending';
--   perform pg_temp.step('3a a guest''s withdrawal');
--   update public.media set status = 'removed', removed_at = now(), removed_by_admin = true
--    where event_id = pg_temp.fx('a1') and status = 'hidden';
--   perform pg_temp.step('3b an operator''s removal');
--   update public.media set status = 'hidden', removed_at = null, removed_by_admin = false
--    where event_id = pg_temp.fx('a1') and removed_by_admin and file_size_bytes < 2000;
--   perform pg_temp.step('3c an operator''s restore');
--   update public.media set purge_asked_at = now()
--    where event_id = pg_temp.fx('a1') and status = 'removed' and file_size_bytes between 2000 and 2100;
--   perform pg_temp.step('3d Delete permanently (asked)');
--   update public.media set status = 'removed', removed_at = now(), removed_by_system = true
--    where event_id in (pg_temp.fx('a2'), pg_temp.fx('b1')) and status <> 'removed';
--   perform pg_temp.step('3e the reduce, one statement over two hosts');
--   update public.media set updated_at = now() where event_id in (pg_temp.fx('a1'), pg_temp.fx('b1'));
--   perform pg_temp.step('3f a statement that moves nothing counted');
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 everyone else''s acts', false, sqlerrm);
-- end $$;
--
-- -- 4. Events: deleted, restored, its 30 days passing; then leave_deleted and Empty Deleted (as she calls it), the
-- -- purge's row delete, and an event's hard delete (the cascade).
-- do $$
-- declare got text;
-- begin
--   update public.events set deleted_at = now() where id = pg_temp.fx('a1');
--   perform pg_temp.step('4a an album deleted');
--   update public.events set deleted_at = null where id = pg_temp.fx('a1');
--   perform pg_temp.step('4b and restored');
--   update public.events set deleted_at = now() - interval '31 days' where id = pg_temp.fx('ad');
--   update public.events set deleted_at = now() - interval '29 days' where id = pg_temp.fx('ap');
--   perform pg_temp.step('4c two deleted events cross their 30 days, each way');
--   got := pg_temp.svc('select l.items::text from public.leave_deleted($1, 2500, false) l', pg_temp.fx('a'));
--   perform pg_temp.step('4d leave_deleted (' || got || ' items)');
--   got := pg_temp.as_host(pg_temp.fx('a'), 'select public.empty_deleted(2000)::text');
--   perform pg_temp.step('4e Empty Deleted (' || left(got, 80) || ')');
--   got := pg_temp.svc(format('select count(*)::text from public.purge_media_rows(%L::uuid[])',
--            array(select id from public.media where event_id = pg_temp.fx('a1'))));
--   perform pg_temp.step('4f the purge deletes rows (' || got || ' hosts)');
--   delete from public.events where id = pg_temp.fx('ap');
--   perform pg_temp.step('4g an event''s hard delete');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 events', false, sqlerrm);
-- end $$;
--
-- -- 5. The backfill and the reconciliation: every host on the database at parity (the backfill, on the live data),
-- -- then a sum knocked off by hand is named and left as it stands, and the operator's rebuild mends it.
-- do $$
-- declare raw text; got jsonb; after uuid; drifted jsonb := '[]'; checked integer := 0; fail text := ''; before text; now_ text;
-- begin
--   loop
--     raw := pg_temp.svc('select public.storage_sums_drift($1, 500)::text', after);
--     if raw like 'error%' then raise exception '%', raw; end if;
--     got := raw::jsonb;
--     drifted := drifted || (got -> 'drifted');
--     checked := checked + (got ->> 'checked')::integer;
--     after := (got ->> 'next_after')::uuid;
--     exit when after is null;
--   end loop;
--   if jsonb_array_length(drifted) <> 0 then fail := fail || format(' drifted before any knock: %s;', drifted); end if;
--   update public.event_storage_sums set live_bytes = live_bytes + 1 where host_id = pg_temp.fx('b');
--   select format('%s', live_bytes) into before from public.event_storage_sums where host_id = pg_temp.fx('b');
--   got := pg_temp.svc('select public.storage_sums_drift($1, 1)::text',
--            (select id from public.profiles where id < pg_temp.fx('b') order by id desc limit 1))::jsonb;
--   if (got -> 'drifted' -> 0 ->> 'host_id')::uuid is distinct from pg_temp.fx('b')
--      or (got -> 'drifted' -> 0 ->> 'events')::integer <> 1 or (got -> 'drifted' -> 0 ->> 'total')::boolean is not true then
--     fail := fail || format(' the knock not named: %s;', got);
--   end if;
--   select format('%s', live_bytes) into now_ from public.event_storage_sums where host_id = pg_temp.fx('b');
--   if now_ is distinct from before then fail := fail || ' the reconciliation wrote;'; end if;
--   got := pg_temp.svc('select public.rebuild_storage_sums($1)::text', pg_temp.fx('b'))::jsonb;
--   if got ->> 'ok' <> 'true' then fail := fail || format(' rebuild %s;', got); end if;
--   if pg_temp.parity(pg_temp.fx('b')) <> '' then fail := fail || ' rebuilt, still off;'; end if;
--   insert into proof (step, ok, detail) values ('5 backfill, drift, rebuild', fail = '',
--     coalesce(nullif(btrim(fail), ''), format('%s hosts at parity; the knock named, untouched, rebuilt (%s)', checked,
--       got -> 'after')));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 backfill, drift, rebuild', false, sqlerrm);
-- end $$;
--
-- -- 6. Who reads what: she reads her own events' live totals and nothing else; anon nothing; the functions' grants.
-- do $$
-- declare r record; got text; fail text := '';
-- begin
--   perform pg_temp.item('b1', 9000);
--   got := pg_temp.as_host(pg_temp.fx('b'),
--     'select count(*)::text || '':'' || coalesce(sum(live_bytes), 0)::text from public.event_storage_sums');
--   if got <> '1:9000' then fail := fail || format(' B reads %s;', got); end if;
--   got := pg_temp.as_host(pg_temp.fx('a'), format(
--     'select count(*)::text from public.event_storage_sums where event_id = %L', pg_temp.fx('b1')));
--   if got <> '0' then fail := fail || format(' A reads B''s row (%s);', got); end if;
--   got := pg_temp.as_host(pg_temp.fx('b'), 'select count(binned_bytes)::text from public.event_storage_sums');
--   if got not like 'error 42501%' then fail := fail || format(' binned_bytes readable (%s);', got); end if;
--   got := pg_temp.as_host(pg_temp.fx('b'), 'select count(*)::text from public.host_storage_sums');
--   if got not like 'error 42501%' then fail := fail || format(' host_storage_sums readable (%s);', got); end if;
--   begin
--     set local role anon;
--     execute 'select count(*)::text from public.event_storage_sums' into got;
--     reset role;
--   exception when others then
--     reset role;
--     got := 'error ' || sqlstate;
--   end;
--   if got not like 'error 42501%' then fail := fail || format(' anon reads (%s);', got); end if;
--   for r in select * from (values
--       ('public.host_storage_summary(uuid)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.storage_sums_drift(uuid, integer)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.rebuild_storage_sums(uuid)', 'postgres:EXECUTE service_role:EXECUTE'),
--       ('public.host_storage_walk(uuid)', 'postgres:EXECUTE'),
--       ('public.media_storage_sums()', 'postgres:EXECUTE')) v(fn, acl)
--   loop
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' '
--                       order by a.grantee::regrole::text || ':' || a.privilege_type) into got
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     if got is distinct from r.acl then fail := fail || format(' %s acl %s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('6 who reads what', fail = '',
--     coalesce(nullif(btrim(fail), ''), 'her live totals only; the rest no client''s; the functions'' grants exact'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 who reads what', false, sqlerrm);
-- end $$;
--
-- select n, step, ok::text, detail from proof order by n;
