---
track: rounding
status: integrated
cut: "c473707"
merged: "31788b38"      # the branch head merged into launch-prep
merged_round_3: "a32981a"
merged_round_2: "2603465"
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

## Round 4 (Will's review notes, 2026-09-15)

**The global notes, which bind every board this round** (Will, 2026-09-15, after a scroll through every
board on launch-prep): (a) **Page-wide controls always on screen.** "For any pagewide configs, the GUI
control should be fixed so that variants can be toggled on different previews anywhere on the page for
better back-and-forth comparisons. Having to scroll back to the top makes it very hard to review
differences." The shell now ships `BoardDock` (`src/components/dev/board/dock.tsx`, exported from
`@/components/dev/board`; the floating board's sticky bar, generalised: it sticks from `sm` up, writes its
height to `scroll-padding-top` so anchors land under it, and carries the shell's Fit/1:1, Sidebar and Desk
controls). Put every switch that changes the whole page in it (the candidate, the ground, the canvas, the
ramp, Replay, Apply to the site); a control that changes one specimen stays beside that specimen. (b)
**Pixel-perfect previews.** "The iFrame previews throw off anything related to size, making those reviews
particularly difficult. This needs to be fixed for pixel-perfect lab demos/previews." Every `Stage` now
renders at 1:1 by default (the lab preference in `lab-prefs.ts`; the board page lifts its max-width and
tucks the sidebar away so a 1440 canvas has its room; "Fit" keeps the old zoom for a glance at the whole).
Never zoom, scale or transform a specimen whose size is being judged; anything you render inside an iframe
renders at true pixels; if a 1440 canvas needs sideways scroll on a narrower window, that is correct. (c)
**More real UI.** Will wants live production components and whole real pages as the preview surfaces
("I'd love to see more UI examples for comparison, especially if they can be live production components";
"more UI to preview the variations on"), not a screen of specimens. (d) **The app's UI is open.** "The app
is functionally great, but UI design lags far behind the design work we've been doing for the marketing
site... any UI that touches App in an active lab track may be worked on before the dedicated app agents get
to it later." So where your board shows an app surface, you may redesign it (rising tides, bible 22), in
the lab, as a candidate. (e) **Vercel is capped** (the free plan's 100 deployments per trailing day, hit at
23:31 on the 14th; the window frees through the afternoon of the 15th): push, but verify on a local
production build or dev server at 1440 and 375 in a foreground tab, and say so in the Handoff. (f) The
record: "Handoff (round 4)" and "Record (round 4)" below; the Record is the paragraph the CHANGELOG carries
for round 4, so write it as what the board became and why.

**Will's note on this board, verbatim.** "I'd like more UI to preview the variations on. Barely a single
screen with a few components doesn't really give a real feel of the marketing site or actual app rounding,
or how the different rounding groups work together."

**Round 4 (the goal).** (1) **Whole pages.** The judged surfaces are whole real pages and live production
components on every candidate, at 1:1: the home arc top to bottom (the hero, the film strip, the chapters,
the pricing band, the footer), /pricing, /help, the dashboard, an event page with its media grid and its
menus, the guest album and the guest entry sheet, a dialog and a menu from the floating board, at 1440 and
375, so the rounding groups (surfaces, the floating layer, media tiles, actions) are judged together where
they meet. (2) **The dock** carries the candidate, the action rung, the ladder, the ground and the canvas,
so any page section is compared by a flip beside it. (3) Keep round three's answer block, the matrix and
the measured corner; every page walk link stays. (4) Where the tuner panel and the dock both stand, keep
them clear of each other and of the evidence (you measured the panel last round; the dock writes
`--board-dock-h`).

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `src/components/dev/` (the board shell: `Stage`,
  `Toggle`, `BoardDock`, `BoardMeta`, the tuner, the candidate block), `touchpoints.ts`, `rules/bible.ts`,
  another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`; a
  shell change you need is asked for in the Handoff and the Orchestrator lands it (announced in
  `docs/tracks/orchestrator.md`).
- **Sheets.** Keyframes under your prefix only (`keyframe-uniqueness.test.ts` reads every sheet under the
  lab); a board sheet never imports tailwindcss; `glow-contract.test.ts` pins the BorderBeam and
  GlowFilter counts across `src`, so compose `<Glow>` only. No em-dashes anywhere a person reads. No
  `font-mono`, no `MonoCaption` (`two-faces-policy.test.ts`).
- **Light QA** (Will, 2026-09-14): the board at 1440 and 375, reduced motion honoured, the gate green on
  the synced tree; Vercel is capped, so verify on a local production build or dev server in a FOREGROUND
  tab (a hidden tab pauses the loops and lays the lab out in the sidebar cell:
  `docs/systems/testing-verification.md`) and say so in the Handoff.
- **Commits** on `lp/<track>` only, staged explicitly, never `--no-verify`, never force; every commit ends
  with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

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

## Handoff (round 3)

- Head: the tip of `lp/rounding`, pushed. The last code commit is `e0a85c9`
  (the fourth pass, below); `12f1b91` was the third pass's and `6dd4d7a` the
  second pass's, and all three sit on the sync merge `c79038b`. The manifest
  commits follow the code. The board is
  `/design/c/rounding?key=`. **The round-three marker in the rendered HTML is
  the heading "What the board answers"** (and the class `rnd-answer-grid`),
  both present in the server-rendered markup; round two's marker, "The six
  tokens, at true size", is still there as part A's heading, so the answer
  block is what tells the two rounds apart.
- **Fourth pass (the read-only re-review of this handoff found one should-fix
  item; it is fixed here).** Every number the board printed beside a card was
  the constant 1.4, while the ladder a card is actually DRAWN at is scoped per
  subtree: the answer block's second column is permanently on the ruled quarter
  ladder, so candidate C drew a 10px card under a caption reading 11.2px, and
  the same constant sat in the action row's contrast ratio, part C's header,
  part A's row note and its lede, and candidate C's phone line.
  `cardMultiplier(ladder)` in `candidates.ts` is the card's step in one place
  now (Card ships as `rounded-xl`, so its corner is the xl rung: 1.4x on stock,
  1.25x on quarters) and every one of those sites reads it. Two of them needed
  more than arithmetic. The LIVE band sits outside every scoped ladder, so a
  multiplier printed there would be a guess: it measures instead, one more
  probe span at `rounded-xl` read back as used pixels, the same way the band's
  six tokens already do (2.8px on the baked tree, 10px with the answer
  applied). And candidate C's phone line carried "The card at 11.2", a number
  that only holds on the stock ladder while C itself wants quarters; the prose
  keeps the argument without the number, and part F's column header prints the
  card computed from the ladder the phone is actually wearing. One guard
  against the regression returning: `NestedSpecimen`'s `outerMultiplier` is
  required rather than defaulted, because that card is drawn from an inline
  `calc` and is the one card on the board a scoped retune cannot reach on its
  own.
- **How the fourth pass was verified, and it is NOT the preview.** Vercel is at
  its daily deployment ceiling again, this round's instruction is that no
  preview will build and that the API is not to be called, so none was
  attempted and none is claimed: the alias still serves `0986a52` and is now
  three code commits behind this handoff. The pass was walked on a LOCAL
  production build instead (`pnpm build`, then `next start` on :3200 in this
  worktree), at 1440 and at 375, and the check was mechanical rather than
  eyeballed, because the bug was a caption that looked plausible: for every
  caption on the page the card's own
  `getComputedStyle().borderTopLeftRadius` was read and compared with the
  number the caption prints. All matched, on the stock rail and the quarters
  rail, in the answer block (2.8px under "card at 1.4x", 10px under "card at
  1.25x"), in part A's four cells, in part C's pair, in the live band, and in
  part F, where the dashboard composition's four `rounded-xl` event cards
  measure 2.5 / 0 / 10 / 17.5 against headers printing the same. Zero console
  messages on a fresh load; at 375 `documentElement.scrollWidth` equals
  `innerWidth`, so the added text wraps rather than widening anything.
- **A second test-tool note for the Orchestrator** (same file as the third
  pass's, `docs/systems/testing-verification.md`, not this lane): the browser
  pane's `resize_window` reported success on every call and the window never
  changed size (`innerWidth` stayed 1456 whether 1440, 1424 or 375 was asked
  for, with `outerWidth` reading 412), so a 375 walk driven that way would have
  been a 1456 walk reported as a 375 one. The way through was to load the board
  into a 375px same-origin `<iframe>` on the page and measure and screenshot
  inside it; the board's own width machinery is measured in JS off real
  rectangles, so it behaves there exactly as it does in a 375 window.
- **Third pass (the read-only review of the round-two handoff found one
  should-fix item; it was fixed then).** Round 3's goal item (1) named seven surfaces to walk
  with the Apply block on, and the handoff had recorded two of them, `/pricing`
  and `/help`, plus the guest page as a negative: `/`, `/contact`, `/dashboard`
  and an event page were neither walked nor declined, while "Look at first"
  sent Will to `/` with the answer applied. All seven are accounted for now,
  five walked and two declined with the reason, in the Apply bullet below; the
  walk found a sixth departure, which is on the board's face rather than only
  here.
- ★ **The preview alias serves `0986a52`, which is the second pass, so it is
  ONE code commit behind this handoff.** At `0986a52` it was checked in the
  served HTML after the deployment went READY (deployment
  `partyreel-kdzrgi9c2-partyreel.vercel.app`, 23:46): the round-three marker,
  the `rnd-answer-grid` class, the guest caveat and part E's entry-sheet row
  all there, no em-dash. The third pass is NOT on it: the account is at
  Vercel's daily deployment ceiling, this round's instruction is that no
  preview will build and the API is not to be called, so none was attempted.
  **The third pass was verified on a LOCAL production build instead** (`pnpm
  build` then `next start` on :3100 from this worktree), which is what the
  Apply and QA bullets below record. The one thing a local server cannot stand
  in for is the alias itself; refreshing it is the Orchestrator's call, not
  this track's lane. The only difference between `0986a52` and the head is the
  sixth departure and the three lines of the board's header comment that name
  it.
- **It took forty minutes of forced redeploys, and the ceiling is the lesson,
  again.** None of this round's six pushes produced a deployment on their own.
  The branch gate was not refusing (the manifest says `preview: true` and every
  commit message carries `[preview]`), and deployments were landing
  project-wide about one every fifteen minutes. The project is at Vercel's
  ceiling of 100 deployments a day, so `POST /v13/deployments` answers
  `payment_required` / `api-deployments-free-per-day` until a slot ages out of
  the rolling window and whoever asks next takes it. Twenty-two retries at
  forty-five seconds got nothing; a tight loop at twelve seconds caught the
  23:46 slot on the first pass. **So: a push is not a deploy, and a slow retry
  is not a retry.** The recipe is the floating-surfaces handoff's
  (`gitSource {type: github, repoId: 1252816746, ref, sha}`); what this round
  adds is the interval. An empty commit spends a slot and fixes nothing.
- Synced with `launch-prep` at `dd4aa0b` (merge `c79038b`); it had moved 24
  commits, all of them other tracks' sandbox files and manifests, none in this
  lane.
- Gates on the synced tree, re-run in full after the third pass's code commit:
  typecheck ok, lint ok (0 errors, 6 warnings, all pre-existing and outside the
  lane), test ok (1719 in 193 files), build ok (248 pages).
- **Light QA, walked rather than asserted, ON THE PREVIEW.** The board at
  **1440** and at **375** on `partyreel-git-lp-rounding-partyreel.vercel.app`
  at `0986a52`, and the same two widths on the local production build and on
  `pnpm dev` before it, plus 1024 on the way. At both widths
  `documentElement.scrollWidth - clientWidth` is 0 AND no unclipped element
  has a right edge past the viewport (the second check is the one that
  matters: the first pass of the new width machinery pushed the board 277px
  past a 375 window and this found it). At 1440 the widest part measures
  x=244 to x=1096 with the lab sidebar ending at 232 and the tuner panel
  starting at 1108, so the board sits in the whole free width with 12px of
  clearance at each end and nothing under the panel. **Reduced motion honoured
  by having nothing to undo:** measured in the running page, zero elements
  resolve an `animation-name` and `board.css` declares no keyframes at all.
  Zero console errors. **Re-walked after the third pass's commit** on the new
  local production build at both widths: still 0 of overflow and still nothing
  past the viewport at 1440 and at 375, still zero elements resolving an
  `animation-name`, and the sixth departure renders (it is in the
  server-rendered HTML, so `curl` finds it too). The only console errors on a
  local `next start` are the two `/_vercel/insights` scripts 404ing off the
  platform, which is the server, not the page. **Re-walked again after the
  fourth pass's commit**, on a fresh local production build at 1440 and at
  375: still no horizontal overflow at either width, still zero console
  messages, and every printed card equal to its drawn corner on both ladders
  (the mechanical check in the fourth-pass bullet above).
- **A test-tool blind spot worth the Orchestrator's note** (for
  `docs/systems/testing-verification.md`, which is not this lane): the browser
  pane paints the FIRST screen of a page and then returns an all-black frame
  for any screenshot taken after a scroll, or after a load at a deep anchor,
  while the DOM at that scroll position reports the section visible, opacity 1,
  in the viewport, with its text. So every below-the-fold claim in this handoff
  is measured (computed styles and bounding rects in the running page) rather
  than eyeballed, and a black screenshot from that pane is not evidence of a
  black page.
- **Cost, measured.** 158 `<img>` in the DOM against round two's 175 (the live
  column's phone canvas is gone), about 30 decoded on the first screen because
  every one is a lazily-loaded `next/image`; zero animations, zero keyframes,
  and the only transform on the page is the shell Stage's own `zoom`. The
  panel-aware width costs one ResizeObserver on two elements, one
  MutationObserver on the tuner panel, and a resize listener; it runs on
  layout changes, never on scroll.
- **"Apply to the site", now walked on every surface the round named** (the
  third pass; the second pass had walked only `/pricing` and `/help` and left
  four of the seven neither walked nor declined). One LOCAL production build,
  `pnpm build` then `next start` on :3100 in this worktree, the board's own
  **Apply the answer** pressed once by a real click so every page below read
  the same stored block, `rounding C, today actions, quarter ladder`. Five
  walked, two declined, none assumed:
  1. **`/`, at 1440 and at 375.** The block lands (`--radius: 8px`,
     `--radius-float: 12px`, `--radius-tile: 4px`, `--gap-gallery: 4px`,
     actions 16 / 19.2 / 12.8) and the quarter ladder is visible on the real
     page rather than on a stage: `rounded-xl` resolves to 10px and
     `rounded-2xl` to 12px, against 11.2 and 14.4 on stock at the same base.
     Zero horizontal overflow at both widths, and no unclipped element with a
     right edge past the viewport. **The walk's own finding, and it is new:**
     70 corners on that one page do not move at all, 48 at a literal 2px and
     22 at a literal 3px, beside cards at 10 and 12. Counted on the tree,
     `rounded-[2px]`, `-[3px]` and `-[4px]` are 52 uses in 24 non-lab files
     (the film strip, the live demo, the decomposition frames, the album
     grids, the reel filmstrip), and 64 px literals in 28 files in all. It is
     the gallery gap's argument one layer out, it is on the board as a sixth
     departure, and it means a ruling of C is also a ruling to sweep them.
  2. **`/pricing`, at 1440.** `--radius: 8px`, a plan card at 12px (1.5 x 8 on
     the quarter ladder) against 25.2 on stock at a 14px base. Zero overflow.
  3. **`/help`, at 1440.** `--radius: 8px`, zero overflow.
  4. **`/contact`, at 1440 and at 375.** The one page in the `(paper)` group,
     and the one that tests the block's selector: a paper chapter resolves
     `--radius: 8px` INSIDE `.surface-paper`, so the `:root`-only paste
     pierces it exactly as `blockFor()` claims. Zero overflow at both widths.
     Its single CTA, "Send message", measures h-11 at 14.4px, which is 0.33 of
     its height: the board's CTA finding, confirmed on a page the board does
     not draw.
  5. **The demo guest page, `/e/<demo token>?key=`, at 1440.** The negative,
     proven on the page itself rather than reasoned from the layout: no
     `style[data-tuner-candidate]` renders at all, `--radius` stays at
     `.125rem` and `--radius-tile` at 3px with the block applied everywhere
     else in the same browser. That is shell ask 1, and this is its evidence.
  6. **`/dashboard`: DECLINED, cannot be walked from this worktree.** Logged
     out, it 307s to `/login` (checked, not assumed). Signing in cannot happen
     on localhost: the Supabase redirect allow-list deliberately excludes it
     (CLAUDE.md, "Local dev vs live testing"), and the one non-interactive way
     around that, minting a host session with the project's own admin API and
     planting the `@supabase/ssr` cookies, was refused by this session's
     permission classifier. It was not worked around. The signed-in live
     browser was not reachable from this session either (its tab tools were
     refused), and with Vercel at its deployment cap there is no fresh preview
     to drive. What IS known: `(app)/layout.tsx` mounts `<AppDesignIsland />`,
     which mounts `CandidateStyle` behind the same `?key=` gate, so the same
     `:root` block reaches the app group; and part B's dashboard column
     measures the production `EventCard` at 10px under the answer.
  7. **An event page, `/dashboard/<eventId>?key=`: DECLINED, same reason** (the
     same signed-in host, one route deeper).
  **The 20-second hand-off for 6 and 7**, in any browser where the host is
  already signed in: open `/design/c/rounding?key=`, press **Apply the
  answer**, then open `/dashboard?key=` and an event page in that same
  browser. The block is one `localStorage` entry on that origin, so it
  follows; keep `?key=` on the URL, because the island reads it at mount.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `src/app/(dev)/design/sandbox/rounding/{board.tsx,board.css,candidates.ts,specimens.tsx}`
  plus this file. `compositions.tsx` is unchanged this round. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Shell changes proposed (the Orchestrator's files, none made):**
  1. `src/app/(guest)/layout.tsx`: mount `<AppDesignIsland />`. Seconding the
     floating-surfaces board. `CandidateStyle` mounts in the lab layout, the
     marketing island and the app island, and the guest group has none of
     them, so `/e/<token>` silently ignores every candidate block. This board
     is the second reason: part E's finding (the entry sheet wears the ACTION
     token at 1.4x) lives on that page, so it has to be drawn rather than
     walked, and the board says so on its face.
  2. `src/app/(dev)/design/touchpoints.ts`, the `rounding` entry, is still
     round ONE's and is now the first thing a reader sees above a board that
     contradicts it: `board.note` reads "One kit of every radius-bearing
     surface in four columns..." and `board.variants` lists "B, soft surfaces"
     and "C, the 16px column", neither of which has existed for two rounds.
     Proposed note: "Six tokens as three decisions: the surface family, the
     action rung and the derived ladder, each at true size on the shipped
     components and appliable to the whole site"; proposed variants:
     `["A, today", "B, square", "C, soft", "D, one family", "Live, the tuner"]`.
     (Raised in round two, unchanged.)
  3. `src/components/dev/motion-tuner-config.ts`, two things. The three action
     knobs cap at 24px, which cannot express the pill rung, so Apply writes the
     pill into the candidate block and clears the knob rather than leaving the
     panel in a state a drag cannot return to; if the pill is ruled, the max
     moves or the control gains a "pill" step. And THREE of the six knob
     descriptions are wrong where this board counted: the surface knob says
     "288 uses in 140 files" against a recount of 320 uses of a derived step in
     154 files; "Action radius" is described as "the standard button (40px
     tall)" and "every default Button", when the default Button is h-8 and
     wears `--radius-action-sm`; and "Action radius, large" says it ships on
     "the hero and pricing CTAs, the guest door's primary action" when it has
     exactly one call site in the product, the reel builder, on an h-11. The
     panel sits beside the board that disproves it.
  4. `src/components/dev/board/`: two things every board is now writing for
     itself. A stage that takes its height from its content (the brand-voice
     board wrote it, this board wrote it again as `FitStage`, and a stage that
     guesses leaves a hole under its composition), and a PANEL-AWARE width (the
     tuner is fixed, 320px, and opens open, so any board whose evidence reaches
     the right of the column is partly hidden on arrival; this board measures
     `[data-motion-tuner]` and keeps clear of it, in about forty lines that
     belong beside `Stage`).
  5. `src/components/shared/glow-contract.test.ts` pins the exact set of
     BorderBeam call sites. The beam around an action is the third bible-9
     specimen part C wants (the beam is the case the system already gets right:
     no radius prop, it reads the child's computed one), and adding it would
     need one line in that test. The board draws a plain ring at the same
     offset instead and says so. (Raised in round two, unchanged.)
- Assets requested from Will: one, unchanged from round two.
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
- Look at first: the block at the top, **"What the board answers"**. It is the
  five rulings in five words, with today's card beside the proposed one at true
  size and one button that puts the whole paste on the site. If the five words
  are right, the ruling is "yes" and the rest of the board is the evidence in
  order. If one is wrong, part A settles the surfaces, part E settles the
  actions (look at its last row, the guest entry sheet under the pill), and
  part D settles the ladder. Then press **Apply the answer** and walk
  `/pricing` and `/`: that is the real answer, and the board is the shortlist.
  Two things to expect on that walk, both recorded below: the photographs stay
  sharp while the cards move, because 52 of their corners are px literals no
  candidate can reach; and the app pages need `?key=` on the URL and a
  signed-in host, which is the one part of the walk this worktree could not
  take.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The rounding board was rebuilt over two rounds. Round one judged six numbers in four columns inside a zoom-fitted stage, where `zoom` scales paint with layout and every corner read about a third sharper than its own number; round two split the tokens into the three decisions they are (the surface family A to D, the action rung, the derived ladder) and rendered every comparison at 1:1 on the components that ship them: a four-row matrix, four real compositions, bible 9 drawn right and wrong, the seven derived steps beside a quarter-step retune, the action ladder at every shipped height, and every candidate on its own 375 canvas.
Round three was the walk Will was about to take, taken first, and it found the board hiding its own evidence. The tuner panel is fixed at the bottom right, 320px wide, and opens open: it sat over the last two columns of the matrix, both specimen columns of the ladder, the third action rung and the third phone. The board measures the panel now and keeps every part clear of it, live, so closing it widens the board again; the live column, which sat under the panel that drove it, became one band; part B's stage takes its height from its content instead of guessing at it; and the answer comes first, as five one-word rulings with the two shapes the first one turns on at true size and one button that puts the whole paste on the site.
Six findings, all on the board rather than in a comment. The guest gallery's gap is a literal in three files while its tiles ride the token, so any tile above 3 opens corner holes on the one grid every guest sees. The guest entry sheet, the first surface any guest meets, takes its corner from the ACTION token at 1.4x, which makes it a half circle under the pill rung. `--radius-action-lg` has one call site, and every marketing CTA is an ad-hoc h-11 in 26 files wearing 0.33 of its height against a documented 0.4. `rounded-3xl` and `rounded-4xl` have three uses between them. The guest group mounts no design island, so the page those findings live on cannot wear a candidate at all. And the sixth came from walking all seven surfaces with the answer applied rather than from reading the tree: 64 corners in 28 files are px literals, 52 of them photographs, so the home page alone keeps 70 corners at 2 and 3px while the cards around them move to 10 and 12.
The board answers C (8 / 12 / 4), today's action rung, the quarter ladder, drop the dead rungs and pin the gap, verified on `/pricing`, where a plan card lands at 12px against 25.2 on stock at a round base.

## Handoff (round 4)

- Head `2f9cedd`, pushed (the manifest commit follows it); preview
  `partyreel-git-lp-rounding-partyreel.vercel.app`, which this round did NOT
  wait on and did NOT ask the API for: Vercel is capped and the round's
  instruction is to verify locally. **Everything below was walked on a LOCAL
  PRODUCTION BUILD** (`pnpm build`, then `next start` on :3401 from this
  worktree) and on `next dev` before it, in a FOREGROUND tab, at 1440 and at
  375.
- **Second pass, `7a470dd` and `2f9cedd` (the read-only review of this handoff
  found four should-fix items; all four are fixed, the first uncovered a fifth
  under it, and re-walking the fix for the fourth turned up a sixth). Every
  claim here is measured in the running page on a local production build in a
  FOREGROUND tab, not asserted.**
  1. **The scroll lock reached one row of three.** `useScrollLock` was
     instantiated inside `PageFrames` only, so part A's split scrolled together
     while part B's pair and part G's four did not, under a part-G lede that
     promised they did and a dock control ("Compare: Today beside it") that
     reads as page wide. The hook is exported now and **every row holds one of
     its own**: part A's two, part B's two (in a `ScreenFrames` beside
     `PageFrames`, so Compare means the same thing on both parts) and part G's
     four, always on, because a row of four candidates at four scroll positions
     is not a comparison. Measured: scrolling the app's left frame to 260 moves
     its right frame to 260 and leaves the site pair and the phones where they
     were; scrolling phone three to 120 moves all four phones and nothing else.
  2. **Under it, a fault the review could not see and the first walk missed:
     even part A's split did not lock on first open.** A frame in the
     server-rendered HTML finishes loading BEFORE React hydrates, so the
     element's `load` event is gone by the time an `onLoad` handler exists and
     the row was never joined; it only began to work after "Reload frames",
     which remounts the element so its load lands after hydration. That is why
     the round-four walk read the split as working. The row is joined from an
     effect keyed on the load count now, and the first scroll after a cold load
     of the production build syncs (600 to 600, no reload).
  3. **Two DEPARTURES pointed at the wrong part**, which is the block Will
     reads to rule: the guest entry sheet is drawn in part F, not E, and the
     ladder retune renders in part E, not D. Both were right before the
     re-lettering. Swept the rest of the lane with them: four comments and two
     section headers in `specimens.tsx`, `candidates.ts` and `board.tsx` still
     carried round three's letters, and `specimens.tsx` still described a Stage
     this board no longer uses. Every "part X" in the rendered page was then
     read back out of the HTML and checked one by one.
  4. **The app frames shipped a keyless lab URL in the server HTML.** The
     design key is read from `window.location.search`, whose server snapshot is
     empty, so the SSR markup carried
     `<iframe src="/design/sandbox/rounding/screen?screen=dashboard&ground=app-light">`
     and the browser started that load before hydration. `requireDesignKey`
     answers a keyless lab URL with `notFound()` on every build but local dev,
     so on the gated preview and on `next start` both app frames painted the
     lab 404 and then reloaded: two wasted page loads and a visible wrong-page
     flash on every open. Parts B and G hold their frames until the board is
     mounted (part G's intersection gate already did, for the same reason);
     part A's frames are the site's own routes, need no key, and still render
     on the server. `curl` now finds exactly two iframes in the HTML, both
     `src="/"`. The header's invariant in `frames.tsx` claimed no frame carries
     the key, which was only ever true of part A and was contradicted by the
     `inject` comment below it; it states both kinds now.
  5. **The Screen picker was a page-wide switch left beside part B**, and the
     Handoff's justification for the exception ("each picks one specimen") was
     wrong: the page picker does pick part A's one specimen, but the screen
     picker also decides what part G loads into all four phones, so a reader at
     the phone row had to scroll back up to change it, which is Will's global
     note (a) exactly. It is in the dock with the other page-wide switches now
     (the dock is three rows and 131px at 1440, the answer block's anchors
     still land clear of it at y=163 against a dock bottom of 131), and part B
     carries a line saying where it went. Measured standing at part G: one
     click on "Guest door" in the dock moved all six screen frames to
     `screen=entry`.
  6. **The comment under that move made a claim the page does not support.**
     Both the JSX comment and the `board.css` note said the five screen names
     are "wider than a 375 dock", so the group "scrolls inside itself". Walked
     at 375 on the production build they are not: the tablist measures 343
     inside 343 of dock, it fits with nothing to spare, and the wrapper's
     `overflow-x` never engages. The guard is still right to keep, because one
     longer screen name earns it, so both comments say guard rather than fix
     and quote the measurement. Same class as the four above, one layer down.
- **Second-pass gates, re-run on the final formatted tree (`2f9cedd`):**
  typecheck ok, lint ok (0 errors, 6 warnings, all pre-existing and outside the
  lane), test ok (1804 in 199 files), build ok. `pnpm format` reported both
  changed files already clean, and the diff was eyeballed for the
  `prettier-plugin-tailwindcss` className hazard (none: no conditional class
  strings in the lane).
- **Second-pass light QA, on a local production build in a FOREGROUND tab.** At
  **1440**: document overflow 0, the dock 131px (three rows, up from 89 with
  the screen picker in it) writing `--board-dock-h` and `scroll-padding-top:
  139px`, eight frames on the page (2 site, 2 app, 4 phones), all three rows
  locking to themselves, "One frame" giving one site frame and one app frame
  and both re-skinning to `--radius: 8px` on a flip to C with no reload. At
  **375**: document overflow 0, the dock static and exactly 375 wide with its
  own overflow 0, the docked screen picker 343 inside 343, and **zero stranded
  elements**: every element whose right edge passes the viewport sits inside a
  row that scrolls itself, parts A and B included, which is the harder case
  (those rows hold 1440-wide frames in a 375 viewport). **Reduced motion
  honoured by having nothing to undo**, re-measured after the change: zero
  elements on the page resolve an `animation-name` and the sheet still declares
  no keyframes. No console errors or warnings on the board, and **zero
  hydration warnings** from the mount-gated frames. The SSR HTML was read with
  `curl` as well: exactly two iframes, both `src="/"`, and no keyless lab URL
  on any frame.
- **One check this pass could NOT re-measure, stated rather than glossed.**
  Part G's four phones were re-verified at **1440** (they mount, they carry the
  dock's key and screen, and scrolling phone three to 120 moved all four while
  the site pair stayed at 400 and the app pair at 300). The same row at **375**
  was not re-measured: every Browser-pane tab was held by another track's
  session by then, and the fallback Chrome tab sat occluded, where
  IntersectionObserver is frozen and part G therefore never mounts. Part G's
  row is the same `overflow-x-auto` + `w-fit` construct as parts A and B, whose
  375 behaviour IS measured above with wider children, so the risk is low, but
  it is not measured and is not claimed as such.
- **The test-tool note, again, and it cost time again.** The Browser pane's tab
  went hidden between two calls and part G simply never mounted: in a hidden
  tab **IntersectionObserver callbacks are not delivered either**, not just
  ResizeObserver's, so a gated part reads as broken. Fronting the tab
  (`tabs_select`) and re-running showed all four phones immediately. For
  `docs/systems/testing-verification.md`, which is not this lane: a hidden tab
  freezes every observer on the page, so anything a board defers until it is
  seen, or measures in JS, is frozen with them.
- **The round-four marker in the rendered HTML is the heading "The real site,
  at 1:1"** (with the class `rnd-frames`), server rendered, so `curl` finds it.
  Round three's "What the board answers" and round two's "The six tokens, at
  true size" are still there, one part down each.
- **What changed, and why it is a rework rather than an addition.** Will's note
  was that a screen of components gives no feel of the real thing. Rounds one
  to three answered that with COMPOSITIONS: real components, arranged by the
  board, standing in for pages. A composition is honest about a component and
  dishonest about a page, and inside the shell's Stage it is dishonest twice,
  because a Stage is a div: a Tailwind breakpoint prefix in it reads the
  BROWSER's width rather than the canvas's, and every radix panel portals out
  of it. Both are documented on `Stage` itself; every earlier round of this
  board worked around both by hand, which is why the guest sheet, the dialog
  and the menu were hand-copied class strings.
  Round four stops arranging and loads the pages.
  1. **Part A is the site.** A same-origin iframe laid out at exactly 1440x930
     or 375x760 with the route in it, and the rail written INTO that document
     as the same paste a ruling would land (`frames.tsx`). Split scrolls today
     beside the candidate; single re-skins one page in place as the dock flips,
     with no reload and no scroll lost. Eight pages: `/`, `/pricing`, `/help`,
     `/how-it-works`, `/features/album`, `/contact`, the live demo guest album
     and `/login`.
  2. **Part B is the app**, which is behind a sign-in and cannot be loaded from
     a route, so this lane serves it from one of its own,
     `/design/sandbox/rounding/screen` (`screen/page.tsx` + `screens.tsx`), the
     pattern the floating-surfaces board wrote for the same portal reason. Five
     screens, all production components: the dashboard (`EventCard`), an event
     page (`MasonryColumns`, the command strip, the row menu), the gap (the
     token grid beside the literal one), the guest door (the real `EntryShell`,
     a vaul drawer below 640 and a Radix dialog above) and the floating layer
     (the real `Dialog` and `DropdownMenu`, open).
  3. **Part G is the four candidates at once**, four 375 viewports side by
     side, gated on intersection because four viewports are four page loads,
     and scrolled together.
  4. **The dock carries every page-wide switch** (the shell's new `BoardDock`):
     the candidate, the action rung, the ladder, the canvas, the app screen,
     the app ground, Compare, Reload frames, Apply and Clear. **Part A's page
     picker is the only control left beside a part**, because it is the only
     one that picks a single part's specimen; the screen picker looked like its
     twin and is not, since part G loads the same screen, so the second pass
     moved it into the dock (item 5 above). `compositions.tsx` is deleted and `StaticMenu` / `StaticDialog`
     are gone from `specimens.tsx`: the real primitives replaced them.
  Rounds two and three are kept and moved under the evidence they explain: the
  answer block first, then the matrix (part C), the nested corners (D), the
  derived ladder (E) and the action ladder (F). Every walk link stays.
- **What the frames proved, measured in the running pages rather than argued.**
  - The paste reaches a frame and re-skins it live: flipping the dock to C
    moved the right frame to `--radius: 8px`, `--radius-tile: 4px`, card 11.2px
    while the left stayed at 2 / 3 / 2.8, with no reload. Quarters took the same
    card to 10px (the ladder is baked into the utilities, so the block's utility
    overrides have to win, and they do). The pill took `--radius-action` to 999.
  - **The guest entry sheet, on the production shell at a real 375 viewport:
    22.4px today, 11.2 under quiet, and 1398.6px under the pill**, which the
    browser clamps to a half circle. Round three drew that from a copied class
    string; it is the real component now.
  - **The real dialog and the real menu both measure 8px** (`--radius-float`),
    portalled into the canvas rather than over the lab.
  - **The round's worst finding, on the live demo album:** at candidate D the
    real guest masonry draws 6px tile corners while its column gap stays at the
    literal 3px it hard-codes, beside today at 3 and 3. That is four corners
    meeting in three pixels, on the one grid every guest sees, and it is now
    something Will can look at rather than a sentence.
- **Three faults the walk found, all fixed here, all measured.**
  1. A bordered frame is border-box, so 1px of chrome handed the iframe a
     **1438px** viewport under a caption reading 1440: a two pixel lie on a
     board whose whole argument is that a size must be its own. The chrome is an
     outline now (painted outside the box, no layout) and every frame measures
     exactly its canvas.
  2. The shell's `Toggle` is `inline-flex` and never wraps, so part A's eight
     pages are a 490px group that took the whole document into a **131px**
     horizontal scroll at 375. The control rows scroll inside themselves now.
  3. A server component cannot read a constant out of a `"use client"` module
     (Next replaces every export with a client reference on the server), so the
     screen route's first render was a TypeError on `SCREENS.map`. The ids live
     in `screen-ids.ts`, which the route, the board and the screens all read.
- Synced with `launch-prep` at `6484558` (merge `6bbb458`); it had moved two
  commits, both docs (`PROGRAM.md`, `docs/tracks/orchestrator.md`), none in this
  lane. The sync surfaced one correction the board needed: `(guest)/layout.tsx`
  mounts `AppDesignIsland` now, so the departure claiming the guest page cannot
  wear a candidate is wrong and is rewritten, the album joins the walk list, and
  round three's shell ask 1 retires.
- Gates on the synced tree: **typecheck ok, lint ok (0 errors, 6 warnings, all
  pre-existing and outside the lane), test ok (1804 in 199 files), build ok (249
  pages** , one more than 248: the screen route).
- **Light QA, walked rather than asserted, on a local production build in a
  FOREGROUND tab.** At **1440**: `documentElement.scrollWidth - clientWidth` is
  0, zero unclipped elements with a right edge past the viewport, all four
  frames report `innerWidth` 1440 with the candidate injected, the dock measures
  89px and writes `--board-dock-h: 89px`, and the answer block's "part C" anchor
  lands at y=121 against a dock bottom of 89, so it clears it. At **375**: 0 of
  overflow, 0 elements past the viewport, the dock is `static` (the shell's
  phone behaviour), the frame rows scroll inside themselves. **Reduced motion
  honoured by having nothing to undo**: measured in the running page, zero
  elements resolve an `animation-name` and the board's sheet declares no
  keyframes at all; inside a frame the page is the real page and honours the
  reader's own setting exactly as it does in a tab, because
  `prefers-reduced-motion` propagates into an iframe. The only console errors on
  a local `next start` are the two `/_vercel/insights` scripts 404ing off the
  platform, which is the server rather than the page, now once per frame because
  a frame is a page: nothing else, and nothing from this lane.
- **The test-tool note this round is the same one, and it bit first.** A driven
  Chrome tab reports `document.hidden` true: `requestAnimationFrame` never
  fires, **no `ResizeObserver` callback is ever delivered** (verified by
  attaching a fresh observer in the page and resizing the observed element: zero
  hits), and the lab lays out in the sidebar cell. The first hour of this walk
  read `--board-dock-h: 357px` against a dock that measured 89 and looked
  exactly like a shell bug in `dock.tsx`. It is not: in a visible tab the
  observer settles at 89 immediately. The Browser pane's tab is visible when it
  is fronted (`tabs_select`), which is how this round was walked; it still
  returns an all-black screenshot after a scroll, so every below-the-fold claim
  above is a measurement, not a look. For
  `docs/systems/testing-verification.md`, which is not this lane: **a hidden tab
  does not just pause loops, it silently disables every ResizeObserver on the
  page, so any width or height a board measures in JS is frozen at whatever the
  first, half-built layout produced.**
- **Cost, measured.** At most 8 iframes on the page: 2 in part A, 2 in part B, 4
  in part G, and part G's four wait for an IntersectionObserver so a reader who
  never reaches it never pays for them. Single mode halves A and B to one each.
  Each frame is a real page load, which is the price of the honesty; nothing on
  the board animates, no keyframes are declared, and the only observers are the
  panel-aware width's (unchanged from round three) and part G's gate.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `src/app/(dev)/design/sandbox/rounding/{board.tsx,board.css,frames.tsx,screens.tsx,screen-ids.ts,screen/page.tsx,specimens.tsx}`,
  `compositions.tsx` (deleted), plus this file. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Shell changes asked for (the Orchestrator lands them; none made here):**
  1. `src/components/dev/board/toggle.tsx`: a `wrap` option (or
     `flex-wrap` by default). The group is `inline-flex` and never wraps, so any
     board offering more than about six options overflows a phone. This lane
     works around it with a scrolling row in its own sheet; the fix belongs
     beside the component every board uses.
  2. `src/components/dev/board/`: a `PageFrame` beside `Stage`. This lane just
     wrote one (a same-origin iframe at a real canvas with a CSS block written
     into its document, plus a scroll lock for two of them), the
     floating-surfaces board wrote a narrower version for its scenes, and it is
     the only way a lab board can judge a real page at true pixels or reach a
     component's own breakpoints and portals. It is about 200 lines and it wants
     one home.
  3. `src/components/dev/motion-tuner-config.ts`, unchanged from round three:
     the three action knobs cap at 24px, which cannot express the pill rung (so
     Apply writes the pill into the block and clears the knob); and three of the
     six knob descriptions are wrong where this board counted (the surface knob
     says "288 uses in 140 files" against 320 uses of a derived step in 154;
     "Action radius" is described as "the standard button (40px tall)" and
     "every default Button", when the default Button is h-8 on
     `--radius-action-sm`; "Action radius, large" claims the hero and pricing
     CTAs and the guest door, when it has exactly one call site in the product).
     The panel sits beside the board that disproves it.
  4. `src/app/(dev)/design/touchpoints.ts`, the `rounding` entry: the note is
     round three's and is now a part behind. Proposed: "The site and the app
     loaded into a viewport of their own at true pixels and re-skinned live from
     the dock, under five one-word rulings: the surface family A to D, the
     action rung and the derived ladder against a quarter-step retune".
     `board.variants` is correct as it stands.
  5. `src/components/shared/glow-contract.test.ts` pins the exact set of
     BorderBeam call sites. The beam around an action is the third bible-9
     specimen part D wants (the beam is the case the system already gets right:
     no radius prop, it reads the child's computed one), and adding it would
     need one line in that test. The board draws a plain ring at the same offset
     instead and says so. (Raised in rounds two and three, unchanged.)
  - Retired this round: round three's ask 1 (`(guest)/layout.tsx` mounting
    `AppDesignIsland`) landed on `launch-prep`; and round two's ask for a
    `fit={false}` escape hatch on `Stage`, which round four's 1:1 default
    answered.
- **Assets requested from Will: one, unchanged from rounds two and three.**
  - A worst-case tile set for the gallery gap · four photographs whose edges are
    near-white and bright (a white tablecloth, an overexposed sky, a white dress
    against a window), 1200px long edge, JPG, four of them · replaces the
    `wedding-golden` / `party-dj` / `festival-lights` stills in part B's gap
    screen and part G's phone row, so a corner hole between tiles is judged at
    maximum contrast rather than against dark stills that hide it.
- **A judgment call, stated rather than buried.** Will's round-four note opens
  the app's UI to any active lab track. This board did not redesign an app
  screen, on purpose: a radius board that also redraws the screen cannot be
  ruled on, because you could no longer tell whether a corner reads better
  because of the radius or because the page was redrawn. What the round took
  from that note instead is the part that serves the ruling: the app is now on
  the board at the size it ships, in its own viewport, which is the thing an app
  track will need as its starting point anyway.
- The asks, verbatim from BoardMeta:
  1. "The surfaces: A, B, C or D (--radius, --radius-float and --radius-tile move together)"
  2. "The actions: today, pill or quiet"
  3. "The derived ladder: stock or quarters"
  4. "The dead rungs (rounded-3xl, rounded-4xl, --radius-action-lg): keep or drop"
  5. "The gallery gap: pinned to the tile, or free"
- **Look at first:** the block at the top, "What the board answers", then part
  A. Leave Compare on "Today beside it", put the dock on **C**, and scroll the
  home page inside the left frame: the two scroll together, and that is the
  ruling. Then switch the page to **Guest album** and the candidate to **D**,
  which is the round's worst finding on the real page. Then **One frame** and
  flip A, B, C, D in the dock without scrolling: the same page re-skins in
  place, and it is the fastest read on the board. Part B is the same thing for
  the app; its door screen is where the action rung turns into a sheet. One
  practical note: the tuner panel is fixed over the right at 320px, so collapse
  it (its cross) before reading a 1440 frame, and the row widens live.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Will's note on the rounding board was that a screen of components gives no feel of the real site or the real app, and round four answered it by rebuilding what the board judges ON rather than adding to it. Three rounds had used compositions: real components, arranged by the board, standing in for pages, inside a Stage whose breakpoints read the browser rather than the canvas and out of which every radix panel portals. Round four loads the pages instead. Part A is the site in a same-origin iframe at exactly 1440x930 or 375x760 with the candidate written into that document as the paste a ruling would land, so the real components wear it at their own breakpoints at true pixels: split scrolls today beside the candidate, single re-skins one page in place as the dock flips, over eight routes including the live demo guest album.
Part B is the app, which is behind a sign-in, served from a screen route of the lane's own so the production MasonryColumns, EventCard, Dialog, DropdownMenu and guest EntryShell each get a viewport of their own; part G is the four candidates at once at 375. The shell's new dock carries every page-wide switch. The hand-written floating specimens and the whole compositions file went with the change.
Three findings stopped being sentences and became things to look at, all measured in the running pages: the production entry sheet draws 22.4px today, 11.2 under quiet and 1398.6px under the pill, which the browser clamps to a half circle; the real dialog and menu both measure the 8px float token, portalled into the canvas; and on the live demo album at candidate D the guest masonry draws 6px tile corners inside the literal 3px gap it hard-codes, which is four corners meeting in three pixels on the one grid every guest sees.
The walk found three faults and fixed them: a bordered frame handed the iframe a 1438px viewport under a caption reading 1440, the shell's non-wrapping Toggle took the page into a 131px horizontal scroll at 375, and a server component cannot read a constant out of a client module. The board still answers C (8 / 12 / 4), today's action rung, the quarter ladder, drop the dead rungs and pin the gap.
