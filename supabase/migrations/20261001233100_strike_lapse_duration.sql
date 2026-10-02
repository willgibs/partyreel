-- =============================================================================================
-- THE STRIKE'S LAPSE, ANSWERED AS A DURATION BY THE RULE THAT HOLDS IT (lane `crumbs-41`; ROADMAP, from `crumbs-36`).
--
-- Why: report_strikes answers the rule's bar and `fresh_lapses_at` (the instant a strike made now would lapse), and
-- the portal derived the lapse itself from the distance between that instant and its own clock (`strikeLapseMs`,
-- rounded to the minute so a round trip's milliseconds could not move a printed date). A reader deriving the rule's
-- number is a second home of it in all but name, and since Will's call #60 (2026-10-01: a child-abuse dismissal stays
-- reopenable for as long as its strike counts) the reopen's guarded write needs the lapse too. So the rule answers it:
-- `lapse_seconds`, the whole seconds of `c_strike_lapse`, beside `fresh_lapses_at`.
--
-- WHAT CHANGES: one key in the answer. The body is 20261001100000's (live's, md5-checked 2026-10-01:
-- 2dd870660580e662101298b550f0502f, whitespace collapsed) with `'lapse_seconds', extract(epoch from
-- c_strike_lapse)::bigint` added to the outer object. What a strike is, both numbers, the count and every other key
-- are unchanged, so create_report (which reads only `addresses.<hash>.barred`) is untouched.
-- ★ The lapse is whole DAYS, never months: in the database's UTC, `timestamptz + interval '180 days'` is exactly
-- 180 * 86,400 seconds later, so `resolved_at + lapse_seconds` is the instant the rule's own `resolved_at +
-- c_strike_lapse` lands on. A month interval would make the two disagree (a month's epoch is 30 days; its arithmetic
-- is the calendar's), so a rule that ever moves to months answers its lapses as instants and drops this key
-- (`strike-lapse-guards.test.ts` refuses a lapse that is not days).
--
-- SHAPE: `create or replace` with the same signature, return type, language, volatility, security mode and empty
-- search_path, so its ACL is kept; the grants are restated as they stand live (2026-10-01:
-- {postgres=X/postgres,service_role=X/postgres}).
--
-- ★ EITHER ORDER IS SAFE: the build before this file never reads `lapse_seconds` (it derives the lapse as before);
-- the build after it reads a missing key as no lapse, so a closed line says nothing of a strike (no reading, never a
-- wrong one) and every dismissal reopens for the product's 30 days, as before #60. Apply it before, or with, the
-- deploy that carries crumbs-41.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the body and ACL before, for the diff:
--         select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname = 'report_strikes';
--       (2dd870660580e662101298b550f0502f, {postgres=X/postgres,service_role=X/postgres});
--   (2) Apply verbatim; (3) the same read after (a new hash, the same ACL);
--   (4) get_advisors: EXPECTED DELTA none (signature, class and grants unchanged);
--   (5) types unchanged (the function returns jsonb);
--   (6) the rolled-back check at the foot, in one execute_sql call: it ends in its deliberate raise.
-- =============================================================================================

create or replace function public.report_strikes(p_reporter_hashes text[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- ★ THREE STRIKES THAT LAPSE, the one home of the rule and both its numbers (Will, 2026-09-30): "I don't want
  -- to prevent a well-meaning reporter from a second report if I simply disagree with the first." A strike is a
  -- child-abuse report from the address that the operator dismissed; it counts until c_strike_lapse after its
  -- dismissal (`resolved_at`), and c_strikes live ones bar the instant hide (create_report asks `barred`).
  c_strikes constant integer := 3;
  c_strike_lapse constant interval := interval '180 days';
begin
  return (
    with asked as (
      select distinct x.hash
        from unnest(p_reporter_hashes) as x(hash)
       where x.hash is not null
    ),
    strike as (
      -- Read as the reports stand: a dismissal's Undo (status back to open, `resolved_at` cleared) is no strike.
      select r.reporter_hash as hash,
             r.resolved_at + c_strike_lapse as lapses_at,
             row_number() over (partition by r.reporter_hash order by r.resolved_at desc, r.id desc) as nth
        from public.reports r
        join asked a on a.hash = r.reporter_hash
       where r.kind = 'child' and r.status = 'dismissed' and r.resolved_at > now() - c_strike_lapse
    )
    select jsonb_build_object(
      'strikes', c_strikes,
      'fresh_lapses_at', now() + c_strike_lapse,
      -- The lapse itself, so no reader derives it from `fresh_lapses_at` and its own clock (crumbs-41): a strike
      -- counts while `resolved_at + lapse_seconds` is still ahead, the closed line says until when, and the reopen of
      -- a child-abuse dismissal lasts as long (Will's #60).
      'lapse_seconds', extract(epoch from c_strike_lapse)::bigint,
      'addresses', coalesce((
        select jsonb_object_agg(a.hash, jsonb_build_object(
                 'live', t.live,
                 'barred', t.live >= c_strikes,
                 'lapses', t.lapses))
          from asked a
          cross join lateral (
            select count(*)::integer as live,
                   coalesce(jsonb_agg(s.lapses_at order by s.nth) filter (where s.nth <= c_strikes),
                            '[]'::jsonb) as lapses
              from strike s
             where s.hash = a.hash
          ) t
      ), '{}'::jsonb)
    )
  );
end;
$$;

revoke all on function public.report_strikes(text[]) from public, anon, authenticated;
grant execute on function public.report_strikes(text[]) to service_role;

comment on function public.report_strikes(text[]) is
  'The instant hide''s strikes, the rule''s one home: for each reporter address hash asked, its live strikes (child-abuse reports from it that the operator dismissed in the last 180 days, by the dismissal''s own time), whether three bar its instant hide, and the lapse instants of its newest three, newest first; with the bar, the lapse itself in whole seconds (lapse_seconds), and the instant a strike made now would lapse. create_report asks it; the portal''s queue, its closed log and the reopen of a child-abuse dismissal read it. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it in one execute_sql call; it ends in a deliberate raise, so nothing it touches
-- persists (database-security.md, Workflow). It asks today's body (inlined below as `pg_temp.report_strikes_before`,
-- 20261001100000's verbatim) and the deployed one the same questions inside one transaction, so `now()` is one
-- instant for both, and it rides the live reports as they stand (no insert: every dismissed child-abuse report that
-- kept its address's hash is asked about).
-- The error it ends on must read `ROLLED BACK: every strike-lapse check held {...}`.
-- The lane ran it on the live project BEFORE the apply (2026-10-01), red on today's schema ("FAIL 1: the answer
-- carries no lapse_seconds"), then green with this file's statements at the head of the same call, rolled back.
-- =============================================================================================
-- do $check$
-- declare
--   v_hashes text[];
--   v_new jsonb;
--   v_old jsonb;
--   v_lapse bigint;
--   v_listed bigint;
--   v_n bigint;
-- begin
--   execute $old$
--     create function pg_temp.report_strikes_before(p_reporter_hashes text[]) returns jsonb
--     language plpgsql stable set search_path = '' as $body$
--     declare
--       c_strikes constant integer := 3;
--       c_strike_lapse constant interval := interval '180 days';
--     begin
--       return (
--         with asked as (
--           select distinct x.hash from unnest(p_reporter_hashes) as x(hash) where x.hash is not null
--         ),
--         strike as (
--           select r.reporter_hash as hash, r.resolved_at + c_strike_lapse as lapses_at,
--                  row_number() over (partition by r.reporter_hash order by r.resolved_at desc, r.id desc) as nth
--             from public.reports r join asked a on a.hash = r.reporter_hash
--            where r.kind = 'child' and r.status = 'dismissed' and r.resolved_at > now() - c_strike_lapse
--         )
--         select jsonb_build_object(
--           'strikes', c_strikes,
--           'fresh_lapses_at', now() + c_strike_lapse,
--           'addresses', coalesce((
--             select jsonb_object_agg(a.hash, jsonb_build_object('live', t.live, 'barred', t.live >= c_strikes, 'lapses', t.lapses))
--               from asked a
--               cross join lateral (
--                 select count(*)::integer as live,
--                        coalesce(jsonb_agg(s.lapses_at order by s.nth) filter (where s.nth <= c_strikes), '[]'::jsonb) as lapses
--                   from strike s where s.hash = a.hash
--               ) t
--           ), '{}'::jsonb)
--         )
--       );
--     end;
--     $body$
--   $old$;
--
--   select array_agg(distinct reporter_hash) into v_hashes
--     from public.reports where kind = 'child' and status = 'dismissed' and reporter_hash is not null;
--   v_new := public.report_strikes(coalesce(v_hashes, '{}'));
--   v_old := pg_temp.report_strikes_before(coalesce(v_hashes, '{}'));
--
--   -- ── 1. The answer carries the lapse, in whole seconds: 180 days ──
--   if not (v_new ? 'lapse_seconds') then raise exception 'FAIL 1: the answer carries no lapse_seconds'; end if;
--   if jsonb_typeof(v_new -> 'lapse_seconds') <> 'number' then
--     raise exception 'FAIL 1: lapse_seconds is a %, not a number', jsonb_typeof(v_new -> 'lapse_seconds');
--   end if;
--   v_lapse := (v_new ->> 'lapse_seconds')::bigint;
--   if v_lapse <> 180 * 86400 then raise exception 'FAIL 1: lapse_seconds is %, not 180 days', v_lapse; end if;
--
--   -- ── 2. It is the distance the rule's own instants measure: fresh_lapses_at is now() plus it, and every lapse the
--   --       answer lists is one of its address's strikes' resolved_at plus it ──
--   if (v_new ->> 'fresh_lapses_at')::timestamptz <> now() + make_interval(secs => v_lapse) then
--     raise exception 'FAIL 2: fresh_lapses_at % is not now() + % s', v_new ->> 'fresh_lapses_at', v_lapse;
--   end if;
--   select count(*), count(*) filter (where not exists (
--            select 1 from public.reports r
--             where r.reporter_hash = a.hash and r.kind = 'child' and r.status = 'dismissed'
--               and r.resolved_at + make_interval(secs => v_lapse) = l.at::timestamptz))
--     into v_listed, v_n
--     from jsonb_each(v_new -> 'addresses') a(hash, reading)
--     cross join lateral jsonb_array_elements_text(a.reading -> 'lapses') l(at);
--   if v_listed = 0 then raise exception 'FAIL 2: no live strike to measure (the check would be vacuous)'; end if;
--   if v_n <> 0 then raise exception 'FAIL 2: % of % listed lapses are not resolved_at + lapse_seconds', v_n, v_listed; end if;
--
--   -- ── 3. Nothing else moved: the answer is today's, key for key, plus the lapse ──
--   if (v_new - 'lapse_seconds') is distinct from v_old then
--     raise exception 'FAIL 3: the answer moved beyond its new key: % vs %', v_new - 'lapse_seconds', v_old;
--   end if;
--
--   -- ── 4. Still the service role's alone, still INVOKER ──
--   if has_function_privilege('anon', 'public.report_strikes(text[])', 'execute')
--      or has_function_privilege('authenticated', 'public.report_strikes(text[])', 'execute')
--      or not has_function_privilege('service_role', 'public.report_strikes(text[])', 'execute')
--      or (select prosecdef from pg_proc where oid = 'public.report_strikes(text[])'::regprocedure) then
--     raise exception 'FAIL 4: report_strikes'' grants or class moved';
--   end if;
--
--   raise exception 'ROLLED BACK: every strike-lapse check held %',
--     jsonb_build_object('lapse_seconds', v_lapse, 'lapses_measured', v_listed,
--                        'addresses', (select count(*) from jsonb_object_keys(v_new -> 'addresses')));
-- end
-- $check$;
