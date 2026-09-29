---
track: triage-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
