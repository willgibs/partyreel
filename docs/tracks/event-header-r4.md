---
track: event-header-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e8d11584"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/event-header-r4

**Goal.** event-header round 4: the three doors (glass, cards over the seam, windows) each refined by its own helper to its best version, glass's counts as badges on its icons, cards owning the phone, each with its sticky form; form and behaviour only (the waiting color is the brand's); calls G1, G2 and G4 folded in.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's answers to event-header r3 (2026-10-04):** facts=strip (being wired now by `hub-strip-wiring`: draw it as settled). The guest row he loved (the facts ask's `faces` option) goes to its own board after the brand round; do not draw it here. And doors=?, in his words: "This is really difficult. All three are well-designed and stand on their own merits, but I'm currently leaning toward one glass capsule. We'd like to see all three through another round of design to see how they improve, so we can see more of each's potential. for example, a small add to glass capsule (far from exhaustive, you're more creative) is stacking the counts on the icons as badges, also don't love our yellow color, makes the page feel dull. total freedom there too. Cards over seam probably works best on mobile right now. Just trying to add context, but let your best ideas & max creativity fly. We're defining core experience here, if hosts have a bad UX using an event we'll lose them."

**Round 4: the three doors, each refined by its own helper, each its best version.** Glass (one capsule of segments; his first idea, counts stacked on the icons as badges; its stuck dock), cards over the seam (owning the phone; its stuck pills), windows (the rooms' small pictures, quieter; its stuck pill). Each with its sticky-band form as she scrolls, at 1440 and 375, light and the room. She presses these all night: they read at a glance and stay one press away however far she scrolls.
- **Form and behaviour only.** His "don't love our yellow" is a brand question (the warning amber reads as the brand's color), asked once on the brand's own boards: the doors wear today's waiting light here, and you add no new hue.
- **Calls folded in** (each drawn here, never asked elsewhere): G1, See it as a guest as a door (an inert phone over the dimmed hub); G2, Review and Guests sharing Settings' one panel, a room opening another room, the reel full screen; G4, Settings' "2 left" plain, never amber, and uploads reading Open or Paused.
- `opening.settled`: rooms=over (wired), facts=strip (wired now), the atoms identity's. `earlier`: his r3 note. `history`: r4, the doors refined.

**Budget:** three helpers (one per door), one fresh-eyes pass, one refinement. `desk: 20`.

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
