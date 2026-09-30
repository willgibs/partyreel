-- =============================================================================================
-- THE CLAIM SAYS WHAT IT LEFT FOR ANOTHER ADDRESS (lane `crumbs-24`, shared-claims' second Question).
--
-- The finding: a guest who typed dana@work under her name at the album's door and then confirmed the
-- keep with Google as dana@gmail holds a ticket that names another address, so the claim rightly moves
-- nothing and asks nothing (whose_ticket, 20260929234000: an address is the one claim number with a
-- safe home, and a wrong yes would close it). But the phone never learns why: the confirmation tells
-- her "You're on as Dana." over photos that stay Unverified, under dana@work, with no word of where
-- they wait.
--
-- ★ THE RULE STANDS, AND THE ASK READ SAYS WHAT IT LEFT. claim_ticket_asks already reads the phone's held
-- tickets after every claim (for the ones typed under another name); it now also answers, one entry a
-- ticket, the ones typed under an address that is not hers, with their live uploads and the caller's own
-- token handed back, so the album on screen can say where its photos wait. It answers WHETHER, never
-- WHAT: no address, album or id leaves, as before.
--   * ONLY A CONFIRMED ACCOUNT IS ANSWERED, as before (an unconfirmed session matches no address, and
--     is answered nothing).
--   * ONLY AN ADDRESS: a row an account holds, or proved before it was deleted, is someone else's by its
--     account, and nothing on this phone says anything about it.
--   * ONLY A LIVE UPLOAD, past the door, no block: the ask's own conditions.
--
-- WHAT THIS FILE DOES:
--   1. claim_ticket_asks(text[])   carried from 20260929234000 verbatim but for the second read and the
--                                  answer's second half. Signature, RETURNS, class and grants unchanged.
--
-- ★ AN EXPAND IN BOTH DIRECTIONS: the answer stays one jsonb array, and each new entry carries no `name`,
-- which the deployed build's reader skips (claim-uploads.ts: an entry with no name is nobody's
-- question), so partyreel.com's build asks exactly what it asked. This lane's build reads the new
-- entries, and before the apply there are none: it says what it says today. Apply and push in either
-- order.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: claim_ticket_asks reads as its file wrote it (measured 2026-09-30):
--         claim_ticket_asks(text[])   a04be8ae281e5472333488a675fb5470  (20260929234000)
--       select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname = 'claim_ticket_asks';
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads claim_ticket_asks(text[]) 1e3729e8ae77869ad2e497284e2c5b11 with
--       {postgres, authenticated, service_role}, exactly as before.
--   (3) get_advisors (security). EXPECTED DELTA: none (the same function, in 0029 as before).
--   (4) Nothing to regenerate: the RETURNS is jsonb, as before.
-- =============================================================================================

-- =============================================================================================
-- 1. claim_ticket_asks: the ask, and what the claim left for another address.
-- =============================================================================================
create or replace function public.claim_ticket_asks(p_session_tokens text[])
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
  v_left jsonb;
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

  -- ★ AND WHAT THE CLAIM LEFT FOR ANOTHER ADDRESS (20260930110000): each held ticket typed under an
  -- address that is not hers (whose_ticket's 'theirs' for an address, never for an account), with a
  -- live upload, one entry a ticket, `kind` 'address'. It moves nothing and asks nothing: the phone
  -- only says where those photos wait (her own confirmation of that address, then her claims review).
  -- Never the address itself. An entry with no `name` is one a build before this reads past.
  select coalesce(jsonb_agg(jsonb_build_object('kind', 'address', 'uploads', t.uploads,
                                               'tokens', array[t.token])
                            order by t.created_at desc, t.id desc), '[]'::jsonb)
    into v_left
    from (
      select g.id, g.session_token as token, g.created_at, m.n as uploads
        from public.guests g
        cross join lateral (
          select count(*)::integer as n
            from public.media x
           where x.guest_id = g.id and x.status <> 'removed'
        ) m
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.verified_at is null
         and g.pending_email is not null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
         and public.whose_ticket(g, v_uid) = 'theirs'
         and m.n > 0
    ) t;

  return v_asks || v_left;
end;
$$;

revoke all on function public.claim_ticket_asks(text[]) from public, anon;
grant execute on function public.claim_ticket_asks(text[]) to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, the block below (its two temp tables, the DO block and the final read) and
-- `rollback;`. The block traps its own failure into the proof table, so the rollback always runs and
-- the call answers the rows; the new answer is recorded rather than raised, so a red run keeps every
-- row. It rides two EXISTING albums (creating one trips enforce_event_limit), Public and names-only
-- inside the transaction, and one phone's tickets: typed under another address with two photos, under
-- her own address, under another name, under another address with none, one an account holds, one an
-- account proved before it was deleted, one waiting at the door and one blocked. P signs in on the
-- phone (her profile "Dana Pike"); W owns the other address; Q never confirmed.
--
-- Held on 2026-09-30 against the live schema, red first: the block alone, on today's body
-- (a04be8ae281e5472333488a675fb5470), passed every step but 'the address', whose answer held Mike's
-- ask alone: nothing told the phone where the other address's photos wait. With this file's statements
-- (afterwards claim_ticket_asks read a04be8ae... as before, and no addr-* account or upload stood:
-- nothing persisted):
--   setup          | t | albums 14bb4318-80cd-4eed-b219-92c097ee16c7 and 340fcc7b-6c41-48f6-a143-6ef9f6724f4b; 8 tickets on one phone
--   grants         | t | claim_ticket_asks: DEFINER, search_path pinned, authenticated-only; anon and PUBLIC refused
--   the claim      | t | her own address's ticket is claimed (1); the one typed under another address stays, its address on it
--   the ask        | t | Mike's one ticket asked, as before
--   the address    | t | one entry, kind address, 2 uploads, her own token handed back; no address, album or id in the answer; the empty, held, proved, waiting and blocked tickets are not in it
--   the old reader | t | every entry without a name is one the deployed reader skips (no name, nobody's question)
--   its owner      | t | W's claims review lists the ticket left for her address; an unconfirmed session is answered []
--   bounds         | t | 1001 tokens refused; an empty call answers []
--   hash claim_ticket_asks(text[]) | 1e3729e8ae77869ad2e497284e2c5b11  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =============================================================================================
-- create temp table addr_proof (step text, ok boolean, detail text);
-- create temp table tk (key text primary key, guest_id uuid, token text);
-- do $$
-- declare
--   v_e1 uuid := '14bb4318-80cd-4eed-b219-92c097ee16c7';
--   v_e2 uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b';
--   u_p uuid := gen_random_uuid(); u_w uuid := gen_random_uuid(); u_o uuid := gen_random_uuid(); u_q uuid := gen_random_uuid();
--   e_p text := 'addr-p-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_w text := 'addr-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_o text := 'addr-o-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_q text := 'addr-q-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   r record; v jsonb; v_n integer; v_gid uuid; v_tok text; i integer; v_arr text[]; v_left jsonb; v_asks jsonb;
--   v_ok boolean; v_detail text;
--   v_step text := 'setup';
-- begin
--   update public.events set visibility = 'open', gate = null, require_verified_email = false,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null
--    where id in (v_e1, v_e2);
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_p, e_p, now()), (u_w, e_w, now()), (u_o, e_o, now()), (u_q, e_q, null);
--   insert into public.profiles (id, email, display_name) values
--     (u_p, e_p, 'Dana Pike'), (u_w, e_w, 'Dana at work'), (u_o, e_o, 'Olly Owner'), (u_q, e_q, 'Quin Unconfirmed')
--     on conflict (id) do update set display_name = excluded.display_name;
--
--   -- The phone's tickets: its album, the typed name and address, an account holding it, whether an
--   -- account proved it, the door, its live uploads, and how many minutes old it is.
--   for r in select * from (values
--       ('work',      v_e1, 'Dana', lower(e_w), null::uuid, false, 'in',      2, 60),
--       ('own',       v_e2, 'Dana', lower(e_p), null::uuid, false, 'in',      1, 50),
--       ('mike',      v_e2, 'Mike', null,       null::uuid, false, 'in',      1, 40),
--       ('workempty', v_e2, 'Dana', lower(e_w), null::uuid, false, 'in',      0, 30),
--       ('held',      v_e1, 'Dana', lower(e_w), u_o,        false, 'in',      1, 25),
--       ('proved',    v_e1, 'Dana', lower(e_w), null::uuid, true,  'in',      1, 20),
--       ('wait',      v_e1, 'Dana', lower(e_w), null::uuid, false, 'waiting', 1, 15),
--       ('blocked',   v_e2, 'Dana', lower(e_w), null::uuid, false, 'in',      1, 10)
--     ) x(key, event_id, name, pending, holder, proved, admission, photos, age)
--   loop
--     insert into public.guests (event_id, session_token, display_name, pending_email, pending_email_at,
--                                user_id, verified_at, admission, created_at)
--     values (r.event_id, md5(r.key || random()) || md5(r.key || random()), r.name, r.pending,
--             case when r.pending is not null then now() end, r.holder, case when r.proved then now() end,
--             r.admission::public.guest_admission, now() - make_interval(mins => r.age))
--     returning id, session_token into v_gid, v_tok;
--     insert into tk values (r.key, v_gid, v_tok);
--     for i in 1 .. r.photos loop
--       insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--       values (r.event_id, v_gid, 'photo', 'events/' || r.event_id || '/addr-' || r.key || '-' || i, 100, 'approved');
--     end loop;
--   end loop;
--   insert into public.event_blocks (event_id, guest_id, display_name)
--     values (v_e2, (select guest_id from tk where key = 'blocked'), 'Dana');
--   insert into addr_proof values ('setup', true, format('albums %s and %s; %s tickets on one phone', v_e1, v_e2, (select count(*) from tk)));
--
--   -- ── 1. The grants: authenticated-only, as before. ──
--   v_step := 'grants';
--   if has_function_privilege('anon', 'public.claim_ticket_asks(text[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.claim_ticket_asks(text[])', 'execute')
--      or exists (select 1 from pg_proc p, unnest(p.proacl) a
--                  where p.oid = 'public.claim_ticket_asks(text[])'::regprocedure
--                    and (a::text like '=%' or a::text like 'anon=%'))
--      or not (select prosecdef from pg_proc where oid = 'public.claim_ticket_asks(text[])'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.claim_ticket_asks(text[])'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: claim_ticket_asks grants or mode';
--   end if;
--   insert into addr_proof values ('grants', true, 'claim_ticket_asks: DEFINER, search_path pinned, authenticated-only; anon and PUBLIC refused');
--
--   -- ── 2. P signs in on the phone: the silent claim takes her own address's ticket and nothing else. ──
--   v_step := 'the claim';
--   v_arr := array(select token from tk);
--   perform set_config('request.jwt.claims', json_build_object('sub', u_p, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(v_arr);
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   if v_n <> 1 or (select user_id from public.guests where id = (select guest_id from tk where key = 'own')) is distinct from u_p then
--     raise exception 'FAIL: the claim took % (her own address''s ticket expected)', v_n;
--   end if;
--   if exists (select 1 from public.guests g join tk on tk.guest_id = g.id
--               where tk.key in ('work', 'workempty') and (g.user_id is not null or g.pending_email is distinct from lower(e_w))) then
--     raise exception 'FAIL: a ticket typed under another address moved';
--   end if;
--   insert into addr_proof values ('the claim', true, 'her own address''s ticket is claimed (1); the one typed under another address stays, its address on it');
--
--   -- ── 3. The ask, as before: one entry for the name at odds with hers. ──
--   v_step := 'the ask';
--   select coalesce(jsonb_agg(e), '[]'::jsonb) into v_asks from jsonb_array_elements(v) e where e ? 'name';
--   if jsonb_array_length(v_asks) <> 1 or v_asks -> 0 ->> 'name' <> 'Mike' or (v_asks -> 0 ->> 'uploads')::int <> 1
--      or v_asks -> 0 -> 'tokens' ->> 0 <> (select token from tk where key = 'mike') then
--     raise exception 'FAIL: the ask %', v_asks;
--   end if;
--   insert into addr_proof values ('the ask', true, 'Mike''s one ticket asked, as before');
--
--   -- ── 4. What the claim left for another address: exactly the ticket typed under it with a live upload. ──
--   v_step := 'the address';
--   select coalesce(jsonb_agg(e), '[]'::jsonb) into v_left from jsonb_array_elements(v) e where not (e ? 'name');
--   v_ok := jsonb_array_length(v_left) = 1
--       and v_left -> 0 ->> 'kind' = 'address'
--       and (v_left -> 0 ->> 'uploads')::int = 2
--       and jsonb_array_length(v_left -> 0 -> 'tokens') = 1
--       and v_left -> 0 -> 'tokens' ->> 0 = (select token from tk where key = 'work')
--       and position(lower(e_w) in v::text) = 0
--       and position(v_e1::text in v::text) = 0
--       and position((select guest_id from tk where key = 'work')::text in v::text) = 0;
--   v_detail := case when v_ok
--     then 'one entry, kind address, 2 uploads, her own token handed back; no address, album or id in the answer; the empty, held, proved, waiting and blocked tickets are not in it'
--     else format('the answer %s', v) end;
--   insert into addr_proof values ('the address', v_ok, v_detail);
--
--   -- ── 5. A build before this reads past the new entry: none carries a name. ──
--   v_step := 'the old reader';
--   if exists (select 1 from jsonb_array_elements(v) e where not (e ? 'name') and jsonb_typeof(e -> 'name') = 'string') then
--     raise exception 'FAIL: an address entry carries a name';
--   end if;
--   insert into addr_proof values ('the old reader', true, 'every entry without a name is one the deployed reader skips (no name, nobody''s question)');
--
--   -- ── 6. The address's owner still finds it in her claims review; an unconfirmed session is answered nothing. ──
--   v_step := 'its owner';
--   v_gid := (select guest_id from tk where key = 'work');
--   perform set_config('request.jwt.claims', json_build_object('sub', u_w, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_n from public.list_guest_rows_by_email() x where x.guest_id = v_gid;
--   reset role;
--   if v_n <> 1 then raise exception 'FAIL: W''s claims review lists % of the work ticket', v_n; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_q, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.claim_ticket_asks(v_arr);
--   reset role;
--   if v <> '[]'::jsonb then raise exception 'FAIL: an unconfirmed session was answered %', v; end if;
--   insert into addr_proof values ('its owner', true, 'W''s claims review lists the ticket left for her address; an unconfirmed session is answered []');
--
--   -- ── 7. The bounds, as before. ──
--   v_step := 'bounds';
--   perform set_config('request.jwt.claims', json_build_object('sub', u_p, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform public.claim_ticket_asks(array(select md5(g::text) from generate_series(1, 1001) g));
--     raise exception 'FAIL: 1001 tokens answered';
--   exception when program_limit_exceeded then null;
--   end;
--   if public.claim_ticket_asks(array[]::text[]) <> '[]'::jsonb then raise exception 'FAIL: an empty call answered'; end if;
--   reset role;
--   insert into addr_proof values ('bounds', true, '1001 tokens refused; an empty call answers []');
--
--   insert into addr_proof
--     select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = 'claim_ticket_asks';
-- exception when others then
--   insert into addr_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
-- select step, ok, detail from addr_proof;
