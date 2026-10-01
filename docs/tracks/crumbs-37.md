---
track: crumbs-37
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is Will's to overrule; none is a one-way door (a pruned tombstone is derived data:
the media row it described is already gone, and the watermark sends any client that missed it the album whole).

- **The prune's switch starts ON at the apply** (`purge_album_log_enabled`, seeded like every sub-sweep's).
  Recommended: on; the prune is safe by construction and a log never pruned is the bug. Other answer: seed it off
  and switch it on from `/admin/jobs` after the build's red-team.
- **Every tombstone is pruned the night it is found, no age horizon.** Recommended: a client resyncs only if it has
  not synced since a removal whose item was then purged, and most purges come 30 days after the removal (the host's
  Delete permanently and the standby budget's evictions are the quick ones); a resync is one manifest request for an
  album under 3,000 items. Other answer: prune only rows older than N days, which needs a stamp time on every change
  row, a write in the hottest trigger.
- **The album log is a job of its own** (`purge_album_log`: a run row, a switch, a card), though it deletes rows,
  not bytes or accounts. Recommended: it writes in the album's live core, so an operator can stop it alone without
  giving up the night's reclamation. Other answer: ride the parent's row like the limiters' prunes.
- **`media_purge_at_idx` is dropped, replaced by `media_removed_idx (purge_at, id) where status = 'removed'`** (the
  same rows: `set_media_purge_at` sets `purge_at` exactly when a row is removed; every reader of `purge_at` also says
  `status = 'removed'`). Recommended: one index over the bin, read by both. Other answer: keep both, one more index
  written on every removal, restore and purge.
- **The drill-in's page is 500 items, with Newest and Older links** (the browser's Back is the newer page).
  Recommended: a few thousand on one page is the cost this line removes, and 500 is a long scroll of the grid in one
  request. Other answers: 1,000 a page, or a Newer link (a reverse keyset).
- **A reduce the deadline stops part way keeps the grace open and sends no mail until it finishes**, and the account
  is the next run's first. Recommended: the mail says what was removed and until when, which is only true once.
  Other answer: mail each night what that night removed.
- **The album log's `remaining` counts `album_state` rows after its cursor** (an upper bound: an album with no change
  rows counts). Recommended: one cheap HEAD count. Other answer: count distinct albums in the rest of the log
  (exact, a scan of the rest of the log at the end of a run already out of time).

## System-doc edits (in place, owned facts only)

- `docs/systems/lifecycle-recovery.md`: the rotating sweeps gain `album_log` (albums); the album log as a job of its
  own; the prune under a watermark (one line, its mechanics); `standby_hosts` reads the bin's two halves by index
  (`media_removed_idx`, shared with the `removed_media` sweep); the over-capacity reduce paged under the deadline,
  a stopped one keeping its grace and mail and going first next run.
- `docs/systems/admin-observability.md`: a sub-sweep is a job: the album change log's prune joins the four.
- `docs/systems/database-security.md`: `album_prune_tombstones` in the service-role-only list (DEFINER: the tables
  grant the service role SELECT only); the album tables written by the triggers and the log's prune; the lock-order
  rule names the prune as the one other writer, taking each album's version row before its change rows.
- `docs/systems/guest-flow.md`: the conditional poll: a version below the album's watermark answers the album whole.
- `docs/systems/host-app.md`: the host's poll: a manifest past 500 changes or below the log's watermark.

## Deferred (ROADMAP one-liners, bucket named)

- Performance: `standby_hosts`' deleted-event half and `expired_events` find soft-deleted events by a scan of
  `events` (no index on `deleted_at`); a partial index `on events (id) where deleted_at is not null` keeps them index
  reads past about a million events (from crumbs-37).
- Lifecycle: over-capacity's candidates are every profile past Free's cap (most paying hosts), one
  `host_storage_summary` call each, so past a few hundred paying hosts a night's share examines only part of them in
  rotation; one SQL read of the accounts actually over their effective cap would make the candidate list exact
  (from crumbs-37).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-37`:** the work `e92281a5` (the planner's watermark rule and the model),
  `e93d4a31` (the album log: SQL, sweep, job, route), `470d50a9` (the paged reduce), `5cbb64e4` (the paged drill-in),
  `47724d64` (the removed-media index), `ec4a13ba` (the system docs); the sync `4912611b` (a clean merge of
  `origin/launch-prep` at `116d1555`: crumbs-36 and crumbs-39 had landed, two of this lane's docs among their files)
  and `80415544` (what the sync asked: the drill-in's back and host links never prefetch, so crumbs-39's
  `admin-prefetch-policy.test.ts` drops its PENDING entry for the page; `words.test.ts`, red on launch-prep itself
  since `e370430b` retired the ROADMAP line its NOT_YET entry named, drops that entry, as the test says). The head is
  this manifest's commit.
- **Gates on the synced tree (`80415544`), each on its own exit code** (logs `_scratch/crumbs-37/synced/`):
  `pnpm typecheck` 0 (after `rm -rf .next/dev`) · `pnpm lint` 0, no warning · `pnpm test` 0 (685 files, 8,231 tests)
  · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3131` 0 (137 checks, 0 failing). Before the sync the
  same five ran green on `47724d64` plus the docs (8,204 tests, 142 checks: `_scratch/crumbs-37/gate-*.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, this manifest, the five
  system docs above, and three exceptions: `src/lib/db/migration-guards.test.ts` (one pin reshaped on purpose, its
  scar kept: the album tables' writers list admits `album_prune_tombstones`; the lane's own pins are in
  `src/lib/db/upkeep-migrations.test.ts`), `src/components/admin/admin-prefetch-policy.test.ts` (its PENDING entry
  for this lane's page, retired as it asks) and `src/components/lab/words.test.ts` (launch-prep's own red, above).
- **The items:**
  1. Album change log: `20261001150000_album_log_prune.sql` (album_state's `host_watermark`/`album_watermark`;
     `album_changes_since` answers the asked scope's watermark in its one snapshot; `album_prune_tombstones`, definer,
     service role only, takes the albums the next window of the log touches whole, locks each album's version row
     first, deletes the rows whose media is gone and raises the watermarks to their versions in one transaction; the
     switch seeded on); `planAlbumSync` answers a manifest below the watermark (`album-sync.ts`); `sweepAlbumLog`
     (rotating on its run row's cursor, budgeted, wrapping round); the `purge_album_log` job and card; the purge
     route's tenth budgeted sweep, last. A parked client comes back whole: `album-version.test.ts` (10,000 schedules
     with prunes anywhere a write lands: 6,450 polls below a watermark, 0 integrity misses, 0 divergence; a server
     blind to the watermark loses removals in 536 of 2,000; a parked client takes one manifest, a live one a 304).
     Red without the rule: 4 tests.
  2. `standby_hosts` by index: `20261001151000_removed_media_index.sql` (`media_removed_idx (purge_at, id) where
     status = 'removed'` replacing `media_purge_at_idx`, the same rows; the bin's two halves each by an index under
     20260929140000's predicate byte for byte). The `removed_media` sweep shares it (its pages and the bell's
     soonest purge read it). At 1,200,000 rows: the Seq Scan of every row (80 ms) becomes a Bitmap Index Scan of the
     40,000 removed plus a Nested Loop over 185 deleted events (26 ms), 5,000 hosts and their bytes equal
     (`_scratch/crumbs-37/proofB-live.log`, `pg/scale-*.sql`).
  3. The admin drill-in a page at a time: 500 newest first (keyset on the raw `created_at` and id, one row more to
     know an older page exists), only that page signed, "Items 501–1,000 of 2,500, newest first", Newest and Older
     never prefetched; a mangled cursor reads the newest page; a page past the end draws the way back
     (`moderation.ts`, `album-pages.ts`, the page). Red on today's code: 7 tests.
  4. The over-capacity reduce paged inside one account (`reduceToCap`, `takeLargestFirst`): largest first a page at
     a time, reading stops once what is left fits, the deadline asked before every page; the pages choose exactly
     the whole-set sort's items (`auto-reduce.test.ts`, every page size against every cap); a reduce stopped part
     way keeps its grace and mail, counts as left, and is the next run's first. Red on today's code: 2 tests.
- **Proofs on the live schema, rolled back, red first** (the file's statements and its foot's check in one
  transaction; nothing persisted, read back after): `_scratch/crumbs-37/proofA-live.log` (red "FAIL 1: album_state
  has 0 of its two watermarks"; green "ROLLED BACK: every album-log check held {"pass": {"calls": 3, "albums": 46,
  "pruned": 8}, "probe": [231, 220]}"), `_scratch/crumbs-37/proofB-live.log` (red "FAIL 1: media_removed_idx is
  missing ..."; green "ROLLED BACK: every removed-media-index check held {"hosts": 2}"). Local pre-flight on Postgres
  17 with both files verbatim, and a stress of the prune beside every writer shape: 494,326 transactions, none of
  the 158 deadlocks (the stress's random writers on media rows) names the prune or an album row; no live row
  pruned, no watermark short (`proofA-live.log`, `pg/bench/run2.log`).
- **The purge cron's route on localhost, its dry modes** (`_scratch/crumbs-37/cron-dry-*.log`): no bearer, a wrong
  one and a wrong scheme answer 401; the admin surface (`NEXT_PUBLIC_SURFACE=admin`) with the cron's own bearer
  answers `{"ok":true,"skipped":true,"reason":"not_this_surface"}` before any read. The app surface with the bearer
  was not called (it runs the real sweeps on the shared database). The read halves ran dry on the live data through
  a client that refuses every write (`_scratch/crumbs-37/dry/live.dry.json`, nothing refused, nothing written): the
  drill-in walks the probe's 1,200 items in pages of 500, 500 and 200, each once, newest first; the reduce's pages
  of 250 walk willg97's 1,280 active items as one sort, their sum his `host_storage_summary`; one over-cap candidate,
  none past its grace; before 20261001150000 stands the album-log sweep throws (its card red), never a quiet night.
- **The desk's boards** (lab:smoke's PREMISE lines name `disposable-mode`, `event-ready` and `locked-door`, whose
  docs this lane touched): their asks still hold. The edits add one fact each to the album's poll protocol (a
  version below the watermark answers the album whole); the first paint, the door, the hub's list and every word a
  board asks about are unchanged, and a client at or above the watermark is answered exactly as before.
- **Assets requested from Will:** none.
- **Board ideas:** Admin: the album drill-in could take the Albums feed's status filter (All, Pending, Hidden,
  Removed), so an operator meets a big album's held or removed items without paging through the rest.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** two migrations, unapplied, each with its apply
  protocol in its header and its rolled-back check at its foot: `20261001150000_album_log_prune.sql` (expected
  advisor delta none; regenerate the types: album_state's two columns and `album_prune_tombstones`; then the cast in
  `album-log.ts` can go) and `20261001151000_removed_media_index.sql` (no types change). Apply both before the code
  deploys: until 20261001150000 stands the album-log card reads failed each night. No Worker, Vercel, Stripe or env
  change.
- **Calls his to overrule:** the switch on at the apply · no age horizon on the prune · the album log a job of its
  own · `media_purge_at_idx` replaced, not kept · 500 a page with Newest and Older · a stopped reduce keeps its grace
  and mail · `remaining` an upper bound (each with its reason under Questions).
- **Red-team steps for the next build** (the portal does not sign in on localhost):
  1. As partyr33l on the admin alias, `/admin/albums/14bb4318-80cd-4eed-b219-92c097ee16c7` (the probe, 1,200
     items): "Items 1–500 of 1,200, newest first" above and below the grid; Older to 501–1,000, then 1,001–1,200 with
     no Older; Newest back; `?at=x&id=y` by hand draws the newest page; the Media counts line unchanged; Remove and
     Restore on a page-two tile keep the page; hovering Albums, the host and the pager links fetches nothing.
  2. `/admin/jobs`: an "Album change log" card among the purge sweep's sub-sweeps with its switch; after a purge run
     its row reads ok with `albums`, `examined`, `pruned`; paused, the next run records a skipped row.
  3. The prune's effect, once the migrations stand (the cron runs on production; on the alias, the app host's own
     `/api/cron/purge` with the cron bearer runs every sweep on the shared data): as willg97 on a test album, open a
     guest tab and hide it, remove a photograph and Delete it permanently from Deleted, run the cron, show the tab:
     the album is whole without that photograph, with no "didn't load" card, and its sync answered `kind: "manifest"`.
  4. Over-capacity has no candidate past its grace live (one candidate, under grace): the paged reduce is held by
     its tests and the dry read, not walkable without lapsing a paid account.
- **Look at first:** `album_prune_tombstones` in `20261001150000_album_log_prune.sql` (the lock order and the
  re-ask before the delete) and `planAlbumSync`'s one new clause; then the `offset 0` fence in `standby_hosts`
  (`20261001151000`), without which the deleted-event half folds back into a scan of every media row.

## Where I am

- Handed off; nothing in progress. The local Postgres 17 stand-in (socket `/private/tmp/pgc37`, port 54337, data
  `_scratch/crumbs-37/pg/data`, databases `postgres` and `scale`) is stopped at the handoff; `mkproof.py` rebuilds a
  rolled-back proof from either migration's foot (`--with-file` runs the file's statements first).
