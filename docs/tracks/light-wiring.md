---
track: light-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # Added at handoff, the allowance the spawn paragraph names: GENERATED
  # artifacts the gate forces. `pnpm design:rules` rewrites both from the tree
  # (the new policy and the new contract change the counts), and the freshness
  # guard fails the gate if either is stale. Never hand-edited; regenerated
  # after the sync, and the one merge conflict (library.md) was resolved to
  # theirs and regenerated rather than resolved by hand.
  - docs/design/library.md
  - src/app/(dev)/design/rules/rules.generated.json
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

Nothing needed Will's ruling: every step of the board was already answered, and each call below was
the agent's to make from the ruling. Two are worth his eye at the sitting, and both ship as built:

- **How strong the bright edge is.** He kept it and asked for "a tweak to feel more polished and
  beautiful", which is a look, so it was built to the description (light falling away from the top
  edge, never a flat line) and tuned against a dark photograph and a bright one at 4x. It is 30
  percent of the foreground at the top corners, 13 at a third down, 4 at two thirds, gone before the
  foot. **Recommended: keep as built**; the Library's own section is where he judges it, and a retune
  is one gradient in `globals.css` that no test pins.
- **The lift is not on a flat grid tile.** The board's draft CSS reached wider
  (`[data-media-tile][data-static]`: every dashboard card and every flat gallery tile), and his
  answer's own words are "where one card sits on another", so a flat tile takes none.
  **Recommended: keep the narrow reading**; the widest visible consequence is that the dashboard's
  event cards look exactly as they do today.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

All in `docs/systems/design-system.md`, each a fact this lane shipped:

- **"Elevation contract (one depth technique per mode)" is rewritten as "Elevation contract (four
  heights, one job each)"**: the ruling's table (step, ring, lift, layer with what wears each and
  when it is reached for), the flat-surface rule, the one-geometry-two-sizes fact, and five
  landmines the wiring measured (the ring-and-box-shadow trap, the unlayered marketing recipe,
  `cn()`'s shadow grouping, the shadow that falls on a photograph, the policy's four refusals). The
  ANCHOR changed with the heading, so `touchpoints.ts`'s light row points at the new one and nothing
  else in the tree linked the old.
- **A new "The bright edge (`data-lit`): material, not elevation" subsection** under it: the three
  kinds of surface, the four facts the contract holds, and why it is generated only inside its
  `@supports`.
- **The floating-layer contract paragraph** now says `shadow-layer` (it said `shadow-float`, which
  drew nothing in dark) and names the three surfaces that joined the family here.
- **Three token-contract lines in Identity and the ink leaf**: a card on the page is its hairline and
  never a shadow; the ink leaf re-declares the dark ramp; a straddling child wears `shadow-lift`.
- **The "Under exploration" paragraph under SPILL's laws** becomes what the light board decided, past
  tense, since the board retired at its ruling. Bible 10 and 11's own texts are the Orchestrator's.

## Deferred (ROADMAP one-liners, bucket named)

- **Design:** teach `cn()` the two shadow utilities (one `theme: { shadow: [...] }` line in
  `src/lib/utils.ts`, the type ladder's own precedent). tailwind-merge files them under shadow
  COLOUR, so `cn("shadow-layer", "shadow-none")` keeps both and source order decides. Nothing in the
  product does that today; verified the one-line fix resolves it.
- **Design:** retire `--shadow-float` when the rounding board retires. It survives only as that
  board's two floating specimens' bridge; production reads it nowhere (the policy pins that), and
  the three declarations plus the `theme.css` mapping go together.
- **Engineering:** `src/lib/shared/use-sortable-grid.ts` sets a hand-typed pick-up `box-shadow` from
  JS during a drag; it should read `var(--shadow-layer)`. Allow-listed by name in the policy with
  that reason (the file sat outside this lane).
- **The lab:** `pnpm lab:smoke` fails one route that is not a regression: the legacy alias
  `/design/boom` resolves to the boundary probe that throws on purpose, and `EXPECT` whitelists only
  the canonical `/design/lab/tools/boom`. Pre-existing (the alias predates this lane's cut, proved
  against `9c657be6`); one line in `scripts/lab-smoke.mjs`, or drop the dead alias.

## Handoff (replaces the chat report)

**Head:** the tip of `lp/light-wiring`, pushed. Three commits carry it: `b18d7f55` (the wiring and the
retirement), `d1d41d4f` (the reel's still cover, two contracts following the rename), `d533ff79` (the
sync). **Synced with `origin/launch-prep` at `5293ec25`** (the v1 wordmark): one conflict, in the
generated `docs/design/library.md`, resolved to theirs and regenerated with the other artifacts. The
two files both sides touched merged cleanly and were read by eye afterwards: `touchpoints.ts` (their
logo row beside my retired light row, the `SandboxId` member gone) and `design-system.md` (their
wordmark bullet in Identity, my Elevation contract 630 lines below it). The kit's `TrueFit` landed on
their side and this lane owes it no migration: the board's own `fit.tsx` is deleted with the board.

**Gates on the synced tree**, each step's own exit code: `pnpm design:rules` 0 · the specimen
collector 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, all pre-existing at the cut) ·
`pnpm test` 0 (**2,161 in 234 files**) · `pnpm build` 0 (**127 routes**) · `pnpm lab:demo` 0 (24
steps, **0 frozen**; the light board's three steps are gone from the list, which is the retirement
working) · `pnpm lab:smoke` **exit 1, as expected**: 236 checks, 3 failing = the two glow boards over
the reading budget on purpose, plus one route that is NOT a regression (`/design/boom`, the Deferred
line above; the alias predates this lane's cut and I left `scripts/lab-smoke.mjs` alone, outside my
lane).

**Lane check.** `git diff --name-only origin/launch-prep...HEAD` is 86 files: every one inside `owns`
except five, each a named allowance:

- `src/app/(dev)/design/touchpoints.ts` and `touchpoints.test.ts`: **the retirement exception**, both
  unions and the standing list (the `board` block gone, `ruled`/`shipped`/`lives` rewritten, the
  `SandboxId` member dropped).
- `docs/systems/design-system.md`: **allowance (b)**, in place, every edit listed above.
- `docs/design/library.md` and `src/app/(dev)/design/rules/rules.generated.json`: **generated
  artifacts the gate forces**, added to `owns` at handoff with the reason.
  (`specimens.generated.json` came out byte-identical to theirs, so it is not in the diff at all, and
  no `for` line in `component-notes.ts` needed to move: the contract names only the seven hosts that
  live in the Library's own directories, on purpose, and the header says why.)

### What landed, one line per part

1. **The two shadows, by role.** `--shadow-lift` and `--shadow-layer` on all four grounds
   (`:root`/`.surface-paper`, `.dark`, `.surface-ink`), their utilities in `theme.css`, every call
   site judged once by role (below), and `src/lib/elevation-policy.test.ts` refusing the four ways
   back in. Paper did not move by one byte; dark and the ink slab gained the ramp they never had.
2. **The four working together, in the Library.** Foundations' Elevation section is the legend on the
   board's own scene (the front card above and over the back one, so the shadow lands on it), drawn
   with the production `Card`, `Button` and `EventCard`, printing each ground's live token values,
   true-size where there is room and fitted where there is not.
3. **The bright edge, polished.** One attribute, `data-lit`, on the box that owns the radius, with
   `data-lit="border"` pushing the edge out onto a bordered surface's own border. A falloff from the
   top edge, dark grounds only through `@variant dark`, generated only inside an `@supports` that
   requires `color-mix` and `mask-composite`. `src/components/shared/lit-edge-contract.test.ts` holds
   the function, mutation-tested: twelve deliberate breakages, twelve caught.
4. **The board retired, atomically.** The nine files of `sandbox/light/`, the registry, the client
   map, the `SandboxId` member, the four standing-board examples moved to `rounding`,
   `docs/specs/light.md` cut to its ruling, the media kit's row 16 re-pointed at the Library legend.

### Every surface that took the LAYER (anything the page keeps living behind)

The eleven floating primitives: **dialog · sheet · popover · dropdown-menu content · dropdown-menu
sub-content · select content · tooltip · navigation-menu viewport · navigation-menu viewport=false
content · the guest entry shell · the help palette's dialog**. Three of those sat outside the
floating-layer family until now and joined it here: **`select.tsx`'s content** (was `shadow-md`),
**the navigation menu's indicator arrow** (was `shadow-md`) and **the toast** (sonner ships its own
`0 4px 12px rgba(0,0,0,.1)`, a fourth geometry in light and nothing at all in dark; the rule in
`globals.css` outweighs it three attributes deep and **re-states its focus ring**, which sonner draws
inside the same `box-shadow`). In the app: **the event feed's floating action bar** (all five slots,
five hand-typed rgba shadows at two sizes before) and **the floating Add button**. In the reel:
**the reveal's share prompt** and **the Studio's confirmation card**. Marketing mocks that QUOTE one
of those: **the bulk-select bar, the zip dialog, the three cards floated over an album in
`visibility-frames`, the two gate cards in `access-switch`, the storage toast in `how-much-fits`**.

### Every overlap site that took the LIFT (one object really on another)

| Where | The overlap |
| --- | --- |
| `/help` the emblem strip | overhangs the cinema→paper cut |
| `/help` MiniAlbumScene, three prints | overlapping photographs |
| `/help` MiniAlbumScene, the QR chip | laid on the prints' corner |
| `/help` ReelScene, the poster | over the blank card behind it |
| `/help/[slug]` the "In short" card | overhangs the cut |
| `legal-document.tsx` the meta card | overhangs the cut |
| `guest-list-card.tsx` | overhangs the cut at lg+ |
| `contact-form.tsx` the postage stamp | overhangs the card's top edge |
| `print-shop.tsx` the welcome sign | overhangs the cut |
| `print-shop.tsx` the table card | laid on the poster |
| `plan-cards.tsx` the photo stacks (Free and Pro) | stacked prints, the worked case |
| `event-artifacts.tsx` the front badge | over two fanned behind it |
| `footer-demo.tsx` the pile and its plate | four photographs under a plate (INLINE, see below) |
| `event-card-qr.tsx` the white QR chip | laid on a photograph |
| `poster-card.tsx` the play badge | white disc on a cover still |
| `decomposition.tsx` the play badge | white disc on the poster |
| `reel-frame.tsx` the play badge | white disc on the player's well |

★ The footer's pile is the one lift that cannot be the utility: `marketing.css`'s
`[data-mkt] .mkt-stack-card` is UNLAYERED and sets a bare `box-shadow`, so it outranks every Tailwind
utility. It rides inline as `PILE_SHADOW`, the recipe's own hairline re-stated first so the inline
value does not delete it, reading the token and never a literal.

### Every shadow removed, with one reason each

- **`tabs.tsx`'s active pill** (`shadow-sm` plus the two `shadow-none` utilities that undid it in dark
  and on the line variant): the pill is a STEP on the muted track; flat.
- **`select.tsx`'s trigger** (`shadow-xs`): a field lying flat.
- **The help hero's search trigger** (`shadow-float`): a control lying flat, and on `/help` that
  shadow fell black on black where nobody ever saw it.
- **`help-facts-band.tsx`** (`shadow-xs`), **`profiles-section.tsx`'s card**, **`review-switch.tsx`'s
  desk card**, **`/help`'s three start-here cards**: flat cards on the page.
- **`home/album.tsx`'s and `careers-story.tsx`'s browser frames**, **careers' reel player**,
  **`phone-frame.tsx`'s bezel** (`shadow-sm`), **the canvas player's box** (`shadow-sm`): frames and
  screens standing flat. Home's album lost its overhang in an earlier round; the comment says so, and
  a frame that overhangs again declares the lift at its own call site.
- **Four segmented-control thumbs** (`access-switch`, `review-switch`, `calculator`,
  `plan-cards`'s cadence) and **`visibility-selector.tsx`'s thumb**: each is the page's white on a
  muted track, which is the STEP; the app's own control never had a shadow in dark.
- **`qr-hero.tsx`'s four preset swatches** (`shadow-sm`): they sit beside the plate, touching nothing.
- **`take-home-section.tsx`'s download pill** and **`entry-phone.tsx`'s white stock**: a white object
  on a scrimmed album and on a camera's dark view; neither needs help separating.
- **`unsave-button.tsx`'s chip** (`shadow-sm`): a blurred translucent chip, like every other chip on
  a tile.
- **`event-card.tsx`'s review chip** (`shadow-sm`): amber on a photograph separates by colour.
- **`file-dropzone.tsx`'s icon disc** (`shadow-sm`): flat inside its own dashed box.
- **`/help`'s CreateScene card** (`shadow-sm`): it overlaps a dashed outline, which has no face to
  separate from.
- **`feature-door.tsx`'s QR plate** (`shadow-[0_0_0_1px_oklch(1_0_0/0.08)]`): not a shadow at all;
  written as the `ring-1 ring-white/8` it always was.
- **`footer-demo.tsx`'s plate `shadow-none`**: it never did anything: the unlayered recipe outranked
  it, and on the root 404 there was no shadow to take off.

**One word the Orchestrator may want, outside my lane:** `marketing.css`'s card-stack recipe still
says "the card surface re-points at house tokens (hairline ring, no shadows — the dark elevation
contract)". Half of that is now stale: those cards carry the lift, inline, for the reason above.

**Proposed migrations / Worker / Vercel / Stripe / env changes:** none.

### Look at first (the signed-in pass on the alias)

Localhost cannot sign in, so everything below was verified on the floating-surfaces board's scene
route (which draws the REAL primitives) and on the public pages; these four are the ones only a
signed-in pass can reach. Dark and light both, 1440 and 375.

1. **`/dashboard`**: the event cards lie FLAT in their grid and must take **no shadow at all**, in
   either mode. That is the single most likely thing to look wrong ("did the lift land?"): it is the
   ruling, and the Library's legend says so in as many words. The QR chip on each card's corner is
   white on a photograph and DOES carry the lift. Open the account menu and an event's overflow menu:
   both wear the layer, and in dark their hairline must still be there (a bare `box-shadow` would
   have eaten it).
2. **An event page** (`/dashboard/<id>`): scroll until the floating action bar appears: it wears the
   layer over a feed that keeps scrolling behind it. Then the host gallery's tiles: each takes the
   **bright edge** in dark (a fine line along the top of each photograph, nothing at the foot) and
   nothing at all in light mode. Long-press a tile for the bulk bar, also a layer.
3. **The Studio** (`/dashboard/<id>/reel`): the canvas player's screen wears `data-lit="border"`: the
   light lands ON its 1px border, one arc, and the canvas inside is rounded rather than clipped.
   Confirm the publish light still reads (it is the Aurora's, untouched here) and that the
   confirmation card after a share wears the layer.
4. **A dialog in the app** (the event's share dialog, or Delete the event): the layer in both modes,
   its ring intact, and the toast that follows a copy wears the same layer rather than sonner's own.

Then, public and quick: **`/design/library/foundations#elevation`** (the legend, and split the block
to read both themes at once) and **`#bright-edge`** (each surface at true size beside its own corner
at 4x, on a forced dark stage with a paper proof strip under it, because the edge exists on dark
grounds only and a Library read in light would otherwise show a page of surfaces with nothing on
them).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). The light board's picks shipped and the board
retired. Depth became four techniques with one job each: the step and the ring on every surface, a
small shadow (`--shadow-lift`) only where one object really overlaps another, a larger one
(`--shadow-layer`) under anything the page keeps living behind, and nothing at all under a surface
lying flat, in either mode. Paper kept its bytes; dark and the ink slab gained the ramp that made
them read as shadowless. Forty-five raw shadows and thirty readers of one token were judged once each
by role, three surfaces joined the floating family (select's content, the nav indicator, the toast),
and `elevation-policy.test.ts` now refuses the four ways back in. The bright edge shipped as one
attribute on the box that owns the radius, lit from the top edge and fenced to dark grounds through
the single definition of `dark`; its contract was mutation-tested twelve ways. Foundations gained the
legend Will said made the system legible, and a section where the edge is judged at 4x.
