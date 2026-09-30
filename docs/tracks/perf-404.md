---
track: perf-404
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e958a1bf"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/not-found.tsx
  - src/app/layout.tsx
  - src/components/shared/trail/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/architecture.md
---

# lp/perf-404

**Goal.** The root 404 costs nothing on a page that isn't one: its tree off every route's payload, the 404 drawn exactly as today.

## The brief

**The root 404 rides every page.** `crumbs-22` measured it on `next start` (`git show $(git log --format=%h --grep='^merge: crumbs-22' -1)^2:docs/tracks/crumbs-22.md`, its first Deferred line). Next serialises each layout's `not-found` into that route's payload, so `/login`, `/pricing`, `/about` and `/help` each carry, against a root 404 that renders nothing:
- about 110 KB more HTML (16 to 23 KB gzipped);
- 43 to 56 KB more gzipped JS (10% of `/login`'s).

That is with the 404's trail already lazy. A guest album carries it too, by the same mechanism, but was not measured.

**Make the 404 cost nothing on a page that is not one**, keeping the 404 exactly as it draws today, at 1440 and at 375, and every route group's own not-found as it is (the app's, the guest's `/e/` and `/u/`, the marketing cinema's, the admin's). Two shapes, to compare:
- Next 16's `global-not-found` (doc-check it against `node_modules/next/dist/docs` first: its status in 16.2.6, what it replaces, and what it asks of the root layout);
- the 404's chrome behind one client boundary that loads only when a 404 renders.

Pick the one with the fewest ways to go wrong and say why.

**Measure before and after on `next start`:** each public route's HTML and gzipped JS (`/login`, `/pricing`, `/about`, `/help`, `/`, and a guest album by its token), in a table in your Handoff. Hold the result with a test that fails on today's code: a budget, or the 404's import graph kept off the root layout's.

**Verify:**
- the gate;
- the 404 (an unknown marketing path, an unknown `/e/` token, an unknown app route) looked at on `next start` at 1440 and at 375, before and after;
- the numbers.

**Paths:** your owns are a start. A path you need beyond them (a route group's `not-found.tsx`, a shared layout): add it to `owns` in your manifest before editing, or name a one-line exception.

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
