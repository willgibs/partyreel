-- QA Q2 — billing/entitlement guards (adversarial review 2026-07-29). Closes #5 (and the #26 it
-- names as its compounding factor). Companions #3/#4/#35 are app-side only.
--
-- PENDING-APPLY. At apply time:
--   (1) run the DUPLICATE PRE-CHECK below FIRST as a plain select. The partial unique index cannot
--       be created while two profiles share a stripe_customer_id, and a bare unique_violation
--       names neither row. The DO block re-runs it inside the migration so the failure is at least
--       diagnosable, but knowing the answer beforehand is cheaper.
--   (2) apply_migration verbatim.
--   (3) get_advisors → the expected set is UNCHANGED. No new tables, no new RPCs, no new
--       grants: stripe_event_created_at is a service-role-write-only column on an existing table,
--       and the index is not a security object.
--   (4) regenerate types (profiles gains stripe_event_created_at). Two casts in
--       src/app/api/stripe/webhook/route.ts are commented to drop at that point.
--   (5) run the CONTRACT CHECK at the bottom (rolled back, nothing persists).
--
-- ★ DEPLOY ORDERING: apply this BEFORE the Q2 app code reaches prod. The webhook's entitlement
-- writes filter on stripe_event_created_at; without the column PostgREST answers 42703, the route
-- 500s and Stripe retries for three days. Entitlements are delayed, not lost, and it self-heals
-- the moment this lands. That is the deliberate failure direction: a guard that quietly disabled
-- itself on a missing column would be the fail-open shape this whole round is removing.
--
-- Closes:
--   #5  Subscription provisioning had no ordering guard. Keyed on the customer alone with no
--       recency check, a retried or out-of-order Stripe delivery could re-grant Pro AFTER a
--       cancellation, or strip a paying host back to Free. Stripe retries for up to three days and
--       guarantees no ordering, so this is an expected delivery pattern, not an edge case.
--   #26 profiles.stripe_customer_id had no unique index, so two profiles could claim one Stripe
--       customer and the customer-keyed subscription write would entitle whichever row it found.

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 1. The delivery cursor: the `event.created` of the last Stripe event applied to this profile.
--
-- NOT NULL DEFAULT epoch rather than a nullable column, on purpose: every guard then reduces to a
-- single comparison (`stripe_event_created_at < $1`) instead of a NULL-or-compare pair that has to
-- be hand-assembled as a PostgREST `.or()` string, where an unquoted timestamp value is one parser
-- quirk away from silently matching nothing. Existing rows backfill to epoch, so the first real
-- Stripe event for every host is newer than the sentinel and applies normally.
--
-- ★ SERVICE-ROLE WRITE ONLY. profiles revoked table-level UPDATE from authenticated in the init
-- migration and re-grants a column allowlist (currently email, announcements_seen_at, welcomed_at
-- per 20260608093939); a NEW column is therefore ungranted by construction and MUST STAY that way.
-- If a host could write this cursor they could set it to the far future and freeze their own
-- entitlement, keeping Pro through a cancellation. The assertion below fails the migration if that
-- ever stops being true. SELECT is table-wide on profiles (RLS-scoped to the owner's row), which
-- is harmless here: it is a timestamp of your own last billing event.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists stripe_event_created_at timestamptz
    not null default '1970-01-01 00:00:00+00';

comment on column public.profiles.stripe_event_created_at is
  'Stripe event.created of the last webhook delivery applied to this profile (QA #5 ordering '
  'guard). Epoch = none applied yet. The webhook writes it in the same statement as the '
  'entitlement, filtering on it so an out-of-order or replayed delivery matches zero rows: '
  '<= for the absolute subscription patch (replay-safe, and same-second events must not be '
  'dropped), < for the accumulating Event Pass extension (a replay would gift a second year). '
  'Service-role write only, deliberately outside the authenticated UPDATE allowlist.';

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 2. DUPLICATE PRE-CHECK (#26). Run this select on its own first; the DO block repeats it so a
-- failure names the offending customer ids instead of a bare unique_violation.
--
--   select stripe_customer_id, count(*), array_agg(id)
--   from public.profiles
--   where stripe_customer_id is not null
--   group by stripe_customer_id having count(*) > 1;
--
-- If it returns rows, do NOT auto-resolve: decide by hand which profile the Stripe customer really
-- belongs to (check Stripe for the customer's email + metadata.userId), null the others, and only
-- then apply.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_dupes text;
begin
  select string_agg(stripe_customer_id, ', ')
    into v_dupes
  from (
    select stripe_customer_id
    from public.profiles
    where stripe_customer_id is not null
    group by stripe_customer_id
    having count(*) > 1
  ) d;

  if v_dupes is not null then
    raise exception
      'Cannot create profiles_stripe_customer_id_unique: these Stripe customers map to more than one profile: %. Resolve by hand (see the pre-check note above), then re-apply.',
      v_dupes;
  end if;
end $$;

-- Partial: stripe_customer_id is null for every host who has never been through checkout, and
-- those are the overwhelming majority. A partial index also keeps the nulls out of the b-tree
-- entirely, so it stays small.
create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 3. Grant assertion. A column-level revoke is a silent no-op while a table-level grant stands
-- (the lesson from the events/media write-grant lockdowns), so assert the OUTCOME rather than
-- trusting the absence of a grant statement.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
do $$
begin
  if has_column_privilege('authenticated', 'public.profiles', 'stripe_event_created_at', 'UPDATE')
     or has_column_privilege('anon', 'public.profiles', 'stripe_event_created_at', 'UPDATE')
  then
    raise exception
      'profiles.stripe_event_created_at is client-writable. A host could freeze their own entitlement cursor and keep a cancelled plan. Revoke it before shipping.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- CONTRACT CHECK (run separately after applying; rolls itself back, nothing persists).
-- Proves the guard predicate behaves as the webhook assumes on a real row.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- do $$
-- declare
--   v_id uuid;
--   v_hit int;
-- begin
--   select id into v_id from public.profiles limit 1;
--
--   -- fresh row: epoch sentinel, so any real delivery is newer under both comparisons
--   update public.profiles set stripe_event_created_at = '1970-01-01 00:00:00+00' where id = v_id;
--
--   update public.profiles set stripe_event_created_at = '2026-07-29 12:00:00+00'
--     where id = v_id and stripe_event_created_at < '2026-07-29 12:00:00+00';
--   get diagnostics v_hit = row_count;
--   if v_hit <> 1 then raise exception 'first delivery should apply, matched %', v_hit; end if;
--
--   -- exact replay: refused by the accumulating (<) guard, accepted by the absolute (<=) one
--   update public.profiles set stripe_event_created_at = '2026-07-29 12:00:00+00'
--     where id = v_id and stripe_event_created_at < '2026-07-29 12:00:00+00';
--   get diagnostics v_hit = row_count;
--   if v_hit <> 0 then raise exception 'replay must not extend, matched %', v_hit; end if;
--
--   update public.profiles set stripe_event_created_at = '2026-07-29 12:00:00+00'
--     where id = v_id and stripe_event_created_at <= '2026-07-29 12:00:00+00';
--   get diagnostics v_hit = row_count;
--   if v_hit <> 1 then raise exception 'same-second absolute write must apply, matched %', v_hit; end if;
--
--   -- an OLDER delivery arriving after a newer one: refused by both
--   update public.profiles set stripe_event_created_at = '2026-07-29 09:00:00+00'
--     where id = v_id and stripe_event_created_at <= '2026-07-29 09:00:00+00';
--   get diagnostics v_hit = row_count;
--   if v_hit <> 0 then raise exception 'stale delivery must be ignored, matched %', v_hit; end if;
--
--   raise exception 'CONTRACT CHECK PASSED (rolling back)';
-- end $$;
