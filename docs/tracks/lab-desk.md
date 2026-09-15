---
track: lab-desk
status: handed-off
cut: "2644310d"          # the Library x Lab round, phase 0
preview: true            # the handoff push builds it
owns:
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/tracks/
  - src/app/(dev)/design/(shell)/lab/proposals/
  - src/app/(dev)/design/(shell)/lab/tools/
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/_data/tracks.ts
  - src/app/(dev)/design/_data/tracks.test.ts
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

- none

## Deferred (ROADMAP one-liners, bucket named)

- Design lab: delete `(shell)/lab/_desk/sample-spec.ts` and the desk's dry run once every standing
  board carries a spec; it exists only so the review session can be walked before they do.

## Handoff (replaces the chat report)

- Head: the tip of `lp/lab-desk` (`943f2eff` with this manifest on top), pushed; preview
  partyreel-git-lp-lab-desk-partyreel.vercel.app
- Synced with `launch-prep` at `995959c4` (it moved twice: the proxy gate and the shell's prefetch,
  then lab-library and lab-rules; both merged, never rebased)
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are pre-existing and
  outside this lane), test ok (2085), build ok (257 static pages, 128 routes), `pnpm lab:smoke
  --base http://localhost:3405` ok (263 checks, 0 failing). Also run against a production build on
  its own port: `pnpm lab:smoke --production --key ...` ok (243 checks, 0 failing, the closed door
  404ing without a key and with a wrong one).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file, `scripts/lab-review.mjs`,
  and the four owned trees (`(shell)/lab/page.tsx`, `_desk/`, `tracks/`, `proposals/`, `tools/`,
  `_data/tracks{,.test}.ts`). No exceptions. `docs/reviews/` is untouched: no ledger was ever
  committed, and every test writes to a temp directory.
- **Shared-file changes asked of the Orchestrator** (three, each a small patch in another lane):
  1. `package.json`, the script `pnpm lab:review` (the lane guard cannot hold a one-segment path, so
     it is asked for here rather than claimed). Add one line beside `lab:smoke`:
     `"lab:review": "node scripts/lab-review.mjs",`. The script runs today as
     `node scripts/lab-review.mjs '<the line>'`; only the alias is missing.
  2. `(shell)/_shell/markdown.tsx` (the lab-shell lane), two rules on the prose wrapper, which would
     clear every rendered doc at once: a long unbroken path inside inline code and a wide GFM table
     both push a phone sideways. `/design/library/doctrine/agent-guide` still measures 535px at 375,
     and it is not mine to fix. The exact patch, on the `div` in `Markdown`:
     `className="prose max-w-none prose-help [&_a]:break-words [&_code]:break-words [&_table]:block [&_table]:overflow-x-auto"`.
     The same four utilities are on my two markdown pages today and can come off when this lands.
  3. `design/review/status.ts` (the lab-rules lane), the round `boardStatus` answers from. It reads
     the LEDGER's latest round whatever number that carries, while a spec states the round the board
     is in; the moment a board opens a new round, last round's answers read as this round's and the
     desk shows nothing waiting. One line inside `boardStatus`, after `const round = latestRound(ledger)`:
     `const current = spec && round && round.n === spec.round.n ? round : null;` then derive `byAsk`
     from `current` rather than `round`. `_desk/queue.ts` carries the same guard as a ★ note and can
     drop it the moment this lands.
- Assets requested from Will: none. The desk renders repo text; it wants no artwork.
- **The boundary probe still proves what its header claims** (the manifest asked). On a production
  build at `995959c4`: keyless it is a real 404 from the proxy before any layout renders, and with
  the key it is a 500 whose body is `<html id="__next_error__">`, the root error document, with the
  intentional crash logged once. The Suspense wrapper that would have swallowed it was removed from
  the shell layout at `216830cc`, so the throw escalates past the root layout as before. Its page is
  unchanged; the tools index now says out loud that it is meant to fail, which nothing did before.
- Look at first: `/design/lab`, the top third. The desk is answer-first now: what waits on you, then
  every board with its verdict and your own notes on it, then the tracks with the line each handoff
  says to look at first. Then `/design/lab?session=sample`, the dry run, which is the whole review in
  three asks: 1 to 9 picks, Enter goes on, the URL carries the step so a reload resumes, and it ends
  in one line to paste. That line is real grammar on an unreal board, so `lab:review` refuses it by
  design, which is the refusal path shown rather than described. The standing boards queue nothing
  yet because none carries a spec; the day the kit lands the pilots, they appear here with no change
  to this code.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The desk became Will's queue. `/design/lab` now
answers three questions in order: what waits on you (every ask with no answer in its board's current
round, derived by the rules track's `design/review/status.ts` and joined to the registry in
`_desk/queue.ts`), what every board is asking (its verdict, its asks answered or open, his own notes
on it, and every way in), and where the work is (each live track's Goal sentence and its handoff's
"look at first" line, lifted from the manifest by `_data/tracks.ts` rather than restated).
`?session=<board>.<ask>` turns the page into the review session: one ask at a time with the case
beside it and the evidence a click away, `1`..`9` picking an option, the position written to the URL
with `history.replaceState` so a reload resumes and no step costs a server round trip, the answers in
the reader's own browser, and one message in the ledger grammar at the end. The UI never writes the
repo: `scripts/lab-review.mjs` parses that message, validates every board, round, ask and option
against the board's own spec with a masking scanner (node builtins only, held to a real spec file by
its test), and appends to `docs/reviews/<board>.json` all-or-nothing, naming the line and column of
anything it refuses. `_desk/sample-spec.ts` is one fixture board that doubles as a dry run, so the
session could be judged before any standing board carried a spec. The track, proposal and tools pages
became a reader's: a proposal's standing reads as one whole clause, a manifest leads with its goal
and folds its lane away, and the tools have an index that says the boundary probe is meant to fail.
