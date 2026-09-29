---
track: triage-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e385f61"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/report-review
  - src/components/admin/
  - src/app/admin/reports/
  - src/components/app/recently-deleted-grid
  - supabase/migrations/20260928140000_operator_removal_purge.sql
  - content/help/reporting-and-safety.mdx
  - content/help/report-a-problem-as-a-guest.mdx
  - src/lib/admin/reports                        # added: the Reports rules, one pure home, and its test
  - src/lib/db/queries/reports                   # added: the reads carry the note, the item's standing, the way back
  - src/lib/moderation/operator-actions          # added: adoptionUpdate and the removal's confirm lines, one home
  - src/lib/lifecycle/sweeps/standby-budget.ts   # added: the bin read never takes an operator's removal
  - src/lib/lifecycle/testing/cron-fake.ts       # added: the fakes model 20260928140000
  - src/lib/lifecycle/operator-removal.test.ts   # added: a takedown across four sweeps
  - src/lib/forensics/legal-hold.ts              # added: the hard-delete paths' comment names the takedown's window
  - src/lib/billing/storage-summary.test.ts      # added: the Deleted figure's pin, reshaped on purpose
  - src/lib/db/migration-guards.test.ts          # added: the migration's guards, two row-cap pins reshaped on purpose
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/admin-triage.json
  - docs/systems/trust-safety-forensics.md
  - docs/systems/admin-observability.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/database-security.md
---

# lp/triage-wiring

**Goal.** Build Will's six settled `admin-triage` answers into the admin portal and the host's side: the reason line, the verdict's note, the closed window, the escalate door, Reports' status words, and a reported item that leaves the host's view entirely (purged from the event, never in her Deleted) while a legal hold's preservation stays intact.

## The brief

**His answers** (`docs/reviews/admin-triage.json`, each note there in full; `admin-triage` round 2 redraws the queue beside you, so build these into today's layout):
- `reason=marked`: a report with no reason prints "No reason provided." muted, in place, in time order, the same for the People arm (`person-report-list.tsx` prints "No reason given." at full weight: ROADMAP's line).
- `verdict=note`: Remove goes through the portal's one confirm with an optional note, Dismiss has an optional note beside it, and `resolution_note` is written (nothing writes it today). A confirm's note is one `note` prop on `DestructiveSheet`, the fix at the source the escalate door reuses.
- `closed=window`: closed reports kept to the 30-day window, as the board drew it.
- `escalate=door`: Release hold's centred confirm, filled in from the report, its reason as the note.
- `idiom=shape`: Reports takes the shared picker and filter bar, keeping its own words (Open, Dismissed, Actioned).
- `notice=deleted`, **built as his note refines it, not as its tile**: "No note to host, just removal - they'll likely assume a guest deleted an upload of their own. However, in the case of a report leading to media removal, it should be fully purged from the event, not moved to deleted. If there's CSAM uploaded and we immediately takedown from a guest report, the host shouldn't have that visible in their deleted, regardless of inability to recover."
  - An operator's removal leaves the host's album and her Deleted at once, with no Restore, no countdown and no bell nudge (`queries/notifications.ts`'s "about to be cleared"). ROADMAP's line on the Restore that can only fail closes.
  - ★ **The legal floor, which the purge must not break** (`docs/systems/trust-safety-forensics.md`):
    - A legal hold (`media.legal_hold_at`) keeps a row from every purge.
    - Its preservation copy lives outside `events/` under the REPORT Act's one-year clock, and no sweep touches it.
    - The CSAM runbook preserves before anything is destroyed.
  - So the event's copy is purged on the purge sweep (or a dedicated one), never in the removal's own request, and never while a hold stands. The operator keeps the runbook's window to hold and preserve.
  - Refine the runbook's steps in place so the order reads true. Write the migration (a function change where the host's Deleted and the purge read operator removals), and the Orchestrator applies it.
  - Every hold stays discreet: nothing the host can read tells a removal from a hold.
- **Legal and help** (his note on `look`): "our legal terms shouldn't imply every report leads to takedown without verifiable proof of harm". Read the Terms and Privacy lines on reports (`legal-terms.tsx`, `legal-privacy.tsx`) and put proposed wording under Questions; legal words are Will's, so don't edit those files. The help (`reporting-and-safety.mdx`, `report-a-problem-as-a-guest.mdx`) says reports are for harmful content, acted on when harm is clear.

**Paths:** a function you replace starts from its newest definition in `supabase/migrations/`: `20260928120000_event_blocks.sql` replaced fourteen guest-path bodies, and `20260928130000_free_shift.sql` `tier_limits()`, both setters and `restore_event`. Add any other path to `owns` before editing it. The admin confirm's "already says Not in the album" line, in both `moderation-grid.tsx` and `report-review.tsx`, is yours to make true now. It reads as already true on an item not yet removed (build 15's red-team). `voice-wiring` has merged her uploads' new words (`TRACKER_WORDS`: "Waiting for approval" / "Not approved"), so both lines quote those.

**Verify:**
- Vitest for the note, the words and the removal's visibility.
- A rolled-back SQL check: an operator removal is gone from the host's Deleted read; a held row survives the purge; its preservation copy is untouched.
- The portal at 1440 and 375.
- `pnpm lab:smoke` whole.
- Build 16's red-team walks the portal (there are no reports today: stage one as test data).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT; each is Will's to overrule. None is a one-way door (every one is a function, a
policy or a component, and a later migration reverts it).

- **Where "leaves the host's view" lives.** Built: RLS, one conjunct on `media_host_all`, so every host read (her
  album, her Deleted and its links, the bell, the purge wrapper's selection, every count) loses an operator's removal
  at once and none can forget it. A per-read predicate was impossible without granting `removed_by_admin`, which
  would let a host read that a takedown happened. The one trace left: a host who kept an item's id finds no row at
  all, which says "gone", never "held".
- **How long the event's copy lives after a takedown.** Built: its own `purge_at` (the removal + 30 days, the
  product's one window): the operator's Undo (`closed=window`) and the runbook's time to hold and preserve; then the
  existing removed_media sweep, no dedicated one. The overrule: a shorter window for takedowns (a sooner physical
  purge, a shorter Undo and hold window).
- **An account deleted, or an event expired, while a takedown is inside its window.** Built: `held_event_ids` keeps
  that event whole until the window ends (at most 30 days), as a hold does; the account stays anonymised and banned
  meanwhile. Without it a host could delete her account the night after a takedown and take the unheld evidence
  with her (account deletion purges at the next nightly run).
- **The host's Deleted figure.** Built: exactly her two Deleted lists, inside the window. A held item she had removed
  herself outlives her list, and a figure that kept counting it would be the one number telling her a hold exists
  (the door now holds an uploader's other items, a host's own removal among them).
- **A report's Remove on an item already out of the album.** Built: made the operator's (`adoptionUpdate`), keeping
  its `removed_at`, so she cannot restore it; its closed line offers no Undo (the verdict did not remove it, so
  "undo" would have to guess where it was); Albums restores it if needed.
- **The picker on Reports (`idiom=shape`).** Built: the shared picker replaces an open report's badge and routes to
  the verbs (Dismissed is Dismiss with the note; Actioned… opens the confirm, or marks a person actioned); a closed
  line keeps a still chip, its way back the window's Undo. The overrule: the picker on closed lines too, Open as a
  reopen.
- **Hold for forensics' reach.** Built: the item and the same uploader's other items in the event (runbook step
  two), the others' reason suffixed "(the same uploader's other upload)" so Forensics' table tells them apart. The
  overrule: the reported item alone, the context held from /admin/forensics.
- **The legal words (Will's; `legal-terms.tsx` and `legal-privacy.tsx` untouched).** Proposed:
  - Terms summary: "Hosts moderate their own albums. Anyone can report harm. We review every report and act where
    the harm is clear: we can remove content, hold it, or close accounts that break these terms."
  - Terms, moderation: "...Anyone who can see an album can report it or an item in it. Reports are for content that
    breaks these Terms or the law; they are anonymous and reviewed before anything is removed. A report removes
    nothing by itself, and we act only where a breach is clear: a report we cannot verify may be closed without
    removing anything."
  - Privacy summary: "Anyone can report harm in an album. Every report is reviewed, content comes down only where the
    harm is clear, and some material must, by law, be preserved and reported."
  - Privacy, reports: "...Every report is reviewed, and content is removed only where a breach of our Terms or the
    law is clear; a report we cannot verify is closed without removing anything. Hosts can remove anything from
    their own album instantly, and a removal made by our operators leaves the host's album and her Deleted at once
    and cannot be undone by the host."
- **A held item still in the album.** The door holds an uploader's other items without removing them, and a hold
  skips the host's own acts (the guard trigger's `return null`, the per-event block's `legal_hold_at is null`), so
  after she removes or blocks, a held item stays up beside the rest leaving: a tell. Recommended, NOT built (the
  hold doctrine is his): let a host's soft remove through a hold (her Deleted takes it; restore is still refused,
  every purge still skips it), since a hold only has to stop the hard delete.
- **`profiles.storage_used_bytes` is host-readable** (her own row, a table-level SELECT) and counts every stored byte
  until the purge: over a month a host reading it through PostgREST sees a hold's bytes stay where a removal's drop.
  Recommended, NOT built (a table-level profiles revoke is the grants landmine, and no lane owns it): take the
  host's read of that one column away; no host surface reads it.
- **Evidence before the review.** A host can still Delete permanently a reported item she removed herself BEFORE an
  operator acts (`purge_media_now` refuses only holds and takedowns now). Recommended, NOT built: it skips an item
  an open report names, silently, as it skips a hold.

## System-doc edits (in place, owned facts only)

- `trust-safety-forensics.md`: the takedown's window, a bullet beside the hold's; the runbook's steps 1 and 2 in the
  order they now run (Remove on the report, then Hold for forensics inside the 30 days, the commingled context in
  the same press).
- `lifecycle-recovery.md`: the standby budget's bin and the Deleted figure (exactly her two lists, in the window);
  `media_still_removed`; the operator's removal leaving the host's view, a fact of its own.
- `admin-observability.md`: the confirm's `note`; one filter bar and picker in each inbox's words; Reports' rules
  (the verdict reads its report, the takedown that sticks, the Undo's life, the hold's reach).
- `database-security.md`: `media_host_all`'s USING and the policy-on-an-ungranted-column fact.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Library: DestructiveSheet's `note` (optional and required) and the report cards have no specimen on the
  compositions page, the one automated eye on the portal (from `triage-wiring`).
- Now: Host: `get_event_like_counts` answers a like count for every media id in her event, a takedown's and a
  withdrawal's included, so a host calling it directly meets an id no surface shows her (from `triage-wiring`).

## Handoff (replaces the chat report)

- **Commits:** the work `a3f88c61` and this manifest, both pushed to `lp/triage-wiring`. No sync: launch-prep moved
  since my base (`34efdc85`) only by records and the `src/lib/db/types.ts` regen for event_blocks (`949eca9b`; six
  commits to `e8594c3c`), neither in my reads nor my paths.
- **Gates on `a3f88c61`**, each on its own exit code (`_scratch/triage-wiring/gate.log`): typecheck 0; lint 0 (4
  warnings, none in a file I touched); test 0 (535 files, 6,062 tests); `build-lock.sh pnpm build` 0 (`/admin/reports`
  built); `lab:smoke --base http://localhost:3132` 0 (198 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths above (nine added to `owns`
  before handoff, each with its why) + the four `docs/systems/` facts + this file. No exception.
- **Items:**
  - `reason=marked`: "No reason provided." muted in place on both arms, one string (`NO_REASON`). ROADMAP's
    "People arm prints No reason given." line closes.
  - `verdict=note`: `DestructiveSheet`'s `note` prop; Remove and an album's Action confirm with it, Dismiss and Mark
    actioned one press with Add a note; `resolution_note` written. ROADMAP's "never read or written" line closes.
  - `closed=window`: one line a closed report; Undo while its own removal waits out the window, reopen then restore.
  - `escalate=door`: Hold for forensics reads its reach, then the centred confirm filled in; preserveMedia each.
  - `idiom=shape`: `TriageFilter` and `StatusPicker` take an inbox's words; Reports lands on Open.
  - `notice=deleted`, as his note refines it: the migration below plus the TS bin read; the report's Remove makes an
    already-removed item the operator's. ROADMAP's "operator's removal waits in the host's Deleted" line closes
    once the migration is applied (the grid and the bell need no code: the rows never reach them).
  - The "already says Not in the album" line made true in both confirms (`operatorRemovalTouches`, quoting
    `TRACKER_WORDS.refused`); Albums' Restore toast no longer says "approved".
  - Help: harm, acted on where clear; no suspended accounts (ROADMAP's help line closes); a removal never reaches
    her Deleted.
- **Proposed migration:** `supabase/migrations/20260928140000_operator_removal_purge.sql`, protocol in its header.
  Proved: locally on a pg17 stand-in (the check passes on the new SQL; on the old it fails at "the host still reads
  the operator's removal", and with only the policy changed at "the host purged a takedown: purged 1", the evidence
  path it closes), and on live inside `begin … rollback` (ALL HELD on event 55bcdbe0, host 6cb5fdb5; afterwards the
  live qual and `purge_media_now` md5 unchanged). md5 before (live = repo): held_event_ids 53178fab, host_storage_summary
  027f9b30, purge_media_now cea02de6, restore_event deff8a70, standby_hosts e93f8715; after (stand-in):
  87146f56, de798469, 51fd1533, 5835d9a8, b4d606bc. Advisors: no delta expected. Types: no change expected. The
  deployed build is safe on either side of the apply; the host-side red-team needs it applied.
- **Red-team staging (there are no reports):** on a disposable event with two uploads from one guest, insert an item
  report (its `event_id`, `media_id`, a reason), a wordless album report, and a person report on a test profile;
  walk Dismiss with a note, Remove (the host's album and Deleted, and her Restore and Delete permanently by id),
  the closed line's Undo, and Hold for forensics (two items held, Forensics' table). They show on production's
  portal too (one database).
- **Verified on:** the portal cannot sign in locally, so a local harness (never committed) mounted the reports page's
  content in the real `AdminShell` at 1440 and 375: the cards, the picker menu, the confirm with the carried note,
  the closed log's column (Undo, Held and nothing one width), no horizontal scroll at 375; an unsigned hold press
  answered `{"ok":false,"code":"unauthorized"}`.
- **Assets requested from Will:** none.
- **Board ideas:** none beyond the Questions (the Library specimens are Deferred).
- **Heads-up:** `src/lib/db/migration-guards.test.ts` gained section 17 at the file's end, so a lane appending there
  too conflicts textually (keep both). The Browser pane is shared: another lane drove my fronted tab onto its probe
  on :3132 (`/e/66ffc3fd…`, `POST /api/export/guest` in my `dev.log`); a lane should pass `tabId` and keep its own
  tab.
- **Calls his to overrule:** the picker on open reports only; "Remove…" and "Action…" (round two's words) with the
  confirm's verb "Remove"; the page's lede ("Reports of harm from guests and hosts…"); the empty filters' words
  ("None dismissed", "None actioned"); the help's examples of harm; Albums' Restore toast ("Restored to where it
  was before the removal.").
- **Look at first:** the migration's first change (the policy) and `src/app/admin/reports/actions.ts` (the verdict
  reading its own report, the takedown that sticks, the Undo's guarded writes, the hold loop).
