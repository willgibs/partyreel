---
track: crumbs-67
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "04897812"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/grace-banner.test.tsx
  - src/components/app/event-feed/review-room-hub.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-67

**Goal.** Two jsdom tests that fail only on a loaded machine wait on what they mean, never on time, so the merge gate stops crying wolf.

## The brief

**Why:** two tests failed today only while other lanes built and measured on the same machine. Each passed alone and on a re-run:
- `src/components/app/dashboard/grace-banner.test.tsx`: "★ opens the size list counting down to her own plan's cap";
- `src/components/app/event-feed/review-room-hub.test.tsx`: "reads its panel as its page: an arrow from the panel itself puts the cursor on the first tile" (`expected null to be 'a'`).

A flaky gate costs a re-run and a judgement every merge.

**The work:** find why each depends on timing (a fixed timeout, a focus that lands a tick later, a timer the test doesn't control) and make it wait on the state it means. Use `findBy`/`waitFor` on the observable result, fake timers advanced by the test, or focus awaited the way the component sets it. Keep each test's assertion and its ★ scar; change only how it waits. If the component itself has a race a user could hit, write it as a Question (that is a product bug, not a test fix) and leave the component alone.

**Prove it:**
- each file passes 30 times in a row under load: `for i in $(seq 30); do npx vitest run <file> || break; done` while `pnpm build` runs through the build lock in another shell;
- then the whole gate.

Nothing of yours requests Vercel. Work economically, with no helper agents.

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
