---
track: lab-library
status: handed-off
cut: "2644310d"
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

- none. Nothing in `docs/systems/` states a fact about the paths this track owns; the two
  ★ blocks this round leaned on (the `utilities.lab` sub-layer, the Kbd mono trap) are already
  written and are quoted by the component pages rather than copied.

## Deferred (ROADMAP one-liners, bucket named)

- Design lab: give the specimen source collector a `pnpm design:specimens` script beside
  `design:rules`, so the artifact is regenerated by name rather than by path
  (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`). The freshness test names the
  command, so nothing silently rots meanwhile.

## Handoff (replaces the chat report)

- Head: the tip of `lp/lab-library` (the sync merge `b6ab0b8`, this manifest committed on top),
  pushed; preview partyreel-git-lp-lab-library-partyreel.vercel.app.
- Synced with `launch-prep` at `34d7377` (it had moved 5 commits: the proxy gate and the lab links'
  prefetch; merged at `b6ab0b8`).
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 8 pre-existing warnings are all
  outside the lane), test ok (2007 in 205 files, 3 of them new), build ok (256 static pages),
  `pnpm lab:smoke --base http://localhost:3404` ok (248 checks, 0 failing, against `pnpm dev`).
  `pnpm design:rules` regenerated: no change (the collector does not read the notes).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file + the twelve owned
  `library/` page and entry files + all of `gallery/` + `reference/reference-ui.tsx` +
  `rules/component-notes.ts`. No exceptions; no production byte changed.
- Assets requested from Will: none.

### Shared-file changes asked of the Orchestrator

Three, all in `lab-shell`'s lane, all small. The first completes a feature of mine; the other two
are **bugs in Phase 0 that make the shell's table of contents invisible at every width**, which is
the single thing most worth fixing before Will reviews any track.

**1. `_data/nav.ts`: let the sidebar show an entry's badge** (this is the hook the manifest's
item 4 asks for; the data side is done).

```diff
       ...familyItems(family).map((it) => ({
         href: it.href,
         label: it.title,
         id: it.entry.id,
         note: it.note?.for,
+        badge: it.entry.badge,
         match: "exact" as const,
         keywords: [it.file ?? ""],
       })),
```

**2. The table-of-contents rail never renders.** `<aside className="lab-toc hidden xl:block">`
loses to production: `globals.css` emits `.hidden` into the `utilities` layer, `design.css` emits
`xl:block` into `utilities.lab`, and a nested layer loses to its parent. This is the ★ landmine
recorded at `docs/systems/design-system.md` "the lab's compiled utilities live in the
`utilities.lab` sub-layer", biting the shell itself: measured in the DOM at 1440, the rail computes
`display: none` while its content is correct. The inline disclosure does not cover it either, since
`xl:hidden` DOES apply there, so **above 1280 the lab has no table of contents at all**.
`design.css`'s own rules are unlayered, so they win; put the switch there.

```diff
 .lab-shell-body {
   display: grid;
   grid-template-columns: minmax(0, 1fr);
 }
+/* Not `hidden xl:block` on the element: production's `.hidden` outranks the
+   lab sheet's `xl:block` (the utilities.lab landmine). Unlayered wins. */
+.lab-toc {
+  display: none;
+}
 @media (min-width: 1280px) {
   .lab-shell-body {
     grid-template-columns: var(--lab-sidebar-w) minmax(0, 1fr) var(--lab-toc-w);
   }
   .lab-toc {
+    display: block;
     position: sticky;
```

```diff
-        <aside className="lab-toc hidden xl:block">
+        <aside className="lab-toc">
```

**3. `_shell/section.tsx`: the anchor sits on the `<section>`, not on the heading**, and `Toc`
scans `h2[id], h3[id]`, so no `Section` or `Sub` has ever appeared in the table of contents. A
family page still lists its components (their h3 carries the id), but a component's page lists
nothing, which is why it shows no table of contents at all. Move the id and the scroll offset onto
the heading; every existing `#id` deep link keeps working.

```diff
-    <section id={id} className={cn("pt-10 first:pt-6", SCROLL_MT, className)}>
+    <section className={cn("pt-10 first:pt-6", className)}>
       <div className="flex flex-wrap items-baseline justify-between gap-2">
-        <h2 className="font-heading text-lg tracking-tight">{title}</h2>
+        <h2 id={id} className={cn("font-heading text-lg tracking-tight", SCROLL_MT)}>
+          {title}
+        </h2>
```

(and the same move in `Sub`, from the wrapper `div` to its `h3`).

### Look at first

- `/design/library`: the front door is a reading order now: the health strip, **What binds you**
  rendered from `docs/design/README.md` itself (one home for the authority model, no second copy),
  **What changed** from the entries' own marks, then the families and the filtered index.
- `/design/library/glow`: the shape of every component page, and the best example of the round's
  point: **Landmines on this surface** lifts the three ★ blocks that name Glow out of the system
  doc, each linked to its heading. The matcher is narrow on purpose (the file path, the basename,
  or an exported name in backticks) and lights 10 of 87 components with no false positives.
- `/design/library/badge`: the smallest component page end to end: crumbs, the `for` line, the
  file, Configure, Variants, a specimen with **Preview and Code** (the JSX is derived from the
  entry module, never declared twice), Contracts saying "None" honestly, and the bible pointer.
- `/design/library/components`: a family page on the shell's sections; its table of contents
  content is already every component (check it in the DOM, or below 1280 where the inline
  disclosure shows, until ask 2 lands).
- `/design/library/foundations`: an anchor per token group, every swatch a live var, and every
  framed block now has the light-and-dark split the gallery had.
- The sidebar's `new` / `updated` marks are seeded from what this window actually changed
  (Caption is new; Button, RouteError, PageHero, CtaBand, StatBand, ScreenLamp, DemoTicket are
  updated) and appear on the home and in the index today, in the sidebar once ask 1 lands. They
  are cleared at the window's close.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The library moved onto the shell's own templates:
its five family pages, its component permalink and its home now compose `PageHeader`, `Section`,
`Pager`, `Ref`, `Tag`, `Callout` and `StatRow` instead of the framing kit written before the shell
existed, and `reference-ui.tsx` kept only what is genuinely the library's own (the reading column,
the wrapping row, the live swatch) with `RefHeader`, `RefSection` and `Spec` delegating. A component
page now answers what it is for, what it accepts, what it looks like and **what binds it**: its
contracts as the only rules that bind one file, and the ★ landmines of its surface lifted out of the
two system docs by naming it (10 of 87 components, no false positives). Every specimen gained
Preview and Code with the JSX DERIVED from the entry module rather than declared a second time
(`collect-specimens.mjs` into `specimens.generated.json`, held fresh by a test), and the frame it
sits in is now `Specimen`, since `Stage` was already the lab kit's word. `new` and `updated` became
data on a gallery entry, cleared at a window's close. The round also found that the shell's table of
contents rail has never rendered (the `utilities.lab` landmine) and that no `Section` anchor reaches
it; both fixes are one-liners in the shell's lane.
