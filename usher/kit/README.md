# The kit

> The counting rule (2026-09-20, after vina's question on Moltbook): a refusal is written into a tool only after a mistake
> was actually made and actually cost something, never in anticipation, and it encodes the SHAPE of the mistake, never the
> instance, so it prunes nothing a correct run would do. The negative control proves each fires on bad input; every ordinary
> day proves it stays silent on good work. The count is a design signal: five refusals across seven tools after four days;
> fifty would mean the design upstream of the scripts is wrong, not that the agent is careful.

The scripts the Orchestrator runs to integrate a lane. They read the repo path and the session scratchpad from the
constants at their heads; a new session sets `$S` to its own scratchpad and runs them from the repo directory.

- `integrate.sh <track> <handoff-sha> <board> <msgfile>` (2026-09-20): the merge and the gate as ONE chain, each step
  gated on the previous one's exit and its own line (`MERGED <sha>`, `GATE<N> DONE`), the gate number taken from the
  scratchpad's highest `gate<N>.log`, every `EXIT` read and counted; run detached and wait on `INTEGRATE DONE`. It
  exists because two integrations in one day chained a gate on a script's tail: never chain on a tail, gate on exits.
- `merge-lane.sh <track> <handoff-sha> <msgfile>` (the sha SHORT, 8 chars: it compares short shas): the `--no-ff` merge with the three registry files and the
  library resolved, the manifest deleted, the artifact regenerated, typecheck and the registry tests before the commit; it clears `.next/dev` first (a killed dev server leaves a truncated
  `.next/dev/types/validator.ts` the typecheck reads) and prints the typecheck error instead of a bare STEP FAILED.
- `gate-lane.sh <N> <board>`: design:rules, the specimen collector, lint, test, build, `lab:smoke`, `lab:demo`, each on
  its own exit code, on :3137; `GATE<N> DONE` at the end for a wait loop; the harness's own negative control first (one step known to move, `seed-avatar.look`,
  pressed before the board's demo; if it reads FROZEN the run is blind and a frozen step below is the harness, not the
  board: `gate<N>-sight.log`), then `lab:demo` retried once on the warm server (a cold frame compile under
  three concurrent gates stalls CDP past 60 s and reads TIMED OUT; the retry is the test, not a longer timeout); it waits up to four minutes for the built server to answer (a big build once needed more than 90 s, and the smoke ran against nothing).
- `alias-ensure.mjs` (`SHA=<short> FULL=<full>`): THE launch-prep deployment (no push creates one since 2026-09-20):
  finds or creates one per project (app, admin) for a `[preview]` commit, waits for both READY, assigns both
  aliases by hand, reads the served stamp; exit 1 only when the app's alias did not move. `vercel-lib.mjs` is its client (the token from
  `.env.local`).
- `desk-sections.mjs` / `desk-check.mjs`: the served desk per section; the library page's mention of a contract.
- `make-manifests.py <cut-sha> [tracks]`: the lane manifests generated from the plan file's Lane sections with
  disjoint `owns`.
- `spawn-prompt.txt`: the agent spawn prompt with `{track}`, `{port}`, `{model}` placeholders.
- `batch-reader.mjs` (`< batch.txt`, `--json`, or `--board <id>`): a review paste read beside the boards it answers:
  each verdict's question, the chosen option's label and meaning, confirms or overrules the recommendation, what it
  lands, his note verbatim, and the lab's deep link to the step (`see: /design/lab/<board>?session=<board>.<ask>`) so the
  drawing and the sentence are read together; the specs parsed with TypeScript, never imported. The transcript tool judges the paste;
  this says what it means, so lanes are cut from the boards' own words.
- `test-delta.sh <base-sha>`: the tests at HEAD against the tests at a base commit, by name (`vitest list` on a
  throwaway worktree, sorted, `comm`), for a gate whose count moved with no test file in the diff. Tonight's answer
  was the deleted manifest's own two generated tests.
- `board-card.mjs <board...>` or `--desk`: one screen per board (the RULINGS row's title, surface, ruling and `lives`
  as the wiring's first `owns`; the spec's asks with their recommendations; what the ledger answered; which asks an
  earlier ruling reaches), or the whole desk in order, one line each. `batch-reader.mjs` exports its spec parser for it.
- `wave6-check.mjs` (pattern): the served alias against a wave's ruled lines through the HTML, no key. And a rule the
  night taught: the built-in pane is one browser every running lane may also drive, so never CLICK in it while lanes
  run (a click meant for the alias landed on a lane's localhost page); navigate and read, or fetch.
- Two rules from the small hours: when a lane's Handoff claims a retirement, read `merge-lane.sh`'s "desk boards: N"
  line against the expectation (a retiring board drops the count by one; if it does not, retire it by hand: registry,
  boards, DESK_ORDER, the SandboxId union only, the RULINGS row shipped, the sandbox removed, the ledger gone); and a
  chain that commits after tests gates on vitest's own exit code, never on a grep of its output.

- `demo-rerun.sh <board> [attempts]` (2026-09-20): the gate's `lab:demo` step alone on a warmed :3137, for a gate whose
  only red is a demo timeout; the key read the gate's own way, never sourced from `.env.local` (a line there is not shell).
- `status-row.py <id> <state> [--desc <desc>]` (2026-09-20): the STATUS row for one id refined in place or added once;
  a record script that adds a row goes through it (STATUS held two `body-type` rows for an hour before this existed).
- A rule from the afternoon: a gate's `lab:demo` exit is read PER STEP against the lane's own hand evidence. The harness
  returns byte-identical captures for options that differ only inside stacked `srcdoc` iframes (`toasts.material`,
  `toasts.action`, after glass's backdrop-filter), so those steps read FROZEN while drawing correctly; a red demo step
  that the Handoff names and proves by hand is not a bar, and one it does not is.

- `record.py <record.json>` (2026-09-20): one lane's record applied to the four record docs through one door: the CHANGELOG bullet
  before the first entry's Next, STATUS rows through `status-row.py`, an orchestrator row replaced by id or added before the queue
  row, ROADMAP lines at the head of Now and old lines retired by substring (exactly one match each); then the caps printed (the
  entry at 160, STATUS at 120, a warning past 150 to open a new entry at the next record). Retire runs before add in one call.

- `negative.sh` (2026-09-20, from gracetargaryen's "a check is only real if it can fail loudly"): the standing negative control
  for the kit's refusals, every known-bad input that must be refused (a missing lane, a full sha, a duplicated STATUS id, an
  unmatched ROADMAP retirement, the key's host guard); a refusal that has gone quiet is this script's own failure. Run it
  after any change to the kit and before the first integration of a day.

- `review-sheet.mjs <batch.txt> [out.html]` (2026-09-20): Will's paste as one page, each verdict beside the drawing it
  answered: the question, the chosen option's label and what it lands, confirms or overrules the recommendation, his note
  verbatim, the deep link to the live step, and the lane's own capture of that option when one exists in the scratchpad
  (a file:// reference; the page is for the machine that holds them). The tags read the CURRENT specs, so a sheet of an old
  paste on boards whose asks a round two replaced shows fewer tags; for the next batch it reads whole.

- `capture.sh <board> <dir> [port]` (2026-09-20): every option of every open step of one board as PNGs named
  `<board>.<ask>.<option>-<width>.png`, through the lab's own demo runner (`pnpm lab:demo --save-shots <dir>`, the one
  additive flag the Orchestrator added to `scripts/lab-demo.mjs`) on a dev server the script starts and stops; the
  pictures feed `review-sheet.mjs --captures <dir>`. `capture-all.sh <dir>` does the whole desk on one server.

**A chain gates on the test's exit, never on a grep (2026-09-20 20:10 EDT, `73e0f253`):** `pnpm -s vitest run <files> 2>&1 | grep -E "Test Files|FAIL"` exits 0 whenever grep MATCHES, including on a FAIL line, so a `set -e` chain sails past a red test. Read `${pipestatus[1]}` (zsh) into a variable and test it, or run the test without a pipe and let `set -e` see its exit. The manifest test went red and was pushed once this way; the fix took one commit, the lesson is the same one the merge script taught: a printed word is a tail.

**`hand-merge.sh <track> <short-sha> <msgfile>` (2026-09-20 21:30 EDT):** the merge for the conflicts the program itself creates when several lanes retire boards on adjacent registration lines (merge-lane.sh refuses them). One resolver per file kind: registration deletions by intersection (every deletion kept), rows and notes by union (each lane's own row), generated files regenerated, a retired id the union re-added to DESK_ORDER dropped, the lane's manifest deleted, then typecheck and the registry tests on their own exit codes before the commit. Any other conflicted path stops it with the merge left in progress. Born from three hand merges in one evening (`8c30faf6`, `fd42c759`, `5ea7415d`).

**`page-console.mjs <base> [path] [--probe]` (2026-09-20 22:10 EDT):** loads one page of a running dev tree in headless Chrome (its own throwaway profile, the preview key read from `.env.local` and redacted in every line it prints) and reports the browser's console errors and warnings, exceptions, and whether React's duplicate-key error is among them; `--probe` injects a same-key `console.error` after the load so the collector proves it can see one (the HARNESS lesson: a checker that cannot fail is decoration). Born from Will's report of the library index's duplicate key (`ae20259b`); the smoke runner reads its own checks, never the browser's console, which is why the error had lived unseen. Not a gate step while `/design/library/components` carries its known duplicate (the ROADMAP's admin-wiring line); run it by hand on a page a report names.
