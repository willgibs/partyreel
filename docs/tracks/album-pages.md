---
track: album-pages
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260926100000_album
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/queries/album-
  - src/lib/db/album-version.test.ts
  - src/lib/events/album-
  - src/lib/album/
  - src/app/api/album/
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/events/gallery-access.server.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/lib/r2/grid-items.ts
  - src/lib/r2/presign.ts
  - src/lib/r2/presign-bucket.ts
  - src/lib/db/read-all.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/db/queries/media.ts
  - src/lib/media/uploader-identity.ts
  - src/components/guest/gallery-live.tsx
  - src/lib/reel/live/source.ts
  - supabase/migrations/20260611220000_gallery_doorbell.sql
  - supabase/migrations/20260729150000_qa_q1_media_destruction_guards.sql
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/album-pages

**Goal.** Build the data half of the paged album: a light manifest of the whole album with no links, image links minted by id only for what is on screen or about to play, and a poll that asks what changed since a per-event version, so a quiet poll is one row read and a thousand-photo album costs kilobytes instead of megabytes. Will: "We already need to add scrolling pagination to event pages rather than load the whole album upfront."

## The brief

**Today** (mapped at 1,145 photos):
- Every load and every changed poll reads the whole album (`readAllPages` over `get_event_media_by_qr_token`, or the password and host reads) plus an attribution sweep over every media row of every status.
- Three presigned links are minted per item (preview, inline original, attachment): about 1.8KB of JSON per item, about 2MB per full response.
- A 304 still costs the whole read, because the ETag is computed after it (`src/lib/events/gallery-fingerprint.ts`).
- The 30-minute presign bucket forces a full 200 with every link changed.
- The host page re-reads and re-presigns everything on each `router.refresh()`.

`album-window` builds the windowed grid beside you; two later lanes wire the guest and host surfaces onto both of you. You build the engine and prove it; you change no page.

**The design** (from the Orchestrator's plan; improve it where the code proves a better way, and write any genuine one-way decision under Questions):
- **The wire contract, one home** (`src/lib/events/album-wire.ts`, versioned `a1-`).
  - A manifest entry is `[id, w, h, flags, t]`: flags carry video, has-preview and reel-eligible; `t` is `created_at` in microseconds; videos add a duration.
  - Newest first; oldest-first is the client reversing it.
  - Estimate 25 to 35KB compressed at 1,145; measure it.
- **Links by id per window:**
  - Three variants: `tile` (the preview, or the original when there is none), `view` (inline original), `download` (attachment).
  - At most 200 ids a call, read with `inChunks`.
  - Unknown, gone or not-visible ids come back in `missing`.
  - Each link carries its bucket, so a client re-mints only links older than about an hour.
  - Attribution rides the link response for exactly those ids, through `resolveUploaderIdentity`. The guest mapper copies name, isHost and isVerified only (extend the email-safety test); the host mapper includes the email.
- **The version and the change log (the migration):**
  - `album_state(event_id pk, version, album_max, attr_version, updated_at)` and `album_changes(event_id, media_id, host_version, album_version, pk(event_id, media_id))`, both RLS on with no policy, service role only.
  - Triggers on `media` status changes and inserts and deletes: `version` counts every transition in the host's scope; `album_max` and `album_version` only transitions entering or leaving `approved`.
  - Triggers on `guests` renames and verification, and on `profiles.display_name`, bump `attr_version`.
  - `album_changes_since(event, scope, after, limit)`: invoker, keyset by version, clamped at 1,000, granted to `service_role` only.
  - Every new function revokes EXECUTE from public, anon and authenticated (the MCP's default grant).
- **★ Lock order is the risk.** These triggers sit in the hottest write path, and `purge_media_rows` locks media before `profiles` while `create_media` locks `profiles` first. A per-event counter row taken mid-transaction can deadlock uploads against a purge or a guest's own delete. Recommended: make the bumps DEFERRABLE INITIALLY DEFERRED constraint triggers, so `album_state` is always a transaction's last lock and versions still commit in order per event. Enumerate every function that writes `media`, `guests` or `profiles` and prove the order either way.
- **The capability check stays in the Next routes**, through `get_event_by_qr_token` and `resolveViewerDecision`, with the unlock cookie checked inside the password read. So the gates match today's by construction and no anon grant exists.
- **Routes:**
  - `src/app/api/album/guest/`: `sync` (304 on the validator; else the delta or `resync`), `media` (links by id) and `manifest` (paged, for albums past about 3,000 entries).
  - `src/app/api/album/host/[eventId]/`: `sync` and `media`.
  - The validator hashes access, gate, the reel facts, `album_max` and `attr_version`, never the presign bucket.
  - Keep today's route rules: no ETag on the private or not-found early return, none while a session-cookie heal is pending, never across access levels or gates.
  - `resync` answers more than 500 changes, or a `since` above the server's version.
  - The teaser stays today's tiny inline payload.
- **The client store** (`src/lib/album/`):
  - The manifest; the version read BEFORE the manifest pages, so a change committing in between arrives twice (harmless) and is never lost; deltas applied by id with binary insertion on `(t, id)`.
  - The link store (`get`, `ensure(ids)`, the bucket-age re-mint), and the reel's resolver interface (`get(id)`, `ensure(ids)`) that a later lane hands `createClipSource`.

**Order:**
1. The wire contract.
2. The migration SQL (`supabase/migrations/20260926100000_album_version.sql`), handed to the Orchestrator early: it runs the rolled-back check, applies it, runs the advisors and regenerates the types; you finish on the new types.
3. Meanwhile, the pure store with a simulated server.
4. Then the queries and routes.
5. Then the integrity model test, the route tests and a localhost run against the scale probe.

Reuse the gallery poll's existing limiter kind for your routes; `reel-teardown` owns `abuse-rate-limit.ts` tonight, so a new kind is a Question. Your system docs: `database-security.md` (the tables, triggers, grants and the lock-order rule) and `uploads-and-r2.md` (links by id per window, the bucket rule).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; a seeded simulation of about 10k schedules (inserts, approvals, hides, unhides, removals, purges, page boundaries and polls interleaved) with no id lost or duplicated and the client's set equal to the server's approved set in order after quiescence; route tests (304 when nothing changed, no key or email in a guest response, a teaser or locked viewer and a password album without its cookie get nothing, foreign or unapproved ids in `missing`, 200 ids the cap); the migration's rolled-back check with the Orchestrator; the manifest and a window's links measured at 1,145 on localhost.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The limiter.** The gallery poll has no limiter kind to reuse (`/api/guests/gallery` calls none). Recommended and
  built: none on the album routes, like the poll they replace: reads behind the capability, and a limiter row per
  poll would make a venue's phones write load ("Limit abuse, never volume"). If the edge firewall proves thin, a
  breadth-only `album_read` kind on the links route alone, in `abuse-rate-limit.ts` (reel-teardown's file tonight).
- **The first paint.** The manifest carries no links, so a page that renders it must also have its first window's.
  Recommended (for the surface lanes, not built here): the page RSC embeds the manifest and the first window's links
  server-side (`readGuestAlbumMedia` then `toGuestAlbumLinks`, the links route's own two calls), saving the round
  trip on first paint.

## System-doc edits (in place, owned facts only)

- `database-security.md`: the advisor set is 17, 5 and 32 (16, 4 and 27 after the reel drop); `album_changes_since`
  joins the service-role-only list; `album_state` and `album_changes` join the deny-all tables; a new ★ under Grants,
  the album row as every transaction's LAST lock (deferred stamps, one flush in event-id order, note before stamp by
  name, no other writer).
- `uploads-and-r2.md`: the album's two mappers join "raw keys never reach the browser"; a new bullet, links minted by
  id per window with the bucket and the server clock, re-minted at an hour, and why no album validator carries the
  bucket (the teaser's does); the album attributes only asked ids and its guest path never selects an address.

## Deferred (ROADMAP one-liners, bucket named)

- Now: prune `album_changes` tombstones (one row per item ever, a purged item's included) with a per-event
  watermark that answers resync below it, a job with its `/admin` health signal.
- Now: when the hub moves onto the paged album, the host's links carry like counts per window and the host manifest
  its quick-add key (`guest_id` already rides the host-scope delta in `album_changes_since`).

## Handoff (replaces the chat report)

- **Commits, pushed:** the migration `4c07f452` (applied as `album_version`), the sync `ef554c01` (merged
  `4698ad2b`, the regenerated types at `6063f1d8`), the work `2820ba8c`, this manifest on top. launch-prep has since
  moved (`ed3ed826` mark-r3, records) without touching the lane's reads, so no second sync.
- **Gates on `2820ba8c`'s tree, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (the 6 pre-existing
  warnings, none in the lane's files); `pnpm test` 0 (465 files, 5,053 tests); `zsh scripts/build-lock.sh pnpm
  build` 0 (the six `ƒ /api/album/...` routes); `pnpm lab:smoke --base http://localhost:3137` 0 (279 checks, 0
  failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is the owned prefixes and this file, plus ONE
  exception: `src/lib/r2/grid-items.email-safety.test.ts` (the brief's "extend the email-safety test": a second
  describe reads `album-guest-links.ts`; no other lane owns the file).
- **The migration** (`supabase/migrations/20260926100000_album_version.sql`): `album_state`, `album_changes`, the
  immediate notes and DEFERRED stamps on media, guests and profiles, one flush per transaction in event-id order,
  `album_changes_since` (one jsonb, one snapshot); the header carries the lock-order proof over every writer, read
  from the live bodies; `migration-guards.test.ts` section 15 pins it (including "nothing but the flush and the
  stamp writes an album table").
- **Its proof on a throwaway Postgres 17** (the file verbatim over a stand-in of the touched tables and every
  writer's live body; the harness is in the lane's scratch, never the repo): 43 contract checks (a transaction is one
  version; a pending-to-hidden move leaves the guest's version alone; a purge of a removed row writes nothing; a
  savepoint rollback leaves no trace; a hard delete of an event commits and takes its album rows); a stress of 14
  writer shapes at once (uploads, moderation, multi-event and multi-table transactions, guest deletes, purges,
  restores, renames) with two protocol readers paging at 7: about 9,600 deltas a run, 0 integrity mismatches, exact
  convergence in both scopes, and across five runs no deadlock ever named an album table (every one was the
  pre-existing purge-versus-restore cycle, 13 with the triggers dropped); the controls: immediate bumps deadlock on
  the same interleaving, deferred-but-unsorted deadlocks at commit, the sorted flush with the same pause commits
  both. Cost: about 20 microseconds a row (a 2,000-row bulk approve 29 ms to 72 ms, one bump).
- **Its proof on live, before the apply:** the file's statements (its COMMENT ON FUNCTION lines aside) at the head
  of one DO block ending in the deliberate raise: `ROLLED BACK: every album_version check held {...}` (the foot of the
  migration quotes it); the catalog read no album object afterwards.
- **The wire contract** (`src/lib/events/album-wire.ts`, `a1`): `[id, w, h, flags, t]` plus a video's duration, `t`
  exact microseconds (`timestampToMicros`), the order, links `[id, tile, view|null, download, who]`, the poll's shapes.
- **The server:** `album-sync.ts` (the pure planner the routes and the model share), `album-validator.ts`,
  `album-viewer.server.ts` (the gallery poll's own resolution), `queries/album-{state,guest,host}.ts` (every guest read
  self-guarded on visibility and the unlock cookie; the guest path never selects an address), `album-{guest,host}-
  links.ts`, and the six routes under `src/app/api/album/` (the host's `manifest` added beside the brief's `sync` and
  `media`, for an album past 3,000 items).
- **The client** (`src/lib/album/`): `manifest.ts` (merge by id, copy on write), `links.ts` (coalesced, deduped in
  flight, dated on the device's own clock, re-mint at an hour, missing, attribution), `resolver.ts` (the reel's
  `{ get, ensure }` for `createClipSource`), `store.ts` (one serialized sync, adopt a manifest only whole, the
  integrity check after every delta and its heal, catch-up bounded at four rounds), `transport.ts`.
- **The integrity model** (`src/lib/db/album-version.test.ts`, `ALBUM_MODEL_REPORT=1` prints it): 10,000 seeded
  schedules, 236,568 polls, 119,734 deltas, 46,082 manifests (resyncs included), 242,089 page reads, 70,752 304s, 0
  integrity misses, 0 divergence at quiescence; a mutant that reads a manifest's version after its pages lost changes
  in 1,001 of 2,000 schedules.
- **Route and gate tests:** guest sync 17 (the one-row 304, locked and password answers with no validator, the heal,
  never across levels or gates, no address or raw key in the teaser), guest media 15 (200 the cap, foreign and hidden
  ids missing, nothing for teaser, upload-gated, password-without-cookie or unknown), guest manifest 8, host sync 9,
  host media 3, host manifest 2, the viewer's resolution 6, the guest reads' own gate 5, validators 10, planner 10,
  mappers 5, the store 11, the link store 13, the merge 9, the wire 17, email-safety +2.
- **Measured at 1,145 on localhost** (the scale probe, the live database): the manifest 78,125 B raw, 33,471 B gzip,
  26,636 B brotli (the brief estimated 25 to 35KB); today's gallery poll 1,537,696 B raw, 141,499 B gzip, 111,578 B
  brotli; a 60-item window's links 69,528 B raw, 7,949 B gzip, 6,350 B brotli (200 ids: 231,543, 25,148, 19,849); the
  quiet poll a 304 after one row (0.16 to 0.28 s on the dev server) where today's 304 re-reads the album (0.44 s).
- **Walked on localhost against the live database:** a hide answered a 300-byte delta; a deep approval landed in
  order; a rename moved only the attribution; the restore of all three in one transaction was one version; the real
  store over the real transport (46 polls, 41 304s, 4 deltas, 0 integrity misses); a real id from another album
  missing; the password album without its cookie locked, no validator, no links, no pages; the account and upload
  gates answered the inline teaser with no address. The probe is back at 20 held, 1,145 approved, 35 removed.
- **Not yet walked live on the alias:** the host routes need an allow-listed sign-in (localhost answered 401 as it
  should), and no page calls the routes until the surface lanes wire them; their red-team rides the alias build that
  first carries them.
- Assets requested from Will: none.
- Board ideas: `purge_media_rows` locks media before profiles while `restore_media` locks profiles first, so a restore
  and a purge of the same removed row deadlock today (13 in the baseline stress): the purge could take the hosts'
  profiles rows first, in id order. A per-uploader index on the guest manifest would give the reel's coverage term its
  signal without exposing guest ids.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none beyond `album_version`, applied.
- Calls his to overrule: no limiter on the album routes; the teaser's validator carries the presign bucket (its links
  ride its payload); one version per transaction, and the guest's `album_max` its own counter so a guest never learns
  how busy moderation is; the host's manifest carries held and hidden items with their status flags (one manifest for
  the hub's grid and Review).
- Look at first: the migration's header (the lock-order proof), `src/lib/events/album-sync.ts`,
  `src/lib/album/store.ts`, then the integrity model.
