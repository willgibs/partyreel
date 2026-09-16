---
track: media-kit
status: open
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
