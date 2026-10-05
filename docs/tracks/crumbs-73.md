---
track: crumbs-73
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "63757567"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-hub-head-cover.tsx
  - src/components/app/event-feed/hub-develop
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/gallery-empty-state-sheet.tsx
  - src/lib/disposable/contact-sheet-develop.ts
---

# lp/crumbs-73

**Goal.** Two ROADMAP crumbs: the host's hub develops too (her first open after the develop develops the cover in place, as her guests' album does), and how-it-works' Create picture draws four hairlines at the look.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours.

**The fixes:**
1. **The hub develops too.** This is the-wait board's carried `hub` call, deferred by arrival-wiring (merged). Her hub's cover is the guests' sheet, so her first open after the develop develops it in place.
   - Mount `DevelopSheet` (`src/components/guest/gallery-empty-state-sheet.tsx`, a read: import it, never fork it) over `event-hub-head-cover.tsx`, once per phone, with the same mark rules arrival-wiring wrote for guests (`docs/systems/disposable-mode.md`).
   - A host who opened the hub during the wait sees the develop on her next open after it, never twice.
   - Reduced motion lands developed at once.
   - Pin it with a test.
2. **Marketing:** how-it-works' Create picture (`host-pictures.tsx`) draws three hairlines at the look; the room has four since the add step (styles-wiring). Draw four.

Wiring rigor: the whole gate (`lab:smoke` covers the Library and marketing). Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end).

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
