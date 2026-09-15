---
track: rounding
status: handed-off
cut: "ca952b5"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/rounding/
reads:
  - src/components/dev/motion-tuner-config.ts
  - src/components/dev/tuner-store.ts
  - src/components/dev/board/stage.tsx
  - src/app/globals.css
  - src/app/theme.css
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/app/(dev)/design/rules/bible.ts
  - docs/systems/design-system.md
  - docs/specs/palette.md
  - docs/specs/light.md
  - docs/specs/floating-surfaces.md
---

# lp/rounding

**Goal.** Round two of the rounding board (round one was the Orchestrator's: the tuner's store,
descriptions and action knobs, the board at `/design/c/rounding` with one kit in four columns, the
tokens made reachable in paper chapters and the lab; see the CHANGELOG's review-wave entry). Bible 8
(sharp surfaces, round actions; tokens, never literals) inherits the values Will rules on this board.

**Round 2 (the goal).** The rounding board is the Orchestrator's kit in four columns; take it the rest
of the way to a sitting surface. (1) **Real compositions in each column**, built from production
components: a marketing chapter's card row and its CTA, the dashboard's event card, the guest
gallery's tight-gap tile grid, a dialog and a menu (static, with the primitives' own classes), so the
radius is judged on the site's real shapes and not a kit alone. (2) **The nested-corner rule** (bible
9) as a specimen: a card with an inner media plate and a ring at offset, a beam around an action,
under each candidate, with the arithmetic printed (inner = outer minus gap). (3) **The derived-scale
consequences** made visible: every step (`rounded-sm` to `rounded-4xl`) on the real components that
use it, under each candidate, so the 2xl trap (28.8 px at a 16 px base) is seen, not described; and
a candidate that retunes the multipliers if the base goes rounder. (4) **"Try B on the site"**: each
fixed candidate's six values written to the tuner with `setTunerValue` (the controls are
`ROUNDING_TUNER_CONTROLS`), so Will walks the real pages and the app at that column. (5) The action
ladder at every height including the marketing CTAs as they ship (find where `rounded-action` and
`-lg` are actually used, or say they are not). (6) Every column on the phone canvas. (7) The asks
reduced to one-word answers. You own `sandbox/rounding/` only; the tuner and the shell are the
Orchestrator's (propose in Handoff).

**Rulings in force.** Bible 8 (under exploration, this board), 9 (radius plus offset), 15 (the
floating layer's one radius), 22 (rising tides). Never rename a radius token; the values are the
tuner's and the ruling's.

**Verify on.** `/design/c/rounding?key=` on your preview at 1440 and 375; the gate green.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (round 2)

- Head: the tip of `lp/rounding` (the last code commit is `6db270c`; the
  manifest commits follow it), pushed. The board is `/design/c/rounding?key=`;
  the round-two marker in the rendered HTML is the heading **"The six tokens,
  at true size"** (and the class `rnd-wide`), and the second pass adds part F,
  **"Every candidate on the phone"**.
- ★ **The preview alias is STALE and this track cannot refresh it: the account
  is at the Vercel free plan's deployment cap.** The branch's last deployment
  is `45834a3` at 21:32; neither this pass's pushes nor the four manifest
  commits before them produced one, and asking the REST API for one returns
  `api-deployments-free-per-day`, "more than 100", remaining 0, reset in about
  24 hours. Deployments are landing intermittently across the project rather
  than not at all (lp/palette got one at 22:18), so the alias may catch up on a
  later push, but it has not yet. Until it does,
  partyreel-git-lp-rounding-partyreel.vercel.app serves the FIRST pass, which
  has neither the overflow fix nor part F: reviewing it now re-reads the board
  the review already read. The cap is account wide and its handling is the
  Orchestrator's call, not this track's lane.
- **Second pass (the read-only review of this handoff found three should-fix
  items; all three are fixed here).**
  1. `.rnd-wide` overflowed the lab column at every width between `lg` and
     about 1256px and took the whole page into a horizontal scroll with it
     (216px of it at 1024). It sized itself from a hard-coded 62rem column,
     which is only the column BELOW lg; above lg the sidebar is beside the
     content and the column is `min(100vw - 232px, 64rem) - 2rem`. The width is
     `100% + the gutters` now, so the base is the real containing block
     whatever the shell does with it, and only the spare room is computed, from
     a sidebar width that is 0 below lg and 232px at and above it.
  2. Goal item (6), every column on the phone canvas, was addressed nowhere and
     declined nowhere. Part F is the row: the five columns of part A, each on
     its own 375 canvas at 1:1, composition and ground on their own toggles,
     one line per candidate on what it does at a guest's width. Five phones at
     true size do not fit across the column, so they wrap three to a row at
     1440 and two on a narrower window.
  3. The gate line claimed the four gate steps and not the light-QA canvases.
     Both are claimed below.
- Synced with launch-prep at `4b035c1` (still the tip of `origin/launch-prep`
  at this handoff, so the tree is the merged one the gates ran on).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 pre-existing
  warnings in other files), test ok (1698 in 193 files), build ok (248 pages).
- Light QA, walked rather than assumed, and walked TWICE because the preview
  could not be rebuilt: once on `next dev` and once on `next start` over the
  same `pnpm build` output the gate produced, both from this worktree. The
  board at **1440** and at **375**, both with zero horizontal overflow on the
  document and zero console errors; **reduced motion honoured** by having
  nothing to undo, since `board.css` declares no keyframes and no element on
  the page resolves an `animation-name` at all (checked in the running page,
  not only in the source). The overflow fix was measured at 375, 768, 1000,
  1023, 1024, 1100, 1180, 1256, 1280, 1360, 1440 and 1920: zero at every one,
  and the 1440 geometry (`x=248 w=1176`) is unchanged from the first pass.
  Below 375 the page does overflow, from the shell's own `Toggle` groups and
  the fixed tuner panel rather than from anything in this lane. What the
  production server cannot stand in for is the alias itself, so the first walk
  on the refreshed preview is still owed.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `src/app/(dev)/design/sandbox/rounding/{board.tsx,board.css,candidates.ts,specimens.tsx,compositions.tsx}`
  plus this file. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Shell changes proposed (the Orchestrator's files, none made):**
  1. `src/components/dev/board/stage.tsx`: a `fit={false}` escape hatch, or a
     `TrueSize` sibling. A Stage fits 1440 into the lab's column with `zoom`,
     which scales paint as well as layout, so a board judging a DIMENSION (a
     radius, a gap, a shadow offset, a stroke) reads about a third under its
     own numbers there. This board works around it with `.rnd-wide` in its own
     sheet, which now takes its base width from the containing block but still
     has to know the lab sidebar (232px at lg and up) to find the spare room.
     A shell-owned wide slot would delete that last assumption, and the second
     pass is the evidence for asking: a board guessing at the shell's layout
     got it wrong at every width its own QA did not sit at.
  2. `src/components/dev/motion-tuner-config.ts`: the three action knobs cap at
     24px, which cannot express the pill rung. If the pill is ruled, the max
     moves (or the control gains a "pill" step). Apply writes the pill into the
     candidate block and clears the knob rather than leaving the panel in a
     state a drag cannot return to.
  3. `src/components/shared/glow-contract.test.ts` pins the exact set of
     BorderBeam call sites. The beam around an action is the third bible-9
     specimen this board wanted (the beam is the case the system already gets
     right: no radius prop, it reads the child's computed one), and adding it
     would need one line in that test. The board draws a plain ring at the same
     offset instead and says so.
  4. `src/app/(dev)/design/touchpoints.ts`, the `rounding` entry, is round
     one's: `board.note` still reads "One kit of every radius-bearing surface
     in four columns..." and `board.variants` lists "B, soft surfaces" and
     "C, the 16px column", neither of which exists now. Proposed note: "Six
     tokens as three decisions: the surface family, the action rung and the
     derived ladder, each at true size on the shipped components and appliable
     to the whole site"; proposed variants: `["A, today", "B, square",
     "C, soft", "D, one family", "Live, the tuner"]`.
- Assets requested from Will: one.
  - A worst-case tile set for the gallery gap · four photographs whose edges are
    near-white and bright (a white tablecloth, an overexposed sky, a white dress
    against a window), 1200px long edge, JPG, four of them · replaces the
    `wedding-golden` / `party-dj` / `festival-lights` stills in part B's guest
    grid and part F's phone row, so a corner hole between tiles is judged at
    maximum contrast rather than against dark stills that hide it.
- The asks, verbatim from BoardMeta:
  1. "The surfaces: A, B, C or D (--radius, --radius-float and --radius-tile move together)"
  2. "The actions: today, pill or quiet"
  3. "The derived ladder: stock or quarters"
  4. "The dead rungs (rounded-3xl, rounded-4xl, --radius-action-lg): keep or drop"
  5. "The gallery gap: pinned to the tile, or free"
- Look at first: part A, the matrix at true size, which is the whole ruling on
  one screen. Then press **Apply C** and walk `/`, `/pricing` and `/dashboard`
  with it on: that is the real answer, and the board is only the shortlist.
  Part B's guest composition carries the round's worst finding at its foot, and
  part F is the same four candidates at the width a guest actually holds. The
  tuner panel sits over the right of the page, so close it (the cross) or send
  it left (the arrow) before reading the last column of any part.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The rounding board was rebuilt from the ground up. Round one judged six numbers in four columns inside a zoom-fitted stage, where `zoom` scales paint with layout and every corner read about a third sharper than its own number; round two splits the tokens into the three decisions they are (the surface family A to D, the action rung, the derived ladder) and renders every comparison at 1:1.
Part A is a four-row matrix of the shipped components, B four real compositions from `EventCard`, `EventTypeCard` and the primitives' own class strings, C bible 9 drawn right and wrong under each candidate, D the seven derived steps on the components that use them beside a quarter-step retune, E the action ladder at every height that ships, and F every candidate on its own 375 canvas, which is where the tile is settled.
Each candidate applies to the whole site as the paste its ruling would land, verified on `/pricing`: a plan card lands at 21px under D's quarter ladder against 25.2 on stock.
Four findings, all on the board rather than in a comment. The guest gallery's gap is a literal in three files while its tiles ride the token, so any tile above 3 opens corner holes on the one grid every guest sees. `--radius-action` names a 40px button that ships nowhere and `--radius-action-lg` has one call site. Every marketing CTA is `size="lg"` forced to h-11, at 0.33 x height against a documented 0.4. And `rounded-3xl` and `rounded-4xl` have three uses between them.
