-- =============================================================================================
-- A SHARED PHONE'S ANONYMOUS PHOTOS GO ONLY TO WHOEVER THEY CAN BELONG TO (lane `shared-claims`,
-- build 26's red-team, LOW, pre-existing).
--
-- The finding: on one browser an anonymous visitor typed a name and an unproved address and added a
-- photo. When somebody else signed in on that browser, claim_anonymous_uploads took the visitor's
-- ticket for her account (every ticket a browser held became the signed-in account's): she had never
-- opened that album, the claim erased the visitor's typed name and address, and the address's real
-- owner could never claim those photos. A party's shared phone makes that ordinary rather than rare.
--
-- ★ THE RULE, ONCE: whose_ticket(ticket, account) says whose an unclaimed ticket is to the account
-- about to claim it, and every claim by ticket asks it first.
--   * AN ADDRESS SETTLES IT. A ticket carrying a typed address is hers ('mine') only when that address
--     is her own confirmed one. Any other address, or an account that has confirmed none, makes it
--     somebody else's ('theirs'): it waits for that address's owner, whose claims review lists it
--     (the claim by address, 20260922120000), and no answer on this phone can take it.
--   * NO ADDRESS: THE NAME. A ticket typed under no name, or under hers, is hers ('mine'); one typed
--     under another name is asked about first ('ask'). Two names are at odds when their first words
--     differ, case and marks aside: "Dana" and "dana smith" agree, "Will" and "William" ask (a
--     question costs a tap; a wrong silent claim costs somebody her photos). Her name is her
--     profile's, else the one her sign-up carried (the guest door's typed `door_name`, Google's
--     `full_name` or `name`), so a new account on somebody else's phone is not nameless to the rule;
--     with no name anywhere, nothing she has is at odds with a ticket.
--   * A ROW AN ACCOUNT PROVED STAYS THAT ACCOUNT'S: a ticket whose account was deleted (`user_id`
--     nulled by the FK, `verified_at` kept: it "writes for nobody") goes to nobody who signs in next.
-- ★ THREE CLAIMS READ IT.
--   claim_anonymous_uploads, the silent claim at every sign-in (its signature, answer and grants
--     unchanged), takes only 'mine', and a nameless profile takes its name only from such a row;
--   claim_ticket_asks answers which held tickets were typed under another name, grouped by that name
--     with their live uploads, so the phone asks once, in plain words, before anything moves ("3 photos
--     were added on this phone as Dana. Are they yours?");
--   claim_asked_uploads takes the tickets she answered were hers, and never one that names another
--     address, whatever the answer. Its rows never name her profile: the name on them is not hers.
-- ★ A CLAIM NEVER ERASES WHAT ANOTHER GUEST TYPED. It takes only a ticket whose typed words agree with
-- the account, or one she vouched for, so a stranger's name and address stay on their row for them. On
-- a ticket that is hers it writes what the confirmed arm always wrote: her confirmed address, and the
-- account's name where the typed one was (one row never carries two names).
--
-- WHAT THIS FILE DOES:
--   1. whose_ticket(guests, uuid)        the rule: SECURITY INVOKER, stable, an empty search_path,
--                                        EXECUTE for no client role (every caller is a DEFINER body
--                                        below, which runs it as the owner), like the block's four.
--   2. claim_anonymous_uploads(text[])   carried from 20260929120000 with the rule in both arms and
--                                        in the naming read; nothing else moves.
--   3. claim_ticket_asks(text[])         authenticated-only SECURITY DEFINER read, one jsonb.
--   4. claim_asked_uploads(text[])       authenticated-only SECURITY DEFINER write.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT, AND FAILS CLOSED. partyreel.com's build (and the alias's
-- until this lane ships) calls claim_anonymous_uploads exactly as before and now takes only what can be
-- hers: a ticket typed under another name waits unclaimed and unasked until this lane's build asks.
-- Nothing deployed calls the two new functions, and this lane's build reads a missing one as nothing to
-- ask (it reaches them by name until types.ts regenerates). Apply and push go in either order.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: claim_anonymous_uploads reads as its file wrote it, and none of the three
--       new functions exists yet:
--         select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname in ('claim_anonymous_uploads', 'whose_ticket',
--            'claim_ticket_asks', 'claim_asked_uploads')
--          order by 1;
--         claim_anonymous_uploads(text[])   fc760d575b691bac9cf3e14b4f9aaf39  (20260929120000)
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads (md5(prosrc), read off these bodies inside the rolled-back check
--       and hashed from this file locally, the two agreeing):
--         claim_anonymous_uploads(text[])   4df18643c640293830666e100727e9f8  {postgres, authenticated, service_role}
--         claim_asked_uploads(text[])       908751f5e232d30cc020748b92f1c8bd  {postgres, authenticated, service_role}
--         claim_ticket_asks(text[])         a04be8ae281e5472333488a675fb5470  {postgres, authenticated, service_role}
--         whose_ticket(guests, uuid)        ba9c1ce82e0b89b84f2680fa3774ab14  {postgres, service_role}
--   (3) get_advisors (security). EXPECTED DELTA: 0029 grows by exactly two, claim_ticket_asks and
--       claim_asked_uploads (authenticated SECURITY DEFINER, claim_anonymous_uploads's class, so
--       33 -> 35); 0028 and rls_enabled_no_policy unchanged.
--   (4) Regenerate src/lib/db/types.ts: the three new functions appear, and nothing else moves.
-- =============================================================================================

-- =============================================================================================
-- 1. The rule: whose an unclaimed ticket is, to the account about to claim it.
-- =============================================================================================
-- 'mine' (hers: the claim may take it without a word), 'ask' (typed under another name: only her
-- answer moves it) or 'theirs' (another address, or an account that proved it: never hers to take).
create function public.whose_ticket(p_guest public.guests, p_uid uuid)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text;
  v_confirmed timestamptz;
  v_meta jsonb;
  v_name text;
  v_typed text;
  v_own text;
begin
  -- A row an account holds, or proved before it was deleted, is that account's.
  if p_guest.user_id is not null then
    return case when p_guest.user_id = p_uid then 'mine' else 'theirs' end;
  end if;
  if p_guest.verified_at is not null then return 'theirs'; end if;

  select u.email, u.email_confirmed_at, u.raw_user_meta_data
    into v_email, v_confirmed, v_meta
    from auth.users u
   where u.id = p_uid;

  -- ★ AN ADDRESS SETTLES IT. pending_email is stored normalised, so lower() of her confirmed address
  -- is the lookup form (the claims review's own); an unconfirmed account matches no address at all.
  if p_guest.pending_email is not null then
    if v_confirmed is not null
       and p_guest.pending_email = lower(nullif(btrim(coalesce(v_email, '')), '')) then
      return 'mine';
    end if;
    return 'theirs';
  end if;

  -- ★ NO ADDRESS: THE NAME. Hers is her profile's, else the one her sign-up carried.
  select nullif(btrim(p.display_name), '') into v_name
    from public.profiles p
   where p.id = p_uid;
  v_name := coalesce(v_name,
                     nullif(btrim(v_meta ->> 'door_name'), ''),
                     nullif(btrim(v_meta ->> 'full_name'), ''),
                     nullif(btrim(v_meta ->> 'name'), ''));

  -- Each name's first word that holds a letter or a digit, lowercased, its marks dropped:
  -- "Dana Smith" -> dana, "D'Arcy" -> darcy, "🎉 Dana" -> dana, "" -> null.
  v_typed := regexp_replace((regexp_match(lower(coalesce(p_guest.display_name, '')),
                                          '\S*[[:alnum:]]\S*'))[1], '[^[:alnum:]]', '', 'g');
  v_own := regexp_replace((regexp_match(lower(coalesce(v_name, '')),
                                        '\S*[[:alnum:]]\S*'))[1], '[^[:alnum:]]', '', 'g');
  if v_typed is null or v_own is null or v_typed = v_own then
    return 'mine';
  end if;
  return 'ask';
end;
$$;

revoke all on function public.whose_ticket(public.guests, uuid) from public, anon, authenticated;
grant execute on function public.whose_ticket(public.guests, uuid) to service_role;

-- =============================================================================================
-- 2. The silent claim takes only what is hers.
-- =============================================================================================
-- Carried from 20260929120000; the one change is whose_ticket in both arms and in the naming read.
-- Every signature, RETURNS type and grant is today's.
create or replace function public.claim_anonymous_uploads(p_session_tokens text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_count integer;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session claims nothing.
  if v_uid is null then return 0; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return 0; end if;
  -- Sanity ceiling: ~1 token per event attended; no real browser holds 1000. Bounds the array probe.
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- The stored form, exactly as create_guest writes guests.email at a confirmed mint.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  if v_confirmed is not null and v_email is not null then
    -- The naming rule, as in claim_guest_rows_by_email: a NAMELESS profile takes the name off the
    -- most recently created row being claimed, and a named profile is never overwritten.
    -- ★ SHARED PHONES (20260929234000): only off a row this claim takes as hers, so a stranger's
    -- typed name never names her account.
    if exists (select 1 from public.profiles p where p.id = v_uid and p.display_name is null) then
      select g.display_name into v_name
      from public.guests g
      where g.session_token = any (p_session_tokens)
        and g.user_id is null
        and g.admission = 'in'
        and g.display_name is not null
        and not public.event_block_holds_row(g)
        and not public.event_block_holds_account(g.event_id, v_uid)
        and public.whose_ticket(g, v_uid) = 'mine'
      order by g.created_at desc
      limit 1;

      if v_name is not null then
        update public.profiles
           set display_name = v_name
         where id = v_uid and display_name is null;
      end if;
    end if;

    -- ★ GUEST BY UPLOAD (2026-09-23): the stamp is unchanged; the count is of stamped rows that
    -- carry a live upload (the RETURNING ids, then one EXISTS each).
    -- ★ THE SNEAKY BLOCK (20260928120000): a ticket a block holds, and every ticket at an event that
    -- blocked this caller, stays unclaimed (the person cannot claim), and the name above comes only
    -- from a row this update will stamp.
    -- ★ THE DOOR (20260929120000): only a ticket past the door, so a claim carries no one through a gate.
    -- ★ SHARED PHONES (20260929234000): only a ticket that is hers. One typed under another name
    -- waits for her answer (claim_ticket_asks, claim_asked_uploads); one naming another address waits
    -- for its owner. The fit is read after the naming above, so a profile it just named is hers.
    with claimed as (
      update public.guests g
         set user_id = v_uid,
             verified_at = now(),
             email = v_email,
             pending_email = null,
             pending_email_at = null,
             display_name = null
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
         and public.whose_ticket(g, v_uid) = 'mine'
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  else
    -- Unchanged from 20260609120000: an unconfirmed session stamps ownership and nothing else.
    -- ★ Counted the same way as the arm above (GUEST BY UPLOAD, 2026-09-23).
    -- ★ SHARED PHONES (20260929234000): the same rule, under which an unconfirmed session matches no
    -- address, so it only ever takes a ticket that carries none.
    with claimed as (
      update public.guests g
         set user_id = v_uid
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
         and public.whose_ticket(g, v_uid) = 'mine'
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  end if;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;
grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;

-- =============================================================================================
-- 3. The ask: which held tickets were typed under another name.
-- =============================================================================================
-- ★ ONE JSONB, NEVER A SET: `[{"name", "uploads", "tokens"}]`, one entry a typed name (case and
-- spaces aside), newest first, so the phone asks once a name, however many albums it spans. `tokens`
-- are the caller's own, handed back so the answer names exactly what it moves; nothing else about the
-- rows leaves (never an address, an album or an id). Bounded like the claim.
-- ★ ONLY A CONFIRMED ACCOUNT IS ASKED: its answer moves photos into it (claim_asked_uploads, which
-- takes nothing for anyone else), so an unconfirmed session is asked nothing.
-- ★ ONLY A TICKET WITH A LIVE UPLOAD: an empty ticket has nothing to ask about (the claim's own count).
create function public.claim_ticket_asks(p_session_tokens text[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_confirmed timestamptz;
  v_asks jsonb;
begin
  if v_uid is null then return '[]'::jsonb; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return '[]'::jsonb; end if;
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  select u.email_confirmed_at into v_confirmed from auth.users u where u.id = v_uid;
  if v_confirmed is null then return '[]'::jsonb; end if;

  select coalesce(jsonb_agg(jsonb_build_object('name', a.name, 'uploads', a.uploads,
                                               'tokens', a.tokens)
                            order by a.newest desc), '[]'::jsonb)
    into v_asks
    from (
      select btrim((array_agg(g.display_name order by g.created_at desc, g.id desc))[1]) as name,
             sum(m.n)::integer as uploads,
             array_agg(g.session_token order by g.created_at desc, g.id desc) as tokens,
             max(g.created_at) as newest
        from public.guests g
        cross join lateral (
          select count(*)::integer as n
            from public.media x
           where x.guest_id = g.id and x.status <> 'removed'
        ) m
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
         and public.whose_ticket(g, v_uid) = 'ask'
         and m.n > 0
       group by lower(btrim(g.display_name))
    ) a;

  return v_asks;
end;
$$;

revoke all on function public.claim_ticket_asks(text[]) from public, anon;
grant execute on function public.claim_ticket_asks(text[]) to authenticated;

-- =============================================================================================
-- 4. Her answer: the tickets she said were hers.
-- =============================================================================================
-- ★ NEVER ANOTHER ADDRESS, WHATEVER THE ANSWER: an address has its owner's own way home (the claims
-- review), and a wrong "yes" here would close it. So this takes every ticket among these that is not
-- 'theirs' (the ones she was asked about, and any that were hers anyway), past the door and no block,
-- stamped exactly as the silent claim's confirmed arm stamps.
-- ★ IT NEVER NAMES HER PROFILE: the name on these rows is not hers (that is why she was asked).
-- ★ A CONFIRMED ACCOUNT ONLY, as the ask; the count is the claim's own (rows with a live upload).
create function public.claim_asked_uploads(p_session_tokens text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_count integer;
begin
  if v_uid is null then return 0; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return 0; end if;
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  v_email := nullif(btrim(coalesce(v_email, '')), '');
  if v_confirmed is null or v_email is null then return 0; end if;

  with claimed as (
    update public.guests g
       set user_id = v_uid,
           verified_at = now(),
           email = v_email,
           pending_email = null,
           pending_email_at = null,
           display_name = null
     where g.session_token = any (p_session_tokens)
       and g.user_id is null
       and g.admission = 'in'
       and not public.event_block_holds_row(g)
       and not public.event_block_holds_account(g.event_id, v_uid)
       and public.whose_ticket(g, v_uid) <> 'theirs'
    returning id
  )
  select count(*)::integer into v_count
    from claimed c
   where exists (
     select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
   );

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.claim_asked_uploads(text[]) from public, anon;
grant execute on function public.claim_asked_uploads(text[]) to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, the block below (its two temp tables, the DO block and the final read) and
-- `rollback;`. The block traps its own failure into the proof table, so the rollback always runs and
-- the call answers the rows. It rides two EXISTING albums (creating one trips enforce_event_limit),
-- made Public and names-only inside the transaction, and makes its own people and the tickets a
-- shared phone could hold: P, who signs in on it (the red-team's second person); W, whose address a
-- visitor typed; S, a named account; N and G, new accounts whose names ride their sign-up (the
-- door's typed name, Google's); Z, with no name anywhere; Q, unconfirmed; B, blocked at one album.
-- It proves, as each would call it: the grants; the red-team's walk (nothing moves, the visitor's
-- ticket keeps her typed name and W's address, Dana's tickets are one ask, a yes cannot take the
-- address, and W claims it from her own claims review); the answer; the silent claim's three ways to
-- be hers and its refusals (another name, a deleted account's proved row, a waiting row); the names a
-- new account carries; an unconfirmed session; a block; the bounds and anon.
--
-- The same walk on TODAY's function (fc760d575b691bac9cf3e14b4f9aaf39), rolled back the same way,
-- is the red this file turns green: P's sign-in took both tickets (the claim answered 2), the
-- visitor's row read user_id P, display_name NULL, pending_email NULL, Dana's read user_id P, and
-- W's claims review listed 0.
--
-- Held on 2026-09-29 against the live schema (afterwards claim_anonymous_uploads read
-- fc760d575b691bac9cf3e14b4f9aaf39, none of the three new functions existed, and no claims-*
-- account, block or upload remained: nothing persisted):
--   setup            | t | albums 14bb4318-80cd-4eed-b219-92c097ee16c7 and 340fcc7b-6c41-48f6-a143-6ef9f6724f4b; 21 tickets
--   grants           | t | whose_ticket the service role's alone; the three claims authenticated-only, anon and PUBLIC refused
--   the shared phone | t | P takes nothing: the visitor's ticket keeps Visitor Vee and W's address, Dana's three are one ask (dana, 3 photos, 2 tickets, the empty one not asked); a yes cannot take the address; W lists and claims it from her own account
--   the answer       | t | a yes stamps both tickets like the confirmed arm (2 counted, one ticket's two photos one row), and names no profile
--   sam              | t | sam and Sam agree, his own address goes whatever its name, a nameless ticket goes; the empty one is stamped and not counted (3); Samuel is asked; a deleted account's proved row and a waiting row are neither taken, asked nor answered
--   new accounts     | t | door_name Nia takes Nia and asks Xavi; Google's Gus Grant takes gus (named from it) and asks Yara; with no name anywhere the newest (Amy) names the profile and Zed is asked
--   unconfirmed      | t | Quin's name-only ticket stamped user_id alone; its own unproved address stays; Other not asked; the yes takes nothing
--   the block        | t | Bo, blocked at the album, takes, is asked and answers nothing there
--   bounds           | t | 1001 tokens refused on both new calls, an empty call answers nothing, anon runs neither, no client role runs the rule
--   hash claim_anonymous_uploads(text[]) | 4df18643c640293830666e100727e9f8  postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres
--   hash claim_asked_uploads(text[])     | 908751f5e232d30cc020748b92f1c8bd  postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres
--   hash claim_ticket_asks(text[])       | a04be8ae281e5472333488a675fb5470  postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres
--   hash whose_ticket(guests,uuid)       | ba9c1ce82e0b89b84f2680fa3774ab14  postgres=X/postgres,service_role=X/postgres
-- =============================================================================================
-- create temp table claims_proof (step text, ok boolean, detail text);
-- create temp table tk (key text primary key, guest_id uuid, token text);
--
-- do $$
-- declare
--   v_e1 uuid := '14bb4318-80cd-4eed-b219-92c097ee16c7';
--   v_e2 uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b';
--   u_p uuid := gen_random_uuid(); u_w uuid := gen_random_uuid(); u_s uuid := gen_random_uuid();
--   u_n uuid := gen_random_uuid(); u_g uuid := gen_random_uuid(); u_z uuid := gen_random_uuid();
--   u_q uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
--   e_p text := 'claims-p-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_w text := 'claims-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_s text := 'claims-s-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_n text := 'claims-n-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_g text := 'claims-g-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_z text := 'claims-z-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_q text := 'claims-q-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_b text := 'claims-b-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   r record; v jsonb; v_n integer; v_txt text; v_gid uuid; v_tok text; i integer; v_arr text[]; v_arr2 text[];
--   v_step text := 'setup';
-- begin
--   -- Two existing albums (creating one trips enforce_event_limit), Public and names-only inside the
--   -- transaction: the doors every ticket below walked through.
--   update public.events set visibility = 'open', gate = null, require_verified_email = false,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null
--    where id in (v_e1, v_e2);
--
--   insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
--     (u_p, e_p, now(), null), (u_w, e_w, now(), null), (u_s, e_s, now(), null),
--     (u_n, e_n, now(), '{"door_name": "Nia"}'::jsonb),
--     (u_g, e_g, now(), '{"full_name": "Gus Grant", "name": "Gus Grant"}'::jsonb),
--     (u_z, e_z, now(), null), (u_q, e_q, null, null), (u_b, e_b, now(), null);
--   insert into public.profiles (id, email, display_name) values
--     (u_p, e_p, 'Parker Proof'), (u_w, e_w, 'Willa Owner'), (u_s, e_s, 'Sam Lee'),
--     (u_n, e_n, null), (u_g, e_g, null), (u_z, e_z, null), (u_q, e_q, 'Quin Unconfirmed'),
--     (u_b, e_b, 'Bo Blocked')
--     on conflict (id) do update set display_name = excluded.display_name;
--   insert into public.event_blocks (event_id, user_id, display_name) values (v_e1, u_b, 'Bo Blocked');
--
--   -- Every ticket a phone could hold: its album, its typed name and address, whether an account proved
--   -- it, the door, its live uploads, and how many minutes old it is.
--   for r in select * from (values
--       ('v',      v_e1, 'Visitor Vee', lower(e_w), false, 'in',      1, 60),
--       ('d',      v_e1, 'Dana',        null,       false, 'in',      1, 50),
--       ('d2',     v_e2, 'dana ',       null,       false, 'in',      2, 40),
--       ('dempty', v_e2, 'Dana',        null,       false, 'in',      0, 30),
--       ('s',      v_e1, 'sam',         null,       false, 'in',      1, 59),
--       ('sempty', v_e2, 'Sam',         null,       false, 'in',      0, 58),
--       ('sp',     v_e2, 'Samuel',      null,       false, 'in',      1, 57),
--       ('own',    v_e2, 'Whoever',     lower(e_s), false, 'in',      1, 56),
--       ('anon',   v_e1, null,          null,       false, 'in',      1, 55),
--       ('del',    v_e1, null,          null,       true,  'in',      1, 54),
--       ('wait',   v_e1, 'Wes',         null,       false, 'waiting', 1, 53),
--       ('nia',    v_e1, 'Nia',         null,       false, 'in',      1, 20),
--       ('x',      v_e2, 'Xavi',        null,       false, 'in',      1, 19),
--       ('gus',    v_e1, 'gus',         null,       false, 'in',      1, 18),
--       ('y',      v_e2, 'Yara',        null,       false, 'in',      1, 17),
--       ('z1',     v_e1, 'Zed',         null,       false, 'in',      1, 16),
--       ('z2',     v_e2, 'Amy',         null,       false, 'in',      1, 15),
--       ('q1',     v_e1, 'Quin',        null,       false, 'in',      1, 14),
--       ('q2',     v_e2, 'Quin',        lower(e_q), false, 'in',      1, 13),
--       ('q3',     v_e2, 'Other',       null,       false, 'in',      1, 12),
--       ('b',      v_e1, 'Bo',          null,       false, 'in',      1, 11)
--     ) x(key, event_id, name, pending, proved, admission, photos, age)
--   loop
--     insert into public.guests (event_id, session_token, display_name, pending_email, pending_email_at,
--                                verified_at, admission, created_at)
--     values (r.event_id, md5(r.key || random()) || md5(r.key || random()), r.name, r.pending,
--             case when r.pending is not null then now() end, case when r.proved then now() end,
--             r.admission::public.guest_admission, now() - make_interval(mins => r.age))
--     returning id, session_token into v_gid, v_tok;
--     insert into tk values (r.key, v_gid, v_tok);
--     for i in 1 .. r.photos loop
--       insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--       values (r.event_id, v_gid, 'photo', 'events/' || r.event_id || '/claims-' || r.key || '-' || i, 100, 'approved');
--     end loop;
--   end loop;
--   insert into claims_proof values ('setup', true, format('albums %s and %s; %s tickets', v_e1, v_e2, (select count(*) from tk)));
--
--   -- ── 1. The grants. ──
--   v_step := 'grants';
--   if has_function_privilege('anon', 'public.whose_ticket(public.guests, uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.whose_ticket(public.guests, uuid)', 'execute')
--      or not has_function_privilege('service_role', 'public.whose_ticket(public.guests, uuid)', 'execute') then
--     raise exception 'FAIL: whose_ticket is not service-role only';
--   end if;
--   for v_txt in select unnest(array['public.claim_anonymous_uploads(text[])',
--       'public.claim_ticket_asks(text[])', 'public.claim_asked_uploads(text[])']) loop
--     if has_function_privilege('anon', v_txt, 'execute')
--        or not has_function_privilege('authenticated', v_txt, 'execute') then
--       raise exception 'FAIL: % is not authenticated-only', v_txt;
--     end if;
--   end loop;
--   if exists (select 1 from pg_proc p, unnest(p.proacl) a
--               where p.oid in ('public.claim_anonymous_uploads(text[])'::regprocedure,
--                               'public.claim_ticket_asks(text[])'::regprocedure,
--                               'public.claim_asked_uploads(text[])'::regprocedure,
--                               'public.whose_ticket(public.guests, uuid)'::regprocedure)
--                 and (a::text like '=%' or a::text like 'anon=%')) then
--     raise exception 'FAIL: PUBLIC or anon holds EXECUTE';
--   end if;
--   insert into claims_proof values ('grants', true, 'whose_ticket the service role''s alone; the three claims authenticated-only, anon and PUBLIC refused');
--
--   -- ── 2. The red-team's walk: P signs in on the phone that holds the visitor's and Dana's tickets. ──
--   v_step := 'the shared phone';
--   v_arr := array(select token from tk where key in ('v', 'd', 'd2', 'dempty'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_p, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL: P''s sign-in took % tickets', v_n; end if;
--   select g.user_id, g.display_name, g.pending_email into r from public.guests g where g.id = (select guest_id from tk where key = 'v');
--   if r.user_id is not null or r.display_name <> 'Visitor Vee' or r.pending_email <> lower(e_w) then
--     raise exception 'FAIL: the visitor''s ticket moved or lost what she typed (%)', r;
--   end if;
--   if (select count(*) from public.guests g join tk on tk.guest_id = g.id where tk.key in ('d', 'd2', 'dempty') and g.user_id is null and g.display_name is not null) <> 3 then
--     raise exception 'FAIL: Dana''s tickets moved';
--   end if;
--   if jsonb_array_length(v) <> 1 or v -> 0 ->> 'name' <> 'dana' or (v -> 0 ->> 'uploads')::int <> 3
--      or jsonb_array_length(v -> 0 -> 'tokens') <> 2
--      or v -> 0 -> 'tokens' ->> 0 <> (select token from tk where key = 'd2')
--      or v -> 0 -> 'tokens' ->> 1 <> (select token from tk where key = 'd') then
--     raise exception 'FAIL: the ask %', v;
--   end if;
--   v_arr := array(select token from tk where key = 'v');
--   set local role authenticated;
--   v_n := public.claim_asked_uploads(v_arr);
--   reset role;
--   if v_n <> 0 or (select user_id from public.guests where id = (select guest_id from tk where key = 'v')) is not null then
--     raise exception 'FAIL: a yes took another address (%)', v_n;
--   end if;
--   -- W, the address's owner, finds it in her claims review and claims it from her own account.
--   v_gid := (select guest_id from tk where key = 'v');
--   perform set_config('request.jwt.claims', json_build_object('sub', u_w, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_n from public.list_guest_rows_by_email() x where x.guest_id = v_gid and x.display_name = 'Visitor Vee';
--   v_n := v_n * 10 + public.claim_guest_rows_by_email(array[v_e1]);
--   reset role;
--   if v_n <> 11 or (select user_id from public.guests where id = (select guest_id from tk where key = 'v')) is distinct from u_w then
--     raise exception 'FAIL: W could not claim her row later (%)', v_n;
--   end if;
--   insert into claims_proof values ('the shared phone', true, 'P takes nothing: the visitor''s ticket keeps Visitor Vee and W''s address, Dana''s three are one ask (dana, 3 photos, 2 tickets, the empty one not asked); a yes cannot take the address; W lists and claims it from her own account');
--
--   -- ── 3. Her answer takes what she said was hers. ──
--   v_step := 'the answer';
--   v_arr := array(select token from tk where key in ('d', 'd2'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_p, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_asked_uploads(v_arr);
--   reset role;
--   select count(*) filter (where g.user_id = u_p and g.verified_at is not null and g.email = e_p and g.display_name is null and g.pending_email is null)
--     into i from public.guests g join tk on tk.guest_id = g.id where tk.key in ('d', 'd2');
--   if v_n <> 2 or i <> 2 or (select display_name from public.profiles where id = u_p) <> 'Parker Proof' then
--     raise exception 'FAIL: the yes (% moved, % stamped)', v_n, i;
--   end if;
--   insert into claims_proof values ('the answer', true, 'a yes stamps both tickets like the confirmed arm (2 counted, one ticket''s two photos one row), and names no profile');
--
--   -- ── 4. Sam: his own name and his own address go silently; another name waits for him. ──
--   v_step := 'sam';
--   v_arr := array(select token from tk where key in ('s', 'sempty', 'sp', 'own', 'anon', 'del', 'wait'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_s, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   select string_agg(tk.key, ',' order by tk.key) into v_txt
--     from public.guests g join tk on tk.guest_id = g.id where g.user_id = u_s;
--   if v_n <> 3 or v_txt <> 'anon,own,s,sempty' then
--     raise exception 'FAIL: Sam''s silent claim (% counted, took %)', v_n, v_txt;
--   end if;
--   select g.email, g.pending_email, g.display_name into r from public.guests g where g.id = (select guest_id from tk where key = 'own');
--   if r.email <> e_s or r.pending_email is not null or r.display_name is not null then
--     raise exception 'FAIL: his own address (%)', r;
--   end if;
--   if jsonb_array_length(v) <> 1 or v -> 0 ->> 'name' <> 'Samuel' or (v -> 0 ->> 'uploads')::int <> 1 then
--     raise exception 'FAIL: Sam''s ask %', v;
--   end if;
--   v_arr := array(select token from tk where key in ('sp', 'del', 'wait'));
--   set local role authenticated;
--   v_n := public.claim_asked_uploads(v_arr);
--   reset role;
--   if v_n <> 1 or (select user_id from public.guests where id = (select guest_id from tk where key = 'sp')) is distinct from u_s
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'del')) is not null
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'wait')) is not null
--      or (select display_name from public.profiles where id = u_s) <> 'Sam Lee' then
--     raise exception 'FAIL: Sam''s yes (%)', v_n;
--   end if;
--   insert into claims_proof values ('sam', true, 'sam and Sam agree, his own address goes whatever its name, a nameless ticket goes; the empty one is stamped and not counted (3); Samuel is asked; a deleted account''s proved row and a waiting row are neither taken, asked nor answered');
--
--   -- ── 5. A new account is not nameless to the rule: the door's typed name, Google's. ──
--   v_step := 'new accounts';
--   v_arr := array(select token from tk where key in ('nia', 'x'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_n, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   reset role;
--   if v_n <> 1 or (select display_name from public.profiles where id = u_n) <> 'Nia'
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'x')) is not null then
--     raise exception 'FAIL: the door''s name (% moved)', v_n;
--   end if;
--   v_arr := array(select token from tk where key in ('gus', 'y'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_g, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   if v_n <> 1 or (select display_name from public.profiles where id = u_g) <> 'gus'
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'y')) is not null
--      or v -> 0 ->> 'name' <> 'Yara' then
--     raise exception 'FAIL: Google''s name (% moved, %)', v_n, v;
--   end if;
--   -- No name anywhere: the newest ticket names the profile (today's rule), and the rest is then asked.
--   v_arr := array(select token from tk where key in ('z1', 'z2'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_z, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   if v_n <> 1 or (select display_name from public.profiles where id = u_z) <> 'Amy'
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'z1')) is not null
--      or v -> 0 ->> 'name' <> 'Zed' then
--     raise exception 'FAIL: a nameless account (% moved, %)', v_n, v;
--   end if;
--   insert into claims_proof values ('new accounts', true, 'door_name Nia takes Nia and asks Xavi; Google''s Gus Grant takes gus (named from it) and asks Yara; with no name anywhere the newest (Amy) names the profile and Zed is asked');
--
--   -- ── 6. An unconfirmed session: no address is ever hers, and nothing is asked. ──
--   v_step := 'unconfirmed';
--   v_arr := array(select token from tk where key in ('q1', 'q2', 'q3'));
--   v_arr2 := array(select token from tk where key in ('q2', 'q3'));
--   perform set_config('request.jwt.claims', json_build_object('sub', u_q, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   i := public.claim_asked_uploads(v_arr2);
--   reset role;
--   select g.user_id, g.verified_at, g.display_name into r from public.guests g where g.id = (select guest_id from tk where key = 'q1');
--   if v_n <> 1 or r.user_id is distinct from u_q or r.verified_at is not null or r.display_name <> 'Quin'
--      or v <> '[]'::jsonb or i <> 0
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'q2')) is not null
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'q3')) is not null then
--     raise exception 'FAIL: unconfirmed (%, %, %)', v_n, v, i;
--   end if;
--   insert into claims_proof values ('unconfirmed', true, 'Quin''s name-only ticket stamped user_id alone; its own unproved address stays; Other not asked; the yes takes nothing');
--
--   -- ── 7. A block holds: no claim, ask or answer reaches a ticket at an event that blocked her. ──
--   v_step := 'the block';
--   v_arr := array(select token from tk where key = 'b');
--   perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   i := public.claim_asked_uploads(v_arr);
--   reset role;
--   if v_n <> 0 or v <> '[]'::jsonb or i <> 0
--      or (select user_id from public.guests where id = (select guest_id from tk where key = 'b')) is not null then
--     raise exception 'FAIL: a block (%, %, %)', v_n, v, i;
--   end if;
--   insert into claims_proof values ('the block', true, 'Bo, blocked at the album, takes, is asked and answers nothing there');
--
--   -- ── 8. The bounds, and anon. ──
--   v_step := 'bounds';
--   v_arr := array(select md5(k::text) || md5(k::text) from generate_series(1, 1001) k);
--   perform set_config('request.jwt.claims', json_build_object('sub', u_s, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform public.claim_ticket_asks(v_arr);
--     raise exception 'FAIL: 1001 tokens asked';
--   exception when program_limit_exceeded then null;
--   end;
--   begin
--     perform public.claim_asked_uploads(v_arr);
--     raise exception 'FAIL: 1001 tokens answered';
--   exception when program_limit_exceeded then null;
--   end;
--   if public.claim_ticket_asks(null) <> '[]'::jsonb or public.claim_ticket_asks('{}') <> '[]'::jsonb
--      or public.claim_asked_uploads(null) <> 0 then
--     raise exception 'FAIL: an empty call';
--   end if;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   set local role anon;
--   begin
--     perform public.claim_ticket_asks(array['x']);
--     raise exception 'FAIL: anon asked';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.claim_asked_uploads(array['x']);
--     raise exception 'FAIL: anon answered';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.whose_ticket(null::public.guests, null);
--     raise exception 'FAIL: anon ran the rule';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   set local role authenticated;
--   begin
--     perform public.whose_ticket(null::public.guests, null);
--     raise exception 'FAIL: authenticated ran the rule';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   insert into claims_proof values ('bounds', true, '1001 tokens refused on both new calls, an empty call answers nothing, anon runs neither, no client role runs the rule');
-- exception when others then
--   insert into claims_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
--
-- select step, ok, detail from claims_proof
-- union all
-- select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || coalesce(array_to_string(p.proacl, ','), '<default>')
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname in ('claim_anonymous_uploads', 'whose_ticket', 'claim_ticket_asks', 'claim_asked_uploads');
