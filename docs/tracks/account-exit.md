---
track: account-exit
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Will answered all three as recommended, with three more rulings (2026-10-03); built as settled:
- **The checkbox:** offered only when she has any, off by default ("since a user could delete their uploads to other
  events at anytime"). Built as a labelled Switch row, the confirm's own option control (`DestructiveSheet`'s
  `option`): production has no checkbox primitive yet.
- **The refund:** none, said plainly in the dialog; the plan is cancelled at once (a host could upgrade on the event's
  day and claim most of it back days later).
- **The window stays private:** never offered to the person; the operator's Cancel deletion is the occasional failsafe.
- **The window's length stays as it is,** even with minutes to go: never lengthened, no minimum wait ("would rather lean
  into privacy-first deletions than hang onto their data longer").
- **Cancel deletion is required:** the whole recovery from /admin, no SQL, saying plainly what comes back and what does not.
- **A held account stays blocked,** and the sign-in's words stay true without telling the hold: after "you can start
  fresh after <time>", one line, "If it's still blocked after that, contact us" (linking `/contact`), never more.

## System-doc edits (in place, owned facts only)

- `docs/systems/auth-accounts.md`, "Deleting an account": its first line refined (what goes at once, her uploads
  elsewhere taken out first when she asks, no refund and why); three lines added: the purge's time
  (`purge-time.ts`), a sign-in during the wait (where GoTrue refuses, the public answer, why `/login`'s words are
  conditional, the contact line for a hold), and the operator's Cancel deletion (what it restores, its order, its
  refusal during a run, its audit line).

## Deferred (ROADMAP one-liners, bucket named)

- Launch checkpoint: `/privacy` and `/terms` say what a deletion now does: everything anyone can see goes at once and the
  nightly purge erases the rest, after which the address can start fresh; her uploads in other albums can go in the same
  step (`legal-privacy.tsx`'s "Delete your account", `legal-terms.tsx`'s "Deletion is immediate and permanent").

## Handoff (replaces the chat report)

- **Commits:** the work `c61630d6`, the Orchestrator's three follow-ups `f001689e`, and this manifest, pushed to
  `lp/account-exit`. launch-prep moved since the cut (lab-frame, desk-tune-4, docs) but nothing in this lane's owns or
  reads and no conflict, so no sync.
- **Gates on `f001689e`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0
  (808 files, 9,542 tests); `zsh scripts/build-lock.sh pnpm build` 0. `pnpm lab:smoke --base http://localhost:3134` 0
  (161 checks, 0 failing) on `c61630d6`, not re-run: `f001689e` changes `src/` only under `lib/lifecycle`. Logs:
  `/Users/gibby/local/ai/partyreel-wt/_scratch/account-exit/gate-*.log` and `gate2-*.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is owned paths, this file, and the three the
  Orchestrator accepted: `src/lib/lifecycle/account-deletion.ts`, its test, and the new migration file.
- **A restored account is never erased** (`f001689e`): `purgeAccount` reads the account's stamp again before the
  re-anonymise or any delete, and an account whose stamp is gone is `skipped` (tallied `accounts_skipped`, never a
  backlog), so a Cancel deletion that lands after a run read its queue leaves it whole. Red first: three tests in
  `account-deletion.test.ts` (the sweep with the stamp cleared just after its queue read, `purgeAccount` alone, the
  read's place before every destructive step), all three red on the old purge
  (`_scratch/account-exit/red-stamp-reread.log`), green on the fix. `account-deletion.ts`'s header now says what is
  reversible: the operator's Cancel deletion reverses the ban and the stamp before the purge, and nothing else.
- **The dialog** (`account-delete-card.tsx`): the plan line (cancelled now, never refunded), the events line, "Your
  account is erased for good by <time>, in our nightly cleanup" with the email locked until then and free after, and the
  choice "Also remove the 12 photos and 1 video I added to other people's albums" (only when she has any, off). Its count
  and time come from `getDeletionFactsAction` as it opens (hover and focus ask first; one answer serves 30 s); the done
  screen repeats when the email can start fresh and stays until she leaves (Done, the corner ×, Escape all go home).
  Pinned: `account-delete-card.test.tsx`, `actions.test.ts`.
- **The removal** (`requestAccountDeletion`, step 2): her own `removeMyUpload` for each upload of hers in another
  host's live album, read whole by keyset, before the plan and the stamp; the end state decides (any left refuses the
  whole request, "your account wasn't deleted", with a Sentry warning). Pinned on the clamping fake: 1,200 removed and
  no one else's touched; one left refuses with no plan cancelled, no stamp, no bin, no ban; a retry finishes it
  (`account.test.ts`). The predicate was read live, service role and read-only: its counts agree with the RPC's guest arm
  rebuilt by hand for every account that has guest rows (`_scratch/account-exit/probe-queries.mjs`).
- **The purge's time** (`src/lib/lifecycle/purge-time.ts`): parity with vercel.json's cron, the window and the words in
  New York, Los Angeles, Berlin, Kolkata, Sydney, Chicago (midnight) and Bangkok (noon), before, inside and after the
  window, and across Eastern's fall-back (`purge-time.test.ts`).
- **A sign-in during the wait** (`src/app/(auth)/account-deleting.ts`, `account-deleting-notice.tsx`): the code screen
  (and every guest door sharing it) goes back to the email step naming the address; the callback sends a banned link or
  Google, and a banned exchange, to `/login?error=account_deleting`, whose conditional words sit above the door. GoTrue's
  shapes pinned from its v2.197.0 source, the version live (`/auth/v1/health`): `email-sign-in.deleting.test.tsx`,
  `route.test.ts`, `account-deleting.test.ts`, `account-deleting-notice.test.tsx` (server paint, clean hydration, then
  the browser's zone), `login/page.test.tsx`. `signInWithOtp` does not refuse a banned user (GoTrue's `MagicLink` has no
  ban check), so the send needs no mapping.
- **`/login?error=a&error=b` answered 500** (the failure table lower-cased a list); it now reads the first value
  (`login/page.test.tsx`; probed on the dev server before and after).
- **Cancel deletion** (`cancelAccountDeletion`, `cancelAccountDeletionAsOperatorAction`, the control beside Delete in
  `delete-account-control.tsx`): unban, then clear the stamp and put the auth user's address back on the profile (the
  lifecycle and billing mails read it); a stamp that will not clear puts the ban back; refused while a purge run is under
  way; the panel lists what comes back and what stays gone, verb "Keep the account". Its refusal for the signed-out, a
  non-admin and an admin at AAL1, through the real seam: `src/app/admin/accounts/actions.test.ts`; the rest
  `account.test.ts`, `cancel-deletion-control.test.tsx`. The card shows "Purged by <UTC>" for an unheld account.
- **Words:** `content/help/your-data-and-deleting-your-account.mdx` (the section rewritten, "Starting fresh with the
  same email" added) and `auth-accounts.md`.
- **Captures** at 1440 and 375 from my dev server, headless Chrome of my own (America/New_York): `/login`'s notice, the
  code screen's, the dialog, its choice on, its done screen, and the operator's panel, in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/account-exit/captures/`. The dialog and the panel need a session the dev
  server cannot give, so they ran on an uncommitted harness page, their two Server Function answers rewritten in the
  browser; GoTrue's `/otp` and `/verify` were answered in the browser too (`capture.mjs`): no account touched, no mail sent.
- **Live:** the alias serves launch-prep, not this branch, so the walk is the red-team's after the merge: `/login`'s
  notice from a forged `/auth/callback?error=access_denied&error_code=user_banned`; a normal Google sign-in still lands;
  the dialog with willg97 (Google chooser) up to its confirm, never pressed, the choice offered only if he has uploads in
  others' albums; `/admin/accounts/<id>` on an unstamped account shows no Cancel.
- **For the Orchestrator's records (outside this lane):** `testing-verification.md`'s hi@willgibs line restores "by SQL":
  Cancel deletion on `/admin/accounts/[id]` is that restore now. `admin-observability.md`'s "No operator audit table"
  line may note the cancellation's Sentry line.
- **Assets requested from Will:** none.
- **Board ideas:** a slot in the account door for a page's own answer under its heading, where the door's failures stand
  (`/login`'s deletion notice sits above the heading today, the door being another lane's).
- **Proposed migrations:** `supabase/migrations/20261003030000_deletion_requested_at_comment.sql`, for you to apply
  (never applied here): one `comment on column public.profiles.deletion_requested_at`, no schema, so no types to
  regenerate. The column said "Set once, never cleared"; it now names the operator's Cancel deletion as the one thing
  that clears it, before the purge. Held rolled back on the live schema in one `execute_sql` (`begin;` the statement
  `rollback;`): the comment read 721 characters before and 699 after inside the transaction, and the live comment still
  reads "Set once, never cleared" afterwards, so nothing persisted. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:**
  - The code screen names the address ("The old account for maya@example.com is still being erased"): GoTrue answers
    `user_banned` before it checks the code, so anyone who sends that address a code learns its account is being
    deleted, which GoTrue's own public verify already tells anyone, silently. `/login`'s words are conditional instead
    ("If you deleted your account..."), since a forged link can reach them.
  - The password door stays generic on a ban (its refusal is generic by rule, and GoTrue checks the ban before the
    password); its first way out, a code, reaches the code screen's words.
  - The removal runs before the plan, and its refusal says "your account wasn't deleted" (some photos may already be
    out, as she asked), not "nothing was deleted".
  - Cancel deletion also puts the account's own address back on the profile, and refuses during a purge run.
  - The purge's word is "erased" ("erased for good by 1:00 AM tomorrow"), days are today, tonight and tomorrow, and
    midnight and noon are words.
  - The done screen stays until she leaves it, where it flashed for 1.6 s.
- **Look at first:** `captures/375-dialog.png` and `375-code-screen-account-deleting.png`, then
  `src/components/app/account-delete-card.tsx` and `cancelAccountDeletion` in `src/lib/db/mutations/account.ts`.
