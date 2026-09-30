---
track: demo-stall
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "823ff4a5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - scripts/lab-demo.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - docs/systems/testing-verification.md
---

# lp/demo-stall

**Goal.** Find and fix at its root why the gate's lab:demo stalls on about-press.facts on the dev server (the kit step's navigation never leaves the browser), and teach lab:demo to name what a stalled navigation waits on.

## The brief

**Why.** The gate's `lab:demo` step has gone red on `about-press.facts` in three of the Orchestrator's last five full runs (gates 100, 103 and 107). The error is "Page.navigate did not answer in 60000ms; the rest of about-press was not pressed". It happens again with the board alone on a fresh `pnpm dev -p 3130` (`pnpm lab:demo --board about-press`: kit ok, facts timed out). Yet the whole desk presses 23 of 23 against the alias's production build.

What is known:
- the dev server's log never sees the facts step's request, so the navigation never leaves the browser;
- nothing in `src/` or `scripts/` registers `beforeunload`;
- the kit step's frames draw `PressSheet`, `MarketingHeader`, `Gather` and the lab's `Measured`/`Fit`, and the kit step's stage "moves by up to 45%".

The working guess: the kit step's renderer is busy, a measuring or motion loop under React's dev checks (Strict Mode's double effects, dev-only warnings), so the browser cannot finish unloading the page. Prove it or throw it out.

A gate that is red by habit stops being read. Make it green because the cause is fixed, never by a longer timeout or a skip.

**Do:**
1. Reproduce: `pnpm dev -p 3132`, then `DESIGN_PREVIEW_KEY=fiesta pnpm lab:demo --board about-press --base http://localhost:3132`.
2. Find what the stalled navigation waits on (CDP: `Runtime.evaluate` timing, `Performance.getMetrics`, a main-thread profile of the kit step, the requests still pending), and fix it at its root.
   - If the fix lands in production code (a marketing component's effect), the gate's PREMISE lines name what it reaches.
   - If it is in the lab kit (`src/components/lab/`), keep the kit's doors (`kit-discipline.test.ts`).
3. Teach `lab:demo` to say what a stalled navigation waits on (a busy main thread, the pending requests) in its TIMED OUT line, so the next stall names its cause in one run (`scripts/lab-demo.mjs`).

**Verify:**
- the gate;
- `lab:demo --board about-press` ten times on a fresh dev server, and once warm, 0 failing each time;
- `lab:demo --all` once on your dev server, 23 of 23.

Name the root cause in your Handoff, with the evidence that proved it.

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
