---
track: crumbs-37
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3925f9f0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/events/album-sync.ts
  - src/lib/events/album-sync.test.ts
  - src/lib/db/queries/album-state.ts
  - src/lib/album/testing/album-sim.ts
  - src/lib/db/album-version.test.ts
  - src/lib/db/queries/album-guest.test.ts
  - src/app/api/album/guest/sync/route.test.ts
  - src/app/api/album/host/[eventId]/sync/route.test.ts
  - src/app/api/cron/purge/
  - src/lib/jobs/sweep-tally.ts
  - src/lib/jobs/sweep-tally.test.ts
  - src/lib/jobs/purge-sweeps.ts
  - src/app/admin/jobs/catalog.ts
  - src/app/admin/jobs/catalog.test.ts
  - src/lib/lifecycle/sweeps/album-log.ts
  - src/lib/lifecycle/sweeps/album-log.test.ts
  - src/lib/lifecycle/sweeps/over-capacity.ts
  - src/lib/lifecycle/sweeps/over-capacity.test.ts
  - src/lib/lifecycle/over-cap.ts
  - src/lib/media/auto-reduce.ts
  - src/lib/media/auto-reduce.test.ts
  - src/lib/lifecycle/recently-deleted.ts
  - src/lib/lifecycle/sweeps/removed-media.ts
  - src/app/admin/albums/[eventId]/page.tsx
  - src/app/admin/albums/[eventId]/page.test.tsx
  - src/lib/moderation/album-pages.ts
  - src/lib/moderation/album-pages.test.ts
  - src/app/admin/albums/actions.ts
  - src/lib/db/queries/moderation.ts
  - src/lib/db/queries/moderation.test.ts
  - src/lib/db/upkeep-migrations.test.ts
  - supabase/migrations/20261001150000_album_log_prune.sql
  - supabase/migrations/20261001151000_removed_media_index.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
---

# lp/crumbs-37

**Goal.** Four ROADMAP lines on scale and the data's own upkeep: album_changes' tombstones pruned under a per-event watermark by a job with its /admin health signal, a partial index that keeps the nightly host discovery an index scan, the admin album drill-in paged, and the over-capacity reduce paged inside one account.

## The brief

Four lines the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code. The data architecture is the Orchestrator's to optimize (Will, 2026-09-29), pre-launch above all, so a better shape is welcome where it serves:

- **`album_changes`' tombstones** (from `album-pages`): "one row per item ever, a purged item's included". Prune them with a per-event watermark that answers resync below it, as a job with its `/admin` health signal (CLAUDE.md: a backend job ships its management and health signal in the same change; zero silent failures). ★ The album's sync is the product's live core (`lib/events/album-sync.ts`, `guest-flow.md`): a client asking for changes below the watermark must get a full, correct resync, never a silent gap, and the first paint's served plan must not move. Prove a client parked below the watermark comes back whole.
- **`standby_hosts`' scan** (performance): it "scans every removed row platform-wide on each page"; "past about a million media rows a partial index on removed media (`where status = 'removed'`) keeps the nightly host discovery an index scan". Prove the plan uses it (`explain` inside a rolled-back proof), and check whether the `removed_media` sweep shares it.
- **The admin album drill-in** (`/admin/albums/[eventId]`): it "reads and presigns every item"; page it past a few thousand items. The portal cannot run signed in on localhost, so drive the paging through its Library specimen or a unit test, and name the red-team's steps.
- **The over-capacity reduce** (lifecycle): it "reads a lapsed host's whole active set before it acts (whole, but not budgeted inside one account), so past roughly 100,000 active items one account could spend the sweep's share; page the reduce itself". The sweep's budget and its health line stay true.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition; a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: another lane writes migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- the purge cron's route on localhost with its dry modes.

The portal cannot run signed in on localhost, so name its steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Three lanes run beside you, so don't touch their files:
- `crumbs-36` owns `lib/lifecycle/inactivity.ts`, the pricing sections, `report-queue.tsx` and `lib/admin/reports.ts`;
- `crumbs-38` owns the profile's lists, the viewer's credit and the guest's upload queue;
- `crumbs-39` owns a hygiene sweep (dead components, comments, `ui/dialog.tsx`, the portal's content links).

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

## Where I am

- Booted at `58b359e8` in `/Users/gibby/local/ai/partyreel-wt/crumbs-37` (port 3131, scratch `_scratch/crumbs-37`).
- Done: item 1 whole. The planner and model (`e92281a5`): `planAlbumSync` answers a manifest below the scope's
  watermark; the model prunes (10,000 schedules, 6,450 polls below the watermark, 0 misses; a blind server lost
  removals in 536 of 2,000); red without the rule (4 tests). The SQL and the job (next commit):
  `20261001150000_album_log_prune.sql` (watermarks, the reader, `album_prune_tombstones`, the switch), proved red then
  green on the live schema rolled back (`_scratch/crumbs-37/proofA-live.log`), pre-flighted and stressed locally
  (494,326 pgbench transactions, none of 158 random-writer deadlocks names the prune or an album row, invariants
  held); `sweepAlbumLog` (rotating, budgeted, wraps), the `purge_album_log` job, the route's tenth budgeted sweep.
- Done: item 4 (next commit): the reduce reads the active set largest first a page at a time (`reduceToCap`,
  `takeLargestFirst`), stops reading once what is left fits, asks the deadline before every page; a reduce stopped
  part way keeps its grace and mail, counts as left and the next run starts AT it. Red on today's code (2 tests).
- Done: item 3 (next commit): the drill-in reads and signs one page of 500 (newest first, keyset on the raw
  `created_at` and id), says which items these are, and links Newest and Older (never prefetched); a mangled cursor
  reads the newest page. Red on today's code (7 tests).
- Done: item 2 (next commit): `20261001151000_removed_media_index.sql` (`media_removed_idx (purge_at, id) where
  status = 'removed'` replacing `media_purge_at_idx`, the same rows; `standby_hosts` reads the bin's two halves by
  index under its unchanged predicate). Red then green on the live schema rolled back, and at 1.2M rows locally
  (`_scratch/crumbs-37/proofB-live.log`): the Seq Scan becomes index reads of the bin alone, the answers equal.
- In progress: the system docs, then the gate.
- Left: system docs; the gate (and lab:smoke on 3131); the cron route's dry modes on localhost; the handoff.
- Measured (live, 2026-10-01): media 1,480 (67 removed, every one with `purge_at`; `purge_at` is set exactly when
  removed, by `set_media_purge_at`), events 63 (46 soft-deleted), album_state 58, album_changes 1,344 of which 5 are
  tombstones in 4 albums; `standby_hosts`' plan today is a Seq Scan on media with the OR as a join filter.

