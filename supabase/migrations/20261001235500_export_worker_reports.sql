-- =============================================================================================
-- WHAT THE EXPORT WORKER SAW, ON THE EXPORT'S OWN ROW (lane `export-ends`; ROADMAP's two Exports lines,
-- "a part's saved needs the Worker to report a finished stream" and "/admin/exports counts mints only").
--
-- export_log has held one row a mint (20260622160000): what the app authorized and signed. Everything after
-- that happened on the Worker, which cannot reach the database, so a check that found objects gone and a
-- stream that skipped some, stopped or broke lived only in Cloudflare's logs, and the walk could never say a
-- zip was saved. The Worker now reports each fact back in a signed POST (`/api/export/report`, the export
-- secret in a domain of its own), and the app, still the one writer of export_log, keeps it on the mint's
-- row, found by the token's nonce:
--
--   1. The check: checked_at (when the Worker answered it) and check_found (how many of item_count it
--      found; null beside a checked_at when the bucket could not answer).
--   2. The stream: stream_started_at (its first file went out), then stream_ended_at with stream_outcome
--      (saved; short, objects gone mid-way; stopped, the client left; failed, an object read broke it;
--      empty, nothing left, so no file was sent), stream_files (how many went in whole) and
--      stream_missing (the media ids the zip does not hold whole, which the walk's Try again asks for).
--   3. export_log_jti_key: the nonce is unique (17 of 17 live minted rows carry their own) and is how
--      every report and the walk's status poll find the row, so each is one index probe, not a scan.
--
-- ★ EACH REPORT ONLY EVER FILLS AN EMPTY FIELD (the app's writes, `queries/exports.ts`): a start lands only
-- where none has, an end only where none has, so reports that arrive out of order or twice (a replay inside
-- the five-minute window `report.ts` allows) change nothing already said. The CHECKs hold the shape the walk
-- and the portal read: a known outcome, an end time exactly when there is an outcome, counts within the
-- zip's own item_count.
--
-- GRANTS: none. export_log stays deny-all (RLS on, no policy; anon holds nothing on any table and
-- authenticated's SELECT went in 20260929160000), so the new columns reach the service role alone, and no
-- client role can read or write one (the check at the foot asks has_column_privilege of each).
--
-- LOCKS AT APPLY: `add column` (nullable, no default) is a catalog change under ACCESS EXCLUSIVE for an
-- instant; the CHECKs validate over the table's rows (21 live) under the same lock; `create unique index`
-- (not concurrently: apply_migration runs in a transaction) holds SHARE over 17 non-null nonces. An instant
-- each; the mint routes' one insert waits that long.
--
-- DEPLOYED BUILDS: partyreel.com (milestones 31 and 32) and the alias name only export_log's old columns
-- (insert by name, select by name), so nothing they run moves; apply this BEFORE (or with) the deploy of the
-- app that writes these columns, or that app's report writes and status reads fail until it lands (the
-- mint itself never depends on them).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: export_log has exactly id, created_at, scope, event_id, requester_hash,
--       item_count, total_bytes, jti, outcome, error (information_schema.columns); its indexes are
--       export_log_pkey, export_log_created_idx and export_log_event_time_idx; no two rows share a non-null
--       jti (select jti from export_log where jti is not null group by 1 having count(*) > 1 reads nothing).
--   (2) Apply verbatim.
--   (3) get_advisors: EXPECTED DELTA none (no function, no policy; performance may list
--       export_log_jti_key as unused until the first report reads it).
--   (4) Regenerate src/lib/db/types.ts (export_log gains seven columns), then drop the typed seam in
--       src/lib/db/queries/exports.ts and src/lib/db/queries/jobs.ts (`untypedAdmin`).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise. Red first:
--       on today's schema it stops at FAIL 1.
-- =============================================================================================

alter table public.export_log
  add column checked_at timestamptz,
  add column check_found integer,
  add column stream_started_at timestamptz,
  add column stream_ended_at timestamptz,
  add column stream_outcome text,
  add column stream_files integer,
  add column stream_missing uuid[];

alter table public.export_log
  add constraint export_log_check_found_range
    check (check_found is null or (check_found >= 0 and check_found <= item_count)),
  add constraint export_log_stream_outcome_known
    check (stream_outcome is null or stream_outcome in ('saved', 'short', 'stopped', 'failed', 'empty')),
  add constraint export_log_stream_ended_with_outcome
    check ((stream_ended_at is null) = (stream_outcome is null)),
  add constraint export_log_stream_files_range
    check (stream_files is null or (stream_files >= 0 and stream_files <= item_count));

create unique index export_log_jti_key on public.export_log (jti) where jti is not null;

-- =============================================================================================
-- THE ROLLED-BACK CHECK (run in ONE execute_sql call; nothing persists: it ends in a deliberate raise)
-- =============================================================================================
-- do $check$
-- declare
--   v_jti constant text := 'e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0';
--   v_missing constant uuid[] := array['66666666-7777-4888-9999-aaaaaaaaaaaa']::uuid[];
--   v_n integer;
--   v_row public.export_log%rowtype;
--   v_col text;
--   v_role text;
-- begin
--   -- ── 1. The seven columns, their types ──
--   select count(*) into v_n from information_schema.columns
--    where table_schema = 'public' and table_name = 'export_log'
--      and (column_name, data_type) in (
--        ('checked_at', 'timestamp with time zone'), ('check_found', 'integer'),
--        ('stream_started_at', 'timestamp with time zone'), ('stream_ended_at', 'timestamp with time zone'),
--        ('stream_outcome', 'text'), ('stream_files', 'integer'), ('stream_missing', 'ARRAY'));
--   if v_n <> 7 then raise exception 'FAIL 1: export_log carries % of the seven Worker columns', v_n; end if;
--
--   -- ── 2. The nonce's unique index, partial on a non-null jti ──
--   if (select pg_get_indexdef(to_regclass('public.export_log_jti_key')))
--      is distinct from 'CREATE UNIQUE INDEX export_log_jti_key ON public.export_log USING btree (jti) WHERE (jti IS NOT NULL)' then
--     raise exception 'FAIL 2: export_log_jti_key is missing or not unique on a non-null jti';
--   end if;
--
--   -- ── 3. The app's writes, as the service role makes them, each filling only an empty field ──
--   set local role service_role;
--   insert into public.export_log (scope, event_id, item_count, total_bytes, jti, outcome)
--     values ('guest', null, 3, 30, v_jti, 'minted');
--   update public.export_log set checked_at = now(), check_found = 2 where jti = v_jti and outcome = 'minted';
--   update public.export_log set stream_started_at = now() where jti = v_jti and outcome = 'minted' and stream_started_at is null;
--   update public.export_log set stream_ended_at = now(), stream_outcome = 'short', stream_files = 2, stream_missing = v_missing
--    where jti = v_jti and outcome = 'minted' and stream_ended_at is null;
--   -- A second end (a replay, or a late one) changes nothing already said.
--   update public.export_log set stream_ended_at = now(), stream_outcome = 'saved', stream_files = 3, stream_missing = '{}'
--    where jti = v_jti and outcome = 'minted' and stream_ended_at is null;
--   get diagnostics v_n = row_count;
--   if v_n <> 0 then raise exception 'FAIL 3: a second end report rewrote the first'; end if;
--   select * into v_row from public.export_log where jti = v_jti;
--   if v_row.stream_outcome <> 'short' or v_row.stream_files <> 2 or v_row.stream_missing <> v_missing
--      or v_row.check_found <> 2 or v_row.stream_started_at is null then
--     raise exception 'FAIL 3: the row reads %', row_to_json(v_row);
--   end if;
--   reset role;
--
--   -- ── 4. The CHECKs refuse a shape the walk and the portal cannot read ──
--   begin
--     update public.export_log set stream_outcome = 'launched', stream_ended_at = now() where id = v_row.id;
--     raise exception 'FAIL 4: an unknown outcome was kept';
--   exception when check_violation then null; end;
--   begin
--     update public.export_log set stream_ended_at = null where id = v_row.id;
--     raise exception 'FAIL 4: an outcome was kept with no end time';
--   exception when check_violation then null; end;
--   begin
--     update public.export_log set check_found = 4 where id = v_row.id;
--     raise exception 'FAIL 4: a check found more than the zip held';
--   exception when check_violation then null; end;
--   begin
--     update public.export_log set stream_files = 4 where id = v_row.id;
--     raise exception 'FAIL 4: a zip held more files than it was minted with';
--   exception when check_violation then null; end;
--   begin
--     insert into public.export_log (scope, item_count, jti, outcome) values ('host', 1, v_jti, 'minted');
--     raise exception 'FAIL 4: a second row took the same nonce';
--   exception when unique_violation then null; end;
--
--   -- ── 5. No client role reaches a new column ──
--   foreach v_role in array array['anon', 'authenticated'] loop
--     foreach v_col in array array['checked_at', 'check_found', 'stream_started_at', 'stream_ended_at',
--                                  'stream_outcome', 'stream_files', 'stream_missing'] loop
--       if has_column_privilege(v_role, 'public.export_log', v_col, 'select')
--          or has_column_privilege(v_role, 'public.export_log', v_col, 'update') then
--         raise exception 'FAIL 5: % holds a privilege on export_log.%', v_role, v_col;
--       end if;
--     end loop;
--   end loop;
--
--   raise exception 'ROLLED BACK: every export-worker-reports check held {rows %}',
--     (select count(*) from public.export_log);
-- end
-- $check$;
