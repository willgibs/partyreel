-- =============================================================================================
-- THE OVER-CAPACITY READ, AND A ONE-TIME NOTICE KEPT UNTIL IT SENDS (lane `crumbs-75`; ROADMAP's two Lifecycle lines,
-- "`sweeps/over-capacity.ts` checks every profile past Free's cap, one `host_storage_summary` call each" and "a
-- one-time notice ... is lost for good when its send fails"). One file for the lane's two schema changes (the name the
-- Orchestrator assigned it); each part stands alone.
--
--   1. over_capacity_candidates(p_after, p_limit): the over-capacity sweep's candidates were every profile storing past
--      the smallest plan's cap (Free's 100 MB), each then asked for its figures with one `host_storage_summary` call
--      through PostgREST. Every paying host stores past 100 MB, so past a few hundred of them a night's share of the
--      purge window reached only some, and an account that had just gone over waited nights for its turn. This answers
--      the accounts the sweep has something to do for, a page a call, with the figures it decides on: every profile
--      with a grace standing (to remind, reduce or clear), or keeping more than its own write line, its effective cap
--      plus a tenth (`capWithWriteHeadroom` in tiers.ts, the line `create_media*` admit up to: cap + cap / 10), where
--      what she keeps is host_storage_summary's active plus Deleted less the reduce's own removals (the sweep's
--      `kept`). The effective cap is her own `storage_cap_bytes`, else her tier's default (`tier_limits`, the one SQL
--      home, under the tiers.ts parity test); a null cap is unlimited and never over. Each row carries the summary it
--      was judged on (active_bytes, deleted_bytes, system_bytes), so the sweep asks for nothing more. Keyset pages on
--      id (p_after, p_limit clamped to 1,000: database-security.md, "Set-returning functions and the row cap").
--      ★ THE METER GOES FIRST: what she keeps can never pass `storage_used_bytes` (the meter holds every byte not yet
--      released or hard-deleted, and active plus Deleted is a part of it), so only an account whose meter passes its
--      own line, or whose grace stands, is summed at all; the sums run in id order behind an optimization fence, as
--      the inner side of a nested loop under the limit, so a page stops once full (measured on a 20,000-profile
--      stand-in: 153 sums for a page of 100, none for the 19,450 well inside their plans). SECURITY INVOKER, the
--      service role's alone (database-security.md: INVOKER is a new read's default; the sweep calls it on the admin
--      client): it reads profiles and calls tier_limits and host_storage_summary, each the service role's already, so
--      it adds no reach.
--   2. notice_retries: `sendOnce` (src/lib/email/send.ts) claims a `sent_emails` row before it sends and releases the
--      claim when Resend refuses, so a mail its sweep sends again while its state lasts is retried the next night. A
--      one-time notice (`STATE_NOTICES`, src/lib/email/send-kinds.ts: an idle event put in Deleted, a grace opened, a
--      plan reduced) is sent AFTER its sweep has moved the state, and the sweep never meets that state again, so one
--      refused send lost it for good: a Resend outage the night an event was removed, and its host was never told. A
--      row here is one notice whose claim or send failed, on sent_emails' own key (kind, dedupe_key): the mail as it
--      was rendered (subject, html, text); whose it is (profile_id; the address is read from the profile at each
--      retry, so no address is copied here, a changed one is honoured and an anonymised account has none); when it
--      first failed (the give-up clock: its default, written by the row's first insert alone) and when it last did.
--      `sendOnce` upserts it beside its release (an upsert names `last_failed_at`, never `first_failed_at`); the sweep
--      that owns the kind retries it first thing each night (`retryParkedNotices`) through the same claim, so a retry
--      stays single, deletes the row once the mail went, and gives a notice up, recorded, 30 days after its first
--      failure. A deleted account's rows go with its profile (on delete cascade). DENY-ALL, like sent_emails: RLS on
--      with no policy and no client grant (a new table in public grants anon and authenticated nothing,
--      20260929160000; the revoke below restates it), so the service role's defaults alone reach it.
--
-- AN EXPAND: nothing deployed calls the function or touches the table, so partyreel.com and the alias run exactly as
-- today. ★ APPLY BEFORE THE LANE'S BUILD DEPLOYS: its over-capacity sweep reads its candidates through the function
-- alone (without it the sweep fails loudly every night, a red card and its Sentry error, never quietly skips), and its
-- `/admin/jobs` reads notice_retries with the console's other health reads, which throw on a missing table (so until
-- it lands every portal page's band reads the console as unreadable); its sends and retries only record failures.
--
-- LOCKS AT APPLY: one CREATE FUNCTION (catalog only); one CREATE TABLE and its index (catalog only), its FK taking a
-- SHARE ROW EXCLUSIVE lock on profiles for an instant while the constraint is added. No existing row is written.
--
-- ADVISORS (security): 19 / 4 / 36 -> 20 / 4 / 36: `rls_enabled_no_policy` gains notice_retries (by design: the
-- deny-all set, database-security.md); the function is an INVOKER read no client role can call, in neither 0028 nor
-- 0029. Performance may list notice_retries_profile_idx as unused until a profile is deleted.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: neither object exists, and host_storage_summary still answers its three columns:
--         select to_regclass('public.notice_retries'),
--                to_regprocedure('public.over_capacity_candidates(uuid, integer)'),
--                pg_get_function_result('public.host_storage_summary(uuid)'::regprocedure);
--       reads null, null, `TABLE(active_bytes bigint, standby_bytes bigint, system_bytes bigint)`.
--   (2) The rolled-back proof at the foot, in one execute_sql call BEFORE the apply, with this file's statements at its
--       head: it ends in its deliberate raise, `ROLLED BACK: every over_capacity_read check held {...}`.
--   (3) Apply verbatim.  (4) get_advisors (security): the delta above.
--   (5) Regenerate src/lib/db/types.ts (notice_retries and over_capacity_candidates appear), then drop the three typed
--       seams: `untyped` in src/lib/email/send.ts and in src/lib/lifecycle/sweeps/over-capacity.ts, and
--       `noticeRetriesDb` in src/lib/db/queries/jobs.ts.
-- =============================================================================================

-- =============================================================================================
-- 1. The over-capacity sweep's candidates.
-- =============================================================================================
create function public.over_capacity_candidates(p_after uuid default null, p_limit integer default null)
returns table (
  id uuid,
  email text,
  tier public.tier_type,
  storage_cap_bytes bigint,
  storage_grace_until timestamptz,
  active_bytes bigint,
  deleted_bytes bigint,
  system_bytes bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, c.email, c.tier, c.storage_cap_bytes, c.storage_grace_until,
         s.active_bytes, s.standby_bytes, s.system_bytes
    from (
      -- The meter first: only an account in a grace, or storing past its own line, is summed at all. Ordered by id
      -- behind an optimization fence (offset 0), so the sums below run in id order under the limit, a nested loop
      -- that stops once the page is full rather than summing every such account first.
      select p.id, p.email, p.tier, p.storage_cap_bytes, p.storage_grace_until,
             coalesce(p.storage_cap_bytes, d.default_cap) as cap
        from public.profiles p
        left join (
          select t.tier, l.default_storage_cap_bytes as default_cap
            from unnest(enum_range(null::public.tier_type)) as t (tier)
            cross join lateral public.tier_limits(t.tier) as l
        ) d on d.tier = p.tier
       where (p_after is null or p.id > p_after)
         and (p.storage_grace_until is not null
              or p.storage_used_bytes > coalesce(p.storage_cap_bytes, d.default_cap)
                                        + coalesce(p.storage_cap_bytes, d.default_cap) / 10)
       order by p.id
      offset 0
    ) c
    cross join lateral public.host_storage_summary(c.id) s
   -- What she keeps by choice (her albums and her own Deleted) against her write line; a grace is always read.
   where c.storage_grace_until is not null
      or s.active_bytes + s.standby_bytes - s.system_bytes > c.cap + c.cap / 10
   order by c.id
   limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.over_capacity_candidates(uuid, integer) from public, anon, authenticated;
grant execute on function public.over_capacity_candidates(uuid, integer) to service_role;

comment on function public.over_capacity_candidates(uuid, integer) is
  'The over-capacity sweep''s candidates (sweeps/over-capacity.ts): every profile with a grace standing, or keeping more than its write line (its effective cap, storage_cap_bytes else tier_limits'' default, plus a tenth: capWithWriteHeadroom), what she keeps being host_storage_summary''s active plus Deleted less the system''s removals; each with the summary it was judged on. The meter (storage_used_bytes, which what she keeps never passes) decides who is summed at all. Keyset pages on id, p_limit clamped to 1,000. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 2. A one-time notice kept until it sends.
-- =============================================================================================
create table public.notice_retries (
  kind text not null,
  dedupe_key text not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  html text not null,
  text text not null,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  primary key (kind, dedupe_key)
);

-- The profile FK's cascade looks its rows up by profile_id.
create index notice_retries_profile_idx on public.notice_retries (profile_id);

alter table public.notice_retries enable row level security;

revoke all on table public.notice_retries from anon, authenticated;

comment on table public.notice_retries is
  'A one-time notice (send-kinds.ts STATE_NOTICES) whose claim or send failed, kept rendered until a retry sends it: sendOnce upserts it beside its release, and the sweep that owns its kind retries it each night through the same sent_emails claim (retryParkedNotices), deleting the row once the mail went and giving it up, recorded, 30 days after first_failed_at. Never the address: the retry reads the profile''s. Deny-all: the service role alone.';
comment on column public.notice_retries.first_failed_at is
  'The first failure: the give-up clock. Written by its default on the row''s first insert alone (an upsert names last_failed_at, never this).';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it in ONE execute_sql call, after this file's statements (before the apply: the statements
-- at the head of the same call; after it: on its own). It ends in a deliberate raise, so nothing persists.
--   A. The function, on two real profiles inside the transaction: the host keeping the most, her cap set under what she
--      keeps, is answered with her summary; with her cap at what she keeps (inside the tenth) she is not; with her meter
--      far past that line while she keeps no more, she is still not (the summary decides, never the meter alone);
--      another profile with a grace standing is answered whatever it keeps; a null cap on a paid tier is unlimited, a
--      free one takes Free's default; p_after and p_limit page, ascending by id; the client roles are refused.
--   B. The table: its deny-all, its keys, and the two writes `sendOnce` makes (a first keep takes first_failed_at from
--      its default; a later keep, the upsert PostgREST sends, moves last_failed_at and keeps first_failed_at).
-- The error must read `ROLLED BACK: every over_capacity_read check held {...}`.
-- =============================================================================================
-- do $check$
-- declare
--   v_full uuid;       -- the host keeping the most (her albums hold media)
--   v_other uuid;      -- another profile, for the grace
--   v_kept bigint;
--   v_row record;
--   v_n bigint;
--   v_first timestamptz;
--   v_last timestamptz;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   -- ── A1. Class, pin and grants ──
--   if not exists (select 1 from pg_proc p
--                   where p.oid = to_regprocedure('public.over_capacity_candidates(uuid, integer)')
--                     and not p.prosecdef and p.proconfig @> array['search_path=""']) then
--     raise exception 'FAIL A1: not SECURITY INVOKER with a pinned search_path';
--   end if;
--   if has_function_privilege('anon', 'public.over_capacity_candidates(uuid, integer)', 'execute')
--      or has_function_privilege('authenticated', 'public.over_capacity_candidates(uuid, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.over_capacity_candidates(uuid, integer)', 'execute') then
--     raise exception 'FAIL A1: not the service role''s alone';
--   end if;
--   -- What it answers today, untouched (a null limit reads everything).
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, null);
--   reset role;
--   v_report := v_report || jsonb_build_object('candidates_today', v_n);
--
--   -- ── A2. Two profiles, from what the database holds ──
--   select e.host_id into v_full
--     from public.media m join public.events e on e.id = m.event_id
--    where e.deleted_at is null and m.status <> 'removed'
--    group by e.host_id order by sum(m.file_size_bytes) desc limit 1;
--   select p.id into v_other from public.profiles p where p.id <> v_full order by p.id limit 1;
--   if v_full is null or v_other is null then raise exception 'FAIL A2: no host to check with'; end if;
--   select s.active_bytes + s.standby_bytes - s.system_bytes into v_kept from public.host_storage_summary(v_full) s;
--   v_report := v_report || jsonb_build_object('kept', v_kept);
--   if v_kept < 2 then raise exception 'FAIL A2: the fullest host keeps % bytes, too few to judge', v_kept; end if;
--
--   -- ── A3. Over her line by what she keeps: answered, with her summary ──
--   update public.profiles set tier = 'pro', storage_cap_bytes = greatest(v_kept / 2, 1), storage_grace_until = null,
--     storage_used_bytes = greatest(storage_used_bytes, v_kept) where id = v_full;
--   set local role service_role;
--   select * into v_row from public.over_capacity_candidates(null, 1000) c where c.id = v_full;
--   reset role;
--   if v_row.id is null or v_row.active_bytes + v_row.deleted_bytes - v_row.system_bytes <> v_kept then
--     raise exception 'FAIL A3: a host over her line by what she keeps was not answered whole: %', row_to_json(v_row);
--   end if;
--
--   -- ── A4. Under her line (her cap at what she keeps, inside the tenth too): not answered ──
--   update public.profiles set storage_cap_bytes = v_kept where id = v_full;
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id = v_full;
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL A4: a host inside her write line was answered'; end if;
--
--   -- ── A5. Her meter far past that line while she keeps no more: the summary decides, so still not answered ──
--   update public.profiles set storage_used_bytes = v_kept * 100 + 1 where id = v_full;
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id = v_full;
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL A5: a host inside her line was answered on her meter alone'; end if;
--
--   -- ── A6. A grace standing: answered whatever she keeps; a null cap on a paid tier is unlimited ──
--   update public.profiles set storage_grace_until = now() + interval '3 days' where id = v_other;
--   update public.profiles set storage_cap_bytes = null, tier = 'pro', storage_used_bytes = 1099511627776 where id = v_full;
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id = v_other;
--   if v_n <> 1 then raise exception 'FAIL A6: a host in a grace was not answered'; end if;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id = v_full;
--   if v_n <> 0 then raise exception 'FAIL A6: an unlimited (null cap, pro) host was answered'; end if;
--   -- A free host with no cap of her own takes Free's default from tier_limits.
--   reset role;
--   update public.profiles set tier = 'free', storage_cap_bytes = null where id = v_full;
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id = v_full;
--   reset role;
--   if v_n <> (case when v_kept > 100::bigint * 1024 * 1024 + (100::bigint * 1024 * 1024) / 10 then 1 else 0 end) then
--     raise exception 'FAIL A6: a free host was not judged against Free''s default cap';
--   end if;
--
--   -- ── A7. Pages: p_limit stops it, p_after starts after, ascending by id ──
--   update public.profiles set tier = 'pro', storage_cap_bytes = 1, storage_grace_until = null where id = v_full;
--   set local role service_role;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1);
--   if v_n <> 1 then raise exception 'FAIL A7: p_limit 1 answered % rows', v_n; end if;
--   select count(*) into v_n from public.over_capacity_candidates(v_full, 1000) c where c.id <= v_full;
--   if v_n <> 0 then raise exception 'FAIL A7: p_after answered an id at or before it'; end if;
--   select count(*) into v_n from public.over_capacity_candidates(null, 0);
--   if v_n <> 0 then raise exception 'FAIL A7: p_limit 0 answered rows'; end if;
--   select count(*) into v_n from (
--     select c.id, lag(c.id) over () as prev from public.over_capacity_candidates(null, 1000) c) o
--    where o.prev is not null and o.prev >= o.id;
--   if v_n <> 0 then raise exception 'FAIL A7: the rows are not ascending by id'; end if;
--   select count(*) into v_n from public.over_capacity_candidates(null, 1000) c where c.id in (v_full, v_other);
--   v_report := v_report || jsonb_build_object('answered_of_two', v_n);
--   if v_n <> 2 then raise exception 'FAIL A7: both hosts (over, and in a grace) should be answered, % were', v_n; end if;
--   reset role;
--
--   -- ── A8. The client roles are refused ──
--   begin
--     set local role authenticated;
--     perform 1 from public.over_capacity_candidates(null, 1);
--     raise exception 'FAIL A8: authenticated called it';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--
--   -- ── B1. Deny-all: RLS on, no policy, no client privilege, the service role's own ──
--   if not (select c.relrowsecurity from pg_class c where c.oid = 'public.notice_retries'::regclass) then
--     raise exception 'FAIL B1: RLS is off';
--   end if;
--   if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notice_retries') then
--     raise exception 'FAIL B1: a policy exists';
--   end if;
--   if has_table_privilege('anon', 'public.notice_retries', 'select, insert, update, delete')
--      or has_table_privilege('authenticated', 'public.notice_retries', 'select, insert, update, delete')
--      or not has_table_privilege('service_role', 'public.notice_retries', 'select')
--      or not has_table_privilege('service_role', 'public.notice_retries', 'insert')
--      or not has_table_privilege('service_role', 'public.notice_retries', 'update')
--      or not has_table_privilege('service_role', 'public.notice_retries', 'delete') then
--     raise exception 'FAIL B1: a client role reaches it, or the service role does not';
--   end if;
--
--   -- ── B2. Its keys: (kind, dedupe_key) primary, the profile FK cascading ──
--   if (select pg_get_constraintdef(c.oid) from pg_constraint c
--        where c.conrelid = 'public.notice_retries'::regclass and c.contype = 'p')
--      is distinct from 'PRIMARY KEY (kind, dedupe_key)' then
--     raise exception 'FAIL B2: the primary key is not (kind, dedupe_key)';
--   end if;
--   if (select c.confdeltype from pg_constraint c
--        where c.conrelid = 'public.notice_retries'::regclass and c.contype = 'f') <> 'c' then
--     raise exception 'FAIL B2: the profile FK does not cascade';
--   end if;
--
--   -- ── B3. The two writes, as the service role makes them ──
--   set local role service_role;
--   insert into public.notice_retries (kind, dedupe_key, profile_id, subject, html, text, last_failed_at)
--     values ('inactivity_removed', 'notice-check', v_full, 's', '<p>h</p>', 't', now())
--     on conflict (kind, dedupe_key) do update set subject = excluded.subject, html = excluded.html,
--       text = excluded.text, profile_id = excluded.profile_id, last_failed_at = excluded.last_failed_at;
--   select r.first_failed_at, r.last_failed_at into v_first, v_last
--     from public.notice_retries r where r.kind = 'inactivity_removed' and r.dedupe_key = 'notice-check';
--   if v_first is null or v_last is null then raise exception 'FAIL B3: the first keep wrote no instants'; end if;
--   insert into public.notice_retries (kind, dedupe_key, profile_id, subject, html, text, last_failed_at)
--     values ('inactivity_removed', 'notice-check', v_full, 's2', '<p>h2</p>', 't2', now() + interval '1 day')
--     on conflict (kind, dedupe_key) do update set subject = excluded.subject, html = excluded.html,
--       text = excluded.text, profile_id = excluded.profile_id, last_failed_at = excluded.last_failed_at;
--   select count(*) into v_n from public.notice_retries r
--    where r.kind = 'inactivity_removed' and r.dedupe_key = 'notice-check'
--      and r.first_failed_at = v_first and r.last_failed_at = v_first + interval '1 day' and r.subject = 's2';
--   if v_n <> 1 then raise exception 'FAIL B3: a second keep moved first_failed_at or kept the old words'; end if;
--   delete from public.notice_retries r where r.kind = 'inactivity_removed' and r.dedupe_key = 'notice-check';
--   reset role;
--
--   -- ── B4. The client roles are refused ──
--   begin
--     set local role authenticated;
--     perform 1 from public.notice_retries limit 1;
--     raise exception 'FAIL B4: authenticated read notice_retries';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   raise exception 'ROLLED BACK: every over_capacity_read check held %', v_report;
-- end
-- $check$;
