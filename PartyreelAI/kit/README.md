# The kit

The scripts the Orchestrator runs to integrate a lane. They read the repo path and the session scratchpad from the
constants at their heads; a new session sets `$S` to its own scratchpad and runs them from the repo directory.

- `merge-lane.sh <track> <handoff-sha> <msgfile>`: the `--no-ff` merge with the three registry files and the
  library resolved, the manifest deleted, the artifact regenerated, typecheck and the registry tests before the commit.
- `gate-lane.sh <N> <board>`: design:rules, the specimen collector, lint, test, build, `lab:smoke`, `lab:demo`, each on
  its own exit code, on :3137; `GATE<N> DONE` at the end for a wait loop.
- `alias-ensure.mjs` (`SHA=<short> FULL=<full>`): finds or creates the launch-prep deployment for a `[preview]`
  commit, waits for READY, assigns the alias, reads the served stamp. `vercel-lib.mjs` is its client (the token from
  `.env.local`).
- `desk-sections.mjs` / `desk-check.mjs`: the served desk per section; the library page's mention of a contract.
- `make-manifests.py <cut-sha> [tracks]`: the lane manifests generated from the plan file's Lane sections with
  disjoint `owns`.
- `spawn-prompt.txt`: the agent spawn prompt with `{track}`, `{port}`, `{model}` placeholders.
