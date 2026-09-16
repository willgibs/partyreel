---
track: rounding
status: open
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

**Questions.** What the goal leaves open goes here, numbered, with your recommended answer; carry on with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` green for this board, its reading words
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The steps, one line each: `<ask>: decides <lands>; tiles | means-only; after <...>`
- The cards, one line each: `<id>: lands as <...>`
- Assets requested from Will: none, or one per line
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
