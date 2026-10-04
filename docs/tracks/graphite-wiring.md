---
track: graphite-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/globals.css
  - src/app/theme.css
  - src/components/ui/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
---

# lp/graphite-wiring

**Goal.** Wire Will's room=graphite (the room's pop-outs, tooltips and toasts at oklch 0.29, the edge light 40%, as tokens) and give the popover the menus' collision padding.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on identity r3 (2026-10-04), to wire: room=graphite.** Read the board (`src/app/(dev)/design/sandbox/identity/sheet/room.ts`, its graphite values) and `docs/reviews/identity.json`. In `.dark` only (paper keeps the display; dialogs, panels and sheets unchanged): menus, popovers, selects, the Add's rows, tooltips and toasts at oklch 0.29 (the display 0.165, the room's background 0.085), muted text at 0.77, the highlighted row a 55% ring with a 9% fill, the edge light 40% (from 30%). Every value a token in `globals.css`, so the brand round re-tints it in one change.
- **And red-team 51's NIT:** the storage ring's popover sits flush to the left edge at 375, because `src/components/ui/popover.tsx` sets no `collisionPadding`; give it the menus' 8.
- **Ownership:** `src/components/ui/`, `globals.css` and `theme.css` are yours this round; other lanes propose what they need there through the Orchestrator. identity r4 (a lab board drawing now) reads your tokens live, so keep names stable.
- **And identity r4's finding (measured on its board):** globals.css's bright edge (`[data-lit]`) draws its pixel on a padding ring that rounds to nothing under about half scale (a page zoomed out, a laptop's smaller steps), so the photographs' edges vanish at a zoomed-out desk. A 1px transparent border under the same mask holds at every scale: the board's `sheet/edge.ts` `ON` on `lp/identity-r4` (`git show lp/identity-r4:src/app/(dev)/design/sandbox/identity/sheet/edge.ts`). Wire it in globals.css and measure it at 50% and 100% zoom.
- A 1.5px line in production is a box-shadow spread: Chrome draws an outline or border width in whole CSS pixels.
- **And one press model for taps on words (crumbs-64's finding, merged before you):** the code's corner mark (`event-code-door.tsx`), `ui/glyph-count.tsx` and the pricing matrix's `RowTip` (`src/components/marketing/sections/pricing/row-tip.tsx`) each carry the same logic beside a tooltip primitive that refuses a finger: a tap toggles, a cursor's click keeps it open, a key toggles. Promote one `TapTooltip` into `ui/tooltip.tsx` and move the three onto it (the two outside `ui/` are exceptions named in your Handoff). Refine design-system.md's "A tap never opens a tooltip" with it: icon controls still never open one by a tap.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does "the edge light 40% (from 30%)" land?** A layer wears no bright edge in production: the edge is worn by
  media alone (`[data-lit]`, the foreground at 30%), and whether it reaches a menu, a popover or a toast is identity r3's
  still-open `edge` ask (Will asked for more real UI to judge it, which r4 draws). The board's 40% is the graphite
  pop-out's own light (`--vf-pop-light`), so it is declared as the layer's token, `--display-light` (30% on paper's
  display, 40% in the room's graphite), for r4 and the wiring after it to read; the photographs' edge stays at 30%.
  *Recommended (built):* as declared. If he meant the photographs' edge to rise in the room, it is one literal in
  `[data-lit]`'s gradient and a dark-only token, and the board's `media` option would no longer be "as built".

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the grounds bullet (the display is "near-black on paper, lit graphite in the room")
  and a new ★ line under it (the `--display*` set is declared per ground, never on `:root` alone, and a literal typed
  into `.surface-display` is paper's grey on graphite); the bright edge (★ the pixel is a 1px transparent border under
  the mask, never a padding, and how to measure it: CSS `zoom: .33`); the floating-layer contract (`floatingGutter`;
  "two materials" worded for graphite); the tap gotcha ("A tap never opens a tooltip on an icon control", with
  `TapTooltip` as the model for words a finger must ask for).

## Deferred (ROADMAP one-liners, bucket named)

- Design: `dashboard/display-menu.tsx` and `social/profile-actions-menu.tsx` each type `collisionPadding={8}`, the number `floatingGutter` (`ui/floating-layer.ts`) now names; read it when a lane owns them.
- Design: when identity's `edge` ask picks a reach for layers, a layer's bright edge reads `--display-light`, and `[data-lit]`'s falloff takes its light as a colour the host sets (r4's `edge.ts` draws it so), so one falloff serves media and layers.
- Design: the Library's Tooltip entry (`library/components/gallery-demos.tsx`, "useless on touch") gains a `TapTooltip` specimen beside it.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/graphite-wiring`:** the wiring `beb087e5b`; a test's edge cases `5f375d3a9`; the menu's gutter `132e23440`
  (the code head). **No sync:** launch-prep moved (small-fixes merged, `9246e880c`) and shares no file with this lane
  (`comm -12` of the two `git diff --name-only` lists is empty), nothing in `ui/`, `globals.css` or `theme.css` landed, and
  `reads` is untouched.
- **Gates on `132e23440`, each on its own exit code** (logs in `_scratch/graphite-wiring/`): `pnpm typecheck` 0
  (`gate3-typecheck.log`); `pnpm lint` 0 (`gate3-lint.log`); `pnpm test` 0, 893 files and 10,823 tests
  (`gate3-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate3-build.log`); `pnpm lab:smoke --base
  http://localhost:3131` 0, 190 checks and 0 failing (`gate3-smoke.log`). `lab:demo`: not run, the lane has no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths plus this file, and these exceptions:
  `src/components/app/share/event-code-door.tsx` and `src/components/marketing/sections/pricing/row-tip.tsx` (the two
  call sites moved onto `TapTooltip`, as the brief named); `src/app/(dev)/design/(shell)/library/foundations/ground-list.ts`,
  `grounds.tsx` and `page.tsx` (the brand kit's display list takes the four new tokens, which `ground-list.test.ts` holds
  it to, and three sentences that said the display was theme-independent are made true); and
  `src/components/shared/lit-edge-contract.test.ts` (one test: the edge's pixel is a border, never a padding).
- **The items:**
  - room=graphite as tokens: `--display`, `-step`, `-foreground`, `-muted`, `-faint`, `-edge`, `-input`, `-cursor`, `-light`
    declared whole in the paper block and in `.dark` (room: 0.29, 0.355, 0.975, 0.77, 0.62, 12%, 22%, 55%, 40%), read by
    `.surface-display`; the theme-independent `:root` copies are gone (`beb087e5b`, `src/app/globals.css`). Read off real
    layers in Chrome: in the room a dropdown, popover, select, command palette and toast are Lab 17.6 (oklch 0.29); in a
    light session the same are 0.165, 11% and 50% (paper keeps the display); `.dark > .surface-paper > .surface-display`
    is 0.165 and `.surface-display.dark` (RowTip's cinema skin) is 0.29. Contrast on 0.29 (`contrast.mjs`): words 13.1:1,
    muted 6.8:1, faint 3.9:1 (captions only), destructive 4.9:1. Dialogs, panels and sheets are untouched.
  - The chosen row's outline is the token: `ring-(color:--display-cursor)` replaces `ring-foreground/50` in
    `dropdown-menu.tsx` (four rows), `select.tsx`, `responsive-menu.tsx` (the Add's rows, four states) and
    `command-palette.tsx`; the destructive row's red ring stays. Measured: the highlighted row is a 9% wash with a 1.5px
    55% inset ring (a box-shadow spread) in a menu, a select and the palette; `display.test.ts` refuses the old spelling.
  - The gutter: `floatingGutter` (8) in `ui/floating-layer.ts`, read by the popover, `DropdownMenuContent` (`132e23440`),
    its submenu, `responsive-menu.tsx` and `TapTooltip`'s words; `floating-layer.test.ts` refuses a typed literal. At 375 in
    Chrome: the storage ring's popover on `/design/library/compositions` stands at 8 (wrapper 8 to 328,
    `tap-compositions.mjs`) and a menu from a trigger pinned flush right stands 8 clear (`menu-gutter.mjs`).
    ROADMAP's Design line "`DropdownMenuContent` sets no `collisionPadding`" is done: drop it.
  - The bright edge on a 1px transparent border under the same mask (`[data-lit]::after`, `globals.css`), measured with
    production's stylesheet in headless Chrome, the old rule against the new (`edge-scale3.mjs`, `edge-scale4.mjs`): at page
    zoom 100, 90, 75, 67 and 50% (and a retina's 100 and 50%) both are lit (+68 to +69 of 255 on a plain host); at 33% and 25% the old ring
    is gone (0) and the new holds (+68, +67), and on a `data-lit="border"` host at 25% the old reads +34 where the new
    reads +67; from 110% to 300% zoom and at device scales 1.25, 1.5, 2.5 and 3 the new is equal or better. The brief's
    "rounds to nothing under about half" reproduces with CSS `zoom` (what page zoom does to lengths), not with a device
    scale or a transform alone. Guard: `lit-edge-contract.test.ts`.
  - `TapTooltip` (`ui/tooltip.tsx`): the one press model for words a finger must ask for; `ui/glyph-count.tsx`,
    `event-code-door.tsx`'s corner mark and `row-tip.tsx` wear it. Model tests in `tooltip.test.tsx` (a tap toggles, a tap
    elsewhere and a tap on the words close, a cursor's click keeps the same words up, a key toggles, a stale mouse press
    never opens on a key, a finger's focus alone opens nothing, the server's paint carries the words as `title`); the three
    surfaces' own tests are unchanged and green. Real finger (CDP touch, `tap-touch.mjs`, `tap-pricing.mjs`,
    `tap-compositions.mjs`) on dev and on the production build: the Library's glyph count, `/pricing`'s Uploads row at
    375 (words at left 16, graphite) and the compositions' corner mark at 375 (words 8 clear of the glass) open on a tap,
    close on the next tap, on a tap elsewhere and on a tap on the words; the plain `Tooltip` still refuses a tap and its
    control's click lands. No console error or hydration warning on `/design/library/components`,
    `/design/library/compositions` and `/pricing` (`hydration.mjs`); the built `.next/server/app/pricing.html` carries the fine
    print as the `title` of all 17 row buttons.
  - `display.test.ts`'s "one screen on every ground, theme-independent" test is reshaped on purpose: its expired reason
    (`--display` declared once on `:root`) is dropped and its scar kept (the display is a set per ground, whole, and
    `.surface-display` reads what differs, never types it); each new guard was shown to fail against the old stylesheet.
- **Assets requested from Will:** none.
- **Board ideas:**
  - identity r4: `sheet/room.ts` can leave once this merges: production declares the same five `--display*` per ground,
    `--display-faint` is its `--faint` line, and `--display-light` is its `--vf-pop-light`; its `--accent: 8%` room line
    differs from production's 9% (a call below).
  - A touch-tap harness in `scripts/`: `_scratch/graphite-wiring/cdp.mjs` and `tap-touch.mjs` drive a real finger over CDP
    in a throwaway Chrome with Node's own WebSocket and no dependency; a lane that verifies a tap would use it instead of
    synthetic events.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `--display-light` is declared and read by nothing yet; the photographs' edge stays at 30% (Question 1).
  - A plain tooltip (an icon control's label) keeps Radix's 0 gutter; the popover, a menu and its submenu, the Add's rows
    and `TapTooltip`'s words keep 8 (RowTip passes its own 16).
  - `--accent`, a layer's wash and its chosen row's fill, is 9% on both grounds, as the brief says; r4's board has 8% in the room.
  - RowTip's words are 24px narrower: one `max-w-60` capsule, the measure the glyph count and the corner mark already had.
  - A finger's tap on the words closes them for the glyph count and the corner mark too (RowTip's rule), and RowTip gains the
    hydration gate (the label's `title` until then).
  - `TapTooltip` mounts its own `TooltipProvider` (delay 0, the root's), so an atom never throws outside the app's providers.
- **Look at first:**
  - `/design/library/components?key=...` in a dark theme: open DropdownMenu (Manage), Popover, Select and Toaster ("With its
    Undo"), hover a row: lit graphite, a 55% ring on a 9% wash; set the page to Light: the same layers are near-black as
    before. `/design/library/foundations` is the brand kit, "The display": nine tokens.
  - At 375 (the Library's compositions now, the real hub after the merge): the storage ring's popover 8px from the glass,
    the code's corner mark and the head's glyph counts toggling their words by tap, and `/pricing`'s Uploads and Deleted rows.
  - A photograph's edge with a laptop's browser zoomed out to 33% (Cmd and minus): lit, where it was gone.
  - Live: not run. A lane's branch is not on the alias (a lane push builds nothing), so the live pass (the host app's menus
    and toasts in a dark session, the storage ring and the corner mark on a real hub at 375, the pricing matrix) is the
    red-team's after the merge's build; the Library and `/pricing` show every part of it locally.
