---
track: backdrop-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a0a84e04"         # the launch-prep SHA the branch was cut from
board: cursor-backdrop  # the board this lane wires and RETIRES
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/backdrop/
  - src/components/marketing/sections/home/
  - src/app/(dev)/design/sandbox/cursor-backdrop/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/systems/marketing-content.md
  - docs/reviews/cursor-backdrop.json
  - docs/ASSETS.md
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/shared/river/river-engine.ts
  - src/components/shared/river/river.tsx
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-prefers-reduced-motion.ts
---

# lp/backdrop-wiring

**Goal.** Wire `cursor-backdrop` round one, ruled whole by Will on 2026-09-18 (`docs/reviews/cursor-backdrop.json`;
his words verbatim in `docs/design/rulings.md`, "full-image sections are chapter transitions"): the home page's
`full-quality` section becomes the switching photograph section, with the glass **plate** for its copy, the
**band** trigger (the photograph indexed by the pointer's position across the section) with the index rail at the
foot ("I absolutely love the rail of the foot, and tracking the Cursor's position justifies this delight"), the
**slide** entrance ("much more natural and fluid"), and at a phone the **scroll** rule as he clarified it: "pass
through 4-5 images at steps as it scrolls vertically, not requiring taps", never the full eight, so a reader who
stops scrolling reads in stillness; reduced motion is one still. Production bytes, so the red-team lands on the
alias. The board retires when the working version lands (`docs/PROGRAM.md`: a kept idea lands in the Library as a
working version and the board retires).

**The architectural ruling, and this instance.** Verbatim: "I think full image backgrounds sections should commonly
serve as chapter transitions, so we go straight from dark to light or vice versa less often. It makes the
transition much less harsh. However, it isn't required at every transition, else every page with chapters would
have full images above & below the paper chapter, which would feel repetitive every time. They can close a chapter,
open a chapter, or exist individually to separate two chapters. For this specific instance, we could use this to end
the first chapter and combine the live demo visual currently below into the start of the chapter after." And on
`rhythm=insert`, a soft ruling: "its' your architectural decision to either include full image sections within
dark/paper sections/chapters or insert as their own section between chapters... The 'new band at the chapter cut'
may be modified by you accordingly." So: the photograph section CLOSES chapter one (the cinema run of seven), and
`live-demo`'s visual folds into the START of the paper chapter that follows. The concrete shape of that fold is
yours to propose in this manifest's Questions with a recommendation, then build: read `section-ids.ts`'s adjacency
rulings (the paper chapter contiguous, privacy beside curation, the bookends by doctrine) and `home-sections.test.ts`
before you move anything, and keep or explicitly depart from them.

**What exists.** The board's engine (`sandbox/cursor-backdrop/backdrop-engine.ts`, 25 tests: the pool, the three
switch rules, the three entrances, the scripted pointer), its section wrappers (`sections.tsx`), the pane recipe
(the glass board's frost with black at 22 percent, measured against every photograph's worst block), and the
measurements in the board's spec: the copy leaves the muted tier over media (size and weight carry hierarchy), the
pane edge to edge under 640, the pool 423 KB over the wire and 17.4 MB decoded, 61.7 frames a second under a 4x
throttle, paused off screen. The river (`src/components/shared/river/`) is the precedent for a board engine that
became production: a pure engine with its contract, a component with its contract, a Library entry.

**What to build.**

1. `src/components/shared/backdrop/`: the engine trimmed to production (the `band` rule, the `slide` entrance at the
   ruled pace, the scroll-step source for the phone, the still for reduced motion; the `travel` and `cells` rules
   and the other entrances go unless one is a one-line keep), a `PhotoSection` (name it as the Library would) that
   takes a pool and children, and the two contracts (`// @contract-for:` tests that guard function, never look).
   No new dependency; the pointer listener passive; no layout read per frame; IntersectionObserver and
   `document.hidden` hold the clock; scripting off shows the first photograph.
2. The pool: five or six photographs at a CAPPED served width (the lane's own finding: a full-bleed layer at 2880
   decodes at about 22 MB), the site's stand-ins until ASSETS row 20 ("room frames") lands; the slot named in the
   component so the wiring of row 20 is a data change.
3. The home page: `full-quality` wears the section and closes chapter one; `live-demo`'s visual folds into the paper
   chapter's start per your recommendation; `section-ids.ts` and `home-sections.test.ts` follow; the chapter strip
   the board drew is not shipped.
4. The Library entry (`gallery-demos.tsx`, beside the river's) with the pool, the rail and the phone rule
   demonstrable; `pnpm design:rules` regenerated.
5. The board retired: `sandbox/cursor-backdrop/` deleted, its lines removed from `registry.ts` and `boards.ts`, and
   its RULINGS row in `touchpoints.ts` updated the way a retired board's row reads (grep `shipped:` for the
   precedent), never deleted.
6. `docs/systems/design-system.md`: the chapter-rhythm fact gains the ruling in one place (full-image sections
   close, open or separate chapters; sometimes, never at every cut; the first instance the home's chapter one).

**Binds.** Bible 1, 4, 13, 14, 22; the guidance's craft stack (motion by frequency, `prefers-reduced-motion`,
exits at most as long as enters); the plate follows whatever the Glass board rules for blur, brightness and
saturation when that lands (its tint stays this section's); `home-sections.test.ts` and the marketing CSS and h1
policies; no em-dashes in copy; the copy is open (bible 21).

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131` (with `DESIGN_PREVIEW_KEY`
  in the environment, never on the command line).
- Measured on the real home page at 1440 and 375, cinema and paper grounds where the fold touches paper: the copy's
  contrast over every photograph in the pool (the worst block, not the mean), the frame cost under a 4x throttle,
  the decoded weight of the pool, reduced motion (a still, no rAF), scripting off (the first photograph), the phone
  passing four or five photographs across the section's scroll, nothing focusable, paused off screen.
- The screenshot gate (guidance.md): the section next to the home hero, at 1440 and 375, both grounds at the fold.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

**Q1. The fold of the live demo into the paper chapter's start.** Will: "we could use this to end the first
chapter and combine the live demo visual currently below into the start of the chapter after." Two readings.
(a) MOVE the section: the live demo changes register and becomes the paper chapter's first section. (b) MERGE
the visual: the demo's stage becomes the album section's visual and the standalone live-demo section retires.

**Recommended, and built: (a), as one line in `section-ids.ts`.** `HOME_SECTION_SURFACE["live-demo"]` goes
from `cinema` to `paper`; the ORDER array is byte-for-byte what it was, and the page re-chunks itself (6 dark,
4 paper, 5 dark, still exactly three chunks, so `home-sections.test.ts` needed only its map pin and its
comments). The reasons (b) lost: the two sections were ALREADY neighbours, so (a) changes nothing about how
they sit together, only the ground under the demo and where the cut falls, while (b) would have had me invent
merged marketing copy for two ruled headings, which is a voice decision and the `voice` board is open on the
desk for exactly that. And (a) is the better page on its own terms: the paper chapter now OPENS on the
loudest visual it has, which is what bible 17 asks a chapter opener for (a lit stage is one of the ruled
devices), and the album's masthead becomes the ramp down rather than competing with the demo across a cut.

**What I watched for and did not change.** The album keeps `scale="lg"`, so the demo and the album now carry
two chapter-step headings in a row with no cut between them. That adjacency is exactly what shipped before
(they were neighbours across the cut), the shapes are as far apart as the page has (a centred stage, a left
masthead set below-right), and demoting a ruled composition on a hunch is not a wiring lane's call. If Will
reads it as one long section, the fix to try FIRST is the album's heading stepping down to `text-section`,
and that is written in `album.tsx` so the next agent does not rediscover it.

**Q2. Row 20's delivery width.** The row asks for "six landscape photographs at 2880 px wide or more". That
ask, delivered literally, is a regression: `next/image` never upscales, so the SOURCE width is the only cap
on what a full-bleed layer serves, and at 1440 with a 2x screen the browser asks for 3840. Six 2880-wide
frames would decode at about 22 MB EACH.

**Recommended:** row 20's deliverable becomes **six landscape frames at about 1200 px wide** in
`public/marketing/img/` (the master can be any size; the delivered file is the cap), keeping the rest of the
ask as written (the quiet middle third, no blown highlight in the copy's band). 1200 holds six layers at
about 22 MB decoded, which is the budget the board measured and Will ruled on. `room-frames.ts` states the
cap and this reason; the ASSETS row is the Orchestrator's to amend.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, "Chapters: the attention arc", three edits, all inside the chapter-rhythm
  fact this lane owns:
  1. a new paragraph before "A chapter never escalates": **a full-image section is a way to CROSS a chapter
     cut**, may close, open or sit between chapters, used sometimes and never at every cut, with the home's
     chapter 1 named as the first instance.
  2. "The home arc" re-stated: chapter 1 now closes on `full-quality` standing on the switching photograph,
     and chapter 2 opens on the live demo's stage.
  3. the shape rule's worked example: chapter 1 runs strip, ledger, three-up on a photograph; the paper
     chapter alternates the centred stage, a left masthead, a mirrored split and a numbered ledger.

## Deferred (ROADMAP one-liners, bucket named)

- **Marketing polish:** `src/app/(marketing)/(cinema)/page.tsx`'s header comment still says "chapter 1 ends
  on the live demo" and "the 15-section made-from arc". No code there changed (the page derives its chapters
  from `section-ids.ts`), but the comment is stale and the file is outside this lane. One-line refresh.
- **Marketing polish:** the plate's worst block ANYWHERE inside the pane is 3.46:1 against the body ink over
  the brightest frame, against 5.12:1 in the bands the copy actually occupies. Today that gap is headroom;
  a second placement whose copy sits nearer the pane's top corners should re-measure, or take
  `--bkd-brightness` to 0.45, which lifts the whole pane past 4.5:1 (measured).
- **Design system:** the reading band (`-45% 0px -45% 0px`) is the first scroll-position readout on the site.
  If a second one lands, it belongs in one place rather than two.

## Handoff (replaces the chat report)

**Head.** `1b56cd9e` is the tree every gate below was run on. The head of `lp/backdrop-wiring` is the commit
that adds this manifest, and its only change to that tree is this file.

**Sync.** `origin/launch-prep` has not moved since the cut (`git rev-list --count origin/lp/backdrop-wiring..origin/launch-prep` = 0 at `87581cc7`), so no merge was needed.

**The gate, each on its own exit code, on `1b56cd9e`:**

| step | exit |
| --- | --- |
| `pnpm design:rules` | 0 |
| `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` | 0 (123 specimens on 91 entries) |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (8 warnings, the known 8) |
| `pnpm test` | 0 (241 files, 2458 tests; 48 of them this lane's two contracts) |
| `pnpm build` | 0 |
| `pnpm lab:smoke --base http://localhost:3131` | 0 (277 checks, 0 failing, against `next start`; the key rode the environment) |

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`):

```
docs/design/library.md
docs/systems/design-system.md
docs/tracks/backdrop-wiring.md
src/app/(dev)/design/(shell)/lab/boards.ts
src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
src/app/(dev)/design/gallery/specimens.generated.json
src/app/(dev)/design/rules/component-notes.ts
src/app/(dev)/design/rules/rules.generated.json
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop-engine.test.ts
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop-engine.ts
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/board.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/cursor-backdrop.css
src/app/(dev)/design/sandbox/cursor-backdrop/sections.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/spec.ts
src/app/(dev)/design/sandbox/cursor-backdrop/strip.tsx
src/app/(dev)/design/sandbox/registry.ts
src/app/(dev)/design/touchpoints.ts
src/components/marketing/sections/home/album.tsx
src/components/marketing/sections/home/full-quality.tsx
src/components/marketing/sections/home/home-sections.test.ts
src/components/marketing/sections/home/live-demo.tsx
src/components/marketing/sections/home/section-ids.ts
src/components/shared/backdrop/backdrop-engine.test.ts
src/components/shared/backdrop/backdrop-engine.ts
src/components/shared/backdrop/photo-section.css
src/components/shared/backdrop/photo-section.test.tsx
src/components/shared/backdrop/photo-section.tsx
src/components/shared/backdrop/room-frames.ts
```

Inside `owns`: everything under `src/components/shared/backdrop/`,
`src/components/marketing/sections/home/`, the deleted `sandbox/cursor-backdrop/`, and
`library/components/gallery-demos.tsx`. The registration exceptions: `sandbox/registry.ts` and
`(shell)/lab/boards.ts` lost this board's two lines each, `touchpoints.ts` lost it from `SandboxId` and its
RULINGS row was rewritten as a shipped one (never deleted). The generators' artifacts:
`rules.generated.json`, `specimens.generated.json`, `docs/design/library.md`. The listed system doc:
`docs/systems/design-system.md`.

**ONE LINE OUTSIDE ALL OF THAT, and it is the river's precedent rather than a slip:**
`src/app/(dev)/design/rules/component-notes.ts` gains three `for` lines, one per new file. The collector
indexes every file a `@contract-for` names, and `gallery.test.ts` fails a file in the index with no `for`
line, so a Library entry for a component in a subdirectory cannot land without them. `ghost-wiring` added
the river's two the same way on 2026-09-18, and the comment there now covers both directories. Hand it back
if you would rather it were a separate change; nothing else in that file moved.

**The items, one line each.**

1. `src/components/shared/backdrop/backdrop-engine.ts` (203 lines): the board's engine, trimmed to the ruled
   rule set. `travel`, `cells`, `wipe` and `cut` are gone with the board, and so is every coordinate: the
   input is one number, `at`, the reader's position from 0 to 1, so a cursor's x and a phone's scroll go
   through one function. The slide is a PERCENTAGE of the layer (the river's rule), so nothing measures a box.
2. `atRest(state, cfg, at)` is the new property and the reason the section is free: the loop runs only while
   a photograph is in flight or the reader is somewhere it has not caught up to. Sitting on the section with
   nobody moving, the whole page requests ZERO animation frames (measured below). The board could not have
   this; its scripted pointer never stopped.
3. `photo-section.tsx` (`PhotoSection`): the component. The plate, the rail, the two sources, and three
   things the board did without: the source is a CAPABILITY query (`(hover: hover) and (pointer: fine)`,
   never a width), the phone's steps are trip wires through a reading band rather than a rect per scroll
   frame, and the pointer's frame of reference arrives free on an IntersectionObserver entry.
4. `room-frames.ts`: the pool, six landscape frames, ordered so the FIVE a phone samples alternate bright and
   dark, ending on the brightest because the paper chapter opens under it. The slot is named, not the
   pictures: row 20 lands as a data change here.
5. Two contracts, 48 tests: `backdrop-engine.test.ts` (30; the scrub-back, the phone's even sampling, the
   stack cap, the clock stopping) and `photo-section.test.tsx` (18; atmosphere, the rest state, zero frames
   at rest, both readers, zero layout reads on a phone). Function, never look: no duration, alpha, size or
   photograph is pinned.
6. `full-quality.tsx` wears it and closes chapter one; its own `py` came down to `py-14 sm:py-16` because the
   plate already frames the copy and the section was framing it twice.
7. `section-ids.ts`: one line, `live-demo` to `paper`. The order did not move.
8. `live-demo.tsx` and `album.tsx`: comments only. Both said which chapter they belonged to and both were
   wrong after the cut moved; a stale WHY is worse than none.
9. The Library entry (`photo-section`, `new`, Surfaces, three specimens): the room under a cursor, the same
   room under a thumb, and the room with no copy at all. It needed one new prop, `source`, which forces the
   rule; production never passes it and the prop says so, because a reviewer on a laptop has no other way to
   see the phone's rule.
10. The board retired: `sandbox/cursor-backdrop/` deleted (1,850 lines), its lines gone from `registry.ts`
    and `boards.ts`, its RULINGS row rewritten with `ruled: "2026-09-18"`, a `shipped:` line and `lives`
    pointing at production. `lab:smoke`'s reading table no longer lists it.

**The measurements** (headless Chrome over CDP against `next start` on :3131, at 1440x900 and 375x812, dpr 2):

- **Contrast, the worst block under the copy, per photograph** (the copy hidden, the plate's own
  backdrop-filter live, the worst 10px block inside each of the 12 copy runs at 12/14/16/20px):
  golden 8.37, dj 5.60, confetti 10.23, table 5.55, crowd 5.12, arch 5.55. **Worst 5.12:1**, against AA's
  4.5. The heading's own worst is 5.36 against the 3:1 it needs. The ruled recipe (tint 0.22, brightness
  0.55) is UNCHANGED: it clears on every frame, and darkening it would spend the photograph for nothing.
  The whole-pane figure, including the margins where no copy sits, is 3.46:1 (deferred above).
- **The pool:** 6 layers, **237 KB over the wire, 11.94 MB decoded** (six 900x600 stand-ins; the board's
  eight were 423 KB and 17.4 MB). `naturalWidth` under a w-descriptor srcset is density-corrected and reads
  337 at dpr 2, which is a trap: the real pixels came from `createImageBitmap` on the served bytes.
- **The frame cost:** a 4x CPU throttle makes NO difference (24.4 fps throttled, 24.0 unthrottled while
  sweeping the whole room twice), which is the finding: the switch is compositor work and the engine's
  JavaScript is free. Against the SAME page at the same scroll with the photographs hidden and the blur off,
  the floor is 27.0 fps, so the section costs about 3 fps, roughly 11 percent, and the blur is most of it.
  The 27 fps floor is this headless build's software raster of a 2880x1800 marketing viewport, not the page:
  a blank page and the home hero both hold a clean 60 under the same 4x throttle.
- **Idle:** sitting on the section, nobody moving, the whole page requested **0 animation frames** across
  2 seconds, sampled every half second. One pointer move costs one entrance and then it stops again.
- **Reduced motion:** 0 rAF calls after a full sweep across the room, no inline style on any layer, the
  first photograph standing, the rail at opacity 0.
- **Scripting off:** the section, all six layers and every word are in the server's own HTML, the first
  layer is `wedding-golden`, and no layer carries an inline style (the sheet is the rest state).
- **The phone, 375x812:** source `scroll`, 5 wires, and one pass of the section stepped **0, 1, 3, 4, 5**:
  five distinct photographs of six, the ruled sample, starting on the pool's first and ending on its last.
  No tap anywhere, the rail at opacity 0, nothing focusable in the backdrop, and **zero layout reads** on a
  step or in a frame (pinned by the contract as well as measured).
- **A bug the measuring found, and it would have shipped silent:** the usual middle-line recipe
  (`rootMargin: "-50% 0px -50%"`) never fires against a hairline, because the intersection has zero area.
  The phone run showed ONE photograph for the whole section until the root was given a real band.

**The screenshot gate** (`guidance.md`): the section beside the home hero at 1440 and 375, and both grounds
at the fold. It holds: the hero is photographs streaming out of the code on deep black with the chrome
achromatic, and the section is the same language one beat quieter, the photograph carrying all the colour
and the plate carrying none (bible 1). The crossing is the part to look at: dark, then a photograph full
bleed, then paper, with no hairline anywhere in it.

**Assets.** Row 20 is the only ask, already open, and it needs the amendment in Q2: **six landscape frames
delivered at about 1200 px wide**, not 2880 or more. Nothing new is asked for.

**Look at first.** The home page at 1440, cursor moving slowly across `full-quality`, then the same section
at 375 scrolled through at reading speed. Then `/design/library/photo-section`. Then Q1: whether the album's
heading should step down now that the live demo opens the chapter above it.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

The `cursor-backdrop` board's engine became a production module at `<sha>`, on the river's precedent: a pure
engine with its contract, a component with its contract, a Library entry, and the board deleted. Will's
ruling landed whole, and the architectural half of it landed as one line: `full-quality` wears a switching
full-bleed pool behind a glass plate and closes chapter one, and `live-demo` changed register so the paper
chapter opens on its stage, with the home's ratified order untouched. The wiring added what the board could
not have: the loop stops when nothing is in flight, so a reader who stops scrolling to read sits beside a
page requesting zero animation frames, and a phone steps through five of the six on trip wires with no
layout read at all. The copy clears 5.12:1 over the worst photograph in the pool on the ruled recipe, and
the measuring caught a zero-area IntersectionObserver that would have shipped the phone rule dead.
