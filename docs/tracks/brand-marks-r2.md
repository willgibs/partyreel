---
track: brand-marks-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: brand-marks
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand-marks/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand-marks.json
  - docs/systems/design-system.md
  - src/app/icon.svg
  - kit/logo/partyreel-mark-dark.svg
---

# lp/brand-marks-r2

**Goal.** Board brand-marks r2: the icon made bespoke on the ember Ring Will picked, which ships meanwhile as the working version.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen, words in compact groups with room around them); simple on top, deep underneath (each visible piece the door to the features behind it); one product on both sides (host and guest one interface where they can); nothing depends on a timeline (no date reshapes an album by itself); immediate, or a clear state and a way out; never dev-tool-ish; production the working version. PRD.md's "Will's product principles" hold each with its reason.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3137 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in look runs on your own port in a headless Chrome of your own through `usher/kit/redteam/signin.mjs` (testing-verification.md), never Will's browser pane or his Chrome; never kill a process by its name, by port or pid only.

**A parts board, and why:** the icon stands alone (nothing on a page composes with it), so one focused ask serves it best.

**From his round one (`docs/reviews/brand-marks.json`):** `icon=ember`, the puck in its ring key-lit from the top-left by the house ember, with his note: "I'd be curious to explore additional designs on top of this, such as filling the ring with more design to feel more bespoke to our brand rather than identifying with a circle alone. However, we can carry this as the working version." brand-marks-wiring ships the ember Ring everywhere an icon lives this wave. His wordmark note is the family's philosophy: bold, one group that carries its weight at a small size, never thin or spread out. The carried calls stand: the icon is the house's (never an event's light), the word stands alone in the bars and the foot.

**The ask:** which Ring signs Partyreel on a home screen, among tabs and in a launcher's mask, each option a bespoke take on the ember Ring that is more of the brand than a circle (what the ring holds, what it is made of), pushed apart; today's ember Ring the reference. Each read at 16, 32, 180 and 1024 pixels, on a home screen by day and at night, in a round mask, and beside the wordmark where a press kit would set them.

**Desk:** this round keeps the board's `desk: 6`.

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand-marks/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand-marks`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
