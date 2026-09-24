# Auth & accounts

Open this before you:
- change sign-in: the one account door, codes and links, passwords, Google, passkeys;
- change a Supabase Auth dashboard setting (they move in lockstep with code);
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

## Supabase Auth dashboard settings

Dashboard state, held nowhere in the repo, that the code assumes:
- "Secure password change" and "Require current password" OFF (the first forces a reauth nonce that breaks the
  `verify_current_password` design).
- Minimum password length = `MIN_PASSWORD_LENGTH` (8); Email OTP length = `OTP_LENGTH` (6, `email-sign-in.tsx`);
  leaked-password protection on.
- The Magic Link and Confirm signup templates carry `{{ .Token }}` beside `{{ .ConfirmationURL }}`, or the code-first
  flow mails no code.
- "Allow new user signups" ON (account creation is the first code); the OAuth Server (project-as-IdP) OFF.
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
- **The re-verification lives in the server action,** which re-checks the password or a fresh email code itself: a
  server action is a public endpoint, and the attack re-verification stops is a borrowed session. The code goes to
  the caller's own address, read through `getUser()`, never from the request.
- **A GoTrue ban kills a LIVE token,** because `getUser()` re-validates on every call: a deleted, not-yet-swept
  account has no window in which a cached session works, and a `getSession()` anywhere in the authz path would
  reopen it.
