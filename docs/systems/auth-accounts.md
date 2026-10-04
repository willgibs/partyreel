# Auth & accounts

Open this before you:
- change sign-in: the one account door, codes and links, passwords, Google, passkeys;
- add or change a sign-out, or anything else that ends a session;
- change a Supabase Auth dashboard setting (they move in lockstep with code);
- change how an account's email changes, or what follows it;
- touch a display name, an avatar or the `/welcome` gate;
- touch account deletion.

Elsewhere: the admin's MFA gate ([admin-observability.md](admin-observability.md)), a guest's identity and the
confirm doors ([guest-flow.md](guest-flow.md)), the `profiles` column grants
([database-security.md](database-security.md)), the account page's Plan card ([billing-caps.md](billing-caps.md)).

## Sign-in

One `auth.users` row carries every credential: the email code (the lead, with the magic link in the same email),
Google, and a password as a second door; passkeys wait behind a flag. Every gate re-checks `getUser()` server-side
([CLAUDE.md](../../CLAUDE.md)): the door only obtains a session.

- **One door, worn five ways.** `<AccountDoor>` serves the host `/login`, the guest gate, a like, the album's confirm
  door and a named guest's sign-in; each wear passes only its reason (`wear`), its methods and where it returns, and
  the words live in one table, `DOOR_WEAR`. Every wear but the gate carries the Terms line (the gate's welcome step
  says it), which is why Stripe Checkout needs no consent box of its own ([billing-caps.md](billing-caps.md)).
- **The door asks for a confirmed email, not an account.** Confirming claims the uploads on this device that can be
  hers and nothing else ([guest-flow.md](guest-flow.md)); the free account is what confirming makes, and each wear's
  words say so.
- ★ **An address typed at the guest door is no oracle.** It waits inert in `guests.pending_email`
  ([guest-flow.md](guest-flow.md)), signs nobody in and never reaches `auth.users`, and it is accepted whether or not
  a member owns it, because refusing it or diverting to a sign-in would tell a stranger which addresses hold
  accounts. The one path to confirmed is a claim from the caller's OWN confirmed address.
- ★ **"You already had an account" is a server fact, said only after the code.** `checkExistingAccount` re-checks
  `getUser()` and reads the caller's own row (`welcomed_at`, `password_set_at`, or a row older than this sign-in).
  Said before a verify it is the enumeration oracle; it never reads a browser clock, which a visitor sets, and it
  speaks only under a create intent, or every returning host's code would read as a warning.
- ★ **On the guest gate the door holds `onVerified` while that line stands** (`hold`), so "Not you?" comes before
  `claimAnonymousUploads`: the claim never re-stamps an owned row, so photographs stamped onto the wrong account
  would stay there. Every guest-side wear awaits the claim before it refreshes ([guest-flow.md](guest-flow.md)).
- ★ **The claim names only a nameless profile:** under a confirmed session `claim_anonymous_uploads` copies the
  newest claimed row's typed name onto a profile with none (and marks the rows verified); unconfirmed, it stamps
  `user_id` and nothing else. Nothing overwrites a name, and a stranger's never names hers: on a shared phone the
  claim takes only a ticket that can be hers, and one she was asked about names nothing
  ([guest-flow.md](guest-flow.md)).
- **The code leads and the link is the fallback,** because an iPhone PWA opens a tapped link in Safari, outside the
  session the flow just made, and `verifyOtp({ type: 'email' })` needs no redirect. `email-sign-in.tsx` owns no
  navigation; each wear's `onVerified` decides what follows. A tapped link lands on `/auth/callback` and loses any
  in-page step, which is accepted.
- **A sign-in lands on the page that asked for it.** The `(app)` and `(print)` gates and the portal's `requireAdmin`
  send a signed-out request to `/login?next=<its path>` (a layout cannot read its URL, so the proxy hands it over in
  `x-pr-path`), and every way in (the in-page code or password, Google, the email's link through `/auth/callback`)
  lands there, so a mail's button or an operator's deep link lands where it points. On the admin host the callback
  stays bare and the path rides the `pr_admin_return` cookie instead, re-checked and cleared by the callback
  (Supabase Auth dashboard settings, below). `signInLanding` is the one landing rule the page, the form and the
  callback share, and a client-side 401 fallback sends `loginPath(window.location.pathname)`, so a session that lapsed
  under a page comes back to it (`bare-login-policy.test.ts` refuses a bare `/login`).
- ★ **`next` is an allow-list, never a sanitizer** (`lib/auth/return-path.ts`, which says why): one of its exact
  shapes for the host it lands on (each host 404s the other's pages), never a query, and a fragment only as one of
  the mails' named anchors on its own page (`ANCHORED_RETURNS`, named beside each mail in `lib/email/links.ts`),
  read off `location.hash` by `/login`'s form and checked by `returnWithAnchor`, since no server ever sees one.
  Anything else, however it is encoded, reads as no `next` at all (`return-path.test.ts` pins each refusal).
- **The password refusal is generic by design:** a wrong password, no password and an unknown address read the same
  (`password_mismatch`), since telling them apart says which addresses hold accounts; `door-failure.test.ts` refuses
  a specific one. Every failure maps through `door-failure.ts`'s one table.
- ★ **The remembered address is `/login`'s alone:** a hint, parsed as untrusted input, read and written inside
  try/catch (`localStorage` throws when site data is blocked), shown masked, and written only where the address is
  known before the door is left. The guest gate and the confirm door never read it, so a phone passed around a party
  never shows the last guest's address; no address ever goes in a URL.
- **Passkeys** wait behind `NEXT_PUBLIC_PASSKEYS=1`, which also opts the browser client into auth-js's experimental
  passkey API (2.106 throws without it); the dashboard comes first (Supabase Auth dashboard settings, below). The
  button comes from a device hint (`pr_passkey_hint`), never a load-time browser prompt, which would throw a system
  sheet at a stranger; Google's hinted "Continue as" sends `login_hint` with `prompt=select_account`, so a shared
  laptop always sees the chooser.

## Signing out

- ★ **Every sign-out names its scope,** because auth-js's bare `signOut()` is global: it revokes every session the
  account holds, an operator's admin portal session included (Google and her second factor again). Sign out is
  `local`, this session and its refresh token alone, since one account is kept open on a desk and a phone for
  different jobs: the menu's (`signOutAction`, which the admin bar posts too), the guest header's and the door's
  "Not you?". `/account`'s Sign out everywhere (`signOutEverywhereAction`) is `global`, this device included, behind a
  confirm that says so. Both answer a refusal rather than land on `/login` as if they had worked: auth-js keeps the
  session when GoTrue refuses, and `/login` sends a signed-in host back to the dashboard. Deleting an account is
  `global` too, as the ban's belt: after the ban GoTrue answers it 403 `user_banned` (auth-js still clears the
  cookies), and when the best-effort ban failed it is what ends the other devices. Each scope is pinned beside its
  call site.
- ★ **No scope reaches an access token already issued:** it stays valid by its signature until its own expiry.
  `getUser()` refuses a revoked session at once (a signature check such as `getClaims()` would not), so only a
  caller using the raw token against the database directly keeps what is left of it.
- Sign out and Sign out everywhere put down every guest ticket on the device ([guest-flow.md](guest-flow.md)); the
  door's "Not you?" keeps them, since the same person carries on with another address.

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

A confirmed address is changed, never removed, since the account signs in and is mailed through it; deleting the
account is the way out. The row on `/account` is `email-section.tsx`, its machine is pure (`email-change.ts`) and its
two Server Functions are `email-actions.ts`.
- **Two codes, one per address.** `requestEmailChangeAction` re-checks `getUser()` and calls `updateUser({ email })`;
  with Secure email change on, GoTrue mails a code (and a link) to the current address and one to the new address,
  and the address moves once both are entered, in either order. `confirmEmailChangeAction` checks a code with
  `verifyOtp({ type: "email_change" })` against the address that received it, read off the caller's own auth user
  (`email` or `new_email`), never the request's: the first answers with no session, the second with the new one. A
  resend starts both over (GoTrue mints two codes and zeroes the confirmation), and GoTrue answers a wrong code and an
  expired one with the same `otp_expired`.
- ★ **An address that already has an account is answered like a sent one** (`email_exists`), or the action is an
  enumeration oracle; the row's help line covers the case for everyone. The account's own inbox staying silent still
  tells, so the account's `email_change` limiter, which counts requests and code attempts alike, is that probe's
  only bound (`abuse-rate-limit.ts`; [database-security.md](database-security.md)).
- ★ **The copies follow inside GoTrue's commit.** `handle_user_email_change` (AFTER UPDATE OF email ON `auth.users`,
  when the address changed) writes it to `profiles.email` and to `guests.email` on the account's verified rows, and
  moves the account's newsletter row to it (an address already on the list keeps its own row), except for an
  account whose deletion is requested; past hosts see the new address, and `upload_forensics` keeps what each upload
  captured. It runs in the Auth server's own transaction, so it stays trivial: a failure there blocks every email
  change, which is why the move can never raise a unique violation. It is the one place every change passes (both
  codes, a link tapped in another browser, an operator's update). The Stripe customer's copy follows after the
  response, best-effort (`syncBillingEmail`).
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
- Minimum password length = `MIN_PASSWORD_LENGTH` (8); Email OTP length = `CODE_LENGTH` (6,
  `lib/auth/code-length.ts`); Email OTP expiration = `EMAIL_CHANGE_TTL_MS` (3600 s, `email-change.ts`);
  leaked-password protection on.
- The Magic Link and Confirm signup templates carry `{{ .Token }}` beside `{{ .ConfirmationURL }}`, or the code-first
  flow mails no code; so does the Change Email Address template, worded for both of its recipients with
  `{{ .Email }}` (the current address) and `{{ .NewEmail }}`.
- "Confirm email" ON (off, `updateUser({ email })` swaps the address with no proof at all) and "Secure email change"
  ON (off, the new inbox alone moves an account, so a borrowed session could take it).
- "Allow new user signups" OFF until launch, since only test accounts exist and the product changes freely, then ON,
  since account creation is the door's first code. While it is off, a new address's code, the door's Create account
  and a first Google sign-in are refused, so a live walk of them uses an existing test account. The OAuth Server
  (project-as-IdP) OFF.
- The redirect allow-list holds `https://partyreel.com/auth/callback**` (a guest's link carries `?next=/e/[token]`
  back, a host's the page a gate sent them from) and the admin host's callbacks
  ([admin-observability.md](admin-observability.md) says why that host signs in on its own origin). ★ The admin
  entries are EXACT, and an exact entry matches no query: GoTrue answers `…/auth/callback?next=` there with the Site
  URL, so the sign-in lands on the apex, never exchanged. So the admin host's door sends the bare callback
  (`login-form.tsx`).
- ★ Passkeys enabled with the WebAuthn Relying Party id on the apex BEFORE `NEXT_PUBLIC_PASSKEYS=1` ships anywhere:
  a passkey registered against the wrong RP id is a credential the door can never see again.
- Rate limits (Authentication, Rate Limits): emails 100 an hour project-wide on the custom SMTP; code and link
  verifications, sign-ups and sign-ins, and token refreshes 150 per 5 minutes per IP; anonymous sign-ins 30 an hour
  per IP. A 150-guest Require-verified-emails door inside an hour outruns the email limit: the door names the
  refusal (`rate_limited`), and the host's Require verified emails switch is the live valve.

## Names and photos

- **A display name is required and public, and only the server writes it.** `handle_new_user` leaves it null for
  every signup, so null means "not set". `/welcome` and the guest door's name step collect it. The one typed-name
  write is `updateDisplayNameAction` (`displayNameSchema`, then `containsProfanity`, tuned so real names pass, then
  the admin client); the claim copies an already-filtered name onto a nameless profile only.
- ★ **The name rule has one home, `isReservedName` (`reserved-names.ts`), which `displayNameSchema` asks,** so every
  door reads it: the account action, the door's adopted name, the guest join and rename routes
  (`parseGuestDisplayName`) and the browser's own `checkDisplayName`. It refuses a staff or brand impersonation
  ("Partyreel Support") however it is spelled, and a name that merely contains a word ("Sam Partyreel") stays legal.
  SQL cannot check a name, so `reserved-names.test.ts` names every writer of `display_name` with the gate it asks
  first.
- **A guest's typed name survives the magic link.** The door passes it as `signInWithOtp` data under `DOOR_NAME_KEY`
  (GoTrue writes it only when that call creates the account), and `/auth/callback` runs `adoptDoorName()` after the
  exchange when `next` is an album, under `updateDisplayNameAction`'s rules: the metadata is client-writable, so it is
  validated like any typed name, and it names a nameless profile only.
- **A nameless account reaches no `(app)` route but `/welcome`:** `requireNamedProfile()` runs from
  `dashboard/layout.tsx` and `account/layout.tsx`, and `/welcome` never calls it, or a nameless account could never
  reach the one page that names it.
- **Avatars are deterministic and orphan-free:** the cropper re-encodes to WebP in the browser; the route
  re-validates type, size and the WebP magic bytes (no SVG, no script) and upserts `<id>/avatar.webp` into the public
  Supabase Storage `avatars` bucket through the service role (so the bucket needs no policies): one object per
  person, deleted object-first. `profiles.avatar_updated_at` is both the existence marker and the `?v=` cache-bust.
  The bytes sit outside the R2 backup ([durability-backups.md](durability-backups.md)).
- ★ **An avatar's colour is `seedFor(profiles.id)`, a server-side SHA-256, never the raw id,** on every surface (a
  profile with no photograph wears it; `Avatar`'s `seed`), so one person is one colour everywhere and no raw id
  reaches a browser. The guest "Hosted by" byline takes the host's photo and seed from a server-only read keyed on
  `events.host_id` (`getHostAvatarSeed`), so the anon event RPC never returns the host id.

## Deleting an account

- **What anyone can see goes at once; the nightly purge erases the rest, and the person has no undo.** If she turned
  it on in the dialog (off by default: she can take any upload back herself, ever), the request first takes her
  uploads out of other people's albums through her own `removeMyUpload`, read whole, and refuses everything if one is
  left. Then it cancels every subscription of its customer that has not ended, not only the one the profile follows
  (two Checkout tabs can leave two), and refuses everything if Stripe will not, the list's failure included, so
  "deleted but still billed" is unreachable; then it stamps `deletion_requested_at`, bins every hosted event, removes
  the newsletter address, anonymises the profile (never an entitlement column) and bans the auth user. The plan is
  never refunded, since a host could buy on the day of the event and claim a refund days later, and the dialog says
  so. Cancelling an already-canceled subscription raises `resource_missing`, which `cancelSubscriptionsForDeletion`
  counts as success so a retry does not abort.
- ★ **The purge's time has one home, `lib/lifecycle/purge-time.ts`,** held to vercel.json's cron by its test: Hobby
  fires a daily cron anywhere inside its hour, so every word that promises the purge (the dialog, its done screen, a
  refused sign-in) names the END of the first window that starts after the moment asked about, in the reader's own
  zone. The window is never lengthened nor padded with a minimum wait, even with minutes to go, since deletion is
  privacy-first; what the words cannot know (a hold, a very large account, a paused run) moves the next reading on,
  never the words.
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
  BEFORE DELETE trigger on `profiles` that the `auth.users` cascade fires (it returns `old`, since a BEFORE trigger
  that returns null silently skips the delete). `verified_at` stays. `resolveUploaderIdentity` names an address only
  while the row's `user_id` stands.
- **The re-verification lives in the server action,** which re-checks the password or a fresh email code itself: a
  server action is a public endpoint, and the attack re-verification stops is a borrowed session. The code goes to
  the caller's own address, read through `getUser()`, never from the request.
- **A GoTrue ban kills a LIVE token,** because `getUser()` re-validates on every call: a deleted, not-yet-swept
  account has no window in which a cached session works, and a `getSession()` anywhere in the authz path would
  reopen it.
- ★ **A sign-in during the wait says why and when, never a dead end.** `src/app/(auth)/account-deleting.ts` maps
  where GoTrue refuses a banned address (the code's verify, a tapped link, Google, a password); the verify and the
  password check the ban before the credential, so GoTrue itself tells anyone that an address is being deleted. The
  code screen says so of the address it was sent; `/login`'s words are conditional ("If you deleted your account...")
  because its URL is anyone's to write; the password door stays generic by rule, and its Send a new code lands on the
  code screen. Each names the purge window's end and one way out, a contact line for an address still refused after
  it, and nothing more: a forensic hold keeps the ban past every window and is never told.
- **The operator's Cancel deletion is the private failsafe,** never offered to the person, whose deletion has no
  undo. `cancelAccountDeletion`, on `/admin/accounts/[id]` through `requireAdminAction()`, lifts the ban, clears the
  stamp and puts the auth user's address back on the profile (the lifecycle and billing mails read
  `profiles.email`); the binned events wait in Deleted on their own 30 days. The ban lifts first and a stamp that
  will not clear puts it back, so "can sign in" never stands while still queued; it refuses while a purge run is
  under way, and the purge reads each account's stamp again before it touches it (`purgeAccount`), so one that lands
  after a run read its queue still finds the account whole. Its panel lists what stays gone: name, photo and handle,
  the plan, the newsletter signup, the names on her guest rows, and any uploads she took out of other albums.
  Audited as the delete is: its effect, and one Sentry line naming who and whom by id
  ([admin-observability.md](admin-observability.md)).
