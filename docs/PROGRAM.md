# The Elevation Program: roles, the round, the rules

> ROLE: the program's rulebook: who does what, how a round runs, the hard gates, milestones and the principles.
> BELONGS HERE: rules that outlive any one round. · NOT HERE: where things stand (→ [`STATUS.md`](STATUS.md)), the
> universal rules (→ [`../CLAUDE.md`](../CLAUDE.md)), the Orchestrator's procedures (→ the runbook,
> [`../usher/kit/README.md`](../usher/kit/README.md)), what shipped (→ `git log`). Every line is a current rule in
> the present tense; git holds how it was learned. LIFECYCLE: dies at program end (the teardown is in ROADMAP's
> launch checkpoint).

**The program:** every surface (the app, the marketing site, the admin portal and the `/design` lab) taken to
magic-grade on the `launch-prep` integration branch, in focused rounds, before a separate launch round. Will sets the
goals, answers the questions and rules on UI; agents return decisions drawn as polished options; the Orchestrator
carries every back-and-forth and lands everything.

## Roles: Orchestrator and Agent

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator** (the rules:
[`CLAUDE.md`](../CLAUDE.md) "Sessions & roles"). Either role runs on whichever model it is given, and nothing in the
program depends on which.

- **One Orchestrator at a time**, seated in the repo root on `launch-prep`. It alone merges into `launch-prep`,
  applies migrations, deploys Workers, mutates Vercel, Stripe and Supabase config, runs milestone merges, cuts
  lanes, asks Will the questions and transcribes his answers. Its state is
  [`tracks/orchestrator.md`](tracks/orchestrator.md) (the pickup: in flight, next, waiting on Will); its procedures
  are the runbook.
- **Agents** work in worktrees on their own `lp/<track>`; the manifest `docs/tracks/<track>.md` is the whole init and
  the whole handoff (the template and the lane rules: [`tracks/README.md`](tracks/README.md)). An Agent edits
  STATUS, ROADMAP, this file, CLAUDE.md, `docs/ASSETS.md`, `docs/tracks/orchestrator.md` or `docs/reviews/` only
  when its `owns` names one; a `docs/systems/` line is refined in place only for a fact inside its owned paths,
  listed in the manifest so it is read by eye at the merge. Worktree sessions have no out-of-repo memory by design.
- **Seat-in (a fresh Orchestrator):** [`tracks/orchestrator.md`](tracks/orchestrator.md), then
  [`STATUS.md`](STATUS.md), this doc and the runbook; `docs/tracks/` (a `handed-off` manifest is the signal) and
  `git branch -r --list 'lp/*'` for a branch without one; the alias state at the `launch-prep` tip; the desk at
  `/design/lab?key=` for what waits on Will.
- **A clean close:** every handed-off lane integrated and its manifest deleted; STATUS rewritten;
  `tracks/orchestrator.md` current; worktrees and `lp/*` branches pruned; the gate green at the tip; the alias
  serving the round's `[preview]` record; Vercel pruned; `new` and `updated` badges cleared; his review lines
  transcribed (`pnpm lab:review`).

## The round

1. **Will asks in one line** in chat, or notes `redesign` on a Library entry.
2. **The Orchestrator asks him the two or three questions that branch the work**, as a short options message (never
   a report), then cuts one lane per board: a manifest (the goal, the brief with his words, what binds, the lane)
   and the spawn prompt. A lane's own questions go in its manifest under "Questions" with a recommended answer: it
   takes that answer, builds it and lists the call for him to overrule. A one-way-door product decision is never
   guessed: the lane writes it as a question and hands off what it has.
3. **The agent returns DECISIONS** at `/design/lab/<board>` (the shape: "A round returns DECISIONS" below).
   `pnpm lab:smoke` refuses a board over its reading budget; `pnpm lab:demo` presses every open step's options and
   refuses a stage that does not change, is clipped, does not name what it shows, starts too far down, or whose dock
   leaves the screen.
4. **Integration**, one lane at a time, and one alias build per round (`[preview]` on the record commit; the
   Orchestrator creates the deployment by API, since no push creates one).
5. **Will reviews on the desk** (`/design/lab?key=`), ordered BY LEVERAGE: a board whose answer changes another's
   question sits above it, independent boards at the foot in any order (`DESK_ORDER` in `touchpoints.ts`, kept by the
   Orchestrator). Start the review walks one step per question, each answered from its dock with a note where the
   pick is not enough, and one paste at the end; the Orchestrator transcribes it (`pnpm lab:review`) and asks the
   follow-ups in chat.
6. **Winners are promoted**: the wiring round lands the component, section or screen, and its Library entry appears
   with a `new` badge, its preview, its variants and its contracts; the losing options leave with the board; a
   refined pick is refined inside the wiring round, never in another exploration. The lab winds down into the
   Library: a sitting ends in promotion, a board retires once its winners are working versions, and a later
   exploration branches from a Library entry. A board past round 1 needs his notes on record (`registry.test.ts`
   fails one with no `docs/reviews/<id>.json`): deepening an unreviewed board is the cheapest thing an agent can do
   and the least useful. **Never force a board's options apart**: options earn their place by being real contenders
   for the one decision, and two that land on the same answer is a finding, not a debt.
7. **The record is what is active**: the manifest is deleted in the merge commit, whose message carries the lane's
   summary; STATUS is rewritten; the Library and the desk show the live state; a retired board leaves nothing behind
   but its winner, and a board whose product no longer exists retires unreviewed, its live questions reshaped into
   the boards that replace it; git holds everything older. **Stacked boards never overlap in what they ask**: an exploration's
   brief names the open asks nearest its surface on the standing boards and asks nothing they ask, and the
   Orchestrator checks that at the cut. **When a ruling reaches a question still open on another board, the
   Orchestrator judges it**: an early pick can close the road to the best answer, so a question whose options still
   hold an idea that could beat the current path (even one the pick diverged from) is adapted to the current context
   with that road kept open as an option; only a question whose context is already solved at its best is removed.

### Init templates (Will copies one as the first prompt of a new session)

**Agent** (the manifest is the init; the Orchestrator's own spawns use `usher/kit/spawn-prompt.txt`):

> You are an AGENT on Partyreel's elevation program. Track `<track>`: your manifest is committed at
> `docs/tracks/<track>.md` and is your whole init. Boot per `docs/PROGRAM.md` "Agent boot", build, then hand off by
> filling the manifest's Handoff, setting `status: handed-off`, and pushing. The chat report is one line:
> "handed off at <sha>".

A bare goal works too (the agent writes its own manifest from the template in [`tracks/README.md`](tracks/README.md)).
To resume a handed-off branch: "resume `lp/<track>`".

**Orchestrator** (repo root, no worktree):

> You are THE ORCHESTRATOR for Partyreel's elevation program (single-writer integration role).
> Seat in per `docs/PROGRAM.md` "Roles", then take up the goal: `<goal>`.

### Agent boot (before ANY work)

1. `git fetch origin`; the track name is the manifest's, or a short kebab from the goal (at most 36 characters).
   Never adopt an existing `origin/lp/<track>` unless told to resume it.
2. In a worktree (`git rev-parse --git-dir` contains `/worktrees/`): `git checkout -b lp/<track> origin/launch-prep`,
   then `git branch -d <birth branch>`. In the primary checkout (the Orchestrator's tree): never branch, commit or
   edit there; `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep` and work inside it.
3. Confirm `git branch --show-current` = `lp/<track>` and `git merge-base --is-ancestor origin/launch-prep HEAD`.
4. `nvm use && pnpm install --frozen-lockfile`; copy `.env.local` from the primary checkout;
   `git push -u origin lp/<track>`. Push freely: neither CI nor Vercel runs on a lane push; `[preview]` and `[ci]` are
   the Orchestrator's to add.
5. The manifest: a committed one is filled in place; otherwise copy the template, fill `owns` and `reads`, commit it
   alone and push. `pnpm test` green here proves the lane is free.
6. Read the manifest end to end, then [`STATUS.md`](STATUS.md) and the `docs/systems/` doc the goal touches; follow
   CLAUDE.md's working loop. A dev server runs on a port of your own, killed by port before a build, a test run and
   the handoff.

**Sync** (merge, never rebase): never at boot; before handoff only if `origin/launch-prep` moved
(`git merge origin/launch-prep`, re-run the gate, name the sync commit); mid-lane only when `tracks/orchestrator.md`
announces a landed change touching one of your `reads`.
**Handoff:** sync; fill the Handoff (the work commit and the sync commit, the gates on the synced tree with their exit
codes, the lane check pasted, the items one line each, the calls his to overrule, assets asked, system-doc lines,
deferred lines, look at first); `status: handed-off`; commit the manifest alone; push; one line in chat naming the
head.

## The hard gates (no exceptions)

1. **Lab-validate before shipping creative magic**: a catalog in the lab, Will's verdicts, then the wiring round. An
   exploration round ships no production byte and verifies light (the board at 1440 and 375, reduced motion, the
   gate); the red-team lands with the wiring.
2. **One-way doors get an options message and WAIT for Will's ruling**, recorded as an invariant in the owning
   `docs/systems/` doc.
3. **No launch switches** (Stripe live, the real `/privacy`, secrets → Sensitive, `PRUNE_MODE=live`, the test-data
   reset): they accrete in ROADMAP's launch checkpoint and never execute mid-program.

## Integration: what the Orchestrator folds

Single-writer and merge-based, one lane at a time (the commands are the runbook's "Integrate a handoff"). Per lane:
the manifest must be `handed-off` → the lane check (`git diff --name-only launch-prep...origin/lp/<track>`: every
line inside `owns`, the manifest, or a listed system doc; anything else is handed back or ruled) → `merge --no-ff`
with the manifest DELETED in the merge commit and the lane's summary in its message → the gate on the merged tree,
each step on its own exit code → the doc-eye pass over every listed system-doc edit, fact against code → the lane's
Deferred lines into their ROADMAP buckets, its asset asks into `docs/ASSETS.md`, a ruling of Will's into the rule it
made (the Library, a system doc, this file) → prune the worktree and branch, and only after the lane's final line: a
lane asked for more work after its handoff is a lane still working. A change touching more than one open lane is
Orchestrator-only, announced in `tracks/orchestrator.md` first. Migrations are global state (one Supabase behind prod
and every preview): agents write the SQL file, the Orchestrator applies it (additive-only while an open lane's code
still calls what a contract would drop; `get_advisors`; regenerate `types.ts`; commit both). Workers are global too
(`wrangler whoami` first).

## The record's depth

Nothing under `docs/` is history. STATUS is a snapshot of now (the current round, live state, Will's queue); a
manifest lives from cut to merge; the merge commit carries what shipped; git holds the rest.
`src/lib/record-depth-policy.test.ts` holds the caps and refuses a CHANGELOG.

## Milestones

`launch-prep` never holds more than about two rounds of unmerged work. A milestone is a `--no-ff` merge into `main`
(never squash), tagged `milestone-<n>`, production READY at the merge SHA, then a verification pass on partyreel.com
(what previews cannot prove). Hotfix: fix on `main`, verify, back-merge to `launch-prep` the same session. The steps:
the full gate on `launch-prep` (`rm -rf .next/dev` first); `git checkout main && git merge --no-ff launch-prep`
(subject `milestone-<n>: prod = <the three to five things>`); an annotated tag; push `main` then the tag; production
READY at the SHA, then the pass; `git checkout launch-prep && git merge --ff-only main`; STATUS and the pickup
rewritten on `launch-prep`.

## Program principles

Each principle is a heading so the Library indexes it (`/design/library/doctrine/program`) and a Binds strip can cite
it by anchor.

### Rising tides

Nothing is protected (bible 22): every page, section, component, flow and line, the app's UI and the guest pages
included, is judged from the ground up (what the perfect version would be if it did not exist yet) and built:
elevate what points there, rework what does not, raise the global system as you go. The call is the agent's each
time, prototyped in the lab first; big reversible swings beat small cautious steps; every page still ends at the
"would this hold up next to the homepage?" check. Any earlier decision may be relitigated when a better answer
exists.

### A round returns DECISIONS

**An exploration is a list of decisions, not a page.** Will's bar is a minute each: "Read a question, worded in clean
natural language, that clearly asks me to make one decision (winner) within the group · Preview each option fully,
visuals-forward where possible, to quickly find a favorite or request refinements, with any relevant configs
included · Select my winner, leave optional notes, and onto the next."

Author with **`defineExploration`** (`src/components/lab/exploration.ts`) and nothing else. You write the questions
and one preview per option; it derives the sections, the controls, the state patches and the verdict, and emits an
ordinary board, so the desk, the walk, the grammar and `lab:review` all work unchanged. **Every option is drawn, by
construction**: a missing preview is a TYPE error rather than a blank tile at the review. Declare `tile: "phone"` when
the previews are a 375 column.

Shape a big goal **progressively**, never as one "pick one": `after` stages a question behind another answer, and two
decisions with no `after` between them are independent pieces he can take in any order. Prefer more rounds of
narrower questions to one wide one.

**Offer the fix at its source.** When a question is a symptom of the system (a page reads wrong because a token is
wrong), the options include fixing the system, not only living with it on the page. **Measure every tile before it
ships:** a preview shows what its option's words claim, checked on screen rather than computed (a formula's sign run
backwards draws the opposite of the words he picks).

**Answer a relative note against a reference.** A note like "a bit more calm" is answered with options graded against
something he already likes, never with a cap and a test that makes every option calm by construction. **Placeholder
copy is judged for its size and wrapping, not its words.**

What NOT to build: a page with argument, a verdict essay, departures, or keep / refine / kill over N cards. "Simply
designing a few variations will always beat a mountain of research text."

**The workflow rides rising tides too.** The decision shape is the program's throughput engine, and the Orchestrator
keeps improving it: notes on what would make a sitting faster, a board truer or a handoff cleaner go to the ROADMAP's
"The lab and the kit" bucket, and a lab lane is cut on them whenever a seat is free, without asking; a lab lane is
sized in days and never delays a board.

### Every round gets Will's notes

No second round of the same work is cut without his notes on the first. The notes come through the desk, one line,
transcribed by the Orchestrator; the next brief quotes them, and the next brief is the wiring, not another
exploration, unless he asks for one by name.

### Prototype first, focused rounds

Creative and UI magic is prototyped in the lab before it is wired (hard gate 1), and the work runs as focused
per-dimension rounds rather than mega-plans. An exploration round is light: it ships no production byte, verifies its
board at 1440 and 375 with reduced motion honoured and the gate green, and hands off; iterate rather than perfect.

### Own fewer services, cost frugality

No recurring SaaS pre-revenue; prefer free tiers and in-house (the on-device render engine is the archetype).

### Model delegation

The Orchestrator carries judgment and curation: it plans, judges and integrates, and reads Handoffs, lane checks and
captures rather than whole diffs. Volume work fans out to lanes, at most six at once on this machine
(`memory_pressure` before every spawn), one process each. A lane runs on Opus for big, ambiguous, multi-file work and
on Sonnet for fast, direct UI work; the choice is the Orchestrator's on every spawn and is named in the lane's
In-flight row. A lab agent stays light enough on rules to keep its creative energy for the board. Which model
orchestrates is Will's choice per session; every commit's trailer names the model actually running.

### Rules are provisional

**The Library holds working guidelines, not hard rules**, while the product is being built: they keep what is built
and what is new consistent, an agent follows them by default, and any of them is reshaped when a better solution needs
it (the lane says which in its Handoff). The Library hardens only as the marketing site and the app near their final
production state, on Will's word. Until then any past decision may be relitigated for a better solution.

**Before launch there are no real users** (Will, 2026-09-22: "Don't have to dance around anything like save tables
in the database before launch"): no migration carries compatibility work to keep test data, and a contract lands as
soon as the alias's build no longer calls what it drops (after that build's red-team), even before the milestone
that ships it. The report names what partyreel.com loses in the meantime. The delay to launch exists so the product
is right before anyone's data has to be adapted to it.

★ Most of the laws and don't-revert notes in this repo were written by agents against a design system that has since
moved. Of every rule you touch, ask "a good rule that prevents bad choices, or a bad system that prevents good
choices?": keep the real scar, reshape the expired reason, say which in the commit. A ★ marks a silent breakage if
reverted, never a design preference. The bible changes only by Will's ruling; the Orchestrator lands everything else.

### Unlimited design resources

Design as if any image, video, SVG, 3D or generative asset can be made, because Will makes them: ask for exactly what
the design needs in the manifest's Handoff, ship the stand-in meanwhile, swap by id when the asset lands.
