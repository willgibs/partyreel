---
track: gallery-width
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The app shell, if the host follows the guest.** `host=same` with the words at the edge pins the
  host's event page to the left gutter, header included, and `AppShell` is one header for every app
  page. Does the whole app pin left from `lg` with it (the dashboard's event cards then run wide as a
  gallery of their own), or only the event page? Recommended: the whole app, from `lg`: a header whose
  logo moves between pages reads as a bug, and the dashboard's grid is a gallery by the same argument.
- **The host's uniform grids.** The review queue and the reel grid are squares-at-4:5 grids
  (`grid-cols-3 sm:grid-cols-4`), not masonry. Under the tile rule they would take the same column
  width as `repeat(auto-fill, minmax(<tile>, 1fr))`. Recommended: yes, one tile width for every gallery
  (at 240 the review queue shows five at 1280 and eight at 1920 instead of four); the wiring draws them.
- (Not a chat question, flagged so the count is right: the board asks FOUR decisions, not the brief's
  three. Drawing the wide album made the words' place the first thing the page shows, and the goal
  settled that the words keep a readable column but not where it sits, so `words` is asked on the board
  after `width`, recommended `edge`.)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (a lab-only round; no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- Major overhauls, the lab and the kit: `defineExploration` flattens every decision's `configs`, so a
  knob several decisions share arrives once per decision (a duplicate dock knob and a React key
  warning); dedupe by id in the constructor (`gallery-width/spec.ts` dedupes its window knob by hand).
- Major overhauls, the lab and the kit: a bare `Frame` ignores the lab's Fit, so a 1920 frame stays
  1:1 and the stage head's scale button seems dead; fold `WindowFit` (`gallery-width/pages.tsx`: a
  `data-stage-fit` box with a CSS zoom, measured honest on an iframe) into `Frame` or the stage.

## Handoff (replaces the chat report)

- Head: the handoff commit (this manifest alone) on top of `66b5076b`, pushed. Synced three times,
  every one a merge: `5a5c6eb4` mid-round on the Orchestrator's word (the rebuilt step, before
  measuring); `74f98761` in `5cdb0d04` (ladders-wiring's corners and the glow retirement: the
  registration conflicts resolved keep-both, `touchpoints.test.ts` taken from launch-prep because its
  standing list is derived now, `library.md` regenerated, never hand-merged); and `8fa6fd83` in
  `66b5076b` (the ghost-wiring manifest, docs only, which landed after the first handoff commit)
- Gates on the synced tree (`66b5076b`), each step's own exit code: design:rules 0 (no diff;
  the lane's one generated change is `library.md`'s new row), specimens 0 (no diff), typecheck 0 (with `.next/dev` cleared: a dev
  server's stale validator still named the retired rounding route), lint 0 (0 errors, the 8 existing
  warnings, none here), test 0 (228 files, 2,137 tests), build 0 (254 pages), lab:smoke 0 (203
  checks, 0 failing; the board reads 293 words of 1,200), lab:demo 0 (4 steps, 0 failing: tile moves
  71.1%, width 62.2%, words 4.6%, host 52.0%; 1.7 screens each, no CLIPPED, UNLABELLED or NO DOCK)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `sandbox/gallery-width/` (spec, board, pages, fixtures, the sheet), this manifest, the registration
  lines in `sandbox/registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts` (the id, the union
  members, the row), and the generated `docs/design/library.md`. Nothing else; `rules.generated.json`
  did not move
- `tile` (the tile size): about 180 / about 240 / about 300 px, recommended 240 ("reads a face at a
  glance": the phone's tile at arm's length). Measured on the guest album, full window, as columns x px
  at 1280 / 1512 / 1920: 180 = 7x174 / 8x181 / 10x184; 240 = 5x245 / 6x242 / 8x232; 300 = 4x307 /
  5x291 / 6x310. Today: 2x314 everywhere
- `width` (after tile): the full window (20 px gutters) / the app's 1280 column, recommended full.
  At 240: full = 5x245 / 6x242 / 8x232; container = 5x240 at every window
- `words` (after width; added, above): at the album's left edge / centred as today, recommended edge.
  The gallery is identical (5x245 / 6x242 / 8x232); the name starts at x 20 / 20 / 20 or 324 / 440 / 644
- `host` (after `width=full`): the guest album's rule / their own, the app's 1280 column, recommended
  same. At 240 with the words at the edge: same = 5x240 / 6x238 / 8x229 (the page pinned to the 32 px
  gutter); own = 5x240 at every window (the Container). Today: 3 columns of about 403. At 1280 the two
  are the same picture, and the step says so
- The phone, unchanged: every frame narrowed to 375 in the browser measured the guest album at 2 x
  165.5 px (335 wide, the name at 20) and the host's at 2 x 169.5, which is what ships
- For the wiring, the candidate is one declaration per gallery, made from outside in
  `gallery-width.css`: from `sm` up `column-width: <tile>` with `column-count: auto` in place of the
  count (170 / 220 / 280 px for 180 / 240 / 300; each holds its column counts at a 3 or 4 px gap and
  with a classic 15 px scrollbar). In code that is `sm:columns-[220px]` on `guest-masonry.tsx`,
  `shared/masonry.tsx`, `selectable-media-grid.tsx` and `gallery-skeleton.tsx`; `event-experience.tsx`
  moves its `max-w-2xl px-5` from the whole page onto the words (the gallery section runs `px-5`, or
  the Container); the host's Gallery section leaves the Container; `loading.tsx` stops drawing a grid
  its own gallery does not have (the brief's finding)
- Captures (paths, under `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b4ab430f-9f27-40b5-90a6-4177ea1d1021/scratchpad/gallery-width/`):
  `final/<ask>-<option>-<window>.png`, all 27 (every option at 1280, 1512 and 1920, dark, 1:1, in the
  real step: the stage head naming the option and its meaning, the frame's measured caption, the dock
  with every option's words), with `final/measured.json`; `final-light/` the same 27 in light;
  `final-phone/` the 9 at the 1512 window on a 375 phone; `final-fit/` the 9 at the 1920 window under
  the lab's Fit on a 1512 screen (the stage head says "Fit 52%", and the frame still measures 10 / 8 /
  6 columns inside, because a zoom leaves an iframe's own viewport alone)
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot,
  never the picture). The stand-in album is the twelve marketing stills declared at a phone roll's
  shapes; ASSETS row 5 (the demo event's folder) is the slot that makes the tile judgment exact, and
  at ten columns the twelve stills still repeat
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: the `words` step (the fourth decision), then the `host` step's `same` at 1920, which
  wears the words answer: with the words at the edge the host's page pins its header and column left,
  which is Question 1. Kit: the window knob is one control shared by four decisions (deduped in the
  spec), and the frames keep the lab's Fit through `WindowFit` (both in Deferred)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `gallery-width` round one asked how wide a gallery runs on
a laptop and a desktop as four decisions, each option the real guest or host event page in a `Frame` at
1280, 1512 and 1920 over forty stand-in photographs shaped like a phone's roll, its columns measured
inside the frame: the tile (about 180, 240 or 300 px; 240), the width (the full window or the app's
1280 column; full), where the words sit (the album's edge or centred; edge, added once the wide page
showed it) and whether the host's galleries follow (same). The candidate is one `column-width` per
gallery from `sm` up, so the phone kept its two columns. Two kit findings: the constructor duplicates a
shared `configs` knob, and a bare `Frame` ignored the lab's Fit.
