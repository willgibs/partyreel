---
track: admin-uploads
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  - *Why not zero it:* `storage_ledger.cumulative_bytes` is also the spend watch's meter of what the platform pays for (`spend-watch.ts`), the hour's breaker rides the same row, and a pass's year is `event_passes.uploaded_bytes`; an `update ... set cumulative_bytes = 0` lifts the guard, blinds the watch and leaves no trace.
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
