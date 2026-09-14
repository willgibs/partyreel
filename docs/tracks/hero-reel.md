---
track: hero-reel
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "f28d521"        # the launch-prep SHA the branch was cut from (round two board shell)
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-reel
owns:
  - src/app/(dev)/design/sandbox/home-hero/reel.tsx
  - src/app/(dev)/design/sandbox/home-hero/reel.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-reel

**Goal.** The reel, concept of the home-hero board's second round (Will, 2026-09-14: round one's four
grids were "very bland and generic", not "the one QR/link -> full event album concept"; everything is
open, the hero's UI, its copy, the eyebrow, and the design system around it under rising tides).
An encapsulated hero. A rounded container inset to the page column (`Container`'s rhythm: 112 px at 1440, 16 px at 375; full-bleed and square-cornered on the phone canvas), sized by the canvas height, filled with a fast-cut highlight reel of real party moments, muted, looping, on the house video pattern (no `autoplay` attribute, imperative `play().catch`, the poster as a separate next/image beneath, cross-faded on `onPlaying`; the stand-in is the landscape manifest reel via `reelById(REELS.landscape)`). The display type set large over it (the ladder's `xl` step resolved per canvas from LADDER), the subhead and two pill CTAs beneath the type. Bottom-left, a pinned card in the announcement idiom carries the live demo QR at 96 px (`DemoQr`) with one line, absolute inside the hero and fixed from lg so it stays with the visitor down the page. No scrim by default: the footage is graded dark (an asset request). When the board's `scrim` prop is true, render one radial scrim on the TEXT layer only (an ellipse about 70 by 58 percent, 0.58 to 0 alpha), sized to the type block, never over the whole video, so Will rules it against bible 1. Reduced motion: the poster, still. Flag on the board as departures: the container's radius (the house surface is 2 px; argue the one corner you take), any uppercase display register you propose, and the scrim toggle itself.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema skin, `data-mkt` and `data-paused` on a hidden tab. Your `Concept` also carries
what the board lists beside the stage: `eyebrow` (yours: an announcement pill with a live dot: Live demo, scan to try), `proposed` copy (the stub's lines are
a starting point; improve them, they are proposals), `departures` (flag: the container radius; an uppercase display register if proposed; the type scrim toggle) and `assets` (name
exactly what replaces your stand-ins: a 15 to 20 s highlight reel, fast cuts of real-feeling event moments (a toast, confetti, the dance floor, sparklers, a cake, hands in the air), 1920 x 1080 plus a 1080 x 1920 crop, muted, graded dark and warm so white type needs no scrim, H.264 mp4 under 1.5 MB plus a VP9 webm and a poster frame). Replace the stub's `Placeholder` render; keep the export
name and the id. Keyframes live in your own sheet with your prefix. You own two files and nothing
else; if the shell lacks something you need, say so in Handoff rather than editing it.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's), above all 1 (media is the
color: no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy`
scans the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (the
thesis renders verbatim under the ruled toggle; your proposal renders under the proposed toggle), and
the standing ruling that the hero is cinema and unlit (light only as a flagged departure). The media
manifest is the only source of paths. Take the big swing: a totally different, better hero beats a
safe increment, and the reference's mechanic is a starting point, not a ceiling.

**Verify on.** partyreel-git-lp-hero-reel-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy,
Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM. Light QA by the
exploration-round principle: nothing more.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none expected: no production byte moves.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-hero-reel-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: (the exact list: what, size, grade, count, and the stand-in each replaces by id)
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
