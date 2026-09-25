---
track: album-fixes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-window
  - src/components/shared/masonry
  - src/lib/shared/album-rows
  - src/components/shared/media-lightbox
  - src/components/app/recently-deleted-grid
  - src/components/app/host-media-grid
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/album-fixes

**Goal.** Two album fixes from build 10's red-team: a hide above a reader's view never moves what they are looking at, and a host on a phone can restore or delete what sits in the bin.

## The brief

1. **A hide above the view jumps it** (minor, build 10's red-team): a guest at 1440 sitting at scrollY 23,675; hide (by status) the photo at position 359; the double-height row above it collapsed into a normal row, the photographs before it moved up 522 px and everything below up 574 px, with no scroll compensation; a first trial at position 551 took 6 of 8 photographs in view off screen. An arrival already holds the view (the photograph at the view's top stays put, 0 px), and a restore of the same photograph was compensated (+487 px, nothing moved on screen); at 375 the same hide stays local. **Make a removal hold the view as an arrival does**: when rows above the view's top re-lay for any reason (a hide, a removal, a rhythm row that re-forms), the photograph at the view's top stays where it is, on the guest's album and the host's alike (they share `MasonryColumns` and `AlbumRows`). A hide INSIDE the view may re-justify the rows under it (whether that glide should hold still is a separate `album-columns` motion question; leave it). Pin it with the rows engine's tests and prove it at 1440 and 375 on a production build with `scripts/album-perf.mjs` or a CDP walk (a status flip by SQL on the scale probe is fine: every row is test data; restore it).

2. **The bin on a phone acts on nothing** (Will's question from `album-host-wiring`, its recommended answer, built): at phone width Deleted offers no Restore and no Delete permanently, because the tile's pane is desk-only and the bin's viewer is read-only. The bin's viewer takes the two verbs, as the album's viewer takes the album's: Restore acts at once with its toast, Delete permanently confirms first, both through the bin's existing actions (the restore and purge the desk's tile pane already calls), and a restored or purged item leaves the bin's list. Name it as his to overrule.

Put the `guest-flow.md`, `host-app.md` and `design-system.md` lines these change in your Handoff for the Orchestrator.

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
