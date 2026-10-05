---
track: billing-locks
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "75f3ce9f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005130000_billing_locks.sql
  - src/lib/db/mutations/event-passes
  - src/app/api/stripe/webhook/
  - src/lib/upload/server-pipeline-meter
  - src/app/admin/accounts/
  - src/lib/db/queries/accounts
  - src/lib/db/queries/month-uploads
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - docs/systems/database-security.md
  - docs/PRICING.md
---

# lp/billing-locks

**Goal.** Three billing crumbs from the ROADMAP, each on the database's own terms: the Stripe webhook's pass-for-Pro-credit conversion takes the host's profile row first, as the upload completes do, so the two can never deadlock; the presign meter refuses a lapsed pass up front, as the completes already do; /admin/accounts reads every listed host's uploads in one call, and a lapsed pass reads truly where it read "0 B".

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3131 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate. Stripe is TEST mode; nothing of yours calls Stripe's API.

**Read first:** `docs/systems/billing-caps.md` (★ the Stripe webhook is the sole writer of `profiles.tier` and `storage_cap_bytes`; never trust the client for entitlements) and `docs/systems/database-security.md` (definer rules, grants, the apply protocol, the row cap).

**The fixes**, each pinned by a test that fails on the old code:
1. **A lock-order cycle.** `consumeLivePassesForProCredit` (`src/lib/db/mutations/event-passes.ts`, from the Stripe webhook) writes `event_passes` then `profiles`, while the upload completes take `profiles` then the pass's row: a cycle Postgres detects and breaks by failing one side (retried, never corrupt, but a webhook or an upload fails for no reason of hers). One service-role RPC that takes the host's `profiles` row first, then converts her live passes, in one transaction; the webhook calls it and stays the sole writer it is.
2. **A lapsed pass uploads, then is refused.** Until the nightly recompute, the presign's meter (`meter_upload`, called by `src/lib/upload/server-pipeline-meter.ts`) presigns a lapsed pass's upload and the bytes go up, then the complete refuses it. Refuse it at the presign as the completes do, with the same words, so nothing is sent for nothing. A function replacement starts from its newest definition in `supabase/migrations/`.
3. **`/admin/accounts` makes 50 `uploads_used` calls a page view** (`src/app/admin/accounts/uploads.ts`, `src/lib/db/queries/accounts.ts`): one set-returning read for the page's hosts (keyset or id list, clamped to 1,000), each figure exactly what `uploads_used` answers for that host, under a parity test. And a lapsed pass reads "0 B" of its allowance while its uploads are refused: say what is true (lapsed, uploads refused, since when).

**The migration** is exactly `supabase/migrations/20261005130000_billing_locks.sql`, with its rolled-back contract check at its foot, run through the Supabase MCP inside `begin; ... rollback;` (or a DO block ending in a deliberate raise). The Orchestrator applies it after the Advisor reads it; nothing of yours writes to the database. Every new function revokes from `public` before it grants exactly; definer bodies pin `search_path = ''`.

Out of scope (later lanes): renaming the uploads meter's wire names, and the idempotent complete. Wiring rigor: the whole gate.

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
