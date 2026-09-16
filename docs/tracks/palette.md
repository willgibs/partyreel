---
track: palette
status: open
cut: "733f6690"          # the palette's seventh round, cut during Will's sitting (2026-09-16)
board: palette
owns:
  - src/app/(dev)/design/sandbox/palette/
  - docs/specs/palette.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/floating-surfaces/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/palette

**Goal.** Round seven of the palette, asked for by Will a few questions into his first sitting on the
catalog (2026-09-16), BEFORE he rules on its cards: rework the catalog toward cool greys and give every
palette one optional accent. His words, verbatim: "We will likely not use an accent color to stick with
our achromatic direction, but I would like to add a single optional accent color config per theme
where I can decide if an accent color would pair well. I'm a much bigger fan of the cooler gray
direction in slate, studio, and reel - think they feel more modern, clean, and combat less harshly
with a very media-forward dashboard. Looks beautiful with the very black/white backgrounds for solid
contrast then cooler surfaces rather than darker bland grays. Many of the warmer tones feel like they'd
clash with a colorful mix of photos. Slate could even be less blue, but I'd like more 'cool' gray
options. Apple has a beautiful palette, but we wouldn't use that blue they use." So: (1) the catalog
leans cool: keep Slate (less blue), Studio and Reel, and write several NEW cool-grey palettes from the
ground up at different degrees of coolness (a barely-cool neutral, a cool-steel, a cool-graphite, a
cool-pearl light), every one built the way he describes: very black and very white grounds for
contrast, then cooler surfaces (cards, panels, the media well) rather than darker bland greys; Apple's
system greys are the reference for the surfaces and the text steps (never their blue); every card
judged against a colourful mix of photographs (the dashboard's media grid, the album), because that
is what the warm tones fail; the warm palettes (Ember, Loft, Dusk, and any other that reads warm) lose
their place on the board or stay as one or two comparison cards the builder marks kill, so the catalog
is a dozen or so cards again, most of them cool; (2) ONE OPTIONAL ACCENT PER PALETTE, as a config: each
palette declares the one accent that would pair with it (a hue chosen for that grey, at the accent's
only jobs: the primary action, the focus ring, the live dot) and the board carries a page-wide switch
"Accent: none | the palette's own", default none, so he can flip it on any card and on the real pages
and decide whether an accent pairs at all; the paste carries the accent only when it is on; (3) the
asks that survive are the three calls a pick does not decide (today's), plus one new one only if the
accent switch does not already answer it. The catalog's shape, the real pages, the wipes and the paste
stay what round six built; no value in `registers.ts` moves without the card that shows it.

**Binds.** The bible (bible 1 is under exploration here; the achromatic identity stays the default),
the contracts of every component under a path you own, and the policies; everything else is precedent
(`docs/design/README.md#what-binds-you`). Will's rulings in `docs/design/rulings.md` (2026-09-15,
2026-09-16). His round-four notes (`docs/reviews/_window.json`): page-wide controls in the dock,
pixel-perfect previews, more real UI. The catalog shape every board takes now (read
`sandbox/palette/spec.ts` and `board.tsx` as they stand, then `sandbox/light/` and
`sandbox/floating-surfaces/` for two Round 4 catalogs, then `/design/lab/kit`): `const ITEMS` with
`one`, `verdict`, `facts`; `candidates: ITEMS`; `catalog: { section, control, compare }`; the pick
control clearable with `none`; every control id a lower-case data-attribute name; asks only for what
is not one item. The round is `round.n: 7` in the spec (his verdicts key on it). The reading budget
(`LIMITS.readingWords`; the palette weighs 3,817 today with no declaration): come in under it, or
declare `reading: { words, why }` with the arithmetic like the Round 4 boards did (2,400 to 2,950).
No em-dashes in any copy. No mono.

**Verify on.** A local `pnpm dev` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured: every card on a colourful media grid and on the album; the accent switch flipping every card
and the real pages; `pnpm lab:smoke --base http://localhost:<port>` green for this board on both
halves; every item's verdict reaching the desk and the composed line; `registry.test.ts`,
`registers.test.ts` and `lab-review.test.ts` green; the four gates.

**Discipline on this machine.** Will is reviewing the OTHER boards on his own dev server on :3000
while you build: never touch it; your server on a port of your own (e.g. `pnpm dev -p 3111`), killed
by PORT only; one process at a time; never `[preview]` or `[ci]`; stage files explicitly; the
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit.

**Questions.** What the goal leaves open goes here, numbered, with your recommended answer; carry on
with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` green for this board, its reading words
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>`, and which accent each palette declares
- The asks that survive, one line each, and why each is not one item
- Assets requested from Will: none, or one per line
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
