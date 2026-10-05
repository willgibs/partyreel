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
