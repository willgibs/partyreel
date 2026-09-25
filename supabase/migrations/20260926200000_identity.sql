-- ============================================================================
-- A confirmed address is changed, never lost, and deleting an account takes it with it
-- (lp/identity-email; Will, identity-door round 1 `remove`: "once an email has been added, it may
-- only be changed ... not fully removed. Account deletion is always an option too.").
--
-- TWO TRIGGERS, each body a couple of statements, each EXECUTE-revoked:
--   1. handle_user_email_change, AFTER UPDATE OF email ON auth.users, only when the address
--      actually changed: the new address lands on `profiles.email` and on `guests.email` of the
--      account's VERIFIED rows, so the copies follow the account (past hosts see the new address).
--   2. scrub_account_guest_rows, BEFORE DELETE ON public.profiles: the account's guest rows in
--      every event lose the addresses and the typed name before the FK unlinks them, however the
--      account goes (the sweep's deleteUser, the dashboard, anything that deletes auth.users).
--
-- ★ TRIGGER 1 RUNS INSIDE GOTRUE'S OWN TRANSACTION. An email change is committed by the Auth
-- server's `ConfirmEmailChange` (or an operator's admin update) as one UPDATE of auth.users, and
-- this body runs inside it: a failure here fails the verify and NOBODY CAN CHANGE AN ADDRESS. So
-- the body stays trivial: no raise, no dynamic SQL, every name schema-qualified under an empty
-- search_path, SECURITY DEFINER because GoTrue connects as `supabase_auth_admin`, which holds no
-- write grant on public.profiles or public.guests (the same shape as handle_new_user beside it).
-- Its writes fire album-pages' guests triggers (guests_album_note, and the deferred
-- guests_album_stamp at GoTrue's commit), which the contract check below runs inline.
--
-- ★ WHAT FOLLOWS AND WHAT DOES NOT:
--   * `profiles.email` takes auth.users' value as stored (handle_new_user's form), unless the
--     profile has asked to be deleted: an anonymised profile keeps its nulls, and so do its guest
--     rows, which the scrub cleared (only an operator can change a banned account's address).
--   * `guests.email` on the account's rows with `verified_at` set, in the stored form create_guest
--     and the claims write (`btrim`). `guests.email` means "a confirmed address of the row's own
--     account" to every reader (database-security.md), so it tracks the account's address; an
--     unverified row gains nothing, and `pending_email` (the inert, unproved address) is never read.
--   * `upload_forensics` keeps what each upload captured (it is evidence, denormalised on purpose).
--   * NOT a newsletter row, a Stripe customer or a sent email: the app's own paths own those.
--
-- ★ TRIGGER 2 IS BEFORE, SO IT MUST `return old`. A BEFORE DELETE row trigger that returns null
-- silently SKIPS the delete: the profile would survive its auth user's cascade and the FK would
-- fail the whole deleteUser. Before, not after, because the rows are found by `user_id`, and the
-- FK's `on delete set null` (guests_user_id_fkey) erases exactly that link once the profile goes.
-- What it clears is the account's identity on rows in OTHER hosts' events (its own events are
-- gone by the time the sweep deletes the auth user): the confirmed address, the unproved address
-- and its stamp, and a typed name (only an unconfirmed account's row carries one; a verified row's
-- name is the profile's, which the request anonymised). `verified_at` STAYS: a confirmed row whose
-- account was deleted writes for nobody precisely because it keeps it (guest-flow.md). The app
-- runs the same scrub earlier, at the request and in the sweep's re-anonymise
-- (scrubAccountGuestRows, src/lib/lifecycle/account-deletion.ts); this is the net under both.
--
-- NOT HERE: clearing rows that deleted accounts ALREADY left behind. That is destructive and waits
-- for Will's yes, in its own file (20260926210000_identity_backfill.sql), never applied by a lane.
--
-- ── EXPECTED get_advisors DELTA: NONE ───────────────────────────────────────
-- Two trigger functions, EXECUTE revoked from public, anon and authenticated (service_role keeps
-- the default, like every trigger function): in neither 0028 nor 0029. No table, no policy.
-- Firing never checks EXECUTE (only CREATE TRIGGER does), so the revokes cost nothing.
--
-- ── ROLLED-BACK CONTRACT CHECK (execute_sql AFTER apply; the trailing RAISE aborts the tx, so
--    nothing persists). It makes its own two accounts (an auth.users insert fires
--    handle_new_user) and rides ONE existing event for their guest rows. It must end on
--    `ROLLBACK_OK`; any other error names the broken promise. ──
-- The lane ran it (1) with this file verbatim on a throwaway local Postgres 17 holding a stand-in of
-- auth.users, profiles, guests, media and album_state with the live bodies of handle_new_user and
-- album-pages' guests and profiles triggers, where seven mutations of this file (no WHEN, no
-- deletion guard, no verified filter, a scrub returning null, a scrub keeping the typed name, no
-- scrub trigger, an anon grant) each failed on their own FAIL line, and a GoTrue-shaped UPDATE and
-- DELETE under `set role supabase_auth_admin` copied, scrubbed and bumped the album stamp at
-- COMMIT; and (2) on the live project BEFORE the apply (2026-09-25), with this file's statements
-- at the head of the same DO block: it ended on `ROLLBACK_OK`, and the catalog read neither
-- function, neither trigger and no `idc-` row afterwards.
--
--   do $$
--   declare
--     v_event uuid;
--     v_a uuid := gen_random_uuid();  -- changes its address, then is deleted
--     v_b uuid := gen_random_uuid();  -- a bystander whose row must never move
--     v_tag text := replace(gen_random_uuid()::text, '-', '');
--     v_old text := 'idc-old-' || v_tag || '@example.invalid';
--     v_new text := 'idc-new-' || v_tag || '@example.invalid';
--     v_by text := 'idc-by-' || v_tag || '@example.invalid';
--     v_verified uuid;
--     v_unverified uuid;
--     v_bystander uuid;
--     r public.guests;
--   begin
--     -- album-pages' deferred stamps fire per statement, as GoTrue's commit will run them.
--     set constraints all immediate;
--     select id into v_event from public.events limit 1;
--     if v_event is null then raise exception 'need one existing event'; end if;
--
--     insert into auth.users (id, email, email_confirmed_at)
--       values (v_a, v_old, now()), (v_b, v_by, now());
--     insert into public.guests (event_id, session_token, user_id, email, verified_at)
--       values (v_event, 'idc-v-' || v_tag, v_a, v_old, now()) returning id into v_verified;
--     insert into public.guests (event_id, session_token, user_id, display_name, pending_email, pending_email_at)
--       values (v_event, 'idc-u-' || v_tag, v_a, 'Typed Name', 'typed-' || v_tag || '@example.invalid', now())
--       returning id into v_unverified;
--     insert into public.guests (event_id, session_token, user_id, email, verified_at)
--       values (v_event, 'idc-b-' || v_tag, v_b, v_by, now()) returning id into v_bystander;
--
--     -- 1. An update that leaves the address alone copies nothing (the WHEN guard).
--     update public.profiles set email = 'sentinel@example.invalid' where id = v_a;
--     update auth.users set email = email, last_sign_in_at = now() where id = v_a;
--     if (select email from public.profiles where id = v_a) <> 'sentinel@example.invalid'
--       then raise exception 'FAIL 1: an unchanged address copied'; end if;
--     update public.profiles set email = v_old where id = v_a;
--
--     -- 2. A changed address reaches the profile and the VERIFIED row, and nothing else.
--     update auth.users set email = v_new where id = v_a;
--     if (select email from public.profiles where id = v_a) is distinct from v_new
--       then raise exception 'FAIL 2a: the profile did not follow'; end if;
--     if (select email from public.guests where id = v_verified) is distinct from v_new
--       then raise exception 'FAIL 2b: the verified row did not follow'; end if;
--     select * into r from public.guests where id = v_unverified;
--     if r.email is not null or r.pending_email is distinct from 'typed-' || v_tag || '@example.invalid'
--       then raise exception 'FAIL 2c: the unverified row moved'; end if;
--     if (select email from public.guests where id = v_bystander) is distinct from v_by
--       then raise exception 'FAIL 2d: another account''s row moved'; end if;
--
--     -- 3. An account whose deletion is requested keeps its nulls, on the profile and its rows.
--     update public.profiles set deletion_requested_at = now(), email = null where id = v_a;
--     update public.guests set email = null where id = v_verified;
--     update auth.users set email = v_old where id = v_a;
--     if (select email from public.profiles where id = v_a) is not null
--       then raise exception 'FAIL 3a: a deleted account''s profile took an address'; end if;
--     if (select email from public.guests where id = v_verified) is not null
--       then raise exception 'FAIL 3b: a deleted account''s row took an address'; end if;
--
--     -- 4. Deleting the auth user scrubs the rows before the FK unlinks them (as if the app's
--     --    scrub had never run), deletes the profile, and leaves the bystander alone.
--     update public.guests set email = v_new where id = v_verified;
--     delete from auth.users where id = v_a;
--     if exists (select 1 from public.profiles where id = v_a)
--       then raise exception 'FAIL 4a: the profile survived (the BEFORE trigger must return old)'; end if;
--     select * into r from public.guests where id = v_verified;
--     if not found then raise exception 'FAIL 4b: the verified row was deleted, not unlinked'; end if;
--     if r.email is not null or r.user_id is not null
--       then raise exception 'FAIL 4c: the verified row kept its address or its link'; end if;
--     if r.verified_at is null
--       then raise exception 'FAIL 4d: verified_at was cleared'; end if;
--     select * into r from public.guests where id = v_unverified;
--     if r.pending_email is not null or r.pending_email_at is not null
--        or r.display_name is not null or r.user_id is not null
--       then raise exception 'FAIL 4e: the unverified row kept a typed identity'; end if;
--     if (select email from public.guests where id = v_bystander) is distinct from v_by
--       then raise exception 'FAIL 4f: the bystander''s row was scrubbed'; end if;
--
--     -- 5. Neither function is callable by a client role.
--     if has_function_privilege('anon', 'public.handle_user_email_change()', 'execute')
--        or has_function_privilege('authenticated', 'public.handle_user_email_change()', 'execute')
--        or has_function_privilege('anon', 'public.scrub_account_guest_rows()', 'execute')
--        or has_function_privilege('authenticated', 'public.scrub_account_guest_rows()', 'execute')
--       then raise exception 'FAIL 5: a trigger function is client-callable'; end if;
--
--     raise exception 'ROLLBACK_OK';
--   end $$;
--
-- ============================================================================

-- ─── 1. The copies follow the account's address ─────────────────────────────
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- An account on its way out keeps the nulls its deletion wrote, on the profile and on its rows.
  if exists (
    select 1 from public.profiles p
     where p.id = new.id and p.deletion_requested_at is not null
  ) then
    return null;
  end if;

  update public.profiles p
     set email = new.email
   where p.id = new.id
     and p.email is distinct from new.email;

  update public.guests g
     set email = nullif(btrim(coalesce(new.email, '')), '')
   where g.user_id = new.id
     and g.verified_at is not null
     and g.email is distinct from nullif(btrim(coalesce(new.email, '')), '');

  return null;
end;
$$;

-- `UPDATE OF email` fires whenever the column is in the SET list, changed or not; the WHEN keeps
-- every other GoTrue write to email (and every unchanged one) from running the body at all.
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- The MCP default grants anon EXECUTE on a new function; a bare `from public` would leave it.
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- ─── 2. Deletion takes the address with it ──────────────────────────────────
create or replace function public.scrub_account_guest_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.guests g
     set email = null,
         pending_email = null,
         pending_email_at = null,
         display_name = null
   where g.user_id = old.id
     and (g.email is not null
          or g.pending_email is not null
          or g.pending_email_at is not null
          or g.display_name is not null);
  -- A BEFORE trigger that returns null cancels the delete. This one only ever lets it through.
  return old;
end;
$$;

create trigger profiles_scrub_guest_rows
  before delete on public.profiles
  for each row
  execute function public.scrub_account_guest_rows();

revoke execute on function public.scrub_account_guest_rows() from public, anon, authenticated;
