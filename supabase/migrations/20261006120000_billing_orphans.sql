-- =============================================================================================
-- BILLING ORPHANS (lane `billing-orphans`; milestone 38's billing line: the Advisor's Q38 and credit-watch's second
-- red-team pass). The mechanism is docs/systems/billing-caps.md's, the lock rules and grants
-- docs/systems/database-security.md's. Three parts:
--
--   1. AN ORPHAN'S GRANT ADOPTED IN ONE TRANSACTION. A claim taken past another checkout's lapsed, ungranted claim on
--      its passes (an orphan, credit-watch 20261005201000) looks on Stripe's side for the orphan's grant before it
--      grants; a grant found is the orphan's own credit. The route then made three calls, each its own transaction:
--      the orphan's grant on record, its conversion, and this claim's release. A failure between them (a dropped
--      connection, a function killed at its maxDuration) left the orphan granted and unconverted (her passes and her
--      credit both hers) with this claim still leased, until Stripe's retry or the operator's Retry came, and a retry
--      that met the orphan granted answered overlap and never converted it. Now
--        adopt_pass_credit_orphans(session, host, orphan sessions, their grants): her profiles row first, then every
--          orphan's grant on record and converted, oldest first, then this claim released: all or nothing.
--      ★ TWO ORPHANS BOTH HOLDING GRANTS for the same pass: the first converts and is the credit; a later one whose
--      passes are credited by then is released WITH its grant on record beside it (`granted_twice`, the Accounts
--      list's "granted twice": the operator reverses that one in Stripe), never converted for none and left reading as
--      a credit. The answer names it, so the route raises it.
--      ★ An orphan whose own delivery came back and holds its lease again answers busy (nothing written): this claim's
--      retry meets that orphan's grant or its lapse.
--   2. A RELEASED CLAIM TAKES NO GRANT BY RECORD. record_pass_credit_grant put a grant on a claim already released
--      (its holder slept past its lease, another checkout credited its passes and released it, then it woke and
--      recorded the grant it made): granted and released at once, by the path meant for a credit, after which its
--      conversion failed on pass_credits_released_unconverted. Now it refuses a released claim in words, and the
--      route settles that grant the one way a grant beside a release is settled:
--   3. release_pass_credit PUTS A LATE GRANT ON RECORD BESIDE A RELEASE: a replay naming a grant on a claim released
--      with none on record writes it beside the release ('released_granted', the Accounts list's granted twice), so the
--      woken holder's grant is never lost from the record; any other replay answers what is on record, as before.
--
-- ★ WHAT THE DEPLOYED BUILDS MEET (partyreel.com and the alias share this database; Stripe is in TEST and nothing holds
-- real money): partyreel.com's milestone-37 predates the claim (its credit is consume_passes_for_pro_credit, untouched
-- here). A build carrying credit-watch's route calls record_pass_credit_grant only on its own open claim and on an
-- orphan it adopts (never released: the claim names only unreleased orphans), so the refusal reaches it only in the
-- woken-holder race it was already failing (a 500, Stripe's retry, an overlap); its release call is unchanged but for a
-- replay naming a grant on a released claim, which it never makes. The new function is called by this lane's route
-- alone. Apply this before this lane's build deploys: PostgREST answers a call to a function it does not hold with
-- PGRST202, which the adoption path would meet as a 500 that Stripe retries.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: each body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on 2026-10-06:
--   record_pass_credit_grant  8605ffe454f7e3ab41cdeaf8384edc6e  (20261005181000_billing_integrity)
--   release_pass_credit       daf8070ceefe570939df3dd5965ecb5d  (20261005201000_credit_watch)
-- and adopt_pass_credit_orphans must be absent. Then the rolled-back proof at the foot of this file, RED without this
-- file's statements and GREEN with them; then apply verbatim; then get_advisors (unchanged: the new function is INVOKER
-- and no client role's); then regenerate src/lib/db/types.ts (the function), which drops the lane's typed seam
-- (`orphansDb` in src/lib/db/mutations/event-passes.ts).

-- =============================================================================================
-- 1. An orphan's grant adopted in one transaction.
-- =============================================================================================
-- Answers one jsonb, its `state`:
--   'adopted'  every orphan named is settled and this claim is released: `orphans`, oldest first, each `session`,
--              `balance_transaction_id` (the grant on record), `converted` (how many of its passes this call
--              converted) and `granted_twice` (true when its passes were credited by then: released beside its grant,
--              which the operator reverses in Stripe);
--   'busy'     an orphan named holds a live lease again (`retry_after_sec`): nothing written, answer non-2xx.
-- Refused in words: an orphan named twice or this claim among them, a grant missing for one, a claim that is not this
-- host's or names no pass of this claim, one granted or released already, and this claim granted or released.
create function public.adopt_pass_credit_orphans(
  p_session_id text,
  p_host_id uuid,
  p_orphan_sessions text[],
  p_balance_transaction_ids text[]
)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_claim public.pass_credits;
  v_orphan public.pass_credits;
  v_found integer := 0;
  v_held_until timestamptz;
  v_txn text;
  v_recorded text;
  v_converted integer;
  v_adopted jsonb := '[]'::jsonb;
begin
  if p_session_id is null or btrim(p_session_id) = '' or p_host_id is null
     or p_orphan_sessions is null or cardinality(p_orphan_sessions) = 0
     or array_position(p_orphan_sessions, null) is not null
     or p_balance_transaction_ids is null
     or cardinality(p_balance_transaction_ids) <> cardinality(p_orphan_sessions)
     or array_position(p_balance_transaction_ids, null) is not null
     or exists (select 1 from unnest(p_balance_transaction_ids) t where btrim(t) = '')
     or (select count(distinct s) from unnest(p_orphan_sessions) s) <> cardinality(p_orphan_sessions)
     or p_session_id = any(p_orphan_sessions) then
    raise exception 'adopt_pass_credit_orphans needs a session, a host, and each orphan once with its grant.'
      using errcode = 'invalid_parameter_value';
  end if;

  -- ★ HER PROFILES ROW FIRST, the one lock order (database-security.md), held to the end: the record, the conversion
  -- and the releases below each take it again inside this transaction, so nothing of hers decides between them.
  perform 1 from public.profiles where id = p_host_id for update;
  select * into v_claim from public.pass_credits
   where stripe_session_id = p_session_id and profile_id = p_host_id for update;
  if not found then
    raise exception 'This checkout''s credit has no claim to release.' using errcode = 'no_data_found';
  end if;
  if v_claim.released_at is not null then
    raise exception 'This checkout''s credit is released already.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  if v_claim.granted_at is not null then
    raise exception 'This checkout''s credit is granted: it converts, never releases.'
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  -- Every orphan named, read and refused before anything is written: her claim on a pass this claim names, neither
  -- granted nor released (what the claim named it for), and no live lease (its own delivery came back: busy).
  for v_orphan in
    select c.* from public.pass_credits c
     where c.stripe_session_id = any(p_orphan_sessions)
     order by c.created_at, c.stripe_session_id
       for update
  loop
    v_found := v_found + 1;
    if v_orphan.profile_id <> p_host_id or not (v_orphan.pass_ids && v_claim.pass_ids) then
      raise exception 'A claim named is not an orphan of this checkout''s credit.' using errcode = 'check_violation';
    end if;
    if v_orphan.granted_at is not null or v_orphan.released_at is not null then
      raise exception 'An orphan named is settled already.' using errcode = 'object_not_in_prerequisite_state';
    end if;
    if v_orphan.claimed_until > now() then
      v_held_until := greatest(v_held_until, v_orphan.claimed_until);
    end if;
  end loop;
  if v_found <> cardinality(p_orphan_sessions) then
    raise exception 'An orphan named has no claim.' using errcode = 'no_data_found';
  end if;
  if v_held_until is not null then
    return jsonb_build_object('state', 'busy',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_held_until - now()))))::integer);
  end if;

  -- Oldest first: each orphan's grant is its own credit, put on record and converted, unless a pass it names is
  -- credited by then (an older orphan's conversion just now): then its grant is the second for that pass, released
  -- beside it, never a conversion of none.
  for v_orphan in
    select c.* from public.pass_credits c
     where c.stripe_session_id = any(p_orphan_sessions)
     order by c.created_at, c.stripe_session_id
  loop
    v_txn := p_balance_transaction_ids[array_position(p_orphan_sessions, v_orphan.stripe_session_id)];
    if exists (select 1 from public.event_passes q
                where q.id = any(v_orphan.pass_ids) and q.profile_id = p_host_id and q.consumed_at is not null) then
      perform public.release_pass_credit(v_orphan.stripe_session_id, p_host_id, v_txn);
      v_adopted := v_adopted || jsonb_build_object('session', v_orphan.stripe_session_id,
        'balance_transaction_id', v_txn, 'converted', 0, 'granted_twice', true);
    else
      v_recorded := public.record_pass_credit_grant(v_orphan.stripe_session_id, p_host_id, v_txn);
      v_converted := public.convert_pass_credit(v_orphan.stripe_session_id, p_host_id);
      v_adopted := v_adopted || jsonb_build_object('session', v_orphan.stripe_session_id,
        'balance_transaction_id', v_recorded, 'converted', v_converted, 'granted_twice', false);
    end if;
  end loop;

  -- This claim, released for good: its passes are the orphans' credit now (the release refuses, and so undoes all of
  -- the above, if none of them was).
  perform public.release_pass_credit(p_session_id, p_host_id);
  return jsonb_build_object('state', 'adopted', 'orphans', v_adopted);
end;
$$;

revoke all on function public.adopt_pass_credit_orphans(text, uuid, text[], text[]) from public, anon, authenticated;
grant execute on function public.adopt_pass_credit_orphans(text, uuid, text[], text[]) to service_role;

-- =============================================================================================
-- 2. A released claim takes no grant by record.
-- =============================================================================================
-- 20261005181000's body verbatim but for the released refusal after the claim is read. Same signature, return type,
-- language, volatility, security mode and empty search_path, so create or replace keeps the ACL; the grants are
-- restated as they stand live.
create or replace function public.record_pass_credit_grant(
  p_session_id text,
  p_host_id uuid,
  p_balance_transaction_id text
)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_claim public.pass_credits;
begin
  if p_session_id is null or p_host_id is null or p_balance_transaction_id is null
     or btrim(p_balance_transaction_id) = '' then
    raise exception 'record_pass_credit_grant needs a session, a host and the balance transaction.'
      using errcode = 'invalid_parameter_value';
  end if;
  perform 1 from public.profiles where id = p_host_id for update;
  select * into v_claim from public.pass_credits
   where stripe_session_id = p_session_id and profile_id = p_host_id for update;
  if not found then
    raise exception 'This checkout''s credit has no claim to record.' using errcode = 'no_data_found';
  end if;
  -- ★ A released claim is settled for good: another checkout credited its passes. A grant its holder made anyway goes
  -- on record beside the release (release_pass_credit), never as a credit by this path.
  if v_claim.released_at is not null then
    raise exception 'This checkout''s credit is released: its grant goes on record beside the release.'
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  if v_claim.granted_at is not null then
    return v_claim.balance_transaction_id;
  end if;
  update public.pass_credits
     set balance_transaction_id = p_balance_transaction_id, granted_at = now(), claimed_until = null
   where stripe_session_id = p_session_id;
  return p_balance_transaction_id;
end;
$$;

revoke all on function public.record_pass_credit_grant(text, uuid, text) from public, anon, authenticated;
grant execute on function public.record_pass_credit_grant(text, uuid, text) to service_role;

-- =============================================================================================
-- 3. A late grant on record beside a release.
-- =============================================================================================
-- 20261005201000's body verbatim but for the replay: a claim released with no grant on record takes one named beside
-- it. Same signature, return type, language, volatility, security mode and empty search_path; the grants restated.
create or replace function public.release_pass_credit(
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
  -- A replay answers what is on record, but for a grant named that a claim released with none never recorded: its
  -- holder woke past its lease and granted (record_pass_credit_grant refuses it), so it goes on record here.
  if v_claim.released_at is not null then
    if v_claim.granted_at is null and p_balance_transaction_id is not null then
      update public.pass_credits
         set balance_transaction_id = p_balance_transaction_id, granted_at = now()
       where stripe_session_id = p_session_id;
      return 'released_granted';
    end if;
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
-- 4. What each piece is, where an operator reads it.
-- =============================================================================================
comment on function public.adopt_pass_credit_orphans(text, uuid, text[], text[]) is
  'Adopts the grants Stripe holds for a pass-to-Pro claim''s orphans (other checkouts'' lapsed, ungranted claims on its passes) in one transaction (the Stripe webhook, service role only): her profiles row first; each orphan''s grant on record and converted, oldest first (one whose passes are credited by then released beside its grant: granted twice), then this claim released. Answers adopted, or busy when an orphan holds a live lease again.';

comment on function public.record_pass_credit_grant(text, uuid, text) is
  'Puts a pass-to-Pro credit''s customer-balance transaction on record, once (service role only); answers the transaction on record, an earlier one when there is one. Refuses a released claim (its grant goes on record beside the release, release_pass_credit).';

comment on function public.release_pass_credit(text, uuid, text) is
  'Settles a pass-to-Pro claim another checkout''s credit overtook (service role only): her profiles row first; released for good, with the grant Stripe holds for it on record beside it when one is named (granted twice: that grant is the duplicate), on a replay too when none is on record yet. Refuses a granted claim and one whose passes no other checkout credited.';
-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call. RED: `begin;` + the block below + `rollback;`. GREEN: `begin;` + this file's statements + the block below +
-- `rollback;`. It makes its own accounts (auth users, so handle_new_user makes their profiles), a conversion that fails
-- on demand (a trigger, as a dropped connection or a killed function would), and every call runs as the service role
-- (`set local role`, INVOKER bodies) through dynamic SQL, so the RED run fails on what it lacks, never on a parse. Each
-- step traps its own failure into the temp `proof` table; the final select is the answer.
--
-- NOT YET RUN (the lane had no SQL access; the Orchestrator runs it before the apply). The drift read above was taken
-- live on 2026-10-06 (the two bodies at those hashes, the new function absent). What each run must show:
--   RED   1a true (THE OLD PATH'S HOLE: the route's record then a failing conversion leaves the orphan granted and
--         unconverted, 0 passes converted, this claim still leased); 1b, 2 and 3 false (no adopt_pass_credit_orphans:
--         "error 42883 function ... does not exist"); 4 false (THE RECORD ON A RELEASED CLAIM: record_pass_credit_grant
--         answers the transaction and writes the grant onto the released claim); 5 false (the function absent, the two
--         bodies at the drift hashes).
--   GREEN 0 to 5 all true: 1b a failure mid-adoption writes nothing, whole it records, converts 2 and releases;
--         2 the older orphan converts 2, the younger is released beside its grant (granted_twice true); 3 a live lease
--         answers busy (retry_after_sec 200 to 240) and ten refusals in words, nothing written; 4 record refuses a
--         released claim (55000), the release's replay puts the grant beside it once ('released_granted'), later
--         replays answer the record; 5 three functions postgres+service_role EXECUTE, plpgsql volatile INVOKER with an
--         empty search_path, and their three hashes (record them in the Handoff). Nothing persists after the rollback
--         (no fixture user, no zz_proof_fail_convert, the bodies at their drift hashes).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid);
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
--
-- -- A conversion that fails on demand, as a dropped connection or a killed function would (rolled back with the rest).
-- create function public.zz_proof_fail_convert() returns trigger language plpgsql as $f$
-- begin
--   if current_setting('proof.fail_convert', true) = 'on' then
--     raise exception 'proof: the conversion fails here';
--   end if;
--   return new;
-- end $f$;
-- grant execute on function public.zz_proof_fail_convert() to service_role;
-- create trigger zz_proof_fail_convert before update on public.event_passes
--   for each row execute function public.zz_proof_fail_convert();
--
-- -- Every call as its caller makes it: the service role, dynamic (the RED run lacks the function), an error in words.
-- create function pg_temp.call(p_sql text, p_args text[]) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   set local role service_role;
--   execute p_sql into got using p_args[1], p_args[2], p_args[3], p_args[4];
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.adopt(p_session text, p_host uuid, p_orphans text[], p_txns text[]) returns text
-- language plpgsql as $f$
-- declare got jsonb;
-- begin
--   set local role service_role;
--   execute 'select public.adopt_pass_credit_orphans($1, $2, $3, $4)' into got using p_session, p_host, p_orphans, p_txns;
--   reset role;
--   return got::text;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.rec(p_session text, p_host uuid, p_txn text) returns text language sql as $f$
--   select pg_temp.call('select public.record_pass_credit_grant($1, $2::uuid, $3)', array[p_session, p_host::text, p_txn]) $f$;
-- create function pg_temp.conv(p_session text, p_host uuid) returns text language sql as $f$
--   select pg_temp.call('select public.convert_pass_credit($1, $2::uuid)::text', array[p_session, p_host::text]) $f$;
-- create function pg_temp.rel(p_session text, p_host uuid, p_txn text default null) returns text language sql as $f$
--   select case when p_txn is null
--     then pg_temp.call('select public.release_pass_credit($1, $2::uuid)', array[p_session, p_host::text])
--     else pg_temp.call('select public.release_pass_credit($1, $2::uuid, $3)', array[p_session, p_host::text, p_txn]) end $f$;
-- create function pg_temp.row_of(p_session text) returns text language sql as $f$
--   select coalesce((select format('lease %s grant %s released %s converted %s',
--            case when claimed_until is null then 'none' when claimed_until > now() then 'live' else 'lapsed' end,
--            coalesce(balance_transaction_id, 'none'), (released_at is not null), coalesce(converted_count::text, 'none'))
--          from public.pass_credits where stripe_session_id = p_session), 'no row') $f$;
-- create function pg_temp.consumed(p_host text) returns integer language sql as $f$
--   select count(*)::integer from public.event_passes where profile_id = pg_temp.fx(p_host) and consumed_at is not null $f$;
-- -- A host with two live passes and claims on both: each (session, lease offset from now, created offset).
-- create function pg_temp.setup(p_host text, p_claims text[], p_leases interval[], p_ages interval[]) returns void
-- language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host); a uuid; b uuid; ids uuid[]; i integer;
-- begin
--   delete from public.pass_credits where profile_id = h;
--   delete from public.event_passes where profile_id = h;
--   update public.profiles set tier = 'event_pass', storage_cap_bytes = 53687091200, event_slots = 2,
--          tier_expires_at = now() + interval '355 days' where id = h;
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source)
--   values (h, now() - interval '10 days', now() + interval '355 days', 2900, 'initial') returning id into a;
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source)
--   values (h, now() - interval '20 days', now() + interval '345 days', 2900, 'initial') returning id into b;
--   select array_agg(x order by x) into ids from unnest(array[a, b]) x;
--   for i in 1 .. cardinality(p_claims) loop
--     insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until, created_at)
--     values (p_claims[i], h, 1850, ids, now() + p_leases[i], now() - p_ages[i]);
--   end loop;
-- end $f$;
--
-- do $$
-- declare k text; h uuid;
-- begin
--   foreach k in array array['hole', 'adopt', 'busy', 'woke'] loop
--     h := gen_random_uuid();
--     execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--       using h, 'billing-orphans-' || h || '@example.com';
--     insert into public.profiles (id, email, display_name) values (h, 'billing-orphans-' || h || '@example.com', 'Orph ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, h);
--   end loop;
--   insert into proof (step, ok, detail) values ('0 fixtures', true, 'four hosts');
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. THE OLD PATH'S HOLE, then the adoption's refusal of it. Orphan cs_bo_o1 (lapsed, ungranted) and this claim cs_bo_t1
-- -- (leased). The route's three calls, a failure at the conversion: the orphan is left granted and unconverted, this claim
-- -- still leased. The same failure inside the adoption leaves nothing written; with no failure, all of it lands.
-- do $$
-- declare h uuid := pg_temp.fx('hole'); r1 text; c1 text; s1 text; t1 text; n1 integer; a2 text; s2 text; t2 text; n2 integer;
--   a3 text; s3 text; t3 text; n3 integer; fail text := '';
-- begin
--   perform pg_temp.setup('hole', array['cs_bo_o1', 'cs_bo_t1'], array[-interval '1 minute', interval '9 minutes'],
--                         array[interval '20 minutes', interval '0 seconds']);
--   r1 := pg_temp.rec('cs_bo_o1', h, 'cbtxn_bo_o1');
--   perform set_config('proof.fail_convert', 'on', true);
--   c1 := pg_temp.conv('cs_bo_o1', h);
--   perform set_config('proof.fail_convert', 'off', true);
--   s1 := pg_temp.row_of('cs_bo_o1'); t1 := pg_temp.row_of('cs_bo_t1'); n1 := pg_temp.consumed('hole');
--   insert into proof (step, ok, detail) values ('1a the old path''s hole (both runs)',
--     s1 = 'lease none grant cbtxn_bo_o1 released false converted none' and c1 like 'error %' and n1 = 0
--       and t1 = 'lease live grant none released false converted none',
--     format('orphan %s; conversion %s; this claim %s; %s passes converted', s1, c1, t1, n1));
--
--   -- The adoption, on a fresh pair.
--   perform pg_temp.setup('hole', array['cs_bo_o1', 'cs_bo_t1'], array[-interval '1 minute', interval '9 minutes'],
--                         array[interval '20 minutes', interval '0 seconds']);
--   perform set_config('proof.fail_convert', 'on', true);
--   a2 := pg_temp.adopt('cs_bo_t1', h, array['cs_bo_o1'], array['cbtxn_bo_o1']);
--   perform set_config('proof.fail_convert', 'off', true);
--   s2 := pg_temp.row_of('cs_bo_o1'); t2 := pg_temp.row_of('cs_bo_t1'); n2 := pg_temp.consumed('hole');
--   a3 := pg_temp.adopt('cs_bo_t1', h, array['cs_bo_o1'], array['cbtxn_bo_o1']);
--   s3 := pg_temp.row_of('cs_bo_o1'); t3 := pg_temp.row_of('cs_bo_t1'); n3 := pg_temp.consumed('hole');
--   if a2 not like 'error %the conversion fails%' or s2 <> 'lease lapsed grant none released false converted none'
--      or t2 <> 'lease live grant none released false converted none' or n2 <> 0 then
--     fail := fail || format(' a failure mid-adoption: %s / orphan %s / claim %s / %s;', a2, s2, t2, n2);
--   end if;
--   if (a3::jsonb)->>'state' is distinct from 'adopted'
--      or (a3::jsonb)->'orphans' is distinct from '[{"session": "cs_bo_o1", "converted": 2, "granted_twice": false, "balance_transaction_id": "cbtxn_bo_o1"}]'::jsonb
--      or s3 <> 'lease none grant cbtxn_bo_o1 released false converted 2'
--      or t3 <> 'lease none grant none released true converted none' or n3 <> 2 then
--     fail := fail || format(' the adoption: %s / orphan %s / claim %s / %s;', a3, s3, t3, n3);
--   end if;
--   insert into proof (step, ok, detail) values ('1b one transaction: all or nothing', fail = '',
--     coalesce(nullif(fail, ''), 'a failure inside it wrote nothing; whole, the orphan granted and converted, this claim released'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1b one transaction: all or nothing', false, sqlerrm);
-- end $$;
--
-- -- 2. TWO ORPHANS BOTH HOLDING GRANTS for the same passes: the older converts; the younger is released beside its grant
-- -- (granted twice), never a conversion of none.
-- do $$
-- declare h uuid := pg_temp.fx('adopt'); a text; sa text; sb text; t text; fail text := '';
-- begin
--   perform pg_temp.setup('adopt', array['cs_bo_b', 'cs_bo_a', 'cs_bo_t2'],
--     array[-interval '1 minute', -interval '2 minutes', interval '9 minutes'],
--     array[interval '20 minutes', interval '30 minutes', interval '0 seconds']);
--   -- Named out of order on purpose: the function takes them oldest first.
--   a := pg_temp.adopt('cs_bo_t2', h, array['cs_bo_b', 'cs_bo_a'], array['cbtxn_bo_b', 'cbtxn_bo_a']);
--   sa := pg_temp.row_of('cs_bo_a'); sb := pg_temp.row_of('cs_bo_b'); t := pg_temp.row_of('cs_bo_t2');
--   if (a::jsonb)->'orphans' is distinct from
--        '[{"session": "cs_bo_a", "converted": 2, "granted_twice": false, "balance_transaction_id": "cbtxn_bo_a"},
--          {"session": "cs_bo_b", "converted": 0, "granted_twice": true, "balance_transaction_id": "cbtxn_bo_b"}]'::jsonb
--      or sa <> 'lease none grant cbtxn_bo_a released false converted 2'
--      or sb <> 'lease none grant cbtxn_bo_b released true converted none'
--      or t <> 'lease none grant none released true converted none' then
--     fail := format('%s / a %s / b %s / this %s', a, sa, sb, t);
--   end if;
--   insert into proof (step, ok, detail) values ('2 two orphans granted: the older credits, the younger flagged', fail = '',
--     coalesce(nullif(fail, ''), 'older converted 2; younger released beside its grant (granted twice); this claim released'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 two orphans granted: the older credits, the younger flagged', false, sqlerrm);
-- end $$;
--
-- -- 3. BUSY and the refusals, each writing nothing.
-- do $$
-- declare h uuid := pg_temp.fx('busy'); o uuid := pg_temp.fx('adopt'); b text; sb text; t text; r text[]; fail text := '';
-- begin
--   perform pg_temp.setup('busy', array['cs_bo_o3', 'cs_bo_t3', 'cs_bo_g3'],
--     array[interval '4 minutes', interval '9 minutes', -interval '1 minute'],
--     array[interval '20 minutes', interval '0 seconds', interval '40 minutes']);
--   b := pg_temp.adopt('cs_bo_t3', h, array['cs_bo_o3'], array['cbtxn_bo_o3']);
--   sb := pg_temp.row_of('cs_bo_o3'); t := pg_temp.row_of('cs_bo_t3');
--   if (b::jsonb)->>'state' is distinct from 'busy' or ((b::jsonb)->>'retry_after_sec')::integer not between 200 and 240
--      or sb <> 'lease live grant none released false converted none'
--      or t <> 'lease live grant none released false converted none' then
--     fail := fail || format(' busy %s / %s / %s;', b, sb, t);
--   end if;
--   update public.pass_credits set balance_transaction_id = 'cbtxn_bo_g3', granted_at = now(), claimed_until = null
--    where stripe_session_id = 'cs_bo_g3';
--   r := array[
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_o3', 'cs_bo_o3'], array['x', 'y']),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_o3'], array[]::text[]),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_o3'], array['  ']),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_t3'], array['x']),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_none'], array['x']),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_g3'], array['x']),
--     pg_temp.adopt('cs_bo_t3', h, array['cs_bo_a'], array['x']),
--     pg_temp.adopt('cs_bo_g3', h, array['cs_bo_o3'], array['x']),
--     pg_temp.adopt('cs_bo_none', h, array['cs_bo_o3'], array['x']),
--     pg_temp.adopt('cs_bo_t2', o, array['cs_bo_a'], array['x'])];
--   if r[1] not like 'error 22023 %' or r[2] not like 'error 22023 %' or r[3] not like 'error 22023 %'
--      or r[4] not like 'error 22023 %' or r[5] not like 'error P0002 %has no claim%'
--      or r[6] not like 'error 55000 %settled already%' or r[7] not like 'error 23514 %not an orphan%'
--      or r[8] not like 'error 55000 %granted%' or r[9] not like 'error P0002 %' or r[10] not like 'error 55000 %released already%' then
--     fail := fail || ' refusals ' || array_to_string(r, ' | ');
--   end if;
--   if pg_temp.row_of('cs_bo_t3') <> 'lease live grant none released false converted none' or pg_temp.consumed('busy') <> 0 then
--     fail := fail || ' a refusal wrote';
--   end if;
--   insert into proof (step, ok, detail) values ('3 busy and the refusals', fail = '',
--     coalesce(nullif(fail, ''), 'a live lease busy, nothing written; ten refusals in words, nothing written'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 busy and the refusals', false, sqlerrm);
-- end $$;
--
-- -- 4. THE WOKEN HOLDER: its claim released (another checkout credited the passes), then it records the grant it made.
-- -- Refused by record; put on record beside the release by the release's replay; replays after answer what is on record.
-- do $$
-- declare h uuid := pg_temp.fx('woke'); r0 text; rr text; s1 text; l1 text; s2 text; l2 text; l3 text; s3 text; fail text := '';
-- begin
--   perform pg_temp.setup('woke', array['cs_bo_w', 'cs_bo_win'], array[-interval '1 minute', interval '9 minutes'],
--                         array[interval '20 minutes', interval '0 seconds']);
--   perform pg_temp.rec('cs_bo_win', h, 'cbtxn_bo_win');
--   perform pg_temp.conv('cs_bo_win', h);
--   r0 := pg_temp.rel('cs_bo_w', h);
--   rr := pg_temp.rec('cs_bo_w', h, 'cbtxn_bo_w');
--   s1 := pg_temp.row_of('cs_bo_w');
--   l1 := pg_temp.rel('cs_bo_w', h, 'cbtxn_bo_w');
--   s2 := pg_temp.row_of('cs_bo_w');
--   l2 := pg_temp.rel('cs_bo_w', h, 'cbtxn_bo_other');
--   l3 := pg_temp.rel('cs_bo_w', h);
--   s3 := pg_temp.row_of('cs_bo_w');
--   if r0 <> 'released' then fail := fail || ' release ' || r0; end if;
--   if rr not like 'error 55000 %released%' or s1 <> 'lease none grant none released true converted none' then
--     fail := fail || format(' THE RECORD on a released claim: %s (%s);', rr, s1);
--   end if;
--   if l1 <> 'released_granted' or s2 <> 'lease none grant cbtxn_bo_w released true converted none' then
--     fail := fail || format(' the late grant beside the release: %s (%s);', l1, s2);
--   end if;
--   if l2 <> 'released_granted' or l3 <> 'released_granted' or s3 <> s2 then
--     fail := fail || format(' replays %s %s (%s);', l2, l3, s3);
--   end if;
--   insert into proof (step, ok, detail) values ('4 the woken holder''s grant', fail = '',
--     coalesce(nullif(fail, ''), 'record refuses a released claim; the release puts its grant beside it once; replays answer the record'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the woken holder''s grant', false, sqlerrm);
-- end $$;
--
-- -- 5. Grants, shapes and bodies.
-- do $$
-- declare r record; got text; shape text; fail text := '';
-- begin
--   for r in select * from (values
--       ('public.adopt_pass_credit_orphans(text, uuid, text[], text[])'),
--       ('public.record_pass_credit_grant(text, uuid, text)'),
--       ('public.release_pass_credit(text, uuid, text)')) v(fn)
--   loop
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' '
--                       order by a.grantee::regrole::text || ':' || a.privilege_type) into got
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end into shape
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if got is distinct from 'postgres:EXECUTE service_role:EXECUTE' then fail := fail || format(' %s acl %s;', r.fn, got); end if;
--     if shape is distinct from 'plpgsql v invoker' then fail := fail || format(' %s shape %s;', r.fn, shape); end if;
--   end loop;
--   select string_agg(p.proname || '=' || md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))), ' ' order by p.proname) into got
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('adopt_pass_credit_orphans', 'record_pass_credit_grant', 'release_pass_credit');
--   insert into proof (step, ok, detail) values ('5 grants, shapes, bodies', fail = '', coalesce(nullif(fail, ''), got));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 grants, shapes, bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
