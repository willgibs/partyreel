# The Elevation Program: roles, the round, the rules

> ROLE: what every lane needs from the program: the roles, the round, a lane's boot and handoff, the hard gates and
> the principles. NOT HERE: the universal rules (→ [`../CLAUDE.md`](../CLAUDE.md)), where things stand (→
> [`STATUS.md`](STATUS.md)), the Orchestrator's procedures (→ the runbook,
> [`../usher/kit/README.md`](../usher/kit/README.md)), what shipped (→ `git log`). LIFECYCLE: dies at program end.

**The program:** every surface (the app, the marketing site, the admin portal and the `/design` lab) taken to
magic-grade on the `launch-prep` integration branch, in focused rounds, before a separate launch round. Will sets the
goals, answers the questions and rules on UI; agents return decisions drawn as polished options; the Orchestrator
carries every back-and-forth and lands everything.

## Roles

- **The Orchestrator** (one at a time, in the repo root on `launch-prep`) alone merges into `launch-prep`, applies
  migrations, deploys Workers, mutates Vercel, Stripe and Supabase config, runs milestones, cuts lanes, asks Will the
  questions and transcribes his answers. Its state is [`tracks/orchestrator.md`](tracks/orchestrator.md); its
  procedures are the runbook, looked up by task.
- **An Agent** runs one lane: a worktree on its own `lp/<track>` and a manifest, `docs/tracks/<track>.md`, that is its
  whole init and its whole handoff ("Agent boot" below; the template: [`tracks/README.md`](tracks/README.md)).

## The round

1. **Will asks**; the Orchestrator asks him the two or three questions that branch the work (a one-way door always
   waits for his answer, which then lives in its system doc), then cuts one lane per board.
2. **The lane returns DECISIONS** at `/design/lab/<board>` (below) and hands off; an exploration ships no production
   byte and verifies light (the board at 1440 and 375, reduced motion, the gate). The Orchestrator integrates one
   lane at a time, with one alias build per round.
3. **Will reviews on the desk** (`/design/lab?key=`), one question at a time; the Orchestrator transcribes his answers.
4. **Picks are built**: the wiring round lands each in production, a refined pick refined inside the wiring, with
   its red-team. The board retires with its losing options and its ledger; nothing records a pick as a rule. Another
   exploration of the same surface comes when he asks for one and starts from production with his notes as direction
   (`registry.test.ts` checks that a board past round 1 has them).

## Agent boot

1. `git fetch origin`. The track is the manifest's, or a short kebab of the goal; never adopt an existing
   `origin/lp/<track>` unless told to resume it.
2. In a worktree (`git rev-parse --git-dir` contains `/worktrees/`): `git checkout -b lp/<track> origin/launch-prep`,
   then `git branch -d <birth branch>`. In the primary checkout (the Orchestrator's tree) never branch, commit or edit:
   `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, and work inside it.
3. `nvm use && pnpm install --frozen-lockfile`; copy `.env.local` from the primary checkout;
   `git push -u origin lp/<track>`. Push freely: no CI or Vercel runs on a lane push, and `[preview]` or `[ci]` in a
   commit message is the Orchestrator's to add.
4. A committed manifest is filled in place; otherwise copy the template, fill `owns` and `reads`, commit it alone and
   push (`pnpm test` green proves the lane is free).
5. Read the manifest end to end, then only what the task touches, and follow CLAUDE.md's working loop. Your dev server
   runs on a port of your own and is killed by port before a build, a test run and the handoff.
6. Edit only the paths under your `owns` and the system-doc facts of CLAUDE.md's "Record subtractively"; a single
   line in another lane's file is an exception, listed with why. The Handoff's lane check
   (`git diff --name-only origin/launch-prep...HEAD`) shows it.

**Sync** (merge, never rebase): before the handoff if `origin/launch-prep` moved (`git merge origin/launch-prep`, the
gate again, the sync commit named in the Handoff), and mid-lane only when `tracks/orchestrator.md` announces a landed
change touching one of your `reads`.

**Handoff:** fill the manifest's Handoff (every claim names its artifact); set `status: handed-off`; commit the
manifest alone; push; report one line in chat: "handed off at <sha>".

## Launch switches

Stripe live, the real `/privacy`, secrets to Sensitive, `PRUNE_MODE=live` and the test-data reset gather in ROADMAP's
launch checkpoint and run only in the launch round: each is public or hard to undo.

## Program principles

### A round returns DECISIONS

An exploration is a list of decisions, not a page, each worth about a minute of Will's time: one question in plain
words asking for one winner, every option previewed whole on the real surface with its configs beside it, then his
pick and an optional note. A few designed variations beat any amount of argument: no verdict essays, no keep / refine
/ kill over N cards.

- Author with `defineExploration` (`src/components/lab/exploration.ts`) and nothing else; the newest board built on
  it is the worked example.
- Shape a big goal progressively (`after` stages a question behind another answer); more rounds of narrower questions
  beat one wide one.
- Options are real contenders for one decision: never force them apart, and two that land on the same answer are a
  finding. Ask nothing an open ask on another standing board already asks (your brief names the nearest).
- **Offer the fix at its source**: when a question is a symptom of the system (a token is wrong), an option fixes the
  system, not only the page.
- **Measure every tile before it ships**: a preview shows what its option's words claim, read on screen, never
  computed.
- **Answer a relative note against a reference**: a note like "a bit more calm" gets options graded against something
  he already likes, never a cap that makes every option calm by construction.
- Placeholder copy is judged for its size and wrapping, not its words.
- A new board registers its own lines in `registry.ts`, `boards.ts` and `touchpoints.ts` directly after the neighbour
  its brief names, never at the head of a list (two boards on one spot mangle the merge).

### Fast, focused rounds

Fast iterative rounds beat slow meticulous ones: focused per-dimension rounds rather than mega-plans, and
iterate rather than perfect.

### Before launch there are no real users

No migration carries compatibility work to keep test data: a migration's contract (the drop) lands as soon as the alias's build no
longer calls what it drops (after that build's red-team), even before the milestone that ships it; the report names
what partyreel.com loses meanwhile.

### Unlimited design resources

Design as if any image, video, SVG, 3D or generative asset can be made, because Will makes them: ask for exactly what
the design needs in the Handoff, ship the stand-in meanwhile, swap by id when the asset lands.

### Own fewer services

No recurring SaaS before revenue: free tiers and in-house first (the on-device render engine is the archetype).

## Starting a session (Will copies one as the first prompt)

**Agent** (the Orchestrator's own spawns use `usher/kit/spawn-prompt.txt`):

> You are an AGENT on Partyreel's elevation program. Track `<track>`: your manifest is committed at
> `docs/tracks/<track>.md` and is your whole init. Boot per `docs/PROGRAM.md` "Agent boot", build, then hand off by
> filling the manifest's Handoff, setting `status: handed-off`, and pushing. The chat report is one line:
> "handed off at <sha>".

A bare goal works too (the agent writes its own manifest from the template in [`tracks/README.md`](tracks/README.md)).
To resume a handed-off branch: "resume `lp/<track>`".

**Orchestrator** (repo root, no worktree):

> You are THE ORCHESTRATOR for Partyreel's elevation program (single-writer integration role).
> Seat in per `usher/kit/README.md` "Seat in", then take up the goal: `<goal>`.
