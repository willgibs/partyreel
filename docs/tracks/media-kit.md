---
track: media-kit
status: handed-off
cut: "49ed0fbf"        # the stepped review round (2026-09-16): the media-kit board reshaped for it
board: media-kit
owns:
  - src/app/(dev)/design/sandbox/media-kit/
  - docs/specs/media-kit.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - public/design/media-kit/
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/media-kit

**Goal.** Reshape the media-kit catalog (round six: thirteen sources as cards with their contact sheets at the real card size, Unsplash+, iStock, Stocksy, Adobe Stock, Artgrid, Web Summit's Flickr, Flickr CC and six killed) into a stepped review Will can walk in minutes, in half a day, with NO new source and no new exploration: round seven. A kept card here is a PURCHASE, not a component, and more than one may be kept, so the board stays `keep-any` walked as a gallery (`catalog.walk: "gallery"`, the verdict rows on the cards as the radio Will asked for), every card with `lands` (what keeping it buys: the month, the frames, the credit pack) and `before` where it reads (the page's stand-in frame as today | the source's frame). Then the four asks become steps on ONE specimen each with every option drawn where a picture exists: `crowds` (every face or only the subject: two tiles, Web Summit's frame beside Unsplash+'s on the same blog card, which is the compare round six built), `rule` (means-only: the six facts as the bar, yes or no), `spend` ($56 now or hold: means-only, with the two cards it sums named), `shoot` (shoot or park: means-only). Every ask carries `lands`; a control that serves one decision stays declared but leaves the `strip` (Canvas and Kind of event may stay on it). Delete context that only restates what the tiles show, fold or delete the argument, and re-measure the reading budget (1,298 on the stepped tree against a declared 2,750; delete the declaration if the board comes in under 1,200). The two standing asset asks (the 36 masters, the $56 bridge) stay as they are logged; do not re-ask them.

**The kit you build on.** The step surface is landed: `docs/PROGRAM.md` and `/design/lab/kit` describe it, and `src/components/lab/board-spec.ts` carries the fields (`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk / stage`) with `registry.test.ts`'s rules on them (a winner ask mirrors the pick control and may offer its cleared default as `none`; an option's `state` must name a declared control, so a control that serves one decision stays declared but off the `strip`; `look` is optional once every option is drawn). Read the light board (`sandbox/light/`) as the worked example of a keep-any board on the flow (its cards walk one at a time; yours walk as a gallery) before you touch your own.

**Binds.** The bible, the contracts of every component under a path you own, and the policies (`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and 2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3128` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion honoured: the walk from the desk end to end (Start the review on `/design/lab?key=`, every step's context alone on the screen, every option visible at once on one specimen, a chosen card worn by the stage, "None of these" clearing it), a composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base http://localhost:3128` green for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on :3128 only, killed by port; one process at a time, stopped before a build, a test run and the handoff; never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. Three other agents run beside you in their own worktrees (`floating-surfaces` on :3125, `rounding` on :3126, `brand-voice` on :3127); merge `origin/launch-prep` before your handoff if it moved, never rebase.

**Questions.** Answered with the recommendation and carried on with.

1. **Does a keep-any gallery need a "None of these" exit?** No, and it cannot have one: `none` is the
   winner ask's option, and a keep-any catalog has no winner ask. The equivalent exit here is thirteen
   kills, which is a real answer the grammar already carries. Recommended and taken.
2. **Should any of the four calls be staged behind another?** No. `after` hides a question until another
   is decided, which is right only when the second is meaningless on its own; the crowds call is a risk
   judgement that stands whatever the filing rule says, and the shoot stands whether or not the bridge is
   bought. Staging either would have hidden a question nobody then unstages. Recommended and taken.
3. **The side-by-side section and its two compare controls: keep or delete?** Delete. The one comparison
   they were built for (a free conference floor beside a released room, at the real card size) IS the
   crowds step now, where it is the question rather than a section, and the twenty-six pills they put in
   the dock were a quarter of the board's reading. Recommended and taken.
4. **Does `lands` reach the reviewer on a gallery walk?** Only on a picked card, and that is a kit
   fact rather than a board one: `catalog.tsx` drew it for a card walked ALONE, and the palette's round
   eight (merged into this branch) widened it to a picked card. Every card here carries `lands` as the
   goal asks; a keep-any gallery could reasonably print it on all of them, which is a one-line kit change
   and belongs to a lab lane, not to a board's round. Logged rather than taken.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. The lab ships no production byte this round, no source, price or clause moved, and
  `docs/specs/media-kit.md` (owned) is still true line for line.

## Deferred (ROADMAP one-liners, bucket named)

- Now → The lab and the kit: `catalog.tsx` prints a card's `lands` only when the card is walked alone or
  picked, so a KEEP-ANY gallery (where every card is its own proposal and none is picked) never shows
  what keeping one lands as; widen the guard, or give the gallery walk the same line the solo walk has.
- Now → The lab and the kit: a step's option tiles always draw inside a 1440 canvas (`FitStage
  mode="desktop"` in `step.tsx`), so a specimen narrower than the canvas lands as a thumbnail with an
  acre of empty ground beside it; this board filled the canvas with the blog's real three-card row, but
  the tile could take the canvas width its board declares.

## Handoff (replaces the chat report)

- Work head `aeb3e2c7`, merged with `origin/launch-prep` at `092ab4b8` into `839bcd3f` (never rebased);
  this manifest commit rides on top of that. `launch-prep` had moved twice: `floating-surfaces` and
  `rounding` landed, and with them a kit change this board wanted, `catalog.tsx` printing `lands` on a
  PICKED card and not only on a solo one. Every card here carries `lands`, so picking one in the gallery
  now says what the purchase buys.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 9 warnings are pre-existing and none in
  this lane), test ok (2,164 in 228 files), build ok (258 pages); `pnpm lab:smoke --base
  http://localhost:3128` green, 0 route failures, **1,077 reading words against the 1,200 budget** (1,298
  against a declared 2,750 before), so the `reading` declaration is DELETED. Only `glow-doctrine` and
  `glow-moments` still fail the budget, exactly as they did before this branch.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned board directory (`spec.ts`,
  `board.tsx`, `preview.tsx`, `board.css`, `catalog.test.ts`) plus this file. `docs/specs/media-kit.md`
  is owned and untouched: no source, price or clause moved this round. No exceptions.
- The steps, one line each:
  - the catalog: thirteen cards in ONE gallery (`keep-any`, `walk: "gallery"`), each ruled where it
    stands, because a kept card is a purchase and the board's own answer keeps two of them.
  - `rule`: decides six provenance fields on every entry in `marketing-media.ts` and a bar on a face with
    no signed permission; means-only, two tiles; after the cards; stage `entry`, one real still with the
    unverified line it carries beside six real facts; strip Canvas.
  - `crowds`: decides whether 87,066 free conference photographs are a source or a footnote, and six of
    the thirteen cards with them; TILES, both answers drawn on the blog's own three-card row at 1440 (the
    free archive's floor, the released catalogue's room); mirrors `faces`; strip Canvas.
  - `spend`: decides whether $56 of released photographs goes on all 24 marketing pages this week;
    means-only; stage `bill`, the two lines that sum to it, each in the card it lands in; strip Canvas,
    Kind of event; lands on Weddings whatever the crowds step left behind.
  - `shoot`: decides whether one night we host produces the 36 masters and closes nine rows of ASSETS.md;
    means-only; stage `pages`, the real routes at true pixels wearing the pick; strip Canvas.
- The cards, one line each (`lands` is what keeping it BUYS, in money, because a kept card here is a
  purchase rather than a token):
  - `unsplash-plus`: lands as one $20 month, licensed for ever, every still but the conference rooms.
    (The board's pick.)
  - `istock`: lands as 3 frames at $12 from a credit pack: the conference rooms nothing else covers.
  - `stocksy`: lands as $35 a frame for the one or two that carry a page; the 36 would be $1,260.
  - `adobe-stock`: lands as a $49.99 pack of five credits, expiring after a year.
  - `artgrid`: lands as $299 a year for the film: the 8 vertical clips, kept after cancellation.
  - `websummit-flickr`: lands as 87,066 free conference frames for a credit line under each.
  - `flickr-cc`: lands as the four kinds Web Summit cannot fill, free, on the same call.
  - `envato-elements`: lands as a $198 lease; every file comes off the site when it stops.
  - `nappy`: lands as the one thing the free corpus is worst at, and still no signed face.
  - `mixkit`: lands as free clips the library may withdraw from under a published page.
  - `coverr`: lands as an irrevocable grant over a grid that is two catalogues.
  - `death-to-stock`: lands as $199 a year, rented; the pictures come off our site when we stop paying.
  - `creative-market`: lands as $40 for 45 to 70 wedding frames, on a tier that forbids an advert.
- Assets requested from Will: none new. The two standing asks are restated on the board and now carry
  their row, so neither can be logged twice: the bridge ($20 of Unsplash+ plus 3 iStock frames, ASSETS.md
  row 13) and the kit (36 masters, row 7); the 8 clips are row 4.
- Look at first: **the crowds step.** Both answers are drawn on the blog's own three-card row at 1440, a
  conference floor nobody in signed beside a room that did, which is the one question on this board a
  picture can settle. Then the gallery, where six of the thirteen draw a card-shaped hole beside the frame
  the site is wearing today, and Web Summit draws the reverse: the site has NO conference frame at all.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven reshaped round six's catalog for the
stepped review without proposing a place, a price or an argument: the thirteen stay a keep-any catalog
walked as a GALLERY, because a kept card is a purchase and the board's own answer keeps two of them, so
there is no winner to pick and no "None of these". Every card is now drawn against the frame it would
replace, in one scrolling row at the real card size, and says what keeping it BUYS in money; two columns
rather than three, because at three the second half of every pair sat behind a scroll. The four calls
became four steps with a specimen each: the rule drawn as one still's unverified line beside six real
provenance facts, the crowds call as both answers on the blog's own three-card row, the spend as the two
lines that sum to $56, the shoot on the real pages. The side-by-side section and its twenty-six compare
pills left with the fourth fact on every card, and the board came in at 1,077 reading words against the
1,200 budget, so its `reading` declaration was deleted rather than re-tuned.
