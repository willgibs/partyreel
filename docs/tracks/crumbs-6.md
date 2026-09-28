---
track: crumbs-6
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4982f2ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/password-gate
  - src/components/guest/upload/failure-sheet
  - src/components/guest/upload/stack-tile
  - src/components/guest/upload-step
  - src/components/guest/gallery-empty-state
  - src/components/guest/guest-header
  - src/components/guest/reel/live-reel
  - src/components/marketing/sections/features/privacy/access-switch
  - src/components/marketing/sections/features/album/how-much-fits
  - src/components/marketing/mock-parity.test.ts
  - src/components/marketing/chrome/marketing-footer
  - src/components/app/report-review
  - src/components/admin/moderation-grid
  - content/help/an-upload-wont-finish.mdx
  - content/help/how-guests-join-and-upload.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/voice-guest.json
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-6

**Goal.** Small, straight fixes: voice-guest round 1's three new lines and the mocks that quote them, the footer's demo link on a phone, the reel's approval toast told true beside `told=line`, the landscape head slot, a stale comment, and two admin fixes the triage audit found.

## The brief

**voice-guest round 1** (`docs/reviews/voice-guest.json`; the words are each option's own, in `git show e199f43f:"src/app/(dev)/design/sandbox/voice-guest/lines.ts"` and that board's r1 spec):
- `ask=warm`: the password step's sentence becomes "One password and you're in" in the shipped gate's own cadence (`password-gate.tsx`; the privacy feature page's `access-switch.tsx` mock quotes it).
- `failed=exact`: the failure sheet heads "2 of 8 didn't upload" (the whole run in its count), and its retry reads "Retry both" (or the count it retries) (`upload/failure-sheet.tsx`; the door's upload step shows the same list, `upload-step.tsx`; the album feature page's `how-much-fits.tsx` mock quotes it). His note: clear about the failure, clarity without coldness.
- `empty=warm`: under "The album starts with you", the one button says "Add the first photo" (`gallery-empty-state.tsx`).
- `welcome` and `landed` stay as today.
- `mock-parity.test.ts` holds the mocks to production's words; move it with them.

**Also:**
- The footer's demo link on a phone (`marketing-footer.tsx`, the `sm:hidden` "Open the demo album") is a same-tab `Link`. Every demo door on a phone opens the demo in a new tab (demo-doors `77cfdfe9`); make it one.
- `guest-header.tsx` carries a stale "open question" comment (the way back to a profile, answered by the peek card, `3e7952e3`); remove it.
- The reel's approval toast (`guest/reel/live-reel.tsx`'s `ApprovalToast`) says "The host added your uploads" when the first of her held uploads is approved, even when another of the same pick was left out and her uploads say so. Make it true beside `told=line` (e.g. "One of yours is in the album"), in the tracker's register.
- ROADMAP's landscape head-slot line (from `voice-r2`): `upload/stack-tile.tsx` draws a landscape file at its natural height inside the square head slot, leaving a grey band. Cover the square.
- Two admin fixes (ROADMAP, from `triage-refresh`):
  - The report's Remove (`report-review.tsx`'s `onAction`) acts at once, the one destructive act in the portal that skips `DestructiveSheet`. Route it through the confirm; whether that confirm carries a note is admin-triage's `verdict`, still on the desk, so add none.
  - Albums' Remove confirm (`moderation-grid.tsx`) says "Restorable for seven days" where the window is 30 (lifecycle-recovery.md), and "The guest who uploaded it is not told" where her uploads say Not in the album at an event that reviews uploads. Make both true.

- Help-sync (ROADMAP's guest-door line, as `help-refresh` refined it): the help articles that quote the failure sheet follow its new words (`help-ui-labels.test.ts` holds every `UiLabel` to the product's strings).
  - `how-guests-join-and-upload` also skips the chooser door-flow put before the name (How do you want to join?: Continue as guest, Create account, Log in) and puts Retry under the failure list where the sheet puts it above.
  - `an-upload-wont-finish` still heads "It's stuck or dimmed" and its bullets assume a tile.

  Retire those clauses of the line in your Handoff.

**Out:** the tracker's words (`TRACKER_WORDS`), the held tile's words and the keep's words, all voice-guest round 2's; `curation-wiring`'s review room.

**Verify:**
- Vitest where logic moved (the failure count's wording, the toast's truth).
- Each surface at 375 and 1440.
- `pnpm lab:smoke` whole.

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
