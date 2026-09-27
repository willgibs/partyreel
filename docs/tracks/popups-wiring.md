---
track: popups-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is Will's to overrule.

- **Her picks' review, now that Add photos is a menu.** The picker used to return into the same sheet; a menu is gone
  by the time the files come back. Recommended and built: "Send these 3?" opens as a confirmation (a centred dialog,
  `md`, the app asking before it acts), and taking out the last pick asks the two rows again. Overrule: the review as
  a list panel.
- **The look without its album strip, for now.** The board's look carries what they added to this album (a count and
  four pictures) and a page's events; the guest list carries neither, and the read (approved uploads by guest row or
  account in this event, presigned, gated like the album; a page's shown events) lives in `src/lib/db/` and a route,
  outside this lane. Recommended and built: every name opens the look now (face, name, Unverified mark or "Confirmed
  their email" or the handle, the host's address, Follow, Open full profile), and the strip is a follow-up lane's
  (Deferred; `social/guest-peek.tsx` is built for it to slot in under the name). Overrule: hold the look until the
  strip lands.
- **Download, a row is the act.** Everything, Photos or Videos starts at once, each row carrying its count and size
  and a row over the export limit unpressable with the note saying why; there is no second look before a many-gigabyte
  zip. Recommended: yes (the answer's own "a row is the act"). It also answers `export-flow`'s open `object` ask
  ("a sheet of bundles, or simply start?") with that board's `menu` option: reshape or retire the ask at the desk.
- **The dashboard's QR chip opens the card where it stands.** Recommended and built: the code card on the dashboard,
  Everything taking the host to the event's kit (`?room=share`), so a host at a door holds the code up without
  leaving the dashboard. Overrule: the chip goes to the event and opens the card there.
- **The kit takes the settings kind** (the carried call `kit`: "in whatever settings gets"): a panel beside the album
  at a desk, the whole screen in a hand under a back arrow reading "Back" (its title already names the event).
- **The Dialog primitive's focus.** `DialogContent` (the surfaces left alone: Welcome to Pro, the cropper, the
  viewer's two questions, the claims card, the Like door, the demo modal) learned the Sheet's keyboard POSITION rule,
  inert without a focused field; its focus is left as it was so door-r3-wiring's dialogs do not move under it.
  Recommended: the phone focus rule stays the kinds' (`PopupContent`).

## System-doc edits (in place, owned facts only)

The three docs are this lane's `reads`, so the lines are here for the Orchestrator to apply in place:

- `design-system.md`, "The floating-layer contract", a new bullet after the ONE responsive Sheet's: "**Every popup
  names its kind** (`ui/popup-kinds.ts`, the one table: list, confirm, form, choice, share, plan, settings, peek, each
  with a desk shape and a hand shape), so a later answer on a kind is one row. `PopupContent` (`ui/popup.tsx`) wears
  the Dialog's and the Sheet's shapes from `floatingPopupShapes` (a desk's dialog, wide and panel; a hand's dialog,
  screen, cover and sheet), each scoped to the `data-shape` the element sets for the width it opens at; the own shapes
  are `ui/responsive-menu.tsx` (a menu at the button, rows at the thumb with Cancel beneath, a row is the act), the code
  card (`app/share/code-card.tsx`) and the look (`social/guest-peek.tsx`). A bare `SheetContent` or `DialogContent` is
  a surface the board left alone, named with why in `popup-kinds.test.ts`. ★ Every shape stands on the keyboard (the
  Dialog learned the Sheet's rule; a centred shape's `top` is `var(--vv-top) + var(--vv-h) / 2`, exactly `top-1/2`
  with nothing written). ★ A screen or a cover in a hand is a place the phone's Back closes (`ui/popup-back.ts`: one
  same-URL history entry, its marker a field on the state Next merges, taken back one tick late so StrictMode's double
  effect cannot close it), unless its page already routes it (`routed`, `?room=`). ★ In a hand focus lands on the
  popup itself; at a desk the row's `deskFocus` says; a popup with no trigger of its own gives focus back to the page
  control that opened it. ★ Size a dialog with `size`, never a width class: the shape's scoped rule outranks a plain
  utility."
- `design-system.md`, the ONE responsive Sheet's bullet: its list becomes "the guest's door and its held sheets and the
  upload failure sheet wear it; every other popup opens through its kind."
- `host-app.md`: "Settings and Share are sheets" becomes "Settings and the share kit are places in the settings kind (a
  panel at a desk, the whole screen in a hand)"; the "Share is the one sharing surface" bullet becomes "**The code card
  is every share's first surface** (`share/code-card.tsx`: the code on white filling a phone, a 384 card at a desk,
  Copy link, the device's own Share where it has one, and Everything into the kit, `share/event-share-sheet.tsx`, which
  holds the downloads, the designer and the custom link). Every door to it reads Invite: the header's code, the sticky
  row's pill, the launch list (`share/invite-button.tsx`) and the dashboard card's QR chip, which opens the card in
  place. ★ Never draw the code in a second sharing surface." ; "the designer lives in the share sheet" becomes "the
  designer is the kit's Customize, a menu whose style is the act (`qr-designer-dialog.tsx`)"; and "the settings sheet"
  in the create path's bullet becomes "Settings".
- `guest-flow.md`: `GuestShare` "is the Invite trigger + sheet (QR + Copy + native Share + Download)" becomes "is the
  Invite trigger onto the event's code card (the code, Copy link, the phone's own Share, Download)"; "THE GUEST'S
  OVERLAYS WEAR THE ONE RESPONSIVE SHEET" becomes "the door and its held sheets and the failure sheet wear the
  responsive Sheet; every other guest popup opens through its kind (Invite the code card, Report a form, her uploads a
  list, Add photos and Download a choice)"; THE ADD SHEET becomes "THE ADD CHOICE (`upload/intent-sheet.tsx` on the
  responsive menu): two rows and the terms, the two hidden inputs in the page beside the menu, where they outlive it,
  each still `.click()`ed synchronously from its row's tap", and THE REVIEW STEP "opens as a confirmation (a centred
  dialog) once the picker answers; taking out the last pick asks the two rows again"; the told name's Change "opens a
  small name form (`lib/guest/confirm-beat-name.tsx`, the account's own write), no longer the name door's `account`
  mode".

## Deferred (ROADMAP one-liners, bucket named)

- Profiles and social: the look's strip (a name's count and four of its pictures in this album, and a page's shown
  events) needs a read by guest row or account, presigned and gated like the album; `social/guest-peek.tsx` takes it
  under the name.
- Help-sync, sharing and downloads: `send-the-event-link` ("Open Share and tap the copy button"),
  `download-photos-videos-and-albums` (the Download dialog is a menu whose row is the act, each bundle with its count
  and size) and `your-event-page-explained` (the sticky pill reads Invite) describe the old surfaces.
- The Library: no specimen for the popup kinds (`PopupContent` per kind, the responsive menu, the code card, the
  look); its Sheet and Dialog specimens predate the table.
- Code hygiene: `DestructiveSheet` and `GuardedSwitch`, `PricingSheet`, `QrDesignerDialog`, `ExportDialog`,
  `UploadIntentSheet`, `EventShareSheet` and `EventSettingsSheet` name surfaces they no longer are (renames are a line
  per caller for their next owners); stale comments in `guest-action-dock.tsx` (GuestShare "owns a Sheet") and
  `entry-shell.tsx:109`; `create-flow.test.tsx`'s "the card chip goes to the sheet" (it opens the card, and still
  links the kit through Everything).
- Guest door: its `account` name mode has no caller since the told name's Change opens the small form
  (`entry-modal.tsx`'s `openToName("account")`, `guest-name-step.tsx`).
- The real-device pass: on an iPhone, Add photos' rows open the picker from inputs parked in the page (verified in
  Chrome by instrumenting the click, never on Safari), and the keyboard-safe dialog lifts over a real keyboard
  (account deletion's password, Report a person, the told name).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/popups-wiring`** (base `ebfb1581`): `5f5e639b` the wiring; `656664f7` focus finds its way
  back and three polish fixes; `2d26516f` retire-popups (one commit: the folder and its lines in `registry.ts`,
  `boards.ts`, `touchpoints.ts`); `6fedaa2f` the sync (merge of `origin/launch-prep` at `b463f23e`: demo-doors'
  demo modal rides the Dialog, so the table's scan names it); `f999ad6f` the QR help article. The head is in the chat
  line.
- **Gates on the synced tree at `f999ad6f`**, each its own exit code, logs in `../partyreel-wt/_scratch/popups-wiring/`:
  `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, the 5 standing warnings, none in a touched file); `pnpm test` 0 (505
  files, 5652 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (247
  checks, 0 failing); `/design/lab/popups` 404s.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths, this file, the retirement's three
  named files, and five exceptions: `event-feed/event-cards-row.tsx` (one line: the sticky pill reads Invite, one of
  the hub's share entries); `guest/event-experience.tsx` (the toast's Change calls `openToldNameChange`, the page
  mounts `ToldNameForm` beside the Report footer so a rename patches her tiles at once, and the comment that named
  the door's mode); `guest/guest-upload.test.tsx` (an expired premise: the inputs lived inside the sheet);
  `marketing/mock-parity.test.ts` with `marketing/sections/features/qr/preset-switcher.tsx` (the app has no "Save QR
  style" to quote, so the mock's Save and its parity pair went); `content/help/customize-and-share-your-qr.mdx`
  (`help-ui-labels.test.ts` failed once the retired board stopped carrying "Save QR style"; the article now follows
  the card and the menu).
- **The items:**
  - The one table: `ui/popup-kinds.ts` (eight kinds, a desk and a hand shape each, `deskFocus`), `ui/popup.tsx`
    (`Popup`, `PopupContent kind=`, `PopupHeader` / `PopupBody` / `PopupFooter`), the shapes in `floatingPopupShapes`
    (`floating-layer.ts`), the phone's Back in `ui/popup-back.ts`; pinned by `popup.test.tsx`, `popup-kinds.test.ts`
    (which also refuses a new bare Sheet or Dialog) and `floating-layer.test.ts`.
  - `keyboard-dialog`: `ui/dialog.tsx` wears the `dialog` shape and `useKeyboardInset`, and scrolls inside itself
    when taller than the screen; `size` replaces width classes.
  - `lists=panel`: her uploads (`guest/upload-tracker.tsx`) and the guest list's faces row (`social/guest-list.tsx`,
    still a page of 24 at a time) open in the list kind; a screen in a hand pushes one history entry and Back closes
    it (verified: the browser Back closes it without a reload, the arrow pops its entry).
  - `confirm=dialog`: the admin's `DestructiveSheet` and `GuardedSwitch` (`md`), Block, the bulk bar, the purge
    confirm, account deletion (`md`, keyboard-safe, unfocused on a phone), the event delete, the discard question,
    the confirm switch, both slug controls and the clip's Add to event, which gains its close.
  - `forms=dialog`: Report (`guest/report-dialog.tsx`), Report a person, and the told name's Change as a small form
    (`lib/guest/confirm-beat-name.tsx`, `updateDisplayNameAction`).
  - `choices=menu`: `ui/responsive-menu.tsx` (a Popover under the button at a desk, anchored to the pressed control
    when the page owns the buttons; rows and Cancel at the thumb in a hand; arrow keys; focus back to the opener);
    Add photos (`upload/intent-sheet.tsx`, its review a confirmation), Download (`export/export-dialog.tsx`, a row per
    bundle with its count and size, Include hidden as a toggle), the code's style (`qr-designer-dialog.tsx`, a 2x2 of
    real codes at a desk, rows with the current checked in a hand, Cancel beneath).
  - `share=card`: `share/code-card.tsx` is every share's first surface (host: Copy link, Share, Everything; guest:
    Copy link, Share, Download; Share only where the device has a share sheet); the hub's modal is its wiring
    (`share/event-code-modal.tsx`, the morph kept), the guest's Invite opens it, the dashboard chip opens it in place,
    the launch list's door is an Invite (`share/invite-button.tsx`), the pill reads Invite; the kit
    (`share/event-share-sheet.tsx`) takes the settings kind behind Everything.
  - `plans=wide`: `pricing/pricing-sheet.tsx` is the plan kind (a 576 wide dialog at a desk, a cover in a hand that
    Back closes, over Settings too), its plans stacked, the held plan's "Your plan" beside its name, headlines and nine
    callers unchanged.
  - `settings=panel`: `event-settings/event-settings-sheet.tsx` is the settings kind, routed, opening unfocused at every
    width; the discard question a centred dialog over it.
  - `peek=card`: every name in the guest list opens `social/guest-peek.tsx`, a card beside the name at a desk and the
    Sheet in a hand (the strip is the first Question).
  - Verified at 375 and 1440 on a scratch harness mounting the real components and on the local demo album (Add
    photos → review → Send landed a tile; Invite's card at both widths), light and dark: shapes, focus in (panel in a
    hand, the first control or the panel at a desk per kind) and back out (Escape, the arrow, the scrim), the phone's
    Back, and the keyboard band's arithmetic by writing `--vv-h` on the dialog (centred at 210 in a 420 band, capped
    at 388, the body scrolling). The signed-in hub, dashboard, account and admin surfaces ran only as mounted
    components: their live pass is the red-team's.
- **Assets requested from Will:** none.
- **Board ideas:** a Library round for the table (each kind's shapes side by side at 1440 and 375, the keyboard up);
  the viewer's two questions (`media-lightbox-parts/actions.tsx`), the claims card and the demo modal onto their kinds
  (each named in `popup-kinds.test.ts`).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Roadmap lines this closes:** "Shared: `DialogContent` has no overflow scroll and no keyboard rule ...", "Shared:
  when `popups` is wired, the QR designer gains a Cancel and the clip's "Add to event" a close", "UI: `ui/sheet.tsx`
  has no centred desk posture ..." (a door that wants one names a kind), and the Download half of "Guest: Download all
  (`ExportDialog`) ... are still centred `Dialog`s".
- **Calls his to overrule:** the review as a confirmation; the look without its strip; Download's rows as the act; the
  dashboard chip's card in place; the kit's back arrow reading "Back" and the guest list screen's too (a list cannot
  know whether it sits on the album or the Guests room); Invite wearing the QR glyph everywhere (it wore Share's arrow);
  a place in a hand holding a history entry while a desk's panel does not (Settings and the kit keep `?room=` at both);
  the QR menu saving nothing when the style in force is pressed.
- **Look at first:** `src/components/ui/popup-kinds.ts` (the table), then the demo album at 375: Add photos, a pick,
  Send; then Settings' Password lock in a hand (the plan's cover over Settings, and the phone's Back returning to it).
