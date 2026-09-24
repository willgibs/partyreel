---
track: rowcap-host
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "30c3fecd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/events.ts
  - src/lib/db/queries/events.test.ts
  - src/lib/db/queries/likes.ts
  - src/lib/db/queries/likes.test.ts
  - src/lib/db/queries/pulse.ts
  - src/lib/db/queries/pulse.test.ts
  - src/lib/db/queries/social.ts
  - src/lib/db/queries/social.test.ts
  - src/lib/db/queries/metrics.ts
  - src/lib/db/queries/metrics.test.ts
  - src/lib/db/queries/moderation.ts
  - src/lib/db/queries/moderation.test.ts
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/lib/db/queries/analytics.ts
  - src/lib/db/queries/analytics.test.ts
  - src/lib/db/queries/claims.ts
  - src/lib/db/queries/claims.test.ts
  - src/lib/db/queries/support.ts
  - src/lib/db/queries/support.test.ts
  - src/lib/db/queries/applications.ts
  - src/lib/db/queries/applications.test.ts
  - src/lib/db/queries/forensics.ts
  - src/lib/db/queries/forensics.test.ts
  - src/lib/db/queries/storage.ts
  - src/lib/db/queries/storage.test.ts
  - src/lib/db/queries/guest-addresses.ts
  - src/lib/db/queries/guest-addresses.test.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/lib/dashboard/
  - src/lib/admin/
  - src/lib/metrics/
  - src/lib/stripe/revenue.ts
  - src/lib/stripe/revenue.test.ts
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/new/
  - src/app/(app)/account/
  - src/app/admin/accounts/
  - src/app/admin/albums/
  - src/app/admin/announcements/
  - src/app/admin/applicants/
  - src/app/admin/error.tsx
  - src/app/admin/exports/
  - src/app/admin/forensics/
  - src/app/admin/layout.tsx
  - src/app/admin/metrics/
  - src/app/admin/not-found.tsx
  - src/app/admin/page.tsx
  - src/app/admin/reels/
  - src/app/admin/reports/
  - src/app/admin/security/
  - src/app/admin/support/
  - docs/systems/profiles-social.md
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

# lp/rowcap-host

**Goal.** The host's dashboard and the admin read whole and count exactly: like counts, the event cards and their covers, the pulse, the admin metrics, moderation, reports, the operator queue, MRR, the event lists, follows and blocks, the claim card and forensics.

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
- **C12:** like counts (`src/lib/db/queries/likes.ts:17`, the map at `:22`), paged through `get_event_like_counts(p_event_id, p_after, p_limit)`, which now returns liked media only. The readers default a missing id to 0: `gallery-items.ts:72`, `quick-add.ts:231-245`, `reel-builder.tsx:84`, `studio-moments-picker.tsx:66`. Confirm that and keep it.
- **C13:** the event cards (`src/lib/db/queries/events.ts:202-214`) through `event_card_stats(uuid[])`. The cards' "N items" and "N to review" and the next-step band (`dashboard/page.tsx:150, 197-209, 221-234`) keep their shape.
- **C15 and N3:** the pulse (`src/lib/db/queries/pulse.ts:86-109`; `src/lib/dashboard/arrivals.ts:38-42, 66-71`). "N in the last hour" and "N today" count over a 240-row window, so they top out at 240: make them head counts. The per-event strips (`pulse.ts:119-126`) come from the same window, so an event outside the newest 240 gets none. Fix the wrong comments at `pulse.ts:5-9` and `55-62`.
- **H2 and H3:** covers through `event_covers(uuid[])` for the dashboard (`events.ts:104-141`) and `adminCoverUrls` (`src/lib/db/queries/social.ts:535-563`, which presigns the full-size original today: take the preview when there is one). Every card gets its cover.
- **H4:** the admin metrics (`src/lib/db/queries/metrics.ts:126-132`) through `admin_metrics_snapshot()`. The head counts at `:133-165` stay. The consumers are `src/lib/admin/kpi.ts:43-116`, `src/app/admin/page.tsx:35-47` and `/admin/metrics`.
- **H5:** moderation (`src/lib/db/queries/moderation.ts:123-140`): the album whole, the per-status counts counted.
- **H6:** reports (`src/lib/db/queries/reports.ts:47-54, 71-74, 83-94, 150-157, 169-172`): a limit with a load-more, `.in()` chunked, and the sequential presigns at `88-94` made parallel.
- **H7:** the operator queue (`src/lib/admin/queue-data.ts:25-28, 38-44`): "oldest waiting" as `order asc limit 1` per inbox, and no `.catch(() => [])` that hides a failure.
- **H16:** MRR (`src/lib/stripe/revenue.ts:39-41`): `autoPagingToArray({ limit: 1000 })` becomes a `for await` with no cap.
- **M1:** `listEvents` (`events.ts:52-56`) whole, with the counts at `dashboard/page.tsx:121, 160` counted. It has two more readers: `dashboard/new/page.tsx:38` and `u/[slug]/owner-sections.tsx:58`.
- **M2:** `events.ts:166-171` whole.
- **M3:** `.in(event_id, <every event>)` at `events.ts:116, 205` and `pulse.ts:89, 179` becomes `events!inner(host_id)`.
- **M4:** `analytics.ts:15-29` through the aggregate `rowcap-sql` shipped.
- **M5:** follows and blocks whole (`social.ts:198-202`, `297-301`, `349-352`). `221-225` and `1087-1095` have no caller: delete them, or say why they stay.
- **M6:** the `.in()` over events and hosts at `social.ts:717-723, 764-769, 776`, chunked.
- **M7:** the claim card (`src/lib/db/queries/claims.ts:58`) through the paged `list_guest_rows_by_email`.
- **M10:** the admin inboxes (`support.ts:20-26`, `applications.ts:23-29`): a limit with a load-more.
- **M11:** forensics (`forensics.ts:69-89`) whole, binding the errors the destructure at `:83` drops.
- **Helper convergence:** `social.ts`' offset `readAll` (`:88-115`, a count on every page) and `src/lib/db/queries/guest-addresses.ts:50-117` onto the keyset helper.
- **N4 (new, from the kit):** `social.ts` `getPublicProfileAttendedCoverUrls`: its three gate reads (markers at `:484`, `:502`, `:516`) put every attended event id from `get_public_profile` (an unbounded jsonb list) in one URL. Chunk them, or read through `event_covers(uuid[])` if that covers the gate.
- **Two swallowed errors** the lint rule cannot see (an array destructure off `Promise.all`): `forensics.ts:85` (with M11) and `src/app/admin/forensics/export/route.ts:101`. Bind both, so a failed read is an error and never an empty page or an evidence record without its media row.
- `social.ts:163`'s permanent marker (hand-chunked at `PROFILE_CARD_BATCH`, 150) may become an `inChunks` call.
- **Retire `tallyStorageRows`** in `src/lib/db/queries/storage.ts` (header lines 8, 39, 47, 51). It has no caller, and it defines standby without delete-final's withdrawal rule. It is a ROADMAP Now line.

**Look at first (your Handoff):**
- A script over willg97's card stats and covers on the admin client: the probe's card reads 1,145 items with 20 to review, and every one of willg97's events has a cover.
- The like counts for the probe's three liked items.
- `/admin` and `/admin/metrics` rendering from the snapshot (a local admin sign-in is impossible, so prove the figures with the snapshot function's output against a hand count).

**Boundaries.** `rowcap-guest` owns the guest album's queries (`guest-events.ts`, `guest-events-admin.ts`), `src/lib/events/gallery-*` and `event-guests.ts`, `src/app/api/guests/`, `src/app/api/export/guest/`, `src/components/guest/`, `src/components/likes/`, `src/lib/guest/`, `src/app/(guest)/`, `src/lib/r2/grid-items.ts` and `guest-flow.md`. `rowcap-album` owns `media.ts`, `reel.ts`, `mutations/{media,guest-media}.ts`, `src/app/(app)/dashboard/[eventId]/`, `src/app/api/events/`, `src/app/api/export/host/`, `src/app/api/reel/`, `src/lib/export/`, `host-fingerprint.ts`, `src/components/reel/`, `src/lib/reel/`, `src/lib/event/`, `src/components/app/event-feed/`, `scripts/seed-demo-event.mjs` and `host-app.md`. `rowcap-cron` owns `src/app/api/cron/`, `src/lib/lifecycle/`, `mutations/account.ts`, `src/app/api/internal/`, `src/app/admin/jobs/`, `queries/jobs.ts`, `src/lib/jobs/`, `src/lib/forensics/legal-hold.ts`, `scripts/backfill-strip-exif.mjs`, `lifecycle-recovery.md`, `admin-observability.md` and `trust-safety-forensics.md`. Touch none of those (a caller of another lane's function stays as it is; its shape does not change). A new test goes beside its file as `<file>.test.ts`, the name your owns list. Never `src/lib/db/types.ts`, `read-all.ts`, `fake-postgrest.ts` or the policy test; never a migration or `apply_migration`; never a live write beyond reading the probe. If a fix needs a new SQL shape, stop that item and write it under Questions with the exact signature: the Orchestrator adds it. A system-doc fact outside your doc goes in your Handoff as the line to change. Your system doc: `docs/systems/profiles-social.md` (the dashboard's and the admin's facts in `host-app.md` and `admin-observability.md` go in your Handoff as lines, since other lanes own those docs) (only the facts your files change).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- None new: no fix needed a new SQL shape. Every call taken on the brief's recommendation is under "Calls his to overrule" below.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: the data layer's read rules (keyset pages, `inChunks`, `social.test.ts` past 2,000 rows); profile cards through `inChunks`; the attended covers' gates never put the attended list in one URL; every card cover is `event_covers`, the preview when there is one; the graph's only readers (no followers list, no followed-hosts feed).
- Lines for other lanes' docs, the Orchestrator's to place:
  - `host-app.md`, the "Just arrived" bullet, after "captioned with the window it settled on ([`arrivals.ts`](...))": "; the window's number is a HEAD count over every approved upload of the host's live events, never a read's length, and the row view's newest four are read per event (one row per event, the four embedded), so every event has its strip".
  - `host-app.md`, the "Your events" bullet, append: "The cards' counts are `event_card_stats` and their covers `event_covers` (one jsonb each for any number of events, the ids in the POST body); \"X of N used\" is `countActiveEvents()`, a head count."
  - `host-app.md`, the Guest cards sentence: "a cover (the newest approved photograph, `adminCoverUrls`)" becomes "a cover (the newest approved photograph through `event_covers`, its preview when it has one)".
  - `admin-observability.md`, Support / Applicants, append: "Each inbox shows its newest 50 and says so under the list; Show 50 more deepens it through the URL's `?show=` (`lib/admin/list-depth.ts`, `ShowMoreLine`), which every row link carries."
  - `admin-observability.md`, Reports, append: "Each arm shows its newest 50 with the same line (one `?show=` for both arms); its event, media and profile lookups ride `inChunks` and its presigns run at once."
  - `admin-observability.md`, Albums, append: "The drill-in reads the album whole and its status line is four HEAD counts."
  - `admin-observability.md`, Overview, append: "The four figures are `admin_metrics_snapshot()`'s counted fortnight (the operator left out in SQL); each inbox's age is one row, oldest first, and a failed read throws to the portal's error screen, never an undated row."
  - `admin-observability.md`, Metrics: "The migration-free service-role aggregator" becomes "The service-role aggregator (`admin_metrics_snapshot()`, one jsonb, plus HEAD counts)", and after "read LIVE (`getPlatformRevenue`": "over every active subscription (`for await`)".
  - `trust-safety-forensics.md`, the Admin bullet, after "reads in [`db/queries/forensics.ts`](...)": " (every hold read whole, its lookups chunked; a failed count or lookup throws, and the record export fails with an error audit row when its media or event read fails)".

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `fake-postgrest` reads a dotted filter on a TO-MANY embed (`media.status` on `events -> media`) as a filter on the parent and drops the row; teach it to filter the embedded rows, so the pulse's strip read can take the plain `.eq("media.status", ...)` form (`pulse.ts` writes one `media.or=` logic tree today).
- Admin: the album drill-in (`/admin/albums/[eventId]`) reads and presigns every item (2,500 tiles for 2,500 items); a paged drill-in past a few thousand, beside the Albums line.
- ROADMAP lines this lane settles, the Orchestrator's to edit: delete "Code hygiene: `src/lib/db/queries/storage.ts`'s `tallyStorageRows` ..." (retired) and "Social: `adminCoverUrls` (`queries/social.ts`) reads every approved photo ..." (it reads `event_covers`); drop `getFollowedHostEventCards` from "Housekeeping: more files with no importer ..." (deleted); "The follow graph has no consumer worth the graph: ..." becomes "the Following chip left the dashboard and no query reads your followers or the events of the hosts you follow; a followed-hosts feed is new work"; "Engineering: `partyreel/no-swallowed-db-error` misses an array destructure ...": `forensics.ts:85` and `admin/forensics/export/route.ts:101` are bound, `render-service.ts:177` is rowcap-album's.

## Handoff (replaces the chat report)

- **Commits:** work `bfd74371`, sync merge `0f3f4a99` (origin/launch-prep moved: `rowcap-guest` merged at `04ef2e02`; only the two generated Library files conflicted, on counts, and `pnpm design:rules` regenerated both on the merged tree). Both pushed.
- **Gates on the synced tree**, each on its own exit code (logs: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-host/synced/`): `pnpm design:rules` 0 · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none in a touched file) · `pnpm test` 0 (404 files, 4,488 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3133` 0 (521 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD` pasted (plus this file, committed with the handoff):

  ```
  docs/design/library.md
  docs/systems/profiles-social.md
  src/app/(app)/dashboard/new/page.tsx
  src/app/(app)/dashboard/page.tsx
  src/app/(dev)/design/rules/rules.generated.json
  src/app/admin/applicants/page.tsx
  src/app/admin/forensics/export/route.test.ts
  src/app/admin/forensics/export/route.ts
  src/app/admin/page.tsx
  src/app/admin/reports/page.tsx
  src/app/admin/support/page.tsx
  src/lib/admin/kpi.test.ts
  src/lib/admin/kpi.ts
  src/lib/admin/list-depth.test.ts
  src/lib/admin/list-depth.ts
  src/lib/admin/queue-data.test.ts
  src/lib/admin/queue-data.ts
  src/lib/admin/show-more.test.tsx
  src/lib/admin/show-more.tsx
  src/lib/billing/storage-summary.test.ts
  src/lib/dashboard/arrivals.test.ts
  src/lib/dashboard/arrivals.ts
  src/lib/dashboard/card-facts.ts
  src/lib/db/queries/analytics.test.ts
  src/lib/db/queries/analytics.ts
  src/lib/db/queries/applications.test.ts
  src/lib/db/queries/applications.ts
  src/lib/db/queries/claims.test.ts
  src/lib/db/queries/claims.ts
  src/lib/db/queries/events.test.ts
  src/lib/db/queries/events.ts
  src/lib/db/queries/forensics.test.ts
  src/lib/db/queries/forensics.ts
  src/lib/db/queries/guest-addresses.test.ts
  src/lib/db/queries/guest-addresses.ts
  src/lib/db/queries/likes.test.ts
  src/lib/db/queries/likes.ts
  src/lib/db/queries/media.test.ts
  src/lib/db/queries/metrics.test.ts
  src/lib/db/queries/metrics.ts
  src/lib/db/queries/moderation.test.ts
  src/lib/db/queries/moderation.ts
  src/lib/db/queries/pulse.test.ts
  src/lib/db/queries/pulse.ts
  src/lib/db/queries/reports.test.ts
  src/lib/db/queries/reports.ts
  src/lib/db/queries/social.guest-identity.test.ts
  src/lib/db/queries/social.test.ts
  src/lib/db/queries/social.ts
  src/lib/db/queries/storage.ts
  src/lib/db/queries/support.test.ts
  src/lib/db/queries/support.ts
  src/lib/metrics/aggregate.test.ts
  src/lib/metrics/aggregate.ts
  src/lib/stripe/revenue.test.ts
  src/lib/stripe/revenue.ts
  ```

  **Exceptions:** `docs/design/library.md` and `rules.generated.json` are generated by `pnpm design:rules` (the contract counts of `arrivals.ts` and `claims.ts` moved); `src/lib/db/queries/media.test.ts` (rowcap-album's) loses only the two cases that exercised `getPulse`, `getEventCardStats` and `getEventCoverUrls`, their imports and the then-unused `WITHDRAWN`, and its header names the new homes (`pulse.test.ts`, `events.test.ts`, where the counts and covers are SQL): their fake cannot answer an RPC or a dotted embed filter, and at merge their version plus these subtractions is the resolution; `src/lib/billing/storage-summary.test.ts` (no stage-2 lane's) loses the retired `tallyStorageRows`' import and its 35-line "definitions, in code" block, nothing added.
- **Markers:** `git grep -n "row-cap-todo" -- <owns>` lists none. Two permanent markers: `moderation.ts:47` (unchanged: a feed page's host labels, at most 60 ids) and `forensics.ts:117` (new: `upload_forensics.media_id` is unique, `upload_forensics_media_idx`, so a chunk of 150 media ids reads at most 150 rows).
- **The items:**
  - C12: `likes.ts` pages `get_event_like_counts(p_event_id, p_after, p_limit)` on `media_id`; confirmed every reader defaults an absent id to 0 (`gallery-items.ts:72` is the one path; `quick-add.ts` reads `likeCount ?? 0`; `reel-builder.tsx:84` and `studio-moments-picker.tsx:66` pass the gallery item's already-defaulted count). `likes.test.ts`: 2,500 liked items in three pages.
  - C13 + M3: `getEventCardStats` through `event_card_stats(uuid[])`, every asked-for event present, a drifted shape throws (`lib/dashboard/card-facts.ts`); the cards, the "N to review" chip and the next-step band keep their shape. `events.test.ts`: 2,500 ids in one POST, a 1,500-item album counts 1,500.
  - C15 + N3 + M3: `pulse.ts` counts "N in the last hour" and "N today" as HEAD counts (`arrivals.ts` picks the window from `{ inHour, inToday }`, its contract updated), the strip is the newest twelve, each event's newest four are one row per event with the four embedded (per-parent `media.limit=4`), and every read names the host through `events!inner`; the header's settings-page claim and the "nothing downstream is a COUNT" comment are gone. `pulse.test.ts`: 2,500 in the last hour read 2,500; 2,500 events each get four in chunks under the URL limit, each tile presigned once; the reels read whole.
  - H2 + H3: covers through `event_covers(uuid[])` (`readCoverUrls`, `events.ts`), shared by the dashboard and `social.ts`' `adminCoverUrls`, the preview when there is one (the /u/ grid and Guest cards drew the full original before).
  - H4: `getPlatformDbMetrics` reads `admin_metrics_snapshot(30, 14)` beside the unchanged head counts; `lib/metrics/aggregate.ts` parses the jsonb (zod, a drifted shape throws) and folds tiers (`toBillingTier`), sources (`countBySource`'s rule, now over counts) and zero-filled UTC days; `kpi.ts` takes the counted fortnight; `/admin` draws the fortnight line from the same snapshot; `/admin/metrics` unchanged. `metrics.test.ts` pins the snapshot's SQL keys and its operator exclusion.
  - H5: the album drill-in whole on (created_at desc, id desc); the four status counts are HEAD counts from the generated enum.
  - H6 + M10: the report arms and both inboxes read the newest `?show=` (50, `lib/admin/list-depth.ts`) and know whether there is more; `ShowMoreLine` ("Showing the newest N. Show 50 more") under each list; `?show=` rides every row link; report lookups through `inChunks`; presigns in parallel.
  - H7: `queue-data.ts` asks `oldestContactAt`, `oldestApplicationAt` and `oldestOpenReportAt` (one row, oldest first, the report age now across both arms, matching the count); no `.catch(() => [])`.
  - H16: `revenue.ts` walks `for await` over every active subscription. `revenue.test.ts`: 2,500 subscriptions, 25 pages.
  - M1: `listEvents` whole on (created_at desc, id desc); `/dashboard`'s "X of N used" and welcome gate read `countActiveEvents()`; `/dashboard/new` decides the door on the count and reads names only at the cap; `owner-sections.tsx` unchanged (same shape).
  - M2: the bin whole on (deleted_at desc, id desc).
  - M4: `analytics.ts` reads `event_link_totals(uuid)`, still best-effort.
  - M5: follows and blocks whole on (created_at desc, the other id desc), shown events on `event_id`; `getMyFollowers` and `getFollowedHostEventCards` (+ `FollowedEventCard`) deleted: no caller, and git keeps them.
  - M6: the Guest cards' events and hosts and the attended events through `inChunks` (the attended list sorted newest event first in memory).
  - M7: `claims.ts` pages `list_guest_rows_by_email` on the last row's (`last_upload_at`, `guest_id`); a row without a last upload throws rather than restarting the read.
  - M11 + the two swallowed errors: `listHeldMedia` whole on (legal_hold_at desc, id desc), lookups through `inChunks` and `mustQuery` (`forensics.ts:85`'s destructure gone); `export/route.ts` binds both record reads, so a failed read is a 500 with an error audit row (`route.test.ts` runs the handler); the four health counts are `mustCount` (a failed count read as a healthy zero).
  - N4: the attended covers' gates 1 and 4 ride `inChunks` (gate 4 pages inside each chunk); gate 3 reads the owner's choices by user id and intersects.
  - Helper convergence: `social.ts`' offset `readAll` and `guest-addresses.ts`' count loop are `readAllPages`; `social.ts:163`'s hand chunking is `inChunks` (its marker gone). `guest-addresses.test.ts`' sub-cap paging pin became a 2,500-row pin on `fake-postgrest`.
  - `tallyStorageRows` retired with its row type; `storage.ts`' header states the delete-final standby rule.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The pulse's strip filter is one logic tree on the embed, `.or("and(status.eq.approved,removed_at.is.null)", { referencedTable: "media" })`, not `.eq("media.status", ...)`: identical in PostgREST (proved live, below), and the only form `fake-postgrest` can run (Deferred line).
  - The operator lists read the newest 50 and deepen by 50 through `?show=`; one depth serves both report arms; the line says "Showing the newest N." and appears only when there is more.
  - A failed "oldest waiting" read now throws to the admin error screen (the rail's head counts beside it already did), instead of a row with no age.
  - `getMyFollowers` and `getFollowedHostEventCards` deleted rather than fixed (no caller; the profiles doc says a followed-hosts feed is new work).
  - `/dashboard/new` reads event names only at the cap: one more round trip for an at-cap host, none for a host with room.
  - The widest arrivals window returns today's count (never shown; the caption dates the newest).
  - Beyond the brief, in owned files: the four forensics health counts throw on failure (M11's class); the admin home's "2 news this fortnight" reads "2 new this fortnight" (`kpi.ts`).
  - The two out-of-lane subtractions above (`media.test.ts`, `storage-summary.test.ts`).
- **Look at first** (all read-only; the host and operator pages need a sign-in the local server cannot do, so their figures are proved on the admin client and in SQL):
  - Card stats and covers (script and log: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/rowcap-host/probe-host-reads.{mjs,log}`): the probe's card reads `{"approved":1145,"pending":20}`, equal to the table's own HEAD counts (1,145 and 20); willg97's 7 live events: every one with an approved photo has a cover (3 draw their preview, 3 their original because their newest approved photo has no preview, the probe's 320x240 set among them); "Ghost check (disposable)" has 0 approved items and so no cover, correctly. The strips: one row per event, each at most four tiles, all approved and live, newest first, and the probe's strip equals its own newest four approved read directly. The pulse's count across willg97's events: 1,223 approved, 1,158 in the last 24 hours (the old read said at most 240).
  - Like counts: `get_event_like_counts(probe, null, 1000)` as willg97 (claims local to a rolled-back transaction) answers exactly the three liked items, 2 likes each, equal to a hand count of `media_likes`.
  - `/admin` and `/admin/metrics`: `admin_metrics_snapshot(30, 14)` answers accounts total 2, paid 1, storage 50,489,180 bytes, tiers pro 1 and free 1, active in 30 days 2, new 0, QR scans 1,287, album views 25, newsletter none; a plain SQL hand count gives the same eleven figures, the one operator left out.
  - Locally: `/u/willg` (the one public profile with a shown event) renders its hosted card at 1440 and 375 with `.../preview.webp` presigned through `event_covers` on the admin client, where it drew the original.
