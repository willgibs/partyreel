# Auth & accounts

Open this before you:
- change sign-in: the one account door, codes and links, passwords, Google, passkeys;
- change a Supabase Auth dashboard setting (they move in lockstep with code);
- change how an account's email changes, or what follows it;
- touch a display name, an avatar or the `/welcome` gate;
- touch account deletion.

Elsewhere: the admin's MFA gate ([admin-observability.md](admin-observability.md)), a guest's identity and the confirm doors
([guest-flow.md](guest-flow.md)), the `profiles` column grants ([database-security.md](database-security.md)), the account page's Plan card
([billing-caps.md](billing-caps.md)).

## Sign-in

One `auth.users` row carries every credential: the email code (the lead, with the magic link in the same email),
Google, and a password as a quiet second door; passkeys wait behind a flag. `getUser()`, never `getSession()`, is
[CLAUDE.md](../../CLAUDE.md)'s rule, and a gate re-checks it server-side: the door only obtains a session.

- **One door, worn five ways.** `<AccountDoor>` serves the host `/login`, the guest gate, a like, the album's confirm
  door and a named guest's sign-in; each wear passes only its reason (`wear`), its methods and where it returns, and
  the words live in one table, `DOOR_WEAR`. Every wear but the gate carries the Terms line (the gate's welcome step
  says it), which is why Stripe Checkout needs no consent box of its own ([billing-caps.md](billing-caps.md)).
- **The door asks for a confirmed email, not an account.** Confirming claims this device's uploads and nothing else
  (there is no save: [guest-flow.md](guest-flow.md)); the free account is what confirming makes, and each wear's words say so.
- ★ **An address typed at the guest door is inert, and nothing is an oracle.** It lands in `guests.pending_email`,
  proves nothing, signs nobody in, is never shown to anyone nor mailed on its own, and never reaches `auth.users`. It
  is accepted whether or not a member owns it, because refusing it or diverting to a sign-in would tell a stranger
  which addresses hold accounts. The one path to confirmed is a claim from the caller's OWN confirmed address.
- ★ **"You already had an account" is a server fact, said only after the code.** `checkExistingAccount` re-checks
  `getUser()` and reads the caller's own row (`welcomed_at`, `password_set_at`, or a row older than this sign-in by
  three minutes). Said before a verify it is the enumeration oracle; it never reads a browser clock, and it speaks
  only under a create intent, or every returning host's code would read as a warning.
- ★ **On the guest gate the door holds `onVerified`** for four seconds or until a choice, because
  `claimAnonymousUploads` stamps the guest's photographs onto the signed-in account and the claim never re-stamps an
  owned row. ★ **Every guest-side wear awaits the claim before it refreshes**, or the refresh redraws the credit the
  guest just confirmed an email to fix, still marked; the claim never throws, so the wait costs one round trip.
- ★ **The claim names only a nameless profile:** under a confirmed session `claim_anonymous_uploads` copies the
  newest claimed row's typed name onto a profile with none (and marks the rows verified); unconfirmed, it stamps
  `user_id` and nothing else. Nothing overwrites a name.
- **The code leads and the link is the fallback,** because an iPhone PWA opens a tapped link in Safari, outside the
  session the flow just made, and `verifyOtp({ type: 'email' })` needs no redirect. `email-sign-in.tsx` owns no
  navigation; each wear's `onVerified` decides what follows. A tapped link lands on `/auth/callback` and loses any
  in-page step, which is accepted.
- **The password refusal is generic by design:** wrong password, no password and unknown address read the same (the
  `password_mismatch` line, with a code, a new password and Google as the ways out); `door-failure.test.ts` refuses
  a specific one. Every failure maps through `door-failure.ts`'s one table, and a surface's own recoveries are not
  offered twice (`suppress`).
- ★ **The remembered address is `/login`'s alone:** a hint, parsed as untrusted input, read and written inside
  try/catch (`localStorage` throws when site data is blocked), shown masked, and written only where the address is
  known before the door is left. The guest gate and the confirm door never read it, so a phone passed around a party
  never shows the last guest's address; no address ever goes in a URL.
- **Passkeys** wait behind `NEXT_PUBLIC_PASSKEYS=1`, which also opts the browser client into auth-js's experimental
  passkey API (2.106 throws without it). ★ Enable
  passkeys in the Supabase dashboard with the WebAuthn Relying Party id set to the apex BEFORE the flag ships: a
  passkey registered against the wrong RP id is a credential the door can never see again. The button comes from a
  device hint (`pr_passkey_hint`), never a load-time browser prompt, which would throw a system sheet at a
  stranger; Google's hinted "Continue as" sends `login_hint` with `prompt=select_account`, so a shared laptop
  always sees the chooser.

## Passwords

- **The address is proven before a password is ever written,** and there is no `signUp({ email, password })`
  (its enumeration quirks, its own confirm type, a password stored before the address is proven). Creating an
  account IS the code path; a host adds a password from `/account` on a live session; "Forgot" verifies a code and
  finishes in the door (`SetInitialPassword`). No recovery template and no `type: 'recovery'` branch exist, since a
  verified code already yields a session.
- **`has_password()` reads `profiles.password_set_at`, never `auth.users.encrypted_password`:** GoTrue writes a
  non-null bcrypt placeholder for every code or link signup, which would show such a host a Change form for a
  password they never set. `mark_password_set()` stamps it after every successful `updateUser({ password })`.
- `updateUser({ password })` runs on the browser client (it rotates the session). A change first re-checks the
  current password with `verify_current_password`, a read-only RPC that disturbs no session; the hash never leaves
  the database (both RPCs return booleans).

## Changing the email

A confirmed address is changed, never removed (Will, identity-door round 1 `remove`); deleting the account is the
way out. The row on `/account` is `email-section.tsx`, its machine is pure (`email-change.ts`) and its two Server
Functions are `email-actions.ts`.
- **Two codes, one per address.** `requestEmailChangeAction` re-checks `getUser()` and calls `updateUser({ email })`;
  with Secure email change on, GoTrue mails a code (and a link) to the current address and one to the new address,
  and the address moves once both are entered, in either order. `confirmEmailChangeAction` checks a code with
  `verifyOtp({ type: "email_change" })` against the address that received it, read off the caller's own auth user
  (`email` or `new_email`), never the request's: the first answers with no session, the second with the new one. A
  resend starts both over (GoTrue mints two codes and zeroes the confirmation), and GoTrue answers a wrong code and an
  expired one with the same `otp_expired`.
- ★ **An address that already has an account is answered like a sent one** (`email_exists`), or the action is an
  enumeration oracle; the row's help line covers the case for everyone. The account's own inbox staying silent still
  tells, so the account's `email_change` limit (six calls an hour, requests and code attempts on one budget, fail
  closed) bounds that probe.
- ★ **The copies follow inside GoTrue's commit.** `handle_user_email_change` (AFTER UPDATE OF email ON `auth.users`,
  when the address changed) writes it to `profiles.email` and to `guests.email` on the account's verified rows, except
  for an account whose deletion is requested; past hosts see the new address, and `upload_forensics` keeps what each
  upload captured. It runs in the Auth server's own transaction, so it stays trivial: a failure there blocks every
  email change. The Stripe customer's copy follows after the response, best-effort (`syncBillingEmail`).
- **A tapped link lands on `/account`, never on an expired link.** `emailRedirectTo` is
  `/auth/callback?next=/account&flow=email_change` on the request's own host (the PKCE verifier cookie is
  host-scoped). The first link carries no code (GoTrue's message rides the fragment), so it lands
  `?email_change=half`; a code is issued only once the change has committed, so an exchange that works lands `done`
  and one that fails (another browser, no PKCE verifier) lands on the plain page. The param picks a line of copy;
  the row reads the truth from `getUser()`.
- A change left waiting shows until its codes die (`EMAIL_CHANGE_TTL_MS`): GoTrue never clears `new_email`.

## Supabase Auth dashboard settings

Dashboard state, held nowhere in the repo, that the code assumes:
- "Secure password change" and "Require current password" OFF (the first forces a reauth nonce that breaks the
  `verify_current_password` design).
- Minimum password length = `MIN_PASSWORD_LENGTH` (8); Email OTP length = `OTP_LENGTH` (6, `email-sign-in.tsx`);
  Email OTP expiration = `EMAIL_CHANGE_TTL_MS` (3600 s, `email-change.ts`); leaked-password protection on.
- The Magic Link and Confirm signup templates carry `{{ .Token }}` beside `{{ .ConfirmationURL }}`, or the code-first
  flow mails no code; so does the Change Email Address template, worded for both of its recipients with
  `{{ .Email }}` (the current address) and `{{ .NewEmail }}`.
- "Confirm email" ON (off, `updateUser({ email })` swaps the address with no proof at all) and "Secure email change"
  ON (off, the new inbox alone moves an account, so a borrowed session could take it).
- "Allow new user signups" OFF until launch (Will: only test accounts exist, so the product changes freely), then ON,
  since account creation is the door's first code. While it is off, a new address's code, the door's Create account
  and a first Google sign-in are refused, so a live walk of them uses an existing test account. The OAuth Server
  (project-as-IdP) OFF.
- The redirect allow-list holds `https://partyreel.com/auth/callback**` (a guest's link carries `?next=/e/[token]`
  back) and the admin callbacks ([admin-observability.md](admin-observability.md)).
- Passkeys enabled with the RP id on the apex before `NEXT_PUBLIC_PASSKEYS=1` ships anywhere.
- Rate limits (Authentication, Rate Limits): emails 100 an hour project-wide on the custom SMTP; code and link
  verifications, sign-ups and sign-ins, and token refreshes 150 per 5 minutes per IP; anonymous sign-ins 30 an hour
  per IP. A 150-guest Require-verified-emails door inside an hour outruns the email limit: the door names the
  refusal (`rate_limited`), and the host's Require verified emails switch is the live valve.

## Names and photos

- **A display name is required and public, and only the server writes it.** `handle_new_user` leaves it null for
  every signup, so null means "not set". `/welcome` and the guest door's name step collect it (`/welcome` prefills
  from the Google name or the newest claimable guest row's typed name). The one typed-name write is
  `updateDisplayNameAction` (`displayNameSchema`, then `containsProfanity`, tuned so real names pass, then the admin
  client); the claim copies an already-filtered name onto a nameless profile only.
- **A guest's typed name survives the magic link.** The door passes it as `signInWithOtp` data under `DOOR_NAME_KEY`
  (`door-name-key.ts`; GoTrue writes it only when that call creates the account), and `/auth/callback` runs
  `adoptDoorName()` after the exchange when `next` is an album: a nameless profile only, `displayNameSchema` then
  `containsProfanity` (the metadata is client-writable), the admin client, a write conditioned on the column still
  being null, and the stored copy deleted either way. A plain server module, not a Server Function.
- **A nameless account reaches no `(app)` route but `/welcome`:** `requireNamedProfile()` runs from
  `dashboard/layout.tsx` and `account/layout.tsx`, and `/welcome` never calls it, or a nameless account could never
  reach the one page that names it.
- **Avatars are deterministic and orphan-free:** the cropper re-encodes to a 512px WebP in the browser; the route
  re-validates type, size and the WebP magic bytes (no SVG, no script) and upserts `<id>/avatar.webp` into the public
  Supabase Storage `avatars` bucket through the service role (so the bucket needs no policies): one object per
  person, deleted object-first. `profiles.avatar_updated_at` is both the existence marker and the `?v=` cache-bust.
  The bytes sit outside the R2 backup ([durability-backups.md](durability-backups.md)).
- ★ **A profile with no photograph wears a seeded colour, never a grey disc,** painted by `Avatar`'s `seed` from
  `seedFor(profiles.id)`, a server-side SHA-256, so one person is one colour everywhere and no raw id reaches a
  browser. The guest "Hosted by" byline takes the host's photo and seed from a server-only read keyed on
  `events.host_id` (`getHostAvatarSeed`), so the anon event RPC never returns the host id.

## Deleting an account

- **Deletion is immediate, has no undo, and cancels an active plan.** The request cancels the subscription FIRST and
  refuses everything if Stripe will not, so "deleted but still billed" is unreachable; then it stamps
  `deletion_requested_at`, bins every hosted event, removes the newsletter address, anonymises the profile (never an
  entitlement column) and bans the auth user. Cancelling an already-canceled subscription raises `resource_missing`,
  which `cancelSubscriptionForDeletion` counts as success so a retry does not abort.
- ★ **The `auth.users` row is deleted only by the sweep, and only at ZERO remaining events.** The chain
  `auth.users → profiles → events → media` cascades, so an early delete destroys the keys the R2 delete still
  needs; the zero is a `mustCount`, because a failed count reads as a confident zero. A forensic hold on any of the
  account's events outranks the request: that event is skipped whole and the account waits, anonymised, until the
  hold lifts. `guests.user_id` and `media.guest_id` are `on delete set null`, so uploads to other hosts' events
  survive unlinked: the FK keeps the promise `/privacy` makes.
- ★ **Deletion takes the address with it.** The account's guest rows in other hosts' events lose `email`,
  `pending_email` with its stamp, and a typed name (`SCRUBBED_GUEST_PATCH`) three times over: at the request
  (isolated, so a failure costs neither the anonymisation nor the ban), in the sweep's re-anonymise (a failure stops
  the purge before `deleteUser`; the one pass that reaches a held account), and in `scrub_account_guest_rows`, the
  BEFORE DELETE trigger on `profiles` that the `auth.users` cascade fires (★ it returns `old`: a BEFORE trigger that
  returns null silently skips the delete). `verified_at` stays. `resolveUploaderIdentity` names an address only while
  the row's `user_id` stands, and `20260926210000_identity_backfill.sql` cleared the rows orphaned before the
  scrub.
- **The re-verification lives in the server action,** which re-checks the password or a fresh email code itself: a
  server action is a public endpoint, and the attack re-verification stops is a borrowed session. The code goes to
  the caller's own address, read through `getUser()`, never from the request.
- **A GoTrue ban kills a LIVE token,** because `getUser()` re-validates on every call: a deleted, not-yet-swept
  account has no window in which a cached session works, and a `getSession()` anywhere in the authz path would
  reopen it.
