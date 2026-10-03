---
track: create-wizard-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c5f341f4"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/reviews/the-wait.json
  - src/app/(dev)/design/sandbox/the-wait/spec.ts
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/camera-settings.tsx
---

# lp/create-wizard-r3

**Goal.** create-wizard round 3: the add step (how guests add, an album or a disposable), a more polished set drawn in the room as wired, the distinction clean and beautiful with no decision paralysis.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answer (create-wizard r2, his desk on build 45, 2026-10-03):** add=? "These are all presented well already. This is really tough for me to decide, so let's run a second exploration so I can pick from an even more polished option set. Really important we can cleanly (yet beautifully) nail the distinction for hosts here, without overcomplicating or decision paralysis." r2's three were `pair` (two phones side by side, one night slider under both), `switch` (one phone, a switch over it) and `stack` (the pick in front, the other behind). His other picks are wired now (`wizard-wiring`, merged): the room, flow=carry, look=places, beat=develop.

**What the add step must now agree with** (the-wait's picks, wired by `wait-wiring` beside you):
- **model=time** on the guest screens: one question of time, with a small distinction between disposable and reviewed.
- **Settings' "Album style"** of picture cards (Live, Reviewed, Disposable).
- **name=disposable.**
- **both=never:** approval stays a live album's, and a disposable keeps only its develop time.

The add step is where a host meets that choice first, so its words and its pictures follow the same model. Round 12's settled pieces stay available to you: the night slider (how each choice plays through the night) and the camera step right after the name.

**The ask (`add`):** three to four options, more polished than r2's, each drawn whole in the room at 1440 and 375, paper and room where it matters.
- A refined r2 option is welcome beside new ones.
- At least one option mirrors Settings' album styles, so Create and Settings speak one language.
- Each option says what a host gives up by choosing.
- None makes her read more than a line to choose; the night shows the difference rather than words.

Recommend one. Retire r2's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board create-wizard --base http://localhost:3135` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

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
