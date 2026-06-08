# Auth & host accounts

> ROLE: how hosts (and operators) authenticate + the account/profile model.
> BELONGS HERE: Supabase Auth setup, the `getUser` boundary, identity linking, email+password, avatars, display names, the `profiles` column-lock. · NOT HERE: the admin MFA gate (→ [admin-observability.md](admin-observability.md)), guest identity / `require_email` (→ [guest-flow.md](guest-flow.md)), the RLS/advisor model (→ [database-security.md](database-security.md)).
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
- Account page: `/account` — password set/change, [`display-name-form.tsx`](../../src/components/app/display-name-form.tsx),
  [`account-avatar-form.tsx`](../../src/components/app/account-avatar-form.tsx) + [`avatar-cropper.tsx`](../../src/components/app/avatar-cropper.tsx).
- Password length single-source: `MIN_PASSWORD_LENGTH` in [`validation/auth.ts`](../../src/lib/validation/auth.ts).

## Invariants (don't break)

- **Authorize with `supabase.auth.getUser()`, NEVER `getSession()`.** `getUser()` re-validates the JWT
  with the auth server; `getSession()` only decodes the (spoofable) cookie. The proxy refreshes the cookie
  but is **not** a security boundary. *(This is a cross-cutting landmine — also echoed in CLAUDE.md.)*
- Use **`@supabase/ssr`** (not the deprecated `auth-helpers`); the cookie API is **`getAll`/`setAll`**,
  never the old get/set/remove.
- Supabase's **OAuth Server** (project-as-IdP beta toggle) stays **OFF** — Partyreel is a client of Google
  OAuth, not an IdP.
- **`profiles` is host-writable only on `display_name`, `email`, `announcements_seen_at`, `welcomed_at`**
  (the `grant update(...)` allowlist); `tier` / `storage_*` / `is_admin` / `stripe_*` / `avatar_updated_at`
  / `password_set_at` are service-role / webhook only. → [database-security.md](database-security.md).
- The password hash never leaves the DB: `has_password` / `verify_current_password` are authenticated-only
  SECURITY DEFINER RPCs that return booleans.

## Gotchas (why it's like this — don't revert)

- **`has_password()` must NOT read `auth.users.encrypted_password`.** GoTrue writes a NON-NULL bcrypt
  PLACEHOLDER for every email OTP/magic-link signup (`providers=['email']`; Google-origin stays NULL), so
  `encrypted_password IS NOT NULL` is true for OTP-origin hosts who never set a password — they'd wrongly
  see the `/account` CHANGE form asking for a current password they don't have. Fix: a service-role
  `profiles.password_set_at`, stamped by **`mark_password_set()`** which the client calls right after every
  successful `updateUser({password})`; `has_password()` reads the flag (migration `…210158`).
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
- **`handle_new_user` no longer falls back to the email local-part** for `display_name` (a one-time backfill
  nulled those), so a null `display_name` genuinely means "not set" — which the guest "Hosted by" byline keys
  off. Google/OAuth still populate it from `full_name`.

## See also

[ADR-0011](../adr/0011-email-password-auth.md) (email+password) · [ADR-0008](../adr/0008-account-from-guest-verified-email.md) (account-from-guest) · [database-security.md](database-security.md) · [admin-observability.md](admin-observability.md) (the MFA/AAL2 gate reuses this).
