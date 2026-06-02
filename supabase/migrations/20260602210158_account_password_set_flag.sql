-- Fix: distinguish a USER-SET password from the GoTrue OTP/magic-link signup PLACEHOLDER (ADR-0011).
--
-- Live testing (2026-06-02) found Supabase/GoTrue writes a NON-NULL bcrypt encrypted_password
-- PLACEHOLDER when signInWithOtp/magic-link creates an email user (providers=['email']) — verified: an
-- OTP-only account has a 60-char $2a$ hash, while a Google-origin account (providers=['google']) has
-- NULL. So has_password() = (encrypted_password IS NOT NULL) wrongly returned true for EVERY email/OTP
-- account, and /account showed the CHANGE form (asking for a current password the host never set, and
-- can't know) instead of SET — the host is stuck. The placeholder is NOT a usable credential
-- (signInWithPassword fails for them), so for our UX it must read as "no password".
--
-- auth.users can't tell a real password from the placeholder (both are $2a$ bcrypt, providers=['email']
-- either way). So track it ourselves: a flag the app stamps right after a deliberate
-- updateUser({password}). has_password() reads the flag. Unambiguous for every origin (Google/OTP/new).

alter table public.profiles add column password_set_at timestamptz;
comment on column public.profiles.password_set_at is
  'When the user last SET/changed an email+password credential via updateUser (stamped by mark_password_set right after). NULL = no user-set password; the GoTrue OTP/magic-link signup placeholder and Google sign-in do NOT count. Read by has_password(). NOT in the host column-update grant (service-role / RPC-write-only, like tier/storage_*).';

-- mark_password_set — the client calls this immediately after a successful updateUser({password})
-- (create / set / change / reset). SECURITY DEFINER so it writes the service-role-only column past RLS.
-- Authenticated-only (revoked from anon/public), auth.uid()-based: same locked-down class as save_event
-- (advisor lint 0029, NEVER anon 0028).
create function public.mark_password_set()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set password_set_at = now() where id = (select auth.uid());
$$;

revoke all on function public.mark_password_set() from public, anon;
grant execute on function public.mark_password_set() to authenticated;

-- has_password() now reflects a USER-SET password (the flag), not the GoTrue placeholder.
create or replace function public.has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and password_set_at is not null
  );
$$;
