---
track: lab-revamp
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "54cd706c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - src/app/(dev)/design/(shell)/lab/_desk/
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
  - src/app/(dev)/design/_data/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/(shell)/_shell/markdown.tsx
  - scripts/lab-scope.mjs
  - scripts/new-board.mjs
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/(shell)/_shell/page-markdown.test.tsx
  - src/app/(dev)/design/(shell)/library/foundations/gallery-demos.tsx
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/lib/type-ladder-policy.test.ts
  - src/lib/jsx-text-space-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/README.md
  - CLAUDE.md
  - docs/systems/design-system.md
  - docs/PROGRAM.md
---

# lp/lab-revamp

**Goal.** Stage two of the lab revamp, the plumbing: a board as one self-registering folder (no shared list a lane edits, retirement a folder deletion), lab checks scoped to the lane's own boards, the authoring API trimmed, the lab's 'ruled/ratified' words renamed, and the kit and docs following, so a fresh agent can author the next board from the docs alone. Stage one (the context layer) is merged.

## The brief

**Stage one is merged** at `a17725c3` (the context layer: every open ask's `where`, `when`, `matters`, each option's `gains` and `costs`, `because`, each board's `opening` and `terms`; `registry.test.ts` refuses an open ask without them). Stage two keeps every one of those rules whole in the new home. Your notes from stage one are `../partyreel-wt/_scratch/lab-revamp/stage-two.md` (`require.context` works under `next dev` and Vitest, untried under `next build`: try the build first). Since stage one, the Orchestrator made press-page's `a-human` moot behind `who-for` (one line in its spec).

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

**Not yours now:** Library-lean's ideas (a Surfaces family of live frames per route, the Library's sidebar open by default, a plain-text view of Library pages, a retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`) are a lane after yours: leave them.

**The proof:** the first board cut after your merge is authored by a fresh agent from the docs alone; write the docs so it can. Your Handoff names what that agent should find hardest.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:** the gate whole, with `FULL=1` lab steps; `negative.sh` all refusals holding; a scratch board added and retired in a throwaway branch with no shared file touched; two scratch boards merged in parallel with no conflict; the desk at 1440 and 375 reading exactly as before for `locked-door` and `disposable-mode`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...

## Where I am (checkpoint, 2026-09-29; a resuming agent reads this, then `../partyreel-wt/_scratch/lab-revamp/stage-two.md`)

**Done, pushed on `lp/lab-revamp`:**
- `f92ff5dc` a board is one self-registering folder: `sandbox/registry.ts` finds every `sandbox/<id>/spec.ts` by
  `require.context` (Vitest: `import.meta.glob`), `(shell)/lab/[board]/board-components.ts` finds every `board.tsx`
  the same way; each spec carries its own `surface`, `desk` (leverage order, gaps of 10), `lives`, `tracks`
  (`DeskFacts` in `board-spec.ts`); `admin-triage` and `event-settings` ride `PREDATES` in registry.ts until their
  wiring lanes retire them; `touchpoints.ts`, its test and `(shell)/lab/boards.ts` deleted; every consumer reads
  `BOARDS`; registry.test.ts holds one-export specs and boards, desk facts, the order, PREDATES only shrinking, and
  every stage-one context rule; board-card.mjs reads the round; batch-reader.mjs reads the folder.
- `668918ef` owns widened (`_data/`, `review/`, `_shell/markdown.tsx`, `scripts/lab-scope.mjs`, `scripts/new-board.mjs`).
- `77aa8837` lab checks scoped: `scripts/lab-scope.mjs` (a board's folder, its ledger, or a production file its
  drawings import; widens to the whole lab on doubt; `--all`/`FULL=1`; `PREMISE` lines naming open asks whose `lives`
  a change touched); `lab:smoke` and `lab:demo` take the scope; `scope.sh boards`, `gate-lane.sh`, `integrate.sh`
  follow; `merge-lane.sh` lost its diff3 resolver and id-less sweep (a transitional `predates-sweep.py` instead);
  `hand-merge.sh` deleted; `cut-lane.py` writes a board lane's folder brief and refuses a shared list in owns;
  `negative.sh` refusals 9-12 hold.
- Verified so far: typecheck, lint, full `pnpm test` (570 files, 6515 tests) after `f92ff5dc`; desk order identical
  to before; scoped `lab:smoke --board locked-door` and `lab:demo --board locked-door` green; `negative.sh` all hold.

**Half-done:** nothing uncommitted. `usher/kit/README.md` still names `hand-merge.sh` and the three lists (refine in
place); `scripts/new-board.mjs` still scaffolds the retired lists; the premise-rots closure is built (the `PREMISE`
lines) but not yet written into Deferred.

**Next, in order:**
1. Authoring API trim: refuse the id collision in `defineExploration` (a config id equal to an ask id throws) with a
   registry test; `src/components/lab/index.ts` down to what boards import; delete kit modules no board uses; the kit
   page (`(shell)/lab/kit/`) and `scripts/new-board.mjs` (scaffold one folder, nothing shared) follow.
2. The words: pick, answer, verdict for ruled/ruling/ratified across the lab, the kit and `scripts/lab-*.mjs` (the
   inventory command is in the scratch notes), with a test refusing the old words; ROADMAP's two and
   `docs/reviews/README.md`'s one proposed word for word in the Handoff.
3. ROADMAP lab lines: add `src/lib/type-ladder-policy.test.ts` and `src/lib/jsx-text-space-policy.test.ts` to owns,
   drop their lab skips and fix what they find (PREDATES folders excepted); `lab:demo` compares every frame and saves
   every frame by title (a 375 width flag); `lab:demo --state <control>=<option>`.
4. Kit follow-through: `review-sheet.mjs`, `desk-check.mjs`, `scripts/lab-review.mjs` checked against the folder;
   `usher/kit/README.md` refined in place.
5. Verify: the gate whole with `FULL=1` lab steps; `negative.sh`; a scratch board added and retired in a throwaway
   branch touching no shared file; two scratch boards merged in parallel with no conflict; the desk at 1440 and 375
   for `locked-door` and `disposable-mode` as before (headless helpers `cdp-shot.mjs`, `cdp-eval.mjs` in the scratch
   dir).
6. Hand off: Questions, System-doc edits, Deferred (the ROADMAP lines closed, by their words), the Handoff with
   PROGRAM.md's authoring lines word for word and what a fresh board author finds hardest; status handed-off.
