-- =============================================================================================
-- THE DOOR MENU SAYS WHO THE INVITE LIST WOULD LET IN (lane `crumbs-23`, build 26's red-team, NIT-C).
--
-- The finding (redteam-26 ledger, 23:01Z): at an approve-door album a confirmed newcomer waited and the
-- host had listed her address. The door menu (Settings > Who can get in) said what Public would do to
-- her ("Lets in the 1 person waiting at the door.") and said nothing of the invite list, though choosing
-- the list let her in (crumbs-17's admit, event_door_admit_listed). A consequence line is a promise, so
-- it must be exact: the menu can say who the list would let in only if the host's numbers know how many
-- of the people waiting the list names, and event_door_counts held only how many wait.
--
-- ★ THE RULE IS event_door_admit_listed's, AND THIS IS ITS READ-ONLY TWIN. A waiting person the list names
-- is an account (user_id not null) with an 'admission = waiting' row at the event, that is not the host,
-- whose address auth.users confirmed is on the list (event_door_lists_account), with no block on the
-- account or the row: the door's own predicates, so what the menu says and what choosing the list does
-- agree by construction. One account counts once however many devices it asked from. Nothing here
-- depends on the door the event is at NOW: the number is what the list WOULD let in were it the door
-- (at the list itself it is 0, since a listed newcomer never waits there). The proof at the foot asks
-- both twins about the same rows and holds them equal.
--
-- WHAT THIS FILE DOES:
--   1. event_door_waiting_listed(uuid)  the count, SECURITY DEFINER because event_door_lists_account reads
--                                       auth.users, which only a DEFINER body can ask (as its own note
--                                       says), pinned to an empty search_path, service role only. Nothing
--                                       in TypeScript calls it: it is asked from the next function.
--   2. event_door_counts                carried from 20260929120000 verbatim but for one key,
--                                       `waiting_listed`, read through the function above. Still SECURITY
--                                       INVOKER, still service role only (create or replace keeps the ACL).
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: the signature, the RETURNS and every grant of event_door_counts are
-- unchanged and its answer only grows a key (read defensively: `count(undefined)` is 0), so the deployed
-- build and this lane's build each run against either side of the apply. Before it, the lane's menu reads
-- waitingListed 0 and says nothing extra; after it, the deployed build simply ignores the new key.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the live body's md5 equals its source file's (measured 2026-09-29, the method
--       reproducing the live hash from 20260929120000's text between its dollar quotes), and the new
--       function does not exist yet:
--         event_door_counts(uuid)          cf63de76a327667cc373c3767f4523e5   INVOKER, {postgres, service_role}
--       select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public'
--          and p.proname in ('event_door_counts', 'event_door_waiting_listed')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads (md5 of each body as this file writes it):
--         event_door_waiting_listed(uuid)  6a33e98ae4637424f7f2a2d5aef257b3   DEFINER, {postgres, service_role}
--         event_door_counts(uuid)          2d6cd38de9d2af4215c702bcddce9ac2   INVOKER, {postgres, service_role}
--   (3) get_advisors (security). EXPECTED DELTA: none. The new function is SECURITY DEFINER but no client
--       role can run it (public, anon and authenticated are revoked), so it is in neither lint 0028 nor 0029.
--   (4) Regenerate src/lib/db/types.ts: event_door_waiting_listed joins the Functions (nothing calls it from
--       TypeScript); event_door_counts' return is still Json.
-- =============================================================================================

-- =============================================================================================
-- 1. The count: waiting people the list names.
-- =============================================================================================
create function public.event_door_waiting_listed(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct g.user_id)::integer
    from public.guests g
    join public.events e on e.id = g.event_id
   where g.event_id = p_event_id
     and e.deleted_at is null
     and g.admission = 'waiting'
     and g.user_id is not null
     and g.user_id is distinct from e.host_id
     -- the door's own predicates, exactly event_door_admit_listed's: the address auth.users confirmed for the
     -- account is on the list, and no block holds the account or the row
     and public.event_door_lists_account(p_event_id, g.user_id)
     and not public.event_block_holds_account(p_event_id, g.user_id)
     and not public.event_block_holds_row(g);
$$;

revoke all on function public.event_door_waiting_listed(uuid) from public, anon, authenticated;
grant execute on function public.event_door_waiting_listed(uuid) to service_role;

comment on function public.event_door_waiting_listed(uuid) is
  'How many people waiting at an event''s door its invite list names (an account once, the door''s own match: the address auth.users confirmed for it, no block on the account or the row): what choosing the list as the door would let in, the read-only twin of event_door_admit_listed. Service role only; asked by event_door_counts.';

-- =============================================================================================
-- 2. The host's numbers, with that count beside how many wait.
-- =============================================================================================
-- Carried from 20260929120000 verbatim but for the `waiting_listed` key. Still SECURITY INVOKER: its one
-- read of auth.users is the function above's. The ACL is kept by `create or replace`, and restated.
create or replace function public.event_door_counts(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ev as (
    select e.id, e.host_id from public.events e where e.id = p_event_id
  ),
  rows as (
    select g.id, g.user_id, g.display_name, g.verified_at, g.email, g.admission
      from public.guests g
      join ev on ev.id = g.event_id
     where g.user_id is distinct from ev.host_id
       and not public.event_block_holds_row(g)
  )
  select jsonb_build_object(
    'in', (select count(distinct case when r.user_id is not null then 'u' || r.user_id::text
                                      else 'g' || r.id::text end)
             from rows r
            where r.admission = 'in' and (r.user_id is not null or r.display_name is not null)),
    'in_by_name', (select count(*) from rows r
                    where r.admission = 'in' and r.user_id is null and r.verified_at is null
                      and r.display_name is not null),
    'waiting', (select count(distinct coalesce(r.user_id::text, r.id::text))
                  from rows r where r.admission = 'waiting'),
    -- ★ of those, the ones the invite list names (20260929233000): what choosing the list as the door would
    -- let in, said in the door menu before the host chooses it.
    'waiting_listed', public.event_door_waiting_listed(p_event_id),
    'invited', (select count(*) from public.event_invites i where i.event_id = p_event_id),
    'joined', (select count(*) from public.event_invites i
                where i.event_id = p_event_id
                  and exists (select 1 from rows r
                               where r.admission = 'in' and r.verified_at is not null
                                 and lower(btrim(r.email)) = i.email))
  );
$$;

revoke all on function public.event_door_counts(uuid) from public, anon, authenticated;
grant execute on function public.event_door_counts(uuid) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements, then
--   create temp table wl_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid, host_id uuid);
--   insert into ctx values (<an existing test event>, <its host>);
-- the block below, `select step, ok, detail from wl_proof;` and `rollback;`. The block traps its own
-- failure into the proof table, so the rollback always runs, and the call answers the rows. It rides an
-- EXISTING event (creating one trips enforce_event_limit), turned Private with the host approving each
-- person inside the transaction, and makes its own people: W, who asks from two devices and is listed
-- (typed in capitals, padded); X, who asks and is never listed; K, who asks, is listed and is then
-- declined; and L, listed with no ask. It proves the grants (as anon and as the host too), the key and its
-- zero, the listing, the account counted once, the block, and that the count is what choosing the list as
-- the door then lets in (event_door_admit_listed, through set_event_door).
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7; afterwards
-- event_door_waiting_listed did not exist, event_door_counts read cf63de76.., the event read open, no gate,
-- names-only, 9 guests, 0 waiting, 0 invites and 0 blocks, and no wl-* account or profile existed: nothing
-- persisted):
--   setup                      | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b; baseline waiting 0
--   grants                     | t | the count: DEFINER, search_path pinned, service role only (public, anon, authenticated refused, the host too); event_door_counts still INVOKER, pinned, service role only
--   nobody listed              | t | W, X and K wait (waiting 3), the list names none: waiting_listed 0, the key present, the other keys as before {"in": 9, "joined": 0, "invited": 0, "waiting": 3, "in_by_name": 9}
--   the list names some        | t | W (typed in capitals, padded) and K listed, X not, L listed with no waiting row: waiting 3, waiting_listed 2, nobody moved at approve
--   two devices                | t | W asked again (2 waiting row(s) of hers): waiting_listed still 2
--   a block holds              | t | K declined (a block): waiting 2 (W and X), waiting_listed 1 (W): a block on a listed newcomer leaves her out of both
--   the twins agree            | t | the read said 1; set_event_door(invite) let in 1 (W); afterwards waiting 1 (X), waiting_listed 0
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_w uuid := gen_random_uuid(); u_x uuid := gen_random_uuid(); u_k uuid := gen_random_uuid(); u_l uuid := gen_random_uuid();
--   e_w text := 'wl-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_x text := 'wl-x-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_k text := 'wl-k-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_l text := 'wl-l-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   g_w uuid; g_x uuid; g_k uuid;
--   v jsonb; v_pre integer; base_waiting integer; v_rows integer;
--   v_step text := 'setup';
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   -- Private with the host approving each person: newcomers wait, and the list is only a list here.
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          allow_videos = true, moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_w, e_w, now()), (u_x, e_x, now()), (u_k, e_k, now()), (u_l, e_l, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_w, e_w, 'Wren Waiting'), (u_x, e_x, 'Xan Unlisted'), (u_k, e_k, 'Kit Declined'), (u_l, e_l, 'Lou Listed')
--     on conflict (id) do update set display_name = excluded.display_name;
--   set local role service_role;
--   base_waiting := (public.event_door_counts(v_event) ->> 'waiting')::int;
--   reset role;
--   insert into wl_proof values ('setup', true, format('event %s, host %s; baseline waiting %s', v_event, v_host, base_waiting));
--
--   -- 1. The grants: the count no client role runs; event_door_counts exactly as it was.
--   v_step := 'grants';
--   if has_function_privilege('public', 'public.event_door_waiting_listed(uuid)', 'EXECUTE')
--      or has_function_privilege('anon', 'public.event_door_waiting_listed(uuid)', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.event_door_waiting_listed(uuid)', 'EXECUTE')
--      or not has_function_privilege('service_role', 'public.event_door_waiting_listed(uuid)', 'EXECUTE') then
--     raise exception 'FAIL: the count''s grants';
--   end if;
--   if not (select prosecdef from pg_proc where oid = 'public.event_door_waiting_listed(uuid)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.event_door_waiting_listed(uuid)'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the count is not a DEFINER pinned to an empty path';
--   end if;
--   if (select prosecdef from pg_proc where oid = 'public.event_door_counts(uuid)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.event_door_counts(uuid)'::regprocedure) <> array['search_path=""']
--      or has_function_privilege('public', 'public.event_door_counts(uuid)', 'EXECUTE')
--      or has_function_privilege('anon', 'public.event_door_counts(uuid)', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.event_door_counts(uuid)', 'EXECUTE')
--      or not has_function_privilege('service_role', 'public.event_door_counts(uuid)', 'EXECUTE') then
--     raise exception 'FAIL: event_door_counts lost its grants or its mode';
--   end if;
--   set local role anon;
--   begin
--     perform public.event_door_waiting_listed(v_event);
--     raise exception 'FAIL: anon ran the count';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform public.event_door_waiting_listed(v_event);
--     raise exception 'FAIL: the host ran the count directly';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.event_door_counts(v_event);
--     raise exception 'FAIL: the host ran the counts directly';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   insert into wl_proof values ('grants', true, 'the count: DEFINER, search_path pinned, service role only (public, anon, authenticated refused, the host too); event_door_counts still INVOKER, pinned, service role only');
--
--   -- 2. The key is there, and at zero while nobody is listed.
--   v_step := 'nobody listed';
--   set local role service_role;
--   v := public.create_guest(v_qr, u_w);
--   g_w := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: W not waiting %', v; end if;
--   v := public.create_guest(v_qr, u_x);
--   g_x := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_k);
--   g_k := (v ->> 'guest_id')::uuid;
--   v := public.event_door_counts(v_event);
--   if not (v ? 'waiting_listed') or (v ->> 'waiting')::int <> base_waiting + 3 or (v ->> 'waiting_listed')::int <> 0 then
--     raise exception 'FAIL: three wait, nobody listed: %', v;
--   end if;
--   reset role;
--   insert into wl_proof values ('nobody listed', true, format('W, X and K wait (waiting %s), the list names none: waiting_listed 0, the key present, the other keys as before %s', base_waiting + 3, (v - 'waiting_listed')::text));
--
--   -- 3. Listing names some of them; a listed address that waits nowhere is not counted.
--   v_step := 'the list names some';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array['  ' || upper(e_w) || ' ', e_k, e_l]);
--   reset role;
--   if (v ->> 'added')::int <> 3 or (v ->> 'admitted')::int <> 0 then
--     raise exception 'FAIL: the listing at approve %', v;
--   end if;
--   set local role service_role;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> base_waiting + 3 or (v ->> 'waiting_listed')::int <> 2 then
--     raise exception 'FAIL: W and K named, X not, L listed but waiting nowhere: %', v;
--   end if;
--   reset role;
--   insert into wl_proof values ('the list names some', true, 'W (typed in capitals, padded) and K listed, X not, L listed with no waiting row: waiting 3, waiting_listed 2, nobody moved at approve');
--
--   -- 4. An account that asked from two devices counts once.
--   v_step := 'two devices';
--   set local role service_role;
--   perform public.create_guest(v_qr, u_w);
--   select count(*) into v_rows from public.guests where event_id = v_event and user_id = u_w and admission = 'waiting';
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting_listed')::int <> 2 then raise exception 'FAIL: W counted more than once, % rows: %', v_rows, v; end if;
--   reset role;
--   insert into wl_proof values ('two devices', true, format('W asked again (%s waiting row(s) of hers): waiting_listed still 2', v_rows));
--
--   -- 5. A block holds: a declined newcomer the list names is not counted.
--   v_step := 'a block holds';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_k);
--   reset role;
--   set local role service_role;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> base_waiting + 2 or (v ->> 'waiting_listed')::int <> 1 then
--     raise exception 'FAIL: K declined, listed but blocked: %', v;
--   end if;
--   reset role;
--   insert into wl_proof values ('a block holds', true, 'K declined (a block): waiting 2 (W and X), waiting_listed 1 (W): a block on a listed newcomer leaves her out of both');
--
--   -- 6. The twins agree: what the read said is what choosing the list does.
--   v_step := 'the twins agree';
--   set local role service_role;
--   v_pre := (public.event_door_counts(v_event) ->> 'waiting_listed')::int;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> v_pre or v_pre <> 1 then
--     raise exception 'FAIL: the read said %, the door let in %', v_pre, v;
--   end if;
--   if (select count(*) from public.guests where id in (g_w) and admission = 'in') <> 1
--      or (select admission from public.guests where id = g_x) <> 'waiting' then
--     raise exception 'FAIL: W in and X waiting expected after the list became the door';
--   end if;
--   set local role service_role;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> base_waiting + 1 or (v ->> 'waiting_listed')::int <> 0 then
--     raise exception 'FAIL: after the list became the door: %', v;
--   end if;
--   reset role;
--   insert into wl_proof values ('the twins agree', true, format('the read said %s; set_event_door(invite) let in %s (W); afterwards waiting %s (X), waiting_listed 0', v_pre, v_pre, base_waiting + 1));
-- exception when others then
--   insert into wl_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
