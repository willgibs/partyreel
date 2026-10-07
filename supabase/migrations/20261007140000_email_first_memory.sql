-- =============================================================================================
-- AN EMAIL FIRST REMEMBERS HER NAMES-ONLY DOOR (lane `crumbs-89`; red-team 57b's MEDIUM, crumbs-87's Q1).
--
-- Letting each person in and the invite list both match a confirmed address, so choosing either holds "An email first"
-- on (`events_gate_needs_email`; set_event_door's `v_email`), and Settings says so while the gate stands: "On while you
-- let each person in". The database kept no memory of what she had chosen before it, so a host with names only who tried
-- a gate and left it found the step still on, and a guest already in by name met "Confirm your email to see everything"
-- (the gap audit's MEDIUM). crumbs-87 kept the promise on the device: a localStorage note the page gave back when the
-- hub's row showed the gate gone. Red-team 57b found that row stops taking the saves after a load (7 of 12 trials), so
-- the note was lost to a reload, a restored tab, a pasted settings link and the phone's full-screen door page, and it
-- never reached another device or the password's first set.
--
-- ★ THE RULE: THE GATE'S HOLD IS REMEMBERED WHERE THE GATE IS, AND THE GATE'S LEAVING GIVES IT BACK. A gate that turns
-- the email step on from off notes it on the event (`events.email_held`), and when the gate goes her names-only door
-- comes back with it, whichever path moves the gate and from whichever device:
--   * set_event_door onto Public, Only me, only people already in, or the password (one already set);
--   * set_event_password, the password's first set (it clears the gate as it flips the door, 20260929120000);
--   * from one address gate to the other nothing is given back: the first gate's hold stands, and so does its memory.
-- Her own step on (on before any gate) is never touched: a gate that turned nothing on remembers nothing. Her own word on
-- the switch cannot meet the memory: while an address gate stands the step cannot be turned off (the CHECK), and once it
-- has gone the memory has gone with it.
--
-- ★ ONE TRIGGER OWNS THE COLUMN, BOTH WAYS: BEFORE UPDATE OF gate, the one column every move of a gate writes and no
-- client role is granted (its two writers are set_event_door and set_event_password, both SECURITY DEFINER), so no
-- other path can set the memory or skip its giving back. It writes only NEW (the step and the memory), so it runs as
-- its caller (SECURITY INVOKER: no table read, nothing to borrow), and no client role holds its EXECUTE (a trigger still
-- fires). set_event_door's update stays verbatim; what the trigger gave back is read off the row after it and answered
-- as `email_restored`, so the host is told in the switch's own words from the save's own answer, never a later read of
-- the hub.
--
-- WHAT THIS FILE DOES:
--   1. events.email_held           NEW boolean, not null, default false: a gate that matches an address turned An
--                                  email first on from off. No client role writes it (the events grants name columns,
--                                  and none names it); the host reads her own row as she reads every column (SELECT is
--                                  table-level, RLS scopes the rows), so her Settings knows a hold it will give back.
--   2. events_email_held()         NEW, the trigger's function: plpgsql, SECURITY INVOKER, an empty search_path, EXECUTE
--                                  revoked from public, anon and authenticated.
--   3. events_email_held           NEW trigger, BEFORE UPDATE OF gate ON events, FOR EACH ROW.
--   4. set_event_door(uuid, text)  carried from 20260930130000 verbatim but for `email_restored` in its answer (one read
--                                  of the row its update left). Its signature, RETURNS, every other key and its grants
--                                  are today's, restated; its comment says the new key.
--
-- ★ AN EXPAND: milestone 38's build (partyreel.com and the alias) and milestone 39's (the desk), both on this database,
-- call set_event_door by its two names and read `email_held` and `admitted`, both unchanged; `email_restored` is a key
-- neither asks for, and neither names the column. What they meet meanwhile: an album they move off a gate that held the
-- step from off gets its names-only door back in the database (a guest already in by name sees everything again), and
-- their Settings shows the switch off once its row catches up: milestone 39's device note then finds the row's switch
-- already off and forgets itself with no toast (`settings-state.tsx`'s effect), and milestone 38's reads the row. An
-- album held at the apply has no memory of its hold (the default, false), so leaving that gate leaves the step on, as
-- today; every hold after the apply is remembered. Nothing to contract: the column is the rule's own.
-- ★ APPLY BEFORE THIS LANE'S BUILD: its door page reads `email_restored` (an older answer reads null: "this database
-- does not remember", and it gives nothing back nor claims to) and the row's `email_held` (absent reads false).
--
-- LOCKS AT APPLY: the column is a catalog change (a constant default: no table rewrite) under ACCESS EXCLUSIVE on
-- events for an instant; the trigger's creation takes SHARE ROW EXCLUSIVE on events; set_event_door is a catalog write.
-- No row is touched.
--
-- ADVISORS (security): EXPECTED DELTA: none (27 rls_enabled_no_policy, 4 in 0028, 36 in 0029, as before).
-- set_event_door stays in 0029 as the same authenticated SECURITY DEFINER host act; the trigger's function is SECURITY
-- INVOKER and no client role runs it (in neither list); no table, policy or anon grant moves.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: set_event_door(uuid,text)'s md5(prosrc) reads fedc84d0d2df8c7fbaf5c44687605f4b
--       (20260930130000's body between its dollar quotes) and set_event_password(uuid,text)'s
--       560185c3883c8219d494a30fae29872f (20260929120000's, untouched here: the proof's first-set path is today's), each
--       measured live on 2026-10-07; and neither the column, the function nor the trigger exists:
--         select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname in ('set_event_door', 'set_event_password', 'events_email_held')
--          order by 1;
--         select column_name from information_schema.columns
--          where table_schema = 'public' and table_name = 'events' and column_name = 'email_held';
--         select tgname from pg_trigger where tgrelid = 'public.events'::regclass and tgname = 'events_email_held';
--   (2) The rolled-back proof at the foot, in one execute_sql call: red without this file's statements, green with.
--   (3) Apply verbatim. The queries in (1) then read: events_email_held() e8946631499647c941bc6a84acb04755, false,
--       {postgres=X/postgres,service_role=X/postgres}; set_event_door(uuid,text) 57e3f04e923c66320678e5304c923959, true,
--       {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} (as before); set_event_password as before;
--       the column; the trigger (the hashes are the proof's last rows).
--   (4) get_advisors (security): the delta above.
--   (5) Regenerate src/lib/db/types.ts (events' Row, Insert and Update gain `email_held`; a trigger's function is no
--       RPC types.ts lists), then read the field through the generated type where the lane's typed seam reads it
--       (`heldOf` in src/components/app/event-settings/settings-state.tsx).
-- =============================================================================================

-- =============================================================================================
-- 1. The memory.
-- =============================================================================================
alter table public.events
  add column email_held boolean not null default false;

comment on column public.events.email_held is
  'An email first (require_verified_email) is on only because a gate that matches an address (approve, invite) turned it on from off: she had names only before it. Written only by the events_email_held trigger, which sets it as such a gate turns the step on and gives her names only back (require_verified_email false) as the gate goes, on every path that moves a gate. No client role writes it.';

-- =============================================================================================
-- 2. The trigger's function: the hold noted, and given back.
-- =============================================================================================
create function public.events_email_held()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.gate in ('approve', 'invite') then
    -- An address gate holds the step: a gate that turned it on from off remembers her names-only door. One that found
    -- it on (her own step, or the other address gate's hold) changes nothing, so a move from one gate to the other keeps
    -- the first hold's memory.
    if not old.require_verified_email and new.require_verified_email then
      new.email_held := true;
    end if;
  else
    -- The gate that held it has gone (Public, Only me, only people already in, a password): what it turned on comes
    -- back off, and the memory goes with it.
    if old.email_held then
      new.require_verified_email := false;
    end if;
    new.email_held := false;
  end if;
  return new;
end;
$$;

-- A trigger's function: no client role runs it, and it still fires.
revoke all on function public.events_email_held() from public, anon, authenticated;

comment on function public.events_email_held() is
  'BEFORE UPDATE OF gate on events (every move of a gate: set_event_door, set_event_password): an address gate (approve, invite) that turns An email first on from off sets email_held; any other gate (none, closed) turns the step back off where email_held was set, and clears it. SECURITY INVOKER (it writes only NEW); no client role runs it.';

-- =============================================================================================
-- 3. Every move of a gate.
-- =============================================================================================
create trigger events_email_held
  before update of gate on public.events
  for each row execute function public.events_email_held();

-- =============================================================================================
-- 4. set_event_door: what the gate gave back, answered.
-- =============================================================================================
-- Carried from 20260930130000 verbatim but for `v_email_now`, read after the update, and `email_restored` in the answer.
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
  v_email_now boolean;
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

  -- ★ WHAT THE GATE GAVE BACK (20261007140000): the row as events_email_held left it. The step can only go from on to
  -- off here by the trigger's giving back (this update never writes it off), so the host is told exactly that.
  select e.require_verified_email into v_email_now from public.events e where e.id = v_event.id;

  -- ★ THE LIST BECOMES THE DOOR (20260929220000): everyone waiting whom it already names comes in, as
  -- they now would through it, and is counted for the host as the door opening counts who it lets in.
  if p_door = 'invite' then
    v_listed := public.event_door_admit_listed(v_event.id);
  end if;

  return jsonb_build_object(
    'ok', true,
    'door', p_door,
    'email_held', v_email and not v_event.require_verified_email,
    'email_restored', v_event.require_verified_email and not v_email_now,
    'admitted', v_waiting + v_listed
  );
end;
$$;

revoke all on function public.set_event_door(uuid, text) from public, anon, authenticated;
grant execute on function public.set_event_door(uuid, text) to authenticated;

comment on function public.set_event_door(uuid, text) is
  'The door''s one writer (event-settings r1): open, password (only onto a password already set), approve, invite, closed or private (Only me). The caller must host the live event (else not_found). A gate that keys on an address turns the email step on with it (email_held: from off, which the event remembers); a door that leaves such a gate gives her names only back where the gate turned the step on (email_restored, events_email_held). Turning Public lets in every ask no block holds, and turning to the invite list lets in the asks it names (admitted counts either).';

-- =============================================================================================
-- THE ROLLED-BACK PROOF. Proved on the live schema BEFORE applying (database-security.md, "An unapplied migration is
-- proved on the live schema"): ONE execute_sql call of `begin;`, this file's statements verbatim, the block below (its
-- two temp tables, the DO block and the final read) and `rollback;`. RED is the same call without this file's
-- statements, on today's schema. The block traps its own failure into the proof table, so the rollback always runs and
-- the call answers the rows. It rides an EXISTING event (creating one trips enforce_event_limit): the lane's own
-- disposable album, made Public with names only inside the transaction, and makes its one guest, Mira, in on a name
-- alone, whose own view (get_upload_context, as anon: her phone's read) is read after every move. It proves the hold
-- remembered, every way out giving her names only back (Public, only people already in, Only me, the password by the
-- door and the password's first set), the move from one gate to the other keeping the memory, her own step on never
-- touched, the refusals, and the grants.
--
-- PRE-FLIGHT on a throwaway Postgres 17 stand-in (2026-10-07: events' door columns and constraints as live, the
-- Supabase roles, an auth.uid() over request.jwt.claims, set_event_door, set_event_password and clear_event_password
-- from their newest files, the asks helpers stubbed): this file applied verbatim; pg_get_functiondef of set_event_door
-- before and after differs by exactly `v_email_now`, its read and `email_restored`; the hold, Public, gate to gate,
-- Only me, the first password, the password by the door, her own step on, a write naming no gate, and the refusals
-- (the memory's write 42501, anon 42501) each held.
--
-- Held on 2026-10-07 against the live schema (event bc89e1e0-4182-463e-a072-39a8ebeed5d4 "crumbs-89 (disposable)
-- door", host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b). RED, the block alone on today's set_event_door:
--   1 the hold | f | FAIL: set_event_door answers no email_restored {"ok": true, "door": "approve", "admitted": 0, "email_held": true}
-- GREEN, with this file's statements (afterwards set_event_door read fedc84d0d2df8c7fbaf5c44687605f4b as before, no
-- events_email_held function or trigger, no email_held column, no "Mira Proof" guest, and the event its own door and
-- step as before the call: nothing persisted):
--   setup                          | t | event bc89e1e0-4182-463e-a072-39a8ebeed5d4: Public with names only; Mira in on a name alone, her own view asks no email
--   1 the hold                     | t | approve from names only: email_held true in the answer and on the row, email_restored false, admitted 0; Mira is asked to confirm an email
--   2 Public gives it back         | t | Public: email_restored true; the step off and the memory gone on the row; Mira's view asks no email again
--   3 gate to gate                 | t | approve, then invite: email_held false (already on), the memory kept; then Public: email_restored true, the step off
--   4 every way out                | t | from a hold to only people already in, to Only me, and to a password already set: each email_restored true, the step off, the memory gone; the Public after each gave nothing back twice
--   5 the password's first set     | t | held, then set_event_password: the door a password, the step off, the memory gone; Mira, in, passes the password and is asked no email
--   6 her own step on              | t | the step on by her own write, then approve and Public: email_held false, email_restored false, the step still on
--   7 the refusals                 | t | held: another host not_found, no session unauthorized, anon refused EXECUTE, the host's own write of email_held refused (42501); the hold and its memory stand; authenticated reads the column and writes neither way, anon reads nothing
--   8 grants                       | t | set_event_door DEFINER, path pinned, {postgres, service_role, authenticated}; events_email_held INVOKER, path pinned, no client role; the trigger BEFORE UPDATE OF gate, each row
--   hash events_email_held()       | t | e8946631499647c941bc6a84acb04755  {postgres=X/postgres,service_role=X/postgres}
--   hash set_event_door(uuid,text) | t | 57e3f04e923c66320678e5304c923959  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =============================================================================================
-- create temp table email_proof (n serial, step text, ok boolean, detail text);
-- create temp table ctx (event_id uuid, host_id uuid);
-- insert into ctx values ('bc89e1e0-4182-463e-a072-39a8ebeed5d4', '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b');
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text; v_token text; v_other uuid := gen_random_uuid();
--   v jsonb; c jsonb; v_step text := 'setup'; v_door text;
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   -- Public with names only, uploads open, no password: her own choice before any gate.
--   update public.events set visibility = 'open', gate = null, require_verified_email = false,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null
--    where id = v_event and host_id = v_host and deleted_at is null
--   returning qr_token into v_qr;
--   if v_qr is null then raise exception 'SETUP: no live event of the host''s'; end if;
--   set local role service_role;
--   v := public.create_guest(v_qr, null, false, 'Mira Proof', null);
--   reset role;
--   v_token := v ->> 'session_token';
--   set local role anon;
--   c := public.get_upload_context(v_token, 'photo');
--   reset role;
--   if v_token is null or (c ->> 'require_verified_email')::boolean or (c ->> 'guest_verified')::boolean then
--     raise exception 'SETUP: Mira is not in on a name alone at names only % %', v, c;
--   end if;
--   insert into email_proof (step, ok, detail) values ('setup', true,
--     format('event %s: Public with names only; Mira in on a name alone, her own view asks no email', v_event));
--
--   -- ── 1. The hold, by the deployed builds' own call: it turns the step on from off, and the event remembers. ──
--   v_step := '1 the hold';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   if not (v ? 'email_restored') then raise exception 'FAIL: set_event_door answers no email_restored %', v; end if;
--   if not (v ->> 'ok')::boolean or not (v ->> 'email_held')::boolean or (v ->> 'email_restored')::boolean
--      or (v ->> 'admitted')::int <> 0 then
--     raise exception 'FAIL: the hold''s answer %', v;
--   end if;
--   if not (select require_verified_email and email_held from public.events where id = v_event) then
--     raise exception 'FAIL: the hold is not remembered';
--   end if;
--   set local role anon; c := public.get_upload_context(v_token, 'photo'); reset role;
--   if not (c ->> 'require_verified_email')::boolean then raise exception 'FAIL: Mira''s view during the hold %', c; end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'approve from names only: email_held true in the answer and on the row, email_restored false, admitted 0; Mira is asked to confirm an email');
--
--   -- ── 2. Public: her names-only door comes back, and the answer says so. ──
--   v_step := '2 Public gives it back';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if not (v ->> 'ok')::boolean or not (v ->> 'email_restored')::boolean or (v ->> 'email_held')::boolean then
--     raise exception 'FAIL: Public''s answer %', v;
--   end if;
--   if (select require_verified_email or email_held from public.events where id = v_event) then
--     raise exception 'FAIL: Public left the step on, or the memory standing';
--   end if;
--   set local role anon; c := public.get_upload_context(v_token, 'photo'); reset role;
--   if (c ->> 'require_verified_email')::boolean then raise exception 'FAIL: Mira''s view at Public %', c; end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'Public: email_restored true; the step off and the memory gone on the row; Mira''s view asks no email again');
--
--   -- ── 3. From one address gate to the other: the first hold's memory stands, and the way out gives it back. ──
--   v_step := '3 gate to gate';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if (v ->> 'email_held')::boolean or (v ->> 'email_restored')::boolean
--      or not (select require_verified_email and email_held from public.events where id = v_event) then
--     raise exception 'FAIL: approve to invite %', v;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if not (v ->> 'email_restored')::boolean or (select require_verified_email from public.events where id = v_event) then
--     raise exception 'FAIL: out of the invite list %', v;
--   end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'approve, then invite: email_held false (already on), the memory kept; then Public: email_restored true, the step off');
--
--   -- ── 4. Every other way out of a hold: only people already in, Only me, and a password already set. ──
--   v_step := '4 every way out';
--   foreach v_door in array array['closed', 'private', 'password'] loop
--     if v_door = 'password' then
--       update public.events set event_password_hash = extensions.crypt('email-proof', extensions.gen_salt('bf'))
--        where id = v_event;
--     end if;
--     perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     v := public.set_event_door(v_event, 'approve');
--     if not (v ->> 'email_held')::boolean then raise exception 'FAIL: the hold before % %', v_door, v; end if;
--     v := public.set_event_door(v_event, v_door);
--     reset role;
--     if not (v ->> 'ok')::boolean or not (v ->> 'email_restored')::boolean
--        or (select require_verified_email or email_held from public.events where id = v_event) then
--       raise exception 'FAIL: approve to % %', v_door, v;
--     end if;
--     perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     v := public.set_event_door(v_event, 'open');
--     reset role;
--     if (v ->> 'email_restored')::boolean then raise exception 'FAIL: % gave back twice %', v_door, v; end if;
--   end loop;
--   update public.events set event_password_hash = null where id = v_event;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'from a hold to only people already in, to Only me, and to a password already set: each email_restored true, the step off, the memory gone; the Public after each gave nothing back twice');
--
--   -- ── 5. The password's first set, while held: it clears the gate as it flips the door, and the trigger gives back. ──
--   v_step := '5 the password''s first set';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   perform public.set_event_password(v_event, 'email-proof-first');
--   reset role;
--   if not (select visibility = 'password' and gate is null and not require_verified_email and not email_held
--             from public.events where id = v_event) then
--     raise exception 'FAIL: the first password left the step on, or the memory standing';
--   end if;
--   set local role anon; c := public.get_upload_context(v_token, 'photo'); reset role;
--   if (c ->> 'require_verified_email')::boolean or c ->> 'visibility' <> 'open' then
--     raise exception 'FAIL: Mira''s view at the password %', c;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.clear_event_password(v_event);
--   reset role;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'held, then set_event_password: the door a password, the step off, the memory gone; Mira, in, passes the password and is asked no email');
--
--   -- ── 6. Her own step on is never given back. ──
--   v_step := '6 her own step on';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.events set require_verified_email = true where id = v_event;
--   v := public.set_event_door(v_event, 'approve');
--   if (v ->> 'email_held')::boolean then raise exception 'FAIL: a gate that turned nothing on held it %', v; end if;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if (v ->> 'email_restored')::boolean
--      or not (select require_verified_email and not email_held from public.events where id = v_event) then
--     raise exception 'FAIL: her own step on was given back %', v;
--   end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'the step on by her own write, then approve and Public: email_held false, email_restored false, the step still on');
--
--   -- ── 7. The refusals: another host, nobody signed in, anon, and a client write of the memory. Nothing moves. ──
--   v_step := '7 the refusals';
--   update public.events set require_verified_email = false where id = v_event;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if v ->> 'reason' is distinct from 'unauthorized' then raise exception 'FAIL: nobody signed in %', v; end if;
--   set local role anon;
--   begin
--     perform public.set_event_door(v_event, 'open');
--     raise exception 'FAIL: anon ran set_event_door';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     update public.events set email_held = false where id = v_event;
--     raise exception 'FAIL: the host wrote the memory';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if not (select gate = 'approve' and require_verified_email and email_held from public.events where id = v_event) then
--     raise exception 'FAIL: a refusal moved the door or the memory';
--   end if;
--   if has_column_privilege('authenticated', 'public.events', 'email_held', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.events', 'email_held', 'INSERT')
--      or has_column_privilege('anon', 'public.events', 'email_held', 'SELECT')
--      or not has_column_privilege('authenticated', 'public.events', 'email_held', 'SELECT') then
--     raise exception 'FAIL: the column''s privileges';
--   end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'held: another host not_found, no session unauthorized, anon refused EXECUTE, the host''s own write of email_held refused (42501); the hold and its memory stand; authenticated reads the column and writes neither way, anon reads nothing');
--
--   -- ── 8. The grants and the modes. ──
--   v_step := '8 grants';
--   if not (select p.prosecdef and p.proconfig = array['search_path=""']
--                  and p.proacl::text = '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}'
--             from pg_proc p where p.oid = 'public.set_event_door(uuid, text)'::regprocedure)
--      or has_function_privilege('anon', 'public.set_event_door(uuid, text)', 'EXECUTE')
--      or has_function_privilege('public', 'public.set_event_door(uuid, text)', 'EXECUTE') then
--     raise exception 'FAIL: set_event_door''s mode, path or roles';
--   end if;
--   if (select p.prosecdef or p.proconfig is distinct from array['search_path=""']
--             from pg_proc p where p.oid = 'public.events_email_held()'::regprocedure)
--      or has_function_privilege('authenticated', 'public.events_email_held()', 'EXECUTE')
--      or has_function_privilege('anon', 'public.events_email_held()', 'EXECUTE')
--      or has_function_privilege('public', 'public.events_email_held()', 'EXECUTE') then
--     raise exception 'FAIL: events_email_held''s mode, path or roles';
--   end if;
--   if (select pg_get_triggerdef(t.oid) from pg_trigger t
--        where t.tgrelid = 'public.events'::regclass and t.tgname = 'events_email_held')
--      is distinct from 'CREATE TRIGGER events_email_held BEFORE UPDATE OF gate ON public.events FOR EACH ROW EXECUTE FUNCTION events_email_held()' then
--     raise exception 'FAIL: the trigger';
--   end if;
--   insert into email_proof (step, ok, detail) values (v_step, true,
--     'set_event_door DEFINER, path pinned, {postgres, service_role, authenticated}; events_email_held INVOKER, path pinned, no client role; the trigger BEFORE UPDATE OF gate, each row');
--
--   insert into email_proof (step, ok, detail)
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || coalesce(p.proacl::text, '(default)')
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('set_event_door', 'events_email_held')
--      order by 1;
-- exception when others then
--   insert into email_proof (step, ok, detail) values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from email_proof order by n;
