---
track: floating-surfaces
status: handed-off
cut: "dd4aa0b"
merged_round_2: "8a448fd"
merged_round_1: "3071cfc"
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

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The board found the contract misses bible 9 inside itself and gave three
rungs; now let Will open the real menus with a rung on. (1) **Apply to the site**: each rung (radius,
entrance, light in dark, and the reduced-motion guard that closes the `tw-animate-css` hole) as a
candidate block on the real primitives' own classes and data attributes, so the real header nav
panel, a real dropdown, a real dialog and the guest sheet on the demo page carry it; list the pages
and the interactions to try. (2) **The guest sheet at 375 as the primary specimen**, on the phone
canvas first, with the two corners that stay on screen at each rung. (3) **The palette's dark ramps
under the panels** (`docs/specs/palette.md`): a toggle that renders the panels over today's dark and
over ramp A and B, since a floating layer's light in dark depends on the ground it floats over. (4)
**The nested-corner finding made unmissable**: a 1:1 close-up of the lit row inside the panel under
each rung, with the arithmetic (container radius, padding, item radius) printed. (5) **The entrance
question as a bible ask**: one clock against by-frequency on the same three primitives, with what
rule 12 and rule 15 each say, so Will rules the principle, not the number. (6) The outliers decided
from the ground up: for `select`, `drawer` and `sheet`, show them on the winning rung AND the
"dropped" answer (what replaces them), so the ask is a choice between two real things. (7) The
iframe frame you built is the right tool for a portalled layer; keep it, and say in Handoff exactly
what the shell should absorb.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## Round 1, for reference (integrated; the brief it was built to)

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

- App-polish bucket (round 2, CORRECTED): the floating layer has no reduced-motion gate
  of its OWN. What holds bible 14 there today is `globals.css:855`, a global `@layer base`
  clamp (every animation and transition to 0.01ms, `!important`) carried since 2026-06-11,
  and that guard's own comment calls a component-level gate the first line. Round two's
  `REDUCED_MOTION_CSS` is that gate, ready to paste. (Round one recorded this as an open
  HOLE, which it is not: measured on the board with the preference forced, all 36 floating
  surfaces come back at 0.01ms.)
- App-polish bucket: `ui/tooltip.tsx`'s arrow takes a literal `rounded-[2px]` instead of a
  token (bible 8), the one literal radius left on the floating layer.
- App-polish bucket: `ui/navigation-menu.tsx`'s viewport cannot size itself outside the
  marketing header (its width rides `md:w-(--radix-navigation-menu-viewport-width)` and the
  var never lands on a lab page while the un-varianted height one does), so any surface that
  renders the mega-menu outside `marketing-nav.tsx` gets a 0-wide panel.
- App-polish bucket (round 2): `guest/entry-shell.tsx` carries a literal radius,
  `calc(var(--radius-action) * 1.4)`, and bypasses `ui/drawer.tsx` entirely, so the
  guest's own surface sits outside both the token law (bible 8) and the floating-layer
  contract (bible 15).
- Lab bucket (round 2): the guest route group has no design island, so a board's
  candidate block cannot be walked on `/e/<token>`, the surface a guest actually meets.
  One `<AppDesignIsland />` in `src/app/(guest)/layout.tsx` closes it.
- Lab bucket (round 2): the board shell has no VIEWPORT stage (an iframe at the canvas's
  true pixels) beside `Stage`, so every board that renders a portalled layer rebuilds
  `frame.tsx` from scratch.

## Handoff (round 1)

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

## Record (round 1)

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

## Handoff (round 2)

- Head: the tip of `lp/floating-surfaces`, pushed. The last code commit is `e57b5ec`;
  everything after it is this manifest. Preview:
  `partyreel-git-lp-floating-surfaces-partyreel.vercel.app`
- Board: `/design/c/floating-surfaces?key=` (nine rows). Marker for "is this round two":
  the row heading "The corner, measured", which did not exist in round one.
- **The preview alias is CURRENT: it serves `943473b`**, deployment
  `dpl_BvT5gfi5RMXxVfrtMznUUewFwnVv`, READY at 2026-09-14 22:37. That build carries every
  code commit of round two, `e57b5ec` included. Checked in the served HTML after it went
  READY: row 9's guest caveat, the "no island" badge, the "three knobs, as one paste" label
  and row 8's corrected heading are all there, and the sentence row 8 used to get wrong is
  gone. The only commits after `943473b` are this manifest, which changes no served byte.
- **It took a forced redeploy, and the reason is worth carrying to the other tracks.** For
  an hour the alias served `64f81f7` while FIVE pushes on this branch produced no deployment
  at all. The branch gate was not refusing (`scripts/vercel-ignore-build.mjs` builds an `lp/`
  branch whose manifest says `preview: true` or `status: handed-off`, and this one says
  both), and deployments had not stopped project-wide (`lp/hero-scan` `caa8539` at 22:04 and
  `lp/palette` `b4be6a2` at 22:18 both landed after this branch's pushes). The project is at
  Vercel's ceiling of 100 deployments a day: `POST /v13/deployments` is refused with
  `payment_required`, `api-deployments-free-per-day`, `remaining 0`, and the trailing-24h
  deployment list returns exactly 100 rows whose oldest is Mon 16:18. Slots free one at a
  time as old deployments age out of the rolling window and whoever pushes next takes one,
  so a branch can sit behind indefinitely while other branches deploy. This one landed on
  the ninth retry of the API call, at 22:33.
  **So for the rest of this wave: a push is not a deploy.** Confirm the alias's sha before
  reading any board on it, and recover a missed one by forcing the redeploy
  (`POST /v13/deployments` with
  `gitSource {type: github, repoId: 1252816746, ref: <branch>, sha: <tip>}`, retried until a
  slot frees) rather than by pushing again; an empty commit spends a slot and fixes nothing.
- **The board also runs with no deploy at all:** `pnpm dev`, then
  `http://localhost:3000/design/c/floating-surfaces?key=`. The lab sits in no allow-list, so
  localhost renders the tip exactly, "Apply to the site" included (the local marketing pages
  and dashboard wear a rung the same way). Worth knowing the next time the ceiling bites.
- Synced with `launch-prep` at `4b035c1` (merge `881c258`); it had moved one commit
  (`docs/systems/design-system.md`, outside the lane).
- Gates on the synced tree at `e57b5ec`: typecheck ok, lint ok (0 errors, 7 warnings, all
  pre-existing and outside the lane), test ok (1698 in 193 files), build ok (248 static
  pages).
- **Light QA, run and named rather than asserted, ON THE PREVIEW.** The board at 1440 and
  at 375 on `partyreel-git-lp-floating-surfaces-partyreel.vercel.app` at `943473b`, and the
  same two widths on `pnpm dev` before that. At both widths
  `documentElement.scrollWidth - clientWidth` is 0, so there is no horizontal scroll
  anywhere on the page, and all nineteen frames mount and paint (19 of 19, both widths, both
  surfaces). Reduced motion verified as BEHAVIOUR, not as a code fact: with every
  `prefers-reduced-motion` media rule in the board document and in all nineteen frame
  documents forced to the reduce state (1188 rules on the preview build, 1388 in dev), all 36
  floating surfaces compute an animation duration and a transition duration of 0.01ms or
  less, at both widths. Nothing leaks, and finding out WHY is what corrected row 8 (below).
  No em-dash in the served text at either width.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file plus the eight
  files of `src/app/(dev)/design/sandbox/floating-surfaces/`. No exceptions; nothing under
  `src/components/ui/` was touched, and every candidate reaches the primitives from outside.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board judges a layer over content and the real event
  photographs in `public/marketing/img/` are the right content for it; nothing here is a
  stand-in waiting to be replaced.

**Two shell changes the Orchestrator should carry (both outside this lane):**

1. **One line in `src/app/(guest)/layout.tsx`: mount `<AppDesignIsland />`.** `CandidateStyle`
   mounts in exactly three places (the lab layout, the marketing cinema island, the host app's
   island), so the GUEST group cannot wear a candidate at all. The surface this board makes
   primary, the entry drawer at `/e/<token>`, is therefore the one page a sitting cannot walk.
   The island is already key-gated, server-validated and lazy, so the cost is one import.
   Row 9 of the board says so on its face rather than pretending.
2. **The frame belongs in the shell.** `frame.tsx` + `page.tsx` + the `flt-cover` rules are a
   second kind of stage and should move into `src/components/dev/board/` beside `Stage`: a
   VIEWPORT (an iframe laid out at the canvas's true pixels, running a gated scene route in its
   own document), because a radix panel portals to `globalThis.document.body` and leaves any
   zoom-fitted div, its ground, its zoom and its canvas. What the shell should absorb, exactly:
   the iframe box with its ResizeObserver fit and `fit` cap; the `designKey === undefined`
   hold, so a gated scene route is never hit keyless; the `flt:set` / `flt:replay` same-origin
   dispatch, generalised to `board:set` / `board:replay`; the frame document's resident ground
   owner (the mutation observer that re-asserts the ground class after next-themes re-adds
   `dark`); and the cover plus `nextjs-portal` hide. What should NOT move: this board's scenes,
   its candidates, and its ramp blocks.

**Findings for whoever owns the primitives (not candidates, true whatever is ruled):**

- **Round one's reduced-motion finding was WRONG, and the board now says so.**
  `tw-animate-css` ships no guard of its own, but `globals.css:855` has carried a global one
  since 2026-06-11: `@layer base`, every animation and transition clamped to 0.01ms,
  `!important`, which is why it beats an unimportant utility in a higher layer. So the
  floating layer does NOT animate for a reader who asked for less motion, and bible 14 is not
  unenforced there. What the family lacks is the FIRST line that guard's own comment names, a
  gate on the components themselves; `REDUCED_MOTION_CSS` is that gate, and it is safe to
  paste, because radix's Presence unmounts a panel immediately when its computed animation
  name is `none` (`react-presence@1.1.5`, `index.mjs:59`), which is the failure the global
  clamp chose 0.01ms rather than 0 to avoid. Row 8's name and note, the departure, the
  candidate note, the paste's comment and the board's own sheet are all corrected at
  `e57b5ec`. This SUPERSEDES the same claim in round one's Record, in "What the wiring round
  inherits", and the deferred one-liner above is rewritten.
- `guest/entry-shell.tsx` renders a RAW vaul drawer, outside `ui/drawer.tsx`, with a literal
  radius `calc(var(--radius-action) * 1.4)`. It is a tenth floating surface and the one most
  people on this product will ever see. The family is ten, not nine.
- `ui/sheet.tsx` has exactly one product call site, the marketing mobile menu, and it enters
  from the TOP. Round one's candidates covered bottom and right, so they reached nothing that
  ships. Every rung now covers all four sides.
- A bare `box-shadow` on a panel DELETES the ring it ships (`ring-1` is a box-shadow in
  Tailwind v4). Every light rung composes `var(--tw-ring-shadow, 0 0 #0000)` back in first.
- Radix renders `Dialog.Overlay` only in MODAL mode, so a non-modal dialog has no scrim to
  style at all. The Overlays scene paints the overlay's own rectangle instead, because a board
  of nineteen iframes cannot afford a focus trap in each.
- A custom property set ON an element beats the same property inherited from `<html>` whatever
  the ground rule's specificity. A per-panel rung therefore needs its dark values declared on
  the panel too, qualified by the ground as an ancestor; without that the light ladder drew its
  LIGHT values on cinema and the dark answers were never on the board (round one's did).
- A browser defers a LAZY image inside an iframe that is off the parent's screen, so a board of
  frames meets empty grids on the way down. The backdrops load eagerly now; it costs nine URLs.

**Testing note (for the next session on this board).** The board's own screenshots come back
BLACK or misaligned through the Chrome MCP once it holds nineteen frames, while the DOM is
correct and the scene routes screenshot perfectly on their own. Verify this board by the DOM
(`contentDocument` is same-origin, so the loupe's own measurements can be read straight out of
it) or by opening a single scene route at its canvas size, per
`docs/systems/testing-verification.md`.

**Testing note 2, reduced motion.** The test browser has no reduced-motion emulation, so the
preference is forced by walking the CSSOM and flipping every `prefers-reduced-motion` media
rule (reduce to `all`, no-preference to `not all`) in the board document and in each frame's
`contentDocument`. The walk MUST recurse into `@layer` blocks: a first pass that flipped only
top-level media rules missed the global guard, which lives in `@layer base`, and produced a
convincing false leak (the guest drawer appearing to run vaul's 0.5s `slideFromBottom` under
reduce, which is exactly the headline this board would have got wrong twice). Around 1200
rules on a production build and 1400 in dev is the right order of magnitude for this board; a
few dozen means the walk is not recursing.

- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  1. "The radius: sharp, nested or round, and whether the big boxes take a second token or the
     same one"
  2. "The entrance: one clock (rule 15) or by frequency (rule 12), and which rule gives way on
     this family"
  3. "The light in dark: lighter is closer, a soft shadow, or a lit edge, ruled on the palette
     ramp you intend to keep"
  4. "The edge family: which ONE of sheet and drawer survives, and does the guest entry shell
     adopt it"
  5. "The select: onto the contract, or dropped for the dropdown with radio items"
- Look at first:
  1. **Row 2, the corner, measured.** Four frames, each reading its own panel off the live DOM
     and drawing the panel's corner, the row's corner and the corner the row NEEDS at 6x. Today
     is the only rung where the dashed line and the solid one are different lines. Ninety
     seconds and the radius ask answers itself.
  2. **Row 1 at 375.** The guest entry drawer beside the house sheet on its real side. This is
     the floating layer this product is mostly made of, and it was not on round one's board.
  3. **Row 3, then press "Apply to the site" under a rung and walk `/` (hover Features, then
     the menu at 375), `/pricing` and `/dashboard`.** The rung on the board and the rung on the
     real page are the same string; that is the whole point of round two.
  4. **Row 5, Replay, twice.** Rule 12 and rule 15 running side by side on the same three
     primitives, with both statements quoted from the bible above them.
  5. **Row 4 with the ramp on A, then B.** Whether a shadow has to come back in dark is a
     question about the ground, and the palette board has three grounds on offer.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two rebuilt the floating-surfaces
board around one change: every rung is now generated as real CSS against the primitives' own
data-slots (`candidates.ts`, three scopes) and the board renders the same string it hands the
site through `setCandidateCss`, so "Apply to the site" is the candidate rather than a demo of
it, and a rung cannot drift from its own proposal. The guest entry shell became the primary
specimen at 375 and turned out to be a tenth floating surface, a raw vaul drawer outside
`ui/drawer.tsx` carrying a literal radius; `ui/sheet.tsx`'s one product call site turned out to
enter from the TOP, so the edge rungs now cover all four sides. The rule-9 miss is measured off
the live DOM and drawn at 6x with its arithmetic rather than asserted, the palette board's dark
ramps A and B are a knob under the panels, the light rung adopts the light board's own
`--lgt-float` family so the two boards propose one shadow, the entrance is posed as rule 12
against rule 15 with both statements quoted from the bible, and the outliers gained a third
column showing what replaces them. Five corrections came out of the build: the light rungs no
longer delete the ring a panel ships, a panel-scoped rung's dark values now land on the panel,
the backdrops load eagerly so a frame is never empty on the way down, every entrance sits inside
its own reduced-motion block, and round one's reduced-motion finding turned out to be false,
since globals.css has clamped every animation and transition to 0.01ms under the preference
since June, so row 8 now offers the gate as bible 14's missing first line rather than as a
rescue.

## Handoff (round 3)

- Head: the tip of `lp/floating-surfaces`, pushed; the last commit is this manifest. Board: `/design/c/floating-surfaces?key=`. **The marker for "is this
  round three": the block heading "Where this board lands"**, and the row-2 caption "The finding the
  round turned on, at 6x". Round two's board had neither.
- **Synced: `launch-prep` had NOT moved.** It is still at `dd4aa0b`, the SHA this branch was cut
  from, so there is nothing to merge and the gates below ran on the tree as it will land.
- **The preview alias is STALE and the project is at its deploy ceiling.** The alias serves
  `943473b` (round two). Four pushes on this branch produced no deployment:
  `POST /v13/deployments` answers `payment_required`, `api-deployments-free-per-day`,
  `remaining 0`, with the hard reset a full day out (2026-09-15 23:13). Slots free one at a time as
  old deployments age out and whoever is polling takes the next one (`lp/hero-scan` took one at
  23:02, `lp/hero-burst` at 23:17), so a retry loop is running against this head and the alias may
  be current by the time anyone reads this: **confirm the sha before reading the board there**, and
  if it is still `943473b`, read the board the way this round verified it, on a local server:
  `pnpm dev` (or `pnpm build && npx next start -p 3008`), then
  `http://localhost:3008/design/c/floating-surfaces?key=`. The lab sits in no allow-list, so
  localhost renders the tip exactly, "Apply to the site" included.
- Gates on the synced tree at this head: typecheck ok, lint ok (0 errors, 6 warnings, all
  pre-existing and outside the lane), test ok (1719 in 193 files), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file plus four files of
  `src/app/(dev)/design/sandbox/floating-surfaces/` (`board.tsx`, `candidates.ts`, `frame.tsx`,
  `scenes.tsx`). No exceptions; nothing under `src/components/ui/` was touched, and every candidate
  still reaches the primitives from outside.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board judges a layer over content and the real event
  photographs in `public/marketing/img/` are the right content for it; nothing here is a stand-in.

**Light QA, measured on a LOCAL PRODUCTION BUILD of this head (`pnpm build` + `next start`), in a
foreground Chrome tab, plus the same walk in dev.**

- At 1440: no horizontal scroll at any scroll position, all 18 frames mount and paint, every panel
  in every frame lands inside its canvas (measured off each `contentDocument`).
- At 375 (viewport emulation, since a Chrome window will not go below 500): page
  `scrollWidth - clientWidth` is 0, every frame box is the full 343-wide column at 0.91 scale, the
  control bar is `position: static` so it covers nothing, and the only element wider than the column
  is the deliberately full-bleed bar itself.
- **Cost, before and after, measured rather than asserted.** Round two's board mounted all 19
  documents at first paint: 1020 requests, 6958 elements, 288 photographs, 5.7s until the last frame
  settled (dev). This head, on the production build: **first paint is 6 documents, 343 requests,
  2549 elements, settled at 1.25s**; walked end to end it reaches 18 documents, 846 requests, 6626
  elements, 144 photographs.
- **Frame time.** At rest the board runs NOTHING: zero running animations, a 16.7ms median frame
  (vsync) with an 18.6ms worst over 90 frames. "Replay every entrance" used to close and reopen
  about thirty panels across every mounted document at once and cost a 150ms hitch, all of it spent
  on entrances off screen; it now replays only the frames in view, and the same press measures a
  16.7ms median with NO frame over 33ms.
- **Reduced motion, re-measured on THIS board rather than quoted from round two.** Every
  `prefers-reduced-motion` media rule in the board document and in all 18 frame documents forced to
  the reduce state (1356 rules, walked recursively so the `@layer base` guard is included): all
  **30** floating surfaces compute an animation and a transition duration of 0.01ms or less. Row 8
  and candidates.ts now print those numbers instead of round two's 36-across-19.
- The reduced-motion NOTE beside Replay was verified as behaviour, not as code: with `matchMedia`
  forced to match, the line appears; restored, it is gone.
- **The recommendation was walked onto the real site.** With "Apply to the site" pressed in the
  landing block, `/?key=` computes panel radius 8, row radius 4, dialog 16, and the dropdown and the
  tooltip run `flt-slip-in` at 90ms while the dialog runs `flt-zoom-in` at 220ms; the real header nav
  panel opens carrying it, and the tuner panel shows the block with its clear button. Cleared after.
- No em-dash in the served text; no `font-mono`; no `<BorderBeam`, `glw-warp` or `<GlowFilter />`
  added anywhere.

**What round three changed, and why (the walk found each of these).**

1. **The board opens with where it lands.** Five answers, one word each, each with the row that
   argues it and the cost of taking it, plus one button that applies the two knobs it recommends. The
   knobs now OPEN on the recommendation rather than on an arbitrary rung.
2. **Three rungs cut, each for the same reason: a rung has to be a different ANSWER.** The light rung
   "lighter is closer" WAS today (its paste set the declaration the panel already carries, so the
   ladder showed one column twice and the toggle offered "today" beside a rung meaning today); the
   "lit edge" rung is ruled out for this job by the light board's own doctrine (the lit face is
   material, not elevation, and belongs to a face catching light); "origin true" answers how a panel
   moves rather than how fast, which is not what rules 12 and 15 disagree about. Each cut is written
   where the rung used to be, in `candidates.ts`, and said on the board in the row it left.
3. **An honesty fix in the shadow rung.** Its light-ground alphas were 0.12 and 0.16 while the block
   claimed the light board's family verbatim; that board declares 0.09 and 0.13 on a light ground
   (`docs/specs/light.md`, its round-two correction). They are those numbers now. The dark values
   (0.5 / 0.62) already matched. Also: the by-frequency comment said "a fade plus 2px" where the CSS
   travels 6px.
4. **Cost.** Frames mount BY ROW, a viewport and a half before the row arrives; the corner strip
   dropped the 96 photographs it was hiding its own corners behind (a corner is read at the corner)
   and now shows the side the product actually uses, the TOP sheet, whose two bottom corners are the
   ones that stay on screen; the entrance ladder frame left with its rung; the select column stopped
   being two thirds empty; Replay runs what you can see.
5. **Honesty about scale.** Any frame drawn smaller than its canvas now says so on its face ("1440
   canvas at 69%"), because the lab column is 992 wide at 1440 and nobody should rule on a size
   nobody ships.
6. **375.** The control bar was 310px tall and sticky, which is 38 percent of a phone viewport
   covering the specimen; it is static below `sm` now. BoardMeta was 3434px tall at 375 and is 2572
   after the candidate and departure lists were cut to what has to be ruled on.
7. **The asks are one word each** and the departures are only the four Will must rule on. The build
   findings moved down here, where the Orchestrator reads them.

**Four things the Orchestrator should carry (all outside this lane):**

1. **One line in `src/app/(guest)/layout.tsx`: mount `<AppDesignIsland />`.** `CandidateStyle` mounts
   in exactly three places (the lab layout, the marketing cinema island, the host app's island), so
   the GUEST group cannot wear a candidate at all. The surface this board makes primary, the entry
   drawer at `/e/<token>`, is therefore the one page a sitting cannot walk. The island is already
   key-gated, server-validated and lazy, so the cost is one import. Row 9 says so on its face.
2. **The frame belongs in the shell.** `frame.tsx` + `page.tsx` + the `flt-cover` rules are a second
   kind of stage and should move into `src/components/dev/board/` beside `Stage`: a VIEWPORT (an
   iframe laid out at the canvas's true pixels, running a gated scene route in its own document),
   because a radix panel portals to `globalThis.document.body` and leaves any zoom-fitted div, its
   ground, its zoom and its canvas. What to absorb: the iframe box with its ResizeObserver fit and
   `fit` cap; the `designKey === undefined` hold, so a gated scene route is never hit keyless; the
   `flt:set` / `flt:replay` same-origin dispatch, generalised to `board:set` / `board:replay`; the
   frame document's resident ground owner; the cover plus `nextjs-portal` hide; and round three's two
   additions, `useMountOnApproach` (row-level mounting, with the display-contents trap it fell into
   written down) and the "canvas at N%" badge. NOT this board's scenes, candidates or ramps.
3. **`docs/specs/floating-surfaces.md` needs its option lists trimmed at integration.** The
   published proposal still offers the round-two rung sets in its angle brackets: line 36 lists
   "origin true 200/130" and line 39 lists "a lit edge", both cut this round, and line 39's
   "lighter is closer" is the baseline rather than a rung. The radius line (three rungs) is
   unchanged. The spec is not in this lane's `owns`, so it is named here rather than edited.
4. **Two small ones.** `BoardMeta`'s `grid-cols-[8rem_minmax(0,1fr)]` is not responsive: at 375 the
   label column eats 128 of 343 and every meta line wraps to three. A `sm:` on the two-column form
   would fix every board at once. And the touchpoint blurb for this board still says "All nine
   primitives ... three ladders at 1:1": the family is TEN (the guest entry shell) and there are two
   ladders now. `touchpoints.ts` is not this lane's to edit.

**Findings for whoever owns the primitives (not candidates, true whatever is ruled):**

- `guest/entry-shell.tsx` renders a RAW vaul drawer, outside `ui/drawer.tsx`, with a literal radius
  `calc(var(--radius-action) * 1.4)`. It is a tenth floating surface and the one most people on this
  product will ever see. The family is ten, not nine.
- `ui/sheet.tsx` has exactly one product call site, the marketing mobile menu, and it enters from the
  TOP, so the corners that stay on screen there are the BOTTOM two.
- A bare `box-shadow` on a panel DELETES the ring it ships (`ring-1` is a box-shadow in Tailwind v4).
  Every light rung composes `var(--tw-ring-shadow, 0 0 #0000)` back in first.
- Radix renders `Dialog.Overlay` only in MODAL mode, so a non-modal dialog has no scrim to style.
- A custom property set ON an element beats the same property inherited from `<html>` whatever the
  ground rule's specificity, so a per-panel rung needs its dark values declared on the panel too,
  qualified by the ground as an ancestor.
- A browser defers a LAZY image inside an iframe that is off the parent's screen, so the backdrops
  load eagerly; with row-level mounting a frame is only built when it is about to be seen, which is
  the same economy done at the right level.
- `ui/navigation-menu.tsx`'s viewport cannot size itself outside the marketing header (its width
  rides `md:w-(--radix-navigation-menu-viewport-width)` and that var never lands on a lab page).
- `ui/tooltip.tsx`'s arrow takes a literal `rounded-[2px]` instead of a token (bible 8).
- Round one's reduced-motion "hole" does not exist: `globals.css:855` has clamped every animation and
  transition to 0.01ms under the preference since 2026-06-11, with `!important`. What the family
  lacks is bible 14's FIRST line, a gate of its own, which row 8 offers as a paste.

**Testing notes for the next session on this board.**

- **A row mounts from an IntersectionObserver, so it needs a REAL box and a REAL scroll.** The first
  cut observed a `display: contents` wrapper, which produces no box at all: the observer never fired
  and every row below the first stayed empty. And a `scrollTo()` from the console in a BACKGROUND tab
  mounts nothing, because a hidden document runs no rendering lifecycle and therefore delivers no
  intersection records. Verify this board by scrolling a FOREGROUND tab, then read the DOM.
- The board's own screenshots can come back black or misaligned through a driven tab once it holds
  many frames, while the DOM is correct (`contentDocument` is same-origin, so the loupe's own
  measurements can be read straight out of it). `docs/systems/testing-verification.md` has the rest.
- **Reduced motion has no emulation in the test browser**: force it by walking the CSSOM and flipping
  every `prefers-reduced-motion` media rule, recursing into `@layer` blocks (the global guard lives
  in `@layer base`, and a first pass that missed it produced a convincing false leak in round two).
  Around 1350 rules across this board and its frames is the right order of magnitude.
- The Chrome window will not go below 500px wide, so 375 has to be verified through viewport
  emulation or the DOM.
- The lab page is shared browser state: "Apply to the site" persists in `localStorage` until cleared,
  so clear it before handing the board to anyone.

- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  1. "The radius: sharp, nested or round (this board says nested)"
  2. "The entrance: one clock or by frequency (this board says by frequency, and that rule 15 means
     one language)"
  3. "The light in dark: today or the shadow (this board says whatever the light board is ruled,
     since the numbers are the same)"
  4. "The edge family: sheet or drawer (this board says drawer, and the guest entry shell adopts it)"
  5. "The select: keep or drop (this board says keep, on the contract)"
- Look at first:
  1. **The block at the top, "Where this board lands".** Five answers, one word each, each with the
     row that argues it. If all five read right, the ruling is two words and the rest of the board is
     evidence you never have to open.
  2. **Row 2, the corner, measured.** Four frames, each reading its own panel off the live DOM and
     drawing the panel's corner, the row's corner and the corner the row NEEDS at 6x. Today is the
     only rung where the dashed line and the solid one are different lines.
  3. **Row 1 at 375.** The guest entry drawer beside the house sheet on its real side, then the same
     big box under each rung on a calm ground.
  4. **The landing block's "Apply to the site", then walk `/` (hover Features, then the menu at 375),
     `/pricing` and `/dashboard`.** The rung on the board and the rung on the real page are the same
     string.
  5. **Row 5, Replay, twice.** Rule 12 and rule 15 running side by side on the same three primitives,
     with both statements quoted from the bible above them. This is the one ask that is a bible edit.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three turned the floating-surfaces
exploration into a board that can be ruled on in a few words. Round two made every rung real CSS
against the primitives' own data-slots (`candidates.ts`, three scopes), so the board renders the same
string "Apply to the site" hands the whole site and a candidate cannot drift from its proposal; it
made the guest entry shell the primary specimen at 375 and found it is a TENTH floating surface, a raw
vaul drawer outside `ui/drawer.tsx` carrying a literal radius; it measured the rule-9 miss off the live
DOM and drew it at 6x with its arithmetic; and it posed the entrance as rule 12 against rule 15 with
both statements quoted from the bible. Round three walked the board the way Will would and spent
itself on the ruling: it opens with the five answers it recommends, one word each, with the row that
argues each and one button that applies them; three rungs were cut because a rung has to be a
different answer, not a different drawing (the "lighter is closer" light rung WAS today, the lit edge
belongs to the light board's material face, and "origin true" answers how a panel moves rather than
how fast); the shadow rung's light-ground alphas were corrected to the light board's own 0.09 and
0.13, so the two boards propose one shadow to the byte. Its cost came down with it: frames mount by
row a viewport ahead of arrival (six documents at first paint instead of nineteen, 1.25s instead of
5.7), the corner strip dropped the 96 photographs it was hiding its own corners behind, Replay runs
only the frames in view (a 150ms hitch became none), and every frame smaller than its canvas says so
on its face. Reduced motion was re-measured on the board it describes: 1356 rules forced, 30 surfaces,
none above 0.01ms.
