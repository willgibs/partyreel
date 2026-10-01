---
track: strip-gaps
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a21f6d0b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/media/strip-metadata.ts
  - src/lib/media/strip-metadata
  - src/lib/upload/uploader.ts
  - scripts/backfill-strip-exif.mjs
  - content/help/photo-metadata-and-location.mdx
  - src/components/marketing/sections/features/privacy/never-rides-along.tsx
  - src/lib/constants/feature-pages.ts
  - src/components/marketing/sections/home/privacy.tsx
  - src/components/marketing/jsonld.tsx
  # the other places that state the claim (the brief's "articles that state it", and beyond):
  - content/help/what-you-can-upload.mdx
  - content/help/download-photos-videos-and-albums.mdx
  - content/help/how-guests-join-and-upload.mdx
  - content/help/who-can-see-your-event.mdx
  - content/blog/scanned-a-qr-code-where-your-photos-go.mdx
  - content/blog/AUTHORING.md
  - src/lib/content/llms.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/marketing-content.md
  - docs/systems/trust-safety-forensics.md
  - src/lib/media/limits.ts
---

# lp/strip-gaps

**Goal.** The EXIF strip's three documented leak windows closed, losslessly: an iPhone's HEIC (and HEIF and AVIF), a WebM, and the Exif inside a JPEG's MPF secondary images each lose their location and device metadata without a pixel re-encoded or an offset moved, and every place the product promises it says what is now true.

## The brief

The EXIF strip (`src/lib/media/strip-metadata.ts`, `uploads-and-r2.md` "The EXIF strip") fails open by contract on three inputs, and its own header names them as a known leak window: HEIC/HEIF/AVIF (item-based ISOBMFF, where Exif is an `iloc`-referenced item; blanking `meta` whole would destroy the image), WebM (EBML), and the Exif inside a JPEG's post-EOI MPF secondary images. The product accepts `image/heic` as the iPhone's default (`media/limits.ts`), so a guest's location can ride along on the most common phone's photographs. The ROADMAP's line: "Media: the client-side strip fails open on HEIC/HEIF/AVIF (item-based ISOBMFF) and WebM (EBML), and a JPEG's MPF secondary images keep their own Exif; strip those." Close all three, each with a test on a real file that fails on today's code.

The strip's own rules stand and are the point: lossless byte surgery, never a pixel re-encode (the original is the keepsake); never move a byte an offset points at; the browser and the Node backfill share one module; whatever still cannot be parsed fails open, as now. A shape that keeps every offset valid, as the MP4 path already does, is to blank in place rather than excise:
- **HEIC/HEIF/AVIF:** find the Exif item (and an XMP `mime` item) through `iinf` and `iloc`, and overwrite its extents in place (construction method 0 or 1), leaving `ipco`/`ipma` (orientation is `irot`/`imir` there, not Exif), the image items and every offset untouched. Prove the decoded pixels identical before and after.
- **WebM:** the `Tags` element and any location-bearing tag become `Void` elements of the same size, so `SeekHead` and `Cues` positions hold.
- **MPF secondary images:** each secondary image's own APP1 Exif payload is overwritten in place with its segment length kept, so the MPF index's offsets stay true.

These are suggestions; the lane picks the best lossless way and says why under Questions. `hasGpsMetadata` (the detector the forensics and the backfill read) learns each format, and `scripts/backfill-strip-exif.mjs` shares the module: run it DRY over R2's existing originals and report what it would change in the Handoff; never run it live (a data operation, the Orchestrator's).

**Fixtures:** `/Users/gibby/local/ai/partyreel-test-media/` holds real JPEGs and H.264 videos. Make the rest yourself and keep them small: `sips` (on this Mac) converts a GPS-tagged JPEG to HEIC with its Exif; `ffmpeg` (installed) writes a WebM with tags; an iPhone HDR JPEG carries MPF secondaries. No exiftool here: read metadata back with the module's own parser or a script of your own. Commit only small fixtures, under the tests' own folder.

**The claim follows the truth.** Every place the product says location is removed says what is now true: the help (`photo-metadata-and-location.mdx` and the articles that state it), the privacy page's "never rides along" section, `constants/feature-pages.ts`, the home's privacy band and `jsonld.tsx`. The ROADMAP's line "The EXIF claim's 'for the common formats' clause is missing on its last two sites" is yours to settle. If a format still fails open after your work, the claim keeps saying so honestly. No lane edits the legal pages (`legal-privacy.tsx`): name any legal line your change leaves stale in your Handoff.

**Never capture what you strip.** The pre-strip forensic capture of a guest's EXIF is counsel-gated (`trust-safety-forensics.md`): the strip removes location, it never records it anywhere.

**Verify:**
- the gate;
- each format's test red on today's code, on a real file;
- the decoded pixels identical before and after for every image format, and every video still plays;
- on localhost, an upload of each format through the guest page signed out (the public demo album's door, or a local album), its stored object read back clean.

**Will's desk is up:** `privacy-hero` describes /features/privacy's hero (which veil). Change nothing in that hero; the never-rides-along section below it is yours. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-42` owns the host app: `src/app/(app)/dashboard/`, `components/app/event-feed/`, `host-add-provider.tsx`, `host-upload.tsx`, the create wizard, `ui/popup.tsx`, `queries/events.ts`, `mutations/media.ts`, and `restore_event`;
- `crumbs-43` owns the guest pages: `components/guest/` (the upload sheet's terms line among them: name any claim there your change makes stale), the photo viewer, `lib/history-entry.ts`, `lib/guest/`, `components/likes/`, `queries/guest-events.ts`, and `get_event_by_qr_token`, `create_guest` and `profiles_album_note`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **Q1. The short form of the claim, now that every accepted format is stripped?** Recommended and built: it drops
  "for the common formats" everywhere at once: "Location data is stripped in the browser before a photo ever uploads."
  (the home's privacy band, the JSON-LD, the llms file, the blog's ratified line). That clause's reason (HEIC, HEIF, AVIF
  and WebM stored as sent) has expired. The one exception left is a file too damaged to read safely, which uploads as
  it is. The long form says so: the help article, `what-you-can-upload`, and the blog guide's privacy fact. This settles
  the ROADMAP line about the clause missing on its last two sites: the never-rides-along body and `feature-pages.ts`
  were already unconditional and are now true as written, so neither changed.
- **Q2. What replaces an HEIF Exif item?** Recommended and built: a minimal Exif that keeps only the orientation, padded
  to the item's length. This mirrors the JPEG path, and any Exif reader meets a valid block. HEIF orients by irot
  anyway: ImageIO still reads orientation 6 with the Exif zeroed whole (`_scratch/strip-gaps/fx/a.zeroexif.heic`).
- **Q3. An XMP item that describes only an auxiliary image (Apple's HDR gain map version, a depth map's calibration)?**
  Recommended and built: it is kept unless it carries GPS. It is rendering data, not identity, and ImageIO finds the gain
  map and its HDRGainMapVersion identical after the strip. The picture's own XMP (creator tool, dates, city, country) is
  blanked to an empty packet.
- **Q4. WebM: void Tags whole, or only the location SimpleTags; and Info?** Recommended and built: every Tags element is
  voided whole (location, make, model, encoder, per-track DURATION), as the MP4 path blanks udta whole. Info (Title,
  DateUTC, muxer names) is kept, as MP4 keeps mvhd's times. The title is the user's own words, Info carries the
  playable duration, and an edit inside Info would break a Matroska CRC-32.
- **Q5. JPEGs embedded after the EOI (MPF secondaries, gain maps, appended originals)?** The brief named their Exif.
  Recommended and built: the primary's policy at each segment's exact length. Exif becomes the minimal Exif, IPTC and
  comments are zeroed, and XMP is kept unless it carries GPS, because a gain map's parameters live there.
- **Q6. The HDR headroom, a trade the JPEG path already made?** Apple keeps a photo's HDR headroom in MakerNote tags
  inside the Exif, and the minimal Exif drops it, on HEIC now as on JPEG always. The SDR pixels are identical. A
  pre-iOS-18 gain map may render with less exact headroom on Apple screens. Recommended: accept it for now (a Deferred
  line below carries the fix).

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md` "The EXIF strip" is refined in place. It now says every accepted format is stripped
  and only JPEG, PNG and WebP shrink, and what each in-place rewrite protects. It gives the fail-open cases, why the
  module stays one file, and ★ the Matroska unknown-size rule. The fail-open bullet it replaces named HEIC, WebM and MPF
  secondaries.

## Deferred (ROADMAP one-liners, bucket named)

- Media: carry Apple's MakerNote HDR headroom (tags 0x0021 and 0x0030) into the minimal Exif the strip rebuilds, on
  JPEG and HEIC, so a pre-iOS-18 HDR photo keeps its exact HDR rendering (from strip-gaps).

## Handoff (replaces the chat report)

- **Commits, pushed:**
  - `dedefd2f`: owns, alone.
  - `aef30e00`: the work.
  - `f4bb5a91`: the sync, a merge of origin/launch-prep 681c81f2. STATUS was 83 lines at the base b5f8e4da, so
    `record-depth-policy.test.ts` was red there; 59f3110b fixed it.
  - Then this manifest, alone.
- **The gate on `f4bb5a91`, each step on its own exit code:**
  - typecheck 0.
  - lint 0.
  - test 0: 697 files, 8,389 tests.
  - `build-lock` build 0.
  - `lab:smoke --base http://localhost:3131` 0: 134 checks, 0 failing.
  - Logs: `_scratch/strip-gaps/gate.log` and `gate-*.log`. No board, so no lab:demo.
- **Lane check:** every path of `git diff --name-only origin/launch-prep...HEAD` sits under `owns` (the fixtures and the
  two new test files under the `src/lib/media/strip-metadata` prefix), is this manifest, or is `uploads-and-r2.md`
  (above). The owns grew by seven, in `dedefd2f`: four help articles, the guest blog post, the blog's AUTHORING and
  `content/llms.ts`, the other places that stated the claim. `never-rides-along.tsx` and `feature-pages.ts` are owned and
  unchanged (Q1).
- **HEIC/HEIF/AVIF:** every Exif item is rewritten in place to a minimal Exif, and every picture XMP item to an empty
  packet, both through iinf and iloc (construction method 0 or 1).
  - Every byte outside those extents is identical: `strip-metadata-heif.test.ts` asserts it on the real file.
  - ImageIO decodes before and after to identical raw and oriented pixels, with orientation 6 kept, the gain map
    identical, and GPS, make, model, lens and serial gone (`_scratch/strip-gaps/verify-final.log`).
  - It fails open on construction method 2, a protected item, an unbounded extent, an extent outside mdat or idat, or one
    sharing a byte with any kept item.
- **WebM:** each Tags element becomes a Void of exactly its span, so SeekHead and Cues hold.
  - ffmpeg's framemd5 is identical before and after for every frame of both tagged files (`verify-final.log`).
  - Chrome plays each to its end, same duration and frames (`chrome-playcheck.log`).
  - Chrome's MediaRecorder WebM (unknown-size Segment and Clusters) is walked whole and left byte-identical.
- **MPF and embedded JPEGs:** each embedded image's Exif is overwritten at its segment's length. Following the index the
  way a reader does, both images are whole. ImageIO decodes the secondary to identical pixels with no GPS, and Chrome
  draws the primary identically. Apple's HDR gain map secondary stays byte-identical.
- **Red on today's code:** 34 of the 92 strip tests fail on launch-prep's module, every real-file test of each format
  among them (`_scratch/strip-gaps/red-on-launch-prep.log`). Two tests were reshaped on purpose, each comment saying
  which reason expired: the MPF residual-gap test and the dispatch's "consciously unsupported" test.
- **Upload on localhost, signed out.** R2's CORS refuses `http://localhost:*`: a PUT preflight answers 403 there and 204
  for the alias. So the guest page on this lane's dev server ran in a headless Chrome with web security off; the page,
  its strip, presign, PUT and complete were the app's own.
  - All seven fixtures went through "Continue as guest" and "Choose from your album": presign, PUT and complete each
    answered 200 (`_scratch/strip-gaps/upload-run.log`, `shots/`).
  - Every stored original, read back from R2, is byte-identical to the module's Node output for its fixture, has
    `gps=false`, and re-strips to no change (`readback.log`).
  - ImageIO and Chrome decode and play the stored objects (`stored-imageio.log`, `stored-chrome.log`).
  - The disposable event `1e0962e3-b7cc-408c-a562-172510239185` was created as the Scale probe's host, name-only and
    holding for approval, then soft-deleted (purge_at 2026-10-31).
- **Backfill, DRY over R2** (`_scratch/strip-gaps/backfill-dry.log`, 12.5 min):
  - 1,498 originals: 1,455 JPEG, 16 MP4, 27 PNG. No HEIC, HEIF, AVIF or WebM is stored yet.
  - 0 carry GPS.
  - It would change 3 JPEGs in event `4580fc56…`, each shrinking by 224 bytes.
  - 1,495 already clean, 0 fail-open, 0 errors.
  - Never run live.
- **Stale legal lines (no lane edits them), in `src/lib/constants/legal-privacy.tsx`:**
  - 273 ("For the common photo and video formats … A few formats are stored exactly as sent.").
  - 279 (names JPEG, PNG, WebP, MP4, MOV).
  - 282 ("HEIC, HEIF and AVIF images and WebM videos are stored exactly as your device sends them …").
  - 664 ("for the common formats").
  - Suggested truth: every format the service accepts, except a file too damaged to read safely, which is stored as
    sent.
- **The guest upload sheet's terms line (crumbs-43's)** makes no metadata claim, so nothing there is stale.
- **ROADMAP lines this closes (the Orchestrator's to retire):**
  - Media: "the client-side strip fails open on HEIC/HEIF/AVIF … strip those".
  - "The EXIF claim's 'for the common formats' clause is missing on its last two sites" (Q1).
  - The launch checkpoint's "the EXIF clause's last two sites".
- **PREMISE:** lab:smoke names `disposable-mode`, whose 8 asks live in `uploads-and-r2.md`. They still hold. This change
  touches only that doc's EXIF strip section, and no ask turns on which formats keep metadata. An in-page camera's
  MediaRecorder WebM is walked and left byte-identical (it has no Tags), and its canvas photos carry no Exif.
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - Q1, dropping the short form's clause.
  - Q3, keeping an auxiliary image's XMP.
  - Q4, voiding WebM Tags whole while keeping Info.
  - Q5, applying the primary's policy to embedded JPEGs.
- **Look at first:**
  - `planHeifItems`: the overlap and placement rules that make an HEIF rewrite provably safe.
  - `walkSegment` and `skipUnknownCluster` (WebM).
  - `Walk<T>`: the one parser driven both ways.
  - Then `content/help/photo-metadata-and-location.mdx`.
  - The scratch tools that made and checked the fixtures are in `_scratch/strip-gaps/tools/`:
    - `imgtool.swift` (ImageIO, make and info).
    - `build-mpf.mjs`.
    - `record-mediarecorder.mjs`.
    - `verify-final.sh`.
    - `guest-upload.mjs`.
    - `readback.mjs`.
