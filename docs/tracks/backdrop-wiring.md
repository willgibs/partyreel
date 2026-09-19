---
track: backdrop-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- (fill: the concrete fold of the live demo into the paper chapter's start, with a recommendation)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: the chapter-rhythm fact (list the line).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the questions
  and their answers, the measurements, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
