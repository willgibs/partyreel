---
track: retire-album-columns
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
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

- The brief cites two commits as "the convention" (`452f1713`, guest-verify, and `6a9da158`, the
  five reel boards), and they turn out to disagree: `452f1713` rewrote a retiring board's
  `RULINGS` row "as shipped" and kept it with `board: none`; `6a9da158` deletes the row whole
  instead, because `library-lean` (`2bac8693`, already on this branch's cut, landed before
  `6a9da158`) made `board` a REQUIRED field on `Ruling`, so a row without one no longer
  typechecks. Confirmed against today's `touchpoints.ts`: `board` is still required, there is no
  "shipped" state, and the old overtaken/badge mechanism `452f1713` also carried is gone
  entirely (no `overtaken*` file anywhere). **Recommended and built: followed `6a9da158`** (the
  row is deleted whole, not rewritten) since it is the one that still typechecks and is the more
  recent precedent. Will's to overrule if he wants the row kept some other way.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `95c8aa56` ("retire-album-columns: the board leaves the desk, its picks built on
  both album surfaces"), pushed to `origin/lp/retire-album-columns`. No sync commit: after the
  branch cut, `origin/launch-prep` only gained two Orchestrator record/pickup commits
  (`cb4a5de2`, `17e6ace6`), each touching only `docs/tracks/album-docs.md`,
  `docs/STATUS.md`/`docs/tracks/orchestrator.md`; PROGRAM.md: "Record commits ... never need
  [a sync]." Confirmed `0ac99010` (this lane's base) is an ancestor of current
  `origin/launch-prep`, so nothing to merge. The head is in the chat line.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates, run on `95c8aa56`'s tree (still `origin/launch-prep`'s tip at cut, `0ac99010`), each on
  its own exit code: `pnpm typecheck` exit 0 (clean); `pnpm lint` exit 0 (0 errors, 6
  pre-existing warnings, none in a touched file); `pnpm test` exit 0, 5393/5393 across 482 files;
  `zsh scripts/build-lock.sh pnpm build` exit 0. The three named lab tests
  (`touchpoints.test.ts`, `sandbox/registry.test.ts`, `(shell)/lab/_desk/queue.test.ts`): 55/55.
  `pnpm lab:smoke --base http://localhost:3132`: 271 checks, 0 failing (the one 500 is
  `/design/lab/tools/boom`, its own permanent intentional boundary probe, unrelated; log at
  `partyreel-wt/_scratch/retire-album-columns/lab-smoke.log`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the four owned prefixes
  (`touchpoints.ts`, `sandbox/registry.ts`, `(shell)/lab/boards.ts`, the 9 files under
  `sandbox/album-columns/`, all deletions) plus this manifest. No exceptions.
- The items:
  - `album-columns` retired: `SandboxId`, its `RULINGS` row and its `DESK_ORDER` entry gone from
    `touchpoints.ts`; its spec out of `sandbox/registry.ts`; its component out of
    `(shell)/lab/boards.ts`; `sandbox/album-columns/` off the tree (`git rm -r`, 9 files).
  - Verified live on `:3132`: `/design/lab/album-columns` 404s; `/design/lab` 200 and names the
    board nowhere (the one `album-columns` substring left on the page is this lane's own track
    name/goal text on the tracks list, not the board); every remaining board in `DESK_ORDER`
    (21 of them) still opens, smoke-walked at 200; `/design/album-scale` 200, and its imports
    were checked to touch nothing under the retired folder (it never did).
  - `docs/reviews/album-columns.json` left in place, per the brief, for the Orchestrator to
    delete at the record.
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - The Questions section's convention pick (built `6a9da158`'s delete-the-row-whole over
    `452f1713`'s rewrite-as-shipped, since only the former still typechecks under
    `library-lean`'s required `board` field).
- Look at first: the work commit `95c8aa56` (`git show 95c8aa56 --stat` is exactly the 12 files
  above); then `git diff origin/launch-prep...HEAD -- src/app/\(dev\)/design/touchpoints.ts` for
  the RULINGS/DESK_ORDER/SandboxId trim.
