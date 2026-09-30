-- =============================================================================================
-- THE JOIN WAITS FOR THE DOOR (lane `crumbs-24`, crumbs-21's find).
--
-- The finding: create_guest read the door with no lock the host's move waits on. A join that read
-- `approve` in the instant the door became a password minted its waiting ticket AFTER the password's
-- trigger (events_door_to_password, 20260929230000) had ended every ask that stood, so the ask stood at
-- the password until the door moved again: the host's At the door, the pulse and the bell counted her
-- at an album that asks nobody to wait, and her held door kept checking in. The same instant strands
-- an ask two other ways: a door turning Public lets in only the asks it can see (events_door_opened),
-- and the list becoming the door lets in only the ones it can see (event_door_admit_listed).
--
-- ★ THE RULE: THE DOOR IS READ UNDER ITS ROW'S SHARE LOCK. Every move of the door writes the event row
-- (set_event_door takes it `for no key update` before it writes; set_event_password's update takes the
-- same lock), and `for share` conflicts with that lock and with nothing a join takes. So a join either
-- finishes before the move begins, and the move (and its triggers, whose statements read afresh once
-- the lock is theirs) meets the row it minted, or it waits for the move and reads the door the move
-- left: at a password it meets the password like anyone new. Joins never wait on each other.
--   * BOTH MINTS OF AN ASK TAKE IT: create_guest (a newcomer at letting each person in) and ask_to_join
--     (an address the invite list does not name). Nothing else mints a waiting ticket.
--   * NO NEW DEADLOCK: the share lock is each body's first lock, taken holding nothing; it waits only on
--     a move of the door, which never waits on a join; the album's version row stays every
--     transaction's last lock (database-security.md).
--
-- WHAT THIS FILE DOES:
--   1. create_guest   carried from 20260929120000 verbatim but for `for share` on its read of the
--                     event (and the note above it). Service role only, as before.
--   2. ask_to_join    carried from 20260929120000 verbatim but for the same lock. Service role only.
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: every signature, RETURNS, answer and grant is today's, so the deployed
-- build and this lane's build run against either side of the apply. Before it the instant stays open,
-- as it is today; after it the join waits the length of the host's move (a statement) at most.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-30, the
--       method below reproducing each live hash from its file):
--         create_guest(text, uuid, boolean, text, text)   6d0f60133ab55eca7952977ea11dd97b  (20260929120000)
--         ask_to_join(text, uuid)                         259da9137fea1f6619713d747324a215  (20260929120000)
--       select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('create_guest', 'ask_to_join')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads (md5 of each body as this file writes it):
--         create_guest(text, uuid, boolean, text, text)   07269a40eaee60154233f3ab1e2f382e
--         ask_to_join(text, uuid)                         153bed5352a29089551a46859e177620
--       each with {postgres, service_role}, exactly as before.
--   (3) get_advisors (security). EXPECTED DELTA: none (both stay service-role only, in neither list).
--   (4) Nothing to regenerate: no signature or RETURNS moved.
-- =============================================================================================

-- =============================================================================================
-- 1. create_guest: the join, reading the door under its row's share lock.
-- =============================================================================================
create or replace function public.create_guest(
  p_qr_token text,
  p_user_id uuid default null,
  p_unlock_proven boolean default false,
  p_display_name text default null,
  p_pending_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := p_user_id; -- the /api/guests route's getUser()-verified id (admin client has no auth.uid())
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_pending text;
  v_in boolean;
  v_admission public.guest_admission := 'in';
begin
  -- ★ THE DOOR, READ UNDER ITS ROW'S SHARE LOCK (20260930100000). Every move of the door takes the
  -- event row for an update (set_event_door's own lock, set_event_password's update), and a share
  -- lock waits on either: so this join either reads the door the host's move leaves, or finishes
  -- before the move begins, and the move's triggers then meet the row it minted. Joins never wait on
  -- each other (a share lock is compatible with a share lock). Without it, a join that read
  -- `approve` in the instant the door became a password minted its ask after the password's
  -- trigger had ended every ask, and the ask stood at the password until the door moved again.
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null
  for share;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- QA #18 (ADR-0023 ruling 2): the write path inherits the read gate. Only me (`private` with no gate)
  -- NEVER mints — the /e/ page shuts the door on everyone but the host (owner uploads ride the host
  -- routes), so a guest session for it has no legitimate caller. `password` requires proof of unlock,
  -- or someone already in: the route derives p_unlock_proven server-side (the HttpOnly unlock cookie, or
  -- event ownership — the owner reads the album without unlocking, so they upload without it too). The
  -- DB cannot read cookies, so this param is a belt against a FUTURE second caller skipping the route
  -- gate, not a client-forgeable input (create_guest stays service-role-only).
  if v_event.visibility = 'private' and v_event.gate is null then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000): an account (or the address it confirmed) this event blocked
  -- meets the private album's refusal word for word, which createGuest maps to the same 403. A
  -- names-only joiner has no account to hold; the route's closed door holds the ticket their browser
  -- keeps (event_door_standing) before it ever calls this.
  if public.event_block_holds_account(v_event.id, v_uid) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE ONE RULE FOR EVERYONE ALREADY IN (20260929120000): an account past the door passes every gate.
  v_in := public.event_door_account_in(v_event.id, v_uid);
  if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) and not v_in then
    raise exception 'This event is locked. Enter the event password to upload.' using errcode = 'check_violation';
  end if;

  -- Verified email is SERVER-sourced: read auth.users for the trusted uid (definer privilege), never the
  -- client. (This is what closes the email-poisoning surface alongside capture_guest_email's new route.)
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- ONLY A CONFIRMED ADDRESS REACHES `guests.email` (the identity SQL gaps, 2026-09-22). `email`
  -- means "confirmed" to every reader (the uploader resolver, the forensic `guest_email`), and
  -- `verified_at` is stamped from the same `v_confirmed` below, so the two arrive together or not
  -- at all from this mint.
  if v_confirmed is null then
    v_email := null;
  end if;

  -- The host's switch is Require verified emails: ON, nothing but a CONFIRMED session gets
  -- through. check_violation, which createGuest (src/lib/db/mutations/guest.ts) maps to a 422.
  if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  -- ★ THE GATE (20260929120000), for a newcomer: closed turns her away as a private album does, approve
  -- mints her waiting, and an invite list takes the addresses it names and asks everyone else to ask.
  if v_event.gate is not null and not v_in then
    if v_event.gate = 'closed' then
      raise exception 'This event is private.' using errcode = 'check_violation';
    elsif v_event.gate = 'approve' then
      v_admission := 'waiting';
    elsif not public.event_door_lists_account(v_event.id, v_uid) then
      raise exception 'Ask the host to let you in.' using errcode = 'check_violation';
    end if;
  end if;

  -- The typed name, on a name-only event. Blank is NULL here; the raise below decides what a
  -- missing name means.
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  -- THE NULLED NAME: a confirmed account's identity is its profile display_name (the one
  -- precedence rule the app codes to), so a typed name is never stored beside it — one identity
  -- per row, never two that can disagree.
  if v_confirmed is not null then
    v_name := null;
  end if;
  -- ★ THE IDENTITY CONTRACT (2026-09-23), the one behaviour change to this body: EVERY UNCONFIRMED
  -- MINT CARRIES A NAME. A confirmed caller's row is nameless by design (its identity is the
  -- profile's name, nulled just above); anyone else is a typed name or nobody, and nobody is what
  -- this refuses. The /api/guests route already refuses a nameless join with its own 422 (and owns
  -- the profanity check, which SQL cannot); this is the belt under it for any other caller, and
  -- the reason a nameless unconfirmed row cannot be minted any more.
  if v_name is null and v_confirmed is null then
    raise exception 'Add your name to upload.' using errcode = 'check_violation';
  end if;
  -- The belt under guests_display_name_len, raised as a mapped refusal rather than a raw 23514.
  -- Only a caller that actually sends a name can reach it.
  if v_name is not null and char_length(v_name) > 60 then
    raise exception 'That name is too long.' using errcode = 'check_violation';
  end if;

  -- THE GUEST IDENTITY ROUND (2026-09-22) — the optional address on the name step. Normalised on
  -- the way in so the CHECK's `= lower(btrim(...))` arm holds by construction and the claim's
  -- equality lookup can never miss on case. Blank is NULL, exactly like the name: the field is
  -- optional and a guest who skips it is at level 1, not in error.
  v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''));
  -- NULLED IN TWO CASES, both "the row already has a better identity than this claim ticket":
  -- beside a CONFIRMED account (the proved address is in `email`; a second, unproved one could only
  -- disagree with it), and on a Require-verified-emails event (only a confirmed mint reaches this
  -- line at all, so this arm is a belt against a future caller that gets past the raise above).
  if v_confirmed is not null or v_event.require_verified_email then
    v_pending := null;
  end if;
  -- The belt under guests_pending_email_shape, raised as a mapped refusal rather than a raw 23514.
  -- ★ It must cover the WHOLE constraint, floor included: a two-character 'a@' passes
  -- `position('@') > 1` and would otherwise reach the CHECK as an unmappable 23514.
  if v_pending is not null
     and (char_length(v_pending) not between 3 and 254 or position('@' in v_pending) <= 1) then
    raise exception 'That email address does not look right.' using errcode = 'check_violation';
  end if;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at, admission)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    v_name,
    v_confirmed,
    v_pending,
    case when v_pending is not null then now() end,
    v_admission
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    -- The door reads which identity it just got without a second read.
    'display_name', v_name,
    'verified', (v_confirmed is not null),
    -- ★ WHETHER, never WHAT. The caller already knows the address it sent; echoing it back would
    -- put an unproved stranger's address on a wire that the host's own /api/guests response rides.
    'email_attached', (v_pending is not null),
    -- ★ WHETHER THE DOOR LET THIS TICKET THROUGH (20260929120000): 'waiting' is the door that asks
    -- the host, and the page holds her there until the host lets her in.
    'admission', v_admission
  );
end;
$function$;

revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 2. ask_to_join: the ask at an invite list, under the same lock.
-- =============================================================================================
create or replace function public.ask_to_join(p_qr_token text, p_user_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_email text;
  v_confirmed timestamptz;
  v_admission public.guest_admission;
  v_session_token text;
  v_guest_id uuid;
begin
  -- ★ THE DOOR, READ UNDER ITS ROW'S SHARE LOCK (20260930100000), as create_guest reads it: an ask
  -- minted in the instant the list stops being the door is ordered against the host's move.
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null
  for share;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  if p_user_id is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = p_user_id;
  end if;
  if v_confirmed is null then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  if v_event.host_id = p_user_id
     or v_event.visibility <> 'private'
     or v_event.gate is distinct from 'invite'
     or public.event_block_holds_account(v_event.id, p_user_id) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;

  v_admission := case
    when public.event_door_account_in(v_event.id, p_user_id)
      or public.event_door_lists_account(v_event.id, p_user_id)
    then 'in'::public.guest_admission
    else 'waiting'::public.guest_admission
  end;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, admission)
  values (
    v_event.id,
    p_user_id,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    null,
    v_confirmed,
    v_admission
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    'display_name', null,
    'verified', true,
    'email_attached', false,
    'admission', v_admission
  );
end;
$$;

revoke all on function public.ask_to_join(text, uuid) from public, anon, authenticated;
grant execute on function public.ask_to_join(text, uuid) to service_role;

-- =============================================================================================
-- THE ORDERING, PROVED WITH TWO REAL SESSIONS (a throwaway postgres@17 cluster, database-security.md's
-- pre-flight): the touched tables' live columns, keys and CHECKs, the live predicates
-- (pg_get_functiondef), and set_event_door, set_event_password and both door triggers from their files
-- (each md5-matched to the live prosrc); today's create_guest and ask_to_join in one database, this file
-- applied verbatim over them in another (its bodies hashing 07269a40... and 153bed53..., as below). In
-- each test the first session holds its transaction open three seconds and the second starts a second
-- later (race.sh in the lane's scratch).
--   test                                   today's bodies                         this file
--   A. a join held, then the password      the move did not wait; her ask         the move waited 2.0 s, then
--                                          stood at the password                  ended her ask: none stand
--   B. the password held, then a join      the join read `approve` at once and    the join waited 2.0 s, then met
--                                          its ask stood at the password          the password ("This event is
--                                                                                 locked..."): none stand
--   C. an ask at the list held, then the   her ask stood at the password          ended: none stand
--      password
--   D. a join held, then Public            admitted 0; her ask stood at a         admitted 1: she is in
--                                          Public album
--   E. two joins at once                   the second answered in 0.00 s          the second answered in 0.00 s
-- While a join was held, pgrowlocks('public.events') read "For Key Share" on today's body (the guest
-- row's foreign key, which the host's move does not wait on) and "For Share" on this file's.
--
-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, the block below (its two temp tables, the DO block and the final read) and
-- `rollback;`. The block traps its own failure into the proof table, so the rollback always runs and
-- the call answers the rows; the lock is recorded rather than raised, so a red run keeps every row
-- before it. It rides an EXISTING event (creating one trips enforce_event_limit), made Private with
-- letting each person in inside the transaction, and makes its own people: W, who asks; A, let in;
-- L, whom the list names; U, whom it does not; K, who proves the password; B, declined. It proves the
-- grants, every door's answer to a join and an ask exactly as before (a single session cannot hold two
-- transactions, so the ordering itself is the two-session proof above), and the share lock.
--
-- Held on 2026-09-30 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b), red first: the block alone, on today's bodies, passed every
-- door and failed 'the lock' with "ask_to_join reads the door with no lock; create_guest reads the door
-- with no lock" (6d0f60133ab55eca7952977ea11dd97b, 259da9137fea1f6619713d747324a215). With this file's
-- statements (afterwards both bodies read as before, no join-* account stood, and the event read open
-- with its 9 guests, no block and no invite: nothing persisted):
--   setup              | t | Private, letting each person in, six people
--   grants             | t | create_guest and ask_to_join: DEFINER, search_path pinned, the service role's alone
--   approve            | t | a newcomer is minted waiting; once let in, her next join is minted in
--   invite             | t | the listed address is minted in (joining or asking); an unlisted one is told to ask, and her ask waits
--   password           | t | both asks ended with it; a newcomer is refused without it and minted in with it; someone already in passes; no ask is taken at it
--   closed and Only me | t | closed turns a newcomer away and lets someone already in; Only me mints nobody
--   the block          | t | a declined newcomer meets the private album at the join and the ask
--   the lock           | t | ask_to_join reads the door for share; create_guest reads the door for share
--   hash ask_to_join(text,uuid)                       | 153bed5352a29089551a46859e177620  {postgres=X/postgres,service_role=X/postgres}
--   hash create_guest(text,uuid,boolean,text,text)    | 07269a40eaee60154233f3ab1e2f382e  {postgres=X/postgres,service_role=X/postgres}
-- =============================================================================================
-- create temp table join_proof (step text, ok boolean, detail text);
-- create temp table ctx (event_id uuid, host_id uuid);
-- insert into ctx values ('14bb4318-80cd-4eed-b219-92c097ee16c7', '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b');
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_w uuid := gen_random_uuid(); u_a uuid := gen_random_uuid(); u_k uuid := gen_random_uuid();
--   u_l uuid := gen_random_uuid(); u_u uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
--   e_w text := 'join-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_a text := 'join-a-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_k text := 'join-k-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_l text := 'join-l-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_u text := 'join-u-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_b text := 'join-b-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   g_w uuid; g_a uuid; g_u uuid;
--   v jsonb; v_err text; v_ok boolean;
--   v_step text := 'setup';
--   fn text;
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null, moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_w, e_w, now()), (u_a, e_a, now()), (u_k, e_k, now()), (u_l, e_l, now()), (u_u, e_u, now()), (u_b, e_b, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_w, e_w, 'Wren Waits'), (u_a, e_a, 'Ari Already'), (u_k, e_k, 'Kit Knows'), (u_l, e_l, 'Lou Listed'),
--     (u_u, e_u, 'Uma Unlisted'), (u_b, e_b, 'Bo Blocked')
--     on conflict (id) do update set display_name = excluded.display_name;
--   insert into join_proof values ('setup', true, format('event %s, host %s: Private, letting each person in, six people', v_event, v_host));
--
--   -- ── 1. The two bodies: DEFINER, the path pinned, the service role's alone (a failure stops the check). ──
--   v_step := 'grants';
--   foreach fn in array array['public.create_guest(text, uuid, boolean, text, text)', 'public.ask_to_join(text, uuid)'] loop
--     if has_function_privilege('anon', fn, 'EXECUTE') or has_function_privilege('authenticated', fn, 'EXECUTE')
--        or has_function_privilege('public', fn, 'EXECUTE') or not has_function_privilege('service_role', fn, 'EXECUTE')
--        or not (select prosecdef from pg_proc where oid = fn::regprocedure)
--        or (select proconfig from pg_proc where oid = fn::regprocedure) <> array['search_path=""'] then
--       raise exception 'FAIL: % grants or mode', fn;
--     end if;
--   end loop;
--   insert into join_proof values ('grants', true, 'create_guest and ask_to_join: DEFINER, search_path pinned, the service role''s alone');
--
--   -- ── 2. Letting each person in: a newcomer waits; someone already in passes. ──
--   v_step := 'approve';
--   set local role service_role;
--   v := public.create_guest(v_qr, u_w); g_w := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: W not held %', v; end if;
--   v := public.create_guest(v_qr, u_a); g_a := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_in_at_door(v_event, g_a);
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A already in was held %', v; end if;
--   reset role;
--   insert into join_proof values ('approve', true, 'a newcomer is minted waiting; once let in, her next join is minted in');
--
--   -- ── 3. The invite list: the list's address comes in, anyone else is told to ask, and the ask waits. ──
--   v_step := 'invite';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_l]);
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_l);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: L listed not in %', v; end if;
--   begin
--     perform public.create_guest(v_qr, u_u);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'Ask the host to let you in.' then raise exception 'FAIL: unlisted join %', v_err; end if;
--   v := public.ask_to_join(v_qr, u_u); g_u := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: U''s ask not held %', v; end if;
--   v := public.ask_to_join(v_qr, u_l);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: L''s ask not in %', v; end if;
--   reset role;
--   insert into join_proof values ('invite', true, 'the listed address is minted in (joining or asking); an unlisted one is told to ask, and her ask waits');
--
--   -- ── 4. A password: every ask ends; a newcomer proves it; someone already in passes without it. ──
--   v_step := 'password';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.set_event_password(v_event, 'join-proof-pass');
--   reset role;
--   if exists (select 1 from public.guests where id in (g_w, g_u)) then raise exception 'FAIL: an ask outlived the password'; end if;
--   set local role service_role;
--   begin
--     perform public.create_guest(v_qr, u_k);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err not like '%password%' then raise exception 'FAIL: a newcomer past the password without it %', v_err; end if;
--   v := public.create_guest(v_qr, u_k, true);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: K with the password %', v; end if;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A at the password %', v; end if;
--   begin
--     perform public.ask_to_join(v_qr, u_w);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'This event is private.' then raise exception 'FAIL: an ask at the password %', v_err; end if;
--   reset role;
--   insert into join_proof values ('password', true, 'both asks ended with it; a newcomer is refused without it and minted in with it; someone already in passes; no ask is taken at it');
--
--   -- ── 5. Closed and Only me: no newcomer; closed still lets someone already in. ──
--   v_step := 'closed and Only me';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'closed');
--   reset role;
--   set local role service_role;
--   begin
--     perform public.create_guest(v_qr, u_w);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'This event is private.' then raise exception 'FAIL: a newcomer at closed %', v_err; end if;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A at closed %', v; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'private');
--   reset role;
--   set local role service_role;
--   begin
--     perform public.create_guest(v_qr, u_a);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'This event is private.' then raise exception 'FAIL: A at Only me %', v_err; end if;
--   reset role;
--   insert into join_proof values ('closed and Only me', true, 'closed turns a newcomer away and lets someone already in; Only me mints nobody');
--
--   -- ── 6. A block holds at the join and the ask alike. ──
--   v_step := 'the block';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_b);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_guest_id := (v ->> 'guest_id')::uuid);
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   set local role service_role;
--   begin
--     perform public.ask_to_join(v_qr, u_b);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'This event is private.' then raise exception 'FAIL: B asked past her block %', v_err; end if;
--   begin
--     perform public.create_guest(v_qr, u_b);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err <> 'This event is private.' then raise exception 'FAIL: B joined past her block %', v_err; end if;
--   reset role;
--   insert into join_proof values ('the block', true, 'a declined newcomer meets the private album at the join and the ask');
--
--   -- ── 7. The door is read under its row's share lock (recorded, not raised: a red run keeps the rows above). ──
--   v_step := 'the lock';
--   select coalesce(bool_and(position('where qr_token = p_qr_token and deleted_at is null for share;'
--                                     in lower(regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g'))) > 0), false),
--          string_agg(p.proname || case when position('for share;' in lower(pg_get_functiondef(p.oid))) > 0
--                                       then ' reads the door for share' else ' reads the door with no lock' end, '; ' order by p.proname)
--     into v_ok, v_err
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('create_guest', 'ask_to_join');
--   insert into join_proof values ('the lock', v_ok, v_err);
--
--   insert into join_proof
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('create_guest', 'ask_to_join');
-- exception when others then
--   insert into join_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from join_proof;
