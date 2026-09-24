---
track: systems-lean
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b2a713dd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/SYSTEMS.md
  - docs/systems/architecture.md
  - docs/systems/auth-accounts.md
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - docs/systems/durability-backups.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/profiles-social.md
  - docs/systems/testing-verification.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/systems-lean

**Goal.** The system docs outside the design and guest surfaces keep only what a strong model cannot find or infer (invariants, landmines, project facts, Will's standing rulings), organized for retrieval.

## The brief

**Will's words (2026-09-24, verbatim):** "Any internal docs that offer info or guidelines you wouldn't need anyway (like a Vercel/Next.js rule your already know/get in Context7, or design rules where you can simply check current tokens or components in library/production) are redundant. Also, our history is mostly redundant." And: "as a human, I only read docs for what I don't know. Rereading something I already know is a waste of time. Additionally, I don't read every textbook in existence over again for every task - I target the relevant information. Our docs should flow similarly, where anything included offers an actual benefit, and rather than being dumped in bulk, is organized for retrieval when relevant." And: "every added line distills the rest."

**The job.** Each of your thirteen docs keeps only what a strong model cannot find or infer:
- the invariants and don't-reverts: why a thing is the way it is, where the code alone would invite a "fix" that breaks it;
- the ★ landmines;
- the facts specific to this project;
- Will's standing rulings, as current rules without dates.

**What goes:**
- platform knowledge that current docs give;
- what one read of the code shows: tables of values, file lists, function-by-function walkthroughs;
- history: dates, incident narratives, status words (BUILT, SHIPPED, "was", "used to");
- a fact whose home is another doc (point there once).

When unsure, keep an invariant and cut an explanation. These docs guard against regressions, so a cut invariant costs more than a long line.

**Organize for retrieval.** Each doc opens with the questions it answers. Its sections follow the task that would send someone there. `docs/SYSTEMS.md` stays the index: one line per doc saying when to open it.

**Pointers.** Code comments and other docs cite these files, sometimes by section (`git grep -n "<name>.md"`). Keep a section's name where something cites it, or list each pointer to change in your Handoff, since you own only these docs.

**Found by the docs lane:**
- `admin-observability.md`, "What binds the admin's design (Will, 2026-09-18 and 2026-09-20)": his rulings stay as current rules; the dates go.
- `database-security.md`: "Postgres integer literals are int4" is platform knowledge.
- `testing-verification.md`, "Dev-server CSS (localhost only)": keep the project-specific ★ (worktrees on one port serve each other's CSS) and trim the Turbopack mechanics.
- `durability-backups.md` and `trust-safety-forensics.md`: the status words and dated incident quotes in their headings go.

**Not in this lane:**
- `design-system.md`, `marketing-content.md` and `host-app.md`: the next pass, after the Library changes land.
- `guest-flow.md`: the held reel lane owns it.

**Hand off with:**
- a table per doc: words before and after;
- the kinds of line cut, one example each;
- the invariants and ★ lines kept, counted;
- the pointers to change outside the lane.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` green (the docs tests read these files); every link in a changed doc resolves; the Handoff's before-and-after table.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
