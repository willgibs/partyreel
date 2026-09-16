---
track: lab-review-card
status: handed-off
cut: "be1638f2"          # the clarity round, 2026-09-15, cut from launch-prep
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/components/lab/review-card.tsx
  - src/components/lab/review-card.test.ts
  - src/components/lab/board-page-context.tsx
  - src/components/lab/board-page.tsx
  - src/components/lab/walk.tsx
  - src/components/lab/index.ts
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/kit/
  - src/app/(dev)/design/rules/component-notes.ts
reads:
  - src/components/lab/board-spec.ts
  - src/components/lab/board-state.tsx
  - src/components/lab/dock.tsx
  - src/components/lab/review.tsx
  - src/components/lab/lab-prefs.ts
  - src/components/lab/kit-discipline.test.ts
  - src/components/lab/boundary.test.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/design.css
  - docs/reviews/README.md
  - docs/design/guidance.md
---

# lp/lab-review-card

## Round 1 (the clarity round, 2026-09-15): the answering moves onto the board

**Goal.** Will answers an ask beside the evidence it is about, on the board, rather than on the desk
with the evidence a tab away. His first review through the desk (2026-09-15) stopped at "Depth in
dark: family | lift | neither" with "hard to visibly tell what Family and Lift are from the previews":
the desk showed a label and three tokens and the evidence opened elsewhere. So `?session=<board>.<ask>`
on `/design/lab/<board>` renders a REVIEW CARD pinned under the dock: the board's title and "Ask N of M"
counted across the whole queue, the question, the `context`, the "Where to look" line, the options as
numbered buttons with their label and meaning ("the board says" on the recommended one), the note
field, "This question is not clear to me" (the `?` answer, which needs the note), Back and Next.
Landing on a step applies the ask's `state` through the board's `setState` and scrolls its evidence
section into view (the Walk's `scrollIntoView` with its reduced-motion guard, extracted into a helper
both use); picking an option on an ask that names a `control` sets that control, so the pick IS the
preview. Next within a board is a state change with no navigation; the next board is a `LabLink` to
`/design/lab/<next>?session=<next>.<ask>`; after the last ask the desk's summary
(`/design/lab?session=end`) composes the message exactly as today. Answers stay in
`_desk/review-store.ts` (localStorage, per viewer) and the keys in `_desk/review-keys.ts` (1..9 picks,
Enter and the arrows step, Escape leaves a field): the card registers with `registerReviewKeys` the
way the session does, so the two never both handle a key. The desk keeps its step view for the sample
dry run and as the fallback for a board with no page; `StartReview` and the "Waiting on you" rows link
to the first open step ON ITS BOARD. The `Ask` shape (`src/components/lab/board-spec.ts`: `context`,
`look`, labelled `options`, `state`, `control`; `optionId`/`optionLabel`/`optionMeans`) and the `?`
answer landed at `be1638f2`; the light board is on the new shape and is the board to build against.

**The shape.** The queue is server data: `[board]/page.tsx` builds it the way the desk does
(`deskRows`, `openQueue` and `toSteps`, the last moved out of `lab/page.tsx` into `_desk/` and shared)
and passes `{ steps, param }` into `BoardFrame`, which is `BoardPageContext.review?`; the kit's
`BoardPage` mounts `<ReviewCard />` after the dock when the context carries a session step on THIS
board (a board with no spec shows nothing). The card is `src/components/lab/review-card.tsx` (client):
sticky from `sm` at `top: calc(var(--lab-topbar-h) + var(--board-dock-h))`, static at 375,
collapsible to one line (the question and the picked option) the way the dock collapses; it must never
cover the evidence it scrolled to (write its height to `--review-card-h` and fold it into the
`scroll-padding-top` the dock writes, or extend the dock's sync). The kit's discipline for a new piece:
a `for` line in `rules/component-notes.ts`, a demo in `lab/kit/kit-demos.tsx`, and a
`// @contract-for: src/components/lab/review-card.tsx` test (`review-card.test.ts`): the card renders
the question, the context, the look and every option's label and meaning; the recommended option is
marked; picking writes the store and, with a `control`, the board state; `?` stores the null-choice
marker and focuses the note; Next on a board's last ask links to the next board's first open ask; the
summary's message parses (`lab-review.test.ts` already proves the grammar). No board's own files are
yours; the light board (`sandbox/light/`) is read to build against and never edited.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the
light board walked at 1440 and 375 on a local `pnpm dev` (`/design/lab/light?session=light.aurora`):
landing on "In dark mode, how should two overlapping things be told apart?" scrolls to the labelled
photographs with the App dark ground set; picking on "How strong should the aurora be?" flips the
dock's Register; "This question is not clear to me" composes `review light r5: aurora=? "..."`; Next
after the last light ask lands on the next board's first open ask; the summary's message is accepted
by `pnpm lab:review --dry`; keyboard and reduced motion honoured; the sample dry run on the desk still
walks. `pnpm lab:smoke` green against your dev server (`pnpm lab:smoke --base http://localhost:<port>`).
No `[preview]` and no `[ci]` on your pushes.

**Handoff.** The usual (head SHA, gates, lane check) plus what the card looks like at 1440 and 375 in
words, and any board whose evidence the card covered or whose `state` it could not apply.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · the review surface; 2026-09-15 · a question carries its context; an exploration is
a catalog; 2026-09-15 · the lab is an internal app (the UI never writes the repo).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. The card is lab-only and its facts live in the kit page, the component's own `for` line and
  its contract, which the generated `docs/design/library.md` already carries.

## Deferred (ROADMAP one-liners, bucket named)

- The design lab: the table of contents' reading line should add `--review-card-h`, so a heading is
  not marked "reached" a card early while a review is open (`_shell/toc.tsx`, `readingLine()`, one
  term).

## Handoff (replaces the chat report)

- **`lp/lab-review-card`, last code commit `5a52fbb2`** (everything after it is this manifest, so
  the branch tip is the head and the tree the gates ran on is `5a52fbb2`). Cut from `d5f0c3c9` and
  merged (never rebased) with
  `origin/launch-prep` at `5da989bd` (the rounding, brand-voice and glow-specs integrations, and the
  Answer block's own context line). No preview and no CI: `preview: false`, and no commit carries
  `[preview]` or `[ci]`.
- **The gates on the synced tree**, each on its own exit code: `pnpm typecheck` clean; `pnpm lint`
  0 errors (6 warnings, all pre-existing and none in this lane); `pnpm test` 219 files, 2168 tests;
  `pnpm build` 257 static pages. `pnpm lab:smoke --base http://localhost:3061` 325 checks, 0 failing
  (it crawls `/design/lab?session=end`). `pnpm format` on the changed files.
- **The lane** (`git diff --name-only origin/launch-prep...HEAD`):

  ```
  docs/design/library.md                                     <- generated (exception)
  docs/tracks/lab-review-card.md
  src/app/(dev)/design/(shell)/lab/[board]/page.tsx
  src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx
  src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
  src/app/(dev)/design/(shell)/lab/_desk/start-review.tsx
  src/app/(dev)/design/(shell)/lab/kit/kit-demos.tsx
  src/app/(dev)/design/(shell)/lab/kit/notes.ts
  src/app/(dev)/design/(shell)/lab/kit/page.tsx
  src/app/(dev)/design/(shell)/lab/page.tsx
  src/app/(dev)/design/rules/component-notes.ts
  src/app/(dev)/design/rules/rules.generated.json            <- generated (exception)
  src/components/lab/board-page-context.tsx
  src/components/lab/board-page.tsx
  src/components/lab/index.ts
  src/components/lab/review-card.test.tsx
  src/components/lab/review-card.tsx
  src/components/lab/walk.tsx
  ```

  Two paths sit outside the claimed prefixes and both are written by `pnpm design:rules`, which the
  rules-registry test demands be committed alongside a new contract. Nothing else is outside.
- **Two departures from the brief's letter, both named here rather than taken quietly.**
  (1) The contract is `review-card.test.tsx`, not the `.test.ts` the manifest named: the claims are
  RENDER claims ("every option's label and meaning are on the screen"), the `unit` vitest project is
  node with no DOM, and a static read of the source would prove nothing about what a reviewer sees.
  The `component` project (jsdom + RTL) is where the rest of the repo pins behaviour, and the file is
  still under the claimed path. (2) The track claims `(shell)/lab/kit/` rather than `kit/kit-demos.tsx`
  alone, so the specimen is WIRED into the kit page and its notes instead of exported into nothing.
  No live track claims that directory (`lab-kit` is integrated) and the manifest guard is green.
- **The card at 1440.** A full-bleed band pinned directly under the dock, no seam between them: the
  spine reads "Ask 16 of 54 - Light, shadow and lamp" on the left and "0 answered - Back - Next -
  Collapse" on the right; under it the question at 14px, the ask's context in one muted paragraph,
  the "Where to look" line ending in a "Take me there" that re-runs the scroll, then the options as
  numbered cards laid out three across (each its label, "the board says" on the recommended one, and
  what choosing it means), then the note field with "This question is not clear to me" beside it and
  "1 to 3 picks, Enter goes on." The card's bottom border doubles as the progress hairline. It stands
  283px tall on the widest ask (three options, a four-line context) over a 49px dock and a 48px bar,
  and the evidence it asks about starts on the next pixel: landing on `light.depth` put
  `#light-separate` at 387.75px from the viewport top, which is `scroll-padding-top` (105) plus the
  card (283) to the quarter-pixel. Collapse folds it to one line carrying the question and the picked
  option's label with a check.
- **The card at 375.** Static, like the dock: `position` computes to `relative`, `--review-card-h`
  writes `0px` (so nothing subtracts a card nobody has to scroll past), the band is the full 375 and
  the three options stack at 343 each. Nothing inside the card exceeds the viewport. The page's only
  horizontal overflow at 375 is the light board's own 1440 canvas at 1:1, which is the board's choice
  and its dock's 375 switch, not the card's.
- **Verified live** on `pnpm dev` at :3061, on the light board:
  landing on `light.depth` wrote `ground=app-dark` into the URL and the dock and scrolled the
  Separate section to the line under the card; `2` from the keyboard picked "The lift only" and the
  spine went to "1 answered"; on `light.register` picking "Identity: the page reads as a lit room"
  wrote `register=identity` and flipped the board root's `data-register`, which is the dock's own
  Register knob (the pick IS the preview); "This question is not clear to me" stored `choice: "?"`,
  put the cursor in the note and carried the typed sentence; the last light ask's Next is a LINK to
  `/design/lab/type-scale?session=type-scale.marketing`, the next board's first open ask;
  `/design/lab?session=end` composed `review light r5: register=identity; depth=? "..."` from the
  card's own answers and `pnpm lab:review --dry` accepted both clauses; with the media query
  reporting `reduce` the shared scroll helper lands in the same tick instead of animating.
  `light.register` is answered in the ledger, so reaching it meant moving `docs/reviews/light.json`
  aside for the length of that one check and putting it back: it is byte-identical (`diff -q` clean,
  `git status` on `docs/reviews/` empty) and nothing in this branch touches it.
- **No board's evidence was covered, and no ask's state failed to apply.** The card clears itself
  the way the dock does: it writes `--review-card-h` while it is stuck and `0px` while it is not, and
  `scrollToSection` (walk.tsx, now shared with the Walk) adds that to `scroll-padding-top`. An ask
  whose `state` names a control the board does not declare is ignored by `useBoardState`, which is
  its existing contract; nothing on the light board hit it.
- **Two findings for other lanes, neither blocking.**
  (1) `_shell/toc.tsx`'s `readingLine()` is `--lab-topbar-h + --board-dock-h + 24` and does not know
  about the card, so while a review is open the table of contents marks a heading "reached" one card
  too early. The fix is one term: `+ px("--review-card-h")`. The shell lane owns that file.
  (2) The desk's own step view is now reached only by the dry run (`?session=sample`), the summary
  (`?session=end`) and a board with no page; every real ask opens on its board. It is kept
  deliberately as that fallback, but a later round could retire it if no board is ever page-less.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines)

The answering moved onto the boards. `?session=<board>.<ask>` on `/design/lab/<board>` now pins a
REVIEW CARD under the board's dock: the question in plain words, the ask's context, the "Where to
look" line, the options as numbered cards carrying their label and what choosing each one means,
the note, "this question is not clear to me", and Back and Next counted across the whole open queue.
Landing on a step applies the ask's declared state through the board's own `setState` and scrolls its
evidence section under the chrome; picking an option on an ask that names a `control` sets that
control, so the pick is the preview. Next inside a board is a state change, the last ask of a board
links to the next board's first open ask, and the last of the queue lands on the desk's summary,
which composes the same message it always did. The step's shape and the queue's derivation moved out
of the desk page into `_desk/session-step.ts`, read by both routes; the walk's scroll became
`scrollToSection`, which clears the card's height as well as the dock's; the desk's queue rows and
"Start the review" open an ask on its board. The card joined the kit with a contract, a `for` line
and a live specimen on `/design/lab/kit`.
