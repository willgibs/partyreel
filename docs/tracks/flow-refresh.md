---
track: flow-refresh
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/emails/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/guest-flow.md
---

# lp/flow-refresh

**Goal.** Refresh `export-flow`'s five stale asks onto the Download menu and Will's new notes, and `emails`' two reached asks (the other waiting events after `pointer=line`, a guest's mail after the keep step), with `emails.guest` absorbing the two mail questions leaving event-safety and admin-triage.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**export-flow.** Download is a menu now: a row starts its bundle at once (`src/components/app/export/export-dialog.tsx` on `src/components/ui/responsive-menu.tsx`, popups `choices=menu`, `3e7952e3`). On a phone it is rows near the thumb with Cancel beneath. desk-trim `6daf1e66` and crumbs-4 `2d2bd7f8` both flagged the board's framing as still the old centred sheet.
- `means`: "today" and `mine` are still drawn as the old sheet (a description line, chips, a size foot, a Download button). mine-none `89095cff` removed the own-tile mark `mine` argues from, and "Yours" is in the View menu beside Download all. Redraw on the menu, `mine` as a "Yours" row at its top.
- `wait` (reached): Will's voice-guest note ("notify the user where they are without real interruption, if we even need to notify them at all") and the shipped menu, which closes on tap, remove the ground for the recommended `panel`. Reframe as today's toast (`use-export-download.ts`) against a quiet line under the header, with progress on the Download button itself as a likely third. Move the recommendation off `panel`.
- `stuck` is current and asked after `wait`; only its `panel` version follows `wait`'s.
- `hollow` (reached): the Worker still skips missing files silently (`workers/export/src/index.ts`). His voice-guest `failed=exact` ("2 of 8 didn't upload", Retry both) sets how a partial failure is said. Draw `offer` in that style ("142 of 148 are in your zip", Try again for the 6), then ask only whether a wholly empty zip is refused. `after` has no way to fix the failure, so it loses to `offer`.
- `cap`: a bundle over the limit is a disabled menu row, and the note under the rows names no number. Redraw on the menu:
  - `near`: the note naming 2,000;
  - `split`: the row reading "in 2 zips";
  - `auto`: the row saying how many were left out.
- `phone`: redraw on the phone's menu rows; `both` becomes a "Save to Photos" row above the bundle rows (save-sheet `88c43fe7`'s one-tap Save is the precedent), `zip` the rows alone.

**emails.**
- `moments` (reached): Will's `identity-claims` answer `pointer=line` keeps the event self-contained. A guest's other waiting events are acknowledged and handled on her dashboard later, with nothing pointing her out of the event before she uploads. claims-wiring `19ff4d33` built the dashboard banner. Redraw `identity` as a mail sent after she confirms at the keep step, echoing the banner ("11 photos from 4 events are waiting for you"), never from a confirmation before her first upload.
- `guest`: the keep step (`6f06207e`) asks every first uploader to confirm her email, which sends a code mail, so `none` ("nothing ever arrives") is false, and `link` lands at the keep's own moment. Draw the code mail as today, and narrow `link` to one mail for a guest who chose Maybe later but typed an address and uploaded (ROADMAP's deferred one-shot mail). It also absorbs two questions leaving other boards, every option kept:
  - event-safety `waiting`'s mail half: a held or unlisted guest mailed when she is let in;
  - admin-triage `notice`'s `both`: a mail to a confirmed reporter.

  If they are two decisions, split them rather than force one.

**Untouched on emails:** `shell`, `brand`, `sender`, `foot`, `code`, `dark` (Will may answer them on build 12).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`export-flow`, `emails`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board export-flow --base http://localhost:<port>`; `pnpm lab:demo --board emails --base http://localhost:<port>`, each pressing every step.

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
