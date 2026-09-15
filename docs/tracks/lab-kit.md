---
track: lab-kit
status: integrated
cut: "2644310d67d9c3c2bb5c9cb7aafa84b26322311b"
merged: "22c0dc81"      # the branch head merged into launch-prep
preview: true
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

- Last code commit `5ca30f1e`; this manifest commit is the branch head, pushed. Preview: partyreel-git-lp-lab-kit-partyreel.vercel.app
- Synced with launch-prep at `995959c4` (lab-library and lab-rules integrated); clean merge, no conflicts
- Gates on the synced tree: typecheck ok, lint ok (0 errors), test ok (2062 in 212 files), build ok (256 static pages), `pnpm design:rules` regenerated (no diff: the contracts are pending, below), `pnpm lab:smoke --base http://localhost:3403` ok (262 checks, 0 failing)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is 63 files, every one inside `owns` plus this manifest. No exceptions.

### Shared-file changes asked of the Orchestrator

Four, each a small exact patch. None blocks a walk; the first is the one Will will feel.

**1. The tuner panel overlaps the evidence** (`src/components/dev/motion-tuner.tsx`, the Orchestrator's,
plus `src/app/(dev)/design/design.css`, lab-shell's). The panel is `fixed bottom-3 right-3` and at 375 it
is 320 of 375, so it covers the rounding board entirely until the reader collapses it. The rounding board
carries `usePanelAwareWidth` as a stand-in (it measures `[data-motion-tuner]` and holds the wide parts
clear), which is a board doing the shell's job. The fix is two lines:

In `motion-tuner.tsx`, in the effect that runs when `open` changes, on `document.documentElement`:
```
html.toggleAttribute("data-lab-panel", open);
html.style.setProperty("--lab-panel-w", open ? "20rem" : "0px");
```
(cleared on unmount, like the dock clears `--board-dock-h`.)

In `design.css`, beside the other `[data-lab-*]` rules:
```
@media (min-width: 1024px) {
  html[data-lab-panel] .board-page { padding-right: calc(var(--lab-panel-w, 0px) + 1rem); }
}
```
Below 1024 the right answer is to collapse the panel, not to squeeze a board into 43px, so the rule is
deliberately desktop-only. With both landed, `usePanelAwareWidth` in `sandbox/rounding/board.tsx` can go.

**2. Publish the kit's contracts** (`src/app/(dev)/design/rules/component-notes.ts`, lab-library's).
Three test files carry `@contract-for-pending:` rather than `@contract-for:` because the collector
indexes every file a contract names, and an indexed file owes a `for` line or `gallery.test.ts` fails.
The nine lines, ready to paste into `COMPONENT_NOTES`:

```ts
  /* the lab kit (src/components/lab) */
  "src/components/lab/index.ts": {
    for: "the lab kit's one import surface; nothing outside /design may import it (boundary.test.ts)",
    unspecimened: "a barrel, not a component",
  },
  "src/components/lab/board-spec.ts": {
    for: "what an exploration board IS as data: the question, the verdict, the asks, the sections, the controls, the walk",
    unspecimened: "pure types and the density limits; the specimen is any board",
  },
  "src/components/lab/board-page.tsx": {
    for: "the template every board renders through: the dock, the answer, the index, the sections, the meta, in one fixed order",
    unspecimened: "its specimen is a whole board (/design/lab/light)",
  },
  "src/components/lab/board-state.tsx": {
    for: "a board's declared controls, read from the URL rather than mirrored to it, so a link reopens the exact canvas and candidate",
    unspecimened: "a hook; the dock on any board is the specimen",
  },
  "src/components/lab/dock.tsx": {
    for: "a board's page-wide controls, always on screen, with the shell's reading controls at its right end",
  },
  "src/components/lab/frame.tsx": {
    for: "the only 1:1 surface the lab has: a same-origin iframe wearing a candidate as an adopted stylesheet, in scroll-locked rows",
    unspecimened: "it loads real pages; mounting one on a library page would load the site into the library",
  },
  "src/components/lab/specimen.tsx": {
    for: "the judged thing and the line that names it; a label is never inside the judged area and a stage never goes in a Cell",
  },
  "src/components/lab/apply.tsx": {
    for: "hands the whole site the exact block a ruling would land; a radio across a board, never a checkbox on each candidate",
  },
  "src/app/(dev)/design/sandbox/registry.ts": {
    for: "every standing board's spec, imported here and nowhere else, so the desk, the board page and the ledger read one list",
    unspecimened: "a registry; the boards are the specimens",
  },
```

Then one command, and `pnpm design:rules`:
```
grep -rl '@contract-for-pending' src | xargs sed -i '' 's/@contract-for-pending/@contract-for/'
```

**3. Optional, and the cleaner version of 2** (`scripts/design-rules/collect.mjs`, lab-rules'): add
`"src/components/lab"` to `COMPONENT_DIRS` so the kit is indexed like any component family rather than
only through its contracts. Then `(shell)/lab/kit/notes.ts` (my local `for`-line map, written in
`COMPONENT_NOTES`'s own shape and marked as a stand-in) can be deleted and the kit page can read the
index like every library page does.

**4. Optional** (`package.json`): a `"new-board": "node scripts/new-board.mjs"` script. Deliberately not
taken: `package.json` is nobody's lane in a parallel round and a one-line convenience is not worth a
contended edit. The script works as `node scripts/new-board.mjs <id> "<title>"` today.

### For lab-desk

`scripts/lab-review.mjs` does not exist yet (its lane). The review panel already emits the line it will
parse, matching `docs/reviews/README.md` exactly; verified live on the light board:
`review light r5: kit=land; cadence=8s "a hair slower would still read"; note: "read the kit block first"`
Unanswered asks are omitted rather than defaulted, ask ids and option tokens are emitted (never the
question text), and a note's inner double quotes are downgraded to single so the clause cannot break.

- Assets requested from Will: none. (The two the light board asks for and the one rounding asks for are
  the boards' own and already ride their specs' `assets`, which the meta panel now renders from one source.)

### Look at first

1. `/design/lab/light` at 1440. The first screen is the whole change: the question, the verdict in the
   heading face, what would change its mind, one line of what this round changed, then the nine calls as
   option pills with the recommendation filled and a "See it" link into the evidence. Compare it with any
   board still on the legacy path (`/design/lab/palette`), which opens with three paragraphs of history
   and puts the asks 17,000px down.
2. Press **Look first** in the dock. Six steps; step 2 sets the register to identity AND lands on the
   composer, and the URL follows, so the step is a coordinate rather than a link.
3. Scroll to **Rule on it** at the bottom. Answer two asks, type a note, press Copy as message. That line
   is the whole review protocol; the lab never writes the repo.
4. `/design/lab/rounding`, part A. Two real home pages side by side at true pixels, one wearing today and
   one wearing the candidate, scrolled together. Flip the surface rail in the dock: the same documents
   re-skin in place, no reload, no scroll lost.
5. `/design/lab/kit`. Twenty-two pieces with a line each, live specimens, and the sixteen traps, each one
   a round somebody already paid for.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The lab kit moved from `src/components/dev/board` to
`src/components/lab` and grew from four pieces to twenty-two: the `BoardPage` template, which renders a
board's spec answer-first in one fixed order for every board; `Frame`, the true-viewport iframe that
injects a candidate as an adopted stylesheet constructed in the frame's own realm and joins scroll-locked
rows; `Compare`, whose "what differs" line is required; the specimen furniture, the measurements that read
the computed cascade rather than a typed literal, `ApplyToSite`, the executable walk, and the review panel,
which composes one ledger line to paste into chat and never writes the repo. A board became two files, a
pure `spec.ts` and a `board.tsx` of evidence, with `registry.test.ts` pinning the density limits and
refusing a spec that imports React, CSS or its own board; `light` and `rounding` were migrated onto it and
lost their local copies of `Part`, `Knob`, `Paste`, `ApplyToSite`, `Cell`, `CostMeter` and `PageFrame`, a
discipline test refusing the next one. The fourteen landmines the boards had each paid for separately were
written down once in `traps.ts` and rendered on `/design/lab/kit`, and two more were found by red-teaming
the new code: a cross-origin `contentWindow` is a proxy whose first property access throws, which took a
whole board to its error boundary when a reader followed a link out of a frame, and an unwrapped six-option
toggle at 375 took the document into a horizontal scroll (1456px, now 391). The old path stays a re-export
shim until the last board migrates.
