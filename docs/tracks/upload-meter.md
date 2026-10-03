---
track: upload-meter
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ada60bba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/r2/presign-upload/
  - src/app/api/r2/complete-upload/
  - src/lib/upload/server-pipeline
  - src/lib/security/abuse-rate-limit
  - supabase/migrations/20261003210500_
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - src/lib/constants/tiers.ts
---

# lp/upload-meter

**Goal.** The meter sees every byte a host can make us store: a presign's declared bytes count against the month's uploads (an abandoned upload simply counts), a preview is never heavier than its original, and two unpublished breakers far past any party stop a script (an account's uploads an hour, its events a day); and the join limiter fits a 2,000-guest wedding on one venue Wi-Fi.

## The brief

**Why.** Will's pricing rethink (2026-10-03): "Ideally, no pro user can ever exceed our costs to support them." PRICING.md's "What it costs us" (cost-atlas, merged at `ec3ee1ae`) proves that promise per plan, but only under its preconditions ("The levers", "The preconditions"): rule 2 holds only once they ship, whichever ladder Will picks, so they are launch blockers. Read that section first, and the Advisor's Q16 review in its record (the pickup's cost-atlas row).

**What breaks today** (PRICING.md, at file:line):
- **An upload never completed.** A presigned PUT lives two hours and is not single-use (`r2/presign.ts:48`); the ledger is written only by `create_media`, and the backup copies the object on its PUT, so abandoned bytes are stored and backed up unmetered.
- **A preview** can weigh 2 MB beside a one-byte original, and nothing refuses it.
- **No limiter** sits on presign or complete: a script's tiny files are unbounded in count. Nothing limits creating events.
- **The join limiter** (`security/abuse-rate-limit.ts:59-64`) allows 400 joins a quarter-hour per (address, event). A 2,000-guest wedding on one venue Wi-Fi meets it in its arrival hour (the Advisor's Q16), and "no guest limit" is published.

**Build:**
1. **The presign counts.** A presign's declared bytes (the presigned Content-Length binds them, so declared equals real) count against the month's uploads at presign, and never again at complete. A refused or abandoned upload still counts: the meter never refunds (PRICING.md's Model). The host's and the guest's paths both.
   - The ledger write is SQL: write the migration for the Orchestrator under your reserved prefix (the Advisor reads it, then it is applied by protocol), its rolled-back check at its foot, red then green.
   - It must keep the plan's published allowance exactly as the meter reads it today for a completed upload, and never count a file twice.
2. **A preview never heavier than its original,** refused at presign in words.
3. **Two unpublished breakers, far past any party:** an account's uploads an hour, and its events created a day (≈100). Each sits where the code already limits (the abuse limiter or the presign's own reads), and each is refused in words, never silently.
4. **The join limiter sized for the wedding.** The per-(address, event) backstop holds a 2,000-guest wedding's arrival on one Wi-Fi. Breadth stays the real guard against a scraper.
5. **Facts in `billing-caps.md`,** in place.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for every item (logged); the migration's rolled-back check red then green on the live schema; a real upload, guest and host, counted once at presign and never at complete (SQL before and after).

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
