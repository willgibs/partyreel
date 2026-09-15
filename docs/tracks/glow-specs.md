---
track: glow-specs
status: handed-off
cut: 1b647d76
preview: false
owns:
  - src/app/(dev)/design/sandbox/glow-doctrine/
  - src/app/(dev)/design/sandbox/glow-moments/
  - src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx
  - src/app/(dev)/design/sandbox/glow-moments-variants.tsx
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/app/(dev)/design/sandbox/glow-lab.css
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/rounding/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/[board]/page.tsx
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/lab/kit-discipline.test.ts
  - scripts/new-board.mjs
  - docs/decisions/design-record.md
  - docs/reviews/README.md
  - docs/design/README.md
---

# lp/glow-specs

## Round 1 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The two glow boards get a spec each and render through the template: `sandbox/glow-doctrine/spec.ts` and
`sandbox/glow-moments/spec.ts` with the board's question, its one open ask (from `touchpoints.ts`'s note and
`docs/decisions/design-record.md#glow-doctrine` / `#glow-moments`), the candidates as recorded, and a single
section whose evidence mounts the existing component unchanged (`glow-doctrine-variants.tsx`,
`glow-moments-variants.tsx`); `sandbox/glow-doctrine/board.tsx` and `sandbox/glow-moments/board.tsx` compose
`BoardPage`; the variants files and `glow-lab-shared.tsx` / `glow-lab.css` move under the two directories
if that keeps the lane clean, or stay where they are with the boards importing them. The light board already
holds the doctrine's future (its round-four synthesis), so the two specs say so in `context` and ask only
what is still theirs to ask.

**The migration contract (every board in the wave).** A board is two files on the kit: `sandbox/<id>/spec.ts`,
pure data through `defineBoard` (the question; `round {n, date, changed}` with this round's line; `history`
from this manifest's rounds; `context` for how the board got here; the `verdict`; the `asks` Will answers in
one word each, with stable kebab ids, one-token options, the recommendation, `because`, `overrule` and the
`evidence` section; the `candidates` with their rationale, departures and assets; the `departures` from a
bible rule, a ruling or precedent with their cost; the `assets` in the ASSETS.md shape; the `sections` with
a title and a one-line lede, arguments collapsed; the page-wide `controls` the dock renders; `lookFirst` as
an executable walk; `notes` as the builder's; `links {bible, record, track, spec, pages}`); nothing about
the board is scraped from JSX any more, and `sandbox/registry.test.ts` pins the density limits and refuses
a spec that imports React, CSS or the board. And `sandbox/<id>/board.tsx`, the client composition:
`BoardPage({spec, dock, evidence, review})` from `@/components/lab`, the evidence per section as a
function of the declared state (`useBoardState`), the kit's `Frame`, `Compare` (its `differs` line
required), `Specimen`, `ApplyToSite`, `CostMeter`, `Walk`, `Paste`, `Loupe`, `SelectTable`, `ConceptCard`,
`useReplay`, `useMotionState` in place of the board's local copies (`kit-discipline.test.ts` refuses a
local `Row|Part|Knob|PageFrame|ApplyToSite|CostMeter|Paste|CellLabel|Labeled|Cell|BoardIndex|RuleIndex`
once the board's id leaves its LEGACY list); no prose before the first section (the template has no slot
for it); every ask restated from the same array; comparisons name their distinction; captions never sit
inside the judged area; never zoom, scale or transform a judged specimen (1:1 is the law of the lab).
Read `sandbox/light/{spec.ts,board.tsx}` and `sandbox/rounding/{spec.ts,board.tsx}` whole first: they are
the pilots and the model. Keep what is genuinely the board's own (a candidate's engine, a sourcing sheet, a
scoped token block) and delete the rest of its shell code. No candidate, number or recommendation changes
in a migration unless the manifest's round says so: the wave moves the argument, it does not re-argue it.

**Registration, three lines you may edit for YOUR board id only** (declared as exceptions in the Handoff;
the Orchestrator resolves the adjacent-line merges): `sandbox/registry.ts` (import the spec, add it to
`BOARDS` in the list's existing order), `(shell)/lab/boards.ts` (drop `legacy: true` on your entry),
`src/components/lab/kit-discipline.test.ts` (delete your id from `LEGACY`). Nothing else outside your
lane; a shared-file change is asked for in the Handoff with the exact patch.

**Verify.** The board on your dev server at 1440 and 375, light and dark, reduced motion honoured: the
answer block first with the ask pills linking under the dock; every section anchored and in the dock's
Sections menu; arguments and pastes collapsed; the walk's steps set the dock and land on their section; a
copied link reopens the same canvas, candidate and section; the review panel's copied message parses with
`pnpm lab:review '<line>'` against a SCRATCH copy of `docs/reviews/` (never commit a ledger); `/design/lab`
queues the board's open asks; the gate green (typecheck, lint, test, build) and `pnpm lab:smoke --base
http://localhost:<your port>` green. Light QA (Will, 2026-09-14): a lab-only round verifies its board and
moves on; the red-team belongs to the wiring round. Push freely (no CI on `lp/*`); the preview builds at
`status: handed-off`.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Never edit another track's files, `touchpoints.ts`, `rules/bible.ts`,
CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md` or
`docs/reviews/`. No em-dashes and no `font-mono` anywhere a person reads.

**Verify on.** `/design/lab/glow-doctrine` and `/design/lab/glow-moments` on your dev server at 1440 and
375, light and dark, reduced motion; `/design/lab` shows both boards' open asks; the gate and
`pnpm lab:smoke` green.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (round 1)

- Head is the commit carrying this record; the code landed at `2014616f`. Pushed; the preview at
  partyreel-git-lp-glow-specs-partyreel.vercel.app builds on this push (`status: handed-off`).
- Synced with launch-prep at `1b647d76`: it had not moved since the cut (`git rev-list --count
  HEAD..origin/launch-prep` = 0), so no merge was needed.
- Gates on the tree, each on its own exit code: typecheck ok, lint ok (0 errors, the 6 pre-existing
  warnings, none in this lane), test ok (218 files, 2140 tests), build ok (128 routes),
  `pnpm lab:smoke --base http://localhost:3419` ok (285 checks, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/glow-specs.md`, `sandbox/glow-doctrine/{spec.ts,board.tsx}`,
  `sandbox/glow-moments/{spec.ts,board.tsx}`, plus the two registration files,
  `sandbox/registry.ts` (both specs imported, added to `BOARDS` in the sandbox's own order) and
  `(shell)/lab/boards.ts` (the two entries point at the new compositions and drop `legacy: true`).
  **The third registration line was not needed:** `kit-discipline.test.ts`'s `LEGACY` is keyed to a
  sandbox DIRECTORY and these two boards had none, so neither id was ever on it. Nothing else in the
  diff; `glow-lab-shared.tsx` and `glow-lab.css` were not touched at all.
- **The variants files stayed at the sandbox root, deliberately.** Moving them would have broken two
  files outside this lane: `src/components/shared/glow-contract.test.ts:550-551` pins the BorderBeam
  call sites as an exact path list, and `src/components/dev/border-beam-vendor.test.ts:102-103`
  `readFileSync`s both paths (it throws, not fails, if either moves). Three docs cite the same paths
  (`docs/systems/design-system.md:232`, `docs/tracks/light.md:234-235`, `design-record.md:416,429`).
  The boards import `../glow-<board>-variants`; `glow-lab-shared.tsx` and `glow-lab.css` stay for the
  plainer reason that BOTH boards use them.
- Shared-file changes asked of the Orchestrator: **one, optional, in `touchpoints.ts`.** Both boards'
  header now reads "Track: no manifest (a standing board)" and their sidebar badge reads "exploring"
  rather than a round, because `_data/nav.ts:135` and `[board]/page.tsx` both resolve
  `r.board?.tracks ?? [r.id]` and no manifest is named `glow-doctrine` or `glow-moments`. The patch is
  one line inside each of the two `board: { ... }` objects (touchpoints.ts:428 and :443):
  `tracks: ["glow-specs"],`. It is not needed for anything to work; it makes the pair point at the
  manifest that now owns them.
- Assets requested from Will: none (both specs declare `assets: []`, so the meta panel prints "none").
- Look at first: `/design/lab/glow-doctrine` and `/design/lab/glow-moments`. The first screen is the
  whole change: the question, the verdict, and ONE ask each, where there used to be fourteen sections
  with the unruled item halfway down. Then press **Look first** in the dock (it sets the dock's note
  and lands on the section) and check the ask pill's **See it**. The asks are deliberately about WHERE
  each open item closes, not a re-argument: `docs/tracks/orchestrator.md` item 4 already records the
  lit surface and the publish beat's violet as the `light` board's asks, so ruling them twice would
  write two contracts for one shadow and two homes for one beat. `/design/lab` now queues both
  (16 waiting on you, the two at the top of the list).

### Verification walked

- Both boards at 1440 and at 375, dark and light: the answer block first, the ask pill under it with
  its options and its "See it", the index, one anchored section, the review panel, the meta panel and
  a collapsed "How it got here". No horizontal overflow at 375 (`scrollWidth` = 375), no `font-mono`
  anywhere on either page, the argument, the wiring and the history folds all collapsed by default.
- The walk fires on both: the dock shows "Walk 1 of 1" with the step's note and the page lands on the
  section. Note, for the next agent: it only does so in a FRONTED tab, since a background tab throttles
  `scrollIntoView({behavior:"smooth"})` to nothing, which reads exactly like a broken walk. A hidden
  browser pane also returns blank screenshots of a page the DOM says is fully painted. Both are
  tooling, not the product (`docs/systems/testing-verification.md`).
- The review round trip, on a SCRATCH copy of `docs/reviews/` (nothing written into the repo, `git
  status` clean): `pnpm lab:review --dry 'review glow-doctrine r4: lit-surface=light "..."'` and
  `'review glow-moments r4: publish-violet=here; note: "..."'` both parse; the same lines written
  against `--root <scratch>` produced well-formed ledgers; and `lit-surface=maybe` was refused with
  `line 1, column 38: "maybe" is not an option of glow-doctrine.lit-surface (light, here)`.
- Reduced motion: neither new file declares a single animation or transition (a spec is data, a board
  is a two-line composition), so the pages inherit the global guard in `globals.css:862-869` and the
  engine's own, both unchanged. The 17 animated elements inside each board are the unchanged
  component's lamps, which the board's own section 07 is the instrument for.

## Record (round 1; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The two glow boards joined the migration wave and
now render through the kit's template: `sandbox/glow-doctrine/` and `sandbox/glow-moments/` each got a
`spec.ts` carrying the question, the round and its history, the verdict, the candidates as recorded
(the six shapes, the thirteen placements), the departures and one section, plus a `board.tsx` that
composes `BoardPage` with that section's evidence mounting the existing variants component unchanged.
Both rounds were settled but for one line each, so the wave moved the argument and not the furniture:
no law, shape, placement, number or verdict changed. Each board now asks exactly one thing, and asks
it as a question of WHERE it closes rather than as a re-argument, because the orchestrator's record
already carries the lit surface carve-out and the publish beat's violet as the `light` board's asks;
the answer block says so. The variants files and the boards' shared sheet stayed at the sandbox root,
since `glow-contract.test.ts` and `border-beam-vendor.test.ts` read them by their exact paths;
`/design/lab` now queues both open asks.
