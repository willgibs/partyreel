---
track: retire-reel-boards
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "dbd04163"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-front/
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-host/
  - src/app/(dev)/design/sandbox/reel-view/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/touchpoints.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/README.md
  - docs/systems/reel.md
---

# lp/retire-reel-boards

**Goal.** Retire the five reel boards whose picks are now built and live on build 9 (`reel-cut`, `reel-front`, `reel-screen`, `reel-host`, `reel-view`), in the house convention, so the desk shows only what still asks Will something.

## The brief

The live reel shipped tonight: the guest and host sides, the clip creator and the tile, per these boards' answers. A board retires once its picks are built.

**The convention** (commit `452f1713`, "guest-verify retired"; read it with `git show 452f1713`): one atomic change across the lists a board lives in:
- `SandboxId` and `DESK_ORDER` in `touchpoints.ts`;
- each board's `RULINGS` row rewritten as shipped, its `lives` list naming the production files that carry the ruling now, and its `board` block removed;
- the spec's entry in `sandbox/registry.ts`;
- the component's entry in `(shell)/lab/boards.ts`;
- the board's folder off the tree.

A badge or a batch marker that points only at a retired board's asks goes with it.

Nothing outside these folders imports them but `boards.ts`. If a retired folder holds a piece another board draws (say `reel-story` or `media-viewer`), move that piece into the reader's own folder rather than keeping the board. `PosterCard` lives in `src/components/reel/` and stays.

The ledgers (`docs/reviews/<board>.json`) are the Orchestrator's to delete at the record, so leave them. `reel-story`, `media-viewer`, `identity-door` and `album-columns` stay.

Run the three lab tests (`touchpoints.test.ts`, `sandbox/registry.test.ts`, `(shell)/lab/_desk/queue.test.ts`) and the whole gate, including `pnpm lab:smoke`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; the three lab tests; `pnpm lab:smoke --base http://localhost:<port>` whole; the desk at `/design/lab` lists none of the five and every remaining board opens.

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
