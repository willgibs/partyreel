---
track: crumbs-5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e0cb8458"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/popup
  - src/components/app/event-settings/event-settings-sheet
  - src/components/shared/media-lightbox-parts/actions
  - src/components/shared/media-lightbox-parts/purge-confirm
  - src/components/guest/guest-name-step
  - src/components/social/profile-actions-menu
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
  - src/components/ui/popup-kinds.ts
  - src/components/app/dashboard/claims-review.tsx
---

# lp/crumbs-5

**Goal.** Build 12's red-team minors: focus comes back inside the layer when a confirm opened from it closes, the line under a guest's name reads smaller than its field at every width, and the profile's ⋯ menu fits "Report this person" on one line.

## The brief

Build 12's red-team (2026-09-28) found, each minor:

1. **B1, focus after a stacked confirm** (keyboard and screen-reader users): when a confirm opened from inside an open layer closes, focus lands on the page BEHIND that layer. Steps: Settings (a panel), type in Event name, Escape, Keep editing; and the scale probe hub, View, Deleted, open an item, Delete permanently, Cancel (at a desk and at 375). Expected: focus back inside the layer (the field, or the viewer's Delete permanently). Actual: the hub's Settings link, the "View photo" tile or the toolbar's View, behind the still-open panel or viewer. The red-team's reading of the cause: `PopupContent`'s `onCloseAutoFocus` (`src/components/ui/popup.tsx`) falls back to `lastOnPage`, which skips anything inside a layer, whenever the popup's root is not a Popup with a PopupTrigger: the controlled discard Popup (`event-settings-sheet.tsx`) and the plain `Dialog`/`DialogTrigger` around `PurgeConfirmContent` (`media-lightbox-parts/actions.tsx`). The claims review's Not mine dialog avoids it with its own `onCloseAutoFocus` (`src/components/app/dashboard/claims-review.tsx`, a read). Fix it at the source so a stacked popup gives focus back to the control inside the layer that opened it (the one table's `stacked` rule, `design-system.md`), and pin both cases.

2. **B2, the line under her name**: Will's `identity-door` r3 note, "Since this is a small note, the font size should be smaller on this line." At a desk "You can change it anytime." is 14px and so is the field, so it does not read smaller; it is smaller only in a hand (the field 16px there). Make it one step under the field at every width (`guest-name-step.tsx`'s hint), and say the sizes.

3. **The profile's ⋯ menu** (older than batch 5): on `/u/<slug>` the menu is 128px wide, so "Report this person" wraps onto two lines (`social/profile-actions-menu.tsx`): let it fit its longest row.

Verify: B1 with the keyboard at a desk and at 375 (focus lands on the opener inside the layer, both cases), B2 at 375 and 1440 (computed font sizes), the menu at 375 and 1440; `pnpm lab:smoke` whole.

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
