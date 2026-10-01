-- =============================================================================================
-- MY UPLOADS AND MY LIKES PAST 200: A KEYSET CURSOR (lane `crumbs-38`; ROADMAP, "Profile: My uploads and My likes
-- stop at 200 with an honest note (`get_my_uploads`, `get_my_likes`); a cursor and a load-more").
--
-- Why: a person's own feeds on her profile's owner mode read the newest 200 and said so ("Showing your 200 most
-- recent uploads."), with no way to the 201st. Both functions took `p_limit` alone, sat on row-cap-sql.test.ts's
-- CALLER_BOUNDED list "no cursor by design", and so could never answer past their first page however the app asked.
--
-- WHAT CHANGES, the feeds' paging and nothing else:
--   1. `get_my_uploads(p_limit, p_before_created_at, p_before_id)`: both arms (the host's own uploads in her events,
--      her guest uploads in other people's) keep 20260929140000's predicates verbatim (live's body, md5-checked
--      2026-10-01: d4ba8140fd936245a415147b113eaae6, whitespace collapsed), each taking the keyset
--      `(created_at, id) < (p_before_created_at, p_before_id)` when a cursor is given; the union orders on the whole
--      key, `created_at desc, id desc`, a total order (two uploads can share a microsecond), and the limit is
--      clamped to the row cap (database-security.md, "Set-returning functions and the row cap").
--   2. `get_my_likes(p_limit, p_before_liked_at, p_before_id)`: 20260622140000's body (live's, md5-checked
--      2026-10-01: 86730b2051a534a822b7f16a58ca134e) with the keyset `(liked_at, media_id)` (a person likes a
--      photograph once: the likes table's key is (media_id, user_id), so the pair is a total order of her likes)
--      and the same clamp. The like access predicate is unchanged, re-applied on every page.
--   The RETURNS TABLEs do not move, so the deployed build's reads keep their rows and their types.
--
-- WHO MAY CALL THEM: unchanged, authenticated alone (database-security.md, "Authenticated-only"): SECURITY DEFINER,
-- auth.uid()-scoped, `revoke all ... from public, anon` and `grant execute ... to authenticated`, restated in full
-- because a drop and create re-inherits PUBLIC's EXECUTE. The service role keeps its default grant (live
-- 2026-10-01, both: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}).
--
-- SHAPE: a parameter list cannot be changed in place, so each is DROPPED and CREATED (a `create or replace` with a
-- new argument list would leave the old one standing beside it, and PostgREST would refuse the ambiguous call).
-- `p_limit` stays first, so a positional `get_my_uploads(n)` still names the limit, and every new argument
-- defaults to null, so the deployed build's call (`{ p_limit: 200 }`, by name) resolves to the new function
-- unchanged. `p_limit` now defaults to null, which reads everything (the row cap's rule: a null limit is never a
-- silent 1,000); the app always passes it.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) the bodies before, for the diff:
--         select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname in ('get_my_uploads', 'get_my_likes') order by 1;
--       (get_my_likes(integer) 86730b2051a534a822b7f16a58ca134e, get_my_uploads(integer)
--       d4ba8140fd936245a415147b113eaae6);
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after (two rows, the new
--       signatures, each ACL the same three grants, the service role's default now first:
--       {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres});
--   (4) get_advisors, EXPECTED DELTA: NONE (two authenticated-only DEFINER functions replaced in place in 0029);
--   (5) regenerate src/lib/db/types.ts (each gains its two cursor arguments in Args), then drop the lane's typed
--       seam named in its handoff (`feedRpc` in src/lib/db/queries/my-uploads.ts).
-- ★ EITHER ORDER IS SAFE FOR THE FIRST PAGE: the deployed build and the next both ask the first page by `p_limit`
-- alone. Only a Show more press names the cursor, so the build that offers one ships after this file (before it, a
-- press answers "Try again", captured).
-- =============================================================================================

-- ─── 1. My uploads ──────────────────────────────────────────────────────────────────────────
drop function public.get_my_uploads(integer);

create function public.get_my_uploads(
  p_limit integer default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id               uuid,
  type             public.media_type,
  original_key     text,
  preview_key      text,
  created_at       timestamptz,
  event_id         uuid,
  event_name       text,
  event_date       date,
  event_qr_token   text,
  is_host_upload   boolean,
  width            integer,
  height           integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  -- HOST arm: media in MY events, host-added (no guest). I own the event, so name/date/token are mine.
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, true,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id = (select auth.uid())
    and m.guest_id is null
    and m.status = 'approved'
    and m.removed_at is null
    -- ★ THE KEYSET (crumbs-38): the page after the cursor, on the feed's own total order.
    and (p_before_created_at is null
         or (m.created_at, m.id) < (p_before_created_at, p_before_id))

  union all

  -- GUEST arm: media whose guest is ME (incl. retroactively-claimed anonymous uploads).
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, false,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.guests g on g.id = m.guest_id and g.user_id = (select auth.uid())
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id <> (select auth.uid())
    and (
      (m.status = 'approved'
       and m.removed_at is null)
      -- ★ THE SNEAKY BLOCK (20260928120000): an approved upload a standing block removed still shows its
      -- uploader here, as a private album's uploads do, until the purge takes it or she deletes it
      -- (remove_my_upload withdraws it). Never an operator's takedown; a quietly held one like any other.
      or (m.status = 'removed'
          and m.status_before_removed = 'approved'
          and not m.removed_by_uploader
          and not m.removed_by_admin
          and exists (select 1 from public.event_blocks b
                       where b.event_id = m.event_id
                         and m.id = any (b.removed_media_ids)
                         and m.removed_at = b.created_at))
    )
    and (p_before_created_at is null
         or (m.created_at, m.id) < (p_before_created_at, p_before_id))

  order by created_at desc, id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.get_my_uploads(integer, timestamptz, uuid) from public, anon;
grant execute on function public.get_my_uploads(integer, timestamptz, uuid) to authenticated;

comment on function public.get_my_uploads(integer, timestamptz, uuid) is
  'The caller''s own uploads across every event, newest first on (created_at, id): the host''s own in her events and her guest uploads in other people''s (a standing block''s removal still shown to her). Keyset paged: p_before_created_at and p_before_id resume after the last row of the page before; p_limit clamped to the row cap. Authenticated only, auth.uid()-scoped (crumbs-38).';

-- ─── 2. My likes ────────────────────────────────────────────────────────────────────────────
drop function public.get_my_likes(integer);

create function public.get_my_likes(
  p_limit integer default null,
  p_before_liked_at timestamptz default null,
  p_before_id uuid default null
)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  liked_at timestamptz,
  event_id uuid,
  event_name text,
  event_date date,
  event_qr_token text,
  width integer,
  height integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    m.id, m.type, m.original_key, m.preview_key, l.liked_at,
    m.event_id, e.name, e.event_date, e.qr_token,
    m.width, m.height, m.duration_seconds
  from public.media_likes l
  join public.media  m on m.id = l.media_id
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where l.user_id = (select auth.uid())
    and m.status = 'approved'
    and m.removed_at is null
    and (
      e.host_id = (select auth.uid())
      or e.visibility = 'open'
      or exists (select 1 from public.guests g
                 where g.event_id = e.id and g.user_id = (select auth.uid()))
    )
    -- ★ THE KEYSET (crumbs-38): her likes after the cursor, on (liked_at, media_id), a total order of hers.
    and (p_before_liked_at is null
         or (l.liked_at, l.media_id) < (p_before_liked_at, p_before_id))
  order by l.liked_at desc, l.media_id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.get_my_likes(integer, timestamptz, uuid) from public, anon;
grant execute on function public.get_my_likes(integer, timestamptz, uuid) to authenticated;

comment on function public.get_my_likes(integer, timestamptz, uuid) is
  'The caller''s likes across every event, newest liked first on (liked_at, media_id), each re-checked against the like access predicate (a like on media since closed drops out and never presigns). Keyset paged: p_before_liked_at and p_before_id resume after the last row of the page before; p_limit clamped to the row cap. Authenticated only, auth.uid()-scoped (crumbs-38).';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the block
-- below (uncommented) with this file's statements verbatim where it says so, and `select n, step, ok, detail from
-- proof order by n; rollback;`. Red first: the same block WITHOUT this file's statements, on today's schema, where
-- every step that names the cursor fails (the functions take `p_limit` alone). It rides EXISTING rows: the account
-- with the most rows across both arms and the account with the most likes (test accounts' disposable data), read
-- as each through `set local role authenticated` and `request.jwt.claims`. Each step traps its own failure into
-- `proof`, so one call reports them all.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- grant all on proof to authenticated; grant usage on sequence proof_n_seq to authenticated;
-- create temp table fx (k text primary key, id uuid) on commit drop;
-- grant all on fx to authenticated;
-- insert into fx  -- the account with the most rows across BOTH arms, so both arms page together
--   select 'uploader', who from (
--     select e.host_id as who from public.media m join public.events e on e.id = m.event_id and e.deleted_at is null
--      where m.guest_id is null and m.status = 'approved' and m.removed_at is null
--     union all
--     select g.user_id from public.guests g join public.media m on m.guest_id = g.id
--      where g.user_id is not null and m.status = 'approved'
--   ) a group by who order by count(*) desc limit 1;
-- insert into fx
--   select 'liker', l.user_id from public.media_likes l group by l.user_id order by count(*) desc limit 1;
--
-- <this file's statements, verbatim>
--
-- -- ── 0. the cursor answers (RED on today's schema, where the functions take p_limit alone) ──
-- do $$
-- begin
--   perform set_config('request.jwt.claims', json_build_object('sub', (select id from fx where k = 'uploader'),
--     'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform * from public.get_my_uploads(p_limit => 2, p_before_created_at => now(), p_before_id => gen_random_uuid());
--   reset role;
--   insert into proof (step, ok, detail) values ('0 the cursor answers', true, 'get_my_uploads takes a cursor');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('0 the cursor answers', false, sqlerrm);
-- end $$;
--
-- -- ── 1. my uploads: the pages are the whole feed, in its order, with no seam ──
-- do $$
-- declare who uuid; whole uuid[]; paged uuid[] := '{}'; page uuid[]; c_at timestamptz; c_id uuid; i int := 0;
--   n_whole int; n_clamp int;
-- begin
--   select id into who from fx where k = 'uploader';
--   perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select array_agg(u.id order by u.created_at desc, u.id desc), count(*) into whole, n_whole
--     from public.get_my_uploads(1000) u;
--   loop
--     select array_agg(u.id order by u.created_at desc, u.id desc) into page
--       from public.get_my_uploads(7, c_at, c_id) u;
--     exit when page is null;
--     paged := paged || page;
--     select u.created_at, u.id into c_at, c_id
--       from public.get_my_uploads(7, c_at, c_id) u order by u.created_at, u.id limit 1;
--     i := i + 1;
--     exit when i > 400;
--   end loop;
--   select count(*) into n_clamp from public.get_my_uploads(5000);
--   reset role;
--   if paged is distinct from whole then raise exception 'pages % rows, whole % rows, or out of order',
--     cardinality(paged), n_whole; end if;
--   if n_clamp > 1000 then raise exception 'the clamp let % rows through', n_clamp; end if;
--   if n_whole < 8 then raise exception 'only % uploads: the paging was not exercised', n_whole; end if;
--   insert into proof (step, ok, detail) values ('1 my uploads page whole', true,
--     n_whole || ' uploads in ' || i || ' pages of 7, clamp ' || n_clamp);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('1 my uploads page whole', false, sqlerrm);
-- end $$;
--
-- -- ── 2. my likes: the same ──
-- do $$
-- declare who uuid; whole uuid[]; paged uuid[] := '{}'; page uuid[]; c_at timestamptz; c_id uuid; i int := 0;
--   n_whole int;
-- begin
--   select id into who from fx where k = 'liker';
--   perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select array_agg(l.id order by l.liked_at desc, l.id desc), count(*) into whole, n_whole
--     from public.get_my_likes(1000) l;
--   loop
--     select array_agg(l.id order by l.liked_at desc, l.id desc) into page
--       from public.get_my_likes(2, c_at, c_id) l;
--     exit when page is null;
--     paged := paged || page;
--     select l.liked_at, l.id into c_at, c_id
--       from public.get_my_likes(2, c_at, c_id) l order by l.liked_at, l.id limit 1;
--     i := i + 1;
--     exit when i > 600;
--   end loop;
--   reset role;
--   if paged is distinct from whole then raise exception 'pages % rows, whole % rows, or out of order',
--     cardinality(paged), n_whole; end if;
--   if n_whole < 3 then raise exception 'only % likes: the paging was not exercised', n_whole; end if;
--   insert into proof (step, ok, detail) values ('2 my likes page whole', true, n_whole || ' likes in ' || i || ' pages of 2');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('2 my likes page whole', false, sqlerrm);
-- end $$;
--
-- -- ── 3. a tie on the timestamp splits on the id, never doubled or skipped (synthetic: two of her likes moved
-- --       onto one instant inside the transaction) ──
-- do $$
-- declare who uuid; a uuid; b uuid; t timestamptz := now() - interval '1 minute'; first_page uuid[]; second_page uuid[];
-- begin
--   select id into who from fx where k = 'liker';
--   select l.media_id into a from public.media_likes l where l.user_id = who order by l.liked_at desc, l.media_id desc limit 1;
--   select l.media_id into b from public.media_likes l where l.user_id = who order by l.liked_at desc, l.media_id desc offset 1 limit 1;
--   update public.media_likes set liked_at = t where user_id = who and media_id in (a, b);
--   perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select array_agg(l.id order by l.liked_at desc, l.id desc) into first_page
--     from public.get_my_likes(1, null, null) l;
--   select array_agg(l.id order by l.liked_at desc, l.id desc) into second_page
--     from public.get_my_likes(1, t, first_page[1]) l;
--   reset role;
--   if first_page[1] = second_page[1] then raise exception 'the tie doubled %', first_page; end if;
--   if not (array[first_page[1], second_page[1]] @> array[a, b] and array[a, b] @> array[first_page[1], second_page[1]])
--     then raise exception 'the tie lost one: % then %, expected % and %', first_page, second_page, a, b; end if;
--   insert into proof (step, ok, detail) values ('3 a tie splits on the id', true, 'two likes at one instant, one a page');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('3 a tie splits on the id', false, sqlerrm);
-- end $$;
--
-- -- ── 4. nobody else's: anon cannot call them, and the claims of another account answer that account alone ──
-- do $$
-- declare who uuid; n int; bad text := '';
-- begin
--   if has_function_privilege('anon', 'public.get_my_uploads(integer, timestamptz, uuid)', 'execute')
--     or has_function_privilege('anon', 'public.get_my_likes(integer, timestamptz, uuid)', 'execute')
--     then bad := bad || ' anon'; end if;
--   if not has_function_privilege('authenticated', 'public.get_my_uploads(integer, timestamptz, uuid)', 'execute')
--     or not has_function_privilege('authenticated', 'public.get_my_likes(integer, timestamptz, uuid)', 'execute')
--     then bad := bad || ' authenticated-lost'; end if;
--   if not has_function_privilege('service_role', 'public.get_my_uploads(integer, timestamptz, uuid)', 'execute')
--     then bad := bad || ' service_role-lost'; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into n from public.get_my_uploads(1000);
--   if n <> 0 then bad := bad || ' a-stranger-reads-' || n; end if;
--   select count(*) into n from public.get_my_likes(1000);
--   if n <> 0 then bad := bad || ' a-stranger-likes-' || n; end if;
--   reset role;
--   if bad <> '' then raise exception 'grants:%', bad; end if;
--   insert into proof (step, ok, detail) values ('4 the caller alone', true, 'anon none; a stranger reads 0 and 0');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('4 the caller alone', false, sqlerrm);
-- end $$;
--
-- -- ── 5. the shape ──
-- do $$
-- declare bad text := ''; n int; r record;
-- begin
--   select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
--    where ns.nspname = 'public' and p.proname in ('get_my_uploads', 'get_my_likes');
--   if n <> 2 then bad := bad || ' overloads:' || n; end if;
--   -- The ACL as a set: a recreate grants the service role its default first, so the order is not the fact.
--   for r in select p.proname, p.prosecdef, p.proconfig,
--                   (select array_agg(x order by x) from unnest(p.proacl::text[]) x) as acl
--              from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
--             where ns.nspname = 'public' and p.proname in ('get_my_uploads', 'get_my_likes') loop
--     if not r.prosecdef then bad := bad || ' ' || r.proname || '-invoker'; end if;
--     if r.proconfig is distinct from array['search_path=""'] then bad := bad || ' ' || r.proname || '-path'; end if;
--     if r.acl is distinct from array['authenticated=X/postgres', 'postgres=X/postgres', 'service_role=X/postgres']
--       then bad := bad || ' ' || r.proname || '-acl:' || r.acl::text; end if;
--   end loop;
--   if bad <> '' then raise exception 'shape:%', bad; end if;
--   insert into proof (step, ok, detail) values ('5 shape and grants', true, 'two functions, DEFINER, empty path, ACLs kept');
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 shape and grants', false, sqlerrm);
-- end $$;
--
-- RESULT, 2026-10-01, on the live schema, each run one execute_sql call, nothing persisted (afterwards both
-- functions read back as get_my_likes(integer) 86730b2051a534a822b7f16a58ca134e and get_my_uploads(integer)
-- d4ba8140fd936245a415147b113eaae6, their ACLs unchanged):
--   RED, without this file's statements: 0, 1, 2, 3 and 4 fail ("function public.get_my_uploads(p_limit =>
--     integer, p_before_created_at => timestamp with time zone, p_before_id => uuid) does not exist", and its
--     like for each), 5 holds (the shape this file keeps).
--   GREEN, with them: 6/6. 0 the cursor answers; 1 376 uploads across both arms read in 54 pages of 7 equal the
--     whole feed, in order; 2 3 likes in 2 pages of 2 equal the whole; 3 two likes at one instant split one a page,
--     neither doubled nor lost; 4 anon holds neither, a stranger reads 0 and 0; 5 two functions, DEFINER, empty
--     search_path, the three grants. No live account holds 1,000 feed rows, so the clamp is pinned by
--     row-cap-sql.test.ts, not exercised here.
--   The new bodies (whitespace collapsed): get_my_uploads 21068680e6eb9a8d1d2f16fe17aac9c2, get_my_likes
--     648daea282e9ef5c82dac6ef405e9198.
-- =============================================================================================
