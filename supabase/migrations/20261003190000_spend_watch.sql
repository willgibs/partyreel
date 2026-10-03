-- =============================================================================================
-- THE SPEND WATCH'S READINGS AND ITS SWITCHES (lane `spend-watch`, 2026-10-03; admin-observability.md, "The spend
-- watch").
--
-- Supabase has no budget alert and no ceiling but its on/off spend cap, and Cloudflare has no cap at all, so our own
-- guard reads our own counters (`src/lib/jobs/spend-watch.ts`): each run takes every reading below, and one past ten
-- times the busiest of the week (never under its floor) alerts and pauses the switch that stops its vector. This file
-- gives the run its readings in one call and seeds the three switches it introduces:
--
--   1. spend_watch_sign_ins(p_since, p_now): the accounts whose last sign-in falls in the window. SECURITY DEFINER,
--      because it reads auth.users, which the service role cannot (database-security.md, "A read that asks the
--      invite list's match"); the service role's alone; one count, so no row cap applies.
--   2. spend_watch_readings(p_now, p_lifecycle_kinds): one jsonb, read by the watch on the service role:
--        ledger          the monthly ingress meter's platform totals for p_now's period and the one before, as
--                        {period: [bytes, items]}: a SNAPSHOT the run diffs against its last one, since the meter
--                        never refunds (an upload deleted again still counts: the churn a media count cannot see);
--        album           every album's change counters summed (album_state.version + attr_version), a snapshot too;
--        lifecycle_mail  the mail of the named lifecycle kinds sent in the 24 hours to p_now (sent_emails);
--        sign_ins        the accounts signed in over those 24 hours (1.);
--        downloads       the zips minted over them (export_log, outcome 'minted');
--        purge_runs      the purge cron's runs over them that did work (job_runs, a skipped run left out);
--        errors          per section, the error it met: ★ A SECTION THAT FAILS IS MISSING ALONE, never a zero, and
--                        never takes the others with it (each section traps its own exception).
--      SECURITY INVOKER (every table it reads grants the service role SELECT; the one definer read is 1.), the
--      service role's alone.
--   3. Three switches, seeded ON: `spend_watch_enabled` (the watch's own, like every scheduled job's),
--      `uploads_enabled` (guest uploads, refused at presign in a guest's words while off; fails OPEN) and
--      `lifecycle_mail_enabled` (holds the re-sent lifecycle mail while off; fails CLOSED). A missing row reads as
--      ON everywhere, so the code is safe ahead of this file.
--
-- AN EXPAND: nothing deployed calls either function or reads either new switch, so partyreel.com and the alias run
-- exactly as today until the code that reads them ships; until this applies, that code's watch reads "No reading"
-- for every DB reading and closes its run as an error (never a quiet night).
--
-- LOCKS AT APPLY: two CREATE FUNCTIONs (catalog only) and three ops_flags inserts. No hot table is touched.
--
-- READS AT SCALE: storage_ledger is a row per host a month (a filter on two periods); album_state a row per event;
-- sent_emails, export_log and job_runs each answer from their time index (sent_emails_sent_at_idx,
-- export_log_created_idx, job_runs_job_time_idx); auth.users is read whole, once a run, for one count.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: none of the three keys exists and neither function does:
--         select key from public.ops_flags where key in ('spend_watch_enabled', 'uploads_enabled',
--           'lifecycle_mail_enabled');                                                  -- reads no rows
--         select proname from pg_proc where proname like 'spend_watch_%';               -- reads no rows
--   (2) Apply verbatim.
--   (3) get_advisors (security): EXPECTED DELTA none. Both functions are the service role's alone, so they are in
--       neither 0028 nor 0029; no table, policy or client grant is added.
--   (4) Regenerate src/lib/db/types.ts: the two functions join Functions. Then drop the typed seam in
--       src/lib/jobs/spend-watch-run.ts (`untyped`).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

-- =============================================================================================
-- 1. The one definer read: accounts signed in over a window.
-- =============================================================================================
create or replace function public.spend_watch_sign_ins(p_since timestamptz, p_now timestamptz)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
    from auth.users u
   where u.last_sign_in_at > p_since
     and u.last_sign_in_at <= p_now;
$$;

comment on function public.spend_watch_sign_ins(timestamptz, timestamptz) is
  'The spend watch''s sign-ins reading: accounts whose last_sign_in_at falls in (p_since, p_now]. A floor of the sign-ins (an account signing in twice counts once), the MAU proxy. SECURITY DEFINER (auth.users), service role only.';

-- =============================================================================================
-- 2. The readings, one call a run.
-- =============================================================================================
create or replace function public.spend_watch_readings(p_now timestamptz, p_lifecycle_kinds text[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_since constant timestamptz := p_now - interval '24 hours';
  v_out jsonb := '{}'::jsonb;
  v_errors jsonb := '{}'::jsonb;
  v_json jsonb;
  v_n bigint;
begin
  if p_now is null then
    raise exception 'spend_watch_readings: p_now is required' using errcode = '22004';
  end if;

  -- The monthly ingress meter, this period and the last (the run diffs two snapshots, a new month whole).
  begin
    select coalesce(jsonb_object_agg(l.period, jsonb_build_array(l.bytes, l.items)), '{}'::jsonb)
      into v_json
      from (
        select sl.period,
               coalesce(sum(sl.cumulative_bytes), 0)::bigint as bytes,
               coalesce(sum(sl.photo_count + sl.video_count), 0)::bigint as items
          from public.storage_ledger sl
         where sl.period in (to_char(p_now, 'YYYY-MM'), to_char(p_now - interval '1 month', 'YYYY-MM'))
         group by sl.period
      ) l;
    v_out := v_out || jsonb_build_object('ledger', v_json);
  exception when others then
    v_errors := v_errors || jsonb_build_object('ledger', sqlerrm);
  end;

  -- Every album's change counters (a snapshot: the run diffs two).
  begin
    select coalesce(sum(s.version + s.attr_version), 0)::bigint into v_n from public.album_state s;
    v_out := v_out || jsonb_build_object('album', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('album', sqlerrm);
  end;

  -- The lifecycle mail of the day, by the kinds the app names (send-kinds.ts): none named is an error, never a zero.
  begin
    if p_lifecycle_kinds is null or cardinality(p_lifecycle_kinds) = 0 then
      raise exception 'no lifecycle kinds were named';
    end if;
    select count(*) into v_n
      from public.sent_emails e
     where e.sent_at > v_since and e.sent_at <= p_now
       and e.kind = any (p_lifecycle_kinds);
    v_out := v_out || jsonb_build_object('lifecycle_mail', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('lifecycle_mail', sqlerrm);
  end;

  -- The accounts signed in over the day.
  begin
    v_out := v_out || jsonb_build_object('sign_ins', public.spend_watch_sign_ins(v_since, p_now));
  exception when others then
    v_errors := v_errors || jsonb_build_object('sign_ins', sqlerrm);
  end;

  -- The zips minted over the day.
  begin
    select count(*) into v_n
      from public.export_log x
     where x.created_at > v_since and x.created_at <= p_now
       and x.outcome = 'minted';
    v_out := v_out || jsonb_build_object('downloads', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('downloads', sqlerrm);
  end;

  -- The purge cron's runs over the day that did work (a paused one's skipped rows cost nothing).
  begin
    select count(*) into v_n
      from public.job_runs r
     where r.job = 'purge_cron'
       and r.status <> 'skipped'
       and r.started_at > v_since and r.started_at <= p_now;
    v_out := v_out || jsonb_build_object('purge_runs', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('purge_runs', sqlerrm);
  end;

  return v_out || jsonb_build_object('errors', v_errors);
end;
$$;

comment on function public.spend_watch_readings(timestamptz, text[]) is
  'The spend watch''s readings in one call (src/lib/jobs/spend-watch.ts): the ingress meter''s platform totals for p_now''s period and the last, every album''s change counters, and over the 24 hours to p_now the lifecycle mail of p_lifecycle_kinds, the accounts signed in, the zips minted and the purge cron''s working runs. A section that fails is named in errors and left out, never answered as zero. SECURITY INVOKER, service role only.';

-- =============================================================================================
-- 3. The switches, seeded ON (a missing row reads as on too).
-- =============================================================================================
insert into public.ops_flags (key, enabled) values
  ('spend_watch_enabled', true),
  ('uploads_enabled', true),
  ('lifecycle_mail_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- Grants: the service role's alone (PUBLIC's default EXECUTE revoked first).
-- =============================================================================================
revoke all on function public.spend_watch_sign_ins(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.spend_watch_sign_ins(timestamptz, timestamptz) to service_role;
revoke all on function public.spend_watch_readings(timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.spend_watch_readings(timestamptz, text[]) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate raise, so nothing it
-- touches persists (database-security.md, Workflow). It checks each function's class, pin and grants and the three
-- switches; that every section answers, each equal to a direct count the check takes itself (auth.users included,
-- read here as the owner); that a write inside the window moves exactly its own reading (a lifecycle mail, an
-- operator mail that must not count, a working purge run, a skipped one that must not, a minted zip, a refused one
-- that must not, an upload on the meter); that one section's failure (no lifecycle kinds named) is missing alone; and
-- that the client roles are refused both functions. The error it ends on must read
-- `ROLLED BACK: every spend-watch check held {...}`.
-- The lane ran it on the live project BEFORE the apply (2026-10-03): the file's statements at the head of the same
-- transaction, rolled back (the lane's Handoff).
-- =============================================================================================
-- do $check$
-- declare
--   c_now constant timestamptz := now();
--   c_kinds constant text[] := array['inactivity_warning', 'over_cap_reminder', 'renewal_nudge',
--                                    'inactivity_removed', 'over_cap_grace_start', 'over_cap_reduced'];
--   v_r jsonb;
--   v_after jsonb;
--   v_host uuid;
--   v_n bigint;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   -- ── 1. Class, pin and grants ──
--   if not exists (select 1 from pg_proc p
--                   where p.oid = to_regprocedure('public.spend_watch_sign_ins(timestamptz, timestamptz)')
--                     and p.prosecdef and p.proconfig @> array['search_path=""'])
--      or not exists (select 1 from pg_proc p
--                   where p.oid = to_regprocedure('public.spend_watch_readings(timestamptz, text[])')
--                     and not p.prosecdef and p.proconfig @> array['search_path=""']) then
--     raise exception 'FAIL 1: a function has the wrong class or an unpinned search_path';
--   end if;
--   if has_function_privilege('anon', 'public.spend_watch_sign_ins(timestamptz, timestamptz)', 'execute')
--      or has_function_privilege('authenticated', 'public.spend_watch_sign_ins(timestamptz, timestamptz)', 'execute')
--      or has_function_privilege('anon', 'public.spend_watch_readings(timestamptz, text[])', 'execute')
--      or has_function_privilege('authenticated', 'public.spend_watch_readings(timestamptz, text[])', 'execute')
--      or not has_function_privilege('service_role', 'public.spend_watch_sign_ins(timestamptz, timestamptz)', 'execute')
--      or not has_function_privilege('service_role', 'public.spend_watch_readings(timestamptz, text[])', 'execute') then
--     raise exception 'FAIL 1: a function is not the service role''s alone';
--   end if;
--
--   -- ── 2. The three switches, seeded on ──
--   select count(*) into v_n from public.ops_flags f
--    where f.key in ('spend_watch_enabled', 'uploads_enabled', 'lifecycle_mail_enabled') and f.enabled;
--   if v_n <> 3 then raise exception 'FAIL 2: % of the three switches are seeded on', v_n; end if;
--
--   -- ── 3. Every section answers, each equal to a count taken here ──
--   v_r := public.spend_watch_readings(c_now, c_kinds);
--   if v_r -> 'errors' <> '{}'::jsonb then raise exception 'FAIL 3: sections failed: %', v_r -> 'errors'; end if;
--   if (v_r ->> 'sign_ins')::bigint <> (select count(*) from auth.users u
--         where u.last_sign_in_at > c_now - interval '24 hours' and u.last_sign_in_at <= c_now)
--      or (v_r ->> 'album')::bigint <> (select coalesce(sum(s.version + s.attr_version), 0) from public.album_state s)
--      or (v_r ->> 'downloads')::bigint <> (select count(*) from public.export_log x
--         where x.created_at > c_now - interval '24 hours' and x.created_at <= c_now and x.outcome = 'minted')
--      or (v_r ->> 'purge_runs')::bigint <> (select count(*) from public.job_runs j
--         where j.job = 'purge_cron' and j.status <> 'skipped'
--           and j.started_at > c_now - interval '24 hours' and j.started_at <= c_now)
--      or (v_r ->> 'lifecycle_mail')::bigint <> (select count(*) from public.sent_emails e
--         where e.sent_at > c_now - interval '24 hours' and e.sent_at <= c_now and e.kind = any (c_kinds))
--      or coalesce((v_r -> 'ledger' -> to_char(c_now, 'YYYY-MM') ->> 0)::bigint, 0)
--         <> (select coalesce(sum(sl.cumulative_bytes), 0) from public.storage_ledger sl where sl.period = to_char(c_now, 'YYYY-MM')) then
--     raise exception 'FAIL 3: a section disagrees with its direct count: %', v_r;
--   end if;
--   v_report := v_report || jsonb_build_object('before', v_r - 'errors');
--
--   -- ── 4. Writes inside the window move exactly their own readings ──
--   insert into public.sent_emails (kind, dedupe_key) values
--     ('inactivity_warning', 'spend-watch-check:' || gen_random_uuid()),
--     ('report_urgent', 'spend-watch-check:' || gen_random_uuid());
--   insert into public.job_runs (job, status, started_at, finished_at) values
--     ('purge_cron', 'ok', c_now - interval '1 minute', c_now - interval '1 minute'),
--     ('purge_cron', 'skipped', c_now - interval '1 minute', c_now - interval '1 minute');
--   insert into public.export_log (created_at, scope, outcome) values
--     (c_now - interval '1 minute', 'host', 'minted'),
--     (c_now - interval '1 minute', 'guest', 'rate_limited');
--   select p.id into v_host from public.profiles p limit 1;
--   insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
--   values (v_host, to_char(c_now, 'YYYY-MM'), 12345, 1, 0)
--   on conflict (host_id, period) do update set
--     cumulative_bytes = public.storage_ledger.cumulative_bytes + 12345,
--     photo_count = public.storage_ledger.photo_count + 1;
--   v_after := public.spend_watch_readings(c_now, c_kinds);
--   if (v_after ->> 'lifecycle_mail')::bigint <> (v_r ->> 'lifecycle_mail')::bigint + 1
--      or (v_after ->> 'purge_runs')::bigint <> (v_r ->> 'purge_runs')::bigint + 1
--      or (v_after ->> 'downloads')::bigint <> (v_r ->> 'downloads')::bigint + 1
--      or (v_after -> 'ledger' -> to_char(c_now, 'YYYY-MM') ->> 0)::bigint
--         <> coalesce((v_r -> 'ledger' -> to_char(c_now, 'YYYY-MM') ->> 0)::bigint, 0) + 12345
--      or (v_after -> 'ledger' -> to_char(c_now, 'YYYY-MM') ->> 1)::bigint
--         <> coalesce((v_r -> 'ledger' -> to_char(c_now, 'YYYY-MM') ->> 1)::bigint, 0) + 1 then
--     raise exception 'FAIL 4: a write moved the wrong reading: before %, after %', v_r, v_after;
--   end if;
--   v_report := v_report || jsonb_build_object('after', v_after - 'errors');
--
--   -- ── 5. One section's failure is missing alone ──
--   v_r := public.spend_watch_readings(c_now, array[]::text[]);
--   if not (v_r -> 'errors' ? 'lifecycle_mail') or v_r ? 'lifecycle_mail'
--      or not (v_r ? 'ledger' and v_r ? 'album' and v_r ? 'sign_ins' and v_r ? 'downloads' and v_r ? 'purge_runs') then
--     raise exception 'FAIL 5: a failed section took others with it, or answered: %', v_r;
--   end if;
--
--   -- ── 6. A null clock is refused whole ──
--   begin
--     perform public.spend_watch_readings(null, c_kinds);
--     raise exception 'FAIL 6: a null p_now answered';
--   exception when null_value_not_allowed then null;
--   end;
--
--   -- ── 7. The client roles are refused both ──
--   set local role authenticated;
--   begin
--     perform public.spend_watch_readings(c_now, c_kinds);
--     raise exception 'FAIL 7: authenticated read the readings';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.spend_watch_sign_ins(c_now - interval '1 day', c_now);
--     raise exception 'FAIL 7: authenticated read the sign-ins';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   set local role anon;
--   begin
--     perform public.spend_watch_readings(c_now, c_kinds);
--     raise exception 'FAIL 7: anon read the readings';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--
--   raise exception 'ROLLED BACK: every spend-watch check held %', v_report;
-- end
-- $check$;
