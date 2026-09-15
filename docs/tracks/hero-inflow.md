---
track: hero-inflow
status: handed-off
cut: "c473707"       # the origin/launch-prep SHA this branch was cut from
preview: true           # Will reviews this board on its preview as it builds (once Vercel's window frees)
owns:
  - src/app/(dev)/design/sandbox/home-hero/inflow.tsx
  - src/app/(dev)/design/sandbox/home-hero/inflow.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.css
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.css
  - src/app/(dev)/design/sandbox/home-hero/scan.tsx
  - src/components/dev/board/stage.tsx
  - src/components/dev/board/dock.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - docs/ASSETS.md
  - docs/tracks/hero-source.md
---

# lp/hero-inflow

## Round 1 (Will's ruling, 2026-09-15: a new variation off the source)

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

**Will's ruling, verbatim.** "Let's create a new variation off of 1 that has the images streaming into the
QR rather than away. This may be more conceptually sound (guest images go into QR) but may not present as
well visually, in which case we'll keep in 1's direction (images out of QR, which is fine conceptually from
host perspective of getting them through the QR)."

**Goal.** The inflow: variation 3 of the home hero board, off the source. Guests' photographs stream INTO
the code: frames are born at the edges of the viewport (or out of the dark beyond them) and travel inward,
shrinking and gathering, until they enter the code and vanish, forever; the code is the destination and the
album is the flow. Start from the source's mechanics (`source.tsx`, read-only; the `hero-source` track is
iterating it in parallel and will say in its Handoff what you can reuse): the perspective corridors, the
rAF loop writing transforms from a progress ref, the pause on `data-paused`, the reduced-motion rest state.
Then judge the inflow from the ground up: what does a stranger read in the first two seconds (the fear is
"the images are being sucked away"; the hope is "everything from the room goes into this code"), what makes
the direction unmistakable (the frames' scale and blur as they approach, a bloom at the code as each
arrives, the code's plate pulsing with the count, the copy naming the act: "Everything they shoot lands
here"), and where the type sits so no frame ever crosses a word. Both canvases as their own compositions;
reduced motion; JavaScript off. Then the honest verdict, on the board and in the Handoff: does the inflow
present as well as the source? If it does not, say why in one paragraph, show the best version you reached,
and recommend the source's direction; Will said that is a fine outcome. The stub `inflow.tsx` renders a
placeholder; replace it. The contract: your file exports one `Concept` (see `shared.tsx`, the whole
doctrine; the board renders `concept.render(props)` inside a 1:1 stage on the cinema skin with `data-paused`
on a hidden tab); keyframes and classes under the `hhi-` prefix in `inflow.css`. The asks: the departures
Will rules on, no more.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine: read it
first and hold every line of it). The board renders `concept.render(props)` inside a stage that lays out
at a real viewport's pixels (1440 x 930 or 375 x 760, at 1:1 by default now) and carries the cinema ground,
`data-mkt` and `data-paused` on a hidden tab; the source (`source.tsx`, `source.css`) is the ruled
direction, first on the board as the reference: read it whole, reuse its mechanics where they serve, and
reverse what your axis reverses. Your `Concept` also carries what the board lists beside the stage:
`eyebrow`, `proposed` copy (proposals; all copy is open), `departures` (every departure from the bible or a
standing ruling, on the board) and `assets` (exactly what replaces your stand-ins, `what · spec · replaces
<id>`; the 24 squares are `docs/ASSETS.md` row 2). Replace the stub's placeholder render; keep the export
name `inflow` and the id. Keyframes and classes under `hhi-` in `inflow.css`. You own two files and nothing
else. A JS loop reads `data-paused` off the closest `[data-paused]` ancestor and stops under reduced
motion, where the rest state is the composition fully deployed; geometry comes from `CANVAS`; `sizes` on
`next/image` is canvas-relative; Replay is a remount.

**Rulings in force.** The bible on `/design/rules` (second edition), above all 1 (media is the color: no
darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy` scans the
lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (copy is open), 22
(rising tides), and the standing ruling that the hero is cinema and unlit (light only as a flagged
departure). The media manifest is the only source of paths (bible 18).

**Verify on.** `/design/c/home-hero?key=` on a local production build (the key is `DESIGN_PREVIEW_KEY` in
`.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy, Replay, reduced motion, the
h1 present at opacity 1 off the DOM; your preview alias once Vercel's window frees.

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

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **none.** No production byte moved and no owned fact belongs in a system doc: the inflow is a lab
  concept until Will rules on the board.

## Deferred (ROADMAP one-liners, bucket named)

- Testing and verification: record the composited-layer blind spot this round hit, in
  `docs/systems/testing-verification.md`. A card carrying `will-change: transform` is promoted to its
  own layer, and the Chrome MCP's screenshot of a BACKGROUND tab captures the layer's own background
  but not the image inside it, so a working corridor photographs as a row of empty grey boxes. The
  way through is to write any style to the node (setting `will-change: auto` is enough) and shoot the
  NEXT capture, or to scroll one tick and back. Same tab also suspends requestAnimationFrame, so a
  JS-driven loop has to be frozen at a chosen elapsed and shot as a still (the technique the
  `hero-source` track filed); the Browser pane keeps rAF running but returns black frames.
- Home hero (the wiring round, if the inflow is ever ruled onto a surface): the count under the code
  must read the demo event's real total rather than the stand-in, and production wires the loop to
  `useAmbientPause` rather than to the stage's `data-paused`.

## Handoff (round 1)

- Head `<this commit>`, pushed (the last code commit is `5458719`, plus the merge of `launch-prep`);
  preview `partyreel-git-lp-hero-inflow-partyreel.vercel.app`. **Vercel is capped, so the preview was
  not waited on and the Vercel API was not called.** Everything below was verified on a LOCAL
  PRODUCTION BUILD (`pnpm build && pnpm start` on :3111) in a FOREGROUND browser tab, at Desktop 1440
  and Phone 375, with the stages at 1:1.
- Synced with `launch-prep` at `6484558` (it had moved by two commits: the PROGRAM note on the app's
  UI and the orchestrator record). Merged, not rebased.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing ones
  on `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`), test ok (1804 in 199
  files), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-inflow.md`,
  `src/app/(dev)/design/sandbox/home-hero/inflow.css`,
  `src/app/(dev)/design/sandbox/home-hero/inflow.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx` and the shell were read and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **Shell changes asked for** (the Orchestrator lands them):
  1. **The home-hero board's page-wide switches are still at the top of the page**, not in
     `BoardDock`: Desktop / Phone 375, Ruled copy / Proposed copy and Replay all change every stage
     on the page, which is exactly global note (a). `board.tsx` is owned by the integrated `home-hero`
     track and no round-four hero track claims it, so none of us can move them. Comparing the source
     against the inflow means scrolling back past a 930 px stage for every flip.
  2. Global note (c), "more real UI", is a board-level ask for the same reason. This concept already
     renders the real `FooterQr` on the live demo token, the real `Button` and the real `Caption`;
     what it cannot do from inside one concept file is put the hero on a whole real page.
- **Assets requested from Will**: no NEW asset. The inflow asks for exactly the source's row 2, so the
  two concepts share one set:
  - `24 event photographs · 512 x 512 squares, one grade, 6 to 35 KB webp each, across weddings,
    birthdays, corporate and festivals · replaces the 12 landscape stand-ins the corridor cycles
    (FRAMES in shared.tsx, docs/ASSETS.md row 2)`
  - `Tight framing on every one of the 24 (a face, two hands, a glass, a sparkler, a first dance) ·
    legible at 120 px · replaces the wide room shots among the stand-ins`. The inflow needs this more
    than the source does: its frames never fade, so a grey room shot is on screen at full strength
    for about four seconds on its way in.
- **The asks, verbatim from BoardMeta** (the concept's `departures`, which is what the board lists
  under Departures for Will to rule on):
  1. "Bible 13, decorative layer only, and a milder trade than the source's: with JavaScript off and
     motion allowed the corridor rests one beat further out than its steady spacing, because the
     gather's first frame lives inside the reduced-motion block (an effect would paint the steady
     corridor and then jump it outward). Both states are a full corridor rather than a collapsed one,
     which the source's pre-burst frame was not. The h1, the code, the count, the subhead and the
     CTAs are plain markup and never gated, and reduced motion gets the corridor flowing at its
     steady spacing."
  2. "The splash ring carries an 18 px outer glow, which is the concept's one departure from the
     standing cinema-and-unlit ruling. Measured, not decorative: a hairline ring at the opacity a
     ripple wants is invisible the moment it crosses a photograph, and the plate is surrounded by
     photographs by construction. There is no inner glow, which would whiten the plate and the frames
     under it."
  3. "The count under the code is the one fabricated thing in the frame, and it is load-bearing here
     in a way it is not on the other concepts: it is what separates arriving from vanishing. At
     wiring it reads the demo event's real total and each tick is one real upload. Rule on whether a
     hero may carry a live number at all; if it may not, this concept loses its clearest signal and
     the recommendation to keep the source gets stronger."
  4. "Precedent, not law: the lockup is centred rather than left-aligned, inherited from the source
     because the code owns the axis. The first thing to overrule if the home hero should stay left."
- **What was verified, and how.** The Chrome MCP's screenshots of a background tab suspend
  requestAnimationFrame and drop composited layers, so the loop was proved two ways: in the Browser
  pane, where rAF keeps running (count 312 to 314 at 500 ms, 318 at 1 s, 320 at 2 s, 326 at 5 s, 338
  at 10 s, so the gather's rush and the settle to 2.2 landings a second are both real; one card's x
  ran -2112 to -1389 to -925 to -132 and then recycled), and in real Chrome by freezing the loop at a
  chosen elapsed and shooting the still. Also proved: the stage's `data-paused` holds the clock on a
  hidden tab (the count does not advance and does not teleport on return); Replay remounts to the
  gather's first frame with the count back at 312 and every inline transform cleared; every h1 on the
  page is at computed opacity 1 with no `data-mkt-cut`, `data-mkt-reveal` or `.mkt-line`; the server's
  own HTML carries 24 `.hhi-card` nodes with both `--hhi-rest` and `--hhi-lag`; deleting the sheet's
  one `no-preference` block (the reduced-motion simulation) leaves ten frames standing at their
  steady spacing, the ring at opacity 0 and the count at its rest level; no em-dash anywhere in the
  served page.
- **Look at first**: the first two seconds, then the plate. On load the whole room closes on the code
  once and settles. Then watch one photograph come in from the edge: it shrinks, it reaches the white
  plate, and for about a fifth of a second it is half in and half out, like a print going into a
  slot, and then the plate has it. Nothing fades. Then the answer to the question this variation was
  built for, which is on the board under the name and repeated in the Record below.

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The inflow, variation 3 of the home-hero board,
replaced its stub and answered Will's question. It runs the source's mechanics on the reversed axis:
frames are born out of the dark at the edges of the room, decelerate inward, and slide UNDER the
code's white plate, so nothing ever fades at the destination (an object hidden behind something
opaque has gone somewhere; an object that dissolves has been erased). The geometry is solved against
the plate rather than guessed, so a frame is provably inside its footprint before the safety fade
runs. Each landing pushes a ring out of the plate and ticks a count on the one lane of dark ground
the funnel leaves clear, both driven in closed form off the loop's clock so a pause or the opening
rush cannot desynchronise them. The entrance is a lag on that clock: the album plays at about 2.2x
for 1.5 s and eases to its cadence, which makes the whole room close on the code once before a word
is read, and leaves the JavaScript-off rest state a full corridor rather than a collapsed one. The
phone got its own launch cadence after the source's put five frames on 188 px of runway. The verdict
is on the board: it reads in motion and it is the truer sentence, but it needs the motion, and the
source's frames grow as they travel while the inflow's shrink to nothing at the object you want
looked at, so the recommendation is to keep the source as the home hero.
