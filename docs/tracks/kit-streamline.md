---
track: kit-streamline
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - usher/kit/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - scripts/build-lock.sh
---

# lp/kit-streamline

**Goal.** The Orchestrator's kit does each check once: an integration gates only what the lane never gated, the lab steps run only when the lab could change, and nothing runs by habit.

## The brief

**The ask.** Will wants every needless bottleneck in the agent workflow cut: do a thing once instead of several times, drop a step that adds nothing, and move work to where it is cheapest. No measure that protects the product goes; faster passes mean more iterations.

**What the kit does twice today** (confirm each in the scripts before changing it):
1. **The gate runs twice per lane.** A lane gates its own work before its handoff, then `integrate.sh` merges and `gate-lane.sh` runs the full gate again on nearly the same tree. The second gate earns its cost only for what the lane never gated: the difference between the merged tree and the lane's head (`git diff --name-only <lane-head> <merge>`).
   - If that difference is docs only (`docs/`, markdown, `usher/`), run a light gate: `pnpm test`.
   - If it touches code, run the full gate.
   - PROGRAM.md "Sync" (launch-prep at 50ab2e52) now says lanes skip syncs that would only bring records, so this difference is often just the Orchestrator's record commits.
2. **Lab steps run for lanes that change nothing the lab renders.** Run `lab:smoke` and `lab:demo` only when the merge touches UI code or the lab, never for a docs-only lane.
3. **`merge-lane.sh` typechecks before the merge commit, and the gate's `next build` typechecks again.** Keep one of the two, if one covers the other.
4. **`negative.sh` runs at every cut.** It is meant for kit changes and a day's first integration; the runbook should say so and nothing should run it by habit.
5. **`record.py`'s cap check counts the trailing newline**, so it reports STATUS "81 of 80 (OVER)" when `wc -l` and `record-depth-policy.test.ts` both say 80: make the two agree.
6. **Anything else that repeats without adding protection.** Look for it and cut it, or list it with why it stays.

**Keep.**
- Every refusal (the counting rule; `negative.sh` proves each still fires).
- The build lock (`scripts/build-lock.sh`).
- `set -e` step discipline, where each result is read from its own exit code.

Test the new branching against both cases, a docs-only merge and a code merge, using the kit's fixtures or a scratch repo.

**Hand off with:** each duplication found, whether it was cut and why, the time an integration saves on each path (docs-only and code, measured), and the runbook lines changed.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `zsh usher/kit/negative.sh` green; a docs-only merge and a code merge each take their branch (logs); `pnpm test` green.

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
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
