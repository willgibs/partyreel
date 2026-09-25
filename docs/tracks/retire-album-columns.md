---
track: retire-album-columns
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "614bb68e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/album-columns/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/touchpoints.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/README.md
---

# lp/retire-album-columns

**Goal.** Retire the album-columns board now that its picks are built on both album surfaces (the hub's and the guest's albums on the windowed justified rows, merged into build 10), so the desk shows only what still asks Will something.

## The brief

Both album surfaces shipped on the windowed rows with this board's round-2 picks (the push arrival, the three steps with the slider, pinch and ctrl-wheel, the double rhythm). A board retires once its picks are built.

**The convention** (commit `452f1713`, "guest-verify retired", and `6a9da158`, the five reel boards; read them with `git show`): one atomic change across the lists a board lives in:
- `SandboxId` and `DESK_ORDER` in `touchpoints.ts`;
- its `RULINGS` row rewritten as shipped, its `lives` list naming the production files that carry the ruling now (`src/components/shared/album-window.tsx`, `album-tile.tsx`, `density-control.tsx`, `src/components/guest/gallery-rows.tsx`, `src/components/app/event-feed/host-album.tsx` and the like: check each exists), and its `board` block removed;
- the spec's entry in `sandbox/registry.ts`;
- the component's entry in `(shell)/lab/boards.ts`;
- the board's folder off the tree.

A badge or a batch marker that points only at this board's asks goes with it. Only `boards.ts` imports the folder today; if another board or tool draws a piece of it (the `/design/album-scale` tool page, the `media-viewer` board), move that piece into the reader's own folder rather than keeping the board. The ledger (`docs/reviews/album-columns.json`) is the Orchestrator's to delete at the record, so leave it.

Run the three lab tests (`touchpoints.test.ts`, `sandbox/registry.test.ts`, `(shell)/lab/_desk/queue.test.ts`) and the whole gate, including `pnpm lab:smoke`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; the three lab tests; `pnpm lab:smoke --base http://localhost:<port>` whole; the desk at `/design/lab` lists no `album-columns` and every remaining board opens; `/design/album-scale` still renders.

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
