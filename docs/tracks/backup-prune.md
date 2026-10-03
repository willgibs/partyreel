---
track: backup-prune
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "015ff8e6"            # the launch-prep SHA the branch was cut from
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

- **Commits** (pushed to `origin/lp/backup-prune`): `e32fe34a` (the prune's engine, ledger and Durable Object; the
  orphan sweep's cursor), `48fcf5e1` (resume right before the first unfinished item; the docs; more doubts pinned),
  `921a2135` (the queue copies `events/` only, in code), then this manifest. No sync commit: `launch-prep` moved by
  records only (`881ab2d5`, `7cf4045c`, `e708685d`).
- **Gates on `921a2135`**, each on its own exit code (logs `../partyreel-wt/_scratch/backup-prune/gate-final/` and
  `gate/`): typecheck 0, lint 0, test 0 (868 files, 10,348 tests), `build-lock` build 0, `lab:smoke --base
  http://localhost:3132` 0 (148 checks, 0 failing; no board, so no `lab:demo`); the Worker's own: `npm run typecheck` 0,
  `npm test` 0 (6 files, 86 tests), `npm run dry-run` 0 (the bindings list `env.PRUNE_STATE (PruneState) Durable
  Object`).
- **Red first**: `_scratch/backup-prune/red-worker.log` (20 of the engine's new tests fail on a faithful port of
  today's prune, kept at `_scratch/backup-prune/legacy-prune-run.ts`: the cursor, the caps, the primary-first order,
  the hold, the doubts) and `red-orphans.log` (12 fail on today's sweep: it never resumes).
- **The dry run on the real backup** (`_scratch/backup-prune/evidence.txt`, `real-run.jsonl`,
  `independent-count.json`, `harness/`): the Worker's own engine over R2's S3 API (list and HEAD only, a "delete" that
  records and never sends), the real confirm route on this lane's dev server. Dry: "41 keys of 31 items would go",
  3,359 objects scanned, 51 subrequests, the app asked about the 31 only. The same backlog drained in steps of five,
  each run from the last one's ledger: 7 runs, every cursor past the last, the seventh completing the pass. An
  independent count (its own listing with continuation tokens, its own key pattern, rows from PostgREST): 41 keys of
  31 media, 67,268,095 bytes; recorded set equals expected set, 0 extra, 0 missing.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned `workers/backup/` (12 files),
  `src/lib/lifecycle/sweeps/orphans.ts` and its test, `docs/systems/durability-backups.md`, this manifest;
  `docs/systems/lifecycle-recovery.md` under System-doc edits. Exceptions: `src/lib/r2/delete.ts` (`listR2Objects`
  gains `startAfter`, one parameter and one field: the orphan sweep resumes through the bucket's one list path, and an
  S3 continuation token is opaque and unpromised across nights) and `src/lib/jobs/sweep-tally.ts` (one comment line
  whose stated reason, "the orphan sweep starts again from the top", this lane made false).
- **The items:**
  - The prune is a pure engine (`workers/backup/src/prune-run.ts`): primary first (the primary listed over each
    backup page's range; the app asked only about keys the primary lacks), a HEAD right before each delete, deletes
    once at the end, so any doubt (confirm down or misshapen, the breaker, an id not asked about, a listing that does
    not advance or comes back empty but unfinished) deletes nothing; a failed HEAD keeps its item.
  - It keeps up: no count caps the scan; a run walks from the ledger's cursor until the end of the listing or its
    deadline (12 min), subrequest budget (95,000 under `limits.subrequests` 100,000) or delete cap (30,000 media)
    stops it, reading attention with a counted `remaining`; a cut run resumes right before the first item it left.
  - The hold (`prune-ledger.ts`) is the clamp sized to the deletions: past ten times the median of the last eight
    runs (never under 2,000 media), a live run deletes nothing and goes ahead six days later unless paused.
  - The ledger lives in a SQLite Durable Object (`prune-state.ts`; `wrangler.jsonc` binding and migration `v1`); a
    store it cannot read makes the run dry and saves nothing, a damaged one is repaired to the safe defaults.
  - New counts on the card: `remaining`, `deleted` or `would_delete_keys`, `gone_media`, `scanned`, `absent_from_primary`,
    `primary_missing` (rows that live while the primary lost the object: the backup alone holds them),
    `kept_on_recheck`, `checks_failed`, `pass_complete`, `subrequests`; `stopped_early` and `breaker_tripped` flag it.
  - The orphan sweep resumes: its tally hands back `resume_after` (the last key it listed; null at the end), stored
    whole on the purge run's row under `orphans`, read back by the sweep itself (`readOrphanCursor`, which looks past a
    night it threw or was paused); a breaker trip keeps the cursor where the run began.
  - The queue consumer skips any key outside `events/` in code (`isBackedUpKey`), not only by the subscription.
- **`staging/` (the Orchestrator's note):** no listing is widened. The prune's backup and primary listings, its probe
  and the orphan sweep all pass `prefix: "events/"` on every call, both cursors are refused unless they start with
  `events/` (a prefix bounds any `startAfter` anyway), and only keys parsed as `events/<event>/<kind>/<uuid>/<file>`
  are ever HEADed or deleted. `921a2135` closes the one place the confinement was infrastructure only: the queue.
- **Assets requested from Will:** none.
- **Board ideas:**
  - The orphan sweep at scale: upload-meter's presign record could name each presigned key, so abandoned uploads are
    found directly (presigns a day old with no row) and the bucket walk becomes only the backstop.
  - The reconcile on the prune's merge: both buckets listed over one range finds every uncopied object with no HEAD
    per object, so it could cover the whole primary nightly (it stops at 5,000 from the head today: ROADMAP #37).
- **Proposed Worker change** (the Orchestrator's, after the merge; no secret, no Vercel env, no migration):
  `cd workers/backup && npm ci && npm run typecheck && npm test && npx wrangler whoami && npx wrangler deploy`.
  Expect the bindings table to add `env.PRUNE_STATE (PruneState) Durable Object` beside the two buckets, two queues and
  the two vars (`PRUNE_MODE` still `dryrun`), the triggers `0 5 * * *` and `0 6 * * 1`, and the `v1` migration
  creating the class (once). The first Monday run then reports on `/admin/jobs`: about "Dry run, deleted nothing: 41
  keys of 31 items would go. The pass reached the end of the backup." (the set drifts as items age past 36 days).
- **Record edits for the Orchestrator** (PRICING.md is this lane's `reads`): once merged, its atlas cites the old caps
  at lines 177-178 (the backup), 200 and 203 (the orphan sweep's 20 pages from the head; its cursor now exists), 276
  (the jobs) and 359 (each vendor's guard: "500 pruned a run"); the precondition at 365 ("a cursor and caps sized to the
  deletions") is met in code, `PRUNE_MODE=live` still the launch's. The Deferred lines above are the ROADMAP's.
- **Calls his to overrule:** the five Questions; and three numbers set from the Worker's limits: the delete cap
  (30,000 media a run), the deadline (12 of 15 minutes) and the subrequest limit raised to 100,000.
- **Look at first:** `workers/backup/src/prune-run.ts` with `prune-run.test.ts` (each safety rule a `describe`), then
  `prune-ledger.ts` (the hold), then `_scratch/backup-prune/evidence.txt`.
