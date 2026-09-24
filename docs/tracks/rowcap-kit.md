---
track: rowcap-kit
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2429807e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/read-all.ts
  - src/lib/db/read-all.test.ts
  - src/lib/db/testing/
  - src/lib/db/row-cap-policy.test.ts
  - src/lib/observability/sentry.ts
  - src/lib/observability/sentry.test.ts
  - docs/systems/testing-verification.md
  - src/lib/db/queries/
  - src/lib/db/mutations/
  - src/lib/supabase/
  - scripts/backfill-strip-exif.mjs
  - scripts/seed-demo-event.mjs
  - src/app/(app)/account/actions.ts
  - src/app/(app)/account/social-actions.ts
  - src/app/(app)/dashboard/[eventId]/actions.ts
  - src/app/(app)/dashboard/claims-actions.ts
  - src/app/(auth)/actions.ts
  - src/app/(marketing)/(cinema)/careers/actions.ts
  - src/app/(marketing)/(paper)/contact/actions.ts
  - src/app/admin/albums/actions.ts
  - src/app/admin/announcements/actions.ts
  - src/app/admin/applicants/actions.ts
  - src/app/admin/exports/actions.ts
  - src/app/admin/forensics/export/route.ts
  - src/app/admin/reels/actions.ts
  - src/app/admin/reports/actions.ts
  - src/app/admin/support/actions.ts
  - src/app/api/account/avatar/route.ts
  - src/app/api/cron/purge/route.ts
  - src/app/api/export/guest/route.ts
  - src/app/api/export/host/route.ts
  - src/app/api/guests/capture-email/route.ts
  - src/app/api/guests/unlock/route.ts
  - src/app/api/internal/backup-prune/route.ts
  - src/app/api/me/menu/route.ts
  - src/app/api/reel/download/route.ts
  - src/app/api/stripe/change-plan/route.ts
  - src/app/api/stripe/checkout/route.ts
  - src/app/api/stripe/plan-facts/route.ts
  - src/app/api/stripe/portal/route.ts
  - src/app/api/stripe/webhook/route.ts
  - src/components/app/account-security-form.tsx
  - src/components/app/event-slug-control.tsx
  - src/components/auth/password-sign-in.tsx
  - src/components/guest/claim-handle-prompt.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/likes/likes-provider.tsx
  - src/components/reel/reel-provider.tsx
  - src/components/reel/use-reel-config.ts
  - src/lib/auth/admin-context.ts
  - src/lib/db/must-query.ts
  - src/lib/email/send.ts
  - src/lib/events/gallery-access.server.ts
  - src/lib/export/export-service.ts
  - src/lib/forensics/capture.ts
  - src/lib/forensics/preserve.ts
  - src/lib/guest/claim-uploads.ts
  - src/lib/guest/session-owner.server.ts
  - src/lib/lifecycle/account-deletion.ts
  - src/lib/reel/guest-reel.ts
  - src/lib/reel/own-event.ts
  - src/lib/reel/render-service.ts
  - src/lib/security/abuse-rate-limit-store.ts
  - src/lib/security/unlock-rate-limit-store.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/database-security.md
  - supabase/config.toml
  - src/lib/type-ladder-policy.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - src/lib/single-source-policy.test.ts
  - src/lib/db/migration-guards.test.ts
  - eslint.config.mjs
---

# lp/rowcap-kit

**Goal.** The helper, the guards and the work list for the 1,000-row round: `readAllPages` and `inChunks` in `src/lib/db/read-all.ts`, an in-memory PostgREST fake that clamps at 1,000 for stage 2's tests, a runtime tripwire that warns in Sentry when a response comes back clipped, and a policy test that refuses unbounded reads, unchunked id lists and unpaged set-returning RPCs, with a `row-cap-todo` marker placed at every offender today so stage 2's lanes have their exact work list.

## The brief

**Will's words (2026-09-23), verbatim.** "In other project builds, I've also hit errors around that 1000 item handling (maybe a PostgREST issue? could be off there) for things like pagination, item counts, filtering, etc. Let's ensure we will not face any of those issues here." And: "Anything within the work we're doing now may be addressed in a near-term round, and anything that requires more dedicated focus can be logged in the roadmap."

**The cause and the round.** PostgREST's `max_rows = 1000` (`supabase/config.toml:27`) cuts every table read and every set-returning RPC at 1,000 rows with no error and no flag. An audit at `5b4c9ce5` (every `.from()` chain, every `.rpc()`, every set-returning function) found 50 sites, re-verified unfixed at `2429807e`, plus three new ones. The round runs in two stages. Stage 1 is you (the helper, the guards, the work list) and a parallel lane, `rowcap-sql` (every SQL shape the fixes need). Stage 2 is four lanes (guest, album, host, cron) that fix the sites, each one removing the markers you place in its files. You fix NO site yourself.

**Facts the Orchestrator settled on the scale probe before your cut** (a real 1,200-photo album on the live database, disposable test data): The scale probe is event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7` (qr `d02631f1bfb3455188d224e41bf9510f`), host willg97, seeded by `scripts/seed-demo-event.mjs` through the real write path: 1,200 photos `p0001` (the oldest) to `p1200`, attributed in turn to the host, Ana P., Ben K. and Cal M. (300 each), 320x240 with no preview (under the preview size), the event name-only, live and open. On its OLDEST items the Orchestrator sets disposable states by SQL: the first 20 pending, the next 30 removed the way a host's Remove writes them, five guest-owned items after those withdrawn by their guest (`removed_by_uploader`), and three liked by willg97 and hi@willgibs. **The live cap is 1,000:** an unbounded `select id` over the probe's 1,024 rows returned 1,000 rows with `Content-Range: 0-999/*` (and a `count=exact` HEAD answered `0-999/1024`), on 2026-09-23 at 23:3x UTC. **Writes are NOT capped:** a no-op `PATCH ... Prefer: return=representation` over 1,040 probe rows returned all 1,040 (`Content-Range: 0-1039/*`), so a mutation's returned rows are complete.

**What you build.**

1. **`src/lib/db/read-all.ts`** (+ `read-all.test.ts`), the one home of the TypeScript rules (its header states the six below).
   - Exports: `MAX_ROWS = 1000` and `IN_CHUNK = 150` (the URL budget `social.ts:129-134` measured; `PROFILE_CARD_BATCH` there is the precedent).
   - `readAllPages<T, K>(label, page: (after: K | null, limit: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>, keyOf: (row: T) => K, opts?: { budget?: number; after?: K | null }): Promise<{ rows: T[]; more: boolean; after: K | null }>`.
   - `page` builds a FRESH query on every call (supabase-js builders mutate their URL in place), always with `.limit(limit)`.
   - It throws `new QueryFailedError(label, error)` (`src/lib/db/must-query.ts:45-55`) on an error. The existing loops throw the raw plain-object error, which is not an `Error`.
   - It stops at the first page shorter than `limit`. That is sound only while `MAX_ROWS` is at most the live `max_rows`, and the header says so.
   - With `budget`, it returns `more: true` and the `after` cursor once `rows.length >= budget`, so a cron sweep resumes from there.
   - `inChunks<I, R>(label, ids: readonly I[], run: (chunk: I[]) => Promise<R[]>, opts?: { size?: number; concurrency?: number }): Promise<R[]>` dedupes, splits at `IN_CHUNK`, runs up to 4 chunks at a time, and flattens.
   - Keep Sentry OUT of `src/lib/db` (`src/lib/observability/sentry.ts:10`). `single-source-policy.test.ts` keeps each UPPER_SNAKE export in one module.
   - **The six rules the header states:**
     1. A list is read whole through `readAllPages`. Media lists shown in order page on `(created_at desc, id desc)`: an RPC takes the cursor as two parameters; a table read builds it with `.or(`created_at.lt.<c>,and(created_at.eq.<c>,id.lt.<id>)`)` plus two `.order()`s. The cursor is the raw timestamp STRING from the row, never a JS `Date`, since microseconds decide ties. Every other list pages on `id`.
     2. A count is counted: `{ count: "exact", head: true }` or a SQL aggregate, never the length of a list read.
     3. A runtime id list is chunked through `inChunks`, filtered on the parent (`events!inner(host_id)`), or passed as a `uuid[]` in an RPC's POST body.
     4. A set-returning RPC takes `p_after` and `p_limit` (clamped in SQL to `least(p_limit, 1000)`), or returns one row.
     5. A sweep has a budget and reports what it left.
     6. A bound on purpose says so: a `.limit(n)` whose screen tells the person, or a `// row-cap: <why>` marker.
   - Tests: an exact multiple of 1,000; zero rows; one short page; an error mid-way becoming a `QueryFailedError` with the label; a budget returning `more` and `after`; `inChunks` deduping and chunking 1,000 ids into 7 requests, then concurrency.

2. **`src/lib/db/testing/fake-postgrest.ts`** (+ its own test).
   - An in-memory PostgREST for stage 2's tests. It generalises the recording fake with a server-side clamp at `src/lib/db/queries/guest-events-admin.test.ts:38-75`.
   - Table builders support `select(cols, { count, head })`, `eq`, `neq`, `in`, `is`, `not(col, "is", null)`, `gt`, `gte`, `lt`, `lte`, `or` (at least the composite-cursor shape above, `and()` nested), multi-column `order` (ascending, `nullsFirst`), `limit`, `range`, `single` and `maybeSingle`.
   - It is thenable to `{ data, error, count }`, with `rpc(name, args)` answering from a registered handler.
   - EVERY response is clamped at `MAX_ROWS`, exactly as the platform does.
   - It records each request (table or function, filters, limit, an estimated URL length) and fails a request whose URL passes a configurable limit (default 8,000 characters, postgrest-js's own `urlLengthLimit`) the way a failed fetch resolves. So a stage-2 test proves both completeness (a 2,500-row fixture reads back 2,500) and chunking.
   - It is typed loosely enough to stand in for `SupabaseClient<Database>` via one cast helper.

3. **The runtime tripwire, `src/lib/supabase/row-cap-tripwire.ts`** (+ test).
   - `withRowCapTripwire(inner: typeof fetch = fetch, capture?)` returns a fetch.
   - It acts only on URLs containing `/rest/v1/`: supabase-js's custom fetch also carries auth, realtime and storage traffic.
   - Once the response resolves, it reads `Content-Range` (`start-end/total`). When the span is at least `MAX_ROWS` rows, the GET had no `limit` query param, and a POST to `/rpc/` has no `p_limit` in its JSON body, it calls `capture` once per `METHOD path` per process.
   - The default capture is `captureWarning("db", "row_cap_hit", { path, method })`, with the path only and never the query string (it can carry tokens and addresses).
   - It never consumes the body and never throws; a HEAD passes through untouched.
   - Add the `"db"` area to `SentryArea` in `src/lib/observability/sentry.ts` (the only edit there).
   - Wire it as `global: { fetch: withRowCapTripwire() }` into `src/lib/supabase/server.ts`, `admin.ts` and `client.ts`. For `client.ts`, merge it into the singleton's one options object (`client.ts:33-43`), keeping the passkey flag. `middleware.ts` only calls `auth.getUser()`: leave it.
   - `@supabase/ssr` 0.10.3 passes `options.global` through (`createServerClient.js:18-24`).
   - Tests: fake `Response`s for a clipped GET, a GET with a limit, an RPC with and without `p_limit`, a HEAD, a non-REST URL, and one warning per path.
   - Prove it once live: a local script with the admin client wrapped reads `select id` from the probe's media with no limit, with an injected capture that LOGS (no Sentry send). The log line goes in your Handoff.

4. **`src/lib/db/row-cap-policy.test.ts`**, the static guard.
   - The template is `src/lib/type-ladder-policy.test.ts`: `ts.createSourceFile(rel, src, Latest, true, kind)` with parent nodes, line numbers from `getLineAndCharacterOfPosition`, and a `forEachChild` visitor returning nothing. The file walk and the non-empty guard follow `src/lib/no-em-dash-policy.test.ts`.
   - It scans `src/**/*.{ts,tsx}` except `*.test.*`, `src/lib/db/types.ts` and `src/lib/db/testing/`, plus `scripts/**/*.mjs` (parse `.mjs` as JS).
   - **Rule A:** a call chain containing `.from("<string literal>")` and then `.select(` (a PostgREST read) with none of `.limit(`, `.range(`, `.single(`, `.maybeSingle(` or `head: true` in the select options is an offender. Exclude `storage.from(...)`, `Array.from`, `Buffer.from` and the like (the argument must be a string literal and a PostgREST method must follow). Mutation chains (`.insert(`, `.update(`, `.upsert(`, `.delete(` followed by `.select(`) are NOT reads: the probe proved PostgREST returns every written row, so rule A skips them.
   - **Rule B:** `.in(<col>, <expr>)` whose `<expr>` is not an array literal, outside the callback passed to `inChunks(`.
   - **Rule C:** `.rpc("<name>", <args>)` where `<name>`'s LATEST definition in `supabase/migrations/` is set-returning (`returns table` or `returns setof`, signatures spanning lines, `table(` with no space) and `<args>` has no `p_limit` key. Drops count: a function dropped later is gone (`20260923130000_drop_saves.sql` drops `get_saved_events`, and `migration-guards.test.ts`' `latestDefinition` misses drops, so write your own drop-aware reader).
   - The allowed single-row names each carry a why: `get_event_reel_by_qr_token` (one reel per event), `host_storage_summary` (one aggregate row), `tier_limits` (one row), and `purge_media_rows` (one row per host among at most its input; the cron lane pins its callers to at most `MAX_ROWS` ids).
   - **Rule D:** `MAX_ROWS` equals `config.toml`'s `[api] max_rows`.
   - **The markers,** on the comment lines directly above the statement that holds the offender (its leading comments): `// row-cap: <why>` (permanent, reviewed) or `// row-cap-todo: <ID...> <why>` (stage-2 work; ids space-separated when one statement holds several).
   - A marker whose statement no longer offends FAILS, so a fix must remove its marker.
   - A todo marker must name ids from an explicit `TODO_IDS` array in the test. The Orchestrator empties that array at the last stage-2 record, after which any leftover todo fails.
   - Failures print `file:line rule hint`.

5. **The work list: place the markers.** Put a `// row-cap-todo:` marker above every offender at HEAD, with the audit id from the table below, or `N4`, `N5`... for any offender the walker finds that the table lacks (`N1`, `N2` and `N3` are taken). Mark a site that is plainly bounded with a permanent `// row-cap: <why>`: a read of a table holding a few config rows, a single user's own row by primary key, a table read by a unique key. Write only comments in files outside your own new files: no code change in any file you own for markers. The Orchestrator reviews every permanent marker at the merge.
   - The walker-visible sites, verified at `2429807e` (lines may drift by a few):

     | Id | Site |
     |---|---|
     | C1 | `src/lib/db/queries/media.ts:54-66` (`listEventMedia`) |
     | H1 | `media.ts:101-108` (the Deleted bin) |
     | C7 | `src/lib/db/queries/guest-events.ts:175` (rpc `get_event_media_by_qr_token`) |
     | C8 | `src/lib/db/queries/guest-events-admin.ts:37-42` |
     | C11 | `src/app/api/export/guest/route.ts:110-116` (`.in("id", ids)`) |
     | C12 | `src/lib/db/queries/likes.ts:17` (rpc `get_event_like_counts`) |
     | C13 | `src/lib/db/queries/events.ts:202-214` |
     | H2 | `events.ts:113-120` |
     | M1 | `events.ts:52-56` |
     | M2 | `events.ts:166-171` |
     | M3 | `events.ts:116` and `205`; `src/lib/db/queries/pulse.ts:89` and `179` |
     | C14 | `src/lib/reel/render-service.ts:184-188` |
     | M9 | `render-service.ts:178-183`; `src/lib/db/queries/reel.ts:30-45` |
     | H3 | `src/lib/db/queries/social.ts:541-548` |
     | M5 | `social.ts:198-202`, `221-225`, `297-301`, `349-352`, `1087-1095` |
     | M6 | `social.ts:717-723`, `764-769`, `776` |
     | H4 | `src/lib/db/queries/metrics.ts:126-132` |
     | H5 | `src/lib/db/queries/moderation.ts:123-140` |
     | H6 | `src/lib/db/queries/reports.ts:47-54`, `71-74`, `83-86`, `150-157`, `169-172` |
     | M4 | `src/lib/db/queries/analytics.ts:15-29` |
     | M7 | `src/lib/db/queries/claims.ts:58` (rpc `list_guest_rows_by_email`) |
     | M10 | `src/lib/db/queries/support.ts:20-26`; `applications.ts:23-29` |
     | M11 | `src/lib/db/queries/forensics.ts:69-89` |
     | M8 | `src/lib/db/mutations/guest-media.ts:145-153` |
     | M13 | `src/lib/db/mutations/media.ts:174-180`, `224-230`, `262-268`, `419-424`, `443-450` |
     | M12 | `src/components/likes/likes-provider.tsx:112-115` |
     | H8 | `src/app/api/cron/purge/route.ts:503-512` |
     | H9 | `route.ts:723-727` |
     | H10 | `route.ts:751-764`, `812-824` |
     | H11 | `route.ts:966-977` |
     | H12 | `route.ts:1106-1135`, `1170-1190` |
     | H13 | `route.ts:674-677` |
     | H14 | `route.ts:415-424`; `src/lib/lifecycle/account-deletion.ts:242-256`, `483-491` |
     | H15 | `route.ts:418`, `451`, `474-477` |
     | M15 | `route.ts:389-395`, `904-910` |
     | M17 | `route.ts:565-568`; `src/app/api/internal/backup-prune/route.ts:71-74` |
     | M14 | `account-deletion.ts:236`, `311-314`, `475`, `495` |
     | H17 | `scripts/backfill-strip-exif.mjs:259-274` |
     | M18 | `scripts/seed-demo-event.mjs:529-532` |
     | N1 | `src/lib/db/mutations/account.ts:231-243` (`binHostedEvents`, the self-service deletion's unbounded event read) |
     | N2 | `account-deletion.ts:266-280` (`.in("event_id", purgeable)`) |
     | N3 | `pulse.ts:119-126` (the per-event strips; semantic, no marker unless the walker flags it) |

   - The semantic items are not walker offences and get NO marker: they live in the stage-2 briefs. They are C2 to C6, C9, C10, C15, H7 and H16 (counts taken from a list's length, a `.limit(240)` window, a Stripe auto-pager, a swallowed `.catch`), and M16 (`purge_media_rows`' callers, allowed by rule C).

6. **The Handoff's prefix map:** every file holding a marker, and the stage-2 lane it belongs to. Anything else goes under "unassigned", with the id and one line each. The Orchestrator writes stage 2's owns from this map.

   | Lane | Paths |
   |---|---|
   | guest | `guest-events.ts`, `guest-events-admin.ts`, `src/lib/events/`, `src/app/api/guests/`, `src/app/api/export/guest/`, `src/components/guest/`, `src/components/likes/`, `src/lib/guest/`, `src/app/(guest)/` |
   | album | `media.ts`, `reel.ts`, `src/app/(app)/dashboard/[eventId]/`, `src/app/api/events/`, `src/app/api/export/host/`, `src/lib/export/`, `src/components/reel/`, `src/lib/reel/`, `mutations/media.ts`, `mutations/guest-media.ts`, `scripts/seed-demo-event.mjs` |
   | host | the other queries (`events`, `likes`, `pulse`, `social`, `metrics`, `moderation`, `reports`, `analytics`, `claims`, `support`, `applications`, `forensics`, `storage`, `guest-addresses`), `src/lib/dashboard/`, `src/lib/admin/`, `src/lib/stripe/`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/account/`, `src/app/admin/` except `jobs/` |
   | cron | `src/app/api/cron/`, `src/lib/lifecycle/`, `mutations/account.ts`, `src/app/api/internal/`, `scripts/backfill-strip-exif.mjs`, `src/app/admin/jobs/`, `src/lib/db/queries/jobs.ts` |

7. **Docs:** `docs/systems/testing-verification.md`'s fixtures section names the scale probe (the event, the command that seeded it, what its oldest items hold) and `fake-postgrest`. The helper's header is the TypeScript rules' home.

**Boundaries.**
- `rowcap-sql` owns `supabase/migrations/2026092401*`, `...02*` and `...03*` (three named files), `src/lib/db/migration-guards.test.ts`, `src/lib/db/row-cap-sql.test.ts` and `docs/systems/database-security.md`. Touch none of them.
- You may READ `migration-guards.test.ts` for its helpers.
- Never `src/lib/db/types.ts`.
- Never `apply_migration`, and no live writes: your one live act is the tripwire's read.
- The files you own only for markers get comment lines alone.
- If a marker site turns out to need a code change to be correct NOW (a real bug beyond row caps), list it under Questions with file:line; do not fix it.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`. The policy test green with every offender marked, and red when a marker is removed or a new unbounded read is added (show both in the Handoff). The tripwire's live read logged. The count of markers by id in the Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A real bug beyond row caps, listed and not fixed: three swallowed errors the lint rule cannot see.** `src/lib/reel/render-service.ts:177`, `src/lib/db/queries/forensics.ts:85` and `src/app/admin/forensics/export/route.ts:101` destructure `{ data }` out of `Promise.all([...])` and never read `error`. A failed `highlight_reels` read renders the reel on the default style, seed and length with no cover; a failed `reel_items` read hashes an empty reel; a failed read on the held-media page shows every item unpreserved and unnamed; a failed read in the evidence export ships an evidence record without its media row. `partyreel/no-swallowed-db-error` (`eslint.config.mjs`) inspects object-pattern declarators only, so an array of results slips past it. Recommended: the album lane binds the errors in render-service (its statement carries M9 C14), the host lane in forensics.ts (M11), and one small separate change teaches the rule array patterns and fixes the export route.
- **`get_event_by_qr_token` joins `SINGLE_ROW`.** It is set-returning by signature and its latest body (`20260923150000_identity_contract.sql`) ends in `limit 1`: one event per token or custom slug. The brief's list named four functions. Recommended: keep it; `rowcap-sql`'s `row-cap-sql.test.ts` needs the same entry, or its own guard fails on it.
- **Rule A reads `.in("id", <a fixed list or the inChunks chunk>)` as a bound** (one row an id, from a bounded list), so the canonical chunked read (`inChunks(..., (chunk) => q.in("id", chunk))`, read-all.ts's own example) needs no `.limit` and no marker. A chunk of parents (`.in("event_id", chunk)`) still offends. Recommended: keep.
- **Two small extensions of the brief's rules.** Rule A also flags a literal `.limit(n)` above `MAX_ROWS`, and rule B also covers `.not(col, "in", ...)` and `.filter(col, "in", ...)` with a computed list; neither exists today. Recommended: keep; both are the same silent failure.
- **The tripwire's reading of "bounded."** A `limit` query parameter above `MAX_ROWS` is no bound (PostgREST clips it all the same), a `p_limit` in a GET function call's query is one, and a `p_limit: null` in a POST body is none (rowcap-sql's null limit keeps today's unlimited read). Recommended: keep.
- **The tripwire imports Sentry lazily** (a dynamic `import()` on the first hit), and `withRowCapTripwire()` with no `inner` calls the global `fetch` at request time (supabase-js's own default does the same) instead of capturing `inner: typeof fetch = fetch` at construction. The three clients are imported across the app and about 4,300 tests; a static import would put `@sentry/nextjs` in every one of those module graphs. Recommended: keep.
- **`readAllPages` throws on two caller bugs:** a page longer than it asked for (the page forgot `.limit(limit)`) and a cursor that did not advance (the page ignored `after`), which would otherwise overshoot a budget or loop forever. Its callers annotate `after` (`string | null`, or `{ at: string; id: string } | null`): `keyOf` follows `page` in the brief's signature, so TypeScript cannot infer the cursor and types `after` as `{}` without it (the JSDoc says so). Recommended: keep both.
- **Nine permanent markers, each for your review:** `src/app/api/stripe/webhook/route.ts:115` (the primary key or `stripe_customer_id`'s partial unique index), `src/lib/db/mutations/guest-media.ts:96` (a unique session token) and `:118` (one account's guest rows in one event), `src/lib/db/queries/event-passes.ts:18` (one profile's unconsumed passes), `exports.ts:39` and `reel-renders.ts:40` (at most `limit` ids, 50 from the one caller), `jobs.ts:95` (the JOBS registry's kill switches), `moderation.ts:45` (at most FEED_LIMIT, 60, host ids), `social.ts:163` (hand-chunked at PROFILE_CARD_BATCH, 150). Recommended: keep all nine; social.ts:163 can become an `inChunks` call whenever the host lane is in the file.
- **No `@policy` header on `row-cap-policy.test.ts` yet.** A header lists the test among the Library's policies, and `pnpm design:rules` then rewrites `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md`, both outside this lane. Recommended: at the merge, add `// @policy: engineering · Every read reaches its last row` and `// @refuses: an unbounded PostgREST read, an unchunked .in() list, an unpaged set-returning RPC, a MAX_ROWS off config.toml, and a row-cap marker over a statement that no longer offends.` as its first lines, then re-run `pnpm design:rules`.

## System-doc edits (in place, owned facts only)

- `docs/systems/testing-verification.md`, "Test accounts + fixtures": the scale probe (the event and its id, the seeding command, what its oldest items hold, what it measures, the HEAD's clamped range among it) and `fake-postgrest` (what it clamps, fails and records; `asSupabase`). The probe's guest token stays out of the doc: the link takes uploads, and the repo is public for the interim.

## Deferred (ROADMAP one-liners, bucket named)

- Engineering: one drop-aware migration reader shared by `row-cap-policy.test.ts` and `row-cap-sql.test.ts` (the two stage-1 lanes each wrote their own, in parallel).

## Handoff (replaces the chat report)

- **Commits, both pushed:** the work `6c535b4a`; the sync `3c0e83f6` (merged `origin/launch-prep` at `3b44ff40`, which touched records only). The head is in the chat line.
- **Gates on the synced tree (`3c0e83f6`), each on its own exit code** (logs in the scratch directory, `rowcap-kit/synced/`): `pnpm design:rules` 0 (no generated drift) · `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none new; the one in a touched file, `src/lib/db/queries/jobs.ts:52` `JobRunInsert` unused, predates the lane and stays because that file takes comment lines alone) · `pnpm test` 0 (386 files, 4,305 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3131` 0 (520 checks, 0 failing). No board, so no `lab:demo`. One flake before the sync: the first full run timed out `src/components/social/guest-list.test.tsx` "opens IN PLACE, one page at a time" at 6.5 s under load (that run took 53 s against the usual 17 s); it passes alone and on every run since.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 44 paths below plus this manifest, each under `owns`; no exception.
  `docs/systems/testing-verification.md` `scripts/backfill-strip-exif.mjs` `scripts/seed-demo-event.mjs` `src/app/api/cron/purge/route.ts` `src/app/api/export/guest/route.ts` `src/app/api/internal/backup-prune/route.ts` `src/app/api/stripe/webhook/route.ts` `src/components/likes/likes-provider.tsx` `src/lib/db/mutations/account.ts` `src/lib/db/mutations/guest-media.ts` `src/lib/db/mutations/media.ts` `src/lib/db/queries/analytics.ts` `src/lib/db/queries/applications.ts` `src/lib/db/queries/claims.ts` `src/lib/db/queries/event-passes.ts` `src/lib/db/queries/events.ts` `src/lib/db/queries/exports.ts` `src/lib/db/queries/forensics.ts` `src/lib/db/queries/guest-events-admin.ts` `src/lib/db/queries/guest-events.ts` `src/lib/db/queries/jobs.ts` `src/lib/db/queries/likes.ts` `src/lib/db/queries/media.ts` `src/lib/db/queries/metrics.ts` `src/lib/db/queries/moderation.ts` `src/lib/db/queries/pulse.ts` `src/lib/db/queries/reel-renders.ts` `src/lib/db/queries/reel.ts` `src/lib/db/queries/reports.ts` `src/lib/db/queries/social.ts` `src/lib/db/queries/support.ts` `src/lib/db/read-all.test.ts` `src/lib/db/read-all.ts` `src/lib/db/row-cap-policy.test.ts` `src/lib/db/testing/fake-postgrest.test.ts` `src/lib/db/testing/fake-postgrest.ts` `src/lib/lifecycle/account-deletion.ts` `src/lib/observability/sentry.ts` `src/lib/reel/render-service.ts` `src/lib/supabase/admin.ts` `src/lib/supabase/client.ts` `src/lib/supabase/row-cap-tripwire.test.ts` `src/lib/supabase/row-cap-tripwire.ts` `src/lib/supabase/server.ts`
- **Items:**
  - `src/lib/db/read-all.ts` (+ 17 tests): `MAX_ROWS` 1000, `IN_CHUNK` 150, `readAllPages` and `inChunks` to the brief's signatures; the header holds the six rules and the short-page caveat.
  - `src/lib/db/testing/fake-postgrest.ts` (+ 25 tests): the clamp, the 8,000-character failure shaped as postgrest-js's failed fetch, the request log, `asSupabase`; it also speaks writes (unclamped, as the probe measured, so a write chain's URL can be tested), `like`, `ilike`, `match`, `throwOnError`, SQL's NULL logic and PostgREST's codes (PGRST100, 116, 202, 205).
  - `src/lib/supabase/row-cap-tripwire.ts` (+ 15 tests), wired into `server.ts`, `admin.ts` and `client.ts` (one options object, the passkey flag kept, the singleton default unchanged); `"db"` added to `SentryArea`, the only edit in sentry.ts; `middleware.ts` untouched.
  - `src/lib/db/row-cap-policy.test.ts` (18 tests: the four rules on the tree, plus fixtures for every rule, the markers and both readers): green with every offender marked.
  - 83 markers, comment lines only (every added line in a marker file is a `//` line, checked on the diff): 74 `row-cap-todo` over 42 ids, 9 permanent `row-cap`.
  - `docs/systems/testing-verification.md`: the scale probe and `fake-postgrest`.
- **Markers by id (74):** C1 1 · C7 1 · C8 1 · C11 1 · C12 1 · C13 1 · C14 1 · H1 1 · H2 1 · H3 1 · H4 1 · H5 1 · H6 5 · H8 1 · H9 1 · H10 2 · H11 1 · H12 5 · H13 1 · H14 3 · H15 3 · H17 2 · M1 1 · M2 1 · M3 4 · M4 1 · M5 5 · M6 3 · M7 1 · M8 1 · M9 2 · M10 2 · M11 2 · M12 1 · M13 5 · M14 3 · M15 2 · M17 2 · M18 1 · N1 1 · N2 1 · N4 3. Every audit id carries at least one; N3 carries none (the walker does not flag pulse.ts's strips), and M14's `account-deletion.ts:495` is the count taken off line 475's list, so that list's marker carries it. **N4, new:** `social.ts` `getPublicProfileAttendedCoverUrls`, whose three gate reads (markers at `:484`, `:502`, `:516`) put every attended event id from `get_public_profile` (an unbounded jsonb list) in one URL.
- **The prefix map, for stage 2's owns** (every todo id lies in one lane; the test's `TODO_IDS` lines follow it):

  | Lane | Files holding a marker (ids) |
  |---|---|
  | guest | `src/lib/db/queries/guest-events.ts` (C7), `src/lib/db/queries/guest-events-admin.ts` (C8), `src/app/api/export/guest/route.ts` (C11), `src/components/likes/likes-provider.tsx` (M12) |
  | album | `src/lib/db/queries/media.ts` (C1, H1), `src/lib/db/queries/reel.ts` (M9), `src/lib/reel/render-service.ts` (M9 C14), `src/lib/db/mutations/media.ts` (M13 x5), `src/lib/db/mutations/guest-media.ts` (M8, plus two permanent), `scripts/seed-demo-event.mjs` (M18) |
  | host | `src/lib/db/queries/events.ts` (M1, M2, H2 M3, C13 M3), `likes.ts` (C12), `pulse.ts` (M3 x2), `social.ts` (M5 x5, M6 x3, H3, N4 x3, plus one permanent), `metrics.ts` (H4), `moderation.ts` (H5, plus one permanent), `reports.ts` (H6 x5), `analytics.ts` (M4), `claims.ts` (M7), `support.ts` (M10), `applications.ts` (M10), `forensics.ts` (M11 x2) |
  | cron | `src/app/api/cron/purge/route.ts` (H8, H9, H10 x2, H11, H12 x5, H13, H14 H15, H15 x2, M15 x2, M17), `src/lib/lifecycle/account-deletion.ts` (M14 x3, H14 x2, N2), `src/lib/db/mutations/account.ts` (N1), `src/app/api/internal/backup-prune/route.ts` (M17), `scripts/backfill-strip-exif.mjs` (H17 x2), `src/lib/db/queries/jobs.ts` (one permanent) |
  | unassigned | permanent markers only, no stage-2 work: `src/app/api/stripe/webhook/route.ts:115`, `src/lib/db/queries/event-passes.ts:18`, `src/lib/db/queries/exports.ts:39`, `src/lib/db/queries/reel-renders.ts:40` |

- **The guard, red and then green** (logs `rowcap-kit/red-*.log` in the scratch directory; each change reverted): the C1 marker removed gave `src/lib/db/queries/media.ts:59 A .from("media").select() has no bound: read it whole with readAllPages, count it with head: true, bound it with .limit/.range/.maybeSingle, or say why in a // row-cap: marker (its statement opens at line 58)`; a new read, list and call in analytics.ts gave `analytics.ts:36 A ...`, `:40 B .in("id", ids) takes a runtime list: ...` and `:42 C rpc("get_event_like_counts") is set-returning and passes no p_limit: ...`; a `.limit(1000)` added under C1's marker gave `media.ts:58 marker sits above no offending statement (fixed, or misplaced): ...`. Restored, 18 passed.
- **The tripwire, live** (`rowcap-kit/live/live-tripwire.log`; the real module, the admin client wrapped, a capture that logs, reads of the probe only): `2026-09-24T00:14:43.474Z http GET /rest/v1/media -> 200 content-range=0-999/*` then `2026-09-24T00:14:43.474Z [row-cap-tripwire] row_cap_hit {"method":"GET","path":"/rest/v1/media"} (logged, not sent)`, 1,000 rows. The same read again logged no second warning; `.order("id").limit(1000)` logged none; the exact HEAD count answered `206 content-range=0-999/1200` (count 1,200) and passed through.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Proposed CLAUDE.md gotcha line** (yours to place): "★ PostgREST cuts every read at 1,000 rows with no error: read a list through `readAllPages`, count with `head: true`, chunk an `.in()` list through `inChunks` (`src/lib/db/read-all.ts`); `row-cap-policy.test.ts` refuses the rest."
- **Calls his to overrule:**
  - `get_event_by_qr_token` on `SINGLE_ROW` (its body ends in `limit 1`).
  - `.in("id", <a fixed list or the inChunks chunk>)` counts as a bound in rule A.
  - Rule A flags a literal `.limit(n)` above 1,000; rule B covers `.not` and `.filter` with `"in"`.
  - The tripwire reads a `limit` above 1,000 as no bound and a null `p_limit` as none.
  - Sentry imported lazily; the global `fetch` resolved at request time.
  - `readAllPages` throws on an over-long page and a stuck cursor; callers annotate `after`.
  - The nine permanent markers (listed under Questions).
  - No `@policy` header yet (the generated Library files are outside the lane).
  - The scale probe's guest token kept out of testing-verification.md.
- **Look at first:** the three swallowed-error sites (Questions, the first item); then `src/lib/db/row-cap-policy.test.ts`'s rules against `src/lib/db/queries/social.ts`, which holds every kind of marker (single, multi-offence, permanent, the N4 set); then `readAllPages` in `src/lib/db/read-all.ts`.
