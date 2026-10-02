---
track: lab-prefetch
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/step.tsx
  - src/components/lab/step.test.tsx
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/(shell)/lab/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/proxy.ts
  - src/components/lab/frame.tsx
---

# lp/lab-prefetch

**Goal.** Stop the lab's keyless prefetch 404s on production builds at their source (build 38's red-team LOW), in the shell and the gate only.

## The brief

**The LOW** (ROADMAP: "The lab: a production build logs a 404 for each keyless prefetch"). On a production build the desk logs "Failed to load resource: 404" in two places:
- a board's thumbnail scrolling into view, from a drawing's production `<Link href="#">`. Next prefetches the current route's tree without the query string (`GET /design/lab?_rsc`, segment `/_tree`, no key), and the gate refuses it;
- every step page, through `src/components/lab/step.tsx`'s "Open the whole board", a plain `next/link`.

The shell's own links already take `prefetch={false}` for exactly this.

**Fix it at its source**, so no link drawn on any board, today's or tomorrow's, can do it: the shell's and the kit's frame's links stop prefetching a keyless route (a `prefetch={false}` at every lab link the shell or the frame renders, or one place the frame turns prefetching off for everything drawn inside it, whichever holds for a board's own production `<Link>`). The gate (`src/lib/design-gate/`, `api/design-gate`) is the Orchestrator's and stays as it is; if you find the gate is the only root fix, say so in your Handoff with the change it needs, and ship the link fix.

**Boundaries.** Shell and gate only: no board folder (`src/app/(dev)/design/sandbox/`), and no change to the kit's exports, since boards are cut tonight on them. Name it in your Handoff if the frame (`components/lab/frame.tsx`) must change.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; a production build served on port 3135 (`pnpm start -p 3135` after the locked build), the desk and two step pages opened in a headless Chrome of your own with every thumbnail scrolled into view: zero 404s in the console; `pnpm lab:smoke --base http://localhost:3135`.

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
