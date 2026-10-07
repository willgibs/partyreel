-- =============================================================================================
-- LET IN, FROM BLOCKED (lane `host-moments-wiring`; host-moments r1, Will 2026-10-07, `let-back=straight`: "Let back
-- in lets him in". For a declined newcomer the act is Let in: one press, and the album opens for him where he waits.)
--
-- Today `let_back_in` lifts the block and leaves a declined newcomer's ask waiting at a door the host answers, so a host
-- who changes her mind reads "They'll be back at the door, and you can let them in from there" and presses Let in a
-- second time, at the door. Undoing a decline means yes (the board's reason, the one Will picked), so the press that
-- lifts it can be the answer itself.
--
-- WHAT THIS FILE DOES:
--   1. let_back_in(uuid, boolean, boolean)   DROP + CREATE, one new argument, `p_let_in` (default false). The body is
--                                            20261003220000's verbatim but for one arm after the door's own two: with
--                                            p_let_in, every waiting row this block named that no block still holds
--                                            goes in, read through the door's asks (`event_door_asks`, the one
--                                            reading of them), counted as people under a new answer key, `let_in`.
--                                            Authenticated only, as before; its grants and its comment are restated,
--                                            since a drop takes both.
--
-- ★ AN EXPAND: milestone 38's build (partyreel.com and the alias, both on this database) calls
-- `let_back_in(p_block_id, p_restore)`, which now finds this function with p_let_in false: the body it runs is today's
-- to the letter, and the answer is today's keys plus `let_in` (always 0 for it), which its reader never asks for. So
-- that build keeps telling its host "back at the door", and keeps doing it. No contract follows: a call that leaves
-- p_let_in out means today's lift for good (this lane's build sends it false for every lift that is not a Let in).
-- ★ APPLY BEFORE THIS LANE'S BUILD DEPLOYS: its `letBackIn` sends p_let_in on every call, and PostgREST finds an RPC by
-- the names it is sent (database-security.md), so without this file every lift from that build is a PGRST202.
--
-- ★ A DROP, NEVER A SECOND OVERLOAD: PostgREST would find both `let_back_in(uuid, boolean)` and this one for the two
-- names the deployed build sends and refuse the call (PGRST203). The drop and the create are one transaction, so no
-- call meets neither.
--
-- ★ WHO IT LETS IN: exactly the rows this block named (`event_block_names_row`: the row, the account, an address a row
-- proved), and of those only an ask no block still holds, the one way every door act lets an ask in
-- (migration-guards.test.ts refuses any other). Someone already in is untouched (a gate never stopped her); a stranger's
-- ask is never this block's; a password ended her ask (20260929230000), so there she meets it like anyone new and
-- `let_in` is 0; at Public and at an invite list that names her the door's own arms let her in first, as today, and
-- count under `admitted`. At Only me her ask stands and goes in, as the host's Let in at the door does there, and she
-- meets the closed album until the host opens it (the app says so before the press).
--
-- ★ THE LOCK ORDER IS TODAY'S, with one more set of guests rows at its end (database-security.md): with p_restore her
-- profiles row FOR UPDATE first, then the block's media rows FOR UPDATE (the sums' statement trigger re-takes her row,
-- held already: free), then the block's own row (its delete), then guests rows (the Public door's arm, the invite list's,
-- and now p_let_in's), on which no trigger takes a lock (`guests_album_*` watch the name and address columns, never
-- `admission`). The new arm takes no profiles, media or event row. So storage-sums-signal's change this wave
-- (remove_my_upload's already-removed arm takes her profiles row first, 20261007022000) closes the one deadlock against
-- this body exactly as against today's: both sides then take her row, then the media.
--
-- LOCKS AT APPLY: catalog writes for one function. No table is touched.
--
-- ADVISORS (security): EXPECTED DELTA: none. let_back_in leaves lint 0029 with its drop and returns to it as the same
-- authenticated SECURITY DEFINER, authorized inside on auth.uid() and ownership; no table, policy or anon grant moves.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: let_back_in(uuid,boolean)'s md5(prosrc) reads 1c99e15debf3ab3b520409c2aae94d4b (20261003220000's
--       body between its dollar quotes, measured live 2026-10-07), and let_back_in(uuid,boolean,boolean) does not exist:
--         select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname = 'let_back_in';
--   (2) The rolled-back proof at the foot, in one execute_sql call: red without this file's statements, green with.
--   (3) Apply verbatim. The query in (1) then reads one row: let_back_in(uuid,boolean,boolean), the hash the proof's
--       last row prints, true, {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}.
--   (4) get_advisors (security): the delta above.
--   (5) Regenerate src/lib/db/types.ts (let_back_in's Args gain `p_let_in?: boolean`), then drop the lane's typed seam,
--       `liftDb` in src/lib/db/mutations/event-blocks.ts.
-- =============================================================================================

drop function public.let_back_in(uuid, boolean);

create function public.let_back_in(
  p_block_id uuid,
  p_restore boolean default false,
  p_let_in boolean default false
)
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
  v_media public.media;
  v_target public.media_status;
  v_restored integer := 0;
  v_admitted integer;
  v_opened integer := 0;
  v_let_in integer := 0;
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
    -- The host's profiles row first, as every capacity decision takes it (an upload making room from Deleted holds it
    -- while it takes these rows, so the two never act on one row at once).
    select * into v_profile from public.profiles where id = v_event.host_id for update;
    -- ★ RESTORE ALWAYS FITS (20261003220000): what the block put in Deleted already counts in what she stores, so each
    -- comes back with no gate (`no_room` stays in the answer, always 0, for its callers). Never one that has left for
    -- good (asked: its CHECK would refuse the write) nor one past its 30 days (leaving: out of her count).
    for v_media in
      select m.*
        from public.media m
       where m.id = any (v_block.removed_media_ids)
         and m.event_id = v_block.event_id
         and m.status = 'removed'
         and m.removed_at = v_block.created_at
         and m.removed_at >= now() - interval '30 days'
         and not m.removed_by_uploader
         and not m.removed_by_admin
         and m.purge_asked_at is null
         and m.legal_hold_at is null
       order by m.created_at desc, m.id desc
       for update
    loop
      v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
      if v_target = 'removed' then
        v_target := 'approved'::public.media_status;
      end if;
      -- Back in her album, the row is hers again: no reduce's flag outlives the removal (as restore_media).
      update public.media set status = v_target, removed_at = null, removed_by_system = false
       where id = v_media.id and status = 'removed';
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

  -- ★ HER ANSWER, IN THE SAME PRESS (20261007020000, host-moments r1 `let-back=straight`): with p_let_in, the ask this
  -- block held is answered yes, as let_in_at_door answers one: every waiting row of the person (she may have asked from
  -- two devices), here each one this block named that no block still holds, read through the door's asks. After the
  -- door's own two arms, so an ask Public or the list already let in is theirs and counts under `admitted`.
  if coalesce(p_let_in, false) then
    with let_in as (
      update public.guests g
         set admission = 'in'
        from public.event_door_asks(v_block.event_id) a
       where g.id = a.guest_id
         and public.event_block_names_row(v_block.user_id, v_block.email, v_block.guest_id, g)
      returning coalesce(g.user_id::text, g.id::text) as person
    )
    select count(distinct l.person)::integer into v_let_in from let_in l;
  end if;

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', 0, 'admitted', v_admitted + v_opened, 'let_in', v_let_in);
end;
$$;

-- Authenticated only, as before (lint 0029, never 0028): the host's own act, authorized inside on auth.uid() and the
-- event's ownership. A drop-and-create re-inherits PUBLIC's EXECUTE, so it is revoked by name before the one grant.
revoke all on function public.let_back_in(uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean, boolean) to authenticated;

comment on function public.let_back_in(uuid, boolean, boolean) is
  'The host lifts a block (event-safety r1): the caller must host its live event (else not_found). With p_restore, the uploads the block itself removed and still in Deleted come back to their prior status (restore always fits: they already count). The door as it stands then lets in the ask the block held: at a Public door, and at the invite list while it is the door and names her (admitted counts either). With p_let_in (host-moments r1, Let in), the host answers that ask yes in the same press: every waiting row the block named that no block still holds goes in, wherever the door stands (let_in counts the people); without it her ask stands at the door.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF. Proved on the live schema BEFORE applying (database-security.md, "An unapplied migration is
-- proved on the live schema"): ONE execute_sql call of `begin;`, this file's statements verbatim, the block below
-- (its two temp tables, the DO block and the final read) and `rollback;`. RED is the same call without this file's
-- statements, on today's schema. The block traps its own failure into the proof table, so the rollback always runs and
-- the call answers the rows. It rides an EXISTING event (creating one trips enforce_event_limit), willg97's Scale probe,
-- made Private with the host letting each person in inside the transaction, and makes its own people, each a confirmed
-- account: R, who came in while it was Public and is blocked; D, declined at the door; W, who waits and is never
-- declined; O, declined at Only me; P, declined before a password; Q, declined before a Public trip; X, declined, whom
-- another host tries to let in. It proves the deployed build's call unchanged, Let in at each door, that it lets in
-- only the rows its block named, the refusals, and the grants.
--
-- Held on 2026-10-07 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b). RED, the block alone on today's let_back_in(uuid, boolean): the setup and step 1
-- held (the deployed build's lift), then step 2 failed with "function public.let_back_in(p_block_id => uuid, p_restore =>
-- boolean, p_let_in => boolean) does not exist" (the failing step's row is the one the trap keeps). GREEN, with this
-- file's statements (afterwards let_back_in(uuid,boolean) read 1c99e15debf3ab3b520409c2aae94d4b as before and the
-- three-argument one did not exist, no lin-* account stood, and the event read open, no password, its 26 guests, no
-- block and no invite: nothing persisted):
--   setup                                 | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b: letting each person in; R in and blocked, D declined, W O P Q X waiting
--   1 the deployed build's call           | t | let_back_in(p_block_id, p_restore) lifts the block and leaves D waiting At the door, admitted 0, let_in 0: milestone 38's lift
--   2 Let in at the door                  | t | at approve: let_in 1, admitted 0; D stands in, unblocked, off At the door; the five other asks still wait
--   3 someone who was in                  | t | R lifted with p_let_in: let_in 0, still in
--   4 the refusals                        | t | another host: not_found; no session: unauthorized; anon: refused EXECUTE; X still blocked and waiting
--   5 Let in at Only me                   | t | O declined, the album Only me: her ask stood; let_in 1, she stands in at a door that reads private
--   6 Let in at a password                | t | the password ended P's ask; Let in lifts her block, let_in 0, and she stands a newcomer at the password
--   7 Let in at Public                    | t | Q declined, then Public: the door's arm let her in (admitted 1) before the new one (let_in 0)
--   8 grants                              | t | let_back_in(uuid, boolean, boolean) alone: DEFINER, path pinned, {postgres, service_role, authenticated}; anon and PUBLIC refused
--   hash let_back_in(uuid,boolean,boolean) | t | 7383a75e041e739347d9f61e36ad122c  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =============================================================================================
-- create temp table let_in_proof (n serial, step text, ok boolean, detail text);
-- create temp table ctx (event_id uuid, host_id uuid);
-- insert into ctx values ('14bb4318-80cd-4eed-b219-92c097ee16c7', '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b');
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text;
--   u_r uuid := gen_random_uuid(); u_d uuid := gen_random_uuid(); u_w uuid := gen_random_uuid();
--   u_o uuid := gen_random_uuid(); u_p uuid := gen_random_uuid(); u_q uuid := gen_random_uuid();
--   u_x uuid := gen_random_uuid(); u_h uuid := gen_random_uuid();
--   e_tag text := substr(md5(random()::text), 1, 8);
--   g_r uuid; g_d uuid; g_w uuid; g_o uuid; g_p uuid; g_q uuid; g_x uuid;
--   b_r uuid; b_d uuid; b_o uuid; b_p uuid; b_q uuid; b_x uuid;
--   v jsonb; v_n integer; v_step text := 'setup';
-- begin
--   select event_id, host_id into v_event, v_host from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null and visibility = 'open';
--   if v_qr is null then raise exception 'SETUP: no open event'; end if;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_r, 'lin-r-' || e_tag || '@example.test', now()), (u_d, 'lin-d-' || e_tag || '@example.test', now()),
--     (u_w, 'lin-w-' || e_tag || '@example.test', now()), (u_o, 'lin-o-' || e_tag || '@example.test', now()),
--     (u_p, 'lin-p-' || e_tag || '@example.test', now()), (u_q, 'lin-q-' || e_tag || '@example.test', now()),
--     (u_x, 'lin-x-' || e_tag || '@example.test', now()), (u_h, 'lin-h-' || e_tag || '@example.test', now());
--   insert into public.profiles (id, email, display_name)
--   select u.id, u.email, initcap(split_part(u.email, '-', 2)) || ' Proof' from auth.users u
--    where u.id in (u_r, u_d, u_w, u_o, u_p, u_q, u_x, u_h)
--   on conflict (id) do update set display_name = excluded.display_name;
--   -- R comes in while the album is Public; then the host lets each person in, and the rest ask.
--   set local role service_role;
--   v := public.create_guest(v_qr, u_r); g_r := (v ->> 'guest_id')::uuid;
--   reset role;
--   update public.events set visibility = 'private', gate = 'approve', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null
--    where id = v_event;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_d); g_d := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_w); g_w := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_o); g_o := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_p); g_p := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_q); g_q := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_x); g_x := (v ->> 'guest_id')::uuid;
--   reset role;
--   if (select admission from public.guests where id = g_r) <> 'in'
--      or (select count(*) from public.guests where id in (g_d, g_w, g_o, g_p, g_q, g_x) and admission = 'waiting') <> 6 then
--     raise exception 'SETUP: R is not in, or the six are not all waiting';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_r); b_r := (v ->> 'block_id')::uuid;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_d); b_d := (v ->> 'block_id')::uuid;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values ('setup', true,
--     format('event %s, host %s: letting each person in; R in and blocked, D declined, W O P Q X waiting', v_event, v_host));
--
--   -- ── 1. The deployed build's call, by its two names: today's lift, her ask left standing at the door. ──
--   v_step := '1 the deployed build''s call';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(p_block_id := b_d, p_restore := false);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 0 or coalesce((v ->> 'let_in')::int, 0) <> 0
--      or (select admission from public.guests where id = g_d) <> 'waiting' then
--     raise exception 'FAIL: the two-name call did other than today''s lift %', v;
--   end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_d);
--   if not (v ->> 'waiting')::boolean or (v ->> 'blocked')::boolean then raise exception 'FAIL: D is not back at the door %', v; end if;
--   if not exists (select 1 from jsonb_array_elements(public.event_door_queue(v_event) -> 'people') p
--                   where (p ->> 'user_id')::uuid = u_d) then
--     raise exception 'FAIL: D is not At the door';
--   end if;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'let_back_in(p_block_id, p_restore) lifts the block and leaves D waiting At the door, admitted 0, let_in 0: milestone 38''s lift');
--
--   -- ── 2. Let in at the door: declined again, one press lets her in, and only her. ──
--   v_step := '2 Let in at the door';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_d); b_d := (v ->> 'block_id')::uuid;
--   v := public.let_back_in(p_block_id := b_d, p_restore := false, p_let_in := true);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'let_in')::int <> 1 or (v ->> 'admitted')::int <> 0
--      or (select admission from public.guests where id = g_d) <> 'in' then
--     raise exception 'FAIL: Let in at the door %', v;
--   end if;
--   if exists (select 1 from public.event_blocks where id = b_d) then raise exception 'FAIL: the block stands'; end if;
--   if (select count(*) from public.guests where id in (g_w, g_o, g_p, g_q, g_x) and admission = 'waiting') <> 5 then
--     raise exception 'FAIL: Let in let in someone its block never named';
--   end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_d);
--   if not (v ->> 'in')::boolean or (v ->> 'blocked')::boolean then raise exception 'FAIL: D''s standing %', v; end if;
--   if exists (select 1 from jsonb_array_elements(public.event_door_queue(v_event) -> 'people') p
--               where (p ->> 'user_id')::uuid = u_d) then
--     raise exception 'FAIL: D is still At the door';
--   end if;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'at approve: let_in 1, admitted 0; D stands in, unblocked, off At the door; the five other asks still wait');
--
--   -- ── 3. Someone who was in: lifted, still in, nothing more to let in. ──
--   v_step := '3 someone who was in';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(p_block_id := b_r, p_restore := false, p_let_in := true);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'let_in')::int <> 0 or (select admission from public.guests where id = g_r) <> 'in' then
--     raise exception 'FAIL: R %', v;
--   end if;
--   set local role service_role;
--   if not (public.event_door_standing(v_event, u_r) ->> 'in')::boolean then raise exception 'FAIL: R is not in'; end if;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values (v_step, true, 'R lifted with p_let_in: let_in 0, still in');
--
--   -- ── 4. The refusals: another host, nobody signed in, anon. Nothing moves. ──
--   v_step := '4 the refusals';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_x); b_x := (v ->> 'block_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_h, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(p_block_id := b_x, p_restore := true, p_let_in := true);
--   reset role;
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(p_block_id := b_x, p_restore := false, p_let_in := true);
--   reset role;
--   if v ->> 'reason' is distinct from 'unauthorized' then raise exception 'FAIL: nobody signed in %', v; end if;
--   set local role anon;
--   begin
--     perform public.let_back_in(b_x, false, true);
--     raise exception 'FAIL: anon ran let_back_in';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if not exists (select 1 from public.event_blocks where id = b_x)
--      or (select admission from public.guests where id = g_x) <> 'waiting' then
--     raise exception 'FAIL: a refusal moved X';
--   end if;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'another host: not_found; no session: unauthorized; anon: refused EXECUTE; X still blocked and waiting');
--
--   -- ── 5. At Only me her ask stands, and Let in lets her in to the album it keeps shut. ──
--   v_step := '5 Let in at Only me';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_o); b_o := (v ->> 'block_id')::uuid;
--   v := public.set_event_door(v_event, 'private');
--   v := public.let_back_in(p_block_id := b_o, p_restore := false, p_let_in := true);
--   reset role;
--   if (v ->> 'let_in')::int <> 1 or (select admission from public.guests where id = g_o) <> 'in' then
--     raise exception 'FAIL: Let in at Only me %', v;
--   end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_o);
--   if v ->> 'door' <> 'private' or not (v ->> 'in')::boolean then raise exception 'FAIL: O''s standing at Only me %', v; end if;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'O declined, the album Only me: her ask stood; let_in 1, she stands in at a door that reads private');
--
--   -- ── 6. A password ended her ask: Let in has nobody to let in, and she meets it like anyone new. ──
--   v_step := '6 Let in at a password';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_p); b_p := (v ->> 'block_id')::uuid;
--   perform public.set_event_password(v_event, 'let-in-proof-' || e_tag);
--   v := public.let_back_in(p_block_id := b_p, p_restore := false, p_let_in := true);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'let_in')::int <> 0 or (v ->> 'admitted')::int <> 0
--      or exists (select 1 from public.guests where id = g_p) then
--     raise exception 'FAIL: Let in at a password %', v;
--   end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_p);
--   if v ->> 'door' <> 'password' or (v ->> 'in')::boolean or (v ->> 'waiting')::boolean or (v ->> 'blocked')::boolean then
--     raise exception 'FAIL: P''s standing at the password %', v;
--   end if;
--   reset role;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'the password ended P''s ask; Let in lifts her block, let_in 0, and she stands a newcomer at the password');
--
--   -- ── 7. At Public the door lets her in first, as today, and the count stays the door's. ──
--   v_step := '7 Let in at Public';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_q); g_q := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_q); b_q := (v ->> 'block_id')::uuid;
--   v := public.set_event_door(v_event, 'open');
--   v := public.let_back_in(p_block_id := b_q, p_restore := false, p_let_in := true);
--   reset role;
--   if (v ->> 'admitted')::int <> 1 or (v ->> 'let_in')::int <> 0 or (select admission from public.guests where id = g_q) <> 'in' then
--     raise exception 'FAIL: Let in at Public %', v;
--   end if;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'Q declined, then Public: the door''s arm let her in (admitted 1) before the new one (let_in 0)');
--
--   -- ── 8. The grants and the mode: one let_back_in, the authenticated host's, DEFINER, its path pinned. ──
--   v_step := '8 grants';
--   if to_regprocedure('public.let_back_in(uuid, boolean)') is not null then raise exception 'FAIL: the old overload stands'; end if;
--   if not (select p.prosecdef and p.proconfig = array['search_path=""']
--                  and p.proacl::text = '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}'
--             from pg_proc p where p.oid = 'public.let_back_in(uuid, boolean, boolean)'::regprocedure)
--      or has_function_privilege('anon', 'public.let_back_in(uuid, boolean, boolean)', 'EXECUTE')
--      or has_function_privilege('public', 'public.let_back_in(uuid, boolean, boolean)', 'EXECUTE') then
--     raise exception 'FAIL: let_back_in''s mode, path or roles';
--   end if;
--   insert into let_in_proof (step, ok, detail) values (v_step, true,
--     'let_back_in(uuid, boolean, boolean) alone: DEFINER, path pinned, {postgres, service_role, authenticated}; anon and PUBLIC refused');
--
--   insert into let_in_proof (step, ok, detail)
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = 'let_back_in'
--      order by 1;
-- exception when others then
--   insert into let_in_proof (step, ok, detail) values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from let_in_proof order by n;
