---
track: lab-revamp
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a13a3bd0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - src/app/(dev)/design/(shell)/lab/tools/
  - src/app/(dev)/design/(shell)/lab/proposals/
  - src/app/(dev)/design/(shell)/lab/tracks/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/lab/
  - scripts/lab-review.mjs
  - scripts/lab-smoke.mjs
  - scripts/lab-demo.mjs
  - usher/kit/
  - src/app/(dev)/design/sandbox/locked-door/
  - src/app/(dev)/design/sandbox/disposable-mode/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/demo-framing/
  - src/app/(dev)/design/sandbox/press-page/
  - src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/README.md
  - CLAUDE.md
  - docs/systems/design-system.md
  - docs/PROGRAM.md
---

# lp/lab-revamp

**Goal.** Rebuild the lab's plumbing: a board as one self-registering folder (no shared list a lane edits, retirement a folder deletion), lab checks scoped to the lane's own boards, the authoring API trimmed, the lab's 'ruled/ratified' words renamed, and the kit and docs following, so a fresh agent can author the next board from the docs alone.

## The brief

**The lab revamp**, long planned for the moment the desk emptied (the Orchestrator's pickup, `docs/tracks/orchestrator.md` "The lab revamp"). The lab is where every design idea reaches Will (`/design/lab`, his desk; `docs/PROGRAM.md` "The round" and "A round returns DECISIONS"), and its plumbing now costs more than it should.

**What hurts today:**
- A board registers itself in three shared lists (`sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`'s `RULINGS` and `DESK_ORDER`), so two lanes cut in parallel collide there on every merge: `usher/kit/merge-lane.sh` carries a diff3 resolver for it and, since this batch, a sweep for the id-less skeleton two adjacent retirements leave (pricing-wiring's and export-wiring's merges each needed a hand fix). Retiring a board means one commit across the three files.
- Every lane's gate runs the lab's checks over every board, not its own.
- The authoring API (`src/components/lab/exploration.ts`'s `defineExploration`) has grown, and a lane's brief spends words on it.
- `defineExploration` keeps the first control of an id, so an ask whose id equals a config knob's silently swallows the knob; `usher/kit/board-card.mjs` counts an earlier round's answer as this round's where an ask keeps its id (the desk itself is round-aware).
- The lab's own words still say "ruled", `RULINGS`/`Ruling`/`getRuling` and "ratified", where a pick is the best of what was drawn, never a ruling (CLAUDE.md "Rising tides").

**The goal:**
- **A board is one self-registering folder**: its metadata (title, surface, asks, `lives`, round, its place on the desk, its notes from Will) in its own `spec.ts`, found without any shared list a lane edits. Retiring a board is deleting its folder (its ledger in `docs/reviews/` is the Orchestrator's). Two boards cut in parallel never touch one file. Keep every invariant the three files' tests hold today (a board past round 1 carries his notes; every desk board has its row; the desk's order by leverage) in the new home, each with its reason.
- **Lab checks scoped to the lane's own boards**: `lab:smoke` and `lab:demo` (and `usher/kit/gate-lane.sh`'s lab step, through `scope.sh`) run what a merge touched, the whole lab only on `FULL=1`.
- **The authoring API trimmed** to what boards use, with the id collision refused and `board-card.mjs` reading the round.
- **The words renamed**: ruled, rulings, ratified become the program's own words (a pick, an answer, a verdict: your call, one consistent set), across the lab, the kit and the docs, with a test that refuses the old ones.
- **The kit follows**: `merge-lane.sh` loses what the new shape makes unnecessary, and `integrate.sh`, `cut-lane.py` (a new board's instructions), `board-card.mjs`, `batch-reader.mjs`, `review-sheet.mjs`, `desk-check.mjs`, `capture*.sh`, `scripts/lab-review.mjs`, `scripts/lab-smoke.mjs`, `scripts/lab-demo.mjs` and `usher/kit/negative.sh` (a refusal for each new rule) read the new home. `usher/kit/README.md` is refined in place, not stacked; `docs/PROGRAM.md` is the Orchestrator's alone, so put its refined authoring lines in your Handoff, word for word, and the Orchestrator applies them at your merge.
- **Take in ROADMAP's lab lines the new shape answers** (the lines starting "The lab and the kit:" or "The lab:"; among them crumbs-12's two policies that skip the lab, `lab:demo`'s first-frame-only same-picture check and its default-knobs-only pass, and an open ask whose premise rots), and retire each you close in your Handoff's Deferred by its words. Leave the rest.

**Every standing board converts.** The boards on the desk now: `locked-door` r2 and `disposable-mode` r2 (Will reviews both on build 21 while you work, so keep them rendering and their ledgers' round keys intact), and the answered boards waiting on their wiring or next round (`loose-ends`, `contact-page`, `album-motion`, `privacy-hero`, `demo-framing`, `press-page`). Two more (`event-settings`, `admin-triage`) are owned by running wiring lanes that retire them at their merge: leave their folders alone; your registry must still find them while they exist, and their retirement becomes a folder deletion the Orchestrator resolves at integration.

**Not yours now:** `crumbs-13` owns `(shell)/lab/_desk/review-session.tsx` until it merges (announced in `docs/tracks/orchestrator.md`); sync then and add it to `owns` if you need it. Library-lean's ideas (a Surfaces family of live frames per route, the Library's sidebar open by default, a plain-text view of Library pages, a retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`) are a lane after yours: leave them.

**The proof:** the first board cut after your merge is authored by a fresh agent from the docs alone; write the docs so it can. Your Handoff names what that agent should find hardest.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:** the gate whole, with `FULL=1` lab steps; `negative.sh` all refusals holding; a scratch board added and retired in a throwaway branch with no shared file touched; two scratch boards merged in parallel with no conflict; the desk at 1440 and 375 reading exactly as before for `locked-door` and `disposable-mode`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Stage one (the re-scope, 2026-09-29), each built on its recommendation, his to overrule:

- **The field names.** An ask's `where` (a breadcrumb of two to four crumbs, the surface first), `when` (the state that
  brings someone there) and `matters` (why it matters, beside `lands`, what it decides); each option's `gains` and
  `costs`; `because` as the recommendation's one-line reason; a board's `opening` (`about`, `settled`, `earlier`) and
  `terms`. Recommended: as built (`src/components/lab/exploration.ts`, `board-spec.ts`).
- **Which asks the test holds.** "Open" is what his walk can reach this round (no ledger entry in the spec's round, not
  moot, not staged behind a "not clear to me"), the desk's own reading. That reaches press-page's `a-human` and
  `the-close` as well as the twelve, so both were backfilled (with press-page's opening). Recommended: keep; overrule:
  withdraw press-page's two from the walk until the About round replaces the board.
- **Where the opening shows.** Open on the first step his sitting reaches on a board, folded to one line ("About this
  board") on its later steps, and at the head of the whole board. Recommended: as built.
- **Coined words.** A board declares them (`terms`, the bare phrase where it can be, so "the roll" and "her roll" both
  find `roll`); the step glosses each term its own words use and the open opening the ones it uses, never twice; the
  test refuses a term with no meaning, a meaning over a line, and a term the board never says. A coinage the author
  does not declare no machine can catch. Recommended: as built.
- **The reach.** `lab:demo`'s OUT OF REACH is now measured from the question's head, not the page top (the opening sits
  above the question, once per board), still 0.6 of a 900px screen. Recommended: keep; overrule: cap the opening's
  lines instead and measure from the top again.

## System-doc edits (in place, owned facts only)

- none: the principle's home is `docs/PROGRAM.md` (the Orchestrator's, line proposed below) and its mechanics live in
  `exploration.ts`, `terms.ts` and `registry.test.ts`.

## Deferred (ROADMAP one-liners, bucket named)

- Retire, closed by stage one ("The lab and the kit:" list): "The pinned stage head crushes at 375 when a step has one
  config row: the recommended line and the knob strip share a line and the label truncates." (the label keeps a 12rem
  floor and the strip wraps under it, `step.tsx`'s `StageHead`).
- Refine the Now line "The lab and the kit: `defineExploration` keeps the first control of an id, ..." to its half still
  open: "The lab and the kit: `defineExploration` keeps the first control of an id, so an ask whose id equals a config
  knob's silently swallows the knob (`disposable-mode` r2's `screen` ate its Screen knob until it became `wall`); the
  registry refuses the collision (from `disposable-mode` r2)." (`board-card.mjs` reads the spec's own round now.)
- The lab and the kit: on a phone the step a sitting enters a board on reads its opening for about two screens before
  the question (disposable-mode's five settled and four earlier lines at 375); fold the opening's two lists below `sm`
  if he reviews on a phone.
- The lab and the kit: a board's `opening.earlier` is authored; the ledger's own notes from the round before could ride
  in a fold under it, word for word, so his exact sentence is one press away from the summary of it.

## Handoff (replaces the chat report)

**Stage one alone** (the re-scope). Stage two, the plumbing, waits with no code on any branch: its findings are notes at
`../partyreel-wt/_scratch/lab-revamp/stage-two.md` (Turbopack's `require.context` probed in dev on the server, in SSR
and in the browser; vitest through `import.meta.glob`; the two foreign boards' desk facts; the extra owns it needs).

- **The work commit** `34cde344`, pushed; no sync commit: launch-prep moved (crumbs-13 merged at `3d2cfbd6`, records to
  `f1bf741d`) with nothing in this lane's files or reads (`comm` of the two file lists is empty), so the record rule
  holds and no sync was run. The head is the manifest commit in the chat line.
- **Gates on the tree committed as `34cde344`**, each on its own exit code, logs in `../partyreel-wt/_scratch/lab-revamp/`:
  `pnpm typecheck` 0 (`g-typecheck.log`); `pnpm lint` 0, 0 errors and 3 warnings, none in this lane's files
  (`review-session.tsx`, `album-fill-grid.tsx`: crumbs-13's, gone on launch-prep) (`g-lint.log`); `pnpm test` 0, 568
  files and 6497 tests (`g-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`g-build.log`); `pnpm lab:smoke --base
  http://localhost:3133` 0, 169 checks, 0 failing, the reading disposable-mode 1055, locked-door 826 and press-page 487
  of 1200 (`g-smoke.log`); `pnpm lab:demo --board <b>` 0 for locked-door (4 steps, 0 failing), disposable-mode (8, 0)
  and press-page (2, 0) (`g-demo-*.log`). A lab-only change, so the live red-team's carve-out applies; the alias shows
  it once the Orchestrator's `[preview]` builds it.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file;
  `_desk/session-step.ts` joined `owns` before it was edited (the step's data carries the new fields).
- **The authoring format**: `Decision.where/when/matters`, `DecisionOption.gains/costs`, `because` as the reason in a
  line, `ExplorationInput.opening/terms` (`exploration.ts`), mirrored on `Ask`, `AskOption`, `BoardSpec` and `LIMITS`
  (`board-spec.ts`), carried to the step by `_desk/session-step.ts`.
- **The step renders it** (`step.tsx`, `opening.tsx`, `terms.ts`): the opening open on the board's first reachable step,
  folded after; the breadcrumb, the state and the question, with what it decides, why it matters and "The board says:
  <pick>. <reason>" beside; the step's own terms glossed across the head, never repeating the open opening's; the
  shown option's means, gain and cost under the sticky stage head (side by side, under each option's name); the reason
  on the recommended dock chip; gains and costs on an option in words.
- **The desk** (`(shell)/lab/page.tsx`): each queue row carries its breadcrumb; a board card leads with its opening's
  line; the whole board opens with its opening (`board-page.tsx`).
- **The test** (`registry.test.ts`, "an open ask carries its context"): an open ask without where (two to four
  crumbs), when, lands, matters, a one-line because, or an option without its gain and cost fails, each capped to a
  line (`LIMITS.askWhere` 32 a crumb, `askWhen` and `askMatters` 140, `optionGains` and `optionCosts` 100, `askReason`
  160, `openingAbout` and `openingLine` 160, `term` 40, `termMeans` 120); a board past round one owes its
  `opening.earlier`; a term needs a meaning and a place its board says it. Proven by hand to refuse a one-crumb
  breadcrumb, a missing `matters`, a 113-character gain and an unused term; the render is pinned in `step.test.tsx`
  (order, the trade following the shown option, the opening open then folded, the gloss said once) and the matcher in
  `terms.test.ts`.
- **The backfill**, from each board's spec and drawings, in plain words: locked-door r2's `family`, `shape`, `wait`,
  `lost` and its opening and eleven terms; disposable-mode r2's eight and its opening and ten terms; press-page's
  `a-human` and `the-close` and its opening. Ask and option ids and every round untouched; a few `means` and `context`
  lines lost their ledger tokens and jargon (`waiting=held`, `the sync`, `latent`, `never baked`).
- **The kit**: `board-card.mjs` prints each board's opening and terms and each ask's where, when and matters (and what
  context an open ask still lacks), and counts only the answers of the spec's own round; `batch-reader.mjs` parses the
  new fields and prints them in `--board` and beside every verdict of a paste.
- **`lab:demo`** measures OUT OF REACH from the question's head (`scripts/lab-demo.mjs`, the header says why); the stage
  head's label keeps a 12rem floor, so the knob strip wraps under it at 375 instead of crushing it.
- **`docs/PROGRAM.md`, proposed word for word** (its "A round returns DECISIONS" first bullet, refined in place):
  "- Author with `defineExploration` (`src/components/lab/exploration.ts`) and nothing else; the newest board built on
  it is the worked example. Its context layer is an ask's `where` (a breadcrumb), `when` and `matters` beside `lands`,
  each option's `gains` and `costs`, `because` in a line, and the board's `opening` (`about`, `settled`, `earlier`)
  and `terms`; `registry.test.ts` refuses an open ask without them."
- Assets requested from Will: none.
- Board ideas: none beyond the two Deferred lines.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the five Questions above, each built on its recommendation.
- Look at first: `/design/lab/locked-door?session=locked-door.family` at 1440 (the opening, then the head, the aside,
  the terms, the trade under the stage head), then `disposable-mode.waiting` (a later step: the opening one line away),
  and `/design/lab` for the breadcrumbs on the queue.
