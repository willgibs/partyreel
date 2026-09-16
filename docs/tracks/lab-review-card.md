---
track: lab-review-card
status: open
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
  - src/app/(dev)/design/(shell)/lab/kit/kit-demos.tsx
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- not yet

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

- not yet
