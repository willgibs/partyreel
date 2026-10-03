---
track: backup-prune
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ada60bba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/backup/
  - src/lib/lifecycle/sweeps/orphans
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/uploads-and-r2.md
---

# lp/backup-prune

**Goal.** The backup keeps up with deletions: the prune walks the backup with a cursor and caps sized to what hosts delete, so the backup holds the live set and its recent window, never every byte ever uploaded; and the orphan sweep reaches past its first 20,000 keys. Still dry-run until the launch switch.

## The brief

**Why.** Will's pricing rethink (2026-10-03): "Ideally, no pro user can ever exceed our costs to support them." PRICING.md's "What it costs us" (cost-atlas, merged at `ec3ee1ae`) proves that promise per plan, but only under its preconditions ("The levers", "The preconditions"): rule 2 holds only once they ship, whichever ladder Will picks, so they are launch blockers. Read that section first, and the Advisor's Q16 review in its record (the pickup's cost-atlas row).

**What breaks today** (PRICING.md, "The backup" and "An upload never completed", at file:line):
- The backup copies every object a PUT creates into Infrequent Access under a 35-day lock, and is accrue-only. The prune runs dry (`workers/backup/wrangler.jsonc:55`) and, even live, deletes at most 500 media a week after scanning 5,000 objects from the head of the listing (`prune-strategy.ts:20,27`), so a deleted byte stays backed up for good. A 100 GB plan re-filled 3× a month carries ≈$50 a month of backup a year in.
- The orphan sweep reclaims abandoned uploads at most 20 pages a night from the head of the listing (`lifecycle/sweeps/orphans.ts:11-13,44`), so past the first 20,000 keys never.

**Build:**
1. **A prune that keeps up.** A durable cursor through the backup's listing (resuming where the last run stopped, never rescanning from the head) and caps sized to the deletions (a run's budget follows its backlog, inside the Worker's own limits).
   - It deletes only what the primary no longer holds past the 35-day lock and the recovery window: every safety rule in `durability-backups.md` holds.
   - It fails CLOSED: a doubt deletes nothing.
   - It stays dry-run until the launch switch (`PRUNE_MODE=live` is the Orchestrator's, on Will's yes).
   - Its job card reads its backlog (`stopped_early` with a counted `remaining`, admin-observability.md).
2. **The orphan sweep's cursor,** the same way, so an abandoned upload past the first 20,000 keys is reclaimed.
3. **Dry-run evidence:** run the new prune against the real backup in dry-run and log what it would delete, against an independent count from a listing you read.
4. **Facts in `durability-backups.md`,** in place.

No migration unless the cursor needs a home the job tables lack; if so, write it for the Orchestrator (the Advisor reads it, then it is applied by protocol) under `supabase/migrations/20261003210000_`. The Worker deploy is the Orchestrator's after the merge: write the exact `wrangler deploy` and the version to expect in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code (the Worker's own tests included); red first for the cursor's resume, the caps, every safety rule and the fail-closed doubt; the dry-run log against a real listing; no live delete ever.

## Where I am

Built and green (not yet the whole gate): the Worker's prune rewritten as a pure engine (`workers/backup/src/
prune-run.ts`, primary first, three readings before a delete, a doubt deletes nothing, a budget from the Worker's
limits), its ledger (`prune-ledger.ts`: cursor, the last runs, the hold) in a Durable Object (`prune-state.ts`,
`wrangler.jsonc`), and the orphan sweep's cursor (`src/lib/lifecycle/sweeps/orphans.ts`). Red logs:
`../partyreel-wt/_scratch/backup-prune/red-worker.log` (20 of the new tests against a port of today's prune) and
`red-orphans.log` (12). Next: the dry-run against the real buckets with an independent count, the docs, the gate.

## Questions (a recommended answer each; the Orchestrator relays them)

Each built as recommended; each Will's to overrule. None is a one-way door: the prune ships dry.

1. **What sizes the clamp to the deletions?** Built: a hold. A run whose backlog passes ten times the usual (the
   median of its last eight runs, dry ones included, never under 2,000 media) deletes nothing, reads "Needs a look",
   and goes ahead on the first run six days later unless paused on `/admin/jobs`. Why: a fixed number either throttles
   real churn (the old 500 a week, against about 19,000 a week for one 100 GB plan re-filled three times a month) or
   lets a disaster (rows and objects deleted together, where every existence check agrees) through whole. The other
   real option: every delete waits for a second sighting a run later, volume-blind but keeping every purged byte a
   week longer (PRICING's 43 days become about 50). His: the 10x, the 2,000, the six days, and whether a hold should
   ever release itself (the alternative waits for a person, which needs an `/admin` release control).
2. **Where does the prune remember where it stopped?** Built: a SQLite Durable Object the Worker's own deploy creates
   (`PruneState`), holding the cursor, the last runs and the hold. The other option is `job_runs`, through
   `/api/internal/job-run`, whose start answers no state today: two app files outside this lane, and a cursor saved
   only at a run's end. Recommended: the Durable Object.
3. **Primary first?** Built: a run lists the primary over each backup page's key range and asks the app only about
   keys the primary lacks; the old order sent every age-eligible id every week, the whole live set at scale.
   Recommended: as built.
4. **Weekly still?** Built: weekly (PRICING's 43 days rest on it), a run bounded by its deadline (12 of the cron's 15
   minutes), its subrequest budget and a 30,000-media delete cap. Past what one run reaches, the card reads stopped
   early every week, and a daily cadence is a three-line catalog change. Recommended: weekly now.
5. **A ledger the Worker cannot read?** Built: that run goes dry and saves nothing (a doubt about whether a hold
   stands); one that reads back damaged is repaired to the safe defaults (the head, the floor, no hold) and closes as
   an error. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/durability-backups.md` (owned): "The deletion-aware prune" (three readings, a doubt deletes nothing,
  the hold, the cursor and the budget), Restore (pause the prune first), Cost & scaling (the merge's cost; the orphan
  sweep resumes, the reconcile still restarts).
- `docs/systems/lifecycle-recovery.md` (a `reads` doc, one sentence): the orphan sweep's own line, false since this
  lane, now says it rotates by position. The orphan sweep is this lane's code; its fact lives there.

## Deferred (ROADMAP one-liners, bucket named)

- QA hardening: #38 (the orphan sweep's cursor) is done; #37, the reconcile's, remains, and it can take the prune's
  merge (both buckets listed over one range, no HEAD per object) and ledger.
- Admin portal: when the Worker reports a held prune (`breaker_tripped` on `backup_prune`), `/api/internal/job-run`
  raises a Sentry warning and the operator email the way it raises the dead letters; and an `/admin` release control
  if Will wants a hold to wait for a person.
- Admin portal: the prune's `primary_missing` (keys whose row lives while the primary lost the object, the backup the
  only copy) as a durability alert with a restore path, beside the dead letters.
- The scale line ("the prune and reconcile bucket scans move to a merge-join..."): the prune is the merge-join now;
  only the reconcile's scan is left.
- Launch checkpoint, the `PRUNE_MODE=live` line: the first live run after the test-data reset holds for a week (its
  backlog passes the hold), as designed.

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
