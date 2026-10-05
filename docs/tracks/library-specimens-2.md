---
track: library-specimens-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "735ccbdc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/compositions/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/event-feed/event-hub-head.tsx
  - src/components/app/create-event-wizard.tsx
---

# lp/library-specimens-2

**Goal.** Two Library specimens the ROADMAP asks for: the hub-head specimens draw the real facts strip, and Create's whole room is a composition anyone can press through with no session.

## The brief

**The work** (dev-only, so the light gate applies: `docs/PROGRAM.md`, "Speed over proof in exploration"; typecheck, lint, the Library's tests, `pnpm lab:smoke --base http://localhost:3131`):
1. **The Library's hub-head specimens** (`HubCoverDemo`, `HubBandDemo` in `library/compositions/composition-demos.tsx`) hand `HubCover` no `arrivals`, so they draw the facts strip's flat quiet line. One prop each draws the real one; the entry's lede in `gallery-demos.tsx` still calls the facts "today's" (say what the strip is).
2. **A Library composition of Create's whole room.** The wizard's `create` stand-in prop already draws it with no row written, so every screen, the add step's night included, can be pressed through with no session.

Fixtures only: no Server Function, no network. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end; a successor may resume you).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
