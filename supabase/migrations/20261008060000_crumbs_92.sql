-- =============================================================================================
-- THE OPERATOR'S AUDITED UPLOADS CREDIT (lane `crumbs-92`, Will's yes to the calls lab's X6, 2026-10-07). The mechanism is
-- docs/systems/billing-caps.md's (the uploads allowance, `upload_allowance()` over its window, `uploads_used()`), the
-- grants and lock rules docs/systems/database-security.md's. PRICING.md names the outcome worth engineering against, a
-- false positive blocking a paying host; /admin/accounts shows each host's meter against her allowance, and this is the
-- override that page was missing: extra room in her current window, with a reason, from an operator, on the record.
--
--   1. `admin_actions`: the operator-action log (what was done, by whom, to whom, why). Only this credit writes it yet.
--      Append-only on purpose: the service role may read and insert but never update, delete or truncate, so no code path
--      rewrites history (an Undo, when one is built, appends). Deny-all to every client role (RLS on, no policy, no grant).
--   2. `uploads_credits`: one row a credit, additive. ★ NOTHING HERE EDITS A COUNT. `storage_ledger.cumulative_bytes` is
--      also the spend watch's meter of what the platform pays for (it diffs snapshots of its sum), so zeroing it would
--      lift the guard and skew the watch; a credit is a row beside it, ending with the window it was made in (the calendar
--      month for Free and Pro, her soonest-ending live pass for a pass holder), and `event_passes.uploaded_bytes` is never
--      written either.
--   3. `grant_uploads_credit(operator, host, bytes, reason, key)`: the only writer of both. The operator must be an admin
--      profile (checked here as well as by the server action's AAL2), the reason is required (500 characters), the host's
--      row is locked FOR UPDATE first (the one profiles lock every capacity decision takes, so two credits and an upload
--      serialize), and together her live credits may never pass one more of her plan's own allowance nor number more than
--      ten (so the operator's page reads them whole). Refused in words (jsonb `refused` + `why`), never silently: a Pro
--      with no cap on record is unmetered (nothing to lift) and a lapsed pass is lifted by the nightly recompute, not by a
--      credit. IDEMPOTENT PER KEY: the control mints a key as its sheet opens and a replay answers the credit it already
--      made, so a double press or a retry after a dropped answer never credits twice.
--   4. THE LINE READS THE CREDIT AT ONE PLACE, WITHOUT TOUCHING ANY OF ITS CALLERS. Since billing-integrity every body that
--      judges an upload asks `uploads_refused` (the two completes, the presign's meter, the three advisories). It now
--      asks: this window's gross count + the bytes > her allowance + her live credit. `uploads_used` (what the door's
--      figures, the plan sheet and /admin/accounts read) becomes the count held against her allowance: the gross count
--      less her credit, never below zero, so a figure and a refusal agree at the line (used >= allowance is
--      gross - credit >= allowance). The gross count moves to `uploads_gross`, the old `uploads_used` body verbatim.
--
-- ★ WHAT THE DEPLOYED BUILDS MEET (partyreel.com's milestone-39 build and the alias share this database; Stripe is in TEST
-- and nothing holds real money): nothing they call changes shape. Every signature stands (`uploads_used`, `uploads_refused`,
-- `uploads_windows`, the six upload bodies), and until a credit exists (only this lane's control makes one) every figure
-- and every refusal is byte-for-byte what it was, so the apply alone changes no host's experience. ★ AND THIS LANE'S BUILD
-- NEEDS THIS FILE FIRST: its account page reads `uploads_credits` and its control calls `grant_uploads_credit`; before the
-- apply the Uploads card says "No reading" for the credit (never a zero), the list says the credits could not be read, and
-- a press fails in words with nothing granted. Apply this with the lane's merge, before launch-prep's next build.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: each body this file replaces or leans on, hashed
-- live as md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on
-- 2026-10-07 (live through email_first_memory, 20261007135056):
--   uploads_used            a5c98a2f6218f34dac6c474fb920f358  (20261004100000_ladder_a)        replaced here
--   uploads_refused         cf95f228728e6bb6e6acae69c853daef  (20261005181000_billing_integrity) replaced here
--   uploads_windows         d59d814fa7ef63705fbf441bcdbfdb57  (20261005181000_billing_integrity) asks uploads_used; untouched
--   pass_lapsed             51e31424957360a36456d8ba22acfdaf  (20261005181000_billing_integrity) asked; untouched
--   upload_allowance        55c7fef03305f30623cf283499be220d  (20261004100000_ladder_a)        asked; untouched
--   meter_upload            4116450ef4af996f82c27d6d5265ac71  (20261005181000_billing_integrity) \
--   create_media            efa26b84854061dd8124f9075ebf332c  (20261007021000_reshoots)          |
--   create_media_as_host    a2cac72021af2d039cf94aa4be52a201  (20261005200000_capture_time)      | every caller of
--   get_upload_context      31e4d2a0eb1f9eadc9539ff02f0ef201  (20261007021000_reshoots)          | uploads_refused:
--   get_upload_gate         619931ad80208afcc6a29747cb86ca72  (20261007021000_reshoots)          | untouched, their
--   get_host_upload_context d983d79d2c90f9ee53fcb3b4ff6169a1  (20261005181000_billing_integrity) / hashes unchanged
-- Then `get_advisors`, the types regenerated (`admin_actions`, `uploads_credits`, `grant_uploads_credit`, `uploads_credit`,
-- `uploads_gross`; the lane's typed seams in src/lib/db/queries/uploads-credits.ts and mutations/uploads-credit.ts drop).
-- Callers of what changes: uploads_refused <- the six bodies above; uploads_used <- uploads_refused, uploads_windows (the
-- operator's list and page) and `readHostMonthUploads` (queries/month-uploads.ts: the plan sheet, asked as `pro`);
-- grant_uploads_credit <- the operator's action (app/admin/accounts/actions.ts), on the admin client.
-- =============================================================================================

-- =============================================================================================
-- 1. The operator-action log.
-- =============================================================================================
-- `operator_id` is a plain id, not a key: the record of what an operator did outlives her account, and the insert then
-- takes no lock on her profiles row (the host's is the only one this file's writer holds). `account_id` goes with the
-- account it was done to, as her passes and credit claims do. `request_id` makes a retried act answer itself.
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  operator_id uuid,
  account_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  request_id uuid unique,
  constraint admin_actions_kind_shape check (kind ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint admin_actions_reason_shape check (char_length(btrim(reason)) between 1 and 500),
  constraint admin_actions_detail_shape check (jsonb_typeof(detail) = 'object' and pg_column_size(detail) <= 4096)
);

create index admin_actions_account_idx on public.admin_actions (account_id, created_at desc);

alter table public.admin_actions enable row level security;
revoke all on table public.admin_actions from public, anon, authenticated;
-- Append-only for the service role (the definer function below inserts as the owner): it reads the log and nothing more.
revoke update, delete, truncate on table public.admin_actions from service_role;

comment on table public.admin_actions is
  'The operator-action log: what an operator did to an account, who, when and why. Written only by the definer function of the act (grant_uploads_credit first). Append-only for the service role; deny-all to client roles.';

-- =============================================================================================
-- 2. The credit itself.
-- =============================================================================================
-- A credit is live while `window_ends_at` is ahead. The window it was made in sets the end (see grant_uploads_credit).
create table public.uploads_credits (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  bytes bigint not null,
  window_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  action_id uuid not null unique references public.admin_actions (id) on delete cascade,
  constraint uploads_credits_bytes_range check (bytes between 1048576 and 17592186044416),
  constraint uploads_credits_window_finite check (isfinite(window_ends_at)),
  constraint uploads_credits_window_after_grant check (window_ends_at > created_at)
);

create index uploads_credits_live_idx on public.uploads_credits (host_id, window_ends_at);

alter table public.uploads_credits enable row level security;
revoke all on table public.uploads_credits from public, anon, authenticated;

comment on table public.uploads_credits is
  'An operator''s credit of extra room in a host''s uploads window, additive and audited (admin_actions): live while window_ends_at is ahead. uploads_used takes it off her count and uploads_refused adds it to her allowance; the storage ledger and the passes'' counts are never written.';

-- =============================================================================================
-- 3. What she holds, and the count the line reads.
-- =============================================================================================
-- DEFINER, so the invoker bodies that ask it (uploads_used, run by the service role for the operator's list and by the
-- owner everywhere else) need no privilege on the table.
create function public.uploads_credit(p_host_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(c.bytes), 0)::bigint
    from public.uploads_credits c
   where c.host_id = p_host_id and c.window_ends_at > now();
$$;

revoke all on function public.uploads_credit(uuid) from public, anon, authenticated;
grant execute on function public.uploads_credit(uuid) to service_role;

-- Free and Pro: this calendar month's ledger (the key every writer writes, to_char(now(), 'YYYY-MM')), which never
-- decrements. A pass holder: her live passes' own counts, so a month's uploads never ration her event's night and an old
-- month never follows her into a pass. The 20261004100000 `uploads_used` body, verbatim; invoker like it was.
create function public.uploads_gross(p_host_id uuid, p_tier public.tier_type)
returns bigint
language sql
stable
set search_path = ''
as $$
  select case
    when p_tier = 'event_pass' then
      (select coalesce(sum(p.uploaded_bytes), 0)::bigint
         from public.event_passes p
        where p.profile_id = p_host_id and p.consumed_at is null
          and p.start_at <= now() and p.expires_at > now())
    else
      coalesce((select l.cumulative_bytes
                  from public.storage_ledger l
                 where l.host_id = p_host_id and l.period = to_char(now(), 'YYYY-MM')), 0)
  end;
$$;

revoke all on function public.uploads_gross(uuid, public.tier_type) from public, anon, authenticated;
grant execute on function public.uploads_gross(uuid, public.tier_type) to service_role;

-- The count held against her allowance: what the window took, less her operator's credit, never below zero. Same
-- signature, attributes and grants as it has always had.
create or replace function public.uploads_used(p_host_id uuid, p_tier public.tier_type)
returns bigint
language sql
stable
set search_path = ''
as $$
  select greatest(public.uploads_gross(p_host_id, p_tier) - public.uploads_credit(p_host_id), 0);
$$;

revoke all on function public.uploads_used(uuid, public.tier_type) from public, anon, authenticated;
grant execute on function public.uploads_used(uuid, public.tier_type) to service_role;

-- The uploads line, one home: would `p_bytes` more pass her plan's own number plus her credit over its window (NULL
-- allowance = unmetered: a paid profile with no cap on record fails open), or is her pass lapsed. EXACT, which the
-- clamped `uploads_used` is not past a credit larger than the count: it compares the gross count with allowance + credit,
-- so one file larger than the plan's own number is admitted by a credit that makes room for it.
create or replace function public.uploads_refused(
  p_host_id uuid,
  p_tier public.tier_type,
  p_storage_cap_bytes bigint,
  p_bytes bigint
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
           when a.allowance is null then false
           else public.uploads_gross(p_host_id, p_tier) + p_bytes > a.allowance + public.uploads_credit(p_host_id)
         end
      or public.pass_lapsed(p_host_id, p_tier)
    from (select public.upload_allowance(p_tier, p_storage_cap_bytes) as allowance) a;
$$;

-- As it stands live: read only by the definer bodies, so the owner's alone.
revoke all on function public.uploads_refused(uuid, public.tier_type, bigint, bigint)
  from public, anon, authenticated, service_role;

comment on function public.uploads_credit(uuid) is
  'What an operator has credited a host that is still live (the window it was made in has not ended). Definer, so the invoker uploads_used reads it for the service role.';
comment on function public.uploads_gross(uuid, public.tier_type) is
  'What a host''s uploads window has taken, deletions never given back, credits ignored: this calendar month''s storage_ledger row for Free and Pro, her live passes'' event_passes.uploaded_bytes for a pass holder (the old uploads_used).';
comment on function public.uploads_used(uuid, public.tier_type) is
  'The count held against a host''s uploads allowance: uploads_gross less her live credit, never below zero. What the door''s figures, the plan sheet and /admin/accounts read, so a figure and a refusal agree at the line.';
comment on function public.uploads_refused(uuid, public.tier_type, bigint, bigint) is
  'The uploads line, one home: would these bytes pass her plan''s own number plus her operator''s live credit over its window, or is her pass lapsed. The two completes, the presign''s meter and the three upload advisories ask it, so the door, the presign and the complete agree. The owner''s alone.';

-- =============================================================================================
-- 4. The operator's credit.
-- =============================================================================================
-- Answers one jsonb, its `state`:
--   granted  {credit_id, bytes, window_ends_at, live_bytes, max_bytes, replayed}  the credit is on record (replayed when
--            this key had already made it)
--   refused  {why, ...}  in words the app turns into the operator's: too_small (min_bytes), no_reason, reason_long,
--            no_account, unmetered, lapsed, too_many (live_count), over_bound (max_bytes, live_bytes)
-- and raises 22023 for a missing argument or a key that belongs to another act, 42501 for an operator who is not one.
create function public.grant_uploads_credit(
  p_operator_id uuid,
  p_host_id uuid,
  p_bytes bigint,
  p_reason text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_credit_min constant bigint := 1048576;
  c_credit_live constant integer := 10;
  c_reason_max constant integer := 500;
  v_reason text := regexp_replace(coalesce(p_reason, ''), '^\s+|\s+$', '', 'g');
  v_profile public.profiles;
  v_action public.admin_actions;
  v_credit public.uploads_credits;
  v_allowance bigint;
  v_live bigint;
  v_live_count integer;
  v_ends timestamptz;
  v_credit_id uuid := gen_random_uuid();
  v_action_id uuid := gen_random_uuid();
begin
  if p_operator_id is null or p_host_id is null or p_request_id is null then
    raise exception 'uploads credit: an operator, an account and a request key are required'
      using errcode = 'invalid_parameter_value';
  end if;
  -- ★ THE OPERATOR IS CHECKED HERE TOO, whatever the server action did first (admin + AAL2): the function is the service
  -- role's alone, and an id that is no admin profile's grants nothing.
  if not exists (select 1 from public.profiles o where o.id = p_operator_id and o.is_admin) then
    raise exception 'uploads credit: not an operator' using errcode = 'insufficient_privilege';
  end if;
  if p_bytes is null or p_bytes < c_credit_min then
    return jsonb_build_object('state', 'refused', 'why', 'too_small', 'min_bytes', c_credit_min);
  end if;
  if v_reason = '' then
    return jsonb_build_object('state', 'refused', 'why', 'no_reason');
  end if;
  if char_length(v_reason) > c_reason_max then
    return jsonb_build_object('state', 'refused', 'why', 'reason_long');
  end if;

  -- ★ THE HOST'S ROW FIRST, the one profiles lock this body takes (database-security.md: every capacity decision locks
  -- the host's row FOR UPDATE as its first lock). The bound below is check-then-act over her live credits, and an upload
  -- reads the same figures under the same lock.
  select * into v_profile from public.profiles where id = p_host_id for update;
  if not found then
    return jsonb_build_object('state', 'refused', 'why', 'no_account');
  end if;

  -- A replay of a key answers the credit it made (after the lock, so two presses racing answer one credit).
  select * into v_action from public.admin_actions where request_id = p_request_id;
  if found then
    if v_action.kind <> 'uploads_credit' or v_action.account_id <> p_host_id
       or v_action.operator_id is distinct from p_operator_id then
      raise exception 'uploads credit: that request key belongs to another act'
        using errcode = 'invalid_parameter_value';
    end if;
    select * into v_credit from public.uploads_credits where action_id = v_action.id;
    if not found then
      raise exception 'uploads credit: the act is on record without its credit' using errcode = 'data_exception';
    end if;
    return jsonb_build_object(
      'state', 'granted', 'replayed', true, 'credit_id', v_credit.id, 'bytes', v_credit.bytes,
      'window_ends_at', v_credit.window_ends_at, 'live_bytes', public.uploads_credit(p_host_id),
      'max_bytes', public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes));
  end if;

  v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes);
  if v_allowance is null then
    return jsonb_build_object('state', 'refused', 'why', 'unmetered');
  end if;
  if public.pass_lapsed(p_host_id, v_profile.tier) then
    return jsonb_build_object('state', 'refused', 'why', 'lapsed');
  end if;

  -- The window the credit is made in, and its end: the calendar month (the ledger's key, in the same session zone) for
  -- Free and Pro, and for a pass holder the soonest end among her live passes (the pass that counts first).
  if v_profile.tier = 'event_pass' then
    select min(q.expires_at) into v_ends
      from public.event_passes q
     where q.profile_id = p_host_id and q.consumed_at is null and q.start_at <= now() and q.expires_at > now();
  else
    v_ends := date_trunc('month', now()) + interval '1 month';
  end if;

  select coalesce(sum(c.bytes), 0)::bigint, count(*)::integer into v_live, v_live_count
    from public.uploads_credits c
   where c.host_id = p_host_id and c.window_ends_at > now();
  if v_live_count >= c_credit_live then
    return jsonb_build_object('state', 'refused', 'why', 'too_many', 'live_count', v_live_count);
  end if;
  -- (Subtracting rather than adding: a huge p_bytes is a refusal in words, never an overflow.)
  if p_bytes > v_allowance - v_live then
    return jsonb_build_object('state', 'refused', 'why', 'over_bound',
      'max_bytes', v_allowance, 'live_bytes', v_live);
  end if;

  insert into public.admin_actions (id, operator_id, account_id, kind, reason, detail, request_id)
  values (v_action_id, p_operator_id, p_host_id, 'uploads_credit', v_reason,
          jsonb_build_object('credit_id', v_credit_id, 'bytes', p_bytes, 'window_ends_at', v_ends,
                             'tier', v_profile.tier, 'allowance_bytes', v_allowance, 'live_before_bytes', v_live),
          p_request_id);
  insert into public.uploads_credits (id, host_id, bytes, window_ends_at, action_id)
  values (v_credit_id, p_host_id, p_bytes, v_ends, v_action_id);

  return jsonb_build_object(
    'state', 'granted', 'replayed', false, 'credit_id', v_credit_id, 'bytes', p_bytes,
    'window_ends_at', v_ends, 'live_bytes', v_live + p_bytes, 'max_bytes', v_allowance);
end;
$$;

revoke all on function public.grant_uploads_credit(uuid, uuid, bigint, text, uuid) from public, anon, authenticated;
grant execute on function public.grant_uploads_credit(uuid, uuid, bigint, text, uuid) to service_role;

comment on function public.grant_uploads_credit(uuid, uuid, bigint, text, uuid) is
  'The operator''s audited uploads credit: extra room in a host''s current uploads window with a required reason, bounded (together her live credits never pass one more of her plan''s allowance, at most ten), logged in admin_actions in the same transaction, idempotent per request key. Refuses in words (unmetered, lapsed, over_bound, ...); raises 42501 for an operator who is not an admin profile. Service role only; never writes storage_ledger or event_passes.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It reads the live operator (an existing admin
-- profile, never changed), makes its own disposable hosts (an auth user each, so handle_new_user makes the profile), an
-- album and a guest ticket needing no address, sets each step's plan and ledger straight in, and goes through the real
-- meter, the real host writer and the three real advisories; the credit is called as the service role calls it (`set
-- local role`). Each step traps its own failure into the temp `proof` table; the final select is the answer. The RED run
-- is the same call without this file's statements: everything this file adds is reached only through dynamic SQL, so it
-- fails on what it lacks, never on a parse.
--
-- RESULT, 2026-10-07 against the live schema (the drift read above clean first):
--   RED  1/7: 0 fixtures only. 1 the nine bodies the file leaves alone at their hashes, `uploads_gross` absent; 2 no
--        admin_actions; 3 THE GAP ITSELF: at the month's line the meter answers 'monthly', the three advisories read
--        full and the writer raises "Upload limit reached", and with no function to credit, still so after the press;
--        4 no uploads_credits; 5 no credit for a pass holder (the operator's list reads her 50 GB gross, nothing off it);
--        6 every role probe answers on what is missing (no function, no table).
--   GREEN 7/7 on this file (its statements verbatim, comments aside), and nothing persisted after (read back: both
--        tables and the three new functions absent, uploads_used and uploads_refused at their old hashes, no fixture
--        user, profile or event, three profiles and one admin as before).
-- THE PRE-FLIGHT (database-security.md), a throwaway Postgres 17 cluster holding a stand-in of the touched tables
-- (profiles, event_passes and storage_ledger at their live column types, defaults and constraints), the Supabase roles,
-- the live default privileges for what the migrating role creates in public, an auth.uid() stub and the six current
-- bodies the file replaces or leans on: it applies verbatim; the before/after read of those six (body hash, ACL,
-- definer, volatility, arguments) differs by exactly the two replaced bodies and the three new functions, with
-- uploads_used's and uploads_refused's ACLs unchanged and uploads_gross hashing to the OLD uploads_used body; the
-- contract check (ten steps: shape and grants, the line, the bound to the byte and past the largest bigint, ten live
-- credits, every refusal, a pass holder, a replayed key, a file larger than the plan's number, the roles, and an
-- account's deletion cascading through the log the service role may not delete from) is RED 0/10 without the file and
-- GREEN 10/10 with it.
-- ---------------------------------------------------------------------------------------------
--
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.mb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024)::bigint $f$;
-- create function pg_temp.gb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024 * 1024)::bigint $f$;
-- create function pg_temp.h(p_name text) returns text language sql as $f$
--   select md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) from pg_proc where pronamespace = 'public'::regnamespace and proname = p_name $f$;
--
-- -- A host on a plan: no media, no ledger, no passes, no credits; the tier and the cap as asked.
-- create function pg_temp.reset(p_host text, p_tier text, p_cap bigint) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host);
-- begin
--   delete from public.media where event_id in (select id from public.events where host_id = h);
--   delete from public.storage_ledger where host_id = h;
--   delete from public.event_passes where profile_id = h;
--   if to_regclass('public.uploads_credits') is not null then execute 'delete from public.uploads_credits where host_id = $1' using h; end if;
--   if to_regclass('public.admin_actions') is not null then execute 'delete from public.admin_actions where account_id = $1' using h; end if;
--   update public.profiles set tier = p_tier::public.tier_type, storage_cap_bytes = p_cap, storage_used_bytes = 0 where id = h;
-- end $f$;
-- create function pg_temp.ledger(p_host text, p_bytes bigint) returns void language sql as $f$
--   insert into public.storage_ledger (host_id, period, cumulative_bytes) values (pg_temp.fx(p_host), to_char(now(), 'YYYY-MM'), p_bytes)
--   on conflict (host_id, period) do update set cumulative_bytes = excluded.cumulative_bytes $f$;
-- create function pg_temp.cum(p_host text) returns bigint language sql as $f$
--   select cumulative_bytes from public.storage_ledger where host_id = pg_temp.fx(p_host) and period = to_char(now(), 'YYYY-MM') $f$;
--
-- -- The operator's credit as the server action makes it: the service role, dynamic so the red run (no such function)
-- -- fails here and not at a parse. An error comes back as {"error": "<sqlstate> <message>"}.
-- create function pg_temp.grant(p_op text, p_host text, p_bytes bigint, p_reason text, p_key uuid default gen_random_uuid()) returns jsonb language plpgsql as $f$
-- declare got jsonb;
--   v_op uuid := case when p_op = 'ghost' then gen_random_uuid() else pg_temp.fx(p_op) end;
--   v_host uuid := case when p_host = 'ghost' then gen_random_uuid() else pg_temp.fx(p_host) end;
-- begin
--   set local role service_role;
--   execute 'select public.grant_uploads_credit($1, $2, $3, $4, $5)' into got using v_op, v_host, p_bytes, p_reason, p_key;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
-- -- The presign's meter for the album, an upload through the real host writer, and the three advisories as their callers ask.
-- create function pg_temp.meter(p_bytes bigint) returns text language plpgsql as $f$
-- begin
--   return coalesce(public.meter_upload(p_event_id => pg_temp.fx('album'), p_type => 'photo', p_bytes => p_bytes)->>'reason', 'ok');
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.put(p_bytes bigint) returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := pg_temp.fx('album');
-- begin
--   perform public.create_media_as_host(p_host_id => pg_temp.fx('free'), p_event_id => e, p_media_id => mid,
--     p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg', p_file_size_bytes => p_bytes);
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.doors() returns text language plpgsql as $f$
-- declare c text; g text; hh text; album uuid := pg_temp.fx('album'); host uuid := pg_temp.fx('free');
-- begin
--   c := public.get_upload_context((select txt from fx where k = 'ticket'), 'photo')->>'at_monthly_cap';
--   g := public.get_upload_gate(album, null, null)->>'album_full';
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   hh := public.get_host_upload_context(album, 'photo')->>'at_monthly_cap';
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return format('context %s, gate %s, host %s', c, g, hh);
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.err(p_sql text, p_role text) returns text language plpgsql as $f$
-- begin
--   execute 'set local role ' || p_role;
--   execute p_sql;
--   reset role;
--   return 'ok';
-- exception when others then
--   reset role;
--   return sqlstate;
-- end $f$;
--
-- -- 0. FIXTURES: the live operator (an existing admin profile, read and never changed), and disposable hosts (an auth
-- -- user each, so handle_new_user makes the profile) with one album and one guest ticket needing no address.
-- do $$
-- declare who text; h uuid; a uuid; gid uuid; t text := 'crumbs-92-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   insert into fx select 'op', p.id, null from public.profiles p where p.is_admin order by p.created_at limit 1;
--   if not exists (select 1 from fx where fx.k = 'op') then raise exception 'no operator profile on this database'; end if;
--   foreach who in array array['notop', 'free', 'pro', 'pass', 'lapsed', 'many'] loop
--     h := gen_random_uuid();
--     insert into auth.users (id, email, email_confirmed_at) values (h, 'crumbs-92-' || h || '@example.com', now());
--     insert into public.profiles (id, email, display_name) values (h, 'crumbs-92-' || h || '@example.com', 'crumbs-92 (disposable) ' || who)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (who, h, null);
--   end loop;
--   insert into public.events (host_id, name, require_verified_email)
--     values (pg_temp.fx('free'), 'crumbs-92 (disposable): the album', false) returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest') returning id into gid;
--   insert into fx values ('album', a, null), ('guest', gid, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, 'the live operator, six disposable hosts, one album and one ticket');
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. THE DEPLOYED BUILDS' BODIES ARE UNTOUCHED: every caller of the line and the operator's read at the hashes the
-- -- drift read found, and the old count moved verbatim to uploads_gross.
-- do $$
-- declare bad text := ''; w record;
-- begin
--   for w in select * from (values
--       ('meter_upload', '4116450ef4af996f82c27d6d5265ac71'), ('create_media', 'efa26b84854061dd8124f9075ebf332c'),
--       ('create_media_as_host', 'a2cac72021af2d039cf94aa4be52a201'), ('get_upload_context', '31e4d2a0eb1f9eadc9539ff02f0ef201'),
--       ('get_upload_gate', '619931ad80208afcc6a29747cb86ca72'), ('get_host_upload_context', 'd983d79d2c90f9ee53fcb3b4ff6169a1'),
--       ('uploads_windows', 'd59d814fa7ef63705fbf441bcdbfdb57'), ('pass_lapsed', '51e31424957360a36456d8ba22acfdaf'),
--       ('upload_allowance', '55c7fef03305f30623cf283499be220d')) v(name, hash) loop
--     if pg_temp.h(w.name) is distinct from w.hash then bad := bad || ' ' || w.name || ':' || coalesce(pg_temp.h(w.name), 'absent'); end if;
--   end loop;
--   if pg_temp.h('uploads_gross') is distinct from 'a5c98a2f6218f34dac6c474fb920f358' then bad := bad || ' uploads_gross-not-the-old-count:' || coalesce(pg_temp.h('uploads_gross'), 'absent'); end if;
--   insert into proof (step, ok, detail) values ('1 the six callers, the operator''s read and the allowance at their old hashes; uploads_gross is the old count verbatim', bad = '', bad);
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 hashes', false, sqlerrm);
-- end $$;
--
-- -- 2. TABLES AND GRANTS AS THE DATABASE HOLDS THEM.
-- do $$
-- declare bad text := ''; s text; f text;
-- begin
--   foreach s in array array['admin_actions', 'uploads_credits'] loop
--     if to_regclass('public.' || s) is null then bad := bad || ' missing:' || s; continue; end if;
--     if not (select relrowsecurity from pg_class where oid = ('public.' || s)::regclass) then bad := bad || ' rls:' || s; end if;
--     if has_table_privilege('anon', 'public.' || s, 'select,insert,update,delete,truncate') or has_table_privilege('authenticated', 'public.' || s, 'select')
--        or has_table_privilege('authenticated', 'public.' || s, 'insert,update,delete,truncate') then bad := bad || ' client-grant:' || s; end if;
--   end loop;
--   if to_regclass('public.admin_actions') is not null and (has_table_privilege('service_role', 'public.admin_actions', 'update')
--      or has_table_privilege('service_role', 'public.admin_actions', 'delete') or has_table_privilege('service_role', 'public.admin_actions', 'truncate')) then bad := bad || ' log-not-append-only'; end if;
--   foreach f in array array['public.grant_uploads_credit(uuid,uuid,bigint,text,uuid)', 'public.uploads_credit(uuid)', 'public.uploads_gross(uuid,public.tier_type)', 'public.uploads_used(uuid,public.tier_type)'] loop
--     if to_regprocedure(f) is null then bad := bad || ' missing:' || f; continue; end if;
--     if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') or not has_function_privilege('service_role', f, 'execute')
--        or (select coalesce(proacl::text, '') ~ '(^[{]|,)=X/' from pg_proc where oid = to_regprocedure(f)::oid) then bad := bad || ' acl:' || f; end if;
--   end loop;
--   f := 'public.uploads_refused(uuid,public.tier_type,bigint,bigint)';
--   if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') or has_function_privilege('service_role', f, 'execute') then bad := bad || ' refused-not-owners'; end if;
--   if (select count(*) from pg_constraint c where c.contype = 'f' and c.confdeltype = 'c' and c.conrelid in ('public.admin_actions'::regclass, 'public.uploads_credits'::regclass)) <> 3 then bad := bad || ' cascades'; end if;
--   insert into proof (step, ok, detail) values ('2 both tables deny-all with RLS on, the log append-only for the service role, the functions the service role''s (uploads_refused the owner''s), three cascades', bad = '', bad);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 grants', false, sqlerrm);
-- end $$;
--
-- -- 3. THE REAL DOORS: a Free host at her month's line is refused by the meter, both writers and the three advisories; a
-- -- credit opens every one of them and moves nothing in the ledger but the writer's own count; the line then holds again
-- -- at the allowance plus the credit.
-- do $$
-- declare fail text := ''; c jsonb; before_c bigint; r text;
-- begin
--   perform pg_temp.reset('free', 'free', null);
--   perform pg_temp.ledger('free', pg_temp.mb(300));
--   r := pg_temp.meter(1); if r is distinct from 'monthly' then fail := fail || ' meter-at-line:' || r; end if;
--   r := pg_temp.doors(); if r is distinct from 'context true, gate true, host true' then fail := fail || ' doors-at-line:' || r; end if;
--   r := pg_temp.put(pg_temp.mb(1)); if r not like '23514 Upload limit reached%' then fail := fail || ' put-at-line:' || r; end if;
--   before_c := pg_temp.cum('free');
--   c := pg_temp.grant('op', 'free', pg_temp.mb(100), 'crumbs-92 proof: she wrote in; her guests were refused');
--   if c->>'state' is distinct from 'granted' then fail := fail || ' grant:' || coalesce(c::text, 'null'); end if;
--   if pg_temp.cum('free') is distinct from before_c then fail := fail || ' LEDGER-MOVED-BY-THE-CREDIT'; end if;
--   r := pg_temp.meter(pg_temp.mb(50)); if r is distinct from 'ok' then fail := fail || ' meter-after:' || r; end if;
--   r := pg_temp.doors(); if r is distinct from 'context false, gate false, host false' then fail := fail || ' doors-after:' || r; end if;
--   r := pg_temp.put(pg_temp.mb(50)); if r is distinct from 'recorded' then fail := fail || ' put-after:' || r; end if;
--   if pg_temp.cum('free') is distinct from pg_temp.mb(350) then fail := fail || ' ledger-after-put:' || coalesce(pg_temp.cum('free')::text, 'null'); end if;
--   -- 350 taken, 300 + 100 allowed: 50 left. A file of 51 is refused, 50 fits to the byte.
--   r := pg_temp.meter(pg_temp.mb(51)); if r is distinct from 'monthly' then fail := fail || ' meter-past:' || r; end if;
--   r := pg_temp.put(pg_temp.mb(50)); if r is distinct from 'recorded' then fail := fail || ' put-to-the-edge:' || r; end if;
--   r := pg_temp.put(1); if r not like '23514 Upload limit reached%' then fail := fail || ' put-past:' || r; end if;
--   r := pg_temp.doors(); if r is distinct from 'context true, gate true, host true' then fail := fail || ' doors-edge:' || r; end if;
--   insert into proof (step, ok, detail) values ('3 meter, both writers and the three advisories refuse at the line and honour a credit exactly; the ledger moves only by the writer''s bytes', fail = '', fail);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('3 doors', false, sqlerrm);
-- end $$;
--
-- -- 4. THE BOUND, THE REFUSALS IN WORDS, THE OPERATOR, THE KEY.
-- do $$
-- declare fail text := ''; c jsonb; k uuid := gen_random_uuid(); i integer;
-- begin
--   perform pg_temp.reset('free', 'free', null);
--   c := pg_temp.grant('op', 'free', pg_temp.mb(250), 'bound a');
--   c := pg_temp.grant('op', 'free', pg_temp.mb(100), 'bound b');
--   if c->>'why' is distinct from 'over_bound' or (c->>'max_bytes')::bigint is distinct from pg_temp.mb(300) or (c->>'live_bytes')::bigint is distinct from pg_temp.mb(250) then fail := fail || ' over-bound:' || c::text; end if;
--   c := pg_temp.grant('op', 'free', pg_temp.mb(50), 'bound c, to the byte');
--   if c->>'state' is distinct from 'granted' then fail := fail || ' to-the-byte:' || c::text; end if;
--   c := pg_temp.grant('op', 'free', pg_temp.mb(1), 'bound d'); if c->>'why' is distinct from 'over_bound' then fail := fail || ' past:' || c::text; end if;
--   c := pg_temp.grant('op', 'free', 9223372036854775807, 'the largest bigint'); if c->>'why' is distinct from 'over_bound' then fail := fail || ' overflow:' || c::text; end if;
--   c := pg_temp.grant('op', 'free', pg_temp.mb(1), '  '); if c->>'why' is distinct from 'no_reason' then fail := fail || ' blank:' || c::text; end if;
--   c := pg_temp.grant('op', 'free', 1024, 'tiny'); if c->>'why' is distinct from 'too_small' then fail := fail || ' tiny:' || c::text; end if;
--   c := pg_temp.grant('op', 'ghost', pg_temp.mb(5), 'nobody'); if c->>'why' is distinct from 'no_account' then fail := fail || ' ghost-host:' || c::text; end if;
--   c := pg_temp.grant('notop', 'free', pg_temp.mb(5), 'sneaky'); if c->>'error' is distinct from '42501 uploads credit: not an operator' then fail := fail || ' not-an-operator:' || c::text; end if;
--   c := pg_temp.grant('ghost', 'free', pg_temp.mb(5), 'phantom'); if c->>'error' not like '42501 %' then fail := fail || ' ghost-operator:' || c::text; end if;
--   perform pg_temp.reset('pro', 'pro', null);
--   c := pg_temp.grant('op', 'pro', pg_temp.mb(5), 'unmetered'); if c->>'why' is distinct from 'unmetered' then fail := fail || ' unmetered:' || c::text; end if;
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   c := pg_temp.grant('op', 'lapsed', pg_temp.mb(5), 'lapsed'); if c->>'why' is distinct from 'lapsed' then fail := fail || ' lapsed:' || c::text; end if;
--   perform pg_temp.reset('many', 'pro', pg_temp.gb(50));
--   for i in 1..10 loop c := pg_temp.grant('op', 'many', pg_temp.mb(1), 'small ' || i); if c->>'state' is distinct from 'granted' then fail := fail || ' small-' || i; end if; end loop;
--   c := pg_temp.grant('op', 'many', pg_temp.mb(1), 'the eleventh'); if c->>'why' is distinct from 'too_many' then fail := fail || ' eleventh:' || c::text; end if;
--   -- the key: a replay answers the credit it made and credits nothing twice; another act's key is refused
--   perform pg_temp.reset('free', 'free', null);
--   c := pg_temp.grant('op', 'free', pg_temp.mb(20), 'press', k);
--   if (pg_temp.grant('op', 'free', pg_temp.mb(20), 'press', k)->>'replayed')::boolean is distinct from true
--      or (select count(*) from public.uploads_credits where host_id = pg_temp.fx('free')) <> 1 then fail := fail || ' replay'; end if;
--   if pg_temp.grant('op', 'pro', pg_temp.mb(20), 'press', k)->>'error' not like '22023 %' then fail := fail || ' key-reuse'; end if;
--   if (select count(*) from public.admin_actions where account_id in (pg_temp.fx('lapsed'), pg_temp.fx('pro'), pg_temp.fx('notop'))) <> 0 then fail := fail || ' refusals-left-rows'; end if;
--   insert into proof (step, ok, detail) values ('4 the bound to the byte, every refusal in words writing nothing, an operator checked in SQL, ten live credits, one credit per key', fail = '', fail);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('4 refusals', false, sqlerrm);
-- end $$;
--
-- -- 5. A PASS HOLDER (her year, counted on her passes, never written) and the OPERATOR'S LIST (uploads_windows).
-- do $$
-- declare fail text := ''; c jsonb; ends1 timestamptz; rec record; h uuid := pg_temp.fx('lapsed');
-- begin
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(50));
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, uploaded_bytes)
--     values (pg_temp.fx('lapsed'), now() - interval '10 days', now() + interval '300 days', 2900, 'initial', pg_temp.gb(30));
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, uploaded_bytes)
--     values (pg_temp.fx('lapsed'), now() - interval '5 days', now() + interval '200 days', 2900, 'renewal', pg_temp.gb(20)) returning expires_at into ends1;
--   c := pg_temp.grant('op', 'lapsed', pg_temp.gb(10), 'her wedding weekend');
--   if c->>'state' is distinct from 'granted' or (c->>'window_ends_at')::timestamptz is distinct from ends1 then fail := fail || ' pass-grant:' || c::text; end if;
--   if (select sum(uploaded_bytes) from public.event_passes where profile_id = pg_temp.fx('lapsed')) is distinct from pg_temp.gb(50) then fail := fail || ' PASS-COUNT-MOVED'; end if;
--   set local role service_role;
--   select * into rec from public.uploads_windows(array[h], null, null);
--   reset role;
--   if rec.used_bytes is distinct from pg_temp.gb(40) or rec.pass_lapsed then fail := fail || ' windows:' || coalesce(rec.used_bytes::text, 'null'); end if;
--   insert into proof (step, ok, detail) values ('5 a pass holder''s credit ends with her soonest live pass, no pass count is written, and the operator''s list reads the net figure', fail = '', fail);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('5 pass', false, sqlerrm);
-- end $$;
--
-- -- 6. NO CLIENT ROLE REACHES THE FUNCTION, THE LOG OR THE CREDITS.
-- do $$
-- declare fail text := ''; r text;
-- begin
--   foreach r in array array['anon', 'authenticated'] loop
--     if pg_temp.err(format('select public.grant_uploads_credit(%L, %L, 10485760, ''x'', gen_random_uuid())', pg_temp.fx('op'), pg_temp.fx('free')), r) is distinct from '42501' then fail := fail || ' fn-' || r; end if;
--     if pg_temp.err('select * from public.admin_actions', r) is distinct from '42501' then fail := fail || ' log-' || r; end if;
--     if pg_temp.err('select * from public.uploads_credits', r) is distinct from '42501' then fail := fail || ' credits-' || r; end if;
--     if pg_temp.err(format('select public.uploads_credit(%L)', pg_temp.fx('free')), r) is distinct from '42501' then fail := fail || ' credit-fn-' || r; end if;
--   end loop;
--   if pg_temp.err('update public.admin_actions set reason = ''rewritten''', 'service_role') is distinct from '42501' then fail := fail || ' log-update'; end if;
--   if pg_temp.err('delete from public.admin_actions', 'service_role') is distinct from '42501' then fail := fail || ' log-delete'; end if;
--   insert into proof (step, ok, detail) values ('6 anon and authenticated reach neither the function, the log nor the credits; the service role cannot rewrite the log', fail = '', fail);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('6 roles', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
