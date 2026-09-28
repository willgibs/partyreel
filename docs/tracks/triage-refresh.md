---
track: triage-refresh
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: admin-triage
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/admin-triage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/trust-safety-forensics.md
  - docs/systems/admin-observability.md
---

# lp/triage-refresh

**Goal.** Refresh `admin-triage`'s five stale asks onto the admin portal as it ships and onto Will's curation picks, fixing two asks' words and leaving its other three untouched.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**Per ask:**
- `look` (reached): host-curation's `queue=uniform`, `peek=verdict` and `keys=arrows` make the product's other picture queue a 4:5 grid with the verdict on a peek. Keep all three options, and redraw `grid` in that grammar so split vs grid is judged against it. No frame draws Reports' People section (`PersonReportList`, listed first when any exist); draw it.
- `reason` (never matched): `ReportCard` has printed a muted "No reason provided." in place, in time order, since `734133d9`. So today is effectively `marked`, `chrono`'s blank is not today, and every frame draws the wordless report blank. Redraw today accurately and reframe the question on it.
- `verdict` (its premise is false twice): since `3e7952e3`, `DestructiveSheet` is a centred confirm with no note field. The report's Remove never opened it: `onAction` acts at once with a toast. And `resolution_note` is written nowhere. Redraw with a note on both verbs, or with Remove going through the confirm and carrying its note.
- `escalate` (words): "The preserve panel is a sheet of its own" never held. Set hold is an inline form on `/admin/forensics` (`src/app/admin/forensics/forensics-controls.tsx`), and only `ReleaseHoldButton` opens the confirm, a centred dialog since `3e7952e3`. `retype` and `copy` match production. Redraw `door` as that confirm.
- `notice` (reached): `told=line` is live. `listOwnUploadStatuses` (`src/lib/db/mutations/guest-media.ts`) maps an operator's removal to refused, so her tracker says "Not in the album" at a moderated event, and `silence` "as today" is false. Also, since `19ff4d33`, a Not mine card's Delete removes one event's uploads, and there is no Finish. Adapt: draw the uploader as told, in the same words for a Reject, a takedown and a hold, so nothing gives a hold away (voice-guest r2 is asking those words; draw today's). Ask only about the host and the reporter. The reporter's mail (`both`) repeats emails' `guest`, so it leaves this ask: `flow-refresh` adds it there as an option. Say so in your Handoff.

**Word fixes** (question and options otherwise untouched):
- `closed`: All still draws the read-only cards, not a table.
- `idiom`: "every inbox" means every inbox but Reports.
- The row's note, "the shape the admin board is asking about", names a board retired at `290bbd3e`.

**Untouched:** `phone`.

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
