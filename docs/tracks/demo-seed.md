---
track: demo-seed
status: integrated
merged: "d89e4d4"      # the branch head merged into launch-prep
cut: "26f7e52"
preview: false
owns:
  - scripts/seed-demo-event.mjs
reads:
  - scripts/backfill-strip-exif.mjs
  - src/lib/r2/keys.ts
  - src/lib/media/limits.ts
  - src/lib/media/preview-size.ts
  - src/lib/media/strip-metadata.ts
---
# lp/demo-seed

**Goal.** One command seeds the curated demo event: `node scripts/seed-demo-event.mjs <folder>` creates
(or reuses, by a fixed name under the demo host) the demo event with the service role, uploads the
folder's media to R2 through the real key scheme (`src/lib/r2/keys.ts`), inserts the media rows as
approved with true dimensions, both orientations, EXIF stripped (run `backfill-strip-exif.mjs` after,
or strip inline with the same library), idempotent (a re-run replaces the set), and prints the QR token
to put in `NEXT_PUBLIC_DEMO_QR_TOKEN`. The media is Will's to pick; the run against prod and the env
repoint are the Orchestrator's (the Launch checkpoint item "swap the demo event to curated media").
Size S.

**Rulings in force.** none.

**Verify on.** A run against a throwaway event with a folder of the marketing manifest's images
(disposable data), the event page on the launch-prep alias afterwards, the rows and keys inspected
through the Supabase and R2 MCPs, then the throwaway event deleted.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/testing-verification.md`: one line, how to reseed the demo event.

## Deferred (ROADMAP one-liners, bucket named)

- none.

## Handoff

- Head is the last commit on `lp/demo-seed`, pushed; the gates below ran on `087e3af`, the
  pre-handoff merge, which the handoff commits only add this file to. No preview needed (a Node
  operator script, no UI); `preview: false`.
- Synced with `origin/launch-prep` at `4e38590` (it had moved 16 commits, incl. milestone-18); merged,
  no conflicts.
- Gates on the synced tree: typecheck ok, lint ok, test ok (1533), build ok (244 pages).
- Lane check `git diff --name-only origin/launch-prep...HEAD`:
  `scripts/seed-demo-event.mjs` (owned) · `docs/tracks/demo-seed.md` (this file) ·
  `docs/systems/testing-verification.md` (the one listed system-doc line, added under "Media
  fixtures"). No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The prod run against
  "Partyreel Demo" and the `NEXT_PUBLIC_DEMO_QR_TOKEN` repoint stay the Orchestrator's (ROADMAP
  Launch checkpoint, "swap the demo event to curated media"). The script PRINTS the token to paste.
- **How to run it** (from the repo root, with `.env.local` present):
  `node scripts/seed-demo-event.mjs <folder>` seeds "Partyreel Demo" under its current host;
  `--host <email>` / `--name <event>` retarget it, `--dry-run` prints the plan and writes nothing.
  Start with `--dry-run` against the real demo event: the run REPLACES its media (the 9 rows there
  now would go), which is the point but is not undoable.
- **It needs ffmpeg + ffprobe on PATH** (dimensions, durations, the WebP preview/poster encode).
  Node has no image codecs and a new npm dependency would have touched `package.json`, outside this
  track's lane. HEIC/HEIF/AVIF photos additionally lean on macOS `sips` to decode a temporary PNG for
  measuring; elsewhere those items would upload with no dimensions and no preview (the product
  already renders that case: 1:1 tile, original served).
- Look at first: the seeded rows are written by `create_media_as_host`, never a direct insert, and
  the replace half goes through `purge_media_rows` (R2 objects first, then rows) so
  `profiles.storage_used_bytes` moves both ways. Those two calls are the load-bearing choices.

## Record

Merged into `launch-prep` at `<sha>` (2026-09-02). `scripts/seed-demo-event.mjs` turns a folder of
photos and videos into a demo album by driving the product's own write path from Node: keys from
`mediaObjectKey`, the shared EXIF/GPS stripper before anything reads a size, a ~640px WebP preview
per item (photo downscale, video poster at ~0.1s) sized by `preview-size.ts` and PUT to the reserved
`preview` variant, `file_size_bytes` from an R2 HEAD, and the row from `create_media_as_host`. The
rows come out indistinguishable from a host batch upload (guest_id null, approved) with the ledger
and cap meters honest. A re-run replaces the set (R2 objects, then `purge_media_rows`, then the fresh
upload), the event is reused by name so its `qr_token` survives, and the token is printed for
`NEXT_PUBLIC_DEMO_QR_TOKEN`. Verified live on a throwaway event: 12 marketing images seeded and
rendered on the launch-prep alias (presigned previews fetching 200), then replaced by a mixed folder
of 5 whose video carried a poster and the same `duration_seconds` a real upload of that fixture had
recorded; `backfill-strip-exif.mjs` called every seeded original clean; an Exif Orientation 6 photo
recorded 600x900 with a rotated 427x640 preview; a refused upload (video on a free host) deleted its
own objects; `storage_used_bytes` returned to its exact pre-run value after teardown. The throwaway
events were deleted the way the purge cron does, and "Partyreel Demo" was never touched.
