---
track: crumbs-71
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "dc2855bb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/export/
  - src/components/app/export/
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-71

**Goal.** Two ROADMAP crumbs: a download's Try again waits for the line to come back and says so; profiles-social.md says a name-only guest's disc colour is kept per ticket.

## The brief

**The fixes:**
1. **Downloads: Try again is offered while the browser says it is offline.** Hold it until `online` fires and say so ("Waiting for your connection…", then Try again). Use the toast's existing words and seams (`src/lib/export/walk.ts`, `src/components/app/export/`), pinned by a test that fails on the old code.
2. **Docs:** `docs/systems/profiles-social.md`'s line on a name-only guest's own header disc gains two facts: the answer is kept per ticket (`pr_guest_seed_<album>`, bound to the ticket by a hash of it, crumbs-65), and a first load holds the disc back and fades it in.

Wiring rigor for fix 1 (it ships): the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3132 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
