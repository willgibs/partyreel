---
track: triage-refresh
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and listed under Calls as his to overrule.

- `notice`: with the uploader already told and the reporter's mail gone to `emails`, the host alone had `silence` or
  `host`. Should a genuine third be drawn? Recommended: yes, `deleted` (her Deleted says "Removed by Partyreel" with no
  Restore to fail, nothing sent), and recommended over `host`: his voice-guest `landed` note ("notify the user where
  they are without real interruption, if we even need to notify them at all") and today's dead end (Restore answering
  "That item is no longer available.") both point there. `host` now carries the same Deleted line, so the three read
  as a ladder of loudness.
- `verdict`: the brief offered "a note on both verbs, or Remove going through the confirm and carrying its note".
  Recommended: one option holding both halves, as the old `note` road did (Dismiss's optional note beside it, Remove's
  in the confirm), with `always` its required twin; the confirm's line is one proposed `note` prop on
  `DestructiveSheet`, the fix at the source the door's reason reuses.
- `look`: the host queue's picked grid is now drawn as `grid`. Should the recommendation move to it? Recommended: no,
  `split` stays: a report is a picture and a sentence, and the grid hides the sentence behind a tap.
- The People section: drawn on the refreshed steps, whose rail and bell count four open reports. Should `closed`,
  `idiom` and `phone` gain it too? Recommended: no, they stay exactly as drawn (Will may be answering them), so their
  rail keeps three.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte, and this lane's two docs are `reads`.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Admin: the report's Remove (`report-review.tsx`'s `onAction`) acts at once, the one destructive act in the
  portal that skips `DestructiveSheet` against admin-observability.md's rule; routing it through the confirm can go
  straight whatever `verdict` answers (from `triage-refresh`).
- Now: Admin: Albums' Remove confirm (`moderation-grid.tsx`) says "Restorable for seven days" where the one window is
  30 (lifecycle-recovery.md), and "The guest who uploaded it is not told" where her uploads list says Not in the album
  at an event that reviews uploads (from `triage-refresh`).
- Now: Admin: the People arm prints "No reason given." at full weight (`person-report-list.tsx`) where the album arm
  prints a muted "No reason provided." (`report-review.tsx`); one line for both rides `reason`'s wiring (from
  `triage-refresh`).
- Now: Host: an operator's removal waits in the host's Deleted with a countdown and a Restore that can only fail
  (`recently-deleted-grid.tsx`; `restore_media`'s `admin_removed`), and it drives the bell's "about to be cleared" nudge
  (`queries/notifications.ts`); `notice`'s answer shapes the fix (from `triage-refresh`).

## Handoff (replaces the chat report)

- **Commits:** the work at `ad52d5d8`, this manifest after it, both pushed to `origin/lp/triage-refresh`. No sync:
  launch-prep moved only by `e541cb05` (a pickup record: STATUS.md and orchestrator.md), which touches nothing here.
- **Gates on `ad52d5d8`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (5 warnings, none in a file
  this lane touched: review-session.tsx, contact-form.tsx, album-fill-grid.tsx, review-switch.tsx); `pnpm test` 0
  (510 files, 5,738 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3135` 0
  (231 checks, 0 failing; admin-triage reads 686 words of 1,200); `pnpm lab:demo --board admin-triage --base
  http://localhost:3135` 0 (8 steps, 0 failing, every step draws its options; the tallest are look and escalate at 2.8
  screens, their two-frame options).
- **Untouched means untouched, measured:** `phone` and `idiom` captured byte-identical before (the board files at
  origin/launch-prep) and after (lab:demo `--save-shots`, all six PNGs); `closed.undo` too, while `closed.line` and
  `closed.window` differ by 28 and 9 pixels at a delta of at most 4/255 (render noise), their caption words aside.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the nine files under
  `src/app/(dev)/design/sandbox/admin-triage/` (`confirm.tsx` new) + `src/app/(dev)/design/touchpoints.ts` + this
  file. The one exception is the admin-triage row in touchpoints.ts, which the brief names as the lane's (its note,
  `asks` and `lives`; nothing else in the file).
- **Items:**
  - `look`: the People section leads every refreshed step as the page lists it (`PersonReportList`'s card; the rail
    and bell count 4); `grid` redrawn in host-curation's picked grammar as two frames, the queue (4:5 tiles on
    `GALLERY_UNIFORM_COLUMNS`, `UNIFORM_TILE_ASPECT`) and a tap (the peek, its words and the verdict on an opaque
    panel; arrows, Enter and Escape really bound in the frame's own window); options and `split` kept.
  - `reason`: today is `marked`, `ReportCard`'s muted "No reason provided." since 734133d9; the board's TODAY pin
    moved from `chrono` to `marked`, so no step draws the wordless report blank any more; the question reframed on
    it, `chrono` now "draws nothing"; the step scrolls to the wordless report under the People section.
  - `verdict`: the question and context rewritten on what ships (both verbs act at once; nothing writes
    `resolution_note`); `note` = Remove through the portal's one confirm (`confirm.tsx`, `DestructiveSheet`'s markup)
    with an optional note; `always` = the same, required, the verb waiting; `two` is today.
  - `escalate`: the words fixed (a hold is `PreserveForm`, inline; only Release hold opens the confirm); `door`
    redrawn as that confirm, filled in from the report with its reason as the note, in two frames (the control, then
    the confirm); "Their other album" dropped (it crossed events by an unproved address); `retype` and `copy` as
    they were.
  - `notice`: the uploader drawn as told (`TRACKER_WORDS.refused`, one line for a Reject, a takedown and a hold);
    the ask is the host's alone: `silence` (today, drawn with her Deleted's dead-end Restore), `deleted` (new,
    recommended), `host` (now with the same Deleted line); the reporter drawn as today. **`both`, the reporter's
    mail, left this ask: it repeats `emails`' `guest`, and `flow-refresh` adds it there as an option.**
  - `closed`: question, context and the `line` caption fixed (All still draws read-only cards); options and drawing
    unchanged.
  - `idiom`: question, context and `because` fixed (every inbox but Reports); options and drawing unchanged.
  - `phone`: untouched.
  - touchpoints row: the note no longer names the retired admin board; `asks` ends "what the host is told"; `lives`
    adds person-report-list.tsx, destructive-sheet.tsx, forensics-controls.tsx and recently-deleted-grid.tsx.
  - `round.n` stays 1 (date 2026-09-28), `round.changed` says what moved; `today` declared on reason, verdict,
    escalate and notice, so the whole-board page opens those on today.
  - ROADMAP's claim-ticket hygiene line names `sandbox/admin-triage/spec.ts:334`; that mention is gone here and can be
    trimmed from the line.
- **Assets requested from Will:** none.
- **Board ideas:**
  - A per-photo Report: the guest's Report has only ever named the whole album (`report-dialog.tsx` sends no
    `media_id`; ROADMAP already notes the unused `media_id`), so every frame on this board draws an item report the
    API takes but no control sends (the board's context now says so); guest-shape's dialogs or a new board decides
    where one photograph is reported.
  - `lab:demo --save-shots` captures at 1440 only, so the 375 half of a knob is checked by hand; a width flag would
    let a lane capture both (this lane used a scratch CDP script for its 375 and light-mode passes).
  - ROADMAP's "lab:demo compares an option's first frame only" now touches this board too: look.grid's and
    escalate.door's second frames (the tap) are never compared.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `notice` gains `deleted` and recommends it over `host`; `host` now includes the Deleted line.
  - `verdict.note` keeps the old road whole (Dismiss's note beside it, Remove's in the confirm) rather than two
    options.
  - `look` keeps `split` over the host queue's grid.
  - The confirm's note (verdict) and reason (the door) are one proposed `note` prop on `DestructiveSheet`.
  - The refreshed steps count four open reports; `closed`, `idiom` and `phone` keep their three.
  - The grid and the door each draw two frames, the resting state and the tap.
- **Also:** the Browser pane's first tab is shared across lanes (it held `:3138`'s board); this lane navigated it twice
  and resized it before moving to a tab of its own.
- **Look at first:** `/design/lab/admin-triage?session=admin-triage.notice` (the new third answer, the uploader
  drawn as told), then `verdict` pressed on 2 (the confirm with its note), then `look` pressed on 3 (the two frames).
