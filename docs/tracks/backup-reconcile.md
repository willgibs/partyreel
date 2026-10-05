---
track: backup-reconcile
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/backup/
  - src/app/api/internal/backup-prune/
  - src/app/api/internal/job-run/
  - src/app/admin/jobs/
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - src/lib/r2/keys.ts
  - src/lib/r2/delete.ts
---

# lp/backup-reconcile

**Goal.** The backup reconciles again: a listing merge instead of a HEAD per object, fitting well inside the platform's cut (resumable by cursor if it must), and the lone copies younger than the prune's gate counted and restored.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3131 is yours; 3000 is Will's desk. No deploy, no Worker secret, no switch change: the Orchestrator deploys `partyreel-backup` at milestone 38.

**What is broken, in production.** The backup's daily reconcile (`reconcileSweep`, `workers/backup/src/index.ts`, the 05:00 cron) HEADs every object: on 2026-10-04 it took 715 s over 3,419 objects, and 2026-10-05's never closed (the platform cuts a cron at 15 minutes), so its last finished run is past a day and a half and its `/admin/jobs` card reads Overdue. The backup is not reconciling: a durability failure, and the first thing this program fixes today. `durability-backups.md` is the system doc; durability-restore (merged today) added the restore and found both gaps below.

Each pinned by a test that fails on the old code:
1. **A listing merge, not a HEAD per object:** walk the primary's and the backup's listings side by side, a thousand keys at a time (the prune's own pattern, `prune-strategy.ts`), and compare by key, size and etag, so a reconcile costs two listings a thousand keys instead of a request an object. Make a run fit well inside the 15-minute cut at 100,000 objects; if it cannot, it resumes by cursor across runs (its progress, its pass's end and its last finished pass on the card, so Overdue means a pass that truly stalled). Measure on fakes (3,419 and 100,000 objects: wall time and subrequests against the Worker's limits) and with one read-only live dry run (listings only, nothing copied, timed).
2. **The young lone copies:** lone copies younger than the prune's 36-day gate go unseen (the prune judges absent keys past the gate only), so a primary object lost in its first five weeks waits until then to be counted and restored. Count them on the reconcile's merge and hand them to the restore with its own guards (only keys a live row names, never over a present object, `RESTORE_MODE`).
3. **Zero silent failures:** a reconcile that stops early or errs says so at its source (Sentry, the ops mail, the card), as job-run does for the prune's lone copies.

Prove the Worker with its own tests (`cd workers/backup && npx vitest run`, its typecheck, `wrangler deploy --dry-run`); a live run reads only. Wiring rigor: the whole gate.

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
