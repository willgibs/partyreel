---
track: lab-tides
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - scripts/lab-review.mjs   # moved from `reads` by the Orchestrator's note (item 10)
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/PROGRAM.md
  - docs/reviews/README.md
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
9. **NEW (the Orchestrator, this evening, on Will's question): the sent marker.** His answers stay in the review
   store after he pastes a batch, so the next paste carries them again until the alias rebuilds, and he asked how to
   keep stacking pastes harmless. When "Copy so far" composes a message, every answer, item verdict and board note it
   included is marked `sent` in the store with the `# build` sha and the time. A sent entry stays VISIBLE in its dock
   and on the desk, greyed with "sent on <build>", so he keeps his context on a stale alias; it is EXCLUDED from the
   next "Copy so far" unless he changes it afterwards, and a change clears the mark for that one ask so it rides again
   as a replacement. One quiet fallback, "Copy everything", for the rare case. The storage key bumps
   (`partyreel.lab.review.v1` to v2) with a migration that treats every existing entry as unsent. Never a "Clear" that
   deletes his picks: keeping them visible is the better answer and a wrong click would cost him a sitting.
10. **NEW (the same note): the idempotent re-send.** Today a whole paste is refused when one line names a round the
   board has left ("site-chrome is in round 2, not r1"), which is exactly what a stale re-send does once a round-two
   lane lands. Keeping all-or-nothing for real conflicts: an answer IDENTICAL to what the ledger already holds for that
   board and round (same ask, same choice, same note) is a no-op, printed as `unchanged` rather than `replaced`, and it
   is accepted even when the board has moved to a later round or retired (the ledger file outlives the board); a line
   for an earlier round is refused only when it carries an answer the ledger does NOT hold, named in the refusal; an
   ask id that no longer exists on the spec is judged the same way. `scripts/lab-review.mjs` moves into `owns` for
   this; `docs/reviews/README.md` stays a verbatim proposal in the Handoff, because `docs/reviews/` is never owned.

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

All four were carried on their recommendation and built on, per the lane's rules; two of them are drawn on
`/design/lab/sample` as the fixture's own carried calls, which is the feature demonstrating itself.

- **`--base` is now REQUIRED by `lab:demo` AND `lab:smoke`, with no default at all.** The finding offered "default it
  to the lane's own server or refuse"; a lane's port cannot be known from inside the script (a worktree's `.git` is a
  file, `buildStamp()` returns null there, and nothing else on a served page names the tree), so guessing would trade a
  silent wrong answer for a different silent wrong answer. **Recommended and taken: refuse, print why, accept `LAB_BASE`
  from the environment for a lane that would rather set it once.** The cost is one flag on the Orchestrator's own runs,
  which every lane manifest already writes. Overrule: if the flag is the wrong trade, `LAB_BASE` in the Orchestrator's
  shell is the same fix with nothing on the line.
- **The constructor's "start at today" is OPT-IN (`Decision.today`), not inferred.** Every board that needed it so far
  put the "as today" option FIRST, so the constructor could have taken `options[0]`; that would have changed the default
  state of every standing board on the desk mid-sitting, which is the one thing this lane may not do. **Recommended and
  taken: a decision names its own `today`, and a decision that names none keeps the old behaviour.** The four boards
  carrying a hand-rolled `TODAY` map keep working untouched (their map runs after the constructor, and both are
  idempotent). Overrule: if a rule is wanted rather than a field, "option one is today" belongs in `docs/design/README.md`
  and `registry.test.ts`, and the whole desk is re-read once after it.
- **The responsive-variant settlement stays as it is.** The root cause is measured and written down (below); the fix
  that would end it is the lab compiling a SUPERSET of production's utilities and winning wholesale, which changes how
  every standing board draws and needs its own round with the desk re-read after it. **Recommended and taken: keep the
  sub-layer, write the rule where boards read it, draw it on the fixture.** Overrule: if a wiring round is ever blocked
  on a board that needed a breakpoint, the superset is the fix and it is a round, not a line.
- **No static guard for a lab-only breakpoint utility.** A scanner over `className` strings could list them, but it
  would fire on the many that are harmless (a variant production also uses lands in `utilities` and works) and would
  fail the gate of whichever lane wrote one next, mid-flight. **Recommended and taken: the fixture draws the failure and
  the fix side by side, `design.css` states the rule, and `lab-css-generation.test.ts` pins the settlement so changing
  it is deliberate.** Overrule: if a board ships a dead breakpoint anyway, the guard is cheap to add with an allow-list
  that only shrinks.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `src/app/(dev)/design/design.css`, the landmine at the head of the file: the measured root cause of "a responsive
  variant never reaches a frame" and the rule a board follows instead. It is a COMMENT change, so `--lab-css-generation`
  is deliberately NOT bumped (no shell rule changed; the guard is about a browser holding a stale sheet).
- The lab's own doc is `docs/design/README.md`, which is not mine: the two lines it owes are proposed in the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `buildStamp()` never resolves in a lane's WORKTREE, so no lane's own pages carry the `build`
  line the desk and `lab:review` compare against (`_data/build-stamp.ts` reads `.git/HEAD`, and in a worktree `.git` is a
  FILE holding `gitdir:`). One hop through that file fixes it; the file is not this lane's.
- The lab and the kit: `lab:demo` cannot picture a stage built out of `backdrop-filter` over photographs, because
  headless Chrome does not always rasterise a composited layer: four `glass` steps captured as one flat colour with
  their frames' DOM plainly different (blur 4, 8, 13 and 21 px, read through the frame's own `getComputedStyle`). The
  script now says UNPAINTED rather than FROZEN and passes them; judging those four still needs an eye, or a headed
  Chrome. **The capture half of the old line is DONE**: the run no longer sets `captureBeyondViewport` for a stage
  that fits the window, which is what remounted a step's frames and inflated every reading (`glass.tiles` read 83.84
  percent where the honest number is 2.10).
- The lab and the kit: the settlement that would let a lab-only `<breakpoint>:` utility work in a board (the lab
  compiling a superset of production's utilities and emitting into `utilities` rather than `utilities.lab`). A round of
  its own: it changes which sheet wins on every shared element, so the whole desk is re-read after it.

## Handoff (replaces the chat report)

- Head `556afdad` (the last code commit, the one every gate below ran on; this manifest rides on top), pushed; **synced**: `origin/launch-prep` had moved from the cut `304a813b` to `69a9a177` (the
  evening's five lanes landed), merged never rebased at `9de1f8a8`, one conflict and it was the generated
  `docs/design/library.md`, resolved by regenerating with `pnpm design:rules` on the merged tree. The whole gate below
  was then re-run on that tree.
- Gates on the synced tree, each on its own exit code: design:rules ok (137 components, 910 contracts), specimens ok
  (131 specimens on 94 entries, nothing unread), typecheck ok, lint ok (0 errors, the 8 known warnings), test ok
  (2,699 in 255 files), build ok (255 pages); `pnpm lab:smoke --base http://localhost:3136` ok (460 checks, 0
  failing, every board under its reading budget); desk-wide `pnpm lab:demo --base http://localhost:3136` ok (187 steps, 0 failing, no stall
  and no timeout; 4 "this browser could not paint": `glass.recipe`, `glass.grades`, `glass.behind` and `glass.reel`,
  whose options differ only in the backdrop blur behind them).
  `--board site-chrome` and `--board profile-page` at my CUT had nothing to press (both were answered whole, so the
  desk listed no open step for either); on the merged tree both are round two and their lines are in the desk-wide run
  above: `site-chrome`'s three new footer steps (`foot-after` 100.00%, `foot-alone` 3.41%, `foot-phone` 21.68%) and
  `profile-page`'s three (`view-all` 37.58%, `quick-look` 73.25%, `way-back` 70.81%), all ok.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this manifest, plus two generated
  artifacts my own gate rewrites: `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md`
  (`pnpm design:rules`, which the kit's new exports and contracts change; neither is hand-edited).
- The eight items, plus the two the evening added:
  1. `lab:demo`'s port trap and its stall: `--base` is now REQUIRED (or `LAB_BASE`), with no default at all, and the
     refusal says why :3000 is the wrong tree; every DevTools call has a ceiling (`--call-timeout`, 60s) and every
     board a budget (`--board-timeout`, 300s), so a stall is a `TIMED OUT` row and the walk goes on. `lab:smoke` had
     the identical default and took the identical fix: **both scripts now need `--base` on every run.**
  2. `defineExploration`: the flattened `configs` are deduped by id (first declaration wins, so a derived control is
     never displaced, and the hand-rolled filter seven boards carry stays correct); a decision may name its `today`
     and the derived control starts there instead of at the recommendation (opt-in, so no standing board moves; the
     step still opens on the recommendation for its own question); a step reached by URL while staged now says "not in
     the walk yet: it waits on an earlier answer" (or "moot this round") and draws no progress, where it used to read
     "step 8 of 7"; `board-state.tsx` passes `window.history.state` through its `replaceState` as `step.tsx` does.
  3. The frame's document: a portalled frame is handed `srcdoc` with a doctype, so it parses in standards mode
     (`compatMode: CSS1Compat`, measured) and a `<table>` inherits the room's colour. The two boards carrying
     `table{color:inherit}` are untouched and their line is now a no-op; the frame also carries a zero-specificity
     `:where(table){color:inherit}` as belt and braces.
  4. The responsive variant, root cause in one sentence: **the lab's utilities compile into the `utilities.lab`
     SUB-layer, production's into `utilities`, and layer order is decided before specificity and before source order,
     so production's unprefixed half of a pair (`w-full`) beats the lab-only variant (`sm:w-[200px]`, generated, inside
     a matching `@media`) at every width** -- read off a real frame: `.sm\:w-[200px]` is in `utilities.lab`, `.w-full`
     is in BOTH sheets. It is not the frame, not generation and not the media query. An arbitrary value reaches a frame
     because nothing in production competes for that property on that element. Not fixed by design: the settlement that
     would end it changes how every standing board draws (Questions). The rule is in `design.css` where a board author
     is already reading, drawn on `/design/lab/sample`, and the sub-layer line is pinned by a test.
  5. The specimen collector records what it could not read (`unread`, artifact version 2) and `specimens.test.ts`
     fails on a non-empty list, so an entry whose specimens are hoisted into a const can no longer ship with no code
     panel and nothing red. Today's tree: nothing unread.
  6. `lab:demo`'s settle is a CEILING now, not a sleep: it waits for the frames' documents, then every `<img>` in the
     view and in each frame, then the fonts, then for the view to stop mutating for `--quiet` (250ms), capped by
     `--settle` (1,600ms, unchanged). A stage that is already drawn is captured sooner; one still fetching photographs
     or mounting a dynamically imported QR is not captured early.
  7. The board's own dock cluster reaches a step: `StepBoard.tools` rides the sticky stage head (and the strip row on a
     words-only step), fed by `BoardPage` from the same `dock` render prop, and `ExplorationBoard` can pass one. No
     standing board declares a dock cluster today, so nothing on the desk moves; `/design/lab/sample` declares a
     "Reload frames" so the affordance is real.
  8. The carried calls: `BoardSpec.carried` (id, question, taken, overrule), rendered by the template between the
     Answer and the sections as "Calls the lane carried, yours to overrule", one short hairline-separated row each,
     nothing folded, so `lab:smoke` counts every word against the reading budget. `defineExploration` passes a
     `carried` list straight through. Demonstrated on the fixture board, which carries this lane's own two calls.
  9. The sent marker: "Copy so far" marks exactly the hold ids its message carried (`markSent`, the build sha and the
     time), the next paste leaves them out, and a write to an entry clears its own mark so a change rides again as a
     replacement. A sent answer stays VISIBLE: "sent on <build>" in the step's dock and on the desk row, greyed, never
     cleared. One quiet "Copy everything" appears only when something is marked. **Storage key: `partyreel.lab.review.v1`
     to `.v2`, and the migration reads v1 when no v2 exists and loads every entry UNSENT** -- a browser mid-sitting
     cannot prove what was pasted, and guessing "sent" would silently drop real answers, where guessing "unsent" costs
     one harmless re-send (which item 10 now makes a no-op). v1 is left on disk rather than deleted.
 10. The idempotent re-send: a clause that repeats what the ledger already holds (same ask, same choice, same note) is
     a no-op printed as `unchanged`, accepted whatever round the board has moved to and even when the board has left
     the lab (the ledger file outlives the board); an ask the spec no longer declares is judged the same way; anything
     the ledger does NOT hold is refused exactly as before, and the refusal now names the clause
     ("`site-chrome` is in round 2, not r1, and "hero=lit" is not what r1 holds"). A no-op writes no file and does not
     re-stamp `by`/`at`, so a stale re-send leaves the tree untouched. A name that was never a board is still refused
     at the name. The closing line reads `3 recorded in docs/reviews/x.json, 5 already recorded (unchanged)`.
- **Three more `lab:demo` findings the desk-wide runs turned up, all landed** (the ROADMAP's own "it inflates every
  reading" line, closed, plus what closing it exposed). (a) The capture no longer sets `captureBeyondViewport` for a
  stage that fits the window; it scrolls the box in and clips in viewport coordinates. That flag made Chrome resize
  its render surface and remount a step's frames: `glass.tiles` read 83.84 percent before and reads an honest 2.10
  now, verdict unchanged, and `host-curation`'s eight steps match the pre-change script to two decimal places.
  (b) The pictures are taken in a 3,000px window rather than 2,400, because the first version of (a) clipped
  `loose-ends.phone-cycle` to the 620px of a 2,000px option that its short document could scroll into view, and three
  options that share a header read 0.00 percent. A stage still taller than the window keeps the old path, now with the
  page coordinates that path needs. (c) A step whose every capture is ONE FLAT COLOUR is UNPAINTED, not FROZEN: four
  `glass` steps were being called frozen while their frames' DOM differed plainly (blur 4, 8, 13 and 21 px, read
  through the frame's own `getComputedStyle`), because headless Chrome does not always rasterise a composited layer.
  They are printed loudly, counted in the summary and not failed, because a tool that drew nothing may not accuse a
  board of drawing the same thing four times. **Those four glass steps still need an eye, or a headed Chrome.**
- **The review-grammar clause, PROPOSED VERBATIM (item 8; `docs/reviews/README.md` and the `call:` half of
  `scripts/lab-review.mjs` are the Orchestrator's to land at the merge).** The composed message does NOT carry it yet,
  so nothing Will pastes today can be refused by it.

  The README paragraph, to sit under the `item:` one:

  > `call:<id>=yes|no "a note"` -- a call the lane CARRIED, answered. A lane that meets a question its goal left open
  > takes its own recommendation and builds on it rather than stopping; the board then draws those calls above its
  > sections ("Calls the lane carried, yours to overrule"), each with an id. `yes` keeps what the lane took, `no`
  > overrules it and the note says what to do instead; a call nobody answers stays taken. It rides an ordinary board
  > line beside the answers, in any order:
  >
  >     review site-chrome r2: hero=lit; call:footer-close=no "keep the CTA above the footer"
  >
  > In the ledger the round grows a `calls` array beside `answers`, `items` and `notes`: one entry per call per round,
  > `{ call, answer, note?, by, at }`, replaced when the same call is answered again, exactly as an ask is.

  The `lab-review.mjs` change, in four places (the `item:` clause is the model for every one of them):
  1. the spec scanner (`readSpec`) reads the `carried` ids the way it reads `asks[].id`, and a spec with no `carried`
     list reports `calls: []`;
  2. the line parser accepts `call:<id>=yes|no` beside `item:<id>=<verdict>`, refusing any other word with
     `"<word>" is not an answer to a carried call (yes, no)`;
  3. `validate` checks each `call:` id against `spec.calls` (`"<id>" is not a call <board> carried (<list>)`) and
     refuses a repeated id on one line through the existing `refuseDuplicates`;
  4. `applyEntries` writes `round.calls` exactly as it writes `round.items`, and the new echo rule (item 10) treats a
     `call:` clause identical to the ledger's as `unchanged`.
- **The `registry.test.ts` line, needed once a board other than the fixture carries calls** (`registry.test.ts` is not
  mine). Inside `it("holds every string inside its limit")`, after the candidate block:

      for (const c of b.carried ?? []) {
        under(`${b.id}.call ${c.id}`, c.question, LIMITS.carriedQuestion);
        under(`${b.id}.call ${c.id}.taken`, c.taken, LIMITS.carriedTaken);
        under(`${b.id}.call ${c.id}.overrule`, c.overrule, LIMITS.carriedOverrule);
      }

  The three limits are already declared in `board-spec.ts` (160 each) and `exploration.test.tsx` holds the component
  to its shape; this is the line that holds a BOARD to the budget. A second line worth having beside it, if the
  Orchestrator wants the ids to be safe for the grammar above: `expect(c.id).toMatch(/^[a-z][a-z0-9-]*$/)`.
- **Two lines `docs/design/README.md` owes** (not mine): (a) "A board may carry the calls its lane took without Will
  (`carried`): id, question, taken, overrule, drawn above the sections and counted in the reading budget."; (b) "A
  `<breakpoint>:` utility works in a board only when production uses that exact class too; otherwise write the media
  query in the board's own sheet. `/design/lab/sample` draws both."
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. One BROWSER-storage migration, described in item
  9, which needs nothing from anybody.
- Look at first: `/design/lab/sample` (the template's new dry run, not in the registry and not linked from the desk).
  Its head carries the carried-calls rows; its first section holds two portalled frames whose tables prove standards
  mode and whose two grey boxes are the responsive-variant finding drawn (720: the CSS box is 200px, the Tailwind one
  is not; 375: both full width). Captures at 1440 and 375, reduced motion emulated:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/lab-tides/sample-1440.png`
  and `sample-375.png`. The sent marker was read in the same throwaway Chrome with a seeded store (`sent-step-1440.png`,
  `sent-step-375.png`, `sent-desk-1440.png` beside them): the dock says "sent on abc1234" and "Copy so far" counts one
  answer instead of two, with "Copy everything" beside it.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Ten lab-workflow findings landed in one lane without changing the
shape of a round: `lab:demo` and `lab:smoke` stopped defaulting `--base` to the Orchestrator's port, every DevTools call
took a ceiling and every board a budget (a stall is a printed row now, not a nine-minute wait), and a capture settles on
the frames' own images, fonts and stillness instead of a flat 1,600 ms. `defineExploration` deduped its flattened
configs, gained an opt-in `today` so every decision but the one being asked draws as today, and passed a `carried` list
through; a staged step reached by URL stopped counting itself into a walk it is not in, and a board's knob stopped
dropping the router's history state. A portalled frame was handed a doctype, so a table inherits colour; the specimen
collector began recording what it could not read; the board's own dock cluster reached a step. The carried calls now
draw above a board's sections, counted in the reading budget, with the review grammar proposed rather than landed. The
"a responsive variant never reaches a frame" mystery was measured to its layer and written where boards read it, and
`/design/lab/sample` draws it. On Will's question about stacking pastes: a paste marks what it took, the picks stay
visible and greyed rather than cleared, and a stale re-send is a no-op the transcript prints as `unchanged`.
