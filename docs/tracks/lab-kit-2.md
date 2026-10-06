---
track: lab-kit-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e7ac98fe"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/frame
  - src/components/lab/stage
  - src/components/lab/step
  - scripts/lab-demo.mjs
  - scripts/lab-smoke.mjs
  - src/app/(dev)/design/_data/nav
  - src/app/(dev)/design/(shell)/lab/tools/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/lab/exploration.ts
---

# lp/lab-kit-2

**Goal.** The lab's own rising tide: a hidden option's loops pause inside frames too, a lab run never drives another lane's Chrome, the tools index is linked and crawled, and a frame takes its pane's theme.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

**The lab's own rising tide:** four ROADMAP notes on the lab and the kit, each quoted whole. Read the code each names, fix it at its root, and pin each with a test that fails on the old code where a test can see it (the port refusal, the nav's link, the frame's theme and the pause bridge by a rendered frame):
- The lab: the stage pauses a hidden option with `[data-lab-view][data-paused] *`, which cannot reach inside a `Frame`'s own document, so every board with loops or video in frames keeps running when hidden; the brand deck bridges it itself (`deck/deck.tsx`, `data-bd-paused`), and a bridge in `Frame` would cover every board (brand-r1).
- The lab: `lab-demo.mjs` and `lab-smoke.mjs` pick a DevTools port by pid and never check it is free, so on a busy machine a lane can drive another lane's headless Chrome (brand-r1 did once); refuse a port that already answers, as brand-r1's `shoot.mjs` does.
- Lab: nothing links to `/design/lab/tools` (the nav's Tools section has no `href`), so the index is reached by its URL alone and `lab:smoke` never visits it; give the section the index as its `href`.
- The lab: `Frame` copies the page's theme class, not its pane's, so the Specimen's light and dark split draws a frame's scene twice in one theme; read the nearest `.dark` or `.surface-paper` ancestor.

Two board lanes are open (event-header r5, brand r2) and own their folders: never edit a board's folder. The brand deck's own pause bridge (`sandbox/brand/deck/deck.tsx`) becomes redundant once `Frame` bridges every board; leave it and write a Deferred line for the board's next round. Prove the pause on a board with a loop or a video in its frames (identity's working step, or the customize board), by `lab:demo` and a headless Chrome of your own. The whole gate, with `lab:smoke --all` once at the end.

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
