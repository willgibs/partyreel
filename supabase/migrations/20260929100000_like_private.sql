-- =============================================================================================
-- A PRIVATE ALBUM LIKES NOTHING BUT ITS HOST (lane `crumbs-8`, build 17's red-team).
--
-- like_media told a block from a private album. A private album's guest who holds a row there passed
-- its check (ok), while an account the event blocked, which reads the event as private everywhere
-- else (20260928120000, Will's "Sneaky block"), got not_found. So a direct RPC call with a photo id
-- she already knows (one she uploaded, or liked before) answered "blocked" where every other path
-- answers "private".
--
-- The fix makes the private album's own answer the block's: nothing on a private album's lock screen
-- can like, so a private album refuses EVERY guest's like with the same not_found a block gets, and
-- the two read alike. The host still likes on their own private album; an open album's viewers and a
-- password album's guests like as before. like_many sends every id through like_media, so the bulk
-- Like follows with no change of its own.
--
-- WHAT THIS FILE DOES: one create or replace of like_media, carried from its newest definition
-- (20260928120000_event_blocks.sql, 5f) word for word but for the one clause, `e.visibility <>
-- 'private'`, on the guest arm. Same signature, same RETURNS, same grants (restated in the form the
-- file before it wrote them).
--
-- ★ get_my_likes is deliberately NOT replaced: she keeps seeing the photographs she already liked on
-- a private album, as a blocked account does (the event_blocks file's own call), so her own likes
-- list still reads the same either way. The one visible change is a heart in her own Uploads feed on
-- a private album's photo: it now refuses, as it already did for a blocked account's (the lane's
-- Handoff carries it).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: like_media's live body is its newest definition's (measured 2026-09-29):
--         like_media(uuid)                       9b448cf60af2e4e115921b5ee2bbd627  (20260928120000)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname = 'like_media';
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply (it held there on
--       2026-09-29 with this file's final text; its rows are quoted with it), then apply verbatim. The
--       query in (1) then reads (md5(prosrc), read inside that check's transaction after this file ran,
--       and hashed from this file's body locally):
--         like_media(uuid)                       3ec0ef855484b21d68b9bfcafc4ecf76
--   (3) The grants, as the file restates them and as they stand live: postgres, service_role and
--       authenticated execute; never anon, never PUBLIC.
--   (4) get_advisors (security). EXPECTED DELTA: NONE (like_media stays in 0029, authenticated only).
--   (5) No types to regenerate: the signature and the RETURNS are unchanged.
-- =============================================================================================

create or replace function public.like_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  if not exists (
    select 1
    from public.media m
    join public.events e on e.id = m.event_id and e.deleted_at is null
    where m.id = p_media_id
      and m.status = 'approved'
      and m.removed_at is null
      and (
        e.host_id = v_uid                 -- host of the event
        or (
          -- ★ A PRIVATE ALBUM LIKES NOTHING BUT ITS HOST (20260929100000): nothing on its lock screen
          -- can like, so its guests get the not_found a blocked account gets below, and a known photo
          -- id tells neither apart.
          e.visibility <> 'private'
          -- ★ THE SNEAKY BLOCK (20260928120000): a blocked account likes nothing here, the private
          -- album's own answer (not_found).
          and not public.event_block_holds_account(e.id, v_uid)
          and (
            e.visibility = 'open'          -- any signed-in viewer of a public album
            or exists (select 1 from public.guests g
                       where g.event_id = e.id and g.user_id = v_uid)  -- a guest (joined / uploaded)
          )
        )
      )
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into public.media_likes (media_id, user_id)
  values (p_media_id, v_uid)
  on conflict (media_id, user_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.like_media(uuid) from public, anon;
grant execute on function public.like_media(uuid) to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, then
--   create temp table like_private_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid);
--   insert into ctx values (<an existing test event>);
-- the block below, `select step, ok, detail from like_private_proof;` and `rollback;`. The block traps
-- its own failure into the proof table, so the rollback always runs, and the call answers the rows.
-- It rides an EXISTING event (creating one trips enforce_event_limit), turned open, private and
-- password inside the transaction, and makes its own people: three confirmed accounts (G, a guest
-- with a row; B, a guest with a row whom the host blocks by account; O, a signed-in viewer with no
-- row) and one approved photograph of the host's. It proves, as each would call it: the grants; on
-- the open album G, O and the host like while B gets not_found; on the private album G, B and O get
-- one identical not_found, the bulk Like refuses G there too, and the host likes; on the password
-- album G (a guest) and the host like while O and B get not_found; and this file's body md5.
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7; like_media
-- read 9b448cf60af2e4e115921b5ee2bbd627 before and after, and the event, its likes, the blocks and
-- auth.users read unchanged: nothing persisted):
--   setup              | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b
--   grants             | t | anon none, authenticated and service_role execute, PUBLIC none; md5 3ec0ef855484b21d68b9bfcafc4ecf76
--   the open album     | t | G ok, O ok, the host ok; B not_found
--   the private album  | t | G, B and O answer {"ok": false, "reason": "not_found"} alike; like_many refuses G; the host ok
--   the password album | t | G ok, the host ok; O and B not_found
-- The same private-album step against the live body (this file NOT run first) is the tell itself:
--   the private album (control) | f | a private album's guest reads {"ok": true} where the blocked account reads {"ok": false, "reason": "not_found"}
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid;
--   u_g uuid := gen_random_uuid(); u_b uuid := gen_random_uuid(); u_o uuid := gen_random_uuid();
--   e_g text := 'likes-g-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_b text := 'likes-b-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_o text := 'likes-o-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   t_g text := md5('g' || random()) || md5('g2' || random());
--   t_b text := md5('b' || random()) || md5('b2' || random());
--   m_host uuid;
--   v jsonb; v_g jsonb; v_b jsonb; v_o jsonb; v_h jsonb;
--   v_step text := 'setup';
-- begin
--   select event_id into v_event from ctx;
--   select host_id into v_host from public.events where id = v_event and deleted_at is null;
--   if v_host is null then raise exception 'SETUP: no event'; end if;
--   update public.events set visibility = 'open' where id = v_event;
--
--   -- Three new accounts, confirmed: G (a guest), B (a guest the host blocks), O (no row at all).
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_g, e_g, now()), (u_b, e_b, now()), (u_o, e_o, now());
--   insert into public.profiles (id, email, display_name) values
--     (u_g, e_g, 'Gee Guest'), (u_b, e_b, 'Bee Blocked'), (u_o, e_o, 'Oh Viewer')
--     on conflict (id) do update set display_name = excluded.display_name;
--   insert into public.guests (event_id, session_token, user_id, email, verified_at)
--     values (v_event, t_g, u_g, e_g, now()), (v_event, t_b, u_b, e_b, now());
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, null, 'photo', 'events/' || v_event || '/likes-private-host', 100, 'approved')
--     returning id into m_host;
--   -- The host blocks B by account, through the host's own act.
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_b);
--   reset role;
--   if not coalesce((v ->> 'ok')::boolean, false) then raise exception 'SETUP: the block read %', v; end if;
--   insert into like_private_proof values ('setup', true, format('event %s, host %s', v_event, v_host));
--
--   -- ── 1. The grants, and the body this file wrote. ──
--   v_step := 'grants';
--   if has_function_privilege('anon', 'public.like_media(uuid)', 'execute')
--      or not has_function_privilege('authenticated', 'public.like_media(uuid)', 'execute')
--      or not has_function_privilege('service_role', 'public.like_media(uuid)', 'execute')
--      or exists (select 1 from pg_proc p, aclexplode(p.proacl) a
--                  where p.oid = 'public.like_media(uuid)'::regprocedure and a.grantee = 0) then
--     raise exception 'FAIL: like_media grants';
--   end if;
--   insert into like_private_proof
--     select 'grants', true, 'anon none, authenticated and service_role execute, PUBLIC none; md5 ' || md5(p.prosrc)
--       from pg_proc p where p.oid = 'public.like_media(uuid)'::regprocedure;
--
--   -- ── 2. The open album: every signed-in viewer likes but the blocked one. ──
--   v_step := 'the open album';
--   perform set_config('request.jwt.claims', json_build_object('sub', u_g, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_g := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_o, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_o := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_b := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_h := public.like_media(m_host);
--   reset role;
--   if not (v_g ->> 'ok')::boolean or not (v_o ->> 'ok')::boolean or not (v_h ->> 'ok')::boolean
--      or v_b ->> 'reason' is distinct from 'not_found' then
--     raise exception 'FAIL: open album G % O % host % B %', v_g, v_o, v_h, v_b;
--   end if;
--   insert into like_private_proof values ('the open album', true, 'G ok, O ok, the host ok; B not_found');
--
--   -- ── 3. The private album: its guest, the blocked account and a stranger answer alike. ──
--   v_step := 'the private album';
--   delete from public.media_likes where media_id = m_host;
--   update public.events set visibility = 'private' where id = v_event;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_g, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_g := public.like_media(m_host);
--   v := public.like_many(array[m_host]);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_b := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_o, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_o := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_h := public.like_media(m_host);
--   reset role;
--   if v_g is distinct from v_b or v_o is distinct from v_b or v_b ->> 'reason' is distinct from 'not_found' then
--     raise exception 'FAIL: private album G % B % O %', v_g, v_b, v_o;
--   end if;
--   if (v ->> 'liked')::int <> 0 or not (v -> 'failed') @> to_jsonb(array[m_host]) then
--     raise exception 'FAIL: like_many took G''s like on a private album: %', v;
--   end if;
--   if not (v_h ->> 'ok')::boolean then raise exception 'FAIL: the host could not like: %', v_h; end if;
--   if (select count(*) from public.media_likes where media_id = m_host) <> 1 then
--     raise exception 'FAIL: a guest''s like persisted on the private album';
--   end if;
--   insert into like_private_proof values ('the private album', true,
--     format('G, B and O answer %s alike; like_many refuses G; the host ok', v_b));
--
--   -- ── 4. The password album: its guests like as before; nobody else. ──
--   v_step := 'the password album';
--   delete from public.media_likes where media_id = m_host;
--   update public.events set visibility = 'password', event_password_hash = coalesce(event_password_hash, 'x')
--    where id = v_event;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_g, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_g := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_o, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_o := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_b := public.like_media(m_host);
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_h := public.like_media(m_host);
--   reset role;
--   if not (v_g ->> 'ok')::boolean or not (v_h ->> 'ok')::boolean
--      or v_o ->> 'reason' is distinct from 'not_found' or v_b ->> 'reason' is distinct from 'not_found' then
--     raise exception 'FAIL: password album G % host % O % B %', v_g, v_h, v_o, v_b;
--   end if;
--   insert into like_private_proof values ('the password album', true, 'G ok, the host ok; O and B not_found');
-- exception when others then
--   insert into like_private_proof values (v_step, false, sqlerrm);
-- end $$;
