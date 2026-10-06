---
track: lab-kit-2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended, and each is listed again under the Handoff's calls to overrule.

- **Does the tools index also get a row of its own in the sidebar?** Recommended: no. The note's ask is the section's `href`, which puts the index in every tool's breadcrumbs (what a reader and `lab:smoke`'s crawl both meet); a row would make the index list itself, since the page draws the section's items. Built: the `href` only.
- **Keep a pid-derived DevTools port and refuse it when busy, or let Chrome pick?** Recommended: Chrome picks (`--remote-debugging-port=0`, the port read off the run's own profile), so a run can only reach a Chrome it started and a busy machine never fails one; `--chrome-port <n>` pins a port and refuses one that already answers (the note's refusal, as `shoot.mjs` does). Built.
- **Does a hidden option's frame freeze everything CSS-animated, or only the loops?** Recommended: everything, as the lab's own `[data-lab-view][data-paused] *` does outside frames: one declarative rule, and an entrance held at its start plays as the option is shown. A loop in script (`requestAnimationFrame`, a timer) is the frame's own, and reads the root's `data-lab-paused`. Built.
- **Does a routed frame take its pane's theme too?** Recommended: no. Its `<html>` is the site's own, written (and rewritten) by the site's theme provider, so only the scenes the lab draws itself, the portalled ones, take a pane's. Built.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, "The /design lab": one new bullet, "A frame takes its pane's theme and its option's pause" (`frame-theme.ts`, `frame-pause.ts`), and the Library bullet's clause that a frame wears the lab's own theme class (so the Specimen's split draws twice in one theme) is deleted, it being no longer true.
- `docs/systems/testing-verification.md`, "When a browser check disagrees": one bullet, a headless Chrome of your own asks for port 0 and reads `DevToolsActivePort` (`lab:demo`).

## Deferred (ROADMAP one-liners, bucket named)

Bucket "The lab and the kit":
- The lab: delete the brand board's own pause bridges now that `Frame` holds a hidden option still (`brand/deck/deck.tsx` and `deck.css`'s `data-bd-paused`, `afterglow/applied/kit.tsx`, `contact-sheet/applied/dark-page.tsx`'s video mirror), and let `the-wait/motion.tsx`'s and `demo-framing/scene.tsx`'s `useOffStage`, which climb out of the frame to its view, read the frame's own `data-lab-paused` (each in its board's next round).
- The lab and the kit: `album-perf.mjs`, `scripts/compute-model/chrome.mjs` and the Orchestrator's `usher/kit/page-console.mjs` and `kit-capture.mjs` still pick a DevTools port from a pid or at random, which can land on another lane's Chrome; ask Chrome for port 0 and read `DevToolsActivePort`, as `lab-demo.mjs` does.
- The lab: `lab:demo` reads `getAnimations()` in every hidden option's frames and fails a step whose CSS loops still run, so the pause stays proven at the gate (a drawing that defeats the bridge, an iframe a board draws itself).

## Handoff (replaces the chat report)

Evidence is under `S` = `/Users/gibby/local/ai/partyreel-wt/_scratch/lab-kit-2/` (pruned with the lane: read it before).

- **Commits, pushed to `origin/lp/lab-kit-2`:** work `a17c8fbf2` (code and tests), docs and comments `9e52ff8f1`, then this manifest alone. No sync commit: launch-prep moved to `438a57f3e` (event-header r5, event-zone, records), but nothing it brought is in an owned path or in my `reads` (`exploration.ts`), and `git merge-tree --write-tree HEAD origin/launch-prep` is a clean merge (PROGRAM.md "Sync"). The merged event-header r5 board postdates my tree, so the merge gate's `lab:demo` is its first look at it under the new frame.
- **Gates, each on its own exit code, on `9e52ff8f1`'s tree** (typecheck, lint and test ran on the same files just before it was committed): `pnpm typecheck` exit 0 (`S/gate2-typecheck.log`); `pnpm lint` exit 0 and no warnings (`S/gate2-lint.log`); `pnpm test` exit 0, 1,040 files and 13,031 tests (`S/gate3-test.log`; the two runs before it hit the 5,000 ms limit on whole-tree scan tests on a machine the other lanes had loaded (load average up to 25), 6 failures in `S/gate-test.log` and 1 in `S/gate2-test.log`, every one green alone); `zsh scripts/build-lock.sh pnpm build` exit 0 (`S/gate2-build.log`); `pnpm lab:smoke --all --base http://localhost:3134` exit 0, 206 checks, 0 failing (`S/gate2-smoke-all.log`); `pnpm lab:demo --base http://localhost:3134` exit 0, 2 open steps, 0 failing (`S/gate2-demo.log`). Beyond the gate: `lab:demo --only` on one answered step of every other board (customize.roll, customize.home, demo-framing.stage, the-wait.arrival, brand.vision, host-dashboard.chooser, create-wizard.add, event-header.doors, drive-export.way-in), all ok, exit 0 each (`S/gate-demo-boards.log`, on `a17c8fbf2`'s code). `lab:demo` prints `PREMISE identity: ...` only because this lane edited design-system.md's lab section; identity's own facts are untouched.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths (`scripts/lab-demo.mjs`; `src/components/lab/frame.tsx`, `frame-pause.ts`, `frame-theme.ts` and their two tests, `stage.tsx`, `step.tsx`; `src/app/(dev)/design/_data/nav.ts` and `nav.test.ts`; `src/app/(dev)/design/(shell)/lab/tools/lab-demo.test.ts`) + this file + the two system docs listed above (`docs/systems/design-system.md`, `docs/systems/testing-verification.md`). No board folder, no `lab-smoke.mjs`, no migration.
- **The items:**
  - **A hidden option's frames hold still.** `Frame` mirrors its view's `data-paused` into the document it holds, routed or portalled, on every new document (`src/components/lab/frame-pause.ts`; `frame.tsx` landmine 9): the root wears `data-lab-paused`, one adopted rule freezes every CSS animation under it, video and audio stop and start again only if the frame stopped them. `frame-pause.test.tsx` (10 rendered frames): 7 red on the old frame, the other 3 pin what must not change. In a real Chrome of my own (`S/pause-probe.mjs`, `S/video-probe.mjs`): identity.loading's two hidden options ran 4 loops in each frame before (`S/pause-probe-before.json`) and hold them paused after, the shown option running and the hold following each press (`S/pause-probe-after.json`, `S/pause-probe-final.json`); a real `<video>` injected into every option's frame played in all three at once before (`S/video-probe-before.json`) and plays in the shown one only after, resuming where it stood (`S/video-probe-after.json`); the brand board's 42 portalled frames hold 94 loops with none running, and none of the videos playing, in its two hidden decks, while the shown deck runs (`S/pause-probe-brand-after.json`); the bridge writes no console error or warning (`S/console-probe.mjs`: the only warnings are the scene's image-preload notes).
  - **A lab run never drives another lane's Chrome.** `lab-demo.mjs` asks Chrome for any free port and reads it off its own profile (`DevToolsActivePort`); `--chrome-port <n>` pins one and refuses a port that answers (exit 3); a Chrome that exits is said at once, not after a 12 s poll. `lab/tools/lab-demo.test.ts` (4): all red on the old script (the first only after the old run's 12.5 s poll of a port that was never its own), green on the new. A real run through the new discovery: `S/demo-identity-loading-1.log`. The note's `lab-smoke.mjs` half is not true of the code: it launches no browser (it crawls server HTML), so there was no port there to refuse.
  - **The tools index is linked and crawled.** The Tools section carries `/design/lab/tools` as its `href`, so every tool's crumbs read Lab > Tools > the tool (`S/before-tools-motion.html` has no link to the index, `S/after-tools-motion.html` has it), and the crawl visits it (`S/smoke-nav-before.log`: 205 checks and no `/design/lab/tools` row; `S/gate2-smoke-all.log`: 206, row 195 answers 200). `nav.test.ts` (2): both red on the old nav.
  - **A frame takes its pane's theme.** A portalled `Frame` wears the nearest `.dark` or `.surface-paper` above it, else the page's class as ever (`frame-theme.ts`). `frame-theme.test.tsx` (8, the real `Specimen` split in a dark and a light lab included): 6 red on the old frame, the other 2 pin the unchanged path. Real Chrome on the Library's photo-section split in a dark lab: both frames wore `dark` before (`S/theme-probe-before.json`); the paper pane's frame wears `surface-paper` and draws light after (`S/theme-probe-after.json`, `S/theme-probe-final.json`).
  - **The docs and two comments:** the two system docs above; `stage.tsx` and `step.tsx` now say where a hidden option's pause goes.
- **Assets requested from Will:** none.
- **Board ideas:** (1) `lab:demo` could read `getAnimations()` in hidden options' frames and fail a step whose loops still run (a Deferred line above); (2) the boards that bridged the pause by hand (brand's deck, `the-wait`, `demo-framing`) can drop their own next round (a Deferred line above); (3) the tools index would be findable from the sidebar and the palette with a row of its own, if Will wants it there (`ToolsIndex` would skip it).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** (a) the tools index is linked by the section's `href` (each tool's crumbs), with no sidebar row of its own; (b) `lab-demo.mjs` lets Chrome pick its port rather than keeping a pid-derived one and refusing it when busy (a pinned port is still refused); (c) a hidden option's frame freezes every CSS animation, finite entrances included, as the lab's own rule does outside frames, so an entrance held at its start plays as the option is shown, and script loops are not reached; (d) only a portalled frame takes its pane's theme.
- **Look at first:** `src/components/lab/frame-pause.ts`'s header; `scripts/lab-demo.mjs`'s Chrome section ("THE DEBUGGING PORT IS CHROME'S OWN"); press the tabs of `/design/lab/identity?session=identity.loading` and read `document.querySelectorAll("iframe")[i].contentDocument.getAnimations()` of a hidden option; the crumb on `/design/lab/tools/motion`; the split button on `/design/library/photo-section`. The four ROADMAP notes this lane ships (the stage's pause, the DevTools port, the tools index, the frame's theme) are the Orchestrator's to delete at the merge, with the three Deferred lines above to add under "The lab and the kit".
