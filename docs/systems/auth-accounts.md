# Auth & host accounts

> ROLE: how hosts (and operators) authenticate + the account/profile model.
> BELONGS HERE: Supabase Auth setup, the `getUser` boundary, identity linking, email+password, avatars, display names, the `profiles` column-lock, account deletion. · NOT HERE: the admin MFA gate (→ [admin-observability.md](admin-observability.md)), guest identity, the name-only door and `require_verified_email` (→ [guest-flow.md](guest-flow.md)), the RLS/advisor model (→ [database-security.md](database-security.md)).
> GROWS BY: integrate-in-place.

## What it does

Supabase Auth with three interchangeable credentials on ONE `auth.users` row: **email magic-link / OTP**
(the lead), **Google OAuth**, and **email + password** (a quiet second door), plus **passkeys behind a
flag** ([`(auth)/login`](../../src/app/(auth)) + [`/auth/callback`](../../src/app/(auth)/auth/callback/route.ts)).
The `(app)` layout ([`layout.tsx`](../../src/app/(app)/layout.tsx)) is the single sign-in gate. The
`handle_new_user` trigger creates one `profiles` row per signup.

## Where it lives

- Clients: [`lib/supabase/`](../../src/lib/supabase) — `client` / `server` / `middleware` / `admin`.
- **ONE account door, worn five ways** ([`account-door.tsx`](../../src/components/auth/account-door.tsx)):
  `<AccountDoor>` renders on the host `/login`, the guest gate
  ([`enter-event-prompt.tsx`](../../src/components/guest/enter-event-prompt.tsx)), Save
  ([`save-event-button.tsx`](../../src/components/guest/save-event-button.tsx)), a like
  ([`likes-provider.tsx`](../../src/components/likes/likes-provider.tsx)) and a name-only guest's own two
  rows ([`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx)'s way out and the header's
  [`guest-name-menu.tsx`](../../src/components/guest/guest-name-menu.tsx)). Each passes only its REASON
  (`wear`), its methods and where a redirect returns. `DOOR_WEAR` is the one table of headings and reason
  lines; a surface with its own semantic title (a `DialogTitle`, the gate's framing) reads the words from
  it and passes `chrome="none"`. **Every wear carries the Terms line** (`consent`, default true) except the
  gate, whose welcome step already says it.
  ★ **The words ask for a CONFIRMED EMAIL, not an account.** `save` and `like` say what confirming does,
  then name the free account as what it MAKES. `gate`'s sentence is Will's, verbatim, and changes only by
  his ruling. `signin` is the fifth wear, for a named guest at a party who already holds an account and
  wants tonight's photographs in it.
- Inside it: [`email-sign-in.tsx`](../../src/components/auth/email-sign-in.tsx) (the one field: code +
  magic-link OTP), [`password-sign-in.tsx`](../../src/components/auth/password-sign-in.tsx) (`SignIn` behind
  the quiet "Have a password?" link, and `SetInitialPassword` at the end of forgot-password),
  [`failure-paths.tsx`](../../src/components/auth/failure-paths.tsx) over
  [`door-failure.ts`](../../src/lib/auth/door-failure.ts), and
  [`login-form.tsx`](../../src/components/auth/login-form.tsx), a thin `/login` wrapper that owns only the
  host-aware landing.
- Account page: `/account` — the **Plan card** (first on the page), password set/change,
  [`display-name-form.tsx`](../../src/components/app/display-name-form.tsx),
  [`account-avatar-form.tsx`](../../src/components/app/account-avatar-form.tsx) + [`avatar-cropper.tsx`](../../src/components/app/avatar-cropper.tsx).
  **The Plan card (`#plan`) is billing's only home in the app**: there is no billing page, and the user
  menu's plan row links to that anchor. It shows the plan, storage, the event cap ("3 of 3 used", the
  upgrade trigger) and a Pass's expiry, with the pricing sheet, Manage billing and Renew.
  ★ **Every fact on the Plan card is server-derived**: `tier`, `storage_cap_bytes`, `event_slots` and
  `tier_expires_at` are webhook-written columns read through the RLS-scoped profile row, and the page's
  only search params are `?reset` and `?welcome` (Stripe's return marker, which opens the receipt and never
  decides a plan). A Plan card is exactly where trusting the client would be cheapest and worst →
  [billing-caps.md](billing-caps.md); [plan-card.test.ts](../../src/app/(app)/account/plan-card.test.ts) pins the read path.
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
  but is **not** a security boundary.
- Use **`@supabase/ssr`** (never the deprecated `auth-helpers`); the cookie API is **`getAll`/`setAll`**,
  never get/set/remove.
- Supabase's **OAuth Server** (project-as-IdP beta toggle) stays **OFF** — Partyreel is a client of Google
  OAuth, not an IdP.
- **`profiles` is host-writable only on `announcements_seen_at` and `welcomed_at`**: a table-level revoke
  plus the `grant update(...)` allowlist, so a new column is fail-closed. Everything else is service-role
  or webhook only: `email` (the recipient of every transactional email, so a client write would be a
  mail-redirect primitive), `display_name` (see the display-name gotcha below), `tier` / `storage_*` /
  `is_admin` / `stripe_*` / `avatar_updated_at` / `password_set_at`, and `deletion_requested_at`, which has
  no client un-request path: never add it to the allowlist. → [database-security.md](database-security.md).
- The password hash never leaves the DB: `has_password` / `verify_current_password` are authenticated-only
  SECURITY DEFINER RPCs that return booleans.
- **Account deletion is IMMEDIATE, has no undo, and cancels an active plan.** The request cancels the
  subscription FIRST and refuses everything if Stripe will not play (nothing is destroyed, so "deleted but
  still billed" is unreachable), then stamps `profiles.deletion_requested_at`, bins every hosted event,
  removes the address from `newsletter_signups`, anonymises the profile (email / display_name / slug /
  avatar, never an entitlement column) and bans the auth user. ★ **The auth.users row is deleted only by the
  sweep, and only at ZERO remaining events** — that FK chain is `auth.users → profiles → events → media`, all
  CASCADE, so deleting it early destroys the `original_key`/`preview_key` rows the R2 delete still needs; the
  zero check is a `mustCount`, because a failed count reads as a confident zero. A **forensic hold** on any of
  the account's own events outranks the request: that event is skipped whole, the account never reaches
  zero, and it waits anonymised until the hold lifts. `guests.user_id` / `media.guest_id` are
  `ON DELETE SET NULL`, so the account's uploads to OTHER hosts' events survive, unlinked: the FK, not app
  code, keeps the promise `/privacy` makes.
- **The re-verification is enforced in the server action, not the dialog.** `deleteMyAccountAction` re-checks
  the password (via `verify_current_password`) or a fresh email OTP itself, because a server action is a public
  endpoint and the attack re-verification exists to stop is a borrowed session. The address a code is sent to
  and verified against is the caller's own, read through `getUser()`, never taken from the request.
- ★ **AN ADDRESS TYPED AT THE GUEST DOOR IS INERT, AND THE NO-ORACLE RULE STANDS.** The names-mode door takes
  an OPTIONAL address into `guests.pending_email`: it proves nothing, signs nobody in, is never shown to the
  host or to another guest, is never mailed on its own, and never reaches `auth.users`. It is accepted
  whether or not it belongs to a member, because refusing it, or diverting to a sign-in because it is known,
  would make the door an account-enumeration oracle (the "never say it before a verify" gotcha below). The
  one path from unconfirmed to confirmed is a claim run from the caller's OWN confirmed address
  (→ [guest-flow.md](guest-flow.md)).

## Gotchas (why it's like this — don't revert)

- **`has_password()` must NOT read `auth.users.encrypted_password`.** GoTrue writes a NON-NULL bcrypt
  PLACEHOLDER for every email OTP/magic-link signup (`providers=['email']`; Google-origin stays NULL), so
  `encrypted_password IS NOT NULL` would show an OTP-origin host the `/account` CHANGE form for a password
  they never set. `has_password()` reads the service-role `profiles.password_set_at` instead, stamped by
  **`mark_password_set()`**, which the client calls right after every successful `updateUser({password})`.
- **Ownership is proven BEFORE a password is ever written, and there is no `signUp({email,password})`.**
  Every path is the same shape: prove the email (a fresh OTP verify, or an already-live session), then
  `updateUser({ password })`. **Creating an account IS the code path**: the door writes no password at all,
  so a brand-new host never picks one; a Google or magic-link host adds one from `/account` on their live
  session, which is the proof. "Forgot" verifies a code and finishes in the door itself
  (`SetInitialPassword`); `/account?reset=1` (the Password card in set mode) has no in-app link.
  `signUp({email,password})` is avoided deliberately (anti-enumeration quirks, its own "Confirm signup"
  verify type, and a password written before the address is proven), and there is NO Supabase recovery
  template and no `type:'recovery'` branch, because a verified OTP already yields a live session.
- **"You already had an account" is a SERVER fact, decided only after the code.**
  [`checkExistingAccount`](../../src/app/(auth)/actions.ts) re-checks `getUser()` and reads the caller's OWN
  `profiles` row: a `welcomed_at`, a `password_set_at`, or a row more than three minutes older than this
  sign-in. ★ Never say it before a verify (that is the enumeration oracle again), never from a browser
  clock, and never on a plain sign-in — only under a CREATE intent, or every returning host's code reads as
  a warning. The line is dismissible with "Not you? Sign out"; ★ on the guest gate the door HOLDS the
  caller's `onVerified` for four seconds or until a choice, because `claimAnonymousUploads` stamps a
  guest's photographs onto the signed-in account and the claim RPC never re-stamps an owned row.
  ★ **Every guest-side wear AWAITS the uploads claim before it refreshes.** The capture door, the mark's own
  way out and the header's menu all exist to make these photographs this account's; a `router.refresh()`
  that overtook the claim would redraw the very credit the guest just paid an email to fix, still marked.
  The claim is best-effort and never throws, so awaiting it costs one round trip. ★ **The claim names only
  a nameless profile**: under a confirmed session `claim_anonymous_uploads` copies the newest claimed row's
  typed name onto a profile with none (and marks the rows verified); unconfirmed, it stamps `user_id` and
  nothing else. [`claim-handle-prompt.tsx`](../../src/components/guest/claim-handle-prompt.tsx) backs it
  with one `updateDisplayNameAction` call from the name this device typed; neither overwrites a name.
- **One failure table, three real ways out** ([`door-failure.ts`](../../src/lib/auth/door-failure.ts)): a
  kind (`expired_link`, `wrong_code`, `send_failed`, `rate_limited`, `google_failed`, `password_mismatch`),
  one short line and three actions. The callback route emits the KIND (`?error=expired_link`;
  `auth_callback`, the flag older links still carry, and Supabase's own `otp_expired` / `access_denied` /
  `server_error` map through `doorFailureKind`), and `/login` renders it. ★ A recovery already on screen is
  not promoted twice: `suppress` drops the ids the surface's own ladder shows, which is why the password
  door gets all three buttons and the code-led door gets the line over the controls it already has.
- **The email OTP leads with the CODE, and the magic link is the fallback.** One Supabase email carries
  both. An iPhone PWA opens a tapped link in Safari rather than the installed app, which strands a
  mid-flow guest or host outside the session they just created; `verifyOtp({ type: 'email' })` needs no
  redirect at all. The shared [`email-sign-in.tsx`](../../src/components/auth/email-sign-in.tsx) owns NO
  navigation: `<AccountDoor>` decides what a verified code leads to, and each wear's `onVerified` decides
  what happens then (host to the dashboard, guest to a `router.refresh()`), which is why one object serves
  every wear. Accepted edge: tapping the magic LINK instead of typing the code leaves the page for
  `/auth/callback`, so an in-page step (the existing-account line, the passkey offer) is lost and the host
  simply lands in the app; the UI leads with the code for that reason.
- **`updateUser({password})` runs on the BROWSER client** (it rotates the session; the browser cookie write
  is unconditional). The current-password re-check before a CHANGE is the `verify_current_password` RPC
  (READ-only → no session disruption); a first-time SET needs only the session.
- **`signInWithPassword`'s error is GENERIC by design** (wrong pw / no pw set / unknown email are
  indistinguishable — anti-enumeration). NEVER say "wrong password". The sentence is `door-failure.ts`'s
  `password_mismatch` line, with the three recoveries (a code, a new password, Google) as real buttons under
  it; `door-failure.test.ts` refuses a specific one.
- **Passkeys are OFF until two dashboard settings are true, and the flag is how.** `NEXT_PUBLIC_PASSKEYS=1`
  opts [`supabase/client.ts`](../../src/lib/supabase/client.ts) into auth-js's EXPERIMENTAL
  `auth.experimental.passkey` (without it, 2.106 throws from `signInWithPasskey` / `registerPasskey` /
  `auth.passkey.*`) and turns on the one-press button on `/login`, the offer after a code sign-in, and the
  [Passkeys card](../../src/app/(app)/account/passkeys-card.tsx). ★ **Will must enable passkeys in the
  Supabase dashboard AND set the WebAuthn Relying Party id to the apex first**: a passkey registered against
  the wrong RP id is a credential the door can never see again. The ceremony is the browser's (a live
  session is the authorisation), so there is no server action.
- **The one-press is never an auto sign-in.** auth-js's WebAuthn helper has no conditional mediation, so
  the passkey button is drawn from a device HINT (`pr_passkey_hint`) plus `"PublicKeyCredential" in window`
  rather than by asking the browser on load, which would throw a system sheet at a stranger; a stale hint
  costs one refused press and clears itself. Google's hinted "Continue as …" passes `login_hint` WITH
  `prompt=select_account`, so a shared laptop always sees the chooser.
- **The remembered address is `/login`-only, by prop** ([`remembered-email.ts`](../../src/lib/auth/remembered-email.ts)).
  A hint, never an authorization: it is parsed like untrusted input (it is the visitor's own storage),
  every read and write is wrapped because `localStorage` THROWS when site data is blocked, and it is shown
  masked. ★ The guest gate and the Save dialog pass no hint at all — a phone passed around a party and a
  venue's iPad must never show the last guest's address to the next one — and no email ever goes in a URL.
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
  the redirect allow-list is what lets a guest magic link carry its `?next=/e/[token]` back. Passkeys
  (Auth → Sign In / Providers) must be ENABLED, RP id = the apex, before `NEXT_PUBLIC_PASSKEYS=1` ships
  anywhere (the passkey gotcha above).
- **Avatars are deterministic + orphan-free by construction.** The cropper re-encodes to a 512px WebP
  client-side → `POST /api/account/avatar` (validated server-side: content-type + size + magic-byte WebP
  sniff, so no SVG/XSS) → a DETERMINISTIC object `<id>/avatar.webp` in the **public Supabase Storage
  `avatars` bucket** ([`avatar-storage.ts`](../../src/lib/supabase/avatar-storage.ts), written via the
  service-role admin client, which bypasses storage RLS — so the bucket needs no policies). Upload uses
  `upsert` ⇒ exactly one object per user ⇒ zero orphans; DELETE removes the object **then** clears the marker
  (object-first). ★ A profile with no photograph wears a SEEDED colour, never a grey disc: the generator
  `src/lib/avatar/gradient.ts` (the `mesh` look, one identity hue at four blended depths, zero dependencies,
  three contrast floors that `src/lib/avatar/measure.ts` holds at the disc's composited centre) is fed
  `seedFor(profiles.id)` (`src/lib/avatar/seed.ts`, a server-side SHA-256, so one person is one colour on
  every surface and a client never seeds from a raw id) and painted by `Avatar`'s `seed` prop under the
  initial and under the photograph. `profiles.avatar_updated_at` (service-role-write-only) is the existence
  marker AND the `?v=` cache-bust on the stable public CDN URL, so a replace busts caches without a
  per-render presign. The guest "Hosted by" byline gets the host's photo and seed from a server-only admin
  read ([`getHostAvatarSeed`](../../src/lib/db/queries/guest-events-admin.ts)) keyed on `events.host_id`, so
  the anon event RPC never returns the host id. Bytes ride Supabase infra durability (separate from the R2
  media WORM backup), not pg_dump; they are derivable, so that is by design.
- **Display name is REQUIRED, public, and service-role-write-only.** `handle_new_user` leaves
  `display_name` NULL for ALL signups (OAuth too), so null means "not set". `/welcome` and the guest door's
  name step collect it; `/welcome` PREFILLS from the OAuth `user_metadata` (`full_name`, else `name`) or the
  newest claimable guest row's typed name, so even a Google name passes the one filter. The ONLY write path
  is `updateDisplayNameAction` (`getUser()`, `displayNameSchema` (min 1 / max 60 / reserved-name),
  `containsProfanity` (`obscenity`, tuned word-boundary so real names like Anushka/Shitij pass), then an
  ADMIN-client write); the column has no `authenticated` UPDATE grant, so a public name can't be set
  unfiltered. A nameless signed-in guest is asked for one at the door's name step, and **a nameless account
  reaches no `(app)` route but `/welcome`** (one character is enough):
  `requireNamedProfile()` in [`(app)/name-gate.ts`](../../src/app/(app)/name-gate.ts) runs once each from
  [`dashboard/layout.tsx`](../../src/app/(app)/dashboard/layout.tsx) (the root, `/new`, every
  `/dashboard/[eventId]/*` room) and [`account/layout.tsx`](../../src/app/(app)/account/layout.tsx), and
  `/welcome` never calls it, or a nameless account could never reach the one page that names it. The
  "Hosted by" byline and uploader attribution render the name.
- **A GoTrue ban invalidates a LIVE token, not just the next sign-in.** Setting `ban_duration` via
  `auth.admin.updateUserById` fails sign-in ("User is banned"), refresh, AND an already-issued access token,
  because `getUser()` re-validates with the auth server on every call. A deleted-but-not-yet-swept account
  has NO window in which a cached session works, and a switch to `getSession()` anywhere in the authz path
  would reopen it.
- **Cancelling an already-canceled Stripe subscription RAISES `resource_missing`**; it does not return the
  object. `cancelSubscriptionForDeletion` maps that code to success, which is what keeps a retried deletion
  from aborting on a plan that is already in the state we wanted.

## See also

[guest-flow.md](guest-flow.md) (account-from-guest: the guest side of the same sign-in) · [database-security.md](database-security.md) · [admin-observability.md](admin-observability.md) (the MFA/AAL2 gate reuses this).
