---
track: palette
status: handed-off
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

**Questions.** Six, each carried on with the recommendation.

1. **Does the `palette` ask survive the catalog?** The goal names the surviving asks as "the three calls a
   pick does not decide", which leaves it out, and the program's own rule is "asks only for what is not one
   item". *Recommendation, taken:* retire it. Pick IS the answer, the desk reads a pick, and asking twice
   was asking for one item. The twelve are still ruled card by card in their own rows.
2. **Does the accent switch need an ask of its own?** The goal says add one "only if the accent switch does
   not already answer it". *Recommendation, taken:* add it. The switch SHOWS the answer; only an ask
   RECORDS it, and the ledger is where a ruling lives. It mirrors the control, so pressing an option is the
   preview, which is the mechanism round six gave the `palette` ask. Four asks: accent, reach, card, faint.
3. **One warm comparison card or two?** *Recommendation, taken:* one. Ember, round six's own pick, marked
   kill, so the reversal is visible rather than asserted; Press, Daylight and Loft left with the warm light
   set. Today and Ladder are the other two controls, which is enough of the board spent on not-cool.
4. **Do the cool light sets tint the INK as well as the surfaces?** Will asked for Apple's greys as the
   reference for "the surfaces and the text steps", and round three's standing rule is that a surface
   carries the cast and ink does not. *Recommendation, taken:* tint the ink too, at a third of the surface
   chroma. Their own secondary label (`#3C3C43`) is tinted harder than any of their six greys. The rule was
   right for the WARM side, where a tinted black yellows; it is wrong here. Recorded as a departure.
5. **Does the accent reach `--ring`?** The accent's three jobs include the focus ring, and `--ring` is its
   own token that does not read `--brand`. *Recommendation, taken:* the paste writes `--ring` alongside
   `--brand` in all three blocks, or the ruling would land two of the three jobs.
6. **Does a control card belong in a catalog ruled card by card?** *Recommendation, taken:* yes, marked
   kill. Ladder on A against any cool card on B answers "is the cool doing anything" in one gesture, which
   is worth a row; three of twelve is the ceiling.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. This round ships no production byte, and `docs/specs/palette.md` (owned) carries the proposal.

## Deferred (ROADMAP one-liners, bucket named)

- none. The two follow-ups a ruling implies (`theme.css` owes `--color-faint`, and the 35 `bg-muted/N`
  sites become `.surface-mat` sections) belong to the wiring round and are printed on the board's paste.

## Handoff (replaces the chat report)

- Head: the tip of `origin/lp/palette`, which is this commit; pushed. Synced with `launch-prep` at `5fc768b0` (it had moved six commits: the desk's
  "Copy so far", Will's first review batch, and his mid-sitting ruling that the lab winds down into the
  Library). No file either side touches overlaps.
- Gates on the synced tree: typecheck ok, lint ok (0 errors, the 7 standing warnings), test ok (2,125 in
  226 files), build ok (257 pages). `pnpm lab:smoke` green for this board: **2,924 words against a declared
  2,950** (round six weighed 3,817 with no declaration). The five boards still over the budget are the ones
  STATUS already names, untouched here.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/palette.md` plus the nine
  files in `src/app/(dev)/design/sandbox/palette/`, and this manifest. No exceptions.
- **The twelve, and the accent each declares.** Nine cool, three controls. Format: `id: verdict, declares`.
  - `today: kill` (Blue 252) the site as it ships, the one to come back to.
  - `ladder: kill` (Flare 330) the same rhythm at chroma zero: the control for whether the cool is doing
    anything. Put it on A and any cool card on B.
  - `ember: kill` (Flare 330) round six's own pick, kept as the ONE warm card so the reversal is visible.
    Read it in the app section, on the media grid, which is where the objection was.
  - `onyx: refine` (Teal 200) room 0.075, the blackest here, at half Apple's tint: the direction without
    the colour. Page 0.995.
  - `graphite: ship` (Teal 200) **the board's pick.** Room 0.105, page 0.995, Apple's cool greys between
    them at one and a half their amount.
  - `steel: refine` (Flare 330) the same answer at twice their tint: the end of the axis, and the card to
    read against a candle-lit photograph.
  - `pitch: refine` (Teal 200) a true black room at 0.030 with their own measured ladder above it, on
    their grey page. The most media-forward and the harshest.
  - `mist: refine` (Violet 300) the light side inverted: their gray6 as the page, a pure white card lifting
    0.037 off it instead of 0.007.
  - `slate: refine` (Teal 200) the one you liked, with the blue taken out: same room, moved from hue 258
    (their blue) to 286 (their grey) at a third of the chroma.
  - `reel: refine` (Violet 300) Slate's room on the paper page, declaring the hue the product is named for.
  - `studio: refine` (Violet 300) kept because you read it as cool with no chroma in it at all, which makes
    it the question the round rests on: is the coolness a hue, or a deep ground and one clean derivation?
  - `dusk: kill` (Teal 200) the smallest change: the dark side goes cool, the light side untouched. A kill
    because it takes the easy half and leaves the half the measurements say is worst.
- **The asks that survive, and why none is one item.** `accent` (should the site carry one at all: it is a
  question about the achromatic identity, not about a card, and every card answers it the same way);
  `reach` (which call sites read the token, if there is one); `card` (opacity: every palette retires the
  see-through card by accident); `faint` (whether a new custom property exists at all). The `palette` ask
  retired into Pick, per question 1.
- **The measurement to check first, because the round rests on it.** Apple's six system greys convert to
  hue **286** at an almost flat chroma of 0.0066; their blue converts to **257**. This board built its cool
  at 258 for four rounds. Every number is in `docs/specs/palette.md`.
- Assets requested from Will: no new ones. The two standing asks still stand and are now the board's own
  gap: four hard cases in the media kit's shot list (one high key, one low key, one candle-warm, one
  stage-cool) and a portrait pair for the guest masonry. Every card now carries a colourful mix of five
  photographs, but none of them is high key and none is candle-lit, which are the two cases a cast is
  weakest against.
- **Look at first:** the catalog with Onyx, Graphite and Steel side by side (one answer at half, one and a
  half and twice Apple's tint), then the Accent switch pressed once, then the app section with Ember picked,
  which is a warm ground and a colourful mix of photographs in one frame.
- Note for the next round, given the mid-sitting ruling: once a card is kept, it should go to the Library
  as a working version rather than into a round eight of this board.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven leaned the palette catalog cool and made the
accent a config, on Will's note mid-sitting. The round turned on one measurement: Apple's system greys
convert to hue 286 at a nearly flat chroma, their blue to 257, and this board had built its cool at 258 for
four rounds, which is most of why Slate read blue. Four new dark sets (Onyx, Graphite, Steel, Pitch) and
two new light ones (Pearl, Mist) were written from his sentence, very black and very white grounds carrying
the contrast with cool greys above them; Loft, Press, Daylight, Gallery and Signal left the board and Ember
stayed as the single warm comparison. Every palette now declares one accent behind a page-wide switch that
is off by default and that the paste obeys; every card lays a colourful mix of five photographs on its own
well; the `palette` ask retired into Pick; and the board came down from 3,817 words with no declaration to
2,924 against a declared 2,950. Lab only, no production byte.
