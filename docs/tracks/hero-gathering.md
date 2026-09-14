---
track: hero-gathering
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "<filled at boot>"  # the launch-prep SHA the branch was cut from
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-gathering
owns:
  - src/app/(dev)/design/sandbox/home-hero/gathering.tsx
  - src/app/(dev)/design/sandbox/home-hero/gathering.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-gathering

**Goal.** The gathering, concept of the home-hero board's second round (Will, 2026-09-14: round one's four
grids were "very bland and generic", not "the one QR/link -> full event album concept"; everything is
open, the hero's UI, its copy, the eyebrow, and the design system around it under rising tides).
Centred type on the cinema ground with a bespoke arrangement of photographs and short vertical clips around it: cards of unequal size and slight rotation on an irregular field, never a grid, some cards video (the portrait stand-in reel via `reelById(REELS.portrait)`, cut into 3 to 5 s ranges by `currentTime`, on the house video pattern), the whole field breathing with a slow parallax on scroll and a gentle idle sway. Above the h1, the eyebrow IS the demo QR, small and real (`DemoQr` at about 72 px) with a caption in the Caption atom; the composition argues that the album is made of many hands. The type at the ladder's `xl` step resolved per canvas from LADDER. Phone: the field collapses to two staggered columns behind the type with fewer, larger cards. Media at 100 percent, no darkening layer anywhere; the type wins by placement (air around it, cards kept off the type's box), never by a scrim. Every loop inside the reduced-motion block with the settled field as the rest state; mark loops with `data-hh-loop`.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema skin, `data-mkt` and `data-paused` on a hidden tab. Your `Concept` also carries
what the board lists beside the stage: `eyebrow` (yours: the QR, small and real, above the h1, with a caption), `proposed` copy (the stub's lines are
a starting point; improve them, they are proposals), `departures` (flag: none expected; light only as a flagged departure) and `assets` (name
exactly what replaces your stand-ins: 36 event photographs, mixed orientation, a third portrait, one grade, 1600 px long edge; and 8 vertical clips of 3 to 5 s at 1080 x 1920 with posters). Replace the stub's `Placeholder` render; keep the export
name and the id. Keyframes live in your own sheet with your prefix. You own two files and nothing
else; if the shell lacks something you need, say so in Handoff rather than editing it.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's), above all 1 (media is the
color: no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy`
scans the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (the
thesis renders verbatim under the ruled toggle; your proposal renders under the proposed toggle), and
the standing ruling that the hero is cinema and unlit (light only as a flagged departure). The media
manifest is the only source of paths. Take the big swing: a totally different, better hero beats a
safe increment, and the reference's mechanic is a starting point, not a ceiling.

**Verify on.** partyreel-git-lp-hero-gathering-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy,
Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM. Light QA by the
exploration-round principle: nothing more.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none expected: no production byte moves.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-hero-gathering-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: (the exact list: what, size, grade, count, and the stand-in each replaces by id)
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
