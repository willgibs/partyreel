-- =============================================================================================
-- THE ALBUM'S BULK LIKE AS ONE CALL, AND A WINDOW'S LIKE COUNTS (lane `album-host-wiring`).
--
-- The hub's album moves onto the paged album: its manifest holds every item, a window mints links
-- for what is on screen, and select mode can take the whole album at once. Two reads and writes
-- still assumed the old whole-album page:
--   1. like_many(uuid[])                 the bulk Like. `likeMany` (likes-provider.tsx) fired one
--                                        like_media request per selected id, all at once, so a whole
--                                        1,145-photo album selected was 1,145 parallel requests (the
--                                        ROADMAP's "Likes" line). Now: ONE call a batch.
--   2. media_like_counts(uuid, uuid[])   the host's like counts for exactly the ids a window asks
--                                        for, one jsonb, read by the host's links route and the hub
--                                        page on the service role after their own ownership check.
--                                        get_event_like_counts pages over EVERY liked item of the
--                                        event, which a per-window read cannot afford.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT UNTOUCHED. Both functions are new and nothing deployed
-- calls them; no table, column, policy or existing function changes.
--
-- ★ BOTH ARE SECURITY INVOKER, SO THE ADVISOR LISTS DO NOT GROW (database-security.md: prefer
-- INVOKER; a new DEFINER function is service-role only).
--   * like_many holds no privilege of its own: authenticated cannot INSERT into media_likes (the
--     table grant withholds it), so every row still goes in through like_media, the ONE
--     access-checked insert path, called once per id inside this one transaction. The predicate
--     "a like is only as visible as its media" keeps its single home, and a caller who could not
--     like an id one at a time cannot like it here. Per id, like_media is an indexed EXISTS and an
--     idempotent insert: a full batch of 2,000 is well under the request's statement timeout.
--   * media_like_counts reads every liker's rows, which media_likes' owner-only RLS hides from a
--     client role, so it is SERVICE ROLE ONLY (it bypasses RLS) and never in either advisor list:
--     the same shape as album_changes_since. Its callers verify the caller owns the event first
--     (getUser() and the RLS-scoped getEvent), and the event filter inside means an id from another
--     album can never be counted even if one slipped in.
--
-- ★ THE ROW CAP (database-security.md, "Set-returning functions and the row cap"): both return ONE
-- jsonb, never a set, so PostgREST's 1,000-row cut cannot touch them, and both bound their input:
-- like_many refuses more than 2,000 ids (MAX_BULK_ITEMS, the export's cap, src/lib/event/
-- bulk-selection.ts; the client sends a bigger selection in batches of it), and media_like_counts
-- reads at most the first 2,000 of the ids it is handed.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: neither new function exists yet, and like_media's live body is its only
--       definition's (20260609160000; live it was applied without the file's three inline comments,
--       the same statements):
--         like_media(uuid)                       14c68f38efbdbd54aab20b1f72f82638  (measured 2026-09-25)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('like_media', 'like_many', 'media_like_counts');
--   (2) Apply verbatim. The same query then reads the two new signatures beside like_media, each body's
--       md5 as this file's (measured on the live rolled-back proof below, and the local pre-flight):
--         like_many(uuid[])                      4ca0e6da80d55ac9e211e7b99a427d78
--         media_like_counts(uuid, uuid[])        1f1cf658856f647610816fbf27833fdc
--   (3) The grants, restated in full because a create inherits EXECUTE for PUBLIC, anon,
--       authenticated and service_role (Postgres's default plus the project's default privileges):
--         like_many            postgres, authenticated, service_role (never anon, never PUBLIC)
--         media_like_counts    postgres, service_role (no client role)
--   (4) get_advisors. EXPECTED DELTA: NONE (the set as database-security.md states it): both are
--       SECURITY INVOKER, so neither sits in 0028 or 0029; no table is created.
--   (5) Regenerate src/lib/db/types.ts: the two new functions.
--   (6) The rolled-back check at the foot (it rides the scale probe and ends in a deliberate raise).
--
-- PROVED BEFORE THE APPLY (2026-09-25): on a throwaway Postgres 17 (a stand-in of media, events,
-- guests, profiles and media_likes with its RLS and grants, like_media verbatim, the project's
-- default privileges), the file applied verbatim and the check held; 1,200 distinct ids liked in
-- 42 ms and again in 20 ms. On the live project, this file's statements at the head of the check in
-- ONE DO block ended on `ROLLED BACK: every like_many check held {liked 40, refused 3, counted 40,
-- the grants and md5s above}` (no foreign candidate on live, so three refusals), and the catalog and
-- the probe read unchanged afterwards (no new function; 20 pending, 35 removed, 1,145 approved).
-- =============================================================================================

-- =============================================================================================
-- 1. like_many: like every one of these ids, in one call.
-- =============================================================================================
-- The shape: { ok: true, liked: <how many of the distinct ids are liked now>, failed: [<ids>] }.
--   * Idempotent like like_media: an id already liked counts as liked, and a repeated id is one id.
--   * `failed` is every id like_media refused (not approved, removed, the event deleted, an album the
--     caller cannot see, an unknown id), so the caller reverts exactly those hearts and no other.
--   * Refusals are answers, never errors: { ok: false, reason: 'unauthorized' } with no session,
--     { ok: false, reason: 'too_many' } past 2,000 distinct ids, and nothing is written either way.
--   * A null or empty list is { ok: true, liked: 0, failed: [] }.
create function public.like_many(p_media_ids uuid[])
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_failed uuid[] := '{}';
  v_id uuid;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select coalesce(array_agg(distinct x), '{}') into v_ids
  from unnest(coalesce(p_media_ids, '{}')) as x
  where x is not null;

  if cardinality(v_ids) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  foreach v_id in array v_ids loop
    if not coalesce((public.like_media(v_id) ->> 'ok')::boolean, false) then
      v_failed := v_failed || v_id;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'liked', cardinality(v_ids) - cardinality(v_failed),
    'failed', to_jsonb(v_failed)
  );
end;
$$;

-- Authenticated-only; every client role named, because a function created through the MCP inherits
-- an anon EXECUTE that a bare `revoke ... from public` leaves behind (CLAUDE.md's ★). like_media's
-- own grant (authenticated) is what lets this INVOKER body call it.
revoke all on function public.like_many(uuid[]) from public, anon, authenticated;
grant execute on function public.like_many(uuid[]) to authenticated;

comment on function public.like_many(uuid[]) is
  'The album''s bulk Like: likes each distinct id through like_media (the one access-checked insert path), up to 2,000 a call (MAX_BULK_ITEMS; more answers too_many and writes nothing). Answers one jsonb, { ok, liked, failed[] }, failed being the ids like_media refused. SECURITY INVOKER, authenticated only.';

-- =============================================================================================
-- 2. media_like_counts: the like counts of exactly these ids, in this event.
-- =============================================================================================
-- The shape: { "<media id>": <count>, ... } for the given ids somebody liked; an id nobody liked is
-- ABSENT and reads as 0, the convention every count reader already keeps (get_event_like_counts).
-- Every status counts, as get_event_like_counts counts it: the host's pages read only the statuses
-- they show. The join is from the likes (their primary key leads on media_id), so the cost is the
-- likes of the asked ids, never the event's.
create function public.media_like_counts(p_event_id uuid, p_media_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(c.media_id::text, c.n), '{}'::jsonb)
  from (
    select l.media_id, count(*)::integer as n
    from public.media_likes l
    join public.media m on m.id = l.media_id
    where m.event_id = p_event_id
      and l.media_id = any(p_media_ids[1:2000])
    group by l.media_id
  ) c;
$$;

-- Service role only (it reads every liker's rows, which RLS hides from a client role): no client
-- role keeps the EXECUTE a create inherits.
revoke all on function public.media_like_counts(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.media_like_counts(uuid, uuid[]) to service_role;

comment on function public.media_like_counts(uuid, uuid[]) is
  'The host''s like counts for the given ids in the given event (at most the first 2,000), as one jsonb { media id: count }; an id nobody liked is absent (reads as 0). Service role only: the host''s links route and page call it after their own ownership check.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). It rides the scale probe
-- (event "Scale probe", qr d02631f1bfb3455188d224e41bf9510f, willg97's) and only EXISTING rows: its
-- host likes a batch of the probe's approved photos, a hidden one and a removed one, and another
-- event's photo is asked for too. The error it ends on must read
-- `ROLLED BACK: every like_many check held {...}`.
-- =============================================================================================
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   c_acl constant jsonb := jsonb_build_object(
--     'like_many', jsonb_build_array('authenticated', 'postgres', 'service_role'),
--     'media_like_counts', jsonb_build_array('postgres', 'service_role'));
--   v_event uuid;
--   v_host uuid;
--   v_batch uuid[];
--   v_hidden uuid;
--   v_removed uuid;
--   v_foreign uuid;
--   v_foreigns uuid[];
--   v_before integer;
--   v_after integer;
--   v_json jsonb;
--   v_counts jsonb;
--   v_hand jsonb;
--   v_acl jsonb;
--   v_big uuid[];
--   v_report jsonb := '{}'::jsonb;
-- begin
--   select e.id, e.host_id into v_event, v_host from public.events e
--    where e.qr_token = c_qr and e.deleted_at is null;
--   if v_event is null then raise exception 'SETUP: the scale probe (qr %) is not a live event', c_qr; end if;
--   select array_agg(m.id order by m.created_at desc, m.id desc) into v_batch
--     from (select m.id, m.created_at from public.media m
--            where m.event_id = v_event and m.status = 'approved'
--            order by m.created_at desc, m.id desc limit 40) m;
--   if cardinality(v_batch) < 40 then raise exception 'SETUP: the probe holds fewer than 40 approved photos'; end if;
--   -- One approved photo turned hidden, inside this block only, and one already in the bin; neither
--   -- liked by the host yet (the probe's disposable states include a few old likes).
--   select m.id into v_hidden from public.media m
--    where m.event_id = v_event and m.status = 'approved' and m.id <> all(v_batch)
--      and not exists (select 1 from public.media_likes l where l.media_id = m.id and l.user_id = v_host)
--    order by m.created_at, m.id limit 1;
--   update public.media set status = 'hidden' where id = v_hidden;
--   select m.id into v_removed from public.media m
--    where m.event_id = v_event and m.status = 'removed'
--      and not exists (select 1 from public.media_likes l where l.media_id = m.id and l.user_id = v_host)
--    limit 1;
--   if v_hidden is null or v_removed is null then raise exception 'SETUP: the probe has no unliked approved or removed item'; end if;
--   -- Another host's approved photo in an album the probe host is no guest of.
--   select m.id into v_foreign from public.media m join public.events e on e.id = m.event_id
--    where e.host_id <> v_host and e.deleted_at is null and m.status = 'approved'
--      and not exists (select 1 from public.guests g where g.event_id = e.id and g.user_id = v_host)
--      and e.visibility <> 'open'
--      and not exists (select 1 from public.media_likes l where l.media_id = m.id and l.user_id = v_host)
--    limit 1;
--   v_foreigns := case when v_foreign is null then '{}'::uuid[] else array[v_foreign] end;
--   select count(*) into v_before from public.media_likes l where l.user_id = v_host and l.media_id = any(v_batch);
--
--   -- 1. The grants, exactly.
--   select jsonb_object_agg(p.proname, (
--            select jsonb_agg(coalesce(r.rolname, 'PUBLIC') order by coalesce(r.rolname, 'PUBLIC') collate "C")
--              from aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee
--             where a.privilege_type = 'EXECUTE'))
--     into v_acl
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('like_many', 'media_like_counts');
--   if v_acl <> c_acl then raise exception 'FAIL: the grants read %, not %', v_acl, c_acl; end if;
--   if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--               where n.nspname = 'public' and p.proname in ('like_many', 'media_like_counts') and p.prosecdef) then
--     raise exception 'FAIL: a new function is SECURITY DEFINER';
--   end if;
--   v_report := v_report || jsonb_build_object('grants', v_acl);
--
--   -- 2. As the probe's host: the batch, twice over (a repeated id is one id), the hidden photo, the
--   --    removed one, another album's and a made-up id. Only the batch is liked.
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_json := public.like_many(v_batch || v_batch || array[v_hidden, v_removed, gen_random_uuid()] || v_foreigns);
--   reset role;
--   if (v_json->>'ok')::boolean is not true then raise exception 'FAIL: like_many answered %', v_json; end if;
--   if (v_json->>'liked')::integer <> 40 then raise exception 'FAIL: liked % of the 40, %', v_json->>'liked', v_json; end if;
--   if jsonb_array_length(v_json->'failed') <> 3 + cardinality(v_foreigns) then
--     raise exception 'FAIL: failed should hold the hidden, the removed, the unknown and the foreign id: %', v_json;
--   end if;
--   if not (v_json->'failed') @> to_jsonb(array[v_hidden, v_removed]) then raise exception 'FAIL: % missing a refusal', v_json; end if;
--   select count(*) into v_after from public.media_likes l where l.user_id = v_host and l.media_id = any(v_batch);
--   if v_after <> 40 then raise exception 'FAIL: % of the 40 are liked after the call', v_after; end if;
--   if exists (select 1 from public.media_likes l where l.user_id = v_host
--               and l.media_id = any(array[v_hidden, v_removed] || v_foreigns)) then
--     raise exception 'FAIL: a refused id was liked';
--   end if;
--   v_report := v_report || jsonb_build_object('liked', v_json->'liked', 'refused', jsonb_array_length(v_json->'failed'), 'already', v_before);
--
--   -- 3. Again: idempotent, nothing new written.
--   set local role authenticated;
--   v_json := public.like_many(v_batch);
--   reset role;
--   if (v_json->>'liked')::integer <> 40 or jsonb_array_length(v_json->'failed') <> 0 then
--     raise exception 'FAIL: the repeat answered %', v_json;
--   end if;
--   select count(*) into v_after from public.media_likes l where l.user_id = v_host and l.media_id = any(v_batch);
--   if v_after <> 40 then raise exception 'FAIL: the repeat changed the likes (%)', v_after; end if;
--
--   -- 4. The cap and the refusals: 2,001 distinct ids write nothing; no session, nothing; empty, zero.
--   select array_agg(gen_random_uuid()) into v_big from generate_series(1, 2001);
--   set local role authenticated;
--   v_json := public.like_many(v_big);
--   if v_json <> jsonb_build_object('ok', false, 'reason', 'too_many') then raise exception 'FAIL: 2,001 ids answered %', v_json; end if;
--   v_json := public.like_many('{}');
--   if v_json <> jsonb_build_object('ok', true, 'liked', 0, 'failed', '[]'::jsonb) then raise exception 'FAIL: empty answered %', v_json; end if;
--   v_json := public.like_many(null);
--   if v_json <> jsonb_build_object('ok', true, 'liked', 0, 'failed', '[]'::jsonb) then raise exception 'FAIL: null answered %', v_json; end if;
--   perform set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
--   v_json := public.like_many(v_batch);
--   if v_json <> jsonb_build_object('ok', false, 'reason', 'unauthorized') then raise exception 'FAIL: no session answered %', v_json; end if;
--   reset role;
--   if has_function_privilege('anon', 'public.like_many(uuid[])', 'execute') then raise exception 'FAIL: anon executes like_many'; end if;
--   if has_function_privilege('authenticated', 'public.media_like_counts(uuid, uuid[])', 'execute')
--      or has_function_privilege('anon', 'public.media_like_counts(uuid, uuid[])', 'execute') then
--     raise exception 'FAIL: a client role executes media_like_counts';
--   end if;
--
--   -- 5. The counts, against a hand count: the batch (every one at least the host's like now), the
--   --    hidden one, and another album's id, which is never counted here.
--   select coalesce(jsonb_object_agg(l.media_id::text, l.n), '{}') into v_hand
--     from (select x.media_id, count(*)::integer as n from public.media_likes x
--             join public.media m on m.id = x.media_id
--            where m.event_id = v_event and x.media_id = any(v_batch || v_hidden) group by x.media_id) l;
--   v_counts := public.media_like_counts(v_event, v_batch || array[v_hidden] || v_foreigns);
--   if v_counts <> v_hand then raise exception 'FAIL: the counts % differ from the hand count %', v_counts, v_hand; end if;
--   if not v_counts ?& (select array_agg(x::text) from unnest(v_batch) x) then raise exception 'FAIL: a liked id of the batch is not counted: %', v_counts; end if;
--   if v_foreign is not null and v_counts ? v_foreign::text then raise exception 'FAIL: another album''s id was counted'; end if;
--   if public.media_like_counts(v_event, '{}') <> '{}'::jsonb or public.media_like_counts(v_event, null) <> '{}'::jsonb then
--     raise exception 'FAIL: an empty or null ask answered something';
--   end if;
--   v_report := v_report || jsonb_build_object('counted', (select count(*) from jsonb_object_keys(v_counts)));
--
--   raise exception 'ROLLED BACK: every like_many check held %', v_report;
-- end
-- $$;
