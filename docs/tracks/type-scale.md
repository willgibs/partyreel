---
track: type-scale
status: handed-off
cut: "a978d791"        # the stepped review round (2026-09-16): the type-scale board reshaped for it
board: type-scale
owns:
  - src/app/(dev)/design/sandbox/type-scale/
  - docs/specs/type-scale.md
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

# lp/type-scale

**Goal.** Reshape the type-scale catalog (round six: five ladders as type specimens at true pixels, Today,
A tuned, B rungs, C registers and the spacing law alone) into a stepped review Will can walk in minutes,
in half a day, with NO new ladder and no new exploration: round seven. The board is a set of variants of
one thing, so it is decided by ONE pick: `catalog.mode: "pick-one"`, a winner ask (`id: "ladder"`,
`control: "ladder"`, its options the five card ids plus `none` labelled "None of these", meaning "new
directions: say what in the note"; `lands`: one `@theme` block of the nine size names in
`src/app/theme.css`, marketing and the app on one set of rungs), `stage` the section that shows the real
pages at the picked ladder, and every card's `lands` one line (what winning lands as). Keep the Today card
and the pair for any two. Then the two asks become tile steps, each on ONE specimen with every option
drawn: `tracking` (one heading at two spacings, adopt and keep, side by side at true size: declare a
`tracking` control it mirrors, so a press shows it) and `not-found` (the dead-link heading on the 404
screen, on the ladder and left off: two tiles of the same screen). Every ask carries `lands`. A control
that serves one decision only is not deleted (an option's `state` must name a declared control) but it
leaves the strip: `strip` names only what a step still wants beside its stage, such as Canvas. The open
question from round six (the compared pair scrolls sideways at 1440, or the kit's wipe) is yours to
settle for the stage: whatever lets two ladders be read on one real page without a sideways scroll at
1440 wins. Delete context that only restates what the tiles show, fold or delete the argument, and
re-measure the reading budget (1,155 today under the default 1,200; keep it there).

**The kit you build against.** `src/components/lab/board-spec.ts` at the `cut` above carries the fields
(`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk /
stage`) and `registry.test.ts` their rules (a winner ask mirrors the pick control and may offer its
cleared default as `none`); the step surface that renders them is being built beside you on
`lp/lab-flow` (read `docs/tracks/lab-flow.md` for exactly what each field draws). Until it merges, your
board page still renders on the old card: write the spec against the fields, keep `pnpm test` green, and
when the Orchestrator tells you the flow has landed, merge `origin/launch-prep` and verify the walk on it
before handing off.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and
2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands
in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the
lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3124` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured; once the flow is in: the walk from the desk end to end (the gallery step with the five as tiles,
a chosen card worn by the stage, "None of these" clearing it; the tracking and not-found steps with both
options visible at once), a composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base
http://localhost:3124` green for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on
:3124 only, killed by port; one process at a time, stopped before a build, a test run and the handoff;
never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5
<noreply@anthropic.com>` trailer on every commit. Three other agents run beside you (`lab-flow` on
:3121, `light` on :3122, `palette` on :3123); merge `origin/launch-prep` before your handoff if it
moved, never rebase.

**Questions.** Answered with the recommendation and carried on with; each is a one-line yes or no.

1. **The round-six open question, settled: one page, two copies, one canvas wide.** Neither the
   sideways row nor the kit's wipe. The stage loads ONE route (a `page` control on the winner
   step's strip) and the ladder arrives as CSS in that page's own document, so pressing a card
   re-types the same page in the same place with no reload; `against` lays a second copy of the
   route UNDER the first on a fade, inside one canvas width. A fade is also the only honest way to
   read a difference in SIZE, which is what the kit's own `Compare` says about its `stack` mode.
   *Recommended: keep it.* The one cost is the home page, whose hero line rotates on its own, so
   the two copies land on different words; its caption says so and `/about` is the stage's default.
2. **`catalog.compare` and the cards' A and B pills are gone with it.** "The pair for any two" is
   now the press (any card) against `Against` (any card), which is one gesture instead of two pills
   and works inside a step, where the kit hides the pill rows. *Recommended: keep it gone.*
3. **A kit finding for `lab-flow`: `OptionTiles` draws every tile inside a `FitStage fit="zoom"`,**
   which is CSS `zoom: 0.2` in a 290px tile and fatal on a type board (a 16px card title lands at
   three pixels). This board answers it locally with `true-scale.tsx`, which measures the zoom its
   ancestors impose and divides it back out, so a specimen is 1:1 on the glass in a tile, on a
   stage and on the board, and clips rather than shrinks. *Recommended: the kit offers a tile that
   does not scale (a `fit` on the option tiles, or a `data-lab-true` opt-out), and this file
   retires into it; until then it stays here, where the constraint lives.*
4. **`not-found` is staged behind `ladder`** (`after: { ask: "ladder" }`, no option named), because
   "put the title on the set" is not a question until a set is chosen. If nothing is picked the
   specimen draws at the board's own recommendation and the caption says so. *Recommended: keep.*
5. **Both follow-up controls are declared and off every strip.** `tracking` and `dead-link` exist
   only so their ask can draw both answers as tiles; putting them on a config strip would print the
   same question twice on one screen. *Recommended: keep.*

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- The lab: the step's option tiles scale their evidence (`FitStage fit="zoom"` in `step.tsx`), so a board judging SIZE has to undo it; offer a tile that draws at 1:1 and retire `sandbox/type-scale/true-scale.tsx` into it.

## Handoff (replaces the chat report)

- Work head `c533f2dd` (this manifest commit rides on top of it), pushed; synced with `launch-prep` at `c334de13`, merged and never rebased, after `lab-flow` landed.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 9 warnings are all pre-existing and none in this lane), test ok (2,160 in 228 files), build ok (258 pages); `pnpm lab:smoke --base http://localhost:3124` green, every type-scale route including the three `?session=` steps, **486 reading words against the 1,200 budget** (1,155 at round six), no declaration needed. Only `glow-doctrine` and `glow-moments` still fail the budget, as they did before this branch.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned board directory, `docs/specs/type-scale.md` and this file, plus two declared exceptions: **`src/app/(dev)/design/touchpoints.ts`** (this board's own summary line only, round six's wording was a lie the moment the walk landed) and **`docs/design/library.md`** (the generated artifact, regenerated with `pnpm design:rules`; `rules-registry.test.ts` was already red on `launch-prep` before this branch, because the hero's touchpoint edit at `a978d791` did not regenerate it, and `lab-flow` fixed that half at `2b645a2c`).
- The steps, one line each:
  - `ladder`: decides one `@theme` block of nine size names in `src/app/theme.css`; the five cards as tiles at true size plus "None of these"; stage `pages`; strip Canvas, Page, Against.
  - `tracking`: decides the nine letter-spacing and line-height tokens in the same block; two tiles, today's 160 / 60 / 16 under the flat value and under the law; strip Canvas.
  - `not-found`: decides one rule on `[data-not-found] h1` or a written exception; two tiles, the production dead end with its title on the set and off it; after `ladder`; strip Canvas.
- The cards, one line each:
  - `b`: lands as nine size tokens off one rung set; the three breakpoint ramps become one class each.
  - `c`: lands as two registers in one block, marketing five steps louder, the app quieter than today.
  - `a`: lands as today's desktop sizes baked as tokens, the phone end written out, no new app step.
  - `law`: lands as leading and letter-spacing tokens only; not one font-size in `theme.css` moves.
  - `today`: lands as nothing; the shipped ramps and the flat heading tracking stay.
- Assets requested from Will: none.
- Look at first: **the tracking step.** Both answers are drawn on the same three sizes at true pixels, side by side, which is the one thing round six could not do. Then press through the five cards on the winner step and watch `/about` re-type itself in place; drag `Against` to read two ladders on the one page. Two things to expect rather than report: at a 375 WINDOW the two tiles are half a phone wide, so the 160px word crops to one letter until Canvas is flipped to 375 (then the specimen is 52px and fits); and the home page is the one route the fade cannot be honest about at once, because its hero line rotates on its own, so the two copies land on different words. The board's own answer is unchanged: B, rungs, with the dead-link title on the set.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven reshaped the type-scale catalog into a
three-step walk with no new ladder and no size moved: `catalog.mode: "pick-one"` with the `ladder` ask
as its winner (the five cards plus "None of these", mirroring the pick control), `pages` as its stage,
`lands` on every card and every ask, and `tracking` and `not-found` as tile steps whose two controls are
declared and off every strip, `not-found` staged behind the pick. Round six's open question was settled
without the sideways row and without the wipe: the stage loads ONE route from the strip, the ladder
arrives as CSS in that page's own document so a press re-types it in place, and `against` lays a second
copy of the route under the first on a fade inside one canvas width; the compare section, the five-frame
column and `catalog.compare` went with it. `true-scale.tsx` divides out the zoom the step's tiles impose,
so a specimen is 1:1 on the glass wherever it is drawn, and the board asks the tiles for the room type
needs. The reading fell from 1,155 words to 486 against a 1,200 budget.
