---
track: lab-library
status: open
cut: "<filled at boot: the launch-prep SHA you cut from>"
preview: false
owns:
  - src/app/(dev)/design/(shell)/library/page.tsx
  - src/app/(dev)/design/(shell)/library/index-list.tsx
  - src/app/(dev)/design/(shell)/library/[id]/
  - src/app/(dev)/design/(shell)/library/components/
  - src/app/(dev)/design/(shell)/library/patterns/
  - src/app/(dev)/design/(shell)/library/compositions/
  - src/app/(dev)/design/(shell)/library/marketing/
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/reference/
  - src/app/(dev)/design/rules/component-notes.ts
  - src/app/(dev)/design/rules/component-index.test.ts
reads:
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/_data/catalog.ts
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/rules/rules.ts
  - src/app/(dev)/design/rules/rules.generated.json
  - src/app/(dev)/design/touchpoints.ts
  - src/components/ui/tabs.tsx
---

# lp/lab-library

**Goal.** The library on the shell templates: the home, the component page, the family galleries, the
tokens. (1) The home (`/design/library`): a reading order for a new agent (what binds you, what
changed, every component), the health strip's numbers when the rules track exposes them (read its
`influences.ts` when it lands; until then the counts you can derive from the artifact), the index with
the local filter kept. (2) The component page (`[id]`): `PageHeader` with the family crumb, the
`for` line, the file as a `Ref`; the playground; the variants; the specimens each in `PreviewCode`
(Preview and Code, the code being the specimen's JSX from the entry); the contracts as the
component-exclusive rules (titles, each a `Ref` to its test line); its surface's landmines (through
the rules track's `bindsFor` when it lands, else the two docs' ★ blocks that name the file); "and the
bible" as the one global pointer; prev/next in family order through `Pager`. (3) The family
galleries on `Section`s with anchors so the TOC lists every component; the tokens page (`foundations`)
with anchors per token group and every swatch a live var. (4) `new`/`updated` badges as data on a
gallery entry (`gallery/entry.ts`: a `badge` field the nav reads; ask the shell track to read it in
`_data/nav.ts`), cleared by the Orchestrator at a window's close. (5) The gallery's frame renamed
`Specimen` (`Stage` is the kit's word); `reference-ui.tsx` folded into the shell templates where they
overlap (`RefHeader` already delegates to `PageHeader`; `RefSection` to `Section`; `Spec`, `Row`,
`Swatch` stay if the tokens page needs them). (6) Every `for` line current (`component-notes.ts`), the
route prose in it on the new routes, `component-index.test.ts` green. Keep every permalink and family
route; the smoke crawls them.

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

**Verify on.** `/design/library`, `/design/library/button`, `/design/library/glow`, `/design/library/marketing`
and `/design/library/foundations` on `pnpm dev` at 1440 and 375, light and dark: the crumbs, the
specimens with Preview and Code, the contracts on the component only, the landmines of its surface,
prev/next in family order, the TOC listing every component of a family, a `new` badge in the sidebar
from an entry's field. The gate and `pnpm lab:smoke` green.

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
