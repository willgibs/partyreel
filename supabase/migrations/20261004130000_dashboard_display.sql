-- =============================================================================================
-- THE DASHBOARD'S DISPLAY, AND ITS OPENS (lane `dashboard-wiring`; Will, 2026-10-04, host-dashboard round 3:
-- `events=menu`, with the board's carried call `kept`, taken as written: "On her account, so her phone opens the way her
-- laptop left it: a column on her profile").
--
-- WHAT A HOST GETS: Your events opens the way she left it on every device she signs in on (her layout, order, filters,
-- groups and cover size, and whether the Recent row is folded), and the Recent row and the Last opened order know which
-- of her events she opened last.
--
-- THE MODEL, AS BUILT:
--   1. `profiles.events_display jsonb not null default '{}'`: her choices, SPARSE (only what differs from the app's
--      defaults, so `{}` is every default and a default changed later reaches everyone who never chose). The app
--      narrows every key on every read (`resolveDisplay`, lib/dashboard/display.ts), so nothing this column holds is
--      ever trusted; the column's own bound is an ENVELOPE, never the key list (an object, at most 512 bytes of text),
--      so a preference the app learns tomorrow needs no migration, and a host who writes straight through PostgREST
--      (her session passes no schema) can still store nothing larger than a few words. Hers to write: one bare column
--      grant, her own row under RLS (`profiles_update_own`).
--   2. `events.host_opened_at timestamptz`, NULL = never opened: the last time the host pressed into this event from
--      her dashboard. One timestamp an event (never a growing list), so "Last opened" orders every one of her events
--      exactly and the Recent row is its newest few. Stamped by the dashboard's own links through a Server Function, as
--      her (`events_host_all`: another host's event is simply no row). It only ORDERS her list: nothing in the database
--      reads it. Under a CHECK that it is finite (an owner's raw write could store 'infinity', which sorts first in
--      every list and is no moment: database-security.md, Gotchas), and one bare column grant on UPDATE.
--
-- ★ WHAT AN UPDATE OF `host_opened_at` ALSO DOES, and why it is harmless (read live, 2026-10-04): `events_set_updated_at`
-- stamps `updated_at` (as it does for every UPDATE), `events_set_purge_at` recomputes the same `purge_at`,
-- `events_guard_privileged_transitions` passes (it refuses only leaving the bin), and no other trigger fires (the door,
-- hold, reveal, develop and limit triggers are each `UPDATE OF <their columns>` or `WHEN` on theirs). `events.updated_at`
-- is read by one thing, the free-tier inactivity sweep's freshness clock, a MAX with the host's `last_active_at`, which
-- any host page load already refreshes (throttled to 12 h): a host who is opening an event is by then active, so an open
-- moves no sweep's verdict. No album trigger names `events` (the album's version rows hang off `media`, `guests` and
-- `profiles`' display columns), so an open never moves a guest's album.
--
-- AN EXPAND: partyreel.com's build (milestone 35) and the alias's never name either column. Two columns a deployed
-- build never reads (its `select("*")` reads them as extra keys it ignores), and two column grants nothing deployed
-- calls. What partyreel.com meets meanwhile: nothing. What THIS lane's build meets without the file: Display's choices
-- and an open's stamp fail on a missing column (a 42703 / PGRST204, captured and said once), so
--
-- ★ APPLY BEFORE THE ALIAS BUILD THAT CARRIES THE LANE.
--
-- NO OPERATOR FIX AND NO JOB: a host's own choices are hers (Reset is a press, and a value the app does not recognise
-- narrows to the default on read), and an open's stamp is one UPDATE inside a request; nothing here wants an /admin
-- control or a health signal.
--
-- LOCKS AT APPLY: `profiles` and `events` each take ACCESS EXCLUSIVE for an instant (ADD COLUMN with a constant default
-- or NULL is metadata only, no rewrite); each CHECK then scans its table (about 110 events, a handful of profiles)
-- under it. No index, no function, no policy, no trigger.
--
-- ADVISORS (security): none (19 / 4 / 36): no function, table, policy or anon grant is added.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) drift, read-only: neither `profiles.events_display` nor `events.host_opened_at` exists, and `authenticated` holds
--       UPDATE on exactly the profiles columns `announcements_seen_at`, `welcomed_at`, `make_room_from_deleted` and
--       on no table-level UPDATE of `profiles` or `events`.
--   (2) the rolled-back check at the foot, in one execute_sql call (red without this file's statements, green with).
--   (3) apply verbatim.  (4) get_advisors (security): unchanged.
--   (5) regenerate src/lib/db/types.ts (profiles gains `events_display`, events gains `host_opened_at`), then drop the
--       lane's two typed seams named in its handoff (`displayOf`, `openedAtOf`, and the two `as never` writes in
--       `dashboard/actions.ts`).
-- =============================================================================================

-- =============================================================================================
-- 1. Her choices: profiles.events_display.
-- =============================================================================================
alter table public.profiles
  add column events_display jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_events_display_shape
  check (jsonb_typeof(events_display) = 'object' and octet_length(events_display::text) <= 512);

comment on column public.profiles.events_display is
  'How Your events opens on the host''s dashboard, kept for her account on every device (host-dashboard round 3, the Display menu): her layout, sort and direction, filters, group and cover size, and whether the Recent row is folded. SPARSE: only what differs from the app''s defaults, so {} is every default. The app narrows every key on every read (resolveDisplay), so nothing here is trusted; the CHECK is an envelope (an object, at most 512 bytes of text), never the key list. Hers to write: the one column grant below, her own row under RLS.';

-- Additive, as a host-writable column takes it (database-security.md): the table's UPDATE is already column-locked, so
-- this names one more column beside announcements_seen_at, welcomed_at and make_room_from_deleted, and her own row is
-- all RLS lets her reach. Never a table-level grant or revoke, which would cascade to every column grant.
grant update (events_display) on public.profiles to authenticated;

-- =============================================================================================
-- 2. Her opens: events.host_opened_at.
-- =============================================================================================
alter table public.events
  add column host_opened_at timestamptz;

alter table public.events
  add constraint events_host_opened_at_finite
  check (host_opened_at is null or isfinite(host_opened_at));

comment on column public.events.host_opened_at is
  'The last time the host pressed into this event from her dashboard (host-dashboard round 3), NULL = never: what the Recent row and the Last opened order read. Stamped by the dashboard''s own links as the host (RLS events_host_all), at most once a minute an event; it never gates, ends or dates anything. A finite instant (the CHECK): an owner''s raw write can store infinity.';

grant update (host_opened_at) on public.events to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved before applying, ONE execute_sql call of `begin;`, the block below and `rollback;`
-- (GREEN: this file's statements between `begin;` and the block; RED: the block alone, where every step after the
-- fixtures fails on the missing columns). Fixtures: two hosts, each with one event. Each step traps its own failure into
-- `proof`, and the last statement reads it.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid) on commit drop;
--
-- do $$
-- declare
--   v_a uuid := 'dd0e0000-0000-4000-8000-0000000000a1';
--   v_b uuid := 'dd0e0000-0000-4000-8000-0000000000b1';
--   v_ea uuid := 'dd0e0000-0000-4000-8000-0000000000e1';
--   v_eb uuid := 'dd0e0000-0000-4000-8000-0000000000e2';
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values
--     (v_a, 'dd-a@check.invalid', now()), (v_b, 'dd-b@check.invalid', now());
--   insert into public.events (id, host_id, name) values (v_ea, v_a, 'Display check A'), (v_eb, v_b, 'Display check B');
--   insert into fx values ('a', v_a), ('b', v_b), ('ea', v_ea), ('eb', v_eb);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, 'two hosts, an event each');
-- exception when others then insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- ── 1. the columns: types, nullability, the default ──
-- do $$
-- declare p text; e text;
-- begin
--   select data_type || ':' || is_nullable || ':' || coalesce(column_default, 'none') into p from information_schema.columns
--    where table_schema = 'public' and table_name = 'profiles' and column_name = 'events_display';
--   select data_type || ':' || is_nullable into e from information_schema.columns
--    where table_schema = 'public' and table_name = 'events' and column_name = 'host_opened_at';
--   if p is distinct from 'jsonb:NO:''{}''::jsonb' then raise exception 'profiles.events_display %', coalesce(p, 'missing'); end if;
--   if e is distinct from 'timestamp with time zone:YES' then raise exception 'events.host_opened_at %', coalesce(e, 'missing'); end if;
--   if (select events_display from public.profiles where id = (select id from fx where k = 'a')) <> '{}'::jsonb then
--     raise exception 'a new profile does not start at every default';
--   end if;
--   insert into proof (step, ok, detail) values ('1 the columns', true, p || '; ' || e);
-- exception when others then insert into proof (step, ok, detail) values ('1 the columns', false, sqlerrm);
-- end $$;
--
-- -- ── 2. the envelopes: an object within 512 bytes, a finite instant ──
-- do $$
-- declare bad text := ''; v_a uuid; v_ea uuid;
-- begin
--   select id into v_a from fx where k = 'a';
--   select id into v_ea from fx where k = 'ea';
--   begin update public.profiles set events_display = '[]'::jsonb where id = v_a; bad := bad || ' array-stored';
--   exception when check_violation then null; end;
--   begin update public.profiles set events_display = '"x"'::jsonb where id = v_a; bad := bad || ' scalar-stored';
--   exception when check_violation then null; end;
--   begin update public.profiles set events_display = jsonb_build_object('layout', repeat('x', 600)) where id = v_a;
--     bad := bad || ' large-stored';
--   exception when check_violation then null; end;
--   begin update public.profiles set events_display = null where id = v_a; bad := bad || ' null-stored';
--   exception when not_null_violation then null; end;
--   update public.profiles set events_display = '{"layout":"table","sort":"opened","desc":false,"lens":"hosting","when":"upcoming","year":"2023","group":"year","scale":"l","recent":"folded"}'::jsonb
--    where id = v_a;
--   begin update public.events set host_opened_at = 'infinity' where id = v_ea; bad := bad || ' infinity-stored';
--   exception when check_violation then null; end;
--   begin update public.events set host_opened_at = '-infinity' where id = v_ea; bad := bad || ' -infinity-stored';
--   exception when check_violation then null; end;
--   update public.events set host_opened_at = now() where id = v_ea;
--   if bad <> '' then raise exception 'envelope:%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 the envelopes', true,
--     'an array, a scalar, a large object and null refused; a full sparse object and now() kept; infinity refused');
-- exception when others then insert into proof (step, ok, detail) values ('2 the envelopes', false, sqlerrm);
-- end $$;
--
-- -- ── 3. the grants: one bare column each for authenticated, none for anon, no table-level write ──
-- do $$
-- declare bad text := ''; cols text;
-- begin
--   if not has_column_privilege('authenticated', 'public.profiles', 'events_display', 'UPDATE') then bad := bad || ' profile-ungranted'; end if;
--   if not has_column_privilege('authenticated', 'public.events', 'host_opened_at', 'UPDATE') then bad := bad || ' event-ungranted'; end if;
--   if has_column_privilege('anon', 'public.profiles', 'events_display', 'UPDATE') then bad := bad || ' anon-profile'; end if;
--   if has_column_privilege('anon', 'public.events', 'host_opened_at', 'UPDATE') then bad := bad || ' anon-event'; end if;
--   if has_table_privilege('authenticated', 'public.profiles', 'UPDATE') then bad := bad || ' profiles-table-update'; end if;
--   if has_table_privilege('authenticated', 'public.events', 'UPDATE') then bad := bad || ' events-table-update'; end if;
--   if has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE') then bad := bad || ' email-open'; end if;
--   if has_column_privilege('authenticated', 'public.profiles', 'tier', 'UPDATE') then bad := bad || ' tier-open'; end if;
--   if has_column_privilege('authenticated', 'public.events', 'qr_token', 'UPDATE') then bad := bad || ' qr_token-open'; end if;
--   select string_agg(column_name, ',' order by column_name) into cols from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated' and privilege_type = 'UPDATE';
--   if cols is distinct from 'announcements_seen_at,events_display,make_room_from_deleted,welcomed_at' then
--     bad := bad || ' profile-columns:' || coalesce(cols, 'none');
--   end if;
--   if bad <> '' then raise exception 'grants:%', bad; end if;
--   insert into proof (step, ok, detail) values ('3 the grants', true, 'profiles UPDATE: ' || cols || '; events.host_opened_at beside the settings columns');
-- exception when others then insert into proof (step, ok, detail) values ('3 the grants', false, sqlerrm);
-- end $$;
--
-- -- ── 4. her own rows only, under RLS, and the lock still holds around them ──
-- do $$
-- declare v_a uuid; v_b uuid; v_ea uuid; v_eb uuid; n int; bad text := ''; before_e jsonb; after_e jsonb;
-- begin
--   select id into v_a from fx where k = 'a';  select id into v_b from fx where k = 'b';
--   select id into v_ea from fx where k = 'ea'; select id into v_eb from fx where k = 'eb';
--   select jsonb_build_object('deleted_at', deleted_at, 'purge_at', purge_at, 'accepting_uploads', accepting_uploads,
--            'visibility', visibility, 'moderation_mode', moderation_mode, 'event_date', event_date)
--     into before_e from public.events where id = v_ea;
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_a::text, true);
--   update public.profiles set events_display = '{"layout":"list"}'::jsonb where id = v_a;      get diagnostics n = row_count;
--   if n <> 1 then bad := bad || ' own-profile:' || n; end if;
--   update public.profiles set events_display = '{"layout":"list"}'::jsonb where id = v_b;      get diagnostics n = row_count;
--   if n <> 0 then bad := bad || ' other-profile:' || n; end if;
--   update public.events set host_opened_at = now() where id = v_ea;                            get diagnostics n = row_count;
--   if n <> 1 then bad := bad || ' own-event:' || n; end if;
--   update public.events set host_opened_at = now() where id = v_eb;                            get diagnostics n = row_count;
--   if n <> 0 then bad := bad || ' other-event:' || n; end if;
--   begin update public.profiles set display_name = 'x' where id = v_a; bad := bad || ' display_name-written';
--   exception when insufficient_privilege then null; end;
--   begin update public.events set qr_token = 'x' where id = v_ea; bad := bad || ' qr_token-written';
--   exception when insufficient_privilege then null; end;
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--   select jsonb_build_object('deleted_at', deleted_at, 'purge_at', purge_at, 'accepting_uploads', accepting_uploads,
--            'visibility', visibility, 'moderation_mode', moderation_mode, 'event_date', event_date)
--     into after_e from public.events where id = v_ea;
--   if before_e is distinct from after_e then bad := bad || ' lifecycle-moved'; end if;
--   if bad <> '' then raise exception 'rls:%', bad; end if;
--   insert into proof (step, ok, detail) values ('4 her own rows only', true,
--     'her profile and her event take the writes; another host''s are no row; display_name and qr_token stay refused; no lifecycle column moved');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('4 her own rows only', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
