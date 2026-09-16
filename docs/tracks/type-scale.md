---
track: type-scale
status: open
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
  - docs/tracks/lab-flow.md
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
- The steps, one line each: `<ask>: decides <lands>; tiles | means-only; after <...>`
- The cards, one line each: `<id>: lands as <...>`
- Assets requested from Will: none, or one per line
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
