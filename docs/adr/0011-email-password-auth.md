# ADR-0011 — Email + password as an additional credential

- **Status:** Accepted (2026-06-02)
- **Phase:** One-off task (post phased-build). A parallel sign-in method, not a replacement.
- **Extends:** [ADR-0008](0008-account-from-guest-verified-email.md) (reuses the verified-email OTP
  path). Does not change [ADR-0004](0004-anonymous-guests-capability-tokens.md) (guests stay anonymous
  + passwordless).

## Context

Hosts could sign in only passwordlessly: email OTP (6-digit code) + magic-link via the shared
`signInWithOtp` / `verifyOtp` component, and Google OAuth. Some hosts want a traditional **email +
password** login. The requirement: it must work **in parallel** with the existing paths, the same
account must be reachable through all of them, and a host who originally signed up via Google or
magic-link must be able to add a password only after ownership is confirmed.

## Decision

**A password is one more credential on the same `auth.users` row.** Supabase auto-links identities by
*verified* email (see SYSTEMS "Auth"), and the password lives in `auth.users.encrypted_password`
(managed by Supabase) — so "reachable through all paths" is automatic and **no app schema stores the
password**. Ownership is always proven *before* a password is written:

- **New account** — `/login` "Create account" proves email ownership via the **existing** OTP path
  (`signInWithOtp` → `verifyOtp({type:'email'})`), then sets the chosen password via
  `supabase.auth.updateUser({ password })` on the now-verified session. We deliberately do **NOT** use
  `signUp({email,password})` (it has anti-enumeration quirks + a separate "Confirm signup" verify type,
  and would write a password before verification).
- **Passwordless host adds a password** — from the new `/account` page while logged in →
  `updateUser({ password })`. The active verified session **is** the ownership proof (this is the
  Google/magic-link edge case, handled with no special-casing).
- **Returning host** — `signInWithPassword({ email, password })`.
- **Forgot / never-set** — reuse the OTP sign-in (code → verify → now signed in) → land on
  `/account?reset=1` to set a new password. **No separate Supabase "Reset Password" recovery template
  or `type:'recovery'` branch** (the existing OTP path already creates a live session; this reuses it).

**Login page leads with email + password**; the email-code path is the alternative ("Email me a code
instead"), Google stays, plus "Forgot password?" and a "Create account" toggle. The shared
`<EmailSignIn>` (also used by guests via `<VerifyEmailPrompt>` and the save-event dialog) is reused
**UNCHANGED** — password UI is additive, so the guest flow stays frictionless and code-first.

**Two new DB objects** (migration `…200420_account_password`), both authenticated-only SECURITY DEFINER
RPCs that only READ `auth.users` and return booleans (the hash never leaves the DB):

- `has_password()` — drives the `/account` Set-vs-Change copy + whether the current-password field shows.
- `verify_current_password(p_password)` — re-confirms the current password before a CHANGE (the user's
  chosen check). It only READS (`extensions.crypt(...) = hash`), so the session is never disrupted — the
  actual change is `updateUser()` on the **browser** client. First-time **set** uses only the session.

Both appear in the **authenticated** advisor list (`0029`), never the anon list (`0028`) — same class
as `set_event_password`. No table/column/enum change; `handle_new_user` is unchanged.

**Generic sign-in error.** `signInWithPassword` returns the same `Invalid login credentials` for a
wrong password, an account with no password set, and an unknown email (anti-enumeration). The UI NEVER
says "wrong password"; it offers the code / Google / forgot affordances — which is exactly how a
Google/magic-link-only user proves ownership and then sets a password.

## Consequences

- One mental model: prove ownership (OTP / live session / forgot-OTP) → `updateUser({ password })`. The
  same account works via password, code, magic-link, and Google interchangeably.
- **Risk C (accepted):** in create / forgot, tapping the magic **LINK** instead of entering the code
  leaves the page (→ `/auth/callback` → dashboard), so the held intent (set a password) is lost; the
  host lands password-less and sets one in `/account`. We lead with the code; documented, not fixed.
- **Config interactions (human, Supabase dashboard — see STATUS):** "Allow new user signups" ON +
  `{{ .Token }}` in the "Confirm signup" template (both already launch blockers) gate create-account;
  set "Minimum password length" = 8 (mirrors `MIN_PASSWORD_LENGTH`); **enable** leaked-password
  protection (HaveIBeenPwned); keep **"Secure password change" OFF** (ON would force a reauthentication
  nonce on `updateUser`, breaking the current-password-RPC design).
- No new Supabase redirect-allow-list entries: `signInWithPassword` / `updateUser` are in-page (no
  redirect); the magic-link / Google paths ride the existing bare `…/auth/callback` entry.
