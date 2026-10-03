---
track: the-wait-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9af92e54"            # the launch-prep SHA the branch was cut from
board: the-wait
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/the-wait/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/the-wait.json
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/disposable/
  - docs/systems/disposable-mode.md
---

# lp/the-wait-r2

**Goal.** the-wait round 2: the arrival, a develop as a first-load animation that turns into the album (his first choice), with the premiere first and into place as the drawn fallbacks.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answers (the-wait r1, his desk on build 45, 2026-10-03).** Every pick is now wired by `wait-wiring` (merged): model=time on the guest screens with option 2's Settings design, wait=sheet, cover=guests, name=disposable, both=never. arrival=? in full: "It's hard to judge this isolated. Option 2 feels like the potential best, but ideally more of a 'develop' first load animation that transitions into the album view somehow. If we can't nail that, I'm split between the option 3 premiere first to open with the reel idea clearly (nice call on easy skip button), or option 1 into place where anytime after it has developed, it just opens as an album with a cool animation, likely similar/same as a regular open live album would."

r1's three were `place` (into place, newest first, Premiere on the cover), `develops` (the contact sheet's squares fill with photos in night order) and `premiere` (the reel full screen before the album, with Skip).

**The ask (`arrival`):** draw his first choice properly before the fallbacks: the develop as the album's first load, the waiting contact sheet (as wired) developing into the album itself in one continuous transition, every guest's first open after the develop. Draw two or three takes on it. Draw the premiere first and into place refined beside them as the fallbacks. Each:
- drawn on production as wired, from the waiting state to the album;
- at 375 and 1440;
- with reduced motion as its own pass;
- including what a guest sees who opens it a day later (the second open is plain).

Recommend one. Retire r1's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/the-wait/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `the-wait`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board the-wait --base http://localhost:3133` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

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
