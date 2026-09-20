# The kit

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
  its own exit code, on :3137; `GATE<N> DONE` at the end for a wait loop; `lab:demo` retried once on the warm server (a cold frame compile under
  three concurrent gates stalls CDP past 60 s and reads TIMED OUT; the retry is the test, not a longer timeout); it waits up to four minutes for the built server to answer (a big build once needed more than 90 s, and the smoke ran against nothing).
- `alias-ensure.mjs` (`SHA=<short> FULL=<full>`): finds or creates the launch-prep deployment for a `[preview]`
  commit, waits for READY, assigns the alias, reads the served stamp. `vercel-lib.mjs` is its client (the token from
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
