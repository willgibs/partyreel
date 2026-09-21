-- The identity reshape, wave 0 — the schema alone (Will, 2026-09-21, build 5e210ef, verbatim in
-- docs/design/rulings.md under "the identity reshape"): anonymity leaves the product. The host's
-- switch becomes **Require verified emails** (on by default). ON, a guest confirms an email before
-- the album and any upload. OFF, a guest types a display name at the door and uploads under it with
-- an unverified mark. Either way an upload now carries an identity; only rows minted BEFORE this
-- migration can still read as "A guest".
--
-- ★ THIS IS AN EXPAND MIGRATION AND PRODUCTION MUST SURVIVE IT. It is applied to the live project
-- at wave 0's handoff, hours before any of the wave-1 code exists, while main (milestone-26) and
-- the launch-prep alias keep calling the OLD shapes. Every change below is therefore additive from
-- the old build's point of view:
--   * `events.require_verified_email` lands BESIDE `allow_anonymous_uploads`, and a BEFORE trigger
--     keeps the pair exactly opposite in both directions — so the old build, which writes and reads
--     only the legacy flag, stays correct, and so does every query still keyed on it
--     (get_public_profile's QA #36 attended-arm clause is the load-bearing one; a test pins the link).
--   * `create_guest` gains a 4th parameter with a DEFAULT (drop + create: PostgREST does not
--     support overloads, so the 3-arg signature must GO, not sit beside it). The old build's 3
--     named arguments still resolve, and a name-only event mints exactly as it does today.
--   * `create_media`'s new refusal opens with the words "not accepting uploads" ON PURPOSE: the
--     SHIPPED mapCheckViolation (src/lib/db/mutations/guest.ts) matches that substring first, so
--     the old build maps the new refusal to `uploads_closed` and shows a sane message.
--   * `get_upload_context` and `get_event_by_qr_token` only GROW their payloads; both consumers map
--     named fields, so an extra key is ignored until wave 1 reads it.
--   * `guests.display_name` / `guests.verified_at` are nullable, and `verified_at` is BACKFILLED
--     for every guest whose account is confirmed — without that, the new create_media refusal would
--     stop the next upload of every existing guest on a require-accounts event.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) diff EVERY replaced body below against live
-- `pg_get_functiondef` and reconcile drift FIRST — the bodies here are carried verbatim from
-- 20260729190000 (create_media, create_guest, get_upload_context) and 20260729180000
-- (get_event_by_qr_token) and changed ONLY where a comment says so; (2) apply verbatim;
-- (3) get_advisors; (4) run the rolled-back contract check (commented at the bottom of this file,
-- and pasted whole into the lane's Handoff); (5) regenerate src/lib/db/types.ts BEFORE wave 1 is
-- cut, so every wave-1 lane codes against real names.
--
-- EXPECTED ADVISOR DELTA: the 0028 anon set stays FIVE and keeps the same members
-- (get_event_by_qr_token is dropped and recreated here, which DROPS ITS GRANT — the re-grant below
-- is what keeps it there; get_upload_context is replaced and re-granted). 0029 is untouched. TWO
-- new functions must appear in NEITHER list: `set_guest_display_name` (service-role-only, like
-- every other server-mediated guest write) and `sync_event_verified_email_flags` (trigger-only).
-- Both carry an explicit `revoke ... from anon` — an MCP-applied function inherits an anon EXECUTE
-- default grant that a bare `revoke ... from public` does NOT remove.

-- =============================================================================================
-- 1. events.require_verified_email — the host's switch, on by default.
-- =============================================================================================
-- true = today's "require accounts" (allow_anonymous_uploads = false). The default matches
-- allow_anonymous_uploads's own default (false, since 20260621170000), so the two defaults are
-- already opposite and a plain INSERT naming neither is consistent.
alter table public.events
  add column require_verified_email boolean not null default true;

-- Existing rows: derive from the flag they have been carrying.
update public.events
   set require_verified_email = not allow_anonymous_uploads
 where require_verified_email is distinct from (not allow_anonymous_uploads);

comment on column public.events.require_verified_email is
  'Require verified emails (the identity reshape, 2026-09-21). ON: a guest confirms an email before the album and any upload. OFF: a guest types a display name at the door and uploads unverified. Kept exactly opposite to the legacy allow_anonymous_uploads by the events_sync_verified_email_flags trigger, so both generations of code read a truthful flag.';

-- The host writes it, so it joins the column-locked write grant (20260604163011 revoked the TABLE
-- grant and re-granted columns; this adds one more). ★ DO NOT "re-assert" that table revoke here as
-- a belt: `revoke update on table public.events from authenticated` CASCADES TO THE COLUMN GRANTS
-- and wipes every one of them, which would take the whole host app down. Measured on a throwaway
-- PostgreSQL 17.10 cluster during this lane's pre-flight — after the belt revoke, pg_attribute.attacl
-- for public.events held exactly ONE entry, this new column, and an authenticated UPDATE naming
-- allow_anonymous_uploads failed with "permission denied for table events". The documented landmine
-- runs the other way (a COLUMN revoke is a silent no-op while a TABLE grant stands); this is its
-- mirror, and the safe move for an added column is a bare additive grant.
grant insert (require_verified_email), update (require_verified_email)
  on public.events to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The twin-keeper. A column grant cannot express "and keep this other column opposite", so a
-- BEFORE trigger does it — the same shape as the QA #7/#10 transition guards. This is what makes
-- the expand safe: the old build writes allow_anonymous_uploads and the new build writes
-- require_verified_email, and both land a consistent row. It also keeps every query still keyed on
-- the legacy flag truthful, above all get_public_profile's QA #36 attended-arm clause
-- (`e.allow_anonymous_uploads or a signed-in viewer`), which is why that function is NOT replaced
-- in this migration. Retire the trigger only when the legacy column itself is dropped, and
-- re-point that clause in the same change.
-- ---------------------------------------------------------------------------------------------
create or replace function public.sync_event_verified_email_flags() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- The two defaults are already opposite, so an inconsistent INSERT names exactly one of them:
    -- an OLD build naming allow_anonymous_uploads = true (require left at its default true), or a
    -- NEW build naming require_verified_email = false (allow left at its default false).
    if new.require_verified_email is distinct from (not new.allow_anonymous_uploads) then
      if new.require_verified_email is false then
        new.allow_anonymous_uploads := true;
      else
        new.require_verified_email := not new.allow_anonymous_uploads;
      end if;
    end if;
  else
    -- UPDATE: whichever column the writer actually MOVED wins. If both moved, the NEW column wins
    -- (the legacy flag is the compatibility twin, never the source of truth).
    if new.require_verified_email is distinct from old.require_verified_email then
      new.allow_anonymous_uploads := not new.require_verified_email;
    else
      new.require_verified_email := not new.allow_anonymous_uploads;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger events_sync_verified_email_flags
  before insert or update on public.events
  for each row execute function public.sync_event_verified_email_flags();

-- Trigger-only: it must appear in NEITHER advisor list. A trigger runs as the table owner, so
-- revoking EXECUTE closes direct calls without touching the trigger.
revoke execute on function public.sync_event_verified_email_flags() from public, anon, authenticated;

-- =============================================================================================
-- 2. guests.display_name + guests.verified_at — the identity a row carries.
-- =============================================================================================
-- display_name comes BACK (it was dropped in 20260602071249 as pure friction when nothing rendered
-- it). It renders now: it is the whole identity of a name-only guest, on the credit, the guest
-- list and the tile's own-mark. NULL means "no typed name" — for a verified guest that is correct
-- and deliberate, because their name is their profile's (the one precedence rule); for a row
-- minted before this migration it is what still reads as "A guest".
alter table public.guests
  add column display_name text,
  add column verified_at timestamptz;

-- Parity with DISPLAY_NAME_MAX_LENGTH (src/lib/validation/profile.ts); a Vitest guard pins the two
-- together. The zod schema is the UX gate; this CHECK is the hard backstop. PROFANITY and the
-- reserved-name list are NOT enforced here and never can be: the obscenity matcher is app-side
-- (it must not ship to a browser), so the route that calls these RPCs owns that check, exactly as
-- updateDisplayNameAction owns it for a profile name.
alter table public.guests
  add constraint guests_display_name_len
  check (display_name is null or char_length(display_name) between 1 and 60);

comment on column public.guests.display_name is
  'The name a guest typed at the door of a name-only event (the identity reshape, 2026-09-21). NULL for a verified guest (their profile display_name is the identity) and for rows minted before the reshape. Written ONLY by create_guest / set_guest_display_name, never from the client; profanity and reserved names are checked app-side before the call.';

comment on column public.guests.verified_at is
  'When this guest proved an email (auth.users.email_confirmed_at at join). NULL = unverified, which is what the unverified mark renders from and what create_media refuses on a Require-verified-emails event.';

-- Backfill: every guest whose account carries a confirmed email is verified. WITHOUT THIS the new
-- create_media refusal below would stop the next upload of every existing guest on a
-- require-accounts event, which is precisely the production break an expand migration must not
-- cause. created_at (not now()) so the stamp reads as the join it was.
update public.guests g
   set verified_at = g.created_at
  from auth.users u
 where g.user_id = u.id
   and u.email_confirmed_at is not null
   and g.verified_at is null;

-- ★ NOT granted to `authenticated`, on purpose. SELECT on guests is column-scoped (QA #41), so a
-- new column is FAIL-CLOSED — invisible to the host over PostgREST — until it is named in a grant.
-- All three readers of this table use the service-role admin client, so nothing needs the grant;
-- leaving it off keeps the host's PostgREST view exactly (id, event_id, user_id, email, created_at)
-- and the capability token still unreachable. Wave 1 reads these two columns on the admin client.

-- =============================================================================================
-- 3. upload_forensics.guest_display_name — the typed name, denormalized at capture.
-- =============================================================================================
-- The forensic row denormalizes the uploader's identity AS IT STOOD at upload time (a later claim
-- must not rewrite history), and for a name-only guest the typed name IS the identity — without it
-- a lawful process response on the reshaped product records an uploader with no name at all.
-- Capture-only: deny-all + service-role, never product logic, never a host/guest surface.
alter table public.upload_forensics
  add column guest_display_name text;

comment on column public.upload_forensics.guest_display_name is
  'The guests.display_name as it stood at upload time (capture-only, the identity reshape 2026-09-21). NULL for a host upload, for a verified guest (the profile name is the identity) and for pre-reshape rows.';

-- =============================================================================================
-- 4. create_guest — the mint now carries an identity.
-- =============================================================================================
-- Signature CHANGE (a 4th parameter), so drop + create: PostgREST does not support overloads
-- (PGRST203), and leaving the 3-arg version beside this one would make every call ambiguous. The
-- new parameter DEFAULTS, so the old build's three named arguments still resolve during the deploy
-- window. Body carried verbatim from 20260729190000 except where a comment below says otherwise.
drop function public.create_guest(text, uuid, boolean);

create function public.create_guest(
  p_qr_token text,
  p_user_id uuid default null,
  p_unlock_proven boolean default false,
  p_display_name text default null
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

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    v_name,
    v_confirmed
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    -- Additive keys (the old build casts the payload and ignores them): the door needs to know
    -- which identity it just got without a second read.
    'display_name', v_name,
    'verified', (v_confirmed is not null)
  );
end;
$function$;

-- Service-role-only, as before (ADR-0016): the /api/guests route is the sole caller. The drop above
-- took the grant with it, so this is a restore, not a belt.
revoke execute on function public.create_guest(text, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text) to service_role;

-- =============================================================================================
-- 5. set_guest_display_name — naming a row that arrives without one, and renaming.
-- =============================================================================================
-- The second half of the name-only door: a guest who joined before the reshape, or before they
-- were asked, or who wants a different name. Service-role-only like every other guest WRITE
-- (ADR-0016, the 2026-06-08 pentest lesson: an anon EXECUTE grant IS the attack surface, not the
-- route wrapping it) — and here the route is load-bearing for a second reason, because PROFANITY
-- and the reserved-name list cannot be checked in SQL. The session token is the capability,
-- validated inside.
create function public.set_guest_display_name(
  p_session_token text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_name text;
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- A verified guest's name is their profile's. Refusing beats storing a second name that can
  -- disagree with it (the one precedence rule, again).
  if v_guest.verified_at is not null then
    raise exception 'Your name comes from your account.' using errcode = 'check_violation';
  end if;

  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  if v_name is null then
    raise exception 'Enter a name.' using errcode = 'check_violation';
  end if;
  if char_length(v_name) > 60 then
    raise exception 'That name is too long.' using errcode = 'check_violation';
  end if;

  update public.guests set display_name = v_name where id = v_guest.id;

  return jsonb_build_object('guest_id', v_guest.id, 'display_name', v_name);
end;
$$;

revoke execute on function public.set_guest_display_name(text, text) from public, anon, authenticated;
grant execute on function public.set_guest_display_name(text, text) to service_role;

-- =============================================================================================
-- 6. create_media — Require verified emails gates the UPLOAD, not only the join.
-- =============================================================================================
-- A session token minted before the host flipped the switch would otherwise upload forever. Body
-- carried verbatim from 20260729190000 (QA #17's `for update` lock and QA #1's preview-key binding
-- intact) with ONE new refusal, placed with the other event-state refusals.
create or replace function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null
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
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  if not v_event.accepting_uploads then
    raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
  end if;

  -- THE IDENTITY RESHAPE (2026-09-21): the switch gates every upload, so flipping it ON mid-party
  -- stops the next upload from a guest who never proved an email. ★ The wording opens with "not
  -- accepting uploads" DELIBERATELY: the shipped mapCheckViolation
  -- (src/lib/db/mutations/guest.ts) tests `not accepting` FIRST and maps it to `uploads_closed`,
  -- so the build on main refuses correctly through the whole deploy window. Wave 1 splits it into
  -- its own verification_required code; do not reword this string before that lands, and a Vitest
  -- guard pins the pair.
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

  -- Monthly ingress: Free = the static 20 GB meter; paid = 3x the effective storage cap
  -- (ADR-0021). NULL = unmetered (a paid profile with no cap on record fails open).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  if v_cap is not null then
    -- Recovery Phase 1: the cap reads ACTIVE bytes (host_active_bytes), NOT the physical
    -- storage_used_bytes — so removed/deleted media no longer counts and deleting frees room.
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status
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

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$$;

-- Re-assert the service-role-only posture (ADR-0016; MCP-applied SQL can inherit an anon grant).
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer) from public, anon, authenticated;

-- =============================================================================================
-- 7. get_upload_context — the presign/complete routes learn the gate and the guest's standing.
-- =============================================================================================
-- Two new keys so a request that arrives after a switch flip can be refused at presign with a
-- reason, rather than only at complete: `require_verified_email` (the event's gate) and
-- `guest_verified` (this session's standing). Same signature, same jsonb return, so the deployed
-- build ignores both during the window. Body from 20260729190000.
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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Already over the monthly ingress meter? (Free static / paid derived — ADR-0021.)
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video (authoritative gate is in create_media). The
  -- per-upload ceiling is the host cap clamped to the universal 10 GiB (never remaining bytes).
  -- QA #18: `visibility` lets the guest routes re-check the password/private lock per request.
  -- The identity reshape: `require_verified_email` + `guest_verified` let them re-check the
  -- identity gate the same way (create_media stays authoritative for both).
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'require_verified_email', v_event.require_verified_email,
    'guest_verified', (v_guest.verified_at is not null),
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free'),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes))
  );
end;
$$;

-- ⚠️ 0028 landmine: get_upload_context is one of the FIVE anon READ RPCs (the session token IS the
-- authorization, ADR-0004). Anon (guests) + authenticated (a logged-in host acting as a guest) may
-- call it — re-assert, do NOT service-role it. Expect it to remain in the anon advisor list.
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

-- =============================================================================================
-- 8. get_event_by_qr_token — the door needs to know which gate it is.
-- =============================================================================================
-- Returns BOTH flags: `allow_anonymous_uploads` (the deployed build reads it; the trigger keeps it
-- truthful) and `require_verified_email` (what wave 1's door reads). ★ A RETURNS TABLE cannot grow
-- under create-or-replace, so this is DROP + CREATE, which DROPS THE GRANT — the re-grant at the
-- bottom is what keeps this in the 0028 anon set. Body carried verbatim from 20260729180000 (QA
-- #40's redaction lateral intact) with the one added column; it is NOT redacted, exactly like the
-- flag beside it, because the lock screen and the entry sheet must render the right refusal.
drop function public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
   id uuid, name text, description text, moderation_mode public.moderation_mode,
   visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
   allow_anonymous_uploads boolean, require_verified_email boolean, event_date date,
   qr_style text, qr_token text, custom_slug text, host_display_name text)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.allow_anonymous_uploads, e.require_verified_email,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end
  from public.events e
  left join public.profiles p on p.id = e.host_id
  cross join lateral (
    select
      (e.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (e.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- =============================================================================================
-- 9. ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER the apply; nothing persists,
--    the block ends in a deliberate RAISE). Rides EXISTING rows and picks them itself, so there is
--    no placeholder to fill: an open test event and a confirmed account. Expect the last line to be
--    `ROLLED BACK — every identity-reshape contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_qr text;
--   v_uid uuid;
--   v_mint jsonb;
--   v_token text;
--   v_ctx jsonb;
--   v_guest public.guests;
--   v_res jsonb;
--   v_orphans bigint;
-- begin
--   select * into v_event from public.events
--    where visibility = 'open' and deleted_at is null order by created_at limit 1;
--   if v_event.id is null then raise exception 'FAIL: no open test event to ride'; end if;
--   v_qr := v_event.qr_token;
--
--   select p.id into v_uid from public.profiles p
--     join auth.users u on u.id = p.id
--    where u.email_confirmed_at is not null limit 1;
--   if v_uid is null then raise exception 'FAIL: no confirmed account to ride'; end if;
--
--   -- ── 1. the twin-keeper trigger, both directions ────────────────────────────────────────────
--   update public.events set allow_anonymous_uploads = true where id = v_event.id;
--   if (select require_verified_email from public.events where id = v_event.id) is not false then
--     raise exception 'FAIL: legacy write did not mirror into require_verified_email';
--   end if;
--   raise notice 'OK: allow_anonymous_uploads = true mirrored to require_verified_email = false';
--
--   update public.events set require_verified_email = true where id = v_event.id;
--   if (select allow_anonymous_uploads from public.events where id = v_event.id) is not false then
--     raise exception 'FAIL: new write did not mirror into allow_anonymous_uploads';
--   end if;
--   raise notice 'OK: require_verified_email = true mirrored to allow_anonymous_uploads = false';
--
--   -- Both moved in one statement, inconsistently: the NEW column wins.
--   update public.events set require_verified_email = false, allow_anonymous_uploads = false
--    where id = v_event.id;
--   if (select allow_anonymous_uploads from public.events where id = v_event.id) is not true then
--     raise exception 'FAIL: the new column did not win a contradictory write';
--   end if;
--   raise notice 'OK: a contradictory write resolves to the new column';
--
--   -- ── 2. create_guest on a Require-verified-emails event ─────────────────────────────────────
--   update public.events
--      set require_verified_email = true, accepting_uploads = true
--    where id = v_event.id;
--   begin
--     perform public.create_guest(v_qr, null, false, 'Anon Annie');
--     raise exception 'FAIL: unverified mint accepted on a require-verified event';
--   exception when check_violation then
--     raise notice 'OK: unverified mint refused on a require-verified event';
--   end;
--
--   -- A confirmed account mints, is stamped verified, and its typed name is NULLED.
--   v_mint := public.create_guest(v_qr, v_uid, false, 'Typed Over Profile');
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.verified_at is null then raise exception 'FAIL: verified_at not stamped'; end if;
--   if v_guest.display_name is not null then raise exception 'FAIL: the typed name was not nulled'; end if;
--   if (v_mint->>'verified')::boolean is not true then raise exception 'FAIL: mint payload not verified'; end if;
--   raise notice 'OK: a confirmed mint stamps verified_at and nulls the typed name';
--
--   -- ── 3. create_guest on a name-only event ───────────────────────────────────────────────────
--   update public.events set require_verified_email = false where id = v_event.id;
--
--   -- The OLD build's calling convention (three named args, no name): production survives.
--   v_mint := public.create_guest(p_qr_token := v_qr, p_user_id := null, p_unlock_proven := false);
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.display_name is not null or v_guest.verified_at is not null then
--     raise exception 'FAIL: the old 3-arg convention did not mint a plain anonymous row';
--   end if;
--   raise notice 'OK: the deployed 3-arg create_guest call still mints';
--   v_token := v_mint->>'session_token';
--
--   -- The new door: a typed name is stored, unverified.
--   v_mint := public.create_guest(v_qr, null, false, '  Maya J.  ');
--   select * into v_guest from public.guests where session_token = v_mint->>'session_token';
--   if v_guest.display_name is distinct from 'Maya J.' then
--     raise exception 'FAIL: the typed name was not trimmed and stored (%)', v_guest.display_name;
--   end if;
--   if v_guest.verified_at is not null then raise exception 'FAIL: a typed name was marked verified'; end if;
--   raise notice 'OK: a typed name is trimmed, stored and left unverified';
--
--   begin
--     perform public.create_guest(v_qr, null, false, repeat('x', 61));
--     raise exception 'FAIL: a 61-character name was accepted';
--   exception when check_violation then
--     raise notice 'OK: a 61-character name is refused (the DISPLAY_NAME_MAX_LENGTH belt)';
--   end;
--
--   -- ── 4. set_guest_display_name ──────────────────────────────────────────────────────────────
--   v_res := public.set_guest_display_name(v_token, '  Sam  ');
--   if v_res->>'display_name' is distinct from 'Sam' then raise exception 'FAIL: rename did not store Sam'; end if;
--   raise notice 'OK: an unnamed row can be named afterwards';
--
--   begin
--     perform public.set_guest_display_name(v_token, '   ');
--     raise exception 'FAIL: a blank name was accepted';
--   exception when check_violation then
--     raise notice 'OK: a blank name is refused';
--   end;
--
--   begin
--     perform public.set_guest_display_name('not-a-real-session-token', 'Ghost');
--     raise exception 'FAIL: an unknown session was accepted';
--   exception when no_data_found then
--     raise notice 'OK: an unknown session is refused';
--   end;
--
--   -- A verified guest cannot carry a second name.
--   update public.guests set verified_at = now() where session_token = v_token;
--   begin
--     perform public.set_guest_display_name(v_token, 'Second Identity');
--     raise exception 'FAIL: a verified guest was renamed';
--   exception when check_violation then
--     raise notice 'OK: a verified guest keeps the profile name';
--   end;
--   update public.guests set verified_at = null where session_token = v_token;
--
--   -- ── 5. create_media refuses an unverified guest after a flip ───────────────────────────────
--   update public.events set require_verified_email = true where id = v_event.id;
--   begin
--     perform public.create_media(
--       v_token, gen_random_uuid(), 'photo',
--       'events/' || v_event.id::text || '/original/contract-check.jpg', 1024);
--     raise exception 'FAIL: an unverified guest uploaded to a require-verified event';
--   exception when check_violation then
--     if position('not accepting' in lower(sqlerrm)) = 0 then
--       raise exception 'FAIL: the refusal no longer maps to uploads_closed (%)', sqlerrm;
--     end if;
--     raise notice 'OK: the post-flip upload is refused, wording maps to uploads_closed';
--   end;
--
--   -- ── 6. get_upload_context's two new keys ───────────────────────────────────────────────────
--   v_ctx := public.get_upload_context(v_token, 'photo');
--   if (v_ctx->>'require_verified_email')::boolean is not true then
--     raise exception 'FAIL: get_upload_context lost require_verified_email';
--   end if;
--   if (v_ctx->>'guest_verified')::boolean is not false then
--     raise exception 'FAIL: get_upload_context reports the wrong guest standing';
--   end if;
--   if v_ctx->>'visibility' is distinct from 'open' then
--     raise exception 'FAIL: get_upload_context lost visibility (QA #18)';
--   end if;
--   raise notice 'OK: get_upload_context carries visibility + both identity keys';
--
--   -- ── 7. get_event_by_qr_token returns BOTH flags ────────────────────────────────────────────
--   if not exists (
--     select 1 from public.get_event_by_qr_token(v_qr)
--      where require_verified_email is true and allow_anonymous_uploads is false
--   ) then
--     raise exception 'FAIL: get_event_by_qr_token does not return both flags';
--   end if;
--   raise notice 'OK: get_event_by_qr_token returns both flags';
--
--   -- ── 8. the grants ──────────────────────────────────────────────────────────────────────────
--   if not has_function_privilege('anon', 'public.get_upload_context(text, public.media_type)', 'execute')
--      or not has_function_privilege('anon', 'public.get_event_by_qr_token(text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_event_by_qr_token(text)', 'execute') then
--     raise exception 'FAIL: an anon READ RPC lost its EXECUTE grant (0028)';
--   end if;
--   if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean, text)', 'execute')
--      or has_function_privilege('anon', 'public.set_guest_display_name(text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.set_guest_display_name(text, text)', 'execute')
--      or has_function_privilege('anon', 'public.sync_event_verified_email_flags()', 'execute')
--      or has_function_privilege('authenticated', 'public.sync_event_verified_email_flags()', 'execute') then
--     raise exception 'FAIL: a service-role-only or trigger-only function is client-callable';
--   end if;
--   if not has_function_privilege('service_role', 'public.set_guest_display_name(text, text)', 'execute')
--      or not has_function_privilege('service_role', 'public.create_guest(text, uuid, boolean, text)', 'execute') then
--     raise exception 'FAIL: the server-mediated writes lost their service_role grant';
--   end if;
--   raise notice 'OK: every EXECUTE grant sits where database-security.md says';
--
--   -- ── 9. the column grants ───────────────────────────────────────────────────────────────────
--   if not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'insert') then
--     raise exception 'FAIL: the host cannot write the new switch';
--   end if;
--   if has_column_privilege('authenticated', 'public.guests', 'display_name', 'select')
--      or has_column_privilege('authenticated', 'public.guests', 'verified_at', 'select')
--      or has_column_privilege('authenticated', 'public.guests', 'session_token', 'select') then
--     raise exception 'FAIL: a guests column leaked into the host PostgREST view (QA #41)';
--   end if;
--   raise notice 'OK: the switch is host-writable, the guest columns stay fail-closed';
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
--   raise exception 'ROLLED BACK — every identity-reshape contract held';
-- end $$;
