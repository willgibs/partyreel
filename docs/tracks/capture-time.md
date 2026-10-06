---
track: capture-time
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0ff67f0a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/media/strip-metadata
  - src/lib/media/capture-time
  - src/lib/upload/
  - src/app/api/r2/complete-upload/
  - src/app/api/host/r2/complete-upload/
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/host-media.ts
  - src/lib/events/album-wire
  - src/lib/shared/album-order
  - src/lib/export/drive-names
  - src/lib/drive/
  - workers/drive/
  - scripts/backfill-strip-exif.mjs
  - supabase/migrations/20261005200000_capture_time.sql
  - docs/systems/uploads-and-r2.md
  - docs/systems/drive-export.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - supabase/migrations/20261005181000_billing_integrity.sql
---

# lp/capture-time

**Goal.** A photo keeps the time it was taken, never the place or the device: read before the strip, validated on the server, stored, carried on the album's wire, and naming its Drive copy.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3131 is yours; 3000 is Will's desk.

**Will's word (2026-10-05, the calls lab's X7):** "Yes, keep the capture time, never the place or device." Today the browser strips every photo's hidden details before upload (`src/lib/media/strip-metadata.ts`, the upload seam's step 0; the backfill runs the same code in Node), so Partyreel knows only when a file reached the album. Each change pinned by a test that fails on the old code:
1. **Read it before the strip:** the capture time of a JPEG and a HEIC (EXIF `DateTimeOriginal` with `OffsetTimeOriginal` when present), an MP4 or MOV (the container's creation time) and a WebM where it carries one; nothing else is read. Recommended and built (a call): keep it in the stored file's minimal EXIF beside the orientation, so a download and a Save into Photos land on the right day; never the place, never the device: the strip's policy otherwise unchanged, its fixtures proving exactly what survives.
2. **Validated on the server:** the client's word is a claim; a time after now plus a day, or absurdly old, is dropped (the arrival stands); a guest cannot move her photo to the album's head or foot by lying. One home for the bounds.
3. **Stored:** `media.captured_at`, one migration (`supabase/migrations/20261005200000_capture_time.sql`). ★ The upload's hot path gains no call (the compute model counts a guest's burst: carry it in the complete's own write), and milestone 37's build shares the database, so a changed `create_media*` signature is the hard part: an expand it survives, named in the file's header (database-security.md's workflow, a rolled-back check at its foot); the Orchestrator has the Advisor read it before the apply.
4. **Carried:** the album's wire carries each item's capture time (`album-wire.ts`), so album-order's in-order view (merged or merging: its sort key prefers capture time and falls back to arrival) sorts the night as it happened; the bytes it adds to a manifest measured and said.
5. **Drive:** a Drive copy is named and dated by its capture time (`driveMoment` already prefers it; the lease carries it to the Worker).

The docs say the new truth: uploads-and-r2.md's strip policy (what is kept, and why: Will's word), drive-export.md's naming. Wiring rigor: the whole gate; an upload from your port of a fixture JPEG, HEIC and video with capture times (and one lying), read back from the database and the album's wire.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1 A time with no zone.** Older Android phones and most cameras write `DateTimeOriginal` without
  `OffsetTimeOriginal`: a wall clock and no zone. Recommended, built: read it in the uploader's own browser zone (she
  is nearly always where she shot it, and uploads the same night); the stored file keeps exactly the camera's wall
  clock, never an invented zone. (UTC would put a New York night five hours early; dropping it would lose most such
  photos' times.) Once the party keeps its own zone (event-zone, cut today), the party's zone is the better reading for
  a guest who uploads from elsewhere: a Deferred line, since the claim would then carry the bare wall clock for the
  server to read in the event's zone.
- **Q2 The bounds.** Recommended, built (one home, `src/lib/media/capture-time.ts`): a claim after the server's now
  plus a day is dropped (a camera a zone ahead still counts), and so is one before 1 Jan 1990 (before any consumer
  camera stamped a file: it catches the reset clocks, 1904, 1970 and 1980); the arrival stands, and the upload never
  fails over it. Within the bounds a capture time is the uploader's word: a lie inside them reads like a truth, so the
  bounds stop only the absurd (an album's head or foot held for ever by 1970 or 2099). Pinning a time outside the
  album's own days to its edge would be album-order's presentation (a board idea below).
- **Q3 What the stored photograph keeps.** Will's word: the capture time, never the place or the device. Recommended,
  built: the minimal Exif a JPEG and a HEIC keep is the orientation (as before), `DateTimeOriginal`,
  `OffsetTimeOriginal` when the camera wrote one, and `ExifVersion` (so a reader takes the block as Exif); never the
  sub-second, the modify or digitize times, GPS, make, model, lens or serial. The zone offset rides with the time: it
  names a band of the globe, never a place, and it is what lets Photos put the photo on the right day. An MPF
  secondary image (a gain map, a large thumbnail) keeps orientation only, as before.
- **Q4 A video's time.** Recommended, built: QuickTime's `com.apple.quicktime.creationdate` where a file carries it
  (an iPhone's: the capture's start, with its zone), else the movie header's creation time (`mvhd`, UTC; zero means
  none); a WebM's `DateUTC`; nothing else is read. The Apple key still goes with the metadata box it lives in (beside
  the location, make and model), so when a file carried one, its movie header's creation time is set to it, one field
  in place: measured, AVFoundation (an iPhone's export) stamps the header with the moment it WROTE the file, so without
  this a clip picked the next morning would download as taken that morning. A header with no QuickTime date beside it
  is untouched, as before.
- **Q5 The wire.** Recommended, built: a seventh element on a manifest entry, the capture time in microseconds like
  `t` (a video's duration, or null, before it); the contract's version stays `a1`, since no row carries a capture time
  before the build that writes one, so no validator can answer 304 for a manifest that lacks one it should hold; an
  older tab ignores the element. Measured bytes in the Handoff.
- **Q6 The reads that feed the wire sit outside the owns.** The manifest's two reads (`album-guest.ts`,
  `album-host.ts`), the delta's parser (`album-sync.ts`), the host's column list (`media.ts`'s `MEDIA_HOST_COLUMNS`,
  pinned to her SELECT grant), the lease's mapper (`queries/drive.ts`), the hub's duration read (`hub-album.ts`, which
  read a duration only from a six-element entry) and guest-flow.md's one clause that said an album in order only grows
  at its end. Recommended, built: the fewest lines in each, every one listed in the lane check; the host's SELECT grant
  gains `captured_at` (her own album's times, which her originals carry anyway).
- **Q7 The backfill.** Recommended, built: it keeps a capture time in what it rewrites (the one shared strip) and
  writes no `captured_at`: a hand-run script never writes the column `create_media*` writes once.

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

## Where I am

- Done: the work (`b7e73797f`, `0b9a2f40f`, pushed); the gate on `0b9a2f40f`: typecheck 0, lint 0, test 0 (1,020
  files, 12,708 tests; a first run's four tree-scan timeouts under a load of 26 passed alone and on the rerun), build
  0, `lab:smoke --base http://localhost:3131` 0 (190 checks); the migration's rolled-back proof on the live schema (RED
  0/8, GREEN 8/8, nothing persisted); the browser walk (the real uploader in a headless Chrome of my own over seven real
  files, a lying one and a zoneless one among them; logs in `_scratch/capture-time/walk*`).
- Next: a fresh-eyes review of the diff (the first was cut off by the account's limit), then the Handoff.
- Mid-flight: nothing on disk; the temporary walk page is gone and nothing listens on 3131.
