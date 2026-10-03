---
track: account-exit
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "891767cc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/account-delete-card
  - src/app/(app)/account/actions
  - src/lib/db/mutations/account
  - src/lib/lifecycle/purge-time
  - src/components/auth/email-sign-in
  - src/app/(auth)/
  - src/app/admin/accounts/
  - content/help/your-data-and-deleting-your-account.mdx
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - docs/systems/durability-backups.md
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
  - src/lib/lifecycle/account-deletion.ts
  - src/lib/db/mutations/my-uploads.ts
  - src/lib/stripe/account-cancel.ts
  - src/app/api/cron/purge/route.ts
  - vercel.json
---

# lp/account-exit

**Goal.** Make leaving Partyreel clear end to end: the deletion dialog says plainly what happens now, what the overnight purge does and when this email can start fresh; a sign-in during the wait says why and when instead of a dead end; an operator can cancel a deletion before the purge; and the person can take her own photos out of other people's albums as she goes.

## The brief

**Why.** Will, 2026-10-03, on account deletion once signups are on (post-launch). His model is the code's: everything anyone can see goes at once, with the internal cleanup of the account and its billing; a brief emergency window in which an operator can recover it; then the overnight purge wipes the rest and deletes the sign-in, and the email can start fresh. His worry, in his words: "would suck if they wanted to delete their account & start fresh, but tried to immediately create a new account and were blocked. we may lose a user who doesn't know to wait a little." His ask: the confirmation hits the key points, "'billing will be cancelled, all events & uploads deleted immediately, next purge at X time will wipe your data from our systems, unable to create a new account until then, etc'".

**What is true today** (read 2026-10-03; confirm each before you build on it):
- The request (`src/lib/db/mutations/account.ts`) cancels every live subscription at once (`stripe.subscriptions.cancel`, no proration: the rest of the period is not refunded), stamps `deletion_requested_at` (the point of no return), bins the hosted events, removes the newsletter address, scrubs the account's guest rows, anonymises the profile (email, display name, the /u/ handle freed at once, avatar) and bans the auth user for a century.
- The purge (`sweepDeletedAccounts` in `src/lib/lifecycle/account-deletion.ts`, called from `/api/cron/purge`) hard-deletes R2, then media, then events (no 30-day wait), then `auth.admin.deleteUser`. `vercel.json` schedules it `0 4 * * *`, and Vercel's Hobby plan fires a daily cron anywhere inside its hour (seen at 04:48 UTC), so it lands between 04:00 and 05:00 UTC. Two delays: a forensic hold keeps the account, anonymised and banned, until the hold lifts (the account is never told); a very large account can take more than one night (`unfinished`).
- Her uploads to OTHER hosts' albums stay, nameless (`media.guest_id` SET NULL; `SCRUBBED_GUEST_PATCH`; `/privacy` says so). Yet a signed-in person can remove any photo she personally uploaded, ever (`remove_my_upload`, `src/lib/db/mutations/my-uploads.ts`: Will's `yours` rule), so the dialog's "Ask the host if you want them removed" undersells what she can do herself.
- During the wait the same email is refused: GoTrue answers `user_banned` ("User is banned"), at the email code's verify and at the Google callback (find whether `signInWithOtp` refuses earlier, before a code is sent), and today both reach a generic error. Only deletion bans an account (grep `ban_duration`), so a ban means "being deleted".
- Recovery inside the window is SQL by hand today (lift the ban, clear the stamp); what the request already did stays done.
- Backups keep copies until they age out (`durability-backups.md`: the media backup's 35-day Bucket Lock and weekly prune, the nightly DB dump); Stripe keeps its billing records.

**Build:**
1. **The dialog** (`account-delete-card.tsx`): Will's key points, plain and short, with the real time in her own time zone. Your plan is cancelled now and you won't be billed again, with the rest of the period not refunded (said plainly). Her N events and everything in them are deleted right away. The photos she added to other people's albums stay there without her name or email, unless she checks "Also remove the N photos I added to other people's albums" (offered only when N > 0, unchecked by default, N counted on the server, the removal whole past 1,000 rows). Overnight, by the purge window's end in her local time, the nightly cleanup wipes her data from our systems and closes the account for good; until then this email can't sign in or start a new account, and after it she can start fresh. The done state repeats when the email can start fresh. Short enough to read before pressing: no wall of text.
2. **The purge's time from one home:** a pure helper (`src/lib/lifecycle/purge-time.ts`) giving the next purge window from a time, pinned by a parity test against `vercel.json`'s cron so the two never drift; the words always say "by" the window's end, never an exact minute.
3. **The blocked attempt says why and when**, wherever a sign-in can meet the ban: the email code's verify in `email-sign-in.tsx` (the guest door shares it), the Google callback (`src/app/(auth)/auth/callback/route.ts`) and `/login`'s error. Recognise `user_banned` by its code (the message only as a fallback) and say that this email's old Partyreel account is still being deleted and she can start fresh with it after the purge window's end. Never more than that (a hold is never told), never a generic error.
4. **The operator's Cancel deletion** on `/admin/accounts/[id]`, while the purge has not run (the stamp set, the auth user present), through `requireAdminAction()` (admin plus AAL2), audited like the delete control. It lifts the ban and clears the stamp, and says first what comes back (sign-in; her events, restorable from Deleted for 30 days) and what does not (her name, photo and handle, her plan, the newsletter, her guest rows' names). Its refusal without AAL2 is tested.
5. **Words that follow:** `content/help/your-data-and-deleting-your-account.mdx` and `docs/systems/auth-accounts.md`'s deletion lines. Never `/privacy` or `/terms`: the legal text is rewritten once before launch (Will's word), so their lines go in your Deferred as one ROADMAP Launch-checkpoint line.

**Constraints:**
- The request's order is the design: cancel the plan before the stamp (aborting the whole request if Stripe refuses), the stamp the point of no return. Removing her photos from other albums is destructive, so put it where a failure loses nothing she did not ask for: before the stamp, aborting the request with "nothing was deleted, try again" if it fails, needs no migration. If a better design needs one, write the SQL file and hand it to the Orchestrator (never apply it).
- Never call Stripe, never change the cancel code's behaviour, and never press Delete my account on any real account: unit tests and a local render prove the dialog. A live check on the alias stops at the dialog.
- No ban is ever set on a real account to test the message: pin GoTrue's `user_banned` shapes from its docs and source in unit tests (verify, callback, and `signInWithOtp` if it refuses).

**Questions, each recommended, built, and Will's to overrule:** the refund (none, said plainly); the checkbox (offered, unchecked); whether the window is ever offered to the person, as in "contact us before…" (recommended not: from her side the dialog stays "permanent", and the operator's control is the emergency tool).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code) and `pnpm lab:smoke --base http://localhost:3134`; Vitest for the purge-time helper (Eastern, Pacific and a UTC+ zone, a time inside the window, just before and just after it) and its parity with `vercel.json`, the dialog's words with and without a plan, events and others' photos, the checkbox's removal (whole past 1,000 rows, aborting with nothing deleted on failure), the `user_banned` mapping at each surface, and the admin control's refusal without admin or AAL2; the dialog and the blocked-sign-in message captured at 375 and 1440 from your dev server in a headless Chrome of your own, in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

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
