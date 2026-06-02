-- Account password support: two read-only RPCs for the host /account Security section (ADR-0011).
--
-- We add email+password as an ADDITIONAL credential alongside the existing passwordless paths
-- (email OTP / magic-link / Google). The password itself lives in auth.users.encrypted_password,
-- managed entirely by Supabase (signInWithPassword / updateUser) — NO app table or column stores
-- it, so there is no schema change for the password itself.
--
-- These two SECURITY DEFINER functions only READ auth.users to answer:
--   * has_password()            — "does this account have a password set?" (set-vs-change UI)
--   * verify_current_password() — "is this the account's current password?" (re-auth before a change)
-- They return ONLY booleans; the bcrypt hash NEVER leaves the DB (same invariant as the event
-- password / verify_event_password). They are the same locked-down class as save_event /
-- set_event_password: authenticated-only (revoked from public + anon), authorizing internally via
-- auth.uid(). So get_advisors lists them under authenticated_security_definer_function_executable
-- (0029) and NEVER under anon_security_definer_function_executable (0028). If either ever shows up
-- in the anon (0028) list, an over-broad grant slipped in.

-- pgcrypto lives in the `extensions` schema; with search_path='' every call must be fully
-- qualified (extensions.crypt). Idempotent (already created in the phase-1 password migration).
create extension if not exists pgcrypto with schema extensions;

-- has_password() — true when the signed-in account has a password credential. Drives the /account
-- Security copy (Set vs Change) and whether the current-password field is required. Reading
-- auth.users is allowed: a SECURITY DEFINER function runs as its owner. encrypted_password is
-- compared against '' as well as NULL because GoTrue has historically stored an empty string for
-- password-less rows in some versions.
create function public.has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and encrypted_password is not null
      and encrypted_password <> ''
  );
$$;

revoke all on function public.has_password() from public, anon;
grant execute on function public.has_password() to authenticated;

-- verify_current_password(p_password) — true when p_password matches the signed-in account's
-- current password. Used to re-confirm ownership BEFORE a password CHANGE. The actual change is
-- supabase.auth.updateUser() on the browser client; this function only READS, so the live session
-- is never disrupted (that is the whole point of verifying here rather than via Supabase's
-- reauthentication nonce). Accounts with no password yet (OAuth/OTP-only) have a NULL/empty hash
-- and return false WITHOUT raising — the caller MUST gate this behind has_password() and only ever
-- call it in "change" mode (a first-time "set" needs only the active session). extensions.crypt is
-- the canonical bcrypt verify (same as verify_event_password against event_password_hash).
create function public.verify_current_password(p_password text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  select encrypted_password into v_hash
  from auth.users
  where id = (select auth.uid());

  if v_hash is null or v_hash = '' then
    return false; -- no password set; caller must be in "set" mode, not "change"
  end if;

  return extensions.crypt(coalesce(p_password, ''), v_hash) = v_hash;
end;
$$;

revoke all on function public.verify_current_password(text) from public, anon;
grant execute on function public.verify_current_password(text) to authenticated;
