---
track: light-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c64275a3"
board: light            # retired by this lane
owns:
  - src/app/globals.css
  - src/app/theme.css
  - src/components/ui/
  - src/components/app/
  - src/components/guest/
  - src/components/shared/
  - src/components/social/
  - src/components/admin/
  - src/components/reel/
  - src/lib/reel/engine/player.tsx
  - src/components/marketing/sections/
  - src/components/marketing/frames/
  - src/components/marketing/help/
  - src/components/marketing/legal/
  - src/components/marketing/system/
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/components/marketing/chrome/footer-demo.tsx
  - src/app/(marketing)/(cinema)/help/
  - src/app/(marketing)/(paper)/contact/
  - src/lib/elevation-policy.test.ts
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/sandbox/media-kit/shoot.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(dev)/design/(shell)/library/marketing/
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/catalog.test.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/rules/influences.test.ts
  - docs/specs/light.md
reads:
  - docs/reviews/light.json
  - docs/design/rulings.md
  - src/app/(dev)/design/sandbox/floating-surfaces/
  - src/app/(dev)/design/rules/bible.ts
---

# lp/light-wiring

**Goal.** A wiring round, not an exploration: Will answered every step of the light board, so its picks
ship and the board retires into the Library. His rulings (`docs/reviews/light.json` round 8;
`docs/design/rulings.md`, the newest 2026-09-17 section):

- `depth=both`, the option that read "A small shadow where one card sits on another, and a larger one
  under menus, dialogs and toasts": "I now see how step, ring, lift, and float work together. Very good
  work."
- `face=keep`: "I love the bright edge. It's a really nice subtle design touch, but I think the
  implementation could use a tweak to feel more polished and beautiful. The transparent border radius
  also revealed some mismatches here in the preview roundings."
- `sweep=skip`: "I love that shimmer as a banked effect for later... The shimmer feels more like a
  delight moment." It stays in the engine, unwired. Do not touch it.

The sources were written for this lane: `sandbox/light/candidates.ts` (`SHADOW_FAMILY`, `LIT_FACE`: the
exact values and the two laws in its header, "never overwrite box-shadow where a ring lives" and the
re-stated zero) and `spec.ts`'s wiring notes. Read them first, then the four things below.

**1. The two shadows, by role.**
- Tokens: `--shadow-lift` and `--shadow-layer` in `globals.css` with the board's values (the light
  grounds keep today's bytes, so paper does not move; `.dark` and `.surface-ink` gain the ramp they never
  had) and their utilities beside `--shadow-float` in `theme.css`'s `@theme inline`.
- The LAYER (anything the page keeps living behind): dialog, sheet, popover, dropdown menu and its sub
  content, tooltip, the navigation menu's viewport, the guest entry shell, the help palette, plus the
  three that sit outside the floating-layer contract today and join it here: `select.tsx` (`rounded-md
  border shadow-md`), the navigation menu's indicator (`shadow-md`) and the toast (sonner sets no shadow
  of its own). Every one of these carries `ring-1`: set `--tw-shadow` or use the utility, never a bare
  `box-shadow` that deletes the hairline.
- The LIFT, in his answer's own words: "where one card sits on another". It goes ONLY where one object
  truly overlaps another of its own lightness (stacked photographs, a print deck, an overhanging card).
  The board's draft CSS reached wider (`[data-media-tile][data-static]`: every tile of a flat grid, every
  dashboard card); a flat grid tile overlaps nothing, so it takes none. List every overlap site you
  chose, and every shadow you removed, in Handoff.
- A flat surface takes neither, in either mode (bible 10: "A shadow on a flat dark ground is a smudge").
- The sweep: judge each call site ONCE by role. The map at the cut: 30 `--shadow-float` sites in
  production (15 `shadow-float` utilities: 11 floating primitives, 4 marketing cards; 15
  `shadow-[var(--shadow-float)]` on marketing mocks) and 42 raw Tailwind shadows (36 draw; `ui/tabs.tsx`'s
  active pill shedding its shadow in dark, `footer-demo.tsx`'s `shadow-none` and `feature-door.tsx`'s
  ring-as-shadow are not shadows). `--shadow-float` retires when nothing reads it; until then it stays
  the light-ground alias the board describes. `footer-contract.test.ts` pins the ink leaf's token NAMES,
  so its list follows the rename.
- The policy: `src/lib/elevation-policy.test.ts`, in the manner of `src/lib/type-ladder-policy.test.ts`: no
  raw `shadow-sm|md|lg|xl|2xl` and no arbitrary `shadow-[...]` on a production surface outside a short
  named allow-list with a reason each; the two tokens exist on every ground that re-declares the theme
  (`:root`/`.surface-paper`, `.dark`, `.surface-ink`). Function, never a value.

**2. The four working together, in the Library.** Foundations' Elevation section
(`library/foundations/page.tsx`, whose blurb still says "in dark, no shadows") becomes the legend Will
said finally made it legible: the lighter panel (step), the thin outline (ring), the small shadow (lift)
and the larger one (layer) on ONE real scene, one per height, with a line each saying when it is
reached for. A sibling client component in the `type-ladder.tsx` pattern; the board's `depth.tsx` scene
is the model (the front card ABOVE and over the back one, so its shadow lands on it). It must read in
both themes through the page's own light and dark split.

**3. The bright edge, polished.** Two defects in the board's version, both his:
- *The mismatch.* The cue sat on a bare wrapper with a hand-typed radius (`face.tsx`: `calc(var(--radius) *
  1.8)` restating `QrFrame`'s `rounded-2xl`, `2.5rem` restating `PhoneFrame`'s), and the pseudo-element was
  laid on the PADDING box while inheriting the BORDER box's radius, so on a bordered surface the edge and
  the corner were two different arcs (bible 9: "a ring with a radius of its own reads as a mistake"; the
  same law `ProCardBeam` now holds by measuring). ONE attribute, `data-lit`, replaces the board's three
  structural selectors (`.bg-card:has(.bg-white)` would have caught the admin's MFA code and the
  dashboard's QR chip). It sits on THE BOX THAT OWNS THE RADIUS, and the pseudo-element covers the border
  box (`inset` by the negative border width, `border-radius: inherit`), so it is concentric by
  construction. `event-card.tsx` marks an unrounded wrapper with `data-media-tile` today: the lit hook
  goes on its rounded box.
- *The polish.* A flat one pixel line on top of a border and a ring is a third outline. Make it read as
  light catching a bevel: brightest along the top, falling away down the sides to nothing at the bottom
  (a 1px gradient border drawn through `mask-composite`, or the equivalent that survives Safari), in the
  foreground colour at low alpha, never one of the five lamp hues (bible 3: those are light, this is
  material). Judge it at true size on a dark photograph AND a bright one: if it reads as a frame, it is
  too strong.
- Where: photographs and video (the masonry tiles, the player's canvas at `src/lib/reel/engine/player.tsx`,
  the marketing frames' media), framed screens (`PhoneFrame`, `BrowserFrame`'s children) and the QR card
  (`QrFrame`, the `/features/qr` plate, the app's QR surfaces you judge to be the same object). Dark
  grounds only, by the same fence pattern the Aurora uses (`:not(.dark *)`, `.surface-paper`): extend the
  ONE fence rule's list or write the rule so paper paints nothing; never a second copy of the fence.
- A Library entry with each surface beside a FIXED 4x corner (the board's `fit.tsx` `CornerInset` is the
  model, but give the inset box a square corner so its own radius does not sit beside the magnified one)
  is where Will judges the tweak. The contract pins FUNCTION only: the hook on the box that owns the
  radius, the radius inherited, drawn above the image, `pointer-events: none`, absent on paper, absent
  under nothing else. Never the look, never a number.

**4. The board retires, atomically.** `sandbox/light/` (nine files) goes; `sandbox/registry.ts` and
`(shell)/lab/boards.ts` drop it; the tests that use `light` as the STANDING-board example move to a board
that still stands (`_data/links.test.ts`, `_data/catalog.test.ts`, `registry.test.ts`'s `anchorFor`,
`rules/influences.test.ts`), as `88d0bec0` did for the palette; `docs/specs/light.md` is cut to its ruling
and the two `_data` tests that pin "NOT LAW" follow; `media-kit/shoot.ts`'s `askedBy: "light"` row is
re-pointed at the Library section that replaces the specimen. The retirement exception applies to two
files that stay in the Orchestrator's `owns`: your board's own lines in
`src/app/(dev)/design/touchpoints.ts` (both unions, the `board` block gone, `ruled` and `shipped` rewritten
and no longer saying "open", `lives` pointed at what landed) and `touchpoints.test.ts` (the standing
list). List both in the lane check as the exception. `docs/systems/design-system.md`'s "Elevation
contract" and its floating-layer paragraph are rewritten IN PLACE from the ruling (a fact inside your
lane; list it under System-doc edits).

Not in this round: the glow engine (`src/components/shared/glow.tsx` and its CSS block sit under paths
you own for the sweep's sake and are READ-ONLY here; `pro-card-beam.tsx` is the model for "the ring is
the object's own corner" and is not yours to change) and the sweep, the Aurora, anything on the floating-surfaces board
(Will is mid-review on it; its copied float family is its own wiring's to re-point), Card or any menu
anatomy, `marketing.css` (say in Handoff if its "no shadows" comment at the card surface needs a word),
`bible.ts`, the ledger, `docs/ASSETS.md` and the record (the Orchestrator's at the merge: bible 10 and
11's statuses and texts, `docs/reviews/light.json`'s deletion, ASSETS rows 10, 11, 15, 16).

**Binds.** The bible (9, 10 and 3 above all), the contracts of every component under a path you own
(`src/components/ui/*` is semicolon-free by its generator: match it), the policies
(`globals-theme-contract.test.ts`, `footer-contract.test.ts`, `marketing-css-policy.test.ts`,
`keyframe-uniqueness.test.ts`), and the two laws in `candidates.ts`'s header.
**Verify on.** Every floating primitive OPEN over a busy page in dark and in light, at 1440 and 375 (the
floating-surfaces board's scenes draw the real primitives and are the quickest place to open all of
them; read them, do not edit them), the real overlap sites, the three kinds of lit surface on a dark
photograph and a bright one, reduced motion. Subtle light is judged from lossless captures, never the
pane's scaled JPEGs: `scripts/lab-demo.mjs` shows the DevTools-protocol pattern, and a ready capture tool
is at `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b4ab430f-9f27-40b5-90a6-4177ea1d1021/scratchpad/cdp-shot.mjs`
(its header has the usage; write captures outside the repo). Localhost cannot sign in: never type a
password or an OTP, never click a Copy button in the shared pane, use your own pane tab by tabId. The
signed-in surfaces (the dashboard, an event page, the Studio, a dialog in the app) are the
Orchestrator's on the alias after the merge; "Look at first" is the exact path for that pass. Dev
server on port 3132, stopped by port (`lsof -ti tcp:3132 | xargs -I{} kill {}`). The gate, each step on
its own exit code: `pnpm design:rules`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, then
`pnpm lab:smoke --base http://localhost:3132`.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- What landed, one line per part; every overlap site that took the lift; every shadow removed and why
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
