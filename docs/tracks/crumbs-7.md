---
track: crumbs-7
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The "N new" line: float it, or reserve its room?** Recommended and built: **float**, a glass pill over the grid's
  head that takes no room, so a room with nothing new looks exactly as it did. Reserve keeps his full-width line where
  he picked it with nothing ever covered, at the cost of a 38 px empty band under the header on every visit (drawn and
  measured: `_scratch/crumbs-7/reserve-idle-1440.png`, `reserve-idle-375-s.png`). The float's cost: while uploads wait
  it covers the top of the first row, at a phone the middle tile's check in select mode (`select-pill-375.png`). His to
  overrule; reserve is a few lines in `review-section.tsx`.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` Toasts: one ★ line, a toast is pressable over an open modal and a press on one is
  inside every layer (the band's own pointer events and the DismissableLayer branch), with the keyboard's gap.
- `docs/systems/host-app.md` Moderation: the keys line gains the peek's rule (a focused button keeps only Enter and
  Space; a pressed verdict hands focus back to the look); the live room's "a line above the grid" is now the pill that
  floats over its head and takes no room.

## Deferred (ROADMAP one-liners, bucket named)

- Now: a keyboard cannot reach a toast while a modal holds focus (Radix's trap pulls sonner's alt+T back into the
  modal, measured on the storage list; with no modal alt+T lands in the band), so the list's Undo is pointer-only while
  it is open.

## Handoff (replaces the chat report)

- **Commits:** `9761298f` (the five fixes, their pins, the two system-doc lines) and `d1d82b69` (the pill's words wear
  the glyph halo), pushed. No sync: launch-prep moved only by the record commit `5ee7525e` (STATUS.md,
  orchestrator.md). The head is this manifest's commit.
- **Gates on `d1d82b69`**, each its own exit code, logs in `_scratch/crumbs-7/gate2-*.log`: typecheck 0; lint 0 (0
  errors, 5 warnings, none in a touched file); test 0 (520 files, 5,853 tests); `zsh scripts/build-lock.sh pnpm build`
  0; `pnpm lab:smoke --base http://localhost:3131` 0 (224 checks, 0 failing). Also `lab:smoke --production --key`
  against a `next start` of 9761298f's code (one comment apart): 230 checks, 0 failing (`smoke-prod.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `sonner.tsx`, `sonner.test.tsx`,
  `review-keys.ts`, `review-section.tsx`, `review-room.test.tsx`, `entry-modal.tsx`, `entry-modal.test.tsx`,
  `help-center/dead-end.tsx`, the two `docs/systems/` files above, and this file. No exceptions: `popup.tsx` and
  `dialog.tsx` needed no edit, since the fix lives in the band every layer reads (their behaviour is pinned).
- **1, the toast over a modal (major):** `ui/sonner.tsx` gives the band `pointer-events: auto` and wraps it in
  `DismissableLayer.Branch` (`radix-ui/internal`), so a press on any toast is inside every Radix layer (every popup,
  the Dialog, the Sheet, the viewer, a menu). Pins in `sonner.test.tsx` on the real list popup (desk panel and hand
  screen) and the Dialog, each with a scrim press as the control; all four fail on HEAD's code. The Library's storage
  list, the red-team's steps: Undo takes and the list stays at 1440 (click) and 375 (touch taps), on dev and on the
  production build (`_scratch/crumbs-7/st-undo-run.sh <port> click|tap`; `st-toast-tap.png`); on HEAD's code the
  1440 run pressed `popup-overlay` and closed the list, nothing undone. Bundle: +159 B on the root layout
  (`entry-js.mjs` against the primary checkout's launch-prep build). The peek's Undo still works (it stays open). Read
  in code, not walked (no specimen, no staged rows): the claims review raises its error (with a close) and its "gone"
  toast while its panel is open, a list popup like the pinned one; the bulk bar's confirms raise theirs after closing.
- **2, the peek's keys:** a verdict pressed on the peek focuses the look (`review-section.tsx` `judge`), and
  `review-keys.ts` stands down for a focused button's Enter and Space only. Pins in `review-room.test.tsx` (both fail
  on HEAD). Chrome, 1440, dev and production: after a mouse Reject, Enter approved the next and, after a mouse Approve,
  Backspace rejected the next, focus on the look throughout.
- **3, the line:** floats in the one glass over the grid's head (`review-section.tsx`), its words in `GLASS_MARK_LIT`;
  tile boxes identical before and after an arrival at 1440 and 375 on dev and production (`rv-arrive.sh`,
  `prod-line-*.png`); a tap folds it in at the head; reduced motion shows it with no entrance. White on the pane
  measured 5.1:1 over the ceiling photo and 3.5:1 over the near-white sky, where its words wear the halo the system
  gives every mark on glass (`pill-bright-lit-zoom.png`).
- **4, the gate's line:** the sheet's description is the step's own "This album is just for the guests. One password
  and you're in."; `entry-modal.test.tsx` pins the door's accessible name and description to the visible heading's
  words (fails on HEAD).
- **5, lab:** `dead-end.tsx` draws plain anchors, as the board's other drawings do; on a production build the board's
  dead-end frames (1440 and 375) mounted and the only request to its path was the keyed document (`board-sweep.mjs`),
  no console entry.
- **The live pass waits for Will's Chrome** (as the brief says): on the alias as willg97, the storage list's Undo at
  1440 and 375, and in the Scale probe's Review a mouse Reject then Enter, and a real arrival's pill over a selection.
- **Assets requested from Will:** none.
- **Board ideas:** the Review room says "Review" twice at the top (the page's heading and the section's amber label
  over the grid); a keyboard way to a toast's Undo while a modal is open (the Deferred line) may want a design, not
  only a focus rule.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the line floats rather than reserving its room (the Question above); if it stands, the
  help's "a line above the queue" (`review-uploads-before-they-appear`, `bulk-select-and-batch-actions`) still reads
  true of a pill at the queue's head, one word from exact.
- **Look at first:** the storage list's Undo at 375 (`st-toast-tap.png`, then `st-undo-run.sh 7815 tap`), then the
  pill over a selection at 375 (`select-pill-375.png`) against the reserved band (`reserve-idle-375-s.png`).
