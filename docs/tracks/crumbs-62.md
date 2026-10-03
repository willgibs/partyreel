---
track: crumbs-62
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "83c1eefb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/server-pipeline
  - src/app/api/r2/complete-upload/
  - src/app/api/host/r2/complete-upload/
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-action-dock
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - docs/systems/disposable-mode.md
---

# lp/crumbs-62

**Goal.** Red-team 49's LOW and two NITs: a complete sent again for an upload already recorded answers its row at once and can never delete the files behind it; the door's upload step on a waiting album says what waits; the guest's Save names photos and videos.

## The brief

**Why.** Red-team 49 on build 49 (`e795ad07`) passed every walk. Its ledger is `../partyreel-wt/_scratch/redteam-49/ledger.txt`: grep it.

1. **LOW, read from the code: a re-sent complete can delete a recorded upload's files** (`server-pipeline.ts`, upload-meter's staging). A complete sent again for an existing row re-copies its files into `events/`, and a duplicate is recognised only at the insert, after every gate. If a gate changed since the first complete (the roll now full by that very shot, the album closed, the cap reached), the refusal withdraws the `events/` files behind the recorded row. Phones retry a request whose answer was lost, so the camera roll's last shot is the likeliest victim.
   - A complete for a media id whose row exists answers that row at once, before any gate, copy or withdrawal (idempotent, as `create_media` is).
   - A refusal never withdraws a key that a recorded row points to.
   - Red first: a test that records an upload, changes a gate, sends the complete again, and finds today's code deleting the files.
2. **NIT:** on a waiting album, the door's upload step tells a newcomer "Nothing here yet. Add the first photo." (`event-experience.tsx`, `albumEmpty={mediaCount === 0}`). An album with shots waiting is not empty: say what the waiting room says, from the same source (crumbs-61's `addWords` and the waiting count).
3. **NIT:** the guest's Save says "Save 15 photos" for 12 photos and 3 videos (`guest-action-dock.tsx`). It names what it holds through crumbs-57's `setNoun`.

`trash-in-storage` (running) may later touch the upload path for its room check: keep your change small and in place, and say in your Handoff exactly what changed in `server-pipeline.ts`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; red first for all three (logged); for 1, a real upload on localhost recorded, its complete replayed after a gate change, and its files still served (a capture and the R2 listing).

## Where I am

- Item 1 built and green at `0272498c` (unit + live on :3133): reds in `_scratch/crumbs-62/red-item1.log` and
  `red.json` (today's code deleted a recorded row's files on a byte-for-byte replay after the album closed, and on a
  stranger's dead-ticket replay); greens in `green-item1.log` and `green.json`.
- Items 2 and 3 built and green (reds `red-item2.log`, `red-item3.log`; greens `green-item2.log`, `green-item3.log`).
  Next: live looks at 2 and 3 on :3133, the system doc, the gate, the Handoff.

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
