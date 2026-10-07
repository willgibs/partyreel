---
track: storage-sums-signal
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  Recommended, nothing built here: a follow-up after host-moments-wiring's `let_back_in` lands, the rule "a writer
  holding her profiles row never waits on a media row" for the restores themselves (`restore_media` takes its row
  NOWAIT, `let_back_in` SKIP LOCKED), which closes this and the older takedown and Delete-permanently races at once;
  disown's own multi-host statement cannot take her rows first without opening others. A Deferred line below.
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
  restores take their rows without waiting under her lock (`restore_media` NOWAIT, `let_back_in` SKIP LOCKED), closing
  `disown_guest_rows_by_email`'s race with a Restore and the older takedown and Delete-permanently ones
  (storage-sums-signal's Q2), after host-moments-wiring's `let_back_in`."
- Later, Admin and operations: "Jobs: the storage sums' check at scale: past ~2,000 hosts a pass outlasts a night and
  reads Needs a look each night; give it a share or a cron of its own, or check only the hosts whose sums moved plus a
  weekly whole pass (storage-sums-signal's Q3)."

## Handoff (replaces the chat report)

- **PAUSED (2026-10-07 ~04:05Z, the Orchestrator's pacing request), where it stands:** work commit `2599932c1`
  pushed; on it typecheck 0, lint 0, test 0 (1,065 files, 13,382; run with the component setup's env dummies,
  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, per the Orchestrator), build 0, lab:smoke 0
  (159 checks) on 3137; the walk done (the purge cron on 3137 with a local CRON_SECRET, manual, 03:59Z: the
  `storage_sums` row ok, 3 hosts at parity); migration RED/GREEN run live and rolled back. LEFT: the card's look at
  375 and 1440, light and dark (its markup dumped with the real CSS, one shot of four taken), then this Handoff
  whole, the migration's final md5 and the handoff commit. launch-prep moved (event-header-wiring-2) but touched none
  of the lane's paths or reads: no sync.
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
