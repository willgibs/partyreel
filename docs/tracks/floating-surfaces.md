---
track: floating-surfaces
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/floating-surfaces/
reads:
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/tooltip.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/select.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/drawer.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/navigation-menu.tsx
  - src/components/guest/entry-shell.tsx
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/app/(dev)/design/sandbox/variant-frame.tsx
  - src/app/(dev)/design/rules/bible.ts
  - docs/systems/design-system.md
---

# lp/floating-surfaces

**Goal.** The floating-surfaces exploration of the review wave (2026-09-14). Bible 15 (every floating surface rides one contract: one radius, one entrance, one light) gets its dedicated exploration: every floating primitive on every ground at both widths, today beside two candidate treatments of radius, entrance and light-or-shadow in dark, with the outliers brought onto whichever contract wins. Lab only: no production byte changes on this track.
**Rulings in force.** The bible's second edition: rule 15 (under exploration, naming this board), rule 8 (tokens, never literals: floating layers take `--radius-float`), rule 9 (radius plus offset), rule 10 as rewritten (a shadow is allowed where a layer sits over content), rule 12 (animate by frequency; custom easing on every control), rule 14 (reduced motion).
**Verify on.** `/design/c/floating-surfaces?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

## The brief

### The question

If the floating layer were designed today, what is its radius, its entrance and its light on every ground, and what happens to the primitives that stand outside it?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **Nine primitives** in `src/components/ui/`: dialog, drawer, dropdown-menu, popover, select, sheet,
  sonner (toast), tooltip, navigation-menu (no command, hover-card or context-menu).
- **On the contract** (`docs/systems/design-system.md` "THE FLOATING-LAYER CONTRACT": `rounded-float` +
  `shadow-float` + an origin-aware `transform-origin` + `fade-in-0`/`fade-out-0` beside the zoom + one
  house clock on `--ease-emphasis`): dropdown, popover, tooltip, dialog and the nav viewport.
- **The outliers:** `select.tsx:65` is stock shadcn (`rounded-md` at 1.6 px, a raw `shadow-md` that
  draws in dark, no house ease; `:40` the trigger's `shadow-xs`); `drawer.tsx:59` has the radius but no
  shadow; `sheet.tsx:67` is square by side; sonner is themed by CSS vars; `guest/entry-shell.tsx:99`
  derives its radius from `--radius-action`; `navigation-menu.tsx:218` has a `shadow-md` arrow.
  `ui/drawer.tsx` and `ui/tabs.tsx` have no product call site and `ui/select.tsx` and `ui/sheet.tsx`
  exactly one each (ROADMAP), so "drop it" is a legal answer for an outlier.
- **Tokens:** `--radius-float: 0.5rem` (`globals.css:128`, "menus/tooltips/toasts: sharp reads broken");
  `--shadow-float` (`:190-191`, zeroed in `.dark` and `.surface-ink`); the derivation at `theme.css:79-90`
  (`--radius-float` is a pass-through alias). The Orchestrator's rounding round retunes VALUES mid-window
  and announces it in `docs/tracks/orchestrator.md`; never a token name.
- **The light question interacts:** the `light` board asks where a shadow returns in dark; a layer
  over content is exactly that case, so this board shows both answers (lighter-is-closer alone, and
  with a soft shadow) rather than waiting.
- **The ring lift** (`ring-1 ring-foreground/5`, 37 uses) is the undocumented depth idiom on cards; a
  floating layer may want it or not.

### The board

Every primitive rendered live (real components from `src/components/ui/`, opened on the board) on
cinema, paper and ink, at 1440 and 375, today beside two candidate treatments: the radius (sharp,
today's 8 px, rounder, and how it relates to `--radius` and `--radius-action`), the entrance (the
origin-aware zoom-fade at one clock, or a slide for sheets and drawers, or something better), the
light (lighter-is-closer alone, with a soft shadow in dark, with a lit edge). The phone canvas is
primary for sheets, drawers and dialogs (guests live there); the desktop canvas for menus, popovers
and tooltips. The outliers (select, drawer, sheet) shown brought onto each candidate, or dropped. The
proposal is the contract's five lines rewritten plus a per-primitive table in the Record. The asks:
the contract (radius, entrance, light or shadow in dark); the outliers (onto the contract, or
dropped).
### The deliverable

The board, plus the rewritten contract in the Record. Read `components/ui/*`; change none of them.

### The rules of this wave (every track)

- **Rising tides (bible 22).** Judge the system from the ground up: what would the perfect version
  be if none existed? If today's tokens point there, the candidates are tunings; if the perfect
  version deviates, a candidate replaces the system and says so as a departure in `BoardMeta`. The
  three candidates on a board span that range; they are never three shades of one answer. A
  candidate may question a bible rule: that is a finding, written in this manifest, ruled by Will.
- **The board shell.** `src/components/dev/board/` is the shell: `Stage` (a real viewport on a
  real ground, `cinema | paper | ink | app-dark | app-light`, zoom-fitted, `data-paused` on a hidden
  tab), `Toggle`, and `BoardMeta` (the question, the candidates, the asks, the departures, the
  assets). The stub in your directory shows the pattern; replace it whole. The asks are the exact
  choices Will makes, worded so a ruling is a few words; the Orchestrator quotes them.
- **Light QA (Will, 2026-09-14).** A lab-only round verifies its board on its preview at 1440 and
  375 with reduced motion honoured and the gate green on the synced tree, then hands off; the deep
  red-team is the wiring round's. Iterate rather than perfect. Push early and often: `preview: true`
  builds `partyreel-git-lp-<track>-partyreel.vercel.app` on every push and Will reviews there in
  parallel.
- **Unlimited design resources.** Ask for exactly the asset the design needs, in Handoff, one
  bullet per asset in the shape `what · spec (size, grade, count, format) · replaces <stand-in id>`;
  ship the manifest's stand-in meanwhile. Never edit `docs/ASSETS.md`.
- **Never touch:** `touchpoints.ts` (your board is registered; the placeholder variant names are
  renamed at integration), `rules/bible.ts` (a bible change is Will's ruling, folded by the
  Orchestrator), CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `src/lib/env.ts`, anything
  outside `owns`.
- **No mono.** Bible 7 is retiring and a sweep is removing the face in parallel: no `font-mono`, no
  `MonoCaption`; `Caption` (`system/caption.tsx`) is the label face and `tabular-nums` on the body
  face carries data.
- **Sheets.** Keyframes live in your `board.css` under your prefix only (`keyframe-uniqueness.test.ts`
  reads every sheet under the lab); a board sheet never imports tailwindcss (`css-source-policy`);
  `glow-contract.test.ts` pins exactly three `<BorderBeam` sites, one `id="glw-warp"` and one
  `<GlowFilter />` across all of `src`, so compose `<Glow>` only. No em-dashes anywhere (the AST
  guard scans lab TSX).
- **Sync** `origin/launch-prep` only per PROGRAM.md: before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`. The Orchestrator's
  rounding round retunes radius VALUES mid-window (never a token name) and announces there.
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-floating-surfaces-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
