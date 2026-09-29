---
track: crumbs-15
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "818555b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/reports/
  - src/lib/db/mutations/report.ts
  - src/lib/db/mutations/report.test.ts
  - src/lib/db/queries/event-doors.ts
  - src/lib/db/queries/event-blocks.ts
  - src/lib/db/queries/social.ts
  # added at boot (2026-09-29): every other path a seam reaches, found by the grep, the two Handoffs and the compiler
  - src/lib/db/triage-seam.ts
  - src/lib/db/queries/reports.ts
  - src/app/admin/reports/actions.ts
  - src/lib/lifecycle/reclaim.ts
  - src/lib/lifecycle/sweeps/removed-media.ts
  - src/lib/db/mutations/media.ts
  - src/lib/db/mutations/media.test.ts
  - src/lib/db/mutations/event-doors.ts
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/events.ts
  - src/lib/db/queries/events.ts
  - src/lib/db/queries/event-doors.test.ts
  - src/lib/db/queries/social.test.ts
  - src/app/api/album/guest/owner-gate.test.ts
  - src/lib/db/mutations/event-doors.test.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/events/closed-door.server.ts
  - src/lib/events/closed-door.server.test.ts
  - src/lib/events/album-viewer.server.test.ts
  - src/app/api/guests/door/
  - src/lib/db/mutations/event-blocks.ts
  - src/lib/db/mutations/event-blocks.test.ts
  - src/lib/db/queries/event-blocks.test.ts
  - src/app/(app)/account/social-actions.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-15

**Goal.** Drop the missing-schema seams the doors and the triage rebuild carried until their migrations applied, now dead code, changing no behaviour.

## The brief

The two lanes that merged today, `settings-wiring` (`7c0fbcb1`) and `triage-r2-wiring` (`1b29be3a`), each wrote typed and runtime seams so their code ran before their migrations applied (a missing schema read as today's three doors, `doors_schema_missing`; the report route's fallback while `create_report`'s new signature and columns were missing). Both migrations are applied now (`event_doors` at `20260929131041`, `triage_r2` at `20260929131921`) and `src/lib/db/types.ts` is regenerated (`6c64d5c8`), so the seams are dead code: triage_r2's header step (6) says to drop them. Find every one (`grep -rn "schema_missing\|schemaMissing\|SCHEMA_MISSING" src`, and the seams each lane's Handoff names: `git show 7c0fbcb1^2:docs/tracks/settings-wiring.md`, `git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md`) and remove them, reading the regenerated types directly, with each test reshaped on purpose keeping its scar and saying why. Change no behaviour: the doors and the reports act exactly as they do on build 23.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT and his to overrule; none is a one-way door (a later change restores a seam).

- **The two older seams the grep names go with the doors' and the triage's.** `blocks_schema_missing` (event-safety
  r1, applied 2026-09-28) and `social_schema_missing` (profiles-social, applied 2026-07-08) match the brief's grep and
  their files are in `owns`: the same dead code from migrations applied long ago, and the social seam's own comment
  says to delete its catches "if you want post-apply failures to surface louder". Built: both go. The overrule: keep
  them, and only the doors and the triage go.
- **A missing schema is now an error like any other read's, never a degraded answer.** The seams answered "today's
  three doors", "no held door", "nobody is blocked" (the fail-open one), "filed the old way" and "the held rows only",
  each captured. After the apply an absent object can only be a regression, so it throws (a route's 500, the page's
  error boundary, Sentry) exactly as a broken read does everywhere else. Nothing changes on build 23, where every
  object exists. The overrule: leave a degraded answer for the reads whose absence is safe.
- **`readDoorStanding` loses its `visibility` argument**, whose only reader was the seam (today's three doors); its
  caller and the tests that pinned it follow.
- **Not in this lane, left standing** (Deferred below): the same shape from other applied migrations
  (`isDeletionSchemaMissing`, the claims' defensive reads, `NotificationPrefsRow`), which neither the grep nor the two
  Handoffs name.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`, the held door's check-in line (a one-line exception, it is in `reads`): "a missing schema or event
  answers `moved`" becomes "a missing event answers `moved`", because a missing schema now throws.

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
