---
track: lab-shell
status: integrated
cut: "2644310d"
merged: "90f23288"      # the branch head merged into launch-prep
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

- none

## Deferred (ROADMAP one-liners, bucket named)

- Lab & design system: the shell's `Section` puts its id on the heading; the gallery's older
  `RefSection` (`reference/reference-ui.tsx`, lab-library's lane) still puts it on the wrapper. The
  table of contents reads both, but one shape is better than two: fold `RefSection` into `Section`.
- Lab & design system: `design.css` still carries the `.mono` dark ground for the two legacy
  marketing boards (`marketing-decomposition`, `marketing-hero-substrate`); it goes when they retire
  to the record in the migration wave.

## Handoff (replaces the chat report)

- Head `832f1b4b`, pushed; preview partyreel-git-lp-lab-shell-partyreel.vercel.app
- Synced with launch-prep at `995959c4` (the library and the rules layers), merged clean, no conflicts
- Gates on the synced tree: typecheck ok, lint ok, test ok (2085 in 210 files), build ok (256 static
  pages), `pnpm lab:smoke --base http://localhost:3417` ok (262 checks, 0 failing)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this manifest plus `(shell)/layout.tsx`,
  `(shell)/_shell/*`, `_data/{catalog.test,nav,search,state}.ts` and `design.css`. No exceptions.
- Shared-file changes asked of the Orchestrator: none. The three you asked for are all in, plus the
  `it.entry.badge` read, now typed directly (`EntryBadge` is `Extract<NavBadge, …>`, derived from the
  shell's own union, so no bridge was needed once lab-library landed).
- Assets requested from Will: none
- **Two removals to read by eye.** (1) `_shell/preview-code.tsx` is DELETED: `gallery/specimen.tsx`
  now frames a specimen with the real Tabs primitive, which is what Phase 0's `PreviewCode` imitated,
  and it had no consumers left. If `lab-kit` or `lab-desk` added one on their branch, point it at
  `Specimen` instead. (2) `PageHeader` no longer reports its description, badges and meta as data:
  those props are usually ELEMENTS (a `<Ref>`), and a reader of the React tree sees a component's
  children but never what it renders, so `Enforced by` copied as an empty line. They are read from
  the rendered header by structure instead; the title and the trail still come from the props.
- Look at first: `/design/library/doctrine/design-system` at 1440 (the rail, with its h3s indented
  under their h2s, and Back to top), then ⌘K and type `glow`, `bible 22`, `landmine`, `stage`; then
  `[` and `]` from any page; then Copy page on `/design/library/policies` and paste it somewhere.
  At 375: the menu opens the sheet, the compact "On this page" names the heading you are in.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The lab shell went from Phase 0's skeleton to the
grade the round asked for. `_data/state.ts` gave the lab one URL vocabulary (`key`, `canvas`,
`ground`, `candidate`, `s`, `session`) split sticky from local, so the reading context rides every
link and a page's own position never leaves it, plus the keyboard contract as a pure function; the
desk's review session plugs into `useDigitKeys` for `1`..`9`. `_data/search.ts` and `buildSearchIndex`
put every rule, component, board, policy, landmine, record entry, doc heading, proposal, track,
ruling and glossary term in one index behind ⌘K. Three faults that hid the table of contents were
fixed at their source: `Section` anchored its wrapper rather than its heading; a collapsed disclosure
kept 8px because a grid item's padding survives `0fr`; and ★ `hidden xl:block` lost to production's
`.hidden`, because `xl:` display utilities exist only in the lab and so compile into the losing
`utilities.lab` sub-layer, which meant no rail above 1280 at all. Copy page writes real markdown now,
the sidebar is a sheet below `lg`, and `PreviewCode` retired to `gallery/specimen.tsx`.
