---
track: hide-strikes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "963a2fb8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/migration-guards.test.ts
  - docs/systems/testing-verification.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
  - docs/systems/trust-safety-forensics.md
  - supabase/migrations/20260929140000_triage_r2.sql
---

# lp/hide-strikes

**Goal.** Will's call B: the instant hide's bar becomes three dismissed child-abuse reports in a rolling 180 days, each lapsing 180 days after its dismissal, so a well-meaning reporter he once disagreed with keeps the hide; one migration replacing create_report, proved rolled back, with every line that states the bar rewritten.

## The brief

**Why.** Will overruled call B on 2026-09-30: the instant hide's bar becomes three strikes that lapse. His words: "I think we should shift into something like a three-strike policy that lapses after 180 days. I don't want to prevent a well-meaning reporter from a second report if I simply disagree with the first."

Today one dismissed child-abuse report from an address bars its instant hides for good. The rule is in `create_report` (`supabase/migrations/20260929140000_triage_r2.sql:1114-1117`): `exists (… reporter_hash = p_reporter_hash and kind = 'child' and status = 'dismissed')`.

**Build (recommended): three strikes in a rolling 180 days.**
- A strike is a child-abuse report from that address (its `reporter_hash`) that the operator dismissed. It lapses 180 days after its dismissal.
- An address holding three live strikes has lost the instant hide. Its report is still filed the same and heads the queue, as today.
- Undoing a dismissal takes its strike back, since the count reads the reports as they stand.
- Everything else about the hide stays: never the event's own host, 3 an address and 5 an event in 24 hours, advisory-locked, a confirmed address only.
- Name the numbers (3 strikes, 180 days) once, where the rule lives, with a WHY comment quoting his reason.

**The migration** replaces `create_report` (create or replace, with the same signature and the same grants: revoke from public, then grant exactly as today; see `docs/systems/database-security.md`).
- It reads the dismissal's time from whichever column records when a report was dismissed; find it. If none does, add one written at the close and backfilled from the best column there is, and say so under Questions.
- A rolled-back proof sits at the file's foot, in `triage_r2.sql`'s shape, and shows:
  - an address with two live strikes still hides;
  - a third strike bars it;
  - a strike 181 days old no longer counts;
  - an undone dismissal no longer counts;
  - the other limits still hold.
- Run the proof yourself with the Supabase MCP's `execute_sql`, inside `begin; … rollback;`. Otherwise your SQL is read-only, and you never call `apply_migration`: the Orchestrator applies the file by protocol.
- Its guard goes in `src/lib/db/migration-guards.test.ts`: the winning `create_report` counts strikes within the window. It must fail on today's migration set.

**The words.** Every place that states the bar says the new rule:
- `docs/systems/admin-observability.md` (the instant hide);
- `docs/systems/testing-verification.md`: willg97's and partyr33l's addresses each carry one dismissed child-abuse report. That is one strike now, so both can instant-hide again; say what a red-team may walk;
- any help article, form or queue line that states the bar (grep for it).

**Verify:**
- the gate;
- the guard red on today's migration set;
- the rolled-back proof's rows, quoted in your Handoff.

This merges after milestone 31 ships. Prod's code calls `create_report` with the same signature, so the Orchestrator applies the migration by protocol once it is merged.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
