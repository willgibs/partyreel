---
track: lab-flow
status: open
cut: "02c409b4"        # the stepped review round (2026-09-16): the review as an onboarding form
preview: false          # no branch preview; the round reviews on a local pnpm dev after integration
owns:
  - src/components/lab/
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/rules/component-notes.ts
  - src/app/(dev)/design/rules/rules.generated.json
  - docs/design/library.md
  - scripts/new-board.mjs
reads:
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/home-hero/
  - src/app/(dev)/design/touchpoints.ts
  - scripts/lab-review.mjs
  - scripts/lab-smoke.mjs
  - docs/reviews/README.md
  - docs/reviews/light.json
  - docs/design/README.md
  - docs/design/rulings.md
  - docs/tracks/light.md
  - docs/tracks/palette.md
---

# lp/lab-flow

**Goal.** Turn the review into the onboarding form Will described (2026-09-16), on top of what exists,
in one day. His words: "more similar to a multi-step onboarding form where all context is made available
for 1+ questions around the same content, then onto the next context"; the home hero presents its
directions and he picks a winner, asks for refinements on one or more, or asks for new directions; the
twelve light placements are radio cards or one at a time with more detail; then the shadow questions with
fresh context, then the lamp's breathing. Today's surface fails him ("the review process favors you and
makes me spend tons of time per track figuring what I'm even being asked"): about 840 words and 250
controls around the evidence on a catalog board, every ask printed three or four times (the Answer's
pills, the section's "Rule on:", the review panel, the card), an option only previewable by recording it,
nothing staged, and "Copy so far" re-sending everything held. His four screenshots (Cofounder "Pick a
vibe", Adobe Express "Which styles do you like?", Linktree "Choose your favorite!", Biosites "Style") are
the feel: the question as the heading, one calm line, the options as big preview cards with a name and one
line, one wearing the ring, "None of these" as a card with a free text, thumbs per card as optional
feedback, a config control beside a live preview of the real product, Back and Next, Step N of M. Build
THAT, and nothing more: this is the last lab-infrastructure round of the window, and every round after it
returns product. HTML and CSS is shaping, not QA: fast, on the pieces that exist, verified by walking it.

**The step.** A review is a sequence of steps. A step is one context and its question(s), alone on the
screen: Back and Next at the foot, a progress hairline and "Copy so far" at the head, the board's full page
one link away ("Open the whole board" drops `?session=`). Nothing else: no Answer block, no index, no meta
panel, no "Rule on:" restatements, no dock pill rows (the controls a step needs are its config strip).

```
 Palette · step 1 of 4   ▓▓▓░░░░░░░░░░           Copy so far   Open the whole board
 ─────────────────────────────────────────────────────────────────────────────────
 Which palette should the whole site wear?
 Pick one. It decides the grey ramp and every surface (src/app/theme.css).

 ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌ ─ ─ ─ ─ ┐
 │ preview │ │ preview │ │ preview │ │ preview │ │ preview │   None of
 │ Graphite│ │ Slate   │ │ Studio  │ │ Reel    │ │ Fog     │   these:
 │ one line│ │ one line│ │ one line│ │ one line│ │ one line│   new directions
 └────●────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └ ─ ─ ─ ─ ┘
   keep · refine · kill on hover (optional feedback)            + a note

 Theme  light | dark        Screen  dashboard | album           ← the config strip
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                    the real dashboard, wearing Graphite                        │  ← the stage
 └───────────────────────────────────────────────────────────────────────────────┘
 A note on this one (optional) ______________________      This question is not clear to me
                                                     ◀ Back            Next ▶
```

- **Tiles.** Every option is drawn on ONE specimen in its own state (the board's evidence section for the
  ask, rendered once per option in a scaled `FitStage`, in `{...ask.state, ...option.state, [control]:
  option.id}`), all visible at once; a press SHOWS it on the stage (URL state only, nothing recorded);
  Choose, or a second press, RECORDS it (the store, then the stage); a second Choose clears and resets the
  stage to the ask's state. An option with no state and no control mirror is a text tile (label and
  means). A catalog's cards are its tiles (the kit's `Catalog` in a `tiles` mode: no verdict rows, a ring
  on the chosen card, the verdict row on hover or focus in pick-one mode).
- **Three exits for a pick-one catalog**, as Will described the hero: choose the winner; mark one or more
  cards refine with notes; or "None of these: new directions" with a note (the `none` option of the winner
  ask, which clears the pick control: the right preview of none). The winner is an ordinary ask, so the
  ledger line is `palette=graphite` or `palette=none "new directions: ..."`; the grammar does not change.
- **One at a time** (a keep-any catalog with `walk: "one-at-a-time"`): the same session step shows card k
  of N large: its before/after on one specimen (`BeforeAfter`, lifted from the light board's `Delta`: as
  today | with it, captions under the judged area), the card's one line, "Lands as" (`candidate.lands`),
  up to two usages the board renders, keep / refine / kill and a note. Next moves to card k+1 (the URL
  carries the card; `?session=<board>.items` stays ONE step and `<board>.items` stays its id).
- **Staging.** `Ask.after` (`{ask, option?}` or `{item, verdict?}`) holds a step back until its
  prerequisite is held in this sitting or ruled in the ledger, and drops it as moot when the prerequisite
  went the other way. The server resolves the ledger side in `session-step.ts` (`toSteps` gets the ledger's
  answers and rulings for the board), the client checks the store (`stepBlocked(step, steps, store)`),
  and Back, Next and Start the review skip a blocked step; `status.ts` gains `staged` and `moot` so the
  desk does not count them open and `complete` ignores moot. A pick-one catalog does not queue its cards
  as open items (the winner ask is the decision; a verdict given is still accepted and transcribed).
- **The desk** lists open steps by board, open only; a transcribed step is gone (already true); a
  held-not-sent one wears a `HeldBadge`; a staged one is dim, "after «question»"; `composeSoFar(store,
  roundOf, transcribed)` skips an entry the ledger already holds with the same choice and note (the two
  server pages pass the ledger's current values from `deskRows`), so an old answer never rides into the
  next batch; a cleared choice with a surviving note is sent as `note: "on <ask>: ..."`.
- **At 375**: the tiles are a two-up grid (a sideways scroll past six), the stage below at full width,
  Back and Next fixed at the foot.

**The data is landed** (`src/components/lab/board-spec.ts` at the `cut` above, every field optional, with
`registry.test.ts`'s rules on them): `Ask.lands`, `Ask.after`, `Ask.strip` (the config strip's controls),
`AskOption.state`, `Candidate.lands`, `CatalogSpec.mode` (`pick-one | keep-any`), `winner` (the ask that
records the winner: it mirrors the pick control and offers `none`), `walk`, `stage` (the section drawn
under the tiles in the pick's state), `LIMITS.askLands 160`, `LIMITS.candidateLands 120`; `look` is
optional once every option is drawn. You build the surface that reads them. Render what a spec declares
and degrade gracefully where it declares nothing: an option without a state is a text tile, a catalog
without a mode is keep-any in a gallery, an ask without `strip` shows no strip. The light and palette
boards are being reshaped beside you (their manifests are in your `reads`) and verify on your flow the
moment it merges; the hero's stream catalog lands on the old model and gets its round after yours.

**The surface, file by file.** `board-page.tsx`: in session mode the page renders the spine, the step
and nothing else (the board's sections are not mounted; the evidence the step needs is rendered by the
step through the board's own `evidence(sectionId, state, api)`); browse mode loses the index, the
sections' "Rule on:" rows and the review panel, and folds the meta panel closed. `review-card.tsx`
becomes `step.tsx`: the spine (board · step N of M, the hairline, Copy so far, Open the whole board) and
the body: `OptionTiles` (an ask), `GalleryStep` (a catalog as tiles: the winner or the verdicts, the
"None of these" exit), `CardStep` (one at a time), the config strip from `ask.strip` (the existing
`ControlKnobs` for those controls only), the stage (the ask's evidence section, or `catalog.stage`, in the
shown state), the note, "This question is not clear to me" (a note required), Back and Next; the keys as
today (digits, Enter, arrows; Enter belongs to whatever is focused on a board). `before-after.tsx`:
`BeforeAfter({ before, after, labels })`; `Catalog` gains `before` and `usages` render props and the
`tiles` mode. `session-step.ts` carries `after`, `lands`, `strip`, the option states, the catalog's mode
and walk. `scripts/new-board.mjs` scaffolds a pick-one catalog with a winner ask (`none` offered) and a
`stage`, so "explore N variants of X" starts on the right shape.

**Delete.** `AskPills` and `BoardIndex` in `answer.tsx`, the sections' "Rule on:" restatement,
`review.tsx` (`ReviewQuestions`, `composeReviewMessage`), "Take me there", the pill rows in session mode,
and the dead `waitingOnWill` in `status.ts`. Their kit notes, demos and `for` lines go with them
(`rules/component-notes.ts` is yours this round: land the `for` lines for every new piece, drop the dead
ones, run `pnpm design:rules` and commit the regenerated artifact and `docs/design/library.md`).

**Tests, three contracts and the edits the deletions force.** `step.test.tsx` (show does not record,
choose does, a second choose clears and resets the stage; `?` needs a note; the winner records as the
ask; a blocked step is skipped), `_desk/staging.test.ts` (blocked until the prerequisite is held, then
reachable, moot when it goes the other way, the ledger side resolved on the server), `copy-so-far.test.ts`
(omits what the ledger holds, re-includes a changed answer, sends a cleared choice's note as a note);
`registry.test.ts` if a rule needs tightening, `queue.test.ts`, `review-card.test.tsx` renamed,
`_desk/sample-spec.ts` gains a staged ask, option states and a pick-one winner so the desk's dry run walks
all three. No ratchet list, no demo page per sub-piece, no new grammar, no scanner change. A kit piece
still gets its `for` line, a kit note and a demo (`(shell)/lab/kit/notes.ts`, `kit-demos.tsx`) and a
`// @contract-for` test (`kit-discipline.test.ts`).

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and
2026-09-16, all sections: a question carries its context; an exploration is a catalog; the lab winds
down into the Library); no em-dashes in any copy; no mono face; the stale-stylesheet guard (bump
`lab-css-generation.ts` and `design.css` together when a shell rule changes). The UI never writes the
repo: `pnpm lab:review` is the only thing that touches `docs/reviews/`.

**Verify on.** A local `pnpm dev -p 3121` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured: the desk's Start the review opens the first open step alone on the screen; on the palette (as
it stands: keep-any, no winner yet) the items step walks as a gallery with verdict rows; on the desk's dry
run (`/design/lab?session=sample`) the winner step, the staged ask and the one-at-a-time walk all work; a
tile press changes the stage and not the store, Choose changes both, a second Choose resets; "Copy so
far" omits what `docs/reviews/light.json` holds for round 5 (the light board is at round 6, so that means:
prove it on the fixture, whose ledger you inject) and re-includes a changed answer; the desk hides staged
rows and badges held ones; `pnpm lab:smoke --base http://localhost:3121` green (routes; the budgets are
the boards' own); the four gates, `pnpm design:rules` before them where a `for` line changed.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on
:3121 only, killed by port (never an unscoped pkill); one process at a time, stopped before a build, a
test run and the handoff; never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By:
Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. Three other agents run beside you in
their own worktrees (`home-hero`, `light`, `palette`): merge `origin/launch-prep` before your handoff if
it moved, never rebase.

**Questions.** What the goal leaves open goes here, numbered, with your recommended answer; carry on
with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: `pnpm design:rules` run, typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The pieces, one line each: `<piece>: what it renders; its contract test`
- What a board agent must declare to get each step kind (the spec fields, one line each)
- The README sentence for `docs/reviews/README.md`, verbatim, for the Orchestrator to land at the merge
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
