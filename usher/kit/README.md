# The kit: the Orchestrator's runbook

Look up the task in hand; each section stands alone. The scripts run from the repo root.

## Seat in (every session start, compaction or restart)

1. `export S=<this session's scratchpad>` (every script requires it and writes its logs there). Read `docs/tracks/orchestrator.md` (in flight,
   next, waiting on Will), then `docs/STATUS.md`. **In a cloud session** (seated there since 2026-10-06): an export lasts
   one command, so append `S`, `CHROME_PATH`, `NODE_USE_ENV_PROXY=1` and `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to
   this session's newest shell snapshot (`~/.claude/shell-snapshots/`), again after every worker restart (they came
   hourly on 2026-10-06; the container's disk, scratchpad and wrapper survive one, `uptime` says whether it rebooted),
   and a background command reads none, so set them inside it;
   `apt-get update && apt-get install -y zsh`; the Chrome wrapper `spawn-prompt-cloud.txt` makes; a gitignored
   `.env.local` written from the environment by `spawn-prompt-cloud.txt`'s recipe (the environment holds every app value
   since 2026-10-06; its own `NEXT_PUBLIC_SITE_URL` is production's, so the file and the snapshot override it). The kit needs nothing else there: it sources nvm only where it exists and reads each value from
   `.env.local` or the environment (`kit-env.sh`, `kit-env.mjs`). A full `pnpm test` takes about 8.5 minutes on its 4
   cores.
2. `git status --short` (empty), the root on `launch-prep` (a fresh session can open on `main`, and `merge-lane.sh`
   refuses any other branch), `git worktree list`, the ports 3130 to 3139, the memory (`memory_pressure` on the Mac,
   `free -g` on Linux); kill by port a dev server whose lane is gone.
3. The lanes: a `handed-off` manifest in `docs/tracks/` waits to be integrated; `git branch -r --list 'origin/lp/*'`
   finds a branch without one. A lane is integrated when its manifest is gone from HEAD, not merely when its tip is an
   ancestor (a fresh lane's tip is one until its first commit). A lane that was mid-work: "Resume a lane".
4. The build the alias serves against the `launch-prep` tip, and the desk (`/design/lab?key=`) for what waits on Will.

## Working with Will

Will owns the product and its money decisions; the Orchestrator runs the program so he is never the bottleneck, while
the lines he holds stay his. Nothing here or anywhere lives only in an agent's memory (CLAUDE.md).
- **Chat, plainly.** He reads chat, never plan files or scratch: a question is asked in chat in plain text with its
  context and links (never only in a widget or a file), reports are brief, and he is never asked what to do next.
- **Continuous.** Finish a thing and choose the next; his messages and lane handoffs come first. Wakes are his messages
  and agent notifications: a timed wake only for external state nothing reports, and the hourly heartbeat only for an
  unattended night, deleted the moment he is back. Questions are banked, never a stall.
- **Pace the desk, not the plumbing.** New boards wait for his paste on the standing ones (one desk served at a time,
  the next pre-integrated behind it), since keeping standing asks true while production moves under them is rework;
  fixes and plumbing off the boards' surfaces run at full speed. His sitting never blocks the Orchestrator: say so.
- **The calls lab** (the desk's Calls place, `/design/lab#calls`, over `docs/calls.json`, written only through
  `usher/kit/calls.py`, which refuses what the test refuses; Will, 2026-10-07: never a decision log): only the
  decisions built in that he cannot see by using the product, where his view may differ: plans, billing and renewals;
  an event's lifecycle and timing; deletion, retention and privacy; safety and moderation policy; what the product
  does on its own (a message, a pause, a limit). Never a screen, a word, a flow, a look or an engineering choice:
  production and the lab show those, and he critiques them there. Open questions first, then calls by theme (never by
  lane), three lines each with its "Change it if", at most 30 entries; his answers ride the desk's one message as a
  `calls:` line, and `pnpm lab:review` prints where each goes; an answer leaves the same day (`calls.py retire`; kept:
  the system doc holds the fact; changed: a ROADMAP line or a lane). At a record a lane's calls pass that test or live
  in its merge commit alone; a call about how something looks or moves is drawn on a board.
- **Standing permissions:** push and branch freely; the data architecture is the Orchestrator's to rebuild and optimize,
  drops included, timed so partyreel.com's live build never reads a dropped thing; a milestone needs his explicit yes; a
  one-way door goes to him with the Advisor's view beside the Orchestrator's. A classifier refusal, here or in a lane,
  stops that step and goes to him with the smallest action it needs, never re-run another way.
- **Pacing and seats:** the 5-hour window paces the lanes, never a kill (Will, 2026-10-07): six to eight agents, with
  `get_usage` read at every cut; when the window would run out before its reset, start nothing new, so the account
  rolls into about 99% at the reset and this session goes on in context. Weekly usage is no constraint (two Claude
  accounts, each resetting weekly, `get_usage` says when; plus cloud credit). Near a week's end he may call a
  wind-down: no new lane, the running ones finish, and the pickup's handoff block stays current, so the next account's
  Orchestrator, or one he seats in the cloud, picks up cleanly. Cloud
  lanes come first while cloud credit lasts: from a cloud seat, each lane is a cloud session of its own ("Cut a
  lane", step 4); from a desktop session the Agent tool's remote flag runs on the Mac, so the route there is a
  claude.ai routine (a saved item: his yes first).
- **Who does the work** (Will, 2026-10-07): an Opus Orchestrator costs what an Opus lane costs, so a lane is cut for
  the focus it buys, never to save tokens. Explorations, reviews of critical work, red-teams and multi-hour wiring stay
  lanes, their depth the point. A small, well-specified change already in the Orchestrator's context (a fix met at an
  integration, a board's retirement, a kit or doc fix, an Advisor-approved plan's mechanical steps) it makes itself,
  gated by hand, sparing a lane's boot and handoff, while its orchestration across the lanes never thins. Every step a
  lane runs is paid once per lane: a brief asks for the problem's depth and nothing ceremonial, and the wide checks
  gather at the milestone (the red-team, the FULL gate, CI on `main`).
- **His browser and accounts:** never click Copy or "Copy so far" in the built-in browser (a stray paste reads as a real
  answer); his Supabase dashboard is read-only to agents; Moltbook runs only on his word (`usher/moltbook/README.md`).
- **The tools' reach:** the Cloudflare MCP cannot mint R2 tokens or set bucket CORS, and the Vercel MCP never sets env
  vars or domains (the REST API with `$VERCEL_TOKEN` does): those are his, or the kit's.
- **The Orchestrator's own budget:** from about 85% of its context window, keep the pickup current after every step and
  pull no large outputs. Kids are never a target user (a steer for briefs, never copy or a product rule).

## Resume a lane

After a restart, a kill, a usage limit or plan mode (which pauses every running lane), message each lane that was
mid-work by SendMessage to its agent id; its transcript survives, so it keeps its context. Say what died, what is on
disk (its branch head, uncommitted files), that a stale `.next/dev/lock` may be deleted, and to continue from its
commits to its own handoff. A cloud lane is its own session: `send_message` to its session id says the same, and a
session that is gone is respawned on its pushed branch from `spawn-prompt-cloud.txt` plus what remains. An agent id
lives only in the session that spawned it: when the Orchestrator's own session
is gone (another account, a closed session), respawn the lane on its worktree from `spawn-prompt.txt` plus what its
predecessor did, what remains and what it measured, read from its transcript
(`~/.claude/projects/<project>/<old session>/subagents/agent-<id>.jsonl`), so nothing is redone. Never integrate a
checkpoint or finish a lane's work for it, so every agent's vision is seen through; only a lane that handed off is
integrated as it stands.

## Consult the Advisor

Fable advises; the Orchestrator decides: two differently intelligent models working off each other.
The Advisor is a read-only agent spawned once a session from `advisor-prompt.txt` (`subagent_type: Plan`, model
`fable`; its id in the pickup) and asked by SendMessage, one question at a time, so its context carries from one
consult to the next; from another session, respawn it. Ask it when a second mind pays for itself: a migration that
drops, revokes or replaces a function, before it is applied (the SQL and its proofs against the live schema); a red
gate or a live bug whose cause is not plain; a brief for a big, ambiguous lane, before the cut; a one-way door, before
it goes to Will; a change across systems (auth and RLS, billing, storage, the purge); a milestone's risk read. Never a
routine integration. A question carries its facts with their evidence, the leaning and what would settle it; where the
answer changes a call, the record says so, and a disagreement on a one-way door goes to Will with both views.

## Run a round

- **A board opens** as PROGRAM's round says; his ask comes as one line in chat or `redesign` on a catalog entry, and
  its two or three branching questions go back as a short options message, never a report.
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
  `pnpm lab:review` on STDIN (`--dry` first), and ask the follow-ups in chat. A note he gives on no board binds
  nothing: fold it into the doc it refines (synthesized, never quoted) or file it on its board, and file it in
  `_window.json` as a round dated that day only if he should see his own words on the desk that sitting.
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
   - `brief`: the task's intent, synthesized (his exact words only where the wording itself is the point). It opens
     with the round's standing direction, one line naming Will's principles a lane meets every day (PRD.md's "Will's
     product principles" and CLAUDE.md hold each with its reason): never dev-tool-ish; a host of 1 to about 10 events
     first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate,
     or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production the
     working version. A lab lane's brief stays light on rules, so its creative energy goes to the board.
   - `board` and `desk`: a board lane owns its folder and its place on the desk; `cut-lane.py` adds the folder to its
     `owns`, writes the board's shape into its brief (the toolbox page, `/design/lab/kit`, is the rest), and refuses a
     spec whose `owns` names a shared list.
2. `python3 usher/kit/cut-lane.py <launch-prep-sha8> $S/specs/<track>.json`, then
   `pnpm vitest run src/lib/track-manifests.test.ts`.
3. Commit the manifests alone; push; add the lane's In-flight row to `orchestrator.md` (its agent id, model and port).
4. Spawn with the Agent tool: `spawn-prompt.txt` filled (`{track}`, `{port}`, and `{scratch}` the absolute path of
   `../partyreel-wt/_scratch`, never `$S`: a session's scratchpad dies with it, captures included; the scratch is a
   lane's working area by design, so what a successor needs goes to the repo at the merge), one port each from 3131 to
   3139, as many lanes as measured memory allows (`memory_pressure` first, `free -g` on Linux: six to eight on the
   36 GB Mac, at 60% free or more, paced by the 5-hour window: "Working with Will"), their production builds taking
   turns through
   `scripts/build-lock.sh`. The model is your call on every spawn: Opus for
   big, ambiguous, multi-file work, Sonnet for fast, direct UI work.
   **From a cloud seat**, each lane is a cloud session of its own (`create_session`: `source_url` the repo,
   `source_revision` `launch-prep`, `outcome_branch` `lp/<track>`, the tag `partyreel-lane`, `permission_mode` `auto` (a
   child is born in `default` otherwise), the model, and `spawn-prompt-cloud.txt` filled: `{track}`); its session id is
   its In-flight row's agent. The server writes `config:auto-create-pr:draft` and no tag changes it after, so every
   check-in lists open PRs (none opened in a night of eleven lanes). A lane's permission check may refuse a boot step
   (the Chrome wrapper, `.env.local`, a `useradd`): never worked around, by the lane or from this seat (this seat's own
   check names that an auto-mode bypass); the environment's Setup script is where the wrapper belongs, and its variables
   carry what a boot once overrode (the localhost site URL, `CHROME_PATH`, `NODE_USE_ENV_PROXY`), so no lane writes
   `.env.local` or a snapshot. A lane's final report is its `result` event (`list_events` with `kinds: ["result"]`) and
   its cost `get_session`'s `usage.cost_usd`: a board lane ran $9 to $15, a production lane $6 to $29. A probe on a
   small model needs its who and why, or it reads a bare list of commands as an injection. A lane cannot message back,
   so its pushed head (`git ls-remote origin lp/<track>`) and its last events (`list_events`) are how it reports, with a
   `send_later` check-in while lanes run; its own container sets no limit on how many run, only the integrations' pace
   does.

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
   background (with the longest limit, 7200000 ms: a full gate with the lab's demo passes 30 minutes, and gate 42 died
   at a 30-minute one; commit nothing to the tree until it ends, since its lab steps scope from `HEAD`): the `--no-ff` merge with the manifest deleted, then the gate on what the lane never gated (its `SCOPE`
   and `LAB` lines say which; `FULL=1` in front forces everything, for a lane whose own gate is in doubt). Read `INTEGRATE DONE green merged=<m> gate=<N>`,
   and `<n> checks, 0 failing` when the lab ran, before anything depends on them, and every result from its own exit
   code, never through a pipe to `grep`. A `PREMISE` line names a board whose open asks describe a path the merge
   changed: re-read those asks against production before his next sitting.
5. **MERGE RED**: two board lanes no longer meet in a shared list (a board is its folder), so a red merge is a real
   overlap: rebuild the file from both sides, then `sandbox/registry.test.ts` and `(shell)/lab/_desk/queue.test.ts`
   and `git commit -F $S/msg-<track>.txt`. The gate follows:
   `zsh usher/kit/gate-lane.sh <N> <board> > $S/gate<N>.log`, read by its `SCOPE` and `EXIT[...]` lines.
6. **The record**, its edits and its commit under one `set -e`: each listed system-doc edit read by eye, fact against
   code, and `grep -rn` over `docs/` for each file, function or name the lane retired or renamed (a stale line its
   Handoff missed is refined in place: marketing-crumbs' cinema 404); `python3 usher/kit/record.py
   $S/record-<track>.json` for the In-flight row and the lane's Deferred lines into their ROADMAP bucket and area
   (placed, never appended; Immediate holds at most 40, so a line moves down first); its asset asks into
   `docs/ASSETS.md`; its "Board ideas" lines read, and the promising ones opened as boards; a one-way-door answer of
   Will's into the invariant it made; a change to the brand (tokens, the logo, type, or the hero, demo and pricing
   pages) refreshes `kit/` from its README's Sources, the screens by `usher/kit/kit-capture.mjs` from partyreel.com;
   STATUS rewritten by hand where the lane changed what is true now; a new board's `desk` line moved to its leverage
   place; `sandbox/registry.test.ts` and `(shell)/lab/_desk/queue.test.ts` when the record touched the desk (a spec's
   `desk` line or `docs/reviews/`: nothing else a record edits reaches them); stage by name; commit `record: <track> ...
   [skip ci]`; push.
7. Prune only after the lane's final line (a lane asked for more work after its handoff is still working):
   `git worktree remove --force ../partyreel-wt/<track>`, `git branch -d lp/<track>`, `git worktree prune`,
   `rm -rf ../partyreel-wt/_scratch/<track>`; kill its port.

**Migrations** are global state (one Supabase behind prod and every preview): a lane writes the SQL file; you apply it
(`apply_migration`, the whole file, trailing newline included: `md5(statements[1])` in
`supabase_migrations.schema_migrations` then equals the file's `md5 -q` on the Mac, `md5sum` on Linux, the proof it
went in verbatim),
additive-only while an open lane's code still calls what a contract migration would drop, and a
destructive one only on Will's yes; then `get_advisors` (the accepted set: `docs/systems/database-security.md`),
regenerate `src/lib/db/types.ts`, and commit both. A migration that replaces a function starts from its newest
definition in `supabase/migrations/`. ★ From a cloud seat the stock Supabase connector asks its own confirm (an MCP
elicitation) before any `DELETE` or `DROP`, as a statement or inside a function body, even in a rolled-back proof; no
claude.ai client renders it, so the call reads "timed out after 60s" and nothing runs. The seat's SQL goes through a
custom connector at
`https://mcp.supabase.com/mcp?project_ref=ddafaemglzmuekbtjwzn&skip_elicitations=execute_sql,apply_migration`
(Supabase's documented setting, added by Will in claude.ai's Connectors), and never rewords a `DELETE` or `DROP` past
the detector. Every SQL call still waits on Will's Allow, so run them with him watching the session.

**A change touching more than one open lane** is yours alone, announced in `orchestrator.md` first.

## Deploy to the alias

No push deploys (`vercel.json`): Hobby allows 100 deployment creations a day across both projects, canceled ones
included, and a creation past the cap fails silently.

0. `node usher/kit/vercel-usage.mjs`: Hobby allows 4 Active CPU-hours a rolling 30 days and pauses every function past
   it (Vercel unlocked the account once). Exit 3 refuses any Vercel work but what Will asks for by name (`alias-ensure`
   and remote `lab:*` runs refuse on their own); desk checks and red-teams run on a local production build first, the
   alias only for sign-in, upload and checkout.
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

The standing compute budget, at every milestone: `pnpm compute:model --port <a free one of 3131 to 3139>` (about 20
minutes with its build; local only; its guests upload, and R2's CORS refuses the gate's 3130: exit 2). Exit 1 is a scenario past `scripts/compute-model/budget.json`: read the scenario before the milestone; lower
a line when a lever lands.

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
  a conflicted `registry.ts` refused, the specimen code regenerated, the registry tests and, when the merge adds code to the lane's head or on `FULL=1`, the integration's
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
- `kit-env.sh` and `kit-env.mjs`: what every script shares so it runs alike on the Mac and a cloud seat: the repo from
  the script's own checkout, nvm only where it exists, a value from `.env.local` or else the environment
  (`kit_env NAME`, `envValue(name)`), Chrome from `CHROME_PATH` (`chromePath`) and its DevTools port read from the
  profile it was started with (`--remote-debugging-port=0`, then `devToolsPort`), never a port from a pid or at random;
  `kit_port_pids` and `kit_free_port` find a port's listener through `fuser` where `lsof` sees no socket (a cloud
  container), so a kill by port frees it there too.
- `page-console.mjs <base> [path]`: one page in headless Chrome, its console errors, the key redacted.
- `board-card.mjs <board...>|--desk`: one screen per board, in desk order (its place, `lives`, its opening and terms,
  every ask with its context, and the answers of its own round); `desk-sections.mjs`: the served desk per section.
- `review-sheet.mjs <batch.txt>` (with `batch-reader.mjs`): his paste beside the boards it answers, each verdict
  beside its drawing; `capture.sh <board> <dir>` and `capture-all.sh` feed it the pictures (every frame of every
  option, named by the frame's title).
- `demo-rerun.sh <board>`: `lab:demo` alone on a warm :3130, for a gate whose only red is a demo timeout.
- `test-delta.sh <base-sha>`: the tests at HEAD against a base by name, for a count that moved with no test file in the
  diff.
- `moltbook.mjs`: the Moltbook client (`../moltbook/README.md`).
- `desk-refresh.sh <sha>`: Will's desk (:3000, the `../partyreel-wt/desk` worktree) rebuilt and restarted at a
  launch-prep sha, ending `DESK READY` once the lab's stamp names it; never while a red-team walks the desk. Local only.
- `media-gen.mjs [dir]`: test media with no Mac (ffmpeg alone): a phone's photographs with their capture time in the
  minimal Exif, a short video, the red-team's fake camera and `compute:model`'s six shapes, unique bytes every run
  (`$PARTYREEL_TEST_MEDIA`, else `<tmp>/partyreel-test-media`); `--capture-fixtures` regenerates the capture-time walk's
  `imageio-nozone.jpg` and `imageio-lying.jpg` in `src/lib/media/strip-metadata-fixtures/`.
- `redteam/signin.mjs <email> <base> <key> [--open <path>]`: a test host's session (willg97, hi@willgibs) in a walk's
  own headless Chrome on a local build, minted with the service key and never mailed; the operator, a stranger and a
  remote base are refused (`negative.sh`). The cloud seat's sign-in; on the Mac, Will's Chrome and the chooser.
- `redteam-brief.txt`: a red-team's brief, its walk's specifics in braces (what changed since the last base, the walks
  in order); the rules and the driving notes are every walk's. Its tools are `redteam/` (a headless Chrome of the
  walk's own, the driver `drv.mjs` and how to start it in its head, fresh devices with Vercel and partyreel.com blocked,
  real taps and presses, a guest's join, a send with its in-flight recorder), every record in the walk's `RT_DIR`.
- `cost-model/`: the dollar model behind PRICING.md's "What it costs us": `node plans.mjs` prints each plan's worst
  month, the archetypes and the breakeven, `node atlas.mjs` the events' once-costs; a vendor price or a plan changes
  in `model.mjs` or `plans.mjs` beside PRICING.md's line, in the same edit.
