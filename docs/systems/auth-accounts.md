# Auth & host accounts

> ROLE: how hosts (and operators) authenticate + the account/profile model.
> BELONGS HERE: Supabase Auth setup, the `getUser` boundary, identity linking, email+password, avatars, display names, the `profiles` column-lock, account deletion. · NOT HERE: the admin MFA gate (→ [admin-observability.md](admin-observability.md)), guest identity / `allow_anonymous_uploads` (→ [guest-flow.md](guest-flow.md)), the RLS/advisor model (→ [database-security.md](database-security.md)).
> GROWS BY: integrate-in-place.

## What it does

Supabase Auth with three interchangeable credentials on ONE `auth.users` row: **email + password**,
**email magic-link / OTP**, and **Google OAuth** ([`(auth)/login`](../../src/app/(auth)) +
[`/auth/callback`](../../src/app/(auth)/auth/callback/route.ts)). The `(app)` layout
([`layout.tsx`](../../src/app/(app)/layout.tsx)) is the single gate. The `handle_new_user` trigger creates
one `profiles` row per signup.

## Where it lives

- Clients: [`../../src/lib/supabase/`](../../src/lib/supabase) — `client` / `server` / `middleware` / `admin`.
- Sign-in UI: [`password-sign-in.tsx`](../../src/components/auth/password-sign-in.tsx) (host `/login`, leads
  with password) wraps the shared [`email-sign-in.tsx`](../../src/components/auth/email-sign-in.tsx) (code +
  magic-link OTP, reused by the guest prompt too); [`login-form.tsx`](../../src/components/auth/login-form.tsx).
- Account page: `/account` — the **Plan card** (first on the page), password set/change,
  [`display-name-form.tsx`](../../src/components/app/display-name-form.tsx),
  [`account-avatar-form.tsx`](../../src/components/app/account-avatar-form.tsx) + [`avatar-cropper.tsx`](../../src/components/app/avatar-cropper.tsx).
  **The Plan card is billing's only front door** (`you=?`, Will 2026-09-20: "plans, billing, etc should
  live under an account page"). Until 2026-09-20 the sole path to a plan anywhere in the app was a
  popover on the dashboard's storage strip. It shows the tier, the storage line, the event cap
  ("3 of 3 used" — the upgrade trigger), an Event Pass's expiry, and Manage billing / Renew.
  ★ **Every fact on it is server-derived**: `tier`, `storage_cap_bytes`, `event_slots` and
  `tier_expires_at` are webhook-written columns read through the RLS-scoped profile row, and the page's
  only search param stays `?reset`. A Plan card is exactly where trusting the client would be cheapest
  and worst → [billing-caps.md](billing-caps.md); [plan-card.test.ts](../../src/app/(app)/account/plan-card.test.ts) pins the read path.
- Password length single-source: `MIN_PASSWORD_LENGTH` in [`validation/auth.ts`](../../src/lib/validation/auth.ts).
- Deletion: the request in [`db/mutations/account.ts`](../../src/lib/db/mutations/account.ts), the hard delete in
  [`lifecycle/account-deletion.ts`](../../src/lib/lifecycle/account-deletion.ts) (`purgeAccount` /
  `sweepDeletedAccounts`, called once from the purge cron), the plan cancellation in
  [`stripe/account-cancel.ts`](../../src/lib/stripe/account-cancel.ts); surfaces are the `/account`
  [delete card](../../src/components/app/account-delete-card.tsx) and the operator trigger on
  [`/admin/accounts/[id]`](../../src/app/admin/accounts).

## Invariants (don't break)

- **Authorize with `supabase.auth.getUser()`, NEVER `getSession()`.** `getUser()` re-validates the JWT
  with the auth server; `getSession()` only decodes the (spoofable) cookie. The proxy refreshes the cookie
  but is **not** a security boundary. *(This is a cross-cutting landmine — also echoed in CLAUDE.md.)*
- Use **`@supabase/ssr`** (not the deprecated `auth-helpers`); the cookie API is **`getAll`/`setAll`**,
  never the old get/set/remove.
- Supabase's **OAuth Server** (project-as-IdP beta toggle) stays **OFF** — Partyreel is a client of Google
  OAuth, not an IdP.
- **`profiles` is host-writable only on `email`, `announcements_seen_at`, `welcomed_at`** (the `grant
  update(...)` allowlist); `display_name` (client UPDATE revoked, see the display-name gotcha below),
  `tier` / `storage_*` / `is_admin` / `stripe_*` / `avatar_updated_at` / `password_set_at` are service-role /
  webhook only. → [database-security.md](database-security.md).
- The password hash never leaves the DB: `has_password` / `verify_current_password` are authenticated-only
  SECURITY DEFINER RPCs that return booleans.
- **Account deletion is IMMEDIATE, has no undo, and cancels an active plan** (Will, 2026-09-02). The request
  cancels the subscription FIRST and refuses everything if Stripe will not play (nothing is destroyed, so
  "deleted but still billed" is unreachable), then stamps `profiles.deletion_requested_at`, bins every hosted
  event, removes the address from `newsletter_signups`, anonymises the profile (email / display_name / slug /
  avatar, never an entitlement column) and bans the auth user. ★ **The auth.users row is deleted only by the
  sweep, and only at ZERO remaining events** — that FK chain is `auth.users → profiles → events → media`, all
  CASCADE, so deleting it early destroys the `original_key`/`preview_key` rows the R2 delete still needs; the
  zero check is a `mustCount`, because a failed count reads as a confident zero. A **forensic hold** on any of
  the account's own events outranks the request: that event is skipped whole, the account never
  reaches zero, and it waits anonymised until the hold lifts. `guests.user_id` / `media.guest_id` are
  `ON DELETE SET NULL`, so the account's uploads to OTHER hosts' events survive, unlinked — that is the FK, not
  app code, and it is the promise `/privacy` makes.
- **`deletion_requested_at` is service-role-write-only by construction** (migration `20260902130000`): the
  `profiles` write grant is a table-level revoke plus a column allowlist, so a new column is fail-closed and
  there is no client un-request path. Never add it to that allowlist.
- **The re-verification is enforced in the server action, not the dialog.** `deleteMyAccountAction` re-checks
  the password (via `verify_current_password`) or a fresh email OTP itself, because a server action is a public
  endpoint and the attack re-verification exists to stop is a borrowed session. The address a code is sent to
  and verified against is read from the caller's own row, never from the request.

## Gotchas (why it's like this — don't revert)

- **`has_password()` must NOT read `auth.users.encrypted_password`.** GoTrue writes a NON-NULL bcrypt
  PLACEHOLDER for every email OTP/magic-link signup (`providers=['email']`; Google-origin stays NULL), so
  `encrypted_password IS NOT NULL` is true for OTP-origin hosts who never set a password — they'd wrongly
  see the `/account` CHANGE form asking for a current password they don't have. Fix: a service-role
  `profiles.password_set_at`, stamped by **`mark_password_set()`** which the client calls right after every
  successful `updateUser({password})`; `has_password()` reads the flag (migration `…210158`).
- **Ownership is proven BEFORE a password is ever written, and there is no `signUp({email,password})`.**
  Every path is the same shape: prove the email (a fresh OTP verify, or an already-live session), then
  `updateUser({ password })`. Creating an account runs the ordinary OTP sign-in first; a Google or
  magic-link host adds a password from `/account` on their live session, which is the proof; "forgot"
  reuses the OTP sign-in and lands on `/account?reset=1`. `signUp({email,password})` is avoided
  deliberately (it carries anti-enumeration quirks and its own "Confirm signup" verify type, and it would
  write a password before the address is proven), and there is NO Supabase recovery template and no
  `type:'recovery'` branch to maintain, because a verified OTP already yields a live session. Accepted
  edge: in create or forgot, tapping the magic LINK instead of typing the code leaves the page for
  `/auth/callback`, so the held intent is lost and the host lands password-less; the UI leads with the
  code for that reason.
- **The email OTP leads with the CODE, and the magic link is the fallback.** One Supabase email carries
  both. An iPhone PWA opens a tapped link in Safari rather than the installed app, which strands a
  mid-flow guest or host outside the session they just created; `verifyOtp({ type: 'email' })` needs no
  redirect at all. The shared [`email-sign-in.tsx`](../../src/components/auth/email-sign-in.tsx) owns NO
  navigation: its caller's `onVerified` decides (host to the dashboard, guest to a `router.refresh()`),
  which is why the host login, the guest entry gate and the save dialog can all reuse it unchanged.
- **`updateUser({password})` runs on the BROWSER client** (it rotates the session; the browser cookie write
  is unconditional). The current-password re-check before a CHANGE is the `verify_current_password` RPC
  (READ-only → no session disruption); a first-time SET needs only the session.
- **`signInWithPassword`'s error is GENERIC by design** (wrong pw / no pw set / unknown email are
  indistinguishable — anti-enumeration). NEVER say "wrong password"; offer the code / Google / forgot affordances.
- **Identity linking:** Supabase auto-links identities that share a **verified** email into ONE user (so
  magic-link + Google for the same email land on the same account); it refuses to link an *unverified*
  email (anti-takeover). Matching is exact-string, so Gmail dot/plus aliases (`will.g+x@…`) are distinct users.
- **Dashboard ↔ code lockstep (set in the Supabase dashboard):** keep "Secure password change" **OFF** (ON
  forces a reauth nonce → breaks the `verify_current_password` design) and "Require current password" OFF;
  "Minimum password length" must equal `MIN_PASSWORD_LENGTH` (8); "Email OTP Length" must equal `OTP_LENGTH`
  (6) in [`email-sign-in.tsx`](../../src/components/auth/email-sign-in.tsx); enable leaked-password protection.
  Both email templates must carry `{{ .Token }}` alongside `{{ .ConfirmationURL }}` (Magic Link and Confirm
  signup), or the code-first flow ships an email with no code in it, and "Allow new user signups" must stay
  ON or account creation dies at the first OTP. The apex `https://partyreel.com/auth/callback**` entry in
  the redirect allow-list is what lets a guest magic link carry its `?next=/e/[token]` back.
- **Avatars are deterministic + orphan-free by construction.** The cropper re-encodes to a 512px WebP
  client-side → `POST /api/account/avatar` (validated server-side: content-type + size + magic-byte WebP
  sniff, so no SVG/XSS) → a DETERMINISTIC object `<id>/avatar.webp` in the **public Supabase Storage
  `avatars` bucket** ([`avatar-storage.ts`](../../src/lib/supabase/avatar-storage.ts), written via the
  service-role admin client, which bypasses storage RLS — so the bucket needs no policies). Upload uses
  `upsert` ⇒ exactly one object per user ⇒ zero orphans; DELETE removes the object **then** clears the marker
  (object-first). `profiles.avatar_updated_at` (service-role-write-only) is the existence marker AND the
  `?v=` cache-bust on the stable public CDN URL, so a replace busts caches without a per-render presign. The
  guest "Hosted by" byline reuses this via a server-only admin read
  ([`getHostAvatarUrl`](../../src/lib/db/queries/guest-events-admin.ts)) keyed on `events.host_id` — no
  anon-RPC change. Bytes ride Supabase infra durability (separate from the R2 media WORM backup), not pg_dump;
  derivable, so that's by design.
- **Display name is REQUIRED, public, and service-role-write-only.** `handle_new_user`
  leaves `display_name` NULL for ALL signups (incl. OAuth — it no longer copies `full_name`/`name`), so null
  genuinely means "not set"; the host onboarding step + the guest upload name step then collect it, PREFILLING
  the input from `user_metadata.full_name` for OAuth (so even a Google name passes through the one filter). The
  ONLY write path is `updateDisplayNameAction` (getUser → `displayNameSchema` (min 1 / max 60 / reserved-name)
  → `containsProfanity` (`obscenity`, tuned word-boundary so real names like Anushka/Shitij aren't blocked) →
  ADMIN-client write); the `authenticated` UPDATE grant on the column was revoked so a public name can't be set
  unfiltered. A null/invalid name gates `/dashboard` (+ `/dashboard/new`) and the guest upload to the name step;
  `/account` is exempt so it can be set there. The "Hosted by" byline + uploader attribution render it.

- **A GoTrue ban invalidates a LIVE token, not just the next sign-in** (measured 2026-09-02). Setting
  `ban_duration` via `auth.admin.updateUserById` makes sign-in fail ("User is banned"), refresh fail, AND an
  already-issued access token stop validating — because `getUser()` re-validates with the auth server on every
  call. So a deleted-but-not-yet-swept account has NO window in which a cached session keeps working. This is
  the concrete payoff of the `getUser()`-not-`getSession()` landmine above: an "optimisation" to `getSession()`
  anywhere in the authz path would reopen exactly that window.
- **Cancelling an already-canceled Stripe subscription RAISES `resource_missing`** (measured 2026-09-02); it
  does not return the object. `cancelSubscriptionForDeletion` maps that code to success, which is what keeps a
  retried deletion from aborting on a plan that is already in the state we wanted.

## See also

[guest-flow.md](guest-flow.md) (account-from-guest: the guest side of the same sign-in) · [database-security.md](database-security.md) · [admin-observability.md](admin-observability.md) (the MFA/AAL2 gate reuses this).
