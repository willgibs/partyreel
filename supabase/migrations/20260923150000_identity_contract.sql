-- =============================================================================================
-- The identity round's CONTRACT (the identity reshape of 2026-09-21, finished; lane
-- `guest-followons`). The reshape landed Require verified emails BESIDE its legacy twin,
-- `events.allow_anonymous_uploads`, kept exactly opposite by a trigger so the build on partyreel.com
-- kept reading a truthful flag. Nothing in the app reads or writes the twin any more, so it goes:
--
--   1. get_public_profile   (from 20260923120000) the attended arm's QA #36 clause, written on the
--                           legacy flag, leaves; the confirmed-viewer gate beside it implies it.
--                           `create or replace`, same signature and payload (the ACL is kept).
--   2. get_event_by_qr_token (from 20260922003000) dropped and recreated WITHOUT the legacy column
--                           (a RETURNS TABLE cannot shrink under create-or-replace); the redaction,
--                           `require_verified_email` and `require_upload_to_view` carried verbatim;
--                           grants re-stated (the drop takes them).
--   3. create_guest         (from 20260922200000) raises "Add your name to upload." on a nameless
--                           mint by an unconfirmed caller; `create or replace`, same signature.
--   4. The twin-keeper: the `events_sync_verified_email_flags` trigger, then its function.
--   5. The column: `events.allow_anonymous_uploads` (its column grants go with it).
-- Functions first, so no body is ever left reading a column that is gone. No CASCADE anywhere:
-- measured on the live schema (2026-09-23), the only objects that name the column are the two
-- functions replaced above, the trigger function dropped in (4), and the column's own default.
--
-- ★ APPLY ORDER: ONLY AFTER MILESTONE 27 HAS SHIPPED THIS TREE TO partyreel.com. The milestone-26
-- build (main at `df173c2e`) predates the reshape: it keys the guest page's account gate on
-- `allow_anonymous_uploads` (read off get_event_by_qr_token), creates events naming it, and saves
-- event settings naming it. Against this file that build would gate EVERY signed-out guest at the
-- teaser (a missing flag reads as "accounts required"), and its event create and settings save
-- would fail on a column that no longer exists. The launch-prep alias and milestone 27 read and
-- write neither the column nor the trigger (their code names only `require_verified_email`), and
-- their join route already refuses a nameless join with its own 422, so the new raise changes
-- nothing they do. After the apply, regenerate `src/lib/db/types.ts`: the `events` row and
-- get_event_by_qr_token's return lose `allow_anonymous_uploads`, which no code reads.
--
-- APPLY PROTOCOL (database-security.md → Workflow): (1) the drift check, read-only: each replaced
-- body's live `pg_get_functiondef` against its source file named above; (2) apply verbatim; (3)
-- get_advisors; (4) regenerate the types; (5) run the rolled-back contract check commented at the
-- foot (it rides existing events and ends in a deliberate raise, so nothing persists).
--
-- EXPECTED ADVISOR DELTA: NONE. get_event_by_qr_token is dropped and recreated with its client
-- grant re-stated, so 0028 stays the same FIVE (get_event_by_qr_token and get_public_profile among
-- them) and 0029 lists both, as before; create_guest stays in NEITHER list (service-role-only, its
-- grants re-stated); the dropped trigger function was in neither list. No table is created, so
-- rls_enabled_no_policy is unchanged, and every function keeps `search_path = ''`.
-- =============================================================================================

-- =============================================================================================
-- 1. get_public_profile — the QA #36 clause leaves with the flag it was written on.
-- =============================================================================================
-- Body carried VERBATIM from 20260923120000 with ONE change, marked in the attended arm: the
-- `(e.allow_anonymous_uploads or (select auth.uid()) is not null)` clause is deleted. It said "on
-- an account-required event, a signed-in viewer", and the confirmed-viewer gate beside it already
-- says "on a Require-verified-emails event, the host or a CONFIRMED viewer", which is strictly
-- narrower (an anonymous viewer has no uid to pass either arm with). Replaced BEFORE the column
-- drops, so no call ever reads a column that is gone.
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
        -- ★ THE ALBUM'S OWN GATE, which carries QA #36 (never disclose membership the album itself
        -- withholds from the same viewer). On a Require-verified-emails event the album admits only
        -- its host (owner -> full) or a viewer whose email is CONFIRMED; everyone else stands at the
        -- teaser, which never renders the Guests list, so they learn nothing of it here either. An
        -- anonymous viewer has no uid, so neither arm can pass for them: the gate implies the old
        -- "a signed-in viewer" clause, which left with the legacy flag it was written on (the
        -- identity contract, 2026-09-23, the one change to this body).
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
        -- in their opt-in set. A choice survives the guest's last removal: the approved upload
        -- above hides the line meanwhile, and a later upload shows it again unasked.
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
-- 2. get_event_by_qr_token — the legacy flag leaves its RETURNS TABLE.
-- =============================================================================================
-- A RETURNS TABLE cannot shrink under create-or-replace: drop, recreate, and RE-GRANT (the drop
-- takes the grant with it). Every column but `allow_anonymous_uploads`, the redaction rule (QA #40)
-- and the order are carried verbatim from 20260922003000; the two switches stay unredacted (a
-- switch, never a secret: the lock screen and the door must render the right refusal).
drop function public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
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

-- One of the five accepted 0028 anon reads (the opaque token IS the authorization): the guest page
-- calls it on the anon/user client. Re-granted because the drop above took the grant.
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- =============================================================================================
-- 3. create_guest — every unconfirmed mint carries a name.
-- =============================================================================================
-- Same signature, same return, so `create or replace` (no drop: the ACL survives, and PostgREST
-- sees no new overload). Body carried VERBATIM from 20260922200000 with ONE behaviour change, the
-- raise marked where it sits (after the name is normalised and a confirmed caller's is nulled,
-- before the insert); comments that described the build before this one are reworded to the rule
-- they state. The refusal is check_violation with its own words, which createGuest
-- (src/lib/db/mutations/guest.ts) maps to `name_required` AHEAD of its verification fallback.
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

  -- ONLY A CONFIRMED ADDRESS REACHES `guests.email` (the identity SQL gaps, 2026-09-22). `email`
  -- means "confirmed" to every reader (the uploader resolver, the forensic `guest_email`), and
  -- `verified_at` is stamped from the same `v_confirmed` below, so the two arrive together or not
  -- at all from this mint.
  if v_confirmed is null then
    v_email := null;
  end if;

  -- The host's switch is Require verified emails: ON, nothing but a CONFIRMED session gets
  -- through. check_violation, which createGuest (src/lib/db/mutations/guest.ts) maps to a 422.
  if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  -- The typed name, on a name-only event. Blank is NULL here; the raise below decides what a
  -- missing name means.
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  -- THE NULLED NAME: a confirmed account's identity is its profile display_name (the one
  -- precedence rule the app codes to), so a typed name is never stored beside it — one identity
  -- per row, never two that can disagree.
  if v_confirmed is not null then
    v_name := null;
  end if;
  -- ★ THE IDENTITY CONTRACT (2026-09-23), the one behaviour change to this body: EVERY UNCONFIRMED
  -- MINT CARRIES A NAME. A confirmed caller's row is nameless by design (its identity is the
  -- profile's name, nulled just above); anyone else is a typed name or nobody, and nobody is what
  -- this refuses. The /api/guests route already refuses a nameless join with its own 422 (and owns
  -- the profanity check, which SQL cannot); this is the belt under it for any other caller, and
  -- the reason a nameless unconfirmed row cannot be minted any more.
  if v_name is null and v_confirmed is null then
    raise exception 'Add your name to upload.' using errcode = 'check_violation';
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
    -- The door reads which identity it just got without a second read.
    'display_name', v_name,
    'verified', (v_confirmed is not null),
    -- ★ WHETHER, never WHAT. The caller already knows the address it sent; echoing it back would
    -- put an unproved stranger's address on a wire that the host's own /api/guests response rides.
    'email_attached', (v_pending is not null)
  );
end;
$function$;

-- Service-role-only, as before (ADR-0016): the /api/guests route (and the demo seed script, on the
-- service role) are its callers. `create or replace` kept the ACL, so these two lines restate the
-- end state as the belt against the MCP anon-default landmine.
revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 4. The twin-keeper: the trigger, then its function.
-- =============================================================================================
-- It held `require_verified_email` and `allow_anonymous_uploads` exact opposites in both
-- directions so an older build writing either landed a consistent row. With one column left there
-- is nothing to keep in step. The trigger first: a function cannot be dropped while a trigger
-- still names it (and no CASCADE is used to force it).
drop trigger events_sync_verified_email_flags on public.events;
drop function public.sync_event_verified_email_flags();

-- =============================================================================================
-- 5. The legacy column.
-- =============================================================================================
-- Its column-scoped host grants (insert, update) and its default go with it; nothing else names it
-- (sections 1 and 2 replaced the two functions that read it, section 4 dropped the one that wrote
-- it).
alter table public.events drop column allow_anonymous_uploads;

-- =============================================================================================
-- THE ROLLED-BACK CONTRACT CHECK. Run AFTER the apply, in one `execute_sql` call, inside a DO
-- block that ends in a deliberate raise, so nothing it touches persists (database-security.md,
-- Workflow). It rides an existing open, live, names-mode test event with uploads open (never the
-- demo), and a confirmed account that is not its host. Expect the last line to be
-- `ROLLED BACK: every identity-contract fact held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_qr text;
--   v_uid uuid;
--   v_minted jsonb;
--   v_json jsonb;
--   v_slug text;
--   v_media uuid := gen_random_uuid();
-- begin
--   select * into v_event from public.events
--    where visibility = 'open' and deleted_at is null and accepting_uploads
--      and moderation_mode = 'live' and not require_verified_email and name <> 'Partyreel Demo'
--    order by created_at limit 1;
--   if v_event.id is null then raise exception 'FAIL: no open, live, names-mode event to ride'; end if;
--   v_qr := v_event.qr_token;
--   select p.id into v_uid from public.profiles p join auth.users u on u.id = p.id
--    where u.email_confirmed_at is not null and p.id <> v_event.host_id
--    order by (p.slug is null) limit 1;
--   if v_uid is null then raise exception 'FAIL: no confirmed non-host account to ride'; end if;
--
--   -- ── 1. the column and the twin-keeper are gone ─────────────────────────────────────────
--   if exists (select 1 from information_schema.columns
--               where table_schema = 'public' and table_name = 'events'
--                 and column_name = 'allow_anonymous_uploads') then
--     raise exception 'FAIL: events.allow_anonymous_uploads still exists';
--   end if;
--   if exists (select 1 from pg_trigger where tgname = 'events_sync_verified_email_flags') then
--     raise exception 'FAIL: the twin-keeper trigger still exists';
--   end if;
--   if to_regprocedure('public.sync_event_verified_email_flags()') is not null then
--     raise exception 'FAIL: the twin-keeper function still exists';
--   end if;
--   -- The host's own switch still writes, alone, with nothing to mirror it.
--   update public.events set require_verified_email = not require_verified_email where id = v_event.id;
--   update public.events set require_verified_email = false where id = v_event.id;
--   raise notice 'OK: the column, the trigger and its function are gone; the switch still writes';
--
--   -- ── 2. a nameless unconfirmed mint raises the new words; a named and a confirmed one mint ──
--   begin
--     perform public.create_guest(v_qr, null, false, null);
--     raise exception 'FAIL: a nameless unconfirmed mint was accepted';
--   exception when check_violation then
--     if sqlerrm <> 'Add your name to upload.' then
--       raise exception 'FAIL: the nameless refusal reads "%"', sqlerrm;
--     end if;
--   end;
--   begin
--     perform public.create_guest(v_qr, null, false, '   ');
--     raise exception 'FAIL: a blank name was accepted as a name';
--   exception when check_violation then null;
--   end;
--   v_minted := public.create_guest(v_qr, null, false, 'Contract check');
--   if v_minted->>'session_token' is null or v_minted->>'display_name' <> 'Contract check' then
--     raise exception 'FAIL: a named mint did not land (%)', v_minted;
--   end if;
--   v_minted := public.create_guest(v_qr, v_uid, false, null);
--   if v_minted->>'session_token' is null or not (v_minted->>'verified')::boolean
--      or v_minted->>'display_name' is not null then
--     raise exception 'FAIL: a confirmed nameless mint did not land verified and nameless (%)', v_minted;
--   end if;
--   raise notice 'OK: nameless refused in its own words; named and confirmed mints land';
--
--   -- ── 3. get_event_by_qr_token: no legacy key, every other key kept ──────────────────────
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(v_qr) t;
--   if v_json ? 'allow_anonymous_uploads' then
--     raise exception 'FAIL: get_event_by_qr_token still returns the legacy flag';
--   end if;
--   if not (v_json ?& array['id', 'name', 'description', 'moderation_mode', 'visibility',
--       'has_password', 'accepting_uploads', 'require_verified_email', 'require_upload_to_view',
--       'event_date', 'qr_style', 'qr_token', 'custom_slug', 'host_display_name']) then
--     raise exception 'FAIL: get_event_by_qr_token lost a key (%)', v_json;
--   end if;
--   if (v_json->>'require_verified_email')::boolean then
--     raise exception 'FAIL: get_event_by_qr_token does not mirror the switch';
--   end if;
--   raise notice 'OK: get_event_by_qr_token returns every key but the legacy one';
--
--   -- ── 4. get_public_profile: a require-upload album's line hides from a stranger, an open one shows ──
--   -- The confirmed account is made a guest here, through the product's own write: an upload on its
--   -- confirmed row (live moderation lands it approved), the event chosen, the list on.
--   perform public.create_media(v_minted->>'session_token', v_media, 'photo',
--     'events/' || v_event.id || '/photo/' || v_media || '/original.png', 10);
--   update public.events set show_guest_list = true, require_upload_to_view = false where id = v_event.id;
--   insert into public.profile_shown_events (user_id, event_id) values (v_uid, v_event.id)
--     on conflict do nothing;
--   select slug into v_slug from public.profiles where id = v_uid;
--   if v_slug is null then
--     v_slug := 'contract-check-' || substr(md5(v_uid::text), 1, 8);
--     update public.profiles set slug = v_slug where id = v_uid;
--   end if;
--   -- A stranger (no uid): the claims are cleared so auth.uid() is null.
--   perform set_config('request.jwt.claims', '{}', true);
--   v_json := public.get_public_profile(v_slug);
--   if not exists (select 1 from jsonb_array_elements(v_json->'attended_events') a
--                   where a->>'id' = v_event.id::text) then
--     raise exception 'FAIL: an open names-mode album''s line is hidden from a stranger';
--   end if;
--   update public.events set require_upload_to_view = true where id = v_event.id;
--   v_json := public.get_public_profile(v_slug);
--   if exists (select 1 from jsonb_array_elements(v_json->'attended_events') a
--               where a->>'id' = v_event.id::text) then
--     raise exception 'FAIL: a require-upload album''s line reached a stranger';
--   end if;
--   update public.events set require_upload_to_view = false, require_verified_email = true where id = v_event.id;
--   v_json := public.get_public_profile(v_slug);
--   if exists (select 1 from jsonb_array_elements(v_json->'attended_events') a
--               where a->>'id' = v_event.id::text) then
--     raise exception 'FAIL: a verified-emails album''s line reached a stranger (QA #36)';
--   end if;
--   raise notice 'OK: get_public_profile hides the gated lines from a stranger and shows the open one';
--
--   -- ── 5. the grants ───────────────────────────────────────────────────────────────────────
--   if not has_function_privilege('anon', 'public.get_event_by_qr_token(text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_event_by_qr_token(text)', 'execute') then
--     raise exception 'FAIL: get_event_by_qr_token lost its client grant at the recreate';
--   end if;
--   if not has_function_privilege('anon', 'public.get_public_profile(text)', 'execute') then
--     raise exception 'FAIL: get_public_profile lost its anon grant';
--   end if;
--   if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean, text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean, text, text)', 'execute') then
--     raise exception 'FAIL: create_guest is reachable by a client role';
--   end if;
--   if not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'require_upload_to_view', 'update') then
--     raise exception 'FAIL: a sibling column grant was lost with the dropped column';
--   end if;
--   raise notice 'OK: every grant holds';
--
--   raise exception 'ROLLED BACK: every identity-contract fact held';
-- end $$;
