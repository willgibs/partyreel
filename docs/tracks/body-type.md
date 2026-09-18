---
track: body-type
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5e03ffe2"         # the launch-prep SHA the branch was cut from
board: body-type        # round one: the body and label ladder as decisions, before any sweep
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/body-type/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - src/app/theme.css
  - src/lib/utils.ts
  - src/lib/type-ladder-policy.test.ts
  - src/components/ui/button.tsx
  - src/components/guest/event-experience.tsx
  - src/components/app/event-card.tsx
  - src/components/admin/metrics-charts.tsx
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/body-type

**Goal.** Round one of `body-type`: the body and label sizes as a LADDER, designed as decisions before
any sweep. Will's ruling (2026-09-18, on "everything should be addressed in our design system type
ladder"): yes, it reaches body and label sizes; one question-first board first. Six to eight decisions
with `defineExploration`, each drawn on the real surface it governs at its true size. **Not in this
round:** any production byte (the wiring sweeps the sites onto the steps once he rules; about 920 of them),
the heading ladder (ruled and shipped: ten steps in `theme.css`), the words (the `voice` board's).

**Binds.** The bible (5: every heading sits on a step and the steps keep their order at every width; the
same law is what this board extends to body copy), the contracts, the policies:
`src/lib/type-ladder-policy.test.ts` holds the five ways the ladder fails silently (a step name the colour
namespace already owns, a step `cn()` has never heard of, a ramp coming back, the order breaking at one end,
a stock size on a heading). Read it first: every step you propose must be nameable (no `--text-<x>` where
`--color-<x>` exists), declarable in `TYPE_STEPS`, and ordered under `card-title` (16px) at both ends.
`docs/design/guidance.md`'s guest reading-copy rule (guest reading copy 15 to 16px; host and admin on 14)
is the precedent this board replaces with a ruling.

## What is measured (the tree at the cut; the numbers on the steps come from here, re-measured)

- The heading ladder is ten steps in `src/app/theme.css` (`--text-display` down to `--text-card-title` at
  1rem), each a size, line-height and letter-spacing triple, the marketing steps fluid clamps between 375
  and 1440; `TYPE_STEPS` in `src/lib/utils.ts` declares them to `cn()`.
- Below `card-title` nothing is on a ladder. Production outside the lab carries `text-sm` 366 times,
  `text-xs` 243, `text-[11px]` 88, `text-[10px]` 60, `text-base` 25, `text-[15px]` 24, `text-lg` 21,
  `text-[13px]` 8, `text-[17px]` 2. By surface (sm / xs / base): marketing 141 / 108 / 5, the app 44 / 36 / 1,
  the guest 8 / 14 / 8 plus 11 of the `text-[15px]`, admin 12 / 9 / 0, ui 29 / 9 / 4.
- Small labels carry their own tracking by hand: `tracking-[0.14em]` 31 sites, `tracking-wide` 21,
  `[0.16em]` 5, `[0.08em]` 5, `[0.24em]` 3, `[0.4em]` 2.
- Buttons: the base is `text-sm`, `xs` is `text-xs`, `cta` is `text-base` (`src/components/ui/button.tsx`).
- The document sets no base size (`globals.css` `body` applies colour only), so 16px is the browser's.

## The decisions (six to eight; each option drawn on the real surface at true size, a phone where the surface is a phone)

1. **A guest's reading copy** (the event description, the gate prompts, the entry sheet's rows: 15 and 16
   today): 15 / 16 / 17, drawn on the real guest page at 375 (`tile: "phone"`).
2. **The app's working body** (the host's dashboard and the admin's tables: 14 today): 14 / 15 / 13, drawn
   on the dashboard and an admin table at 1440. It decides whether "host and admin on 14" survives.
3. **Marketing reading copy** (paragraphs under headings: 18, 17 and 16 today): one step, drawn on a feature
   page at 1440 and 375; the options include fluid (a clamp like the heading steps) and fixed.
4. **The caption step** (counters, captions, secondary labels: 12, 11 and 10 today) and its FLOOR: 12 / 11 /
   10 as the smallest size the product ever sets, drawn on the masonry's badges, the event card's badges and
   an admin table's meta.
5. **The label step** (uppercase eyebrows and small labels with tracking): a size and tracking PAIR (three or
   four pairs from the measured spread), drawn on a marketing eyebrow and an app section label.
6. **Buttons on the ladder**: buttons take the body step / keep their own three sizes / one size everywhere,
   drawn on the real Button sizes.
7. **Line height**: a fixed pair per step (the heading ladder's shape) / one ratio for the whole body ladder,
   drawn on a paragraph at both widths.
8. (Optional, if the drawing surfaces it.) **The names**: the step names the ladder will use, checked against
   the colour namespace and `cn()`, offered only if two good namings exist.

Say each option's numbers on the step. Prefer more rounds of narrower questions to one wide one: if eight is
too many to draw well, stage the label and button questions `after` the body steps.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED, NO DOCK, frozen, or whose stage
starts lower than 0.6 of a screen. The worked example is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.
Vary a size from OUTSIDE (a class on a wrapper in your board's sheet, the way `gallery-width` set
`column-width` from its own sheet), or copy the section into your directory; edit no production file. A
`vw` clamp reads the browser's width, so a 375 column drawn on a 1440 page must be a real `Frame` (the trap
in `src/components/lab/traps.ts`).

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

The board at 1440 and 375, reduced motion honoured, every size measured on screen (computed font-size and
line-height read off the real element, never assumed). Dev server on port 3134, stopped by port
(`lsof -ti tcp:3134 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on its own exit
code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
`pnpm lab:demo --board body-type --base http://localhost:3134` (0 failing).

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
- Each decision, one line: the surface, the options with their measured numbers, the recommendation and why
- Captures (paths): every option at its true size beside its words
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
