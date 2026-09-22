# The kit: the Orchestrator's runbook

How the Orchestrator starts a session, cuts a lane, integrates a handoff, deploys to the alias, verifies and recovers.
Every line is a current rule; git holds how each was learned. The scripts run from the repo root with `S` set to the
session's scratchpad (`S=$S zsh usher/kit/<script>` or `export S=...`).

**The counting rule.** A refusal enters a tool only after a mistake actually cost something, and it encodes the
mistake's shape, never the instance. `negative.sh` proves every refusal still fires; an ordinary day proves each stays
silent on good work. Many refusals would mean the design upstream of the scripts is wrong.

## Session start

1. Read `docs/tracks/orchestrator.md` (the pickup: in flight, next, waiting on Will), then `docs/STATUS.md`.
2. `git status --short` (empty), `git worktree list`, the ports 3130 to 3139 (`lsof -nP -iTCP:<p> -sTCP:LISTEN`),
   `memory_pressure`. A dev server whose lane is gone is killed by port.
3. A lane that was mid-work when its session died (a restart, a kill, a usage limit) is resumed by SendMessage to its
   agent id: its transcript survives, so it keeps its context. The message says what died, what is on disk (its branch
   head, uncommitted files), that a stale `.next/dev/lock` may be deleted, and to continue from where its commits stand
   to its own handoff. Never integrate a checkpoint for a lane or finish its work for it (Will: see every agent's
   vision through). Only a lane that already handed off is integrated as it stands.
4. Plan mode pauses every running lane; when it ends, resume each by message.

## Cut a lane

1. A spec JSON in `$S/specs/<track>.json`: `track`, `board` (`none` for a production or docs lane), `owns` (path
   prefixes, disjoint from every live lane and from the Orchestrator's claims), `reads` (paths that exist and stay),
   `goal`, `brief` (everything the lane needs, Will's words for the task included; a new board names the neighbour it
   registers after), optional `verify`.
2. `python3 usher/kit/cut-lane.py <launch-prep-sha8> $S/specs/<track>.json` writes `docs/tracks/<track>.md`.
3. `pnpm vitest run src/lib/track-manifests.test.ts` and `zsh usher/kit/negative.sh`. An Orchestrator claim a lane
   needs leaves `orchestrator.md`'s `owns` before the cut and returns at the lane's merge.
4. Commit the manifests alone; push; add the lane's In-flight row to `orchestrator.md` (the agent id in it).
5. Spawn with the Agent tool: `spawn-prompt.txt` filled (`{track}`, `{port}`, `{scratch}`); the model per
   `docs/PROGRAM.md` "Model delegation"; one port each from 3131 to 3139; six lanes at most, `memory_pressure` first.

## Integrate a handoff (one lane on the tree at a time)

1. The lane's one line names its head; `git rev-parse origin/lp/<track>` must match (never the board commit its
   Handoff names).
2. The merge message in `$S/msg-<track>.txt`: what the lane does, its calls his to overrule, its look-at-first, and the
   `Co-Authored-By` trailer of the model you run on. The merge commit is the lane's permanent record.
3. `git status --short` must be empty: the kit refuses a dirty tree, so commit record edits first.
4. `S=$S zsh usher/kit/integrate.sh <track> <sha> <board|none> $S/msg-<track>.txt > $S/integrate-<track>.log` in the
   background. Read `INTEGRATE DONE green merged=<m> gate=<N>` and `<n> checks, 0 failing` before anything depends
   on them.
5. **MERGE RED** on a registry file (`touchpoints.ts`, `registry.ts`, `boards.ts`): two new entries on one spot lose
   their closing braces in git's three-way merge. Rebuild the damaged block from both sides (`git show <lane-sha>:<file>`
   for the new entry, `git show <launch-prep-sha>:<file>` for the rest), run the four lab tests
   (`touchpoints.test.ts`, `sandbox/registry.test.ts`, `(shell)/lab/_desk/queue.test.ts`, `sandbox/overtaken.test.ts`),
   `git add` the file, `git commit -F $S/msg-<track>.txt`, then `zsh usher/kit/gate-lane.sh <N> <board> > $S/gate<N>.log`
   and read its `EXIT[...]` lines. `hand-merge.sh` with `closer.py` repairs the common case automatically.
6. The record: `python3 usher/kit/record.py $S/record-<track>.json` (the In-flight row, ROADMAP lines; see its
   docstring); STATUS rewritten by hand where the lane changed what is true now; a board's place on the desk by leverage (`DESK_ORDER` in `touchpoints.ts`: the board whose answer
   changes another's question goes first); the three lab tests; stage by name; commit `record: <track> ... [skip ci]`;
   push.
7. `git worktree remove --force ../partyreel-wt/<track>`, `git branch -d lp/<track>`, `git worktree prune`; kill the
   lane's port.

## Deploy to the alias

- No push creates a deployment (`vercel.json` disables both branches): the record commit that should reach the alias
  carries `[preview]`, then `SHA=<short> FULL=<full> node usher/kit/alias-ensure.mjs > $S/alias-<short>.log` creates one
  per project (app, admin), waits for READY, assigns both launch-prep aliases and reads the served stamp (exit 0 when
  the app alias serves the sha); then `node scripts/prune-vercel-deployments.mjs --apply`; then STATUS's live-state line.
- ★ READY is not the alias: a build that goes READY after a newer deployment exists never takes the branch alias. Read
  the alias record and the served stamp: the desk prints `Serving build <sha7>`, and the payload's stamp has escaped
  quotes, so grep the bare sha7.
- ★ The deployment cap: 100 creations per trailing day across both projects, canceled ones included, and a creation
  blocked by it fails silently. That is why pushes never deploy.
- The admin portal's own alias is `partyreel-admin-git-launch-prep-partyreel.vercel.app`.

## Verify

- ★ **The lab key** is `DESIGN_PREVIEW_KEY` in `.env.local`: read inside a script, never printed. A local `next dev`
  logs every request URL with its `?key=` and accepts any key, so a local run uses a dummy one, and a dev log is never
  shown unredacted. A keyed alias page is checked in headless Chrome from a script (`page-console.mjs`, or the
  scratchpad's `alias-capture.mjs` pattern: viewport captures, never clipped ones), never in the browser pane, whose
  URL would carry the key.
- The built-in pane is shared with every running lane: never click in it while lanes run; never click Copy there (it
  writes Will's clipboard, and a stray paste reads as a ruling).
- A phone width runs in the pane (`resize_window` preset `mobile` is a real 375); Will's Chrome keeps its inner width.
- Sign-in uses Will's open session in his Chrome or the Google account chooser (`willg97@gmail.com` host,
  `partyr33l@gmail.com` admin); a password or an OTP is never typed.
- A gate's `lab:demo` is read per step: a step that reads FROZEN only because its options differ inside stacked
  `srcdoc` iframes, and that the lane proves by hand, is not a bar.

## Rules each learned once

- One script per merge, `set -e`, every step on its own exit code; never a record chained behind an integration; a
  test's result is read from its exit code, never through a pipe to `grep` (grep's exit hides the failure).
- A migration that replaces a function starts from its newest definition in `supabase/migrations/`.
- A manifest never reads another lane's manifest (it is deleted at that lane's merge); point it at the board's
  `spec.ts`.
- Integrated means the manifest is gone from HEAD and the lane's tip is an ancestor: a fresh lane's tip is an ancestor
  of `launch-prep` until its first commit.
- A lane's scratch files live under `$S/<track>/`; a script's debugging port is random, never fixed.
- A new board registers after the neighbour its brief names, never at the head of a list; the Orchestrator moves it into
  its leverage place at the record.
- A board retires in ONE commit across `touchpoints.ts`, `registry.ts` and `boards.ts` (`SandboxId` comes from
  touchpoints, so a half retirement breaks the typecheck); a lane that retires its own board is released those lines.
- A `git add` naming a path already removed aborts the whole add: never hide its stderr, and read
  `git show --stat HEAD` before a push.
- The kit's gate runs on :3130, never a lane's port; six lanes at once on this machine (36 GB: a dev server holds 3 to
  9 GB, a build is the spike).

## The scripts

- `integrate.sh <track> <sha> <board|none> <msgfile>`: the merge and the gate as one chain gated on exits; the gate
  number from the scratchpad's highest `gate<N>.log`; ends `INTEGRATE DONE green|red`.
- `merge-lane.sh <track> <sha8> <msgfile>`: the `--no-ff` merge with the registry files and the library resolved, the
  manifest deleted, the generated artifacts regenerated, typecheck and the registry tests before the commit; clears
  `.next/dev` first (a killed dev server leaves a truncated validator the typecheck reads).
- `gate-lane.sh <N> <board>`: design:rules, the specimen collector, lint, test, build, `lab:smoke`, `lab:demo` on :3130,
  each on its own exit code; the harness's own negative control first (a step known to move); `lab:demo` retried once
  warm.
- `hand-merge.sh` + `closer.py`: the merge for registry conflicts the program itself creates; the closer puts back the
  braces a union drops.
- `record.py`: the In-flight row and ROADMAP lines through one door; it refuses a changelog and a STATUS row (what
  shipped is the merge commit; STATUS is a snapshot rewritten by hand).
- `cut-lane.py`: a manifest from a spec. `spawn-prompt.txt`: the spawn prompt.
- `negative.sh`: every refusal fed its known-bad input; run after any kit change and before a day's first integration.
  `cost-readings.mjs` re-reads the cost each refusal was written for, at the end of it.
- `alias-ensure.mjs` (with `vercel-lib.mjs`): the alias deployment; `DRY=1` reports without creating.
- `page-console.mjs <base> [path]`: one page in headless Chrome, its console errors, the key redacted.
- `desk-check.mjs`, `desk-sections.mjs`: the served desk per section. `board-card.mjs <board...>|--desk`: one screen per
  board (ruling, `lives`, asks, answers).
- `batch-reader.mjs` and `review-sheet.mjs <batch.txt>`: Will's review paste read beside the boards it answers (the
  sheet with each verdict beside its drawing); `capture.sh <board> <dir>` and `capture-all.sh` feed it the pictures.
  Transcribe a paste with `pnpm lab:review` on STDIN (`--dry` first).
- `demo-rerun.sh <board>`: the gate's `lab:demo` alone on a warm :3130, for a gate whose only red is a demo timeout.
- `test-delta.sh <base-sha>`: the tests at HEAD against a base by name, for a count that moved with no test file in the
  diff.
- `wave6-check.mjs`: a served page checked against ruled lines through its HTML, no key.
- `moltbook.mjs`: the Orchestrator's own Moltbook client (`usher/moltbook/README.md`).
