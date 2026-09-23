-- Guest by upload, the EXPAND file (Will, 2026-09-22 evening; the lane `guest-by-upload`). Save dies
-- and "guest" gets one definition. His words: "the only way to be attached to an event as a guest
-- should be via upload. Password entry, veryify account, but no upload? Not listed as a guest. Delete
-- all of your uploads? Removed as a guest. Uploaded 1 photo? You're a guest." And on Require an upload
-- to view, his pick "OWN DELETES CLOSE IT": a guest's own deletes close the album again, while a
-- host's or the system's removal never re-closes it. And a profile's "guest at" line FOLLOWS THE
-- ALBUM: on an event set to Require an upload to view, only the host and signed-in people who have
-- passed that event's door see it.
--
-- The model these five bodies code to (docs/systems/guest-flow.md holds it as an invariant):
--   * A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden),
--     whoever removed it.
--   * What OTHER people see needs an APPROVED one: the guest list, every guest count, a profile's
--     "guest at" line. The account's OWN events list takes any live one.
--   * A `guests` row stays what it is, the device's upload ticket minted at the door; nothing reads a
--     row as attendance.
--
-- ★ FUNCTION BODIES ONLY. No signature, return type or payload key moves, so `src/lib/db/types.ts`
-- does not change and the builds already serving (main at milestone-26, and the launch-prep alias)
-- keep calling exactly what they call today. Each body below is carried VERBATIM from the migration
-- named at its section (the live `prosrc` md5 matched each of those files on 2026-09-23) and changed
-- ONLY where a ★ comment says so:
--   1. get_public_profile        (from 20260922200000) the attended arm follows the album's door.
--   2. get_upload_gate           (from 20260922003000) an upload the guest removed stops counting.
--   3. list_guest_rows_by_email  (from 20260922120000) the claim card skips a row with no live upload.
--   4. claim_guest_rows_by_email (from 20260922120000) Claim all (NULL) skips such a row too.
--   5. claim_anonymous_uploads   (from 20260922120000) the count it returns is the claimed rows that
--      carry a live upload (the claim itself is unchanged), so "we added your uploads" and the follow
--      moment are said only where a claim actually carried an upload.
--
-- WHAT THE RUNNING BUILDS SEE when this lands: main and the alias read the profile line, the gate,
-- the claim card and the claim's count through these same five calls, and every change narrows what
-- they return to the new rule (a line hidden from a viewer who has not passed the door, a door that
-- closes after a guest's own last delete, an empty row off the claim card, a toast only when an upload
-- moved). None of them errors.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) the drift check, read-only: each live body's
-- md5 equals its source file's (the lane measured, per `pg_proc.prosrc`):
--     get_public_profile(text)            89e22ba646a68f8d1da87bb2b58af263
--     get_upload_gate(uuid,text,uuid)     1c765eda24cd7340ac3662de41ffff55
--     list_guest_rows_by_email()          155796632404cc6d6cea3391b37b3062
--     claim_guest_rows_by_email(uuid[])   7e7d9523ff84836ba5ba7220a38bf3a2
--     claim_anonymous_uploads(text[])     9f9ed06c47c781339db3185178c65640
--   select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('get_public_profile', 'get_upload_gate',
--      'list_guest_rows_by_email', 'claim_guest_rows_by_email', 'claim_anonymous_uploads');
-- (2) apply verbatim; (3) get_advisors; (4) run the rolled-back contract check commented at the foot
-- (it rides "Ghost check (disposable)" and ends in a deliberate raise, so nothing persists).
--
-- EXPECTED ADVISOR DELTA: NONE. Every function is `create or replace` with an unchanged signature,
-- which keeps its ACL (the grants are re-stated below as the belt against the MCP anon-default
-- landmine, never as a change). 0028 stays the same FIVE with `get_public_profile` among them; 0029
-- keeps `list_guest_rows_by_email`, `claim_guest_rows_by_email` and `claim_anonymous_uploads`;
-- `get_upload_gate` stays in NEITHER list (service-role-only). No table is touched, and every function
-- keeps `search_path = ''`.

-- =============================================================================================
-- 1. get_public_profile — a profile's "guest at" line follows the album's Require an upload to view.
-- =============================================================================================
-- Body carried VERBATIM from 20260922200000 with ONE delta, marked in the attended arm (its old
-- comment about the opt-out table is reworded too, since the contract file after this one drops that
-- table). The album (`resolveGalleryDecision`, src/lib/events/gallery-access.ts) holds a viewer at the
-- teaser while uploads are open on a require-upload event until one upload of theirs has completed,
-- and the teaser never renders the Guests list; the attended arm is that list's reverse surface (QA
-- #36's principle: never disclose membership the album withholds from the same viewer), so it admits
-- the same viewers: the event's host, or a signed-in viewer whose own guest row there carries an upload
-- they did not remove themselves (the gate's own rule, section 2).
--
-- ★ DELIBERATELY STRICTER THAN THE ALBUM IN TWO CORNERS, NEVER LOOSER:
--   * a FULL album (storage or ingress cap reached) opens for its viewers, but this line stays hidden,
--     because the fail-open is about never holding a guest at a step they cannot pass, and nobody is
--     standing at a step here;
--   * a name-only uploader known only by a cookie (a session token, no account) passed the album's
--     door but is not recognised here: this function never sees a session token, only `auth.uid()`.
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
        -- ★ AND THE ALBUM'S UPLOAD DOOR (guest by upload, 2026-09-23; Will's "Follow the album"). On
        -- a Require-an-upload-to-view event whose uploads are open, the album holds every viewer at
        -- the teaser until an upload of theirs counts, so this line shows only to the host and to a
        -- signed-in viewer whose own guest row at this event carries an upload they did not remove
        -- themselves (get_upload_gate's rule, section 2). Uploads closed means the album's gate
        -- fails open, and so does this clause. An anonymous viewer has no `auth.uid()`, so the EXISTS
        -- finds nothing and the line stays hidden.
        and (
          not e.require_upload_to_view
          or not e.accepting_uploads
          or e.host_id = (select auth.uid())
          or exists (
            select 1
              from public.guests vg
              join public.media vm on vm.guest_id = vg.id
             where vg.event_id = e.id
               and vm.event_id = e.id
               and vg.user_id = (select auth.uid())
               and not (vm.status = 'removed' and vm.removed_by_uploader)
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
        -- NOTHING UNTIL CHOSEN (2026-09-22): the line appears only once its owner has put the event
        -- in their opt-in set. The opt-out table it replaced leaves with the saves in the contract
        -- file that follows this one. A choice survives the guest's last removal: the approved
        -- upload above hides the line meanwhile, and a later upload shows it again unasked.
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
-- 2. get_upload_gate — "OWN DELETES CLOSE IT": an upload the guest removed stops opening the door.
-- =============================================================================================
-- Body carried VERBATIM from 20260922003000 with ONE delta, marked in the contributed EXISTS. It
-- replaces the rule that file's header stated ("the ticket is punched once": any upload that ever
-- completed counted, whatever its status since). Will re-ruled the door on 2026-09-22: a guest who
-- uploads, looks and deletes has not contributed, so their own deletes close the album again. A
-- host's, an admin's or the system's removal still counts, because a door that re-closed on the
-- host's curation would leak that curation to the guest and hold them for a choice they did not make.
-- `removed_by_uploader` is exactly "the guest removed it themselves", a disown at the claim ticket's
-- Finish included (disown_guest_rows_by_email removes through the uploader path).
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
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
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

    v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
    if v_ingress_cap is not null then
      select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
    end if;

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  return jsonb_build_object(
    'contributed', v_contributed,
    'album_full', (v_at_storage_cap or v_at_monthly_cap),
    'event_gone', false
  );
end;
$$;

-- Service-role-only, as before: re-stated, not changed (`create or replace` kept the ACL). ★ An
-- MCP-applied function inherits an anon EXECUTE default grant that a bare `revoke ... from public`
-- does NOT remove, so every client role is named.
revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;

-- =============================================================================================
-- 3. list_guest_rows_by_email — the claim card lists only rows that would make a guest.
-- =============================================================================================
-- Body carried VERBATIM from 20260922120000 with ONE delta, marked in the WHERE. A row typed under
-- the caller's address with no live upload (a name typed at a door, then nothing added, or every
-- upload removed since) makes nobody a guest of anything, so claiming it would carry nothing and
-- releasing it would remove nothing: it has no place on the card. `create or replace` (the signature
-- and the RETURNS TABLE are unchanged) keeps the ACL, which is why this is not the drop-and-create
-- the original needed; migration-guards.test.ts pins the no-parameter signature in either form.
create or replace function public.list_guest_rows_by_email()
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
    -- ★ GUEST BY UPLOAD (2026-09-23), the one change to this body: a row with no live upload is
    -- nobody's attendance, so the card never offers it (an aggregate over no rows counts 0, never null).
    and m.n > 0
  order by coalesce(m.last_at, g.created_at) desc;
end;
$$;

revoke all on function public.list_guest_rows_by_email() from public, anon;
grant execute on function public.list_guest_rows_by_email() to authenticated;

-- =============================================================================================
-- 4. claim_guest_rows_by_email — Claim all carries the rows that make a guest, and no others.
-- =============================================================================================
-- Body carried VERBATIM from 20260922120000 with ONE delta, in two places, marked where it sits: the
-- NULL path ("Claim all", every row of mine) skips a row with no live upload, in the naming rule's
-- read and in the claim itself, so the card's shortcut claims exactly what the card listed (section
-- 3). A NAMED event set is unchanged: the card only names events it listed, and a second, empty row
-- at such an event (another device of the same guest) is claimed with it, harmlessly.
create or replace function public.claim_guest_rows_by_email(p_event_ids uuid[] default null)
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
      -- ★ GUEST BY UPLOAD (2026-09-23): the name comes only from a row this call will claim.
      and (p_event_ids is not null or exists (
        select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed'
      ))
    order by g.created_at desc
    limit 1;

    if v_name is not null then
      update public.profiles
         set display_name = v_name
       where id = v_uid and display_name is null;
    end if;
  end if;

  update public.guests g
     set user_id = v_uid,
         verified_at = now(),
         email = v_email,
         pending_email = null,
         pending_email_at = null,
         display_name = null
   where g.pending_email = lower(v_email)
     and g.user_id is null
     and g.verified_at is null
     and (p_event_ids is null or g.event_id = any(p_event_ids))
     -- ★ GUEST BY UPLOAD (2026-09-23), the one change to this body: Claim all takes only a row with
     -- a live upload, exactly the rows the card listed; an empty row keeps its address untouched.
     and (p_event_ids is not null or exists (
       select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed'
     ));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.claim_guest_rows_by_email(uuid[]) from public, anon;
grant execute on function public.claim_guest_rows_by_email(uuid[]) to authenticated;

-- =============================================================================================
-- 5. claim_anonymous_uploads — the count it returns is the claimed rows that carry an upload.
-- =============================================================================================
-- Body carried VERBATIM from 20260922120000 with ONE delta: what it RETURNS. The claim itself is
-- unchanged, both arms, row for row (every still-unclaimed row this browser holds a token for is
-- stamped, an empty one included, so that device's next upload is the account's). The integer it
-- hands back used to count every stamped row; it now counts only the stamped rows that carry a live
-- upload, because every reader of that number says "uploads": the (app) layout's "We added your
-- uploads to your account.", and the album page, which plays the follow moment ("Your photos are
-- safe") only when its own event's rows moved. A row with nothing on it makes nobody a guest, so
-- claiming one is not news. The same `integer`, so the signature, the grants and both deployed builds'
-- calls are untouched (their toast simply stops firing for a claim that carried nothing).
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

    -- ★ GUEST BY UPLOAD (2026-09-23): the stamp is unchanged; the count is of stamped rows that
    -- carry a live upload (the RETURNING ids, then one EXISTS each).
    with claimed as (
      update public.guests
         set user_id = v_uid,
             verified_at = now(),
             email = v_email,
             pending_email = null,
             pending_email_at = null,
             display_name = null
       where session_token = any (p_session_tokens)
         and user_id is null
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  else
    -- Unchanged from 20260609120000: an unconfirmed session stamps ownership and nothing else.
    -- ★ Counted the same way as the arm above (GUEST BY UPLOAD, 2026-09-23).
    with claimed as (
      update public.guests
         set user_id = v_uid
       where session_token = any (p_session_tokens)
         and user_id is null
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  end if;

  return coalesce(v_count, 0);
end;
$$;

-- `create or replace` preserves the existing ACL, so these two lines restate the end state rather
-- than change it. They are a BELT against the MCP default-grant landmine (database-security.md):
-- if this function is ever dropped and recreated instead, the anon EXECUTE default comes back.
revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;
grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;

-- =============================================================================================
-- 6. ROLLED-BACK CONTRACT CHECK (run via execute_sql AFTER the apply; nothing persists: the block
--    ends in a deliberate RAISE, so its own transaction and every fixture in it roll back). It rides
--    the disposable event "Ghost check (disposable)" (else any open event), flips that event's
--    switches inside the transaction, and makes its own people: disposable auth.users rows whose
--    profiles the signup trigger creates inside the same transaction. Expect the last line to be
--    `ROLLED BACK — every guest-by-upload contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_tag text := 'gbu-' || substr(md5(random()::text), 1, 8);
--   v_attendee uuid := gen_random_uuid();  -- the profile whose "guest at" line is read
--   v_passed uuid := gen_random_uuid();    -- a viewer whose own upload stands
--   v_self uuid := gen_random_uuid();      -- a viewer who removed their only upload themselves
--   v_hosted uuid := gen_random_uuid();    -- a viewer whose only upload the HOST removed
--   v_never uuid := gen_random_uuid();     -- a signed-in viewer who never uploaded
--   v_claimer uuid := gen_random_uuid();   -- a confirmed account with rows typed under its address
--   v_mint jsonb;
--   v_guest uuid;
--   v_media uuid;
--   v_tok_live text;
--   v_tok_empty text;
--   v_row_live uuid;
--   v_row_empty uuid;
--   v_attended jsonb;
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
--     (v_attendee, 'authenticated', 'authenticated', v_tag || '-attendee@example.com', now()),
--     (v_passed,   'authenticated', 'authenticated', v_tag || '-passed@example.com', now()),
--     (v_self,     'authenticated', 'authenticated', v_tag || '-self@example.com', now()),
--     (v_hosted,   'authenticated', 'authenticated', v_tag || '-hosted@example.com', now()),
--     (v_never,    'authenticated', 'authenticated', v_tag || '-never@example.com', now()),
--     (v_claimer,  'authenticated', 'authenticated', v_tag || '-claimer@example.com', now());
--   update public.profiles set slug = v_tag where id = v_attendee;
--
--   -- The event: names mode (so the verified-email gate is out of the way), the guest list on,
--   -- Require an upload to view ON, uploads OPEN.
--   update public.events
--      set visibility = 'open', require_verified_email = false, show_guest_list = true,
--          require_upload_to_view = true, accepting_uploads = true
--    where id = v_event.id;
--
--   -- The attendee: a verified row with an approved upload, chosen to show on their profile.
--   v_mint := public.create_guest(v_event.qr_token, v_attendee, false, null, null);
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (gen_random_uuid(), v_event.id, (v_mint->>'guest_id')::uuid, 'photo',
--           'events/' || v_event.id::text || '/original/' || v_tag || '-attendee.jpg', 1024, 'approved');
--   insert into public.profile_shown_events (user_id, event_id) values (v_attendee, v_event.id);
--
--   -- PASSED: an approved upload of their own. SELF: one they removed themselves. HOSTED: one the
--   -- host removed (uploader flag false). NEVER: no row at all.
--   v_mint := public.create_guest(v_event.qr_token, v_passed, false, null, null);
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (gen_random_uuid(), v_event.id, (v_mint->>'guest_id')::uuid, 'photo',
--           'events/' || v_event.id::text || '/original/' || v_tag || '-passed.jpg', 1024, 'approved');
--
--   v_mint := public.create_guest(v_event.qr_token, v_self, false, null, null);
--   v_media := gen_random_uuid();
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (v_media, v_event.id, (v_mint->>'guest_id')::uuid, 'photo',
--           'events/' || v_event.id::text || '/original/' || v_tag || '-self.jpg', 1024, 'approved');
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true
--    where id = v_media;
--
--   v_mint := public.create_guest(v_event.qr_token, v_hosted, false, null, null);
--   v_media := gen_random_uuid();
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (v_media, v_event.id, (v_mint->>'guest_id')::uuid, 'photo',
--           'events/' || v_event.id::text || '/original/' || v_tag || '-hosted.jpg', 1024, 'approved');
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = false
--    where id = v_media;
--
--   -- ── 1. get_upload_gate: own deletes close it; a host's removal never does ─────────────────────
--   if not (public.get_upload_gate(v_event.id, null, v_passed)->>'contributed')::boolean then
--     raise exception 'FAIL: a standing upload does not open the door';
--   end if;
--   if (public.get_upload_gate(v_event.id, null, v_self)->>'contributed')::boolean then
--     raise exception 'FAIL: an upload the guest removed themselves still opens the door';
--   end if;
--   if not (public.get_upload_gate(v_event.id, null, v_hosted)->>'contributed')::boolean then
--     raise exception 'FAIL: the host''s removal re-closed the guest''s door';
--   end if;
--   update public.media set status = 'hidden', removed_at = null
--    where guest_id = (select id from public.guests where event_id = v_event.id and user_id = v_passed);
--   if not (public.get_upload_gate(v_event.id, null, v_passed)->>'contributed')::boolean then
--     raise exception 'FAIL: a hidden upload stopped opening the door';
--   end if;
--   update public.media set status = 'approved'
--    where guest_id = (select id from public.guests where event_id = v_event.id and user_id = v_passed);
--   raise notice 'OK: own deletes close the door; hidden and host-removed uploads keep it open';
--
--   -- ── 2. the attended line follows the album ─────────────────────────────────────────────────
--   perform set_config('request.jwt.claims', '', true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id)) then
--     raise exception 'FAIL: an anonymous viewer saw the line on a require-upload event';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_never::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id)) then
--     raise exception 'FAIL: a viewer who never uploaded saw the line';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_self::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id)) then
--     raise exception 'FAIL: a viewer whose only upload they removed themselves saw the line';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_passed::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: a viewer who passed the door was refused the line';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_hosted::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: a viewer whose upload the host removed was refused the line';
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_event.host_id::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: the event''s host was refused the line';
--   end if;
--   update public.events set accepting_uploads = false where id = v_event.id;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_never::text, 'role', 'authenticated')::text, true);
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: with uploads closed the line stayed hidden (the album fails open there)';
--   end if;
--   update public.events set accepting_uploads = true, require_upload_to_view = false where id = v_event.id;
--   v_attended := public.get_public_profile(v_tag)->'attended_events';
--   if not (v_attended @> jsonb_build_array(jsonb_build_object('id', v_event.id))) then
--     raise exception 'FAIL: with the switch off the line stopped showing';
--   end if;
--   update public.events set require_upload_to_view = true where id = v_event.id;
--   perform set_config('request.jwt.claims', '', true);
--   raise notice 'OK: the attended line follows the album (host, passed and host-removed in; anonymous, never and self-removed out; closed uploads and the switch off open it)';
--
--   -- ── 3. the claim card and Claim all skip a row with no live upload ─────────────────────────
--   -- Two rows typed under the claimer's address on this names-mode event: one with an upload, one
--   -- empty. Both carry a session token (so the token claim can be read too, in section 4).
--   v_mint := public.create_guest(v_event.qr_token, null, false, 'Live Row', v_tag || '-claimer@example.com');
--   v_row_live := (v_mint->>'guest_id')::uuid;
--   v_tok_live := v_mint->>'session_token';
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   values (gen_random_uuid(), v_event.id, v_row_live, 'photo',
--           'events/' || v_event.id::text || '/original/' || v_tag || '-live.jpg', 1024, 'approved');
--   v_mint := public.create_guest(v_event.qr_token, null, false, 'Empty Row', v_tag || '-claimer@example.com');
--   v_row_empty := (v_mint->>'guest_id')::uuid;
--   v_tok_empty := v_mint->>'session_token';
--
--   perform set_config('request.jwt.claims', json_build_object('sub', v_claimer::text, 'role', 'authenticated')::text, true);
--   select count(*) into v_n from public.list_guest_rows_by_email();
--   if v_n <> 1 or not exists (select 1 from public.list_guest_rows_by_email() where guest_id = v_row_live) then
--     raise exception 'FAIL: the claim card lists % rows (want only the row with an upload)', v_n;
--   end if;
--   v_n := public.claim_guest_rows_by_email(null);
--   if v_n <> 1 then raise exception 'FAIL: Claim all claimed % rows (want 1)', v_n; end if;
--   if not exists (select 1 from public.guests where id = v_row_live and user_id = v_claimer and verified_at is not null) then
--     raise exception 'FAIL: Claim all did not stamp the row with an upload';
--   end if;
--   if not exists (select 1 from public.guests where id = v_row_empty and user_id is null
--                   and pending_email = v_tag || '-claimer@example.com') then
--     raise exception 'FAIL: Claim all touched the empty row';
--   end if;
--   raise notice 'OK: the card and Claim all skip the empty row, and leave it untouched';
--
--   -- ── 4. the token claim stamps every row and COUNTS only the ones with a live upload ──────────
--   -- Hand the live row back to the device (as if never claimed) and add the empty one beside it.
--   update public.guests set user_id = null, verified_at = null where id = v_row_live;
--   v_n := public.claim_anonymous_uploads(array[v_tok_live, v_tok_empty]);
--   if v_n <> 1 then raise exception 'FAIL: the token claim counted % rows (want the 1 with an upload)', v_n; end if;
--   if (select count(*) from public.guests where id in (v_row_live, v_row_empty) and user_id = v_claimer) <> 2 then
--     raise exception 'FAIL: the token claim did not stamp both rows';
--   end if;
--   update public.guests set user_id = null, verified_at = null where id in (v_row_live, v_row_empty);
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true where guest_id = v_row_live;
--   v_n := public.claim_anonymous_uploads(array[v_tok_live, v_tok_empty]);
--   if v_n <> 0 then raise exception 'FAIL: a claim that carried only removed uploads counted % rows', v_n; end if;
--   perform set_config('request.jwt.claims', '', true);
--   raise notice 'OK: the token claim stamps every row and counts only rows with a live upload';
--
--   -- ── 5. the grants sit where database-security.md says ─────────────────────────────────────
--   if has_function_privilege('anon', 'public.get_upload_gate(uuid, text, uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.get_upload_gate(uuid, text, uuid)', 'execute')
--      or not has_function_privilege('service_role', 'public.get_upload_gate(uuid, text, uuid)', 'execute')
--      or not has_function_privilege('anon', 'public.get_public_profile(text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_public_profile(text)', 'execute')
--      or has_function_privilege('anon', 'public.list_guest_rows_by_email()', 'execute')
--      or not has_function_privilege('authenticated', 'public.list_guest_rows_by_email()', 'execute')
--      or has_function_privilege('anon', 'public.claim_guest_rows_by_email(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.claim_guest_rows_by_email(uuid[])', 'execute')
--      or has_function_privilege('anon', 'public.claim_anonymous_uploads(text[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.claim_anonymous_uploads(text[])', 'execute') then
--     raise exception 'FAIL: an EXECUTE grant moved';
--   end if;
--   raise notice 'OK: the grants sit where database-security.md says';
--
--   raise exception 'ROLLED BACK — every guest-by-upload contract held';
-- end $$;
