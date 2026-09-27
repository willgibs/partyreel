---
track: popups-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/floating-layer
  - src/components/ui/confirm-switch
  - src/components/ui/popover.tsx
  - src/components/ui/dropdown-menu
  - src/components/ui/popup
  - src/components/ui/responsive-menu
  - src/components/admin/
  - src/components/app/account-delete-card
  - src/components/app/event-feed/bulk-bar
  - src/components/app/event-feed/launch-list
  - src/components/app/event-settings/
  - src/components/app/event-slug-control
  - src/components/app/export/
  - src/components/app/pricing/
  - src/components/app/qr-designer-dialog
  - src/components/app/share/
  - src/components/app/event-card-qr
  - src/components/app/recently-deleted-grid
  - src/components/shared/media-lightbox-parts/purge-confirm
  - src/components/social/
  - src/components/guest/report-dialog
  - src/components/guest/guest-share
  - src/components/guest/upload/intent-sheet
  - src/components/guest/upload-tracker
  - src/lib/guest/confirm-beat
  - src/components/reel/clip-finish
  - src/app/(dev)/design/sandbox/popups/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/popups.json
  - docs/systems/design-system.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/popups-wiring

**Goal.** The popups board's eight answers built at their source: each popup names its kind and one table gives the Dialog and the Sheet their surface, so lists open in a side panel, confirmations and forms in centred dialogs (keyboard-safe), choices in a menu at the button, every share in the code card behind an Invite, plans in a wide stacked dialog, settings in an unfocused side panel and a name's peek in a card; then the popups board retires.

## The brief

**His answers** (`docs/reviews/popups.json`, r1; each option drawn on `src/app/(dev)/design/sandbox/popups/`, its `lands` line the spec; every answer confirms the board's recommendation):
- `lists=panel`: a side panel beside the screen at a desk; in a hand its own screen under a back arrow, the phone's Back closing it. The guest list (`profile-page`'s view-all moved here), her uploads (the tracker, `upload-tracker.tsx`), and the storage list when it exists. The claims review is `claims-wiring`'s, cut after you merge: leave `claims-card.tsx` alone and make the panel easy for it to take.
- `confirm=dialog`: a centred dialog sized to what it says, wider when it lists what leaves, above the keyboard when it holds a field. His note: "These are all rarer destructive actions, so a focused confirmation over an undo is far more helpful." The admin's destructive sheet (`src/components/admin/`), Block, the bulk bar, the purge confirm, account deletion (its password field keyboard-safe: today it sits under an iPhone keyboard).
- `forms=dialog`: a small centred dialog in what the keyboard leaves: Report (the event), Report a person (today under the keyboard too), and the told name's Change from the toast (`src/lib/guest/confirm-beat.ts` today opens the name door's `account` mode: open a small name form instead; the in-card Change stays in place).
- `choices=menu`: at a desk the choices open under the button that asked, like any menu; in a hand they rise to the thumb as the phone's own chooser does, Cancel beneath. Add photos (`guest/upload/intent-sheet.tsx`), Download (`app/export/`), the code's style (`app/qr-designer-dialog.tsx`, which gains the Cancel it lacks).
- `share=card`: the event's code card is every share's first surface (the code filling a phone in white, a 384 card at a desk, Copy and Share under it). His note: "this screen could be opened by an 'Invite' button (could also build in a way to directly invite guests somehow), then 'Share' opens the share sheet as users expect." So the entry reads **Invite** wherever a host or guest opens it (`app/share/`, the dashboard's and hub's share entries, `guest-share.tsx`), the card's **Share** opens the phone's own share sheet (`navigator.share`, Copy where it is missing), and the full kit waits one tap behind Everything (`kit`). Direct invites are NOT this lane's (his call, 2026-09-27: a later board).
- `plans=wide`: a wide dialog at a desk, its own screen in a hand. His note: "it'd likely make more sense to stack this rather than a 2col row to give the plan features more room without tight line breaking." So the plans stack (`app/pricing/pricing-sheet.tsx` and its nine triggers, their headlines unchanged).
- `settings=panel`: the side panel at a desk, its own screen in a hand, the discard question a centred dialog over it. His note: "Let's not open focused, so more settings are visible and one tap away rather than always having to escape typing in the event name input." (`app/event-settings/`.)
- `peek=card`: a name's look opens as a card beside the name at a desk (as the Unverified mark's card does), the Sheet in a hand (`src/components/social/`).

**The carried calls, all kept** (on the board): `one-table` (each popup names its kind; one table beside `floating-layer.ts` gives the Dialog and the Sheet the surface: offer the fix at its source, so a later answer changes one row), `keyboard-dialog` (the Dialog learns the Sheet's keyboard rule), `stacked` (a confirmation or form over a popup is a centred dialog; a plan or another place replaces it in a hand, and Back returns), `kit`, `failure-sheet` (the upload failure sheet opens by itself; it stays), `left-alone` (the door's held sheets, the viewer, the reel and clip maker, menus, search, the photo cropper and Welcome to Pro stay), `two-kinds`.

**Out of this lane:** the door and its held sheets (lit; `door-r3-wiring` is changing the door now), the claims card (`claims-wiring`), marketing (`demo-doors`). The clip's "Add to event" (`reel/clip-finish.tsx`) gains the close it lacks (ROADMAP's line).

**Then retire `popups`** in your branch, one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`: named exceptions; `95c8aa56` is the template). Doc lines for `design-system.md` (the floating layer's kinds), `host-app.md` and `guest-flow.md` in the Handoff.

**Verify:** every migrated popup at 375 and 1440 with the keyboard up where a field is focused (local; the signed-in surfaces as far as they run locally, the rest for the red-team), Escape and Back, focus in and back out; `pnpm lab:smoke` whole.

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
