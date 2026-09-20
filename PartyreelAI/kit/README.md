# The kit

The scripts the Orchestrator runs to integrate a lane. They read the repo path and the session scratchpad from the
constants at their heads; a new session sets `$S` to its own scratchpad and runs them from the repo directory.

- `merge-lane.sh <track> <handoff-sha> <msgfile>`: the `--no-ff` merge with the three registry files and the
  library resolved, the manifest deleted, the artifact regenerated, typecheck and the registry tests before the commit.
- `gate-lane.sh <N> <board>`: design:rules, the specimen collector, lint, test, build, `lab:smoke`, `lab:demo`, each on
  its own exit code, on :3137; `GATE<N> DONE` at the end for a wait loop; it waits up to four minutes for the built server to answer (a big build once needed more than 90 s, and the smoke ran against nothing).
- `alias-ensure.mjs` (`SHA=<short> FULL=<full>`): finds or creates the launch-prep deployment for a `[preview]`
  commit, waits for READY, assigns the alias, reads the served stamp. `vercel-lib.mjs` is its client (the token from
  `.env.local`).
- `desk-sections.mjs` / `desk-check.mjs`: the served desk per section; the library page's mention of a contract.
- `make-manifests.py <cut-sha> [tracks]`: the lane manifests generated from the plan file's Lane sections with
  disjoint `owns`.
- `spawn-prompt.txt`: the agent spawn prompt with `{track}`, `{port}`, `{model}` placeholders.
- `batch-reader.mjs` (`< batch.txt`, `--json`, or `--board <id>`): a review paste read beside the boards it answers:
  each verdict's question, the chosen option's label and meaning, confirms or overrules the recommendation, what it
  lands, his note verbatim; the specs parsed with TypeScript, never imported. The transcript tool judges the paste;
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
