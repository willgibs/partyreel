---
track: rowcap-guest
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
