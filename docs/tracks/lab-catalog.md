---
track: lab-catalog
status: handed-off
cut: "5cdebfe0"          # Round 1 of the revamp: the foundation commit on launch-prep (2026-09-16)
preview: false          # no branch preview; the round reviews on a local pnpm dev after integration
owns:
  - src/components/lab/
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/rules/component-notes.ts
  - src/app/(dev)/design/rules/rules.generated.json
  - docs/design/library.md
  - scripts/lab-review.mjs
  - scripts/lab-smoke.mjs
  - scripts/new-board.mjs
reads:
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/glow-moments/
  - src/app/(dev)/design/touchpoints.ts
  - docs/reviews/README.md
  - docs/reviews/light.json
  - docs/design/README.md
  - docs/design/rulings.md
---

# lp/lab-catalog

**Goal.** Give the lab the catalog Will asked for: an exploration is a grid of polished ideas he rules
on one by one, not a paper he reads. Three parts, in this order, each green on the four gates before
the next: the review's ITEM SCOPE end to end (a `keep | refine | kill` verdict and a note on every
catalog card and, for the Library, `keep | redesign | retire` on an entry, reaching the desk, the
composed line, `pnpm lab:review` and the ledgers); the CATALOG KIT (`Catalog`, `ItemVerdictRow`,
`CompareTwo` and `SpotCompare`, the reading budget in `pnpm lab:smoke`, `pnpm new-board` scaffolding a
catalog by default, `/design/lab/kit` reorganised as the agent's toolbox with a live demo per tool);
and the PROOF, the palette board rebuilt on the kit as the shape every catalog takes from here. Will's
words (2026-09-16), which are the brief: tracks "should return design catalogs of ideas to ship in the
lab" that he can "kill, refine, or promote the best to the Library"; "gallery view by default, notes
per item"; the spill placements board (`sandbox/glow-moments/`, its Moment card) "is a decent
example"; "the GUI control should be fixed so that variants can be toggled on different previews
anywhere on the page". The foundation is landed at `5cdebfe0`: read `src/components/lab/board-spec.ts`
(`ITEM_VERDICTS`, `LIBRARY_VERDICTS`, `BuilderVerdict`, `Candidate.one / verdict / facts`,
`Control.clearable`, `BoardSpec.catalog`, `LIMITS.candidateOne` and `readingWords`),
`_desk/step-id.ts` (`itemsStepId`, `itemHoldId`) and `_desk/review-store.ts` (the writers every
surface picks through: `toggleAnswer`, `setAnswerNote`, `setBoardNote`, `toggleItemVerdict`,
`setItemNote`; a second click clears, a note survives a clear) before writing a line.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Rulings: 2026-09-15 "a question
carries its context; an exploration is a catalog" and 2026-09-16 (this round) in
`docs/design/rulings.md`. The kit's discipline: every new piece gets a `for` line in
`rules/component-notes.ts`, an entry in `kit/notes.ts`, a demo in `kit/kit-demos.tsx`, a
`// @contract-for` test, and `kit-discipline.test.ts`'s owned list extended; run `pnpm design:rules`
in the same commit as any contract or `for` change (the artifact and `docs/design/library.md` are
byte-pinned). Never a local copy of an owned piece in a board. No em-dashes in any copy. No mono.

**Verify on.** A local `pnpm dev` (hard-reloaded; the chrome's alert strip means a stale sheet) at
1440 and 375 with reduced motion honoured: the palette board's catalog, its compare section and its
real pages; the desk's items stat and row; the review session landing on the catalog with "k of 12
ruled" and Next reaching the summary; the composed line carrying `item:<id>=<verdict> "note"`;
`pnpm lab:review --dry '<that line>'` accepting it and refusing an unknown item with a column;
`/design/lab/kit` reading as a toolbox; `pnpm lab:smoke --base http://localhost:<port>` printing every
board's reading words and failing a board over `LIMITS.readingWords`.

## The parts

**B. The item scope.** One grammar, stated in `docs/reviews/README.md` (Orchestrator-owned: write the
new lines for it verbatim under Handoff; the grammar is the Orchestrator's to land):
`review <board> r<n>: <ask>=<option> "note"; item:<id>=keep|refine|kill "note"; note: "board note"`
and, for the Library, `review library: <entry-id>=keep|redesign|retire "note"` into
`docs/reviews/_library.json` (no rounds; one ruling per entry, overwriting). One ruling per item per
round; a ledger round gains `items: [{ item, verdict, note?, by, at }]`.
- `review/ledger.ts`: `ItemRuling` (zod), `Round.items` defaulting to `[]`, `itemsIn(round)`; the
  library ledger's own small schema and reader (`libraryRulings()`).
- `review/status.ts`: `ItemStatus` ruled | open; `BoardStatus` gains `items`, `ruled`, `openItems`,
  `orphanedItems`; the reviewable list is `spec.catalog ? spec.candidates : []` under the same round
  guard; `complete` needs every item ruled; `waitingOnWill` counts open items too.
- `_desk/queue.ts` and `_desk/session-step.ts`: `SessionStep = AskStep | ItemsStep`; ONE items step
  per board (`<board>.items`), never one per item, so the sticky card stays short and the catalog is
  the evidence; `stepDone` / `stepHeld` shared by the card, the session and the desk.
- `_desk/review-message.ts`: `composeBoardLine(board, round, answers, notes, items)` writes the asks,
  then `item:<id>=<verdict> "note"`, then the board note; `composeLibraryLine(rulings)`.
- `scripts/lab-review.mjs`: `readSpec` reads `candidates[].id` (resolving a same-file `const ITEMS`
  one hop; a `.map` reads as null and is refused with "write the items out"); `parseLine` reads
  `item:<id>=<verdict>` and the `review library:` head; `validate` refuses an item on a board with no
  catalog, an unknown id (listing the known ones), a verdict outside the vocabulary, a duplicate; the
  library form validates entry ids against `rules.generated.json`; `applyEntries` upserts by item.
- The desk (`lab/page.tsx`): an "items to rule" stat; a "redesigns you asked for" section (the library
  rulings with `redesign` or `retire`, each a link to the entry: the queue the Orchestrator cuts tracks
  from); the queue row "the N items on <board>: k of N ruled" linking to the board's items step;
  `StartReview` counting items. `[board]/page.tsx` builds the same queue. The card
  (`review-card.tsx`): the spine is shared; an items step says "Rule on the N items in <section>",
  counts "k of N ruled" live, and Next fills when every card has a verdict; the controls live on the
  cards. The session's step view and the board panel (`review.tsx`) list the items with
  `ItemVerdictRow`. `_desk/sample-spec.ts` declares a `catalog` so the dry run and the scanner test
  cover it.
- Tests: `ledger.test.ts` (every ruled item names a declared candidate; every library ruling names an
  indexed entry), `queue.test.ts`, `review-message.test.ts`, `lab-review.test.ts` (every standing
  spec's candidate ids read off disk; the item and library round trips; the refusals with columns),
  `review-card.test.tsx` (a second click clears; an items step counts and fills Next),
  `registry.test.ts` (no ask id `items`).

**C. The catalog kit and the toolbox.**
- `src/components/lab/catalog.tsx`: `Catalog({ spec, state, setState, render, minWidth })` renders one
  card per `spec.candidates` on the `.lab-catalog` grid (landed in `design.css`; set
  `--lab-catalog-min` inline for wider cards), modelled on the Moment card: the name with the
  recommended dot, the builder's `VerdictPill` (ship filled, refine outlined, kill struck through;
  lift it from `sandbox/glow-moments/`'s shared file rather than re-drawing it), the `one` line, the
  live preview from `render(candidate, { picked, state })` on a declared production ground, the `facts`
  strip, the rationale collapsed, Pick (sets `catalog.control`; toggles back to the control's default
  when it is clearable), A and B (set the two compare controls), and the reviewer's `ItemVerdictRow`.
  A kept card gains a "now in the Library" link once its entry exists (a `library?: string` on the
  candidate resolving through the rules artifact).
- `src/components/lab/item-verdict.tsx`: `ItemVerdictRow({ scope, round, id, vocabulary })`: the
  verdicts as pressed buttons through `toggleItemVerdict`, a note through `setItemNote`. One
  component, mounted on the catalog card, the board panel, the desk session and the demo (the Library
  entry block mounts it in a later round).
- `src/components/lab/compare-two.tsx`: `CompareTwo({ spec, state, render, differs?, mode })`
  resolves A and B from the two declared compare controls and wraps `Compare` with the candidates'
  names as labels and their `one` lines as the default `differs`; A equal to B renders once with
  "Press B on another card". `SpotCompare` takes a list of spots (real components or sections) and
  renders each twice under two picked candidates, for explorations shaped like brand-voice (one thing
  applied to many real places).
- `registry.test.ts` checks a catalog: the section exists, the pick control's option ids equal the
  candidate ids (plus its default when clearable), both compare controls exist with distinct
  defaults, candidate ids unique and one token, `one` within `LIMITS.candidateOne`.
- The reading budget: `scripts/lab-smoke.mjs` measures each board page's visible text outside
  collapsed disclosures (a `<details>` closed, `hidden`, `aria-hidden`) and prints the words per
  board; a board over `LIMITS.readingWords` (1,200) is a failing check ("a paper: collapse the
  argument or cut it"); a board that truly needs more says so in its spec (`reading: { words, why }`)
  and the smoke prints the reason.
- The toolbox: `/design/lab/kit` reorganised as the agent's toolbox, one row per tool with what it is
  for and a live demo (stage, frame and frame row, compare and compare-two, spot compare, catalog and
  its card, select table, loupe, knobs and toggles, the dock, walk, paste, cost meter, notes,
  callouts and folds, the review row, the item verdict row), and the rule an agent reads there: build
  the tool a board needs, in the kit, with the discipline, never a local copy.
- `scripts/new-board.mjs` scaffolds a catalog board by default (`const ITEMS`, the three controls, a
  catalog section, a compare section, a real-pages section), `--spots` scaffolds the brand-voice shape
  (a spot list with a two-way compare), `--plain` keeps today's.

**The proof: the palette.** `sandbox/palette/spec.ts` writes its twelve palettes out as `const ITEMS`
(`one` from each option's `means`, the builder's verdicts, `facts` from the swatch values,
`candidates: ITEMS`, `catalog: { section: "catalog", control: "palette", compare: ["compareA",
"compareB"] }`); `catalog.tsx` keeps `ScopedTokens`, `SwatchStrip`, `DemoPanel` and exports
`PalettePreview`, and loses its local grid and card; `board.tsx` renders the kit's `Catalog` and
`CompareTwo` in wipe mode over the real pages; `registers.test.ts` pins the candidates to `PALETTES`.
The shape every catalog takes from here: `spec.ts` with `const ITEMS` (id, name, `one`, `verdict`,
`facts`, rationale), `candidates: ITEMS`, `catalog: { section, control, compare }`, a clearable pick
control with a `none` default and two compare controls mapped over the items, three sections (the
catalog, any two side by side, the real pages wearing the pick); asks only for what is not one item.

**Discipline on this machine.** Four agents at once is the ceiling (36 GB; eleven crashed it): run one
process at a time, stop your dev server before `pnpm build` or `pnpm test`, kill it by PORT
(`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`), never an unscoped `pkill`; close browser tabs you
are not using; never `[preview]` or `[ci]` in a commit message. Stage files explicitly; the
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit.

**Questions.** Anything the goal leaves open that would branch the work goes here as a numbered
question with your recommended answer; the Orchestrator relays it to Will and quotes the answer back.
Do not guess at a product decision.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Questions (answered with the recommendation and carried on)

1. **Does the `palette` ask survive its own catalog?** The shape note says "asks
   only for what is not one item", and "Which palette should the site wear?" is
   the catalog. RECOMMENDATION, taken: keep it. Ruling twelve cards (which of
   these survive) and naming the ONE the site wears are two different answers,
   and only the second lands the paste. Every other catalog board should still
   ask nothing that is one card.
2. **`compareA` / `compareB` are camelCase and cannot be.** `BoardPage` writes
   `data-<controlId>` on the board root and React refuses a camelCase custom
   attribute with a console error on every render, which shipped and was caught
   live. RECOMMENDATION, taken: the controls are `compare-a` / `compare-b`, and
   `registry.test.ts` now refuses any control id that is not a lower-case data
   attribute name.
3. **Every standing board is over the reading budget.** All twelve, from 2,465
   words (the album hero) to 15,004 (the media kit), against 1,200. The measure
   excludes specimens and closed folds, so these are the board's OWN words: the
   answer block, the ledes, the labels and the asks' context, look, because and
   overrule. RECOMMENDATION: keep the budget failing rather than raising it, and
   let the rounds that touch each board trim it. `pnpm lab:smoke` says the two
   halves apart ("0 routes, 12 over the reading budget") so a route failure is
   never hidden behind it.

## Deferred (ROADMAP one-liners, bucket named)

- **R6 (app polish + the deferred ledger):** trim every standing board to
  `LIMITS.readingWords`; `pnpm lab:smoke` names the twelve and what each one
  weighs today.
- **R6:** rename the lab's nav entry for `/design/lab/kit` from "The lab kit" to
  "The toolbox" in `src/app/(dev)/design/_data/nav.ts:298` (the page is retitled;
  the nav is not this track's file).
- **R7 / the Library round:** mount `ItemVerdictRow` on a Library entry's page
  (`library/[id]/page.tsx`) with `LIBRARY_VERDICTS`, so a scroll through the
  components fills `docs/reviews/_library.json` the way a board fills its own.
  Everything under it is landed: the ledger, the reader, the desk's "Redesigns
  you asked for" and `review library:` in `pnpm lab:review`.

## Handoff (replaces the chat report)

- The work ends at `b0950f6c`; the branch tip is this manifest's own commit.
  Pushed; no preview (the round reviews on a local `pnpm dev` after integration).
- Synced with `launch-prep` at `81d55e87` (merged twice: `88dafe50` mid-round,
  because `design.css` is in this track's `reads`, then the ADR fold's tip).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing
  warnings), test ok (2,213 in 226 files), build ok (257 pages),
  `pnpm design:rules` clean. `pnpm lab:smoke --base http://localhost:3101`: 313
  checks, every route and every redirect green, and the reading table printed
  for all twelve boards. It EXITS 1, and only on the budget: see Question 3.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is inside the
  owned prefixes with no exception (`src/components/lab/`, `(shell)/lab/_desk/`,
  `(shell)/lab/page.tsx`, `(shell)/lab/[board]/`, `(shell)/lab/kit/`,
  `design/review/`, `sandbox/palette/`, `sandbox/registry.test.ts`,
  `rules/component-notes.ts`, `rules/rules.generated.json`, `docs/design/library.md`,
  `scripts/lab-review.mjs`, `scripts/lab-smoke.mjs`, `scripts/new-board.mjs`)
  plus this file.
- **The grammar's new lines for `docs/reviews/README.md`, verbatim.** Replace the
  "The message grammar" section's body with:

  ```
  `review <board> r<n>: <ask>=<option> "an optional note"; item:<id>=<verdict> "an optional note"; note: "a board-wide note"`

  `review <board> r<n>: <ask>=? "what was unclear"` records "not clear to me" (the note is required).
  An option is its id (one token); the board's spec carries the label and the meaning a reviewer reads.

  `item:<id>=keep|refine|kill` rules on ONE card of a board's catalog (the revamp, 2026-09-16), where
  `<id>` is a candidate id from the board's spec. The `item:` prefix keeps the two namespaces apart: an
  ask id and a candidate id are both one token and a board may use the same word for both. A board that
  declares no `catalog` has no items, and a ruling on one is refused. One verdict per item per round;
  ruling again in the same round overwrites, exactly as answering an ask again does, and a round gains
  `items: [{ item, verdict, note?, by, at }]` beside its `answers`.

  `review library: <entry-id>=keep|redesign|retire "an optional note"` rules on a LIBRARY entry and
  lands in `_library.json`, whose shape is `{ "entries": [{ entry, verdict, note?, by, at }] }` with no
  rounds: the Library is not explored in rounds, so there is one ruling per entry and the newest
  overwrites. An `<entry-id>` is a component id from `rules.generated.json`, which is the last segment
  of its `/design/library` URL. The desk reads the `redesign` and `retire` ones as "Redesigns you asked
  for", which is the queue the Orchestrator cuts tracks from.
  ```

  And in the ROLE block, `BELONGS HERE` gains "catalog item verdicts" and the
  `_library.json` file is named beside `_window.json`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none.
- **Look at first:** `/design/lab/palette` on a local `pnpm dev`. The catalog is
  the kit's now: press Pick on a card and the whole page wears it, press A on one
  and B on another and the two wipes below join those two, and rule each card
  keep / refine / kill with a note in its own row. The line it composes at the
  foot of the board is `review palette r6: item:today=keep; item:ladder=kill "…"`,
  and `pnpm lab:review --dry` takes it. Then `/design/lab/kit`, which is the
  toolbox an agent reads before building a board, and `/design/lab` at 375, where
  the queue rows stack and the board's dock opens collapsed.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). **`lab-catalog`** turned Will's
directive ("catalogs of ideas to ship... kill, refine, or promote the best to the
Library", 2026-09-16) into the review's third scope. A round's ledger gained
`items` beside its answers and the Library gained `_library.json`; a board that
declares `catalog` puts its cards on the desk as one items step per board, walked
before that board's questions, with `stepDone` shared by the card, the session and
"carry on". The grammar grew `item:<id>=keep|refine|kill "note"` and
`review library: <entry>=keep|redesign|retire`, and `pnpm lab:review` reads a
spec's `candidates` off the page, resolving `candidates: ITEMS` one hop and
refusing a `.map`. The kit gained `Catalog`, `VerdictPill`, `ItemVerdictRow`,
`CompareTwo`, `SpotCompare` and `GroundBox`; `pnpm new-board` scaffolds a catalog
by default; `/design/lab/kit` became a toolbox with a live demo per tool; and
`pnpm lab:smoke` now weighs each board's words outside every closed fold and
every specimen against `LIMITS.readingWords`, which all twelve standing boards
exceed. The palette board was rebuilt on the kit as the proof. The round also
took the sweep's findings in this lane: the kit's visible words are a stranger's,
a board's dock opens collapsed at 375, and the desk's queue rows stack there.
