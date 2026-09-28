---
track: crumbs-4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Commits, pushed on `lp/crumbs-4`** (base `c449e06e`, the `origin/launch-prep` tip at boot): the sync was a clean
  fast-forward to `e86b9142` (claims-wiring's merge + record commit; it moved two of this lane's `reads`,
  `guest-flow.md` and `host-app.md` — checked, neither touches anything this lane's five items rely on) landed
  *before* any work commit existed, so there is no separate sync commit sha; the work commit, `14809f56`, sits
  directly on `e86b9142`. The head is in the chat line.
- Every claim below names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- **Gates on the synced tree at `14809f56`** (== `e86b9142` + this lane's one diff), each its own exit code, logs in
  `../partyreel-wt/_scratch/crumbs-4/`: `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0 (`lint.log`: 0 errors,
  the 5 standing warnings, none in a touched file); `pnpm test` 0 four times (`test-run1.log`, `test-run2.log`,
  `test-run3.log`, `test-final.log`: 510 files, 5718 tests, zero unhandled errors, every run) plus
  `email-section.test.tsx` alone, 5 runs (`email-section-alone.log`), 7/7 clean every time — item 1's flake, gone;
  `zsh scripts/build-lock.sh pnpm build` 0 (`build.log`); `pnpm lab:smoke --base http://localhost:3132` 0
  (`lab-smoke.log`: 244 checks, 0 failing — 245 pre-sync, minus one of claims-wiring's retired routes); `pnpm
  lab:demo --board export-flow --base http://localhost:3132` 0 (`lab-demo.log`: 6 steps — means, wait, stuck,
  hollow, cap, phone — 0 failing, every option still drawing). The six help articles read live at `:3132`
  (`/help/the-email-code-didnt-arrive` etc.); the keyboard bench's Code tab checked at 1440 and 375.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the 13 owned files
  (`email-section.test.tsx`, the six `.mdx` files, `keyboard-bench.tsx`, `guest-action-dock.tsx`, `entry-shell.tsx`,
  `board.tsx`, `export-flow.css`, `spec.ts`) plus one exception the manifest itself grants,
  `src/app/(dev)/design/touchpoints.ts` ("correct the row's `note` and `variants` (your named exception: that row
  only)"; I also corrected that same row's `why`, one line beyond the two named keys — see Calls his to overrule),
  plus this file.
- **The items:**
  - Item 1 (the input-otp test flake) closes ROADMAP's Code hygiene line 29 (`email-section.test.tsx` flakes under
    a full run). `identify-step.test.tsx` renders the same real `InputOTP` but never gives it real DOM focus (its
    `codeFocus="follow"` never fires since the test drives fields with `fireEvent.change`, not `userEvent`), so it
    never arms the long password-manager-badge timers this fix targets; its existing 80ms flush already covers its
    own, smaller exposure (the short, unconditional timers). Not touched (not owned).
  - Item 2 (six help articles) closes ROADMAP's Help lines 24 and 31.
  - Item 3 (the keyboard bench) closes ROADMAP's "The lab" line 25.
  - Item 4 (two stale comments) closes only the "stale comments in `guest-action-dock.tsx`... and
    `entry-shell.tsx:109`" clause of ROADMAP's Code hygiene line 33; the rest of that line (`DestructiveSheet`,
    `GuardedSwitch`, `PricingSheet`, `QrDesignerDialog`, `ExportDialog`, `UploadIntentSheet`, `EventShareSheet`,
    `EventSettingsSheet` naming surfaces they no longer are, and `create-flow.test.tsx`, `claims-wiring`'s) stays
    open — the Orchestrator trims the line rather than deleting it.
  - Item 5 (export-flow's ground) has no dedicated ROADMAP line: it closes what desk-trim's own Handoff
    (`104a091b`) flagged as out of its narrow grant — the "Board ideas" note that `board.tsx`/`export-flow.css`'s
    "still a centred `Dialog`" framing was stale, and that `touchpoints.ts`'s `export-flow.board.note`/`.variants`
    were "already independently stale" — and its paired "Calls his to overrule" entry about the same framing.
- **Assets requested from Will:** none.
- **Board ideas:** desk-trim's Handoff offered two paths for export-flow's own framing once it went stale: "reconcile
  those five asks' own hand-drawn 'one responsive sheet' with what actually shipped... or judge them content-only
  regardless of chrome." I took the second: `means`/`wait`/`stuck`/`hollow`/`cap`'s "today" now says the menu in
  words, but the board's own reproduction (`dialog.tsx`'s `Shell`/`ChipRow`/`Foot`, still a chips-then-button
  sheet) is untouched, the same way `phone` was already grounded without a visual rebuild. A pixel-accurate redraw
  of the board's own mock as the shipped menu's real chrome (an anchored dropdown at a desk, rows rising to the
  thumb in a hand, per `ui/responsive-menu.tsx`) is a real design pass across five asks, not a crumb; a future round
  could still take it up if the container's own look is ever worth asking about again.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `touchpoints.ts`'s `why` field ("the real download dialog" -> "menu") corrected alongside the named `note` and
    `variants`, one line beyond the manifest's literal grant — leaving it stale one line under my own fix read as
    an oversight, not a boundary worth keeping. Overrule if the exception should have stayed to exactly those two
    keys.
  - `entry-shell.tsx:109`: the manifest named the location, not the fix. Reading the surrounding "THE PHONE HALF
    LEFT VAUL" paragraph against `package.json` (vaul confirmed gone entirely, not merely disabled for held steps)
    found its claim that the door "never drags (every step is held)" backwards: nothing drags product-wide now,
    including the one *free* surface ("Change name"), so "held" was never the reason. Corrected that causal claim.
    Overrule if a different sentence in that comment was actually meant.
  - Fake timers were tried first for item 1 and reverted (they hung every interactive test in the file — jsdom's
    own scheduler under this Vitest setup ties to the same `setTimeout`/`setInterval` React's does) in favor of a
    file-level `afterAll` that waits the real ~6s out once per file rather than per test. Overrule if the seven-test
    cost (~7s added to this one file) is worse than it looks from here.
- **Look at first:** `src/app/(dev)/design/sandbox/export-flow/spec.ts`'s extended "`object` RETIRES" paragraph and
  the `stuck`/`cap`/`wait` context rewrites, then `src/components/guest/entry-shell.tsx`'s corrected paragraph.
