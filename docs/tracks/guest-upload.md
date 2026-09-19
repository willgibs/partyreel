---
track: guest-upload
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a8afce0c"          # the launch-prep SHA the branch was cut from
board: guest-upload     # round one: the moment a guest adds a photograph, phone first
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-upload/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - src/components/guest/guest-upload.tsx
  - src/lib/guest/use-upload-queue.ts
  - src/lib/upload/uploader.ts
  - src/lib/media/limits.ts
  - src/components/shared/floating-add-button.tsx
  - src/components/guest/file-dropzone.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/shared/media-lightbox.tsx
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/spec.ts
---

# lp/guest-upload

**Goal.** Round one of `guest-upload`: THE MOMENT A GUEST ADDS A PHOTOGRAPH, the product's core act, reconceived
from the ground up and PHONE FIRST. Will (2026-09-19, `docs/design/rulings.md`, "two more areas at the
Orchestrator's discretion"): the guest pages are unprotected, "absolutely everything is up for relitigation or
reconcepting from the ground up"; a board that keeps nothing is deleted at no cost. Six to eight decisions with
`defineExploration`, each drawn on the REAL guest components with fixtures (an open wedding album with
photographs and a guest mid-upload; the same album on hold-for-approval; a batch of a dozen; a failure; a file the
browser cannot preview), at 375 by 812 by default with 1440 on a knob, a recommendation each, every number
measured; no preview uploads anything. **Not in this round:** any production byte; the pipeline (presign, PUT,
complete, the RPCs) and the limits; the album's chrome, the Live signal and the "yours" question (`guest-shape`,
on the desk: its `live` decision is where the album admits it is filling, so this board draws the guest's OWN
tile, never the others'); the entry gate.

**What is measured (the tree at the cut).** Three triggers converge on one hidden file input with `accept`
image and video, `multiple`, and no `capture`: the header's full-width "Add photos" (hidden when the album is
empty, ceding to "Be the first to add a photo"), the floating pill (44 px, fixed bottom-centre, only once the
header's actions scroll away; "Add photos" with an "N uploading" chip at 11 px) and the empty state's line. The OS
chooser decides camera or library; nothing on the page says "take a photo now" as distinct from "send one". Each
file runs one at a time: metadata stripped byte-level (HEIC and video pass through untouched, never re-encoded),
measured, checked against the limits single source, a WebP preview made, presigned, PUT to R2 (multipart over 100
MB), completed; the guest sees a thin progress strip at the foot of a pending masonry tile and nothing else; an
approved outcome re-keys the tile in place and wears a green check for about 2.5 s that vanishes with no exit
transition; a held outcome draws NO tile, one toast ("Sent, waiting for host approval") and a static 12 px banner
("The host reviews uploads before they appear in the album.") that reads the same whether or not the guest's own
item is held; a failed file dims with "Tap to retry" at 12 px and never blocks the batch; the first success mounts
the save prompt ("Keep these photos"). Refusals are guest-ready sentences (closed, photos only, full, capped at X,
over 10 GB, session expired) but a file that is too big dies at presign, after the picker, and a format the
browser cannot preview shows nothing until the server round-trips. `FileDropzone` (drag and drop, its own copy) is
built and never rendered for a guest. Nine seams are listed in the Orchestrator's map (`docs/tracks/orchestrator.md`,
"The app round's map", the upload paragraph); read them. The behaviour pins: `guest-upload.test.tsx` (the
session and endpoint identity, one-at-a-time, progress patching, the approved / pending / error outcomes and their
copy, the just-in-time silent join, demo mode, the banner's conditional render, and the load-bearing pin that a
rejected file errors only its own tile), `password-gate.test.tsx` (the strikes' copy), `limits.test.ts`; they
guard function, the look is open.

**The decisions (suggested; yours to recut, never forced apart).** THE TAP (what the instant after "Add" is: the
OS chooser, as today; a sheet with the two intents named, "Take a photo" and "Choose from your album"; the camera
first with "or choose" beneath); SENDING (how the guest's own upload reads while it flies: the silent strip; the
strip with one word; nothing under two seconds, the tile simply lands); THE BATCH (a dozen at once: silent per
tile; one "12 sending" tile that expands; a count line pinned where scrolling cannot hide it); HELD (hold for
approval: a toast and then nothing; a placeholder tile with a clock until the host approves; a status line beside
Add that stays until it is settled); FAILED (a failed file: dimmed with "Tap to retry"; a silent retry first, then
the bright thumbnail with a small badge; a sheet that lists what failed and why); THE WARNING (what a guest is told
before a file flies: nothing until the server refuses; size and type spoken before the picker closes; both, with a
stand-in tile for a format the browser cannot preview); THE WORDS (the sentences a guest most needs, at 12 px
today: as they are; at the guest's reading size, 15 to 16 px, where they are; gone from the banner, the tile
carrying its own state). Optional if it fits the budget: LANDING (the guest's own tile: the fade and the check
that vanishes; the check fading out like everything else in the system; the same instant arrival as everyone
else's, the album's own Live signal doing the announcing). The `guest-shape` board is the worked example for a
shape board on real guest components with fixtures (its fixtures, its quoted portal-bound shells, its measured
captions); copy its approach, import nothing from another board's directory.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; the guest's reading copy at 15 to
16 px); the `upload` touchpoint's ruling as precedent reopened ("Header Add on load and a floating Add on scroll,
never both; progress in the gallery, a green check, a play badge on video"); the banked-shimmer ruling (a batch
never shimmers: "A couple dozen photos being uploaded in a single batch would cover the top of a gallery in
shimmer"); the never-re-encode invariant and the limits single source (mirrored in SQL); the security pieces out
of frame (presign server-side, raw R2 keys never in the browser, the session token the sole capability); reduced
motion honoured; no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required: camera and
library pickers, upload progress on phones, shared-album contribution flows, "pending approval" states.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board guest-upload` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real components with fixtures, no upload from a preview; a capture of every
  option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board guest-upload` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
