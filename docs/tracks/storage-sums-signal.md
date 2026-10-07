---
track: storage-sums-signal
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/lifecycle/sweeps/storage-sums
  - src/lib/jobs/purge-sweeps
  - src/lib/lifecycle/sweep-budget
  - src/app/api/cron/purge/
  - src/app/admin/jobs/
  - src/lib/db/queries/storage-sums
  - src/lib/db/mutations/storage-sums
  - supabase/migrations/20261007022000_storage_sums_signal.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20261006180000_upload_sums.sql
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
---

# lp/storage-sums-signal

**Goal.** The storage sums proven every night: a purge sub-sweep paging `storage_sums_drift`, a `storage_sums` job on /admin/jobs that closes ERROR on any drifted host with a Rebuild control, and `remove_my_upload`'s already-removed arm taking her profiles row first; the Advisor's condition for milestone 39.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3137 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**Why now:** upload-sums (merged at `36383265f`, applied live as `20261006215810`) keeps `event_storage_sums` and `host_storage_sums` by one trigger, and the Advisor applied it on a condition that this lane closes before milestone 39 ships: a nightly signal that the sums still equal the walk (`host_storage_walk`, the one definition `storage_sums_drift` holds them to), loud at its source, never a silent mend; and the one deadlock the sums' trigger opened. The ROADMAP's Immediate line (Admin and operations, "Jobs: the storage sums' nightly signal") is the spec:

- **The sweep:** a sub-sweep on the purge cron (`src/lib/lifecycle/sweeps/storage-sums.ts`, registered beside its siblings in `src/lib/jobs/purge-sweeps.ts`) paging `storage_sums_drift(after, limit)` under its deadline share (`sweep-budget.ts`), resumable across nights when it stops early, never a mend.
- **The job:** a `storage_sums` entry in `src/app/admin/jobs/catalog.ts` whose run closes ERROR on any drifted host, the hosts and both figures in its `counts`; the ops mail and Sentry as the other jobs' failures already are (`docs/systems/admin-observability.md`).
- **The control:** a Rebuild on its card (AAL2, the drifted host named, a confirm that says what it rewrites) calling `rebuild_storage_sums(host)`, logged in `admin_actions` like the portal's other operator acts.
- **The deadlock:** `remove_my_upload`'s already-removed arm takes her profiles row first, the order the sums' trigger takes it, so a Remove racing a Restore or a Let back in can no longer deadlock (upload-sums' Handoff and the migration's header say how it was found). The host-moments-wiring lane this wave changes `let_back_in` (Let in admits a declined newcomer): coordinate the lock order through your Handoff (the Orchestrator reads both migrations together with the Advisor).

**The migration, `supabase/migrations/20261007022000_storage_sums_signal.sql`:** start from `public.remove_my_upload` (and `remove_my_upload_by_session` if its arm shares the order)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**Nearby lanes this wave (never edit their paths):** the size list and the over-plan banner (host-moments-wiring), the album and the upload stack (album-moments-wiring). Cost: name the sweep's queries per night at today's hosts and at 10,000.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** the purge cron's route called on your port with `CRON_SECRET` (never production's): the sweep's row on /admin/jobs reading clean; a drift made inside a rolled-back proof only (never on live data) shown by the run's counts in a test; the Rebuild control's refusal without AAL2 (the portal's operator signs in only through her own second factor: list that walk for the desk).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1 · `admin_actions` does not exist** (admin-observability.md: "No operator audit table exists"; ROADMAP's Admin
  line calls it a proposal). Recommended, built: the Rebuild is recorded as the portal's other operator acts are (one
  Sentry line naming who, whom and both figures, `operator_rebuilt_storage_sums`) plus a closed manual run of the
  check on its own card (whom, before and after, whether she reads at parity again); the audit table stays the
  ROADMAP's Admin line.
- **Q2 · The sums' trigger opened a second deadlock of the same class:** `disown_guest_rows_by_email` re-marks a row
  the host binned (its media rows, then her row in the trigger) against `restore_media` (her row, then the media).
  One side's 40P01 and a retry, in the instant an address's owner releases a typed upload while its host restores it.
  Recommended, nothing built here: a follow-up lane, the rule "a writer holding her profiles row never waits on a
  media row" for the restores themselves (`restore_media` takes its row NOWAIT, `let_back_in` SKIP LOCKED, the latter
  from let_in's three-argument body, 20261007020000, never 20261003220000's, or `p_let_in` is dropped), which closes
  this and the older takedown and Delete-permanently races at once; disown's own multi-host statement cannot take her
  rows first without opening others. A Deferred line below.
- **Q3 · A pass longer than a night** reads Needs a look each night it stops early (the reconcile's convention). Today
  a pass is one call (3 hosts, ~30 ms); past about 2,000 hosts it spans nights. Recommended: keep the convention now;
  a Deferred line for scale (its own share or cron, or only the hosts whose sums moved plus a weekly whole pass).

## System-doc edits (in place, owned facts only)

- `lifecycle-recovery.md`, the purge cron: one bullet, the `storage_sums` sweep (last of the budgeted, its pass, the
  re-check of named hosts, never a mend, its cost).
- `admin-observability.md`, backend jobs: the sub-sweep line gains the per-sweep `counts` (`findings`); one bullet, the
  Rebuild (AAL2, a host the record names, checked at once, a closed manual run, one Sentry line).
- `database-security.md`, the lock order: the trigger's one deadlock closed (her row first, the media row NOWAIT, and
  why her row first alone would not do), and the one of the class that stands (Q2).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate, Admin and operations (replaces "Jobs: the storage sums' nightly signal", done here): "Storage sums: the
  restores take their rows without waiting under her lock (`restore_media` NOWAIT, `let_back_in` SKIP LOCKED from
  let_in's three-argument body, 20261007020000), closing `disown_guest_rows_by_email`'s race with a Restore and the
  older takedown and Delete-permanently ones (storage-sums-signal's Q2)."
- Later, Admin and operations: "Jobs: the storage sums' check at scale: past ~2,000 hosts a pass outlasts a night and
  reads Needs a look each night; give it a share or a cron of its own, or check only the hosts whose sums moved plus a
  weekly whole pass (storage-sums-signal's Q3)."

## Handoff (replaces the chat report)

- **Commits** (pushed on `lp/storage-sums-signal`): work `2599932c1`; a WIP record `8fb0df79d` (paused for the
  account's window); sync `a5374e66f` (launch-prep `3dde58011` merged, no conflict: it brought let_in, reshoots and
  event-header-wiring-2, none in the lane's paths); after the sync `5f221af01` (the migration's header and one doc line
  name let_in's three-argument `let_back_in`, its races re-run) and `3dc42dbcc` (the red-team's one fix); this handoff
  on top. launch-prep has moved since by two record commits (`943da5387`, `3e3aff085`), no code: no second sync.
- **Gates on the synced tree, `3dc42dbcc`**, each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0,
  `pnpm test` 0 (1,074 files, 13,527 passed; no env export after `e949f5501`), `zsh scripts/build-lock.sh pnpm build`
  0, `pnpm lab:smoke --base http://localhost:3137` 0 (155 checks, 0 failing). (The work commit `2599932c1` passed the
  same five before the sync: 13,382 tests with the env dummies exported, 159 checks.)
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths, this file, the three system docs
  (Record subtractively) and THREE EXCEPTIONS, each a registration the gate requires: `src/lib/jobs/sweep-tally.ts`
  (one entry in `SUB_SWEEP_JOB_BY_NAME`, and "six" to "seven" in its comment: the registry the brief placed in
  purge-sweeps.ts lives there, and `subSweepParityGap` fails a catalogued sub-sweep it does not map),
  `src/lib/jobs/sweep-tally.test.ts` (its pinned list of promoted sweeps), `src/lib/email/send-kinds.ts` (one kind,
  `storage_sums`, in `OPERATOR_KINDS`: `send-kinds.test.ts` holds every send's kind to a list).
- **The migration** `supabase/migrations/20261007022000_storage_sums_signal.sql`, NOT applied, md5
  `44f380541b96b77c7ab72381b28d7a90`: `remove_my_upload` (create or replace, same signature, answers, grants) whose
  sneaky-block withdrawal takes her host's profiles row first, then its media row NOWAIT, only for a row still the
  block's and not withdrawn; `storage_sums_enabled` seeded ON. Its header carries the drift hash (live still
  `a77075737be38cc26fe61aa1e870e4db`), the pre-flight, the apply protocol; no type moves. Every caller of
  `remove_my_upload` is `removeMyUpload` (`src/lib/db/mutations/my-uploads.ts`): `removeMyUploadAction` (the profile's
  uploads gallery), `removeMyUploadGuestAction` (the album's Delete, the upload tracker, the camera's take-back) and
  account deletion's take-back (`mutations/account.ts`, which counts what is left and asks again); each words an error
  as a retry, so the one new answer (55P03, a row another writer holds that instant) needs no change in any build.
- **Its proof:** live, rolled back, RED as the header says (steps 5 and 6 false, the rest true) and GREEN 8 of 8,
  then GREEN 8 of 8 again after let_in was applied (20261007042038); after each, the live body unchanged, no flag row,
  no fixture. On the stand-in (Postgres 17, the scripts in the lane's scratch folder): each race forced, BEFORE 40P01
  against Restore and Let back in, ROW FIRST ALONE 40P01 against Delete permanently and the purge, AFTER none; the pairs
  stressed (30 bursts each) BEFORE 81 and 73 deadlocks, ROW FIRST ALONE 0/20/56/58, AFTER 0 in every pair; against
  let_in's three-argument body (restore arm byte for byte 20261003220000's) BEFORE 72 and 63 (restoring; restoring and
  letting in), AFTER 0 and 0; `storage_sums_drift` empty after every one.
- **The sweep** (`src/lib/lifecycle/sweeps/storage-sums.ts`, its record `storage-sums-state.ts`, its mail
  `storage-sums-mail.ts`): last of the budgeted sweeps (`BUDGETED_SWEEPS` 11), `storage_sums_drift` 50 hosts a call,
  the hosts the last run named checked again first (`uuidBefore`: the call that starts just before her checks her
  alone, and its `next_after` names whom it checked), resumable at its cursor, `rows_failed` = the drifted hosts (the
  run ERROR, the parent's too: "Rows failed in: storage_sums."), `findings` kept whole on its own row through the
  runner's new per-sweep `counts` (`SweepRunOptions`), one Sentry error, the ops mail once a day (kind `storage_sums`).
- **The card and the Rebuild** (`src/app/admin/jobs/`): its pass, its last full pass, each drifted host by her address
  linked to her account with what disagrees and a Rebuild (`storage-sums-control.tsx`, the portal's one confirmation,
  reversible); `rebuildStorageSumsAction`: `requireAdminAction` (AAL2) first, a host the check's own record names (read
  on the server), `rebuild_storage_sums`, the check of her at once, a closed manual run of the check (`rebuildOutcome`),
  one Sentry line (`operator_rebuilt_storage_sums`: who, whom, both figures); every failure says what happened.
- **The walk** (local only): the purge cron on 3137 with a local `CRON_SECRET` (never production's), refusing four
  malformed bearers (401) and a POST (405), then run once as a manual run at 2026-10-07 03:59Z: its `storage_sums` row
  `ok` (3 hosts checked, 0 drifted, a whole pass, 215 ms), the parent `ok` (9.8 s); `job_runs` on the live database
  reads both. That run did the night's own work just ahead of the nightly cron's hour: 9 removed items purged (977,364
  bytes, R2 first), one album developed (6 items), 9 album-log tombstones and 215 limiter rows pruned; no account
  deletion was pending (read first).
  The drift made by hand: only inside the rolled-back proof and the stand-in, never live; its run's counts in
  `storage-sums.test.ts` and the card's in `page.test.tsx`. The Rebuild's refusal without AAL2: `actions.test.ts`.
- **Red-team** (the card rendered whole on stubbed reads with the app's real CSS, at 375 and 1440, light and dark,
  shots in the lane's scratch folder): it fits a phone; one fix, `3dc42dbcc` (a drifted host's date broke mid-number
  under the name's `break-all`: the name alone wraps anywhere now). Each Rebuild is named "Rebuild the storage sums
  of <name>" (its visible word first), the list a labelled region, Tab reaches each name's link then its Rebuild; no
  motion added. Error paths forced in tests: a forged id, a host the record does not name, the rebuild failing, the
  check after it failing or still reading a drift, the record unreadable (No reading on the card, a fresh pass with a
  warning in the cron), names unreadable (ids), an answer the code does not know (the run fails), the mail failing
  (its own Sentry event, the row kept).
- **Not driven, for the desk** (the portal's operator signs in only through her own second factor): /admin/jobs on the
  admin host after the first nightly run of a build carrying this lane: the Storage sums card Healthy, "Complete: N
  hosts checked, every one's sums the walk", its last full pass; its switch paused and resumed once; at 375 and 1440,
  light and dark, Tab with the halo and a screen reader across the card. A Rebuild can only be walked with a drifted
  host, which never exists live but by a bug.
- **Cost, queries a night:** today (3 hosts): one `storage_sums_drift` call (~30 ms live), one read of the check's
  record, the runner's shared flag read and two heartbeat writes. At 10,000 profiles: a pass is 200 calls of 50; a host
  costs two walks of her items, ~2.5 µs an item warm (11 ms for 4,330, measured live), so ~25 s of SQL a pass at a
  thousand items a profile, plus one call per named host (at most 25) and a count of what is left when it stops; it
  runs last and takes what the 42 s window leaves, so such a pass spans nights (Q3).
- Test data left: none. The stand-in cluster is stopped and lives in the lane's scratch folder.
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the one migration above (apply in either order with
  this build: an unseeded switch reads ON, and the sweep and the Rebuild call only live functions); no env, Worker,
  Vercel or Stripe change.
- **Calls his to overrule:** the arm takes the media row NOWAIT under her row, beyond "her row first" (her row first
  alone turns the cycle round: the pre-flight's middle column); a drift reds the purge's card too, as every
  sub-sweep's failed rows do; the Rebuild records itself as a closed manual run of the check, so the card and the bell
  follow the fix at once rather than the next night; the card names a host by her address, the mail and Sentry by id
  only; the read-only check keeps a switch like every promoted sweep (paused reads Paused, never Healthy); no typed
  confirmation (the sums are derived, made again from her items); Q1 to Q3 as recommended.
- **Look at first:** the arm's three statements in the migration (the candidate read, her row, the media row NOWAIT)
  and the pre-flight table; then `rebuildOutcome` (who leaves the list, and what carries); then the route's last
  `runBudgeted` with its `counts` builder.
