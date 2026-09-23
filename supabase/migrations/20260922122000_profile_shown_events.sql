-- The guest identity round, wave 0 — a profile publishes NOTHING until its owner chooses (Will,
-- 2026-09-22, rulings.md "guest identity: name only, unconfirmed email, verified account"; his
-- answer at the question was "Nothing until chosen (Recommended)"). Verbatim: "even for confirmed
-- accounts, they must visit their profile page to set that up; we don't simply start adding all of
-- their uploads there publicly until they decide what goes up."
--
-- ★ THE INVERSION. `profile_hidden_events` is an OPT-OUT: every attended event is public until its
-- guest hides it. The ruling makes the default the other way round, so the attended arm of
-- `get_public_profile` now reads a new OPT-IN table, `profile_shown_events`, whose shape, policies
-- and grants are `profile_hidden_events`'s exactly — one table swapped for its mirror image, not a
-- new mechanism to reason about.
--
-- NO BACKFILL, deliberately. The product has zero real users, so "nothing until chosen" applies from
-- the first day; a backfill that copied today's attendance into the new table would publish exactly
-- what the ruling says must stay private until someone turns it on.
--
-- `profile_hidden_events` is NOT DROPPED here. The deployed build still reads and writes it (the
-- profile's own privacy control), and this migration lands hours before wave 1 exists; dropping it
-- now would 500 that control on production. A later migration retires it once nothing calls it, and
-- that change is on the ROADMAP.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) diff the replaced `get_public_profile` body
-- against live `pg_get_functiondef` — it is carried verbatim from 20260919140000 and changed ONLY
-- where a comment says so; (2) apply verbatim; (3) get_advisors; (4) run the rolled-back check at the
-- foot; (5) regenerate src/lib/db/types.ts.
--
-- EXPECTED ADVISOR DELTA: `get_public_profile` stays one of the FIVE anon 0028 RPCs (the grant is
-- re-stated below), and 0029 is untouched. NO new rls_enabled_no_policy INFO row: the new table
-- ships with RLS and all three owner policies. No new function, so no function_search_path_mutable.

-- =============================================================================================
-- 1. profile_shown_events — the owner's opt-in, mirroring profile_hidden_events exactly.
-- =============================================================================================
-- Shows ONE attended event on MY public profile. Owner-only RLS with direct writes and no RPC: as
-- with the table it mirrors, there is no cross-tenant read-back or side effect to protect (a row for
-- an event you never attended is a harmless no-op that the attended arm's EXISTS test never
-- reaches), so a raw owner insert is safe and an RPC would be ceremony.
create table public.profile_shown_events (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- The event-deletion cascade + admin "who shows this event" reads.
create index profile_shown_events_event_id_idx on public.profile_shown_events (event_id);

alter table public.profile_shown_events enable row level security;

revoke all on public.profile_shown_events from anon, authenticated;
grant select, delete on public.profile_shown_events to authenticated;
grant insert (user_id, event_id) on public.profile_shown_events to authenticated;

create policy profile_shown_events_select_own on public.profile_shown_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profile_shown_events_insert_own on public.profile_shown_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy profile_shown_events_delete_own on public.profile_shown_events
  for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.profile_shown_events is
  'The guest-side profile OPT-IN (the guest identity round, 2026-09-22): a public profile publishes an attended event only when its owner has put a row here. The inverse of profile_hidden_events, which it replaces in get_public_profile''s attended arm; owner-only RLS, no backfill, because a profile publishes nothing until chosen.';

-- NOTE (PGRST201 landmine, database-security.md): this is one more profiles<->events junction beside
-- saved_events and profile_hidden_events. Every existing embed between these tables is FK-PINNED and
-- the data-layer reads join in app code via explicit id lists, so no bare embed is exposed to the new
-- ambiguity. Keep pinning any future events<->profiles embed.

-- =============================================================================================
-- 2. get_public_profile — the attended arm becomes an opt-in, with a verified belt.
-- =============================================================================================
-- Body carried VERBATIM from 20260919140000 (which itself restored the July gates after the bio
-- migration dropped one) with exactly two deltas, both in the attended arm:
--   * the `not exists (profile_hidden_events)` opt-OUT becomes an `exists (profile_shown_events)`
--     opt-IN;
--   * `and g.verified_at is not null` — the belt. Attendance on a public profile is a claim about a
--     PERSON, so only a row whose email was actually proved may make it. A name-only or
--     pending-email row is level 1 or 2 and publishes nothing, even if its event is turned on.
-- The QA #36 clause still names `allow_anonymous_uploads`, kept truthful by the
-- events_sync_verified_email_flags trigger: whoever drops that legacy column re-points this clause in
-- the same change (a Vitest guard pins the pair).
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select jsonb_build_object(
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
               'visibility', e.visibility,
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
               'event_date', e.event_date
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.deleted_at is null
        and e.show_guest_list
        -- open-only: gated (password/private) events never leak name/date or
        -- attendance to anonymous profile viewers.
        and e.visibility = 'open'
        -- QA #36: open BUT account-required resolves to `teaser` for an anonymous viewer, and the
        -- album hides its Guests section below `full`. Mirror that here so this reverse surface
        -- never discloses membership the album itself withholds from the same viewer.
        and (e.allow_anonymous_uploads or (select auth.uid()) is not null)
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
        )
        -- NOTHING UNTIL CHOSEN (2026-09-22): the opt-OUT becomes an opt-IN. This replaced a
        -- `not exists (... profile_hidden_events ...)` clause; that table is still read and written
        -- by the deployed build, so it survives until a later migration retires it.
        and exists (
          select 1 from public.profile_shown_events s
          where s.user_id = p.id and s.event_id = e.id
        )
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.slug is not null
    and p.slug = lower(trim(p_slug));
$$;

-- Re-stated, not changed: `create or replace` preserves the ACL, and these two lines are what a
-- future drop-and-recreate would otherwise lose (the MCP anon default-grant landmine cuts both ways).
-- get_public_profile is one of the five accepted 0028 anon reads: /u/[slug] is logged-out visible.
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- 3. ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER the apply; nothing persists,
--    the block ends in a deliberate RAISE). Rides EXISTING rows. Expect the last line to be
--    `ROLLED BACK — every profile-shown contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_uid uuid;
--   v_slug text;
--   v_event uuid;
--   v_guest uuid;
--   v_other uuid;
--   v_profile jsonb;
-- begin
--   -- A profile with a slug that has an attended, open, guest-list event with approved media.
--   select p.id, p.slug, e.id, g.id
--     into v_uid, v_slug, v_event, v_guest
--   from public.profiles p
--   join public.guests g on g.user_id = p.id
--   join public.events e on e.id = g.event_id and e.deleted_at is null and e.host_id <> p.id
--   join public.media m on m.guest_id = g.id and m.status = 'approved'
--   where p.slug is not null
--   limit 1;
--
--   if v_uid is null then
--     -- No natural attendee: build one out of existing rows rather than creating an event
--     -- (enforce_event_limit would trip inside the txn).
--     select p.id, p.slug into v_uid, v_slug
--       from public.profiles p where p.slug is not null limit 1;
--     if v_uid is null then raise exception 'FAIL: no profile with a slug to ride'; end if;
--     select g.id, g.event_id into v_guest, v_event
--       from public.guests g
--       join public.events e on e.id = g.event_id and e.deleted_at is null and e.host_id <> v_uid
--       join public.media m on m.guest_id = g.id and m.status = 'approved'
--      limit 1;
--     if v_guest is null then raise exception 'FAIL: no guest row with approved media to ride'; end if;
--     update public.guests set user_id = v_uid where id = v_guest;
--   end if;
--
--   update public.events
--      set show_guest_list = true, visibility = 'open',
--          allow_anonymous_uploads = true, deleted_at = null
--    where id = v_event;
--   update public.guests set verified_at = now() where id = v_guest;
--   delete from public.profile_shown_events where user_id = v_uid and event_id = v_event;
--
--   -- ── 1. an UNSHOWN event is invisible, which is the new default ─────────────────────────────
--   v_profile := public.get_public_profile(v_slug);
--   if v_profile->'attended_events' @> jsonb_build_array(jsonb_build_object('id', v_event)) then
--     raise exception 'FAIL: an attended event published without being chosen';
--   end if;
--   raise notice 'OK: nothing until chosen — an unshown event is absent';
--
--   -- ── 2. a SHOWN event lists ─────────────────────────────────────────────────────────────────
--   insert into public.profile_shown_events (user_id, event_id) values (v_uid, v_event);
--   v_profile := public.get_public_profile(v_slug);
--   if not (v_profile->'attended_events' @> jsonb_build_array(jsonb_build_object('id', v_event))) then
--     raise exception 'FAIL: a chosen event did not publish';
--   end if;
--   raise notice 'OK: a chosen event publishes';
--
--   -- ── 3. the verified belt hides a row that was never proved, even when chosen ───────────────
--   update public.guests set verified_at = null where id = v_guest;
--   v_profile := public.get_public_profile(v_slug);
--   if v_profile->'attended_events' @> jsonb_build_array(jsonb_build_object('id', v_event)) then
--     raise exception 'FAIL: an unverified guest row published on a public profile';
--   end if;
--   raise notice 'OK: an unverified row publishes nothing, chosen or not';
--   update public.guests set verified_at = now() where id = v_guest;
--
--   -- ── 4. the attended arm still hands out no capability link ─────────────────────────────────
--   if v_profile::text like '%qr_token%' then
--     raise exception 'FAIL: the profile payload carries a capability link';
--   end if;
--   raise notice 'OK: no qr_token rides the attended arm';
--
--   -- ── 5. owner-only RLS: insert and delete mine, never another''s ────────────────────────────
--   select p.id into v_other from public.profiles p where p.id <> v_uid limit 1;
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--
--   if not exists (select 1 from public.profile_shown_events
--                   where user_id = v_uid and event_id = v_event) then
--     raise exception 'FAIL: the owner cannot read their own shown row';
--   end if;
--
--   if v_other is not null then
--     begin
--       insert into public.profile_shown_events (user_id, event_id) values (v_other, v_event);
--       raise exception 'FAIL: a row was inserted for another account';
--     exception when insufficient_privilege then
--       raise notice 'OK: the insert policy refuses another account''s row';
--     end;
--   end if;
--
--   delete from public.profile_shown_events where user_id = v_uid and event_id = v_event;
--   if exists (select 1 from public.profile_shown_events
--               where user_id = v_uid and event_id = v_event) then
--     raise exception 'FAIL: the owner cannot delete their own shown row';
--   end if;
--   raise notice 'OK: the owner reads, inserts and deletes only their own rows';
--
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--
--   -- ── 6. the three policies and the RLS flag exist ───────────────────────────────────────────
--   if (select count(*) from pg_policies
--        where schemaname = 'public' and tablename = 'profile_shown_events') <> 3 then
--     raise exception 'FAIL: profile_shown_events does not carry exactly three policies';
--   end if;
--   if not (select relrowsecurity from pg_class where oid = 'public.profile_shown_events'::regclass) then
--     raise exception 'FAIL: RLS is not enabled on profile_shown_events';
--   end if;
--   if has_table_privilege('anon', 'public.profile_shown_events', 'select') then
--     raise exception 'FAIL: anon can read profile_shown_events';
--   end if;
--   raise notice 'OK: RLS on, three owner policies, anon locked out';
--
--   raise exception 'ROLLED BACK — every profile-shown contract held';
-- end $$;
