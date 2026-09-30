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

1. **A board opens** on Will's ask, or on an improvement the Orchestrator or a lane sees, even on a surface just
   explored: the idea is reason enough, and it reaches production only through the lab, where his review keeps it on
   the product's vision (a fix or plumbing goes straight). For his asks the Orchestrator asks him the two or three questions that branch
   the work (a one-way door always waits for his answer, which then lives in its system doc), then cuts one lane per
   board.
2. **The lane returns DECISIONS** at `/design/lab/<board>` (below) and hands off; an exploration ships no production
   byte and verifies light (the board at 1440 and 375, reduced motion, the gate). The Orchestrator integrates one
   lane at a time, with one alias build per round.
3. **Will reviews on the desk** (`/design/lab?key=`), one question at a time; the Orchestrator transcribes his answers.
4. **Picks are built**: the wiring round lands each in production, a refined pick refined inside the wiring, with
   its red-team. The board retires with its losing options and its ledger; nothing records a pick as a rule, and a
   later board on the same surface starts from production with his notes as direction (`registry.test.ts` checks
   that a board past round 1 has them).

## Agent boot

1. `git fetch origin`. The track is the manifest's, or a short kebab of the goal; never adopt an existing
   `origin/lp/<track>` unless told to resume it.
2. In a worktree (`git rev-parse --git-dir` contains `/worktrees/`): `git checkout -b lp/<track> origin/launch-prep`,
   then `git branch -d <birth branch>`. In the primary checkout (the Orchestrator's tree) never branch, commit or edit:
   `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, and work inside it.
3. `nvm use && pnpm install --frozen-lockfile --prefer-offline`; copy `.env.local` from the primary checkout;
   `git push -u origin lp/<track>`. Push freely: no CI or Vercel runs on a lane push, and `[preview]` or `[ci]` in a
   commit message is the Orchestrator's to add.
4. A committed manifest is filled in place; otherwise copy the template, fill `owns` and `reads`, commit it alone and
   push (`pnpm test` green proves the lane is free).
5. Read the manifest end to end, then only what the task touches, and follow CLAUDE.md's working loop. Your dev server
   runs on a port of your own and is killed by port before a build, a test run and the handoff.
6. Edit only the paths under your `owns` and the system-doc facts of CLAUDE.md's "Record subtractively"; a single
   line in another lane's file is an exception, listed with why. The Handoff's lane check
   (`git diff --name-only origin/launch-prep...HEAD`) shows it.

**Sync** (merge, never rebase: `git merge origin/launch-prep`, the gate again, the sync commit named in the Handoff)
only when code that touches your work landed since your base (a merge into one of your `reads`, announced in
`tracks/orchestrator.md`) or your merge would conflict. Record commits (the Orchestrator's docs) never need one: the
Orchestrator's merge gate checks the integration, so a sync that only brings records costs a full gate for nothing.

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

**The pictures come first, and he can always place them.** He decides across every open board at once, and the drawn
options are what he opens a question for, so a step reads, on the first screen at a desk and at a phone: where it
happens in one line (the surface and the moment, and the state that brings someone there), the question sized to read,
the options as tabs, the shown option's sentence with its gain and its cost in a line, its knobs in one quiet row, and
every frame of it whole above the dock. Everything else a board knows (what it is about and what is settled, his
earlier picks and notes, what the question decides and why it matters, the recommendation's reason, the words it coins)
is one press away in the step's About, which stays open once he opens it, and a coined word is marked where it appears.
So an author still writes all of it, a line each: it is what lets him place any question the moment he wants to. He
should never have to click through the options to learn what he is being asked, nor read a screen of words to reach
them.

- Author with `defineExploration` (`@/components/lab/exploration`, a spec's one import) and draw with the kit's front
  door (`@/components/lab`); the newest board built on it is the worked example. Its context layer is an ask's `where` (a breadcrumb), `when` and `matters` beside `lands`, each option's `gains` and
  `costs`, `because` in a line, and the board's `opening` (`about`, `settled`, `earlier`) and `terms`: the step prints
  the first two in its one line of where, the option's in its line over the stage, and the rest in About;
  `registry.test.ts` refuses an open ask without them, and `lab:demo` fails a step whose stage starts past half the
  first screen or whose frames end under the dock.
- Shape a big goal progressively (`after` stages a question behind another answer); more rounds of narrower questions
  beat one wide one.
- Options are real contenders for one decision, as far apart as the real answers are: pushed apart for the
  exploration's sake, each turns into a caricature nobody would ship, and two that land on the same answer are a
  finding. Ask nothing an open ask on another standing board already asks (your brief names the nearest).
- **Offer the fix at its source**: when a question is a symptom of the system (a token is wrong), an option that fixes
  the system is worth drawing beside the page's own, since a fix to one page leaves the next page asking the same
  question.
- **Measure every tile before it ships**: a preview shows what its option's words claim, read on screen, never
  computed.
- **Answer a relative note against a reference**: a note like "a bit more calm" is best answered by options graded
  against something he already likes, since a cap that made every option calm by construction would leave him nothing
  to choose between.
- A board that is not about the words judges its placeholder copy for size and wrapping; the words are the voice's
  (`marketing-voice.ts`).
- A board is one folder, `sandbox/<id>/`, and nothing else names it:
  `pnpm new-board <id> "<title>" --surface <s> --desk <n>` writes it (every owed line a `TODO` that `registry.test.ts`
  refuses), the toolbox page (`/design/lab/kit`) teaches the rest, and retiring a board is deleting its folder.

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
