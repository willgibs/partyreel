---
track: privacy-hero-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "cdc979a6"            # the launch-prep SHA the branch was cut from
board: privacy-hero
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/privacy-hero.json
  - docs/systems/marketing-content.md
---

# lp/privacy-hero-r4

**Goal.** Round four of the privacy page's hero: the veil as drawn and three real variations of it, to nail it; the sealed cards gone, the sweep and the aperture banked.

## The brief

**His r3 answer** (`docs/reviews/privacy-hero.json`, 2026-09-29) opens round four (you own the board's folder; it keeps its id): `concept` = `veil`. He finds it bespoke to privacy, a photograph that only reveals what it wants to, and wants the original kept with three variations to nail it. The sealed cards are out (he doesn't like them at all). The sweep and the aperture are banked for other surfaces (ROADMAP's line on the privacy hero's two runners-up); if you retire their code from the board, give that line a `git show <sha>:<path>` pointer so they can be found.

**The round:** one ask, which veil. Draw the original as it stands and three variations as far apart as the real answers are (PROGRAM.md's round rules), each one decision's contender rather than a tuning of one number. Among the directions worth drawing: what the clearing is (a soft circle, a lens, a band), how it travels and whether it ever rests, whether one photograph or a slow succession sits under the veil, and what the veil is made of (blur, the product's own frost, grain). Draw them on the real surface: the privacy page's first screen with PageHero's words over it, at 1440 and at 375, from production's components fed fixtures. Marketing's motion rule holds (`docs/systems/marketing-content.md`: calm and fluid), reduced motion gets one still frame, and the words stay readable over every frame at both widths. The recommendation says why in a line.

**At this touch:** ROADMAP's line on `field.ts`, `field.css` and `field-layer.tsx` (alive only for `photoOf`, read by `concepts-layer.tsx`) is done here: move `photoOf` and cut the rest, since `album-page` no longer needs them (check before cutting). The ROADMAP is mine: name in your Handoff that line's retirement, the feature-pages line's "round three is on the desk" as round four, and any pointer the runners-up line gains.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/privacy-hero/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `privacy-hero`, its title, `surface`, `desk: 40` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
