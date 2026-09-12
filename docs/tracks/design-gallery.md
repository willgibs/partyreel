---
track: design-gallery
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "260c015"       # the launch-prep SHA the branch was cut from (docs: record MILESTONE-24)
preview: true           # Will's review surface: every push builds partyreel-git-lp-design-gallery
owns:
  - src/app/(dev)/design/page.tsx
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/catalog.ts
  - src/app/(dev)/design/lab-nav.tsx
  - src/app/(dev)/design/mode-shell.tsx
  - src/app/(dev)/design/theme-toggle.tsx
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/components/
  - src/app/(dev)/design/compositions/
  - src/app/(dev)/design/patterns/
  - src/app/(dev)/design/foundations/
  - src/app/(dev)/design/marketing/
  - src/app/(dev)/design/reference/
  - src/app/(dev)/design/rules/component-notes.ts
reads:
  - src/app/(dev)/design/rules/rules.ts
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/touchpoints.ts
  - scripts/design-rules/collect.mjs
  - src/components/dev/motion-tuner.tsx
---

# lp/design-gallery

**Goal.** The library becomes the reference agents actually pull from, so the bible can stay short
(Will, 2026-09-12: "an organized gallery of all of our components, with access to any variations or
helpful configs, for easy visual review" for him, and for agents "design system management to
maintain consistency while encouraging new explorations"). Today the five family pages hold about a
hundred hand-written `Spec` blocks, the index on `/design` has no per-component page or permalink,
there is no props or variants model, no reusable config panel (two board-local sliders only, in
`sandbox/glow-doctrine-variants.tsx` and `reel-parity/parity.tsx`), and notes exist for 11 of 84
components. The round: a per-component page or permalink with its specimen, its variants and its
contracts (the contracts already render on `/design/rules` and link from the index row; reuse the
artifact in `rules.ts`, never re-derive); a declared variants model per component (CVA variants
where they exist, a small declared list where they do not); one reusable config panel beside a
specimen; the family pages become the organized gallery; a `for` line for every component in
`component-notes.ts`. Big swings welcome: the gallery is a UI surface and the only law is the bible
plus each component's contract.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's). The library renders only
production imports and the reference kit (`marketing-library.test.ts`); every component in the
library's directories has a specimen or an `unspecimened` reason (`component-index.test.ts`); the
lab compiles its own utilities from `design.css` and never `@reference`s `globals.css`
(`css-source-policy.test.ts`); no keyframes declared in the lab. The tuner (`src/components/dev/`)
is the rounding round's, read it but leave it; the sandbox and `touchpoints.ts` are `home-hero`'s.

**Verify on.** partyreel-git-lp-design-gallery-partyreel.vercel.app: `/design?key=`, every family
page, one per-component page for a ui atom, a shared molecule and a marketing organism, at 1440 and
375, light and dark.

**Lane exception, ruled.** `src/app/(dev)/design/rules/rules.generated.json` is generated: a push that
adds a specimen, a component file or a contract regenerates it with `pnpm design:rules` (the
freshness guard says so) and the lane check accepts the file.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-design-gallery-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
