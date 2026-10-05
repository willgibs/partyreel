-- =============================================================================================
-- BILLING INTEGRITY (lane `billing-integrity`; ROADMAP "Now": money and the meter tell one truth). The mechanism is
-- docs/systems/billing-caps.md's, the lock rules and grants docs/systems/database-security.md's. Four parts:
--
--   1. THE PASS-TO-PRO CREDIT, GRANTED ONCE EVER, CONVERTING ONLY WHAT IT CREDITED. The webhook granted the prorated
--      credit as Stripe customer balance under the idempotency key `pass-credit-<session>`, which Stripe honours for at
--      least 24 hours while a failing delivery retries for three days, so a conversion still failing a day on granted
--      the balance again; and its conversion consumed EVERY unconsumed pass, so a replay consumed a pass bought after
--      going Pro, with no credit for it. Now the credit is a claim of our own, `pass_credits`, keyed by the checkout
--      session and naming the passes its checkout credited (the session's metadata names them):
--        claim_pass_credit(session, host, credit, passes): taken before the grant and read on every retry. A claim
--          already granted answers so (no second grant, whenever the retry comes); one another delivery holds (its
--          lease, 10 minutes, longer than the webhook can run) answers busy, so the two TEST endpoints that both
--          receive every event never grant at once; one whose lease lapsed with no grant on record is taken over, and
--          the route looks on Stripe's side (the balance transaction carries the session in its metadata) before it
--          grants. ★ A pass is credited once ever: a claim whose passes were converted already, or are named by
--          another checkout's claim that granted or holds its lease, answers overlap and grants nothing (two Checkout
--          tabs each stamped a credit for the same passes, and each session's key differed).
--        record_pass_credit_grant(session, host, balance transaction): the grant, on record.
--        convert_pass_credit(session, host): consumes exactly the passes the claim names, never a later one, and
--          clears the chain fields (tier_expires_at, event_slots) only when it converted something, so a replay never
--          clears a pass bought since; her profiles row first, the one order (database-security.md).
--      consume_passes_for_pro_credit(uuid) stays for the build that still calls it (partyreel.com, until its next
--      milestone): a later migration drops it once no deployed build names it (ROADMAP).
--   2. THE PASS RECOMPUTE, ONE STATEMENT UNDER HER PROFILES LOCK. recomputePassEntitlement read the ledger and wrote
--      the profile in two requests, so a recompute racing a conversion put back the chain fields the conversion had
--      cleared (and the tier and room of passes it had just consumed) until the subscription event landed.
--      recompute_pass_entitlement(host, now) takes her profiles row first, derives the four pass-owned fields from her
--      unconsumed passes (the derivation's one home now; src/lib/billing/passes.ts held it) and writes them, so it
--      serializes with the conversion, the completes and the subscription webhook's single-statement write.
--   3. MAY THIS ACCOUNT STILL ADD, ONE HOME. The three upload advisories (get_upload_context, get_upload_gate,
--      get_host_upload_context) read a lapsed pass (her profile still a pass's, no window of hers live) as not full, so
--      her album's door opened and the presign refused. pass_lapsed(host, tier) is that predicate's one home and
--      uploads_refused(host, tier, cap, bytes) the uploads line's (her plan's own number over its window, or a lapsed
--      pass); the two completes, the presign's meter and the three advisories each ask it (the advisories of the
--      smallest file, one byte, which is "at the allowance"), and the operator's uploads_windows asks pass_lapsed, so
--      the door, the presign, the complete and /admin/accounts agree by construction. Each restated body is its newest
--      definition verbatim but for that one block (and the declarations it no longer needs): same signatures, return
--      types, language, volatility, security mode and empty search_path, so create or replace keeps every ACL, and the
--      grants are restated as they stand live.
--   4. What each new piece is, where an operator reads it.
--
-- ★ WHAT THE OLDER BUILD MEETS (partyreel.com shares this database; Stripe is in TEST and nothing holds real money): an
-- expand. Nothing it calls changes its signature, its answer's keys or its refusal's words or routing; its credited
-- checkout still runs consume_passes_for_pro_credit (every unconsumed pass) beside the new claim, whose overlap rule
-- refuses any pass that build converted first. One thing it cannot be protected from: a credit the new route granted
-- first (its balance transaction carrying metadata) meets that build's own grant under the same idempotency key with
-- different parameters, which Stripe refuses inside its key window, and that build re-grants once the key expires, its
-- own past-a-day bug this file fixes; TEST money only, until its next milestone. Apply this BEFORE the lane's build
-- deploys: the new route calls claim_pass_credit, record_pass_credit_grant, convert_pass_credit and
-- recompute_pass_entitlement by name, and PostgREST answers a call to a function it does not hold with PGRST202 (every
-- credited checkout and every pass purchase a 500 that Stripe retries).
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: every body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on 2026-10-05:
--   create_media            fab801fcc4ec47e30cd106fb4182ea52  (20261004120000_camera_clip)
--   create_media_as_host    60112e2b73dd40b4d97e1504734453b5  (20261004100000_ladder_a)
--   meter_upload            9d193450b8d017644f89fee0963b20bd  (20261005130000_billing_locks)
--   get_upload_context      efacd3e71988c0b75287e2a7458120e2  (20261004100000_ladder_a)
--   get_upload_gate         940a580ebb39e76c6c9fcdf98ca7178e  (20261004100000_ladder_a)
--   get_host_upload_context 9595099976250f04f29f456b5a4b3a5f  (20261004100000_ladder_a)
--   uploads_windows         adbf915999626ce4ff70fbed0cd7108b  (20261005130000_billing_locks)
-- and the table and the six new functions must be absent. Then the rolled-back proof at the foot of this file, RED
-- without this file's statements and GREEN with them; then apply verbatim; then get_advisors (rls_enabled_no_policy one
-- more, 26, for pass_credits, deny-all like event_passes; 0028 and 0029 unchanged: every new function is INVOKER and
-- none is a client role's); then regenerate src/lib/db/types.ts (the table and the six functions), which drops the
-- lane's typed seam (`creditDb` in src/lib/db/mutations/event-passes.ts).

-- =============================================================================================
-- 1. The pass-to-Pro credit: a claim of our own, granted once ever, converting only what it credited.
-- =============================================================================================
-- One row a credited Pro checkout. Deny-all (RLS on, no policy, no client grant): the webhook is its only writer, on
-- the service role, through the three functions below. Gone with her account (on delete cascade), as her passes are.
create table public.pass_credits (
  stripe_session_id text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  credit_cents integer not null check (credit_cents > 0),
  -- The passes the checkout credited, each once, in id order (the claim sorts them, so a replay compares equal).
  pass_ids uuid[] not null check (cardinality(pass_ids) > 0 and array_position(pass_ids, null) is null),
  -- The lease while a delivery grants: null once the grant is on record.
  claimed_until timestamptz,
  balance_transaction_id text,
  granted_at timestamptz,
  converted_at timestamptz,
  converted_count integer check (converted_count >= 0),
  created_at timestamptz not null default now(),
  constraint pass_credits_grant_whole check ((granted_at is null) = (balance_transaction_id is null)),
  constraint pass_credits_granted_unleased check (granted_at is null or claimed_until is null),
  constraint pass_credits_converted_after_grant check (converted_at is null or granted_at is not null)
);

create index pass_credits_profile_idx on public.pass_credits (profile_id);

alter table public.pass_credits enable row level security;

-- Taken before the grant, read on every retry. Answers one jsonb, its `state`:
--   'claimed'  this delivery holds the claim (`resumed` true when it took over a lease that lapsed with no grant on
--              record: the route looks on Stripe's side first, by the session in the balance transaction's metadata);
--   'granted'  the grant is on record (`balance_transaction_id`): never grant again, whenever the retry comes;
--   'busy'     another delivery holds a live lease (`retry_after_sec`): answer non-2xx, Stripe retries;
--   'overlap'  a pass it names was converted already, or is named by another checkout's claim that granted or holds its
--              lease: grant nothing, convert nothing (a pass is credited once ever);
--   'no_host'  no profile holds the host: nothing to credit.
-- A replay that disagrees with its claim (another host, credit or set of passes) and a pass that is not hers are
-- refused in words: our own server writes the session's metadata, so either is a bug, never a guess.
create function public.claim_pass_credit(
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
    if v_claim.granted_at is not null then
      return jsonb_build_object('state', 'granted', 'balance_transaction_id', v_claim.balance_transaction_id);
    end if;
    if v_claim.claimed_until > now() then
      return jsonb_build_object('state', 'busy',
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
  -- that granted or holds its lease.
  if exists (select 1 from public.event_passes q where q.id = any(v_ids) and q.consumed_at is not null)
     or exists (
       select 1 from public.pass_credits c
        where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids
          and (c.granted_at is not null or c.claimed_until > now())) then
    return jsonb_build_object('state', 'overlap');
  end if;

  if v_claim.stripe_session_id is not null then
    update public.pass_credits set claimed_until = now() + c_lease where stripe_session_id = p_session_id;
    return jsonb_build_object('state', 'claimed', 'resumed', true);
  end if;
  insert into public.pass_credits (stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until)
  values (p_session_id, p_host_id, p_credit_cents, v_ids, now() + c_lease);
  return jsonb_build_object('state', 'claimed', 'resumed', false);
end;
$$;

revoke all on function public.claim_pass_credit(text, uuid, integer, uuid[]) from public, anon, authenticated;
grant execute on function public.claim_pass_credit(text, uuid, integer, uuid[]) to service_role;

-- The grant on record, once: answers the balance transaction the claim holds, which is the one passed unless an
-- earlier one is already on record (the route warns then: two grants for one checkout, the operator's to settle).
create function public.record_pass_credit_grant(
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

-- The conversion, after the grant: exactly the passes the claim names, never one bought since. Answers how many this
-- call converted (0 on a replay).
create function public.convert_pass_credit(p_session_id text, p_host_id uuid)
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_claim public.pass_credits;
  v_converted integer;
begin
  if p_session_id is null or p_host_id is null then
    raise exception 'convert_pass_credit needs a session and a host.' using errcode = 'invalid_parameter_value';
  end if;

  -- ★ HER PROFILES ROW FIRST: an upload's complete holds it while it counts on her live pass, so the conversion waits
  -- for that upload and the next upload waits for the conversion and then finds the pass converted.
  perform 1 from public.profiles where id = p_host_id for update;
  select * into v_claim from public.pass_credits
   where stripe_session_id = p_session_id and profile_id = p_host_id for update;
  if not found then
    raise exception 'This checkout''s credit has no claim to convert.' using errcode = 'no_data_found';
  end if;
  if v_claim.granted_at is null then
    raise exception 'This checkout''s credit is not granted yet.' using errcode = 'object_not_in_prerequisite_state';
  end if;

  update public.event_passes
     set consumed_at = now(), consumed_reason = 'pro_credit'
   where profile_id = p_host_id and id = any(v_claim.pass_ids) and consumed_at is null;
  get diagnostics v_converted = row_count;

  -- The chain fields, in the same transaction, only when this call converted: a replay never clears the chain of a
  -- pass bought since. The tier and the room are the subscription events' (which null these two again).
  if v_converted > 0 then
    update public.profiles set tier_expires_at = null, event_slots = null where id = p_host_id;
  end if;

  update public.pass_credits
     set converted_at = coalesce(converted_at, now()), converted_count = coalesce(converted_count, 0) + v_converted
   where stripe_session_id = p_session_id;
  return v_converted;
end;
$$;

revoke all on function public.convert_pass_credit(text, uuid) from public, anon, authenticated;
grant execute on function public.convert_pass_credit(text, uuid) to service_role;

-- =============================================================================================
-- 2. The pass recompute: one statement under her profiles lock.
-- =============================================================================================
-- The four pass-owned fields from her unconsumed passes at an instant (the sweep's run, or now): a window is live while
-- start_at <= now < expires_at; each live window is a slot and one pass's room (tier_limits' event_pass room, mirrored
-- from tiers.ts); the chain ends at the latest expiry still ahead, an unopened renewal's year included; no live window
-- is Free with every field null. Never a Pro profile (the subscription webhook's), and a profile that is not there
-- changes nothing. Answers 'updated', 'unchanged' or 'skipped_pro'.
create function public.recompute_pass_entitlement(p_host_id uuid, p_now timestamptz default null)
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
-- 3. May this account still add: one home, asked by every body that judges an upload.
-- =============================================================================================
-- A pass the nightly recompute has not caught up with: her profile still a pass's, and no window of hers live, so the
-- count would land on no row. The service role's (uploads_windows, INVOKER, asks it) and every definer body's.
create function public.pass_lapsed(p_host_id uuid, p_tier public.tier_type)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_tier = 'event_pass' and not exists (
    select 1 from public.event_passes q
     where q.profile_id = p_host_id and q.consumed_at is null
       and q.start_at <= now() and q.expires_at > now());
$$;

revoke all on function public.pass_lapsed(uuid, public.tier_type) from public, anon, authenticated;
grant execute on function public.pass_lapsed(uuid, public.tier_type) to service_role;

-- The uploads line: would `p_bytes` more pass her plan's own number over its window (NULL = unmetered: a paid
-- profile with no cap on record fails open), or is her pass lapsed. The completes ask it with the HEAD's size, the
-- meter with the declared size, the advisories with one byte (at the allowance is full). Read only by those definer
-- bodies, so the owner's alone, like host_room_used.
create function public.uploads_refused(
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
           else public.uploads_used(p_host_id, p_tier) + p_bytes > a.allowance
         end
      or public.pass_lapsed(p_host_id, p_tier)
    from (select public.upload_allowance(p_tier, p_storage_cap_bytes) as allowance) a;
$$;

revoke all on function public.uploads_refused(uuid, public.tier_type, bigint, bigint)
  from public, anon, authenticated, service_role;

-- Each body below is its newest definition verbatim but for its uploads-line block (and the declarations that block
-- alone used): the two writers', the meter's and the three advisories' ask uploads_refused, and uploads_windows' lapsed
-- flag asks pass_lapsed. Grants restated as they stand live: the writers, the meter, the gate and the operator's read
-- the service role's, the guest's context the anon capability read it has always been (database-security.md), the
-- host's context the authenticated host's.
create or replace function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true,
  p_phone_key text default null,
  p_phone_bytes bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status;
  v_period text := to_char(now(), 'YYYY-MM');
  v_cap bigint;
  v_active bigint;
  v_deleted bigint;
  v_sealed_until timestamptz;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
  -- ★ THE CAMERA (20261002200000; its clip 20261004120000): its video's bounds and the ceiling's multiple, each
  -- mirroring its one home under a parity test (src/lib/media/limits.ts, src/lib/disposable/roll.ts). The roll's size is
  -- the event's. The video's two refusals below are formatted from these constants, so the check and its words are one
  -- literal (the grace is its own, so the mirror reads literally: seconds + grace).
  c_camera_video_bytes constant bigint := 384::bigint * 1024 * 1024; -- mirrors CAMERA_VIDEO_MAX_BYTES
  c_camera_video_seconds constant double precision := 30; -- mirrors CAMERA_VIDEO_SECONDS
  c_camera_video_grace constant double precision := 0.5; -- mirrors CAMERA_VIDEO_GRACE_SECONDS
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000), the belt under get_upload_context's mask: a presign issued
  -- before the block, completed after it, lands nothing. The private album's words, which
  -- mapCheckViolation (src/lib/db/mutations/guest.ts) reads ahead of every other refusal.
  if public.event_block_holds_row(v_guest) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE DOOR (20260929120000), the same belt: a ticket waiting on the host adds nothing, and nor does
  -- anyone at an album that went Only me.
  if v_guest.admission = 'waiting' or (v_event.visibility = 'private' and v_event.gate is null) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  if not v_event.accepting_uploads then
    raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
  end if;

  -- THE IDENTITY GATE (2026-09-21): the switch gates every upload, so flipping it ON mid-party
  -- stops the next upload from a guest who never proved an email. ★ The wording carries two
  -- contracts: it opens with "not accepting uploads", so a caller that knows only that substring
  -- still refuses the upload, and it names "verified email", which mapCheckViolation
  -- (src/lib/db/mutations/guest.ts) tests ABOVE its general "not accepting" branch to map it to
  -- verification_required. A Vitest guard (src/lib/db/migration-guards.test.ts) pins both halves.
  if v_event.require_verified_email and v_guest.verified_at is null then
    raise exception 'This event is not accepting uploads without a verified email.' using errcode = 'check_violation';
  end if;

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;
  -- QA #1: the preview key is a client-supplied R2 identifier stored verbatim and later fed to
  -- deleteR2Objects on permanent-delete. Bind it to the event exactly like original_key, or a
  -- host can plant a victim's key and destroy the victim's object from their own Trash.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- ★ THE PHONE-SIZE COPY (20261003110000, take-home): a photograph's 2048 px JPEG, made in the uploader's browser and
  -- PUT beside the preview. It is never metered (no ledger, no storage_used_bytes, no cap reads it), so it is held
  -- here three ways, each a fact the complete route already checked on the R2 HEAD sizes (`phoneCopyFits`): its key
  -- is THIS photograph's own (`phone.jpg` beside its original: any other key names an object this upload never
  -- minted, and the purge would delete it), it comes with its bytes or not at all, and it is at most 4 MiB and at
  -- most half the original (an uncapped copy beside a tiny original would be storage nobody pays for). One sentence
  -- for every refusal, routed to bad_key by both wrappers' "does not belong".
  if p_phone_key is not null or p_phone_bytes is not null then
    if p_phone_key is null or p_phone_bytes is null
       or p_type <> 'photo'
       or p_phone_key <> 'events/' || v_event.id::text || '/photo/' || p_media_id::text || '/phone.jpg'
       or p_phone_bytes <= 0
       or p_phone_bytes > c_max_phone_bytes
       or p_phone_bytes * 2 > p_file_size_bytes then
      raise exception 'Phone copy does not belong to this upload.' using errcode = 'check_violation';
    end if;
  end if;

  -- Universal per-upload ceiling (every tier, photo + video). Authoritative on the R2-HEAD size
  -- the complete route passes, never the client's claim (ADR-0014). The 'exceeds' wording routes
  -- to too_large in the mutation wrapper (and avoids 'limit'/'capacity', which mean cap_reached).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;
  -- Host-configurable per-event cap — GUESTS ONLY (create_media_as_host is exempt). NULL = no
  -- cap. Read from the event row, never client-supplied, so a guest cannot spoof a higher cap.
  if v_event.max_upload_bytes is not null
     and p_file_size_bytes > v_event.max_upload_bytes then
    raise exception 'File exceeds the size the host allows for this event.' using errcode = 'check_violation';
  end if;

  -- QA #17: `for update` serializes concurrent cap decisions for THIS host (the profiles row is
  -- the per-host mutex). Every read below it then sees the previous writer's committed rows.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  -- Video is a PAID feature (Phase 2): a free host's event takes photos only, whether
  -- the guest OR the host uploads.
  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;
  -- ★ THE VIDEOS SWITCH (20260929120000): a paid host can keep an album to photos. Guests only, like
  -- the per-upload cap: create_media_as_host is the host's own write and is exempt. The advisory is
  -- get_upload_context's `video_blocked`, worded around the event by the routes.
  if p_type = 'video' and not v_event.allow_videos then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- ★ THE CAMERA (20261002200000). A video is one shot of up to thirty seconds: its length is the client's word, so its
  -- bytes are bounded too ("exceeds" and "longer than" route to too_large and too_long). Then the roll (guest_roll):
  -- her LIVE shots this period against its size, and every shot she has taken in it, removed or not, against three
  -- rolls' worth (the churn a freed frame opens). Counted AFTER the host's profiles lock above (every create_media of
  -- this album takes it first, so two completes of one guest are already serialized and each count reads the other's
  -- committed row, never both at 23) and under the roll's own advisory lock on her identity (the brief's, kept so the
  -- roll's serialization stays its own should the profiles lock ever move; taken after it, by nothing else, so it
  -- closes no cycle). Their own words (mapCheckViolation reads "roll"). The host's own uploads (create_media_as_host)
  -- are exempt from all four.
  if v_event.capture = 'camera' then
    if p_type = 'video' and p_file_size_bytes > c_camera_video_bytes then
      raise exception using
        message = format('This video exceeds the %s MB a camera shot can be.', c_camera_video_bytes / (1024 * 1024)),
        errcode = 'check_violation';
    end if;
    if p_type = 'video' and p_duration_seconds > c_camera_video_seconds + c_camera_video_grace then
      raise exception using
        message = format('This video is longer than the %s seconds a camera shot can be.', c_camera_video_seconds),
        errcode = 'check_violation';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('roll:' || coalesce(v_guest.user_id, v_guest.id)::text, 0));
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
    if v_live >= v_event.roll_size then
      raise exception 'You''ve taken all % shots on your roll.', v_event.roll_size using errcode = 'check_violation';
    end if;
    if v_taken >= v_event.roll_size * c_roll_retakes then
      raise exception 'You''ve used every retake this roll allows.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ MAY THIS ACCOUNT STILL ADD (20261005181000): one question with one home (`uploads_refused`), which the
  -- presign's meter and the three upload advisories ask too, so the door, the presign and this complete agree. Her
  -- plan's own published number over its window, a calendar month or a pass's year (`upload_allowance`,
  -- `uploads_used`), never given back by a delete (NULL = unmetered: a paid profile with no cap on record fails open),
  -- and a pass the nightly recompute has not caught up with (`pass_lapsed`, the Advisor's Q26 F1: her profile still a
  -- pass's and no window of hers live, so the count below would land on no row). "limit" is the word both wrappers
  -- route to cap_reached.
  if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then
    raise exception 'Upload limit reached for this plan.' using errcode = 'check_violation';
  end if;

  -- ★ DELETED COUNTS (20261003220000, trash-in-storage): the cap and its 10% hold everything she keeps, her albums and
  -- her Deleted together (`host_storage_summary`, the one read every cap check makes). With her setting on and this
  -- file fitting beside what she keeps, the oldest of Deleted leaves for good first, as much as the file needs
  -- (`leave_deleted`: its bytes stop counting at once, and R2 follows in the night's purge); otherwise it is refused,
  -- and the refusal rolls back any eviction with it. Under the profiles lock above, so two completes never both free
  -- the same room.
  if v_cap is not null then
    select s.active_bytes, s.standby_bytes into v_active, v_deleted
      from public.host_storage_summary(v_event.host_id) s;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10)
       and v_profile.make_room_from_deleted
       and v_active + p_file_size_bytes <= v_cap + (v_cap / 10) then
      perform public.leave_deleted(v_event.host_id,
        v_active + v_deleted + p_file_size_bytes - (v_cap + (v_cap / 10)), true);
      select s.active_bytes, s.standby_bytes into v_active, v_deleted
        from public.host_storage_summary(v_event.host_id) s;
    end if;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  -- ★ THE SEAL (20261002200000): a row added while the album's develop time is still ahead waits for it, whatever the
  -- capture and whatever the status (a held row approved later waits too). Read off the event row as this upload
  -- found it, unlocked: a host's save committing in the same instant can leave this one row on the old answer, and the
  -- album's next read heals it (develop_due).
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut someone saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes
  );

  -- ★ THE ROLL'S LEDGER (20261002200000): every shot taken in a camera's period, kept when the shot is removed or
  -- purged, so the ceiling above outlives the fast purge of a withdrawn shot. Her ticket's row, under the same locks.
  if v_event.capture = 'camera' then
    insert into public.camera_rolls as c (guest_id, sealed_from, taken)
    values (v_guest.id, v_event.sealed_from, 1)
    on conflict (guest_id, sealed_from) do update set taken = c.taken + 1;
  end if;

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  -- ★ A PASS'S YEAR (20261004100000): a pass holder's upload also counts on her live pass that ends soonest, the count
  -- `uploads_used` reads for her, so her allowance runs over the year she paid for, never the calendar's. A renewal's
  -- year opens on its own row at zero, and a pass that ends takes its count with it. Under the profiles lock above.
  if v_profile.tier = 'event_pass' then
    update public.event_passes p set uploaded_bytes = p.uploaded_bytes + p_file_size_bytes
     where p.id = (select q.id from public.event_passes q
                    where q.profile_id = v_event.host_id and q.consumed_at is null
                      and q.start_at <= now() and q.expires_at > now()
                    order by q.expires_at, q.id
                    limit 1);
  end if;

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

create or replace function public.create_media_as_host(
  p_host_id uuid,
  p_event_id uuid,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true,
  p_phone_key text default null,
  p_phone_bytes bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status := 'approved'::public.media_status; -- host = moderator
  v_period text := to_char(now(), 'YYYY-MM');
  v_cap bigint;
  v_active bigint;
  v_deleted bigint;
  v_sealed_until timestamptz;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_max_phone_bytes constant bigint := 4::bigint * 1024 * 1024; -- 4 MiB (mirrors MAX_PHONE_BYTES, src/lib/media/preview-size.ts)
begin
  -- Ownership via the join: p_host_id is the route's getUser()-verified host id (the service-role caller
  -- has no auth.uid()). A host can only create media on an event they own; a wrong p_host_id -> not found.
  select * into v_event from public.events
    where id = p_event_id and host_id = p_host_id and deleted_at is null;
  if not found then
    raise exception 'Event not found or not owned by you.' using errcode = 'no_data_found';
  end if;

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;
  -- QA #1 (host path): same client-supplied preview key, same event binding.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- ★ THE PHONE-SIZE COPY (20261003110000, take-home): a photograph's 2048 px JPEG, made in the uploader's browser and
  -- PUT beside the preview. It is never metered (no ledger, no storage_used_bytes, no cap reads it), so it is held
  -- here three ways, each a fact the complete route already checked on the R2 HEAD sizes (`phoneCopyFits`): its key
  -- is THIS photograph's own (`phone.jpg` beside its original: any other key names an object this upload never
  -- minted, and the purge would delete it), it comes with its bytes or not at all, and it is at most 4 MiB and at
  -- most half the original (an uncapped copy beside a tiny original would be storage nobody pays for). One sentence
  -- for every refusal, routed to bad_key by both wrappers' "does not belong".
  if p_phone_key is not null or p_phone_bytes is not null then
    if p_phone_key is null or p_phone_bytes is null
       or p_type <> 'photo'
       or p_phone_key <> 'events/' || v_event.id::text || '/photo/' || p_media_id::text || '/phone.jpg'
       or p_phone_bytes <= 0
       or p_phone_bytes > c_max_phone_bytes
       or p_phone_bytes * 2 > p_file_size_bytes then
      raise exception 'Phone copy does not belong to this upload.' using errcode = 'check_violation';
    end if;
  end if;

  -- Universal per-upload ceiling. NO per-event host cap here -- the host owns max_upload_bytes
  -- and is exempt (it bounds guest uploads only).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;

  -- QA #17: the same per-host profiles-row lock as create_media (one mutex per host, one lock
  -- order everywhere).
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- ★ MAY THIS ACCOUNT STILL ADD (20261005181000): one question with one home (`uploads_refused`), which the
  -- presign's meter and the three upload advisories ask too, so the door, the presign and this complete agree. Her
  -- plan's own published number over its window, a calendar month or a pass's year (`upload_allowance`,
  -- `uploads_used`), never given back by a delete (NULL = unmetered: a paid profile with no cap on record fails open),
  -- and a pass the nightly recompute has not caught up with (`pass_lapsed`, the Advisor's Q26 F1: her profile still a
  -- pass's and no window of hers live, so the count below would land on no row). "limit" is the word both wrappers
  -- route to cap_reached.
  if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then
    raise exception 'Upload limit reached for this plan.' using errcode = 'check_violation';
  end if;

  -- ★ DELETED COUNTS (20261003220000, trash-in-storage): the cap and its 10% hold everything she keeps, her albums and
  -- her Deleted together (`host_storage_summary`, the one read every cap check makes). With her setting on and this
  -- file fitting beside what she keeps, the oldest of Deleted leaves for good first, as much as the file needs
  -- (`leave_deleted`: its bytes stop counting at once, and R2 follows in the night's purge); otherwise it is refused,
  -- and the refusal rolls back any eviction with it. Under the profiles lock above, so two completes never both free
  -- the same room.
  if v_cap is not null then
    select s.active_bytes, s.standby_bytes into v_active, v_deleted
      from public.host_storage_summary(v_event.host_id) s;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10)
       and v_profile.make_room_from_deleted
       and v_active + p_file_size_bytes <= v_cap + (v_cap / 10) then
      perform public.leave_deleted(v_event.host_id,
        v_active + v_deleted + p_file_size_bytes - (v_cap + (v_cap / 10)), true);
      select s.active_bytes, s.standby_bytes into v_active, v_deleted
        from public.host_storage_summary(v_event.host_id) s;
    end if;
    if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE SEAL (20261002200000): the host's own upload waits with everyone's for the album's develop time, so the
  -- album develops whole. Exempt from the roll, its ceiling and the camera video's bounds: it is her album.
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut the host saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes
  );

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  -- ★ A PASS'S YEAR (20261004100000): a pass holder's upload also counts on her live pass that ends soonest, the count
  -- `uploads_used` reads for her, so her allowance runs over the year she paid for, never the calendar's. A renewal's
  -- year opens on its own row at zero, and a pass that ends takes its count with it. Under the profiles lock above.
  if v_profile.tier = 'event_pass' then
    update public.event_passes p set uploaded_bytes = p.uploaded_bytes + p_file_size_bytes
     where p.id = (select q.id from public.event_passes q
                    where q.profile_id = v_event.host_id and q.consumed_at is null
                      and q.start_at <= now() and q.expires_at > now()
                    order by q.expires_at, q.id
                    limit 1);
  end if;

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint) to service_role;

create or replace function public.meter_upload(
  p_event_id uuid,
  p_type public.media_type,
  p_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host uuid;
  v_tier public.tier_type;
  v_storage_cap bigint;
  v_make_room boolean;
  v_used bigint;
  v_deleted bigint;
  v_ledger public.storage_ledger;
  v_period text := to_char(now(), 'YYYY-MM'); -- the month's key, as every reader and writer of the meter writes it
  v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');
  v_cap bigint;
  v_tallied integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  -- ★ THE HOURLY BREAKER: an account's uploads (her own and every guest's, into all her events) a clock hour. Far past
  -- any party: the 2,000-guest wedding averages about 2,000 an hour and might peak near 4,000, a venue holding three at
  -- once about 12,000; a script's tiny files stop here, and a real host never meets it (unpublished).
  c_uploads_an_hour constant integer := 20000;
begin
  if p_event_id is null or p_type is null or p_bytes is null or p_bytes < 1 or p_bytes > c_max_upload_bytes then
    raise exception 'meter_upload needs an event, a type and 1 to % bytes.', c_max_upload_bytes
      using errcode = 'invalid_parameter_value';
  end if;

  -- The event as the route's gates resolved it, and its host's plan: plain reads, no lock. An upload never locks the
  -- event row (a measured deadlock cycle, 20261002200000), and with no month to spend this needs no profiles lock.
  select e.host_id into v_host from public.events e where e.id = p_event_id and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'event_gone');
  end if;
  select p.tier, p.storage_cap_bytes, p.make_room_from_deleted into v_tier, v_storage_cap, v_make_room
    from public.profiles p where p.id = v_host;
  select * into v_ledger from public.storage_ledger where host_id = v_host and period = v_period;

  -- The breaker's early read: a runaway past it pays this one read, never the storage sum below.
  if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  -- The uploads line, advisory: the completes' own question (`uploads_refused`, 20261005181000), asked with this file's
  -- declared bytes before a byte moves: her plan's own number over its window (NULL = unmetered, failing open as
  -- there) and a pass the nightly recompute has not caught up with (`pass_lapsed`), so nothing is presigned, sent and
  -- stored in staging only to be refused at its complete. The reason keeps the wire's name, 'monthly', which the
  -- routes read, whatever the window. Plain reads, no lock.
  if public.uploads_refused(v_host, v_tier, v_storage_cap, p_bytes) then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;

  -- The room, advisory: the line an upload meets (`host_room_used`, 20261003220000: what she keeps, Deleted left out
  -- while her setting lets an upload make room from it) against the cap and its 10%, as create_media* will judge this
  -- file on its HEAD. A refusal carries what this file needs freed, what Deleted holds and whether Deleted could make the
  -- room, for the owner's own words (a guest's route names the album, never these). A Free profile's null cap is its
  -- plan's default (tier_limits), as every cap read takes it.
  v_cap := coalesce(v_storage_cap, (select l.default_storage_cap_bytes from public.tier_limits(v_tier) l));
  if v_cap is not null then
    v_used := public.host_room_used(v_host);
    if v_used + p_bytes > v_cap + (v_cap / 10) then
      select s.standby_bytes into v_deleted from public.host_storage_summary(v_host) s;
      return jsonb_build_object(
        'ok', false,
        'reason', 'storage',
        'needed_bytes', v_used + p_bytes - (v_cap + (v_cap / 10)),
        'deleted_bytes', v_deleted,
        'makes_room', coalesce(v_make_room, true)
      );
    end if;
  end if;

  -- The hour's tally, atomic on its own row: the upsert holds that row while it decides, and its WHERE refuses the
  -- 20,001st of an hour even when two presigns raced past the early read. A new hour starts the tally at one. The
  -- month's columns are never written here (a first presign of the month makes the row with their zero defaults).
  insert into public.storage_ledger as l (host_id, period, hour_started_at, hour_uploads)
  values (v_host, v_period, v_hour, 1)
  on conflict (host_id, period) do update set
    hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end,
    hour_started_at = excluded.hour_started_at
  where l.hour_started_at is distinct from excluded.hour_started_at or l.hour_uploads < c_uploads_an_hour
  returning l.hour_uploads into v_tallied;

  if v_tallied is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;
grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;

create or replace function public.get_upload_context(p_session_token text, p_type public.media_type)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    return null;
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object(
      'event_id', v_event.id,
      'accepting_uploads', false,
      'event_deleted', true
    );
  end if;

  -- ★ THE DOOR (20260929120000), AS THIS TICKET SEES IT: waiting reads private; past a gate or the
  -- password reads open; Only me (private, no gate) stays private. Only this local copy moves.
  if v_guest.admission = 'waiting' then
    v_event.visibility := 'private';
  elsif v_event.gate is not null or v_event.visibility = 'password' then
    v_event.visibility := 'open';
  end if;

  -- ★ THE SNEAKY BLOCK (20260928120000): a ticket this event blocked (its row, the account holding it,
  -- or the address it proved) reads the event as PRIVATE, so presign and complete refuse it exactly as
  -- they refuse a private album, in the same words ("This event is private."). Only the local copy is
  -- masked, never the row. Asked after the door, so it wins over every door.
  if public.event_block_holds_row(v_guest) then
    v_event.visibility := 'private';
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- ★ Past the uploads line? The completes' own question (`uploads_refused`, 20261005181000), asked of the smallest
  -- file, one byte: her plan's own number over its window (NULL = unmetered), or a pass the nightly recompute has not
  -- caught up with, which read as room here while the presign refused it. `at_monthly_cap` keeps the wire's name,
  -- which the routes read, whatever the window.
  v_at_monthly_cap := coalesce(
    public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- The line an upload meets (`host_room_used`, 20261003220000): what she keeps, Deleted left out while her setting
    -- lets an upload make room from it. Mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video, nor one whose host switched videos off (authoritative
  -- gate is in create_media). The per-upload ceiling is the host cap clamped to the universal 10 GiB
  -- (never remaining bytes). QA #18: `visibility` lets the guest routes re-check the lock per request.
  -- The identity reshape: `require_verified_email` + `guest_verified` let them re-check the identity
  -- gate the same way (create_media stays authoritative for both).
  -- ★ THE CAMERA (20261002200000): `capture`, and this ticket's own `roll` ({used, cap, taken, ceiling}; NULL for free
  -- uploads), so the presign refuses the shot past either bound before its bytes move (create_media stays
  -- authoritative). Her own counts, to her own token.
  if v_event.capture = 'camera' then
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
  end if;
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'require_verified_email', v_event.require_verified_email,
    'guest_verified', (v_guest.verified_at is not null),
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and (v_profile.tier = 'free' or not v_event.allow_videos)),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes)),
    'capture', v_event.capture,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
  );
end;
$$;

revoke all on function public.get_upload_context(text, public.media_type) from public, anon, authenticated;
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

create or replace function public.get_upload_gate(
  p_event_id uuid,
  p_session_token text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_cap bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_ticket uuid;
  v_live integer;
  v_taken integer;
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
begin
  select * into v_event from public.events where id = p_event_id and deleted_at is null;
  if not found then
    return jsonb_build_object('contributed', false, 'album_full', false, 'event_gone', true);
  end if;

  select exists (
    select 1
      from public.media m
      join public.guests g on g.id = m.guest_id
     where g.event_id = p_event_id
       and m.event_id = p_event_id
       and (
         (p_session_token is not null and length(p_session_token) >= 16
            and g.session_token = p_session_token and g.user_id is null)
         or (p_user_id is not null and g.user_id = p_user_id)
       )
       -- ★ OWN DELETES CLOSE IT (Will, 2026-09-22), the one change to this body. Pending, approved,
       -- hidden and a removal by anyone else all still count; only the guest's own removal does not.
       and not (m.status = 'removed' and m.removed_by_uploader)
  ) into v_contributed;

  if not v_contributed and v_event.accepting_uploads then
    select * into v_profile from public.profiles where id = v_event.host_id;
    select * into v_limits from public.tier_limits(v_profile.tier);

    -- ★ The uploads line, so the gate holds a guest exactly where the presign refuses: the completes' own question
    -- (`uploads_refused`, 20261005181000) asked of the smallest file, one byte, a lapsed pass included.
    v_at_monthly_cap := coalesce(
      public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      -- The line an upload meets (`host_room_used`, 20261003220000), so the gate fails open exactly when an upload
      -- would be refused: a guest is never held at a step she cannot pass.
      v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  -- ★ THE CAMERA (20261002200000): the viewer's roll, {used, cap, taken, ceiling}, by the same identities the
  -- contribution reads (the unclaimed ticket's row, the account's rows here). NULL for free uploads.
  if v_event.capture = 'camera' then
    if p_session_token is not null and length(p_session_token) >= 16 then
      select g.id into v_ticket
        from public.guests g
       where g.event_id = p_event_id and g.session_token = p_session_token and g.user_id is null;
    end if;
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_ticket, p_user_id) r;
  end if;

  return jsonb_build_object(
    'contributed', v_contributed,
    'album_full', (v_at_storage_cap or v_at_monthly_cap),
    'event_gone', false,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
  );
end;
$$;

revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;

create or replace function public.get_host_upload_context(p_event_id uuid, p_type public.media_type)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = auth.uid() and deleted_at is null;
  if not found then
    return null;
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- ★ The advisory asks create_media_as_host's own question (`uploads_refused`, 20261005181000) of the smallest file,
  -- one byte: her plan's own uploads number over its window (NULL = unmetered), or a pass the nightly recompute has not
  -- caught up with, which read as room here while the presign refused it.
  v_at_monthly_cap := coalesce(
    public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- The line an upload meets (`host_room_used`, 20261003220000), mirroring create_media_as_host.
    v_at_storage_cap := public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media_as_host).
  return jsonb_build_object(
    'event_id', v_event.id,
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free')
  );
end;
$$;

revoke all on function public.get_host_upload_context(uuid, public.media_type) from public, anon, authenticated;
grant execute on function public.get_host_upload_context(uuid, public.media_type) to authenticated;

create or replace function public.uploads_windows(
  p_host_ids uuid[],
  p_after_id uuid default null,
  p_limit integer default null
)
returns table (
  host_id uuid,
  tier public.tier_type,
  storage_cap_bytes bigint,
  used_bytes bigint,
  pass_lapsed boolean,
  pass_lapsed_at timestamptz,
  pass_converted boolean
)
language sql
stable
set search_path = ''
as $$
  select
    p.id,
    p.tier,
    p.storage_cap_bytes,
    public.uploads_used(p.id, p.tier),
    w.lapsed,
    e.ended_at,
    coalesce(e.converted, false)
  from public.profiles p
  -- Lapsed: the completes' own question (`pass_lapsed`, 20261005181000), one home.
  cross join lateral (select public.pass_lapsed(p.id, p.tier) as lapsed) w
  -- The pass whose live end is the latest, read only for a lapsed row: a pass that was ever live (its window opened
  -- before it ended), its end its expiry or its conversion when that came first.
  left join lateral (
    select least(q.expires_at, coalesce(q.consumed_at, q.expires_at)) as ended_at,
           (q.consumed_at is not null and q.consumed_at < q.expires_at) as converted
      from public.event_passes q
     where w.lapsed
       and q.profile_id = p.id
       and q.start_at <= now()
       and q.start_at < least(q.expires_at, coalesce(q.consumed_at, q.expires_at))
     order by 1 desc, 2 desc
     limit 1
  ) e on true
  where p.id = any(p_host_ids)
    and (p_after_id is null or p.id > p_after_id)
  order by p.id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.uploads_windows(uuid[], uuid, integer) from public, anon, authenticated;
grant execute on function public.uploads_windows(uuid[], uuid, integer) to service_role;

-- =============================================================================================
-- 4. What each new piece is, where an operator reads it.
-- =============================================================================================
comment on table public.pass_credits is
  'The pass-to-Pro credit of each credited Pro checkout (the Stripe webhook, service role only): the session, the host, the credit and the passes its checkout credited; the lease while a delivery grants it; the customer-balance transaction once granted (granted once ever: a retry reads this before it grants, and a claim lost mid-call is found on Stripe''s side by the session in that transaction''s metadata); and when its passes were converted. A pass is credited once ever. Deny-all; gone with the account.';

comment on function public.claim_pass_credit(text, uuid, integer, uuid[]) is
  'The pass-to-Pro credit''s claim, taken before the grant and read on every retry (the Stripe webhook, service role only): her profiles row first; answers claimed (resumed when it took over a lapsed lease: look on Stripe''s side first), granted, busy (another delivery holds the lease), overlap (a pass it names was converted, or is named by another checkout''s granted or leased claim: grant nothing) or no_host.';

comment on function public.record_pass_credit_grant(text, uuid, text) is
  'Puts a pass-to-Pro credit''s customer-balance transaction on record, once (service role only); answers the transaction on record, an earlier one when there is one.';

comment on function public.convert_pass_credit(text, uuid) is
  'The pass-to-Pro credit''s conversion, after its grant (service role only): her profiles row first, then exactly the passes the claim names marked consumed (pro_credit), never a pass bought since, and the chain fields cleared when it converted any. Answers how many it converted; 0 on a replay.';

comment on function public.recompute_pass_entitlement(uuid, timestamptz) is
  'Re-derives a non-Pro profile''s four pass-owned fields (tier, storage_cap_bytes, event_slots, tier_expires_at) from her unconsumed passes at an instant, under her profiles row lock (the Stripe webhook and the nightly expired_passes sweep, service role only). Answers updated, unchanged or skipped_pro.';

comment on function public.pass_lapsed(uuid, public.tier_type) is
  'Whether a host is a pass holder with no live pass (the nightly recompute has not moved her plan yet): every upload refused until it does. The one home of that question: uploads_refused and uploads_windows ask it.';

comment on function public.uploads_refused(uuid, public.tier_type, bigint, bigint) is
  'The uploads line, one home: would these bytes pass her plan''s own number over its window, or is her pass lapsed. The two completes, the presign''s meter and the three upload advisories ask it, so the door, the presign and the complete agree. The owner''s alone.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own accounts (auth users, so
-- handle_new_user makes their profiles), an album and a guest ticket needing no address, and sets each step's plan,
-- ledger, passes and claims straight in; every upload goes through the real create_media*, every read through the real
-- meter, advisories and operator's read, and the credit's and the recompute's INVOKER bodies run as the service role
-- (`set local role`, as their caller runs them). Each step traps its own failure into the temp `proof` table; the final
-- select is the answer. The RED run is the same call without this file's statements: everything this file adds is
-- reached only through dynamic SQL, so it fails on what it lacks, never on a parse.
--
-- RESULT, 2026-10-05 against the live schema (the drift read above clean first: the seven bodies at their hashes, the
-- table and the six functions absent):
--   RED  0/9: 1-3 and 7 no pass_credits; 4 no recompute_pass_entitlement; 5 THE HOLE ITSELF: on a lapsed pass the three
--        advisories answered "context false, gate false, host false" while the meter refused 'monthly' and both writers
--        "23514 Upload limit reached for this plan.", and the credited one the same; 5b anon's context and the service
--        role's gate read room while its meter and writer refused; 6 no pass_lapsed; 8 the seven bodies at their old
--        hashes, the six new ones absent.
--   GREEN 9/9 on this file (its function bodies verbatim, top-level comments aside), nothing persisted after (no fixture
--        user, profile or event; pass_credits and uploads_refused absent; create_media and get_upload_context at their
--        old hashes).
-- THE PRE-FLIGHT (database-security.md), a throwaway Postgres 17 cluster holding a stand-in of the touched tables (their
-- live column types, defaults and the constraints the bodies lean on), the Supabase roles, the live default privileges,
-- an auth.uid() stub and the current bodies: the file applies verbatim; pg_get_functiondef's diff of the seven restated
-- bodies is exactly their uploads-line blocks and the declarations those alone used; their ACLs are unchanged; the
-- contract check RED 0/9 without the file and GREEN 9/9 with it. Its two-session lock runs: the OLD recompute's two
-- requests with a conversion between them put the chain back (two slots and an expiry over no unconsumed pass); the new
-- recompute holding her row, the conversion waits 1.5 s and then clears the chain; the conversion holding it, the
-- recompute waits and derives from what is left; a complete holding it, the conversion waits and converts after the
-- count; the conversion holding it, a complete waits and is refused in the allowance's words; a claim beside a complete,
-- and the recompute beside a complete in both orders, serialize: no deadlock in any run (the server log holds none).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.gb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024 * 1024)::bigint $f$;
--
-- -- A host on a plan: no media, no ledger, no passes, no credit claims; the tier, the cap and the chain as asked.
-- create function pg_temp.reset(p_host text, p_tier text, p_cap bigint, p_expires timestamptz default null,
--                               p_slots integer default null) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host);
-- begin
--   delete from public.media where event_id in (select id from public.events where host_id = h);
--   delete from public.storage_ledger where host_id = h;
--   if to_regclass('public.pass_credits') is not null then
--     execute 'delete from public.pass_credits where profile_id = $1' using h;
--   end if;
--   delete from public.event_passes where profile_id = h;
--   update public.profiles set tier = p_tier::public.tier_type, storage_cap_bytes = p_cap, storage_used_bytes = 0,
--          tier_expires_at = p_expires, event_slots = p_slots
--    where id = h;
-- end $f$;
--
-- -- A pass row: its window by offsets from now, its count, consumed (that long ago) when asked.
-- create function pg_temp.pass(p_host text, p_from interval, p_to interval, p_uploaded bigint default 0,
--                              p_consumed_ago interval default null) returns uuid language plpgsql as $f$
-- declare pid uuid;
-- begin
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, uploaded_bytes,
--                                    consumed_at, consumed_reason)
--   values (pg_temp.fx(p_host), now() + p_from, now() + p_to, 2900, 'initial', p_uploaded,
--           now() - p_consumed_ago, case when p_consumed_ago is not null then 'pro_credit' end)
--   returning id into pid;
--   return pid;
-- end $f$;
--
-- -- The credit's three calls and the recompute, as the webhook makes them: as the service role, whose privileges an
-- -- INVOKER body runs with; dynamic, so the red run (no such function) fails here and not at a parse. An error comes back
-- -- as {"error": "<sqlstate> <message>"}.
-- create function pg_temp.svc(p_sql text, p_a anyelement, p_b uuid default null, p_c integer default null,
--                             p_d uuid[] default null) returns jsonb language plpgsql as $f$
-- declare got jsonb;
-- begin
--   set local role service_role;
--   execute p_sql into got using p_a, p_b, p_c, p_d;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
-- create function pg_temp.claim(p_session text, p_host uuid, p_credit integer, p_ids uuid[]) returns jsonb
-- language sql as $f$
--   select pg_temp.svc('select public.claim_pass_credit($1, $2, $3, $4)', p_session, p_host, p_credit, p_ids)
-- $f$;
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
--
-- -- The presign's meter for the album (its host is 'lapsed'), an upload through the real writers, and the three
-- -- advisories as their callers ask them: the guest's context by her ticket, the gate for a viewer who has added nothing,
-- -- the host's context as the signed-in host.
-- create function pg_temp.meter(p_bytes bigint) returns text language plpgsql as $f$
-- begin
--   return coalesce(public.meter_upload(p_event_id => pg_temp.fx('album'), p_type => 'photo', p_bytes => p_bytes)->>'reason', 'ok');
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.put(p_bytes bigint, p_as text default 'host') returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := pg_temp.fx('album');
-- begin
--   if p_as = 'host' then
--     perform public.create_media_as_host(p_host_id => pg_temp.fx('lapsed'), p_event_id => e, p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   else
--     perform public.create_media(p_session_token => (select txt from fx where k = 'ticket'), p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   end if;
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
-- create function pg_temp.doors() returns text language plpgsql as $f$
-- declare c text; g text; h text; album uuid := pg_temp.fx('album'); host uuid := pg_temp.fx('lapsed');
-- begin
--   c := public.get_upload_context((select txt from fx where k = 'ticket'), 'photo')->>'at_monthly_cap';
--   g := public.get_upload_gate(album, null, null)->>'album_full';
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   h := public.get_host_upload_context(album, 'photo')->>'at_monthly_cap';
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return format('context %s, gate %s, host %s', c, g, h);
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
-- -- uploads_refused and pass_lapsed as the owner reads them (dynamic, as above).
-- create function pg_temp.line(p_host text, p_bytes bigint) returns text language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host); r boolean; l boolean;
-- begin
--   execute 'select public.uploads_refused(p.id, p.tier, p.storage_cap_bytes, $2), public.pass_lapsed(p.id, p.tier)
--              from public.profiles p where p.id = $1' into r, l using h, p_bytes;
--   return format('refused %s lapsed %s', r::text, l::text);
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The fixtures: five hosts (an auth user each where the schema has auth.users, so handle_new_user makes the profile;
-- -- the profile itself otherwise), the lapsed host's album and one guest ticket on it that needs no address.
-- do $$
-- declare k text; h uuid; a uuid; gid uuid; t text := 'billing-integrity-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   foreach k in array array['credit', 'stack', 'lapsed', 'pro', 'stranger'] loop
--     h := gen_random_uuid();
--     if to_regclass('auth.users') is not null then
--       execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--         using h, 'billing-integrity-' || h || '@example.com';
--     end if;
--     insert into public.profiles (id, email, display_name) values (h, 'billing-integrity-' || h || '@example.com', 'Bill ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, h, null);
--   end loop;
--   insert into public.events (host_id, name, require_verified_email)
--     values (pg_temp.fx('lapsed'), 'Billing integrity: the album', false) returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest') returning id into gid;
--   insert into fx values ('album', a, null), ('guest', gid, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, format('lapsed host %s, album %s', pg_temp.fx('lapsed'), a));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. The claim: a first claim takes the lease over the named set, each once in id order; a second delivery while it
-- -- holds is busy; a lapsed lease with no grant is taken over (resumed); the grant goes on record once (a second
-- -- transaction answers the first); a granted claim answers granted; a replay that disagrees, a pass that is not hers and
-- -- a missing argument are refused in words; a host that is not there has nothing to credit.
-- do $$
-- declare a uuid; b uuid; r uuid; e uuid; x uuid; c1 jsonb; c2 jsonb; c3 jsonb; c4 jsonb; c5 jsonb; bad jsonb; nohost jsonb;
--   notours jsonb; r1 text; r2 text; stored uuid[]; row_ok boolean; fail text := '';
-- begin
--   perform pg_temp.reset('credit', 'event_pass', pg_temp.gb(75), now() + interval '630 days', 2);
--   perform pg_temp.reset('stranger', 'event_pass', pg_temp.gb(25));
--   a := pg_temp.pass('credit', -interval '10 days', interval '355 days');
--   b := pg_temp.pass('credit', -interval '100 days', interval '265 days');
--   r := pg_temp.pass('credit', interval '265 days', interval '630 days');
--   e := pg_temp.pass('credit', -interval '400 days', -interval '35 days');
--   x := pg_temp.pass('stranger', -interval '10 days', interval '355 days');
--   insert into fx values ('pass_a', a, null), ('pass_b', b, null), ('pass_r', r, null), ('pass_e', e, null), ('pass_x', x, null);
--   c1 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 1850, array[b, a, r, e, a]);
--   execute 'select pass_ids from public.pass_credits where stripe_session_id = $1' into stored using 'cs_bi_1';
--   c2 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 1850, array[a, b, r, e]);
--   execute 'update public.pass_credits set claimed_until = now() - interval ''1 second'' where stripe_session_id = $1'
--     using 'cs_bi_1';
--   c3 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 1850, array[e, r, b, a]);
--   c4 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 999, array[a, b, r, e]);
--   r1 := pg_temp.record('cs_bi_1', pg_temp.fx('credit'), 'cbtxn_bi_1');
--   r2 := pg_temp.record('cs_bi_1', pg_temp.fx('credit'), 'cbtxn_bi_2');
--   c5 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 1850, array[a, b, r, e]);
--   execute 'select credit_cents = 1850 and granted_at is not null and claimed_until is null
--              and balance_transaction_id = ''cbtxn_bi_1'' and converted_at is null
--              from public.pass_credits where stripe_session_id = $1' into row_ok using 'cs_bi_1';
--   bad := pg_temp.claim(null, pg_temp.fx('credit'), 1850, array[a]);
--   nohost := pg_temp.claim('cs_bi_nohost', gen_random_uuid(), 100, array[a]);
--   notours := pg_temp.claim('cs_bi_notours', pg_temp.fx('credit'), 100, array[x]);
--   if c1->>'state' is distinct from 'claimed' or (c1->>'resumed')::boolean is distinct from false then fail := fail || ' first ' || c1; end if;
--   if stored is distinct from (select array_agg(i order by i) from unnest(array[a, b, r, e]) i) then fail := fail || ' set ' || stored::text; end if;
--   if c2->>'state' is distinct from 'busy' or (c2->>'retry_after_sec')::integer not between 1 and 600 then fail := fail || ' busy ' || c2; end if;
--   if c3->>'state' is distinct from 'claimed' or (c3->>'resumed')::boolean is distinct from true then fail := fail || ' resumed ' || c3; end if;
--   if c4->>'error' not like '23514 %disagrees%' then fail := fail || ' disagree ' || c4; end if;
--   if r1 is distinct from 'cbtxn_bi_1' or r2 is distinct from 'cbtxn_bi_1' then fail := fail || format(' record %s/%s', r1, r2); end if;
--   if c5->>'state' is distinct from 'granted' or c5->>'balance_transaction_id' is distinct from 'cbtxn_bi_1' then fail := fail || ' granted ' || c5; end if;
--   if row_ok is distinct from true then fail := fail || ' row'; end if;
--   if bad->>'error' not like '22023 %' then fail := fail || ' bad ' || bad; end if;
--   if nohost->>'state' is distinct from 'no_host' then fail := fail || ' nohost ' || nohost; end if;
--   if notours->>'error' not like '23514 %not this account%' then fail := fail || ' notours ' || notours; end if;
--   insert into proof (step, ok, detail) values ('1 claim', fail = '',
--     coalesce(nullif(fail, ''), 'claimed, busy, resumed, recorded once, granted; disagreeing, foreign, empty refused; no host'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 claim', false, sqlerrm);
-- end $$;
--
-- -- 2. The conversion: exactly the named passes (two live, an unopened renewal, an expired one) marked pro_credit, the
-- -- chain cleared, the tier and the room left to the subscription events; a pass bought after it is never converted by a
-- -- replay, nor its chain cleared; a claim not granted yet and a checkout with no claim are refused in words.
-- do $$
-- declare l uuid; n1 text; n2 text; n3 text; n4 text; c6 jsonb; c7 jsonb; marked integer; pr record; pr2 record;
--   l_left boolean; counted integer; fail text := '';
-- begin
--   n1 := pg_temp.convert('cs_bi_1', pg_temp.fx('credit'));
--   select count(*) into marked from public.event_passes
--    where profile_id = pg_temp.fx('credit') and consumed_reason = 'pro_credit' and consumed_at = now();
--   select tier, storage_cap_bytes, tier_expires_at, event_slots into pr from public.profiles where id = pg_temp.fx('credit');
--   execute 'select converted_count from public.pass_credits where stripe_session_id = $1' into counted using 'cs_bi_1';
--   -- A pass bought a day after going Pro (the stale tab), and the recompute that wrote its chain.
--   l := pg_temp.pass('credit', interval '0 seconds', interval '365 days');
--   insert into fx values ('pass_l', l, null);
--   update public.profiles set event_slots = 1, tier_expires_at = now() + interval '365 days' where id = pg_temp.fx('credit');
--   n2 := pg_temp.convert('cs_bi_1', pg_temp.fx('credit'));
--   c6 := pg_temp.claim('cs_bi_1', pg_temp.fx('credit'), 1850,
--           array[pg_temp.fx('pass_a'), pg_temp.fx('pass_b'), pg_temp.fx('pass_r'), pg_temp.fx('pass_e')]);
--   select consumed_at is null into l_left from public.event_passes where id = l;
--   select event_slots, tier_expires_at into pr2 from public.profiles where id = pg_temp.fx('credit');
--   c7 := pg_temp.claim('cs_bi_2', pg_temp.fx('credit'), 500, array[l]);
--   n3 := pg_temp.convert('cs_bi_2', pg_temp.fx('credit'));
--   n4 := pg_temp.convert('cs_bi_none', pg_temp.fx('credit'));
--   if n1 is distinct from '4' or marked <> 4 then fail := fail || format(' first %s marked %s;', n1, marked); end if;
--   if pr.tier <> 'event_pass' or pr.storage_cap_bytes <> pg_temp.gb(75) then fail := fail || ' tier or room written;'; end if;
--   if pr.tier_expires_at is not null or pr.event_slots is not null then fail := fail || ' chain kept;'; end if;
--   if counted is distinct from 4 then fail := fail || ' counted ' || counted; end if;
--   if n2 is distinct from '0' then fail := fail || ' replay ' || n2; end if;
--   if c6->>'state' is distinct from 'granted' then fail := fail || ' replay claim ' || c6; end if;
--   if l_left is distinct from true then fail := fail || ' the later pass converted;'; end if;
--   if pr2.event_slots is distinct from 1 or pr2.tier_expires_at is null then fail := fail || ' the later pass''s chain cleared;'; end if;
--   if c7->>'state' is distinct from 'claimed' then fail := fail || ' a new checkout of the later pass ' || c7; end if;
--   if n3 not like 'error 55000 %' then fail := fail || ' before grant ' || n3; end if;
--   if n4 not like 'error P0002 %' then fail := fail || ' no claim ' || n4; end if;
--   insert into proof (step, ok, detail) values ('2 convert', fail = '',
--     coalesce(nullif(fail, ''), format('converted %s, replay %s, the later pass kept with its chain; ungranted and unclaimed refused', n1, n2)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 convert', false, sqlerrm);
-- end $$;
--
-- -- 3. A pass is credited once ever: a checkout naming a converted pass, or a pass another checkout's claim holds or
-- -- granted, answers overlap and records nothing; a lapsed, ungranted claim blocks no one, and taking it over meets the
-- -- claim that went ahead.
-- do $$
-- declare l uuid := pg_temp.fx('pass_l'); o1 jsonb; o2 jsonb; o3 jsonb; o4 jsonb; o5 jsonb; rows3 integer; r4 text; fail text := '';
-- begin
--   o1 := pg_temp.claim('cs_bi_3', pg_temp.fx('credit'), 900, array[pg_temp.fx('pass_a')]);
--   execute 'select count(*) from public.pass_credits where stripe_session_id = $1' into rows3 using 'cs_bi_3';
--   o2 := pg_temp.claim('cs_bi_4', pg_temp.fx('credit'), 300, array[l]);
--   execute 'update public.pass_credits set claimed_until = now() - interval ''1 second'' where stripe_session_id = $1'
--     using 'cs_bi_2';
--   o3 := pg_temp.claim('cs_bi_4', pg_temp.fx('credit'), 300, array[l]);
--   o4 := pg_temp.claim('cs_bi_2', pg_temp.fx('credit'), 500, array[l]);
--   r4 := pg_temp.record('cs_bi_4', pg_temp.fx('credit'), 'cbtxn_bi_4');
--   o5 := pg_temp.claim('cs_bi_2', pg_temp.fx('credit'), 500, array[l]);
--   if o1->>'state' is distinct from 'overlap' or rows3 <> 0 then fail := fail || format(' converted %s rows %s;', o1, rows3); end if;
--   if o2->>'state' is distinct from 'overlap' then fail := fail || ' leased ' || o2; end if;
--   if o3->>'state' is distinct from 'claimed' then fail := fail || ' past a lapsed claim ' || o3; end if;
--   if o4->>'state' is distinct from 'overlap' then fail := fail || ' taking over meets a live lease ' || o4; end if;
--   if r4 is distinct from 'cbtxn_bi_4' then fail := fail || ' record ' || r4; end if;
--   if o5->>'state' is distinct from 'overlap' then fail := fail || ' taking over meets a grant ' || o5; end if;
--   insert into proof (step, ok, detail) values ('3 once ever', fail = '',
--     coalesce(nullif(fail, ''), 'converted, leased and granted passes refused; a lapsed claim blocks nobody'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 once ever', false, sqlerrm);
-- end $$;
--
-- -- 4. The recompute: a stack with an unopened renewal is two slots and two passes' room, its chain the renewal's end; a
-- -- second run changes nothing; a pass converted drops a slot; an instant past every window is Free with every field
-- -- null; a Pro profile is never touched; a host that is not there changes nothing; a missing host or an infinite instant
-- -- is refused in words.
-- do $$
-- declare s1 uuid; s2 uuid; s3 uuid; rc1 text; rc2 text; rc3 text; rc4 text; rc5 text; rc6 text; rc7 text; rc8 text;
--   p1 record; p3 record; p4 record; p5 record; s3_end timestamptz; fail text := '';
-- begin
--   perform pg_temp.reset('stack', 'free', null);
--   s1 := pg_temp.pass('stack', -interval '10 days', interval '355 days');
--   s2 := pg_temp.pass('stack', -interval '65 days', interval '300 days');
--   s3 := pg_temp.pass('stack', interval '300 days', interval '665 days');
--   select expires_at into s3_end from public.event_passes where id = s3;
--   rc1 := pg_temp.recompute(pg_temp.fx('stack'));
--   select tier, storage_cap_bytes, event_slots, tier_expires_at into p1 from public.profiles where id = pg_temp.fx('stack');
--   rc2 := pg_temp.recompute(pg_temp.fx('stack'));
--   update public.event_passes set consumed_at = now(), consumed_reason = 'pro_credit' where id = s2;
--   rc3 := pg_temp.recompute(pg_temp.fx('stack'));
--   select tier, storage_cap_bytes, event_slots, tier_expires_at into p3 from public.profiles where id = pg_temp.fx('stack');
--   rc4 := pg_temp.recompute(pg_temp.fx('stack'), now() + interval '700 days');
--   select tier, storage_cap_bytes, event_slots, tier_expires_at into p4 from public.profiles where id = pg_temp.fx('stack');
--   perform pg_temp.reset('pro', 'pro', pg_temp.gb(200), now() + interval '5 days', 3);
--   perform pg_temp.pass('pro', -interval '10 days', interval '355 days');
--   rc5 := pg_temp.recompute(pg_temp.fx('pro'));
--   select tier, storage_cap_bytes, event_slots, tier_expires_at into p5 from public.profiles where id = pg_temp.fx('pro');
--   rc6 := pg_temp.recompute(gen_random_uuid());
--   rc7 := pg_temp.recompute(null);
--   rc8 := pg_temp.recompute(pg_temp.fx('stack'), 'infinity');
--   if rc1 is distinct from 'updated' or p1.tier <> 'event_pass' or p1.storage_cap_bytes <> pg_temp.gb(50)
--      or p1.event_slots <> 2 or p1.tier_expires_at is distinct from s3_end then
--     fail := fail || format(' stack %s %s/%s/%s/%s;', rc1, p1.tier, p1.storage_cap_bytes, p1.event_slots, p1.tier_expires_at);
--   end if;
--   if rc2 is distinct from 'unchanged' then fail := fail || ' second ' || rc2; end if;
--   if rc3 is distinct from 'updated' or p3.storage_cap_bytes <> pg_temp.gb(25) or p3.event_slots <> 1
--      or p3.tier_expires_at is distinct from s3_end then fail := fail || ' converted one ' || rc3; end if;
--   if rc4 is distinct from 'updated' or p4.tier <> 'free' or p4.storage_cap_bytes is not null or p4.event_slots is not null
--      or p4.tier_expires_at is not null then fail := fail || ' past every window ' || rc4; end if;
--   if rc5 is distinct from 'skipped_pro' or p5.storage_cap_bytes <> pg_temp.gb(200) or p5.event_slots <> 3 then
--     fail := fail || ' pro ' || rc5;
--   end if;
--   if rc6 is distinct from 'unchanged' then fail := fail || ' nobody ' || rc6; end if;
--   if rc7 not like 'error 22023 %' or rc8 not like 'error 22023 %' then fail := fail || format(' refusals %s / %s', rc7, rc8); end if;
--   insert into proof (step, ok, detail) values ('4 recompute', fail = '',
--     coalesce(nullif(fail, ''), 'a stack, its renewal''s chain, unchanged twice, a slot dropped, Free past the windows; Pro and nobody untouched'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 recompute', false, sqlerrm);
-- end $$;
--
-- -- 5. The uploads line, one home: a live pass with room is admitted at every door, by the meter and by both writers; a
-- -- lapsed pass, a pass converted to Pro credit before Pro landed, and a pass at its allowance read full at all three
-- -- advisories, the meter refuses them in the allowance's words and both writers refuse them; a byte under the allowance
-- -- admits one more byte and not two; Free reads its month; a Pro profile with no cap on record is unmetered.
-- do $$
-- declare live_doors text; live_meter text; live_h text; live_g text; lapsed_line text; lapsed_doors text; lapsed_meter text;
--   lapsed_h text; lapsed_g text; credited_doors text; credited_meter text; at_doors text; at_meter text; at_put text;
--   under_doors text; under_meter1 text; under_meter2 text; under_put text; after_doors text; free_at text; free_under text;
--   pro_line text; full_doors text := 'context true, gate true, host true'; open_doors text := 'context false, gate false, host false';
--   refused text := '23514 Upload limit reached for this plan.'; fail text := '';
-- begin
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days');
--   live_doors := pg_temp.doors();
--   live_meter := pg_temp.meter(1000);
--   live_h := pg_temp.put(1000, 'host');
--   live_g := pg_temp.put(1000, 'guest');
--
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '400 days', -interval '1 day', pg_temp.gb(1));
--   lapsed_line := pg_temp.line('lapsed', 1);
--   lapsed_doors := pg_temp.doors();
--   lapsed_meter := pg_temp.meter(1000);
--   lapsed_h := pg_temp.put(1000, 'host');
--   lapsed_g := pg_temp.put(1000, 'guest');
--
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days', 0, interval '1 minute');
--   credited_doors := pg_temp.doors();
--   credited_meter := pg_temp.meter(1000);
--
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days', pg_temp.gb(50));
--   at_doors := pg_temp.doors();
--   at_meter := pg_temp.meter(1);
--   at_put := pg_temp.put(1, 'host');
--
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days', pg_temp.gb(50) - 1);
--   under_doors := pg_temp.doors();
--   under_meter1 := pg_temp.meter(1);
--   under_meter2 := pg_temp.meter(2);
--   under_put := pg_temp.put(1, 'host');
--   after_doors := pg_temp.doors();
--
--   perform pg_temp.reset('lapsed', 'free', null);
--   insert into public.storage_ledger (host_id, period, cumulative_bytes)
--     values (pg_temp.fx('lapsed'), to_char(now(), 'YYYY-MM'), 300 * 1024 * 1024);
--   free_at := pg_temp.doors();
--   update public.storage_ledger set cumulative_bytes = 300 * 1024 * 1024 - 1
--    where host_id = pg_temp.fx('lapsed') and period = to_char(now(), 'YYYY-MM');
--   free_under := pg_temp.doors();
--
--   perform pg_temp.reset('pro', 'pro', null);
--   insert into public.storage_ledger (host_id, period, cumulative_bytes)
--     values (pg_temp.fx('pro'), to_char(now(), 'YYYY-MM'), pg_temp.gb(5000));
--   pro_line := pg_temp.line('pro', pg_temp.gb(1));
--
--   if live_doors is distinct from open_doors or live_meter <> 'ok' or live_h <> 'recorded' or live_g <> 'recorded' then
--     fail := fail || format(' live: %s, meter %s, host %s, guest %s;', live_doors, live_meter, live_h, live_g);
--   end if;
--   if lapsed_line is distinct from 'refused true lapsed true' or lapsed_doors is distinct from full_doors
--      or lapsed_meter <> 'monthly' or lapsed_h <> refused or lapsed_g <> refused then
--     fail := fail || format(' lapsed: %s; %s, meter %s, host %s, guest %s;', lapsed_line, lapsed_doors, lapsed_meter, lapsed_h, lapsed_g);
--   end if;
--   if credited_doors is distinct from full_doors or credited_meter <> 'monthly' then
--     fail := fail || format(' credited: %s, meter %s;', credited_doors, credited_meter);
--   end if;
--   if at_doors is distinct from full_doors or at_meter <> 'monthly' or at_put <> refused then
--     fail := fail || format(' at: %s, meter %s, put %s;', at_doors, at_meter, at_put);
--   end if;
--   if under_doors is distinct from open_doors or under_meter1 <> 'ok' or under_meter2 <> 'monthly'
--      or under_put <> 'recorded' or after_doors is distinct from full_doors then
--     fail := fail || format(' under: %s, meter %s/%s, put %s, then %s;', under_doors, under_meter1, under_meter2, under_put, after_doors);
--   end if;
--   if free_at is distinct from full_doors or free_under is distinct from open_doors then
--     fail := fail || format(' free: at %s, under %s;', free_at, free_under);
--   end if;
--   if pro_line is distinct from 'refused false lapsed false' then fail := fail || ' pro unmetered ' || pro_line; end if;
--   insert into proof (step, ok, detail) values ('5 uploads line', fail = '',
--     coalesce(nullif(fail, ''), format('live open everywhere; lapsed, credited and at the allowance full at every door, meter and writer; a byte under admits one; Free''s month; Pro unmetered (lapsed host: %s)', lapsed_doors)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 uploads line', false, sqlerrm);
-- end $$;
--
-- -- 5b. As the real callers ask: the guest's context as anon (PostgREST's role for her ticket), the gate, the meter and a
-- -- writer as the service role (the routes' admin client), each reaching the owner's uploads_refused through its definer
-- -- body; and no role PostgREST serves can ask uploads_refused itself.
-- do $$
-- declare ticket text := (select txt from fx where k = 'ticket'); album uuid := pg_temp.fx('album'); host uuid := pg_temp.fx('lapsed');
--   c text; g text; m text; w text; direct text := ''; r text; fail text := '';
-- begin
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '400 days', -interval '1 day');
--   set local role anon;
--   c := public.get_upload_context(ticket, 'photo')->>'at_monthly_cap';
--   reset role;
--   set local role service_role;
--   g := public.get_upload_gate(album, null, null)->>'album_full';
--   m := public.meter_upload(p_event_id => album, p_type => 'photo', p_bytes => 1000)->>'reason';
--   begin
--     perform public.create_media_as_host(p_host_id => host, p_event_id => album, p_media_id => gen_random_uuid(),
--       p_type => 'photo', p_original_key => 'events/' || album || '/photo/x/original.jpg', p_file_size_bytes => 1000);
--     w := 'recorded';
--   exception when others then
--     w := sqlstate || ' ' || sqlerrm;
--   end;
--   reset role;
--   foreach r in array array['anon', 'authenticated', 'service_role'] loop
--     begin
--       execute format('set local role %I', r);
--       execute 'select public.uploads_refused($1, $2, null, 1)' using host, 'event_pass'::public.tier_type;
--       reset role;
--       direct := direct || r || ' reached it; ';
--     exception when others then
--       reset role;
--       if sqlstate <> '42501' then direct := direct || r || ' ' || sqlstate || '; '; end if;
--     end;
--   end loop;
--   if c is distinct from 'true' or g is distinct from 'true' or m is distinct from 'monthly'
--      or w is distinct from '23514 Upload limit reached for this plan.' then
--     fail := fail || format(' context %s, gate %s, meter %s, writer %s;', c, g, m, w);
--   end if;
--   if direct <> '' then fail := fail || ' ' || direct; end if;
--   insert into proof (step, ok, detail) values ('5b as its callers', fail = '',
--     coalesce(nullif(fail, ''), 'anon''s context, the service role''s gate, meter and writer all read the lapsed pass; no client or service role asks the home itself'));
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('5b as its callers', false, sqlerrm);
-- end $$;
--
-- -- 6. The operator's read asks the same question: uploads_windows' lapsed flag is pass_lapsed's answer for each host.
-- do $$
-- declare got jsonb; r record; fail text := ''; want boolean; rows_n integer := 0;
--   ids uuid[] := array[pg_temp.fx('lapsed'), pg_temp.fx('stack'), pg_temp.fx('pro')];
-- begin
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '400 days', -interval '2 days');
--   perform pg_temp.reset('stack', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('stack', -interval '10 days', interval '355 days');
--   set local role service_role;
--   execute 'select coalesce(jsonb_agg(to_jsonb(w)), ''[]''::jsonb) from public.uploads_windows($1) w'
--     into got using ids;
--   reset role;
--   for r in select * from jsonb_to_recordset(got) as x(host_id uuid, tier public.tier_type, pass_lapsed boolean) loop
--     rows_n := rows_n + 1;
--     execute 'select public.pass_lapsed($1, $2)' into want using r.host_id, r.tier;
--     if r.pass_lapsed is distinct from want then fail := fail || format(' %s read %s want %s;', r.host_id, r.pass_lapsed, want); end if;
--     if r.host_id = pg_temp.fx('lapsed') and r.pass_lapsed is distinct from true then fail := fail || ' lapsed not lapsed;'; end if;
--     if r.host_id <> pg_temp.fx('lapsed') and r.pass_lapsed then fail := fail || ' a live host lapsed;'; end if;
--   end loop;
--   if rows_n <> 3 then fail := fail || format(' %s rows;', rows_n); end if;
--   insert into proof (step, ok, detail) values ('6 operator''s read', fail = '', coalesce(nullif(fail, ''), '3 hosts, each pass_lapsed''s own answer'));
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('6 operator''s read', false, sqlerrm);
-- end $$;
--
-- -- 7. Grants and shapes: the table deny-all (RLS on, no client privilege, the service role's own); the five new service
-- -- functions INVOKER and the service role's, uploads_refused the owner's alone; the seven restated bodies' ACLs, modes
-- -- and empty search_path as they stood.
-- do $$
-- declare r record; got text; shape text; fail text := '';
-- begin
--   if not (select relrowsecurity from pg_class where oid = to_regclass('public.pass_credits')) then fail := fail || ' rls off;'; end if;
--   if has_table_privilege('anon', 'public.pass_credits', 'select') or has_table_privilege('authenticated', 'public.pass_credits', 'select')
--      or has_table_privilege('authenticated', 'public.pass_credits', 'insert') then fail := fail || ' a client role reaches it;'; end if;
--   if not has_table_privilege('service_role', 'public.pass_credits', 'select,insert,update') then fail := fail || ' service role cannot;'; end if;
--   for r in select * from (values
--       ('public.claim_pass_credit(text, uuid, integer, uuid[])', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.record_pass_credit_grant(text, uuid, text)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.convert_pass_credit(text, uuid)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.recompute_pass_entitlement(uuid, timestamptz)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.pass_lapsed(uuid, public.tier_type)', 'postgres:EXECUTE service_role:EXECUTE', 'sql s invoker'),
--       ('public.uploads_refused(uuid, public.tier_type, bigint, bigint)', 'postgres:EXECUTE', 'sql s invoker'),
--       ('public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v definer'),
--       ('public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v definer'),
--       ('public.meter_upload(uuid, public.media_type, bigint)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v definer'),
--       ('public.get_upload_gate(uuid, text, uuid)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql s definer'),
--       ('public.uploads_windows(uuid[], uuid, integer)', 'postgres:EXECUTE service_role:EXECUTE', 'sql s invoker')
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
--   -- The two client-facing advisories keep their client grants (and no other client role).
--   for r in select * from (values
--       ('public.get_upload_context(text, public.media_type)', true, true, 'plpgsql s definer'),
--       ('public.get_host_upload_context(uuid, public.media_type)', false, true, 'plpgsql s definer')
--     ) v(fn, want_anon, want_auth, want_shape)
--   loop
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end
--       into shape
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if has_function_privilege('anon', r.fn, 'execute') is distinct from r.want_anon
--        or has_function_privilege('authenticated', r.fn, 'execute') is distinct from r.want_auth
--        or shape is distinct from r.want_shape then
--       fail := fail || format(' %s grants or shape %s;', r.fn, shape);
--     end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('7 grants and shapes', fail = '', coalesce(nullif(fail, ''), 'the table deny-all; 13 functions as named'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 grants and shapes', false, sqlerrm);
-- end $$;
--
-- -- 8. The bodies are this file's: each prosrc, whitespace collapsed, hashes as the file's own text does.
-- do $$
-- declare r record; got text; fail text := '';
-- begin
--   for r in select * from (values
--       ('claim_pass_credit', 'afa5c7afde081afe45a00e9c5e9d58e9'),
--       ('record_pass_credit_grant', '8605ffe454f7e3ab41cdeaf8384edc6e'),
--       ('convert_pass_credit', '17dd8a3c42b8a3301206eb3de5462a9a'),
--       ('recompute_pass_entitlement', '906c489179848859e028d22f19116096'),
--       ('pass_lapsed', '51e31424957360a36456d8ba22acfdaf'),
--       ('uploads_refused', 'cf95f228728e6bb6e6acae69c853daef'),
--       ('create_media', 'c2b705ff11359cea24c5a0bbc92e7ceb'),
--       ('create_media_as_host', 'e0d6dfea22d2a22516a3bcd9ed9346af'),
--       ('meter_upload', '4116450ef4af996f82c27d6d5265ac71'),
--       ('get_upload_context', '3c4c792d30b37e61995206e5295d4e97'),
--       ('get_upload_gate', '4182fc78adb24e1b2400eca7dcb29b42'),
--       ('get_host_upload_context', 'd983d79d2c90f9ee53fcb3b4ff6169a1'),
--       ('uploads_windows', 'd59d814fa7ef63705fbf441bcdbfdb57')
--     ) v(fn, want)
--   loop
--     select md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) into got
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = r.fn;
--     if got is distinct from r.want then fail := fail || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('8 bodies', fail = '', coalesce(nullif(fail, ''), '13 hashes, the file''s own'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
