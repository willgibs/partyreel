---
track: crumbs-61
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "015ff8e6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-live
  - src/lib/events/dates
  - src/lib/guest/refresh-coalescer
  - src/lib/guest/use-gallery-doorbell
  - src/components/guest/gallery-empty-state
  - src/components/guest/event-experience.tsx
  - src/lib/guest/camera/words
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/disposable-mode.md
  - docs/systems/dashboard.md
  - docs/PRICING.md
---

# lp/crumbs-61

**Goal.** Red-team 48's three LOWs and three NITs: one link minted once for a guest's own upload; a range keeps its length when its start moves; Develop now reaches every guest together; the waiting sheet's footer at 375; the real guest page's Add says a newcomer's words; the guest album names what it holds.

## The brief

**Why.** Red-team 48 on build 48 (`26f14c6b`) found no MEDIUM. Its ledger is `../partyreel-wt/_scratch/redteam-48/ledger.txt`: grep it for each item's steps, never read it whole.

1. **LOW: a guest's own upload mints its link twice.** A links call runs beside the sync that already carries the link: 40 links calls for 20 photos (`gallery-live.tsx`'s `notifyUploaded` against `album-wire-carry.ts`, album-calm's). One link for one photo, and the cost line it saves goes in your Handoff.
2. **LOW: moving a range's start a year earlier keeps the old end.** 2027-10-05 to 09 became 2026-10-05 to 2027-10-09, 369 days (`endForNewStart`, `src/lib/events/dates.ts`). The end follows the start by the range's length as last saved, in both directions.
3. **LOW: Develop now reaches each guest on her own 15 s beat** (+0.38 s, +0.84 s and +7.2 s after the host), so crumbs-57's "in the same second" no longer holds; each screen stays consistent. A develop is one moment, never a stream: ring it at once if the doorbell can tell it from an arrival without a migration. If it needs one, write it for the Orchestrator under `supabase/migrations/20261003211000_`, or leave it as a Question with your recommendation.
4. **NIT: the waiting sheet's footer wraps badly at 375** with a "tomorrow" develop time (`gallery-empty-state-sheet.tsx` and its css).
5. **NIT: a guest who joined an empty album keeps "Take the first photo"** after others' shots are waiting. The real guest page (`event-experience.tsx`) adopts `addWords` (`lib/guest/camera/words.ts`, crumbs-57's), so it and See it as a guest say one thing. That also retires its ROADMAP line.
6. **NIT: the guest album says "12 photos & videos"** on a photos-only album, while the host's Download panel says "12 photos" (crumbs-57's `setNoun`). The guest's count names what it holds, from one home.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; red first for 1, 2, 3, 5 and 6 (logged); captures at 375 for 4, 5 and 6; for 1, the links calls counted for one guest's 5 uploads before and after.

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
