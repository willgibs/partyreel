-- =============================================================================================
-- NO DOOR'S OPENING ADMITS A BLOCKED ASK, AND THE DOOR'S ASKS ARE READ ONCE (lane `crumbs-29`).
--
-- The finding (build 30's red-team, redteam-28 ledger 18:48Z and 19:06Z, LOW): at an album where the host
-- lets each person in, partyr33l asked and the host declined her. A decline is a block on her account that
-- keeps her ask waiting, for Undo. The host then turned the album Public, and events_door_opened
-- (20260929120000) let in EVERY waiting row: her ask read `in` (row b3df7603) while the block held her out.
-- Back at "You let each person in", Let back in read her as someone who was in ("They'll be able to open ...
-- and add photos again", then "Partyreel can join again."), and once let back in she walked straight into an
-- album whose host had never let her in.
--
-- ★ THE RULE: A DOOR LETS IN ONLY THE ASKS NO BLOCK HOLDS. A block keeps its ask waiting through every move of
-- the door; the host's own answer (Let back in) is what lifts it, and the door as it stands then decides:
--   * at a door the host answers (letting each person in, the invite list, closed, Only me) her ask stands
--     and she is back at the door, which is where Let back in says she lands;
--   * at an invite list that names her, the list lets her in (as since 20260929220000);
--   * at a Public door she comes straight in, as the door would have let her in had the block never been
--     there: Let back in now does at Public what the list does at the list, since the door's opening has
--     already happened and never will again for her.
--
-- ★ AND THE DOOR'S ASKS ARE READ ONCE (ROADMAP, from `crumbs-23`). event_door_admit_listed and its read-only
-- twin event_door_waiting_listed each spelled "a waiting account the list names, no block on the account or the
-- row" (20260929233000's proof held the two spellings equal). One set-returning helper, event_door_asks, now
-- answers the asks a door may let in (every waiting row of a live event no block holds, the account's or the
-- row's) with whether the invite list names each, and every door act that lets asks in or counts them reads it:
--   * events_door_opened      the door turning Public: every ask (the fix above);
--   * set_event_door          its count of what turning Public lets in (now exactly who the trigger lets in);
--   * event_door_admit_listed the list: the asks it names;
--   * event_door_waiting_listed  its read-only twin: those asks as people, never the host;
--   * let_back_in             the block lifted: at Public every ask, at the list the ones it names.
-- The one other body that lets anyone in is the host's own answer, let_in_at_door, which refuses a held row.
--
-- WHAT THIS FILE DOES:
--   1. event_door_asks(uuid)          NEW. SECURITY INVOKER, stable, empty search_path, RETURNS TABLE
--                                     (guest_id, user_id, listed). Its EXECUTE is the owner's alone: every
--                                     caller is a SECURITY DEFINER body (or one run inside one), so no role
--                                     PostgREST serves can call it, which is why it pages nothing
--                                     (row-cap-sql.test.ts's INTERNAL list says so).
--   2. event_door_admit_listed        carried from 20260929220000 but for its update, which reads the helper's
--                                     listed asks. INVOKER, the service role's, as before.
--   3. event_door_waiting_listed      carried from 20260929233000 but for its count, the helper's listed asks
--                                     as people, the host never among them. DEFINER, the service role's.
--   4. events_door_opened             carried from 20260929120000 but for its update, which reads the helper:
--                                     a blocked ask stays waiting. The trigger itself is untouched.
--   5. set_event_door                 carried from 20260929220000 but for its count of what turning Public lets
--                                     in, read from the helper. Authenticated only, as before.
--   6. let_back_in                    carried from 20260929220000 but for the Public door's admission after
--                                     the block goes, counted into `admitted`. Authenticated only, as before.
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: every signature, RETURNS, answer key and grant but the new helper's is
-- today's, so milestone 31's build and this lane's run against either side of the apply. Before it a declined
-- newcomer is let in by a Public trip, as today; after it her ask waits for the host.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-30, each live hash
--       reproduced from its file's text between the dollar quotes), and the helper does not exist yet:
--         event_door_admit_listed(uuid)    e8e79c049a34182c062d6ba4524c79bd  (20260929220000)
--         event_door_waiting_listed(uuid)  6a33e98ae4637424f7f2a2d5aef257b3  (20260929233000)
--         events_door_opened()             f5a840313ef365e0ee4a44f84fb5c710  (20260929120000)
--         let_back_in(uuid,boolean)        73969ff70a3fd220593ece6b55a32da3  (20260929220000)
--         set_event_door(uuid,text)        1ecc9092b9485179f7568e8fe468fb86  (20260929220000)
--       select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public'
--          and p.proname in ('event_door_asks', 'event_door_admit_listed', 'event_door_waiting_listed',
--                            'events_door_opened', 'let_back_in', 'set_event_door')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim. The query
--       in (1) then reads each body as this file writes it (the hashes are in the proof's last rows), the five
--       ACLs exactly as before and the helper's {postgres=X/postgres}.
--   (3) get_advisors (security). EXPECTED DELTA: none. The helper is SECURITY INVOKER and no client role, nor
--       the service role, holds its EXECUTE, so it is in neither lint 0028 nor 0029; the five keep their place.
--   (4) Regenerate src/lib/db/types.ts: event_door_asks joins the Functions (nothing calls it from TypeScript).
-- =============================================================================================

-- =============================================================================================
-- 1. The asks a door may let in, read once.
-- =============================================================================================
-- ★ EVERY WAITING ROW OF A LIVE EVENT THAT NO BLOCK HOLDS, the account's (by its id or the address auth.users
-- confirmed for it) or the row's, with whether the invite list names its account (the door's own match: the
-- confirmed address, never the row's copy of it). A block keeps an ask waiting whatever the door does: a
-- decline is a block, and only Let back in lifts one. SECURITY INVOKER, run by its callers' definer rights (the
-- list's match reads auth.users); the owner's EXECUTE alone, since a set nobody but a SQL body reads can never
-- meet PostgREST's cut.
create function public.event_door_asks(p_event_id uuid)
returns table (guest_id uuid, user_id uuid, listed boolean)
language sql
stable
set search_path = ''
as $$
  select g.id,
         g.user_id,
         (g.user_id is not null and public.event_door_lists_account(p_event_id, g.user_id))
    from public.guests g
    join public.events e on e.id = g.event_id
   where g.event_id = p_event_id
     and e.deleted_at is null
     and g.admission = 'waiting'
     and not public.event_block_holds_account(p_event_id, g.user_id)
     and not public.event_block_holds_row(g);
$$;

revoke all on function public.event_door_asks(uuid) from public, anon, authenticated, service_role;

comment on function public.event_door_asks(uuid) is
  'The asks a door may let in: every waiting row of a live event that no block holds (the account''s or the row''s), with whether the invite list names its account. The one reading of the door''s asks: events_door_opened, set_event_door, event_door_admit_listed, event_door_waiting_listed and let_back_in read it. The owner''s EXECUTE alone: only SQL bodies read it.';

-- =============================================================================================
-- 2. event_door_admit_listed: the list lets in the asks it names.
-- =============================================================================================
-- Carried from 20260929220000 verbatim but for the update, which reads the helper.
create or replace function public.event_door_admit_listed(p_event_id uuid)
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_admitted integer := 0;
begin
  -- Only while the list is the door: anywhere else a listed address is only a list.
  perform 1 from public.events e
   where e.id = p_event_id
     and e.deleted_at is null
     and e.visibility = 'private'
     and e.gate = 'invite';
  if not found then
    return 0;
  end if;

  -- ★ THE DOOR'S ASKS, READ ONCE (20260930130000): the asks no block holds whose account the list names.
  with admitted as (
    update public.guests g
       set admission = 'in'
      from public.event_door_asks(p_event_id) a
     where g.id = a.guest_id
       and a.listed
    returning g.user_id
  )
  select count(distinct a.user_id)::integer into v_admitted from admitted a;

  return v_admitted;
end;
$$;

revoke all on function public.event_door_admit_listed(uuid) from public, anon, authenticated;
grant execute on function public.event_door_admit_listed(uuid) to service_role;

comment on function public.event_door_admit_listed(uuid) is
  'While an event''s door is its invite list, lets in every ask the list names (event_door_asks: the account''s confirmed address listed, no block on the account or the row), every row of an account at once. Answers the people let in. Called by add_event_invites, set_event_door and let_back_in; no client role runs it.';

-- =============================================================================================
-- 3. event_door_waiting_listed: the same asks, counted before the list is chosen.
-- =============================================================================================
-- Carried from 20260929233000 verbatim but for its body, the helper's listed asks as people. Still SECURITY
-- DEFINER (event_door_counts, an INVOKER read, asks it, and the list's match reads auth.users).
create or replace function public.event_door_waiting_listed(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  -- ★ THE DOOR'S ASKS, READ ONCE (20260930130000): exactly the asks event_door_admit_listed lets in, as
  -- people, never the host (who never waits at her own door and is never counted there).
  select count(distinct a.user_id)::integer
    from public.event_door_asks(p_event_id) a
    join public.events e on e.id = p_event_id
   where a.listed
     and a.user_id is distinct from e.host_id;
$$;

revoke all on function public.event_door_waiting_listed(uuid) from public, anon, authenticated;
grant execute on function public.event_door_waiting_listed(uuid) to service_role;

comment on function public.event_door_waiting_listed(uuid) is
  'How many people waiting at an event''s door its invite list names (event_door_asks'' listed asks, an account once, never the host): what choosing the list as the door would let in, read from the same asks event_door_admit_listed lets in. Service role only; asked by event_door_counts.';

-- =============================================================================================
-- 4. events_door_opened: an album that turns Public lets in every ask no block holds.
-- =============================================================================================
-- Carried from 20260929120000 verbatim but for the update, which reads the helper. The trigger that fires it
-- (events_door_opened, after update of visibility on public.events) is untouched: `create or replace` keeps it.
create or replace function public.events_door_opened()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ★ ONLY THE ASKS NO BLOCK HOLDS (20260930130000): a declined newcomer's ask waits for the host's Let back
  -- in, which lands her where it says, never inside an album the host never let her into.
  if new.visibility = 'open' and old.visibility is distinct from 'open' then
    update public.guests g
       set admission = 'in'
      from public.event_door_asks(new.id) a
     where g.id = a.guest_id;
  end if;
  return null;
end;
$$;

revoke all on function public.events_door_opened() from public, anon, authenticated;

comment on function public.events_door_opened() is
  'The door turning Public (after update of visibility on events, every path to open): lets in every ask no block holds (event_door_asks). A blocked ask stays waiting for the host''s Let back in.';

-- =============================================================================================
-- 5. set_event_door: its count of what turning Public lets in, read from the same asks.
-- =============================================================================================
-- Carried from 20260929220000 verbatim but for the count before the move to Public, which reads the helper, so
-- `admitted` is exactly who the trigger lets in.
create or replace function public.set_event_door(p_event_id uuid, p_door text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
  v_visibility public.event_visibility;
  v_gate public.event_gate;
  v_email boolean;
  v_waiting integer := 0;
  v_listed integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if p_door is null or p_door not in ('open', 'password', 'approve', 'invite', 'closed', 'private') then
    return jsonb_build_object('ok', false, 'reason', 'bad_door');
  end if;

  select e.* into v_event from public.events e
   where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null
     for no key update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_door = 'password' and v_event.event_password_hash is null then
    return jsonb_build_object('ok', false, 'reason', 'no_password');
  end if;

  v_visibility := case p_door
                    when 'open' then 'open'::public.event_visibility
                    when 'password' then 'password'::public.event_visibility
                    else 'private'::public.event_visibility
                  end;
  v_gate := case when p_door in ('approve', 'invite', 'closed') then p_door::public.event_gate end;
  v_email := v_event.require_verified_email or p_door in ('approve', 'invite');

  -- ★ WHO TURNING PUBLIC LETS IN, READ FROM THE ASKS THE TRIGGER LETS IN (20260930130000): never an ask a
  -- block holds.
  if v_visibility = 'open' and v_event.visibility <> 'open' then
    select count(distinct coalesce(a.user_id::text, a.guest_id::text))::integer into v_waiting
      from public.event_door_asks(v_event.id) a;
  end if;

  update public.events
     set visibility = v_visibility,
         gate = v_gate,
         require_verified_email = v_email
   where id = v_event.id;

  -- ★ THE LIST BECOMES THE DOOR (20260929220000): everyone waiting whom it already names comes in, as
  -- they now would through it, and is counted for the host as the door opening counts who it lets in.
  if p_door = 'invite' then
    v_listed := public.event_door_admit_listed(v_event.id);
  end if;

  return jsonb_build_object(
    'ok', true,
    'door', p_door,
    'email_held', v_email and not v_event.require_verified_email,
    'admitted', v_waiting + v_listed
  );
end;
$$;

revoke all on function public.set_event_door(uuid, text) from public, anon, authenticated;
grant execute on function public.set_event_door(uuid, text) to authenticated;

comment on function public.set_event_door(uuid, text) is
  'The door''s one writer (event-settings r1): open, password (only onto a password already set), approve, invite, closed or private (Only me). The caller must host the live event (else not_found). A gate that keys on an address turns the email step on with it; turning Public lets in every ask no block holds, and turning to the invite list lets in the asks it names (admitted counts either).';

-- =============================================================================================
-- 6. let_back_in: the block lifts, and the door as it stands lets in the ask it held.
-- =============================================================================================
-- Carried from 20260929220000 verbatim but for the Public door's admission after the block goes, counted into
-- `admitted` beside the list's (only one of the two can be nonzero).
create or replace function public.let_back_in(p_block_id uuid, p_restore boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_block public.event_blocks;
  v_event public.events;
  v_profile public.profiles;
  v_cap bigint;
  v_active bigint;
  v_media public.media;
  v_target public.media_status;
  v_restored integer := 0;
  v_no_room integer := 0;
  v_admitted integer;
  v_opened integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select b.* into v_block
    from public.event_blocks b
    join public.events e on e.id = b.event_id
   where b.id = p_block_id and e.host_id = v_uid and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if coalesce(p_restore, false) and cardinality(v_block.removed_media_ids) > 0 then
    select * into v_event from public.events where id = v_block.event_id;
    select * into v_profile from public.profiles where id = v_event.host_id for update;
    v_cap := coalesce(v_profile.storage_cap_bytes,
                      (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
    v_active := public.host_active_bytes(v_event.host_id);
    for v_media in
      select m.*
        from public.media m
       where m.id = any (v_block.removed_media_ids)
         and m.event_id = v_block.event_id
         and m.status = 'removed'
         and m.removed_at = v_block.created_at
         and not m.removed_by_uploader
         and not m.removed_by_admin
         and m.legal_hold_at is null
       order by m.created_at desc, m.id desc
       for update
    loop
      if v_cap is not null and v_active + v_media.file_size_bytes > v_cap then
        v_no_room := v_no_room + 1;
        continue;
      end if;
      v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
      if v_target = 'removed' then
        v_target := 'approved'::public.media_status;
      end if;
      update public.media set status = v_target, removed_at = null
       where id = v_media.id and status = 'removed';
      v_active := v_active + v_media.file_size_bytes;
      v_restored := v_restored + 1;
    end loop;
  end if;

  delete from public.event_blocks where id = v_block.id;

  -- ★ BACK AT A PUBLIC DOOR (20260930130000): the door let in every ask no block held the moment it turned
  -- Public, and this one waited only on the block. With it gone the Public door lets her in, as it would have
  -- had the block never been there (anywhere else her ask stands, and the host answers it from the door).
  if exists (select 1 from public.events e where e.id = v_block.event_id and e.visibility = 'open') then
    with opened as (
      update public.guests g
         set admission = 'in'
        from public.event_door_asks(v_block.event_id) a
       where g.id = a.guest_id
      returning coalesce(g.user_id::text, g.id::text) as person
    )
    select count(distinct o.person)::integer into v_opened from opened o;
  end if;

  -- ★ BACK AT A LIST THAT NAMES THEM (20260929220000): with the block gone, a waiting newcomer the
  -- invite list names is let in by it, as she would have been the moment it named her.
  v_admitted := public.event_door_admit_listed(v_block.event_id);

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', v_no_room, 'admitted', v_admitted + v_opened);
end;
$$;

revoke all on function public.let_back_in(uuid, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean) to authenticated;

comment on function public.let_back_in(uuid, boolean) is
  'The host lifts a block (event-safety r1): the caller must host its live event (else not_found). With p_restore, the uploads the block itself removed and still in Deleted come back to their prior status, each admitted against the host''s cap like restore_media (no_room counts the rest). The door as it stands then lets in the ask the block held: at a Public door, and at the invite list while it is the door and names her (admitted counts either); anywhere else her ask stands at the door.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An unapplied
-- migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's statements
-- verbatim, the block below (its two temp tables, the DO block and the final read) and `rollback;`. The block
-- traps its own failure into the proof table, so the rollback always runs and the call answers the rows. It
-- rides an EXISTING event (creating one trips enforce_event_limit), made Private with the host letting each
-- person in inside the transaction, and makes its own people: D, declined; W, who waits; L, whom the list
-- names, declined too; U, whom it does not; each asks as a confirmed account. It proves the finding (a Public
-- trip leaves a declined ask waiting), where Let back in lands her at each door, the list's twins read as one,
-- the door's opening counted as it admits, and the grants.
--
-- Held on 2026-09-30 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b), red first: the block alone, on today's bodies, failed its first
-- step with "FAIL: a Public trip let the declined ask in" (and nothing else could run: the helper does not
-- exist there). With this file's statements (afterwards the five bodies read as before, event_door_asks did
-- not exist, no door-* account stood, and the event read open with its 9 guests, no block and no invite:
-- nothing persisted):
--   setup                                         | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b: letting each person in; D declined (block 1e702278-b345-4065-822a-b05d55e5f68b), W waiting
--   1 a Public trip leaves a declined ask waiting | t | Public let W in (admitted 1) and left D waiting, blocked, never was_in
--   2 Let back in at the door                     | t | at approve Let back in admits nobody: D waits, reads waiting, her ticket reads private, and she is At the door
--   3 Let back in at Public                       | t | declined again and Public: admitted 0; Let back in lets her in (admitted 1) and her ticket adds
--   4 the list's twins                            | t | L listed and U listed then declined: the count read 1 and the list let in exactly L (admitted 1), U waited; Let back in let U in by the list
--   5 grants                                      | t | event_door_asks: INVOKER, path pinned, the owner's EXECUTE alone (the service role refused); the five as before
--   hash event_door_admit_listed(uuid)            | t | 46d3cb61925a74a7ca359912a239fa78  {postgres=X/postgres,service_role=X/postgres}
--   hash event_door_asks(uuid)                    | t | b81b4ef3dc80a9e810f2e6d2b059503c  {postgres=X/postgres}
--   hash event_door_waiting_listed(uuid)          | t | 027dd647b91369219d435390d034b8fc  {postgres=X/postgres,service_role=X/postgres}
--   hash events_door_opened()                     | t | ad86942ab7e36d604db2b6a984f18d8a  {postgres=X/postgres,service_role=X/postgres}
--   hash let_back_in(uuid,boolean)                | t | 40156f0c79cef1115fa4a6684a273de8  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--   hash set_event_door(uuid,text)                | t | fedc84d0d2df8c7fbaf5c44687605f4b  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =============================================================================================
-- create temp table door_proof (n serial, step text, ok boolean, detail text);
-- create temp table ctx (event_id uuid, host_id uuid);
-- insert into ctx values ('14bb4318-80cd-4eed-b219-92c097ee16c7', '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b');
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_d uuid := gen_random_uuid(); u_w uuid := gen_random_uuid();
--   u_l uuid := gen_random_uuid(); u_u uuid := gen_random_uuid();
--   e_d text := 'door-d-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_w text := 'door-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_l text := 'door-l-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_u text := 'door-u-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   g_d uuid; g_w uuid; g_l uuid; g_u uuid; t_d text; b_d uuid; b_l uuid;
--   v jsonb; v_n integer; v_step text := 'setup';
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_d, e_d, now()), (u_w, e_w, now()), (u_l, e_l, now()), (u_u, e_u, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_d, e_d, 'Dee Declined'), (u_w, e_w, 'Wren Waits'), (u_l, e_l, 'Lou Listed'), (u_u, e_u, 'Uma Unlisted')
--     on conflict (id) do update set display_name = excluded.display_name;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_d); g_d := (v ->> 'guest_id')::uuid; t_d := v ->> 'session_token';
--   v := public.create_guest(v_qr, u_w); g_w := (v ->> 'guest_id')::uuid;
--   reset role;
--   if (select count(*) from public.guests where id in (g_d, g_w) and admission = 'waiting') <> 2 then
--     raise exception 'SETUP: D and W are not both waiting';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_d);  -- the host's Decline
--   b_d := (v ->> 'block_id')::uuid;
--   reset role;
--   insert into door_proof (step, ok, detail) values ('setup', true,
--     format('event %s, host %s: letting each person in; D declined (block %s), W waiting', v_event, v_host, b_d));
--
--   -- ── 1. THE FINDING: a Public trip lets in W and leaves the declined D waiting, and says so. ──
--   v_step := '1 a Public trip leaves a declined ask waiting';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if (select admission from public.guests where id = g_d) <> 'waiting' then
--     raise exception 'FAIL: a Public trip let the declined ask in';
--   end if;
--   if (select admission from public.guests where id = g_w) <> 'in' then raise exception 'FAIL: W was not let in'; end if;
--   if (v ->> 'admitted')::int <> 1 then raise exception 'FAIL: the door opening counted %', v; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_d, array[t_d]);
--   reset role;
--   if not (v ->> 'blocked')::boolean or (v ->> 'was_in')::boolean then raise exception 'FAIL: D''s standing %', v; end if;
--   insert into door_proof (step, ok, detail) values (v_step, true,
--     'Public let W in (admitted 1) and left D waiting, blocked, never was_in');
--
--   -- ── 2. Back at letting each person in, Let back in lands her at the door, where the host answers her. ──
--   v_step := '2 Let back in at the door';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   v := public.let_back_in(b_d, false);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: let back in %', v; end if;
--   if (select admission from public.guests where id = g_d) <> 'waiting' then raise exception 'FAIL: D was let in at approve'; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_d, array[t_d]);
--   if not (v ->> 'waiting')::boolean or (v ->> 'in')::boolean then raise exception 'FAIL: D is not back at the door %', v; end if;
--   if public.get_upload_context(t_d, 'photo') ->> 'visibility' <> 'private' then raise exception 'FAIL: D''s ticket adds at the door'; end if;
--   if not exists (select 1 from jsonb_array_elements(public.event_door_queue(v_event) -> 'people') p
--                   where (p ->> 'user_id')::uuid = u_d) then
--     raise exception 'FAIL: D is not At the door';
--   end if;
--   reset role;
--   insert into door_proof (step, ok, detail) values (v_step, true,
--     'at approve Let back in admits nobody: D waits, reads waiting, her ticket reads private, and she is At the door');
--
--   -- ── 3. At a Public door Let back in lets her in: the door's opening waited only on the block. ──
--   v_step := '3 Let back in at Public';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_d);
--   b_d := (v ->> 'block_id')::uuid;
--   v := public.set_event_door(v_event, 'open');
--   if (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: turning Public counted a blocked ask %', v; end if;
--   v := public.let_back_in(b_d, false);
--   reset role;
--   if (v ->> 'admitted')::int <> 1 or (select admission from public.guests where id = g_d) <> 'in' then
--     raise exception 'FAIL: Let back in at Public %', v;
--   end if;
--   set local role service_role;
--   if public.get_upload_context(t_d, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: D cannot add at Public'; end if;
--   reset role;
--   insert into door_proof (step, ok, detail) values (v_step, true,
--     'declined again and Public: admitted 0; Let back in lets her in (admitted 1) and her ticket adds');
--
--   -- ── 4. The list's twins read one set: what the count says is what the list lets in, never a blocked ask. ──
--   v_step := '4 the list''s twins';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_l); g_l := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_u); g_u := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_l, e_u]);
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_u);  -- U listed, then declined
--   reset role;
--   set local role service_role;
--   v_n := public.event_door_waiting_listed(v_event);
--   if v_n <> 1 or (public.event_door_counts(v_event) ->> 'waiting_listed')::int <> 1 then
--     raise exception 'FAIL: the count read % (and the menu %)', v_n, public.event_door_counts(v_event);
--   end if;
--   reset role;
--   if (select count(*) from public.event_door_asks(v_event)) <> 1
--      or (select count(*) from public.event_door_asks(v_event) a where a.listed and a.guest_id = g_l) <> 1 then
--     raise exception 'FAIL: the asks read wrong';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if (v ->> 'admitted')::int <> v_n or (select admission from public.guests where id = g_l) <> 'in'
--      or (select admission from public.guests where id = g_u) <> 'waiting' then
--     raise exception 'FAIL: the list let in other than it counted %', v;
--   end if;
--   select id into b_l from public.event_blocks where event_id = v_event and user_id = u_u;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(b_l, false);
--   reset role;
--   if (v ->> 'admitted')::int <> 1 or (select admission from public.guests where id = g_u) <> 'in' then
--     raise exception 'FAIL: Let back in at a list that names her %', v;
--   end if;
--   insert into door_proof (step, ok, detail) values (v_step, true,
--     'L listed and U listed then declined: the count read 1 and the list let in exactly L (admitted 1), U waited; Let back in let U in by the list');
--
--   -- ── 5. The grants: the helper is the owner's alone; the five keep their mode and their roles. ──
--   v_step := '5 grants';
--   if has_function_privilege('public', 'public.event_door_asks(uuid)', 'EXECUTE')
--      or has_function_privilege('anon', 'public.event_door_asks(uuid)', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.event_door_asks(uuid)', 'EXECUTE')
--      or has_function_privilege('service_role', 'public.event_door_asks(uuid)', 'EXECUTE')
--      or (select prosecdef from pg_proc where oid = 'public.event_door_asks(uuid)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.event_door_asks(uuid)'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the helper''s grants or mode';
--   end if;
--   select count(*) into v_n
--     from (values ('public.event_door_admit_listed(uuid)', false, '{postgres=X/postgres,service_role=X/postgres}'),
--                  ('public.event_door_waiting_listed(uuid)', true, '{postgres=X/postgres,service_role=X/postgres}'),
--                  ('public.events_door_opened()', true, '{postgres=X/postgres,service_role=X/postgres}'),
--                  ('public.let_back_in(uuid, boolean)', true,
--                   '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}'),
--                  ('public.set_event_door(uuid, text)', true,
--                   '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}')) x(fn, secdef, acl)
--     join pg_proc p on p.oid = x.fn::regprocedure
--    where p.prosecdef = x.secdef and p.proacl::text = x.acl and p.proconfig = array['search_path=""'];
--   if v_n <> 5 then raise exception 'FAIL: a replaced body lost its mode, its path or its roles (% of 5 hold)', v_n; end if;
--   set local role service_role;
--   begin
--     perform count(*) from public.event_door_asks(v_event);
--     raise exception 'FAIL: the service role read the asks';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   insert into door_proof (step, ok, detail) values (v_step, true,
--     'event_door_asks: INVOKER, path pinned, the owner''s EXECUTE alone (the service role refused); the five as before');
--
--   insert into door_proof (step, ok, detail)
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public'
--        and p.proname in ('event_door_asks', 'event_door_admit_listed', 'event_door_waiting_listed',
--                          'events_door_opened', 'let_back_in', 'set_event_door')
--      order by 1;
-- exception when others then
--   insert into door_proof (step, ok, detail) values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from door_proof order by n;
