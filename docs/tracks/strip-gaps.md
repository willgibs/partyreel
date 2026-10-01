---
track: strip-gaps
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
