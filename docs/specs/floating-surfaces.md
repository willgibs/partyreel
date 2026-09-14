# The floating layer: the contract, as proposed

> **ROLE:** the floating-surfaces exploration's proposal (the review wave, 2026-09-14;
> `lp/floating-surfaces`, integrated `e1f06d6`), kept here so it outlives the track manifest: the
> floating-layer contract rewritten with the three ruled values in angle brackets, the per-primitive
> table, and what the wiring round inherits. **NOT LAW** until ruled; bible 15 inherits the ruled
> contract and it replaces design-system.md's "THE FLOATING-LAYER CONTRACT" paragraph then. The
> board is `/design/c/floating-surfaces` while it stands (each frame an iframe at the canvas's true
> pixels running the gated scene route `/design/sandbox/floating-surfaces`, because a radix panel
> portals to `document.body` and leaves a zoom-fitted stage).

**The asks on the board:** the radius (sharp, nested or round, and whether the sheet and dialog
take a second token or the same one); the entrance (one clock, by frequency, or origin true); the
light in dark (lighter is closer, a soft shadow, or a lit edge); the outliers (select, drawer and
sheet onto the contract, or dropped).

**The finding the round turned on:** today's contract misses bible 9 inside itself. A menu draws an
8px container around 1.6px rows sitting in 4px of padding, so the highlighted row's corner never
nests. The three radius rungs each fix it from a different end, so the ruling is which family a
floating layer belongs to, not which number is prettier. A second departure is flagged rather than
chosen: a "by frequency" entrance puts rule 12 against rule 15's one entrance on this family.

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
