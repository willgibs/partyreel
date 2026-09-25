---
track: album-pages
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
