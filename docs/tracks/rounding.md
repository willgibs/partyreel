---
track: rounding
status: handed-off
cut: "ec7367e7"        # the stepped review round (2026-09-16): the rounding board reshaped for it
board: rounding
owns:
  - src/app/(dev)/design/sandbox/rounding/
  - docs/specs/rounding.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/theme.css
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/rounding

**Goal.** Reshape the rounding catalog (round six: six families as cards at true size, A today, B square, C soft, D one family, E print, F half a step) into a stepped review Will can walk in minutes, in half a day, with NO new family and no new exploration: round seven. The board is a set of variants of one thing, so it is decided by ONE pick: `catalog.mode: "pick-one"`, a winner ask (`id: "family"`, `control: "family"`, its options the six card ids plus `none` labelled "None of these", meaning "new directions: say what in the note"; `lands`: the radius tokens in `src/app/theme.css` for the surface, the floating layer, the photograph and the gap it pins), `stage` the section that shows one real page wearing the pick, and every card's `lands` one line. Keep the A card as today and the pair for any two. Then the four asks become tile steps, each on ONE specimen with every option drawn: `actions` (one button row at today, pill and quiet; it mirrors `action`), `ladder` (the seven steps on one strip at today's and even quarters; it mirrors `ladder`), `dead-rungs` and `gap` (declare the control each needs so its options carry a `state`: the top two rungs on and off on the one surface that uses them; the album grid at the pinned gap and the literal 3px, on the worst-case bright tiles). Every ask carries `lands`; a control that serves one decision stays declared but leaves the `strip` (Page and Canvas may stay on it). Delete context that only restates what the tiles show, fold or delete the argument, and re-measure the reading budget (2,564 against a declared 2,800 today; a stepped board should need far less). The asset asked for in round six (four bright-edged tiles for the gap) is logged; use the stand-ins.

**The kit you build on.** The step surface is landed: `docs/PROGRAM.md` and `/design/lab/kit` describe it, and `src/components/lab/board-spec.ts` carries the fields (`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk / stage`) with `registry.test.ts`'s rules on them (a winner ask mirrors the pick control and may offer its cleared default as `none`; an option's `state` must name a declared control, so a control that serves one decision stays declared but off the `strip`; `look` is optional once every option is drawn). Read the palette board (`sandbox/palette/`) as the worked example of a pick-one board on the flow before you touch your own.

**Binds.** The bible, the contracts of every component under a path you own, and the policies (`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and 2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3126` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion honoured: the walk from the desk end to end (Start the review on `/design/lab?key=`, every step's context alone on the screen, every option visible at once on one specimen, a chosen card worn by the stage, "None of these" clearing it), a composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base http://localhost:3126` green for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on :3126 only, killed by port; one process at a time, stopped before a build, a test run and the handoff; never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. Three other agents run beside you in their own worktrees (`light` on :3122, `palette` on :3123, `floating-surfaces` on :3125); merge `origin/launch-prep` before your handoff if it moved, never rebase.

**Questions.** What the goal leaves open goes here, numbered, with my recommended answer; I carried on with each.

1. **`TrueScale` now exists twice.** The step surface draws every option tile inside a zoom-fitted 1440
   canvas, which renders an 8px corner at two pixels and makes all six families identical. The type-scale
   board solved it with `true-scale.tsx`, which divides the ancestors' zoom straight back out; this board
   needs exactly the same box, and floating-surfaces will too. **Recommended:** the kit owns it
   (`src/components/lab/true-scale.tsx`, exported from the index) and both board copies delete in one
   Orchestrator commit. I copied it into my own lane rather than import across a board that retires at its
   own ruling; the file says so at the top.
2. **The tiles grid is a hard two-across below 640, and this board overrides it to one.** A tile here is
   the specimen at TRUE pixels, not a window onto a page, so a 375-wide phone column squeezed into 165px
   is a different composition drawn at the same corner. **Recommended:** the kit should let a board whose
   specimen is a fixed-width column opt out (a `--lab-tile-min`-style hook rather than a `:has()` rule in
   every board's sheet). I did it in `board.css` with the why beside it.
3. **Six phone-width cards cannot fit one screen at 1440.** The winner step is two rows of three (each
   card 461 x 647). Shrinking them means scaling, which this board may not do. **Recommended:** accept the
   short scroll; never-scaled beats all-at-once when the thing being judged is a number of pixels.
4. **The pair survives off the walk.** `compare` (any two families on one real page, two 1440 frames) is
   reachable from the board but from no step, because the winner step's stage already carries the pick
   onto a real page. **Recommended:** keep it this round, as the goal says; if Will's sitting never
   reaches for it, the next round deletes it and the board loses its last heavy section.
5. **The gap question is honest about being small at C.** At the board's own pick a 4px photograph in the
   3px gap opens a one-pixel hole; under D it is three. Rather than stage the specimen at the worst case
   and flatter the finding, the tiles draw whatever family is picked and the ask's context names both
   numbers. **Recommended:** leave it; the walk's third look-first step parks on D for the worst case.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Nothing outside the lab moved, and `docs/specs/rounding.md` (owned) changed one sentence: the
  paste is copied under "One real page, wearing the pick" now that the `paste` section is gone.

## Deferred (ROADMAP one-liners, bucket named)

- The lab kit: `TrueScale` belongs in `src/components/lab`, and the two board copies (type-scale, rounding)
  delete with it; every board that judges a fixed number of pixels inside a step's tile needs it.
- The lab kit: a board whose option tile IS the specimen needs a declared way to say so, instead of a
  `:has([data-<board>-specimen])` rule in each board's own sheet for `--lab-tile-min`, `--lab-tile-h` and
  the phone column count.

## Handoff (replaces the chat report)

- Work head `7b04ef52` (this manifest commit rides on top of it), pushed; synced with `launch-prep` at
  `21097b41`, merged and never rebased, after `light` and `palette` landed. The palette's kit change
  (`catalog.tsx`: `lands` now prints on a picked card, not only a solo one) is live on this board and
  wanted: every card here carries `lands`.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 8 warnings are pre-existing and none in
  this lane), test ok (2,166 in 228 files), build ok (258 pages); `pnpm lab:smoke --base
  http://localhost:3126` green, 0 route failures, **684 reading words against the 1,200 budget** (2,564
  against a declared 2,800 at round six), so the `reading` declaration is deleted. Only `glow-doctrine`
  and `glow-moments` still fail the budget, as they did before this branch.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned board directory (`spec.ts`,
  `board.tsx`, `specimens.tsx`, `board.css`, `families.test.ts`, the new `true-scale.tsx`) and
  `docs/specs/rounding.md`, plus this file. No exceptions.
- The steps, one line each:
  - `family`: decides four tokens on `:root` in `src/app/theme.css` (the surface, the floating layer, the
    photograph, the gap it pins); the six cards as the catalog's own tiles plus "None of these"; stage
    `pages`, one real page re-skinned in place; strip Page, Width.
  - `actions`: decides the three action tokens, a `cta` size on Button and the guest door's own token;
    three tiles, the four heights a button ships at over the guest sheet that borrows the token; no strip.
  - `ladder`: decides the seven multipliers in `theme.css`'s `@theme inline` block; two tiles, all seven
    steps drawn on their real components under today's ladder and under even quarters; no strip.
  - `dead-rungs`: decides two lines out of the same block and `rounded-full` on Badge; two tiles, the one
    marketing panel and the Badge, kept and dropped; no strip.
  - `gap`: decides `--gap-gallery` read off `--radius-tile` and the three `gap-[3px]` classes; two tiles,
    nine bright-edged photographs at the pinned gap and at the literal 3px; no strip.
- The cards, one line each:
  - `a`: lands as nothing; every corner token in `theme.css` stays where it ships.
  - `b`: lands as a square card and a square photograph; the floating layer alone stays round, at 6.
  - `c`: lands as an 8px card, a 12px menu, a 4px photograph and the 4px gap it pins. (The board's pick.)
  - `d`: lands as one 14px corner for the card and the menu, and a 6px photograph.
  - `e`: lands as a 10px card and a 14px menu around a square photograph, closing the gap by deletion.
  - `f`: lands as a 6px card and a 10px menu; the photograph and its 3px gap do not move, so no sweep.
- Assets requested from Will: one, unchanged from round six and still not in `docs/ASSETS.md`: four
  photographs with near-white, bright edges (a tablecloth, an overexposed sky, a white dress), 1200px long
  edge, JPG, so a corner hole is judged at maximum contrast. The stand-in is now the nine brightest edges
  in the marketing pool rather than the mid-key set, which flattered the bug.
- Look at first: **the buttons step.** All three rungs are drawn on the four heights a button really ships
  at, at true pixels, with the guest door under each: the pill's door is a half circle, which is the
  shortest case for moving that sheet off the button token. Then press through the six cards on the winner
  step and watch the home page re-skin in place, and press the winner card again (or "None of these") to
  put it back to the site as built. Two things to expect rather than report: the frame takes up to two
  seconds to drop a cleared block (the kit's poll), and at a 375 WINDOW the tiles go one column, because a
  375-wide specimen halved is a different composition (Question 2).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven reshaped the rounding catalog into a
five-step walk with no new family and no new argument: the six became a `pick-one` gallery decided by the
`family` ask (the six cards plus "None of these"), with one real page as the stage wearing whatever card
is pressed, and the `calls` section that stacked all four remaining questions under three tables of
arithmetic became four specimens, one a question, each drawn once per answer as a tile and once full size
underneath. Two controls were declared for the two questions that had none (`dead-rungs`, `gap`), both off
every strip; every card and every ask gained a `lands` line. Six iframes left the first step when the card
became the family's four corners at a phone's own pixels, and `true-scale.tsx` (copied from type-scale)
divides out the zoom the tiles impose so a corner is judged at true pixels. The reading fell from 2,564
against a declared 2,800 to 684 against the default 1,200, and the declaration went with it. No number,
no family and no measurement moved; the standing "six families or the four named" question is answered by
the pick itself now.

