---
track: rowcap-album
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "30c3fecd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/media.ts
  - src/lib/db/queries/media.test.ts
  - src/lib/db/queries/reel.ts
  - src/lib/db/queries/reel.test.ts
  - src/lib/db/mutations/media.ts
  - src/lib/db/mutations/media.test.ts
  - src/lib/db/mutations/guest-media.ts
  - src/lib/db/mutations/guest-media.test.ts
  - src/app/(app)/dashboard/[eventId]/
  - src/app/api/events/
  - src/app/api/export/host/
  - src/app/api/reel/
  - src/lib/export/
  - src/lib/events/host-fingerprint.ts
  - src/lib/events/host-fingerprint.test.ts
  - src/components/reel/
  - src/lib/reel/
  - src/lib/event/
  - src/components/app/event-feed/
  - scripts/seed-demo-event.mjs
  - docs/systems/host-app.md
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

# lp/rowcap-album

**Goal.** The host's album is whole: the event hub, its counts, Review, the Deleted bin, the reel studio, the host export and the live poll read every item or count exactly, the bulk actions chunk, and the demo seed's wipe can never delete a held file.

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

**Your items.**
- **C1:** `listEventMedia` (`src/lib/db/queries/media.ts:54-66`), made whole on the `(created_at desc, id desc)` cursor. It has five callers: the hub (`[eventId]/page.tsx:143`), Review (`review/page.tsx:47`), the reel page (`reel/page.tsx:63`), the host export (`api/export/host/route.ts:78`) and the live poll (`api/events/[eventId]/live/route.ts:62`).
- **C2:** the hub's counts (`[eventId]/page.tsx:143, 168-169, 181-182, 201-207, 315, 323, 340`), taken from `.length` today, become head counts.
- **C3:** Review presigns the whole album (`review/page.tsx:51-56`) and then keeps the pending items. Make it a keyset read of pending items alone.
- **C4:** the reel studio (`use-reel-config.ts:135, 141-145` → `reel-studio.tsx:351-356`; its reorder guard answers `stale` for a member outside the window). It rides a whole C1. Confirm it with a test.
- **C5:** the host export whole (`api/export/host/route.ts:78-82`). `MAX_EXPORT_ITEMS = 2000` and `over_cap` (`src/lib/export/build-manifest.ts:18-19, 109-112` → a 413) must now fire past 2,000; the selected ids are already zod-capped at 2,000 (`route.ts:37`).
- **C6:** the live poll (`live/route.ts:62-86`) as head counts plus the newest `updated_at` in `hostEtag` (`src/lib/events/host-fingerprint.ts:43-61`), with no client change. `EventLive` reads only `etag` (`src/components/app/event-feed/event-gallery.tsx:376-379`).
- **C14:** `resolveReelRenderContext` (`src/lib/reel/render-service.ts:176-194`). Replace the event-wide media read with a `reel_items` embed (`media!reel_items_media_id_fkey!inner(...)`) filtered to approved, ordered by position and `added_at`, `.limit(150)`: filter to approved BEFORE the 150 slice, or the clips change. Bind the three errors the array destructure at `176-177` swallows. No caller reads `ctx.approved`.
- **H1:** the Deleted bin whole (`media.ts:88-114`; `actions.ts:340`, one presign an item at `:345`).
- **M8:** a guest's own uploads whole (`src/lib/db/mutations/guest-media.ts:138-156`, its error returning `[]`).
- **M9:** reel membership (`src/lib/db/queries/reel.ts:30-45`, its error returning `[]` at `:43`; plus `render-service.ts:178-183`). `add_to_reel` caps nothing: page it, or say why it is bounded.
- **M13:** the bulk actions (`src/lib/db/mutations/media.ts:174-180, 224-230, 262-268, 419-424, 443-450`) chunk their `.in("id", selection)` through `inChunks`. The server actions (`[eventId]/actions.ts:83-133`) take an uncapped `string[]`: cap it at the export's 2,000 with a clear refusal.
- **M18:** the demo seed's wipe (`scripts/seed-demo-event.mjs:529-532`) reads every row, held ones included, so `keepKeys` (`540, 553-555`) protects every held object. Today a held row past 1,000 loses its files to the R2 sweep (`558-561`). M16's call there (`569-577`) passes at most 1,000 ids to `purge_media_rows` per call.
- **Stale comment:** the "2 presigns" line in `src/lib/event/gallery-items.ts:39`, if yours.

**Look at first (your Handoff):** a script over `listEventMedia`, the Review read, the Deleted read and the export manifest on the admin client against the probe. It should show 1,165 non-removed rows (1,145 approved + 20 pending), 20 pending, 30 in the Deleted bin (the 5 withdrawn excluded), and an export summary of 1,145. Add the live poll's etag moving when one probe item's status changes (then restore it).

**Boundaries.** `rowcap-guest` owns the guest album's queries (`guest-events.ts`, `guest-events-admin.ts`), `src/lib/events/gallery-*` and `event-guests.ts`, `src/app/api/guests/`, `src/app/api/export/guest/`, `src/components/guest/`, `src/components/likes/`, `src/lib/guest/`, `src/app/(guest)/`, `src/lib/r2/grid-items.ts` and `guest-flow.md`. `rowcap-host` owns the other queries (`events`, `likes`, `pulse`, `social`, `metrics`, `moderation`, `reports`, `analytics`, `claims`, `support`, `applications`, `forensics`, `storage`, `guest-addresses`), `src/lib/dashboard/`, `src/lib/admin/`, `src/lib/metrics/`, `src/lib/stripe/revenue.ts`, the dashboard index, `dashboard/new/`, `account/`, every `src/app/admin/` page but `jobs/`, and `profiles-social.md`. `rowcap-cron` owns `src/app/api/cron/`, `src/lib/lifecycle/`, `mutations/account.ts`, `src/app/api/internal/`, `src/app/admin/jobs/`, `queries/jobs.ts`, `src/lib/jobs/`, `src/lib/forensics/legal-hold.ts`, `scripts/backfill-strip-exif.mjs`, `lifecycle-recovery.md`, `admin-observability.md` and `trust-safety-forensics.md`. Touch none of those (a caller of another lane's function stays as it is; its shape does not change). A new test goes beside its file as `<file>.test.ts`, the name your owns list. Never `src/lib/db/types.ts`, `read-all.ts`, `fake-postgrest.ts` or the policy test; never a migration or `apply_migration`; never a live write beyond reading the probe. If a fix needs a new SQL shape, stop that item and write it under Questions with the exact signature: the Orchestrator adds it. A system-doc fact outside your doc goes in your Handoff as the line to change. Your system doc: `docs/systems/host-app.md` (only the facts your files change).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

No open question and no new SQL shape: every call below was taken on the brief's recommended answer or the rules.
- **M8, the swallowed error.** Taken: a failed read still answers an empty list (the guest page never fails, or fails open, on it) and is now CAPTURED (`captureError("media", ..., { seam: "guest_media_ids_fail_closed" })` inside `mediaIdsForGuests`), `guest-gate.ts`'s "fail open, loudly" precedent. That puts one Sentry call in `src/lib/db/`, which `read-all.ts`'s header keeps out; the alternative (throw, let the caller capture) would 500 the guest page, whose callers are rowcap-guest's. Recommended: keep.
- **M13, the Review room's Approve all.** Taken: it hands the whole queue's ids to `approveBulkAction` in consecutive batches of 2,000 (`inBulkBatches`), so it approves exactly the uploads the host saw, at any queue size. Not `approveAllPending` (no id list, but it would approve arrivals the host never saw). Recommended: keep.
- **M13, the cap's reach.** Taken: all five bulk actions (approve, hide, show/hide, delete, Delete forever) refuse more than 2,000 ids, and non-uuid lists, before any write; the export route answers an oversized "Download selected" in the same sentence, so one selection meets one limit said one way. Recommended: keep.
- **C2, the Reel card.** Taken: its "N clips" is a head count too (`countReelItems`, the membership predicate), though C2's line list did not name it: the hub no longer reads the whole membership to say its size. Recommended: keep.
- **C6, what the newest `updated_at` covers.** Taken: the event's non-removed media only, so a write to a bin row never refreshes the hub (the bin loads on demand, never with the page). The prefix moved `h1-` to `h2-`. Recommended: keep.
- **C14 and M9, a tiebreak.** Taken: both the membership read and the render timeline order `(position, added_at, media_id)`: a bulk add ties positions, and the render hash must see one order on every phase. The open event's guest RPC still orders without `media_id` (a Deferred line). Recommended: keep.
- **The cursor's quoting.** Taken: this lane's composite cursors double-quote the timestamp and id (PostgREST's URL grammar reserves `.` and `:` in a value); rowcap-guest's `olderThan` writes them bare. Both parse live (my script: "cursor parse: bin ok, reel ok"; rowcap-guest read 1,145 in two pages). Recommended: keep; one form could be chosen in `read-all.ts`'s header.

## System-doc edits (in place, owned facts only)

`docs/systems/host-app.md`, in work commit `2a9a4d34`:
- The live hub: the poll is two RLS-scoped head counts and a one-row read, no list; the fingerprint (`h2-`) is the event id, the album count, the pending count and the newest `updated_at` among non-removed media; "a dozen queries plus three presigns an item".
- The album: the bin reads whole on `(removed_at desc, id desc)`.
- A new bullet: the hub reads the `album` slice whole and counts every number (`countEventMedia`, `countReelItems`); the slices `pending` (Review) and `live` (Download all, its 413 past 2,000).
- The Review room reads and presigns its `pending` slice alone.
- Approve all's real path (the queue's ids through `approveBulkAction` in batches of 2,000); the doc named `approveAllPending`, which is the moderation-off switch's path.
- The bulk mutations: selections through `inChunks`, and the 2,000 refusal (`MAX_BULK_ITEMS`).
- Reel reorder: both of the room's reads are whole, the members paged on `(position, added_at, media_id)`.
- The mint's render context: the timeline through a `media!inner` embed filtered to approved before the 150-clip bound, `media_id` breaking a tie.

Outside my doc: `docs/systems/uploads-and-r2.md` "Download all" may add "the host mint reads the album whole, so the ≤2000 cap refuses past it with a 413, and a Download selected past 2,000 answers 'Select up to 2,000 items at a time.'" (true now; optional). No other doc states a fact my files changed.

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Reel: `get_event_reel_by_qr_token` orders its item ids by `(position, added_at)` with no `media_id` tiebreak, where `listReelItems` and `resolveReelRenderContext` break the tie by `media_id`, so a bulk add's tied members can play in a different order on an open event's guest reel; add `r.media_id` to its `array_agg(... order by ...)` (moot if the reel round drops the stored reel first)."
- Now: "Performance: the hub's live poll reads the newest `updated_at` among an event's non-removed media with no `(event_id, updated_at)` index, a top-1 sort over the event's rows on every poll; past tens of thousands of items per event, `media (event_id, updated_at desc)` makes it an index walk."
- Now: "Engineering: `scripts/seed-demo-event.mjs` carries `readAllPages` in miniature (`readAllRows`) because `read-all.ts` imports `must-query` through the `@/` alias, which plain Node cannot resolve; a relative import there (or `QueryFailedError` in a leaf module) lets the scripts import the one helper."
- ROADMAP lines this lane moves (for the Orchestrator's fold): "Host: no test covers `useReviewTriage` or the bulk mutations" becomes "... `useReviewTriage`" (`src/lib/db/mutations/media.test.ts` covers the bulk mutations); the `no-swallowed-db-error` line's `render-service.ts:177` site is bound (`mustQuery` on both reads, `2a9a4d34`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/rowcap-album`:** work `2a9a4d34` (the lane) and `b18827a3` (the export route's refusal wording); sync `a4eb7b8b` (merge of `origin/launch-prep` at `8c7f8f15`, the stage-2 building record) and `b413ffa0` (merge at `90e170f2`, rowcap-guest merged: `docs/design/library.md` conflicted on its generated guard counts, resolved by `pnpm design:rules` on the merged tree). None of the merged changes touches my `reads`.
- **Gates on the synced tree (`b413ffa0`), each on its own exit code** (logs in the scratchpad, `gate3/`): `pnpm design:rules` 0 · `collect-specimens.mjs` 0 · the tree clean after both generators · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none in a touched file) · `pnpm test` 0 (397 files, 4,473 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3132` 0 (521 checks, 0 failing). No board, so no `lab:demo`. The dev server is stopped (port 3132 free).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, this file aside): `docs/design/library.md`, `docs/systems/host-app.md`, `scripts/seed-demo-event.mjs`, `src/app/(app)/dashboard/[eventId]/actions.test.ts`, `src/app/(app)/dashboard/[eventId]/actions.ts`, `src/app/(app)/dashboard/[eventId]/page.tsx`, `src/app/(app)/dashboard/[eventId]/reel/page.tsx`, `src/app/(app)/dashboard/[eventId]/review/page.tsx`, `src/app/(dev)/design/rules/rules.generated.json`, `src/app/api/events/[eventId]/live/route.test.ts`, `src/app/api/events/[eventId]/live/route.ts`, `src/app/api/export/host/route.test.ts`, `src/app/api/export/host/route.ts`, `src/components/app/event-feed/event-gallery.tsx`, `src/components/app/event-feed/event-hub.test.tsx`, `src/components/app/event-feed/use-review-triage.ts`, `src/components/app/host-media-grid.tsx`, `src/components/reel/use-reel-config.test.tsx`, `src/lib/db/mutations/guest-media.test.ts`, `src/lib/db/mutations/guest-media.ts`, `src/lib/db/mutations/media.test.ts`, `src/lib/db/mutations/media.ts`, `src/lib/db/queries/media.test.ts`, `src/lib/db/queries/media.ts`, `src/lib/db/queries/reel.test.ts`, `src/lib/db/queries/reel.ts`, `src/lib/event/bulk-selection.test.ts`, `src/lib/event/bulk-selection.ts`, `src/lib/event/gallery-items.ts`, `src/lib/events/host-fingerprint.test.ts`, `src/lib/events/host-fingerprint.ts`, `src/lib/reel/render-service.test.ts`, `src/lib/reel/render-service.ts`. **Exceptions:** `docs/design/library.md` and `rules.generated.json`, regenerated by the gate's `pnpm design:rules` because two `@contract-for` tests in my owns changed their guard counts (`host-fingerprint.test.ts`, the live route and the fingerprint 13 -> 16 each); generated, never hand-edited. `src/components/app/host-media-grid.tsx` (no lane's file), ONE statement: the bulk Delete's failure toast shows the action's message (`res.message || ...`, as the Hide/Show toast beside it already does), so the 2,000 refusal reads as a sentence and not "Please try again"; prettier wraps it to three lines.
- **Markers:** `git grep -n "row-cap-todo" -- <owns>` lists nothing (C1, H1, C14, M9, M8, M13, M18 removed); the two permanent `// row-cap:` lines in `guest-media.ts` (a session token's one guest row, an account's handful) were the kit's and stay. `row-cap-policy.test.ts` green.
- **C1:** `readEventMedia(client, eventId, slice)` pages `(created_at desc, id desc)` through `readAllPages` (the raw timestamp and id, quoted), sliced `live` / `album` / `pending`; `listEventMedia` is it on the request's client. The five callers: the hub `album`, Review `pending`, the reel room `album`, the export `live`, the live poll none (counts). Live: 1,165 rows in display order.
- **C2:** the header, the Review card, the album's count, `EventUploads` and `EventSheets` read `countEventMedia` (two head counts), the Reel card `countReelItems`; the hub presigns the album slice alone. Contract `event-hub.test.tsx` reshaped: it pins the counted number, never a `.length`.
- **C3:** Review reads and presigns the `pending` slice alone, whole.
- **C4:** confirmed by `src/components/reel/use-reel-config.test.tsx`: the real controller over 2,222 items and 1,300 members, the reel's first slots the album's OLDEST photographs, yields all 1,300 and commits all 1,300 to `reorder_reel`; plus a source pin that the room feeds both whole reads unfiltered. (The component project cannot import `server-only`, so the reads' own wholeness is pinned in `media.test.ts` / `reel.test.ts`.)
- **C5:** the export reads the album whole; `route.test.ts`: a 2,500-item summary counts every item, 2,300 approved answers the 413, 1,999 mints all 1,999, a selection reaching past the newest 1,000 mints whole, 2,001 ids are refused in words.
- **C6:** `hostEtag({ eventId, album, pending, newestUpdatedAt })`, `h2-`; the route reads two head counts and one row and keeps `{ ok, etag, pending, count }` (no client change). `live/route.test.ts` on the fake: the oldest photograph hidden moves it, a held upload moves it, an arrival plus a removal moves it, a bin write does not, 304 otherwise. Contract `host-fingerprint.test.ts` reshaped to the counts, plus "counts the album and lists none of it".
- **C14:** `resolveReelRenderContext` reads `reel_items` with `media!reel_items_media_id_fkey!inner(status)`, `.eq("media.status","approved")`, `(position, added_at, media_id)`, `.limit(150)`; both reads through `mustQuery` (the destructure is gone); `ctx.approved` removed. `render-service.test.ts`: a 1,300-member reel whose first 400 are one approved in four fills all 150 from further down (slicing first would leave 38), one request of 150 rows, no media read, errors throw. The password arm of the guest reel (rowcap-guest's C10) reads its ids through this.
- **H1:** the bin pages `(removed_at desc, id desc)`; `media.test.ts` walks a 1,150-row shared bulk-Delete stamp and 2,150 host removals whole, withdrawals and aged rows out.
- **M8:** `mediaIdsForGuests` pages on `id` inside `inChunks` over the guest rows; a failure is `[]` plus a capture. `guest-media.test.ts`: 2,160 and 2,250 live uploads whole, the failure captured.
- **M9:** `listReelItems` pages `(position, added_at, media_id)` and throws on a failed read; `add_to_reel` caps nothing, so it pages. `reel.test.ts`: ghosts dropped, hidden kept, 2,300 members across a full (position, added_at) tie at the boundary, the error.
- **M13:** every bulk write and Delete forever's two reads go through `inChunks` (one removal stamp across chunks); the five actions refuse > 2,000 or non-uuid lists in words (`src/lib/event/bulk-selection.ts`); Review batches at 2,000. `mutations/media.test.ts` (2,500-id selections in 17 chunks under 8,000 characters, the pending predicate, held objects kept, a failed hold check deleting nothing), `actions.test.ts`, `bulk-selection.test.ts`.
- **M18:** the wipe reads every row on an `id` keyset (`readAllRows`, `readAllPages` in miniature: the script cannot import the TS helper), so `keepKeys` holds every held object; `purge_media_rows` gets at most 1,000 ids a call.
- **Stale comments made true:** `gallery-items.ts` (three presigns), the bin action's "round trip", `EventLive`'s and the live route's "one select" and "eleven queries", `reel.ts`'s header (the reel room seeds the provider, the hub counts).
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (the `updated_at` index is a Deferred line, not needed at today's sizes).
- **Calls his to overrule:** the seven under Questions; and the contract reshapes named in C2 and C6.
- **Look at first:** the probe, read by this lane's functions on the admin client (scratch script `look/probe.look.ts`, run 2026-09-24T01:53Z; the read part re-run on the final tree at 02:18Z, same numbers):
  - `listEventMedia (live): 1165 rows (1145 approved + 20 pending + 0 hidden), unique 1165, display order true`
  - `readEventMedia (album slice): 1145` · `Review (pending slice): 20` · `Deleted bin: 30 (withdrawn in it: 0)`
  - `export summary: shown photo 1145 (750731 B); Include hidden adds 20` · `hub counts (head counts): album 1145, pending 20`
  - the live poll, through the real `GET` handler: `poll 1: 200 {"pending":20,"count":1145}` · `poll 2 (If-None-Match): 304` · the oldest pending item `fd853738-d18d-4893-9833-e2e04ea02da8` flipped pending -> hidden: `poll 3: 200 {"pending":19,"count":1146}` (moved) · restored to pending: `poll 4: 200 {"pending":20,"count":1145}`, the etag still differs from poll 1 (the write moved `updated_at` with the counts back where they were) · `poll 5: 304`.
  - The one live write: that item's status, hidden and back, twice (two runs of the script), restored both times and checked by SQL (pending 20, approved 1,145, removed 30 + 5 withdrawn); pending and hidden are both invisible to guests, so the guest album never changed. Its `updated_at` advanced.
  - The host pages themselves render behind a sign-in the local server cannot do (`/dashboard/<probe>` answers 307 to `/login` signed out); nothing on them changed visually (the same numbers, the same components).
