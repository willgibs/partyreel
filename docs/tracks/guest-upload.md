---
track: guest-upload
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Does "take a photo" get to be one photograph at a time?** `tap=split` needs a second input carrying
  `capture`, and on iOS `capture` opens the camera directly AND drops multi-select. **Recommended: yes.** A
  photograph taken at the party is one photograph; the library door keeps `multiple`. Carried on with it.
- **May a guest see their own unapproved photograph?** `held=tile` and `held=line` both need the guest's own
  pending rows returned to the device that sent them, which is a new visibility rule (the capability is their
  own session token; nobody else's page changes). **Recommended: the sender sees their own held item and
  nobody else does.** Carried on with it; `held=toast` needs none of it.
- **May a tile appear before its bytes land?** `batch=line` reverses today's rule that only an APPROVED
  completion prepends an optimistic tile, so a later refusal has to take a photograph back out of a place the
  guest already saw it. **Recommended: keep today's rule, which is why the board recommends `one`.** If `line`
  wins, its wiring owes the take-back.
- **Does `body-type`'s caption floor already answer `words`?** That board is on the desk with the caption and
  label sizes open. If its floor lands above 12px, `words=read` is implied and this step is a confirmation
  rather than a decision. **Recommended: let `body-type` rule the floor; read `words` as the upload act's own
  case, which is the one place the smallest type carries the most load.**

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (lab-only round; the nine upload seams are already recorded in `tracks/orchestrator.md`, "The upload act")

## Deferred (ROADMAP one-liners, bucket named)

- Now: the hold-for-approval toast and the floating Add pill both sit at the foot of a phone and the toast
  covers the pill; whichever `held` answer wins, the wiring owes the two surfaces one stacking rule.
- Now: `guest/file-dropzone.tsx` is written for guests (drag and drop, its own copy) and rendered only by the
  host's manual add; no decision on this board wanted it, so the wiring either gives it a home or deletes it.

## Handoff (replaces the chat report)

- Head: the code is `d3a5eb20`, the sync merge `4bd6a353`, and this manifest commit is the tip; pushed to
  `origin/lp/guest-upload`. Synced with `launch-prep` at `e8250e40` (it had moved 36 commits; five boards
  landed, so the registration conflicts were resolved by keeping BOTH sides' added lines).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (123 components, 733 contracts,
  18 policies); `pnpm typecheck` ok; `pnpm lint` ok (0 errors, the 8 known warnings); `pnpm test` ok (2,521 in
  241 files); `pnpm build` ok (254 static pages); `pnpm lab:smoke --base http://localhost:3133` ok (358 checks,
  0 failing; the board reads 668 words against the 1,200 budget); `pnpm lab:demo --board guest-upload` ok
  (8 steps, 0 failing, every step draws its options).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/design/library.md` (generated), `src/app/(dev)/design/(shell)/lab/boards.ts`,
  `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/touchpoints.ts` (the three registration
  exceptions, one line each plus the RULINGS row after `river-visual`'s), the eight files of
  `src/app/(dev)/design/sandbox/guest-upload/`, and this manifest. No other path.
- The decisions, one line each (four roots, then four staged behind them):
  - `tap`: what happens the instant a guest taps Add; the phone's own chooser as today / our own sheet naming
    both acts / two buttons and no sheet at all. **Recommended `split`.**
  - `sending`: what a guest sees while their own photograph is flying; the silent strip as today / the strip
    and one word / nothing until a file has been going two seconds. **Recommended `late`.** Knob: the file is a
    photograph or a 212 MB clip.
  - `held`: what a guest sees when the host approves uploads first; a toast and then nothing as today / a tile
    that waits under a clock / a line that keeps their own count. **Recommended `tile`.** Knob: whether
    anything of theirs is waiting, which is the seam where today's banner says the same sentence either way.
  - `failed`: what a guest sees when one file will not go; dimmed with Tap to retry as today / the tile keeps
    the reason and a Retry / one sheet at the end of the batch. **Recommended `reason`.** Knob: the three
    refusals, which is where the precise one and the vague ones sit side by side.
  - `batch` (after `sending`): what a dozen at once does to the top of the album; one tile per file as today /
    one stacked tile counting down / all twelve at rest under one counting line. **Recommended `one`**, and the
    measured line is the argument: nine of a guest's own tiles hold 43 percent of a phone's screen, one holds 11.
  - `landing` (after `sending`): how a guest's own photograph says it arrived; today's green check / the banked
    shimmer spent on one tile once / no mark of its own. **Recommended `sweep`.**
  - `warning` (after `tap`): what a guest is told before their files fly; nothing until the server refuses as
    today / the terms under the button / the terms plus a named stand-in for a file the browser cannot draw.
    **Recommended `both`.**
  - `words` (after `failed`): how big the two sentences a guest most needs should be; 12px as they are / 15px
    where they are / 15px and the standing banner goes. **Recommended `read`.**
- Mobbin citations: none (it was not needed; the decisions are all drawn on our own shipped surfaces).
- The captures: every option at 375 and at 1440, read against its own words, at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/shots/`
  (48 PNGs plus `captions.txt`, which is each frame's measured caption). They caught four real defects, all
  fixed: a caption claiming twelve where nine were drawn, a count line scrolled off the top of its own frame,
  a full-tile cover painting over the progress strip under it, and `warning=both` silently dropping the
  progress chrome along with the blank tile it was meant to replace.
- Assets requested from Will: none new. The board's photographs are the twelve marketing stills re-declared at
  the shapes a phone shoots; the guest album's real frames are already asked as ASSETS rows 12 and 22.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab-only round, no production byte.
- Look at first: `batch` at 375. It is the one step where the measured numbers make the argument by
  themselves, and it is the board's answer to the banked shimmer's stated reason. Then `landing`, where
  `lab:demo` reports today's green check and no mark at all as the SAME picture: an 18px badge is 1 percent of
  a tile, which is the case for spending the shimmer there.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of the upload act asked the product's core act
from the foundation as eight decisions, phone first at 375 by 812 with 1440 on a knob, every option drawn on
the shipped guest components over one wedding with fixtures and no byte uploaded: what the tap opens, how one
photograph reads while it flies, what a dozen at once does to the album's head, the moment it lands, what a
held upload draws, what a refused file says, what a guest is told first, and how big the two smallest
sentences are. Four decisions are roots and four are staged behind them. Every caption is read off the
laid-out DOM inside the frame, which is how the round caught a caption claiming twelve where nine were drawn.
The banked shimmer is offered a home on the one tile it can never stack on, and today's landed check measures
1 percent of a tile.
