-- =============================================================================================
-- THE PLAN LIMITS' DATABASE READINGS (lane `limits-watch`, 2026-10-04; admin-observability.md, "Plan limits").
--
-- The spend watch's daily run now also measures every vendor's plan meter against the plan's limit
-- (`src/lib/jobs/limits-watch.ts`), so a slow climb toward a ceiling is seen weeks before it is hit. Two of the
-- meters are ours to read and no existing function answers either:
--
--   db_bytes     pg_database_size(current_database()): the whole database, against Supabase Pro's 8 GB disk;
--   media_bytes  the original and the phone copy of every media row, against Cloudflare R2's 10 GB free tier: a
--                FLOOR of the bucket (the previews, about 60 KB each and never metered, and the backup bucket are
--                not in it), which the run says ("at least").
--
-- ONE FUNCTION, one jsonb, read by the watch on the service role: `limits_watch_readings()`. ★ A SECTION THAT
-- FAILS IS MISSING ALONE, never a zero and never taking the other with it (each section traps its own exception;
-- the spend watch's `spend_watch_readings` is the pattern). SECURITY INVOKER (the one table it reads grants the
-- service role SELECT, and pg_database_size needs only CONNECT), search_path pinned, the service role's alone.
--
-- The MAU reading needs no new function: it is `spend_watch_sign_ins(p_since, p_now)` over 30 days.
--
-- AN EXPAND: nothing deployed calls the function, so partyreel.com and the alias run exactly as today. Until it
-- applies, the code that calls it reads those two meters as "No reading: the migration is not applied yet" (a gap
-- on the card, not a failed run).
--
-- LOCKS AT APPLY: one CREATE FUNCTION (catalog only). No table is touched.
--
-- READS AT SCALE: `sum` over `media` is one sequential scan once a day (a row per upload: 100,000 uploads is tens of
-- milliseconds); pg_database_size reads the catalog.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the function does not exist:
--         select proname from pg_proc where proname = 'limits_watch_readings';           -- reads no rows
--   (2) Apply verbatim.
--   (3) get_advisors (security): EXPECTED DELTA none. The function is the service role's alone, so it is in neither
--       0028 nor 0029; no table, policy or client grant is added.
--   (4) Regenerate src/lib/db/types.ts: the function joins Functions. Then drop the typed seam in
--       src/lib/jobs/limits-watch-run.ts (`untyped`).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

create or replace function public.limits_watch_readings()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_out jsonb := '{}'::jsonb;
  v_errors jsonb := '{}'::jsonb;
  v_n numeric;
begin
  -- The whole database, in bytes.
  begin
    v_out := v_out || jsonb_build_object('db_bytes', pg_catalog.pg_database_size(pg_catalog.current_database()));
  exception when others then
    v_errors := v_errors || jsonb_build_object('db_bytes', sqlerrm);
  end;

  -- The bytes media rows hold in the bucket: the original and the phone copy, removed-but-not-yet-purged rows
  -- included (their objects are still there until the purge takes them).
  begin
    select coalesce(sum(m.file_size_bytes + coalesce(m.phone_bytes, 0)), 0) into v_n from public.media m;
    v_out := v_out || jsonb_build_object('media_bytes', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('media_bytes', sqlerrm);
  end;

  return v_out || jsonb_build_object('errors', v_errors);
end;
$$;

comment on function public.limits_watch_readings() is
  'The plan limits'' database readings in one call (src/lib/jobs/limits-watch-run.ts): db_bytes (the whole database) and media_bytes (every media row''s original and phone copy, a floor of the R2 bucket). A section that fails is named in errors and left out, never answered as zero. SECURITY INVOKER, service role only.';

-- =============================================================================================
-- Grants: the service role's alone (PUBLIC's default EXECUTE revoked first).
-- =============================================================================================
revoke all on function public.limits_watch_readings() from public, anon, authenticated;
grant execute on function public.limits_watch_readings() to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it BEFORE the apply, with this file's statements at the head of the same execute_sql call
-- (one implicit transaction), or AFTER the apply on its own; it ends in a deliberate raise, so nothing it touches
-- persists (database-security.md, Workflow). It checks the function's class, pin and grants; that both sections
-- answer as JSON numbers, each equal to a direct reading the check takes itself; that a write to a media row moves
-- exactly its own reading and the other not at all; and that the client roles are refused. The error it ends on must
-- read `ROLLED BACK: every limits-watch check held {...}`.
-- =============================================================================================
-- do $check$
-- declare
--   v_r jsonb;
--   v_after jsonb;
--   v_id uuid;
--   v_n numeric;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   -- ── 1. Class, pin and grants ──
--   if not exists (select 1 from pg_proc p
--                   where p.oid = to_regprocedure('public.limits_watch_readings()')
--                     and not p.prosecdef and p.provolatile = 's' and p.proconfig @> array['search_path=""']) then
--     raise exception 'FAIL 1: the function has the wrong class, volatility or an unpinned search_path';
--   end if;
--   if has_function_privilege('anon', 'public.limits_watch_readings()', 'execute')
--      or has_function_privilege('authenticated', 'public.limits_watch_readings()', 'execute')
--      or not has_function_privilege('service_role', 'public.limits_watch_readings()', 'execute') then
--     raise exception 'FAIL 1: the function is not the service role''s alone';
--   end if;
--
--   -- ── 2. Both sections answer, as numbers, each equal to a direct reading, read as the service role ──
--   set local role service_role;
--   v_r := public.limits_watch_readings();
--   reset role;
--   if v_r -> 'errors' <> '{}'::jsonb then raise exception 'FAIL 2: sections failed: %', v_r -> 'errors'; end if;
--   if jsonb_typeof(v_r -> 'db_bytes') <> 'number' or jsonb_typeof(v_r -> 'media_bytes') <> 'number' then
--     raise exception 'FAIL 2: a section did not answer a number: %', v_r;
--   end if;
--   select coalesce(sum(m.file_size_bytes + coalesce(m.phone_bytes, 0)), 0) into v_n from public.media m;
--   if (v_r ->> 'media_bytes')::numeric <> v_n then
--     raise exception 'FAIL 2: media_bytes % disagrees with its direct sum %', v_r ->> 'media_bytes', v_n;
--   end if;
--   if (v_r ->> 'db_bytes')::bigint <= 0
--      or abs((v_r ->> 'db_bytes')::bigint - pg_database_size(current_database())) > 50 * 1024 * 1024 then
--     raise exception 'FAIL 2: db_bytes % is not the database''s size', v_r ->> 'db_bytes';
--   end if;
--   v_report := v_report || jsonb_build_object('before', v_r - 'errors');
--
--   -- ── 3. A write to a media row moves exactly its own reading ──
--   select m.id into v_id from public.media m limit 1;
--   if v_id is not null then
--     update public.media set file_size_bytes = file_size_bytes + 12345 where id = v_id;
--     set local role service_role;
--     v_after := public.limits_watch_readings();
--     reset role;
--     if (v_after ->> 'media_bytes')::numeric <> (v_r ->> 'media_bytes')::numeric + 12345 then
--       raise exception 'FAIL 3: a write moved media_bytes wrongly: before %, after %', v_r, v_after;
--     end if;
--     v_report := v_report || jsonb_build_object('after', v_after - 'errors');
--   end if;
--
--   -- ── 4. The client roles are refused ──
--   set local role authenticated;
--   begin
--     perform public.limits_watch_readings();
--     raise exception 'FAIL 4: authenticated read the readings';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   set local role anon;
--   begin
--     perform public.limits_watch_readings();
--     raise exception 'FAIL 4: anon read the readings';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--
--   raise exception 'ROLLED BACK: every limits-watch check held %', v_report;
-- end
-- $check$;
