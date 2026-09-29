---
track: lab-revamp
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The words' one set?** Built: a decision is answered with a **pick** (the option chosen), a catalog card or a Library
  entry gets a **verdict** (keep, refine, kill; keep, redesign, retire), and an **answer** is either (the ledger records
  answers). The glossary (`_data/glossary.ts`) defines them and retires "ruling, ruled, ratified"; `words.test.ts`
  refuses the old words across the lab, the kit, `scripts/lab-*.mjs` and `docs/`. His to overrule: a different word is
  one glossary entry and one test regex.
- **The kit tools no board imported?** Built: deleted, eleven modules (`apply`, `compare`, `compare-two`,
  `concept-card`, `cost-meter`, `loupe`, `measure`, `motion`, `select-table`, `specimen`, `true-fit`) and the seven traps
  only they answered; the front door (`src/components/lab/index.ts`) exports only what a board imports, and a piece
  returns in the change whose board first needs it (`git show 77aa8837:src/components/lab/<file>`).
- **The catalog path (cards, item verdicts, the walk, `defineBoard`'s page shape, the grammar's `item:`)?** Left
  standing: only the dry-run fixture walks it, and retiring it rewrites the review grammar in `docs/reviews/README.md`,
  which is yours. A ROADMAP line (Deferred) names it with the fixture it goes with.
- **A board page's header "Asks" line?** Built: the decisions' own names ("The door's direction · One design or four ·
  The wait · The 404"), where `touchpoints.ts` carried a hand-written sentence; the desk reads as before. His to
  overrule: a spec field for the sentence, one more authoring line.
- **`lab:smoke` with no flags?** Built: it runs what the change reaches (against its merge-base with
  `origin/launch-prep`), the whole lab on `--all` or `FULL=1`; `cut-lane.py`'s new manifests say so, and an older
  manifest's "`lab:smoke` whole" now means `--all`.
- **`Several`, `ScrollHere` and `Pair` for the front door?** Not added: no standing board draws several screens per
  option or scrolls a frame to its card, and the front door takes a piece in with its first board (ROADMAP line
  refined, Deferred).

## System-doc edits (in place, owned facts only)

- none: the lane owns no system doc; the doc lines outside it are in the Handoff, word for word.

## Deferred (ROADMAP one-liners, bucket named)

Retired, each closed by this lane (by its words):
- Now: "The lab and the kit: `defineExploration` keeps the first control of an id" (`defineExploration` refuses the
  collision, `exploration.test.tsx`).
- Now: "The lab and the kit: `type-ladder-policy`'s weight rule and `jsx-text-space-policy`'s scan both skip the lab"
  (both scan the lab and the Library; `aa4bd144`).
- Now: "The lab: `lab:demo`'s same-picture check compares an option's first frame only" (every frame compared).
- Now: "The lab and the kit: `lab:demo --save-shots` keeps only a stage's largest frame" (every frame saved by title;
  `--width 375`).
- Now: "The lab and the kit: an open ask whose premise rots with no new verdict is never retired" (`PREMISE` lines from
  `scripts/lab-scope.mjs` in `gate-lane.sh` and `integrate.sh`).
- Now: "The lab and the kit: `lab:demo` presses a step only in its default knobs" (`--state <control>=<option>`).
- The lab and the kit: "`lab:demo` compares only an option's FIRST frame, so a composite option" (every frame, each
  scrolled into view before its clip).
- The lab and the kit: "`lab:demo` reads a step FROZEN when its options differ only inside grid-stacked,
  visibility-toggled `srcdoc` iframes" (each shown frame captured on its own).
- The lab and the kit: "No standing board draws `SpotCompare`, `CompareTwo`, `FrameRow`, `Loupe` or `TrueFit`" (the
  unused tools retired; `FrameRow` stays in `frame.tsx` for the dry run; `new-board.mjs` scaffolds one exploration).

Refined in place (retire the first words, add the line):
- Now, "The lab and the kit: on a phone the step a sitting enters a board on reads its opening" becomes: "The lab and
  the kit: on a phone the step a sitting enters a board on reads its opening for about two screens before the question
  (disposable-mode's five settled and four earlier lines at 375), and every locked-door step's stage starts 1.0 to 1.3
  screens under its question (`lab:demo --width 375`: the context lines stacked above the tiles); fold the opening's
  two lists and the context lines below `sm` (from `lab-revamp`)."
- The lab and the kit, "`Several` (an option drawn as several screens" keeps its words to "is the same idea as
  `Several`" and ends: "front-door candidates, taken in by the first board that draws several screens per option or
  scrolls a frame to its card (`src/components/lab/index.ts`)."
- The lab and the kit, "Every standing board carries a spec, so `_desk/sample-spec.ts`" becomes: "Every standing board
  is an exploration, so `_desk/sample-spec.ts`, the desk's dry run and the catalog path only the fixture walks
  (`Catalog`, `Walk`, `defineBoard`'s page shape, the review grammar's `item:` clause) can go together (keep
  `/design/lab/sample`'s responsive-variant proof, or move it; `ItemVerdictRow` stays for the Library review below)."

Added:
- The lab and the kit: once no lane cut before the lab revamp's merge is open, `merge-lane.sh`'s transitional block
  (the retired `touchpoints.ts` and `(shell)/lab/boards.ts` kept deleted, `registry.ts` kept ours) goes (from
  `lab-revamp`).

## Handoff (replaces the chat report)

- **Commits.** The work: `f92ff5dc` (a board is one folder), `77aa8837` (the scoped lab checks and the kit), `345ba925`
  (the authoring API), `7a6438d9` and `b63ba3ef` (the words), `aa4bd144` and `3ea3a9ec` (the policies, `lab:demo`),
  `50a50851` (the runbook, `negative.sh`), `882064e0` (`cut-lane.py`'s verify lines), `bd559e0e` (the registry's types
  after the PREDATES retirement), `4c8c919b` (the desk's stat, the toolbox's face). The syncs: `5c08a922`
  (settings-wiring and triage-r2-wiring retired their boards, so `PREDATES` went with them) and `509f27b6` (crumbs-14).
  All pushed; the head is in the chat line. ★ `5c08a922` was committed on a typecheck that failed behind a pipe;
  `bd559e0e` is its fix, and every gate below ran on its own exit code.
- **Gates on `509f27b6`** (the synced tree), logs in `../partyreel-wt/_scratch/lab-revamp/g3-*.log`: `pnpm typecheck`
  0; `pnpm lint` 0; `pnpm test` 0, 600 files, 6951 tests; `build-lock.sh pnpm build` 0; `FULL=1 pnpm lab:smoke --base
  http://localhost:3133` 0, 171 checks, 0 failing; `FULL=1 pnpm lab:demo --base http://localhost:3133` 0, 14 steps, 0
  failing; `negative.sh` all refusals hold (`g2-negative.log`, the kit unchanged since).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 115 paths, every one inside `owns` or this file.
- **Verified:** two scratch boards scaffolded by `pnpm new-board` on throwaway branches (each commit its two folder files
  only), merged `--no-ff` in parallel with no conflict, both on the desk in place (`... demo-framing.names >
  zz-alpha.first > zz-beta.first > press-page.the-close`), one retired by `git rm -r` of its folder (then 404, gone
  from the desk, tests green); the branches deleted, never pushed. The desk's text at 1440 and 375 against build 22 on
  the alias: the same for locked-door and disposable-mode (their rows, and their entry steps word for word but the
  build stamp); the desk-wide changes are "In registry order" to "In desk order", the waiting blurb's "unruled" to
  "waiting on a verdict", and the stat "items to rule" to "cards awaiting a verdict". Captures:
  `../partyreel-wt/_scratch/lab-revamp/desk-after-{1440,375}.png`, `kit-after-1440-b.png`, `read/*.txt`.
- **The items:**
  - A board is one folder, `sandbox/<id>/`: its spec carries its `surface`, `desk` (by leverage) and `lives`
    (required by `defineExploration`), `registry.ts` finds every spec by `require.context` (Vitest by
    `import.meta.glob`), `(shell)/lab/[board]/board-components.ts` finds every board; `touchpoints.ts`, its test and
    `(shell)/lab/boards.ts` are gone, and retiring a board is deleting its folder.
  - `scripts/lab-scope.mjs` scopes `lab:smoke`, `lab:demo` and the gate's lab step to what a change reached (a board's
    folder, its ledger, or a production file its drawings import; widened on doubt), prints a `PREMISE` line for each
    board whose open asks describe a path the change touched, and `--all`/`FULL=1` takes the whole lab.
  - The authoring API is two doors, `@/components/lab/exploration` for a spec and `@/components/lab` for its drawings,
    held by `kit-discipline.test.ts`; `defineExploration` refuses an id collision; `pnpm new-board` scaffolds one folder
    with every owed line a `TODO` that `registry.test.ts` refuses; `/design/lab/kit` teaches the folder, the front door,
    what the spec becomes and the traps.
  - The words: pick, verdict, answer, through the lab, the kit, the scripts and the glossary, with `words.test.ts`.
  - `type-ladder-policy` and `jsx-text-space-policy` scan the lab (three headings lost a weight that beat the face's
    700, the toolbox its entities).
  - `lab:demo` compares every shown frame of every option, saves each by title, and takes `--state` and `--width`.
  - The kit follows: `merge-lane.sh` (no resolver, no sweep; a transitional block for lanes cut before this merge),
    `integrate.sh`, `gate-lane.sh`, `scope.sh boards`, `cut-lane.py` (a board lane's folder and brief, a shared list
    refused), `board-card.mjs` (the round, the desk order, the context), `batch-reader.mjs`, `capture*.sh`,
    `review-sheet.mjs` (reads the new shot names), `negative.sh` (refusals for the scope, the servers, `cut-lane.py`
    and `new-board.mjs`), `usher/kit/README.md` refined in place.
- **Doc lines outside the lane, word for word** (the Orchestrator's; `words.test.ts`'s `NOT_YET` loses an entry as each
  lands, in the same commit):
  - `docs/PROGRAM.md`, replace "- A new board registers its own lines in `registry.ts`, `boards.ts` and
    `touchpoints.ts` directly after the neighbour its brief names, never at the head of a list (two boards on one spot
    mangle the merge)." with "- A board is one folder, `sandbox/<id>/`, and nothing else names it: `pnpm new-board
    <id> "<title>" --surface <s> --desk <n>` writes it (every owed line a `TODO` that `registry.test.ts` refuses), the
    toolbox page (`/design/lab/kit`) teaches the rest, and retiring a board is deleting its folder."
  - `docs/PROGRAM.md`, replace "- Author with `defineExploration` (`src/components/lab/exploration.ts`) and nothing
    else; the newest board built on it is the worked example." with "- Author with `defineExploration`
    (`@/components/lab/exploration`, a spec's one import) and draw with the kit's front door (`@/components/lab`); the
    newest board built on it is the worked example." (the bullet's context-layer sentence stays).
  - `docs/reviews/README.md`, "a board whose asks are all answered shows its ruling draft." becomes "a board whose asks
    are all answered shows what its answers decide." (delete `NOT_YET`'s "ruling draft"); "`item:<id>=keep|refine|kill`
    rules on ONE card of a board's catalog" becomes "`item:<id>=keep|refine|kill` gives ONE card of a board's catalog
    its verdict".
  - `docs/ROADMAP.md`, "a founder-voice post (Will's ruling first)" becomes "a founder-voice post (Will's pick first)"
    (delete `NOT_YET`'s "Will's ruling first"; "numbered rulings" retires with the housekeeping line it quotes).
  - `docs/systems/design-system.md`, "a board lives in `sandbox/` with its own sheet and scenes, which leave with it."
    becomes "a board is one folder in `sandbox/` (its spec, its board, its own sheet and scenes), found by the registry
    and the board route and retired by deleting it."
  - `docs/systems/testing-verification.md`, "measuring the frame rather than its label." becomes "measuring every frame
    of an option rather than its label (`--state <control>=<option>` presses it wearing a knob, `--width 375` at a
    phone's width)."
- **Assets requested from Will:** none.
- **Board ideas:** a `lab:demo --every-state` pass that walks each step's `configs` through every option, now that
  `--state` exists; `lab:demo --width 375` as a gate step for a board whose decisions are about a phone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the words' set; the eleven unused kit tools deleted; the catalog path left for its own
  round; the board header's "Asks" line derived; `lab:smoke` scoped by default; `Several`, `ScrollHere` and `Pair` not
  added (each argued under Questions).
- **Look at first:** the sync's `PREMISE` lines (`node scripts/lab-scope.mjs --since 882064e0`): settings-wiring changed
  `src/app/(guest)/e/[token]/page.tsx`, `entry-modal.tsx` and `guest-flow.md`, which locked-door r2's four open asks
  describe, and disposable-mode r2's eight describe `guest-flow.md`, `billing-caps.md`, `event-experience.tsx`,
  `intent-sheet.tsx` and the lightbox actions: re-read both boards against build 23 before his sitting. At 375
  (`lab:demo --width 375`) locked-door's `shape` draws "Two, as today" and "Each state its own" as the same picture,
  and every locked-door stage starts a screen or more under its question.
- **What a fresh board author will find hardest:** drawing every option truthfully in a `Frame` so `lab:demo` sees the
  options differ and the stage starts within 0.6 of a screen under the question, while the context layer's lines stay
  inside their caps (a crumb 32 characters, a gain or cost 100, the reason 160); and choosing the `desk` number and
  `lives` from the desk and production, which nothing scaffolds. The toolbox page's front door and traps are written for
  exactly that.
- **The loose-ends and contact-page folders** are this lane's (desk facts and imports added); loose-ends-wiring and
  contact-wiring leave them to you, and retiring each at their merge is `git rm -r` of its folder, nothing else.
