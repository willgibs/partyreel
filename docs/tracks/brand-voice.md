---
track: brand-voice
status: handed-off
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

**Questions.** Answered with the recommendation and built on it; all three are cheap to reverse.

1. **Does the spot list stay on the board now that it is not part of the walk?** Twenty-four places, each drawn twice, is the deepest evidence behind the pick and the only place A and B mean anything, but nothing in the five steps reaches it. **Recommended: it stays, as the whole board's own section, and the walk never visits it.** The pick is made on three lines at a glance; the reviewer who wants to know what the winner does to a toast, an error and a guest's door opens the whole board, which is one link in the spine of every step. Cutting it would delete the round-six evidence rather than reshape it.
2. **Is four frames of the home page the right stage under the pick?** It is the real page and marketing.css allows one skin per frame, so top to bottom is four documents, and Next therefore sits about five thousand pixels below the question (Enter and the arrows still advance from anywhere). **Recommended: keep the four.** The board's own claim is that a page has to LAND in the voice it opened in, and a stage that stopped at chapter one could not show it. If the scroll proves too long in the sitting, the cheap cut is chapters one and three, which are the two cinema grounds.
3. **Where should the true-size box live?** `TrueSize` in `frames.tsx` is now the THIRD copy of the same forty lines (type-scale and rounding carry the other two), and it is the only one whose reads settle, so it is the only one that actually compensates. **Recommended: the kit owns one, built from this copy**, which the ROADMAP already asks for under the lab bucket; this round adds the reason the other two silently do nothing.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/specs/brand-voice.md` (owned): the status line says round seven and the five-step walk; "What is still open" is four calls rather than three, the new first bullet being how far the winner reaches, with one voice at three volumes recommended and two guides, two sweeps and a seam at the sign-in page as the cost of the other.

## Deferred (ROADMAP one-liners, bucket named)

- The lab: the kit's true-size box has to SETTLE its reads, not read once. `Stage` resolves its scale a pass after the box mounts and no ResizeObserver reports an ancestor's zoom (the device-pixel box included, measured 2026-09-16), so `sandbox/type-scale/true-scale.tsx` and `sandbox/rounding/true-scale.tsx` measure 1 on mount and never compensate: their step tiles are zoom-fitted today. This board's copy rides a short frame settle and is the one to lift (it refines the ROADMAP's existing "TrueScale belongs in src/components/lab" line; the same line now names three copies).

## Handoff (replaces the chat report)

- Head `90653f8d`, pushed; synced with `launch-prep` at `092ab4b8` (it had moved thirty commits; merged, never rebased, no conflicts)
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 9 warnings are pre-existing and none is in this lane), test ok (2,162 in 228 files), build ok (258 pages); `pnpm lab:smoke --base http://localhost:3127` green for this board at **1,033 words against the 1,200 budget**, so the `reading` declaration is deleted (it was 2,700 declared, 1,662 measured). The only two failures in the whole smoke are the two glow boards, which fail on purpose.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five owned files under `sandbox/brand-voice/`, `docs/specs/brand-voice.md` and this file, plus two exceptions: **`src/app/(dev)/design/touchpoints.ts`** (the one `note:` line describing this board, stale the moment the shape changed; type-scale took the same exception in its round seven) and **`docs/design/library.md`** (generated: `pnpm design:rules` after that line, one line changed, `rules-registry.test.ts` fails without it).
- The steps, one line each:
  - `voice`: decides `docs/specs/brand-voice.md` promoted to `docs/systems/brand-voice.md` and the 85 lines the sweep carries; the catalog's own six cards as tiles, plus "None of these"; the real home page as the stage; strip: Canvas
  - `noun`: decides the five guest strings and the gallery component's name; tiles, both answers drawn on one guest card
  - `unfurl`: decides the event page's description meta tag; tiles, all three lines drawn on one chat preview
  - `counts`: decides one pair read from the demo event, in the hero and the band below; tiles, both pairs drawn on one line
  - `scope`: decides whether the guide is one voice at three volumes or two voices with a seam; means-only; after `voice`
- The cards, one line each (every one also carries its `lands`, which the merged kit now draws on the picked card):
  - `today`: lands as nothing, the 85 lines stay as they ship and the voice stays unwritten
  - `keepsake`: lands as 31 lines rewritten and the drifted ones brought back
  - `live` (the board's pick): lands as 58 lines rewritten in the present tense
  - `plain`: lands as 52 lines rewritten as facts, the app's quiet volume becoming the whole voice
  - `everyone`: lands as 51 lines rewritten around the room rather than the host
  - `aside`: lands as 50 lines rewritten dry, bible 20 tested at its edge on every one
- Assets requested from Will: none
- Look at first: the six cards side by side at 1440 (`/design/lab/brand-voice?key=&session=brand-voice.voice`). Three lines, one spot, six voices, at the size a phone draws them: the row that Live costs the headline is on the card rather than in a footnote. Then press Live twice and read the page below it, then Next four times.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round seven reshaped the brand-voice catalog into a
walk without writing a new voice or moving one of the 85 lines: `catalog.mode` became `pick-one`, the
`voice` ask records the winner from the six cards or "None of these", and the real home page under the
tiles wears whatever card is pressed. A card became the SAME THREE LINES of the home page's first
screen in every voice at a phone's own column, because two whole screens compared layouts rather than
voices; the quiet volume moved into its own section under the reach question the round had left
unasked (`scope`, means-only: one voice at three volumes, or two guides and two sweeps). The noun, the
link preview and the numbers became tile steps on one specimen each. The reading fell from 1,662 to
1,033 against the 1,200 budget and the declaration was deleted, mostly by cutting the jump menu, two
of four facts a card, the stage captions and `SpotCompare`'s per-place boilerplate. `TrueSize` keeps a
specimen at 1:1 inside a zoomed tile and settles its reads, which is what the other two copies of it
do not do.
