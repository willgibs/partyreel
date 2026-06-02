# ADR-0008 — Account-from-guest + verified-email uploads (OTP)

- **Status:** Accepted (2026-06-02)
- **Phase:** Config/permissions rework — Phase 2 (cut 2c)

## Context

A host's "require email" setting stored an **unverified** typed string — the same theater we
removed guest display names over (cut 2b). We wanted require-email to mean a **confirmed** email,
and we wanted a verifying guest to gain a (free) account so they can later save events (Phase 3).
This must NOT regress the zero-friction anonymous flow: a guest scans a QR and uploads with no
account (ADR-0004's capability tokens). Supabase native email OTP (a 6-digit code) is free (not
SMS), so there's no new cost.

## Decision

The account layer **AUGMENTS** the anonymous capability-token flow; it never replaces it. The
contribution pipeline is untouched (presign → R2 → `create_media(session_token)` runs identically
whether the contributor is anonymous or verified). Signing in only supplies a verified email,
stamps `guests.user_id`, and (later) unlocks saved events.

- **Verified identity in `create_guest`.** `create_guest` derives `user_id` + `email` from
  `auth.uid()` → `auth.users` (incl. `email_confirmed_at`), **never from the client**. `require_email`
  becomes "require a confirmed session" (`auth.uid()` not null AND `email_confirmed_at` not null,
  else raise). The RPC is the trust boundary; the `/e/` RSC gate mirrors it for UX. The function
  KEEPS its 2-arg signature via **create-or-replace** (the `p_email` param is ignored) so there is no
  re-grant, advisors are unchanged, and there is no deploy-window breakage. `guests.user_id`
  (`references profiles(id) on delete set null`, indexed) is the account link; there is deliberately
  **no** unique `(event_id, user_id)` (that would break anonymous multi-join) — the localStorage
  `session_token` stays the dedupe.

- **OTP, code-first.** Entering an email calls `signInWithOtp({ email, options: { shouldCreateUser,
  emailRedirectTo } })`, which sends ONE email containing both a 6-digit code and a magic link. We
  lead with the **code** (`verifyOtp({ email, token, type: 'email' })` — no redirect, robust against
  the iPhone-PWA-opens-Safari magic-link gotcha); the link is a fallback. One shared `<EmailSignIn>`
  component backs both the host `/login` (alongside Google) and the guest `<VerifyEmailPrompt>`. The
  component owns no navigation — the caller's `onVerified` does (host → host-aware `router.push`;
  guest → `router.refresh()`).

- **Page-level gate, not just-in-time.** A `require_email` event is gated on `/e/[token]` BEFORE the
  upload panel renders: the RSC calls `getUser()` only when `require_email`, and the client swaps the
  upload slot for `<VerifyEmailPrompt>` while keeping the gallery visible (viewing is allowed). After
  verify, `router.refresh()` re-runs the gate and the real upload panel renders. This avoids losing a
  mid-upload file selection across the OTP round-trip.

- **Anonymous sign-ins stay OFF.** Capability tokens already give anonymous guests immediate use; a
  per-scan `auth.users` row would be DB bloat for no benefit, and the require-email gate needs a
  *verified* session (an anonymous session has no email), so it wouldn't satisfy the gate anyway.

## Consequences

- Require-email events now collect a **verified** email and produce a real (free) account per guest
  who verifies — the seed for Phase 3 saved events.
- Anonymous, non-require-email uploads are unchanged: `create_guest({ qr_token })` with `auth.uid()`
  null → `user_id`/`email` null, capability-token upload as before.
- Human prerequisites (live only): the **apex** Supabase redirect allowlist must include
  `https://partyreel.com/auth/callback**` (the guest magic link carries `?next=/e/[token]`); the
  "Magic Link" email template must contain `{{ .Token }}` (the code) as well as `{{ .ConfirmationURL }}`.
- `input-otp` is hand-authored (`ui/input-otp.tsx`) because the radix-nova shadcn registry lacks it.
- Extends ADR-0004 (capability tokens) — the account layer sits ON TOP of it, not instead of it.
