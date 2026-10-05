---
track: admin-uploads
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "551a7ffb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/accounts/
  - src/lib/db/queries/accounts.ts
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/queries/month-uploads.ts
  - src/lib/constants/tiers.ts
---

# lp/admin-uploads

**Goal.** The operator sees what the product enforces: /admin/accounts and the account view show a host's uploads against her allowance and her Deleted beside her active bytes (read-only).

## The brief

**Why** (ROADMAP; Partyreel runs with no AI managing it, so every operator need is an `/admin` control or readout):
- **Uploads:** a host's uploads against her allowance appear nowhere for the operator. The source is `uploads_used`: this month's `storage_ledger` row, or her live passes' `uploaded_bytes`, and the hour's uploads. A false positive must never quietly block a paying host (PRICING.md).
- **Storage:** the account view (`getAccountDetail`, `src/lib/db/queries/accounts.ts`) reads `activeBytes` alone, while the plan's cap holds both active and Deleted.

**The work, read-only:**
- `/admin/accounts`' list and the account view show this month's (or the pass year's) uploads against the tier's allowance, from `tiers.ts`, the one home, through the existing service-role read (`readHostMonthUploads`, or the `uploads_used` RPC).
- The account view shows Deleted beside active bytes, and the total against the cap.
- A failed read says "No reading", never a zero.
- **The operator's reset of a host's uploads count is NOT built:** it writes the ledger behind billing enforcement. Write it as a Question with a recommended design (an audited RPC, the admin's AAL2, a reason field). The Orchestrator brings it to Will.

**Gate:** wiring rigor (the admin ships): the whole gate; admin's surface is its own (`NEXT_PUBLIC_SURFACE=admin` for a local look). Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3132 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does the operator get a reset of a host's uploads count, and in what shape? (NOT BUILT: it writes the ledger behind billing enforcement, a one-way door for the anti-abuse guard.)** Recommended: yes, before launch (a false positive must never quietly block a paying host, and with no AI managing the product the remedy is an `/admin` control, never hand-run SQL), but as an additive, audited CREDIT, never a zeroing:
  - *Why not zero it:* `storage_ledger.cumulative_bytes` is also the spend watch's meter of what the platform pays for (`spend-watch.ts`), the hour's breaker rides the same row, and a pass's year is `event_passes.uploaded_bytes`; an `update ... set cumulative_bytes = 0` lifts the guard, skews the watch (it diffs snapshots of that sum into a rate an hour) and leaves no trace.
  - *The shape:* a `credit_bytes` column (default 0, check >= 0) on the month's ledger row and on `event_passes`, which `uploads_used()` subtracts (floor 0). That one function is what every writer, advisory and the plan sheet read, so every refusal, figure and readout (this lane's included) agrees the moment a credit lands. It adds uploads only: the storage cap and its 10% headroom still bind, and a credit dies with its window (a month's row, a pass's year), so it needs no expiry job.
  - *The act:* one SECURITY DEFINER RPC (`credit_host_uploads(p_host_id, p_bytes, p_operator_id, p_reason)`, revoked from public, anon and authenticated, granted to service_role) that takes the profiles lock the completes take, credits the window she is held to (the month's row, or the live pass that ends soonest), and refuses a reason under 10 characters, a non-positive amount, an amount over one whole window's allowance, a third credit in one window (a host who needs a third is on the wrong plan: Will's call), and a lapsed pass (no window to credit). It writes one row of the proposed `admin_actions` log (operator, host, kind, bytes, reason, `uploads_used` before and after) in the same transaction, so there is no credit without a record.
  - *The control:* a button on the account's Uploads card behind `requireAdminAction()` (admin and AAL2) and `destructive-sheet.tsx` (it lists what it touches; the amount defaults to what brings her back under, capped at one window; the reason is required; the operator types the host's email, re-checked server-side against the row, as the delete does). It re-reads `uploads_used` and shows the new figure, raises a Sentry warning, and the card says "Credited 300 MB this window by <operator>: <reason>".
  - *The other way:* no reset yet. A blocked host upgrades or waits for the window, and this lane's readout makes any false positive diagnosable; the likelier false positives are a stale cap or tier (the webhook's to fix, which the card's allowance now shows) rather than a miscounted ledger.

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md`: a new "Accounts" section (a host's uploads are `uploads_used` asked with her own tier, against `uploadAllowance`; the hour is the month's ledger row, its ceiling mirrored under a parity test; the cap holds albums and Deleted; a failed read is "No reading", never a zero, never the page; nothing lifts the count), and its "Open this before you" list gains the Accounts reads.

## Deferred (ROADMAP one-liners, bucket named)

- Admin: the Accounts list's Storage column and its over-cap tint read `storage_used_bytes`, the physical counter, which gates nothing and differs from what the cap holds (`host_storage_summary`: 4 MB apart on a test account), while the account's page now draws her albums, her Deleted and their total; a batched read of the summary over the page's ids (a migration) would make the list say what the page does.
- Admin: the Accounts list reads one `uploads_used` a row (the page's 50 at most, each its own so one failure is one No reading); one function over the page's ids (a migration) would make it one read.
- Admin: a pass holder whose last pass has ended and whom the nightly recompute has not moved yet reads "0 B of 50 GB" on the account's page while `create_media*` refuses every upload (the lapsed-pass guard, 20261004100000); read her live passes and say "No live pass" beside the figure.
- Admin: the operator's reset of a host's uploads count (the Question above, an additive audited credit): retires the last of the ROADMAP line this lane serves once Will answers.

## Handoff (replaces the chat report)

- **Commits, all pushed to `origin/lp/admin-uploads`:** `2fe7b0fb8` (the reads), `bc1c13fa7` (the list's columns and the account page's cards), `f0df82343` (the Account column's share, the note and the caption), `a511c9d1c` and `809dbd3f7` (admin-observability.md, and this manifest's Question, doc edit and Deferred lines), `1e738a5a0` (both pages read nothing below AAL2 or of a malformed id; the Uploads cell on one line), then this manifest alone. **No sync:** launch-prep moved after my base `2f8c6e873` (the crumbs-72 merge `d26e7d69a`, the crumbs-73 cut and the records, to `09ffde69a`) with nothing under my owns or my two reads (`month-uploads.ts`, `tiers.ts`), and `git merge-tree` against it is clean.
- **Gates, each on its own exit code, on `1e738a5a0` (this manifest is the only later change):** `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (929 files, 11,468 tests); `zsh scripts/build-lock.sh pnpm build` 0 (`/admin/accounts` and `/admin/accounts/[id]` in its route table); `pnpm lab:smoke --base http://localhost:3132` 0 (145 checks, 0 failing). Dev server on 3132 only, killed by port after each use. (A first typecheck failed 2 on stale `.next/dev` types of my own throwaway route, deleted since; `rm -rf .next/dev` and a rerun passed with no source change.)
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): ten paths, each under `src/app/admin/accounts/`, `src/lib/db/queries/accounts.ts`, `docs/systems/admin-observability.md` or this manifest; no exception. The queries file's own tests live in `src/app/admin/accounts/reads.test.ts`, because the manifest claims that one file exactly.
- **The items:**
  - The reads (`src/lib/db/queries/accounts.ts`; `reads.test.ts`, 14 cases): `readAccountUploads` asks `uploads_used` with HER OWN tier (a pass's year, else the month's ledger), as the refusals do, against `uploadAllowance` (tiers.ts), and never throws: an RPC error, a thrown read or an answer that is not a size is `{ ok: false, message }`, never a zero. `readAccountHourUploads` reads this UTC month's ledger row and counts only a tally whose hour is the current clock hour. `getAccountDetail` carries `deletedBytes` and `storedBytes` from the `host_storage_summary` row it already read (no new read).
  - The words (`src/app/admin/accounts/uploads.ts`; `uploads.test.ts`, 11 cases): one set of labels and states for the list and the page. At the allowance is `used >= allowance` (the advisories' `at_monthly_cap` line); `UPLOADS_AN_HOUR` is the SQL's `c_uploads_an_hour`, and a test reads the newest migration that sets it, so a new number there fails here.
  - The list (`page.tsx`; `page.test.tsx`, 6 new cases of 9): Uploads and Allowance columns (the window named `/ mo` or `/ yr`, or Unmetered); an account at its allowance wears At limit and the row's warning tone; a failed read says No reading in its row, with one note above the table and one Sentry warning a page view (`captureWarning("admin", "accounts: uploads read failed")`), never a zero and never a failed page. The Account column keeps `w-[30%] min-w-36`.
  - The account page (`[id]/page.tsx`; `[id]/page.test.tsx`, 12 cases): Storage and usage now reads Albums, Deleted and Stored of the cap (the old "Active storage" row hid the Deleted the cap holds); a new Uploads card reads This month (or Pass year) of the allowance and Started this hour of 20,000, wears At limit with a caption at either line, and says No reading and why for a failed read while the rest of the page, the delete included, still draws.
  - The antagonistic pass: below AAL2 both pages draw nothing and read nothing, and a malformed id reads nothing (each pinned, and each seen failing with its guard removed); every read's failure forced (an RPC error, a thrown read, a non-size answer, a ledger error, and a malformed uuid against the real database).
  - Seen, local only: (1) the readers against the real database through a read-only probe (deleted, never committed): for all three accounts `readAccountUploads` equals the SQL's `uploads_used` and `upload_allowance` (a Pro 676,305,420 of 536,870,912,000; a Free 114,917,094 of 314,572,800, checked by the Supabase MCP), the hour reads through the real row at a faked clock (20 at 00:30Z, 0 at 01:00Z), an unknown host is a real 0 and a malformed uuid is `{ ok: false }`; (2) the real pages, readers and database inside the real `AdminShell` on a throwaway route with only the sign-in gate stubbed (deleted, never committed): the Pro test account reads Albums 173.1 MB beside Deleted 547.1 MB, Stored 720.1 MB of 1 TB (the old page said 173.1 MB of 1 TB), 645 MB of 500 GB this month and 0 of 20,000 this hour, the Free one Stored 109.6 MB of 100 MB (inside the 10% headroom), and a malformed or unknown id is the not-found; (3) the same JSX with canned reads at 1398 px and 375 px for the states the database does not hold (at the allowance, at the breaker, a pass year of two stacked passes, Unmetered, No reading): that look found the Account column collapsing to 105 px beside seven columns, which `w-[30%] min-w-36` fixed (144 px at a phone, the table scrolling inside its own container).
  - **Not run:** the live pass on the alias (this spawn forbade any request to it) and a signed-in walk of the real portal (sign-in cannot run on localhost); a real `uploads_used` failure through the page (it needs a broken grant), covered by stubs and by a real malformed uuid. The Browser pane was only ever pointed at `localhost:3132` URLs, and the database was reached only by read-only reads (SELECTs through the Supabase MCP, and the app's own service-role client from `.env.local`).
- Assets requested from Will: none
- Board ideas: the Accounts list could filter and sort by At limit, past its cap and No reading through the inboxes' `TriageFilter`/`StatusPicker`, so a blocked host is found without scanning 50 rows.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the reset's migration is the Question above; the two batched reads are Deferred).
- **Docs the Orchestrator owns that this merge makes stale:** `docs/PRICING.md` ("nothing in `/admin` shows a host's meter, and there is no manual override": the first half is now false); `docs/ROADMAP.md`'s Admin lines on the account view's Deleted (done) and on a host's uploads in `/admin/accounts` (the readout is done; the reset remains as the Question).
- Calls his to overrule (each built as written): at the allowance is `used >= allowance`, the advisories' line, with no near-limit warning; the hour's unpublished 20,000 is drawn on the operator's page (mirrored under a parity test, never in copy a host reads); the list's Storage column and over-cap tint stay the physical counter (Deferred); the account page's storage reads still fail the page as before, and only the uploads and the hour say No reading; one note and one Sentry warning a page view, not a row; the Account column's width.
- Look at first: on the admin host after the merge, `/admin/accounts` (the two new columns, and the Free test account's row tinted for its storage), then the Pro test account's page: Albums 173.1 MB beside Deleted 547.1 MB, Stored 720.1 MB of 1 TB, the Uploads card at 645 MB of 500 GB this month.
