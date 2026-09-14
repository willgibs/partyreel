---
track: hero-source
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "<filled at boot>"  # the launch-prep SHA the branch was cut from
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

- none expected: no production byte moves.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-hero-source-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: (the exact list: what, size, grade, count, and the stand-in each replaces by id)
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
