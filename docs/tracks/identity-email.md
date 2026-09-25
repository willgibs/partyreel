---
track: identity-email
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  account's own inbox staying silent still tells). Recommended: yes, a per-ACCOUNT kind (`email_change`, about 5 an
  hour), not venue-shaped like the guest kinds; not built, because `abuse-rate-limit.ts` is `reel-teardown`'s tonight.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
