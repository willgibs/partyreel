---
track: host-dashboard-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "499612e4"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - docs/systems/dashboard.md
---

# lp/host-dashboard-r3

**Goal.** host-dashboard round 3: events for a host of 1 to 10 that scale to hundreds (a collapsible Recent row over one gallery/table/list with deep sort, filter and display), the featured stage beautiful for an event with no photos yet, and the feature's rule as a choice rather than a picker.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answers (host-dashboard r2, his desk on build 45, 2026-10-03), in full:**
- events=recent: "All of these still feel like they're over-organizing the experience in one way or another. At least for launch, we should design for users with 1 to maybe 10 events in mind as the primary expectation, but ensure it scales up to dozens or hundreds of events if needed for power users. I'm thinking we have a recent row as collapsible (keeps last few quickly accessible), then simply a gallery/table/list with deep sort/filter/display customization for how hosts prefer to organize the rest of their events. Another exploration please."
- lead=made: "We should ensure featured events with no uploaded media yet still look beautiful as featured in the dashboard. Worth a dedicated exploration. I think it makes sense to default to the newest event here, generally expecting a host to continue preparing it."
- pick=kept: "Very nice, because I doubt every host will want their newest always as the featured year. Rather than directly selecting an event, these could be more like sort options, such as: newest, last opened, upcoming, etc. This helps it continue to be a reliable featured, but for accounts with 100 events, doesn't result in a mega dropdown to choose. More algorithmic, repeatable solution."
- Settled the same night, and wired later this round by `event-dates`: an optional end date (a range of days, no times), and lead=made (the newest event leads the stage on a quiet day). Draw both as settled with your own fixtures.

**The asks:**
1. **`events`:** the collapsible Recent row over one gallery, table or list with deep sort, filter and display customization. Draw it at 1, 3, 10, 40 and 200 events, so the 1-to-10 host is the design and the 200-event host still reaches an old party in a press or two.
2. **`stage`:** the featured stage for an event with no photos yet, made beautiful: the code, readiness, the event's own colour or look, a delight that costs nothing in clarity. Show it both just made and the week before.
3. **`rule`:** the feature's rule as a choice among newest, last opened, upcoming and any you find, kept where a host sets preferences, never a list of her events.

Drawings at 1440 and 375, paper and room. Recommend one each. Retire r2's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board host-dashboard --base http://localhost:3135` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

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

## Where I am

- WIP 2: every option drawn and `lab:demo --board host-dashboard` green at 1440 and at 375 (`--state screen=375 --width 375`), shots in `../partyreel-wt/_scratch/host-dashboard-r3/shots-*`; first visual fixes in (short rail words, Ready said once, Rae's target in late 2023, Recent read by the captions). Next: phone and paper passes on the shots, then the gate and `lab:smoke`, then the Handoff.
