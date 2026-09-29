# The kit: the Orchestrator's runbook

Look up the task in hand; each section stands alone. The scripts run from the repo root.

## Seat in (every session start, compaction or restart)

1. `export S=<this session's scratchpad>` (every script requires it and writes its logs there). Read `docs/tracks/orchestrator.md` (in flight,
   next, waiting on Will), then `docs/STATUS.md`.
2. `git status --short` (empty), `git worktree list`, the ports 3130 to 3139, `memory_pressure`; kill by port a dev
   server whose lane is gone.
3. The lanes: a `handed-off` manifest in `docs/tracks/` waits to be integrated; `git branch -r --list 'origin/lp/*'`
   finds a branch without one. A lane is integrated when its manifest is gone from HEAD, not merely when its tip is an
   ancestor (a fresh lane's tip is one until its first commit). A lane that was mid-work: "Resume a lane".
4. The build the alias serves against the `launch-prep` tip, and the desk (`/design/lab?key=`) for what waits on Will.

## Resume a lane

After a restart, a kill, a usage limit or plan mode (which pauses every running lane), message each lane that was
mid-work by SendMessage to its agent id; its transcript survives, so it keeps its context. Say what died, what is on
disk (its branch head, uncommitted files), that a stale `.next/dev/lock` may be deleted, and to continue from its
commits to its own handoff. An agent id lives only in the session that spawned it: when the Orchestrator's own session
is gone (another account, a closed session), respawn the lane on its worktree from `spawn-prompt.txt` plus what its
predecessor did, what remains and what it measured, read from its transcript
(`~/.claude/projects/<project>/<old session>/subagents/agent-<id>.jsonl`), so nothing is redone. Never integrate a
checkpoint or finish a lane's work for it (Will: see every agent's vision through); only a lane that handed off is
integrated as it stands.

## Consult the Advisor

Fable advises; the Orchestrator decides (Will, 2026-09-29: two differently intelligent models working off each other).
The Advisor is a read-only agent spawned once a session from `advisor-prompt.txt` (`subagent_type: Plan`, model
`fable`; its id in the pickup) and asked by SendMessage, one question at a time, so its context carries from one
consult to the next; from another session, respawn it. Ask it when a second mind pays for itself: a migration that
drops, revokes or replaces a function, before it is applied (the SQL and its proofs against the live schema); a red
gate or a live bug whose cause is not plain; a brief for a big, ambiguous lane, before the cut; a one-way door, before
it goes to Will; a change across systems (auth and RLS, billing, storage, the purge); a milestone's risk read. Never a
routine integration. A question carries its facts with their evidence, the leaning and what would settle it; where the
answer changes a call, the record says so, and a disagreement on a one-way door goes to Will with both views.

## Run a round

- **A board opens** on his ask (one line in chat, or `redesign` on a catalog entry) or on an improvement the
  Orchestrator or a lane sees; his asks get the two or three questions that branch the work, as a short options
  message, never a report; then one lane per board.
- **No two asks repeat.** An exploration's brief names the open asks nearest its surface on the standing boards and
  asks nothing they ask (checked at the cut). Board lanes cut in parallel cannot see each other's new asks, so after
  they land and before the `[preview]` for his sitting, read every new ask side by side (`board-card.mjs --desk`) and
  merge any two that ask one decision, every option kept.
- **The desk is ordered by leverage**: a board whose answer changes another's question sits above it,
  independent boards at the foot in any order. A board's place is the `desk` number in its own spec (tens, lower
  first); the brief names a new board's, you move one by editing that line at the record, and you tell him which board
  to open first when the order changed.
- **His sitting** walks one step per question, each answered from its dock with a note where the pick is not enough,
  and ends in one paste. Read the paste beside the boards it answers (`review-sheet.mjs`), transcribe it with
  `pnpm lab:review` on STDIN (`--dry` first), and ask the follow-ups in chat.
- **An answer that reaches a question still open on another board** is judged: a question whose options still hold
  an idea that could beat the current path, even one his pick diverged from, is adapted to the current context with
  that road kept open; only a question already solved at its best is removed.
- **After the pick** the next round is the wiring, and any surface stays open to a new board when someone sees a
  better idea. A board retires once its picks are built by deleting its folder, `sandbox/<id>/`, which nothing else
  names (a wiring lane retiring its own board owns the folder), and its `docs/reviews/` ledger goes at the same record
  (yours to delete, since that directory is yours); a board whose product no longer exists retires unreviewed, its live
  questions reshaped into the boards that replace it.
- **The lab workflow rides rising tides**: a note that would make a sitting faster, a board truer or a handoff
  cleaner goes to the ROADMAP's "The lab and the kit", and a lab lane is cut on those notes whenever a seat is free,
  without asking; a lab lane is sized in days and never delays a board.
- **A clean close**: every handed-off lane integrated and its manifest deleted; STATUS rewritten; `orchestrator.md`
  current; worktrees and `lp/*` branches pruned; the gate green at the tip; the alias serving the round's `[preview]`
  record; Vercel pruned; `new` and `updated` badges cleared; his review lines transcribed.

## Cut a lane

1. A spec JSON in `$S/specs/<track>.json` (the fields: `cut-lane.py`'s docstring):
   - `owns`: path prefixes. An Orchestrator claim a lane needs leaves `orchestrator.md`'s `owns` before the cut and
     returns at the lane's merge.
   - `reads`: paths that exist and stay; never another lane's manifest (it dies at that lane's merge), its board's
     `spec.ts` instead.
   - `brief`: the task's intent, synthesized (his exact words only where the wording itself is the point). A lab
     lane's brief stays light on rules, so its creative energy goes to the board.
   - `board` and `desk`: a board lane owns its folder and its place on the desk; `cut-lane.py` adds the folder to its
     `owns`, writes the board's shape into its brief (the toolbox page, `/design/lab/kit`, is the rest), and refuses a
     spec whose `owns` names a shared list.
2. `python3 usher/kit/cut-lane.py <launch-prep-sha8> $S/specs/<track>.json`, then
   `pnpm vitest run src/lib/track-manifests.test.ts`.
3. Commit the manifests alone; push; add the lane's In-flight row to `orchestrator.md` (its agent id, model and port).
4. Spawn with the Agent tool: `spawn-prompt.txt` filled (`{track}`, `{port}`, and `{scratch}` the absolute path of
   `../partyreel-wt/_scratch`, never `$S`: a session's scratchpad dies with it, captures included), one port each from 3131 to
   3139, at most four lanes at once (`memory_pressure` first; eight ran Will's Mac out of memory, 2026-09-28), their production builds taking turns through
   `scripts/build-lock.sh`. The model is your call on every spawn: Opus for
   big, ambiguous, multi-file work, Sonnet for fast, direct UI work.

## Integrate a handoff (one lane on the tree at a time)

Read the Handoff, the lane check and the captures, never the whole diff.

1. The lane's chat line names its head: `git rev-parse origin/lp/<track>` must match it (never the commit its Handoff
   names).
2. The lane check, `git diff --name-only launch-prep...origin/lp/<track>`: every line inside `owns`, the manifest, or a
   system doc listed under its System-doc edits; anything else is handed back or decided. The gate trusts the lane's
   own gate for its code, so the sha the Handoff's gates ran on reaches the head by docs alone
   (`git diff --name-only <gated> origin/lp/<track> | zsh usher/kit/scope.sh code` prints nothing), or the
   integration takes `FULL=1`.
3. The merge message in `$S/msg-<track>.txt`: what the lane does, its calls his to overrule, its look-at-first, and the
   `Co-Authored-By` trailer of the model you run on. The merge commit is the lane's permanent record.
4. With a clean tree (the kit refuses a dirty one, so commit record edits first; the day's first integration runs
   `zsh usher/kit/negative.sh` before it), run
   `S=$S zsh usher/kit/integrate.sh <track> <sha> <board|none> $S/msg-<track>.txt > $S/integrate-<track>.log` in the
   background: the `--no-ff` merge with the manifest deleted, then the gate on what the lane never gated (its `SCOPE`
   and `LAB` lines say which; `FULL=1` in front forces everything, for a lane whose own gate is in doubt or whose
   manifest predates the lab crawl in a wiring lane's Verify line). Read `INTEGRATE DONE green merged=<m> gate=<N>`,
   and `<n> checks, 0 failing` when the lab ran, before anything depends on them, and every result from its own exit
   code, never through a pipe to `grep`. A `PREMISE` line names a board whose open asks describe a path the merge
   changed: re-read those asks against production before his next sitting.
5. **MERGE RED**: two board lanes no longer meet in a shared list (a board is its folder), so a red merge is a real
   overlap: rebuild the file from both sides, then `sandbox/registry.test.ts` and `(shell)/lab/_desk/queue.test.ts`
   and `git commit -F $S/msg-<track>.txt`. (A lane cut before the lab revamp that still edits the retired
   `touchpoints.ts` or `(shell)/lab/boards.ts` is resolved by `merge-lane.sh` itself: those stay deleted and
   `registry.ts` keeps ours.) The gate follows:
   `zsh usher/kit/gate-lane.sh <N> <board> > $S/gate<N>.log`, read by its `SCOPE` and `EXIT[...]` lines.
6. **The record**, its edits and its commit under one `set -e`: each listed system-doc edit read by eye, fact against
   code; `python3 usher/kit/record.py $S/record-<track>.json` for the In-flight row and the lane's Deferred lines into
   their ROADMAP buckets; its asset asks into `docs/ASSETS.md`; its "Board ideas" lines read, and the promising ones
   opened as boards; a one-way-door answer of Will's into the invariant it made; a change to the brand (tokens, the logo, type, or the
   hero, demo and pricing pages) refreshes `kit/` from its README's Sources, the screens by `usher/kit/kit-capture.mjs`
   from partyreel.com; STATUS
   rewritten by hand where the lane changed what is true now; a new board's `desk` line moved to its leverage place;
   `sandbox/registry.test.ts` and `(shell)/lab/_desk/queue.test.ts` when the record touched the desk (a spec's `desk`
   line or `docs/reviews/`: nothing else a record edits reaches them); stage by name; commit
   `record: <track> ... [skip ci]`; push.
7. Prune only after the lane's final line (a lane asked for more work after its handoff is still working):
   `git worktree remove --force ../partyreel-wt/<track>`, `git branch -d lp/<track>`, `git worktree prune`,
   `rm -rf ../partyreel-wt/_scratch/<track>`; kill its port.

**Migrations** are global state (one Supabase behind prod and every preview): a lane writes the SQL file; you apply it
(`apply_migration`), additive-only while an open lane's code still calls what a contract migration would drop, and a
destructive one only on Will's yes; then `get_advisors` (the accepted set: `docs/systems/database-security.md`),
regenerate `src/lib/db/types.ts`, and commit both. A migration that replaces a function starts from its newest
definition in `supabase/migrations/`.

**A change touching more than one open lane** is yours alone, announced in `orchestrator.md` first.

## Deploy to the alias

No push deploys (`vercel.json`): Hobby allows 100 deployment creations a day across both projects, canceled ones
included, and a creation past the cap fails silently.

1. The record commit that should reach the alias carries `[preview]`.
2. `SHA=<short> FULL=<full> node usher/kit/alias-ensure.mjs > $S/alias-<short>.log`: one deployment per project (app,
   admin), READY, both `launch-prep` aliases assigned, exit 0 only once the app alias serves the sha (a build that
   goes READY after a newer one exists never takes the alias).
3. `node scripts/prune-vercel-deployments.mjs --apply`, then STATUS's live-state line.

The admin portal's alias is `partyreel-admin-git-launch-prep-partyreel.vercel.app`.

## Milestone (on Will's yes)

`launch-prep` holds at most about two rounds of unmerged work. A milestone: the full gate on `launch-prep`
(`rm -rf .next/dev`, then `FULL=1 zsh usher/kit/gate-lane.sh <N> none`, since a merge at the tip would scope itself;
its last line is `GATE<N> DONE … red steps: <n>`); `git checkout main && git merge --no-ff launch-prep` (never squash;
subject `milestone-<n>: prod = <the three to five things>`); an annotated tag `milestone-<n>`; push `main`, then the
tag; production READY at the merge SHA, then a verification pass on partyreel.com (what previews cannot prove);
`git checkout launch-prep && git merge --ff-only main`; STATUS and the pickup rewritten. `main` moves only this way or
by a true hotfix: fixed on `main`, verified, back-merged to `launch-prep` the same session.

## Mutate config

- **Vercel env**: the REST API with `$VERCEL_TOKEN` (the P3 team's; there is no `vercel` CLI), values NON-sensitive
  until launch. The Vercel MCP is for deploys and logs, never env vars or domains.
- **Workers** are global state: `wrangler` is the P3 Cloudflare team; `wrangler whoami` before any deploy.
- **GitHub**: `gh` is `willgibs/partyreel`, and `git push` rides its helper.

## Verify

- The built-in browser pane is shared with every running lane: never click in it while lanes run, and never click a
  Copy button there (it writes Will's clipboard, where a stray paste reads as an answer).
- A keyed alias page opens in the pane or headless (`page-console.mjs`).
- A gate's `lab:demo` is read per step; it compares every frame of an option. `--state <control>=<option>` presses a
  board wearing a knob's other state, and `--width 375` runs the sitting at a phone's width, when his question turns
  on either.

## The scripts

- `integrate.sh <track> <sha> <board|none> <msgfile>`: `merge-lane.sh` (the `--no-ff` merge, the manifest deleted,
  a pre-revamp lane's retired lists resolved, the specimen code regenerated, the registry tests and, when the merge adds code to the lane's head or on `FULL=1`, the integration's
  one typecheck before the commit), then `gate-lane.sh <N> <board>`, one chain gated on exits; ends
  `INTEGRATE DONE green|red`.
- `gate-lane.sh <N> <board>`: the gate on the merge at HEAD, on :3130 (never a lane's port), each step on its own exit
  code with its seconds. `pnpm test` alone when the merge adds only docs to the lane's head (the lane's gate ran on
  every code path in it); otherwise lint, `pnpm test` and the build, then the lab only when the lane's own diff holds
  a path the lab renders, scoped to what it reached (`scripts/lab-scope.mjs`: a board's folder, its ledger, or a
  production file its drawings import; the whole lab on a path it cannot place): `lab:smoke` and `lab:demo` on those
  boards (the demo retried once warm, its HARNESS line read from its own moved steps), its `SCOPE lab` and `PREMISE`
  lines saying which. A HEAD with one parent, or `FULL=1`, takes everything.
- `scope.sh code|lab|boards`: which of the paths on stdin need more than `pnpm test`, which the lab renders (its header
  holds the classes), and which boards they reach (`all` when it cannot tell); a path it does not know widens the gate.
- `record.py`: the In-flight row and ROADMAP lines (its docstring); it refuses a changelog and a STATUS row.
- `cut-lane.py`: a manifest from a spec. `spawn-prompt.txt`: the spawn prompt. `advisor-prompt.txt`: the Advisor's
  standing brief ("Consult the Advisor").
- `negative.sh`: every refusal fed its known-bad input, after any kit change and before a day's first integration
  (`cost-readings.mjs` re-reads the cost each refusal was written for).
- `alias-ensure.mjs` (with `vercel-lib.mjs`): the alias deployment; `DRY=1` reports without creating.
- `page-console.mjs <base> [path]`: one page in headless Chrome, its console errors, the key redacted.
- `board-card.mjs <board...>|--desk`: one screen per board, in desk order (its place, `lives`, its opening and terms,
  every ask with its context, and the answers of its own round); `desk-check.mjs` and `desk-sections.mjs`: the served
  desk per section.
- `review-sheet.mjs <batch.txt>` (with `batch-reader.mjs`): his paste beside the boards it answers, each verdict
  beside its drawing; `capture.sh <board> <dir>` and `capture-all.sh` feed it the pictures (every frame of every
  option, named by the frame's title).
- `demo-rerun.sh <board>`: `lab:demo` alone on a warm :3130, for a gate whose only red is a demo timeout.
- `test-delta.sh <base-sha>`: the tests at HEAD against a base by name, for a count that moved with no test file in the
  diff.
- `wave6-check.mjs`: a served page checked line by line through its HTML, no key.
- `moltbook.mjs`: the Moltbook client (`../moltbook/README.md`).
