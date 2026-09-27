---
track: crumbs-4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f1ab3e24"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/account/email-section.test
  - content/help/the-email-code-didnt-arrive.mdx
  - content/help/sign-in-options-and-passwords.mdx
  - content/help/how-guests-join-and-upload.mdx
  - content/help/send-the-event-link.mdx
  - content/help/download-photos-videos-and-albums.mdx
  - content/help/your-event-page-explained.mdx
  - src/app/(dev)/design/(shell)/lab/tools/keyboard-sheet/
  - src/components/guest/guest-action-dock
  - src/components/guest/entry-shell
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - src/components/ui/popup-kinds.ts
  - src/components/auth/account-door.tsx
---

# lp/crumbs-4

**Goal.** Batch 5's small leftovers before build 12: the recurring input-otp test flake fixed, six help articles told what the door and the popups now say, the lab's keyboard bench redrawn as production's code screen, two stale comments, and the export-flow board grounded on the Download menu that shipped.

## The brief

Each is small and independent; build it, and list anything that turned out to be a real choice as his to overrule.

1. **The test flake that reddened two gates** (gate 24 at `door-r3-wiring`'s merge, twice in `desk-trim`'s own runs): `src/app/(app)/account/email-section.test.tsx` passes every test, but under a full run `input-otp`'s own timeout fires a setState after the file's jsdom tears down (`ReferenceError: window is not defined` in react-dom's `resolveUpdatePriority`, from `input-otp/dist/index.mjs`'s timer), an unhandled error that fails `pnpm test`'s exit code. End it at its source in that file (fake timers around the OTP renders, or an unmount and a flush of pending timers in its teardown), prove it under a full run several times, and say which. If other test files render the OTP input the same way, name them.

2. **Six help articles told what the product says now** (ROADMAP's Help lines, from `door-r3-wiring` and `popups-wiring`; `guest-flow.md` and `host-app.md` are the truth): `the-email-code-didnt-arrive` and `sign-in-options-and-passwords` call the code screen "Enter your code" (it heads "Check your email"); `how-guests-join-and-upload` says "Nobody has to prove a name" (the line under her name reads "You can change it anytime."); `send-the-event-link` says "Open Share and tap the copy button" (every door is Invite onto the code card: Copy link, the phone's Share, Everything into the kit); `download-photos-videos-and-albums` (Download is a menu whose row is the act, each bundle with its count and size); `your-event-page-explained` (the sticky pill reads Invite). Bump each `updated`.

3. **The keyboard bench's code replica** (`(shell)/lab/tools/keyboard-sheet/keyboard-bench.tsx`, ROADMAP's lab line): it draws the old code screen ("Enter your code", "…to sign in"); redraw it as production's (`src/components/auth/account-door.tsx`: "Check your email", "We sent a 6-digit code to <address>.", six full-width slots, "Or tap the link in the same email.").

4. **Two stale comments** (ROADMAP's Code hygiene line): `guest-action-dock.tsx` says `GuestShare` "owns a Sheet" (it opens the code card); `entry-shell.tsx:109`'s comment (read it against the shell as it is). The rest of that line (the components whose names outlived their surfaces, and `create-flow.test.tsx`, which `claims-wiring` owns) stays.

5. **`export-flow`'s ground** (its `desk-trim` handoff): `board.tsx` and `export-flow.css` still frame "the shipped export dialog is still a centred `Dialog`", and its `touchpoints.ts` row's `board.note` still says "Eight decisions" and names the retired `chips`, its `variants` missing "A zip with nothing in it". Production's Download is now the responsive menu (`src/components/app/export/export-dialog.tsx` on `ui/responsive-menu.tsx`, a row per bundle that starts it). Ground the board's remaining asks (`means`, `wait`, `stuck`, `hollow`, `cap`, `phone`) on that menu as "today", every option and recommendation kept as they are, and correct the row's `note` and `variants` (your named exception: that row only). Verify with `pnpm lab:demo --board export-flow` pressing every step.

In the Handoff, name the ROADMAP lines each item closes (the Orchestrator retires them). Verify: `pnpm test` whole, run at least three times with no unhandled error; the six articles rendered; `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
