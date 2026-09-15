---
track: lab-shell
status: open
cut: "2644310d"
preview: false
owns:
  - src/app/(dev)/design/(shell)/layout.tsx
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/_data/catalog.ts
  - src/app/(dev)/design/_data/catalog.test.ts
  - src/app/(dev)/design/_data/nav.ts
  - src/app/(dev)/design/_data/search.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/theme-toggle.tsx
reads:
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/docs.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/glossary.ts
  - src/app/(dev)/design/_data/tracks.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/dev/board/lab-prefs.ts
  - src/components/dev/board/board-page-context.tsx
  - src/components/dev/board/dock.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - .agents/skills/emil-design-eng/SKILL.md
---

# lp/lab-shell

**Goal.** Bring the shell to shadcn's grade on the emil skill. Phase 0 built the skeleton (plain, tested):
`(shell)/layout.tsx` builds the nav server-side (`_data/nav.ts`) and hands it to `_shell/shell.tsx`
(the top bar, the sidebar, the content column, the table of contents); `_data/catalog.ts` is the nav
model with `activeItem`, `breadcrumbs`, `neighbours`, `filterNav`; `PageHeader`, `Section`, `Pager`,
`Ref`, `Tag`, `Callout`, `StatRow`, `PreviewCode`, `CopyPage`, `WidePage` are the templates every page
composes (`_shell/index.ts`); `design.css` carries the grid (240px sidebar at `lg`, a 200px TOC rail at
`xl`, `[data-lab-wide]` pages drop the rail and honour the `sidebar` preference). Make it beautiful and
fast: (1) the motion and density of the top bar, the sidebar and the TOC (motion by frequency; the
sidebar's sections open and close with intent; the active item, the badges, the counts); (2) the ⌘K
palette over `ui/dialog.tsx` on one search index (`_data/search.ts`: pages, rules, policies,
landmines, components, boards, record entries, doc headings, proposals, tracks, rulings, glossary
terms, built beside the nav, scored `id exact > title prefix > word in title > keyword`, grouped by
kind); (3) keyboard: ⌘K, `[` and `]` for prev and next, `1`..`9` to pick an option in a review
session (the desk track owns the session; you own the key handling contract in `_data/state.ts`);
(4) the mobile sheet (`ui/sheet.tsx`) for the sidebar below `lg`, the inline TOC below `xl`, a static
dock on a phone; (5) state in the URL (`_data/state.ts`): one small param model the kit's declared
controls and the desk's review session serialise to (`?key=…&canvas=phone&candidate=b&s=palette-ramp`),
so a link is an exact view; `LabLink` preserves the key and any state; `CopyLink` copies the current
state; (6) `CopyPage` becomes markdown built from the page's data, not innerText; (7) the lab's own
look on the real tokens (no `.mono`, no lab-only face), the `Tag` tones, the `Callout` kinds, the
`PreviewCode` block with Code as the default second tab everywhere a specimen shows. Keep every
existing page working (they import `_shell/*` by name; change a signature and fix every consumer in
the same commit, or add rather than rename). Everything in `_data/catalog.test.ts` stays green and
grows with what you add.

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

**Verify on.** `/design/library` and `/design/lab` on `pnpm dev` at 1440 and 375, light and dark, reduced motion:
the two areas; the sidebar lights a component's family from its permalink and a rule's group from its
permalink; the TOC follows scroll on the bible, a doctrine page and a proposal; prev/next across rules,
components and boards; ⌘K finds a rule id, a component, a board, a policy, a glossary term; Copy page
pastes readable markdown; the 375 sheet, the inline TOC, the static dock. `pnpm lab:smoke` green.

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
