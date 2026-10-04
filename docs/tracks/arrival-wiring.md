---
track: arrival-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience.tsx
  - src/components/guest/event-experience-head.tsx
  - src/components/guest/gallery-empty-state-wait.tsx
  - src/components/guest/gallery-empty-state-sheet.tsx
  - src/components/guest/gallery-empty-state.css
  - src/components/guest/live-gallery.tsx
  - src/lib/disposable/contact-sheet
  - src/lib/disposable/develop-words
  - docs/systems/disposable-mode.md
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/the-wait.json
---

# lp/arrival-wiring

**Goal.** Wire Will's arrival=in-place: the first open after a develop plays the contact sheet developing into the album's first rows (2.95 s; fades under reduced motion), once per device, its tempo and easing as tokens.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on the-wait r2 (2026-10-04), to wire: arrival=in-place.** Read the board (`src/app/(dev)/design/sandbox/the-wait/develop.tsx`'s `InPlaceStage`, its frames) and `docs/reviews/the-wait.json`. The develop as the album's first load, 2.95 s: the contact sheet's squares flash and develop in the night's order (150 ms to 1.1 s); "Developing" turns to "Developed" at 1.25 s; the cover comes up out of its house light at 1.65 s; then the newest squares grow into the album's first rows (each tile starts on its measured square) while the rest sink and the well dissolves. Reduced motion: fades only. Its four states: the live first open, a return mid-way, reduced motion, and Monday's plain open (an album developed long ago opens plainly, never replaying).
- **The tempo and easing as tokens** (the brand round writes motion principles and may re-tune them in one change).
- **When it plays:** the first open after the develop, once per device; never again, never for an album that holds nothing back. Say in your Handoff how a second device and a return mid-play behave.
- **Ownership:** the guest album's files named in your owns. `src/components/ui/` is `graphite-wiring`'s; the hub's `event-feed/` and the guest page's reel gate are `hub-strip-wiring`'s: propose anything you need there through the Orchestrator.

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
