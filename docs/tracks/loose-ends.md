---
track: loose-ends
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "46cb1737"         # the launch-prep SHA the branch was cut from
board: loose-ends       # round one: the ROADMAP's small design decisions, drawn so Will can pick
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/loose-ends/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - src/app/globals.css
  - src/components/admin/metrics-charts.tsx
  - src/components/marketing/faq-accordion.tsx
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/features/album/getting-in-stage.tsx
  - src/components/marketing/sections/features/album/review-switch.tsx
  - src/components/marketing/sections/features/album/everywhere-stage.tsx
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/loose-ends

**Goal.** Round one of `loose-ends`: six design decisions that sit in the ROADMAP as prose nobody can
pick from (the type-phone lesson: a roadmap line is not something you can pick from), each drawn on its
real surface with three or four close options and one recommendation, authored with `defineExploration`.
**Not in this round:** any production byte (a pick is wired later, most in one small sweep), the fixes
that are not decisions (the dialog title's leading, the sign-in button's size, the literal corners: those
are code, not choices), anything a standing board already asks.

**Binds.** The bible, the contracts, the policies; `docs/PROGRAM.md` "A round returns DECISIONS". Copy is
placeholder judged for size and wrapping (the `voice` board rules the words).

## The decisions (each drawn at its real size; a phone where the surface is a phone)

1. **The admin chart ramp's cast** (ROADMAP: "`--chart-1..5` is still chroma 0 beside Graphite's cool greys;
   a cast on five greys is a ruling"): today's neutral ramp / Graphite's cool cast (hue 286, a whisper of
   chroma) / a single accent series with the rest grey / a warm cast. Drawn on the real `MetricsCharts`
   with fixture data, in BOTH modes as separate steps (dark and light are chosen separately).
2. **One FAQ, one look**: the home and pricing accordion sets its questions on the card step (Urbanist
   16/600); the shared `FaqAccordion` (/events, the feature pages) sets Inter 14/500 in a `<summary>` that
   is not a heading. Options: the card step everywhere / the shared accordion's look everywhere / a third
   that names the question as a heading on the ladder. Drawn on both FAQs at 1440 and 375.
3. **The home hero between 768 and 1023** (`hero-stream.ts`, solved at two breakpoints: a tablet wears the
   phone's card size and measure): today / a third `Geo` composed for 768 to 1023 (say its numbers) /
   the desktop geometry from 768. Drawn in a real 900 px Frame; the phone and 1440 are unchanged.
4. to 6. **The album page's ambient pieces** (ROADMAP: "a focused round judged on Will's screen"): the
   phone's screen cycle (`getting-in-stage.tsx`: what it cycles and at what pace, against the home hero's
   pace, never a cap), the Live | Review photograph (`review-switch.tsx`), and the lightbox pill on the
   Everywhere stage (`everywhere-stage.tsx`). Three or four close options each, drawn in place on the
   real /features/album sections at 1440 and 375.

Every option is drawn, by construction; every tile is checked against its words before handoff.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED, NO DOCK, frozen, or whose stage
starts lower than 0.6 of a screen. The worked example is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.
Where a production component takes no prop for what you vary, copy it into your directory and say so in the
Handoff; edit no production file.

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (copy river-card's shape, `board` block
  included);
- `touchpoints.test.ts` takes NO line.
Other lanes add theirs at the same places; the Orchestrator merges keep-both. Never reorder or reformat.
`pnpm design:rules` regenerates the artifacts (allowed in the lane check).

## Verify, and the gate

The board at 1440 and 375, reduced motion honoured. Dev server on port 3133, stopped by port
(`lsof -ti tcp:3133 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on its own exit
code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
`pnpm lab:demo --board loose-ends --base http://localhost:3133` (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke, lab:demo
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + the generated files
- Each decision, one line: the surface, the options, the recommendation and why
- Captures (paths): every option at its true size beside its words
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
