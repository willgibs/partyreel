-- The guests grant tidy: the `guests` table's last host-facing surface and one stray address write,
-- closed in SQL. Both are open lines in docs/ROADMAP.md's Now list, found by the identity-sql-gaps
-- lane (20260922200000, applied), and both are defects against rules already on record: the host
-- sees a badge, never an address (guest-flow.md "Joining + identity"), and `guests.email` means
-- CONFIRMED to every reader (database-security.md's TWO EMAIL COLUMNS landmine).
--
--   1. `capture_guest_email` filled an EMPTY `guests.email` on whatever row the session token
--      named, with the address of whichever confirmed session called its route. On a shared phone
--      that is one person's address on another person's row: the forensic `guest_email` records it
--      at that row's next upload, and on a VERIFIED row with no address (the legacy shape the
--      20260921150000 backfill stamped without one; one such row exists live) the host's lightbox
--      prints it under the row owner's name, because the uploader credit's case 2 returns
--      `guests.email`. The write now lands only on a row whose OWN account is the confirmed owner
--      of that address, and does nothing anywhere else (1).
--   2. The host's guests SELECT `(id, event_id, user_id, created_at)` and its row filter
--      `guests_host_select` have no reader on either deployed codebase: every read of the table
--      runs on the service-role client or inside a SECURITY DEFINER function. Both go (2).
--
-- ★ PRODUCTION SURVIVES IT UNCHANGED IN SHAPE. No signature, return type or payload key moves:
-- `capture_guest_email` keeps its three parameters and answers `{"ok": true}` whether or not it
-- wrote, so the build on main (milestone-26) and the alias keep calling exactly what they call
-- today and the route's answer to the browser does not change. The revoke removes a read NOTHING
-- authenticated performs (the audit is at section 2). `src/lib/db/types.ts` does not change: no
-- column, signature or return type moves, and privileges and policies are invisible to the
-- generator. The fix also holds against main's older route, which tests `user.email` and not
-- `email_confirmed_at`: the function now proves the address itself instead of trusting its caller.
--
-- NO DATA STATEMENT, deliberately. Measured read-only on the live project before this file was
-- written: 34 guest rows, 4 carrying an address, each verified and each its own confirmed account's,
-- so no row holds an address that is not its own account's. The residue query in the apply protocol
-- re-proves that at the apply.
--
-- APPLY PROTOCOL (database-security.md → Workflow):
--   (1) the drift check, read-only:
--       a. the live `capture_guest_email` body equals 20260529210500's once comments are stripped
--          and whitespace collapsed (the live prosrc lacks that file's one body comment, "Per-event
--          email: ...", so compare normalised, never raw):
--            select md5(btrim(regexp_replace(regexp_replace(prosrc, '--[^\n]*', '', 'g'), '\s+', ' ', 'g')))
--              from pg_proc where oid = 'public.capture_guest_email(text, text, boolean)'::regprocedure;
--          is e0018d48fc2bf9ba2121b5e18fb3c8b6 before the apply and 447130abeee65e0b20f464dc6765d34f
--          (this file's body) after it;
--       b. `guests_host_select` exists on public.guests and is its only policy;
--       c. `authenticated` holds SELECT on exactly (id, event_id, user_id, created_at) of guests;
--       d. the residue count is 0 (if it is not, stop: a row carries an address that is not its own
--          account's, and whether it goes is Will's call, not this file's):
--            select count(*) from public.guests g
--             where g.email is not null
--               and not exists (select 1 from auth.users u
--                                where u.id = g.user_id and u.email_confirmed_at is not null
--                                  and lower(btrim(u.email)) = lower(btrim(g.email)));
--   (2) apply verbatim; (3) get_advisors; (4) run the rolled-back contract check at the foot.
--
-- EXPECTED ADVISOR DELTA: `rls_enabled_no_policy` (INFO) gains `public.guests` (14 -> 15): RLS stays
-- ON with no policy, the deny-all containment every operator table already rides. 0028 stays the
-- same five and 0029 the same 34; `capture_guest_email` stays in NEITHER list (service-role-only:
-- `create or replace` with an unchanged signature keeps its ACL, and the grants below restate it).
-- No function is created or dropped, and every function keeps `search_path = ''`.

-- =============================================================================================
-- 1. capture_guest_email: an address lands only on its own account's row.
-- =============================================================================================
-- Same signature, same return, so `create or replace` (no drop: the ACL survives, and PostgREST
-- sees no new overload). Body carried VERBATIM from 20260529210500, the newest definition (nothing
-- later replaced it, and the live body matches it), with ONE change, marked where it sits. The
-- newsletter half is untouched: the opt-in records the calling session's own confirmed address
-- (the route derives it from getUser(), never from the body) whichever row the token names, because
-- a person's consent to the list is theirs and says nothing about the row.
create or replace function public.capture_guest_email(
  p_session_token text,
  p_email text,
  p_newsletter_opt_in boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_email text;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
  if v_email is null then
    raise exception 'An email is required.' using errcode = 'check_violation';
  end if;

  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- Per-event email: only fill it if the guest hasn't already provided one.
  -- ★ THE GUESTS GRANT TIDY (2026-09-22), the one change to this body: AND ONLY ON ITS OWN
  -- ACCOUNT'S ROW. The session token names a ROW, not a person: on a shared phone it is whoever
  -- joined last on that device, so "the calling session's address" and "this row's person" can be
  -- two people. The address lands only when the row's own `user_id` is an account whose CONFIRMED
  -- address it is; an anonymous row, another account's row and an unconfirmed account's row keep
  -- exactly what they had. `auth.users` is read here, under definer privilege, rather than trusting
  -- the route's confirmation, so a caller that skips the `email_confirmed_at` test (main's route
  -- does) still cannot write an unproved address. The capture writes an address, never a proof:
  -- `verified_at` stays the mint's and the claims' to stamp (a row minted before its account
  -- confirmed was minted by whoever held that session, who need not own the address).
  update public.guests g
     set email = v_email
   where g.id = v_guest.id
     and g.email is null
     and exists (
       select 1
         from auth.users u
        where u.id = g.user_id
          and u.email_confirmed_at is not null
          and lower(btrim(u.email)) = v_email
     );

  if p_newsletter_opt_in then
    insert into public.newsletter_signups (email, source, event_id)
    values (v_email, 'guest_upload', v_guest.event_id)
    on conflict (email) do nothing;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Service-role-only, as before (20260608230000 + 20260608234000): POST /api/guests/capture-email is
-- the sole caller. `create or replace` kept the ACL, so these two lines restate the end state; they
-- are the belt against the MCP anon-default landmine should this function ever be dropped and
-- recreated instead.
revoke execute on function public.capture_guest_email(text, text, boolean) from public, anon, authenticated;
grant execute on function public.capture_guest_email(text, text, boolean) to service_role;

-- =============================================================================================
-- 2. The host's PostgREST view of guests goes, and its row filter with it.
-- =============================================================================================
-- 20260922200000 narrowed the QA #41 grant to `(id, event_id, user_id, created_at)`. RE-AUDITED ON
-- BOTH DEPLOYED CODEBASES for this file (launch-prep at 8f0ad1c3, main at milestone-26 df173c2e):
-- every read of `guests` runs on the SERVICE-ROLE admin client, which keeps its own grant and
-- bypasses RLS. On launch-prep that is the five `.from("guests")` calls (db/mutations/guest-media.ts
-- twice, db/queries/social.ts twice, forensics/capture.ts) and the media -> guests embed in
-- `getUploaderIdentities` (db/queries/guest-events-admin.ts); on main, the three calls
-- (db/queries/social.ts twice, forensics/capture.ts) and the same embed. No browser or RLS-client
-- path reads the table and no Realtime subscription watches it. On the live schema no view depends
-- on it, no publication carries it, no other table's policy reads it, and no SECURITY INVOKER
-- function does: every function that reads it is SECURITY DEFINER, owned by `postgres`, and reads
-- past both the grant and RLS. Nothing loses a read.
--
-- The QA #41 shape, taken to its end: the TABLE-level revoke cascades to every column grant (a bare
-- column revoke would be a silent no-op beside a table grant), and nothing is re-granted. A new
-- column stays fail-closed, as before, and now so does every old one.
revoke select on public.guests from public, anon, authenticated;

-- The policy goes with the grant it filtered. Kept, it would be a latent row filter waiting for a
-- grant: a future `grant select` would silently hand every host their own guests' rows again, where
-- with no policy RLS (still ENABLED) denies every row to every client role even then. `guests` joins
-- the deny-all tables that ride the accepted `rls_enabled_no_policy` INFO.
drop policy guests_host_select on public.guests;

-- =============================================================================================
-- 3. ROLLED-BACK CONTRACT CHECK (run via execute_sql AFTER the apply; nothing persists: the block
--    ends in a deliberate RAISE, so its own transaction and every fixture in it roll back). It rides
--    the disposable event "Ghost check (disposable)" when it exists, else any open event, and makes
--    its own people: three disposable auth.users rows (A and B confirmed, C UNCONFIRMED until the
--    check confirms it) whose profiles the signup trigger creates inside the same transaction.
--    Expect the last line to be `ROLLED BACK: every guests-grant-tidy contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_a uuid := gen_random_uuid();
--   v_b uuid := gen_random_uuid();
--   v_c uuid := gen_random_uuid();
--   v_tag text := 'granttidy-' || substr(md5(random()::text), 1, 8);
--   v_anon_tok text;
--   v_a_tok text;
--   v_c_tok text;
--   v_row public.guests;
--   v_denied boolean;
--   v_n integer;
--   v_col text;
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
--     (v_a, 'authenticated', 'authenticated', v_tag || '-a@example.com', now()),
--     (v_b, 'authenticated', 'authenticated', v_tag || '-b@example.com', now()),
--     (v_c, 'authenticated', 'authenticated', v_tag || '-c@example.com', null);
--   update public.events
--      set require_verified_email = false, accepting_uploads = true, visibility = 'open'
--    where id = v_event.id;
--
--   -- ── 1. the shared phone: an anonymous row, and account A's session captures on it ─────────
--   v_anon_tok := public.create_guest(v_event.qr_token, null, false, 'Typed Name', null)->>'session_token';
--   perform public.capture_guest_email(v_anon_tok, v_tag || '-a@example.com', true);
--   select * into v_row from public.guests where session_token = v_anon_tok;
--   if v_row.email is not null then
--     raise exception 'FAIL: a confirmed account''s address landed on an anonymous row';
--   end if;
--   if not exists (select 1 from public.newsletter_signups where email = v_tag || '-a@example.com') then
--     raise exception 'FAIL: the opt-in stopped recording the caller''s own address';
--   end if;
--   raise notice 'OK: an anonymous row keeps no address, and the opt-in still records';
--
--   -- ── 2. an UNCONFIRMED account's own address never lands, even on its own row ─────────────
--   v_c_tok := public.create_guest(v_event.qr_token, v_c, false, 'Cee', null)->>'session_token';
--   perform public.capture_guest_email(v_c_tok, v_tag || '-c@example.com', false);
--   select * into v_row from public.guests where session_token = v_c_tok;
--   if v_row.email is not null then
--     raise exception 'FAIL: an unconfirmed account''s address reached guests.email';
--   end if;
--   raise notice 'OK: an unconfirmed address never lands';
--
--   -- ── 3. C confirms; another confirmed account (B) on C's row writes nothing ──────────────
--   update auth.users set email_confirmed_at = now() where id = v_c;
--   perform public.capture_guest_email(v_c_tok, v_tag || '-b@example.com', false);
--   select * into v_row from public.guests where session_token = v_c_tok;
--   if v_row.email is not null then
--     raise exception 'FAIL: another account''s address landed on C''s row';
--   end if;
--   raise notice 'OK: another account''s address never lands';
--
--   -- ── 4. C's own confirmed address, however it is cased, lands on C's own row ─────────────
--   perform public.capture_guest_email(v_c_tok, '  ' || upper(v_tag || '-c@example.com') || ' ', false);
--   select * into v_row from public.guests where session_token = v_c_tok;
--   if v_row.email is distinct from v_tag || '-c@example.com' then
--     raise exception 'FAIL: the account''s own row lost its capture';
--   end if;
--   if v_row.verified_at is not null then
--     raise exception 'FAIL: the capture stamped a proof it does not have';
--   end if;
--   raise notice 'OK: the account''s own address lands, normalised, and proves nothing';
--
--   -- ── 5. a VERIFIED row with no address (the legacy shape the host's credit prints from) ────
--   v_a_tok := public.create_guest(v_event.qr_token, v_a, false, null, null)->>'session_token';
--   update public.guests set email = null where session_token = v_a_tok;
--   perform public.capture_guest_email(v_a_tok, v_tag || '-b@example.com', false);
--   select * into v_row from public.guests where session_token = v_a_tok;
--   if v_row.email is not null then
--     raise exception 'FAIL: another account''s address landed where the host''s credit prints it';
--   end if;
--   perform public.capture_guest_email(v_a_tok, v_tag || '-a@example.com', false);
--   select * into v_row from public.guests where session_token = v_a_tok;
--   if v_row.email is distinct from v_tag || '-a@example.com' then
--     raise exception 'FAIL: a verified row lost its own capture';
--   end if;
--   update public.guests set email = v_tag || '-a-old@example.com' where session_token = v_a_tok;
--   perform public.capture_guest_email(v_a_tok, v_tag || '-a@example.com', false);
--   select * into v_row from public.guests where session_token = v_a_tok;
--   if v_row.email is distinct from v_tag || '-a-old@example.com' then
--     raise exception 'FAIL: the capture overwrote an address already on the row';
--   end if;
--   raise notice 'OK: a verified row takes only its own address, and never over another';
--
--   -- ── 6. the refusals are unchanged ──────────────────────────────────────────────────────
--   begin
--     perform public.capture_guest_email(v_a_tok, '   ', false);
--     raise exception 'FAIL: a blank address was accepted';
--   exception when check_violation then null;
--   end;
--   begin
--     perform public.capture_guest_email('granttidy-no-such-token', v_tag || '-a@example.com', false);
--     raise exception 'FAIL: an unknown session token was accepted';
--   exception when no_data_found then null;
--   end;
--   raise notice 'OK: a blank address and an unknown token are refused as before';
--
--   -- ── 7. the host reads guests over PostgREST: refused outright ──────────────────────────
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_event.host_id::text, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   begin
--     perform g.id from public.guests g where g.event_id = v_event.id;
--     v_denied := false;
--   exception when insufficient_privilege then
--     v_denied := true;
--   end;
--   reset role;
--   if not v_denied then raise exception 'FAIL: the host can still read guests'; end if;
--   raise notice 'OK: the host''s read of guests is refused';
--
--   -- ── 8. the readers that remain still read: a definer RPC for its caller, the service role ─
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_c::text, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_n from public.list_guest_rows_by_email();
--   reset role;
--   set local role service_role;
--   select count(*) into v_n from public.guests g where g.event_id = v_event.id;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   if v_n < 3 then raise exception 'FAIL: the service role lost its read of guests'; end if;
--   raise notice 'OK: a definer RPC reads for an authenticated caller, and the service role reads';
--
--   -- ── 9. the grants and the policy sit where database-security.md says ───────────────────
--   for v_col in
--     select attname from pg_attribute
--      where attrelid = 'public.guests'::regclass and attnum > 0 and not attisdropped
--   loop
--     if has_column_privilege('authenticated', 'public.guests', v_col, 'select')
--        or has_column_privilege('anon', 'public.guests', v_col, 'select') then
--       raise exception 'FAIL: a client role can still select guests.%', v_col;
--     end if;
--   end loop;
--   if exists (select 1 from pg_policy where polrelid = 'public.guests'::regclass) then
--     raise exception 'FAIL: a policy on guests survives';
--   end if;
--   if not (select relrowsecurity from pg_class where oid = 'public.guests'::regclass) then
--     raise exception 'FAIL: RLS is off on guests';
--   end if;
--   if not has_table_privilege('service_role', 'public.guests', 'select') then
--     raise exception 'FAIL: the service role lost its grant on guests';
--   end if;
--   if has_function_privilege('anon', 'public.capture_guest_email(text, text, boolean)', 'execute')
--      or has_function_privilege('authenticated', 'public.capture_guest_email(text, text, boolean)', 'execute')
--      or not has_function_privilege('service_role', 'public.capture_guest_email(text, text, boolean)', 'execute') then
--     raise exception 'FAIL: capture_guest_email''s EXECUTE grant moved';
--   end if;
--   if not exists (
--     select 1 from pg_proc
--      where oid = 'public.capture_guest_email(text, text, boolean)'::regprocedure
--        and prosecdef and proconfig @> array['search_path=""']
--   ) then
--     raise exception 'FAIL: capture_guest_email lost SECURITY DEFINER or its pinned search_path';
--   end if;
--   raise notice 'OK: the grants and the policy sit where database-security.md says';
--
--   raise exception 'ROLLED BACK: every guests-grant-tidy contract held';
-- end $$;
