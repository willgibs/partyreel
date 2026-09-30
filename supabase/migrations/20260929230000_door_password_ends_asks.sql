-- =============================================================================================
-- A PASSWORD ENDS EVERY ASK AT THE DOOR (lane `crumbs-21`, crumbs-17's find).
--
-- The finding: a newcomer waiting at `approve` or the invite list whose door then becomes a password
-- keeps her waiting ticket. The password door lets her through once she unlocks (decide.ts: at a
-- password only `in` passes without it, and she is a newcomer), but every upload path still reads her
-- ticket's admission, so get_upload_context answers the private album's `private` and create_media
-- refuses her in its words: she is let through and cannot add. And the host's At the door, the pulse
-- and the bell keep counting her, at an album that asks nobody to wait.
--
-- ★ THE RULE: AT A PASSWORD THE PASSWORD IS THE DOOR'S ONLY ANSWER, SO EVERY ASK ENDS THERE. A waiting
-- ticket is an ask the host has not answered, which only a door the host answers (letting each person in,
-- the invite list) can hold. A password lets in whoever proves it and nobody else: someone who asked is
-- a newcomer like anyone, and letting her ticket in would pass the password without it (the one rule
-- for everyone already in). So the moment an album takes a password, each waiting ticket goes: her ask
-- ended with the door that took it. Nothing else moves: tickets past the door keep passing it, and a
-- block still holds its person by her account and her confirmed address (a decline is a block; a
-- waiting ticket is always a confirmed account's, and block_from_event keys such a person on those two,
-- never on the row), so Let back in later brings her back a newcomer at the password.
--   * EVERY PATH TO A PASSWORD keeps the rule, as events_door_opened keeps Public's: set_event_password
--     (which sets one and flips the door) and set_event_door('password') alike. A trigger, for the same
--     reason as that one.
--   * THE OTHER DOORS KEEP THEIR ASKS. Closed and Only me admit no newcomer at all, so an ask is still
--     the only way in and the host may answer it there or once she reopens (the door page tells her:
--     "Closing it to newcomers keeps them out"); Public lets them in; the list lets in whom it names
--     (20260929220000).
--   * ★ A ROW AN UPLOAD NAMES IS NEVER DELETED (the album's guest list and the forensic trail are
--     history, as disown_guest_rows_by_email keeps them). A waiting ticket never carries one (every
--     upload path refuses it); the belt makes that a fact of this statement, not of every other one.
--   * HER PHONE, still holding the ticket, finds it gone at its next upload (get_upload_context answers
--     no row: `invalid_session`) and joins afresh past the door as it stands (use-upload-queue.ts); after
--     she unlocks, create_guest mints her ticket `in`.
--
-- WHAT THIS FILE DOES:
--   1. events_door_to_password()   the trigger's function: SECURITY DEFINER (the host's own update
--                                  fires it and no client role writes guests), an empty search_path,
--                                  EXECUTE revoked from every client role (a trigger still fires).
--   2. events_door_to_password     AFTER UPDATE OF visibility ON events, beside events_door_opened.
--   3. The asks already stranded at a password, settled once by the same statement (none on
--      2026-09-29: the one waiting ticket live is a deleted invite-list album's).
--
-- ★ AN EXPAND: every function, signature, grant and answer stands; nothing deployed reads the new
-- object. The deployed build meets a vanished waiting ticket exactly as it met a dead token before
-- (`invalid_session`); this lane's build joins afresh on it.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: events_door_to_password does not exist, events_door_opened is as its file
--       wrote it (f5a840313ef365e0ee4a44f84fb5c710, 20260929120000), and count the asks stranded now:
--         select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname in ('events_door_opened', 'events_door_to_password');
--         select count(*) from public.guests g join public.events e on e.id = g.event_id
--          where e.visibility = 'password' and g.admission = 'waiting';   -- 0 on 2026-09-29
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The first query then reads events_door_to_password() de674959cc8263c9c2eeed43d2ba6976 with
--       {postgres, service_role}, and the trigger stands beside events_door_opened:
--         select tgname, pg_get_triggerdef(oid) from pg_trigger
--          where tgrelid = 'public.events'::regclass and tgname like 'events_door%';
--   (3) get_advisors (security). EXPECTED DELTA: none (a trigger's function, no client role runs it).
--   (4) Nothing to regenerate (types.ts does not list trigger functions).
-- =============================================================================================

-- =============================================================================================
-- 1. The rule, as the trigger's function.
-- =============================================================================================
create function public.events_door_to_password()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visibility = 'password' and old.visibility is distinct from 'password' then
    delete from public.guests g
     where g.event_id = new.id
       and g.admission = 'waiting'
       and not exists (select 1 from public.media m where m.guest_id = g.id);
  end if;
  return null;
end;
$$;

revoke all on function public.events_door_to_password() from public, anon, authenticated;

comment on function public.events_door_to_password() is
  'When an album takes a password, every ask at its door ends: each waiting ticket goes (never a row an upload names), since a password lets in whoever proves it and nobody waits on the host there. Fired by events_door_to_password on every path to a password; no client role runs it.';

-- =============================================================================================
-- 2. Every path to a password.
-- =============================================================================================
create trigger events_door_to_password
  after update of visibility on public.events
  for each row execute function public.events_door_to_password();

-- =============================================================================================
-- 3. The asks already stranded at a password, settled once by the same rule.
-- =============================================================================================
delete from public.guests g
 using public.events e
 where e.id = g.event_id
   and e.visibility = 'password'
   and g.admission = 'waiting'
   and not exists (select 1 from public.media m where m.guest_id = g.id);

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements, then
--   create temp table asks_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid, host_id uuid);
--   insert into ctx values (<an existing test event>, <its host>);
-- the block below, `select step, ok, detail from asks_proof;` and `rollback;`. The block traps its own
-- failure into the proof table, so the rollback always runs, and the call answers the rows. It rides
-- an EXISTING event (creating one trips enforce_event_limit), turned Private with letting each person in
-- inside the transaction, and makes its own people: W, who asks from two devices; X, who asks once; D,
-- who asks and is declined; A, who asks and is let in; K and Z, who ask later. It proves the grants,
-- the password ending every ask by both host acts, who stays, W's dead ticket and her fresh join past
-- the password, D's block holding and lifting, and the other doors keeping their asks.
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b), red first: the block without this file's statements failed
-- 'the password' with "4 of 4 rows stand; the room waits for 2; W's first ticket reads private" (the
-- finding, whole). With them (afterwards neither the function nor the trigger existed, the event read
-- open with no gate and no password, its 9 guests, and no asks-* account: nothing persisted):
--   setup            | t | W asked from two devices, X once, D asked and was declined, A was let in; the room waits for 2; stranded before the check: 0
--   grants           | t | the function: DEFINER, search_path pinned, no client role runs it; the trigger after update of visibility, for each row
--   the password     | t | set_event_password ended all four asks (W's two devices, X, and D's, held by her decline); A stays in and adds; the room, At the door, the pulse and the bell count nobody
--   her phone        | t | W's old ticket answers no row (the phone's invalid_session); she stands a newcomer at the password, not waiting; without the password her join is refused, with it she is minted in and adds
--   the block        | t | D's decline held by her account after her ticket went; Let back in lifts it and she stands a newcomer at the password, neither waiting nor in
--   the door         | t | back at letting each person in, K asks; set_event_door to the password (already set) ends her ask too
--   the other doors  | t | Z's ask stands through closed, Only me and the unlisting invite list; Public lets her in (admitted 1), as before
--   body             | t | de674959cc8263c9c2eeed43d2ba6976 {postgres=X/postgres,service_role=X/postgres}
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_w uuid := gen_random_uuid(); u_x uuid := gen_random_uuid(); u_d uuid := gen_random_uuid();
--   u_a uuid := gen_random_uuid(); u_k uuid := gen_random_uuid(); u_z uuid := gen_random_uuid();
--   e_w text := 'asks-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_x text := 'asks-x-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_d text := 'asks-d-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_a text := 'asks-a-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_k text := 'asks-k-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_z text := 'asks-z-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   t_w1 text; t_w2 text; t_x text; t_d text; t_a text; t_k text; t_z text; t_new text;
--   g_w1 uuid; g_w2 uuid; g_x uuid; g_d uuid; g_a uuid; g_k uuid; g_z uuid;
--   b_d uuid;
--   v jsonb; v_err text;
--   v_step text := 'setup';
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   -- Private, letting each person in, no password yet, the email step on (the gate's CHECK holds it on).
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_w, e_w, now()), (u_x, e_x, now()), (u_d, e_d, now()), (u_a, e_a, now()), (u_k, e_k, now()), (u_z, e_z, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_w, e_w, 'Wren Waiting'), (u_x, e_x, 'Xan Waiting'), (u_d, e_d, 'Dee Declined'),
--     (u_a, e_a, 'Ari Admitted'), (u_k, e_k, 'Kit Later'), (u_z, e_z, 'Zed Closed')
--     on conflict (id) do update set display_name = excluded.display_name;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_w);  t_w1 := v ->> 'session_token'; g_w1 := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'SETUP: W not held %', v; end if;
--   v := public.create_guest(v_qr, u_w);  t_w2 := v ->> 'session_token'; g_w2 := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_x);  t_x := v ->> 'session_token'; g_x := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_d);  t_d := v ->> 'session_token'; g_d := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_a);  t_a := v ->> 'session_token'; g_a := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_in_at_door(v_event, g_a);
--   v := public.block_from_event(p_event_id := v_event, p_guest_id := g_d);
--   b_d := (v ->> 'block_id')::uuid;
--   reset role;
--   if (select admission from public.guests where id = g_a) <> 'in' or b_d is null then
--     raise exception 'SETUP: A not in or D not declined';
--   end if;
--   set local role service_role;
--   if (public.event_door_counts(v_event) ->> 'waiting')::int <> 2 then
--     raise exception 'SETUP: the room waits for % (W and X expected)', public.event_door_counts(v_event);
--   end if;
--   reset role;
--   insert into asks_proof values ('setup', true, format('event %s, host %s; W asked from two devices, X once, D asked and was declined, A was let in; the room waits for 2; stranded before the check: %s',
--     v_event, v_host, (select count(*) from public.guests g join public.events e on e.id = g.event_id where e.visibility = 'password' and g.admission = 'waiting')));
--
--   -- ── 1. The grants: a trigger's function no client role runs. ──
--   v_step := 'grants';
--   if has_function_privilege('public', 'public.events_door_to_password()', 'EXECUTE')
--      or has_function_privilege('anon', 'public.events_door_to_password()', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.events_door_to_password()', 'EXECUTE')
--      or not (select prosecdef from pg_proc where oid = 'public.events_door_to_password()'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.events_door_to_password()'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the function''s grants or mode';
--   end if;
--   if not exists (select 1 from pg_trigger where tgrelid = 'public.events'::regclass and tgname = 'events_door_to_password'
--                   and pg_get_triggerdef(oid) like '%AFTER UPDATE OF visibility ON public.events FOR EACH ROW%') then
--     raise exception 'FAIL: the trigger does not stand';
--   end if;
--   insert into asks_proof values ('grants', true, 'the function: DEFINER, search_path pinned, no client role runs it; the trigger after update of visibility, for each row');
--
--   -- ── 2. Setting a password ends every ask; everyone past the door stays. ──
--   v_step := 'the password';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.set_event_password(v_event, 'asks-proof-pass');
--   reset role;
--   if exists (select 1 from public.guests where id in (g_w1, g_w2, g_x, g_d)) then
--     raise exception 'FAIL: an ask outlived the password';
--   end if;
--   if (select admission from public.guests where id = g_a) is distinct from 'in' then raise exception 'FAIL: A left'; end if;
--   set local role service_role;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> 0 then raise exception 'FAIL: the room still waits %', v; end if;
--   if (public.event_door_queue(v_event) ->> 'total')::int <> 0 then raise exception 'FAIL: At the door still lists'; end if;
--   if coalesce((public.host_door_waiting(v_host) ->> v_event::text)::int, 0) <> 0 then
--     raise exception 'FAIL: the pulse and the bell still count %', public.host_door_waiting(v_host);
--   end if;
--   if public.get_upload_context(t_a, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: A cannot add'; end if;
--   reset role;
--   insert into asks_proof values ('the password', true, 'set_event_password ended all four asks (W''s two devices, X, and D''s, held by her decline); A stays in and adds; the room, At the door, the pulse and the bell count nobody');
--
--   -- ── 3. W's phone: her old ticket names nothing; she is a newcomer at the password, and in once she proves it. ──
--   v_step := 'her phone';
--   set local role service_role;
--   if public.get_upload_context(t_w1, 'photo') is not null then raise exception 'FAIL: the old ticket still answers'; end if;
--   v := public.event_door_standing(v_event, u_w, array[t_w1]);
--   if v ->> 'door' <> 'password' or (v ->> 'waiting')::boolean or (v ->> 'in')::boolean or (v ->> 'blocked')::boolean then
--     raise exception 'FAIL: W''s standing %', v;
--   end if;
--   begin
--     perform public.create_guest(v_qr, u_w);
--     v_err := 'minted';
--   exception when check_violation then v_err := sqlerrm;
--   end;
--   if v_err not like '%password%' then raise exception 'FAIL: a join without the password %', v_err; end if;
--   v := public.create_guest(v_qr, u_w, true);
--   t_new := v ->> 'session_token';
--   if v ->> 'admission' <> 'in' or public.get_upload_context(t_new, 'photo') ->> 'visibility' <> 'open' then
--     raise exception 'FAIL: W past the password %', v;
--   end if;
--   reset role;
--   insert into asks_proof values ('her phone', true, 'W''s old ticket answers no row (the phone''s invalid_session); she stands a newcomer at the password, not waiting; without the password her join is refused, with it she is minted in and adds');
--
--   -- ── 4. D stays blocked by her account; Let back in brings her back a newcomer at the password. ──
--   v_step := 'the block';
--   set local role service_role;
--   if not (public.event_door_standing(v_event, u_d, array[t_d]) ->> 'blocked')::boolean then raise exception 'FAIL: D''s block let go'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(b_d, false);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: let back in %', v; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_d, array[t_d]);
--   if (v ->> 'blocked')::boolean or (v ->> 'waiting')::boolean or (v ->> 'in')::boolean then raise exception 'FAIL: D after the lift %', v; end if;
--   reset role;
--   insert into asks_proof values ('the block', true, 'D''s decline held by her account after her ticket went; Let back in lifts it and she stands a newcomer at the password, neither waiting nor in');
--
--   -- ── 5. The door's own act to a password ends a later ask the same way. ──
--   v_step := 'the door';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_k);  t_k := v ->> 'session_token'; g_k := (v ->> 'guest_id')::uuid;
--   reset role;
--   if (select admission from public.guests where id = g_k) <> 'waiting' then raise exception 'FAIL: K not held'; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'password');
--   reset role;
--   if not (v ->> 'ok')::boolean or exists (select 1 from public.guests where id = g_k) then
--     raise exception 'FAIL: set_event_door(password) left K %', v;
--   end if;
--   insert into asks_proof values ('the door', true, 'back at letting each person in, K asks; set_event_door to the password (already set) ends her ask too');
--
--   -- ── 6. Every other door keeps its asks: closed and Only me hold Z; Public lets her in. ──
--   v_step := 'the other doors';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_z);  t_z := v ->> 'session_token'; g_z := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'closed');
--   v := public.set_event_door(v_event, 'private');
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if (select admission from public.guests where id = g_z) is distinct from 'waiting' then
--     raise exception 'FAIL: closed, Only me or the list moved Z';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if (v ->> 'admitted')::int <> 1 or (select admission from public.guests where id = g_z) is distinct from 'in' then
--     raise exception 'FAIL: Public did not let Z in %', v;
--   end if;
--   insert into asks_proof values ('the other doors', true, 'Z''s ask stands through closed, Only me and the unlisting invite list; Public lets her in (admitted 1), as before');
-- exception when others then
--   insert into asks_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
