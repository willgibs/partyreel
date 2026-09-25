---
track: door-flow
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "28801095"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/entry-
  - src/components/guest/guest-name-
  - src/components/guest/add-email-dialog
  - src/components/guest/enter-event-prompt
  - src/components/guest/door
  - src/components/guest/identify-
  - src/lib/guest/entry-steps
  - src/lib/guest/name-door
  - src/app/(guest)/layout.tsx
  - src/components/ui/sheet
  - src/components/ui/floating-layer
  - src/lib/use-keyboard-inset
  - src/components/auth/
  - src/app/(dev)/design/(shell)/lab/tools/keyboard-sheet/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/lib/guest/join.ts
  - src/app/api/guests/email/route.ts
  - src/lib/validation/profile.ts
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
---

# lp/door-flow

**Goal.** Build Will's new guest door in production, in today's visual language (round 2 of `identity-door` is drawing the look): the welcome, then a chooser (Continue as guest, Create account, Log in) on name-only events, one name-and-email path to a code on verification events, a phone sheet that survives the keyboard, and the guest's menu card as he amended it. His note: the mobile sheet "feels super buggy when the mobile keyboard opens to type" ("Very important").

## The brief

Will's answers and notes: `docs/reviews/identity-door.json` (round 1, with the Orchestrator's notes). Round 2 (`door-r2`, drawing tonight) asks only the door's look. Build the flow and the mechanics now, in today's visual language, so the look lands later as a restyle over a door that already works.

**The flow (`src/lib/guest/entry-steps.ts`, `entry-modal.tsx`).**
- The steps become `welcome | password | chooser | name | identify | signin | upload`. `email` retires, and `identify` replaces the held-name-then-email pair (the name step's `hold` mode and `enter-event-prompt.tsx` go).
- New inputs: `path: "guest" | "create" | "login" | null` and whether the viewer is verified.
- The rules, in order:
  1. The owner never sees the door, and the welcome shows once.
  2. `access none` shows the password step, and nothing after it.
  3. A verification event (`gate === "account"`) with no confirmed email shows `identify`, and nothing after it.
  4. On a name-only event with no name, not verified and not the demo: `path` null shows the chooser; `guest` goes to `name`, `create` to `identify`, `login` to `signin`.
  5. A confirmed account with no profile name shows `name` in `profile` mode.
  6. The upload step follows as today.
- The back chevron's logic moves into a pure `doorBack()` there, so it can be tested.
- `path` lives in modal state, is reset by going back to the chooser, and is never persisted.

**The steps.**
- **The chooser:** a new component under `src/components/guest/door`. Three actions in his order, Continue as guest primary, his words: "Continue as guest", "Create account", "Log in".
- **Continue as guest:** the name step, with the optional email as a one-line ghost tap. It is a full-width row at least 44px tall that fits one line at 375 (shorten the words or use `text-working`; say what 320 does). A tap turns it into the labelled field, and focus moves inside that tap.
- **identify:** one form of name and email.
  - The name is checked locally with `checkDisplayName`, and the gate reason line shows on a verification event only.
  - The code is sent with the name attached as user data, `signInWithOtp({ options: { data: { door_name } } })`. `identity-email` builds the server half that adopts it after a magic link, so a name typed before the link is never asked twice. Keep the same-browser `pr_guest_name_last` prefill as the fallback.
  - Then the code screen. The four writes after a confirmed code (`handleEmailVerified`) are shared by identify and signin.
- **signin:** `AccountDoor wear="signin"`, with a door line of its own. The signin reason ("the photos you added here") is not true before an upload.
- **Calls, his to overrule:**
  - Google and the password link leave the verification door and live under Log in.
  - The "Signed you into the account X already had" hold runs only when this device holds uploads a claim would move; otherwise new and existing guests land the same way.

**The keyboard-safe sheet, replacing vaul.**
- **Why vaul goes:** vaul 1.1.2 is unmaintained, and its `repositionInputs` is the bug:
  - it lifts the drawer by `innerHeight − visualViewport.height` while ignoring `offsetTop`, so it stacks with iOS's own pan;
  - it pins the drawer's height the first time the keyboard opens and never resets it, across steps of different heights;
  - its `touch-action:none` sits on the scroll container;
  - its prevent-scroll fixes `body`.

  The door never drags, so move it onto the product's one responsive Sheet (`src/components/ui/sheet.tsx`, `floating-layer.ts`) at both widths and make that keyboard-safe.
- **`src/lib/use-keyboard-inset.ts`:**
  - It listens to `visualViewport` resize and scroll, one update per frame, and writes `--kb-inset`, `--vv-h` and `data-keyboard` on the phone half.
  - The inset is `max(0, round(innerHeight − (vv.offsetTop + vv.height)))` only while a text field inside is focused, and 0 otherwise. That also covers iOS 26's stale offset after the keyboard closes.
- **The sheet:**
  - `bottom: var(--kb-inset)`, height at most `min(85svh, calc(var(--vv-h, 100svh) − 12px))`, a short transition on `bottom`.
  - An inner scroll region with `overscroll-behavior: contain`, and the primary action sticky at its foot while the keyboard is up. Safe-area padding applies only while the keyboard is down.
  - An `overlayClassName` for the door's scrim, and Radix's open autofocus prevented under 640px.
- **Android:** `interactiveWidget: "resizes-content"` in `src/app/(guest)/layout.tsx`'s viewport. iOS Safari ignores it today, and the formula cancels out where it works.
- **Everyone else:** the Sheet's change must do nothing when no field is focused, since every guest and host phone sheet rides it.
- **The door's CSS** moves into a colocated `src/components/guest/door.css`. Delete the moved rules from `src/app/globals.css` (an exception, only those lines).

**Focus rules.**
1. No door field autofocuses on mount (name, identify, code), and Radix's open autofocus is prevented.
2. Focus moves only inside the guest's own tap or Return. The ghost tap focuses the email field, and Return on the name uses `enterKeyHint="next"`.
3. After a code is sent, focus the code field only if a field held focus at submit.
4. Blur before any step change whose next step has no field. Never unmount a focused field.
5. On focus and on each inset change, scroll the field into view inside the sheet with `block: "nearest"`.
6. Fields stay 16px with the right `inputMode`, `autocomplete` (`name`, `email`, `one-time-code`) and `enterKeyHint`.

Add a source test that no door step carries `autoFocus`.

**The menu card (`guest-name-menu.tsx`).**
- Her name over "Unverified", or over "Email not confirmed" once an email is added.
- The card: "Save this event for later" with Add your email, or with Confirm your email and a quiet "Change or remove it".
- Then Change name, a separator, and Log in, the same word as the chooser. No sign-out row.
- "Unverified" appears exactly once.
- `add-email-dialog.tsx` and the confirm door (`src/components/auth/confirm-email-dialog.tsx`) move onto the responsive Sheet.
- A pending address can be changed (it overwrites) or removed. Removing posts `null` through the existing `attachGuestEmail`, clears the device flag, and says "Your photos stay. Only the email you added is removed."

Will proposed that an added email can only be changed. The Orchestrator's refinement lets a typed, unconfirmed address be removed, because no host ever sees one and the upload record keeps what was typed. Build it behind one constant, so his answer is a one-line flip, and name it in the Handoff. A confirmed address changes only on the account page (`identity-email`).

**A lab tool** (optional, recommended): `src/app/(dev)/design/(shell)/lab/tools/keyboard-sheet/`, a full-screen fake album with the Sheet swapping steps, for the simulator walk. Its nav line is an exception.

**Verify on the iOS Simulator.**
- Two simulators are installed (iPhone 17 on iOS 26.5, and iPhone SE 3rd generation on iOS 17.5, 375x667, the worst case). Turn the software keyboard on (I/O › Keyboard, untick Connect Hardware Keyboard) and open `http://<this Mac's LAN address or localhost>:<port>/e/<disposable token>` in Safari.
- Walk: welcome → chooser → Continue as guest; tap the name field; open the ghost line; Continue; back; Done; landscape; Change name, Report and Invite.
- Each step: the field and the primary action sit above the keyboard; nothing jumps; the page behind never scrolls; the sheet returns to rest when the keyboard closes.
- Capture every step. No agent ever types a real code: the verification path's code screen is checked with a wrong code only.

You own no system doc: put the door's facts for `guest-flow.md` (owned by `reel-sweep` tonight) and for `design-system.md` (owned by `album-window`) in your Handoff, and the Orchestrator writes them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; `entry-steps` and `doorBack()` tests (the chooser present or absent in each case, each path, identify ending a verification event's door, demo and owner excluded); the modal's tests (the three actions in order, back to the chooser, identify's one code request carrying the name, the four writes, the hold only with uploads to claim); the ghost line closed by default and a tap focusing it; the keyboard inset as a pure function (closed, open, panned, the stale offset, Android) and the Sheet under a fake `visualViewport`; the menu's one Unverified and the pending change and remove; the simulator walk captured at each step on both phones.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **The chooser's words.** "How do you want to join?" over "A name is all it takes. With an account, every photo you add stays with you." Rec: as built; round 2's look and `voice-guest` may reword it.
- **The ghost line.** His words kept, "Add an email to come back anytime", at the working size (14px): one line at 375 with room to spare (236px of text in 279); under 360px the mail icon steps aside, so it stays one line at 320 too. Rec: as built. The other way: shorten to "Add an email to come back later", which fits at both widths with the icon.
- **Create account on a name-only event** is `identify` with its own words, "Create your account" over the keep promise ("Confirm your email and every photo you add here stays in your account."), and no gate line. Rec: as built.
- **Log in's door line**: "Log in" over "Use your Partyreel email, and every photo you add here joins your account." `DOOR_WEAR.signin` now says "Log in" too, so the menu's row and the door it opens agree, and its reason speaks of photos a guest adds, never "added". Rec: as built.
- **Focus at a desk.** No door field autofocuses at either width: the panel takes focus, and a desk guest clicks or tabs into the name. Rec: as built.
- **Every responsive Sheet's phone half** gives the open focus to the panel instead of its first field, so Report's textarea no longer raises the keyboard mid-slide. Rec: as built.
- **The phone door's arrival** is the Sheet's own 300ms rise rather than vaul's 500ms full slide; the welcome keeps its 55svh presence. Rec: as built; round 2's look may redraw the arrival.
- **Holding the page's scroll on iOS.** Measured on the simulators, iOS scrolled the album behind the sheet 191px (SE) and 426px (iPhone 17) to centre a focused field, and left it scrolled after the door closed. On iOS only, a tap on a sheet's field is taken over at `touchend` (react-aria's recipe, the one vaul carried) and the page's scroll is held while typing. The cost: a tap lands the caret at the field's end rather than under the finger. Rec: as built.
- **The keyboard's height is remembered (and guessed once).** iOS reports the keyboard only after it has risen, so the sheet lifts to the height it last measured, or on a visit's first focus to a guess from Safari's visible height; the guess settles by up to about 30px when iOS reports. Rec: as built.
- **Landscape phones.** A landscape phone is the desk half by width; it now stands on the keyboard too (touch screens only), but iOS leaves a thin band above the keyboard (81px on the SE, 16px on the iPhone 17), so the field is scrolled into it and the primary scrolls with the content (`data-keyboard="tight"`); Return sends. Rec: as built. A later round could keep the bottom sheet for landscape phones.
- **The name step with the keyboard up** shows the name field and the sticky Continue; the ghost line sits one short scroll below it, on both phones. Rec: as built (the rule reveals the focused field, nearest edge). The other way: reveal the ghost with the field, at the cost of the heading.
- **Removing a pending email** says its cost under the control before the press ("Your photos stay. Only the email you added is removed.") and toasts "Email removed" after. Rec: as built.

## System-doc edits (in place, owned facts only)

- None: the lane owns no system doc. The facts for `guest-flow.md` and `design-system.md` are under "Facts for the
  system docs" in the Handoff, for the Orchestrator to write.

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: retire vaul; `src/components/ui/drawer.tsx` is drawn only by the Library's gallery demos since the door
  moved onto the Sheet.
- Guest: `password-gate.tsx`'s Unlock could wear `floatingKeyboardFoot` (with `data-sheet-primary`), the door's one
  step whose primary does not stick while typing (not this lane's file; the step is short enough to fit on an SE).
- Code hygiene: stale comments outside this lane: `report-dialog.tsx` and `upload/intent-sheet.tsx` still call the
  responsive Sheet unproven under a keyboard; `guest-header.tsx:147` names `<EnterEventPrompt>`.
- Lab: the `voice-guest` board quotes the door with `data-entry-drawer`, so its welcome frame lost the 55svh presence
  (door.css keys on `data-entry-sheet` and loads with the shell).
- Done, delete from ROADMAP: "EmailSignIn takes class overrides rather than a Button size" (it takes `buttonSize`; the
  guest doors wear `cta`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/door-flow`:** the work `f070258c`; the sync `b145b59d` (merged `origin/launch-prep` at
  `055baee9`, past `reel-clip-wiring` and `identity-email` as the pickup asked; no conflicts); the post-sync fixes
  `59de5da5` (identify sends identity-email's `DOOR_NAME_KEY`, one home; a wrong code keeps the field focused). Since
  then launch-prep took `hardening` (`eac1ae39`): no file in common with this lane or its reads, so no second sync.
  The head is this manifest's commit, in the chat line.
- **Gates on `59de5da5`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings, none in a touched
  file); `pnpm test` 0 (475 files, 5250 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3139` 0 (281 checks, 0 failing). The built CSS carries the keyboard rules (the posture's
  `var(--kb-inset,0px)`, the `bottom`/`top`/`max-height` transition, `[data-keyboard=open]`'s sticky foot, door.css's
  `@media not (min-width:40rem)` welcome rule), grepped in `.next/static/chunks/*.css`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths and this file, plus four exceptions:
  `src/app/globals.css` (the moved door rules deleted, granted by the brief); `src/app/(dev)/design/_data/nav.ts` (the
  tool's nav line, granted); `src/app/(dev)/design/touchpoints.ts` (one line: identity-door's `lives` swaps the deleted
  `enter-event-prompt.tsx` for `identify-step.tsx`, or `links.test.ts` fails on a missing file; merged cleanly over
  door-r2's row); `src/components/guest/guest-header.test.tsx` (its three menu pins say "Log in" where the row said
  "Sign in", the brief's word; the reshape is noted in the test).
- **The door's itinerary** (`src/lib/guest/entry-steps.ts`): `welcome | password | chooser | name | identify | signin |
  upload` in the brief's rule order; `path` lives in the modal's state, is cleared by going back to the chooser and is
  never persisted; the chevron is the pure `doorBack()`. Pins: `entry-steps.test.ts` (31).
- **The chooser** (`door/chooser.tsx`): Continue as guest (primary), Create account, Log in, in his order and words.
- **Continue as guest** (`guest-name-step.tsx`): the ghost line, 44px tall, one line at 375 (text-working) and at 320
  (its icon drops under 360px); a tap opens the labelled field with focus inside the tap; Return moves name to email
  when it is open. The `hold` mode and `enter-event-prompt.tsx` are gone.
- **identify** (`identify-step.tsx`): name and email in one form, `checkDisplayName` locally, the gate line only on a
  verification event, one code request carrying the name (`DOOR_NAME_KEY`), `pr_guest_name_last` kept as the fallback.
  **signin** (`door/signin-step.tsx`): `AccountDoor wear="signin"` with a door line of its own; code, Google, password.
  The confirmation's four writes stay the modal's, shared by both. Pins: `identify-step.test.tsx` (9, against the real
  door and code field), `entry-modal.test.tsx` (the three actions in order, back to the chooser, the four writes, Log in's
  writes).
- **The keyboard-safe Sheet** (`src/lib/use-keyboard-inset.ts`, `ui/sheet.tsx`, `ui/floating-layer.ts`): while a text
  field inside holds focus on a touch screen, the sheet writes `--kb-inset`, `--vv-h`, `--vv-top` and `data-keyboard`
  (`open`, or `tight` under 200px); the phone half stands on the keyboard with its ceiling at the visible height less
  12px, the desk half (a landscape phone) spans the visible band; `floatingKeyboardFoot` sticks the primary at the foot;
  the field is scrolled into view inside the sheet only, nearest edge, on focus, on every lift change and whenever a
  glide settles. Measured and fixed on the simulators beyond the brief: iOS scrolled the page behind (191px SE, 426px
  iPhone 17) and left the album scrolled, so on iOS a tap on a field is taken over at `touchend` and the page's scroll
  is held while typing; iOS reports the keyboard only once risen, so the sheet stands on the height it last measured
  (a guess on a visit's first focus) and rises with the keyboard; the step container is `shrink-0` (it had been
  clipping its own step instead of letting the sheet scroll). With no field focused a sheet is exactly as before:
  `sheet.test.tsx` (13, a fake `visualViewport`) and `use-keyboard-inset.test.ts` (10: closed, open, panned, the SE's
  measured pan, the stale offset, Android both ways).
- **The shell** (`entry-shell.tsx`): the responsive Sheet at both widths, `overlayClassName` for the door's scrim,
  Radix's open autofocus prevented at both widths (the panel takes focus), `door.css` colocated. Android:
  `interactiveWidget: "resizes-content"` in the guest layout (served: `width=device-width, initial-scale=1,
  interactive-widget=resizes-content` on `/e/*` only).
- **Focus rules:** no door field autofocuses (`door/no-autofocus.test.ts` reads 14 files, comments stripped; it catches
  the old name step); focus moves only in the guest's own tap or Return; the code field takes focus only from a field
  that held it, in the same task, so the keyboard changes keys instead of dropping; a step change blurs first, and the
  step container blurs a focused field before its node leaves; fields are 16px with their `inputMode`,
  `autocomplete` and `enterKeyHint`.
- **The menu card** (`guest-name-menu.tsx`): her name over "Unverified" (or "Email not confirmed"), "Save this event for
  later" with Add your email, or Confirm your email and "Change or remove it"; Change name; Log in; no sign-out.
  `add-email-dialog.tsx` (now add or change, and remove) and `confirm-email-dialog.tsx` wear the responsive Sheet.
  **The one-line flip: `PENDING_EMAIL_REMOVABLE` in `add-email-dialog.tsx`** (true: a pending address can be removed;
  false: his "change only"). Pins: `guest-name-menu.test.tsx` (one Unverified, change overwrites, remove posts `null` and
  clears the device flag, a refused removal keeps it).
- **The lab tool:** `/design/lab/tools/keyboard-sheet`, the door's shell over a fake album with the name step and three
  replicas that send nothing, a second trigger at the album's foot, and a live viewport readout inside the sheet.
- **The simulator walk, both phones, every step captured** (scratch, never the repo:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/door-flow/walk/shots/`,
  each folder's `walk.log` giving every step's keyboard frame and whether the field and the primary clear it): the door
  as a guest (`se-guest-2`, `i17-testGuestWalk`), Create account and Log in (`se-chooser`, `i17-chooser`), the
  verification door to a WRONG code only (`se-gate-2`: the code field took focus with the keyboard up, "That code
  didn't work."; `i17-gate` stops before the send), the album's Change name, change-or-remove, Report and Invite
  (`se-album-1`, `i17-testAlbumSheets`), the bench (`se-bench-5`, `i17-bench-final`) and Report over a scrolled page
  (`se-scrolled-1`: the page's scroll held at 1474 through the keyboard). Page scroll 0% in every door walk; the only
  primaries covered are a landscape phone's (`tight`, where Return sends). Frame strips of the first and second focus:
  `se-bench-5/strip-*.png`.
- **How it was driven:** the native iOS Simulator tool refused to start (Xcode's command-line tools are selected and
  switching needs sudo) and Simulator.app's screen control was denied, so the walks ran as an XCUITest harness driving
  Safari with real taps and the software keyboard (`xcodebuild` with `DEVELOPER_DIR`), in the scratch directory. One
  real code request went to the test account `hi@willgibs.com` (an existing account, so nothing was created); no real
  code was typed. Two disposable events were created by SQL for the walks: "Door flow probe (disposable)"
  (`e0151f28-57b5-4108-8af6-ba2b77ffe6f2`, name-only; guest rows "Priya" from the walks) and "Door flow gate probe
  (disposable)" (`315dba57-bba6-4a91-b0fc-29f44f97c4b6`, verification).
- **The keyboard, measured for `identity-door`'s `KEYBOARD_H` (335):** the visual viewport's lost height with Safari's
  form bar in view is **337pt on the iPhone 17** (iOS 26.5, text keyboard: 714 visible at rest, 377 with it up; the
  email and one-time-code keyboards 310) and **227pt on the iPhone SE** (iOS 17.5: 547 to 321; email and code 183).
  Measured from the screen's bottom edge to the top of Safari's address strip instead: 435pt on the iPhone 17 (874 tall)
  and 326pt on the SE (667 tall). Landscape: the iPhone 17 leaves 16pt above the keyboard, the SE 81pt.
- **Facts for the system docs** (the Orchestrator writes them, in place):
  - `guest-flow.md`, the ARRIVAL: the itinerary is `welcome | password | chooser | name | identify | signin | upload`
    (rules in `entry-steps.ts`); the cases become names mode `[welcome?, chooser → name | identify | signin, upload?]`
    and verified mode `[welcome?, identify]` then `[upload?]`; the chevron is `doorBack()` (a way in returns to the
    chooser and clears the pick). Replace the vaul paragraph with: one shell, the responsive Sheet at both widths,
    keyboard-safe (see design-system.md), the door's CSS in `door.css`. Replace "the name step's field does carry
    `autoFocus`" with: no door field autofocuses (a source test pins it), and the code field takes focus only from a
    field that held it.
  - `guest-flow.md`, Joining + identity: the address is a one-line ghost under the name that opens into the labelled
    field (not an always-open field); `guest-name-step.tsx` has three modes (`join`, `edit`, `profile`; `hold` is
    gone); the four writes are shared by `identify` and `signin` (not `EnterEventPrompt`); the verification door asks
    for the code alone and Google and the password link live under Log in; the name rides the code request as
    `DOOR_NAME_KEY`; "the account you already had" holds only when the device holds a guest ticket; the menu's
    change-or-remove sheet now calls the detach arm (`email: null`), behind `PENDING_EMAIL_REMOVABLE`; the menu reads
    "Log in" (`DOOR_WEAR.signin` too).
  - `design-system.md`, the floating layer: the responsive Sheet is keyboard-safe (the variables, `data-keyboard`
    `open`/`tight`, `floatingKeyboardFoot` with `data-sheet-primary`, `overlayClassName`, the phone half's open focus on
    the panel, the iOS scroll hold and the remembered keyboard, all in `use-keyboard-inset.ts`); ★ an `overflow: hidden`
    ancestor defeats the sticky foot (`overflow: clip`), and a flex child with a fixed height inside the sheet needs
    `shrink-0` or it clips instead of scrolling. The arrival: the entry sheet enters on the Sheet's edge clock (300ms)
    after the 700ms beat; delete "the vaul motion gotcha" (no production vaul remains).
- **Assets requested from Will:** none.
- **Board ideas:** a landscape posture for phones (keep the bottom sheet, and a slimmer door, when a touch screen is
  landscape, instead of the desk's side panel over a 16-81pt band); reveal the ghost line with the name while typing on
  a short phone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the brief's two (Google and the password link under Log in; the "account you already had"
  hold only with a guest ticket on the device), and the twelve under Questions.
- **Look at first:** `/design/lab/tools/keyboard-sheet` on a phone, then a disposable event's door; the SE captures
  `se-guest-2/07-email-open.png` and `se-gate-2/06-code.png`.
