---
track: event-ready
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f9db585d"            # the launch-prep SHA the branch was cut from
board: event-ready
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-ready/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - content/help/day-of-checklist-for-hosts.mdx
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/components/app/create-event-wizard.tsx
---

# lp/event-ready

**Goal.** Explore how a host knows her event is ready and what she does next: an event checklist, the settings' mini wizard (and whether Create shares it), a never-empty "what needs you", and the hub's code as the event's live door.

## The brief

**His note** (event-settings, build 19's sitting, on the door drawn in steps): "Almost feels like a mini wizard within settings to always ensure it's ready to go - wonder if we could extend this concept. Could also be helpful to create an event checklist for hosts so they know everything is ready." Settings has since shipped as four sentences with pages of their own and the door in steps (`settings-wiring`, merged at `7c0fbcb1`: `src/components/app/event-settings/`), and Create is Name, Style, Ready (`src/components/app/create-event-wizard.tsx`).

**The round:** how a host knows her event is ready, and what she does next, explored from production as it is:
- **The event checklist:** what "ready" means for an event (the door set as she means it, a code printed or shared, a cover, the reel's defaults, the room she has left, a look from a guest's side), where it lives (the hub, the event card, Settings, the end of Create) and when it steps aside. Every item is real state the product already holds, never an invented feature.
- **The settings' mini wizard:** his idea extended, a guided pass that leaves the event ready, and whether Create shares it or hands over to it.
- **"What needs you", never empty** (ROADMAP's major-overhauls line): one suggested job per event from real state (a queue, paused uploads, a code to print, storage near the cap), one pure function feeding the pulse and the event card.
- **The hub's code as the event's live door** (the same ROADMAP bucket): paused uploads dim it, a private event marks it.
- The help's `day-of-checklist-for-hosts` article is the written twin of whatever wins; its two Help-sync lines in the ROADMAP name where it is already wrong. The article is not yours: say what it should become in your Handoff.

Each ask draws every option on the real surface, from production's components fed fixtures, at 1440 and at 375 (hosts set events up on phones). Ask only what branches the work, and merge two asks that decide one thing. Anything that would change what an event is, or add a new obligation for hosts, is a one-way door: a Question with its recommendation, never an option.

**You are the first board authored after the lab revamp** (a board is one folder: `pnpm new-board`, the toolbox page `/design/lab/kit`): note in your Handoff what the kit made hard, so the next author finds it easier. Take `desk: 35` (after the door family, ahead of the marketing boards: app work first).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-ready/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-ready`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
