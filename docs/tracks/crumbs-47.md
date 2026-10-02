---
track: crumbs-47
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "26743369"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/popup.tsx
  - src/components/ui/popup.test.tsx
  - src/components/ui/popup-kinds.ts
  - src/components/ui/popup-back
  - src/components/shared/masonry.tsx
  - src/components/shared/masonry.test.tsx
  - src/components/guest/guest-upload
  - src/lib/guest/use-upload-queue
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/social/guest-peek.tsx
---

# lp/crumbs-47

**Goal.** Two guest LOWs from build 38's red-team: Back over a credit's look closing the viewer with it, and the old failure sheet reopening after the flip.

## The brief

Two ROADMAP Now lines from build 38's red-team. Read each there whole, start each with a test that is red on today's code, and name both in your Handoff for the record.

1. **Back over a credit's look** (ROADMAP: "on a phone, Back over a credit's look closes the look AND the viewer in one press"). The look (kind `peek`, a sheet in a hand) takes no Back entry: `popup.tsx` takes one only for the screen and cover shapes, while `masonry.tsx`'s `standsOnAPopup` expects a screen-shaped look. Back should close the look, then the viewer.
2. **The flip's stale sheet** (ROADMAP: "after the flip … the next run's end reopens the OLD failure sheet"). The re-gate never dismisses the refused item, and `guest-upload.tsx` reopens the sheet at any run's end while an item is in error.

**Boundaries.** Tonight's identity board draws `src/components/ui/`, and other boards draw the guest screens. Fix behavior only: change no look, so no board's drawing moves.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; a test red on the old code for each; `pnpm lab:smoke --base http://localhost:3136`; name the phone Back walk and the flip for the next build's red-team in your Handoff.

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
