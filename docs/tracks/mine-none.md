---
track: mine-none
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-tile
  - src/components/shared/masonry
  - src/components/shared/unverified-mark
  - src/components/guest/gallery-rows
  - src/components/guest/guest-masonry
  - src/components/guest/live-gallery
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/media-viewer.json
  - src/lib/guest/yours-filter.ts
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
---

# lp/mine-none

**Goal.** A guest's own photos wear no mark on the album's tiles (`media-viewer` r3 `mine=none`, overruling `run`): the glass dot comes off, View's Showing (Everyone's or Yours) is how she finds them, and the viewer still credits hers as You; then the media-viewer board retires.

## The brief

**The answer** (`docs/reviews/media-viewer.json`, r3's only question, `mine`): "Nothing on the tiles. No mark at all: View's Showing (Everyone's or Yours) finds them, drawn open here. Once open, the viewer still credits yours as You."

**What production still draws:** round 1's glass dot, `MineMark` (`src/components/shared/album-tile.tsx:103-174`, rendered at `:584-586`, `data-mine` at `:495`). It is a button that toggles the Yours filter, wired through:
- `masonry.tsx:443-452` and `:889-893`;
- `src/components/guest/gallery-rows.tsx:180-182`;
- `guest-masonry.tsx:104-106`;
- `live-gallery.tsx:436-438`.

It is pinned by `masonry.test.tsx:222-229` and `live-gallery.test.tsx`.

**Build.** Remove the mark and every prop and branch that exists only for it. The host's grid keeps its own marks, so read each consumer of the shared tile before removing a prop. Keep what others lean on:
- `unverified-mark.tsx` wears the mark's material (its comment says so), so the material stays wherever it lives;
- the "Showing yours · Show all" line (`live-gallery.tsx:398-411`) stays as the filter's way out; its comment no longer names the mark as the other exit;
- the View menu's Showing group appears only when she owns a photo (`live-gallery.tsx:111`);
- the viewer's "You" (`media-lightbox-parts/credit.tsx:82`) is untouched.

A reshaped test keeps its real scar and says what it now pins: no mark, and the filter reachable from View.

**Then retire `media-viewer`** in your branch, in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (SandboxId, RULINGS, DESK_ORDER). These are your named exceptions; the album-columns retirement `95c8aa56` is the template. The Orchestrator deletes its ledger.

**Doc lines** go in the Handoff for the Orchestrator: `design-system.md:320` and `guest-flow.md:202` describe the mark.

**Neighbours.** `guest-door` owns `event-experience.tsx` (which mounts the album) and `src/lib/guest/`; `yours-filter.ts` is your read. If removing a prop needs one line in one of them, name it as an exception with the reason.

**Verify** on the scale probe:
- a guest who owns photos sees no dot on any tile, at 375 and 1440;
- View → Showing → Yours filters, and "Show all" returns;
- the viewer says You;
- the host's hub is unchanged;
- `pnpm lab:smoke` passes whole (the Library renders the tile).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
