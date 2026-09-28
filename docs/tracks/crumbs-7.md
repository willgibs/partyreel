---
track: crumbs-7
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "dc1b0eea"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/popup
  - src/components/ui/sonner
  - src/components/ui/dialog
  - src/components/app/event-feed/review
  - src/components/app/event-feed/use-review-triage
  - src/components/guest/entry-modal
  - src/app/(dev)/design/sandbox/help-center/dead-end.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/host-app.md
---

# lp/crumbs-7

**Goal.** Fix build 14's red-team findings at their source: a toast's Undo unreachable while a modal list is open, the review peek's keys after a mouse verdict, the "N new" line moving the grid, the password gate's stale screen-reader line, and a lab board's keyless prefetch.

## The brief

The build-14 red-team walked the Library specimens (Chrome was not connected, so the live host pass waits). Its findings, each with its evidence in `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-14/ledger.md`:

1. **Major: a toast's Undo cannot be pressed while a modal list is open.**
   - **Where:** the storage list: open it, tick two, press "Remove to Deleted", then press Undo on the toast.
   - **At 1440** the press lands on the list's overlay and closes the list; nothing is undone. The modal sets body `pointer-events: none`, and the root Toaster (`src/app/layout.tsx` via `src/components/ui/sonner.tsx`) inherits it. A second press after the list closes does undo, if still within the 6 s.
   - **At 375** the tap passes through the toast to the event chip under it, switching the filter, and Undo never fires.
   - **Fix it at its source, for every modal:** the toaster takes pointer events above an open modal's overlay, and the popup primitive (`popup.tsx` and the Dialog under it) treats a press inside the toaster as inside, never an outside press that dismisses.
   - The review peek is non-modal, and its Undo already works; keep it so.
   - Pin both halves with tests, and check every modal that raises a toast with an action (the claims review's panel, the size list, the bulk bar's confirms).
2. **The review peek's keys after a mouse or tap verdict.**
   - After Reject is pressed with the mouse, focus stays on that button, so Enter presses it and rejects the next upload; Backspace and Delete do nothing.
   - `review-keys.ts`'s `if (inPeek && target?.closest("button")) return;` returns for every key, not only Enter and Space as its comment says.
   - The help promises the peek's keys decide it: after a verdict, focus belongs on the look, and the guard stands down only where a button's own key would act.
3. **The "N new" line pushes the review grid down 38 px** as it appears (1440: tiles 118 to 156; 375: 98 to 136). Will's `arrivals=prompt` pick promised nothing moves under a selection. The line must not move the tiles: reserve its room, or float it.
4. **The password gate's screen-reader description** still says "Enter the event password to view it." (`entry-modal.tsx`) where the visible line is voice-guest's `ask=warm` ("This album is just for the guests. One password and you're in."). Make them one.
5. **Lab only:** help-center's board's `dead-end.tsx` draws `<Link href="#">`, which prefetches `/design/lab/help-center` without `?key=` and 404s once in the console. A drawing's dummy link should not prefetch.

**Verify:**
- Vitest pins for 1 and 2.
- The Library's storage-list and review-section specimens at 1440 and 375, repeating the red-team's steps.
- `pnpm lab:smoke` whole.
- The live pass waits for Will's Chrome.

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
