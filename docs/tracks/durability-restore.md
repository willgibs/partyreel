---
track: durability-restore
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/lib/lifecycle/reclaim.ts
  - src/lib/email/templates.ts
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

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **Q1. How Restore now reaches a Cloudflare job.** Recommended and built: a door on the backup Worker itself,
  `POST /restore` on its workers.dev origin with the internal-jobs bearer the Worker already holds, which asks the
  prune's Durable Object for a pass at once. A true run-now with no new secret, and strictly smaller than the confirm
  route the same bearer already guards. It needs one app var, `BACKUP_WORKER_URL`; until it is set the button waits,
  disabled, and the card says why. The other road drawn: a stamp the next daily pass honours (no var, but up to a day
  away, so no run-now).
- **Q2. When a pass runs.** Recommended and built: daily (the reconcile's cron, asked first and apart from it), after
  each prune (it may have just found lone copies), and on Restore now. A pass is the Durable Object's alarm, with a
  15-minute budget of its own; a failed copy is tried the next day, not the next week; an idle pass is two heartbeat
  calls. Alternative: with the weekly prune alone.
- **Q3. What counts as a lone copy.** Recommended and built: with the restore on or in dry run, only keys a live row
  still names. A phone copy dropped at the upload's complete for being over its cap (the backup had already copied
  it) is a key its row let go of; it now reads `lone_unnamed`, said in the prune's note, never counted or copied
  back (restored, no sweep would ever reclaim it). With the restore off the prune asks nothing and counts every key,
  as before.
- **Q4. Objects past one write's reach.** Recommended and built: never restored on their own. R2 takes at most 5 GiB
  less 5 MiB in one conditional put and a multipart upload's complete takes no condition, so "never over an object
  that is there" cannot hold for a bigger one (uploads go to 10 GB): such a key stays held, said on the card and in
  the mail, for a copy by hand. Alternative: a multipart restore guarded by a HEAD before its create and its complete
  (a moment in which another writer's object, the same bytes, could be overwritten).
- **Q5. When RESTORE_MODE goes on.** Recommended: once the first dry run after the deploy reads right, not at launch.
  It writes only objects a live row names, into places nothing is stored, so it is no launch switch; today the prune
  finds none (its 2026-10-04 run: 41 absent keys, every one a gone row's).
- **Q6. How loud standing lone copies are.** Recommended and built: a Sentry warning on every report that carries a
  count (the prune's weekly run, the restore's daily pass) and the ops mail at most once a day while they stand (a
  host's photo with one copy left). Alternative: weekly, with the prune alone.
- **Q7. No migration.** Recommended and built: the lone copies live in the Worker's own Durable Object (it cannot
  reach the database), and the restore's switch row (`backup_restore_enabled`) is unseeded, which reads as on, while
  its toggle upserts it (`setJobEnabled`'s own rule). Every other job seeds its row; a seed is a one-line insert if
  Will wants it there from day one.

## System-doc edits (in place, owned facts only)

- `docs/systems/durability-backups.md`: "Open this before you" (the restore writes the backup into the primary); the
  Worker's jobs' postures (the restore fails closed, like the prune); the lone copies bullet rewritten in place (only
  keys a live row names, the lone copies' table carrying them across a pass, raised where the report lands; the old
  "nothing copies one back" and "each range in its turn" lines gone); a new "The restore" (its three guards, its mode,
  a pass as `PruneState`'s alarm and who asks for one, Restore now's door, every outcome said); Restore (the backup
  restore beside the whole-bucket copy); Cost & scaling (the restore's shape).
- `docs/systems/admin-observability.md`: "Backend jobs", the missed-run paragraph (lone copies raise at
  `/api/internal/job-run`; the "card alone so far (ROADMAP)" line gone) and the internal-jobs paragraph (Restore now
  is the one start the app has, through the Worker's door). The proxy-matcher paragraph crumbs-81 edited is untouched.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Durability: the reconcile's cursor is due: its 2026-10-04 run took 715 s over 3,419 objects (a HEAD each) and
  2026-10-05's never closed (the platform cuts a cron at 15 minutes), so its card already reads Overdue; a
  primary-first listing merge like the prune's (two listings a thousand keys) would also drop the HEAD per object.
- Now: Durability: lone copies younger than the prune's 36-day gate go unseen: the prune judges absent keys past the
  gate only, so a primary object lost in its first five weeks waits until then to be counted and restored.

## Handoff (replaces the chat report)

Logs and the local walk live in `/Users/gibby/local/ai/partyreel-wt/_scratch/durability-restore/` (below: `S/`).

- **Commits, pushed:** the work `e3070d0d6` (Worker, app, tests) and `3d4696626` (docs, the Worker's README and
  `.gitignore`, one wording); this manifest alone after them. No sync: launch-prep moved (crumbs-81, kit, records),
  but no read of mine; crumbs-81's edit to `admin-observability.md` is a different paragraph, and
  `git merge-tree --write-tree HEAD origin/launch-prep` exits 0 (clean).
- **Gates on `3d4696626`, each its own exit code:** `pnpm typecheck` 0 (`S/gate-typecheck.log`); `pnpm lint` 0
  (`S/gate-lint.log`); `pnpm test` 1: 12,279 passed and the one known, pre-existing failure,
  `src/lib/track-manifests.test.ts > drive-fixes.md is well-formed` (that manifest's `reads` resolve only from the
  primary checkout; the Orchestrator's note; not my file) (`S/gate-test.log`); `zsh scripts/build-lock.sh pnpm build`
  0 (`S/gate-build.log`); `pnpm lab:smoke --base http://localhost:3133` 0, 209 checks, 0 failing (`S/lab-smoke.log`,
  run on `src/` identical to `3d4696626`: `git diff e3070d0d6 3d4696626 -- src` is empty). The Worker (not in the app
  gate): `npx tsc --noEmit` 0, `npx vitest run` 0 (156 tests, 11 files), `wrangler deploy --dry-run` 0
  (`S/worker-typecheck.log`, `S/worker-test.log`, `S/worker-dryrun.log`).
- **Verified, local first, reads only on anything real:** the confirm route's named answer against real rows on the
  lane's dev server (`S/named-check.log`: exactly the keys rows hold; never the dropped phone copy, a cross-event key,
  a gone row's or a preservation key; 401 without the bearer, 400 on malformed; the prune's own shape unchanged). The
  Worker in workerd under `wrangler dev`, local R2 and Durable Object simulation only (`S/harness/walk.txt`, `run.log`,
  `mock-app-on.log`, `mock-app-dry.log`): R2's `If-None-Match: *` stored once and refused the second; the door 401,
  401, 405, 404, and 409 with the restore off; a pass started by the door restored 2 keys with their content types,
  left the present one untouched, dropped the 2 no row names, reported ok with `primary_missing` 0; a dry run copied
  nothing and kept the named key held. No request reached the alias, partyreel.com or either real bucket.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under an `owns` prefix or this file,
  but two exceptions: `src/lib/env.ts` (+4 lines, `BACKUP_WORKER_URL`: env.ts is the one home of every env read) and
  `.env.example` (+2 lines: `env-example-parity.test.ts` refuses an env.ts var the template never declares). Two
  reads added to the frontmatter: `src/lib/lifecycle/reclaim.ts` (`MEDIA_KEY_COLUMNS`, `mediaKeysOf`) and
  `src/lib/email/templates.ts` (`composeMail`).
- **Items:**
  - Loud at its source: `/api/internal/job-run` raises any report's `primary_missing` (the prune's run or the
    restore's pass, the catalog's reading names both) as the `backup_primary_missing` Sentry warning, every report,
    and the ops mail once a day (`job-run/lone-copies-mail.ts`; kind `prune_breaker`, dedupe `lone:<day>`); a failed
    mail never costs the row (`job-run/route.test.ts`, "the backup's lone copies raise where their report lands").
  - Counted across a pass: the lone copies' table, SQL in `PruneState` (`lone-store.ts`); a run settles its range into
    it and reports the table's whole count (`lone-store.test.ts` on Node's SQLite; `prune-run.test.ts`, "★ reads the
    whole backup's lone copies after every run of a pass", which fails on the old code: run two read 0).
  - Only keys a live row names: the confirm route's second question, `loneKeys` → `named` by `mediaKeysOf`
    (`backup-prune/route.ts` + 5 tests); the prune asks it in dry run and on (`lone_unnamed`, said in its note).
  - Restored on their own (`restore-run.ts` + 17 tests): never a key no row names, never over an object that is there
    (a HEAD, then the put conditional on `If-None-Match: *`), never past 4.99 GB by halves, `RESTORE_MODE` off,
    dryrun or on (wrangler.jsonc ships `dryrun`), each key's outcome logged with its key; failed copies held for the
    next pass, too large or gone from the backup too close the pass as an error.
  - A pass is `PruneState`'s alarm (`prune-state.ts`, `restore-schedule.ts` + tests), asked by the daily cron (first,
    apart from the reconcile), each prune's end and the door; never two at once, never a request lost; its own
    heartbeat `backup_restore` (`restore-pass.ts` + 8 tests: fails closed on an unreachable app, honours its switch,
    closes `skipped` with the count when off).
  - Restore now: the Worker's one door (`restore-door.ts` + tests) and the AAL2 action (`actions.ts`
    `restoreNowAction`, `restore-now.ts`; `actions.test.ts`), every answer in words, a refusing or unreachable Worker
    a Sentry event, the restore off a state.
  - The card: the `backup_restore` job (catalog; its own switch; daily), the lone copies' reading taking the
    restore's pass beside the prune's, freshest first (`catalog.test.ts`), the restore's card saying its mode, what
    its last pass copied and what it could not, each why (`restore-view.ts`), and Restore now, disabled and said when
    unwired (`page.test.tsx`, `restore-control.test.tsx`); the lone copies card's remedy is the restore now.
  - Docs (above) and the Worker's README; `workers/backup/.gitignore` gains `.dev.vars`, where `wrangler dev` reads
    the secret the README tells you to put there.
- **Assets requested from Will:** none.
- **Board ideas:** the backup reconcile is failing now, outside this lane: `job_runs` shows 2026-10-04's run at
  715,362 ms over 3,419 objects and 2026-10-05 05:00's still `running` at 19:04 UTC (cut off at 15 minutes), its last
  finished run past a day and a half, so its card already reads Overdue (the Deferred line). This lane asks for the
  daily restore before the reconcile starts, so the restore does not ride on it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - Migrations: none (Q7).
  - Worker `partyreel-backup` (the Orchestrator's deploy): the code at `3d4696626`; `wrangler.jsonc` adds
    `"RESTORE_MODE": "dryrun"` and an explicit `"workers_dev": true` (the door's origin). No new secret (the door checks
    `PRUNE_API_SECRET`), no new Durable Object migration tag (the table and the alarm live in the existing class), no
    new cron. Either deploy order is safe: an app without the catalog entry refuses the restore's heartbeat (400) and
    the pass copies nothing; an older Worker sends only the prune's own confirm shape.
  - Vercel env, NON-sensitive: `BACKUP_WORKER_URL` = the Worker's workers.dev origin (by the export Worker's,
    `https://partyreel-backup.partyreel-team.workers.dev`; confirm after the deploy) on `partyreel-admin`, where
    `/admin/jobs` serves, and on `partyreel` for parity; `.env.local` the same.
- **Calls his to overrule:** Q1 the Worker's door for Restore now (one app var); Q2 a pass daily, after each prune and
  on press; Q3 only keys a live row names count as lone copies; Q4 nothing past 4.99 GB restored on its own; Q5
  RESTORE_MODE on after the first good dry run, not at launch; Q6 a mail a day while lone copies stand; Q7 no
  migration, the switch row unseeded.
- **Look at first:** the reconcile (Board ideas: it is failing now); then `workers/backup/src/restore-run.ts` (the
  three guards), `restore-door.ts` (the door) and `src/app/api/internal/backup-prune/route.ts` (`answerNamed`).
