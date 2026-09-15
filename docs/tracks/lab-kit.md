---
track: lab-kit
status: open
cut: "<filled at boot: the launch-prep SHA you cut from>"
preview: false
owns:
  - src/components/lab/
  - src/components/dev/board/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/rounding/
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/kit/
  - scripts/new-board.mjs
reads:
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/_data/catalog.ts
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/design.css
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/lib/design-gate/links.ts
  - docs/specs/light.md
  - docs/reviews/README.md
---

# lp/lab-kit

**Goal.** The kit and the board spec: one home for everything a board would otherwise rebuild, and two
pilot boards migrated onto it. (1) The kit moves from `src/components/dev/board/` to
`src/components/lab/` (the old path a re-export shim until the last board migrates); it is indexed by
the collector like any component, so every kit file owes a `for` line (`rules/component-notes.ts` is
the library track's: ask in Handoff; until then a local map), a specimen on `/design/lab/kit`
(`kit/kit-demos.tsx`; ask the library track for the `kit` family or keep the page hand-built) and a
`// @contract-for` test; a boundary test pins that nothing outside the lab imports it. (2) A board is
two files: `sandbox/<id>/spec.ts` (pure data, `defineBoard` from `src/components/lab/board-spec.ts`,
the shape fixed in Phase 0: question, round, verdict, asks, candidates, departures, assets, sections,
controls, lookFirst, notes, links; `LIMITS` pinned by `registry.test.ts`) and `sandbox/<id>/board.tsx`
(the client composition: the dock and the evidence, a function of the declared state). `registry.ts`
imports every spec (server-safe: the test refuses a spec that imports React, CSS or a board);
`(shell)/lab/boards.ts` maps ids to client components with `legacy` flags. (3) The template
`src/components/lab/board-page.tsx`, `BoardPage({spec, dock, evidence, review})`, renders in this
fixed order: the dock; the Answer (the question, the verdict in the heading face, because, overrule,
the asks as option pills with the recommended one filled and a "See it" link to the evidence anchor,
`round.changed`); the index; the sections (number, title, the asks restated, lede, evidence, then
collapsed "The argument", "For the wiring round", "Notes"); the meta panel derived from the spec;
collapsed context and history. Anchors are `${boardId}-${sectionId}` everywhere (`anchorFor`). The
template fills `BoardPageContext` (sections, prev, next) so the dock's Sections menu and neighbours
work; the dock sticks at `top: var(--lab-topbar-h)` under the shell's top bar. (4) Declared controls,
state, walks: the spec's `controls[]` render in the dock, `useBoardState()` owns them and mirrors them
to the URL through the shell's `_data/state.ts` model (the lab-shell track's; agree the param names in
Handoff, or read its file when it lands), and passes the state to the evidence; `lookFirst[]` is an
executable walk ("Walk · step 2 of 6", each step scrolls and sets the state); `Compare` takes two
states of one section side by side; a note carries the state it was written in. (5) The kit
components, each lifted from the board that got it right: `BoardDock`, `DockRow`, `Knob`,
`AppliedBadge`, `ReplayButton`, `MotionToggle`; `Stage` (today's plus brand-voice's `FitStage`);
`Frame` (one true-viewport iframe: `src` or portal `children`; `css` injected as an adopted constructed
stylesheet with a body-append fallback; `settle`; `push` knobs via a `lab:set` event, never the URL;
`gated`; `lock` scroll groups; `screens`; `reloadKey`; the blocked banner; mounts on approach);
`Compare` (`side | wipe | stack`, `differs` required); `Specimen`; `Section`, `BoardIndex`, `Answer`,
`ReviewQuestions`, `BoardMeta`; `Paste`, `CopyButton`; `ApplyToSite`; `Walk`, `useDesignKey`;
`CostMeter`; `useComputedTokens`, `useLineCount`, `Loupe`; `useReplay`, `useMotionState`;
`SelectTable`, `ConceptCard`, `Notes`, `useMountOnApproach`; `traps.ts` (the ★ traps documented once,
rendered as a Traps section on the kit page). The tuner panel overlap: `motion-tuner.tsx` sets
`data-lab-panel` and `--lab-panel-w` on `<html>` when open (ask the Orchestrator to land that line; it
is his file), `design.css` pads the board page (the shell track's file: ask). (6) The review panel,
copy-as-message only: `ReviewQuestions` renders the asks as pills and a note field per ask plus one
for the board; "Copy as message" emits one line in the ledger grammar
(`docs/reviews/README.md`: `review palette r4: model=registers; dark=ember "a hair lifter"; light=paper`).
(7) The two pilots migrated: **light** (its `shared.tsx` is where most of the kit lives; lifting it is
the kit build) and **rounding** (frames, scroll lock, the tuner overlap, apply-with-tuner sync); a
discipline test refuses a local `Row|Part|Knob|PageFrame|ApplyToSite|CostMeter` in a migrated board
(the other boards in an exemption list that shrinks in the wave). (8) `scripts/new-board.mjs <id>
"<title>"` scaffolds a spec and a board and prints the registrations the tests demand. Density: above
the fold only the dock, the question, the verdict, the ask pills and one line of what changed;
everything else collapsed; a board cannot put prose before its first section.

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

**Verify on.** `/design/lab/light` and `/design/lab/rounding` on `pnpm dev` at 1440 and 375, light and dark,
reduced motion: only kit components (the discipline test); the answer block first with pills linking
under the dock; every section anchored and in the dock's Sections menu; arguments and pastes collapsed;
Replay and Live/Rest from the dock; Apply persists to `/pricing` and the dashboard and the badge clears
it; rounding's frames scroll together, show the blocked banner off-origin, hold until the key, and the
tuner panel no longer covers evidence; the copied review message parses by the grammar; a copied link
reopens the board at the same canvas, candidate and section; a walk step sets the dock and lands on its
section; `/design/lab/kit` renders every piece. The gate and `pnpm lab:smoke` green.

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
