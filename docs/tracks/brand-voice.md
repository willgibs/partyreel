---
track: brand-voice
status: open
cut: "7ed0d2a2"        # the stepped review round (2026-09-16): the brand-voice board reshaped for it
board: brand-voice
owns:
  - src/app/(dev)/design/sandbox/brand-voice/
  - docs/specs/brand-voice.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/brand-voice

**Goal.** Reshape the brand-voice catalog (round six: six voices as cards, Today, Keepsake, Live, Plain, Everyone, Aside, every one of the 85 lines written six times, twenty-four spots) into a stepped review Will can walk in minutes, in half a day, with NO new voice and no new exploration: round seven. The board is a set of variants of one thing, so it is decided by ONE pick: `catalog.mode: "pick-one"`, a winner ask (`id: "voice"`, `control: "voice"`, its options the six card ids plus `none` labelled "None of these", meaning "new directions: say what in the note"; `lands`: `docs/specs/brand-voice.md` promoted to `docs/systems/brand-voice.md` and the 85 strings the voice-infusion round sweeps), `stage` the section that shows the real home page in the picked voice, and every card's `lands` one line. A voice is read, not looked at, so the gallery tiles are the SAME three lines in each voice (the h1, one subhead, one button) at true size on the same spot, and the stage is the real page. Keep the Today card and the pair for any two. Then the asks become tile steps on ONE specimen with every option drawn (`noun`, `unfurl` and `counts` already mirror their controls); add one means-only ask the round left open, `scope` (one voice everywhere at three volumes, or a marketing voice and a product voice), with the board's recommendation (one voice) and what the other costs (two guides, two sweeps). Every ask carries `lands`; a control that serves one decision stays declared but leaves the `strip` (Area and Canvas may stay on it). Delete context that only restates what the tiles show, fold or delete the argument, and re-measure the reading budget (2,642 against a declared 2,700 today; a stepped board should need far less, though this board's specimens are words and the budget counts specimens out).

**The kit you build on.** The step surface is landed: `docs/PROGRAM.md` and `/design/lab/kit` describe it, and `src/components/lab/board-spec.ts` carries the fields (`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / winner / walk / stage`) with `registry.test.ts`'s rules on them (a winner ask mirrors the pick control and may offer its cleared default as `none`; an option's `state` must name a declared control, so a control that serves one decision stays declared but off the `strip`; `look` is optional once every option is drawn). Read the palette board (`sandbox/palette/`) as the worked example of a pick-one board on the flow before you touch your own.

**Binds.** The bible, the contracts of every component under a path you own, and the policies (`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and 2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3127` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion honoured: the walk from the desk end to end (Start the review on `/design/lab?key=`, every step's context alone on the screen, every option visible at once on one specimen, a chosen card worn by the stage, "None of these" clearing it), a composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base http://localhost:3127` green for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on :3127 only, killed by port; one process at a time, stopped before a build, a test run and the handoff; never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. Three other agents run beside you in their own worktrees (`palette` on :3123, `floating-surfaces` on :3125, `rounding` on :3126); merge `origin/launch-prep` before your handoff if it moved, never rebase.

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
