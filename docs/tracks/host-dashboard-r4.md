---
track: host-dashboard-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d1a3a758"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/host-dashboard-r4

**Goal.** host-dashboard round 4: the stage's corner (what leads it: Newest, Upcoming, Last opened, Latest photos) explored again, drawn with the whole lit stage around it, two to four directions each its best version; H6's dashboard details folded in.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's answers to host-dashboard r3 (2026-10-04):** events=menu and stage=lit (being wired now by `dashboard-wiring`: draw them as settled); rule=corner, with his note "I'd like to see another exploration of the design of this UI."

**Round 4: the corner, explored again.** We read "this UI" as the stage's corner menu (today a glass pill reading "✦ Newest ▾" at the stage's top right, its popover listing Newest, Upcoming, Last opened and Latest photos, each with the event it would lead with today; shown only past one event), so draw it **with the whole lit stage around it**, so his judgment covers it in place. Say plainly in the board's opening that this is the reading, and that he can say if he meant the dashboard whole. Two to four directions for choosing what leads the stage (the corner refined, and ideas that are not a corner at all), each its best version, at 1440 and 375. Until his pick the stage keeps today's rule (newest leads).
- **Call folded in** (drawn here, never asked elsewhere): H6, the dashboard's details as built: this week holds only dated events, the phrase "in the album", no plan-limit line, and the storage ring on a phone. An ask or a drawn case, whichever reads truer.
- `opening.settled`: events=menu and stage=lit (wired now), the r3 carried calls (kept, default, recent, newest, light) as built. `earlier`: his r3 note. `history`: r4, the corner again.

**Budget:** one helper per direction (two to four), one fresh-eyes pass, one refinement. `desk: 25`.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
