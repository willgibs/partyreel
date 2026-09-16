---
track: home-hero
status: handed-off
cut: "3caa491c"          # the home hero's sixth round: the stream catalog before the wiring (2026-09-16)
board: home-hero
owns:
  - src/app/(dev)/design/sandbox/home-hero/
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/album-hero/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/components/marketing/sections/home/
  - src/components/marketing/system/
  - src/app/(marketing)/marketing.css
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/home-hero.json
  - docs/reviews/README.md
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/home-hero

**Goal.** The home hero is ruled (Will, 2026-09-16, `docs/reviews/home-hero.json` round 5): the
SOURCE direction ("the album coming out of the code"), the lockup centred, the live count cut, the
headline as ruled. His note, verbatim: "The album coming out of the code definitely looks best.
However, I think we can improve this visual a lot. The random stream feels worse than a more polished
one." And his instruction on what comes next: "let's do the catalog first to pick the best design then
wire." So this round is ONE short catalog of the stream, and the last exploration this board gets: three
or four polished treatments of the album leaving the QR code, written from the ground up (bible 22), each
a card that is the real hero at true size on the ruled lockup (centred, no count, the ruled headline)
with the treatment running, its own Replay, one line and four facts (the motion's grammar, its cost in
frame time on a mid-range phone, the frames it draws on, its rest state under reduced motion); none of
them random (a composed order, a rhythm, a settle: the polish he is asking for is that the stream reads
as designed rather than shuffled); any two side by side on the real home page at 1:1; the pick worn by
the real home page frame below; no asks unless something is genuinely not one item. The scan and the
inflow leave the board (git keeps them: their files go, `spec.ts` carries the source alone as the
ruled direction with the stream treatments as its items), so the board is the source and its stream and
nothing else. The winner is wired in the round after this one (the wiring track lands it in
`cinema-hero.tsx` and its Library entry appears with a `new` badge), which is also why this catalog
must be small and finished: a treatment that ships as drawn, with its frames named for Will's asset
rows (the 34 squares and the 12 portraits already requested) and the stand-ins meanwhile.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings in
`docs/design/rulings.md`: 2026-09-15, 2026-09-16 (three sections: the catalog directive, the hero
ruling with his note on the stream, and the wind-down: "pass our favorite ideas into the library,
where they can be further branched into new explorations later but at least exist as a working
version now"). His round-four notes (`docs/reviews/_window.json`): page-wide controls in the dock,
pixel-perfect previews, real UI. The catalog shape (read `sandbox/palette/spec.ts` and `board.tsx`,
`sandbox/light/`, then `/design/lab/kit`): `const ITEMS` with `one`, `verdict`, `facts`;
`candidates: ITEMS`; `catalog: { section, control, compare }`; the pick control clearable with
`none`; every control id a lower-case data-attribute name; `round.n: 6`. The reading budget
(`LIMITS.readingWords`, 1,200 words outside every closed fold, specimen and paste; the board weighs
3,391 today): a four-card catalog with no asks should come in under it without a declaration. ★
`shared.tsx` is read across lanes (the album-hero board imports `FRAMES`): keep its exports. No
em-dashes in any copy. No mono.

**Verify on.** A local `pnpm dev` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured (every treatment's rest state designed, never a frozen mid-stream); the frame cost measured
with the kit's meter on the board; `pnpm lab:smoke --base http://localhost:<port>` green for this
board on both halves; every item's verdict reaching the desk and the composed line; `registry.test.ts`
and the board's own tests green; the four gates.

**Discipline on this machine.** Will is reviewing the other boards on his own dev server on :3000:
never touch it; your server on a port of your own (e.g. `pnpm dev -p 3112`), killed by PORT only;
one process at a time; never `[preview]` or `[ci]`; stage files explicitly; the
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. The `palette` track
runs beside you in its own directory.

**Questions.** Answered by the Orchestrator mid-round and carried on with; nothing waits on Will.

1. *Which treatment does the board recommend?* → **settle** ("3. The album lays itself out"). It is
   the only one of the four that stops, so it is the only one that reads as a composition in a
   still, which is the test a hero has to survive. The other three are all better than round five
   and none of them is that.
2. *Does the caption under the code stay, now that the count is cut?* → **yes**. It is not a
   number, and it says the one thing the picture cannot say for itself (where the frames came
   from). It sits in the column the stream leaves clear by its own physics.
3. *Four cards or three?* → **four**. The ribbon is the one that would go if it had to be three:
   the most composed of them and the least like an album, which is exactly why it is worth a
   verdict rather than a cut.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- The work is `bf1ee166`; this manifest is the commit on top of it and the branch tip. Synced: `origin/launch-prep`
  had moved to `551ecab5` (the palette's seventh round, the stepped review's spec fields, the
  track docs); merged, no conflicts, and the gates below are on the merged tree.
- Gates: typecheck ok, lint ok (0 errors, 8 pre-existing warnings), test ok (2145), build ok (258
  pages). `pnpm lab:smoke --base http://localhost:3112`: every route green, and this board reads
  **1189 of its 1200 words** with no declaration (it was 3391 at round five).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: seventeen paths, all inside
  `src/app/(dev)/design/sandbox/home-hero/`, plus this manifest. No exceptions.
- **The items.** Every per-card value in all four is a step in a declared table; the integer hash
  round five dealt from is gone. One engine (`streams.ts`), four tables; the wiring round keeps
  the engine and deletes the three that lost.
  - `mirror` — **ship**. One pair a beat, the two arms exact mirrors on five stations in order.
    18 frames lit of 28 nodes at 1440. The wiring needs `MIRROR_STATIONS`, `MIRROR_LANES`,
    `MIRROR_ROLL`, its beat and its flight; rest is the symmetric fan.
  - `phrase` — **ship**. Three frames 170 ms apart stepping far, middle, near, then an empty bar,
    the arms answering. 12 of 24. Needs `PHRASE_IN`, `PHRASE_BAR`, `PHRASE_FAN`, `PHRASE_LANES`
    and its short flight (6000 ms: the flight is what makes a phrase visible); rest is one phrase
    mid-flight.
  - `settle` — **ship**, and the board's answer. Out, a held arrangement of four places a side at
    1440 and three at 375, then gone as the next arrives. 15 of 22. Needs `SETTLE_PLACES` per
    canvas, `SETTLE_BEAT`, `SETTLE_ARRIVE`, `SETTLE_GO` and its own late scale curve; rest is the
    places occupied. A place is never double booked and `streams.test.ts` holds that.
  - `ribbon` — **refine**. One file a side up an arc, the angle fanning with the distance
    (`rollAt` by phase, `riseFlat`). 14 of 28. Needs `RIBBON_FAN` and the arc that completes by
    the canvas edge; rest is the full file.
  - All four: the hero composition itself is `hero.tsx` and it is already the shippable shape (the
    ruled lockup centred, no count, the real demo QR still at the exact centre, the type placed
    outside the stream's measured reach, the noscript rule intact). `cinema-hero.tsx` takes it
    whole, swapping the lab's `data-paused` for `useAmbientPause`.
- **Assets requested from Will:** nothing new. ASSETS row 2 (34 squares) stands and now covers all
  four with nothing doubled (14 a side is the largest pool). The settle card asks for ASSETS row
  12 (12 portraits), already logged: a held frame reads at up to 332 px tall, where a 512 square
  cropped to 4:5 is upscaled.
- **Look at first:** the four at 1440 with nothing picked, then `settle` alone, then the pick worn
  by the real home page at the foot of the board. The board's walk runs that order.
- **For the Orchestrator, three lines outside my lane.**
  1. `src/app/(dev)/design/sandbox/media-kit/shoot.ts:565` names `sandbox/home-hero/scan.tsx` in
     an asset row's `replaces`; that file is gone with the ruling.
  2. The board's header still reads "Ruled: open (round two ruled 2026-09-14 ... the inflow
     joins)", from `_data/touchpoints.ts`. Two rounds stale.
  3. The catalog is left on the default `keep-any`, deliberately: `mode: "pick-one"` requires a
     `winner` ask (`registry.test.ts`), and the brief was to add none. Turning it on is three
     lines, all the Orchestrator's: `mode`, `winner`, and one ask mirroring the `stream` control
     whose options are the four cards plus `none`. `candidate.lands` is left unwritten for the
     same reason: nothing renders it yet, and four more lines would spend the eleven words of
     reading budget this board has left.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The home hero's sixth round answered Will's one
note on the fifth ("the random stream feels worse than a more polished one") with a catalog of four
compositions of the ruled picture, and retired the two directions he did not pick. Every seeded
value became a step in a declared cycle, the spacing was evened so the stream reads as a procession
rather than a clump at the code, scale and opacity moved onto the distance crossed so depth stops
inverting, and the type's clear lane is now measured at the headline's real ink rather than its box.
A scene route put each treatment on the real home page at 1:1, `streams.test.ts` pinned what a
composition has to be true of, and the board came down from 3391 reading words to 1189.
