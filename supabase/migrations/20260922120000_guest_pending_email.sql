-- The guest identity round, wave 0 — the unconfirmed address and its claim (Will, 2026-09-22,
-- verbatim in docs/design/rulings.md under "guest identity: name only, unconfirmed email, verified
-- account"). A guest is a row per event at one of three levels of trust:
--   1. a typed NAME alone (the public mark reads "Unverified");
--   2. a typed name plus an address NOBODY HAS PROVED — stored here, inert: never shown to the host
--      or another guest, never attributed to any account, never mailed on its own, never expiring.
--      His words: "a name with an invisible claim number (the email)";
--   3. a CONFIRMED account, the only identity that uploads as itself.
-- A confirmed address later CLAIMS its past rows (per event from the dashboard, or all at once) and
-- what the claimer leaves unclaimed is REMOVED, which is the guest saying "that was not me". Both
-- claims — this one and the silent session-token claim on sign-in — stamp the row verified.
--
-- ★ THIS IS AN EXPAND MIGRATION AND PRODUCTION MUST SURVIVE IT. It is applied hours before any of
-- the wave-1 code exists, while main and the launch-prep alias keep calling the OLD shapes:
--   * `pending_email` is a NEW, NULLABLE column and is NOT in the host's column-scoped SELECT grant,
--     so it is fail-closed over PostgREST from the first second (QA #41, 20260729180000).
--   * `create_guest` gains a 5th parameter WITH A DEFAULT (drop + create: PostgREST does not support
--     overloads, so the 4-arg signature must GO, not sit beside it). The deployed build's 3 and 4
--     named arguments still resolve and mint exactly as they do today.
--   * `claim_anonymous_uploads` keeps its signature, its return and its grants; its UNCONFIRMED arm
--     is byte-for-byte today's behaviour, so the deployed sign-in path is unchanged.
--   * the three new authenticated RPCs are additive: nothing calls them until wave 1.
--
-- ★ THE REPRESENTATION — A SEPARATE COLUMN, NEVER `guests.email`. `guests.email` carries one
-- invariant since 20260602144343: "confirmed, copied from auth.users at the mint". THREE host-facing
-- readers depend on it — the host's column-scoped PostgREST SELECT grant
-- `(id, event_id, user_id, email, created_at)`, `resolveUploaderIdentity` case 3, and
-- `upload_forensics.guest_email`. A typed stranger's address must never travel any of them (his
-- ruling: "there's no impersonation risk if the host can't see the attributed email of an
-- unconfirmed account"), so it lands in its own column that no grant reaches, and only a proved
-- claim moves it into `email`.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) diff EVERY replaced body below against live
-- `pg_get_functiondef` and reconcile drift FIRST — `create_guest` is carried verbatim from
-- 20260921150000 and `claim_anonymous_uploads` from 20260609120000, changed ONLY where a comment
-- says so; (2) apply verbatim; (3) get_advisors; (4) run the rolled-back contract check commented at
-- the bottom of this file (paste it whole into execute_sql — it rides existing rows and ends in a
-- deliberate raise, so nothing persists); (5) regenerate src/lib/db/types.ts BEFORE wave 1 is cut.
--
-- EXPECTED ADVISOR DELTA: lint 0028 (anon-executable SECURITY DEFINER) stays FIVE and keeps the same
-- members — nothing here is granted to `anon`. Lint 0029 (authenticated-only SECURITY DEFINER) GROWS
-- BY THREE: `list_guest_rows_by_email`, `claim_guest_rows_by_email`, `disown_guest_rows_by_email`,
-- joining `claim_anonymous_uploads`, which is replaced and re-granted here. TWO functions must appear
-- in NEITHER list: `set_guest_pending_email` (service-role-only, like every other server-mediated
-- guest write) and the new 5-arg `create_guest`. Both carry an explicit `revoke ... from anon` — an
-- MCP-applied function inherits an anon EXECUTE default grant that a bare `revoke ... from public`
-- does NOT remove. No new table, so no rls_enabled_no_policy row; every function sets search_path.

-- =============================================================================================
-- 0. THE BACKFILL, FIRST — before anything below can read a half-stamped row.
-- =============================================================================================
-- 20260921150000 backfilled `verified_at` for every guest whose account carried a confirmed email.
-- Rows CLAIMED BY TOKEN since then (claim_anonymous_uploads stamps `user_id` and nothing else) carry
-- a user_id and NO verified_at, so they would read as unverified for ever and be refused their next
-- upload on a Require-verified-emails event. Re-run that migration's own rule once, and null the
-- typed name on the same rows: a confirmed account's identity is its profile display_name (the one
-- precedence rule), so a second name must never sit beside it. `created_at`, not now(), so the stamp
-- reads as the join it was.
update public.guests g
   set verified_at = coalesce(g.verified_at, g.created_at),
       display_name = null
  from auth.users u
 where u.id = g.user_id
   and u.email_confirmed_at is not null
   and g.verified_at is null;

-- =============================================================================================
-- 1. guests.pending_email + guests.pending_email_at — the invisible claim number.
-- =============================================================================================
alter table public.guests
  add column pending_email text,
  add column pending_email_at timestamptz;

-- The hard backstop under the app's zod gate. Storage is normalised (lowercased, trimmed) so the
-- claim's `pending_email = lower(v_email)` lookup is an equality on the partial index below and can
-- never miss a row on case alone. `position('@') > 1` is a shape test, never a deliverability one:
-- nothing is ever sent here, so a stricter grammar would only reject real addresses for no gain.
alter table public.guests
  add constraint guests_pending_email_shape
  check (
    pending_email is null
    or (
      pending_email = lower(btrim(pending_email))
      and char_length(pending_email) between 3 and 254
      and position('@' in pending_email) > 1
    )
  );

-- The claim's only lookup: every row typed under one address, across every event. Partial, because
-- the overwhelming majority of guest rows carry no pending address at all.
create index guests_pending_email_idx
  on public.guests (pending_email)
  where pending_email is not null;

comment on column public.guests.pending_email is
  'An address the guest TYPED and nobody has proved (the guest identity round, 2026-09-22). Inert by construction: never shown to the host or another guest, never attributed to any account, never mailed on its own, never expiring. Written only by create_guest / set_guest_pending_email, and cleared only by a claim that proves it (claim_guest_rows_by_email, claim_anonymous_uploads) or by the guest detaching it. NEVER copied into guests.email except by such a claim — that column means "confirmed, copied from auth.users".';

comment on column public.guests.pending_email_at is
  'When the unproved address was typed (or last changed). Shown to the guest alone, as the age of their own claim; never a host-facing field and never an expiry — Will, 2026-09-22: "I''d prefer not to expire/detach any uploads from an unconfirmed email''s upload history."';

-- ★ NOT granted to `authenticated`, on purpose, and this is the whole safety property. SELECT on
-- guests is column-scoped (QA #41, 20260729180000: the TABLE grant is revoked and exactly
-- (id, event_id, user_id, email, created_at) re-granted), so a NEW column is FAIL-CLOSED — invisible
-- to the host over PostgREST until it is named in a grant. It never will be: the host sees a badge,
-- never the address. Every legitimate reader below is a SECURITY DEFINER function or the
-- service-role admin client.

-- =============================================================================================
-- 2. upload_forensics.guest_pending_email — the typed address, denormalized at capture.
-- =============================================================================================
-- The forensic row denormalizes the uploader's identity AS IT STOOD at upload time (a later claim
-- must not rewrite history), and for a guest at level 2 the typed address is half of that identity.
-- The precedent is 20260921150000's guest_display_name, and the posture is identical: capture-only,
-- deny-all + service-role, never product logic, never a host or guest surface. The server lane wires
-- the capture; this is the column it writes into.
alter table public.upload_forensics
  add column guest_pending_email text;

comment on column public.upload_forensics.guest_pending_email is
  'The guests.pending_email as it stood at upload time (capture-only, the guest identity round 2026-09-22). NULL for a host upload, for a confirmed guest (guest_email carries the proved address) and for rows minted before this migration. Lawful-process surface only: it is never rendered to a host or a guest.';

-- =============================================================================================
-- 3. create_guest — the mint may now carry an unproved address.
-- =============================================================================================
-- Signature CHANGE (a 5th parameter), so drop + create: PostgREST does not support overloads
-- (PGRST203). The new parameter DEFAULTS, so the deployed build's calls still resolve through the
-- deploy window. Body carried verbatim from 20260921150000 except where a comment below says so.
drop function public.create_guest(text, uuid, boolean, text);

create function public.create_guest(
  p_qr_token text,
  p_user_id uuid default null,
  p_unlock_proven boolean default false,
  p_display_name text default null,
  p_pending_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := p_user_id; -- the /api/guests route's getUser()-verified id (admin client has no auth.uid())
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_pending text;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- QA #18 (ADR-0023 ruling 2): the write path inherits the read gate. `private` NEVER mints — the
  -- /e/ page master-locks everyone including the owner (owner uploads ride the host routes), so a
  -- guest session for a private event has no legitimate caller. `password` requires proof of
  -- unlock: the route derives p_unlock_proven server-side (the HttpOnly unlock cookie, or event
  -- ownership — the owner reads the album without unlocking, so they upload without it too). The
  -- DB cannot read cookies, so this param is a belt against a FUTURE second caller skipping the
  -- route gate, not a client-forgeable input (create_guest stays service-role-only).
  if v_event.visibility = 'private' then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) then
    raise exception 'This event is locked. Enter the event password to upload.' using errcode = 'check_violation';
  end if;

  -- Verified email is SERVER-sourced: read auth.users for the trusted uid (definer privilege), never the
  -- client. (This is what closes the email-poisoning surface alongside capture_guest_email's new route.)
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- THE IDENTITY RESHAPE (2026-09-21) — this raise replaces the old "requires an account" one.
  -- The host's switch is Require verified emails: ON, nothing but a CONFIRMED session gets through,
  -- which is the same test the old flag applied (the trigger keeps the pair opposite), so the old
  -- build sees no behaviour change here. It keeps check_violation, so the shipped mapping still
  -- routes it to a 422.
  if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  -- The typed name, on a name-only event. Blank is NULL, not an error: the old build passes none at
  -- all and must keep minting, and wave 1's door is where "Enter a name" is refused with a 422 —
  -- here it would break production for a day. set_guest_display_name names a row that arrives
  -- without one.
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  -- THE NULLED NAME: a confirmed account's identity is its profile display_name (the one
  -- precedence rule wave 1 codes to), so a typed name is never stored beside it — one identity per
  -- row, never two that can disagree.
  if v_confirmed is not null then
    v_name := null;
  end if;
  -- The belt under guests_display_name_len, raised as a mapped refusal rather than a raw 23514.
  -- Only a caller that actually sends a name can reach it.
  if v_name is not null and char_length(v_name) > 60 then
    raise exception 'That name is too long.' using errcode = 'check_violation';
  end if;

  -- THE GUEST IDENTITY ROUND (2026-09-22) — the optional address on the name step. Normalised on
  -- the way in so the CHECK's `= lower(btrim(...))` arm holds by construction and the claim's
  -- equality lookup can never miss on case. Blank is NULL, exactly like the name: the field is
  -- optional and a guest who skips it is at level 1, not in error.
  v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''));
  -- NULLED IN TWO CASES, both "the row already has a better identity than this claim ticket":
  -- beside a CONFIRMED account (the proved address is in `email`; a second, unproved one could only
  -- disagree with it), and on a Require-verified-emails event (only a confirmed mint reaches this
  -- line at all, so this arm is a belt against a future caller that gets past the raise above).
  if v_confirmed is not null or v_event.require_verified_email then
    v_pending := null;
  end if;
  -- The belt under guests_pending_email_shape, raised as a mapped refusal rather than a raw 23514.
  -- ★ It must cover the WHOLE constraint, floor included: a two-character 'a@' passes
  -- `position('@') > 1` and would otherwise reach the CHECK as an unmappable 23514.
  if v_pending is not null
     and (char_length(v_pending) not between 3 and 254 or position('@' in v_pending) <= 1) then
    raise exception 'That email address does not look right.' using errcode = 'check_violation';
  end if;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    v_name,
    v_confirmed,
    v_pending,
    case when v_pending is not null then now() end
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    -- Additive keys (the old build casts the payload and ignores them): the door needs to know
    -- which identity it just got without a second read.
    'display_name', v_name,
    'verified', (v_confirmed is not null),
    -- ★ WHETHER, never WHAT. The caller already knows the address it sent; echoing it back would
    -- put an unproved stranger's address on a wire that the host's own /api/guests response rides.
    'email_attached', (v_pending is not null)
  );
end;
$function$;

-- Service-role-only, as before (ADR-0016): the /api/guests route is the sole caller. The drop above
-- took the grant with it, so this is a restore, not a belt.
revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 4. set_guest_pending_email — attaching, changing or detaching the address after the mint.
-- =============================================================================================
-- The second half of the optional field: a guest who skipped it and wants back in, one who typed it
-- wrong, and one who wants it gone. The session token is the capability, validated INSIDE, exactly
-- as set_guest_display_name does for the name. Service-role-only for the ADR-0016 reason (an anon
-- EXECUTE grant IS the attack surface, not the route wrapping it) and for a second one: an address
-- typed here is a spam vector if it can be written at volume, so the route's abuse limiter is part
-- of the gate. NOTHING IS EVER SENT to this address — that is what makes accepting a stranger's
-- address safe, and it is why this function has no confirmation arm at all.
create function public.set_guest_pending_email(
  p_session_token text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_pending text;
begin
  -- The shape gate before the lookup: a short token is never a real capability, and refusing it
  -- without touching the table keeps this off the list of things worth probing.
  if p_session_token is null or length(p_session_token) < 16 then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- A verified guest's address is their account's. Refusing beats storing a second one that can
  -- disagree with it (the one precedence rule, as with the name).
  if v_guest.verified_at is not null then
    raise exception 'Your email comes from your account.' using errcode = 'check_violation';
  end if;

  v_pending := lower(nullif(btrim(coalesce(p_email, '')), ''));

  -- Blank DETACHES. Both columns go, so the row falls back to level 1 (a typed name, "Unverified")
  -- and no future claim can reach it. This is the guest's own door out, and it is deliberately not
  -- an error: "clear it" and "set it to nothing" are the same intent.
  if v_pending is null then
    update public.guests
       set pending_email = null,
           pending_email_at = null
     where id = v_guest.id;
    return jsonb_build_object('guest_id', v_guest.id, 'email_attached', false);
  end if;

  -- The same belt as create_guest, covering the whole CHECK so nothing reaches it as a raw 23514.
  if char_length(v_pending) not between 3 and 254 or position('@' in v_pending) <= 1 then
    raise exception 'That email address does not look right.' using errcode = 'check_violation';
  end if;

  update public.guests
     set pending_email = v_pending,
         pending_email_at = now()
   where id = v_guest.id;

  -- WHETHER, never WHAT (see create_guest's payload).
  return jsonb_build_object('guest_id', v_guest.id, 'email_attached', true);
end;
$$;

revoke execute on function public.set_guest_pending_email(text, text) from public, anon, authenticated;
grant execute on function public.set_guest_pending_email(text, text) to service_role;

-- =============================================================================================
-- 5. list_guest_rows_by_email — the claim card's preview, for the confirmed caller ALONE.
-- =============================================================================================
-- ★ THE ORACLE GATE. This is the one function that reads rows BY ADDRESS, so it is the one that
-- could turn the product into "is this address a Partyreel guest?". It cannot: the address is never
-- a parameter. It is read from auth.users for auth.uid() under definer privilege, and an
-- UNCONFIRMED caller gets an empty set even for their own address — confirming the address is the
-- whole authorization. Browser-callable for the same reason claim_anonymous_uploads is: the identity
-- is the JWT, and there is no client-supplied trusted value to server-mediate.
--
-- What it hands back is a preview of what a claim WOULD carry, and nothing more: never `qr_token`,
-- never `custom_slug` (the album capability link must not ride a list the caller has not proved they
-- attended), and never the event date of a gated event — mirroring get_event_by_qr_token's QA #40
-- hide_meta redaction for a non-owner. A `private` event never mints a guest at all (create_guest
-- refuses it), so `password` is the only gated visibility that can appear here.
create function public.list_guest_rows_by_email()
returns table (
  guest_id uuid,
  event_id uuid,
  event_name text,
  event_date date,
  display_name text,
  upload_count integer,
  last_upload_at timestamptz,
  pending_email_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
begin
  -- Defense in depth (the grant already excludes anon); a missing session lists nothing.
  if v_uid is null then return; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- ★ TWO FORMS OF ONE ADDRESS, deliberately. `v_email` stays in the form auth.users holds, which
  -- is the form guests.email is written in (create_guest trims and never case-folds it); the LOOKUP
  -- key is `lower(v_email)`, because pending_email is stored normalised. Case-folding the stored
  -- form instead would drift this schema's one confirmed-address column away from its readers.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  -- UNCONFIRMED CALLERS GET NOTHING. His level 2: "no way to see uploads across events from email
  -- prior to verification for anyone" — the address owner included, until they prove it.
  if v_confirmed is null or v_email is null then return; end if;

  return query
  select g.id,
         e.id,
         e.name,
         -- QA #40's rule, applied to this surface: a gated event's metadata stays gated.
         case when e.visibility = 'password' then null else e.event_date end,
         g.display_name,
         coalesce(m.n, 0)::integer,
         m.last_at,
         g.pending_email_at
  from public.guests g
  join public.events e on e.id = g.event_id and e.deleted_at is null
  -- The count is what the claim (or the disown) would actually move: a row the guest already
  -- withdrew is not part of the offer, so `removed` is out.
  left join lateral (
    select count(*)::integer as n, max(x.created_at) as last_at
    from public.media x
    where x.guest_id = g.id and x.status <> 'removed'
  ) m on true
  where g.pending_email = lower(v_email)
    and g.user_id is null
    and g.verified_at is null
  order by coalesce(m.last_at, g.created_at) desc;
end;
$$;

revoke all on function public.list_guest_rows_by_email() from public, anon;
grant execute on function public.list_guest_rows_by_email() to authenticated;

-- =============================================================================================
-- 6. claim_guest_rows_by_email — "that one was me", per event or all at once.
-- =============================================================================================
-- The confirmed caller takes ownership of the rows typed under their address: user_id stamped,
-- verified_at stamped, `email` filled from auth.users (this is the ONE path from a typed address to
-- a confirmed one, and it is proved), both pending columns cleared, and the per-event typed name
-- dropped because the account's name now speaks for the row.
--
-- ★ THE NAMING RULE (his, verbatim): "When an unverified account is claimed, the active unverified
-- name becomes the official name for the verified account and updated across past events." It runs
-- ONLY on a profile that has no name yet, and it takes the most recently created row AMONG THOSE
-- BEING CLAIMED — never a name the person already chose, and never a name from a row they are
-- deliberately leaving behind. A named profile is untouched: the account's own name wins.
create function public.claim_guest_rows_by_email(p_event_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_count integer;
begin
  if v_uid is null then return 0; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- The stored form for guests.email; lower(v_email) is the pending_email lookup key (see
  -- list_guest_rows_by_email for why the two are kept apart).
  v_email := nullif(btrim(coalesce(v_email, '')), '');
  -- An unconfirmed caller claims nothing: the confirmation IS the proof of ownership.
  if v_confirmed is null or v_email is null then return 0; end if;

  -- NULL means "all of mine" (the Claim all shortcut). A named set is bounded, like every other
  -- array parameter in this schema.
  if p_event_ids is not null and cardinality(p_event_ids) > 200 then
    raise exception 'Too many events.' using errcode = 'program_limit_exceeded';
  end if;

  -- The naming rule, BEFORE the update — afterwards the typed names are gone.
  if exists (select 1 from public.profiles p where p.id = v_uid and p.display_name is null) then
    select g.display_name into v_name
    from public.guests g
    where g.pending_email = lower(v_email)
      and g.user_id is null
      and g.verified_at is null
      and g.display_name is not null
      and (p_event_ids is null or g.event_id = any(p_event_ids))
    order by g.created_at desc
    limit 1;

    if v_name is not null then
      update public.profiles
         set display_name = v_name
       where id = v_uid and display_name is null;
    end if;
  end if;

  update public.guests
     set user_id = v_uid,
         verified_at = now(),
         email = v_email,
         pending_email = null,
         pending_email_at = null,
         display_name = null
   where pending_email = lower(v_email)
     and user_id is null
     and verified_at is null
     and (p_event_ids is null or event_id = any(p_event_ids));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.claim_guest_rows_by_email(uuid[]) from public, anon;
grant execute on function public.claim_guest_rows_by_email(uuid[]) to authenticated;

-- =============================================================================================
-- 7. disown_guest_rows_by_email — "that was not me", and the uploads go.
-- =============================================================================================
-- His ruling, verbatim: "any unclaimed events should have all of that user's uploaded content
-- deleted ... we should not keep impersonated uploads alive in other albums since they were added by
-- a provably antagonistic actor under false conditions." The wave-1 claim screen calls this at
-- Finish, behind a confirmation, for every event the guest left unclaimed.
--
-- The removal rides the UPLOADER path (`removed_by_uploader = true`), which is exactly right on both
-- counts: the host's bin never shows it and restore_media refuses it (20260609150000), so the host
-- cannot quietly put a disowned upload back. The GUEST ROW SURVIVES with its typed name: the album's
-- guest list and the forensic record of who uploaded what are history, and history is not rewritten
-- here. Only the address is detached, so the row can never be claimed again.
create function public.disown_guest_rows_by_email(p_event_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_count integer;
begin
  if v_uid is null then return 0; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  v_email := nullif(btrim(coalesce(v_email, '')), '');
  if v_confirmed is null or v_email is null then return 0; end if;

  -- ★ NO IMPLICIT "ALL" ON A DESTRUCTIVE CALL. claim_ reads NULL as "every event of mine"; here the
  -- same shorthand would delete every upload the caller ever made from an unclaimed row, so an
  -- unnamed set is a loud refusal rather than a quiet no-op a caller could mistake for success.
  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    raise exception 'Name the events to release.' using errcode = 'check_violation';
  end if;
  if cardinality(p_event_ids) > 200 then
    raise exception 'Too many events.' using errcode = 'program_limit_exceeded';
  end if;

  -- Soft-remove every still-live upload of those rows. `removed_at` is coalesced so a repeat call
  -- never extends how long the bytes linger, and `purge_at` is NOT set here: the media_set_purge_at
  -- BEFORE trigger derives it, and media_derive_removal_provenance stamps status_before_removed, on
  -- this very UPDATE. The `or removed_by_uploader = false` arm re-marks a row the HOST binned, so a
  -- disowned upload can never be restored out of the host's trash.
  update public.media m
     set status = 'removed',
         removed_at = coalesce(m.removed_at, now()),
         removed_by_uploader = true
    from public.guests g
   where g.id = m.guest_id
     and g.pending_email = lower(v_email)
     and g.user_id is null
     and g.event_id = any(p_event_ids)
     and (m.status <> 'removed' or m.removed_by_uploader = false);

  -- Then detach the address. The row, its typed name and its forensic trail stay.
  update public.guests
     set pending_email = null,
         pending_email_at = null
   where pending_email = lower(v_email)
     and user_id is null
     and event_id = any(p_event_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.disown_guest_rows_by_email(uuid[]) from public, anon;
grant execute on function public.disown_guest_rows_by_email(uuid[]) to authenticated;

-- =============================================================================================
-- 8. claim_anonymous_uploads — the silent token claim, now a full claim for a confirmed caller.
-- =============================================================================================
-- Body carried from 20260609120000; same signature, same return, same grants. ONE change, and it
-- INVERTS that migration's "does NOT set email" rule on purpose:
--
--   ★ A CONFIRMED CALLER'S TOKEN CLAIM IS A PROVED CLAIM. The old rule ("a claim proves possession
--   of a session token, never ownership of an address") was written when the address on a guest row
--   could only have come from the row's own mint. It is now the stronger statement that matters: the
--   caller holds the DEVICE that made the upload *and* has proved an address, which is more proof
--   than claim_guest_rows_by_email asks for (an address alone). Leaving these rows unstamped would
--   strand them as unverified for ever and refuse their next upload on a Require-verified-emails
--   event, and would leave a typed address sitting on a row whose owner is now known.
--   A typed address that DIFFERS from the caller's is simply dropped: the device is the proof, and
--   the row's identity is now the account's.
--
-- An UNCONFIRMED caller stamps `user_id` and nothing else, byte-for-byte today's behaviour — so the
-- build in production keeps working unchanged through the deploy window.
--
-- Everything that made this safe to expose to the browser is unchanged: identity is auth.uid()
-- (JWT-validated, unspoofable), the session_tokens are 256-bit capabilities the browser legitimately
-- holds (ADR-0004), the array is bounded, and the `user_id is null` filter means an already-owned
-- row is NEVER stolen or re-assigned (naturally idempotent: a re-run claims 0).
create or replace function public.claim_anonymous_uploads(p_session_tokens text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_count integer;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session claims nothing.
  if v_uid is null then return 0; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return 0; end if;
  -- Sanity ceiling: ~1 token per event attended; no real browser holds 1000. Bounds the array probe.
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- The stored form, exactly as create_guest writes guests.email at a confirmed mint.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  if v_confirmed is not null and v_email is not null then
    -- The naming rule, as in claim_guest_rows_by_email: a NAMELESS profile takes the name off the
    -- most recently created row being claimed, and a named profile is never overwritten.
    if exists (select 1 from public.profiles p where p.id = v_uid and p.display_name is null) then
      select g.display_name into v_name
      from public.guests g
      where g.session_token = any (p_session_tokens)
        and g.user_id is null
        and g.display_name is not null
      order by g.created_at desc
      limit 1;

      if v_name is not null then
        update public.profiles
           set display_name = v_name
         where id = v_uid and display_name is null;
      end if;
    end if;

    update public.guests
       set user_id = v_uid,
           verified_at = now(),
           email = v_email,
           pending_email = null,
           pending_email_at = null,
           display_name = null
     where session_token = any (p_session_tokens)
       and user_id is null;
  else
    -- Unchanged from 20260609120000: an unconfirmed session stamps ownership and nothing else.
    update public.guests
       set user_id = v_uid
     where session_token = any (p_session_tokens)
       and user_id is null;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- `create or replace` preserves the existing ACL, so these two lines restate the end state rather
-- than change it. They are a BELT against the MCP default-grant landmine (database-security.md):
-- if this function is ever dropped and recreated instead, the anon EXECUTE default comes back.
revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;
grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;

-- =============================================================================================
-- 9. ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER the apply; nothing persists,
--    the block ends in a deliberate RAISE). Rides EXISTING rows and picks them itself, so there is
--    no placeholder to fill: an open test event and a confirmed account. Expect the last line to be
--    `ROLLED BACK — every guest-identity contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_event2 public.events;
--   v_qr text;
--   v_uid uuid;
--   v_email text;   -- as auth.users holds it: the form guests.email is written in
--   v_key text;     -- lower(v_email): the form pending_email is stored in
--   v_mint jsonb;
--   v_token text;
--   v_token2 text;
--   v_guest public.guests;
--   v_res jsonb;
--   v_n integer;
--   v_media_id uuid;
--   v_rows integer;
--   v_ids uuid[];
--   v_orphans bigint;
-- begin
--   select * into v_event from public.events
--    where visibility = 'open' and deleted_at is null order by created_at limit 1;
--   if v_event.id is null then raise exception 'FAIL: no open test event to ride'; end if;
--   v_qr := v_event.qr_token;
--
--   select p.id, u.email into v_uid, v_email from public.profiles p
--     join auth.users u on u.id = p.id
--    where u.email_confirmed_at is not null limit 1;
--   if v_uid is null then raise exception 'FAIL: no confirmed account to ride'; end if;
--   v_email := btrim(v_email);
--   v_key := lower(v_email);
--
--   update public.events
--      set require_verified_email = false, accepting_uploads = true
--    where id = v_event.id;
--
--   -- ── 1. the mint stores a trimmed, lowercased, UNCONFIRMED address ──────────────────────────
--   v_mint := public.create_guest(v_qr, null, false, 'Maya J.', '  Maya@Example.COM  ');
--   v_token := v_mint->>'session_token';
--   select * into v_guest from public.guests where session_token = v_token;
--   if v_guest.pending_email is distinct from 'maya@example.com' then
--     raise exception 'FAIL: the typed address was not normalised (%)', v_guest.pending_email;
--   end if;
--   if v_guest.pending_email_at is null then raise exception 'FAIL: pending_email_at not stamped'; end if;
--   if v_guest.email is not null or v_guest.verified_at is not null then
--     raise exception 'FAIL: a typed address was treated as proved';
--   end if;
--   if (v_mint->>'email_attached')::boolean is not true then
--     raise exception 'FAIL: the mint payload does not report email_attached';
--   end if;
--   if v_mint::text like '%maya@example.com%' then
--     raise exception 'FAIL: the mint payload echoed the address back';
--   end if;
--   raise notice 'OK: a names-mode mint stores the address unconfirmed and reports only WHETHER';
--
--   -- ── 2. a confirmed mint nulls it; the 4-arg convention still mints ─────────────────────────
--   v_mint := public.create_guest(v_qr, v_uid, false, 'Typed Over Profile', 'typed@example.com');
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.pending_email is not null then
--     raise exception 'FAIL: a confirmed mint kept an unproved address';
--   end if;
--   if v_guest.verified_at is null or v_guest.display_name is not null then
--     raise exception 'FAIL: the confirmed mint lost the reshape contract';
--   end if;
--   raise notice 'OK: a confirmed mint nulls the typed address';
--
--   v_mint := public.create_guest(p_qr_token := v_qr, p_user_id := null,
--                                 p_unlock_proven := false, p_display_name := 'Four Arg');
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.display_name is distinct from 'Four Arg' or v_guest.pending_email is not null then
--     raise exception 'FAIL: the deployed 4-arg create_guest call no longer mints cleanly';
--   end if;
--   raise notice 'OK: the deployed 4-arg create_guest call still mints';
--
--   -- ── 3. a require-verified mint nulls it BEFORE the insert ──────────────────────────────────
--   update public.events set require_verified_email = true where id = v_event.id;
--   v_mint := public.create_guest(v_qr, v_uid, false, null, 'typed@example.com');
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.pending_email is not null then
--     raise exception 'FAIL: a require-verified mint stored an unproved address';
--   end if;
--   raise notice 'OK: a require-verified mint nulls the typed address';
--   update public.events set require_verified_email = false where id = v_event.id;
--
--   -- ── 4. a junk address is refused as a mapped check_violation, never a raw 23514 ────────────
--   begin
--     perform public.create_guest(v_qr, null, false, 'Junk', 'nope');
--     raise exception 'FAIL: an address with no @ was accepted';
--   exception when check_violation then
--     if position('does not look right' in sqlerrm) = 0 then
--       raise exception 'FAIL: the junk address raised the raw constraint (%)', sqlerrm;
--     end if;
--     raise notice 'OK: a junk address is refused with the mapped message';
--   end;
--   begin
--     perform public.create_guest(v_qr, null, false, 'Junk', 'a@');
--     raise exception 'FAIL: a two-character address was accepted';
--   exception when check_violation then
--     if position('does not look right' in sqlerrm) = 0 then
--       raise exception 'FAIL: the short address reached the CHECK as a raw 23514 (%)', sqlerrm;
--     end if;
--     raise notice 'OK: the belt covers the CHECK floor as well as its ceiling';
--   end;
--
--   -- ── 5. set_guest_pending_email: set, detach, refuse a verified row, refuse an unknown token ─
--   v_res := public.set_guest_pending_email(v_token, '  Second@Example.com ');
--   select * into v_guest from public.guests where session_token = v_token;
--   if v_guest.pending_email is distinct from 'second@example.com'
--      or (v_res->>'email_attached')::boolean is not true then
--     raise exception 'FAIL: the address was not reset (%)', v_guest.pending_email;
--   end if;
--   raise notice 'OK: an address can be attached or changed after the mint';
--
--   v_res := public.set_guest_pending_email(v_token, '   ');
--   select * into v_guest from public.guests where session_token = v_token;
--   if v_guest.pending_email is not null or v_guest.pending_email_at is not null
--      or (v_res->>'email_attached')::boolean is not false then
--     raise exception 'FAIL: a blank did not detach the address';
--   end if;
--   raise notice 'OK: a blank detaches both columns';
--   perform public.set_guest_pending_email(v_token, 'maya@example.com');
--
--   begin
--     perform public.set_guest_pending_email('short', 'x@example.com');
--     raise exception 'FAIL: an unknown session was accepted';
--   exception when no_data_found then
--     raise notice 'OK: an unknown session is refused (the route maps it to 401)';
--   end;
--
--   update public.guests set verified_at = now() where session_token = v_token;
--   begin
--     perform public.set_guest_pending_email(v_token, 'x@example.com');
--     raise exception 'FAIL: a verified row took a second address';
--   exception when check_violation then
--     raise notice 'OK: a verified row keeps the account address';
--   end;
--   update public.guests set verified_at = null where session_token = v_token;
--
--   -- ── 6. list_guest_rows_by_email — the caller's own rows, and nobody else's ─────────────────
--   -- The caller's address is read from auth.users, so ride it: point the row at it and upload one.
--   update public.guests set pending_email = v_key where session_token = v_token;
--   select * into v_guest from public.guests where session_token = v_token;
--   v_media_id := gen_random_uuid();
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (v_media_id, v_event.id, v_guest.id, 'photo',
--           'events/' || v_event.id::text || '/original/claim-check.jpg', 1024, 'approved');
--
--   -- execute_sql runs as a role with no JWT, so auth.uid() is null: prove the fail-closed arm
--   -- here, then drive the confirmed arm by impersonating the caller's claims.
--   select count(*) into v_n from public.list_guest_rows_by_email();
--   if v_n <> 0 then raise exception 'FAIL: an anonymous caller listed rows'; end if;
--   raise notice 'OK: a caller with no session lists nothing';
--
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);
--
--   select count(*) into v_n from public.list_guest_rows_by_email() where guest_id = v_guest.id;
--   if v_n <> 1 then raise exception 'FAIL: the caller cannot see their own claimable row'; end if;
--   if not exists (select 1 from public.list_guest_rows_by_email()
--                   where guest_id = v_guest.id and upload_count = 1 and last_upload_at is not null) then
--     raise exception 'FAIL: the preview does not count the upload';
--   end if;
--   raise notice 'OK: the confirmed caller sees their own row with its count';
--
--   update public.guests set pending_email = 'stranger@example.com' where session_token = v_token;
--   if exists (select 1 from public.list_guest_rows_by_email() where guest_id = v_guest.id) then
--     raise exception 'FAIL: a stranger''s address listed for this caller';
--   end if;
--   raise notice 'OK: another address never lists for this caller';
--   update public.guests set pending_email = v_key where session_token = v_token;
--
--   -- ── 7. claim_guest_rows_by_email — one event, then all; the naming rule ────────────────────
--   update public.profiles set display_name = null where id = v_uid;
--   v_rows := public.claim_guest_rows_by_email(array[v_event.id]);
--   if v_rows < 1 then raise exception 'FAIL: the per-event claim moved nothing'; end if;
--   select * into v_guest from public.guests where session_token = v_token;
--   if v_guest.user_id is distinct from v_uid or v_guest.verified_at is null
--      or v_guest.email is distinct from v_email
--      or v_guest.pending_email is not null or v_guest.pending_email_at is not null
--      or v_guest.display_name is not null then
--     raise exception 'FAIL: the claim did not stamp the row whole';
--   end if;
--   if (select display_name from public.profiles where id = v_uid) is distinct from 'Maya J.' then
--     raise exception 'FAIL: a nameless profile was not named from the claimed row';
--   end if;
--   raise notice 'OK: the per-event claim stamps the row and names a nameless profile';
--
--   -- A NAMED profile is never overwritten.
--   update public.profiles set display_name = 'Chosen Name' where id = v_uid;
--   v_mint := public.create_guest(v_qr, null, false, 'Door Name', v_email);
--   v_token2 := v_mint->>'session_token';
--   v_rows := public.claim_guest_rows_by_email();
--   if v_rows < 1 then raise exception 'FAIL: the claim-all moved nothing'; end if;
--   if (select display_name from public.profiles where id = v_uid) is distinct from 'Chosen Name' then
--     raise exception 'FAIL: a named profile was renamed by a claim';
--   end if;
--   raise notice 'OK: claim-all works and never renames a named profile';
--
--   select array_agg(gen_random_uuid()) into v_ids from generate_series(1, 201);
--   begin
--     perform public.claim_guest_rows_by_email(v_ids);
--     raise exception 'FAIL: a 201-event claim was accepted';
--   exception when program_limit_exceeded then
--     raise notice 'OK: the claim array is bounded at 200';
--   end;
--
--   -- ── 8. disown_guest_rows_by_email — the uploads go, the row survives ───────────────────────
--   v_mint := public.create_guest(v_qr, null, false, 'Not Me', v_email);
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   v_media_id := gen_random_uuid();
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (v_media_id, v_event.id, v_guest.id, 'photo',
--           'events/' || v_event.id::text || '/original/disown-check.jpg', 2048, 'approved');
--
--   begin
--     perform public.disown_guest_rows_by_email(null);
--     raise exception 'FAIL: a null event set was read as "all"';
--   exception when check_violation then
--     raise notice 'OK: the destructive call refuses an unnamed event set';
--   end;
--
--   v_rows := public.disown_guest_rows_by_email(array[v_event.id]);
--   if v_rows < 1 then raise exception 'FAIL: the disown detached nothing'; end if;
--   if not exists (select 1 from public.media
--                   where id = v_media_id and status = 'removed' and removed_by_uploader) then
--     raise exception 'FAIL: the disowned upload was not removed through the uploader path';
--   end if;
--   if not exists (select 1 from public.guests where id = v_guest.id and pending_email is null) then
--     raise exception 'FAIL: the disown left the address attached';
--   end if;
--   if not exists (select 1 from public.guests where id = v_guest.id) then
--     raise exception 'FAIL: the disown deleted the guest row';
--   end if;
--   -- ★ Ride the EVENT'S HOST for this one call, or restore_media refuses on ownership and the
--   -- assertion would pass for the wrong reason. The arm being proved is `removed_by_uploader`.
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_event.host_id::text, 'role', 'authenticated')::text, true);
--   v_res := public.restore_media(v_media_id);
--   if (v_res->>'ok')::boolean is not false or v_res->>'reason' is distinct from 'not_found' then
--     raise exception 'FAIL: the host could restore a disowned upload (%)', v_res::text;
--   end if;
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);
--   raise notice 'OK: the disown removes the uploads unrestorably and leaves the row standing';
--
--   -- ── 9. claim_anonymous_uploads — the confirmed arm, and the unconfirmed one unchanged ──────
--   perform set_config('request.jwt.claims', '', true);
--   v_mint := public.create_guest(v_qr, null, false, 'Token Claim', 'other@example.com');
--   v_token2 := v_mint->>'session_token';
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);
--   v_rows := public.claim_anonymous_uploads(array[v_token2]);
--   if v_rows <> 1 then raise exception 'FAIL: the token claim moved % rows', v_rows; end if;
--   select * into v_guest from public.guests where session_token = v_token2;
--   if v_guest.verified_at is null or v_guest.email is distinct from v_email
--      or v_guest.pending_email is not null or v_guest.display_name is not null then
--     raise exception 'FAIL: a confirmed token claim did not stamp the row whole';
--   end if;
--   raise notice 'OK: a confirmed token claim stamps verified_at + email and drops a differing address';
--
--   if public.claim_anonymous_uploads(array[v_token2]) <> 0 then
--     raise exception 'FAIL: an owned row was re-claimed';
--   end if;
--   raise notice 'OK: an owned row is never re-stamped';
--
--   -- The unconfirmed arm: impersonate an account with no confirmation.
--   perform set_config('request.jwt.claims', '', true);
--   v_mint := public.create_guest(v_qr, null, false, 'Unconfirmed Claim', null);
--   v_token2 := v_mint->>'session_token';
--   declare v_unconfirmed uuid;
--   begin
--     select u.id into v_unconfirmed from auth.users u
--      where u.email_confirmed_at is null limit 1;
--     if v_unconfirmed is null then
--       raise notice 'SKIP: no unconfirmed account on this project to ride';
--     else
--       perform set_config('request.jwt.claims',
--         json_build_object('sub', v_unconfirmed::text, 'role', 'authenticated')::text, true);
--       if public.claim_anonymous_uploads(array[v_token2]) <> 1 then
--         raise exception 'FAIL: the unconfirmed arm stopped claiming';
--       end if;
--       select * into v_guest from public.guests where session_token = v_token2;
--       if v_guest.user_id is distinct from v_unconfirmed or v_guest.verified_at is not null
--          or v_guest.email is not null then
--         raise exception 'FAIL: an unconfirmed claim stamped more than user_id';
--       end if;
--       raise notice 'OK: an unconfirmed session still stamps user_id and nothing else';
--       if (select count(*) from public.list_guest_rows_by_email()) <> 0 then
--         raise exception 'FAIL: an unconfirmed caller listed claimable rows';
--       end if;
--       raise notice 'OK: an unconfirmed caller lists nothing, even for their own address';
--     end if;
--   end;
--   perform set_config('request.jwt.claims', '', true);
--
--   -- ── 10. the backfill left nobody behind ────────────────────────────────────────────────────
--   select count(*) into v_orphans
--     from public.guests g join auth.users u on u.id = g.user_id
--    where u.email_confirmed_at is not null and g.verified_at is null;
--   if v_orphans > 0 then
--     raise exception 'FAIL: % confirmed guests would be refused their next upload', v_orphans;
--   end if;
--   raise notice 'OK: every confirmed guest carries verified_at (% orphans)', v_orphans;
--
--   -- ── 11. the column stays fail-closed, and the grants sit where the doc says ────────────────
--   if has_column_privilege('authenticated', 'public.guests', 'pending_email', 'select')
--      or has_column_privilege('authenticated', 'public.guests', 'pending_email_at', 'select')
--      or has_column_privilege('anon', 'public.guests', 'pending_email', 'select') then
--     raise exception 'FAIL: the unproved address leaked into the host PostgREST view (QA #41)';
--   end if;
--   raise notice 'OK: pending_email is fail-closed over PostgREST';
--
--   if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or has_function_privilege('anon', 'public.set_guest_pending_email(text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.set_guest_pending_email(text, text)', 'execute')
--      or has_function_privilege('anon', 'public.list_guest_rows_by_email()', 'execute')
--      or has_function_privilege('anon', 'public.claim_guest_rows_by_email(uuid[])', 'execute')
--      or has_function_privilege('anon', 'public.disown_guest_rows_by_email(uuid[])', 'execute')
--      or has_function_privilege('anon', 'public.claim_anonymous_uploads(text[])', 'execute') then
--     raise exception 'FAIL: a guest-identity function is callable by a role that must not reach it';
--   end if;
--   if not has_function_privilege('service_role', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or not has_function_privilege('service_role', 'public.set_guest_pending_email(text, text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.list_guest_rows_by_email()', 'execute')
--      or not has_function_privilege('authenticated', 'public.claim_guest_rows_by_email(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.disown_guest_rows_by_email(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.claim_anonymous_uploads(text[])', 'execute') then
--     raise exception 'FAIL: a guest-identity function lost the grant it needs';
--   end if;
--   raise notice 'OK: every EXECUTE grant sits where database-security.md says';
--
--   raise exception 'ROLLED BACK — every guest-identity contract held';
-- end $$;
