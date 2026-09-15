---
track: hero-inflow
status: open
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (round 1)

- Head <sha>, pushed; preview partyreel-git-lp-hero-inflow-partyreel.vercel.app (may not build while Vercel is capped: say how the board was verified locally)
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Shell changes asked for (the Orchestrator lands them): none, or one bullet each
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
