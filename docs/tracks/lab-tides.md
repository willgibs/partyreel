---
track: lab-tides
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "11f03ef9"          # the launch-prep SHA the branch was cut from
board: none             # a lab-infrastructure lane: the accrued lab-workflow notes landed, plus one new opportunity (the carried calls on the desk)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/
  - scripts/lab-demo.mjs
  - scripts/lab-smoke.mjs
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/design.css
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/PROGRAM.md
  - docs/reviews/README.md
  - scripts/lab-review.mjs
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/sandbox/site-chrome/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
---

# lp/lab-tides

**Goal.** Will's standing ask (2026-09-19, verbatim in `docs/design/rulings.md`, "the lab workflow itself rides rising
tides"): "this evolving lab system has massively increased our actual throughput of agent exploration work that actually
makes it to production... please continue to take notes and Rising Tides our lab workflow with new opportunities for
improvements you may discover as we go." This lane lands the notes that have accrued under the ROADMAP's "The lab and the
kit" since the stepped review shipped, plus one opportunity found this sitting, without changing the shape of a round
(one question per decision, every option drawn on the real surface, one paste per sitting). Sized in days; it never
delays a board. Five lanes run beside it: two are authoring round-two boards with `defineExploration` right now
(`site-chrome`, `profile-page`), so every change to the constructor, the step, the dock and the frame must be additive and
keep every standing board's behaviour (the desk is the proof: `pnpm lab:smoke` and a desk-wide `pnpm lab:demo` green).

**The items, each with its finding quoted from the ROADMAP (git holds the provenance):**

1. **`lab:demo`'s port trap and its stall.** "`lab:demo` defaults `--base` to `http://localhost:3000`, the Orchestrator's
   port, so a lane that forgets the flag silently measures the wrong tree ('found no open step to press'); default it to
   the lane's own server or refuse without `--base`." Two lanes have already misread their own desk this way. Also: "a
   desk-wide `pnpm lab:demo` can STALL in headless Chrome after walking many boards (nine boards in, it sat on the admin
   board's first step for nine minutes at zero CPU)" (`tracks/orchestrator.md`, the Orchestrator's alarm workaround): a
   per-board timeout inside the script that fails the board and walks on, printed as its own line.
2. **`defineExploration`'s constructor.** "`defineExploration` should dedupe its flattened `configs` by id (three boards
   carried the same six-line filter; `guest-shape`, `app-pricing` and `app-door` make six)" and "defaults every control to
   its decision's recommendation, which draws every other decision's 'as today' option wearing a candidate unless the
   board works around it (the board did; the constructor should not)"; "a step reached by URL while staged behind an
   unanswered `after` renders its head as a step count it is not"; `board-state.tsx` "still calls
   `history.replaceState(null, ...)` and drops the state object `step.tsx` preserves". The hand-rolled dedupe the boards carry
   (`profile-page/spec.ts`'s `PROFILE_PAGE` filter and its copies) keeps working: double dedupe is idempotent; do not edit the boards.
3. **The frame's document.** "the kit's `Frame` portals a scene into `about:blank`, which has no doctype, so the frame's
   document is quirks mode and a `<table>` inside it does not inherit `color`": give the frame's document a doctype
   (standards mode) if the portal allows it, else carry `table{color:inherit}` for every board.
4. **A responsive variant never reaches a frame.** "a responsive Tailwind variant (`sm:w-[200px]`, `hidden lg:inline`)
   never reaches a board's frame while arbitrary values do; a board needing a breakpoint writes a media query in its own
   sheet, and the root cause is worth finding before a wiring round promotes anything from one." Find it (the lab compiles
   its own utilities from `design.css`; a frame's document gets its stylesheet how?), fix it, and pin the fix with a test;
   if it cannot be fixed, write the rule where boards read it (`docs/design/README.md` is not yours: propose the line).
5. **The specimen collector's blind spot.** "`collect-specimens.mjs` cannot read a specimen hoisted into a named const (it
   ships with no code panel and `specimens.test.ts` cannot see it), so a guard that fails an entry the collector could not
   read is owed."
6. **`lab:demo`'s "same picture" settle.** "not stable on a board whose frames load photographs and a dynamically imported
   QR (three different pairs across four runs); its settle could wait on the frames' images rather than a fixed 1,600 ms."
7. **The board dock from a step.** "a step's dock is the answer's, not the board's, so the board dock's 'Reload frames' is
   still unreachable from a step (the ask's own `strip` rides the stage head, which covers the knobs)."
8. **NEW: the carried calls on the desk.** Every lane carries the calls its goal left open on its own recommendation
   (its manifest's Questions), and today those calls reach Will only through the CHANGELOG entry, a page away from the
   board he is answering. Add an optional `carried` list to `defineExploration` (each entry: an `id`, the question in
   plain words, the recommendation taken, and `overrule:` what changes if he says otherwise), render it on the board's
   page above its steps as "Calls the lane carried, yours to overrule" (each a short row, never a card), count it in the
   reading budget, and make each answerable in the same paste: propose the review-grammar clause (`call:<id>=yes|no "a
   note"`, stored on the round beside `items`) in the Handoff VERBATIM, since `docs/reviews/README.md` and
   `scripts/lab-review.mjs` are the Orchestrator's to land at the merge. The two round-two boards are other lanes' files:
   demonstrate on a fixture in the kit's own tests, not on a board.

**Binds.** The bible; the kit's discipline (`kit-discipline.test.ts`, `boundary.test.ts`, `step.test.ts`, `catalog.test.tsx`,
`lab-chrome.test.tsx`: extend, never loosen); `registry.test.ts` (read only; if a rule there must change, propose the
exact line in the Handoff); the stale-stylesheet guard: `src/components/lab/lab-css-generation.ts` bumps together with any
`design.css` shell rule change (Round 1's announce in `tracks/orchestrator.md`); the reading budget (`LIMITS`); the
review's shape (the step is the page with a dock; the stage at true size; a sticky dock); the grammar in
`docs/reviews/README.md` (a change is proposed verbatim, never landed here); no em-dashes.

**Verify on.** The gate each step on its own exit code (`pnpm design:rules`, the specimen collector, `pnpm typecheck`,
`pnpm lint` with the 8 known warnings, `pnpm test`, `pnpm build`); `pnpm lab:smoke --base http://localhost:3136` whole;
a DESK-WIDE `pnpm lab:demo --base http://localhost:3136` green (every standing board's steps pressed, no stall, no new
"same picture" report that is not a corner family), and `--board site-chrome` and `--board profile-page` on the boards as
they stand at your cut; the frame's document in standards mode checked in a browser (a table inherits colour); a
responsive variant reaching a frame checked on a fixture; the carried-calls row rendered on a fixture board at 1440 and
375 with reduced motion honoured; `DESIGN_PREVIEW_KEY` in the environment, never on a command line, and a `lab:demo` log
grepped only for its EXIT lines (pnpm prints the script line with its arguments).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (the lab's own doc is `docs/design/README.md`, not yours: propose lines in the Handoff)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; desk-wide `pnpm lab:demo` ok (N boards, M steps)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<n>: what landed; what stays and why`; the responsive-variant root cause in one sentence
- The grammar change proposed VERBATIM (the README paragraph and the `lab-review.mjs` change), and the `registry.test.ts` line if one is needed
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
