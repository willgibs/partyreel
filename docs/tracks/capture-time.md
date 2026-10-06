---
track: capture-time
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  built: the minimal Exif a JPEG and a HEIC keep is the orientation (as before), `DateTimeOriginal` (the wall clock)
  and `ExifVersion` (so a reader takes the block as Exif); never the sub-second, the modify or digitize times, GPS,
  make, model, lens or serial, and never the zone: `OffsetTimeOriginal` is read so the claim knows the instant, but in
  the file it would say roughly where (some offsets are one country's alone: Nepal's +05:45, Iran's +03:30; the
  fresh-eyes review's catch), and the bare wall clock still shows the day and hour it was taken wherever it is opened.
  An MPF secondary image (a gain map, a large thumbnail) keeps orientation only, as before. Overrule to keep the zone
  in the file (one line in `minimalTiff`).
- **Q4 A video's time.** Recommended, built: QuickTime's `com.apple.quicktime.creationdate` where a file carries it
  (an iPhone's: the capture's start, with its zone), else the movie header's creation time (`mvhd`, UTC; zero means
  none); a WebM's `DateUTC`; nothing else is read. The Apple key still goes with the metadata box it lives in (beside
  the location, make and model), so when a file carried one, its movie header's creation time is set to it, one field
  in place: measured, AVFoundation (an iPhone's export) stamps the header with the moment it WROTE the file, so without
  this a clip picked the next morning would download as taken that morning. A header with no QuickTime date beside it
  is untouched, as before.
- **Q5 The wire.** Recommended, built: a seventh element on a manifest entry, the capture time in microseconds like
  `t` (a video's duration, or null, before it); the contract's version stays `a1`, since no row carries a capture time
  before the build that writes one, so no validator can answer 304 for a manifest that lacks one it should hold. A host
  tab from the build before, left open across the deploy, shows a timed video without its length until it reloads (it
  read a duration only from a six-element entry); bumping the version to force reloads costs every open album a full
  manifest for that. Measured bytes in the Handoff.
- **Q6 The reads that feed the wire sit outside the owns.** The manifest's two reads (`album-guest.ts`,
  `album-host.ts`), the delta's parser (`album-sync.ts`), the host's column list (`media.ts`'s `MEDIA_HOST_COLUMNS`,
  pinned to her SELECT grant), the lease's mapper (`queries/drive.ts`), the hub's duration read (`hub-album.ts`, which
  read a duration only from a six-element entry) and guest-flow.md's one clause that said an album in order only grows
  at its end. Recommended, built: the fewest lines in each, every one listed in the lane check; the host's SELECT grant
  gains `captured_at` (her own album's times, which her originals carry anyway).
- **Q7 The backfill.** Recommended, built: it keeps a capture time in what it rewrites (the one shared strip) and
  writes no `captured_at`: a hand-run script never writes the column `create_media*` writes once.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`, "The EXIF strip": a ★ line for the capture time (what each walk reads, that the
  file keeps the wall clock and never the zone, the movie header's rewrite, the claim, the bounds' one home, the column,
  the wire and Drive); the size line names `captured_at` beside the other client-supplied, non-authoritative fields.
- `docs/systems/drive-export.md`, "Names": the moment it was taken first (the lease carries it), its arrival only for
  an upload that kept none; "(null today: the upload keeps none)" gone.
- `docs/systems/guest-flow.md` (event-zone's file now; an exception below): the one clause that said an album in
  order only grows at its end.

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Uploads: read a zoneless Exif wall clock in the party's own zone (event-zone's `events.time_zone`) rather than
  the uploader's browser's: the claim would carry the bare wall clock for the server to read in the event's zone
  (capture-time)."
- Now: "Camera: the album camera's shots (canvas JPEGs, no Exif) carry no capture time, so one that goes up well after
  it was taken (a retry an hour on) sorts by its arrival in the night in order; hand `uploadBurst` its `takenAt` as the
  claim (`camera-screen.tsx`, a `BurstFile` field) (capture-time)."
- Launch checkpoint: "Legal: the privacy policy's metadata section (`legal-privacy.tsx`) still says HEIC, HEIF, AVIF
  and WebM are stored as sent (the strip covers them since strip-gaps) and says nothing of the capture time now kept
  (the file's minimal Exif, `media.captured_at`); restate it with the real `/privacy` (capture-time)."
- Retire: "Product: keep a capture time at upload, so a Drive file's name and `modifiedTime` say when it was taken"
  (done here).

## Handoff (replaces the chat report)

- **Commits, pushed** (`lp/capture-time`): work `b7e73797f` (all five items, the migration, the tests), `0b9a2f40f`
  (each capture read through `quietly`, an MPF test where the Exif grows, the guest-flow clause), `296e6dee5` (the
  fresh-eyes review: the file keeps the wall clock, never the zone; two notes made true; the help article). Sync: a
  fast-forward to `8bb4e103b` (album-order merged, on the Orchestrator's word) before the first work commit;
  launch-prep has moved since by records alone (`8c94d47af` to `ca6e726c1`), so no sync. The head is in the chat line.
- **Gates on `296e6dee5`**, each its own exit code (logs `_scratch/capture-time/gate2-*.log`): typecheck 0, lint 0,
  test 0 (1,020 files, 12,708 tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base
  http://localhost:3131` 0 (190 checks, `gate-lab-smoke-2.log`). No board, so no `lab:demo`. On `0b9a2f40f` the same
  gate passed (`gate-*.log`; a first test run's four tree-scan timeouts under a load of 26 passed alone and rerun).
  With `types.ts` patched as the regeneration will write it (`captured_at`, `p_captured_at`), typecheck 0 and the db,
  forensics, r2 and upload guards 0 (91 files, 1,367 tests; `regen-*.log`); restored after.
- **Old code fails the new tests**: the base's sources (no `capture-time.ts`, no migration) against the eleven new or
  reshaped test files: 47 failed of 171 (`_scratch/capture-time/old-code.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 46 files): owned paths and this file, plus these
  exceptions, each a few lines: `src/lib/db/queries/album-guest.ts` and `album-host.ts` (each manifest read selects
  `captured_at` and maps it; a type-only cast until the regeneration); `src/lib/db/queries/media.ts`
  (`MEDIA_HOST_COLUMNS` gains `captured_at`, pinned to her SELECT grant; two type-only casts);
  `src/lib/db/queries/drive.ts` (`RawLeaseItem.capturedAt` and its mapping; crumbs-82 edits other hunks of it, so
  expect a clean merge);
  `src/lib/events/album-sync.ts` and its test (the delta's twelfth element); `src/lib/event/hub-album.ts` (its duration
  read goes through `entryDuration`: it read one only from a six-element entry); `src/lib/db/migration-guards.test.ts`
  (the live reel's `create_media*` pins reshaped to the new signature, insert and grants, scars kept);
  `content/help/photo-metadata-and-location.mdx` (the kept time said; uploads-and-r2.md names it as the strip's
  reader-facing account, which changes with it); `docs/systems/guest-flow.md` (two lines, event-zone's file, beside
  its paragraph, not in it). `src/lib/shared/album-order*` joined the owns on the Orchestrator's word.
- **Items:**
  - Read before the strip: each walk reads the original's time before rewriting a byte (`captured` on every strip
    result): a JPEG's and a HEIC's (HEIF, AVIF) Exif `DateTimeOriginal` with `OffsetTimeOriginal`, a movie's QuickTime
    `com.apple.quicktime.creationdate` (moov- or udta-level) else its header's creation time, a WebM's `DateUTC`; PNG
    and WebP never; every read through `quietly`, so a read can never fail the strip open.
  - Kept in the file: the minimal Exif is the orientation, `ExifVersion` 0232 and `DateTimeOriginal`, never the zone,
    the device or the place (Apple's ImageIO reads back exactly those, pixels identical:
    `_scratch/capture-time/walk/stored-exif.txt`, `walk/pixels.txt`); a movie whose QuickTime date goes with its meta
    box has its header's creation time set to it (AVFoundation stamps the header with the moment it WROTE the file:
    measured, `fixtures/avfoundation-capture.mov`); a WebM's Info stays whole.
  - The claim: the uploader sends `captured_at` (an ISO instant: the zone applied, a zoneless wall clock read in her
    browser's zone) on the complete, never the presign; a kept complete sends it again as first asked.
  - Validated: `acceptCaptureTime` (`src/lib/media/capture-time.ts`, the bounds' one home): 1990 to the server's now
    plus a day, the claim's one shape, a rolled-over day refused; outside them it is none and the file lands anyway
    (`completeCaptureTime` in both routes, `.optional()` before the transform or zod 4 refuses a body without it).
  - Stored: `supabase/migrations/20261005200000_capture_time.sql`, below.
  - Carried: a manifest entry's seventh element (microseconds like `t`; the duration's slot null before it), on both
    manifest reads and the delta; `entryCaptureTime` and `entryDuration` in `album-wire.ts`; album-order's `takenAtOf`
    reads it, pinned through the wire's own mapper (`album-order.test.ts`). Measured on a 1,145-item manifest, every
    item timed: +2.2 B an item brotli (+8.8%), +4.1 gzip (+14%), +21.5 raw (+30%) (`wire-bytes.txt`); an item with none
    is the bytes it always was.
  - Drive: the lease carries `captured_at`, so a copy's name, description and `modifiedTime` say when it was taken
    (`src/lib/drive/lease-capture.test.ts`: "2026-10-03 21.14.05 · Priya.jpg" for a photo that arrived the next
    morning).
  - The browser half, walked: the real uploader in a headless Chrome of my own (its zone Los Angeles) over seven real
    files (ImageIO JPEG and HEIC, a zoneless JPEG, a lying one dated 2099, an AVFoundation MOV, an ffmpeg MP4 and WebM),
    the network stood in on a temporary page (never committed): each complete's claim and each PUT's bytes read back
    (`walk.log`, `walk/walk.json`): five at 2026-10-04T01:14:05Z, the zoneless one at 04:14:05Z (21:14 in Los Angeles),
    the lying one's 2099 sent for the server to drop (the route tests prove the drop), no presign carrying one.
  - The backfill (`scripts/backfill-strip-exif.mjs`) is unchanged: it runs the one strip, so it keeps a capture time in
    what it rewrites and writes no `captured_at` (Q7).
- **The DB half and the gap**: the upload end to end against the live database needs the migration, which is the
  Advisor's to read first, so it stands proved on the live schema rolled back instead (the file's foot: RED 0/8, GREEN
  8/8, both writers storing the instant and landing the older build's call, the change log and a Drive lease carrying
  it, `infinity` refused, the four bodies at their hashes, nothing persisted). **After the apply, the Orchestrator's
  check**: upload `_scratch/capture-time/fixtures/` (the seven above; the videos need a paid host) to a test album from
  :3000, then `select original_key, captured_at from media where event_id = '<album>' order by created_at desc limit
  7;` expects 2026-10-04 01:14:05+00 for the five, 21:14:05 in the uploading browser's zone for `imageio-nozone.jpg`,
  NULL for `imageio-lying.jpg`; the album's manifest carries the seventh element for those six.
- Assets requested from Will: none.
- **Board ideas**: (1) album-order: a capture time far outside the album's own days (a throwback, a camera a year off)
  sits at the night's edge in the in-order view instead of leading it (presentation; the wire keeps the true time;
  Q2). (2) Download all's zip names its entries "when, then who" like a Drive copy (`buildDownloadFilename` names
  `slug-id.ext` today), so an unzipped album sorts as the night happened.
- **Proposed migrations / Worker / Vercel / Stripe / env**: `supabase/migrations/20261005200000_capture_time.sql`, the
  Advisor first, then APPLY BEFORE THE PUSH (this build selects `captured_at` in both manifests, a 42703 on every album
  read without the column, and names `p_captured_at` for an upload with a time, a PGRST202 without it); the drift read
  in its header (the four bodies at their live hashes on 2026-10-05); `get_advisors` expected unchanged (26/4/36);
  regenerate `types.ts`, then drop the typed seams (the args built beside the call in `guest.ts` and `host-media.ts`,
  the casts in `album-guest.ts`, `album-host.ts` and `media.ts`). No Worker change (the Drive Worker takes the lease's
  name and `modifiedTime` as before), no Vercel, Stripe or env change.
- **Calls his to overrule**: Q1 a zoneless time read in the uploader's zone; Q2 the bounds (1990, now plus a day);
  Q3 the file keeps the wall clock, never the zone; Q4 the QuickTime date first, the movie header rewritten to it;
  Q5 the seventh element, the version unmoved; Q6 the reads outside the owns; Q7 the backfill writes no column.
- **Look at first**: `_scratch/capture-time/walk/stored-exif.txt` (what a downloaded photo now says, read by Apple's
  own reader) beside `fixtures/avfoundation-capture.mov`'s header (the write time an iPhone export stamps, the reason
  for Q4's rewrite).
