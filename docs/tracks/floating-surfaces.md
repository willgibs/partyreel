---
track: floating-surfaces
status: handed-off
cut: "6907ce68"        # the stepped review round (2026-09-16): the floating-surfaces board reshaped for it
board: floating-surfaces
owns:
  - src/app/(dev)/design/sandbox/floating-surfaces/
  - docs/specs/floating-surfaces.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/components/ui/dropdown-menu.tsx
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/floating-surfaces

**Goal.** Reshape the floating-surfaces catalog (round six: seven directions as cards on the app's dark over the album: Today, Card, Glass, Command, Compact, Paper, Lift) into a stepped review Will can walk in minutes, in half a day, with NO new direction and no new exploration: round seven. The board is a set of variants of one thing, so it is decided by ONE pick: `catalog.mode: "pick-one"`, a winner ask (`id: "direction"`, `control: "direction"`, its options the seven card ids plus `none` labelled "None of these", meaning "new directions: say what in the note"; `lands`: the Library's `dropdown-menu` entry rebuilt (anatomy, density and material variants) and the floating-surface tokens), `stage` the section that shows the real menus wearing the pick, and every card's `lands` one line (Card lands as the entry rebuilt; Glass as a material on it; Compact as a density variant; Paper and Lift as token blocks; Command and Today as nothing). Keep the Today card and the pair for any two. Then the four asks become tile steps, each on ONE menu specimen with every option drawn (they already mirror `submenu`, `radius`, `entrance` and `light`, so their tiles are the same menu in each state; `light` is the light board's line too, so its `context` says it is ruled once and inherited). Every ask carries `lands`; a control that serves one decision stays declared but leaves the `strip` (Ground may stay on it). The shipped bug the round found (`src/components/ui/dropdown-menu.tsx` renders SubContent without a Portal, so a nested submenu paints nothing) is the wiring round's; name it in the submenu step's context in one line and do not fix it here. Delete context that only restates what the tiles show, fold or delete the argument, and re-measure the reading budget (2,317 against a declared 2,400 today; a stepped board should need far less).

**The kit you build on.** The step surface is landed: `docs/PROGRAM.md` and `/design/lab/kit` describe it, and `src/components/lab/board-spec.ts` carries the fields (`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk / stage`) with `registry.test.ts`'s rules on them (a winner ask mirrors the pick control and may offer its cleared default as `none`; an option's `state` must name a declared control, so a control that serves one decision stays declared but off the `strip`; `look` is optional once every option is drawn). Read the palette board (`sandbox/palette/`) as the worked example of a pick-one board on the flow before you touch your own.

**Binds.** The bible, the contracts of every component under a path you own, and the policies (`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and 2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3125` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion honoured: the walk from the desk end to end (Start the review on `/design/lab?key=`, every step's context alone on the screen, every option visible at once on one specimen, a chosen card worn by the stage, "None of these" clearing it), a composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base http://localhost:3125` green for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on :3125 only, killed by port; one process at a time, stopped before a build, a test run and the handoff; never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. Three other agents run beside you in their own worktrees (`light` on :3122, `palette` on :3123, `type-scale` on :3124); merge `origin/launch-prep` before your handoff if it moved, never rebase.

**Questions.** Three, each answered by the shipped board.

1. **Do the four calls wait on the winner (`after: { ask: "direction" }`)?** No, and none of them
   declares `after`. Each is askable cold (the branch is a model plus a shipped bug, the corner is
   bible 9 against what ships, the entrance is two ratified rules disagreeing, the shadow is the
   light board's line), and staging them would mean a winner marked "not clear to me" took all four
   down with it and ended the sitting after one answer. The walk is still winner-first, because spec
   order is walk order.
2. **Which layer does the shadow specimen wear?** The one as it SHIPS, pinned, not the pick. Four of
   the seven cards already cast in dark, so a specimen wearing one of those answers the question
   before it is asked. The corner, the branch and the entrance specimens DO wear the pick, because
   the knob's paste is emitted after the layer's and wins.
3. **One "Apply to the site" block or two?** One. Apply is a radio across the whole board (one block
   stands at a time), so a layer block and a separate calls block let a reviewer walk half a ruling
   believing it was the whole. `blockName` composes the layer and the three calls under one name.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/specs/floating-surfaces.md`: the asks paragraph names the review's steps rather than the
  deleted Rule-on panel and says the board is one pick; a new "Where the winner lands" paragraph
  carries what each card becomes in the Library (the wind-down's promote path).

## Deferred (ROADMAP one-liners, bucket named)

- none new. The tile-scale finding is already on the ROADMAP (the lab bucket, from type-scale round
  seven) and this round corroborates it from the other end: a tile is `tileWidth / 1440`, so a 236px
  loupe arrived about 75 pixels wide and three corners four pixels apart were three identical
  smudges. The board's answer was to draw the loupe two and a half times larger and set
  `--lab-tile-min: 440px`; a 1:1 tile would have cost neither.

## Handoff (replaces the chat report)

- Head is this commit on top of `2b658caa`, the merge of `origin/launch-prep` at `21097b41` into the
  round-seven commit `0a5be46a`; pushed. `launch-prep` HAD moved: light, palette and type-scale
  merged, plus the kit's "Lands as" line on a picked card, which this board's seven cards now use.
- Gates on the synced tree: typecheck ok, lint ok (0 errors), test ok (2165), build ok (258 pages);
  `pnpm lab:smoke --base http://localhost:3125` 0 route failures and **922 words against the
  standard 1,200**, so the `reading` declaration (2,400) is deleted rather than lowered.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the eight files under
  `sandbox/floating-surfaces/`, `docs/specs/floating-surfaces.md` and this file. No exceptions.
- The steps, one line each (spec order is walk order; none is staged):
  - `direction`: decides the Library's `dropdown-menu` entry rebuilt as the winner and the
    floating-surface tokens; the seven cards ARE the tiles (`pick-one`), "None of these" clears the
    board, the stage is the real product; strip: Ground; after: nothing.
  - `submenu`: decides the Sub parts of `dropdown-menu.tsx`, portalled and kept or deleted; tiles =
    one event menu with the branch open and with the choices inline; after: nothing.
  - `radius`: decides `--radius-float` and the row radius across the family; tiles = one menu with
    the loupe under it, once per corner; after: nothing.
  - `entrance`: decides the entrance block in `globals.css` and a rewording of bible 15; tiles = the
    tooltip, the menu and the dialog on one canvas, once per clock, with a Replay in the section
    (a step renders no dock); after: nothing.
  - `light`: decides `--flt-float` in dark, shared with the light board; tiles = one panel on the
    app's own dark with and without it, on the layer as it ships; after: nothing.
- The cards, one line each:
  - `today`: lands as nothing. The floor the other six are judged against.
  - `card`: lands as the Library's `dropdown-menu` entry rebuilt (a title, groups, an icon rail, a
    footer rail). The board's own answer.
  - `glass`: lands as a material variant on that entry, for the surfaces the album sits behind.
  - `command`: lands as nothing of its own; its one idea is the branch question.
  - `compact`: lands as a density variant on the same entry.
  - `paper`: lands as a token block: no shadow in either mode, a real border, the squarest corner.
  - `lift`: lands as a token block: no edge at all, a doubled shadow.
- Assets requested from Will: none new. The dark low-key menu ground is `ASSETS.md` row 14 and the
  spec now carries that row number, so it cannot be logged twice.
- A kit finding, not fixed here (outside the lane): `src/components/lab/answer.tsx:183` puts
  `className="lab-disclosure"` on a `<details>`, but `.lab-disclosure` (design.css:289) is the
  JS-driven collapse that only opens on `data-open="true"`, which a `<details>` never gets. Measured
  live: every Ideas row inside "The ideas, the rules it breaks and the assets it asks for" computes
  `visibility: hidden` on every board, open or closed.
- Look at first: `/design/lab/floating-surfaces?session=floating-surfaces.direction` at 1440. Press
  Glass, watch the dashboard under it turn to glass, press "None of these" and watch it go back to
  the site as built. Then Next four times: the same event menu in each state the question offers.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven reshaped the catalog into a walk with
no new direction and no new argument: `catalog.mode: "pick-one"` with the `direction` ask as its
winner makes the seven cards that ask's own options, a press previews one on the stage and a second
records it, "None of these" clears the board into an ordinary ledger line, every card says what
keeping it lands as, and `catalog.stage` puts the dashboard, the phone, the covering family and the
guest's drawer under the grid wearing what was pressed, with the any-two comparison folded under it.
Round six's one `calls` section became four, each ONE menu in whatever state the option sets, since a
step draws its section once per option and again on the stage; the loupe is drawn two and a half
times larger and `--lab-tile-min` is 440px, because a tile is the section zoom-fitted to a third of
the column. The `ladder` and `real` scenes went with the shape, and the reading fell from 2,317
against a declared 2,400 to 922 against the standard 1,200, so the declaration is gone.
