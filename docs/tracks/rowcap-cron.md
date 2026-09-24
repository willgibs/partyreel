---
track: rowcap-cron
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "30c3fecd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/cron/
  - src/lib/lifecycle/
  - src/lib/db/mutations/account.ts
  - src/lib/db/mutations/account.test.ts
  - src/app/api/internal/
  - scripts/backfill-strip-exif.mjs
  - src/app/admin/jobs/
  - src/lib/db/queries/jobs.ts
  - src/lib/db/queries/jobs.test.ts
  - src/lib/jobs/
  - src/lib/forensics/legal-hold.ts
  - src/lib/forensics/legal-hold.test.ts
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - src/lib/db/read-all.ts
  - src/lib/db/testing/fake-postgrest.ts
  - src/lib/db/row-cap-policy.test.ts
  - docs/systems/database-security.md
  - supabase/migrations/20260924010000_row_cap_album.sql
  - supabase/migrations/20260924020000_row_cap_host.sql
  - supabase/migrations/20260924030000_row_cap_sweeps.sql
---

# lp/rowcap-cron

**Goal.** Every purge sweep and the account-deletion path finish whole or report what they left: keyset batches within the 60-second budget, legal hold decided in one row, the standby budget on the right hosts and never on a guest's withdrawal, every id list chunked, and a partial run visible on the jobs console.

## The brief

**Will's words (2026-09-23), verbatim.** "In other project builds, I've also hit errors around that 1000 item handling (maybe a PostgREST issue? could be off there) for things like pagination, item counts, filtering, etc. Let's ensure we will not face any of those issues here." And: "Anything within the work we're doing now may be addressed in a near-term round, and anything that requires more dedicated focus can be logged in the roadmap."

**Where the round stands.** PostgREST's `max_rows` is 1,000 on the live project, proved on the scale probe: an unbounded read of 1,024 rows answered `Content-Range: 0-999/*`. Write responses are NOT capped (a PATCH over 1,040 rows returned 1,040). Today partyreel.com and the alias serve a guest exactly 1,000 of the probe's 1,145 approved photos. Stage 1 has landed on `launch-prep`:
- `src/lib/db/read-all.ts`: `MAX_ROWS` (1,000, pinned to `supabase/config.toml`), `IN_CHUNK` (150), `readAllPages(label, page(after, limit), keyOf, { budget?, after? })` returning `{ rows, more, after }`, and `inChunks(label, ids, run, { size?, concurrency = 4 })` (dedupes, chunks at 150). `page` builds a FRESH builder each call with `.limit(limit)`; an error throws `QueryFailedError(label)`; a short page ends the read; it throws on a page longer than asked or a cursor that did not advance; annotate `after` (`string | null`, or `{ at: string; id: string } | null`) since TypeScript cannot infer it. Its header holds the six rules.
- `src/lib/db/testing/fake-postgrest.ts`: an in-memory PostgREST (`asSupabase` casts it to the client) that clamps every read at 1,000, fails a URL past 8,000 characters the way a failed fetch resolves, records every request, and speaks `eq neq in is not gt gte lt lte like ilike match or(and())`, multi-column `order`, `limit`, `range`, `select(count, head)`, `single`, `maybeSingle`, `rpc` and writes (unclamped).
- `src/lib/supabase/row-cap-tripwire.ts` on the server, admin and browser clients: a response spanning 1,000 rows to a request with no limit warns once per path (Sentry area `db`).
- `src/lib/db/row-cap-policy.test.ts`: rule A (an unbounded `.from("<t>").select()`; `.in("id", <a bounded chunk>)` counts as a bound), B (an `.in()` over a runtime list outside `inChunks`), C (a set-returning `.rpc()` without `p_limit`), D (`MAX_ROWS` pinned); markers `// row-cap: <why>` and `// row-cap-todo: <ids> <why>` on the lines above the statement; a stale marker fails; `TODO_IDS` lists the ids still allowed (the Orchestrator empties it at the last stage-2 record).
The SQL functions are applied on the live database and in `src/lib/db/types.ts`:
- `get_event_media_by_qr_token(p_qr_token, p_before_created_at = null, p_before_id = null, p_limit = null)`: the open album, `created_at desc, id desc`; pass the last row's `created_at` (the raw string) and `id`; rows strictly after; anon + authenticated (DEFINER).
- `get_event_like_counts(p_event_id, p_after = null, p_limit = null)`: LIKED media only, `(media_id, like_count)`, keyset on `media_id` ascending; host-gated; authenticated.
- `my_liked_media_ids(p_media_ids uuid[]) returns uuid[]`: the caller's own likes among the ids, the ids in the POST body; authenticated (INVOKER).
- `event_card_stats(p_event_ids uuid[]) returns jsonb` `{ "<event id>": { "approved": n, "pending": n } }` for every non-null input id; authenticated (INVOKER, the host's RLS).
- `event_covers(p_event_ids uuid[]) returns jsonb` `{ "<event id>": { "preview_key": text or null, "original_key": text } }`, the newest approved photo; an event with none absent; authenticated and service_role (INVOKER).
- `event_link_totals(p_event_id) returns jsonb` `{ "qr_scans": n, "album_views": n }`; authenticated (INVOKER).
- `list_guest_rows_by_email(p_after_at = null, p_after_id = null, p_limit = null)`: the claim card, `coalesce(last_at, created_at) desc, guest_id desc`; pass the last row's `last_upload_at` and `guest_id`; authenticated (DEFINER).
- `admin_metrics_snapshot(p_window_days = 30, p_fortnight_days = 14) returns jsonb`: `as_of`, `window_days`, `fortnight_days`; `accounts.{total, new_in_window, active_in_window, new_in_fortnight, new_in_prior_fortnight, active_in_fortnight, active_in_prior_fortnight, paid, storage_used_bytes, by_tier {raw tier: n}, signups_by_day {YYYY-MM-DD: n}}`; `engagement.{qr_scans, album_views, by_day {YYYY-MM-DD: {qr_scans, album_views}}}`; `newsletter.by_source [{source (raw, nullable), count}]` (fold tiers with `toBillingTier` and sources with `countBySource`'s rule); service_role only.
- `held_event_ids(p_event_ids uuid[]) returns uuid[]`: the input ids holding any held media; service_role only.
- `standby_hosts(p_after = null, p_limit = null)`: `(host_id, standby_bytes)` per host, exactly the cron budget's bytes (a guest's withdrawal and a system removal never count, a held row never), keyset on `host_id`; service_role only.
- Every paged function: a null `p_limit` reads everything, a given one is clamped to 1,000. `purge_media_rows` is unchanged (one row per host among at most its input). Index `media_event_created_id_idx (event_id, created_at desc, id desc)` serves every per-event newest-first read.

**The scale probe** (disposable test data on willg97): event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`, qr `d02631f1bfb3455188d224e41bf9510f`, 1,200 photos `p0001` (the oldest) to `p1200`, attributed in turn to the host, Ana P., Ben K. and Cal M., 320x240 with no preview. Its states are set by SQL on the OLDEST items: 20 pending, 30 removed by the host path, five guest-owned withdrawn (`removed_by_uploader`), and the three oldest approved liked by willg97 and hi@willgibs (1,145 approved). Localhost reads the real database, so a guest-facing read of the probe needs no sign-in: `/e/d02631f1bfb3455188d224e41bf9510f`, or the poll `POST /api/guests/gallery {"qr_token": ...}`. A host read needs a sign-in the local server cannot do; prove those with tests and with a script over the query function on the admin client.

**Your definition of done.** `git grep -n "row-cap-todo" -- <your owns>` lists your markers (the policy test `src/lib/db/row-cap-policy.test.ts` fails on a marker that no longer offends, so a fix removes its marker).
- Fix each one, or turn it into a permanent `// row-cap: <why>` only when the read is bounded by design. The Orchestrator checks every such why at the merge.
- The semantic items below get no marker (a count taken from a list's length, a window, a swallowed error) and are yours by this brief.
- Every fixed read gets a completeness test on `src/lib/db/testing/fake-postgrest.ts` with a fixture past 2,000 rows (the fake clamps at 1,000 exactly as the platform does), and every chunked id list a test that its requests stay under the fake's URL limit.
- Converge any hand-rolled loop in your files onto `readAllPages` or `inChunks`.
- Make a stale comment in your files true.
- Refine your system doc in place (the facts only; never history).

**The rules** (the helper's header is their home):
- A list is read whole: keyset pages through `readAllPages`, with media lists shown newest-first paging on `(created_at desc, id desc)` and the cursor the raw timestamp string, never a `Date`.
- A count is `{ count: "exact", head: true }` or an aggregate, never a list's length.
- A runtime id list goes through `inChunks`, a parent filter or a `uuid[]` RPC.
- A set-returning RPC is called with `p_limit`.
- A sweep has a budget and reports what it left.
- A bound on purpose says so on the screen or in a `// row-cap:` marker.

**Your items** (`src/app/api/cron/purge/route.ts`; maxDuration 60 at `:89`; sweep order `:329-358`; no sweep keeps a cursor today).
- **Every sweep:** keyset batches under a time budget, never an offset loop while deleting (an offset skips rows). When it stops early it reports a top-level `remaining` number or a note, because `/admin/jobs` (`src/app/admin/jobs/page.tsx:134-147`) shows only top-level numbers above 0 and strings, so `more_remain` has never shown. It also warns once through `captureWarning("cron", ...)`. Map "stopped early" to `attention` in `jobHealth` (`catalog.ts:441-468`) if it fits cleanly; your call, stated.
- **H8:** `removed_media` (`:495-528`) purges at most 1,000 a night, unordered, and the backlog grows silently. Make it budgeted and oldest-first. It already purges a guest's withdrawal on its own `purge_at`: keep that.
- **H9 and H10:** `over_capacity` (`:718-892`). Its candidates are unbounded (`:723-727`), and each host's active bytes are summed in JS (`:751-764`) though `readHostStorageSummary` (`src/lib/db/queries/storage.ts:70-83`) exists: use it. Take the auto-reduce candidates by keyset, and chunk the `.update().in(id)` at `:812-824`. The ROADMAP Now line about this sweep retires at your merge.
- **H11:** `inactive_free_events` (`:960-1087`), budgeted. **H13:** `expired_passes` (`:673-695`): whole, and one failing account must not stop the loop.
- **H12:** `sweepStandbyBudget` (`:1099-1226`).
  - Discover hosts through `standby_hosts(p_after, p_limit)`, not one row per removed photo platform-wide plus a 2,000-id `profiles.in()`.
  - Read the bins only for hosts over budget, and read them whole.
  - Evict oldest-first across the WHOLE bin (`selectForStandbyEviction`, `src/lib/lifecycle/recently-deleted.ts:52-76`).
  - **delete-final's rule:** a guest's own withdrawal (`removed_by_uploader`) never counts in the host's budget and is never evicted by it. It purges on its own 30-day `purge_at`. Today it counts, and the dashboard's warning (`dashboard/page.tsx:172`, already on the withdrawal-free `host_storage_summary`) disagrees with the cron.
- **H14:** legal hold through `held_event_ids(uuid[])`, in the cron (`:415-424`) and in account deletion (`src/lib/lifecycle/account-deletion.ts:242-256, 483-491`), replacing one row per held photo into `partitionEventsByHold` (`src/lib/forensics/legal-hold.ts:41-52`). Past 1,000 held rows an event with held media reads as purgeable today. Pin it with a test that 1,500 held rows across one event keep the event held.
- **H15:** the `.in()` over every event expiring that night (`:418, 451, 474-477`), chunked. The `expired_events` media loop (`:436-459`) is an OFFSET loop with an unchunked `.in("event_id", eventIds)`: keyset and chunk it.
- **M15:** `:389-395` and the renewal nudges at `:904-910`, budgeted.
- **M16:** every `purge_media_rows` call passes at most `MAX_ROWS` ids (one row per host among its input, so the freed-bytes report can never clip). Pin it.
- **M17:** the orphan sweep's `.in(id)` (`:565-568`) and `src/app/api/internal/backup-prune/route.ts:36, 71-74` (`MAX_BATCH = 1000`, about a 37 KB URL), chunked, with the R2 page size and the batch pinned at most `MAX_ROWS`.
- **M14 and N2:** account deletion (`account-deletion.ts:236, 311-314, 475, 495`, with an offset loop at `260-275` and `.in("event_id", purgeable)` at `266-280`), keyset and chunked, with the event count counted.
- **N1:** `binHostedEvents` (`src/lib/db/mutations/account.ts:231-243`), the self-service deletion's unbounded read of the host's live events, whole. The operator arm (`:219-227`) counts from an `update ... select("id")` response, which is complete (writes are not capped): keep it, with a comment.
- **H17:** `scripts/backfill-strip-exif.mjs:259-274`: chunk the `.in()` over every shrunk object, and read by keyset before any R2 write.

**Look at first (your Handoff):**
- The sweeps' dry numbers against the live data, printed by a script that calls each sweep's READ half on the admin client and writes nothing: the standby candidates from `standby_hosts`, with the probe's five withdrawals absent from willg97's figure; the held events.
- Tests with fixtures past 2,000 rows for each sweep's batching, and for the legal-hold partition.
- Never run the cron's destructive halves against the live data.

**Boundaries.** `rowcap-guest` owns the guest album's queries (`guest-events.ts`, `guest-events-admin.ts`), `src/lib/events/gallery-*` and `event-guests.ts`, `src/app/api/guests/`, `src/app/api/export/guest/`, `src/components/guest/`, `src/components/likes/`, `src/lib/guest/`, `src/app/(guest)/`, `src/lib/r2/grid-items.ts` and `guest-flow.md`. `rowcap-album` owns `media.ts`, `reel.ts`, `mutations/{media,guest-media}.ts`, `src/app/(app)/dashboard/[eventId]/`, `src/app/api/events/`, `src/app/api/export/host/`, `src/app/api/reel/`, `src/lib/export/`, `host-fingerprint.ts`, `src/components/reel/`, `src/lib/reel/`, `src/lib/event/`, `src/components/app/event-feed/`, `scripts/seed-demo-event.mjs` and `host-app.md`. `rowcap-host` owns the other queries (`events`, `likes`, `pulse`, `social`, `metrics`, `moderation`, `reports`, `analytics`, `claims`, `support`, `applications`, `forensics`, `storage`, `guest-addresses`), `src/lib/dashboard/`, `src/lib/admin/`, `src/lib/metrics/`, `src/lib/stripe/revenue.ts`, the dashboard index, `dashboard/new/`, `account/`, every `src/app/admin/` page but `jobs/`, and `profiles-social.md`. Touch none of those (a caller of another lane's function stays as it is; its shape does not change). A new test goes beside its file as `<file>.test.ts`, the name your owns list. Never `src/lib/db/types.ts`, `read-all.ts`, `fake-postgrest.ts` or the policy test; never a migration or `apply_migration`; never a live write beyond reading the probe. If a fix needs a new SQL shape, stop that item and write it under Questions with the exact signature: the Orchestrator adds it. A system-doc fact outside your doc goes in your Handoff as the line to change. Your system docs: `docs/systems/lifecycle-recovery.md`, `admin-observability.md` (the jobs console) and `trust-safety-forensics.md` (legal hold) (only the facts your files change).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

None open. The calls taken inside the brief, each built as its recommended answer (his to overrule):
- **"Stopped early" is `attention`** (the manifest's "your call"): a finished `ok` run carrying `stopped_early: true` reads "Needs a look", so the band and the bell show a backlog that outlasts a night; a failure, a pause or a missed run still outranks it. Recommended: keep.
- **Where a rotating sweep resumes** (`expired_passes`, `over_capacity`, `renewal_nudges`, `inactive_free_events`, which examine accounts and would re-read the same head every night): `resume_after` on its own `job_runs` counts (the parent's nested tally for the two that ride it), read back by `readSweepCursor`; no table, no migration; an unreadable cursor restarts from the beginning with a `sweep_cursor_unreadable` warning. The draining sweeps keep no cursor. Recommended: keep.
- **The budget's numbers**: `SWEEP_WINDOW_MS` 42 s of `maxDuration` 60, shared equally among what is left by the nine budgeted sweeps as they start (a paused sub-sweep's share rolls down); a batch is never cut mid-flight. Recommended: keep; revisit once real backlogs exist.
- **A parent-row sweep's failed rows now fail the parent run**: `renewal_nudges` and the newly isolated `expired_passes` ride the parent row, whose card prints no nested tally, so their failed accounts were visible only in Sentry; the parent closes `error` with "Rows failed in: ...". Recommended: keep (isolation never buys silence).
- **The parent's counts drop each nested tally's `rows_note` / `stopped_note`**: a failed row's first message can quote an address; the note column says which sweep failed or stopped. Recommended: keep.
- **The inactivity candidates also filter the host's `last_active_at`** in SQL: the freshness clock is a max, so no event outside it can be due; it keeps an active free host's old events out of every night's list. Recommended: keep.
- **The deletion queue lost its 100-a-run cap**: it pages oldest request first until the deadline, so accounts held at the head (a held account never leaves the queue) cannot starve the requests behind them. Recommended: keep.
- **The event-level purges ask the holds again** right before the event rows go, and their media reads leave held rows out, so a hold placed mid-sweep keeps its row and its event (the old path could cascade it). Recommended: keep.
- **H17's pre-read is chunked by id**, not a keyset scan of `media`: the listing names the exact ids, and a scan reads the whole table for a narrowed prefix. The script keeps a local `inChunks` (`IN_CHUNK` 150 restated) because Node's type stripping cannot resolve `read-all.ts`'s `@/` import. Recommended: keep.
- **The orphan sweep still does not resume** (ROADMAP QA #37/#38 stands): it now says when the page cap or its deadline stops it (`stopped_early`, its own note: "starts again from the top"), so a bucket past 20 pages reads `attention` every night until #37/#38 lands. Recommended: keep the task where it is.

## System-doc edits (in place, owned facts only)

- `lifecycle-recovery.md`: the daily cron (the sweeps' homes, the budget and its share, draining vs rotating vs the orphan sweep, per-row isolation's `stopWhen` and parent-run failure, `purge_media_rows` through `reclaimMedia` at most `MAX_ROWS` ids a call); the standby budget (`standby_hosts`, the whole bin, withdrawals never counted nor evicted, the meter reading higher); the hold invariant (`held_event_ids`, asked again); over-capacity (the aggregate, whole and rotated, the chunked reduce); inactivity (the pre-filter, keyset and rotated).
- `admin-observability.md`: per-row isolation fails the parent run for a sweep riding it; "A run that stopped early reads Needs a look" (the flag, `remaining`, the note, one warning, the cursor never printed).
- `trust-safety-forensics.md`: where the hold exclusions live (the sweeps, `readHeldEventIds`); the invariant's one-answer rule and the re-ask before the event rows go.
- Out of the lane, one line for the Orchestrator: `durability-backups.md:17` "wired into `sweepOrphans` in [`/api/cron/purge`](../../src/app/api/cron/purge/route.ts)" now reads "in [`lifecycle/sweeps/orphans.ts`](../../src/lib/lifecycle/sweeps/orphans.ts)". `ROADMAP.md:32` (the over-cap sweep) retires at this merge; QA #39 ("POST id batches") is done for the cron's sites.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Lifecycle: over-capacity's auto-reduce reads a lapsed host's whole active set before it acts (whole, but not budgeted inside one account), so past roughly 100,000 active items one account could spend the sweep's share; page the reduce itself.
- Now · Admin: an orphan circuit-breaker trip closes its run `ok` (the Sentry error and the email fire), so the Orphan sweep card reads Healthy beside it; read `breaker_tripped` as `attention` in `jobHealth`.

## Handoff (replaces the chat report)

- **Commits:** the work `5c4469cb`; the sync merge `29ea538c` (origin/launch-prep at `90e170f2`, rowcap-guest merged; no file in this lane's `reads` changed). Both pushed; the head is in the chat line.
- **Gates on the synced tree (`29ea538c`), each on its own exit code** (logs `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/synced/`): `pnpm design:rules` 0 (no generated file changed) · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (7 warnings, all in 6 files outside the lane, all pre-existing; the one in a lane file, the unused `JobRunInsert` in `queries/jobs.ts`, is removed) · `pnpm test` 0 (404 files, 4,487 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3134` 0 (521 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 47 paths, every one under `owns` (the three system docs, `scripts/backfill-strip-exif.mjs`, `src/app/admin/jobs/`, `src/app/api/cron/`, `src/app/api/internal/`, `mutations/account(.test).ts`, `queries/jobs(.test).ts`, `forensics/legal-hold(.test).ts`, `src/lib/jobs/`, `src/lib/lifecycle/`) + this file. No exception.
- **Markers:** `git grep -n "row-cap-todo" -- <owns>` lists nothing; the policy test is green with no `// row-cap:` added.
- **The items:**
  - Structure: the sweeps moved into `src/lib/lifecycle/sweeps/` (the route keeps auth, surface, kill switch, heartbeat, order); each tested on the clamping fake through `lifecycle/testing/cron-fake.ts` (SQL twins of `purge_media_rows`, `held_event_ids`, `standby_hosts`, `host_storage_summary`).
  - Every sweep: keyset batches under a deadline (`lifecycle/sweep-budget.ts`); a stop returns `stopped_early` + counted `remaining`, one `sweep_stopped_early` warning (`jobs/purge-sweeps.ts`), `attention` (`catalog.ts` `STOPPED_EARLY_KEY`, `jobHealth`), the parent's note and `sweeps_stopped_early` (`purgeRunVerdict`); the card leads with `remaining` (`page.tsx`). Tests: `sweep-budget`, `purge-sweeps`, `sweep-tally`, `catalog`, `queries/jobs`, `cron/purge/route` tests.
  - H8 `removed_media`: oldest `purge_at` first on the `(purge_at, id)` cursor (proved live, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/probe-cursor.log`), budgeted, withdrawals still purge on their own `purge_at` (`removed-media.test.ts`: 2,500 rows, a tie block across the page boundary, order asserted).
  - H9/H10 `over_capacity`: candidates whole and rotated, active bytes from `readHostStorageSummary`, the reduce over the whole active set, the soft-remove chunked (`over-capacity.test.ts`: 1,299 candidates, a 2,500-item reduce in 17 chunked PATCHes).
  - H11 `inactive_free_events`: keyset batches from the resume cursor, budgeted (`inactivity.test.ts`: 2,100 candidates; a stop at 1,200 leaves the cursor and 900 counted; the next run finishes).
  - H12 `standby_budget`: `standby_hosts` pages, the bin read only over budget and whole, oldest-first across it, a withdrawal never counted nor evicted (`standby-budget.test.ts`: 1,202 hosts, the 2,100 oldest evicted from the highest ids, 1,500 withdrawals untouched, a withdrawals-only host never listed).
  - H13 `expired_passes`: both lists whole, one failing account isolated, rotated (`passes.test.ts`: 2,000 candidates). M15 `renewal_nudges` the same (2,100 nudged).
  - H14 legal hold: `held_event_ids` through `readHeldEventIds` in `expired_events`, `purgeAccount`, `getAccountDeletionState`; asked again before the event rows go (`reclaim.test.ts` and `expired-events.test.ts`: 1,500 held rows in one event plus one held row past them keep both held; a hold placed mid-sweep keeps its event and row; `account-deletion.test.ts` the same for accounts).
  - H15/M15 `expired_events`: event batches of `IN_CHUNK` by keyset, each batch's media in keyset pages (the offset loop gone), the delete chunked and only after the media (`expired-events.test.ts`: 2,500 media, 320 empty events, a deadline mid-event resumes next run).
  - M14/N2 account deletion: events whole by keyset, the queue by `(deletion_requested_at, id)`, media pages per chunk, the event count a head count, an `unfinished` outcome (`account-deletion.test.ts`: a 1,200-event account, a 250-account queue behind 120 held accounts).
  - M16: `purge_media_rows` at most `MAX_ROWS` ids a call, one at a time (`reclaim.test.ts`: calls of 1,000, 1,000, 500; every sweep test asserts the max).
  - M17: the orphan check chunked with the R2 page pinned (`ORPHAN_LIST_PAGE` = `MAX_ROWS`, `orphans.test.ts`); the backup-prune confirm chunked, `MAX_BATCH` = `MAX_ROWS`, fail-closed on any chunk (`backup-prune/route.test.ts`; live: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/synced/prune-confirm-check.log`).
  - N1 `binHostedEvents`: the self arm whole by keyset, the operator arm's write-count kept with its comment (`account.test.ts`: 1,200 events binned).
  - H17 the backfill: every listed original's row and host read chunked BEFORE any R2 write (`node --check` clean; the policy walker passes it).
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (each with its reason under Questions): stopped early reads `attention` · the resume cursor rides `job_runs.counts` · 42 s shared equally · a parent-row sweep's failed rows fail the parent run · note text out of the parent's counts · inactivity filters `last_active_at` too · no deletion-queue cap · holds asked again before the event delete · H17 chunked by id with a local `inChunks` · the orphan sweep still restarts from the top (QA #37/#38).
- **Look at first:**
  - The dry numbers against the live data (every sweep's READ half on the service-role client wrapped to refuse any write; script `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/dry/sweeps.dry.test.ts`, output `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/synced/dry-run.json`): `standby_hosts` lists one host, willg97 at 46,619 bytes = the hand tally of 2,539,281 minus the 9 withdrawals' 2,492,662; the bin read whole is 31 rows and 46,619 bytes, and none of the probe's 5 withdrawals (nor any of the 9) is in it. The held events: 8 events scanned, none held, 0 held rows. Every other sweep has 0 candidates live today (no expired event, due removal, deletion request, pass holder, over-cap or inactive candidate).
  - ★ **Prod will fail its orphan sub-sweep until this ships**: from the first run after the probe's 1,200 objects pass 24 h (2026-09-25 04:00 UTC), a 1,000-object R2 page yields about 1,000 candidate ids in one `.in()`, which the live API refuses (one unchunked 1,000-id read answered 400: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-cron/unchunked-in-check.log`). It fails closed (throws before deleting) and shows red on `/admin/jobs` nightly until milestone 28 or the probe's removal.
  - `/admin/jobs` could not be viewed locally (admin plus AAL2 complete only on a real host); its one change (the Reported line leads with `remaining`, never prints `resume_after`) is test-pinned, not eyed; worth a glance on the alias.
