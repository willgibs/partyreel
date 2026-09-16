---
track: home-hero
status: open
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
- The items, one line each: `<id>: <the builder's verdict>`, and what the wiring round needs from each (the frames, the props, the reduced-motion rest)
- Assets requested from Will: none, or one per line
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
