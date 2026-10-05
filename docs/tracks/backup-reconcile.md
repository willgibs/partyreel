---
track: backup-reconcile
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **Q1. A key whose two copies differ.** Recommended and built: said, never overwritten. The run counts it
  (`mismatched`), names each key in Workers Logs, reads Needs a look (`breaker_tripped`) and raises the warning and
  the daily mail: keys are written once, so a difference is a primary rewritten in place or a damaged copy, and only a
  person can say which is good. Alternative: past its lock, copy the primary's bytes over the backup's (what the host
  sees, but a primary damaged in place would then take the good copy with it). There are two today: the 2026-07-03
  EXIF backfill rewrote two originals in event `38290e85…` (primary 2,744,175 and 2,050,568 bytes; the backup's
  2,755,644 and 2,060,125, taken 2026-06-21, past their lock), and the backup's copies still carry the metadata the
  backfill stripped (EXIF, GPS where a photo had it), so restoring either would bring it back. The first deployed run
  reads Needs a look and mails daily until someone deletes those two backup copies (the next run copies the stripped
  originals) or the test-data reset does.
- **Q2. What a stalled pass reads as.** Recommended and built: Overdue keeps its plain meaning, no report in a day and
  a half (a run is bounded now, no page or copy past 11 minutes, no part past 12.5, so it always reports); a run that
  stops early reads Needs a look and mails; one that settles nothing fails; the card says how far the pass has come,
  whether this run ended it and when the last whole pass ended. Alternative: freshness judged by the last whole pass,
  which the jobs query and the missed-run scan would need as a second definition of healthy.
- **Q3. Which young keys count as lone.** Recommended and built: every young key the backup holds and the primary
  lacks is asked of the app (the confirm route's `named`) whatever `RESTORE_MODE` says, since without the row's answer
  a purged item's key and a lost one look alike (the prune, with its own row check, asks nothing with the restore
  off). A confirm-route call per 1,000 such keys a day: today 611 keys, one call (519 ms on my dev server).
- **Q4. A copy no run can finish.** Recommended and built: a multipart copy aborts between parts at 12.5 minutes
  rather than be cut by the platform (a cut run reports nothing); one that began with the whole run ahead of it is
  `too_large` (an error), remembered in the ledger (at most 100) so later passes say it without spending a run on it,
  and copied by hand. Alternative: a multipart copy resumable across runs (Deferred), the real fix if R2 copies run at
  the DR drill's rate (130 MB in about 145 s).
- **Q5. How loud the reconcile is.** Recommended and built: a Sentry warning (`backup_reconcile_unfinished`) on every
  report that stopped early, failed or found copies that differ, and the ops mail at most once a day
  (`reconcile:<day>`, kind `prune_breaker`). Alternative: the mail for failures alone.

## System-doc edits (in place, owned facts only)

- `docs/systems/durability-backups.md`: the prune's lone copies bullet (past the gate only; the reconcile judges the
  younger, each walk settling its own side); a new "The reconcile" (the merge and its compare rule, differing copies
  never overwritten, its stops and cursor, a copy no run finishes remembered, the young lone copies, its doubts, where
  it raises, its card); the restore's askers (a reconcile that found new lone copies; the daily ask's reason restated);
  Cost & scaling's reconcile line rewritten (its cost shape, the live dry run, a copy is one invocation's).
- Proposed for `docs/systems/admin-observability.md` (a `reads`, so not edited), "Backend jobs", the missed-run
  bullet: "... any report carrying the backup's lone copies (the prune's run, the reconcile's or the restore's pass:
  ...), and a backup reconcile that stopped early, failed or found copies that differ (`backup_reconcile_unfinished`
  and the ops mail, at most once a day)".

## Deferred (ROADMAP one-liners, bucket named)

- Now: Durability: a copy past one invocation's reach never completes: the queue's copy and the reconcile's each have
  15 minutes, and the DR drill copied 130 MB in about 145 s (about 1 MB/s; the reconcile now logs each copy's `ms`), so
  a multi-GB video may have no backup; a multipart copy resumable across invocations (its upload id and parts in the
  Durable Object) closes it.
- Later: Durability: a maintenance script that rewrites a stored object in place (the EXIF backfill) refreshes the
  backup's copy past its lock too, or the reconcile reads the difference forever.
- ROADMAP "QA hardening" #37 (the reconcile's merge-join and stored cursor) is this lane's: its line goes.

## Handoff (replaces the chat report)

Logs live in `/Users/gibby/local/ai/partyreel-wt/_scratch/backup-reconcile/` (below: `S/`).

- **Commits, pushed:** the work `65ba60c41` (the Worker's engine and wiring, the app, the tests), `84bbee4c5` (the
  docs, the Worker's README and its test config's note), `c53e93738` (each copy's time in its log line); this manifest
  alone after them. Branch base `cd34cff18`. No sync: launch-prep moved (drive-fixes changed two Drive strings in
  `catalog.ts` and `owed-words.ts`, entries other than mine; records), and `git merge-tree --write-tree HEAD
  origin/launch-prep` exits 0.
- **The app's gate on `84bbee4c5`, each its own exit code:** `pnpm typecheck` 0 (`S/gate/typecheck.log`); `pnpm lint`
  0 (`S/gate/lint.log`); `pnpm test` 1: 12,389 passed and the one known foreign failure, `track-manifests.test.ts >
  drive-fixes.md is well-formed` (its read `../partyreel-wt/_scratch/drive-walk/ledger.txt` resolves only from the
  primary checkout; that manifest is gone from launch-prep already) (`S/gate/test.log`); `zsh scripts/build-lock.sh
  pnpm build` 0 (`S/gate/build.log`); `pnpm lab:smoke --base http://localhost:3131` 0, 167 checks, 0 failing
  (`S/gate/lab-smoke.log`). It holds for the head: `git diff 84bbee4c5 c53e93738 -- src` is empty, and the app's tsc,
  eslint and vitest exclude `workers/`. **The Worker on `c53e93738`:** `npx vitest run` 0 (196 tests, 12 files), `npx
  tsc --noEmit` 0, `npx wrangler deploy --dry-run` 0, 82.17 KiB (`S/gate/worker-test.log`, `worker-typecheck.log`,
  `worker-dryrun.log`).
- **Each new test fails on the old code** (`S/oldcode/`): the reconcile suite against the old algorithm behind the
  same ports, 26 of 32 fail, every ★ among them; the 6 passing are the contract's keys, the etag helper, the ledger
  parser and the race the old code handled too (`reconcile-on-old.log`, `old-reconcile-shim.ts`); the table's 7 new
  tests and the prune's ★ on the old `lone-store.ts` and `prune-run.ts`, all 8 fail, the 59 old ones pass
  (`store-prune-on-old.log`); the app's 8 tests that pin the change (7 new, 1 reshaped) on the base `route.ts`, `catalog.ts`
  and `page.tsx`, all fail (`app-on-old.log`).
- **Measured on fakes** (`reconcile-run.test.ts`, "the reconcile at scale", modeled serially at 270 ms a listing, the
  prune's live figure): 3,419 objects, 8 listings and 10 subrequests, 2.4 s (the old: 715 s and 3,419 HEADs); 100,000
  objects, 212 listings and 214 subrequests of the 100,000 limit, 57.5 s of the 900 s cut, 65 ms of engine CPU (the
  old: 20,923 s and 100,000 HEADs).
- **The live dry run, read-only** (`S/live/dry-run.json`, `dry-run.ts`, 2026-10-05 20:23 UTC): the engine over the
  real buckets, S3 listings only, nothing copied, the table in memory, `named` asked of my dev server (a read-only
  select): 5,862 primary keys against 6,516 backup keys in 14 listings, 16 subrequests, 11.6 s over the internet (854
  ms a listing from here); nothing to copy; 2 copies differ (Q1's pair); 654 keys absent from the primary, 611 young,
  one `named` call, none named by a live row, so no young lone copy. At the old 209 ms an object, 5,862 objects take
  1,225 s: why 2026-10-05's run never closed.
- **Walked in workerd** (`S/workerd/walk.txt`, `old-dev.log`, `new-dev.log`): `wrangler dev --local`, R2 and Durable
  Object simulation only, the app's routes a mock on 127.0.0.1:8799. The base Worker made the old-schema table; the new
  one added `uploaded_ms` in place, copied the missed key, said the differing pair, judged the two young keys and kept
  the named one, and its ask queued a restore pass that read it (dry run); the next run asked for none. Nothing reached
  partyreel.com, the alias or a real bucket.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, and this file; no
  exception.
- **Items:**
  - A listing merge (`workers/backup/src/reconcile-run.ts`, 32 tests): both listings side by side, a thousand keys a
    page, compared by key, size and a single upload's checksum (a multipart etag differs by part layout, R2's docs);
    copies three in flight; never a HEAD an object.
  - It fits and carries on: no page or copy past 11 minutes, no part past 12.5 (aborted, deferred), 95,000
    subrequests with its closing calls reserved, a cursor and its pass in `PruneState` (`reconcile-ledger.ts`, safe
    fallbacks); a copy no run finishes said and remembered; a run with no progress fails.
  - Differing copies said, never overwritten (`mismatched`, `breaker_tripped`); an empty primary beside a full backup,
    or a listing that does not move forward, is a doubt that copies and judges nothing.
  - The young lone copies: asked of `named` a thousand at a time, kept on the table's young side (`lone-store.ts`:
    `uploaded_ms`, a walk's `judged` side, `settle()`'s `added`; the prune's walk settles only the old side now,
    `prune-run.ts`), a restore pass asked when new, the table's whole count reported (`primary_missing`).
  - Wiring (`index.ts`, `prune-state.ts`): listings over the bindings, `backupOne`'s `keepGoing`, its first GET's body
    let go before a multipart copy (left unread, it held a connection the whole copy), the ledger's load and save, the
    fail-open posture; the object's `loadReconcile`, `saveReconcile`, `settleLone`.
  - Raised at its source (`job-run/route.ts`, `reconcile-mail.ts`, tests): a report that stopped early, failed or found
    differing copies raises `backup_reconcile_unfinished` and the ops mail once a day; the reconcile's lone count
    raises as the prune's does.
  - The card (`reconcile-view.ts`, `page.tsx`, their tests): its pass (complete, or in progress since when), its last
    full pass and each thing that waits on a person, in place of the raw counts (a run from before keeps them); the
    lone copies' card reads the reconcile too (`catalog.ts`).
  - Docs: `durability-backups.md` (above), the Worker's README.
- **Assets requested from Will:** none.
- **Board ideas:** the copy past one invocation (Deferred); a `/admin` control for a key whose copies differ
  (refresh the backup's copy past its lock), if differences recur after the test-data reset.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - Migrations, Vercel, Stripe, env: none.
  - Worker `partyreel-backup` (the Orchestrator's deploy, milestone 38): this code, no `wrangler.jsonc` change (no
    var, secret, binding, cron or Durable Object tag: the ledger is a new key in the existing object, the table's
    column is added in place, walked over the old schema in workerd). Either order is safe: an app first reads an old
    report's raw counts and raises an erring one; a Worker first sends counts the old app stores and does not yet read.
- **Calls his to overrule:** Q1 differing copies said, never overwritten; Q2 Overdue stays "no report", a stopped
  pass Needs a look; Q3 every young absent key asked of the app; Q4 a copy no run finishes said and remembered, not
  resumed; Q5 a warning every report, a mail a day.
- **Look at first:** `workers/backup/src/reconcile-run.ts` (the merge and its stops), `lone-store.ts`'s `judged` (the
  two judges' split), and Q1's two keys, which make the first deployed run read Needs a look.
