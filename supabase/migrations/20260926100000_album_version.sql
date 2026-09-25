-- =============================================================================================
-- THE PAGED ALBUM'S VERSION AND CHANGE LOG (lane `album-pages`).
--
-- Will: "We already need to add scrolling pagination to event pages rather than load the whole album
-- upfront." Today every load and every changed poll reads the whole album, and a 304 still pays for
-- that read because the ETag is computed after it. The paged album asks a cheaper question: WHAT
-- CHANGED SINCE THE VERSION I HOLD? So each event gets a version, bumped by the commit of every write
-- that changes what its album shows, and a change log that remembers, per item, the version at which
-- it last changed. A quiet poll then reads one row; a busy one reads the handful of ids that moved.
--
--   1. album_state (event_id pk)        version       every status transition in the HOST's scope
--                                                     (pending, approved, hidden; into or out of the bin)
--                                       album_max     only transitions into or out of `approved`: the
--                                                     guest album's version, its own counter, so a guest
--                                                     never learns how busy moderation is
--                                       attr_version  a rename, a confirmation, a claim: attribution moved
--   2. album_changes (event, media pk)  host_version, album_version: the version at which the item last
--                                       changed in each scope. Compacted by id (one row an item, ever), and
--                                       it outlives the media row: a purged item's row is its tombstone.
--   3. The triggers that keep them (media, guests, profiles) and the one reader, album_changes_since.
--
-- Both tables are RLS on with no policy: service role only, read by the Next routes after their own
-- capability checks (get_event_by_qr_token and resolveViewerDecision for a guest, getUser() and
-- ownership for the host). No client role reads either, and no function here is anon or
-- authenticated: every one revokes EXECUTE from public, anon and authenticated.
--
-- ★ VERSIONS COMMIT IN ORDER, PER EVENT. The bump is an UPDATE of the event's album_state row, whose
-- lock is held to the end of the transaction, so a second writer to the same album waits and then
-- reads the first one's committed number. A reader that sees version V therefore sees every change at
-- or below V, and a client's cursor can never step past a change still in flight. One transaction is
-- one version, however many rows it moved (a bulk approve of 2,000 is one bump).
--
-- ★ LOCK ORDER: THE ALBUM ROW IS EVERY TRANSACTION'S LAST LOCK. These triggers sit in the hottest
-- write path in the product, beside writers that already order their own locks differently:
-- purge_media_rows locks media before profiles, create_media locks profiles first, and a multi-event
-- writer (a disown, the over-capacity sweep, a claim, an account's hard delete) touches its events in
-- whatever order its rows come. A per-event counter row taken MID-transaction would sit between those
-- locks and could close a cycle with any of them. So nothing here locks an album row until COMMIT:
--   * the IMMEDIATE triggers (album_note_*) only note event ids in transaction-local settings
--     (set_config(..., true): they end with the transaction and roll back with a savepoint);
--   * the DEFERRED constraint triggers (album_stamp_media, album_flush_trigger) do every write when the
--     transaction commits, after all its statements' locks are held, and the first of them bumps
--     EVERY event the transaction touched in ONE pass, in event-id order (album_flush).
-- Hence: (1) while a transaction holds an album row it waits on nothing but album rows (the one
-- exception is the KEY SHARE on an events row when a brand-new event's album_state row is first
-- inserted, which only a hard delete of that event conflicts with); (2) every commit phase takes album
-- rows in the same order, so no two can wait on each other in a cycle; (3) readers take no row locks.
-- No deadlock can include an album row. The writers of media, guests and profiles, each unchanged by
-- this file, and where the album row lands in each (all read from the live bodies on 2026-09-25):
--   create_media, create_media_as_host   profiles FOR UPDATE, media insert, ledger, profiles update | album
--   restore_media                        profiles FOR UPDATE, media update | album
--   restore_event                        profiles FOR UPDATE, events update (no media row moves) | none
--   purge_media_rows (+ purge_media_now) media delete, profiles update | none: a purge takes only removed
--                                        rows, which sit outside both scopes, so it never touches an album row
--   remove_my_upload(_by_session), the host's moderation writes, the operator's removals, the
--   over-capacity sweep                  media updates | album, in event order
--   disown_guest_rows_by_email           media updates across events, guests (pending_email only) | album
--   claim_anonymous_uploads,
--   claim_guest_rows_by_email            profiles update, guests updates across events | album
--   capture_guest_email, set_guest_display_name   one guests update | album
--   the account rename and the deletion's anonymisation (profiles.display_name)   | album
--   an account's hard delete (auth.users cascade): its events and their media go, and the album rows
--                                        with them (the flush skips an event that no longer exists);
--                                        its guest rows elsewhere lose user_id | album, in event order
-- (A `set constraints all immediate` mid-transaction would flush early and again at commit, each pass
-- in order but the second after the first; nothing in the app issues one.)
--
-- ★ ONLY WHAT A VIEWER CAN SEE MOVES A VERSION. A purge of a removed row, a host's settings save, a
-- door name typed before any upload: none bumps anything. A guest row's attribution change bumps its
-- event only when the guest has a live upload there; a profile rename bumps the events it hosts and
-- the events where it is a verified guest with a live upload.
--
-- AN EXPAND: the deployed code never reads either table or calls the reader, so partyreel.com and the
-- launch-prep alias are untouched; their writes simply start stamping versions.
--
-- LOCKS AT APPLY: `create trigger` takes SHARE ROW EXCLUSIVE on media, guests and profiles until this
-- transaction commits (writes to them wait, reads do not); the backfill inserts one small row per event.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: nothing named album_* exists, and the tables' triggers are today's:
--         select c.relname, t.tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
--          where c.relnamespace = 'public'::regnamespace and not t.tgisinternal
--            and c.relname in ('media', 'guests', 'profiles') order by 1, 2;
--       reads media: media_derive_removal_provenance, media_gallery_doorbell,
--       media_guard_privileged_transitions, media_set_purge_at, media_set_updated_at; profiles:
--       profiles_set_updated_at; guests: none.
--   (2) Apply verbatim.
--   (3) The grants, restated below in full because the project's default privileges hand every new
--       table and function to anon and authenticated: album_state and album_changes, SELECT for
--       service_role only; album_changes_since, EXECUTE for service_role only; the internals, never a
--       client role.
--   (4) get_advisors. EXPECTED DELTA: rls_enabled_no_policy +2 (album_state, album_changes), by design;
--       0028 and 0029 unchanged (no function here is anon- or authenticated-executable).
--   (5) Regenerate src/lib/db/types.ts: the two tables and album_changes_since.
--   (6) The rolled-back check at the foot.
-- =============================================================================================

-- =============================================================================================
-- 1. The tables.
-- =============================================================================================
create table public.album_state (
  event_id uuid primary key references public.events (id) on delete cascade,
  version bigint not null default 0,
  album_max bigint not null default 0,
  attr_version bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.album_state is
  'The paged album''s versions, one row per event: version counts every status transition in the host''s scope, album_max only transitions into or out of approved (the guest album''s own counter), attr_version every attribution change. Bumped once per committing transaction by the deferred album_* triggers, whose row lock orders the versions by commit. Service role only (RLS on, no policy).';

-- One row per item that ever changed, compacted: the version at which it LAST changed in each scope.
-- No foreign key to media on purpose: the row outlives the item, and a purged item's row is how a
-- client learns it left. album_version stays null until the item first enters or leaves `approved`.
create table public.album_changes (
  event_id uuid not null references public.album_state (event_id) on delete cascade,
  media_id uuid not null,
  host_version bigint not null,
  album_version bigint,
  primary key (event_id, media_id)
);

comment on table public.album_changes is
  'The paged album''s change log: one row per media item, the host_version and album_version at which it last changed (album_version null until it first crossed approved). Outlives the media row (a tombstone). Written only by the deferred album_* triggers; read only through album_changes_since. Service role only (RLS on, no policy).';

-- The two keysets album_changes_since walks: a host's changes since a version, a guest album's.
create index album_changes_host_version_idx
  on public.album_changes (event_id, host_version);
create index album_changes_album_version_idx
  on public.album_changes (event_id, album_version)
  where album_version is not null;

alter table public.album_state enable row level security;
alter table public.album_changes enable row level security;

-- Deny-all: no policy, and no client role holds a privilege (the project's default privileges grant
-- every new table to anon and authenticated, so the revoke names them). The service role reads; only
-- the trigger functions below (owned by postgres) write.
revoke all on table public.album_state, public.album_changes
  from public, anon, authenticated, service_role;
grant select on table public.album_state, public.album_changes to service_role;

-- Every event starts at version 0. The change log starts EMPTY: a client always begins from a whole
-- manifest read at some version, and only changes after it matter. An event created later gets its
-- row from its first bump (album_flush upserts).
insert into public.album_state (event_id)
select e.id from public.events e
on conflict (event_id) do nothing;

-- =============================================================================================
-- 2. The rules, and the transaction-local notes.
-- =============================================================================================

-- WHICH SCOPES A STATUS TRANSITION MOVES: bit 1 the host's (any change touching pending, approved or
-- hidden), bit 2 the guest album's (into or out of approved). A NULL side is "no row" (an insert has no
-- before, a delete no after). The one rule both the note and the stamp read, so they cannot disagree.
create function public.album_scope(p_was public.media_status, p_is public.media_status)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_was is not distinct from p_is then 0
    when coalesce(p_was, 'removed') = 'removed' and coalesce(p_is, 'removed') = 'removed' then 0
    else 1 + case
      when (p_was is not distinct from 'approved') <> (p_is is not distinct from 'approved') then 2
      else 0
    end
  end;
$$;

comment on function public.album_scope(public.media_status, public.media_status) is
  'Which album scopes a media status transition moves: 1 = the host''s (touches pending, approved or hidden), +2 = the guest album''s (into or out of approved), 0 = neither. NULL is "no row". Internal to the album_* triggers.';

-- NOTE AN EVENT for this transaction's flush: 'h' host scope, 'a' guest album, 't' attribution. Each
-- set is an append-only text of "<uuid>," items in a transaction-local setting, so it ends with the
-- transaction, rolls back with a savepoint, and survives the SET clause of the function that wrote it
-- (only the variables a function's own SET clause names are restored at its exit).
create function public.album_remember(p_scope text, p_event_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key constant text := 'partyreel.album_' || p_scope;
  v_set text := coalesce(pg_catalog.current_setting(v_key, true), '');
begin
  if pg_catalog.strpos(v_set, p_event_id::text) = 0 then
    perform pg_catalog.set_config(v_key, v_set || p_event_id::text || ',', true);
  end if;
end;
$$;

comment on function public.album_remember(text, uuid) is
  'Notes an event id in this transaction''s album set (h = host scope, a = guest album, t = attribution) for album_flush. Transaction-local settings only; touches no table. Internal to the album_* triggers.';

-- =============================================================================================
-- 3. The flush: every event this transaction touched, bumped once, in event-id order.
-- =============================================================================================
-- Called by the first deferred stamp at commit (and cheaply by every later one, which finds nothing
-- new). The `*_fh/fa/ft` settings are how far into each set the last flush read, so a set that grew
-- after a flush (only a `set constraints all immediate` can make one) is flushed from where it left
-- off, never twice.
--   * ORDER: one upsert per event, in a loop over the sorted union, so the album rows are locked in
--     event-id order. This is the whole lock-order argument; the header has the rest.
--   * An event that no longer exists (hard-deleted in this very transaction, its album row gone with
--     it by the cascade) is skipped: re-inserting its row would fail the foreign key and the delete.
create function public.album_flush()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_h text := coalesce(pg_catalog.current_setting('partyreel.album_h', true), '');
  v_a text := coalesce(pg_catalog.current_setting('partyreel.album_a', true), '');
  v_t text := coalesce(pg_catalog.current_setting('partyreel.album_t', true), '');
  v_fh integer := coalesce(nullif(pg_catalog.current_setting('partyreel.album_fh', true), ''), '0')::integer;
  v_fa integer := coalesce(nullif(pg_catalog.current_setting('partyreel.album_fa', true), ''), '0')::integer;
  v_ft integer := coalesce(nullif(pg_catalog.current_setting('partyreel.album_ft', true), ''), '0')::integer;
  v_host uuid[];
  v_album uuid[];
  v_attr uuid[];
  v_event uuid;
begin
  if length(v_h) = v_fh and length(v_a) = v_fa and length(v_t) = v_ft then
    return;
  end if;

  v_host := string_to_array(rtrim(substr(v_h, v_fh + 1), ','), ',')::uuid[];
  v_album := string_to_array(rtrim(substr(v_a, v_fa + 1), ','), ',')::uuid[];
  v_attr := string_to_array(rtrim(substr(v_t, v_ft + 1), ','), ',')::uuid[];

  for v_event in
    select x.id
      from unnest(v_host || v_album || v_attr) as x(id)
     where exists (select 1 from public.events e where e.id = x.id)
     group by x.id
     order by x.id
  loop
    insert into public.album_state as s (event_id, version, album_max, attr_version)
    values (
      v_event,
      (v_event = any (v_host))::integer,
      (v_event = any (v_album))::integer,
      (v_event = any (v_attr))::integer
    )
    on conflict (event_id) do update set
      version = s.version + excluded.version,
      album_max = s.album_max + excluded.album_max,
      attr_version = s.attr_version + excluded.attr_version,
      updated_at = now();
  end loop;

  perform pg_catalog.set_config('partyreel.album_fh', length(v_h)::text, true);
  perform pg_catalog.set_config('partyreel.album_fa', length(v_a)::text, true);
  perform pg_catalog.set_config('partyreel.album_ft', length(v_t)::text, true);
end;
$$;

comment on function public.album_flush() is
  'Bumps every event this transaction noted (album_remember) once, in event-id order: version for the host scope, album_max for the guest album, attr_version for attribution. Called by the deferred album_* triggers at commit, so album_state is always a transaction''s last lock. Internal.';

-- =============================================================================================
-- 4. The triggers' functions.
-- =============================================================================================

-- IMMEDIATE, on media: note the event (host scope, and the guest album when the item crossed
-- approved). Touches no table, so it adds no lock to the statement that fired it.
create function public.album_note_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope integer;
  v_event uuid;
begin
  if tg_op = 'INSERT' then
    v_scope := public.album_scope(null, new.status);
    v_event := new.event_id;
  elsif tg_op = 'UPDATE' then
    v_scope := public.album_scope(old.status, new.status);
    v_event := new.event_id;
  else
    v_scope := public.album_scope(old.status, null);
    v_event := old.event_id;
  end if;
  if v_scope & 1 = 1 then
    perform public.album_remember('h', v_event);
  end if;
  if v_scope & 2 = 2 then
    perform public.album_remember('a', v_event);
  end if;
  return null;
end;
$$;

-- DEFERRED, on media: at commit, flush (the first stamp bumps every noted event, in order), then write
-- this item's row in the change log at its event's new versions. The album_version moves only when the
-- item crossed approved; otherwise it keeps the version at which it last did.
create function public.album_stamp_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope integer;
  v_event uuid;
  v_media uuid;
begin
  if tg_op = 'INSERT' then
    v_scope := public.album_scope(null, new.status);
    v_event := new.event_id;
    v_media := new.id;
  elsif tg_op = 'UPDATE' then
    v_scope := public.album_scope(old.status, new.status);
    v_event := new.event_id;
    v_media := new.id;
  else
    v_scope := public.album_scope(old.status, null);
    v_event := old.event_id;
    v_media := old.id;
  end if;
  if v_scope = 0 then
    return null;
  end if;

  perform public.album_flush();

  -- Keyed on the event's own row, so an event deleted in this transaction writes nothing.
  insert into public.album_changes as c (event_id, media_id, host_version, album_version)
  select v_event, v_media, s.version, case when v_scope & 2 = 2 then s.album_max end
    from public.album_state s
   where s.event_id = v_event
  on conflict (event_id, media_id) do update set
    host_version = excluded.host_version,
    album_version = coalesce(excluded.album_version, c.album_version);
  return null;
end;
$$;

-- IMMEDIATE, on guests: a rename, a confirmation, a claim or an address moves attribution (the host's
-- mapper shows the proved address), but only for a guest with a live upload in that album. A name typed
-- at the door before the first upload moves nothing.
create function public.album_note_guest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.media m
     where m.guest_id = new.id and m.status <> 'removed'
  ) then
    perform public.album_remember('t', new.event_id);
  end if;
  return null;
end;
$$;

-- IMMEDIATE, on profiles: a display_name is the attribution of the host's own uploads in every event
-- they host, and of every upload they made as a verified guest (resolveUploaderIdentity's rule).
create function public.album_note_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  for v_event in
    select e.id from public.events e where e.host_id = new.id
    union
    select g.event_id from public.guests g
     where g.user_id = new.id
       and g.verified_at is not null
       and exists (
         select 1 from public.media m
          where m.guest_id = g.id and m.status <> 'removed'
       )
  loop
    perform public.album_remember('t', v_event);
  end loop;
  return null;
end;
$$;

-- DEFERRED, on guests and profiles: an attribution-only transaction still needs its flush at commit.
create function public.album_flush_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.album_flush();
  return null;
end;
$$;

comment on function public.album_note_media() is
  'IMMEDIATE media trigger: notes the event of a status transition for this transaction''s album flush. Touches no table.';
comment on function public.album_stamp_media() is
  'DEFERRED media constraint trigger: at commit, flushes the album versions (album_flush) and writes the item''s album_changes row at its event''s new versions.';
comment on function public.album_note_guest() is
  'IMMEDIATE guests trigger: notes an attribution change for the flush when the guest has a live upload.';
comment on function public.album_note_profile() is
  'IMMEDIATE profiles trigger: notes an attribution change for the events the profile hosts and those where it is a verified guest with a live upload.';
comment on function public.album_flush_trigger() is
  'DEFERRED guests/profiles constraint trigger: flushes the album versions at commit.';

-- =============================================================================================
-- 5. The triggers.
-- =============================================================================================
-- Media: every insert, status change and delete. The functions return early on a transition outside
-- both scopes (a no-op status write, a purge of a removed row).
-- ★ Each table's note sorts before its stamp by NAME (`*_album_note` < `*_album_stamp`): at commit the
-- deferred stamps always follow every note, but under `set constraints all immediate` both fire at the
-- statement's end in name order, and a stamp that ran first would flush before its event was noted.
create trigger media_album_note
  after insert or update of status or delete on public.media
  for each row execute function public.album_note_media();

create constraint trigger media_album_stamp
  after insert or update of status or delete on public.media
  deferrable initially deferred
  for each row execute function public.album_stamp_media();

create trigger guests_album_note
  after update of display_name, verified_at, user_id, email on public.guests
  for each row
  when (old.display_name is distinct from new.display_name
     or old.verified_at is distinct from new.verified_at
     or old.user_id is distinct from new.user_id
     or old.email is distinct from new.email)
  execute function public.album_note_guest();

create constraint trigger guests_album_stamp
  after update of display_name, verified_at, user_id, email on public.guests
  deferrable initially deferred
  for each row
  when (old.display_name is distinct from new.display_name
     or old.verified_at is distinct from new.verified_at
     or old.user_id is distinct from new.user_id
     or old.email is distinct from new.email)
  execute function public.album_flush_trigger();

create trigger profiles_album_note
  after update of display_name on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function public.album_note_profile();

create constraint trigger profiles_album_stamp
  after update of display_name on public.profiles
  deferrable initially deferred
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function public.album_flush_trigger();

-- =============================================================================================
-- 6. The reader.
-- =============================================================================================
-- ONE JSONB, ONE SNAPSHOT: the event's versions, its counts and the changes since a version, read by
-- one statement, so the counts are exactly the album at `version`/`album_max` and a client that applies
-- the changes can check its length against them. Not set-returning, so the row cap cannot cut it; the
-- changes inside are a keyset on the scope's version (`p_after` exclusive), clamped to 1,000 (a null
-- p_limit reads them all, the house rule). The route asks for one more than it will apply
-- (ALBUM_RESYNC_AFTER + 1) and answers a fresh manifest when that many come back.
--   p_scope 'album': the guest album. Changes are the items that crossed approved since p_after, each
--                    with its CURRENT status (approved = in the album; anything else, or null for a
--                    purged row, = out), and the count is the approved head count.
--   p_scope 'host':  every status change since p_after, the three counts, and each item's guest_id
--                    (the host's quick-add key). Any other scope reads no changes and no counts.
-- Each change: [media_id, version, status, type, width, height, duration_seconds, has_preview,
-- reel_eligible, created_at in microseconds, guest_id (host scope) or null], ordered by version then id.
-- SECURITY INVOKER and service role only: the route has already decided the viewer may see this album.
create function public.album_changes_since(
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
  'The paged album''s poll read, one jsonb in one snapshot: {version, album_max, attr_version, approved, hidden, pending, changes: [[media_id, version, status, type, width, height, duration_seconds, has_preview, reel_eligible, created_at_us, guest_id], ...]}. p_scope ''album'' (guest: changes across approved, the approved count) or ''host'' (every status change, three counts, guest_id). Keyset on the scope''s version after p_after, clamped to 1,000. SECURITY INVOKER, service role only: the route decides who may see the album.';

-- =============================================================================================
-- 7. Grants: never a client role (the MCP's default grant would hand each of these to anon).
-- =============================================================================================
revoke all on function public.album_scope(public.media_status, public.media_status) from public, anon, authenticated;
revoke all on function public.album_remember(text, uuid) from public, anon, authenticated;
revoke all on function public.album_flush() from public, anon, authenticated;
revoke all on function public.album_note_media() from public, anon, authenticated;
revoke all on function public.album_stamp_media() from public, anon, authenticated;
revoke all on function public.album_note_guest() from public, anon, authenticated;
revoke all on function public.album_note_profile() from public, anon, authenticated;
revoke all on function public.album_flush_trigger() from public, anon, authenticated;
revoke all on function public.album_changes_since(uuid, text, bigint, integer) from public, anon, authenticated;
grant execute on function public.album_changes_since(uuid, text, bigint, integer) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). It rides the scale probe
-- (event 14bb4318-80cd-4eed-b219-92c097ee16c7, willg97's: 1,145 approved, 20 held, 35 removed, three
-- name-only guests with live uploads) and the probe host's other events, and hard-deletes the probe
-- inside the block to prove the flush skips a vanished event. `set constraints all immediate` makes
-- each statement one flush of one transaction, so a step that touches an event already bumped in this
-- block must NOT bump it again (b, f). The error it ends on must read
-- `ROLLED BACK: every album_version check held {...}`.
-- The lane ran (1) the file verbatim on a throwaway local cluster (Postgres 17) holding a stand-in of the
-- touched tables and the live bodies of every writer, with this block and a concurrent stress of every
-- writer shape (see the lane's handoff), and (2) this block on the live project BEFORE the apply
-- (2026-09-25), with the file's statements (its COMMENT ON FUNCTION lines aside) executed at the head of
-- the same DO block: it ended on `ROLLED BACK: every album_version check held {"before": [0, 0, 0],
-- "host_read": {"hidden": 2, "pending": 18, "version": 1, "approved": 1145, "album_max": 1,
-- "attr_version": 0}, "album_state_rows": 10}`, and the catalog read no album_* object afterwards.
-- =============================================================================================
-- do $check$
-- declare
--   c_event constant uuid := '14bb4318-80cd-4eed-b219-92c097ee16c7';
--   v_host uuid;
--   v_other uuid;
--   v_v bigint;
--   v_a bigint;
--   v_t bigint;
--   v_ot bigint;
--   v_hide uuid;
--   v_approve uuid;
--   v_hold uuid;
--   v_gone uuid;
--   v_guest uuid;
--   v_j jsonb;
--   v_n bigint;
--   v_got text;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   select e.host_id into v_host from public.events e
--    where e.id = c_event and e.deleted_at is null and e.visibility = 'open';
--   if v_host is null then raise exception 'SETUP: the scale probe % is not an open, live event', c_event; end if;
--   select e.id into v_other from public.events e where e.host_id = v_host and e.id <> c_event order by e.id limit 1;
--
--   -- ── 1. The tables: deny-all, service_role reads, nobody else; a row for every event ──
--   if not (select bool_and(c.relrowsecurity) from pg_class c
--            where c.oid in ('public.album_state'::regclass, 'public.album_changes'::regclass))
--      or exists (select 1 from pg_policy p
--                  where p.polrelid in ('public.album_state'::regclass, 'public.album_changes'::regclass)) then
--     raise exception 'FAIL: the album tables are not RLS-on with no policy';
--   end if;
--   if has_table_privilege('anon', 'public.album_state', 'select')
--      or has_table_privilege('authenticated', 'public.album_state', 'select')
--      or has_table_privilege('anon', 'public.album_changes', 'select')
--      or has_table_privilege('authenticated', 'public.album_changes', 'select')
--      or has_table_privilege('authenticated', 'public.album_state', 'update')
--      or has_table_privilege('anon', 'public.album_changes', 'insert')
--      or has_table_privilege('service_role', 'public.album_state', 'update')
--      or has_table_privilege('service_role', 'public.album_changes', 'insert')
--      or not has_table_privilege('service_role', 'public.album_state', 'select')
--      or not has_table_privilege('service_role', 'public.album_changes', 'select') then
--     raise exception 'FAIL: an album table grant';
--   end if;
--   select count(*) into v_n from public.events e
--    where not exists (select 1 from public.album_state s where s.event_id = e.id);
--   if v_n <> 0 then raise exception 'FAIL: % events have no album_state row', v_n; end if;
--   v_report := v_report || jsonb_build_object('album_state_rows', (select count(*) from public.album_state));
--
--   -- ── 2. The functions: nine, all pinned, none client-executable; the reader invoker and service_role's ──
--   select count(*) into v_n from pg_proc p
--    where p.pronamespace = 'public'::regnamespace and p.proname like 'album\_%';
--   if v_n <> 9 then raise exception 'FAIL: % album functions, want 9', v_n; end if;
--   if exists (select 1 from pg_proc p
--               where p.pronamespace = 'public'::regnamespace and p.proname like 'album\_%'
--                 and (has_function_privilege('anon', p.oid, 'execute')
--                      or has_function_privilege('authenticated', p.oid, 'execute')
--                      or not coalesce(p.proconfig, '{}') @> array['search_path=""'])) then
--     raise exception 'FAIL: an album function is client-executable or has no empty search_path';
--   end if;
--   if not has_function_privilege('service_role', 'public.album_changes_since(uuid, text, bigint, integer)', 'execute')
--      or (select p.prosecdef from pg_proc p where p.oid = 'public.album_changes_since(uuid, text, bigint, integer)'::regprocedure)
--      or not (select bool_and(p.prosecdef) from pg_proc p where p.pronamespace = 'public'::regnamespace
--               and p.proname in ('album_flush', 'album_note_media', 'album_stamp_media', 'album_note_guest',
--                                 'album_note_profile', 'album_flush_trigger')) then
--     raise exception 'FAIL: the reader must be invoker and service_role''s, the writers definer';
--   end if;
--
--   -- ── 3. The triggers: three immediate notes, three deferred stamps ──
--   select count(*) into v_n from pg_trigger t
--    where t.tgname in ('media_album_stamp', 'guests_album_stamp', 'profiles_album_stamp')
--      and t.tgconstraint <> 0 and t.tgdeferrable and t.tginitdeferred;
--   if v_n <> 3 then raise exception 'FAIL: % deferred stamps, want 3', v_n; end if;
--   select count(*) into v_n from pg_trigger t
--    where t.tgname in ('media_album_note', 'guests_album_note', 'profiles_album_note') and t.tgconstraint = 0;
--   if v_n <> 3 then raise exception 'FAIL: % immediate notes, want 3', v_n; end if;
--
--   -- ── 4. Behaviour on the probe. From here the stamps fire at each statement's end, so every step is
--   --       one flush of one transaction: an event is bumped once however many statements touch it. ──
--   set constraints all immediate;
--   select s.version, s.album_max, s.attr_version into v_v, v_a, v_t from public.album_state s where s.event_id = c_event;
--   select s.attr_version into v_ot from public.album_state s where s.event_id = v_other;
--   v_report := v_report || jsonb_build_object('before', jsonb_build_array(v_v, v_a, v_t));
--
--   -- a) Hide the newest approved photo: both scopes move, once.
--   select m.id into v_hide from public.media m where m.event_id = c_event and m.status = 'approved'
--    order by m.created_at desc, m.id desc limit 1;
--   update public.media set status = 'hidden' where id = v_hide;
--   select format('%s/%s/%s', s.version - v_v, s.album_max - v_a, s.attr_version - v_t) into v_got
--     from public.album_state s where s.event_id = c_event;
--   if v_got <> '1/1/0' then raise exception 'FAIL a: the hide moved the versions by %', v_got; end if;
--   select format('%s/%s', c.host_version - v_v, c.album_version - v_a) into v_got
--     from public.album_changes c where c.event_id = c_event and c.media_id = v_hide;
--   if v_got is distinct from '1/1' then raise exception 'FAIL a: the hidden item''s change row reads %', v_got; end if;
--
--   -- b) Approve a held one in the same transaction: stamped at the same version, no second bump.
--   select m.id into v_approve from public.media m where m.event_id = c_event and m.status = 'pending'
--    order by m.created_at desc, m.id desc limit 1;
--   update public.media set status = 'approved' where id = v_approve;
--   select format('%s/%s/%s', s.version - v_v, s.album_max - v_a, s.attr_version - v_t) into v_got
--     from public.album_state s where s.event_id = c_event;
--   if v_got <> '1/1/0' then raise exception 'FAIL b: one transaction bumped twice (%)', v_got; end if;
--   select format('%s/%s', c.host_version - v_v, c.album_version - v_a) into v_got
--     from public.album_changes c where c.event_id = c_event and c.media_id = v_approve;
--   if v_got is distinct from '1/1' then raise exception 'FAIL b: the approved item''s change row reads %', v_got; end if;
--
--   -- c) Held to hidden: the host's scope only; the item's album version stays null.
--   select m.id into v_hold from public.media m where m.event_id = c_event and m.status = 'pending'
--    order by m.created_at desc, m.id desc limit 1;
--   update public.media set status = 'hidden' where id = v_hold;
--   select format('%s/%s', c.host_version - v_v, coalesce(c.album_version::text, 'null')) into v_got
--     from public.album_changes c where c.event_id = c_event and c.media_id = v_hold;
--   if v_got is distinct from '1/null' then raise exception 'FAIL c: the held item''s change row reads %', v_got; end if;
--
--   -- d) A purge of a removed row moves nothing and writes nothing.
--   select m.id into v_gone from public.media m where m.event_id = c_event and m.status = 'removed'
--    and m.legal_hold_at is null order by m.created_at, m.id limit 1;
--   perform public.purge_media_rows(array[v_gone]);
--   if exists (select 1 from public.media where id = v_gone) then raise exception 'SETUP d: the purge left the row'; end if;
--   select format('%s/%s/%s', s.version - v_v, s.album_max - v_a, s.attr_version - v_t) into v_got
--     from public.album_state s where s.event_id = c_event;
--   if v_got <> '1/1/0' or exists (select 1 from public.album_changes c where c.media_id = v_gone) then
--     raise exception 'FAIL d: the purge of a removed row moved the album (%)', v_got;
--   end if;
--
--   -- e) The reader: one snapshot, the counts exact, the changes with their current status.
--   v_j := public.album_changes_since(c_event, 'album', v_a);
--   if (v_j ->> 'album_max')::bigint <> v_a + 1
--      or (v_j ->> 'approved')::bigint <> (select count(*) from public.media where event_id = c_event and status = 'approved')
--      or v_j -> 'hidden' <> 'null'::jsonb or v_j -> 'pending' <> 'null'::jsonb then
--     raise exception 'FAIL e: the album read %', v_j - 'changes';
--   end if;
--   select string_agg(format('%s:%s', x ->> 0, x ->> 2), ',' order by x ->> 0) into v_got
--     from jsonb_array_elements(v_j -> 'changes') x;
--   if v_got is distinct from (select string_agg(format('%s:%s', id, status), ',' order by id::text)
--                                from public.media where id in (v_hide, v_approve)) then
--     raise exception 'FAIL e: the album''s changes read %', v_got;
--   end if;
--   if exists (select 1 from jsonb_array_elements(v_j -> 'changes') x where x -> 10 <> 'null'::jsonb) then
--     raise exception 'FAIL e: a guest_id reached the album scope';
--   end if;
--   v_j := public.album_changes_since(c_event, 'host', v_v);
--   if (v_j ->> 'version')::bigint <> v_v + 1
--      or (v_j ->> 'hidden')::bigint <> (select count(*) from public.media where event_id = c_event and status = 'hidden')
--      or (v_j ->> 'pending')::bigint <> (select count(*) from public.media where event_id = c_event and status = 'pending')
--      or jsonb_array_length(v_j -> 'changes') <> 3 then
--     raise exception 'FAIL e: the host read %', v_j;
--   end if;
--   if exists (select 1 from jsonb_array_elements(v_j -> 'changes') x
--               where (x ->> 9)::bigint <> (select (extract(epoch from m.created_at) * 1000000)::bigint
--                                              from public.media m where m.id = (x ->> 0)::uuid)) then
--     raise exception 'FAIL e: a created_at in microseconds is not exact';
--   end if;
--   select jsonb_array_length(public.album_changes_since(c_event, 'host', v_v, 2) -> 'changes') into v_n;
--   if v_n <> 2 then raise exception 'FAIL e: p_limit 2 read % changes', v_n; end if;
--   v_report := v_report || jsonb_build_object('host_read', v_j - 'changes');
--
--   -- f) Attribution: a guest with a live upload renamed moves attr once; the host's rename moves the
--   --    host's other events (this one already moved in this transaction).
--   select g.id into v_guest from public.guests g where g.event_id = c_event
--    and exists (select 1 from public.media m where m.guest_id = g.id and m.status <> 'removed')
--    order by g.id limit 1;
--   update public.guests set display_name = 'Album check' where id = v_guest;
--   select format('%s/%s/%s', s.version - v_v, s.album_max - v_a, s.attr_version - v_t) into v_got
--     from public.album_state s where s.event_id = c_event;
--   if v_got <> '1/1/1' then raise exception 'FAIL f: the guest rename moved the versions by %', v_got; end if;
--   update public.profiles set display_name = coalesce(display_name, '') || ' (check)' where id = v_host;
--   if v_other is not null
--      and (select s.attr_version from public.album_state s where s.event_id = v_other) <> v_ot + 1 then
--     raise exception 'FAIL f: the host rename did not move their other event';
--   end if;
--   select format('%s/%s/%s', s.version - v_v, s.album_max - v_a, s.attr_version - v_t) into v_got
--     from public.album_state s where s.event_id = c_event;
--   if v_got <> '1/1/1' then raise exception 'FAIL f: the host rename bumped this event twice (%)', v_got; end if;
--
--   -- g) The client roles are refused the tables and the reader.
--   set local role anon;
--   begin
--     perform 1 from public.album_state limit 1;
--     raise exception 'FAIL g: anon read album_state';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   set local role authenticated;
--   begin
--     perform public.album_changes_since(c_event, 'album', 0);
--     raise exception 'FAIL g: authenticated ran album_changes_since';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--
--   -- h) A hard delete of the probe, every media row with it, runs through the stamps and takes the
--   --    album rows along (the flush skips an event that no longer exists).
--   delete from public.events where id = c_event;
--   if exists (select 1 from public.album_state where event_id = c_event)
--      or exists (select 1 from public.album_changes where event_id = c_event) then
--     raise exception 'FAIL h: the deleted event kept album rows';
--   end if;
--
--   raise exception 'ROLLED BACK: every album_version check held %', v_report;
-- end
--  $check$;
