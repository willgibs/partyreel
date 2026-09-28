---
track: crumbs-5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Commit, pushed on `lp/crumbs-5`**: base `9ee028ea` (`origin/launch-prep`'s tip at boot, unchanged since —
  `git log --oneline 9ee028ea..origin/launch-prep` is empty at handoff, so no sync commit exists or is needed). The
  work commit, `661d8a16`, sits directly on it. The head is in the chat line.
- Every claim below names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- **Gates on the synced tree at `661d8a16`**, each its own exit code, logs in `../partyreel-wt/_scratch/crumbs-5/`:
  `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0 (`lint.log`: 0 errors, the 5 standing warnings, none in a
  touched file); `pnpm test` 0 (`test.log`: 510 files, 5720 tests); `zsh scripts/build-lock.sh pnpm build` 0
  (`build.log`); `pnpm lab:smoke --base http://localhost:3131` 0 (`lab-smoke.log`: 244 checks, 0 failing;
  `dev-server.log` in the same folder is the server it and the live checks below ran against).
  **Live, on the real components:**
  - B1, the viewer's Delete permanently, on `/design/album-scale?surface=host&key=<DESIGN_PREVIEW_KEY>` (the scale
    probe hub, the real `EventGallery`/`ActionCapsule`/`PurgeConfirmContent` over a fake server): Remove an item
    from All, View, Deleted, open it, Delete permanently, then both Cancel (click) and Escape (keyboard) — each
    time `document.activeElement` is the Delete permanently button, the viewer still open behind it, never the
    page's View tile or toolbar. Checked at 1440; not re-checked at 375 (see Calls his to overrule).
  - B1, the Settings panel's Event name field: NOT reachable live (`/dashboard/[eventId]/settings` needs a
    signed-in host; the account chooser here is a real Google credential prompt, no cached session — see Calls
    his to overrule). Covered instead by `popup.test.tsx`'s new first case, which reproduces
    `event-settings-sheet.tsx`'s exact shape (the same `requestClose` guard body, a controlled Popup with no
    trigger holding a field, a second controlled Popup with no trigger raised from inside it), and by the same
    source fix proven live in the viewer case above.
  - B2, `guest-name-step.tsx`'s hint, on `/design/lab/tools/keyboard-sheet?key=<DESIGN_PREVIEW_KEY>` (the real
    component, the Name tab): computed `font-size` at 375 is 14px (hint) / 16px (field); at 1440, 12px (hint) /
    14px (field) — one rung under the field at both widths now.
  - The profile menu, measured against the app's own compiled stylesheet (not the sandbox's `profile-page` board,
    which draws its own decorative mock, not `ProfileActionsMenu` — see Calls his to overrule): the real
    `DropdownMenuContent`/`DropdownMenuItem` classes at the reported 128px wrap "Report this person" onto two
    lines (the text node's `getClientRects()` returns two distinct `top`s); at `w-56` (224px) it returns one.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): exactly the four owned files touched
  (`src/components/ui/popup.tsx`, `src/components/ui/popup.test.tsx`, `src/components/guest/guest-name-step.tsx`,
  `src/components/social/profile-actions-menu.tsx`) plus this manifest. B1's fix landed entirely at its source in
  `popup.tsx`; `event-settings-sheet.tsx`, `media-lightbox-parts/actions.tsx` and `purge-confirm.tsx` (also owned,
  granted for a per-caller fix) needed no changes.
- **The items:**
  - B1 (focus after a stacked confirm): fixed at its source (`popup.tsx`'s `watchTheOpener`), covers both named
    callers without touching either.
  - B2 (the name hint's size): `guest-name-step.tsx`, one class added.
  - The profile menu's width (older than batch 5, no ROADMAP line naming it): `profile-actions-menu.tsx`, one
    class added.
  - No ROADMAP line closes: this lane's three items came from `orchestrator.md`'s own pickup table and the
    manifest's brief, not a ROADMAP entry.
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `popup.tsx`'s fix narrows what counts as an "ephemeral" layer (excluded from where focus returns) from
    `dialog, alertdialog, menu, listbox` to just `menu, listbox`: a dialog or a sheet stays mounted behind whatever
    opens over it, so its own control is a real, stable return target, where a menu row or a listbox option is not
    (selecting one closes it as a side effect of the very interaction that opens the next popup). Picked over an
    explicit stack-tracking primitive because the existing single `lastOpener` ref, captured per-popup at open
    time into its own `returnTo` ref, already generalizes to any nesting depth (traced by hand for three levels:
    each `PopupContent` instance freezes its own return target independently). Overrule if a future popup role
    this heuristic gets wrong (a popover, a tooltip) surfaces — extend the exclusion set there rather than
    reopening this one.
  - `w-56` for the profile menu: the width every other icon-triggered `DropdownMenuContent` in the app already
    uses (`user-menu.tsx`, `view-menu.tsx`, `guest-account-menu.tsx`, `clip-tray.tsx`, `admin-nav.tsx`), rather
    than a narrower value computed just for "Report this person". Overrule for a tighter custom width if 224px
    ever crowds something beside it.
  - Neither un-reachable live path above (the Settings panel behind sign-in; the sandbox board's decorative mock)
    was pushed further: no password or OTP was typed at the Google prompt, and the sandbox's `Acts` component was
    left as its own hand-drawn stand-in rather than rewired to the real `ProfileActionsMenu`, both outside this
    lane's owns. Overrule if either is worth Will's ten seconds instead.
  - I did not touch `docs/systems/design-system.md`'s line on this default ("a popup with no trigger of its own
    gives focus back to the page control that opened it"), even though the fix makes it incomplete (it now also
    covers a stacked popup's own still-open layer): it is this lane's read, not owned. See Look at first.
- **Look at first:** `src/components/ui/popup.tsx`'s `EPHEMERAL_LAYER`/`lastOpener` (renamed from `LAYER`/
  `lastOnPage`) and the two new pinning tests in `popup.test.tsx`; then `docs/systems/design-system.md`'s line
  above (in `src/components/ui/popup-kinds.ts`'s "one table" paragraph) for a one-line refinement saying a stacked
  popup returns focus inside its layer, not only to the page. Also: ROADMAP's "the overflow menu opens over the
  person's own name at 375" names a different, still-open complaint (position, not width) on the file this lane's
  `w-56` also touches — worth knowing before that line is picked up, since the two could interact.
