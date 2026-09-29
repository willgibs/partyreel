---
track: desk-tune
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4d8e9e0e"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/reviews/locked-door.json
  - src/components/guest/door/waiting-step.tsx
  - src/components/guest/door/shut-door.tsx
  - src/components/guest/door/ask-step.tsx
  - src/components/guest/door/unlisted-ask.tsx
  - src/components/guest/entry-modal.tsx
---

# lp/desk-tune

**Goal.** Make the door family board true again before Will's sitting: its "as today" drawn from the doors settings-wiring shipped, its asks' context re-read against them, and every option its own picture at a phone's width.

## The brief

**Why.** `locked-door` r2 (the door family: four open asks, `family`, `shape`, `wait`, `lost`) sits first on Will's desk, and it was drawn before `settings-wiring` (merged at `7c0fbcb1`) built the doors in production. The board's own `today.tsx` still draws the wait and the shut door as the round predicted them (its own `waitWords("today", …)` and `shutWords("today", …)`), while production now ships `WaitingStep` and `WaitingDoor` (`src/components/guest/door/waiting-step.tsx`), `ShutDoor` (`shut-door.tsx`), `AskStep` (`ask-step.tsx`) and `UnlistedAsk` (`unlisted-ask.tsx`), with their own words (`waitingCopy`, `shutDoorCopy`, `askCopy`, `unlistedAskCopy`) and the entry modal's steps. So every "as today" option compares against a door that no longer exists (`node scripts/lab-scope.mjs --since 882064e0` prints the board's PREMISE line). Will is holding this board until it is true again: his time is the scarcest in the program, so this lane is small and fast.

**Do:**
1. Make "today" production: draw each state's today from the shipped components and their copy functions, fed the board's fixtures (as the board already does for the not-found family with `NotFoundScreen`), never a copy of them; retire whatever the real components replace in `today.tsx` and `words.ts`.
2. Add the shipped door files to the spec's `lives`, so the next change to them raises this board's PREMISE line.
3. Re-read each ask's context layer (`where`, `when`, `matters`, `lands`, each option's `gains` and `costs`, `because`) and the board's `opening` (`about`, `settled`, `earlier`) against the shipped doors, and correct any line the build made false. Keep every ask id and option id (the ledger `docs/reviews/locked-door.json` names them); if an option is now the same as today, say so in its ask rather than dropping it.
4. At a phone's width (`pnpm lab:demo --board locked-door --width 375`), `shape`'s "Two, as today" and "Each state its own" draw the same picture: make every option visibly its own at 375, and check the other three asks there too.
5. Leave the lab's own layout alone: each stage starting about a screen under its question at 375 is a ROADMAP line (fold the context below `sm`), and `src/components/lab/step.tsx` is `crumbs-16`'s.

**Not yours:** production's door (`src/components/guest/`, `src/app/(guest)/`): draw it, never change it; a flaw you find in it goes under Board ideas. The ledger (`docs/reviews/`) is the Orchestrator's.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/locked-door/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `locked-door`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
