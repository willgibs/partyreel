-- =============================================================================================
-- THE LIST LETS IN WHO WAITS (lane `crumbs-17`, build 23's live red-team, BUG-2).
--
-- The finding (redteam-23 ledger, 17:12Z to 17:24Z): at an invite-list album a newcomer the list did
-- not name asked and waited; the host then put her address on the list. The door let her through at
-- once (decide.ts: the list is the host's own yes, whatever she asked before), but her waiting row was
-- never let in: add_event_invites touches no guest row, and her join minted a NEW 'in' row beside it.
-- So the Guests room kept her At the door beside her Joined address, the pulse and the bell kept
-- counting "1 person at the door", and Decline there would have blocked a guest who was in. And on the
-- device she asked from (the red-team's sign-out hid this half) the held door opens onto the album
-- while her ticket is still the waiting one, which every upload path refuses as a private album's
-- (get_upload_context and create_media read admission 'waiting'): she is let through and cannot add.
--
-- ★ THE RULE, ONCE: WHILE THE LIST IS THE DOOR, A WAITING PERSON IT NAMES IS IN. Exactly the door's own
-- predicates decide (event_door_lists_account: the address auth.users confirmed for the account; no
-- block holding the account or the row), so the host's side and the guest's side agree by
-- construction. Every waiting row of such an account goes in together (she may have asked from two
-- devices), counted once. Three acts can bring that about, and each settles it in the same statement:
--   * the list gains her address while it is the door        add_event_invites
--   * the door becomes the list while it names her           set_event_door (to 'invite')
--   * the block that held a listed newcomer lifts            let_back_in
-- (her own ask cannot: ask_to_join and create_guest already mint a listed account 'in'.) At every
-- other door a listed address is only a list, so nothing moves there: at `approve` the host lets each
-- person in, and `closed`, a password and Only me admit no newcomer at all.
--
-- WHAT THIS FILE DOES:
--   1. event_door_admit_listed(uuid)  the rule's one home: SECURITY INVOKER (every caller is a
--                                     SECURITY DEFINER host act), service role only, answers the
--                                     people it let in.
--   2. add_event_invites              carried from 20260929120000 verbatim but for the admission
--                                     after the insert; its answer gains `admitted`.
--   3. set_event_door                 carried from 20260929120000 verbatim but for the admission when
--                                     the door becomes the list; `admitted` counts it, as it counts
--                                     who turning Public lets in.
--   4. let_back_in                    carried from 20260928120000 verbatim but for the admission after
--                                     the block goes; its answer gains `admitted`.
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: every signature, every RETURNS and every grant is unchanged, and the
-- answers only grow a key (read defensively: `count(undefined)` is 0), so the deployed build and this
-- lane's build each run against either side of the apply. Before it, the lane's code reads admitted 0
-- and says nothing extra; after it, the deployed build simply ignores the new key.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-29, the
--       method below reproducing each live hash from its file):
--         add_event_invites(uuid, text[])   bd0a694036b2114f739f19ec42466f54  (20260929120000)
--         set_event_door(uuid, text)        40b5b77860f61b1cc1fdc47a191e3d2a  (20260929120000)
--         let_back_in(uuid, boolean)        587368cdc99d8cc8201cd7a0e587fa3d  (20260928120000)
--       and event_door_admit_listed does not exist yet:
--       select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public'
--          and p.proname in ('add_event_invites', 'set_event_door', 'let_back_in', 'event_door_admit_listed')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads (md5 of each body as this file writes it):
--         event_door_admit_listed(uuid)     e8e79c049a34182c062d6ba4524c79bd
--         add_event_invites(uuid, text[])   5da44419c52e3fe74c2a84e78107ef2e
--         set_event_door(uuid, text)        1ecc9092b9485179f7568e8fe468fb86
--         let_back_in(uuid, boolean)        73969ff70a3fd220593ece6b55a32da3
--       and the ACLs: event_door_admit_listed {postgres, service_role}; the three acts
--       {postgres, service_role, authenticated}, exactly as before.
--   (3) get_advisors (security). EXPECTED DELTA: none. The new function is SECURITY INVOKER and no
--       client role can run it (in neither 0028 nor 0029); the three acts keep their place in 0029.
--   (4) Regenerate src/lib/db/types.ts: event_door_admit_listed joins the Functions (nothing calls it
--       from TypeScript; the acts' answers are jsonb, read by src/lib/db/mutations/event-doors.ts and
--       src/lib/db/mutations/event-blocks.ts).
-- =============================================================================================

-- =============================================================================================
-- 1. The rule, once.
-- =============================================================================================
-- ★ LET IN EVERY WAITING PERSON THE LIST NAMES, WHILE THE LIST IS THE DOOR, and answer how many people
-- (an account once, however many devices she asked from). A waiting row always carries a confirmed
-- account (create_guest waits only a confirmed newcomer at `approve`, ask_to_join only a confirmed
-- one), and the match is the door's own: the address auth.users confirmed for that account, never the
-- row's copy of it. A block on the account or on the row holds either way (a decline is a block, and
-- only Let back in lifts one). Idempotent: once they are in, a second call finds nobody.
-- SECURITY INVOKER: its callers are SECURITY DEFINER host acts, which run it as the owner, and the
-- address it asks reads auth.users, which no client role can.
create function public.event_door_admit_listed(p_event_id uuid)
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

  with admitted as (
    update public.guests g
       set admission = 'in'
     where g.event_id = p_event_id
       and g.admission = 'waiting'
       and g.user_id is not null
       and public.event_door_lists_account(p_event_id, g.user_id)
       and not public.event_block_holds_account(p_event_id, g.user_id)
       and not public.event_block_holds_row(g)
    returning g.user_id
  )
  select count(distinct a.user_id)::integer into v_admitted from admitted a;

  return v_admitted;
end;
$$;

revoke all on function public.event_door_admit_listed(uuid) from public, anon, authenticated;
grant execute on function public.event_door_admit_listed(uuid) to service_role;

comment on function public.event_door_admit_listed(uuid) is
  'While an event''s door is its invite list, lets in every waiting person the list names (the door''s own match: the account''s confirmed address, and no block on the account or the row), every row of an account at once. Answers the people let in. Called by add_event_invites, set_event_door and let_back_in; no client role runs it.';

-- =============================================================================================
-- 2. add_event_invites: the list, and who it lets in.
-- =============================================================================================
-- Carried from 20260929120000 verbatim but for the admission after the insert and `admitted` in the
-- answer. Still authenticated-only, the host re-checked on auth.uid(), the event row locked for the call.
create or replace function public.add_event_invites(p_event_id uuid, p_emails text[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_have integer;
  v_room integer;
  v_valid integer;
  v_new integer;
  v_added integer;
  v_invalid integer;
  v_admitted integer;
  c_cap constant integer := 500;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if p_emails is not null and cardinality(p_emails) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  -- The event row, locked for the call: two adds to one list run one at a time, so the cap holds.
  perform 1 from public.events e
   where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null
     for no key update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select count(*)::integer into v_have from public.event_invites i where i.event_id = p_event_id;
  v_room := greatest(c_cap - v_have, 0);

  -- One pass: each address normalised and counted once (its first place in what the host typed or
  -- pasted), the unreadable set aside, the new ones inserted in the host's order up to the room left.
  with raw as (
    select lower(btrim(t.raw)) as email, t.ord
      from unnest(coalesce(p_emails, '{}'::text[])) with ordinality as t(raw, ord)
     where t.raw is not null and btrim(t.raw) <> ''
  ),
  batch as (
    select r.email,
           min(r.ord) as ord,
           bool_and(char_length(r.email) between 3 and 254
                    and position('@' in r.email) > 1
                    and r.email !~ '\s') as valid
      from raw r
     group by r.email
  ),
  fresh as (
    select b.email, b.ord
      from batch b
     where b.valid
       and not exists (select 1 from public.event_invites i
                        where i.event_id = p_event_id and i.email = b.email)
  ),
  added as (
    insert into public.event_invites (event_id, email)
    select p_event_id, f.email
      from fresh f
     order by f.ord
     limit v_room
    on conflict (event_id, email) do nothing
    returning 1
  )
  select (select count(*) from batch where not valid)::integer,
         (select count(*) from batch where valid)::integer,
         (select count(*) from fresh)::integer,
         (select count(*) from added)::integer
    into v_invalid, v_valid, v_new, v_added;

  -- ★ THE LIST LETS IN WHO IT NAMES (20260929220000): while it is the door, a newcomer waiting at it
  -- whose address it now names comes in, on every device she asked from, and is counted once.
  v_admitted := public.event_door_admit_listed(p_event_id);

  return jsonb_build_object(
    'ok', true,
    'added', v_added,
    'already', v_valid - v_new,
    'invalid', v_invalid,
    'over_cap', greatest(v_new - v_added, 0),
    'total', v_have + v_added,
    'admitted', v_admitted
  );
end;
$$;

revoke all on function public.add_event_invites(uuid, text[]) from public, anon, authenticated;
grant execute on function public.add_event_invites(uuid, text[]) to authenticated;

comment on function public.add_event_invites(uuid, text[]) is
  'Addresses onto an event''s invite list, normalised, the unreadable counted and left out, capped at 500 an event. While the list is the door, a waiting newcomer it names comes in (admitted: the people). The caller must host the live event.';

-- =============================================================================================
-- 3. set_event_door: the door, and who the list lets in when it becomes the door.
-- =============================================================================================
-- Carried from 20260929120000 verbatim but for the admission when the door becomes the invite list,
-- which `admitted` counts beside the people turning Public lets in (only one of the two can be nonzero).
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

  if v_visibility = 'open' and v_event.visibility <> 'open' then
    select count(distinct coalesce(g.user_id::text, g.id::text))::integer into v_waiting
      from public.guests g
     where g.event_id = v_event.id
       and g.admission = 'waiting'
       and not public.event_block_holds_row(g);
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
  'The door''s one writer (event-settings r1): open, password (only onto a password already set), approve, invite, closed or private (Only me). The caller must host the live event (else not_found). A gate that keys on an address turns the email step on with it; turning Public lets everyone waiting in, and turning to the invite list lets in everyone waiting whom it names (admitted counts either).';

-- =============================================================================================
-- 4. let_back_in: the block lifts, and a listed newcomer it held comes in.
-- =============================================================================================
-- Carried from 20260928120000 verbatim but for the admission after the block goes and `admitted` in the
-- answer. A declined newcomer the list does not name goes back to the door, as the decline's Undo
-- returns her there; one it names comes in, since the block was all that held her.
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

  -- ★ BACK AT A LIST THAT NAMES THEM (20260929220000): with the block gone, a waiting newcomer the
  -- invite list names is let in by it, as she would have been the moment it named her.
  v_admitted := public.event_door_admit_listed(v_block.event_id);

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', v_no_room, 'admitted', v_admitted);
end;
$$;

revoke all on function public.let_back_in(uuid, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean) to authenticated;

comment on function public.let_back_in(uuid, boolean) is
  'The host lifts a block (event-safety r1): the caller must host its live event (else not_found). With p_restore, the uploads the block itself removed and still in Deleted come back to their prior status, each admitted against the host''s cap like restore_media (no_room counts the rest). A waiting newcomer the invite list names, while it is the door, comes in (admitted).';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements, then
--   create temp table admits_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid, host_id uuid, other_id uuid);
--   insert into ctx values (<an existing test event>, <its host>, <another host>);
-- the block below, `select step, ok, detail from admits_proof;` and `rollback;`. The block traps its
-- own failure into the proof table, so the rollback always runs, and the call answers the rows. It
-- rides an EXISTING event (creating one trips enforce_event_limit), turned Private with the invite list
-- inside the transaction, and makes its own people: W, who asks from two devices and is listed; X, who
-- asks and is never listed; A and K, who wait at `approve` and are listed there; D and Y, who ask and
-- are declined, D then listed. It proves the grants, the listing, the door becoming the list, the
-- block and Let back in, the refusals, and the door opening, as the host and the server call each.
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7; afterwards
-- event_door_admit_listed did not exist, the three acts read bd0a6940.., 40b5b778.. and 587368cd.., the
-- event read open, no gate, names-only, 9 guests and 0 invites, and no admits-* account existed:
-- nothing persisted):
--   setup                      | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b, other 3fcf6405-ce4d-46ea-a11c-9ed68194b630; baseline waiting 0
--   grants                     | t | the helper: INVOKER, search_path pinned, service role only (public, anon, authenticated refused); the three acts DEFINER, pinned, authenticated only, as before
--   the list lets in           | t | W asked from two devices and X once; listing W (typed in capitals, padded) let both her rows in, counted 1; X stays; the counts, the queue and the host's tally drop her; she reads in, both her tickets add, her address reads joined; a second listing lets nobody in; unlisted, she stays in
--   the door becomes the list  | t | at approve A and K wait, and listing them moves nobody; closing the door moves nobody; the list becoming the door lets both in (admitted 2) and leaves X; A's ticket adds; set again, nobody
--   the block                  | t | declined D and Y; listing D while blocked moves nobody; Let back in lets D in by the list (admitted 1, her ticket adds) and returns Y, unlisted, to the door (admitted 0); both blocks gone
--   the refusals               | t | another host not_found on the list and the door, no caller unauthorized, anon refused; X still waits
--   the door opens             | t | Public lets in the 2 still waiting (X and Y), counted as before
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_other uuid; v_qr text;
--   u_w uuid := gen_random_uuid(); u_x uuid := gen_random_uuid(); u_a uuid := gen_random_uuid();
--   u_k uuid := gen_random_uuid(); u_d uuid := gen_random_uuid(); u_y uuid := gen_random_uuid();
--   e_w text := 'admits-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_x text := 'admits-x-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_a text := 'admits-a-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_k text := 'admits-k-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_d text := 'admits-d-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_y text := 'admits-y-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   t_w1 text; t_w2 text; t_x text; t_a text; t_k text; t_d text; t_y text;
--   g_w1 uuid; g_w2 uuid; g_x uuid; g_a uuid; g_k uuid; g_d uuid; g_y uuid;
--   b_d uuid; b_y uuid;
--   v jsonb; v_n integer; v_fn text;
--   base_waiting integer; base_host_waiting integer;
--   v_step text := 'setup';
-- begin
--   select event_id, host_id, other_id into v_event, v_host, v_other from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   -- Private with the invite list for a door, the email step on (the gate's CHECK holds it on).
--   update public.events set visibility = 'private', gate = 'invite', require_verified_email = true,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          allow_videos = true, moderation_mode = 'live'
--    where id = v_event;
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_w, e_w, now()), (u_x, e_x, now()), (u_a, e_a, now()), (u_k, e_k, now()), (u_d, e_d, now()), (u_y, e_y, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_w, e_w, 'Wren Waiting'), (u_x, e_x, 'Xan Unlisted'), (u_a, e_a, 'Ari Approve'),
--     (u_k, e_k, 'Kit Closed'), (u_d, e_d, 'Dee Declined'), (u_y, e_y, 'Yas Declined')
--     on conflict (id) do update set display_name = excluded.display_name;
--   set local role service_role;
--   base_waiting := (public.event_door_counts(v_event) ->> 'waiting')::int;
--   base_host_waiting := coalesce((public.host_door_waiting(v_host) ->> v_event::text)::int, 0);
--   reset role;
--   insert into admits_proof values ('setup', true, format('event %s, host %s, other %s; baseline waiting %s', v_event, v_host, v_other, base_waiting));
--
--   -- ── 1. The grants: the helper no client role runs; the three acts exactly as before. ──
--   v_step := 'grants';
--   if has_function_privilege('public', 'public.event_door_admit_listed(uuid)', 'EXECUTE')
--      or has_function_privilege('anon', 'public.event_door_admit_listed(uuid)', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.event_door_admit_listed(uuid)', 'EXECUTE')
--      or not has_function_privilege('service_role', 'public.event_door_admit_listed(uuid)', 'EXECUTE') then
--     raise exception 'FAIL: the helper''s grants';
--   end if;
--   if (select prosecdef from pg_proc where oid = 'public.event_door_admit_listed(uuid)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.event_door_admit_listed(uuid)'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the helper is not an INVOKER pinned to an empty path';
--   end if;
--   foreach v_fn in array array['public.add_event_invites(uuid, text[])', 'public.set_event_door(uuid, text)', 'public.let_back_in(uuid, boolean)'] loop
--     if has_function_privilege('public', v_fn, 'EXECUTE') or has_function_privilege('anon', v_fn, 'EXECUTE')
--        or not has_function_privilege('authenticated', v_fn, 'EXECUTE')
--        or not (select prosecdef from pg_proc where oid = v_fn::regprocedure)
--        or (select proconfig from pg_proc where oid = v_fn::regprocedure) <> array['search_path=""'] then
--       raise exception 'FAIL: % lost its grant or its mode', v_fn;
--     end if;
--   end loop;
--   set local role anon;
--   begin
--     perform public.event_door_admit_listed(v_event);
--     raise exception 'FAIL: anon ran the helper';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform public.event_door_admit_listed(v_event);
--     raise exception 'FAIL: the host ran the helper directly';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   insert into admits_proof values ('grants', true, 'the helper: INVOKER, search_path pinned, service role only (public, anon, authenticated refused); the three acts DEFINER, pinned, authenticated only, as before');
--
--   -- ── 2. Listing a waiting newcomer lets her in, once, everywhere the door counts. ──
--   v_step := 'the list lets in';
--   set local role service_role;
--   v := public.ask_to_join(v_qr, u_w);
--   t_w1 := v ->> 'session_token'; g_w1 := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: W not waiting %', v; end if;
--   v := public.ask_to_join(v_qr, u_w);  -- her second device
--   t_w2 := v ->> 'session_token'; g_w2 := (v ->> 'guest_id')::uuid;
--   v := public.ask_to_join(v_qr, u_x);
--   t_x := v ->> 'session_token'; g_x := (v ->> 'guest_id')::uuid;
--   if (public.event_door_counts(v_event) ->> 'waiting')::int <> base_waiting + 2 then
--     raise exception 'FAIL: two people waiting before the listing, counts %', public.event_door_counts(v_event);
--   end if;
--   if public.get_upload_context(t_w1, 'photo') ->> 'visibility' <> 'private' then raise exception 'FAIL: a waiting ticket adds'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array['  ' || upper(e_w) || ' ']);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'added')::int <> 1 or (v ->> 'admitted')::int <> 1 then
--     raise exception 'FAIL: the listing %', v;
--   end if;
--   if (select count(*) from public.guests where id in (g_w1, g_w2) and admission = 'in') <> 2 then
--     raise exception 'FAIL: not every row of hers went in';
--   end if;
--   if (select admission from public.guests where id = g_x) <> 'waiting' then raise exception 'FAIL: an unlisted newcomer moved'; end if;
--   set local role service_role;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> base_waiting + 1 or (v ->> 'joined')::int <> 1 or (v ->> 'invited')::int <> 1 then
--     raise exception 'FAIL: the counts after the listing %', v;
--   end if;
--   v := public.event_door_queue(v_event);
--   if exists (select 1 from jsonb_array_elements(v -> 'people') p where (p ->> 'user_id')::uuid = u_w)
--      or not exists (select 1 from jsonb_array_elements(v -> 'people') p where (p ->> 'user_id')::uuid = u_x) then
--     raise exception 'FAIL: the queue after the listing %', v;
--   end if;
--   if coalesce((public.host_door_waiting(v_host) ->> v_event::text)::int, 0) <> base_host_waiting + 1 then
--     raise exception 'FAIL: the pulse and the bell %', public.host_door_waiting(v_host);
--   end if;
--   v := public.event_door_standing(v_event, u_w, array[t_w1]);
--   if not (v ->> 'in')::boolean or (v ->> 'waiting')::boolean then raise exception 'FAIL: W''s standing %', v; end if;
--   if public.get_upload_context(t_w1, 'photo') ->> 'visibility' <> 'open'
--      or public.get_upload_context(t_w2, 'photo') ->> 'visibility' <> 'open' then
--     raise exception 'FAIL: the ticket she asked with cannot add';
--   end if;
--   if not (select (x ->> 'joined')::boolean from jsonb_array_elements(public.event_invite_list(v_event)) x where x ->> 'email' = lower(e_w)) then
--     raise exception 'FAIL: her address never read joined';
--   end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_w]);
--   reset role;
--   if (v ->> 'already')::int <> 1 or (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: a second listing %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.remove_event_invite(v_event, e_w);
--   reset role;
--   set local role service_role;
--   if not (public.event_door_standing(v_event, u_w, null) ->> 'in')::boolean then raise exception 'FAIL: W out once unlisted'; end if;
--   reset role;
--   insert into admits_proof values ('the list lets in', true, 'W asked from two devices and X once; listing W (typed in capitals, padded) let both her rows in, counted 1; X stays; the counts, the queue and the host''s tally drop her; she reads in, both her tickets add, her address reads joined; a second listing lets nobody in; unlisted, she stays in');
--
--   -- ── 3. At another door the list is only a list; the door becoming the list lets in whom it names. ──
--   v_step := 'the door becomes the list';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   if (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: approve admitted %', v; end if;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   t_a := v ->> 'session_token'; g_a := (v ->> 'guest_id')::uuid;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: A not held at approve %', v; end if;
--   v := public.create_guest(v_qr, u_k);
--   t_k := v ->> 'session_token'; g_k := (v ->> 'guest_id')::uuid;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_a, e_k]);
--   reset role;
--   if (v ->> 'added')::int <> 2 or (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: the list let someone in at approve %', v; end if;
--   if (select count(*) from public.guests where id in (g_a, g_k) and admission = 'waiting') <> 2 then
--     raise exception 'FAIL: a listed newcomer moved at approve';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'closed');
--   reset role;
--   if (v ->> 'admitted')::int <> 0 or (select count(*) from public.guests where id in (g_a, g_k) and admission = 'waiting') <> 2 then
--     raise exception 'FAIL: the closed door moved someone %', v;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 2 then raise exception 'FAIL: the list becoming the door %', v; end if;
--   if (select count(*) from public.guests where id in (g_a, g_k) and admission = 'in') <> 2
--      or (select admission from public.guests where id = g_x) <> 'waiting' then
--     raise exception 'FAIL: who the list let in as it became the door';
--   end if;
--   set local role service_role;
--   if public.get_upload_context(t_a, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: A cannot add once in'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'invite');
--   reset role;
--   if (v ->> 'admitted')::int <> 0 then raise exception 'FAIL: the list, set again %', v; end if;
--   insert into admits_proof values ('the door becomes the list', true, 'at approve A and K wait, and listing them moves nobody; closing the door moves nobody; the list becoming the door lets both in (admitted 2) and leaves X; A''s ticket adds; set again, nobody');
--
--   -- ── 4. A block holds; Let back in lets a listed newcomer in, and returns an unlisted one to the door. ──
--   v_step := 'the block';
--   set local role service_role;
--   v := public.ask_to_join(v_qr, u_d);
--   t_d := v ->> 'session_token'; g_d := (v ->> 'guest_id')::uuid;
--   v := public.ask_to_join(v_qr, u_y);
--   t_y := v ->> 'session_token'; g_y := (v ->> 'guest_id')::uuid;
--   reset role;
--   if (select count(*) from public.guests where id in (g_d, g_y) and admission = 'waiting') <> 2 then raise exception 'FAIL: D and Y not waiting'; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_d);
--   b_d := (v ->> 'block_id')::uuid;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_y);
--   b_y := (v ->> 'block_id')::uuid;
--   v := public.add_event_invites(v_event, array[e_d]);
--   reset role;
--   if (v ->> 'admitted')::int <> 0 or (select admission from public.guests where id = g_d) <> 'waiting' then
--     raise exception 'FAIL: the list let a declined newcomer through %', v;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(b_d, false);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 1 or (select admission from public.guests where id = g_d) <> 'in' then
--     raise exception 'FAIL: let back in, listed %', v;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_back_in(b_y, false);
--   reset role;
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 0 or (select admission from public.guests where id = g_y) <> 'waiting' then
--     raise exception 'FAIL: let back in, unlisted %', v;
--   end if;
--   if exists (select 1 from public.event_blocks where id in (b_d, b_y)) then raise exception 'FAIL: a block stayed'; end if;
--   set local role service_role;
--   if not (public.event_door_standing(v_event, u_y, null) ->> 'waiting')::boolean then raise exception 'FAIL: Y is not back at the door'; end if;
--   if public.get_upload_context(t_d, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: D cannot add once in'; end if;
--   reset role;
--   insert into admits_proof values ('the block', true, 'declined D and Y; listing D while blocked moves nobody; Let back in lets D in by the list (admitted 1, her ticket adds) and returns Y, unlisted, to the door (admitted 0); both blocks gone');
--
--   -- ── 5. The refusals: another host and a signed-out caller move nothing. ──
--   v_step := 'the refusals';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_x]);
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host listed %', v; end if;
--   v := public.set_event_door(v_event, 'invite');
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host set the door %', v; end if;
--   reset role;
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role authenticated;
--   v := public.add_event_invites(v_event, array[e_x]);
--   if v ->> 'reason' is distinct from 'unauthorized' then raise exception 'FAIL: no caller listed %', v; end if;
--   reset role;
--   set local role anon;
--   begin
--     perform public.add_event_invites(v_event, array[e_x]);
--     raise exception 'FAIL: anon listed';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if (select admission from public.guests where id = g_x) <> 'waiting' then raise exception 'FAIL: X moved on a refusal'; end if;
--   insert into admits_proof values ('the refusals', true, 'another host not_found on the list and the door, no caller unauthorized, anon refused; X still waits');
--
--   -- ── 6. The door opening still lets everyone waiting in, and says so. ──
--   v_step := 'the door opens';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if (v ->> 'admitted')::int <> base_waiting + 2 or (select count(*) from public.guests where id in (g_x, g_y) and admission = 'in') <> 2 then
--     raise exception 'FAIL: the door opening %', v;
--   end if;
--   insert into admits_proof values ('the door opens', true, format('Public lets in the %s still waiting (X and Y), counted as before', (v ->> 'admitted')));
-- exception when others then
--   insert into admits_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
