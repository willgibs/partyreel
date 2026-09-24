---
track: rowcap-guest
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "30c3fecd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events.test.ts
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/db/queries/guest-events-admin.test.ts
  - src/lib/events/gallery-access.server.ts
  - src/lib/events/gallery-access.server.test.ts
  - src/lib/events/gallery-access.ts
  - src/lib/events/gallery-access.test.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/lib/events/gallery-fingerprint.test.ts
  - src/lib/events/event-guests.ts
  - src/lib/events/event-guests.test.ts
  - src/app/api/guests/
  - src/app/api/export/guest/
  - src/components/guest/
  - src/components/likes/
  - src/lib/guest/
  - src/app/(guest)/
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.test.ts
  - src/lib/r2/grid-items.email-safety.test.ts
  - docs/systems/guest-flow.md
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

# lp/rowcap-guest

**Goal.** Guests see the whole album: the open album through the paged RPC, the password album through the composite cursor, the header count exact and live at every access level, the guest reel and the guest export whole, and the hearts through a POST-body lookup instead of a thousand-id URL.

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
- **C7:** `src/lib/db/queries/guest-events.ts:171-190`. Read `get_event_media_by_qr_token` through `readAllPages` with `p_limit` and the `(p_before_created_at, p_before_id)` cursor, carrying `created_at` through `GuestMediaRow` (it drops it today, `:155-165, :181-189`). The ORDER is load-bearing: `merge-gallery-items.ts:13-20`, `reconcile-gallery-items.ts:31` and `toGridItems` keep server order, and the ETag hashes ids in order (`src/lib/events/gallery-access.server.ts:215-224`). Keep newest-first exactly. The only caller is `loadGalleryRowsForAccess` (`gallery-access.server.ts:189`), used by the page (`e/[token]/page.tsx:235`), the poll (`api/guests/gallery/route.ts:149`) and the guest export (`api/export/guest/route.ts:101`).
- **C8:** `src/lib/db/queries/guest-events-admin.ts:32-53` (`getApprovedMediaForUnlock`, password events), the same cursor as a table read.
- **C9:** the album header's count (`src/components/guest/live-gallery.tsx:741-751`; `event-experience.tsx:247, 1138`). At full access the effect at `749-751` replaces the SSR `approvedTotal` (a head count, `guest-events-admin.ts:116-130`, computed only at SSR, `page.tsx:261`) with `items.length`. The poll's 200 (`route.ts:188-197`) carries no `approvedTotal`. Make the header exact and live at every access level. Your call how, stated in the Handoff; bump the ETag version if the fingerprint changes.
- **C10:** the guest reel (`src/components/guest/guest-reel-overlay.tsx:110, 143-162`; `build-reel-props.ts:65-67` drops an id missing from `byId`). Open events come whole with C7. Password events resolve their reel ids through `resolveReelRenderContext` (`src/lib/reel/guest-reel.ts:87-104`), which `rowcap-album` fixes (C14): confirm the password arm after syncing past it, or say it waits.
- **C11:** the guest export (`src/app/api/export/guest/route.ts:101-118`). The `.in("id", ids)` at `110-116` carries up to the whole album, and `sizeById.get(r.id) ?? 0` at `:122` under-counts the 20 GB cap silently when C7 grows. Read the sizes whole by keyset (or chunk), in the same commit as C7.
- **M12:** the hearts (`src/components/likes/likes-provider.tsx:112-115`): `.in("media_id", <every visible id>)` from the browser, its error swallowed at `:111`, re-sent on every change of the visible set. Use `my_liked_media_ids(uuid[])` with the ids in the POST body, and bind the error. The host hub feeds it too (`event-uploads.tsx:55`), so it must land with C1, which `rowcap-album` makes whole.
- **Helper convergence:** `getUploaderIdentities` (`guest-events-admin.ts:206-263`) onto `readAllPages`.
- **Stale comments:** `src/lib/r2/grid-items.ts:3-5`, `src/lib/event/gallery-items.ts:39` and `e/[token]/page.tsx:232-233` say two presigns per item; the code mints three. If `grid-items.ts` or `gallery-items.ts` are not in your owns, list the line for the Orchestrator.
- **Not this round** (ROADMAP lines the Orchestrator files): the poll's 304 reads the album and the identity sweep before comparing (a per-event change signal), a presign cache, a paged album.

**Look at first (your Handoff):** the probe's album on localhost signed out, with the header's count, the oldest photo `p0021`... reached (`p0001-p0020` are pending and `p0021-p0050` removed, so the oldest approved is the first non-withdrawn after `p0050`), and the poll's item count (1,145) and 304 on a repeat.

**Boundaries.** `rowcap-album` owns `media.ts`, `reel.ts`, `mutations/{media,guest-media}.ts`, `src/app/(app)/dashboard/[eventId]/`, `src/app/api/events/`, `src/app/api/export/host/`, `src/app/api/reel/`, `src/lib/export/`, `host-fingerprint.ts`, `src/components/reel/`, `src/lib/reel/`, `src/lib/event/`, `src/components/app/event-feed/`, `scripts/seed-demo-event.mjs` and `host-app.md`. `rowcap-host` owns the other queries (`events`, `likes`, `pulse`, `social`, `metrics`, `moderation`, `reports`, `analytics`, `claims`, `support`, `applications`, `forensics`, `storage`, `guest-addresses`), `src/lib/dashboard/`, `src/lib/admin/`, `src/lib/metrics/`, `src/lib/stripe/revenue.ts`, the dashboard index, `dashboard/new/`, `account/`, every `src/app/admin/` page but `jobs/`, and `profiles-social.md`. `rowcap-cron` owns `src/app/api/cron/`, `src/lib/lifecycle/`, `mutations/account.ts`, `src/app/api/internal/`, `src/app/admin/jobs/`, `queries/jobs.ts`, `src/lib/jobs/`, `src/lib/forensics/legal-hold.ts`, `scripts/backfill-strip-exif.mjs`, `lifecycle-recovery.md`, `admin-observability.md` and `trust-safety-forensics.md`. Touch none of those (a caller of another lane's function stays as it is; its shape does not change). A new test goes beside its file as `<file>.test.ts`, the name your owns list. Never `src/lib/db/types.ts`, `read-all.ts`, `fake-postgrest.ts` or the policy test; never a migration or `apply_migration`; never a live write beyond reading the probe. If a fix needs a new SQL shape, stop that item and write it under Questions with the exact signature: the Orchestrator adds it. A system-doc fact outside your doc goes in your Handoff as the line to change. Your system doc: `docs/systems/guest-flow.md` (only the facts your files change).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

No open question; every call below was taken on the brief's recommended answer or the rules, and none needed a new SQL shape.
- **C9, how the header stays exact and live.** Taken: the album's head count (`countApprovedMedia`, request-scoped `cache()`) rides every gallery payload (the render's and each poll's 200, at `teaser` and `full`) and the ETag hashes it (`g4` -> `g5`); `LiveGallery` shows it plus this device's own changes since that payload (`albumCount`: an optimistic tile in, the guest's own removal out). Recommended: keep. The alternative (at `full`, `items.length` of a whole read) breaks rule 2 and cannot move a teaser.
- **C9 at `none`.** Taken: the locked page's "N photos & videos inside" stays the render's exact head count, not live (a locked page mounts no gallery and runs no poll by design). Recommended: keep; live would put the doorbell on the lock screen for a tease.
- **The door's count.** Taken: the entry sheet's `mediaTotal` is the header's live number (`mediaCount`), not the render's stats, so a door opened over the teaser never says a different size than the line beside it. Recommended: keep.
- **C11, an id with no size.** Taken: it leaves the export (a row purged between the album read and the size read) instead of counting as zero bytes or failing the export. Recommended: keep; a failed chunk still aborts the whole export.
- **M12, the seed.** Taken: only the ids not yet answered are asked (a poll's one new photograph asks one id); a failed seed goes to Sentry (`captureError("media", QueryFailedError)`) with no toast and the ids stay unasked for the next change. Recommended: keep.

## System-doc edits (in place, owned facts only)

`docs/systems/guest-flow.md`, all in work commit `a8250063`:
- "Stats": the media count is `countApprovedMedia`, shared by the stats and the gallery payload; N points at "One true count".
- The like line: the hearts seed through `my_liked_media_ids` (ids in the POST body, only the unanswered ones, a failure reported).
- "Gallery access", `full`: read whole, in one order, by either arm (the RPC's `(p_before_created_at, p_before_id, p_limit)`, the table's `olderThan`).
- "One true count" rewritten: exact and live at `teaser` AND `full`, the ETag hashing it, the CTA and the door saying it, the fallback, and `none` staying the render's count.
- "The conditional poll": a 304 still runs the fingerprint's reads; the ETag invariant lists `approvedTotal`.
- Outside my doc, none: `database-security.md` already states `my_liked_media_ids`. One code comment outside my owns: `src/lib/event/gallery-items.ts:39` (rowcap-album's) says "Two presigned URLs per item from one key"; it mints three (the preview when the row has one).

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Likes: the album's bulk Like (`likeMany`, `likes-provider.tsx`) fires one `like_media` per selected id, all at once, so a whole large album selected is that many parallel requests; a `like_many(uuid[])` with the ids in the body."

## Handoff (replaces the chat report)

- **Commits, pushed:** work `a8250063`; sync `2d0d26db` (merge of `origin/launch-prep` at `8c7f8f15`, the stage-2 building record, which touches none of my reads).
- **Gates on the synced tree (`2d0d26db`), each on its own exit code:** `pnpm design:rules` 0 · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none in a touched file) · `pnpm test` 0 (389 files, 4,405 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3131` 0 (522 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, this file aside): `docs/design/library.md`, `docs/systems/guest-flow.md`, `src/app/(dev)/design/rules/rules.generated.json`, `src/app/(guest)/e/[token]/page.tsx`, `src/app/api/export/guest/route.test.ts`, `src/app/api/export/guest/route.ts`, `src/app/api/guests/gallery/route.test.ts`, `src/app/api/guests/gallery/route.ts`, `src/components/guest/event-experience.tsx`, `src/components/guest/live-gallery.test.tsx`, `src/components/guest/live-gallery.tsx`, `src/components/likes/likes-provider.test.tsx`, `src/components/likes/likes-provider.tsx`, `src/lib/db/queries/guest-events-admin.test.ts`, `src/lib/db/queries/guest-events-admin.ts`, `src/lib/db/queries/guest-events.test.ts`, `src/lib/db/queries/guest-events.ts`, `src/lib/events/gallery-access.server.test.ts`, `src/lib/events/gallery-access.server.ts`, `src/lib/events/gallery-fingerprint.test.ts`, `src/lib/events/gallery-fingerprint.ts`, `src/lib/r2/grid-items.ts`. **Exceptions:** `docs/design/library.md` and `rules.generated.json`, regenerated by the gate's `pnpm design:rules` because `live-gallery.test.tsx` (a `@contract-for` test in my owns) gained nine contract lines (27 -> 36 guards); generated, never hand-edited.
- **Markers:** `git grep -n "row-cap-todo" -- <owns>` lists nothing (C7, C8, C11, M12 removed); `row-cap-policy.test.ts` green.
- **C7:** `getEventMediaByQrToken` reads `get_event_media_by_qr_token` through `readAllPages` with `p_limit` and the raw `(created_at, id)` cursor (`albumCursorOf`); `GuestMediaRow` carries `created_at`. Live: the probe's poll went from 1,000 to 1,145 items.
- **C8:** `getApprovedMediaForUnlock` pages the same order as a table read with `olderThan` (the composite `.or()`, the timestamp unquoted). Live, read-only, on the probe by script: 1,145 rows in two pages, the RPC's exact order.
- **C9:** the head count on every payload and in the ETag (`g5`), `albumCount` on the client, the door on the header's number, the teaser's id tiebreak (above). Live: header "1145 photos & videos from 3 guests", the poll's `approvedTotal` 1,145, the door "1145 are already inside".
- **C10:** open events are whole through C7 (the overlay's `byId` is the whole album). The password arm's reel ids come from `resolveReelRenderContext`, rowcap-album's C14, not merged at my sync: it waits; its `byId` side is whole through C8.
- **C11:** sizes through `inChunks` (150 ids a request), an unmeasured id left out. Live: the probe's summary is 1,145 photos, 750,731 bytes, equal to a direct DB tally.
- **M12:** `my_liked_media_ids` with the ids in the POST body, the error bound and reported, only unanswered ids asked. Live, read-only: anon is refused (42501); a 100,000-id body (3.9 MB) answers 200. ★ It must merge with rowcap-album's C1 (the host hub feeds `LikesProvider` a whole album).
- **Helper convergence:** `getUploaderIdentities` onto `readAllPages` (`IDENTITY_PAGE` retired with its hand-rolled test).
- **Stale comments:** `grid-items.ts:3-5`, `page.tsx:232-233`, the fingerprint's "~120 presigns", the poll route's "one rows query", `likes-provider.tsx`'s header; `gallery-items.ts:39` is listed above for rowcap-album.
- **Tests (fake PostgREST, fixtures past 2,000):** `guest-events.test.ts` (C7: 2,400 and 2,100 rows, a tie across the page boundary, the raw cursor, the error), `guest-events-admin.test.ts` (C8 at 2,600 and a boundary tie, identities at 2,500, the head count at 2,400, the teaser), `export/guest/route.test.ts` (2,300 ids in 16 chunks under the URL limit, the unchunked shape failing, an unmeasured row, a failed chunk), `likes-provider.test.tsx` (2,500 ids in one body; the fake cannot answer a scalar `uuid[]`, so the mock routes by name), `live-gallery.test.tsx` (`albumCount` and the live count), `gallery-access.server.test.ts`, `gallery-fingerprint.test.ts`, the poll's `route.test.ts`.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the five under Questions.
- **Look at first:** `pnpm dev -p 3131`, then `/e/d02631f1bfb3455188d224e41bf9510f` signed out (the door holds the album; its welcome says 1,145): the header reads 1,145, and the album's foot is the oldest approved photo, **p0053** (`075d11d2-0e13-4a46-8249-4d3c05e08a0b`; p0001-p0020 pending, p0021-p0050 host-removed, p0051, p0052 and p0054-p0056 the five withdrawn). Then `POST /api/guests/gallery {"qr_token":"d02631f1bfb3455188d224e41bf9510f"}`: 200 with 1,145 items and `approvedTotal` 1,145; the same with `If-None-Match` its `"g5-..."` ETag: 304, 0 bytes.
