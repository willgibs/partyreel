---
track: door-flow
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
