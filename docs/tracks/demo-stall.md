---
track: demo-stall
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "823ff4a5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - scripts/lab-demo.mjs
  # the root cause turned out to live in Next itself: its backport and the test that guards it (Handoff, exceptions)
  - patches/next@16.2.6.patch
  - src/lib/next-image-optimizer.test.ts
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

- Keep `patches/next@16.2.6.patch` (the repo's first dependency patch) until a stable Next carries
  vercel/next.js#98168? **Recommended: keep (built, `e13ab1fc`).** It is the root fix: without it any requester that
  hangs up early (Will clicking through boards on a cold localhost, a lane's Browser pane) wedges those image sizes
  until the server restarts, and lab:demo is only safe because it now leaves pages differently. Dropping it is
  reverting `e13ab1fc` and the doc's patch sentence in `2fa3ef86`; `cd57ef5c` stands alone.
- Should `usher/kit/merge-lane.sh` run `pnpm install --frozen-lockfile --prefer-offline` when a merge changes
  `pnpm-lock.yaml`? **Recommended: yes.** Today a lockfile change reaches `node_modules` only by hand, and this lane's
  guard goes red in the primary checkout until it does (by design). Not built: `usher/` is the Orchestrator's.

## System-doc edits (in place, owned facts only)

- `docs/systems/testing-verification.md`: the ★ `lab:demo` stall line refined in place (the optimizer's mechanism, the
  patch and its guard, the `curl` check, lab:demo's part; its stale "then find what cancels the images" answered), and
  one new bullet: DevTools holds every renderer call while a page's own navigation is pending.

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: at the Next upgrade, carry `patches/next@16.2.6.patch` forward while the new version still has the
  hung-up-requester bug (16.3.8 does; `src/lib/next-image-optimizer.test.ts` says which), and delete it on one with
  vercel/next.js#98168 (16.4 on).

## Handoff (replaces the chat report)

- **Commits, pushed:** `cd57ef5c` (lab-demo), `e13ab1fc` (the Next patch and its guard), `2fa3ef86` (the system doc),
  then this manifest. launch-prep moved since the base (crumbs-31 at `5898b6d8`, records to `493facd3`), touching
  none of these paths or the reads, and `git merge-tree HEAD origin/launch-prep` merges clean: no sync.
- **The root cause, with its evidence** (every artifact under `partyreel-wt/_scratch/demo-stall/`):
  - Not the renderer: at the stall the renderers sit at 0.1% of a core (`reporter-nohop-2.txt`). The evaluate that
    goes unanswered there is DevTools holding renderer calls while the page's own navigation is pending
    (`harness/suspend.mjs`: unanswered 3 s at 0% CPU, answered at commit).
  - The facts navigation never left Chrome. In the netlog (`run-2/netlog.json`), its request sat in
    `HTTP_STREAM_REQUEST` from 56.44 s to 116.38 s. All six of Chrome's HTTP/1.1 connections to the server were held
    by `/_next/image` requests for gather photographs at `w=256`, sent at 18.72 s and never answered. `run-3` is the
    same, two of its six being duplicates released at 38.49 s by Chrome's 20 s cache lock.
  - The server never answered them because of Next 16.2.6's `fetchInternalImage`. It reads the source through a
    mocked response bound to the requester's socket, `send` drops the file unended once that socket has closed, and
    the response cache's `Batcher` shares that never-settling result with every later request for the size. Proven
    without the lab (`harness/abort-probe.mjs`): 60 requests aborted at 10 ms, then the size gets no answer in 15 s
    while a control size answers in 98 ms. Patched, the same size answers in 14 ms. Upstream fixed it in
    vercel/next.js#98168 (16.4.0-canary.27); 16.3.8, today's latest stable, still has it.
  - lab:demo itself cancelled those first requests. It resized the 375 page it was leaving to 1440x3000, the stage
    re-fitted, and about 65 requests for new sizes went out at 18.53 s, cancelled at 18.67 s by the navigation
    (`run-2/events.jsonl`; netlog: sent and cancelled within the same 10 ms).
  - Why it hit every gate: `merge-lane.sh` wipes `.next/dev`, so every gate's lab:demo meets a cold image cache.
    The alias passes because Vercel optimizes images on its own platform, over HTTP/2.
  - A second holder: the back/forward cache kept a page that was left alive, with its six held connections, for
    about a minute (`hopnet/netlog.json`: 10.31 s to 108.15 s). With it off, the same run on the same wedged server
    passes.
- **Gates** on the tree of `2fa3ef86` (run before the commits, nothing edited after), each on its own exit code,
  logs `gate-*.log`: typecheck 0, lint 0, test 0 (670 files, 7,977 tests), build 0, `lab:smoke` 0 (175 checks),
  `lab:demo` 0 (scope all from `package.json`: 23 steps, 0 failing, cold image cache, 515 s, `gate-demo-all.log`).
- **The brief's runs:** `about-press` 10 of 10 green on a fresh dev server (each start `.next/dev` removed, 0 images
  cached; 0 of 120 sizes wedged after each: `final-fresh*/summary.txt`). Warm on the same server: green, 78 s
  (`final-warm.txt`). `--all`: 23 of 23 (the gate's). On the alias: green (`alias-about-press.txt`).
- **The A/B** (cold servers, 3 runs each): stock tree, 3 of 3 TIMED OUT (`repro-1.txt`, `run-2`, `run-3`). Harness
  fix alone, 3 of 3 green (`harness-only/summary.txt`). Patch alone with the old harness, 3 of 3 green
  (`patch-only/summary.txt`).
- **The reports, on a really wedged stock server:** WAITING ON names the whole chain (`reporter-nohop-2.txt`, with
  the hop disabled to recreate the deadlock): the navigation's request never left Chrome, six held `/_next/image`
  sizes with their URLs, 102 queued, the renderers idle, and the server answering a new connection in 101 ms. With the
  real script nothing stalls, and UNANSWERED prints under each step (`new-on-wedged.txt`).
- **Lane check:** `docs/systems/testing-verification.md`, `docs/tracks/demo-stall.md`, `package.json`,
  `patches/next@16.2.6.patch`, `pnpm-lock.yaml`, `scripts/lab-demo.mjs`, `src/lib/next-image-optimizer.test.ts`.
  Exceptions:
  - `package.json` and `pnpm-lock.yaml` are the patch's registration, written by `pnpm patch-commit`. They are root
    files no lane can claim: `track-manifests.test.ts` refuses a one-segment prefix.
  - The patch and its test joined `owns` when the root cause turned out to be Next's.
  - The doc is listed under System-doc edits.
- **Items:**
  - Next's image optimizer answers a size whose first requester hung up (the patch). Its guard test is red on stock
    16.2.6 with its control green, and green patched.
  - lab:demo no longer starves its own server. A new window or media is set on about:blank between pages, and its
    Chrome runs with the back/forward cache off.
  - A TIMED OUT row prints WAITING ON: the navigation's request, the held and queued requests, the renderers' CPU and
    the server's answer on a new connection.
  - A step whose pictures went without requests the server never answered prints UNANSWERED.
  - The system doc's stall line is refined in place.
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The dependency patch is the change of kind:
  Look at first.
- **Calls his to overrule:**
  - The Next patch stays until a stable Next carries the fix.
  - Its guard goes red in any checkout that has not run `pnpm install` since the merge.
  - UNANSWERED prints and never fails: the board may be fine while the server starved it.
  - lab:demo's Chrome runs with the back/forward cache off.
- **Look at first:** `e13ab1fc`. After merging, run `pnpm install --frozen-lockfile --prefer-offline` in the primary
  checkout (and each live worktree) before the gate's `pnpm test`, or `next-image-optimizer.test.ts` is red: the
  patch reaches `node_modules` only on install. Restart the dev server after installing. ROADMAP's `about-press.facts`
  stall line can retire.
