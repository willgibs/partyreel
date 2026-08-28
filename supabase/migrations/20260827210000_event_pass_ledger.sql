-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- Event Pass ledger — stacking + prorated Pro credit (Will's rulings 2026-08-27, ADR-0025).
-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- WHY a ledger: the pass was a single profile-level entitlement (tier + tier_expires_at), which
-- cannot represent (a) MULTIPLE concurrent passes on one account ("users may want to buy a second
-- or multiple event passes on a free plan") or (b) the prorated credit each pass contributes when
-- the host moves to Pro ("nothing gets lost, nothing gets banked"). Each row is one PURCHASE with
-- its own [start_at, expires_at) window and the price actually paid:
--   • initial purchase  → window [purchase, purchase + 365d)
--   • renewal           → a NEW row whose window STARTS at the soonest-expiring active pass's
--     expiry (computed app-side at webhook time), so a renewal extends the chain WITHOUT granting
--     a second concurrent slot, and an unused renewal window credits at 100%.
-- Derived state (the app's recompute, mirrored nowhere else):
--   active-now count = unconsumed rows whose window contains now()
--   profiles.storage_cap_bytes = active-now count x 75 GB
--   profiles.event_slots       = active-now count   (SQL event-limit override, added below)
--   profiles.tier_expires_at   = max(expires_at) over unconsumed rows (nudges/dashboard read it)
-- The DB never derives from this table itself — the webhook/sweeps recompute and write profiles,
-- exactly the storage_cap_bytes writer discipline. Replay-safety: inserts are idempotent on
-- stripe_session_id (stronger than the second-resolution event-time guard the old accumulating
-- extension needed).
--
-- Rolled-back contract check (run via MCP, nothing persists):
--   do $$ declare v_profile uuid; begin
--     select id into v_profile from public.profiles limit 1;
--     insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, stripe_session_id)
--       values (v_profile, now(), now() + interval '365 days', 2400, 'initial', 'cs_contract_check');
--     begin
--       insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, stripe_session_id)
--         values (v_profile, now(), now() + interval '365 days', 2400, 'initial', 'cs_contract_check');
--       raise exception 'DUP ACCEPTED';
--     exception when unique_violation then null; end;
--     raise exception 'ROLLBACK (contract check passed)';
--   end $$;

create table public.event_passes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- The entitlement window. start_at < expires_at always; a renewal row's window can begin in
  -- the future (it starts where the chain it extends ends).
  start_at timestamptz not null,
  expires_at timestamptz not null,
  -- What was ACTUALLY paid (Stripe session.amount_total), so promo-code purchases prorate off
  -- the real payment, not the sticker price.
  price_cents integer not null check (price_cents >= 0),
  source text not null check (source in ('initial', 'renewal', 'backfill')),
  -- Idempotency key: one Stripe Checkout session mints at most one pass row.
  stripe_session_id text,
  -- 'pro_credit' = this pass's unused value was converted to Stripe account credit when the host
  -- started Pro (ADR-0025; supersedes ADR-0023 1a's banked-term fallback). Expiry needs no mark:
  -- an expired pass is simply consumed_at IS NULL with expires_at in the past.
  consumed_at timestamptz,
  consumed_reason text check (consumed_reason in ('pro_credit')),
  created_at timestamptz not null default now(),
  check (expires_at > start_at),
  check ((consumed_at is null) = (consumed_reason is null))
);

-- Deny-all: the Stripe webhook + lifecycle sweeps (service role) are the only readers/writers.
-- Host-visible surfaces get pass facts through server components using the admin client after
-- their own auth gate, never through client-side table access.
alter table public.event_passes enable row level security;
revoke all on table public.event_passes from public, anon, authenticated;

create unique index event_passes_session_uidx
  on public.event_passes (stripe_session_id)
  where stripe_session_id is not null;
create index event_passes_profile_live_idx
  on public.event_passes (profile_id)
  where consumed_at is null;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- profiles.event_slots — the SQL-visible concurrent-pass count, following the storage_cap_bytes
-- pattern exactly: written only by the webhook/sweep recompute (service role), null = fall back
-- to tier_limits().max_events. NOT granted to authenticated (the column-lock doctrine: the table
-- grant is column-scoped, so an ungranted new column is client-read-only via RLS and never
-- client-writable).
-- ─────────────────────────────────────────────────────────────────────────────────────────────
alter table public.profiles add column event_slots integer;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- enforce_event_limit(): effective max = coalesce(event_slots, tier_limits.max_events).
-- Body otherwise verbatim from 20260729190000 (QA #17 lock order preserved; live md5 verified
-- before this replace).
-- ─────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_type;
  v_slots integer;
  v_max integer;
  v_count integer;
begin
  -- QA #17: serialize concurrent slot decisions for this host before counting.
  perform 1 from public.profiles where id = new.host_id for update;

  select tier, event_slots into v_tier, v_slots from public.profiles where id = new.host_id;
  select coalesce(v_slots, max_events) into v_max from public.tier_limits(v_tier);

  if v_max is not null then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and deleted_at is null;

    if v_count >= v_max then
      raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_event_limit() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- restore_event(): the same coalesce on its slot re-check. Body otherwise verbatim from
-- 20260729190000 (live md5 verified before this replace).
-- ─────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.restore_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_max integer;
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- QA #17: `for update` on the host's own profiles row (host_id = auth.uid() here, proven by the
  -- select above) serializes the slot count + capacity gate against concurrent restores/creates.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  -- event_slots (the stacked-pass count) overrides the static tier limit when present.
  v_max := coalesce(v_profile.event_slots, v_limits.max_events);
  if v_max is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_max then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_max);
    end if;
  end if;

  -- Capacity gate on the media that RE-ACTIVE when deleted_at clears (non-removed in this event).
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    select coalesce(sum(file_size_bytes), 0)::bigint into v_returning
      from public.media where event_id = p_event_id and status <> 'removed';
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_returning > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_returning) - v_cap);
    end if;
  end if;

  update public.events set deleted_at = null, purge_at = null
    where id = p_event_id and deleted_at is not null;

  select count(*) into v_still_removed from public.media
    where event_id = p_event_id and status = 'removed';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- Backfill: one ledger row per existing pass holder (window reconstructed as the trailing year).
-- A no-op on today's live DB (zero event_pass profiles, verified 2026-08-27) — kept so the file
-- replays correctly anywhere.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source)
select id, coalesce(tier_expires_at - interval '365 days', now()), tier_expires_at, 2400, 'backfill'
  from public.profiles
  where tier = 'event_pass' and tier_expires_at is not null;

update public.profiles set event_slots = 1 where tier = 'event_pass';
