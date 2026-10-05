---
track: durability-restore
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/backup/
  - src/app/api/internal/backup-prune/
  - src/app/api/internal/job-run/
  - src/app/admin/jobs/
  - src/lib/jobs/failure-log
  - supabase/migrations/20261005182000_backup_restore.sql
  - docs/systems/durability-backups.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - src/lib/r2/keys.ts
  - src/lib/r2/delete.ts
---

# lp/durability-restore

**Goal.** The backup's lone copies loud at their source, counted across a pass, and restored on their own: exactly the keys a live row still names, never over a present object, under a mode switch, with the admin card and control.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk. No deploy, no Worker secret, no switch change: the Orchestrator deploys `partyreel-backup`.

**What this is.** A lone copy (`primary_missing`: the backup holds an object whose primary copy is gone while a live row still names it) is today a durability alert a person resolves by copying each key from the run's log, raised only from its `/admin/jobs` card. `durability-backups.md` and `admin-observability.md` are the system docs; `workers/backup` the Worker (deployed as `partyreel-backup`, `PRUNE_MODE` still `dryrun`). Each change pinned by a test that fails on the old code:
1. **Loud at its source:** `/api/internal/job-run` raises a run's `primary_missing` (any count) as it does dead letters: a Sentry warning and the ops mail, beside the card and the bell.
2. **A pass-wide count:** the prune ledger carries `primary_missing` across a pass, so a pass spanning runs reports the whole backup's lone copies, not each run's range.
3. **Restored on their own:** the prune's confirm route answers which of a run's lone keys a live row still names, and the Worker copies exactly those back from `partyreel-backup` into the primary bucket: never over an object that is present (a conditional write, doc-checked against R2's current API), never a key no live row names, under its own mode switch (off, dryrun, on; dryrun by default, as `PRUNE_MODE`), each restore logged with its key and outcome, and the `/admin/jobs` card saying what was restored, what could not be and why (zero silent failures), with the operator's run-now control behind AAL2 as the other job controls. The doc says the new remedy.

Prove the Worker with its own tests on fakes (`cd workers/backup && npx vitest run`, and its typecheck); a live check reads only, never writes to either bucket. If the restore needs a table or a function, one migration, `supabase/migrations/20261005182000_backup_restore.sql`, per `database-security.md` (a rolled-back check at its foot). Wiring rigor: the whole gate.

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
