---
track: body-type
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5e03ffe2"         # the launch-prep SHA the branch was cut from
board: body-type        # round one: the body and label ladder as decisions, before any sweep
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/body-type/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - src/app/theme.css
  - src/lib/utils.ts
  - src/lib/type-ladder-policy.test.ts
  - src/components/ui/button.tsx
  - src/components/guest/event-experience.tsx
  - src/components/app/event-card.tsx
  - src/components/admin/metrics-charts.tsx
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/body-type

**Goal.** Round one of `body-type`: the body and label sizes as a LADDER, designed as decisions before
any sweep. Will's ruling (2026-09-18, on "everything should be addressed in our design system type
ladder"): yes, it reaches body and label sizes; one question-first board first. Six to eight decisions
with `defineExploration`, each drawn on the real surface it governs at its true size. **Not in this
round:** any production byte (the wiring sweeps the sites onto the steps once he rules; about 920 of them),
the heading ladder (ruled and shipped: ten steps in `theme.css`), the words (the `voice` board's).

**Binds.** The bible (5: every heading sits on a step and the steps keep their order at every width; the
same law is what this board extends to body copy), the contracts, the policies:
`src/lib/type-ladder-policy.test.ts` holds the five ways the ladder fails silently (a step name the colour
namespace already owns, a step `cn()` has never heard of, a ramp coming back, the order breaking at one end,
a stock size on a heading). Read it first: every step you propose must be nameable (no `--text-<x>` where
`--color-<x>` exists), declarable in `TYPE_STEPS`, and ordered under `card-title` (16px) at both ends.
`docs/design/guidance.md`'s guest reading-copy rule (guest reading copy 15 to 16px; host and admin on 14)
is the precedent this board replaces with a ruling.

## What is measured (the tree at the cut; the numbers on the steps come from here, re-measured)

- The heading ladder is ten steps in `src/app/theme.css` (`--text-display` down to `--text-card-title` at
  1rem), each a size, line-height and letter-spacing triple, the marketing steps fluid clamps between 375
  and 1440; `TYPE_STEPS` in `src/lib/utils.ts` declares them to `cn()`.
- Below `card-title` nothing is on a ladder. Production outside the lab carries `text-sm` 366 times,
  `text-xs` 243, `text-[11px]` 88, `text-[10px]` 60, `text-base` 25, `text-[15px]` 24, `text-lg` 21,
  `text-[13px]` 8, `text-[17px]` 2. By surface (sm / xs / base): marketing 141 / 108 / 5, the app 44 / 36 / 1,
  the guest 8 / 14 / 8 plus 11 of the `text-[15px]`, admin 12 / 9 / 0, ui 29 / 9 / 4.
- Small labels carry their own tracking by hand: `tracking-[0.14em]` 31 sites, `tracking-wide` 21,
  `[0.16em]` 5, `[0.08em]` 5, `[0.24em]` 3, `[0.4em]` 2.
- Buttons: the base is `text-sm`, `xs` is `text-xs`, `cta` is `text-base` (`src/components/ui/button.tsx`).
- The document sets no base size (`globals.css` `body` applies colour only), so 16px is the browser's.

## The decisions (six to eight; each option drawn on the real surface at true size, a phone where the surface is a phone)

1. **A guest's reading copy** (the event description, the gate prompts, the entry sheet's rows: 15 and 16
   today): 15 / 16 / 17, drawn on the real guest page at 375 (`tile: "phone"`).
2. **The app's working body** (the host's dashboard and the admin's tables: 14 today): 14 / 15 / 13, drawn
   on the dashboard and an admin table at 1440. It decides whether "host and admin on 14" survives.
3. **Marketing reading copy** (paragraphs under headings: 18, 17 and 16 today): one step, drawn on a feature
   page at 1440 and 375; the options include fluid (a clamp like the heading steps) and fixed.
4. **The caption step** (counters, captions, secondary labels: 12, 11 and 10 today) and its FLOOR: 12 / 11 /
   10 as the smallest size the product ever sets, drawn on the masonry's badges, the event card's badges and
   an admin table's meta.
5. **The label step** (uppercase eyebrows and small labels with tracking): a size and tracking PAIR (three or
   four pairs from the measured spread), drawn on a marketing eyebrow and an app section label.
6. **Buttons on the ladder**: buttons take the body step / keep their own three sizes / one size everywhere,
   drawn on the real Button sizes.
7. **Line height**: a fixed pair per step (the heading ladder's shape) / one ratio for the whole body ladder,
   drawn on a paragraph at both widths.
8. (Optional, if the drawing surfaces it.) **The names**: the step names the ladder will use, checked against
   the colour namespace and `cn()`, offered only if two good namings exist.

Say each option's numbers on the step. Prefer more rounds of narrower questions to one wide one: if eight is
too many to draw well, stage the label and button questions `after` the body steps.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED, NO DOCK, frozen, or whose stage
starts lower than 0.6 of a screen. The worked example is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.
Vary a size from OUTSIDE (a class on a wrapper in your board's sheet, the way `gallery-width` set
`column-width` from its own sheet), or copy the section into your directory; edit no production file. A
`vw` clamp reads the browser's width, so a 375 column drawn on a 1440 page must be a real `Frame` (the trap
in `src/components/lab/traps.ts`).

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (copy river-card's shape, `board` block
  included);
- `touchpoints.test.ts` takes NO line.
Other lanes add theirs at the same places; the Orchestrator merges keep-both. Never reorder or reformat.
`pnpm design:rules` regenerates the artifacts (allowed in the lane check).

## Verify, and the gate

The board at 1440 and 375, reduced motion honoured, every size measured on screen (computed font-size and
line-height read off the real element, never assumed). Dev server on port 3134, stopped by port
(`lsof -ti tcp:3134 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on its own exit
code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
`pnpm lab:demo --board body-type --base http://localhost:3134` (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **What are the four steps called?** The goal offered the names as an eighth decision "if two good namings
  exist". Two do, and they draw the same picture, so it is a question and not a step (a decision whose options
  look identical is a paragraph pretending to be one). **Recommended: `copy` / `body` / `caption` / `label`**.
  Reading copy is `text-copy`, the app's working step is `text-body`, and the plain name goes to the workhorse
  (the 366 sites that are `text-sm` today). The alternative is `body` / `ui` / `caption` / `label`, where
  `text-body` is reading copy because that is the safest default to type. Both clear the two traps: no
  `--color-copy`, `--color-body`, `--color-caption`, `--color-label` or `--color-ui` exists (the card step is
  `card-title` because `--color-card` does), and all four are declarable in `TYPE_STEPS`.
- **Does the caption step also become the label step's size?** Decision 5 offers one pair at 12 and one at 11,
  and the floor picked in decision 4 can rule the 11 out. **Recommended: yes, one size**: the label step is
  the caption step set in uppercase with tracking, which is one fewer rung to keep. If he picks a floor of 12
  and a label of 11 the board will say so; the wiring then needs a rung the floor does not cover.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. The guest reading-copy rule in `docs/design/guidance.md` is what this board replaces, and it is edited
  by the RULING, not by the board that asks about it.

## Deferred (ROADMAP one-liners, bucket named)

- Design system: `defineExploration` should dedupe a shared `configs` control by id. Every board with one knob
  across decisions has to filter its own `controls` afterwards (gallery-width found it; this board copied the
  workaround verbatim, both spec files carry the same comment).
- Design system: 24 sites share `text-[15px]` across the guest pages and marketing, so the body-ladder wiring
  cannot sweep that class in one pass; it has to split them by surface.

## Handoff (replaces the chat report)

- Head `ae280c75`, pushed; synced with `launch-prep` at `feba31f9` (it had moved: the voice lane merged, plus
  milestone-25 and three docs commits). Merged, never rebased; keep-both on all four registration conflicts
  (`registry.ts`, `boards.ts`, `touchpoints.ts` twice for the unions and once for the RULINGS row), the
  generated `docs/design/library.md` regenerated on the merged tree rather than hand-resolved.
- Gates on the synced tree, each step's own exit code: `pnpm design:rules` 0 · specimens 0 (120 specimens on
  90 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (8 known warnings, 0 errors) · `pnpm test` 0 (233 files,
  2197 tests) · `pnpm build` 0 (254 static pages, server killed by port first) · `pnpm lab:smoke` 0 (242
  checks, 0 failing; the board reads 429 words of 1200) · `pnpm lab:demo --board body-type` 0 (7 steps, 0
  failing, every step draws its options; tallest 1.8 screens, wordiest 216 words).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/body-type/board.tsx
  src/app/(dev)/design/sandbox/body-type/fixtures.ts
  src/app/(dev)/design/sandbox/body-type/spec.ts
  src/app/(dev)/design/sandbox/body-type/surfaces.tsx
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  The owned directory, the three registration files and the one generated artifact. No production byte moves.

### The seven decisions, with the numbers measured in the frame

Every pair below is `size/leading` read off the real element inside its frame with the DevTools protocol, at
1440 and again at 375. The leading shown is under the recommended rule (`length`, 2 x size - 8).

1. **A guest's reading copy** (the real guest page at a 375 frame, `tile: "phone"`): 15/22 · **16/24** ·
   17/26, under an h1 measured at 24/30.25. **16**, a rung the ladder already holds, the browser's own base,
   and level with `card-title` where 17 would outrank the card title it sits under. 24 arbitrary
   `text-[15px]` sites go.
2. **The app's working body** (the dashboard over the admin jobs table, one 1440x1100 frame): **14/20** ·
   15/22 · 13/18. **14**, the only rung on offer and the one 366 `text-sm` sites already wear. The two-rung
   gap to a guest's 16 is what makes these two steps and not one.
3. **Marketing reading copy** (a feature section, both widths): 16/24 flat · 18/28 flat · **fluid, measured
   16/24 at 375 and 18/28 at 1440**. **Fluid**: the headings travel two to four rungs between the ends and
   copy that does not travel with them shrinks as the page grows; at 375 it IS the guest's step. (`lab:demo`
   reports 18-flat and fluid as the same picture at 1440, which is the clamp's ceiling: the difference is at
   375, and the width knob shows it.)
4. **The caption step, and the floor** (real event cards, two feed headers, a table head): **12/16** · 11/14 ·
   10/14, one step replacing all three. **12**, the rung the scale bottoms out at, 148 arbitrary sizes
   retired, and a floor that can be said out loud. Cost: every pill over a photograph grows.
5. **The label step** (ten uppercase labels across marketing and the app, staged after the floor):
   **12/16 +0.140em** · 11/14 +0.140em · 12/16 +0.080em, tracking measured in em off the element. **12 on
   0.14em**, already on the site, the louder of the two we ship, and on the floor rather than under it.
6. **Buttons on the ladder** (every Button size in the place it ships, staged after the app's step):
   **ladder** cta 16/24, default 14/20, sm 12/16 · **own** cta 16/24, default 14/20, sm 12.8/19.2 · **one**
   everything 14/20. **Ladder**: measured, it differs from today at exactly one size, the arbitrary
   `text-[0.8rem]` on `size="sm"`, which is the whole point.
7. **The line-height rule** (a feature section over the table): **length** 18/28 and 14/20 · **ratio** 18/27
   and 14/21 · **two ratios** 18/28.8 and 14/19.6. **Length**: `2 x size - 8` reproduces the pairs the site
   already wears at every rung (12/16, 14/20, 16/24, 18/28) and lands each on the 4px grid, which no ratio
   does at an odd size.

### Three things the measuring caught, which the board's words now say

- **An arbitrary size is not leading-less, it inherits 1.5.** Tailwind's preflight sets a unitless 1.5 on
  `<html>`, measured: `text-[15px]` computes to 22.5 and `text-[11px]` to 16.5. So the "one ratio" option IS
  what the site does today wherever a class carries no pair, and the first draft of decision 7 (which said the
  browser's normal, about 1.2) was wrong. The option that only drew today was dropped as a duplicate.
- **A feature paragraph wears the same `text-[15px]` as the guest page**, so the guest rule and the marketing
  rule collide and the later one wins on source order. Caught because the leading frame drew marketing's copy
  at the guest's size while the caption under it said so. The wiring has the same problem: those 24 sites have
  to be split by surface.
- **A page shell's `min-h-full` resolves against the FRAME's viewport**, so the first of two stacked surfaces
  claimed the whole window and pushed the admin table out of the tile while it still measured correctly in the
  DOM. Both stacked surfaces now take a `stacked` prop. The same trap would hit any board that puts two real
  pages in one frame.

- Captures (`/private/tmp/partyreel-captures/body-type/`, never committed): 21 stage captures at 1440
  (`<decision>-<option>.png`) and 21 at 375 (`-w375.png`), each the whole stage with the option's chip, the
  frame title and the measured caption in shot; plus `measurements.json` and `measurements-w375.json`, the
  computed size, leading and tracking of 18 probes per option. Every tile was checked against its option's
  words; the one copy bug found (a JSX-eaten space that read "128photos") is fixed.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: **decision 4, the floor.** It is the only recommendation that makes something visibly BIGGER
  (every pill on an event card, and the feed counters), and it is the one number that gets said out loud
  afterwards. Flip the width knob to 375 on it: the badges over a photograph are where 12 either reads as
  correct or as heavy.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). Round one of `body-type` asked the body and label ladder as
seven decisions instead of proposing it as a scheme: a guest's reading copy on the real guest page in a 375
frame, the app's working body on the dashboard stacked over the admin's jobs table, marketing's copy fixed or
fluid, the caption step and the floor under it, the label's size-and-tracking pair, the buttons, and the
line-height rule. Every option was the real surface wearing the paste a ruling would land (`Frame`'s adopted
sheet, aimed at the production classes so it reached imported components too), and every number on a step was
read off the element inside its frame rather than assumed, which caught three things the first draft had
wrong: an arbitrary size inherits Tailwind's 1.5 rather than carrying nothing, a feature paragraph wears the
guest page's own `text-[15px]`, and a stacked page shell's `min-h-full` eats the frame. Nothing outside the
board's directory and the three registration lines moved.
