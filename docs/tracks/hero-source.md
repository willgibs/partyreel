---
track: hero-source
status: integrated
cut: "f28d52165ef799cfc84c81dec8e18d3ccb6e09ab"  # the launch-prep SHA the branch was cut from
merged: "0298c21"      # the branch head merged into launch-prep
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-source
owns:
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-source

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

- Testing and verification: record the two live-motion blind spots this round hit, in
  `docs/systems/testing-verification.md`. An occluded real-Chrome window suspends
  requestAnimationFrame completely (measured: 0 frames in 2.9 s), so a JS-driven loop photographs
  as an empty stage there; the Browser pane keeps ticking rAF while hidden but its screenshots go
  stale and desync from the page's own scroll. The way through, and the reason a loop should be a
  pure function of elapsed time, is to freeze the loop at a chosen elapsed and shoot the still.
- Home hero (the wiring round, if the source is ruled): production wires the loop to
  `useAmbientPause` rather than to the stage's `data-paused`, and the pre-burst frame wants a
  `<noscript>` companion rule so a reader with JavaScript off and motion allowed still gets the
  deployed corridor (the one departure flagged on the board).

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
