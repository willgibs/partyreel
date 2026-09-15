---
track: lab-desk
status: open
cut: "<filled at boot: the launch-prep SHA you cut from>"
preview: false
owns:
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/tracks/
  - src/app/(dev)/design/(shell)/lab/proposals/
  - src/app/(dev)/design/(shell)/lab/tools/
  - src/app/(dev)/design/_data/tracks.ts
  - scripts/lab-review.mjs
  - scripts/lab-review.test.mjs
reads:
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/(shell)/_shell/markdown.tsx
  - src/app/(dev)/design/_data/catalog.ts
  - src/app/(dev)/design/_data/docs.ts
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/tracks/README.md
  - docs/reviews/README.md
  - docs/reviews/_window.json
---

# lp/lab-desk

**Goal.** The desk as Will's queue, the review session, the transcription script, the track and proposal
pages, the tools. (1) The desk (`/design/lab`): every standing board with its verdict and its open
asks (from `sandbox/registry.ts` specs; a board without a spec shows its `touchpoints.ts` note and a
`legacy` tag), the track chips (from `_data/tracks.ts`: status, rounds, preview), the links (the board,
the record, the manifest, the proposal), and Waiting on Will derived from spec minus ledger (the rules
track's `review/status.ts` when it lands; read its file, or derive from the ledgers in `docs/reviews/`
directly with a local reader until then). (2) The review session: walks every open ask across every
standing board in order (board, ask, its evidence section with the state that argues it), collects the
choices and notes, and ends with one message in the ledger grammar (`docs/reviews/README.md`) that
Will pastes into chat; the session's position lives in the URL (agree the param with the shell track's
`_data/state.ts`; a plain `?session=<board>.<ask>` until it lands) so an interrupted review resumes;
`1`..`9` picks an option (the shell track wires the keys; you expose the handler). Copy-as-message
only: the UI never writes. (3) `scripts/lab-review.mjs "<the pasted line>"` (`pnpm lab:review`):
parses the grammar, validates every ask and option against the specs, appends to
`docs/reviews/<board>.json` (created from the README's shape when missing), refuses an unknown board,
ask or option with the line and column; node builtins only; a test beside it. (4) The track pages
(`tracks/`, `tracks/[track]`) and the proposal pages (`proposals/`, `proposals/[slug]`), rendered from
the docs through `Markdown` with the front matter as meta, the board and the record linked; Phase 0
left plain versions, make them the reader's. (5) The tools index (`tools/page.tsx`) and the four tool
pages on the templates (`motion`, `reel-parity`, `stream-probe`, `boom`; the boundary probe's throw
now surfaces inside the shell's Suspense boundary: say in Handoff whether the probe still proves what
its header claims). (6) `_data/tracks.ts` gains what the desk needs (rounds, the merged SHA, the
handoff's "look at first" line) without a second copy of any manifest fact.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes outside your lane are asked for in the Handoff and the
Orchestrator lands them (announced in `docs/tracks/orchestrator.md`); never edit another track's
files, `touchpoints.ts`, `rules/bible.ts`, CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS,
`docs/ASSETS.md`, `docs/design/rulings.md` or `docs/reviews/`. Light QA (Will, 2026-09-14): your pages
at 1440 and 375 in a foreground tab, light and dark, reduced motion honoured, the gate green on the
synced tree (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, then `pnpm lab:smoke` against
`pnpm dev`). Push freely (no CI on `lp/*` unless the message says `[ci]`); the preview builds at
`status: handed-off` or on `[preview]`. No em-dashes anywhere a person reads.

**The round.** The Library x Lab round (Will, 2026-09-15): "we need a dedicated round of library and
lab UI work to make nav and presentation better before I can review the track work itself... Think of
this as building our own internal app to manage our design system, exploratory lab work that gets
merged in... the goal is for the library to represent our entire working rule set so that everything
influencing new agents' design work is visible to both me as a human, you as an orchestrator, and new
agents." shadcn's docs site (https://ui.shadcn.com/docs/components/base/attachment) is the layout
reference: top nav, a left sidebar of sections and lists, a content column with title, description,
previews with code, prev/next, a right-hand table of contents. The plan's whole text is
`docs/design/rulings.md` (2026-09-15) plus this manifest; the shell exists (Phase 0, on
`launch-prep`): read `src/app/(dev)/design/(shell)/_shell/index.ts` and `_data/catalog.ts` first,
then walk `/design/library` and `/design/lab` on `pnpm dev` before writing a line.

**Rulings in force.** Copy-as-message only: the review panel composes a message Will pastes into
chat; the UI never writes the repo. Will's rulings live in `docs/design/rulings.md` (never owned).
Routes are `/design/library/*` and `/design/lab/*`; `.mono` is retired (one design language, the real
tokens). This round builds the shell, the kit, the rules layer and the desk; the boards migrate in
the wave after it.

**Verify on.** `/design/lab` on `pnpm dev` at 1440 and 375: every standing board's verdict and open asks, the
track chips, the Waiting on Will list; a review session walks every open ask in order, survives a
reload at the same step, and ends in one message that `pnpm lab:review` appends to the ledgers
without a rejection (prove it on a scratch copy of `docs/reviews/`, never commit a ledger: the
Orchestrator writes them); `/design/lab/tracks/light` and `/design/lab/proposals/light` rendered from
the docs; the tools index. The gate and `pnpm lab:smoke` green.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-<track>-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages), lab:smoke ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Shared-file changes asked of the Orchestrator (a `_data/` module, `touchpoints.ts`, `next.config.ts`): none
- Assets requested from Will: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
