---
track: lab-catalog
status: open
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; no preview (the round reviews on a local pnpm dev after integration)
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok with every board's reading words listed
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The grammar's new lines for `docs/reviews/README.md`, verbatim
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
