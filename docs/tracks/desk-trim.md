---
track: desk-trim
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7e99254c"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-dialog.tsx
  - src/components/ui/responsive-menu.tsx
---

# lp/desk-trim

**Goal.** Retire `export-flow`'s `object` ask ("Should Download open a sheet of bundles, or simply start?"), which Will's `popups` answer settled (`choices=menu`, a row is the act, now built), every other ask on the board kept.

## The brief

Will's `popups` r1 answer `choices=menu` ("A menu at the button, rows at the foot ... a row is the act"; the board retired with its wiring, merge `3e7952e3`, `git show 3e7952e3 --format=%B`) is built: Download is a responsive menu whose row starts its bundle at once (`src/components/app/export/export-dialog.tsx` on `src/components/ui/responsive-menu.tsx`). That is `export-flow`'s open `object` ask answered with its own `menu` option, so the ask leaves the board (docs/PROGRAM.md: "only a question already solved at its best is removed"; his answer on the general kind decided this instance). Remove it from `spec.ts` with the drawings and fixtures only it used; every other ask (`means`, `wait`, `stuck`, `hollow`, and the rest) stays exactly as it is, and any drawing that showed the old dialog as "today" now shows production's menu. Its `touchpoints.ts` row is yours (only its asks and lives; nothing else in that file). Verify: the board at 1440 and 375, `pnpm lab:smoke` whole, `pnpm lab:demo --board export-flow` pressing every remaining step.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
