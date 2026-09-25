---
track: identity-email
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6063f1d8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/account/
  - src/app/(auth)/
  - src/lib/db/mutations/account
  - src/lib/lifecycle/account-deletion
  - src/lib/media/uploader-identity
  - src/lib/stripe/customer-email
  - supabase/migrations/20260926200000_identity
  - supabase/migrations/20260926210000_identity_backfill
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - src/components/auth/email-sign-in.tsx
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/lib/db/queries/guest-addresses.ts
  - src/app/api/stripe/checkout/route.ts
  - supabase/migrations/20260902130000_account_deletion.sql
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
---

# lp/identity-email

**Goal.** Make a confirmed email something a person changes but never loses, and make deleting an account take the address with it. Will: "once an email has been added, it may only be changed ... not fully removed. Account deletion is always an option too." Today no one can change their email in the app, and a deleted account's confirmed address still shows in other hosts' galleries.

## The brief

Will's words and the Orchestrator's answer are in `docs/reviews/identity-door.json` (round 1's notes on `remove`).

**The account's email change** (`src/app/(app)/account/`):
- Today "The address itself can't be edited from the account page yet", and `updateUser` is only ever called with a password.
- **The request:** `requestEmailChangeAction` does `getUser()` (never `getSession()`), parses the address, then calls `updateUser({ email }, { emailRedirectTo: <origin>/auth/callback?next=/account&flow=email_change })`, answering an existing address with a generic sentence. Supabase Auth's own email rate limits apply; the abuse limiter (`src/lib/security/abuse-rate-limit.ts`) belongs to `reel-teardown` tonight, so a new kind is a Question.
- **The card:** a colocated email card (the way `passkeys-card.tsx` sits) with two code panels, one per address. Each code is checked with `verifyOtp({ type: "email_change", email: <the address that received it>, token })`. The first confirmation says to confirm the other; the second completes the change.
- **After the change:** a best-effort `syncBillingEmail` updates the Stripe customer's email (`src/lib/stripe/customer-email.ts`, TEST mode, logged on failure; the customer's email is otherwise set only at creation). Then the page refreshes.
- **The callback:** with `flow=email_change` and no code, it lands on `/account?email_change=half`, never `expired_link`, since the first link's message can arrive in the fragment.
- **The dashboard settings** (the Orchestrator's, named in your Handoff): Secure email change on; the Change Email Address template carrying `{{ .Token }}` beside `{{ .ConfirmationURL }}`, worded with `{{ .Email }}` and `{{ .NewEmail }}`. Record both in `auth-accounts.md`'s dashboard list.

**The copies follow** (the migration, `supabase/migrations/20260926200000_identity.sql`): an `AFTER UPDATE OF email ON auth.users` trigger, only when the address changed, copies the new address to `profiles.email` (where no deletion is requested) and to `guests.email` on the account's verified rows. `upload_forensics` keeps what each upload captured. The body is trivial, schema-qualified and EXECUTE-revoked (it runs inside GoTrue's transaction, so a failure there blocks email changes).

A call, his to overrule: past hosts see the new address (follow), not the old one.

**The typed name survives the magic link.** `adoptDoorName()` in `src/app/(auth)/actions.ts`:
- `getUser()`;
- when the profile has no name, read `user_metadata.door_name` (which `door-flow` passes as `signInWithOtp` data), check it with `displayNameSchema` and `containsProfanity`, and write it with the admin client;
- clear the stored copy.

`/auth/callback` calls it after the code exchange when `next` starts with `/e/`. It stays inert until the door passes the name.

**The deletion scrub.**
- **Going forward:** `scrubAccountGuestRows(admin, userId)` in `src/lib/lifecycle/account-deletion.ts` nulls `email`, `pending_email` and `pending_email_at` on the account's `guests` rows. It runs in `requestAccountDeletion` (`src/lib/db/mutations/account.ts`) before the profile is anonymised, and in the sweep's re-anonymise; a failure there stops the purge before `deleteUser`. A `guest_rows_scrubbed` count rides the sweep's result into its /admin run detail.
- **The read-side net:** `resolveUploaderIdentity`'s case 2 (`src/lib/media/uploader-identity.ts`) returns the email only while `user_id` is set. Today the host's viewer prints `uploaderEmail` beside a deleted account's nameless photo (`media-lightbox-parts/credit.tsx`).
- **The database net:** a `BEFORE DELETE ON public.profiles` trigger runs the same scrub for `old.id` (the cascade from `auth.users` fires it), EXECUTE revoked, with a rolled-back contract check.
- **The backfill for accounts already deleted** is destructive and waits for Will's yes. Write it in its own file (`20260926210000_identity_backfill.sql`, nulling `guests.email` where `user_id` is null and `email` is not) with a read-only count query beside it in the Handoff. Never apply it.
- **Help copy** for `content/help/your-data-and-deleting-your-account.mdx` (your name and email come off photos in other hosts' events; the photos and their abuse record stay, as disclosed) and `display-name-and-profile-photo.mdx` (the address can now be changed): `content/help/` belongs to `reel-sweep` tonight, so put the exact sentences in your Handoff.

**The order:** the migration SQL first, committed and pushed, ending your turn with one line, "migration ready at <sha>". The Orchestrator runs the drift and rolled-back checks, applies it, runs the advisors, regenerates the types and messages you. Then finish on the new types. Where `src/lib/db/migration-guards.test.ts` needs a pin, name it in the Handoff: `album-pages` owns that file tonight.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; the email card's two-code state machine and the action's refusals in tests; the callback's `flow=email_change` landing; the scrub before `deleteUser` and a failed scrub stopping the purge; case 2 returning no email without a `user_id`; the migration's rolled-back check with the Orchestrator (a changed address reaching `profiles` and verified `guests` rows, a deleted profile's guest rows scrubbed); live on the alias once merged: an email change on a disposable account confirmed at both addresses (Will types the codes; no agent does).

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does deletion also take a typed name off the account's rows?** The brief's scrub names the two addresses and the
  stamp. Recommended, and built (both scrubs and the trigger): yes, `display_name` too. Only an unconfirmed account's
  row carries one (a verified row's name is the profile's, which the request already anonymises); none exist today
  and no current path mints one, and `upload_forensics` keeps the typed name as evidence. Without it, the help line
  "your name and email come off photos in other hosts' events" is false for exactly those rows.
- **Does the email change get its own abuse-limiter kind?** Supabase Auth's email limit binds only a send, and GoTrue
  answers an address that already has an account (`email_exists`) before sending anything, so a signed-in account can
  test addresses at the request rate while the action's generic sentence hides the answer from the screen (the
  account's own inbox staying silent still tells); and a borrowed session's guesses at the current address's code
  meet only GoTrue's per-IP verification limit. Recommended: yes, one per-ACCOUNT kind (`email_change`) counting both
  requests (about 5 an hour) and code attempts, not venue-shaped like the guest kinds; not built, because
  `abuse-rate-limit.ts` was `reel-teardown`'s tonight. The two call sites are `requestEmailChangeAction` and
  `confirmEmailChangeAction` (`src/app/(app)/account/email-actions.ts`).

## System-doc edits (in place, owned facts only)

- `docs/systems/auth-accounts.md`: a new "Changing the email" section (two codes, the generic `email_exists`, the
  copies following inside GoTrue's commit, the callback landings, the waiting window); the dashboard list gains the
  Email OTP expiration pair, the Change Email Address template, Confirm email and Secure email change; Names and photos
  gains the door name surviving the magic link; Deleting an account gains the three scrubs, the trigger's `return old`,
  the read-side net and the held backfill; the opener lists email changes.
- Proposed for `docs/systems/database-security.md` (a read, not edited): the "TWO EMAIL COLUMNS" line could add that
  `handle_user_email_change` keeps `guests.email` equal to the account's address on verified rows and that deletion
  clears it (`scrub_account_guest_rows`), both trigger functions in the service-role-only set.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Identity: an email change leaves `newsletter_signups` on the old address, so the `/account` marketing switch
  reads the new one and turning it off cannot remove the old row; move the row with the change (or key the switch on
  the account) before a newsletter sender ships (from `identity-email`).
- Now: Code hygiene: the six-digit code length lives in three files (`email-sign-in.tsx`, `account-delete-card.tsx`,
  `email-change.ts`'s `EMAIL_CODE_LENGTH`), each "lockstep with the dashboard"; one export in `src/lib/auth/` (from
  `identity-email`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/identity-email`:** the migration `3e765365` (applied by the Orchestrator as `identity`),
  the questions `bc9eb39e`, the work `87479c87`, the sync `f808c577` (merge of `origin/launch-prep` at `bdba680e`:
  album-pages, door-r2 and story-r2 had landed and `database-security.md`, one of the reads, had moved; no conflict),
  and this manifest; the head is in the chat line.
- **Gates on the synced tree `f808c577`**, each on its own exit code (logs in the lane's scratch dir,
  `gate2-*.log`): `pnpm typecheck` 0; `pnpm lint` 0 (0 errors; the 6 warnings are in files this lane never touched);
  `pnpm test` 0 (471 files, 5,127 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3135` 0 (282 checks, 0 failing). The dev server on 3135 is stopped.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path sits under an `owns` prefix
  (`src/app/(app)/account/`, `src/app/(auth)/`, `src/lib/db/mutations/account`, `src/lib/lifecycle/account-deletion`,
  `src/lib/media/uploader-identity`, `src/lib/stripe/customer-email`, the two migration files,
  `docs/systems/auth-accounts.md`) or is this file, with ONE exception: `src/components/app/account-delete-card.tsx`,
  one sentence in the deletion dialog (other hosts' photos stay "without your name or email"), because that dialog is
  where a person decides, and no live lane owns the file.
- **The migration (applied):** `handle_user_email_change` + `on_auth_user_email_changed` and
  `scrub_account_guest_rows` + `profiles_scrub_guest_rows`. Proven three ways before the apply (the header records
  it): verbatim on a local Postgres 17 stand-in (seven mutations each caught by its own FAIL line; GoTrue-shaped
  writes under `set role supabase_auth_admin`), and on live inside one rolled-back DO block (`ROLLBACK_OK`, nothing
  persisted). After the apply, a live run through GoTrue's own admin API on one disposable user
  (`live-proof.log` in scratch): the address change reached `profiles.email` and the verified guest row, a null
  `door_name` write deleted the key, `deleteUser` scrubbed the row (email null, user_id null, `verified_at` kept),
  and nothing was left (`idc-%` users, profiles, guests: 0).
- **The backfill** `20260926210000_identity_backfill.sql` is NOT applied and waits for Will's yes. Read-only count
  first: `select count(*) as rows_to_clear, count(distinct event_id) as events_touched from public.guests where
  user_id is null and email is not null;` (0 rows on 2026-09-25; the trigger now covers every deletion, so it can
  only ever catch rows orphaned before the apply).
- **The email row** (`email-section.tsx`, `email-change.ts`, `email-actions.ts`, `email-state.ts`): the Profile card's
  email line became Change, an address, two code fields; tests pin the machine (`email-change.test.ts`), the
  refusals and the address-from-`getUser` rule (`email-actions.test.ts`) and the DOM walk end to end
  (`email-section.test.tsx`). Seen on a throwaway local harness at 1440 and 375 (no horizontal scroll; the codes fit
  a 343px card; long addresses wrap), with the real actions answering "Sign in and try again." on localhost.
- **The callback** (`src/app/(auth)/auth/callback/route.ts`, + test): `flow=email_change` lands on `/account` with
  `?email_change=half` (no code), `failed` (a named refusal), `done` (a working exchange, then the Stripe sync in
  `after()`), or the plain page (a failed exchange); probed on the dev server. A guest's link (`next=/e/`) runs
  `adoptDoorName()` after the exchange.
- **`adoptDoorName`** (`src/app/(auth)/adopt-door-name.ts`, + test; the key in `door-name-key.ts`): inert until
  `door-flow` passes `options.data = { [DOOR_NAME_KEY]: name }` on `signInWithOtp` (import from
  `@/app/(auth)/door-name-key`).
- **The deletion scrub**: `scrubAccountGuestRows` in the request (isolated, `account.test.ts`), in the sweep's
  re-anonymise (a failure stops the purge before `deleteUser`; `guest_rows_scrubbed` sums into the run's counts,
  `account-deletion.test.ts` on the clamping fake), and the trigger. **The read-side net**: `resolveUploaderIdentity`
  case 2 returns no address without a `user_id` (`uploader-identity.test.ts`).
- **`syncBillingEmail`** (`src/lib/stripe/customer-email.ts`, + test): updates only the customer's email, never
  throws; no Stripe MCP work was done.
- **Pins for `src/lib/db/migration-guards.test.ts`** (outside this lane): `handle_user_email_change` stays SECURITY
  DEFINER with `set search_path = ''`, returns early on `deletion_requested_at is not null`, writes `guests.email` only
  `where g.user_id = new.id and g.verified_at is not null` and never names `pending_email`; `on_auth_user_email_changed`
  is `after update of email on auth.users` with `when (old.email is distinct from new.email)`;
  `scrub_account_guest_rows` nulls exactly the four columns `where g.user_id = old.id` and ends `return old`, on
  `before delete on public.profiles`; both revoke EXECUTE from `public, anon, authenticated`; the backfill never names
  `pending_email`. (The scrub's four columns are already pinned against the file in `account-deletion.test.ts`.)
- **Dashboard settings for the Orchestrator** (after the merge; recorded in `auth-accounts.md`): Authentication,
  Sign In / Providers, Email: "Secure email change" ON and "Confirm email" ON; Email OTP expiration 3600 s. Emails,
  Templates, Change Email Address: `{{ .Token }}` beside `{{ .ConfirmationURL }}`, worded for both recipients, e.g.
  subject "Your Partyreel code to change your email", body "Someone asked to move a Partyreel account from
  {{ .Email }} to {{ .NewEmail }}. Enter this code on your account page: {{ .Token }}. Each address gets its own
  code, and the email changes once both are entered. Or confirm with this link: {{ .ConfirmationURL }}. If this
  wasn't you, ignore this email: nothing changes without both codes." Optional: the "Email address changed" security
  notification ON. The redirect allow-list's `/auth/callback**` entries (apex and alias) already admit
  `?next=/account&flow=email_change`; confirm the alias entry carries the `**`.
- **Help copy for `reel-sweep`** (`content/help/`, exact sentences): in `your-data-and-deleting-your-account.mdx`,
  the bullet becomes "**Photos you added to someone else's event** stay in that host's album under their control,
  without your name or email, and so does the record of each upload kept for handling abuse. Ask the host if you'd
  like them removed." and the closing line becomes "What happens next: your name, email address, profile photo and
  handle come off your profile immediately, and your name and email come off the photos you added to other hosts'
  events. Your events go straight to Deleted, and you're signed out. Everything left is erased for good within days,
  media and files included." In `display-name-and-profile-photo.mdx`, the last paragraph becomes "To move your
  account to a new address, tap <UiLabel>Change</UiLabel> beside your email on your account page. We send a code to
  your current address and one to the new one, and your email changes once both are entered, in either order. Hosts
  of events you've added photos to see the new address. An email can be changed but not removed; deleting your
  account is how it comes off Partyreel."
- **Live on the alias once merged** (Will types every code; no agent does): sign in to a disposable account; Account,
  Profile, Email, Change, a second inbox Will controls, Send codes; enter the current address's code (the row asks
  for the other and moves the caret), then the new one (the toast, the row shows the new address); then the
  Orchestrator reads `profiles.email` and that account's verified guest rows. The link path: request again, tap the
  first email's link (lands `?email_change=half`), finish with the other code.
- Assets requested from Will: none.
- Board ideas: the Profile card's three rows (photo, name, email) could share one row grammar (a label, a value, one
  action): today the name is an always-open form and the email a row behind Change.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the migration is applied; the backfill waits for
  Will; the Supabase Auth dashboard settings above; no env, Vercel, Worker or Stripe configuration change.
- **Calls his to overrule:** past hosts see the new address (the brief's call); the copy also skips the guest rows of
  an account whose deletion is requested (the brief named the profile), so an operator's later change cannot
  re-attach an address the scrub removed; the scrub takes a typed name too (the first Question); the email is a row in
  the Profile card rather than a card of its own; a change left waiting reopens its fields on load and "Not now" parks
  it (GoTrue has no cancel; its codes die in an hour); a tapped final link whose exchange fails lands on the plain
  page rather than claiming "done"; the link returns to the request's own host, not the canonical site URL, because
  the PKCE verifier cookie is host-scoped; `adoptDoorName` is a server-only module in `src/app/(auth)/` rather than an
  export of `actions.ts` as the brief named, because client components import `actions.ts` (their tests load it,
  where `server-only` cannot resolve) and the function needs no public endpoint.
- Look at first: `src/app/(app)/account/email-section.tsx` with `email-change.ts` (the two-code row), then
  `src/app/(auth)/auth/callback/route.ts`'s `emailChangeLanding`, then the migration header.
