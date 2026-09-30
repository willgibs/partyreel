-- =============================================================================================
-- ONE ACCOUNT, ONE TICKET AT AN ALBUM (lane `crumbs-29`, build 30's red-team, LOW).
--
-- The finding (redteam-28 ledger 18:32Z and 18:34Z): a shared phone held another guest's name-only ticket
-- (Sam's at album A, Dana's at B), and partyr33l, signed in, added her first photo there. The upload refused
-- the ticket as somebody else's, the queue put it down and joined silently as her, and in the same instant the
-- page's own "a confirmed visitor with no ticket joins silently" saw no ticket and joined too. create_guest
-- always inserts, so each album minted two rows of hers in one second (A: f667deb1 with her photo and 9005fb75
-- empty; B: 46f68183 and dbf8843f), and the phone kept the EMPTY row's ticket: her next upload there would have
-- landed on a second row of hers.
--
-- ★ THE RULE: A CONFIRMED ACCOUNT HOLDS ONE TICKET AT AN ALBUM, WHICHEVER JOIN WINS. Both mints of a ticket
-- (create_guest, and ask_to_join at an invite list) answer the ticket the account already holds there, at the
-- admission the door would give her (in, or waiting on the host), instead of minting a second; she is minted one
-- only when she holds none. The account's own joins at one album are taken one at a time (a transaction-scoped
-- advisory lock on the event and the account, taken after the door's share lock and only by a confirmed join),
-- so two joins that race answer the same ticket: the second waits for the first's commit and reads its row.
--   * Which ticket: her newest PROVED row there (`verified_at` set: a confirmed mint, or a proved claim) at that
--     admission that no block holds. A name typed under her account before she confirmed stays that row's, and
--     a row a block holds (a typed name's phone) is never handed back.
--   * Everyone else mints as before: a typed name is one row a join (two people who both typed "Sam" are two
--     guests), and an unconfirmed account keeps its typed name's row.
--   * A second device of hers now holds the same ticket as her first (the one row), which is what the server's
--     owner rule already keys on: a row with `user_id` writes only for that signed-in account, on any device.
--   * `guests` still carries no unique (event_id, user_id): a claim can still take a typed name's old rows onto
--     her account beside her own (the claims review's business), and the join answers the newest.
--
-- WHAT THIS FILE DOES:
--   1. event_account_ticket(uuid, uuid, guest_admission)   NEW. plpgsql, SECURITY INVOKER, empty search_path:
--      the account's one ticket at an album, under the join's lock. It answers a whole guests row (the ticket
--      included), so its EXECUTE is the owner's alone: only the two definer mints call it.
--   2. create_guest   carried from 20260930100000 verbatim but for the answer before the insert, for a confirmed
--                     caller. Service role only, as before.
--   3. ask_to_join    carried from 20260930100000 verbatim but for the same answer. Service role only.
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: every signature, RETURNS, answer key and grant is today's, so milestone 31's
-- build and this lane's run against either side of the apply (the lane's client joins once a page as well).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-30), and the helper
--       does not exist yet:
--         create_guest(text,uuid,boolean,text,text)   07269a40eaee60154233f3ab1e2f382e  (20260930100000)
--         ask_to_join(text,uuid)                      153bed5352a29089551a46859e177620  (20260930100000)
--       select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('create_guest', 'ask_to_join', 'event_account_ticket')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim. The query in
--       (1) then reads each body as this file writes it (the proof's last rows), both ACLs exactly as before and
--       the helper's {postgres=X/postgres}.
--   (3) get_advisors (security). EXPECTED DELTA: none (the helper is INVOKER and no role PostgREST serves holds
--       its EXECUTE; the two mints stay the service role's).
--   (4) Regenerate src/lib/db/types.ts: event_account_ticket joins the Functions (nothing calls it from
--       TypeScript).
-- =============================================================================================

-- =============================================================================================
-- 1. The account's one ticket at an album.
-- =============================================================================================
-- ★ TAKEN UNDER THE JOIN'S OWN LOCK, one account at one album at a time: a transaction-scoped advisory lock
-- keyed on the two, so a second join of hers waits for the first to commit and then reads the row it minted
-- (read committed: this read takes its own snapshot after the lock). Joins of anyone else never wait on it. The
-- caller has already taken the event row's share lock (the door's), so this is every join's second lock, and
-- the only thing that can hold it is another join of the same account, which takes nothing else before it.
create function public.event_account_ticket(
  p_event_id uuid,
  p_user_id uuid,
  p_admission public.guest_admission
)
returns public.guests
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_ticket public.guests;
begin
  if p_event_id is null or p_user_id is null or p_admission is null then
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('guest_ticket:' || p_event_id::text || ':' || p_user_id::text, 0));

  -- Her newest proved row here at that admission, no block holding it.
  select g.* into v_ticket
    from public.guests g
   where g.event_id = p_event_id
     and g.user_id = p_user_id
     and g.verified_at is not null
     and g.admission = p_admission
     and not public.event_block_holds_row(g)
   order by g.created_at desc, g.id desc
   limit 1;
  if not found then
    return null;
  end if;
  return v_ticket;
end;
$$;

revoke all on function public.event_account_ticket(uuid, uuid, public.guest_admission)
  from public, anon, authenticated, service_role;

comment on function public.event_account_ticket(uuid, uuid, public.guest_admission) is
  'A confirmed account''s one ticket at an album: its newest proved guest row there at the given admission that no block holds, read under an advisory lock on the event and the account, so two joins of hers answer one row. Called by create_guest and ask_to_join; the owner''s EXECUTE alone.';

-- =============================================================================================
-- 2. create_guest: a confirmed account's join answers the ticket she holds.
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
  v_held public.guests;
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

  -- ★ ONE ACCOUNT, ONE TICKET AT AN ALBUM (20260930140000): a confirmed account's join answers the ticket
  -- she already holds here at the admission the door gives her, whichever of her joins wins (on a shared
  -- phone the queue's silent join and the page's own raced, and each minted a row of hers). Taken under the
  -- account's lock, so a join racing this one waits and answers the row this one mints.
  if v_confirmed is not null then
    v_held := public.event_account_ticket(v_event.id, v_uid, v_admission);
    if v_held.id is not null then
      return jsonb_build_object(
        'session_token', v_held.session_token,
        'guest_id', v_held.id,
        'event_id', v_event.id,
        'display_name', v_held.display_name,
        'verified', true,
        'email_attached', (v_held.pending_email is not null),
        'admission', v_held.admission
      );
    end if;
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
-- 3. ask_to_join: the ask answers the ticket she holds too.
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
  v_held public.guests;
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

  -- ★ ONE ACCOUNT, ONE TICKET AT AN ALBUM (20260930140000): an ask from a second device of hers answers the
  -- ask (or the ticket) she already holds here, never a second one for the host to answer.
  v_held := public.event_account_ticket(v_event.id, p_user_id, v_admission);
  if v_held.id is not null then
    return jsonb_build_object(
      'session_token', v_held.session_token,
      'guest_id', v_held.id,
      'event_id', v_event.id,
      'display_name', null,
      'verified', true,
      'email_attached', false,
      'admission', v_held.admission
    );
  end if;

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
-- THE RACE, PROVED WITH TWO REAL SESSIONS (a throwaway postgres@17 cluster, database-security.md's pre-flight;
-- the lane's scratch holds standin.sql and race.sh): what the two mints touch (events, guests, event_blocks,
-- event_invites, auth.users) with the live predicates' bodies (pg_get_functiondef), today's two bodies from
-- 20260930100000 in one database (07269a40..., 153bed53..., the live hashes) and this file applied over them in
-- another (498aba39..., f58e5853..., 835b4e41..., as below). One confirmed account, P; the first session joins and
-- holds its transaction open 3 s, the second starts 1 s later and joins twice (the queue's and the page's).
--   album                 today's bodies                              this file
--   Public, names only    S2 answered at once: two tickets, and her   S2 waited 2.0 s for S1's commit, then answered
--                         three rows at the album (in, in, in)        S1's ticket twice: one row of hers (in)
--   letting each in       the same: three waiting asks of hers        S2 waited 2.0 s: one waiting ask of hers
--
-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An unapplied
-- migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's statements verbatim,
-- the block below (its two temp tables, the DO block and the final read) and `rollback;`. The block traps its
-- own failure into the proof table, so the rollback always runs and the call answers the rows. It rides an
-- EXISTING event (creating one trips enforce_event_limit), made Public inside the transaction, and makes its own
-- people: P, confirmed, whose joins race on a shared phone; A, who asks at letting each person in and then at
-- the list; S and T, who type names; N, signed up and unconfirmed. A single session cannot hold two
-- transactions, so the race itself is the two joins in a row (the second is the one that waited); the lock is
-- recorded from pg_locks while held.
--
-- Held on 2026-09-30 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b), red first: the block alone, on today's bodies, failed its first step
-- with "FAIL: her two joins minted two tickets" (and nothing else could run: the helper does not exist there).
-- With this file's statements (afterwards both bodies read as before, event_account_ticket did not exist, no
-- ticket-* account stood, and the event read open with its 9 guests: nothing persisted):
--   setup                                              | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b: Public, names only; P and A confirmed, N unconfirmed
--   1 two joins, one ticket                            | t | P joined twice: one row, the same ticket, answered in the mint's own shape (in, verified, nameless, no address), under an advisory lock
--   2 typed names mint as before                       | t | two joins typed Sam are two rows; an unconfirmed account typing Nell mints each time, unverified
--   3 a claimed row, and a held one                    | t | the Sam row her claim took (newer) is answered; blocked, it is passed over for her own row
--   4 one ask at the door                              | t | A joined twice at letting each person in: one waiting ask; let in, her join answers the same ticket, in
--   5 one ask at the list                              | t | A asked twice at the invite list: one waiting ask, the same ticket
--   6 grants                                           | t | event_account_ticket: INVOKER, path pinned, the owner's EXECUTE alone; create_guest and ask_to_join DEFINER, the service role's
--   hash ask_to_join(text,uuid)                        | t | f58e58536d6c447d74466a93ab4a3baf  {postgres=X/postgres,service_role=X/postgres}
--   hash create_guest(text,uuid,boolean,text,text)     | t | 498aba392ba27ebdf2d8b0911897b594  {postgres=X/postgres,service_role=X/postgres}
--   hash event_account_ticket(uuid,uuid,guest_admission) | t | 835b4e41fb9b17b66db841baca3ad5f9  {postgres=X/postgres}
-- =============================================================================================
-- create temp table ticket_proof (n serial, step text, ok boolean, detail text);
-- create temp table ctx (event_id uuid, host_id uuid);
-- insert into ctx values ('14bb4318-80cd-4eed-b219-92c097ee16c7', '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b');
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_p uuid := gen_random_uuid(); u_a uuid := gen_random_uuid(); u_n uuid := gen_random_uuid();
--   e_p text := 'ticket-p-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_a text := 'ticket-a-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_n text := 'ticket-n-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   v jsonb; w jsonb; v_n integer; v_step text := 'setup';
--   g_p uuid; g_a uuid; g_s uuid;
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   update public.events set visibility = 'open', gate = null, require_verified_email = false,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_p, e_p, now()), (u_a, e_a, now()), (u_n, e_n, null);
--   insert into public.profiles (id, email, display_name) values
--     (u_p, e_p, 'Pat Partyreel'), (u_a, e_a, 'Ari Asks'), (u_n, e_n, null)
--     on conflict (id) do update set display_name = excluded.display_name;
--   insert into ticket_proof (step, ok, detail) values ('setup', true,
--     format('event %s, host %s: Public, names only; P and A confirmed, N unconfirmed', v_event, v_host));
--
--   -- ── 1. THE FINDING: her two joins at one album (the queue's and the page's) answer one ticket. ──
--   v_step := '1 two joins, one ticket';
--   set local role service_role;
--   v := public.create_guest(v_qr, u_p);
--   w := public.create_guest(v_qr, u_p);
--   reset role;
--   if v ->> 'session_token' is distinct from w ->> 'session_token' or v ->> 'guest_id' is distinct from w ->> 'guest_id' then
--     raise exception 'FAIL: her two joins minted two tickets';
--   end if;
--   g_p := (v ->> 'guest_id')::uuid;
--   select count(*) into v_n from public.guests where event_id = v_event and user_id = u_p;
--   if v_n <> 1 then raise exception 'FAIL: % rows of hers', v_n; end if;
--   if w ->> 'admission' <> 'in' or not (w ->> 'verified')::boolean or (w ->> 'email_attached')::boolean
--      or w ->> 'display_name' is not null then
--     raise exception 'FAIL: the answer is not a mint''s shape %', w;
--   end if;
--   if not exists (select 1 from pg_locks l where l.locktype = 'advisory' and l.pid = pg_backend_pid() and l.granted) then
--     raise exception 'FAIL: no advisory lock held by the join';
--   end if;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'P joined twice: one row, the same ticket, answered in the mint''s own shape (in, verified, nameless, no address), under an advisory lock');
--
--   -- ── 2. A typed name is a row a join, as ever; so is an unconfirmed account's. ──
--   v_step := '2 typed names mint as before';
--   set local role service_role;
--   v := public.create_guest(v_qr, null, false, 'Sam');
--   w := public.create_guest(v_qr, null, false, 'Sam');
--   if v ->> 'guest_id' = w ->> 'guest_id' then raise exception 'FAIL: two typed names shared a row'; end if;
--   g_s := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_n, false, 'Nell');
--   w := public.create_guest(v_qr, u_n, false, 'Nell');
--   reset role;
--   if v ->> 'guest_id' = w ->> 'guest_id' or (w ->> 'verified')::boolean then
--     raise exception 'FAIL: an unconfirmed account''s joins %', w;
--   end if;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'two joins typed Sam are two rows; an unconfirmed account typing Nell mints each time, unverified');
--
--   -- ── 3. A claimed row of hers is her ticket; a row a block holds never is. ──
--   v_step := '3 a claimed row, and a held one';
--   -- Rows minted in one transaction share its now(): her own row is dated an hour back, so the claimed one
--   -- is plainly the newer.
--   update public.guests set created_at = now() - interval '1 hour' where id = g_p;
--   update public.guests set user_id = u_p, verified_at = now(), email = e_p, display_name = null
--    where id = g_s;  -- the phone's Sam row, taken by her proved claim, newer than her own
--   set local role service_role;
--   v := public.create_guest(v_qr, u_p);
--   reset role;
--   if (v ->> 'guest_id')::uuid <> g_s then raise exception 'FAIL: her newest proved row was not answered %', v; end if;
--   insert into public.event_blocks (event_id, guest_id) values (v_event, g_s);  -- a block on that ticket alone
--   set local role service_role;
--   v := public.create_guest(v_qr, u_p);
--   reset role;
--   if (v ->> 'guest_id')::uuid <> g_p then raise exception 'FAIL: a held row was answered %', v; end if;
--   delete from public.event_blocks where event_id = v_event and guest_id = g_s;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'the Sam row her claim took (newer) is answered; blocked, it is passed over for her own row');
--
--   -- ── 4. Letting each person in: her ask is one ask, whichever device asks, and once let in, one ticket. ──
--   v_step := '4 one ask at the door';
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true where id = v_event;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   w := public.create_guest(v_qr, u_a);
--   reset role;
--   if v ->> 'admission' <> 'waiting' or w ->> 'guest_id' <> v ->> 'guest_id' then
--     raise exception 'FAIL: her asks at the door %, %', v, w;
--   end if;
--   g_a := (v ->> 'guest_id')::uuid;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.let_in_at_door(v_event, g_a);
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   reset role;
--   if (v ->> 'guest_id')::uuid <> g_a or v ->> 'admission' <> 'in' then raise exception 'FAIL: once let in %', v; end if;
--   if (select count(*) from public.guests where event_id = v_event and user_id = u_a) <> 1 then
--     raise exception 'FAIL: two rows of A';
--   end if;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'A joined twice at letting each person in: one waiting ask; let in, her join answers the same ticket, in');
--
--   -- ── 5. The invite list: a second device's ask is the same ask. ──
--   v_step := '5 one ask at the list';
--   delete from public.guests where id = g_a;
--   update public.events set gate = 'invite' where id = v_event;
--   set local role service_role;
--   v := public.ask_to_join(v_qr, u_a);
--   w := public.ask_to_join(v_qr, u_a);
--   reset role;
--   if v ->> 'admission' <> 'waiting' or w ->> 'guest_id' <> v ->> 'guest_id' or w ->> 'session_token' <> v ->> 'session_token' then
--     raise exception 'FAIL: her asks at the list %, %', v, w;
--   end if;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'A asked twice at the invite list: one waiting ask, the same ticket');
--
--   -- ── 6. The grants: the helper is the owner's alone; the two mints as before. ──
--   v_step := '6 grants';
--   if has_function_privilege('public', 'public.event_account_ticket(uuid, uuid, public.guest_admission)', 'EXECUTE')
--      or has_function_privilege('anon', 'public.event_account_ticket(uuid, uuid, public.guest_admission)', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.event_account_ticket(uuid, uuid, public.guest_admission)', 'EXECUTE')
--      or has_function_privilege('service_role', 'public.event_account_ticket(uuid, uuid, public.guest_admission)', 'EXECUTE')
--      or (select prosecdef from pg_proc where oid = 'public.event_account_ticket(uuid, uuid, public.guest_admission)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.event_account_ticket(uuid, uuid, public.guest_admission)'::regprocedure)
--         <> array['search_path=""'] then
--     raise exception 'FAIL: the helper''s grants or mode';
--   end if;
--   select count(*) into v_n
--     from (values ('public.create_guest(text, uuid, boolean, text, text)'), ('public.ask_to_join(text, uuid)')) x(fn)
--     join pg_proc p on p.oid = x.fn::regprocedure
--    where p.prosecdef and p.proacl::text = '{postgres=X/postgres,service_role=X/postgres}'
--      and p.proconfig = array['search_path=""'];
--   if v_n <> 2 then raise exception 'FAIL: a mint lost its mode, its path or its roles (% of 2 hold)', v_n; end if;
--   insert into ticket_proof (step, ok, detail) values (v_step, true,
--     'event_account_ticket: INVOKER, path pinned, the owner''s EXECUTE alone; create_guest and ask_to_join DEFINER, the service role''s');
--
--   insert into ticket_proof (step, ok, detail)
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname in ('event_account_ticket', 'create_guest', 'ask_to_join')
--      order by 1;
-- exception when others then
--   insert into ticket_proof (step, ok, detail) values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from ticket_proof order by n;
