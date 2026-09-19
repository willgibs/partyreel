---
track: trail-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4b4d1459"         # the launch-prep SHA the branch was cut from (the stub said 97207988; the tip had moved)
board: image-trail      # RETIRES here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/trail/
  - src/app/not-found.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/app/(dev)/design/sandbox/image-trail/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/image-trail.json
  - src/components/shared/river/river-engine.ts
  - src/components/shared/river/river.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/lib/shared/use-prefers-reduced-motion.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/privacy-hero/paths.ts
---

# lp/trail-wiring

**Goal.** Wire `image-trail` round one (`docs/reviews/image-trail.json`, 2026-09-18) and bank the trail in the
Library. `density=d140` ("140 px: loosely overlapping... the trail reads as a line of separate photographs"),
`decay=long` ("Long: 2 seconds, a slower shrink... keeping a third of its size") with his number: "I'd maybe even
suggest 3 seconds to calm it down just a bit" (three seconds is the build), `entrance=flick` ("Behind it, turned
the way you threw it": "Following the way it was thrown rather than the cursor feels a lot more natural and
fluid. Keeping the image trail behind the cursor also allows better cursor visibility/tracking than keeping the
image directly beneath it"), `size=s180` ("180 px, and 100 on a phone"), `home=notfound` ("The 404... the light
answer: paper ground, dark hairlines"), `phone=walks` ("It draws itself... walking its own path at the same pace,
so the screen is alive the moment it is opened and a finger is never asked for") with "Different path than
current, if that's not a future question I'll encounter". Will called the trail "a takeaway win"; the privacy
hero takes a different concept in another lane, so this lane touches nothing under `sandbox/privacy-hero/`.
Production bytes on the 404: the red-team lands on the alias. The board RETIRES here.

**What exists.** The board's engine (`sandbox/image-trail/trail-engine.ts`, pure, with `looks.ts` holding every
stated number to what the engine measures; the keeper holds the newest photograph while the hand rests, the shy
fade yields to the words it crosses); `homes.tsx`'s `NotFoundHome` is a one-to-one composition of the real
`src/app/not-found.tsx` (paper by ruling, `MarketingHeader`, `MarketingNotFound`, `MarketingFooter`).
`MarketingNotFound` renders `NotFoundScreen` with the compass, the 404 eyebrow, "We lost this page", the two
actions and `MissingFrameStrip`. Today `walks` on a phone replays the capture's scripted sine sweep, the same
path every desktop capture uses: that is the "current" path he wants different. `wanderPath` in the engine (a
deterministic non-repeating random walk, proven at a phone column on the privacy-hero board) is the ready
candidate; a path of your own is fine if it is better, with the reason in the Handoff.

**What to build.**

1. `src/components/shared/trail/`: the engine trimmed to the ruled look (d140, a 3 s decay with the slower
   shrink, flick, 180 px and 100 at a phone), the keeper and the shy fade kept and named, a source interface with
   two sources (the pointer, and a path walked on its own for a phone or a hand that never arrives), two
   contracts (`// @contract-for:` tests that guard function, never look: the pool, the birth rule, the lifecycle,
   the clock stopping at rest, zero layout reads per frame), no new dependency, the pointer listener passive,
   IntersectionObserver and `document.hidden` holding the clock, reduced motion a still composition, scripting
   off the page standing.
2. The 404: the trail behind the page's own words on the paper ground, the words the loudest thing on the
   screen (the shy fade), the photographs from the site's pool through `marketingImage` (ASSETS row 21 replaces
   them later; the slot named). `MissingFrameStrip` stays or yields to the trail: your call, with the reason.
3. The phone's path: a walk of its own (`wanderPath` or better), the same pace, alive the moment the page opens,
   never asking for a finger.
4. The Library entry in `gallery-demos.tsx` with the pointer and the walk demonstrable (add your entry at the
   head of the file and touch nothing else there: two other lanes add theirs the same way this round, and the
   Orchestrator keeps both at the merge; the same rule for `for` lines in `rules/component-notes.ts`).
5. Retire `image-trail`: the directory deleted, its lines removed from `registry.ts` and `boards.ts`, its RULINGS
   row in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent), never deleted.

**Binds.** Bible 1, 4, 13, 14, 22; the 404's paper ruling (2026-08-26); `keyframe-uniqueness.test.ts`; the
guidance's craft stack (a rare moment may carry real delight; exits at most as long as enters); no em-dashes; the
404's copy is open and unchanged.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line).
- Measured on the real 404 at 1440 and 375: the busiest and the quietest instant's lit count, the decoded weight
  of the pool, the frame cost under a 4x throttle, zero animation frames at rest with the keeper standing, reduced
  motion (a still), scripting off, nothing focusable, the words' contrast over the trail at its worst.
- The screenshot gate: the 404 beside the home hero at 1440 and 375.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The shy fade's mechanism changed, and it is the one call worth his eye.** Will ruled the
  photographs and the home, never how they stay off the words; the board dimmed each CARD by how
  much of its own area lay over the block. Measured on the real 404 that leaves the description line
  at **1.49:1**, and retuning the two numbers moved it between 2.2 and 5.1 from one run to the next,
  because a card is one opacity (so a card half over the block dims its clean half too) and the trail
  OVERLAPS at this density (so faint cards stack). It ships as a feathered WINDOW on the layer
  instead: same name, same reading, and the floor is now a guarantee whatever stacks inside it. Worst
  measured line: **4.90:1** at 1440 and at 375, stable across runs. **Recommended: keep.** Nothing to
  relay unless he wants the trail louder over the words, which costs that line directly (0.22 over
  paper leaves it 4.18:1, under the body bar).
- **`MissingFrameStrip` yields on the ROOT 404 and stays everywhere else.** The strip says the trail's
  sentence in a quieter voice (photographs, one missing) and reads as placeholder tiles still loading
  once real photographs are moving behind it. It stays on the two group 404s (a `notFound()` inside a
  marketing route, boxed at 60vh with no trail), on the 500 screen and in the help palette.
  **Recommended: keep.** His to overrule.
- **The trail is on the ROOT 404 only, not the two group 404s.** The root one serves every unmatched
  URL, which is the 404 a lost visitor actually lands on, and it is the forced-paper one his ruling
  described ("paper ground, dark hairlines"); the (cinema) group 404 stands on dark and was never the
  ground he judged. The group files are also outside this lane's `owns`. **Recommended: keep. If he
  wants all three, it is a small lane of its own** (both group wrappers need a positioned, clipped
  full-area stage; today they are 60vh boxes).
- **A reader with scripting off gets the 404 with no photographs.** A birth is a function of TRAVEL in
  px, so the composition cannot be solved without the box, and the server has no viewport. The board
  solved it by declaring a canvas; a real page is every width between 320 and 2560 and its copy wraps
  differently at each. Measuring is also what lets the shy window track the real lines instead of a
  table true at two widths. The page itself stands: the block, both actions and all five links, on
  clean paper. **Recommended: accept.**

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, the Error taxonomy's **Boundaries** paragraph: one clause added in
  place saying the root 404 stands on the image trail, where the component lives, that the words punch
  a feathered window rather than wearing a scrim, the measured floor, that the strip yields there and
  stays on the group 404s, and that scripting off gets the block with no photographs.

## Deferred (ROADMAP one-liners, bucket named)

- **Marketing / polish:** the two group 404s ((cinema) and (paper), a `notFound()` thrown inside a
  marketing route) still ship as 60vh boxes with the tile strip; give them the trail, or rule that the
  root 404 is deliberately the only one that carries it.
- **Design system / lab:** `collect-specimens.mjs` lifts a specimen's JSX out of the entries array's
  own source, so a Library entry hoisted into a named const renders perfectly and ships with NO code
  panel, and `specimens.test.ts` cannot see it (it only holds the artifact to what the collector saw).
  Caught here by counting; worth a guard that fails an entry the collector could not read.
- **Marketing / assets:** `docs/ASSETS.md` row 21 (trail frames) is unchanged and still open: the
  twelve landscape stand-ins are cropped hard to 3:4, 4:5 and 1:1 by slot. The slot is
  `src/components/shared/trail/trail-frames.ts` and the swap is a data change there and nowhere else.

## Handoff (replaces the chat report)

**Head:** the tip of `lp/trail-wiring`, which is the commit carrying this manifest; its parent is
`97f8af28`, the last code commit. Synced: `origin/launch-prep` had moved 14 commits (through
`fc9eed26`), merged at `b7a117b6` with one conflict, `docs/design/library.md`, which is GENERATED
(resolved by regenerating). The registration files (`registry.ts`, `boards.ts`, `touchpoints.ts`)
auto-merged and hold BOTH retirements, gallery-width's and image-trail's.

**The gate, each on its own exit code, on the synced tree:**

| step | exit |
| --- | --- |
| `pnpm design:rules` | 0 |
| `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` | 0 (126 specimens on 92 entries) |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (the 8 known warnings, none in this lane) |
| `pnpm test` | 0 (2,499 passed) |
| `pnpm build` | 0 |
| `pnpm lab:smoke --base http://localhost:3134` | 0 (264 checks, 0 failing; the key in the environment) |

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`):

```
docs/design/library.md                                     generated (pnpm design:rules)
docs/systems/design-system.md                              the one clause above
src/app/(dev)/design/(shell)/lab/boards.ts                 the retiring board's two lines
src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx   this lane's entry, at the head
src/app/(dev)/design/rules/component-notes.ts              this lane's three `for` lines, at the head
src/app/(dev)/design/rules/rules.generated.json            generated (pnpm design:rules)
src/app/(dev)/design/gallery/specimens.generated.json      generated (collect-specimens.mjs)
src/app/(dev)/design/sandbox/image-trail/*  (10 files)     the board, deleted
src/app/(dev)/design/sandbox/privacy-hero/{board,hero,paths}.tsx|ts   THREE IMPORT LINES, see below
src/app/(dev)/design/sandbox/registry.ts                   the retiring board's two lines
src/app/(dev)/design/touchpoints.ts                        the RULINGS row rewritten as shipped
src/app/not-found.tsx                                      owned
src/components/marketing/marketing-not-found.tsx           owned
src/components/shared/trail/*  (6 files)                   owned, new
```

**The three lines outside `owns`, and why they are forced.** `sandbox/privacy-hero/` imported the
engine and the layer from `sandbox/image-trail/`, which the manifest orders deleted, so the retirement
cannot land without them: `paths.ts`, `hero.tsx` and `board.tsx` each have ONE import path rewritten to
`@/components/shared/trail/…` and nothing else (plus one stale path inside a comment). No behaviour
changes, no look changes, and nothing in that board was designed, read or judged: the engine kept its
multi-path replay, its `factsOf` signature, the `Entrance` union and `spiralPath` precisely so this
would be a path rewrite rather than a rework. Round three of that board replaces it wholesale anyway.

**The items, one line each.**

1. `src/components/shared/trail/trail-engine.ts` — the engine promoted and trimmed to ONE ruled look
   (`RULED`: d140, three seconds with the shrink slower than the fade and a third of the size kept,
   the flick, 180 px and 100 below 640 px), the board's 3x3x3x3x4 option matrix gone with the board;
   the keeper, the shy fade and the source interface kept and named; `trailSpec` / `trailWalk` /
   `stillAt` / `pickPhase` / `shyWindow` derive everything from a measured box; no new dependency.
2. `src/components/shared/trail/trail.tsx` — `Trail` (the stage: it measures its own box and the
   words' box, picks the opening, mounts the layer behind the words) and `TrailLayer` (the pool, the
   resting composition, one rAF loop). The pointer listener is passive, the box is read on mount and
   on a resize or scroll and NEVER in the loop or the handler, and the loop is SUSPENDED off screen,
   on a hidden tab, under reduced motion, and at rest with the keeper standing.
3. Two contracts, function never look: `trail-engine.test.ts` (57 pins: the birth rule, a card's
   closed-form life, the ring and its ceiling, the keeper, the rest state, the shy window's geometry
   and its union alpha, the walk's measured pace, the chosen opening, the derived spec, the frames)
   and `trail.test.tsx` (17 pins: decorative and unfocusable, the pool, zero layout reads per frame,
   the four ways it stops, the two sources). Retune every number in `RULED` and both stay green.
4. `src/components/shared/trail/trail-frames.ts` — the photographs, as the slot ASSETS row 21 fills.
5. The root 404 (`src/app/not-found.tsx`): `<Trail>` IS the main's area, the words stand inside it,
   `MarketingNotFound strip={false}`.
6. The Library entry (`trail`, badge `new`, Surfaces) with three specimens: the pointer on paper, the
   walk at 375, and the trail with no words to stay off. Declared inline so its code panel ships.
7. `image-trail` retired: the directory deleted, its lines out of `registry.ts` and `boards.ts`, its
   `SandboxId` member gone, its RULINGS row rewritten as shipped (never deleted).

**The phone's path, and why it is not the capture's sweep.** Will: "Different path than current, if
that's not a future question I'll encounter." The scripted sweep was two sines that closed on
themselves, so every visit watched the same choreography. `wanderPath` (the manifest's candidate)
ships, with three changes of this lane's own: its pace is set in **px a second** rather than radians
(`wanderSpeed` walks the curve once at unit speed and scales, because the closed form is the RMS and
what a trail travels is the mean of |v|, which is up to a sixth lower and depends on the box's shape);
the opening is **chosen** (`pickPhase` keeps the best of five random openings, scored on how much lit
photograph stands clear of the words, so a reader who asked for less motion never meets a page whose
whole trail is behind the block, and two visits still differ); and a phone's walk **reaches further**
(0.44 / 0.46 of the box against a laptop's 0.40 / 0.38) because a 375 column is almost all words, and
a sine dwells at its extremes, which is exactly where the clear bands are.

**Measured on the real 404** (headless Chrome over CDP, `pnpm dev -p 3134`, a throwaway harness,
nothing installed):

| | 1440 x 900 | 375 x 812 |
| --- | --- | --- |
| the stage the trail gets | 1440 x 579 | 375 x 586 |
| the card | 180 x 240 | 100 x 133 |
| ring (DOM nodes) | 20 (the ceiling) | 11 (derived) |
| photographs lit, busiest / quietest / mean | 10 / 5 / 7.4 | 8 / 4 / 6.0 |
| decoded weight of the pool | 1.97 MB (1.16 MB distinct; 12 sources) | 0.29 MB |
| the trail's own scripting per frame | **0.102 ms** | 0.110 ms |
| the same under a 4x CPU throttle | **0.261 ms** | - |
| page frame rate | 37-39 | 60 |

The frame rate at 1440 is the PAGE's, not the trail's: hiding every card leaves it at 39, a 4x CPU
throttle does not move it, and the trail's own share is a tenth of a millisecond. It is this headless
build's software compositor (`--disable-gpu`) on the marketing chrome; at 375 the same page runs 60.

- **At rest, with the keeper standing: 0 animation frames asked for in two seconds**, one photograph
  lit, and the frame it holds is byte-identical a second later. It wakes on the next pointer move.
- **Reduced motion:** the resting composition is drawn, the loop never starts (0 frames), nothing
  inline is ever written, and nothing moves over 1.2 s.
- **Scripting off:** no trail; the block, the heading, both actions and all five footnote links stand
  on clean paper (`/`, `/help`, `/features`, `/pricing`, `/contact`).
- **Nothing focusable, `aria-hidden="true"`, `pointer-events: none`** on the layer, every `alt=""`,
  `sizes="180px"` (never a vw).
- **The words' contrast over the trail at its worst**, sampled off the composited pixels inside each
  line's own glyph boxes while a hand sweeps straight across the block, 26 moments a width:
  **4.90:1 at 1440 and 4.90:1 at 375** (worst line: the muted description; medians 19.1 and 13.6).
  Before the window it was 1.49:1 and unstable. Opaque surfaces (both buttons) are excluded: their
  own background is above the trail.

**The screenshot gate:** the 404 beside the home hero at 1440 and at 375. It holds. The home hero is
photographs streaming out of the code on cinema ground; the 404 is the same sentence on paper,
photographs laid down by the reader's own hand, achromatic type, media as the only colour. It is the
paper answer to the hero rather than a different page.

**Assets:** none new. ASSETS row 21 (trail frames) stands unchanged and the slot is named in code.

**Look at first:** the 404 at 1440 with a mouse. Draw across the words and watch a photograph pass
behind them; then STOP, and notice the last photograph stays with you while the rest go.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged at `<sha>`. The image trail left the lab for `src/components/shared/trail/` at the look Will
ruled on 2026-09-19 (d140, three seconds with the slower shrink, the flick, 180 px and 100 at a
phone), and the root 404 now stands on it: the words inside the stage, photographs laid down behind
them, the keeper leaving one in the reader's hand when they stop. Measuring the real page moved three
things the board could not see: the shy fade became a feathered WINDOW on the layer after the per-card
dimmer left the description line at 1.49:1 and unstable (4.90:1 now, at both widths), the resting
composition is chosen from five random openings rather than dealt, and a phone's walk reaches nearly
to its edges because a narrow column is almost all words. The board retired, its row rewritten as
shipped; `MissingFrameStrip` yielded on the root 404 and stayed everywhere else.
