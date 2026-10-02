-- =============================================================================================
-- A FACE MOVES AT ONCE (lane `crumbs-43`; ROADMAP, from crumbs-38: "an open album's credits take a new photograph
-- or handle only at the link's next re-mint (an hour) or a reload, since the attribution version moves on a name
-- (`profiles_album_note` watches `display_name` alone); adding `avatar_updated_at` and `slug` to that trigger's
-- columns would move a face at once").
--
-- Why: a credit wears its person's face and door (crumbs-38's `uploader-faces.ts`: the avatar's public URL, keyed by
-- `profiles.avatar_updated_at`, and `/u/<slug>`), and both ride the album link's `who` tuple. A held link is minted
-- again only when it ages (an hour) or when the album's ATTRIBUTION VERSION moves past the one it was read under
-- (`src/lib/album/links.ts`, `setAttr`). That version moves on a rename alone: `profiles_album_note` and
-- `profiles_album_stamp` fire `after update of display_name ... when (old.display_name is distinct from
-- new.display_name)`. So a person who changed her photograph, or claimed or changed her handle, kept her old face
-- and door on every open album until its links aged.
--
-- WHAT CHANGES, the two profiles triggers' columns and nothing else:
--   `profiles_album_note` (IMMEDIATE, notes the events) and `profiles_album_stamp` (DEFERRED, flushes the versions
--   at commit) watch `display_name, avatar_updated_at, slug`, and fire when any of the three is DISTINCT. Their
--   functions (`album_note_profile`, `album_flush_trigger`) are untouched (live bodies md5-checked 2026-10-01:
--   d8bff7a28f94380fa00fa2e3b098ac8f and 2c7dc7b2c29911ca209ea93b17608eb7, raw prosrc; the file
--   20260926100000_album_version.sql's), so WHICH albums move is what it was: every event the person hosts, and every
--   event where she is a confirmed guest with a live upload. `avatar_updated_at` is the face's own marker (the avatar
--   route stamps it on every new photograph and on a removal, `api/account/avatar/route.ts`); `bio`, `tier`,
--   `last_active_at`, `updated_at` and every other column still move nothing (the column list and the WHEN are the
--   guarantee; step 4 below proves two of them and a same-value write), so a profile's ordinary writes wake no
--   album.
--
-- WHO MAY RUN THEM: unchanged. Trigger functions run for no client role (EXECUTE revoked in 20260926100000 and
-- checked at CREATE TRIGGER, never at firing; database-security.md); nothing here grants anything.
--
-- SHAPE: Postgres has no `create or replace` for a constraint trigger, so each is DROPPED and CREATED, the plain one
-- too for one shape. Same names, so each table's note still sorts before its stamp (`*_album_note` <
-- `*_album_stamp`: under `set constraints all immediate` both fire at the statement's end in name order, and a stamp
-- that ran first would flush before its event was noted; 20260926100000's note). The stamp stays DEFERRABLE
-- INITIALLY DEFERRED (the lock-order rule: the album row is every transaction's last lock). Locks: DROP and CREATE
-- TRIGGER take SHARE ROW EXCLUSIVE on profiles for the instant of the apply; a profile write in that instant waits.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) before: `select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.profiles'::regclass
--       and not tgisinternal order by 1;` reads four (live 2026-10-01): profiles_album_note
--       `CREATE TRIGGER profiles_album_note AFTER UPDATE OF display_name ON public.profiles FOR EACH ROW WHEN
--       ((old.display_name IS DISTINCT FROM new.display_name)) EXECUTE FUNCTION album_note_profile()`,
--       profiles_album_stamp (the same columns and WHEN, `CREATE CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY
--       DEFERRED ... EXECUTE FUNCTION album_flush_trigger()`), profiles_scrub_guest_rows, profiles_set_updated_at;
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after: four triggers, the two
--       album ones as step 0 of the check reads them, the other two untouched;
--   (4) get_advisors, EXPECTED DELTA: NONE (no function, grant or table changes);
--   (5) no types regeneration (no column, function or signature moves).
-- ★ EITHER ORDER IS SAFE: no build reads anything new. The deployed build already re-mints a link whose attribution
-- is older than the album's, so the first build to meet this file draws a new face on its next poll.
-- =============================================================================================

drop trigger profiles_album_note on public.profiles;

create trigger profiles_album_note
  after update of display_name, avatar_updated_at, slug on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name
     or old.avatar_updated_at is distinct from new.avatar_updated_at
     or old.slug is distinct from new.slug)
  execute function public.album_note_profile();

drop trigger profiles_album_stamp on public.profiles;

create constraint trigger profiles_album_stamp
  after update of display_name, avatar_updated_at, slug on public.profiles
  deferrable initially deferred
  for each row
  when (old.display_name is distinct from new.display_name
     or old.avatar_updated_at is distinct from new.avatar_updated_at
     or old.slug is distinct from new.slug)
  execute function public.album_flush_trigger();

comment on function public.album_note_profile() is
  'IMMEDIATE profiles trigger: notes an attribution change (the name, the face''s avatar_updated_at, the handle) for the events the profile hosts and those where it is a verified guest with a live upload.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the block
-- below (uncommented) with this file's statements verbatim where it says so, and `select n, step, ok, detail from
-- proof order by n; rollback;`. Red first: the same block WITHOUT this file's statements, on today's schema. It rides
-- an EXISTING profile that hosts a live event (every event it hosts is noted on an attribution change), each step
-- starting from an empty attribution set (`partyreel.album_t` and its flush mark, transaction-local settings), so a
-- step's own update is the only thing that can note the event. Each step traps its own failure into `proof`.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid) on commit drop;
-- insert into fx
--   select 'event', e.id from public.events e
--    where e.deleted_at is null and e.host_id is not null
--    order by e.created_at desc limit 1;
-- insert into fx select 'host', e.host_id from public.events e where e.id = (select id from fx where k = 'event');
--
-- <this file's statements, verbatim>
--
-- -- ── 0. the two triggers read back as written (RED on today's schema: display_name alone) ──
-- do $$
-- declare n text; s text;
-- begin
--   select pg_get_triggerdef(oid) into n from pg_trigger
--    where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_album_note';
--   select pg_get_triggerdef(oid) into s from pg_trigger
--    where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_album_stamp';
--   if n <> 'CREATE TRIGGER profiles_album_note AFTER UPDATE OF display_name, avatar_updated_at, slug ON public.profiles FOR EACH ROW WHEN (((old.display_name IS DISTINCT FROM new.display_name) OR (old.avatar_updated_at IS DISTINCT FROM new.avatar_updated_at) OR (old.slug IS DISTINCT FROM new.slug))) EXECUTE FUNCTION album_note_profile()'
--     then raise exception 'note: %', n; end if;
--   if s <> 'CREATE CONSTRAINT TRIGGER profiles_album_stamp AFTER UPDATE OF display_name, avatar_updated_at, slug ON public.profiles DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (((old.display_name IS DISTINCT FROM new.display_name) OR (old.avatar_updated_at IS DISTINCT FROM new.avatar_updated_at) OR (old.slug IS DISTINCT FROM new.slug))) EXECUTE FUNCTION album_flush_trigger()'
--     then raise exception 'stamp: %', s; end if;
--   insert into proof (step, ok, detail) values ('0 the triggers', true, 'three columns, the stamp deferred');
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 the triggers', false, sqlerrm);
-- end $$;
--
-- -- ── 1 to 3. a new face, a new handle, a new name: each notes the host's event (1 and 2 RED today) ──
-- do $$
-- declare h uuid; ev uuid; noted text;
-- begin
--   select id into h from fx where k = 'host';
--   select id into ev from fx where k = 'event';
--   perform set_config('partyreel.album_t', '', true);
--   update public.profiles set avatar_updated_at = clock_timestamp() where id = h;
--   noted := coalesce(current_setting('partyreel.album_t', true), '');
--   if strpos(noted, ev::text) = 0 then raise exception 'a new face noted nothing: [%]', noted; end if;
--   insert into proof (step, ok, detail) values ('1 a new face', true, 'noted the event');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 a new face', false, sqlerrm);
-- end $$;
-- do $$
-- declare h uuid; ev uuid; noted text;
-- begin
--   select id into h from fx where k = 'host';
--   select id into ev from fx where k = 'event';
--   perform set_config('partyreel.album_t', '', true);
--   update public.profiles set slug = 'c43-' || substr(md5(random()::text), 1, 10) where id = h;
--   noted := coalesce(current_setting('partyreel.album_t', true), '');
--   if strpos(noted, ev::text) = 0 then raise exception 'a new handle noted nothing: [%]', noted; end if;
--   insert into proof (step, ok, detail) values ('2 a new handle', true, 'noted the event');
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 a new handle', false, sqlerrm);
-- end $$;
-- do $$
-- declare h uuid; ev uuid; noted text;
-- begin
--   select id into h from fx where k = 'host';
--   select id into ev from fx where k = 'event';
--   perform set_config('partyreel.album_t', '', true);
--   update public.profiles set display_name = coalesce(display_name, '') || ' (c43)' where id = h;
--   noted := coalesce(current_setting('partyreel.album_t', true), '');
--   if strpos(noted, ev::text) = 0 then raise exception 'a new name noted nothing: [%]', noted; end if;
--   insert into proof (step, ok, detail) values ('3 a new name', true, 'noted the event, as before');
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 a new name', false, sqlerrm);
-- end $$;
--
-- -- ── 4. nothing else moves an album: another column, and a write that changes none of the three ──
-- do $$
-- declare h uuid; noted text;
-- begin
--   select id into h from fx where k = 'host';
--   perform set_config('partyreel.album_t', '', true);
--   update public.profiles set last_active_at = clock_timestamp(), announcements_seen_at = clock_timestamp() where id = h;
--   update public.profiles set avatar_updated_at = avatar_updated_at, slug = slug, display_name = display_name where id = h;
--   noted := coalesce(current_setting('partyreel.album_t', true), '');
--   if noted <> '' then raise exception 'noted on nothing that draws: [%]', noted; end if;
--   insert into proof (step, ok, detail) values ('4 nothing else', true, 'last_active_at, announcements_seen_at and same-value writes note nothing');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 nothing else', false, sqlerrm);
-- end $$;
--
-- -- ── 5. end to end: the deferred stamp flushes a new face into the album's attribution version (RED today) ──
-- do $$
-- declare h uuid; ev uuid; v0 bigint; v1 bigint;
-- begin
--   select id into h from fx where k = 'host';
--   select id into ev from fx where k = 'event';
--   set constraints all immediate;
--   select coalesce((select attr_version from public.album_state where event_id = ev), 0) into v0;
--   perform set_config('partyreel.album_t', '', true);
--   perform set_config('partyreel.album_ft', '0', true);
--   update public.profiles set avatar_updated_at = clock_timestamp() + interval '1 second' where id = h;
--   select coalesce((select attr_version from public.album_state where event_id = ev), 0) into v1;
--   set constraints all deferred;
--   if v1 <> v0 + 1 then raise exception 'attr_version % -> %', v0, v1; end if;
--   insert into proof (step, ok, detail) values ('5 the version moves', true, v0 || ' -> ' || v1);
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 the version moves', false, sqlerrm);
-- end $$;
--
-- RESULT, 2026-10-01, on the live schema, each run one execute_sql call, nothing persisted (afterwards both triggers
-- read back as live had them, display_name alone):
--   RED, without this file's statements: 0, 1, 2 and 5 fail (0 the note's definition reads `AFTER UPDATE OF
--     display_name ... WHEN ((old.display_name IS DISTINCT FROM new.display_name))`; 1 "a new face noted nothing: []";
--     2 "a new handle noted nothing: []"; 5 "attr_version 2 -> 2"); 3 (a new name) and 4 (nothing else) hold, as
--     they do today.
--   GREEN, with them: 6/6. 0 both triggers read back as written; 1 a new face, 2 a new handle and 3 a new name each
--     note the host's event; 4 last_active_at, announcements_seen_at and a same-value write of all three note
--     nothing; 5 a new face flushed by the stamp moves the album's attribution version 2 -> 3.
-- =============================================================================================
