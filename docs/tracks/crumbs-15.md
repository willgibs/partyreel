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
