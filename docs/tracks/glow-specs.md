---
track: glow-specs
status: open
cut: "<filled at boot: the launch-prep SHA you cut from>"
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (round 1)

- Head <sha>, pushed; preview partyreel-git-lp-glow-specs-partyreel.vercel.app
- Synced with launch-prep at <sha>
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages), lab:smoke ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines (exceptions and why)
- Shared-file changes asked of the Orchestrator: none
- Assets requested from Will: none
- Look at first: ...

## Record (round 1; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
