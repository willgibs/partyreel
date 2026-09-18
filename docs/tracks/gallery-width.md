---
track: gallery-width
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d62dac22"         # the launch-prep SHA the branch was cut from
board: gallery-width    # a new question-first board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/gallery-width/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/event-experience.tsx
  - src/components/shared/masonry.tsx
---

# lp/gallery-width

**Goal.** One question-first board that decides how wide photo galleries run on laptops and desktops,
on the guest's event page and in the host's app. Authored with `defineExploration`
(`src/components/lab/exploration.ts`), never `new-board.mjs`: a handful of decisions in plain words,
every option drawn as the real gallery with real photographs at real window widths. **Not in this
round:** any production byte (the wiring lane ships the pick), the phone (unchanged), the gallery's
look (tiles, corners, the gap: `ladders-wiring` owns those this round).

**Binds.** The bible, the component contracts, the policies. The newest section of
`docs/design/rulings.md` (2026-09-18) and `docs/PROGRAM.md` "A round returns DECISIONS", including its
two newest sentences (a relative note is answered against a reference, never a cap and a test;
placeholder copy is judged for its size and wrapping).

## What he said

Asked about widening the guest album to 880: "This will likely require its own exploratory track, but I
currently dislike how we're restricting the width of the gallery (both in app and real guest event
pages) on larger screens. For laptops, desktops, etc., it makes way more sense to use the full width for
galleries to show more images. So, as an immediate answer, it's fine to do both, but as a larger answer,
the real guest album page already needs to be widened anyway."

Told that an interim 880 cap works against that (the cap wraps the whole page and the album stays two
columns, so tiles get bigger and fewer fit), and asked whether to skip it and run this board: "Let's skip
it and run the board as you recommended. However, as a quick note before the board, in my request for
widening the gallery, we'd keep image tiles to a smaller size and add more columns. Not go wide and keep 2
col."

## What is settled, so build rather than ask

- **Tiles stay small and the columns multiply as the window widens.** A wide two-column masonry is
  never an option.
- **The phone is unchanged**: two columns at 375.
- **The words stay in a readable column.** The header, the demo banner, the reel card, the Add and Save
  buttons and the guest list keep a readable measure; only the gallery runs wide.
- **Today, measured.** The guest page: `event-experience.tsx:165` caps everything at `max-w-2xl` (672,
  so 632 of content) at every window from 672 up; `GuestHeader` and the floating Add pill sit outside it.
  `GuestMasonry` (`guest-masonry.tsx:83`) is `columns-2` at every width, CSS columns, so each tile is
  about 314px wide. The host app: `Container` is `max-w-7xl` (1280) with 16/24/32px gutters and the
  event gallery is `MasonryColumns` (`masonry.tsx:114`), `columns-2 sm:columns-3`, about 403px tiles; the
  review queue is `grid-cols-3 sm:grid-cols-4` at 4:5. The event page's loading skeleton does not match
  its own gallery (`loading.tsx:21`).
- **Draw the REAL components with fixture photographs.** `<Frame w={1280} h={...}>` with
  `<GuestMasonry items={fixtures} />` as its children resolves every breakpoint at the frame's own width
  (`frame.tsx`), with no event and no sign-in (`LikeButton` renders nothing without a `LikesProvider`).
  `SAMPLE_MEDIA` (`src/app/(dev)/design/reference/sample-data.ts:29-88`) gives varied ratios over the
  marketing stills. A column count set from outside has a precedent in `album-hero/album.css:25-27`
  (`:where([class~="columns-2"]) { column-count: var(--cols) }`): copy it into your directory, never
  import from a board that retires.
- **Windows: 1280 (a laptop), 1512 (a big laptop), 1920 (a desktop).** At 1:1 the wider frames are wider
  than the step's stage column, so the step scrolls them sideways or fits them and says which; a
  `configs` knob for the window keeps one frame on screen at a time.
- **The gap and the corner are `ladders-wiring`'s this round** (the gap becomes `--gap-gallery`, 4px under
  family C, and the tile corner 4px). Draw with the tokens (`gap-[var(--gap-gallery)]`, `rounded-tile`),
  never a literal, so your previews follow when it merges.

## The decisions (each drawn at 1280, 1512 and 1920; the phone stays as it is)

1. **The tile size** ("How big should a photo tile be on a laptop and a desktop?"): three sizes, each
   drawn with the real photographs and the columns following from it at every window [recommended: the
   one that reads a face at a glance]. Name each by its width and by how many columns it makes at each
   window.
2. **How wide the gallery runs** (after the tile size): the full window with a gutter [recommended: his
   "use the full width for galleries"] / a wide container step (1280, the app's `Container`).
3. **The host app's galleries** (after how wide): the same rule / their own. Recommend after drawing the
   host's event gallery both ways.

## The lab you are building for

The Orchestrator is rebuilding the step while you build, and it lands on launch-prep before your
handoff: **the preview is the page and the answer is a dock.** Every option is drawn ONCE, on the
stage, at its true size (flipped one at a time, or side by side when they fit), and a staged decision is
drawn wearing the answers it waits on. So draw each option as the real page at its real width (a
`Frame`), never a thumbnail. A preview may be a FUNCTION of the board's state (`Preview` in
`exploration.ts`): the width options can read `s.tile` and draw at the tile size he picked.
`src/app/(dev)/design/sandbox/type-phone` is the worked example of the authoring shape; it retires when
`ladders-wiring`'s phase 1 merges, so read it at your cut.

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (after river-visual's; copy its shape,
  `board` block included);
- `touchpoints.test.ts`: the id in "marks exactly the standing sandbox boards".
Two other lanes add theirs at the same places, so the Orchestrator merges those lines keep-both. Never
reorder, re-sort or reformat the lists; if `pnpm format` touches a hunk outside your lines, revert it.
`pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json` (generated;
allowances in the lane check).

**Names `ladders-wiring` changes, which you build against**: `rounded-3xl` and `rounded-4xl` become no-ops
and `shadow-float` and `--radius-action-lg` retire, so use none of them; `text-subhead` and `size="cta"`
arrive with its merges, so do not depend on either before your sync.

## Verify, and the gate

The board at 1280, 1512 and 1920, and the phone checked unchanged at 375. **Measure every tile**:
screenshot every option beside its option's words and check the picture shows what the words claim, and
report the measured tile width and column count per option per window (PROGRAM.md; a tile drawn with its
sign backwards reached Will once). Dev server on port 3135, stopped by port
(`lsof -ti tcp:3135 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on its own exit
code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135` (0 routes failing;
the board under the reading budget), `pnpm lab:demo --board gallery-width --base http://localhost:3135`
(0 failing; after your sync it also judges the new step's CLIPPED, UNLABELLED and NO DOCK).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke, lab:demo
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + the generated files
- Each decision, one line: its options, the recommendation, and the measured tile width and columns per window
- Captures (paths): every option at 1280, 1512 and 1920 beside its words, and the phone at 375
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot, never the picture)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
