# The Elevation Program — charter, roles, protocol

> ROLE: the active program's rulebook: what the program is, who does what, how a round runs, the
> hard gates, the milestone policy, the versioning protocol. BELONGS HERE: rules that outlive any
> one round. · NOT HERE: where we are now (→ [`STATUS.md`](STATUS.md)), the per-session summary (→
> [`../CLAUDE.md`](../CLAUDE.md), canonical for the rules themselves), what shipped (→
> [`CHANGELOG.md`](CHANGELOG.md), two rounds deep). LIFECYCLE: dies at program end (the teardown
> checklist is in ROADMAP's launch checkpoint).

**The program (since 2026-07-02):** take all four surfaces (App / Marketing / Admin / the `/design`
lab) to magic-grade on the `launch-prep` integration branch, in focused rounds, before a separate
launch round. Will sets the goals, answers the questions and rules on UI; agents return catalogs of
polished ideas; the Orchestrator carries every back-and-forth and lands everything.

## Roles: Orchestrator and Agent

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator**
(the rules: [`CLAUDE.md`](../CLAUDE.md) "Sessions & roles").

- **One Orchestrator at a time**, seated in the repo root on `launch-prep`. It alone merges into
  `launch-prep`, applies migrations, deploys Workers, mutates Vercel/Stripe/Supabase config, runs
  milestone merges, cuts tracks, asks Will the questions and transcribes his answers. It closes
  every round succession-ready (below).
- **Agents** work in worktrees on their own `lp/<track>`, self-created at boot; the manifest
  `docs/tracks/<track>.md` is the whole init and the whole handoff (the template and the lane rules:
  [`tracks/README.md`](tracks/README.md)). An Agent never edits CHANGELOG, STATUS, ROADMAP, this
  file, CLAUDE.md, `docs/ASSETS.md`, `docs/design/rulings.md` or `docs/reviews/`; a `docs/systems/`
  line may be refined in place only for a fact inside its owned paths, listed in the manifest so it
  is read by eye at the merge. Worktree sessions have no out-of-repo memory by design.
- **Seat-in (a fresh Orchestrator):** [`STATUS.md`](STATUS.md), this doc, `docs/tracks/` (a
  `handed-off` manifest is the signal) and `git branch -r --list 'lp/*'` for branches without one;
  the alias state at the `launch-prep` tip; the desk at `/design/lab?key=` for what waits on Will.
- **Succession-ready close:** every handed-off track integrated and its manifest deleted; the
  round's CHANGELOG entry written and the third-oldest deleted; STATUS replaced; In flight in
  [`tracks/orchestrator.md`](tracks/orchestrator.md) current; worktrees and `lp/*` branches pruned;
  the gate green at the tip; the alias READY at the round's `[preview]` push; Vercel pruned
  (`node scripts/prune-vercel-deployments.mjs --apply`); `new` and `updated` badges cleared; Will's
  rulings appended to `docs/design/rulings.md` and his review lines transcribed (`pnpm lab:review`).

## The round

1. **Will asks in one line** in chat, or notes `redesign` on a Library entry while scrolling.
2. **The Orchestrator asks him the two or three questions that branch the work**, as a short
   options message (never a report), then cuts one track per board: a one-screen manifest (goal,
   what binds, the lane, his notes on the last round quoted from the ledger) and the spawn
   paragraph. An agent's questions during the round go in its manifest under "Questions" with its
   recommended answer; the Orchestrator relays them the same way and quotes the answer back. An
   agent never guesses at a product decision.
3. **The agent returns a catalog** on `/design/lab/<board>`: a grid of ideas, each a polished
   variant with a live preview on a production ground, a name, one line, the builder's verdict and
   a facts strip; any two side by side on real pages; the pick worn by the real pages below; asks
   only for what is not one item; the argument collapsed. `pnpm lab:smoke` refuses a board over its
   reading budget. Handoff is one line per item plus the questions it needs answered.
4. **Integration**, and one alias build per round close (`[preview]` on that push alone).
5. **Will reviews on the desk** (`/design/lab?key=`): Start the review, the card pins under each
   board's dock, keep / refine / kill and a note per item, a word per ask, one paste at the end. The
   Orchestrator transcribes it (`pnpm lab:review`) and asks the follow-ups in chat.
6. **Kept items are promoted**: the wiring round lands the component, section or screen, and its
   Library entry appears with a `new` badge, its preview, its variants and its contracts; the
   catalog card links to it; killed items leave with the board; a refined one is refined INSIDE the
   wiring round, not in another exploration. **The lab winds down into the Library** (Will,
   2026-09-16): a sitting ends in promotion, a board retires once its favourites are working versions,
   and a later exploration branches from a Library entry, never from a board nobody selected.
   **Never a second round of the same work without his notes between.**
7. **The record is what is active**: the manifest is deleted in the merge commit, its Record joins
   the round's CHANGELOG entry, STATUS is replaced, the Library and the desk show the live state;
   git holds everything older.

### Init templates (Will copies one as the first prompt of a new session)

**Agent** (the manifest is the init; the full paragraph is in [`tracks/README.md`](tracks/README.md)
"Spawning a track from a stub"):

> You are an AGENT on Partyreel's elevation program. Track `<track>`: your manifest is committed at
> `docs/tracks/<track>.md` and is your whole init. Boot per `docs/PROGRAM.md` "Agent boot", build,
> then hand off by filling the manifest's Handoff and Record, setting `status: handed-off`, and
> pushing. The chat report is one line: "handed off at <sha>".

A bare goal works too (CLAUDE.md "Sessions & roles" routes any undesignated session here; the agent
then writes its own manifest from the template). To resume a handed-off branch: "resume `lp/<track>`".

**Orchestrator** (repo root, no worktree):

> You are THE ORCHESTRATOR for Partyreel's elevation program (single-writer integration role).
> Seat in per `docs/PROGRAM.md` "Roles", then take up the goal: `<goal>`.

### Agent boot (before ANY work)

1. `git fetch origin`; the track name is the manifest's, or a short kebab from the goal (at most 36
   characters). Never adopt an existing `origin/lp/<track>` unless told to resume it.
2. In a worktree (`git rev-parse --git-dir` contains `/worktrees/`): `git checkout -b lp/<track>
   origin/launch-prep`, then `git branch -d <birth branch>`. In the primary checkout (the
   Orchestrator's tree): never branch, commit or edit there; `git worktree add
   ../partyreel-wt/<track> -b lp/<track> origin/launch-prep` and work inside it.
3. Confirm `git branch --show-current` = `lp/<track>` and `git merge-base --is-ancestor
   origin/launch-prep HEAD`.
4. `nvm use && pnpm install --frozen-lockfile`; copy `.env.local` from the primary checkout;
   `git push -u origin lp/<track>`. Push freely: neither CI nor Vercel runs on a work-in-progress
   push; `[preview]` and `[ci]` are the Orchestrator's to add.
5. The manifest: a committed stub is filled in place; otherwise copy the template, fill `owns` and
   `reads`, commit it alone and push. `pnpm test` green here proves the lane is free.
6. Read the manifest end to end, then [`STATUS.md`](STATUS.md) and the `docs/systems/` doc the goal
   touches; follow CLAUDE.md's working loop. One process at a time on this machine; a dev server on
   a port of your own, killed by port before a build, a test run and the handoff.

**Sync** (merge, never rebase): never at boot; before handoff only if `origin/launch-prep` moved
(`git merge origin/launch-prep`, re-run the gate, record the SHA); mid-round only when
`tracks/orchestrator.md` announces a landed change touching one of your `reads`.
**Handoff:** sync; fill Handoff (head SHA, the gates on the synced tree, the lane check pasted, the
items one line each, the questions and their answers, assets, system-doc lines, deferred lines, look
at first) and Record (one paragraph, at most eight lines); `status: handed-off`; push; one line in chat.

## The hard gates (no exceptions)

1. **Lab-validate before shipping creative magic**: a catalog in the lab, Will's verdicts, then the
   wiring round. An exploration round ships no production byte and verifies light (the board at 1440
   and 375, reduced motion, the gate); the red-team lands with the wiring.
2. **One-way doors get an options message and WAIT for Will's ruling**, recorded as an invariant in
   the owning `docs/systems/` doc.
3. **No launch switches** (Stripe live, the real `/privacy`, secrets → Sensitive, `PRUNE_MODE=live`,
   the test-data reset): they accrete in ROADMAP's launch checkpoint and never execute mid-program.

## Integration: what the Orchestrator folds

Single-writer, merge-based, windowed: fetch with prune; integrate every `handed-off` track oldest
first (a quick typecheck and test after each merge, the full gate once on the final tree, each step
on its own exit code); one push. Per track: the manifest must be `handed-off` → the lane check
`git diff --name-only launch-prep...origin/lp/<track>` (every line inside `owns`, the manifest, or a
listed system doc; anything else is handed back or ruled) → staleness (`git rev-list --count
origin/lp/<track>..launch-prep`; a live agent syncs first when the diffs intersect outside docs) →
`merge --no-ff` with the manifest DELETED in the merge commit → the doc-eye pass over every listed
system-doc edit, fact against code → the manifest's Record into the round's CHANGELOG entry, its
Deferred lines into their ROADMAP buckets, its questions and Will's answers into
`docs/design/rulings.md`, its asset asks into `docs/ASSETS.md` → prune (`git worktree remove`,
`git branch -d`, `git push origin --delete lp/<track>`, the Vercel prune). A change touching more
than one open lane is Orchestrator-only, announced in `tracks/orchestrator.md` first. Migrations are
global state (one Supabase behind prod and every preview): agents write the SQL file, the
Orchestrator applies it (additive-only while any branch is unmerged; `get_advisors`; regenerate
`types.ts`; commit both). Workers are global too (`wrangler whoami` first).

## The record's depth

Nothing under `docs/` is history. The CHANGELOG holds the current round and the one before (two
entries, newest first, each with its `git log` pointer); STATUS is a snapshot of the current round,
the previous one, live state and Will's queue; a manifest lives from cut to merge; git holds the rest
(`src/lib/record-depth-policy.test.ts` holds the line caps).

## Milestones

`launch-prep` never holds more than about two rounds of unmerged work. A milestone is a `--no-ff`
merge into `main` (never squash), tagged `milestone-<n>`, production READY at the merge SHA, then a
verification pass on partyreel.com (what previews cannot prove). Hotfix: fix on `main`, verify,
back-merge to `launch-prep` the same session. The steps: the full gate on `launch-prep` (`rm -rf
.next/dev` first); `git checkout main && git merge --no-ff launch-prep` (subject `milestone-<n>: prod
= <the three to five things>`); an annotated tag; push `main` then the tag; production READY at the
SHA, then the pass; `git checkout launch-prep && git merge --ff-only main`; the record on
`launch-prep` (CHANGELOG, STATUS, the orchestrator manifest's window).

## Program principles

Each principle is a heading so the Library indexes it (`/design/library/doctrine/program`) and a
Binds strip can cite it by anchor.

### Rising tides

Nothing is protected (Will, 2026-08-27; bible 22 since 2026-09-14): every section, component, flow
and line is judged from the ground up, what the perfect version would be if it did not exist yet,
and built: elevate what points there, rework what does not, raise the global system as you go. The
call is the agent's each time, prototyped in the lab first; big reversible swings beat small cautious
steps; the app's UI is inside this. The older half holds: spread the rise, and every page still ends
at the "would this hold up next to the homepage?" check.

### A round returns a catalog

An exploration is a catalog of polished variants to pick from, not a paper (Will, 2026-09-15 and
2026-09-16): each item a live preview on a production ground with a name, one line, the builder's
verdict and its facts; any two side by side on real pages; the pick worn by the real pages; asks only
for what is not one item, each carrying its context. "Simply designing a few variations will always
beat a mountain of research text." Where the question is not a set of things, build the comparison
the question needs (a voice on two dozen real spots; scales on real UI).

### Every round gets Will's notes

No second round of the same work is cut without his notes on the first (Will, 2026-09-16: agents
run two and three rounds unattended "made research papers out of their first round's work"). The
notes come through the desk, one line, transcribed by the Orchestrator; the next brief quotes them.
And the next brief is the wiring, not another exploration (Will, 2026-09-16: "wind down the current
lab work as we progress and pass our favorite ideas into the library... that way we don't accidentally
branch this into infinite trees of track explorations, never actually selecting anything").

### Prototype first, focused rounds

Creative and UI magic is prototyped in the lab before it is wired, and the work runs as focused
per-dimension rounds rather than mega-plans.

### Own fewer services, cost frugality

No recurring SaaS pre-revenue; prefer free tiers and in-house (the canvas engine replacing Lambda is
the archetype).

### Model delegation

The Orchestrator carries judgment and curation; volume work fans out to cheaper agents, at most four
at once on this machine, one process each.

### Rules are provisional

★ Most of the laws and don't-revert notes in this repo were written by agents against a design
system that has since moved (Will, 2026-09-01; every agent's duty since 2026-09-12). Of every rule
you touch, ask "a good rule that prevents bad choices, or a bad system that prevents good choices?":
keep the real scar, reshape the expired reason, say which in the commit. A ★ marks a silent breakage
if reverted, never a design preference. The bible changes only by Will's ruling; the Orchestrator
lands everything else.

### Unlimited design resources

Design as if any image, video, SVG, 3D or generative asset can be made, because Will makes them
(2026-09-14): ask for exactly what the design needs in the manifest's Handoff, ship the stand-in
meanwhile, swap by id when the asset lands.

### Exploration rounds are light and iterative

A lab-only round ships no production byte, verifies its board at 1440 and 375 with reduced motion
honoured and the gate green, and hands off (Will, 2026-09-14); the red-team lands with the wiring.
Iterate rather than perfect.

### Nothing is protected

Every page reaches a cohesive informational flow and every point of the design system, the marketing
site and the app is elevated platform-wide (Will, 2026-09-14); no surface is exempt, and the app's UI
is open to any active lab track. Parallel agents run through the Orchestrator.
