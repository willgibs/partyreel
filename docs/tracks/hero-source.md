---
track: hero-source
status: handed-off
cut: "c473707"          # origin/launch-prep at the round-four cut
merged_round_1: "0298c21"
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-source
owns:
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.css
  - src/app/(dev)/design/sandbox/home-hero/scan.tsx
  - src/app/(dev)/design/sandbox/album-hero/burst.tsx
  - src/app/(dev)/design/sandbox/river-visual/river.tsx
  - src/components/dev/board/stage.tsx
  - src/components/dev/board/dock.tsx
  - docs/ASSETS.md
  - docs/tracks/hero-scan.md
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-source

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

**Will's ruling on the home hero board, verbatim.** "I'm loving 1 and 2. Let's continue iterating on 1 in its
current emanating direction and 2 with its phone scan addition." The source is variation 1, ruled the
direction in round two ("definitely my favorite direction": a stranger immediately gains "I bet if I scan
this QR I get all of these images") and iterated by the Orchestrator through round three; this round it is
an agent track again (the lane released), so it can be taken as far as the scan, the burst and the river
were.

**Round 4 (the goal).** (1) **Continue the emanating direction**, from the ground up: the code at the centre,
the album leaving it in the two corridors, forever. Judge every part of the composition as if it did not
exist yet: the corridor's geometry and depth, the birth of a frame at the code, the cadence and the loop's
period, the two-line headline at 1440 that round three's ink measurement found (a one-line xl headline gets
a photograph behind it), the subhead and the CTAs, the caption that names what is happening, the 375
composition as its own thing, reduced motion as the deployed album, the first paint with JavaScript off.
Take the best of what the burst and the river learned (read `../album-hero/burst.tsx` and
`../river-visual/river.tsx`, read-only: the ease-out flights in world units, the acceptance walk, the
lockup's measured ink as the keep-out) where it serves the corridor. (2) **The scan is its sibling** (the
`hero-scan` track iterates the phone reading this round): keep the two comparable, the same corridor where
they share it. (3) **The inflow is its mirror** (the `hero-inflow` track builds images streaming INTO the
code off your mechanics): write your loop so the direction is a parameter where that costs nothing, and say
in the Handoff what the inflow can reuse. (4) Every stage at 1:1; the page-wide switches are the board's
dock (the Orchestrator's `board.tsx`); your concept's own toggles stay beside the stage. (5) The asks: the
departures Will rules on, no more; the assets unchanged (row 2, the 24 squares) unless the composition
needs something new.

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

**Goal.** The source, concept of the home-hero board's second round (Will, 2026-09-14: round one's four
grids were "very bland and generic", not "the one QR/link -> full event album concept"; everything is
open, the hero's UI, its copy, the eyebrow, and the design system around it under rising tides).
The QR is the origin. The real demo QR sits at the exact centre of the viewport, at rest and scannable (the shell hands you `qrUrl`; render it with `DemoQr` from shared.tsx at a size that scans from a laptop screen, 120 to 160 px). On load the album's frames branch out of it, left and right, in two perspective rows, and never stop: frames are born at the QR and travel outward to the edges in a loop, the way an album fills from one scan. The headline sits above the rows, the subhead and the CTAs below; the QR is the eyebrow, the object and the argument at once. Phone: the two rows compressed to one strip between headline and subhead. Melius's loop, ported: 24 cards split by index parity into a left and a right pool; one card launches per side every 900 ms and flies for 9.6 s, recycled round-robin; position on `0.5 * easeInQuad(smoothstep(p)) + 0.5 * smoothstep(p)` toward 1.65 x the canvas width, scale on `0.125 * smoothstep(0, .15, p) + 0.875 * smoothstep(.2, 1, p)`; the corridor pre-seeded (`progress = i * 0.09375`) and revealed by one tween of progress from 0 to 1 over 1.75 s (that is the branch-out). One `perspective` parent, absolutely positioned cards, one requestAnimationFrame loop writing `translate3d(x) scale(n)` from a `progress[]` ref (never state), an explicit rotateY of 6 to 10 degrees per side, `will-change: transform`, the band masked at its edges, new cards fading in AT the QR rather than popping. Geometry from CANVAS (1440 or 375), never from getBoundingClientRect (the stage is zoomed). The loop stops on the stage's `data-paused` (read it off the closest `[data-paused]` ancestor) and under reduced motion, where the rest state is the two rows fully deployed. Media at 100 percent, no darkening layer anywhere.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema skin, `data-mkt` and `data-paused` on a hidden tab. Your `Concept` also carries
what the board lists beside the stage: `eyebrow` (yours: the QR itself, no label), `proposed` copy (the stub's lines are
a starting point; improve them, they are proposals), `departures` (flag: none expected; light only as a flagged departure) and `assets` (name
exactly what replaces your stand-ins: 24 event photographs as 512 x 512 squares (6 to 35 KB webp each) across weddings, parties, corporate, festivals; one grade). Replace the stub's `Placeholder` render; keep the export
name and the id. Keyframes live in your own sheet with your prefix. You own two files and nothing
else; if the shell lacks something you need, say so in Handoff rather than editing it.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's), above all 1 (media is the
color: no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy`
scans the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (the
thesis renders verbatim under the ruled toggle; your proposal renders under the proposed toggle), and
the standing ruling that the hero is cinema and unlit (light only as a flagged departure). The media
manifest is the only source of paths. Take the big swing: a totally different, better hero beats a
safe increment, and the reference's mechanic is a starting point, not a ceiling.

**Verify on.** partyreel-git-lp-hero-source-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy,
Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM. Light QA by the
exploration-round principle: nothing more.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **none.** No production byte moved, and no owned fact belongs in a system doc yet: the corridor is
  a lab concept until Will rules on the board.

## Deferred (ROADMAP one-liners, bucket named)

- Testing and verification: record the live-motion blind spots these rounds hit, in
  `docs/systems/testing-verification.md`. An occluded real-Chrome window suspends
  requestAnimationFrame completely (measured: 0 frames in 2.9 s), so a JS-driven loop photographs
  as an empty stage there; the Browser pane keeps ticking rAF while hidden but its screenshots go
  stale and desync from the page's own scroll (hit again at round four: the DOM reported the stage
  at y=70 while the screenshot still showed it at y=640). The way through, and the reason a loop
  should be a pure function of elapsed time, is to freeze the loop at a chosen elapsed and shoot
  the still, or to set the transform and read the rect synchronously in one task, which the loop
  cannot race.
- Testing and verification: THE BROWSER PANE IS SHARED between parallel agent sessions. Round four
  had three tabs navigated out from under it mid-measurement by other tracks' sessions. Every
  in-page script should assert its own URL on its first line and every check should be one
  `browser_batch` (select, navigate, measure) rather than a sequence of calls.
- Home hero (the wiring round, if the source is ruled): production wires the loop to
  `useAmbientPause` rather than to the stage's `data-paused`; and the geometry is now solved
  against a 4rem overlay site header (the headline's ink starts 79 px down at 1440, 89 at 375), so
  the wiring round re-checks that number against PageHero's real top padding rather than assuming
  the canvas is the whole hero. The `<noscript>` companion rule this bucket asked for is DONE, on
  the board.

## Handoff (replaces the chat report)

- Head: the tip of `lp/hero-source`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `e4e46fe`, which is what the preview alias was verified at. Pushed; preview
  `https://partyreel-git-lp-hero-source-partyreel.vercel.app`, the board at
  `/design/c/home-hero?key=` (concept 1 of 3).
- Synced with launch-prep: **not needed**, it had not moved (`git rev-list --count
  HEAD..origin/launch-prep` = 0 at handoff).
- Gates on the tree: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing ones on
  `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`), test ok (1636 in 190
  files), build ok (246 static pages, the launch-prep count unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/hero-source.md`, `src/app/(dev)/design/sandbox/home-hero/source.css`,
  `src/app/(dev)/design/sandbox/home-hero/source.tsx`. **No exceptions**: the two owned files and
  this manifest. `shared.tsx` and `board.tsx` were read and not touched; the shell had everything
  the concept needed.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **Verified on the preview at `e4e46fe`** (the alias was polled until its HTML carried `hhs-card`,
  so the build is proven by a marker rather than by the clock):
  - The gate: 404 with no key, 404 with a wrong key, 200 with the key.
  - The server's own HTML carries 24 `.hhs-card` nodes and 24 `--hhs-rest` declarations, so the
    deployed corridor is in the markup: reduced motion, a crawler and a cold paint all get the
    album standing still rather than an empty band.
  - The h1 is in the HTML, at computed opacity 1, with no `data-mkt-cut` / `data-mkt-reveal` /
    `.mkt-line` on any h1 on the page. It never moves, before or during the branch-out.
  - Desktop 1440 and Phone 375, ruled and proposed copy: the corridor runs, five frames a side on
    desktop and three on the phone, the QR still at the exact centre, the type clear of every
    photograph at both widths.
  - Replay: the stage remounts with fresh nodes, the inline transforms are gone and the computed
    state is `matrix(0, 0, 0, 0, 0, 0)` at opacity 0, which is the branch-out's first frame. The
    `--hhs-rest` declarations survive the remount.
  - Reduced motion: simulated by deleting the `no-preference` block from the live sheet and clearing
    the loop's inline styles, which leaves exactly the cascade a reduced-motion reader gets. The
    corridor stands fully deployed at its steady-state spacing.
  - No em-dash anywhere in the served page.
- **Assets requested from Will** (the concept lists these on the board too):
  1. **24 event photographs, 512 x 512 squares, one grade, 6 to 35 KB webp each**, across weddings,
     birthdays, corporate and festivals. They replace the 12 landscape stand-ins the corridor cycles
     (`FRAMES` in `shared.tsx`). The mapping is already written for 24: the left arm takes the first
     twelve and the right arm the last twelve, so the two arms never carry the same frame at once.
     With only 12 stand-ins each arm repeats after twelve launches, about 108 s.
  2. **Framed tight enough to read at 120 px**: a face, two hands, a glass, a sparkler, a first
     dance. A frame is read here between 70 and 330 px, and a wide room shot is grey mush at that
     size. This is the single biggest lift available to the concept.
  3. Nothing else. The QR is the real demo event's, live from `NEXT_PUBLIC_DEMO_QR_TOKEN`; there is
     no plate art, no lamp and no video in this concept.
- **Look at first**: the first two seconds. The QR sits alone for about half a second, then the whole
  album unfolds out of it in one beat and never stops. Then: whether the corridor is dense enough at
  the ruled cadence (one launch a side every 900 ms leaves five frames a side on screen), and whether
  the centred lockup is right for the home hero, which is the one precedent this concept breaks.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The source, concept 1 of the home-hero board's
second round, replaced its placeholder. The composition refuses the trade every previous hero made:
the album is a horizontal corridor through the middle of the frame and the type lives above it and
below it, so no photograph is darkened and no word sits over one, with no scrim anywhere. At the
corridor's exact centre the real demo QR stands still at scanning size, and the frames are born
behind it and fly outward forever. Melius's three.js fountain was ported to DOM transforms: 24 cards
split by index parity into two pools, one launch a side every 900 ms, 9.6 s flights, position and
scale on separate curves, and the recycling falling out of one modulo, so a card's progress is a
closed form of the clock and there is no per-card bookkeeping. One requestAnimationFrame loop fills a
progress ref and writes to 24 nodes; React state is never touched. The branch-out is the same
expression with the seeded offsets multiplied by a 1.75 s reveal, so the entrance and the loop are
one beat with no handoff. The deployed corridor is the rest state, written as per-card custom
properties into the server's own HTML, and the pre-burst frame lives inside the reduced-motion block
so the burst cannot flash.

## Handoff (round 4)

- Head: the tip of `lp/hero-source`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `505df89`, the review pass; `dc4040c` is round four's build and `f12841b` the
  merge that synced launch-prep a second time, for the dock (below). Pushed. The preview at
  `partyreel-git-lp-hero-source-partyreel.vercel.app` was NOT
  waited on: Vercel is capped for the day, so the board was verified on this worktree's own
  production build (`pnpm build && pnpm start` on :3213) and on its dev server (:3214), in a
  FOREGROUND Browser-pane tab at 1440 and at 375, with every number taken off the DOM rather than
  off a screenshot.
- **What the review pass changed** (five should-fix findings, no blocker; the concept's design is
  unchanged, and only one string a person reads moved):
  1. **The dock.** Will's note (a) was not satisfied on this board, and the ask had been filed rather
     than met. The Orchestrator had landed it on `launch-prep` in the meantime, so this branch merged
     that and walked the docked board: see shell ask 1 below, now marked landed and verified.
  2. **A wrong sentence on the board.** `concept.assets[0]` ended with "Twelve stand-ins cap the
     corridor at six frames a side; 24 doubles the cadence with no other change." That is false in
     both halves: the pool is `ceil(FLIGHT_MS / launch) + 1`, 17 a side, the cadence is the constant
     `Geo.launch`, and `FRAMES.length` is read in exactly one place, the photograph offset. So the
     assets change neither number. It was replaced with what the 24 actually buy, which is what the
     file's own `Geo.launch` comment already said: no photograph on screen twice.
  3. **The asks are now quoted, not paraphrased.** The three asset lines below are `concept.assets`
     itself, diffed against the branch head with whitespace normalised. They previously diverged
     enough that quoting the manifest would have quoted text Will never sees.
  4. **The inflow.** Round four's goal item 3 asked for a Handoff statement of what the sibling can
     reuse, and the Handoff had none. It is now its own bullet below.
  5. **The scan.** Goal item 2 was answered only as a lane statement. The design fact, that round
     four moved every shared corridor constant and the scan did not, is now a bullet with the delta.
  Also fixed while in there: the file's cadence comment said 1.47 canvas widths of photograph and its
  header said 1.33, for the same quantity. Both are now one measured number on one stated definition.
- Synced with launch-prep TWICE: at `6484558` (two doc commits this track does not own) and then at
  `07ad3b2`, the Orchestrator's shell round, which is what landed this board's dock (shell ask 1
  below). Both merged clean, no conflicts. The second sync is why the board Will opens carries its
  switches on screen.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing
  ones on `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`), test ok (1804 in
  199 files), build ok (248 static pages, unchanged from launch-prep), re-run on the final tree.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-source.md`,
  `src/app/(dev)/design/sandbox/home-hero/source.css`,
  `src/app/(dev)/design/sandbox/home-hero/source.tsx`. **No exceptions.** `shared.tsx`, `board.tsx`,
  `scan.tsx`, `inflow.tsx`, `../album-hero/burst.tsx` and the shell were read and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **What the inflow can take** (round four's goal item 3, the half addressed to the sibling track).
  The long version is the file header of `source.tsx`, the block titled "WHAT THE INFLOW CAN TAKE";
  this is the short one, because `hero-inflow` reads `docs/tracks/`, not this branch's unmerged file.
  - **The direction is ONE constant.** `FLOW: 1 | -1` near the top of the file, read in exactly one
    place: `phaseOf(raw) = FLOW === 1 ? raw : 1 - raw`. Set it to -1 and the whole corridor runs
    inward with nothing else changed. A frame enters large at the canvas edge, shrinks as it travels
    in, and the ramp that fades a frame UP at the code fades it DOWN there instead, because opacity
    is a function of the phase and an inward phase ends at zero. Nothing else in the file knows
    which direction it is.
  - **Liftable whole, all of it direction-agnostic:** the three depth lanes (`LANES`, one multiplier
    scaling a frame's size, travel, vertical drift and turn together, so a far frame is small AND
    slow AND near the axis); the aspect mix (`ASPECTS`, half 4:5, a quarter square, a quarter 4:3,
    all centre-cropped from the same squares, so it asks for no new asset); the funnel
    (`Geo.spread`, the drift multiplied by how far out the frame already is, which is what makes the
    two arms a cone with the object at the apex); `fitOf`, which sizes each DOM box to that card's
    own largest on-canvas moment so no frame is ever rasterized above 1:1 where a person can see it,
    and returns the progress past which the loop can stop writing to it; `reachOf` plus `build`'s
    `lock`, which solve the lane the type sits in off the running corridor instead of choosing it;
    the rest state written as per-card custom properties; and `NOSCRIPT_RULE`.
  - **The two things an inflow should reconsider rather than inherit:** the reveal (a branch-out is
    an outward idea, so an inflow's first beat probably wants the corridor already arriving) and the
    paint order (near-over-far still holds, but an inflow's nearest frames are the ones at the
    edges, so the corridor converges on the plate rather than opening out of it).
  - Timing, said plainly rather than implied: `hero-inflow` handed its round one off at `dfc6f09`
    built on round three's source, so it carries 24 cards on one plane, `launch: 900` and
    `SCALE_GAIN 2.81`, and has seen none of this. So this bullet is for the Orchestrator at
    integration and for the inflow's next round, not a live handoff.
- **The scan, its sibling** (round four's goal item 2, as a design fact and not only a lane
  statement). `scan.tsx` is in this track's `reads:` and was not touched. But round four moved every
  constant the two concepts shared, so unless the scan moves with it, concepts 1 and 2 will no longer
  read as the same corridor on one page, which is the comparison the item exists to protect. Checked
  rather than assumed: `origin/lp/hero-scan` handed off round four at `0872b4c` and its constants
  block is unchanged, so the divergence is real. Its header still opens "The corridor's constants
  (the source's numbers, kept exactly)", which is no longer true. What moved:

  | the shared constant | round 3, which the scan still carries | round 4, the source now |
  | --- | --- | --- |
  | cards | 24 on one plane | 34 desktop, 28 phone, across 3 depth lanes |
  | pool per side | 12 (`CARDS / 2`) | `ceil(FLIGHT_MS / launch) + 1` = 17 desktop, 14 phone |
  | cadence | `LAUNCH_MS` 900, both canvases | `Geo.launch` 620 desktop, 780 phone |
  | flight, reveal | 9600, 1750 | unchanged |
  | the two curves | `travelAt`, `scaleAt` | unchanged, exactly |
  | opacity ramp | `smoothstep(0, 0.24, p)` | `smoothstep(0, 0.16, p)` |
  | scale gain | `SCALE_GAIN` 2.81, one hand-tuned number | `gain` 2.6 over a per-card `fitOf` divisor |
  | card box | 330 desktop, 140 phone, always square | 300, 155, times the lane, times the aspect |
  | travel | 1.65 canvases, both | 1.72 desktop, 2.05 phone, times the lane |
  | rotate | 9.5, 8.5 | 8.5, 7.5, times `(0.62 + 0.55 * depth)` |
  | perspective | 900, 360 | 1100, 420 |
  | vertical drift | 44, 12 | 54, 24, times the lane, times the funnel |
  | the h1's measure | 1100 | 920, and both lockup offsets are solved, not chosen |

  The call is the Orchestrator's or Will's and not this track's, so it is put rather than taken: the
  honest reading is that the cheapest way back to one corridor is the scan lifting round four's
  wholesale, which is mechanical (the lanes, the aspects, the funnel, the cadence, the fit solver)
  and leaves the scan's own cause, the phone and the release, untouched. Moving the source back
  instead costs the density Will's own board note asked about. If neither happens before the ruling,
  the scan's header should at least stop saying the numbers are kept exactly.
- **Shell changes asked for** (the Orchestrator lands them):
  1. **LANDED, and verified here.** The ask was that `sandbox/home-hero/board.tsx` stop carrying its
     page-wide switches (Desktop / Phone 375, Ruled copy / Proposed copy, Replay) in a static bar at
     the top of a page of THREE full-viewport stages, which is where Will's note (a) bites hardest:
     comparing the source against the scan at 375 meant scrolling back past a 930 px stage for every
     flip. The Orchestrator landed it at `07ad3b2` and this branch merged that at `f12841b`, so the
     walk below was done on the docked board: the three switches sit in `BoardDock`, fixed on screen,
     at both canvases. Nothing in this track's two files changed for it. Note for the Orchestrator:
     this branch now carries `07ad3b2`, so a merge of `lp/hero-source` brings no shell change of its
     own, only the sync.
  2. **Still open.** A stage whose Tailwind breakpoints read the CANVAS rather than the browser window. This is the
     one thing blocking note (c), "more real UI", on a hero board: the concept already renders the
     real `Button`, the real `Caption`, the real server-rendered `FooterQr` and real `next/image`,
     but the site header cannot go in the stage, because `sm:`/`md:` inside a 375 stage fire off the
     1440 window and the phone stage would show the desktop header. The hero is the one surface the
     header actually sits on (it is a transparent 4rem overlay), and round four had to solve the
     headline's ceiling against a header it could not draw. A container-query shim on `Stage` would
     let every board show real chrome.
- **Assets requested from Will.** The three lines below are `concept.assets` quoted, which is
  exactly what the board's Asks row renders under the stage, so the manifest and the board say the
  same words and the Orchestrator can quote either. Only this file's line wrapping differs; the text
  was diffed against the branch head with whitespace normalised and matches character for character.
  1. "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, across weddings,
     birthdays, corporate and festivals. They replace the 12 landscape stand-ins the corridor cycles
     (FRAMES in shared.tsx); the left arm takes the first 12 and the right arm the last 12. They do
     not change the corridor: the cadence, the pool and the sizes are constants of the composition,
     so the 24 buy exactly one thing, that no photograph is ever on screen twice. With the 12
     stand-ins the two arms' windows overlap by four, so four pictures are doubled at every moment,
     on opposite arms, at very different sizes and three of the four in different crops."
  2. "Framed tight enough to read at 120 px AND to survive a centre crop to 4:5 and to 4:3: a face,
     two hands, a glass, a sparkler, a first dance. Half the corridor is portrait now, because that
     is what guests shoot. Frames are read between 117 and 370 px here, so a wide room shot is grey
     mush and a subject near an edge loses its head to the crop."
  3. "Nothing else. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN, and there
     is no plate art, no lamp and no video in this concept."

  Context for the Orchestrator, which is deliberately NOT on the board because it is bookkeeping and
  not a ruling: this is `docs/ASSETS.md` row 2, already asked. Round four refined the spec rather
  than adding a row, and the refinement is the centre-crop requirement in line 2, which costs no new
  shoot because both crops come out of the same 512 square. Line 1's last two sentences are the
  correction round four owed the board: the 24 do not change the corridor's density (the cadence
  `Geo.launch` and the pool `ceil(FLIGHT_MS / launch) + 1` are constants, and `FRAMES.length` is read
  in exactly one place, the photograph offset), so what they buy is that no picture is doubled.
- **The asks, verbatim from the board** (this board renders `ConceptMeta`, not `BoardMeta`; its
  Departures and Asks rows are the ruling surface, and the Departures row is now ONE line):
  - "THE CENTRED LOCKUP, and it is the only one left. Precedent rather than law: every other
    marketing hero goes left, and this one is centred because the code owns the axis and the
    corridor is symmetrical about it. Overrule it and the composition changes shape, because the
    type would then have to live beside the corridor rather than above and below it. Everything else
    here is inside the bible: media at 100 percent with no scrim and no darkening layer anywhere,
    the h1 in the markup at full opacity, every animation inside the reduced-motion block with the
    deployed corridor as the rest state, and cinema and unlit with no lamp. Round three's second
    departure, a reader with scripting off and motion allowed getting an empty band, is fixed rather
    than flagged: a noscript companion rule restores the deployed corridor for exactly that reader."
  - The three Asks lines are the three quoted lines in **Assets requested from Will** above, which
    are `concept.assets` itself. Quote either; they are the same text.
  - And the copy proposal, which is a ruling in one word: h1 "The whole event comes back to you.",
    subhead "Guests scan the code. Every photo and video they take lands in your album, with no app
    and no account.", secondary "See a real album", plus the new caption under the code, "Every
    photo here came from a guest who scanned it", which is the only line that is on the concept in
    BOTH copy modes.
- **What was measured, not asserted** (every number off the running DOM in a foreground tab; every
  one of them re-run after the review on a fresh `pnpm build && pnpm start` at :3213, on the docked
  board, at both canvases):
  - No photograph is ever under a word. 121 samples a canvas, ten seconds each, testing every
    visible card's rendered box against the h1's and the caption's and the sentence's true INK
    (a `Range` over the text, not the block box) and against the two real buttons: **zero
    intersections at 1440 and zero at 375**, with the closest approach of the whole run 32 px at
    1440 and 34 px at 375.
  - The dock, which is what Will's note (a) asked for: scrolled to the bottom of a page of three
    stages, `[data-board-dock]` still reports `position: sticky` at `top: 0`, 49 px tall, carrying
    Desktop / Phone 375, Ruled copy / Proposed copy and Replay beside the shell's 1:1 / Fit,
    Sidebar and Collapse. Both canvases were flipped from it without scrolling.
  - The corridor's own reach, measured on the rendered boxes with rotation and perspective in them:
    143 units from the axis at the headline's measure (the headline sits at 192), 80 at the
    caption's (the caption sits at 117), and 54 at the centre column, which is entirely behind the
    144 px plate. The model that places the type carries an 8 percent allowance over this; measured
    inflation from rotation and perspective is 2.9 percent, so the allowance covers it twice.
  - Density, re-measured after the review on ONE definition so the two rounds are comparable at all
    (the on-canvas width of every visible frame, summed, over the canvas width, sampled every 80 ms
    for ten seconds): at 1440, 14 to 18 frames on screen, median 16, in DOM boxes of 239 to 370 px,
    which is 1.08 to 1.28 canvas widths of photograph, median 1.12. Round three's model under
    exactly that definition is 10 frames and 0.9 canvas widths. At 375, 11 to 14 frames, median 12,
    in boxes of 117 to 187 px, overlapping to 1.35 to 1.63 canvas widths, median 1.48. The round-three
    comparison was recomputed offline from that round's own constants and the round-four model
    reproduced the DOM's counts exactly (14/16/18), which is what makes the pair trustworthy. The
    earlier handoff quoted 1.33 here and the file's own cadence comment quoted 1.47: two different
    unstated definitions of the same quantity, now one definition in both places.
  - The site header's ceiling: the h1's ink starts 79 px from the top of the 1440 canvas and 89 px
    from the top of the 375 canvas, both clear of the 4rem transparent overlay header.
  - The server's own HTML carries 34 `.hhs-card` nodes, 34 `--hhs-rest` transforms, 34
    `--hhs-rest-o` values and 34 `data-hhs-lane` attributes, so the deployed corridor is in the
    markup: a crawler, a cold paint and a reduced-motion reader all get the album standing still.
  - Reduced motion: simulated by deleting the `no-preference` block from the live sheet and clearing
    the loop's inline writes in the SAME synchronous task, which is exactly the cascade a
    reduced-motion reader gets. The corridor stands fully deployed, 16 frames on canvas, band half
    height 207. It is a better still than any frame of the running loop.
  - Replay: the stage remounts, every card is back at the branch-out's first frame
    (`scale(0)`, opacity 0), and the corridor re-opens.
  - No em-dash anywhere in the served page.
- **Look at first**: the first two seconds, which are unchanged in shape and better in substance:
  the QR alone, then the whole album unfolding out of it in one beat, now with depth in it. Then
  the two things a ruling turns on: whether the corridor at 1.1 canvas widths of photograph is the
  right density (round three's was 0.9 on the same measurement and Will asked the question on the
  board), and whether the
  centred lockup is right for the home hero, which is the one precedent this concept still breaks.
  And at 375, whether the corridor should stay a horizontal stream at all or become the phone's own
  shape, which is the next thing this lane would take up.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Will ruled the source's direction a second time,
so round four kept the silhouette and rebuilt everything inside it. The corridor stopped being a
plane: three depth lanes now scale a frame's size, travel, drift and turn together, paint order
follows apparent size so near frames pass over far ones, and the arms open as they go, which makes
the two rows read as one cone with the code at its apex. Half the frames became 4:5 portraits and a
quarter 4:3, cropped from the same squares, because an album is what guests shoot and not a contact
sheet. Density went from ten frames on screen at 70 to 290 px to sixteen at 241 to 373. Two numbers
stopped being chosen and started being measured: each card's DOM box is now its own largest
on-canvas moment, so no photograph is ever rasterized above 1:1 where a person can see it, and the
lane the type sits in is solved off the running corridor, so "no photograph is ever under a word" is
the condition the composition is drawn from (120 samples a canvas against the type's true ink found
zero intersections). The one departure round three flagged is gone: a noscript companion rule gives
a reader with motion allowed and scripting off the deployed corridor instead of an empty band. A
caption under the code names where the frames came from, and the geometry was tuned against the site
header's 4rem overlay, which the stage cannot draw.
