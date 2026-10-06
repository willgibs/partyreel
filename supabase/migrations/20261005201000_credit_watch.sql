-- =============================================================================================
-- CREDIT WATCH (lane `credit-watch`; the Advisor's Q33 after-steps on billing-integrity, 20261005181000). The mechanism
-- is docs/systems/billing-caps.md's, the lock rules and grants docs/systems/database-security.md's. Three parts:
--
--   1. A LEASED CLAIM NEVER REFUSES FOR GOOD. claim_pass_credit answered `overlap` when another checkout's claim on the
--      same passes merely held its lease, and overlap is done (a 200: nothing granted, nothing converted, never
--      retried). Two Checkout tabs paid for the same passes: the first claim's delivery dies mid-grant, the second
--      tab's delivery meets its lease and is told overlap for good, the first's retries run out (three in TEST), and
--      neither session ever grants. Now another checkout's live lease answers `busy` (`held_by` another_checkout,
--      non-2xx, so Stripe retries this one), and overlap stands only against what is settled: a converted pass, or
--      another checkout's claim that GRANTED (and was not released: a released claim's grant is the duplicate its dead
--      holder made, which the operator reverses). The retry then finds that grant (overlap) or the lease lapsed with
--      no grant (it claims, and its own grant follows).
--      ★ THE ORPHANS. A lease that lapses with no grant on record may still hide a grant: its holder died after
--      Stripe granted and before the record landed. Waiting on that lease rather than refusing gives the other
--      checkout's retry the time to claim past it, so a fresh claim or a take-over names, beside `claimed`, every
--      other checkout's claim on its passes that lapsed with no grant and was not released (`orphans`, each with when
--      it was taken: no grant for it can be older), and the route looks on Stripe's side for their grants BEFORE it
--      grants: a grant found is that checkout's, put on record on its own claim and converted, and this checkout's
--      claim is released, granting nothing; none found, this checkout grants and then settles them (their holders are
--      dead and granted nothing, so their passes are this checkout's credit now).
--      ★ A claim that lost its passes (its own lease lapsed with no grant, then another checkout credited them) would
--      read stuck forever, and its dead holder may have granted on Stripe's side too. So its overlap carries
--      `unsettled`: the route looks on Stripe's side for its grant and settles it,
--        release_pass_credit(session, host, balance transaction or null): the claim released for good
--          (`released_at`), with the grant Stripe holds put on record beside it when there is one (two grants for
--          one set of passes, which the operator reverses in Stripe: the released claim's). Only a claim another
--          checkout's credit overtook (a pass it names converted, or named by another checkout's unreleased grant),
--          never one whose passes nobody credited, so a wrong call cannot drop a host's credit; a pass it names that
--          the other checkout did not stays hers, uncredited, as an overlap always left it.
--   2. THE RECOMPUTE'S SECONDS. recompute_pass_entitlement landing between a credited checkout's conversion and its
--      subscription event (seconds, the two events Stripe sends together) found her non-Pro with no live window and
--      moved her to Free until the subscription event came. Now a profile with no live window whose pass became Pro
--      credit within the hour, while it still had time, answers `skipped_pro_pending` and writes nothing: the
--      subscription event writes her plan, and past the hour the ledger decides again (a Pro plan that never landed).
--   3. What each new piece is, where an operator reads it.
--
-- Two things this file leaves to the app (lp/credit-watch): the stuck credits (a claim never granted an hour after it
-- was taken, a grant never converted an hour after it landed) are read off pass_credits by the operator's two pages
-- and the `pass_credit` signal on /admin/jobs, and the nightly expired_passes sweep reads only the owners of a pass
-- live or ahead (src/lib/lifecycle/sweeps/passes.ts), so a long-expired pass is never recomputed again.
--
-- ★ WHAT THE OLDER BUILDS MEET (partyreel.com and the alias share this database; Stripe is in TEST and nothing holds
-- real money): nothing they call. Both deployed builds (partyreel.com's milestone-37, the alias's build 53) predate
-- billing-integrity: their credit is consume_passes_for_pro_credit and their recompute the TypeScript one, neither of
-- which this file touches. A build carrying billing-integrity's route without this lane's would read both busy answers
-- as a 409 (its words a delivery's), an unsettled overlap as the 200 it was, the claim's orphans not at all (granting
-- past them, as it always did), and the recompute's new `skipped_pro_pending` as an answer it never gives (a throw: a
-- 500 Stripe retries, a sweep row counted failed), so no such build deploys. ★ And this lane's build needs this file
-- FIRST: its operator reads select `released_at` (PostgREST's 400 without it), so before the apply every read of the
-- claims fails: the Accounts pages say No reading, every Retry fails, and the `pass_credit` signal's read throws, which
-- turns the whole health console (the bell and the band on every admin page) into "could not be read". Apply this with
-- the lane's merge, before launch-prep's next build.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: each body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on 2026-10-05:
--   claim_pass_credit           afa5c7afde081afe45a00e9c5e9d58e9  (20261005181000_billing_integrity)
--   recompute_pass_entitlement  906c489179848859e028d22f19116096  (20261005181000_billing_integrity)
-- and pass_credits.released_at and release_pass_credit must be absent. Then the rolled-back proof at the foot of this
-- file, RED without this file's statements and GREEN with them; then apply verbatim; then get_advisors (unchanged:
-- 26 rls_enabled_no_policy, 4 in 0028, 36 in 0029: the new function is INVOKER and no client role's); then regenerate
-- src/lib/db/types.ts (the column and the function), which drops the lane's typed seam (`creditDb` in
-- src/lib/db/mutations/event-passes.ts and src/lib/db/queries/pass-credits.ts).

-- =============================================================================================
-- 1. A leased claim never refuses for good; a claim that lost its passes is settled, never stuck.
-- =============================================================================================
-- Released: this checkout will never be credited by us, since another checkout credited its passes first. Terminal,
-- unleased and never converted; a grant beside it is the one its dead holder made on Stripe's side (granted twice).
alter table public.pass_credits add column released_at timestamptz;
alter table public.pass_credits
  add constraint pass_credits_released_unleased check (released_at is null or claimed_until is null),
  add constraint pass_credits_released_unconverted check (released_at is null or converted_at is null);

-- 20261005181000's body verbatim but for four blocks: a released claim answers overlap before anything else is read
-- of it; the once-ever check stands against a converted pass or another checkout's unreleased GRANTED claim and says
-- whether this checkout's own claim is still unsettled; another checkout's live lease answers busy, after it; and a
-- claim names the orphans it was taken past. Same signature, return type, language, volatility, security mode and
-- empty search_path, so create or replace keeps the ACL; the grants are restated as they stand live.
--
-- Answers one jsonb, its `state`:
--   'claimed'  this delivery holds the claim (`resumed` true when it took over a lease that lapsed with no grant on
--              record: the route looks on Stripe's side first, by the session in the balance transaction's metadata);
--              `orphans`, every other checkout's claim on these passes that lapsed with no grant and is not released
--              (`session`, and `claimed_at` in unix seconds: no grant for it is older), whose grants the route looks
--              for on Stripe's side before it grants this one;
--   'granted'  the grant is on record (`balance_transaction_id`): never grant again, whenever the retry comes;
--   'busy'     a live lease holds it (`retry_after_sec`): this checkout's own, another delivery of it (`held_by`
--              this_checkout), or another checkout's on a pass it names (`held_by` another_checkout); answer non-2xx,
--              Stripe retries, and the retry meets that claim's grant (overlap) or its lapse (claimed);
--   'overlap'  a pass it names was converted already, or is named by another checkout's claim that granted: grant
--              nothing, convert nothing (a pass is credited once ever); `unsettled` true when this checkout's own claim
--              is still open (its holder may have granted on Stripe's side before its record was lost: the route looks,
--              then releases it), false when it never claimed or was released already;
--   'no_host'  no profile holds the host: nothing to credit.
-- A replay that disagrees with its claim (another host, credit or set of passes) and a pass that is not hers are
-- refused in words: our own server writes the session's metadata, so either is a bug, never a guess.
create or replace function public.claim_pass_credit(
  p_session_id text,
  p_host_id uuid,
  p_credit_cents integer,
  p_pass_ids uuid[]
)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_claim public.pass_credits;
  v_owned integer;
  v_held_until timestamptz;
  v_orphans jsonb;
  c_lease constant interval := interval '10 minutes'; -- longer than the webhook can run (its maxDuration, 120 s)
begin
  if p_session_id is null or btrim(p_session_id) = '' or p_host_id is null
     or p_credit_cents is null or p_credit_cents < 1
     or p_pass_ids is null or cardinality(p_pass_ids) = 0 or array_position(p_pass_ids, null) is not null then
    raise exception 'claim_pass_credit needs a session, a host, a credit and the passes it names.'
      using errcode = 'invalid_parameter_value';
  end if;
  select array_agg(distinct x order by x) into v_ids from unnest(p_pass_ids) x;

  -- ★ HER PROFILES ROW FIRST, the one lock order (database-security.md): two deliveries of one checkout, and two
  -- checkouts of one host, decide one after another, never both off one read.
  perform 1 from public.profiles where id = p_host_id for update;
  if not found then
    return jsonb_build_object('state', 'no_host');
  end if;

  select * into v_claim from public.pass_credits where stripe_session_id = p_session_id for update;
  if found then
    if v_claim.profile_id <> p_host_id or v_claim.credit_cents <> p_credit_cents or v_claim.pass_ids <> v_ids then
      raise exception 'This checkout''s credit disagrees with its claim.' using errcode = 'check_violation';
    end if;
    -- ★ Released is settled for good, ahead of its grant: a claim released beside a grant its dead holder made (granted
    -- twice) never converts, so it answers overlap, never granted.
    if v_claim.released_at is not null then
      return jsonb_build_object('state', 'overlap', 'unsettled', false);
    end if;
    if v_claim.granted_at is not null then
      return jsonb_build_object('state', 'granted', 'balance_transaction_id', v_claim.balance_transaction_id);
    end if;
    if v_claim.claimed_until > now() then
      return jsonb_build_object('state', 'busy', 'held_by', 'this_checkout',
        'retry_after_sec', greatest(1, ceil(extract(epoch from (v_claim.claimed_until - now()))))::integer);
    end if;
  else
    -- Every pass a first claim names is hers.
    select count(*) into v_owned from public.event_passes q where q.id = any(v_ids) and q.profile_id = p_host_id;
    if v_owned <> cardinality(v_ids) then
      raise exception 'This checkout names a pass that is not this account''s.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ A PASS IS CREDITED ONCE EVER, asked before a first claim and before a lapsed one is taken over: none of its
  -- passes converted already (a conversion follows only a grant on record), and none named by another checkout's claim
  -- that granted and was not released (a released claim's grant is a duplicate, reversed in Stripe). Only what is
  -- settled refuses: a lease below waits instead.
  if exists (select 1 from public.event_passes q where q.id = any(v_ids) and q.consumed_at is not null)
     or exists (
       select 1 from public.pass_credits c
        where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids
          and c.granted_at is not null and c.released_at is null) then
    return jsonb_build_object('state', 'overlap', 'unsettled', v_claim.stripe_session_id is not null);
  end if;

  -- ★ A LEASE IS NEVER A REFUSAL: another checkout's claim that only holds its lease on a pass this one names answers
  -- busy until that lease ends, in a grant (the retry meets overlap above) or a lapse (the retry claims), so a holder
  -- that dies never leaves both checkouts refused for good. A live lease is an ungranted, unreleased claim's alone
  -- (pass_credits_granted_unleased, pass_credits_released_unleased).
  select max(c.claimed_until) into v_held_until
    from public.pass_credits c
   where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids
     and c.claimed_until > now();
  if v_held_until is not null then
    return jsonb_build_object('state', 'busy', 'held_by', 'another_checkout',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_held_until - now()))))::integer);
  end if;

  -- ★ THE ORPHANS this claim is taken past: another checkout's claim on these passes whose lease lapsed with no grant
  -- on record, not released. Its holder is dead (a lease outlasts any delivery) and may have granted on Stripe's side
  -- before its record was lost, so the route looks for those grants before it grants this one.
  select coalesce(jsonb_agg(jsonb_build_object('session', c.stripe_session_id,
                                               'claimed_at', floor(extract(epoch from c.created_at))::bigint)
                            order by c.created_at), '[]'::jsonb)
    into v_orphans
    from public.pass_credits c
   where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids
     and c.granted_at is null and c.released_at is null
     and (c.claimed_until is null or c.claimed_until <= now());

  if v_claim.stripe_session_id is not null then
    update public.pass_credits set claimed_until = now() + c_lease where stripe_session_id = p_session_id;
    return jsonb_build_object('state', 'claimed', 'resumed', true, 'orphans', v_orphans);
  end if;
  insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until)
  values (p_session_id, p_host_id, p_credit_cents, v_ids, now() + c_lease);
  return jsonb_build_object('state', 'claimed', 'resumed', false, 'orphans', v_orphans);
end;
$$;

revoke all on function public.claim_pass_credit(text, uuid, integer, uuid[]) from public, anon, authenticated;
grant execute on function public.claim_pass_credit(text, uuid, integer, uuid[]) to service_role;

-- The settlement of a claim another checkout's credit overtook, after the route looked on Stripe's side for its grant:
-- released for good, with that grant on record beside it when Stripe holds one. Answers 'released', or
-- 'released_granted' when it recorded a grant; a replay answers what is on record. Refused in words: a claim granted
-- (it converts), and one whose passes no other checkout credited (a pass it names converted, or named by another
-- checkout's unreleased grant): releasing that would drop her credit. A leased claim is no refusal: only its own
-- holder reaches it (another delivery of its checkout, and the operator's Retry, meet busy at the claim), releasing
-- itself once its look on Stripe's side found an orphan's lost grant for its passes.
create function public.release_pass_credit(
  p_session_id text,
  p_host_id uuid,
  p_balance_transaction_id text default null
)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_claim public.pass_credits;
begin
  if p_session_id is null or btrim(p_session_id) = '' or p_host_id is null
     or btrim(p_balance_transaction_id) = '' then
    raise exception 'release_pass_credit needs a session and a host, and a balance transaction only when one is named.'
      using errcode = 'invalid_parameter_value';
  end if;

  -- ★ HER PROFILES ROW FIRST, the one lock order: a claim of another checkout deciding beside this waits for it.
  perform 1 from public.profiles where id = p_host_id for update;
  select * into v_claim from public.pass_credits
   where stripe_session_id = p_session_id and profile_id = p_host_id for update;
  if not found then
    raise exception 'This checkout''s credit has no claim to release.' using errcode = 'no_data_found';
  end if;
  if v_claim.released_at is not null then
    return case when v_claim.granted_at is null then 'released' else 'released_granted' end;
  end if;
  if v_claim.granted_at is not null then
    raise exception 'This checkout''s credit is granted: it converts, never releases.'
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  -- Only what the claim's own overlap answers: a pass it names converted, or named by another checkout's unreleased
  -- granted claim.
  if not exists (select 1 from public.event_passes q where q.id = any(v_claim.pass_ids) and q.consumed_at is not null)
     and not exists (
       select 1 from public.pass_credits c
        where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_claim.pass_ids
          and c.granted_at is not null and c.released_at is null) then
    raise exception 'This checkout''s passes are not another checkout''s to credit: it is still owed.'
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  update public.pass_credits
     set released_at = now(),
         claimed_until = null,
         balance_transaction_id = p_balance_transaction_id,
         granted_at = case when p_balance_transaction_id is null then null else now() end
   where stripe_session_id = p_session_id;
  return case when p_balance_transaction_id is null then 'released' else 'released_granted' end;
end;
$$;

revoke all on function public.release_pass_credit(text, uuid, text) from public, anon, authenticated;
grant execute on function public.release_pass_credit(text, uuid, text) to service_role;

-- =============================================================================================
-- 2. The recompute's seconds: a Pro checkout's credit converted, its plan seconds behind.
-- =============================================================================================
-- 20261005181000's body verbatim but for the Pro-pending block after the windows are read (and its constant). Same
-- signature, return type, language, volatility, security mode and empty search_path; the grants restated as they
-- stand live. Answers 'updated', 'unchanged', 'skipped_pro' or 'skipped_pro_pending'.
create or replace function public.recompute_pass_entitlement(p_host_id uuid, p_now timestamptz default null)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_profile public.profiles;
  v_live integer;
  v_chain timestamptz;
  v_tier public.tier_type;
  v_cap bigint;
  v_slots integer;
  v_expires timestamptz;
  c_pro_pending constant interval := interval '1 hour'; -- far past the seconds between a checkout's two events
begin
  if p_host_id is null or not isfinite(v_now) then
    raise exception 'recompute_pass_entitlement needs a host and a finite instant.'
      using errcode = 'invalid_parameter_value';
  end if;

  -- ★ HER PROFILES ROW FIRST, held to the write: a conversion, a complete and the subscription webhook's write each
  -- wait for it or it for them, so nothing lands between the ledger's read and the profile's write.
  select * into v_profile from public.profiles where id = p_host_id for update;
  if not found then
    return 'unchanged';
  end if;
  if v_profile.tier = 'pro' then
    return 'skipped_pro';
  end if;

  select count(*) filter (where q.start_at <= v_now and q.expires_at > v_now),
         max(q.expires_at) filter (where q.expires_at > v_now)
    into v_live, v_chain
    from public.event_passes q
   where q.profile_id = p_host_id and q.consumed_at is null;

  -- ★ PRO PENDING: no live window, and a pass of hers became Pro credit within the hour while it still had time (live,
  -- or a renewal's year ahead): her credited Pro checkout converted and its subscription event, sent beside it, has
  -- not landed yet. Writing now would move her to Free for those seconds; the subscription event writes her plan, and
  -- past the hour the ledger decides again. Real time, never the sweep's instant: what is in flight is in flight now.
  if v_live = 0 and exists (
       select 1 from public.event_passes q
        where q.profile_id = p_host_id and q.consumed_reason = 'pro_credit'
          and q.consumed_at > now() - c_pro_pending and q.consumed_at < q.expires_at) then
    return 'skipped_pro_pending';
  end if;

  if v_live = 0 then
    v_tier := 'free';
  else
    v_tier := 'event_pass';
    v_cap := v_live * (select l.default_storage_cap_bytes from public.tier_limits('event_pass') l);
    v_slots := v_live;
    v_expires := v_chain;
  end if;

  if v_profile.tier = v_tier
     and v_profile.storage_cap_bytes is not distinct from v_cap
     and v_profile.event_slots is not distinct from v_slots
     and v_profile.tier_expires_at is not distinct from v_expires then
    return 'unchanged';
  end if;

  update public.profiles
     set tier = v_tier, storage_cap_bytes = v_cap, event_slots = v_slots, tier_expires_at = v_expires
   where id = p_host_id and tier <> 'pro';
  return 'updated';
end;
$$;

revoke all on function public.recompute_pass_entitlement(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.recompute_pass_entitlement(uuid, timestamptz) to service_role;

-- =============================================================================================
-- 3. What each new piece is, where an operator reads it.
-- =============================================================================================
comment on column public.pass_credits.released_at is
  'When this checkout''s claim was released for good because another checkout credited its passes first (the webhook, after looking on Stripe''s side for its own grant). Terminal: never leased, never converted; a grant beside it is one its dead holder made on Stripe''s side (granted twice: the operator reverses one in Stripe).';

comment on function public.claim_pass_credit(text, uuid, integer, uuid[]) is
  'The pass-to-Pro credit''s claim, taken before the grant and read on every retry (the Stripe webhook and the operator''s Retry, service role only): her profiles row first; answers claimed (resumed when it took over a lapsed lease; with the orphans it was taken past, other checkouts'' lapsed ungranted claims on its passes: look on Stripe''s side for all their grants first), granted, busy (a live lease holds it, this checkout''s or another checkout''s on a pass it names: retry), overlap (a pass it names was converted, or is named by another checkout''s unreleased granted claim: grant nothing; unsettled when this checkout''s own claim is still open: settle it with release_pass_credit) or no_host.';

comment on function public.release_pass_credit(text, uuid, text) is
  'Settles a pass-to-Pro claim another checkout''s credit overtook (service role only): her profiles row first; released for good, with the grant Stripe holds for it on record beside it when one is named (granted twice: that grant is the duplicate). Refuses a granted claim and one whose passes no other checkout credited.';

comment on function public.recompute_pass_entitlement(uuid, timestamptz) is
  'Re-derives a non-Pro profile''s four pass-owned fields (tier, storage_cap_bytes, event_slots, tier_expires_at) from her unconsumed passes at an instant, under her profiles row lock (the Stripe webhook and the nightly expired_passes sweep, service role only). Writes nothing for a profile with no live window whose pass became Pro credit within the hour (her Pro plan seconds behind). Answers updated, unchanged, skipped_pro or skipped_pro_pending.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own accounts (auth users, so
-- handle_new_user makes their profiles) and sets each step's plan, passes and claims straight in; every claim, grant,
-- conversion, release and recompute runs as the service role (`set local role`, as its caller runs it, INVOKER bodies).
-- Inside one transaction now() stands still, so a lease lapses by moving its claimed_until behind it. Each step traps
-- its own failure into the temp `proof` table; the final select is the answer. The RED run is the same call without
-- this file's statements: everything this file adds is reached only through dynamic SQL, so it fails on what it lacks,
-- never on a parse.
--
-- RESULT, 2026-10-05 against the live schema (the drift read above clean first: the two bodies at their hashes, the
-- column and the function absent), re-run on this file's last revision (the orphans, after the lane's red-team):
--   RED  0/5: 1 THE HOLE ITSELF: tab 2, meeting tab 1's live lease, answered {"state": "overlap"} (done for good), no
--        orphan named past the lapse, and tab 1 beside tab 2's lease overlap too; 2 no released_at, no
--        release_pass_credit; 3 THE SECONDS: the recompute moved the pending host to Free ("updated", free); 4 no
--        constraints, no function; 5 the bodies at their old hashes, the release absent.
--   GREEN 5/5 on this file (its function bodies verbatim, top-level comments aside), nothing persisted after (no fixture
--        user, profile or claim; released_at and release_pass_credit absent; the two bodies at their old hashes).
-- THE PRE-FLIGHT (database-security.md), a throwaway Postgres 17 cluster holding a stand-in of the touched tables (their
-- column types, defaults and the constraints the bodies lean on), the Supabase roles, the live default privileges,
-- tier_limits' one column and billing-integrity's four bodies at their live hashes: the file applies verbatim, its three
-- bodies at the GREEN run's hashes; pg_get_functiondef's diff of the two restated bodies is exactly their stated blocks
-- (and the declarations and constant those alone use); their ACLs are unchanged and the release's is the service
-- role's, INVOKER, its search_path empty. Its two-session lock runs, each holder keeping her row 1.5 s: a release holding
-- it, a claim of another checkout waits 1.2 s and then decides; a claim holding it, the release waits and then settles;
-- a conversion holding it, the release waits; ★ the conversion of her last live pass holding it, the recompute waits and
-- then answers skipped_pro_pending, never Free (the seconds, serialized); the recompute holding it first, the conversion
-- waits and then clears the chain the recompute wrote. No deadlock in any run (the server log holds none). The route's
-- orphan path is these same calls in sequence (a claim, a grant on record, a conversion, a release), each its own
-- transaction taking her row first, so it adds no lock order.
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.gb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024 * 1024)::bigint $f$;
--
-- -- A host on a plan: no passes, no credit claims; the tier, the cap and the chain as asked.
-- create function pg_temp.reset(p_host text, p_tier text, p_cap bigint, p_expires timestamptz default null,
--                               p_slots integer default null) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host);
-- begin
--   delete from public.pass_credits where profile_id = h;
--   delete from public.event_passes where profile_id = h;
--   update public.profiles set tier = p_tier::public.tier_type, storage_cap_bytes = p_cap,
--          tier_expires_at = p_expires, event_slots = p_slots
--    where id = h;
-- end $f$;
--
-- -- A pass row: its window by offsets from now, consumed as Pro credit (that long ago) when asked.
-- create function pg_temp.pass(p_host text, p_from interval, p_to interval, p_consumed_ago interval default null)
-- returns uuid language plpgsql as $f$
-- declare pid uuid;
-- begin
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, consumed_at, consumed_reason)
--   values (pg_temp.fx(p_host), now() + p_from, now() + p_to, 2900, 'initial',
--           now() - p_consumed_ago, case when p_consumed_ago is not null then 'pro_credit' end)
--   returning id into pid;
--   return pid;
-- end $f$;
--
-- -- The webhook's calls, as it makes them: as the service role (an INVOKER body runs with its caller's privileges), and
-- -- dynamic, so the red run (no such function) fails here and not at a parse. An error comes back in words.
-- create function pg_temp.claim(p_session text, p_host uuid, p_credit integer, p_ids uuid[]) returns jsonb
-- language plpgsql as $f$
-- declare got jsonb;
-- begin
--   set local role service_role;
--   execute 'select public.claim_pass_credit($1, $2, $3, $4)' into got using p_session, p_host, p_credit, p_ids;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
-- create function pg_temp.record(p_session text, p_host uuid, p_txn text) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   set local role service_role;
--   execute 'select public.record_pass_credit_grant($1, $2, $3)' into got using p_session, p_host, p_txn;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.convert(p_session text, p_host uuid) returns text language plpgsql as $f$
-- declare got integer;
-- begin
--   set local role service_role;
--   execute 'select public.convert_pass_credit($1, $2)' into got using p_session, p_host;
--   reset role;
--   return got::text;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.release(p_session text, p_host uuid, p_txn text default null) returns text
-- language plpgsql as $f$
-- declare got text;
-- begin
--   set local role service_role;
--   if p_txn is null then
--     execute 'select public.release_pass_credit($1, $2)' into got using p_session, p_host;
--   else
--     execute 'select public.release_pass_credit($1, $2, $3)' into got using p_session, p_host, p_txn;
--   end if;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.recompute(p_host uuid, p_now timestamptz default null) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   set local role service_role;
--   execute 'select public.recompute_pass_entitlement($1, $2)' into got using p_host, p_now;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- -- A claim's row, as one line: the lease, the grant, the release, the conversion.
-- create function pg_temp.row_of(p_session text) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   execute 'select format(''lease %s grant %s txn %s released %s converted %s'',
--                          case when claimed_until is null then ''none'' when claimed_until > now() then ''live'' else ''lapsed'' end,
--                          (granted_at is not null)::text, coalesce(balance_transaction_id, ''none''),
--                          (released_at is not null)::text, (converted_at is not null)::text)
--              from public.pass_credits where stripe_session_id = $1' into got using p_session;
--   return coalesce(got, 'no row');
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The fixtures: three hosts (an auth user each, so handle_new_user makes the profile).
-- do $$
-- declare k text; h uuid;
-- begin
--   foreach k in array array['tabs', 'pending', 'owed'] loop
--     h := gen_random_uuid();
--     execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--       using h, 'credit-watch-' || h || '@example.com';
--     insert into public.profiles (id, email, display_name) values (h, 'credit-watch-' || h || '@example.com', 'Cred ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, h, null);
--   end loop;
--   insert into proof (step, ok, detail) values ('0 fixtures', true, format('tabs host %s', pg_temp.fx('tabs')));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. THE HOLE: two tabs credit the same two passes. Tab 1 claims; tab 2, meeting tab 1's live lease, is busy (another
-- -- checkout's), never overlap for good, and writes no claim. Tab 1's holder dies (its lease lapses with no grant): tab 2's
-- -- retry claims, naming tab 1 the orphan it was taken past (whose grant the route looks for first). Tab 1's retry, while
-- -- tab 2 only holds its lease, is busy in its turn; once tab 2's grant is on record it is overlap, and unsettled (its own
-- -- claim is still open).
-- do $$
-- declare h uuid := pg_temp.fx('tabs'); a uuid; b uuid; c1 jsonb; c2 jsonb; c2row text; c3 jsonb; c4 jsonb; r4 text; c5 jsonb;
--   c6 jsonb; c6row text; fail text := '';
-- begin
--   perform pg_temp.reset('tabs', 'event_pass', pg_temp.gb(50), now() + interval '355 days', 2);
--   a := pg_temp.pass('tabs', -interval '10 days', interval '355 days');
--   b := pg_temp.pass('tabs', -interval '20 days', interval '345 days');
--   insert into fx values ('pass_a', a, null), ('pass_b', b, null);
--   c1 := pg_temp.claim('cs_cw_1', h, 1850, array[a, b]);
--   c2 := pg_temp.claim('cs_cw_2', h, 1850, array[b, a]);
--   c2row := pg_temp.row_of('cs_cw_2');
--   execute 'update public.pass_credits set claimed_until = now() - interval ''1 second'' where stripe_session_id = $1'
--     using 'cs_cw_1';
--   c3 := pg_temp.claim('cs_cw_2', h, 1850, array[a, b]);
--   c4 := pg_temp.claim('cs_cw_1', h, 1850, array[a, b]);
--   r4 := pg_temp.record('cs_cw_2', h, 'cbtxn_cw_2');
--   c5 := pg_temp.claim('cs_cw_1', h, 1850, array[a, b]);
--   -- A third tab, first seen after tab 2's grant: overlap, with nothing of its own to settle, and no row.
--   c6 := pg_temp.claim('cs_cw_5', h, 1850, array[a]);
--   c6row := pg_temp.row_of('cs_cw_5');
--   if c1->>'state' is distinct from 'claimed' then fail := fail || ' first ' || c1; end if;
--   if c2->>'state' is distinct from 'busy' or c2->>'held_by' is distinct from 'another_checkout'
--      or (c2->>'retry_after_sec')::integer not between 1 and 600 then
--     fail := fail || ' THE HOLE: tab 2 meeting a live lease answered ' || c2;
--   end if;
--   if c2row is distinct from 'no row' then fail := fail || ' tab 2 wrote ' || c2row; end if;
--   if c3->>'state' is distinct from 'claimed' or (c3->>'resumed')::boolean is distinct from false
--      or jsonb_array_length(c3->'orphans') is distinct from 1 or c3->'orphans'->0->>'session' is distinct from 'cs_cw_1'
--      or (c3->'orphans'->0->>'claimed_at')::bigint is distinct from floor(extract(epoch from now()))::bigint then
--     fail := fail || ' past the lapse, naming tab 1 its orphan ' || c3;
--   end if;
--   if c1->'orphans' is distinct from '[]'::jsonb then fail := fail || ' a first claim''s orphans ' || c1; end if;
--   if c4->>'state' is distinct from 'busy' or c4->>'held_by' is distinct from 'another_checkout' then
--     fail := fail || ' tab 1 beside tab 2''s lease ' || c4;
--   end if;
--   if r4 is distinct from 'cbtxn_cw_2' then fail := fail || ' record ' || r4; end if;
--   if c5->>'state' is distinct from 'overlap' or (c5->>'unsettled')::boolean is distinct from true then
--     fail := fail || ' tab 1 after tab 2''s grant ' || c5;
--   end if;
--   if c6->>'state' is distinct from 'overlap' or (c6->>'unsettled')::boolean is distinct from false
--      or c6row is distinct from 'no row' then
--     fail := fail || format(' a first claim after the grant %s (%s);', c6, c6row);
--   end if;
--   insert into proof (step, ok, detail) values ('1 a lease is never a refusal', fail = '',
--     coalesce(nullif(fail, ''), format('tab 2 busy (%s), claimed past the lapse naming tab 1 its orphan; tab 1 busy, then overlap unsettled; a later tab overlap, settled', c2->>'retry_after_sec')));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 a lease is never a refusal', false, sqlerrm);
-- end $$;
--
-- -- 2. THE RELEASE: tab 1's overtaken claim released (no grant found), a replay answering the same, its next claim a
-- -- settled overlap; a third tab's lost grant put on record beside its release, its claim a settled overlap ahead of its
-- -- grant, its conversion refused by the table; a leased claim released by its own holder once its passes are credited
-- -- elsewhere; every refusal in words: a granted claim, one still owed (leased or not: no other checkout credited its
-- -- passes), an empty grant, no claim at all, a missing argument; and a released claim's grant credits nothing.
-- do $$
-- declare h uuid := pg_temp.fx('tabs'); o uuid := pg_temp.fx('owed'); a uuid := pg_temp.fx('pass_a'); b uuid := pg_temp.fx('pass_b');
--   p uuid; r1 text; row1 text; r1b text; c1 jsonb; r3 text; row3 text; c3 jsonb; v3 text; g text; l text; w text; e text;
--   nc text; nh text; r6 text; c8 jsonb; fail text := '';
-- begin
--   r1 := pg_temp.release('cs_cw_1', h);
--   row1 := pg_temp.row_of('cs_cw_1');
--   r1b := pg_temp.release('cs_cw_1', h);
--   c1 := pg_temp.claim('cs_cw_1', h, 1850, array[a, b]);
--   -- Tab 3: claimed, its holder died after Stripe granted (record lost), overtaken by tab 2's grant.
--   execute 'insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until)
--            values ($1, $2, 1850, $3, now() - interval ''1 minute'')'
--     using 'cs_cw_3', h, (select array_agg(x order by x) from unnest(array[a, b]) x);
--   r3 := pg_temp.release('cs_cw_3', h, 'cbtxn_cw_lost');
--   row3 := pg_temp.row_of('cs_cw_3');
--   c3 := pg_temp.claim('cs_cw_3', h, 1850, array[a, b]);
--   v3 := pg_temp.convert('cs_cw_3', h);
--   g := pg_temp.release('cs_cw_2', h);
--   -- A claim its own holder releases while it holds the lease: its look on Stripe's side found an orphan's lost grant
--   -- for its passes (here tab 2's grant stands for them), so it grants nothing.
--   execute 'insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until)
--            values ($1, $2, 1850, $3, now() + interval ''5 minutes'')'
--     using 'cs_cw_6', h, (select array_agg(x order by x) from unnest(array[a, b]) x);
--   r6 := pg_temp.release('cs_cw_6', h);
--   -- A claim leased and one lapsed on the third host's own pass, which no other checkout credited: still owed.
--   perform pg_temp.reset('owed', 'event_pass', pg_temp.gb(25), now() + interval '355 days', 1);
--   p := pg_temp.pass('owed', -interval '10 days', interval '355 days');
--   perform pg_temp.claim('cs_cw_4', o, 900, array[p]);
--   l := pg_temp.release('cs_cw_4', o);
--   execute 'update public.pass_credits set claimed_until = now() - interval ''1 second'' where stripe_session_id = $1'
--     using 'cs_cw_4';
--   w := pg_temp.release('cs_cw_4', o);
--   e := pg_temp.release('cs_cw_4', o, '  ');
--   nc := pg_temp.release('cs_cw_none', o);
--   nh := pg_temp.release(null, o);
--   -- ★ A released claim's grant (a duplicate the operator reverses) is no credit: a claim beside it on the same pass is
--   -- claimed, never overlap.
--   execute 'delete from public.pass_credits where stripe_session_id = $1' using 'cs_cw_4';
--   execute 'insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, balance_transaction_id,
--              granted_at, released_at) values ($1, $2, 900, $3, ''cbtxn_cw_dup'', now(), now())'
--     using 'cs_cw_7', o, array[p];
--   c8 := pg_temp.claim('cs_cw_8', o, 900, array[p]);
--   if r1 is distinct from 'released' or row1 is distinct from 'lease none grant false txn none released true converted false'
--      or r1b is distinct from 'released' then
--     fail := fail || format(' release %s / %s / %s;', r1, row1, r1b);
--   end if;
--   if c1->>'state' is distinct from 'overlap' or (c1->>'unsettled')::boolean is distinct from false then
--     fail := fail || ' released claim ' || c1;
--   end if;
--   if r3 is distinct from 'released_granted'
--      or row3 is distinct from 'lease none grant true txn cbtxn_cw_lost released true converted false' then
--     fail := fail || format(' granted twice %s / %s;', r3, row3);
--   end if;
--   if c3->>'state' is distinct from 'overlap' or (c3->>'unsettled')::boolean is distinct from false then
--     fail := fail || ' granted-twice claim ' || c3;
--   end if;
--   if v3 not like 'error 23514 %released_unconverted%' then fail := fail || ' convert of a released claim ' || v3; end if;
--   if g not like 'error 55000 %granted%' then fail := fail || ' granted ' || g; end if;
--   if r6 is distinct from 'released' then fail := fail || ' its own holder''s release ' || r6; end if;
--   if l not like 'error 55000 %still owed%' then fail := fail || ' leased, owed ' || l; end if;
--   if w not like 'error 55000 %still owed%' then fail := fail || ' owed ' || w; end if;
--   if c8->>'state' is distinct from 'claimed' then fail := fail || ' beside a released grant ' || c8; end if;
--   if e not like 'error 22023 %' then fail := fail || ' empty grant ' || e; end if;
--   if nc not like 'error P0002 %' then fail := fail || ' no claim ' || nc; end if;
--   if nh not like 'error 22023 %' then fail := fail || ' no session ' || nh; end if;
--   insert into proof (step, ok, detail) values ('2 the release', fail = '',
--     coalesce(nullif(fail, ''), 'released, replayed, settled; a lost grant on record beside it, never converted; its own holder''s release; granted, owed, empty, none refused; a released grant no credit'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 the release', false, sqlerrm);
-- end $$;
--
-- -- 3. THE RECOMPUTE'S SECONDS: a pass holder whose live pass became Pro credit five minutes ago, her Pro plan not landed,
-- -- is left alone (her profile as it was), at the database's instant and at any sweep instant; past the hour, or when the
-- -- converted pass had already ended, or beside a live unconverted pass, the ledger decides as before.
-- do $$
-- declare h uuid := pg_temp.fx('pending'); s1 text; p1 record; s2 text; s3 text; p3 record; s4 text; p4 record; s5 text;
--   p5 record; fail text := '';
-- begin
--   perform pg_temp.reset('pending', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('pending', -interval '10 days', interval '355 days', interval '5 minutes');
--   s1 := pg_temp.recompute(h);
--   select tier, storage_cap_bytes into p1 from public.profiles where id = h;
--   s2 := pg_temp.recompute(h, now() + interval '700 days');
--
--   perform pg_temp.reset('pending', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('pending', -interval '10 days', interval '355 days', interval '2 hours');
--   s3 := pg_temp.recompute(h);
--   select tier, storage_cap_bytes into p3 from public.profiles where id = h;
--
--   perform pg_temp.reset('pending', 'event_pass', pg_temp.gb(25));
--   -- Ended a day ago, converted (its credit 0) five minutes ago: not a live pass that became credit.
--   perform pg_temp.pass('pending', -interval '400 days', -interval '1 day', interval '5 minutes');
--   s4 := pg_temp.recompute(h);
--   select tier, storage_cap_bytes into p4 from public.profiles where id = h;
--
--   perform pg_temp.reset('pending', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('pending', -interval '10 days', interval '355 days', interval '5 minutes');
--   perform pg_temp.pass('pending', interval '0 seconds', interval '365 days');
--   s5 := pg_temp.recompute(h);
--   select tier, storage_cap_bytes, event_slots into p5 from public.profiles where id = h;
--
--   if s1 is distinct from 'skipped_pro_pending' or p1.tier <> 'event_pass' or p1.storage_cap_bytes <> pg_temp.gb(25) then
--     fail := fail || format(' THE SECONDS: %s left %s/%s;', s1, p1.tier, p1.storage_cap_bytes);
--   end if;
--   if s2 is distinct from 'skipped_pro_pending' then fail := fail || ' at a sweep''s instant ' || s2; end if;
--   if s3 is distinct from 'updated' or p3.tier <> 'free' or p3.storage_cap_bytes is not null then
--     fail := fail || format(' past the hour %s %s;', s3, p3.tier);
--   end if;
--   if s4 is distinct from 'updated' or p4.tier <> 'free' then fail := fail || format(' an ended pass %s %s;', s4, p4.tier); end if;
--   if s5 is distinct from 'updated' or p5.tier <> 'event_pass' or p5.event_slots is distinct from 1 then
--     fail := fail || format(' a live pass beside %s %s/%s;', s5, p5.tier, p5.event_slots);
--   end if;
--   insert into proof (step, ok, detail) values ('3 the recompute''s seconds', fail = '',
--     coalesce(nullif(fail, ''), 'pending left alone at any instant; past the hour, an ended pass and a live one beside decide as before'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 the recompute''s seconds', false, sqlerrm);
-- end $$;
--
-- -- 4. Grants and shapes: the table deny-all with its two new constraints; the release INVOKER and the service role's; the
-- -- two restated bodies' ACLs, modes and empty search_path as they stood.
-- do $$
-- declare r record; got text; shape text; fail text := '';
-- begin
--   if not (select relrowsecurity from pg_class where oid = to_regclass('public.pass_credits')) then fail := fail || ' rls off;'; end if;
--   if has_table_privilege('anon', 'public.pass_credits', 'select') or has_table_privilege('authenticated', 'public.pass_credits', 'select')
--      or has_table_privilege('authenticated', 'public.pass_credits', 'update') then fail := fail || ' a client role reaches it;'; end if;
--   if (select count(*) from pg_constraint where conrelid = to_regclass('public.pass_credits')
--         and conname in ('pass_credits_released_unleased', 'pass_credits_released_unconverted')) <> 2 then
--     fail := fail || ' constraints;';
--   end if;
--   for r in select * from (values
--       ('public.claim_pass_credit(text, uuid, integer, uuid[])', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.release_pass_credit(text, uuid, text)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.recompute_pass_entitlement(uuid, timestamptz)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker')
--     ) v(fn, acl, want_shape)
--   loop
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' '
--                       order by a.grantee::regrole::text || ':' || a.privilege_type) into got
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end
--       into shape
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if got is distinct from r.acl then fail := fail || format(' %s acl %s;', r.fn, got); end if;
--     if shape is distinct from r.want_shape then fail := fail || format(' %s shape %s;', r.fn, shape); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('4 grants and shapes', fail = '', coalesce(nullif(fail, ''), 'the table deny-all, its two constraints; 3 functions as named'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 grants and shapes', false, sqlerrm);
-- end $$;
--
-- -- 5. The bodies are this file's: each prosrc, whitespace collapsed, hashes as the file's own text does.
-- do $$
-- declare r record; got text; fail text := '';
-- begin
--   for r in select * from (values
--       ('claim_pass_credit', '214cd4076f6c0fde56818717f896c411'),
--       ('release_pass_credit', 'daf8070ceefe570939df3dd5965ecb5d'),
--       ('recompute_pass_entitlement', '9c55581c219d2b4dc733c7b2027ab89e')
--     ) v(fn, want)
--   loop
--     select md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) into got
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = r.fn;
--     if got is distinct from r.want then fail := fail || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('5 bodies', fail = '', coalesce(nullif(fail, ''), '3 hashes, the file''s own'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
