-- The identity SQL gaps: two leaks against Will's guest-identity ruling (2026-09-22; the rule lives
-- in docs/systems/guest-flow.md "Joining + identity" and database-security.md's TWO EMAIL COLUMNS
-- landmine), closed in SQL. A guest is a typed name ("Unverified"), a typed name with an address
-- nobody proved (`guests.pending_email`, never shown to the host), or a confirmed account; the host
-- sees a badge, never an unproven address.
--
--   GAP 1. `create_guest` copied the minting session's auth.users address into `guests.email` even
--          when `email_confirmed_at` was null, so an UNCONFIRMED sign-up's join on a names-mode event
--          stored an address nobody proved, and `email` sat inside the host's column-scoped SELECT
--          grant, readable over PostgREST. Closed three ways: the mint keeps the address only beside
--          a confirmation (1), existing rows lose an address no account ever confirmed (2), and the
--          host's grant loses the column (3).
--   GAP 2. `get_public_profile`'s attended arm admitted ANY signed-in viewer to a
--          Require-verified-emails event's attendance, where the album itself holds a viewer with no
--          confirmed email at the teaser, which never renders the Guests list. The arm now applies
--          the album's own gate (4).
--
-- ★ PRODUCTION SURVIVES IT UNCHANGED IN SHAPE. No signature, return type or payload key moves:
-- `create_guest` keeps its five parameters and its jsonb keys, `get_public_profile` its one parameter
-- and its payload, so the build on main (milestone-26) and the alias keep calling exactly what they
-- call today. The grant change removes a column NOTHING authenticated reads on either codebase (the
-- audit is at section 3). `src/lib/db/types.ts` does not change: the generator sees no column,
-- signature or return type move, and column privileges are invisible to it.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) diff both replaced bodies against live
-- `pg_get_functiondef` first: `create_guest` is carried verbatim from 20260922120000 and
-- `get_public_profile` from 20260922122000, each changed ONLY where a comment says so; (2) apply
-- verbatim; (3) get_advisors; (4) run the rolled-back contract check commented at the foot (it rides
-- the disposable fixtures it creates inside its own transaction and ends in a deliberate raise).
--
-- EXPECTED ADVISOR DELTA: NONE. No function is created or dropped (both are `create or replace`
-- with an unchanged signature, which keeps the ACL; the grants are re-stated below as the belt
-- against the MCP anon-default landmine, never as a change). 0028 stays the same FIVE with
-- `get_public_profile` among them; 0029 is untouched; `create_guest` stays in NEITHER list
-- (service-role-only). No table is created, so rls_enabled_no_policy is unchanged; every function
-- keeps `search_path = ''`.

-- =============================================================================================
-- 1. create_guest — the address is kept only beside the confirmation that proves it.
-- =============================================================================================
-- Same signature, same return, so `create or replace` (no drop: the ACL survives, and PostgREST
-- sees no new overload). Body carried VERBATIM from 20260922120000 with ONE change, marked where it
-- sits. The unconfirmed session's row keeps everything it had: its `user_id` (the account's own
-- "mine" and remove reads key on it), its typed name and its typed pending address. It loses only
-- the unproved auth.users address in `email`, whose one meaning is "confirmed".
create or replace function public.create_guest(
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

  -- ★ THE IDENTITY SQL GAPS (2026-09-22), the one change to this body: ONLY A CONFIRMED ADDRESS
  -- REACHES `guests.email`. An unconfirmed session (a real user id, an address nobody has proved)
  -- used to copy that address in here on a names-mode event, where it sat inside the host's SELECT
  -- grant. `email` means "confirmed" to every reader (the uploader resolver, the forensic
  -- `guest_email`), and `verified_at` is stamped from the same `v_confirmed` below, so the two now
  -- arrive together or not at all from this mint.
  if v_confirmed is null then
    v_email := null;
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

-- Service-role-only, as before (ADR-0016): the /api/guests route is the sole caller. `create or
-- replace` kept the ACL, so these two lines restate the end state; they are the belt against the
-- MCP anon-default landmine should this function ever be dropped and recreated instead.
revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 2. The existing rows: an address NO ACCOUNT EVER CONFIRMED leaves `guests.email`.
-- =============================================================================================
-- How `verified_at` came to be set on rows older than the identity round: it did not exist at their
-- mint. 20260921150000 backfilled it (verified_at = created_at) for every row whose `user_id`
-- account carried a confirmed email AT THE BACKFILL, and 20260922120000 re-ran that rule once. So an
-- old row with `verified_at` null is a row whose account was unconfirmed at both backfills, or a
-- row with no account at all, and its `email` (if any) came from one of two writers:
--   * `create_guest` under an unconfirmed session: GAP 1's residue, an address nobody proved;
--   * `capture_guest_email` (the newsletter opt-in), which fills an EMPTY `email` by session token.
--     Its route now requires `email_confirmed_at`, so what it wrote since is a confirmed address;
--     before 20260608230000 it was anon-callable with a CLIENT-typed address, which may be one
--     nobody ever proved.
-- The rule below is therefore the address itself, never the row's flag alone: an address that some
-- account has CONFIRMED stays (it was proved, whoever holds the row), and one that no account ever
-- confirmed goes. A verified row is left alone: every writer that stamps `verified_at` writes the
-- confirmed auth.users address beside it, and the backfills stamped only rows whose own account was
-- confirmed. Measured read-only on the live project before this file was written: 34 guest rows,
-- 4 carrying an address (each verified, each its own confirmed account's), so this statement moves
-- ZERO rows today; it is here for any row minted between that reading and the apply.
update public.guests g
   set email = null
 where g.email is not null
   and g.verified_at is null
   and not exists (
     select 1
       from auth.users u
      where u.email_confirmed_at is not null
        and lower(btrim(u.email)) = lower(btrim(g.email))
   );

-- =============================================================================================
-- 3. The host's PostgREST view of guests loses `email`.
-- =============================================================================================
-- The QA #41 grant (20260729180000) left the host `(id, event_id, user_id, email, created_at)` over
-- their own events' rows. AUDITED ON BOTH DEPLOYED CODEBASES (launch-prep at this lane's cut and main
-- at milestone-26): every read of `guests` (five `.from("guests")` calls on launch-prep, three on
-- main, and the media -> guests embed in `getUploaderIdentities` on each) runs on the SERVICE-ROLE
-- admin client, which keeps its own grant; no RLS policy, view, publication or SECURITY INVOKER
-- function reads the column, and no RPC returns it. Nothing host-facing selects `email`, so the
-- column leaves the grant: the narrower the host's view the better (the guest list and the credit
-- already run on the admin client).
--
-- The QA #41 shape, deliberately: revoke the TABLE-level SELECT first (it cascades to every column
-- grant, so no stale one survives), then re-grant the WHOLE allowlist in one place. Never a bare
-- column revoke (a silent no-op should a table grant ever stand beside it), and never a table revoke
-- without the full re-grant (the cascade would take `id`, `event_id`, `user_id` and `created_at`
-- too). A new column stays FAIL-CLOSED, as before.
revoke select on public.guests from public, anon, authenticated;
grant select (id, event_id, user_id, created_at) on public.guests to authenticated;

-- =============================================================================================
-- 4. get_public_profile — the attended arm applies the album's own confirmed-email gate.
-- =============================================================================================
-- Body carried VERBATIM from 20260922122000 with ONE delta, marked in the attended arm. The album
-- (`resolveGalleryDecision`, src/lib/events/gallery-access.ts) answers the owner `full` first, then
-- holds anyone WITHOUT A CONFIRMED EMAIL at the teaser on a Require-verified-emails event (the page's
-- `isAuthed` is exactly `user.email_confirmed_at`), and the teaser never renders the Guests list.
-- The QA #36 clause stays exactly as written (a guard pins it, and the twin trigger keeps its legacy
-- flag truthful); the new gate beside it is keyed on `require_verified_email`, since nothing new
-- keys on the legacy twin, and under that trigger it IMPLIES the old clause, so the legacy column's
-- drop deletes the old clause rather than re-pointing it.
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'display_name', p.display_name,
    'bio', p.bio,
    'avatar_updated_at', p.avatar_updated_at,
    'created_at', p.created_at,
    'hosted_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date,
               'visibility', e.visibility,
               'qr_token', e.qr_token,
               'custom_slug', e.custom_slug
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.host_id = p.id
        and e.display_in_profile
        and e.deleted_at is null
    ), '[]'::jsonb),
    'attended_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.deleted_at is null
        and e.show_guest_list
        -- open-only: gated (password/private) events never leak name/date or
        -- attendance to anonymous profile viewers.
        and e.visibility = 'open'
        -- QA #36: open BUT account-required resolves to `teaser` for an anonymous viewer, and the
        -- album hides its Guests section below `full`. Mirror that here so this reverse surface
        -- never discloses membership the album itself withholds from the same viewer.
        and (e.allow_anonymous_uploads or (select auth.uid()) is not null)
        -- ★ THE ALBUM'S OWN GATE (the identity SQL gaps, 2026-09-22), the one change to this body.
        -- The clause above admits ANY signed-in viewer; the album admits, on a Require-verified-
        -- emails event, only its host (owner -> full) or a viewer whose email is CONFIRMED. An
        -- unconfirmed sign-up stands at the teaser there, so it learns nothing of the list here.
        -- The EXISTS names no event column, so it is planned once per call, not once per event.
        and (
          not e.require_verified_email
          or e.host_id = (select auth.uid())
          or exists (
            select 1
              from auth.users u
             where u.id = (select auth.uid())
               and u.email_confirmed_at is not null
          )
        )
        and e.host_id <> p.id
        and exists (
          select 1
          from public.guests g
          join public.media m on m.guest_id = g.id and m.status = 'approved'
          where g.event_id = e.id and g.user_id = p.id
            -- THE BELT (2026-09-22): only a PROVED identity attends in public. A row at level 1
            -- (a typed name) or level 2 (a typed, unproved address) never appears here, so an
            -- impersonator's uploads can never be published under someone's profile.
            and g.verified_at is not null
        )
        -- NOTHING UNTIL CHOSEN (2026-09-22): the opt-OUT becomes an opt-IN. This replaced a
        -- `not exists (... profile_hidden_events ...)` clause; that table is still read and written
        -- by the deployed build, so it survives until a later migration retires it.
        and exists (
          select 1 from public.profile_shown_events s
          where s.user_id = p.id and s.event_id = e.id
        )
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.slug is not null
    and p.slug = lower(trim(p_slug));
$$;

-- Re-stated, not changed: `create or replace` preserves the ACL, and these two lines are what a
-- future drop-and-recreate would otherwise lose (the MCP anon default-grant landmine cuts both ways).
-- get_public_profile is one of the five accepted 0028 anon reads: /u/[slug] is logged-out visible.
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- 5. ROLLED-BACK CONTRACT CHECK (run via execute_sql AFTER the apply; nothing persists: the block
--    ends in a deliberate RAISE, so its own transaction and every fixture in it roll back). It rides
--    the disposable event "Ghost check (disposable)" when it exists, else any open event, and makes
--    its own people: three disposable auth.users rows (an attendee, a confirmed viewer, an
--    UNCONFIRMED one) whose profiles the signup trigger creates inside the same transaction. Expect
--    the last line to be `ROLLED BACK — every identity-sql-gaps contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_attendee uuid := gen_random_uuid();
--   v_viewer uuid := gen_random_uuid();
--   v_unconfirmed uuid := gen_random_uuid();
--   v_slug text := 'sqlgaps-' || substr(md5(random()::text), 1, 8);
--   v_mint jsonb;
--   v_guest public.guests;
--   v_attended jsonb;
--   v_denied boolean;
--   v_n integer;
-- begin
--   select * into v_event from public.events
--    where name = 'Ghost check (disposable)' and deleted_at is null;
--   if v_event.id is null then
--     select * into v_event from public.events
--      where visibility = 'open' and deleted_at is null order by created_at limit 1;
--   end if;
--   if v_event.id is null then raise exception 'FAIL: no open event to ride'; end if;
--
--   insert into auth.users (id, aud, role, email, email_confirmed_at) values
--     (v_attendee, 'authenticated', 'authenticated', v_slug || '-attendee@example.com', now()),
--     (v_viewer, 'authenticated', 'authenticated', v_slug || '-viewer@example.com', now()),
--     (v_unconfirmed, 'authenticated', 'authenticated', v_slug || '-unconfirmed@example.com', null);
--   update public.profiles set slug = v_slug where id = v_attendee;
--
--   -- ── 1. create_guest: an unconfirmed session's mint stores NO address; a confirmed one does ───
--   update public.events
--      set require_verified_email = false, accepting_uploads = true, visibility = 'open'
--    where id = v_event.id;
--   v_mint := public.create_guest(v_event.qr_token, v_unconfirmed, false, 'Typed Name', null);
--   select * into v_guest from public.guests where id = (v_mint->>'guest_id')::uuid;
--   if v_guest.email is not null then
--     raise exception 'FAIL: an unconfirmed session''s mint stored its unproved address';
--   end if;
--   if v_guest.user_id is distinct from v_unconfirmed or v_guest.verified_at is not null
--      or v_guest.display_name is distinct from 'Typed Name' then
--     raise exception 'FAIL: the unconfirmed mint lost its user_id, its typed name or its standing';
--   end if;
--   raise notice 'OK: an unconfirmed mint keeps its user_id and typed name, and no address';
--
--   v_mint := public.create_guest(v_event.qr_token, v_viewer, false, null, null);
--   select * into v_guest from public.guests where id = (v_mint->>'guest_id')::uuid;
--   if v_guest.email is distinct from v_slug || '-viewer@example.com' or v_guest.verified_at is null then
--     raise exception 'FAIL: a confirmed mint lost its proved address or its verified_at';
--   end if;
--   raise notice 'OK: a confirmed mint keeps its proved address beside verified_at';
--
--   -- ── 2. the host reads guests over PostgREST: email refused, the rest still served ────────────
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_event.host_id::text, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform g.email from public.guests g where g.event_id = v_event.id;
--     v_denied := false;
--   exception when insufficient_privilege then
--     v_denied := true;
--   end;
--   select count(*) into v_n from public.guests g where g.event_id = v_event.id;
--   reset role;
--   if not v_denied then raise exception 'FAIL: the host can still read guests.email'; end if;
--   if v_n < 2 then raise exception 'FAIL: the host lost its (id, event_id, user_id, created_at) read'; end if;
--   raise notice 'OK: the host''s email read is refused and its narrowed read still serves';
--
--   -- ── 3. the attended arm on a Require-verified-emails event ───────────────────────────────────
--   update public.events
--      set require_verified_email = true, show_guest_list = true
--    where id = v_event.id;
--   v_mint := public.create_guest(v_event.qr_token, v_attendee, false, null, null);
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (gen_random_uuid(), v_event.id, (v_mint->>'guest_id')::uuid, 'photo',
--           'events/' || v_event.id::text || '/original/sqlgaps-check.jpg', 1024, 'approved');
--   insert into public.profile_shown_events (user_id, event_id) values (v_attendee, v_event.id);
--
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_unconfirmed::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id)) then
--     raise exception 'FAIL: an unconfirmed viewer learned a verified-required event''s attendance';
--   end if;
--   raise notice 'OK: a signed-in UNCONFIRMED viewer is refused, as the album refuses them';
--
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_viewer::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: a confirmed viewer was refused';
--   end if;
--   raise notice 'OK: a confirmed viewer is admitted';
--
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_event.host_id::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: the event''s host was refused';
--   end if;
--   raise notice 'OK: the event''s host is admitted';
--
--   -- The host arm stands on its own, as the album's owner check does: hand the event to the
--   -- UNCONFIRMED account for one read, and it is admitted as the host where it was refused as a
--   -- viewer a moment ago.
--   update public.events set host_id = v_unconfirmed where id = v_event.id;
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_unconfirmed::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: an unconfirmed HOST was refused its own event''s line';
--   end if;
--   update public.events set host_id = v_event.host_id where id = v_event.id;
--   raise notice 'OK: the host arm admits the event''s own host, confirmed or not';
--
--   perform set_config('request.jwt.claims', '', true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id)) then
--     raise exception 'FAIL: an anonymous viewer learned a verified-required event''s attendance';
--   end if;
--   raise notice 'OK: an anonymous viewer is refused (QA #36, unchanged)';
--
--   update public.events set require_verified_email = false where id = v_event.id;
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_unconfirmed::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_slug)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: a names-mode event stopped listing for a signed-in viewer';
--   end if;
--   perform set_config('request.jwt.claims', '', true);
--   raise notice 'OK: a names-mode event lists as before';
--
--   -- ── 4. the grants sit where database-security.md says ────────────────────────────────────────
--   if has_column_privilege('authenticated', 'public.guests', 'email', 'select')
--      or has_column_privilege('anon', 'public.guests', 'email', 'select') then
--     raise exception 'FAIL: guests.email is still in a client SELECT grant';
--   end if;
--   if not (has_column_privilege('authenticated', 'public.guests', 'id', 'select')
--           and has_column_privilege('authenticated', 'public.guests', 'event_id', 'select')
--           and has_column_privilege('authenticated', 'public.guests', 'user_id', 'select')
--           and has_column_privilege('authenticated', 'public.guests', 'created_at', 'select')) then
--     raise exception 'FAIL: the table revoke took a column the re-grant should have restored';
--   end if;
--   if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or not has_function_privilege('service_role', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or not has_function_privilege('anon', 'public.get_public_profile(text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_public_profile(text)', 'execute') then
--     raise exception 'FAIL: an EXECUTE grant moved';
--   end if;
--   raise notice 'OK: the grants sit where database-security.md says';
--
--   raise exception 'ROLLED BACK — every identity-sql-gaps contract held';
-- end $$;
