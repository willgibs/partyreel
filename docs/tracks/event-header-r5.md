---
track: event-header-r5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/components/app/event-feed/event-hub-head.tsx
---

# lp/event-header-r5

**Goal.** Event-header round 5: three or four polished takes on the picked cards doors.

## The brief

**Round 5 of event-header, from Will's desk 3 answer:** doors = cards. His note: "This feels a bit more pronounced than the glass capsule, without shouting like the quiet windows with their more media-forward visuals do. Let's carry this version forward, but run another exploration to see what some of your ideas of polish look like." The cards (the cover dissolves into the page and five cards stand across the seam, every one in sight on a phone; stuck, they fold into pills under the bar) are being wired into production in parallel (event-header-wiring); draw from r4's own cards (`cards.tsx` through `door-kit.tsx`) meanwhile.

**One ask: polish.** Three or four takes on the cards, each a real contender a strong product team would ship and simply your best polish idea, overlap welcome, never a caricature to stand apart (Will's standing warning in the lab: options that try too hard to differ all feel too themed; the best answer may be one option with a few magic touches from another). Across: what a card holds and how its count reads; light and depth at rest and when something waits (the waiting colour stays the brand's); the fold into pills under the bar and back; the press and the focus (settled in identity: shrink and the halo); a phone's reach; a tablet (640 to 1024, where five cards at about 190px cut "Highlight reel": the ROADMAP line); reduced motion. Recommend one and name the touch worth borrowing from another. G1, G2 and G4 as carried. Form, never hue: brand r1 (Will's desk 4) owns colour.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 20` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
