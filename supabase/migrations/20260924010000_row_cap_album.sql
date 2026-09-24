-- The 1,000-row cap, part 1 of 3: the guest album, the host's like counts, the viewer's own hearts
-- (Will, 2026-09-23: "Let's ensure we will not face any of those issues here").
--
-- WHY: PostgREST cuts every table read and every set-returning RPC at `max_rows` (1,000 on this
-- project) with no error and no flag. The Orchestrator measured it on the 1,200-photo scale probe on
-- 2026-09-23: an unbounded read of 1,024 rows came back as 1,000 under `Content-Range: 0-999/*`. On a
-- 1,500-photo wedding, then, a guest's album ends at the newest 1,000 approved items, the host's like
-- counts cover an arbitrary 1,000 of the event's media (the old body is an unordered left join over
-- every item, liked or not), and the browser seeds its hearts with a `.in()` that puts every visible
-- id in the URL. This file gives each of those reads a shape the cap can never cut:
--   1. get_event_media_by_qr_token pages on the album's own display order, a (created_at, id)
--      cursor, with the index that makes every page an index walk;
--   2. get_event_like_counts returns only media somebody liked, paged on media_id;
--   3. my_liked_media_ids answers "which of these have I liked" as ONE uuid[] whose ids ride the POST
--      body, never a URL.
--
-- THE CONVENTION (docs/systems/database-security.md, "Set-returning functions and the row cap"): a
-- set-returning function pages on a keyset cursor and `p_limit`, clamped in SQL to 1,000, or returns
-- one row (a scalar, a jsonb or a uuid[]). The TypeScript reader (`readAllPages`) takes a page
-- shorter than it asked for as the end, which holds only while the live `max_rows` is at least 1,000.
--
-- BACKWARD COMPATIBLE FOR THE BUILDS ALREADY SERVING (partyreel.com at milestone-27 and the alias,
-- older still), which call today's signatures until milestone 28:
--   * Every new parameter defaults to null, and a NULL p_limit applies no limit at all, so a call
--     with the old arguments alone returns exactly today's rows. The album's only change for them is
--     a deterministic tiebreak (`m.id desc` after `m.created_at desc`), so two items sharing a
--     timestamp no longer come back in an arbitrary order.
--   * get_event_like_counts(p_event_id) now leaves out media nobody liked. Every deployed reader maps
--     a missing id to 0: `likeCounts.get(m.id) ?? 0` (src/lib/event/gallery-items.ts), which is the
--     only way a count reaches the host pages, the reel builder and the studio picker, and quick-add
--     reads `likeCount ?? 0` besides. The host sees the same numbers.
--   * my_liked_media_ids and the index are additive; nothing deployed calls or needs them.
--   * PostgREST forbids overloads, so each replaced function is a DROP + CREATE of its one signature
--     inside this file's single transaction, carried from its NEWEST definition (named at each
--     section) and changed only where a ★ says so. A drop takes the grants with it, so each is
--     restated in full, naming every client role: a function created through the Supabase MCP
--     inherits a default EXECUTE for `anon` that a bare `revoke ... from public` does not remove.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-24):
--         get_event_media_by_qr_token(text)   04252d11838c2d273461ac0fe8e33d68  (20260622140000)
--         get_event_like_counts(uuid)         c2ca518640ae248c451a7263d7490600  (20260609160000)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('get_event_media_by_qr_token', 'get_event_like_counts', 'my_liked_media_ids');
--   (2) Apply verbatim. The same query then reads the three new signatures and no other, each body's md5
--       as this file's (measured on the local pre-flight):
--         get_event_media_by_qr_token(text, timestamptz, uuid, integer)   a6b29838596a5a19f419919d2a149278
--         get_event_like_counts(uuid, uuid, integer)                      0d23890fb5184818ae8317b7c31fc738
--         my_liked_media_ids(uuid[])                                      c01ac0a7dd91d6298c7be8452d933e5c
--   (3) The grants: `anon` executes the album RPC and nothing else here.
--   (4) get_advisors. EXPECTED DELTA: NONE. The album RPC stays one of the five anon reads (0028),
--       get_event_like_counts stays in 0029, and my_liked_media_ids is SECURITY INVOKER, so it can
--       sit in neither SECURITY DEFINER list.
--   (5) The rolled-back check at the foot, on the scale probe.
--   (6) Regenerate src/lib/db/types.ts: the two new parameter lists and the new function.

-- =============================================================================================
-- 1. get_event_media_by_qr_token: the guest album, paged on its own display order.
-- =============================================================================================
-- Carried from 20260622140000_gallery_rpcs_preview_key.sql: SQL, stable, SECURITY DEFINER (it is the
-- anon capability read: the opaque qr token plus `visibility = 'open'` IS the authorization), an empty
-- search_path, the same RETURNS TABLE, the same four gates. Callers: getEventMediaByQrToken
-- (src/lib/db/queries/guest-events.ts), which serves the album render, the gallery poll and the guest
-- export.
--
-- ★ THE FOUR CHANGES:
--   * The order ALWAYS ends in `m.id desc`. A keyset cursor needs a total order: with `created_at`
--     alone, two items uploaded in the same microsecond could straddle a page boundary and one of
--     them would be skipped or read twice.
--   * The cursor is the last row's (created_at, id): a page returns the rows strictly after it in
--     display order, `(m.created_at, m.id) < (p_before_created_at, p_before_id)`. It applies when
--     p_before_created_at is given; the reader passes both halves from the last row it holds.
--   * `limit least(p_limit, 1000)` applies only when p_limit is given. ★ A null p_limit keeps
--     today's unlimited read, because the deployed builds call with p_qr_token alone. (`least`
--     ignores a null argument, so the bare `least(p_limit, 1000)` would have silently capped them at
--     1,000 in SQL; hence the case.)
--   * The event is resolved FIRST, as a scalar subquery (the join it replaces, with the same three
--     gates: qr_token is unique, so it names at most one event, and a gated one names none). With a
--     constant event id the planner walks media_event_created_id_idx from the cursor in display order
--     and stops at the limit; through a join it read and sorted the event's whole slice on every
--     page (the local pre-flight, 51,210 rows in one event: a page of 1,000 read 1,000 index entries
--     this way, and all 51,210 rows plus a sort through the join).
drop function public.get_event_media_by_qr_token(text);
create function public.get_event_media_by_qr_token(
  p_qr_token text,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default null
)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  width integer,
  height integer,
  duration_seconds double precision,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select m.id, m.type, m.original_key, m.preview_key, m.width, m.height, m.duration_seconds, m.created_at
  from public.media m
  where m.event_id = (
      select e.id
      from public.events e
      where e.qr_token = p_qr_token
        and e.visibility = 'open'
        and e.deleted_at is null
    )
    and m.status = 'approved'
    and (p_before_created_at is null
         or (m.created_at, m.id) < (p_before_created_at, p_before_id))
  order by m.created_at desc, m.id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;
-- Public open-album read (by design anon-accessible: the visibility='open' gate IS the boundary).
revoke all on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) from public;
grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to anon, authenticated;

-- The album's display order as an index: equality on the event, then newest first with the id as the
-- tiebreak, so a page is a walk down one event's slice from the cursor rather than a sort of the whole
-- event. It serves every per-event newest-first read (the host album's pages too, and the newest
-- approved photo that event_covers picks). No index carried the display order before this one (the
-- per-event ones key on status, on reel_eligible, or are the active-bytes partial). A plain
-- `create index` is fine at today's traffic: it blocks writes to media only while this file's
-- transaction runs.
create index media_event_created_id_idx on public.media (event_id, created_at desc, id desc);

-- =============================================================================================
-- 2. get_event_like_counts: liked media only, paged on media_id, host-gated as before.
-- =============================================================================================
-- Carried from 20260609160000_media_likes.sql: SQL, stable, SECURITY DEFINER, an empty search_path,
-- the same RETURNS TABLE, and the same gate: the caller must be the event's host and the event live,
-- or the result is zero rows, so a count can never reach a guest (it is the ONLY count path).
--
-- ★ THE CHANGES:
--   * LIKED MEDIA ONLY: the old body left-joined every media of the event, so an event of 1,500 items
--     answered 1,500 rows, mostly zeros, and the cap kept an arbitrary 1,000 of them (an unliked
--     item's 0 and a liked item's count alike). The join is now from the likes, so the result is as
--     long as the number of liked items; a reader maps an absent id to 0, as every deployed one does.
--     Every status still counts, as before (the host pages read only the statuses they show).
--   * The keyset is media_id: `media_id > p_after`, ordered by media_id; the limit rule is the album's
--     (null p_limit = no limit, for the deployed builds).
drop function public.get_event_like_counts(uuid);
create function public.get_event_like_counts(
  p_event_id uuid,
  p_after uuid default null,
  p_limit integer default null
)
returns table (media_id uuid, like_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select l.media_id, count(*)::integer
  from public.media_likes l
  join public.media m on m.id = l.media_id
  where m.event_id = p_event_id
    and exists (
      select 1 from public.events e
      where e.id = p_event_id
        and e.host_id = (select auth.uid())
        and e.deleted_at is null
    )
    and (p_after is null or l.media_id > p_after)
  group by l.media_id
  order by l.media_id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

-- Authenticated-only, as before (lint 0029): the host gate is inside.
revoke all on function public.get_event_like_counts(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.get_event_like_counts(uuid, uuid, integer) to authenticated;

-- =============================================================================================
-- 3. my_liked_media_ids: which of these ids has the caller liked, as ONE uuid[].
-- =============================================================================================
-- The heart state of a gallery. Today the browser reads it straight from `media_likes` with
-- `.in("media_id", <every visible id>)` (src/components/likes/likes-provider.tsx): about 37 bytes of
-- URL per id, so a large album's request outgrows what a URL can carry, and its failure is swallowed
-- by design (the seed is cosmetic), so the hearts simply start empty. Through this function the ids
-- ride the POST body and the answer is a single value, so neither the URL nor the row cap can clip
-- it.
--
-- SECURITY INVOKER over media_likes' owner-only RLS (`media_likes_owner_select`): it can return only
-- the caller's own likes, exactly what the direct read returned, and the explicit user filter is the
-- same predicate spelled out so the planner can use it. Being INVOKER, it sits in neither SECURITY
-- DEFINER advisor list. Authenticated only: an anonymous viewer has no likes to read.
create function public.my_liked_media_ids(p_media_ids uuid[])
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(l.media_id order by l.media_id), '{}'::uuid[])
  from public.media_likes l
  where l.user_id = (select auth.uid())
    and l.media_id = any(p_media_ids);
$$;

revoke all on function public.my_liked_media_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.my_liked_media_ids(uuid[]) to authenticated;

comment on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) is
  'The guest album (open events): approved media newest first, ordered created_at desc, id desc. Pages on the last row''s (created_at, id) with p_limit clamped to 1,000; a null p_limit reads everything (the deployed builds).';
comment on function public.get_event_like_counts(uuid, uuid, integer) is
  'Like counts for the event''s HOST only (zero rows to anyone else), liked media only, keyset on media_id with p_limit clamped to 1,000; a null p_limit reads everything. A reader maps an absent id to 0.';
comment on function public.my_liked_media_ids(uuid[]) is
  'The caller''s own likes among the given ids, as one uuid[] (owner-only RLS; SECURITY INVOKER). The ids ride the POST body.';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate
-- raise, so nothing persists). It rides the scale probe (event "Scale probe", qr
-- d02631f1bfb3455188d224e41bf9510f, more than 1,000 approved photos) and only EXISTING rows: inside
-- the block it adds likes and forces a timestamp tie, both undone by the final raise. ─────────────
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   v_event uuid;
--   v_host uuid;
--   v_other uuid;
--   v_total integer;
--   v_n integer;
--   v_pages integer;
--   v_all uuid[];
--   v_direct uuid[];
--   v_paged uuid[];
--   v_page uuid[];
--   v_before_at timestamptz;
--   v_before_id uuid;
--   v_after uuid;
--   v_counts jsonb;
--   v_paged_counts jsonb;
--   v_page_counts jsonb;
--   v_hand jsonb;
--   v_ids uuid[];
--   v_mine uuid[];
--   v_theirs uuid[];
--   v_liked integer;
--   v_rows integer;
--   v_clamped integer;
--   v_stranger integer;
-- begin
--   select e.id, e.host_id into v_event, v_host
--     from public.events e
--    where e.qr_token = c_qr and e.visibility = 'open' and e.deleted_at is null;
--   if v_event is null then raise exception 'SETUP: the scale probe (qr %) is not an open, live event', c_qr; end if;
--   select count(*) into v_total from public.media m where m.event_id = v_event and m.status = 'approved';
--   if v_total <= 1000 then
--     raise exception 'SETUP: the probe holds % approved items; the check needs more than 1,000', v_total;
--   end if;
--
--   -- 1. The album, three times: as it stands; with a timestamp tie forced across a page boundary;
--   --    and that tie again with index scans off, so the order comes from a sort and only the
--   --    written ORDER BY (never an index's physical order) can put the tied rows in id order.
--   for v_round in 1..3 loop
--     if v_round = 2 then
--       -- Rows 396..405 of the display order take row 396's timestamp, so page 1 (400 rows) ends
--       -- inside the tie and only the id tiebreak can hand the rest to page 2 exactly once.
--       update public.media m set created_at = (select m2.created_at from public.media m2 where m2.id = v_all[396])
--        where m.id = any(v_all[396:405]);
--     end if;
--     if v_round = 3 then
--       set local enable_indexscan = off;
--       set local enable_bitmapscan = off;
--     end if;
--     -- The deployed build's call: p_qr_token alone, every approved item, the display order.
--     select coalesce(array_agg(r.id order by r.ord), '{}') into v_all
--       from public.get_event_media_by_qr_token(c_qr)
--            with ordinality as r(id, type, original_key, preview_key, width, height, duration_seconds, created_at, ord);
--     select array_agg(m.id order by m.created_at desc, m.id desc) into v_direct
--       from public.media m where m.event_id = v_event and m.status = 'approved';
--     if cardinality(v_all) <> v_total then
--       raise exception 'FAIL (round %): the null-limit call returned % of % approved items', v_round, cardinality(v_all), v_total;
--     end if;
--     if v_all <> v_direct then raise exception 'FAIL (round %): the order is not created_at desc, id desc', v_round; end if;
--     -- Paged at 400 the way the reader pages: the last row's (created_at, id), until an EMPTY page.
--     v_paged := '{}'; v_before_at := null; v_before_id := null; v_pages := 0;
--     loop
--       select coalesce(array_agg(r.id order by r.ord), '{}'),
--              (array_agg(r.created_at order by r.ord desc))[1],
--              (array_agg(r.id order by r.ord desc))[1]
--         into v_page, v_before_at, v_before_id
--         from public.get_event_media_by_qr_token(c_qr, v_before_at, v_before_id, 400)
--              with ordinality as r(id, type, original_key, preview_key, width, height, duration_seconds, created_at, ord);
--       exit when cardinality(v_page) = 0;
--       if cardinality(v_page) > 400 then raise exception 'FAIL: a page of % rows at p_limit 400', cardinality(v_page); end if;
--       v_paged := v_paged || v_page;
--       v_pages := v_pages + 1;
--       if v_pages > 50 then raise exception 'FAIL: the album pages never ended'; end if;
--     end loop;
--     if v_paged <> v_all then raise exception 'FAIL (round %): paged at 400 differs from the unpaged call', v_round; end if;
--     select count(distinct x) into v_n from unnest(v_paged) as x;
--     if v_n <> v_total then raise exception 'FAIL (round %): % unique ids across the pages, not %', v_round, v_n, v_total; end if;
--     raise notice 'OK (round %): % approved items, paged at 400 in % pages, in the unpaged order', v_round, v_total, v_pages;
--   end loop;
--   reset enable_indexscan;
--   reset enable_bitmapscan;
--
--   -- 2. The clamp and the gates.
--   select count(*) into v_n from public.get_event_media_by_qr_token(c_qr, null, null, 5000);
--   if v_n <> 1000 then raise exception 'FAIL: p_limit 5000 returned % rows, not the 1,000 clamp', v_n; end if;
--   select count(*) into v_n from public.get_event_media_by_qr_token(c_qr, null, null, 0);
--   if v_n <> 0 then raise exception 'FAIL: p_limit 0 returned % rows', v_n; end if;
--   select count(*) into v_n
--     from public.events e, lateral public.get_event_media_by_qr_token(e.qr_token) r
--    where e.visibility <> 'open' or e.deleted_at is not null;
--   if v_n <> 0 then raise exception 'FAIL: % rows came back from events that are not open and live', v_n; end if;
--   raise notice 'OK: p_limit clamps at 1,000, and only an open, live event answers';
--
--   -- 3. Like counts: liked media only, paged on media_id, for the host alone. 1,100 of the probe's
--   --    approved items gain a like from the host here, so the liked set outgrows the cap.
--   insert into public.media_likes (media_id, user_id)
--   select m.id, v_host from public.media m
--    where m.event_id = v_event and m.status = 'approved'
--    order by m.created_at, m.id
--    limit 1100
--   on conflict do nothing;
--   select jsonb_object_agg(l.media_id, l.n), count(*) into v_hand, v_liked
--     from (select x.media_id, count(*)::integer as n from public.media_likes x
--             join public.media m on m.id = x.media_id where m.event_id = v_event group by x.media_id) l;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select jsonb_object_agg(r.media_id, r.like_count), count(*) into v_counts, v_n
--     from public.get_event_like_counts(v_event) r;
--   v_paged_counts := '{}'; v_after := null; v_pages := 0;
--   loop
--     select coalesce(jsonb_object_agg(r.media_id, r.like_count), '{}'),
--            (array_agg(r.media_id order by r.media_id desc))[1],
--            count(*)
--       into v_page_counts, v_after, v_rows
--       from public.get_event_like_counts(v_event, v_after, 400) r;
--     exit when v_rows = 0;
--     if v_rows > 400 then raise exception 'FAIL: a like-count page of % rows at p_limit 400', v_rows; end if;
--     v_paged_counts := v_paged_counts || v_page_counts;
--     v_pages := v_pages + 1;
--     if v_pages > 50 then raise exception 'FAIL: the like-count pages never ended'; end if;
--   end loop;
--   select count(*) into v_clamped from public.get_event_like_counts(v_event, null, 5000);
--   perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
--   select count(*) into v_stranger from public.get_event_like_counts(v_event);
--   reset role;
--   if v_counts <> v_hand or v_n <> v_liked then
--     raise exception 'FAIL: the host''s counts (% rows) differ from the hand tally (% liked items)', v_n, v_liked;
--   end if;
--   if v_paged_counts <> v_hand then raise exception 'FAIL: the like counts paged at 400 differ from the hand tally'; end if;
--   if exists (select 1 from jsonb_each_text(v_counts) c where c.value::integer < 1) then
--     raise exception 'FAIL: an unliked item came back';
--   end if;
--   if v_liked <= 1000 or v_clamped <> 1000 then
--     raise exception 'FAIL: % liked items, and p_limit 5000 returned % (the clamp is 1,000)', v_liked, v_clamped;
--   end if;
--   if v_stranger <> 0 then raise exception 'FAIL: a caller who is not the host read % count rows', v_stranger; end if;
--   raise notice 'OK: % liked items, the host''s counts equal a hand tally paged or not; a stranger reads none', v_liked;
--
--   -- 4. my_liked_media_ids: the caller's own likes among every probe id (the POST body), and nobody
--   --    else's. Another account likes one probe item here, so the two answers must differ.
--   select array_agg(m.id) into v_ids from public.media m where m.event_id = v_event;
--   select p.id into v_other from public.profiles p where p.id <> v_host order by p.created_at limit 1;
--   if v_other is null then raise exception 'SETUP: no second profile to like an item'; end if;
--   insert into public.media_likes (media_id, user_id) values (v_all[1], v_other) on conflict do nothing;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_mine := public.my_liked_media_ids(v_ids);
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   v_theirs := public.my_liked_media_ids(v_ids);
--   reset role;
--   if v_mine is distinct from (select coalesce(array_agg(l.media_id order by l.media_id), '{}') from public.media_likes l
--                                where l.user_id = v_host and l.media_id = any(v_ids)) then
--     raise exception 'FAIL: the host''s hearts differ from their own likes';
--   end if;
--   if v_theirs is distinct from (select coalesce(array_agg(l.media_id order by l.media_id), '{}') from public.media_likes l
--                                  where l.user_id = v_other and l.media_id = any(v_ids)) then
--     raise exception 'FAIL: the second account''s hearts differ from their own likes';
--   end if;
--   if not (v_all[1] = any(v_theirs)) or cardinality(v_mine) < 1100 then
--     raise exception 'FAIL: % hearts for the host, and the second account''s like is missing', cardinality(v_mine);
--   end if;
--   raise notice 'OK: % hearts for the host and % for a second account, each only their own', cardinality(v_mine), cardinality(v_theirs);
--
--   -- 5. The grants and the shapes: anon executes the album and nothing else here.
--   if not has_function_privilege('anon', 'public.get_event_media_by_qr_token(text, timestamptz, uuid, integer)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_event_media_by_qr_token(text, timestamptz, uuid, integer)', 'execute') then
--     raise exception 'FAIL: the album lost its anon or authenticated EXECUTE';
--   end if;
--   if has_function_privilege('anon', 'public.get_event_like_counts(uuid, uuid, integer)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_event_like_counts(uuid, uuid, integer)', 'execute') then
--     raise exception 'FAIL: get_event_like_counts is not authenticated-only';
--   end if;
--   if has_function_privilege('anon', 'public.my_liked_media_ids(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.my_liked_media_ids(uuid[])', 'execute') then
--     raise exception 'FAIL: my_liked_media_ids is not authenticated-only';
--   end if;
--   if to_regprocedure('public.get_event_media_by_qr_token(text)') is not null
--      or to_regprocedure('public.get_event_like_counts(uuid)') is not null then
--     raise exception 'FAIL: an old signature survived (PostgREST cannot choose between overloads)';
--   end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('get_event_media_by_qr_token', 'get_event_like_counts', 'my_liked_media_ids')) <> 3 then
--     raise exception 'FAIL: expected exactly one signature per function';
--   end if;
--   if not (select p.prosecdef from pg_proc p where p.oid = 'public.get_event_media_by_qr_token(text, timestamptz, uuid, integer)'::regprocedure)
--      or not (select p.prosecdef from pg_proc p where p.oid = 'public.get_event_like_counts(uuid, uuid, integer)'::regprocedure)
--      or (select p.prosecdef from pg_proc p where p.oid = 'public.my_liked_media_ids(uuid[])'::regprocedure) then
--     raise exception 'FAIL: a security mode moved (the two reads DEFINER, my_liked_media_ids INVOKER)';
--   end if;
--   if exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('get_event_media_by_qr_token', 'get_event_like_counts', 'my_liked_media_ids')
--        and p.proconfig is distinct from array['search_path=""']) then
--     raise exception 'FAIL: a search_path is not pinned to empty';
--   end if;
--   if to_regclass('public.media_event_created_id_idx') is null then raise exception 'FAIL: the album index is missing'; end if;
--   raise notice 'OK: the grants, one signature each, the security modes, the search_path and the index';
--
--   raise exception 'ROLLED BACK: every row_cap_album check held';
-- end $$;
