---
track: floating-surfaces
status: integrated
cut: "6c19d84"
merged: "3071cfc"      # the branch head merged into launch-prep
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

- none. Every fact this round found sits outside the track's owned paths, so it is
  written below rather than edited into a system doc. The contract's own rewrite is in
  the Record, ready to replace design-system.md's "THE FLOATING-LAYER CONTRACT" block
  once the three knobs are ruled.

## Deferred (ROADMAP one-liners, bucket named)

- Hardening bucket (R8, WCAG): `tw-animate-css` ships no reduced-motion guard, so every
  `animate-in` / `animate-out` utility, the whole floating layer included, still animates
  for a reader who asked for less motion; bible 14 is enforced by hand today.
- App-polish bucket: `ui/tooltip.tsx`'s arrow takes a literal `rounded-[2px]` instead of a
  token (bible 8), the one literal radius left on the floating layer.
- App-polish bucket: `ui/navigation-menu.tsx`'s viewport cannot size itself outside the
  marketing header (its width rides `md:w-(--radix-navigation-menu-viewport-width)` and the
  var never lands on a lab page while the un-varianted height one does), so any surface that
  renders the mega-menu outside `marketing-nav.tsx` gets a 0-wide panel.

## Handoff (replaces the chat report)

- Head `91c8dac`, pushed; preview `partyreel-git-lp-floating-surfaces-partyreel.vercel.app`
- Synced with `launch-prep` at `7d389d4` (merge `56c1664`); it had moved 46 commits
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all pre-existing
  and outside the lane), test ok (1697 in 193 files), build ok (248 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file plus the seven
  files of `src/app/(dev)/design/sandbox/floating-surfaces/`. No exceptions; nothing under
  `src/components/ui/` was touched, and the candidates reach the primitives from outside.
- New route in the lane: `/design/sandbox/floating-surfaces`, the scene the board's frames
  mount. Gated by `requireDesignKey` like every lab route, dynamic, never linked. It exists
  because a radix panel portals to `globalThis.document.body`, so the only way to put one
  inside a 375-wide viewport is to give it a document of its own (see the departures).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none. The board judges a layer over content and the real event
  photographs in `public/marketing/img/` are the right content for it; nothing here is a
  stand-in waiting to be replaced.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  1. "The radius: sharp, nested or round, and whether the sheet and dialog take a second
     token or the same one"
  2. "The entrance: one clock, by frequency, or origin true"
  3. "The light in dark: lighter is closer, a soft shadow, or a lit edge"
  4. "The outliers: select, drawer and sheet onto the contract, or dropped"
- Look at first:
  1. **Row 2, the radius ladder, at 1:1.** It is the finding the round turned on: today's
     panel draws an 8px corner around 1.6px rows sitting in 4px of padding, so the lit row's
     corner does not nest inside the panel's. Every rung fixes it from a different end; the
     ruling is which family a floating layer belongs to, not which number is prettier.
  2. **Row 3, the light ladder, on cinema, then on paper.** The dark answer is the one bible
     10 reopened, and whichever wins has to leave the light side standing.
  3. **Row 1 with the entrance knob on "by frequency", then "one clock", pressing Replay.**
     That is rule 12 arguing with rule 15 on the same family, and it is a bible question.
  4. **Row 5 with the width at 375.** The sheet is the guest's surface, and its top corners
     are the largest radius on the site under every rung.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The floating-surfaces exploration put all
nine primitives on one canvas and found that the contract misses bible 9 inside itself: a menu
draws an 8px container around 1.6px rows in 4px of padding, so the highlighted row never nests.
Three radius rungs each fix it from a different end (items sharp, today's container, items on the
action law), three entrances (one clock, by frequency, origin true) and three lights in dark
(lighter is closer, a soft shadow, a lit edge) are independent knobs over the live family, so a
ruling is three words. The board needed a stage the shell could not give it: every radix panel
portals to `globalThis.document.body`, so inside a zoom-fitted `Stage` it leaves the ground, the
zoom and the canvas, and each frame is instead an iframe laid out at the canvas's true pixels
running a gated scene route in its own document. Nothing under `src/components/ui/` changed: the
candidates ride token overrides and a class on the panel. Four findings came out of the build
(`@theme inline` never emits a derived token, the ground classes are mutually exclusive under
next-themes, `tw-animate-css` has no reduced-motion guard, the nav viewport cannot size itself
outside the marketing header).

### The contract, rewritten (replaces design-system.md's "THE FLOATING-LAYER CONTRACT" once ruled)

**THE FLOATING-LAYER CONTRACT** (bible 15). Every floating surface ships five things, and the
three under exploration carry the ruled value in angle brackets:

1. **A nested radius, from two tokens.** The panel takes `--radius-float`, its rows take
   `--radius-float-item`, and the two are exactly the row's padding apart, so the lit row's
   corner sits concentric inside the panel's (bible 9). A large box (dialog, sheet, drawer)
   takes `--radius-float-lg`. `<ruled: sharp 5.6 / 1.6 / 11 | nested 8 / 4 / 16 | round 12 / 8 / 24>`
2. **An origin-AWARE `transform-origin`**, from the primitive's own radix var, never a centre.
3. **A fade beside whatever else moves** (`fade-in-0` / `fade-out-0`): a scale or a travel with
   no fade pops.
4. **One entrance on `--ease-emphasis`, exits faster than enters.**
   `<ruled: one clock 175/120 | by frequency 90/70 high-frequency and 220/150 occasional | origin true 200/130>`
   The edge family (sheet, drawer) keeps a slide from its own edge on `--ease-drawer`; a sheet
   that zooms is a different component.
5. **One light, by ground.** In light, `--shadow-float`. In dark, `<ruled: lighter is closer
   (no shadow, the ring draws the edge) | a soft shadow tuned for dark | a lit edge, no shadow>`.

Miss any of the five and the surface reads wrong in a way that is hard to name: `rounded-lg`
resolves to the 2px SHARP general-UI radius, a raw `shadow` draws in dark against the elevation
contract, a centre origin detaches the panel from its trigger, and a scale with no fade pops.

### Per primitive

| primitive | today | under the contract |
| --- | --- | --- |
| `dropdown-menu` | on the contract: `rounded-float`, `shadow-float`, origin var, fade + `zoom-95`, 175/120 on `--ease-emphasis`, `ring-1 ring-foreground/10` | rows move to `--radius-float-item`; entrance and dark light per the ruling. High-frequency under rung B. |
| `popover` | on the contract, same five | rows n/a; entrance and dark light per the ruling. Occasional under rung B. |
| `tooltip` | on the contract, but inverted (`bg-foreground`) with no ring, and its arrow carries a literal `rounded-[2px]` | the arrow's literal becomes a token (bible 8, deferred above). The highest-frequency surface on the site: rung B lands it in 90ms with no zoom. |
| `dialog` | on the contract; `rounded-float` for the centred variant, the `fullScreen` takeover exempt (edge to edge, fade + 8px rise, never a zoom) | centred variant takes `--radius-float-lg`; the takeover stays exempt and should say so in the contract. |
| `navigation-menu` viewport | on the contract since 2026-08-28, but runs its OWN clocks (`--mkt-dropdown-open-ms` / `-close-ms`) rather than the house one | either the marketing clocks become the house clock for this family, or rule 15's "one entrance" already has a standing exception. Worth naming either way. |
| `select` | OUTLIER, stock shadcn: `rounded-md` (1.6px), a raw `shadow-md` that DRAWS in dark, no house ease, no ring; the trigger carries `shadow-xs` | onto the contract (all five lines), or dropped: one product call site, and a `dropdown-menu` with radio items is already the same surface. |
| `sheet` | OUTLIER: has `shadow-float` and the drawer clock (300/200 on `--ease-drawer`) but is SQUARE on every side | the two corners that stay on screen take `--radius-float-lg`; or dropped: one call site, and the bottom case is the drawer's. |
| `drawer` (vaul) | OUTLIER: has the radius (`rounded-t-float` and friends) but NO shadow and no ring; vaul owns its motion | gains the light line; or dropped: no product call site at all, so this is the cheapest drop on the board. |
| `sonner` toast | themed by CSS vars, not classes (`--border-radius: var(--radius-float)`, `--normal-bg: var(--popover)`) | follows `--radius-float` for free. CARVE-OUT: a STATE toast (success, warning, error) overrides its background through an `!important` rule in globals.css, so it answers the light question with a colour instead of the popover surface. The contract should say the state variants are exempt from line 5. |

### What the wiring round inherits

- The candidates are CSS-only and live in `board.css`; each rung's values are written as
  derivations (`calc(var(--radius) * 0.8 + 4px)`, `calc(var(--radius-action) * 0.5)`), so the
  ruled rung can be lifted into `globals.css` as the token values directly and the rounding
  round's retune still carries.
- Four findings that are not candidates and want fixing whatever is ruled: `@theme inline`
  means a DERIVED token (`--radius-md`, the whole `--radius-sm..4xl` scale) is compiled into
  its utilities and is EMPTY at runtime, and an empty var inside a `calc()` invalidates the
  declaration silently; the ground classes are mutually exclusive (`globals.css` declares
  `.dark` after `:root, .surface-paper`) and next-themes re-adds `dark` after a component's own
  effect, so anything painting a ground on `<html>` needs to re-assert; `tw-animate-css` has no
  reduced-motion guard; and the nav viewport cannot size itself outside `marketing-nav.tsx`.
- The board's frame (`frame.tsx` + `page.tsx`) is offered to the shell's owner as an addition
  to `src/components/dev/board/`: a `Stage` is right for a hero and cannot hold a portalled
  layer, and any future board that renders one will hit the same wall.
