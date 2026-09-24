---
track: rowcap-cron
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
