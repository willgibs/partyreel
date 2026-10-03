-- =============================================================================================
-- AN EVENT'S OPTIONAL END DATE (lane `event-dates`; Will, 2026-10-03, on event-header r2's facts: "think a multi-day
-- event/trip with slow trickle ... we don't do event time ranges/multiple days right now (is it worth adding?)", and
-- his yes the same night: conferences and weekend weddings sit squarely in the 18 to 50 crowd).
--
-- WHAT A HOST GETS: her event's date may be a range of days, no times: a start (`event_date`, as today) and an
-- optional last day (`event_end_date`). Settings takes it; the dashboard's week, its live today and its stage read it
-- (an event is on its day across its whole range); the heads, the door and the cards say it ("October 3 to 5, 2026");
-- the develop default follows the last day (9 am the morning after it).
--
-- ★ AN END DATE ONLY SAYS WHEN THE EVENT HAPPENS. It never ends, locks, archives or purges anything: events have no
-- end of life but deletion (the PRD's anti-abuse core, CLAUDE.md). Nothing in the database reads the column but the
-- two reads below (no trigger, no policy, no sweep), and the check at the foot proves a range long over moves no
-- lifecycle column and closes no album.
--
-- THE MODEL, AS BUILT:
--   1. `events.event_end_date date`, NULL for a one-day or undated event, under a CHECK
--      (`events_end_date_on_or_after`): on or after `event_date`, and NULL whenever that is NULL, so a range never
--      outlives its start and a cleared date takes its end with it in the same save (the app sends both; a save that
--      clears the start alone is refused in the CHECK's own name). An end equal to the start is legal and reads as one
--      day; the app stores NULL for it, so one day has one spelling.
--   2. It joins the INSERT and UPDATE column grants on `events` exactly as `event_date` holds them (`authenticated`;
--      `anon` holds nothing on the table), additively: a table-level revoke would cascade to every column grant
--      (database-security.md, Gotchas). SELECT is table-level, so it reads with no grant.
--   3. `get_event_by_qr_token` returns it LAST, redacted with the date (`hide_meta`: a non-owner of any album that is
--      not open reads NULL), so a gated album's end is withheld exactly as its date is; an unlocked viewer's comes back
--      through the app's own re-reads beside the date. A RETURNS TABLE grows, so DROP + CREATE, carried from
--      20261002200000 verbatim but for the one column, and its four holders restated (postgres, anon, authenticated,
--      service_role; PUBLIC revoked by name).
--   4. `get_public_profile`'s cards carry it beside the date (the hosted cards and the attended lines), carried from
--      20261002200000 verbatim but for the two keys; CREATE OR REPLACE keeps its ACL, restated as its file states it.
--
-- AN EXPAND: partyreel.com's build (milestone 34) never names the column. A new nullable column, a CHECK every row
-- passes (every end is NULL), a read that answers one more column LAST and a profile that answers one more key: the
-- deployed build reads every column where it reads them today. What partyreel.com meets meanwhile (test data only):
-- an event the alias gave an end date refuses, on partyreel.com, a save that clears its date or moves it past the end
-- (its Settings sends the date alone), in "Couldn't save your changes", until the milestone that ships this lane.
--
-- LOCKS AT APPLY: `alter table` on events takes ACCESS EXCLUSIVE for an instant (no rewrite: a NULL column); the CHECK
-- scans the table (~110 rows) under it; the function swap holds its own lock until COMMIT.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (0) ★ APPLY BEFORE THE ALIAS BUILD THAT CARRIES THE LANE: two of its explicit reads name the column (the unlocked
--       album's re-read, `rehydrateUnlockedDetails`, and the door's, `readDoorEventDetails`, which throws on a schema
--       without it), and Settings' date save names it whenever a range is in play.
--   (1) drift, read-only (2026-10-03): the two bodies this file replaces hash as 20261002200000 writes them,
--       whitespace collapsed (raw): get_event_by_qr_token e944c879 (dc71ffcc), get_public_profile cf141ab3
--       (05b92e3c); and no `event_end_date` column exists.
--   (2) the rolled-back check at the foot: red on today's schema (0 fixtures green; 1 to 6 red, the column missing),
--       green with this file between `begin;` and the block; then apply verbatim.
--   (3) get_advisors, EXPECTED DELTA: none (19 / 4 / 35, read 2026-10-03): no new function, table or policy;
--       get_event_by_qr_token keeps its four holders, so 0028 and 0029 list what they listed.
--   (4) regenerate src/lib/db/types.ts (events: event_end_date; get_event_by_qr_token's Returns: event_end_date), then
--       drop the typed seams the lane names in its handoff (`endDateOf`'s callers read the typed column). The lane
--       typechecked its tree against those types added by hand (then discarded): green, so the seams may go one by
--       one.
-- =============================================================================================

-- =============================================================================================
-- 1. The column, its CHECK and its words.
-- =============================================================================================
alter table public.events add column event_end_date date;

alter table public.events
  add constraint events_end_date_on_or_after
  check (event_end_date is null or (event_date is not null and event_end_date >= event_date));

comment on column public.events.event_end_date is
  'The last day of a range of days (a date, no time), NULL for a one-day or undated event; on or after event_date, and NULL whenever that is NULL. It only says when the event happens: it must never end, lock, archive or purge anything (deletion is the only lifecycle exit).';

-- =============================================================================================
-- 2. The host writes it as she writes the date: a bare additive column grant, INSERT and UPDATE.
-- =============================================================================================
grant insert (event_end_date), update (event_end_date) on public.events to authenticated;

-- =============================================================================================
-- 3. The album's read: the end date LAST, redacted with the date.
-- =============================================================================================
-- Carried from 20261002200000 verbatim but for `event_end_date` LAST, under the date's own redaction (`hide_meta`): a
-- non-owner of an album that is not open reads NULL, the owner and an open album's every reader the day. A RETURNS
-- TABLE grows, so DROP + CREATE, and the whole ACL is restated below (database-security.md).
drop function public.get_event_by_qr_token(text);
create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean,
    max_upload_bytes bigint, develop_due boolean, develops_at timestamptz, capture text, roll_size integer,
    event_end_date date)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, v.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end,
         e.show_reel, e.reel_style_id, e.reel_hold_sec,
         (e.allow_videos and coalesce(p.tier <> 'free', false)),
         e.max_upload_bytes,
         public.seal_disagrees(e),
         e.develops_at,
         e.capture,
         e.roll_size,
         case when r.hide_meta then null else e.event_end_date end
  from public.events e
  left join public.profiles p on p.id = e.host_id
  -- ★ THE SNEAKY BLOCK (20260928120000): the event AS THIS CALLER SEES IT. To an account (or the
  -- address it confirmed) this event blocked, it is private, and everything below reads that: the
  -- private album's redaction, and the private branch of every caller, in the same words and the same
  -- time as a private album, because it is one query whoever asks. The host is never blocked from
  -- their own event, and a signed-out caller has no account to hold.
  cross join lateral (
    select case
             when e.host_id is distinct from (select auth.uid())
              and public.event_block_holds_account(e.id, (select auth.uid()))
             then 'private'::public.event_visibility
             else e.visibility
           end as visibility
  ) v
  cross join lateral (
    select
      (v.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (v.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

-- =============================================================================================
-- 4. The profile's cards: the end beside the date, on the hosted cards and the attended lines.
-- =============================================================================================
-- Carried from 20261002200000 verbatim but for `event_end_date` beside each `event_date` (the cards carry the date,
-- so they carry its end: the attended arm is open albums only, and a hosted card is one its host chose to list).
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  with page as (
    select p.id,
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'display_name', p.display_name,
        'bio', p.bio,
        'avatar_updated_at', p.avatar_updated_at,
        'created_at', p.created_at,
        'hosted_events', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'id', e.id,
                   'name', e.name,
                   'event_date', e.event_date,
                   'event_end_date', e.event_end_date,
                   -- ★ THE SNEAKY BLOCK (20260928120000): to a viewer this event blocked, the host's
                   -- own card reads private (no cover, the Private label), as the album does.
                   'visibility', case
                                   when e.host_id is distinct from (select auth.uid())
                                    and public.event_block_holds_account(e.id, (select auth.uid()))
                                   then 'private'::public.event_visibility
                                   else e.visibility
                                 end,
                   'qr_token', e.qr_token,
                   'custom_slug', e.custom_slug
                 ) order by e.event_date desc nulls last, e.created_at desc)
          from public.events e
          where e.host_id = p.id
            and e.display_in_profile
            and e.deleted_at is null
        ), '[]'::jsonb),
        'attended_events', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'id', e.id,
                   'name', e.name,
                   'event_date', e.event_date,
                   'event_end_date', e.event_end_date
                 ) order by e.event_date desc nulls last, e.created_at desc)
          from public.events e
          where e.deleted_at is null
            -- ★ THE GUEST LIST IS ALWAYS ON (Will, event-safety `room=always`, 2026-09-28): the host's
            -- `show_guest_list` key is retired, so the line follows the album and the owner's choice.
            -- open-only: gated (password/private) events never leak name/date or
            -- attendance to anonymous profile viewers.
            and e.visibility = 'open'
            -- ★ THE ALBUM'S OWN GATE, which carries QA #36 (never disclose membership the album itself
            -- withholds from the same viewer). On a Require-verified-emails event the album admits only
            -- its host (owner -> full) or a viewer whose email is CONFIRMED; everyone else stands at the
            -- teaser, which never renders the Guests list, so they learn nothing of it here either. An
            -- anonymous viewer has no uid, so neither arm can pass for them: the gate implies the old
            -- "a signed-in viewer" clause, which left with the legacy flag it was written on (the
            -- identity contract, 2026-09-23).
            -- The EXISTS names no event column, so it is planned once per call, not once per event.
            and (
              not e.require_verified_email
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from auth.users u
                 where u.id = (select auth.uid())
                   and u.email_confirmed_at is not null
              )
            )
            -- ★ AND THE ALBUM'S UPLOAD DOOR (guest by upload, 2026-09-23; Will's "Follow the album"). On
            -- a Require-an-upload-to-view event whose uploads are open, the album holds every viewer at
            -- the teaser until an upload of theirs counts, so this line shows only to the host and to a
            -- signed-in viewer whose own guest row at this event carries an upload they did not remove
            -- themselves (get_upload_gate's rule). Uploads closed means the album's gate fails open, and
            -- so does this clause. An anonymous viewer has no `auth.uid()`, so the EXISTS finds nothing
            -- and the line stays hidden.
            and (
              not e.require_upload_to_view
              or not e.accepting_uploads
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from public.guests vg
                  join public.media vm on vm.guest_id = vg.id
                 where vg.event_id = e.id
                   and vm.event_id = e.id
                   and vg.user_id = (select auth.uid())
                   and not (vm.status = 'removed' and vm.removed_by_uploader)
              )
            )
            -- ★ THE SNEAKY BLOCK (20260928120000), both ways: a person the event blocked is on no list
            -- of it (their line goes, even with a photograph the host restored), and a viewer it blocked
            -- is withheld the album, so the reverse surface withholds its membership too (QA #36).
            and not public.event_block_holds_account(e.id, p.id)
            and (e.host_id = (select auth.uid())
                 or not public.event_block_holds_account(e.id, (select auth.uid())))
            and e.host_id <> p.id
            and exists (
              select 1
              from public.guests g
              join public.media m on m.guest_id = g.id and m.status = 'approved'
              where g.event_id = e.id and g.user_id = p.id
                -- THE BELT (2026-09-22): only a PROVED identity attends in public. A row at level 1
                -- (a typed name) or level 2 (a typed, unproved address) never appears here, so an
                -- impersonator's uploads can never be published under someone's profile.
                and g.verified_at is not null
                -- ★ A SEALED SHOT ATTENDS NOTHING YET (20261002200000): a guest of an album waiting on its develop
                -- joins its lists at develop, not before (the one predicate; the host of the event exempt).
                and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
            )
            -- NOTHING UNTIL CHOSEN (2026-09-22): the line appears only once its owner has put the event
            -- in their opt-in set. A choice survives the guest's last removal: the approved upload
            -- above hides the line meanwhile, and a later upload shows it again unasked.
            and exists (
              select 1 from public.profile_shown_events s
              where s.user_id = p.id and s.event_id = e.id
            )
        ), '[]'::jsonb)
      ) as payload
    from public.profiles p
    where p.slug is not null
      and p.slug = lower(trim(p_slug))
  )
  select p.payload || jsonb_build_object(
    'private_event_count',
    case
      -- The page shows nothing: no hosted card and no attended line for this viewer.
      when (p.payload -> 'hosted_events') = '[]'::jsonb
       and (p.payload -> 'attended_events') = '[]'::jsonb
      then (
        -- The attended arm's predicate, word for word, with only the owner's choice inverted.
        select count(*)
          from public.events e
          where e.deleted_at is null
            and e.visibility = 'open'
            and (
              not e.require_verified_email
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from auth.users u
                 where u.id = (select auth.uid())
                   and u.email_confirmed_at is not null
              )
            )
            and (
              not e.require_upload_to_view
              or not e.accepting_uploads
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from public.guests vg
                  join public.media vm on vm.guest_id = vg.id
                 where vg.event_id = e.id
                   and vm.event_id = e.id
                   and vg.user_id = (select auth.uid())
                   and not (vm.status = 'removed' and vm.removed_by_uploader)
              )
            )
            and not public.event_block_holds_account(e.id, p.id)
            and (e.host_id = (select auth.uid())
                 or not public.event_block_holds_account(e.id, (select auth.uid())))
            and e.host_id <> p.id
            and exists (
              select 1
              from public.guests g
              join public.media m on m.guest_id = g.id and m.status = 'approved'
              where g.event_id = e.id and g.user_id = p.id
                and g.verified_at is not null
                -- ★ A SEALED SHOT ATTENDS NOTHING YET (20261002200000): a guest of an album waiting on its develop
                -- joins its lists at develop, not before (the one predicate; the host of the event exempt).
                and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
            )
            and not exists (
              select 1 from public.profile_shown_events s
              where s.user_id = p.id and s.event_id = e.id
            )
      )
    end
  )
  from page p;
$$;

-- =============================================================================================
-- 5. Grants. get_event_by_qr_token was dropped and created, so its whole ACL is restated: PUBLIC revoked by name, the
-- three roles that call it (its owner the fourth holder). get_public_profile keeps its ACL (CREATE OR REPLACE),
-- restated as its file states it.
-- =============================================================================================
revoke all on function public.get_event_by_qr_token(text) from public;
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved before applying, each run ONE execute_sql call of `begin;`, the block below and
-- `rollback;` (GREEN: this file's statements between `begin;` and the block; RED: the block alone, where every step
-- after the fixtures fails on the missing column). Fixtures: a Pro host with a page, an open, a password and a private
-- event, and a confirmed guest with a page and an approved upload at the open one; each step traps its own failure
-- into `proof`, and the last statement reads it.
--
-- -- THE END DATE'S CHECK: fresh fixtures (a Pro host with a page, an open, a password and a private event, a confirmed
-- -- guest with a page and an approved upload at the open one), then the column, its CHECK, its grants, the two reads
-- -- and the lifecycle, each step trapping its own failure into `proof`; the last statement reads it.
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, token text) on commit drop;
--
-- do $$
-- declare
--   v_host uuid := 'ed0e0000-0000-4000-8000-000000000001';
--   v_g1 uuid := 'ed0e0000-0000-4000-8000-000000000002';
--   v_open uuid := 'ed0e0000-0000-4000-8000-0000000000e1';
--   v_pw uuid := 'ed0e0000-0000-4000-8000-0000000000e2';
--   v_priv uuid := 'ed0e0000-0000-4000-8000-0000000000e3';
--   v_guest uuid := 'ed0e0000-0000-4000-8000-0000000000a1';
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values
--     (v_host, 'ed-host@check.invalid', now()),
--     (v_g1, 'ed-g1@check.invalid', now());
--   update public.profiles set tier = 'pro', display_name = 'Check Host', slug = 'ed-check-host' where id = v_host;
--   update public.profiles set display_name = 'Guest One', slug = 'ed-check-g1' where id = v_g1;
--   insert into public.events (id, host_id, name, visibility, require_verified_email, accepting_uploads, moderation_mode,
--                              display_in_profile, event_date)
--   values (v_open, v_host, 'Dates check open', 'open', false, true, 'live', true, '2026-10-03');
--   insert into public.events (id, host_id, name, visibility, event_password_hash, event_date)
--   values (v_pw, v_host, 'Dates check password', 'password', 'x', '2026-10-03');
--   insert into public.events (id, host_id, name, visibility, event_date)
--   values (v_priv, v_host, 'Dates check private', 'private', '2026-10-03');
--   insert into fx values ('host', v_host, null), ('g1', v_g1, null);
--   insert into fx select 'open', e.id, e.qr_token from public.events e where e.id = v_open;
--   insert into fx select 'pw', e.id, e.qr_token from public.events e where e.id = v_pw;
--   insert into fx select 'priv', e.id, e.qr_token from public.events e where e.id = v_priv;
--   insert into public.guests (id, event_id, session_token, user_id, display_name, verified_at, email)
--   values (v_guest, v_open, repeat('e1', 32), v_g1, 'Guest One', now(), 'ed-g1@check.invalid');
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (v_open, v_guest, 'photo', 'events/' || v_open || '/check.jpg', 1000, 'approved');
--   insert into public.profile_shown_events (user_id, event_id) values (v_g1, v_open);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, 'a host, three events, a guest with an upload');
-- exception when others then insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- ── 1. the column: a date, nullable, under its CHECK, with its words ──
-- do $$
-- declare t text; c text;
-- begin
--   select data_type || ':' || is_nullable into t from information_schema.columns
--    where table_schema = 'public' and table_name = 'events' and column_name = 'event_end_date';
--   if t is distinct from 'date:YES' then raise exception 'column %', coalesce(t, 'missing'); end if;
--   select pg_get_constraintdef(oid) into c from pg_constraint
--    where conrelid = 'public.events'::regclass and conname = 'events_end_date_on_or_after';
--   if c is distinct from 'CHECK (((event_end_date IS NULL) OR ((event_date IS NOT NULL) AND (event_end_date >= event_date))))' then
--     raise exception 'check %', coalesce(c, 'missing');
--   end if;
--   if col_description('public.events'::regclass,
--        (select attnum from pg_attribute where attrelid = 'public.events'::regclass and attname = 'event_end_date'))
--      not like '%never%end, lock, archive or purge%' then
--     raise exception 'comment';
--   end if;
--   insert into proof (step, ok, detail) values ('1 the column, its CHECK and its words', true, c);
-- exception when others then insert into proof (step, ok, detail) values ('1 the column, its CHECK and its words', false, sqlerrm);
-- end $$;
--
-- -- ── 2. the CHECK: a range, one day, and every shape it refuses, in its own name ──
-- do $$
-- declare v uuid; bad text := ''; d date; ed date;
-- begin
--   select id into v from fx where k = 'open';
--   update public.events set event_date = '2026-10-03', event_end_date = '2026-10-05' where id = v;
--   update public.events set event_end_date = '2026-10-03' where id = v; -- one day, said twice, still legal
--   update public.events set event_date = '2026-10-30', event_end_date = '2026-11-02' where id = v; -- across a month
--   update public.events set event_date = '2026-12-30', event_end_date = '2027-01-02' where id = v; -- across a year
--   begin
--     update public.events set event_end_date = '2026-12-29' where id = v;
--     bad := bad || ' end-before-start';
--   exception when check_violation then
--     if sqlerrm not like '%events_end_date_on_or_after%' then bad := bad || ' words:' || sqlerrm; end if;
--   end;
--   begin
--     update public.events set event_date = null where id = v;
--     bad := bad || ' start-cleared-under-an-end';
--   exception when check_violation then null;
--   end;
--   begin
--     update public.events set event_date = null, event_end_date = null where id = v;
--     update public.events set event_end_date = '2026-10-05' where id = v;
--     bad := bad || ' end-without-start';
--   exception when check_violation then null;
--   end;
--   update public.events set event_date = null, event_end_date = null where id = v; -- both cleared together
--   select event_date, event_end_date into d, ed from public.events where id = v;
--   if d is not null or ed is not null then bad := bad || ' clear-both'; end if;
--   if bad <> '' then raise exception 'check:%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 the CHECK: ranges in, the three wrong shapes out', true,
--     'a range, one day, a month and a year crossed; end before start, a start cleared under an end, an end alone refused');
-- exception when others then insert into proof (step, ok, detail) values ('2 the CHECK: ranges in, the three wrong shapes out', false, sqlerrm);
-- end $$;
--
-- -- ── 3. the grants: the host writes it as she writes the date (insert and update), anon never ──
-- do $$
-- declare v uuid; v_host uuid; v_g1 uuid; n int; bad text := '';
-- begin
--   select id into v from fx where k = 'open';
--   select id into v_host from fx where k = 'host';
--   select id into v_g1 from fx where k = 'g1';
--   if not has_column_privilege('authenticated', 'public.events', 'event_end_date', 'INSERT') then bad := bad || ' auth-insert'; end if;
--   if not has_column_privilege('authenticated', 'public.events', 'event_end_date', 'UPDATE') then bad := bad || ' auth-update'; end if;
--   if not has_column_privilege('authenticated', 'public.events', 'event_end_date', 'SELECT') then bad := bad || ' auth-select'; end if;
--   if has_column_privilege('anon', 'public.events', 'event_end_date', 'SELECT')
--      or has_column_privilege('anon', 'public.events', 'event_end_date', 'UPDATE')
--      or has_column_privilege('anon', 'public.events', 'event_end_date', 'INSERT') then bad := bad || ' anon-holds'; end if;
--   if has_column_privilege('authenticated', 'public.events', 'event_end_date', 'UPDATE')
--      is distinct from has_column_privilege('authenticated', 'public.events', 'event_date', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.events', 'event_end_date', 'INSERT')
--      is distinct from has_column_privilege('authenticated', 'public.events', 'event_date', 'INSERT') then
--     bad := bad || ' not-as-the-date';
--   end if;
--
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   update public.events set event_date = '2026-10-03', event_end_date = '2026-10-05' where id = v;
--   get diagnostics n = row_count;
--   if n <> 1 then bad := bad || ' host-update'; end if;
--   insert into public.events (host_id, name, event_date, event_end_date)
--   values (v_host, 'Dates check made with a range', '2026-11-14', '2026-11-15');
--   get diagnostics n = row_count;
--   if n <> 1 then bad := bad || ' host-insert'; end if;
--   reset role;
--
--   -- Another account's session moves nothing on her event: the grant names the column, RLS names the rows.
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_g1::text, true);
--   update public.events set event_end_date = '2026-10-09' where id = v;
--   get diagnostics n = row_count;
--   if n <> 0 then bad := bad || ' cross-tenant-update'; end if;
--   reset role;
--
--   set local role anon;
--   perform set_config('request.jwt.claim.sub', '', true);
--   begin
--     update public.events set event_end_date = '2026-10-06' where id = v;
--     bad := bad || ' anon-update';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if (select event_end_date from public.events where id = v) is distinct from '2026-10-05'::date then
--     bad := bad || ' moved-by-another';
--   end if;
--   if bad <> '' then raise exception 'grants:%', bad; end if;
--   insert into proof (step, ok, detail) values ('3 the grants: the date''s own, anon none', true,
--     'authenticated insert, update, select; her update and her insert land; another account moves 0 rows; anon 42501');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('3 the grants: the date''s own, anon none', false, sqlerrm);
-- end $$;
--
-- -- ── 4. the album's read: the end date LAST, redacted with the date, the owner's whole ──
-- do $$
-- declare v_host uuid; t record; bad text := ''; acl text; tok_open text; tok_pw text; tok_priv text;
-- begin
--   select id into v_host from fx where k = 'host';
--   -- The tokens are read before any role switch: the client roles cannot read a temp table.
--   select token into tok_open from fx where k = 'open';
--   select token into tok_pw from fx where k = 'pw';
--   select token into tok_priv from fx where k = 'priv';
--   update public.events set event_date = '2026-10-03', event_end_date = '2026-10-05' where id in
--     (select id from fx where k in ('open', 'pw', 'priv'));
--   if pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure)
--      not like '%capture text, roll_size integer, event_end_date date)' then
--     raise exception 'result %', pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure);
--   end if;
--
--   set local role anon;
--   perform set_config('request.jwt.claim.sub', '', true);
--   select * into t from public.get_event_by_qr_token(tok_open);
--   if t.event_date is distinct from '2026-10-03'::date or t.event_end_date is distinct from '2026-10-05'::date then
--     bad := bad || ' open:' || coalesce(t.event_end_date::text, 'null');
--   end if;
--   select * into t from public.get_event_by_qr_token(tok_pw);
--   if t.event_date is not null or t.event_end_date is not null then bad := bad || ' password-leaks'; end if;
--   select * into t from public.get_event_by_qr_token(tok_priv);
--   if t.event_date is not null or t.event_end_date is not null then bad := bad || ' private-leaks'; end if;
--   reset role;
--
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   select * into t from public.get_event_by_qr_token(tok_pw);
--   if t.event_end_date is distinct from '2026-10-05'::date then bad := bad || ' owner-redacted'; end if;
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--
--   select string_agg(g, ',' order by g) into acl
--     from (select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as g
--             from pg_proc p, aclexplode(p.proacl) a
--            where p.oid = 'public.get_event_by_qr_token(text)'::regprocedure and a.privilege_type = 'EXECUTE') holders;
--   if acl is distinct from 'anon,authenticated,postgres,service_role' then bad := bad || ' acl:' || coalesce(acl, 'none'); end if;
--   if bad <> '' then raise exception 'read:%', bad; end if;
--   insert into proof (step, ok, detail) values ('4 get_event_by_qr_token: the end LAST, redacted with the date', true,
--     'open says it, password and private blank it to anon, the owner reads it; ACL ' || acl);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('4 get_event_by_qr_token: the end LAST, redacted with the date', false, sqlerrm);
-- end $$;
--
-- -- ── 5. the profile's cards carry the end beside the date: hosted and attended ──
-- do $$
-- declare v_open uuid; j jsonb; bad text := ''; acl text;
-- begin
--   select id into v_open from fx where k = 'open';
--   set local role anon;
--   perform set_config('request.jwt.claim.sub', '', true);
--   j := public.get_public_profile('ed-check-host') -> 'hosted_events';
--   if not exists (select 1 from jsonb_array_elements(j) x
--                   where (x ->> 'id')::uuid = v_open and x ->> 'event_end_date' = '2026-10-05'
--                     and x ->> 'event_date' = '2026-10-03') then
--     bad := bad || ' hosted:' || coalesce(j::text, 'null');
--   end if;
--   j := public.get_public_profile('ed-check-g1') -> 'attended_events';
--   if not exists (select 1 from jsonb_array_elements(j) x
--                   where (x ->> 'id')::uuid = v_open and x ->> 'event_end_date' = '2026-10-05') then
--     bad := bad || ' attended:' || coalesce(j::text, 'null');
--   end if;
--   reset role;
--   select string_agg(g, ',' order by g) into acl
--     from (select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as g
--             from pg_proc p, aclexplode(p.proacl) a
--            where p.oid = 'public.get_public_profile(text)'::regprocedure and a.privilege_type = 'EXECUTE') holders;
--   if acl is distinct from 'anon,authenticated,postgres,service_role' then bad := bad || ' acl:' || coalesce(acl, 'none'); end if;
--   if bad <> '' then raise exception 'profile:%', bad; end if;
--   insert into proof (step, ok, detail) values ('5 get_public_profile: both cards carry the end', true,
--     'hosted and attended, to anon; ACL ' || acl);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('5 get_public_profile: both cards carry the end', false, sqlerrm);
-- end $$;
--
-- -- ── 6. ★ an end date never touches the lifecycle: no purge, no lock, nothing reads it but the two reads ──
-- do $$
-- declare v uuid; before jsonb; after jsonb; t record; bad text := ''; readers text; tok text;
-- begin
--   select id, token into v, tok from fx where k = 'open';
--   select jsonb_build_object('deleted_at', deleted_at, 'purge_at', purge_at, 'accepting_uploads', accepting_uploads,
--            'visibility', visibility, 'moderation_mode', moderation_mode, 'develops_at', develops_at,
--            'capture', capture, 'sealed_from', sealed_from, 'display_in_profile', display_in_profile)
--     into before from public.events where id = v;
--   -- A range long over, and one ending today: neither ends, locks, archives nor purges anything.
--   update public.events set event_date = '2020-01-01', event_end_date = '2020-01-03' where id = v;
--   update public.events set event_date = current_date - 2, event_end_date = current_date where id = v;
--   select jsonb_build_object('deleted_at', deleted_at, 'purge_at', purge_at, 'accepting_uploads', accepting_uploads,
--            'visibility', visibility, 'moderation_mode', moderation_mode, 'develops_at', develops_at,
--            'capture', capture, 'sealed_from', sealed_from, 'display_in_profile', display_in_profile)
--     into after from public.events where id = v;
--   if before is distinct from after then bad := bad || ' moved:' || before::text || '->' || after::text; end if;
--   set local role anon;
--   select * into t from public.get_event_by_qr_token(tok);
--   reset role;
--   if t.id is distinct from v or not t.accepting_uploads then bad := bad || ' album-closed'; end if;
--   if (select count(*) from public.media where event_id = v and status = 'approved') <> 1 then bad := bad || ' media-moved'; end if;
--   -- Nothing else in the catalog names the column: no function but the two reads, no trigger, no policy.
--   select string_agg(p.proname, ',' order by p.proname) into readers
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.prosrc like '%event_end_date%';
--   if readers is distinct from 'get_event_by_qr_token,get_public_profile' then bad := bad || ' readers:' || coalesce(readers, 'none'); end if;
--   if exists (select 1 from pg_policies where qual like '%event_end_date%' or with_check like '%event_end_date%') then
--     bad := bad || ' policy';
--   end if;
--   if exists (select 1 from pg_trigger where not tgisinternal and pg_get_triggerdef(oid) like '%event_end_date%') then
--     bad := bad || ' trigger';
--   end if;
--   if bad <> '' then raise exception 'lifecycle:%', bad; end if;
--   insert into proof (step, ok, detail) values ('6 the lifecycle: untouched by any end date', true,
--     'deleted_at, purge_at, uploads, door, review, develop, capture and listing unchanged; the album open; read only by the two reads');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('6 the lifecycle: untouched by any end date', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
