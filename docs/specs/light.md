# Light: ruled, wired, and retired

> **STATUS: RULED AND SHIPPED** (Will, 2026-09-17, round eight: `depth=both`, `face=keep`,
> `sweep=skip`; rounds five and seven ruled the Aurora, its clock, the bloom, the halo and the beam).
> Not a proposal any more, and it holds no values: the shadows' one home is
> [`docs/systems/design-system.md`](../systems/design-system.md) ("Elevation contract"), their one
> source is `--shadow-lift` and `--shadow-layer` in `src/app/globals.css`, the bright edge is
> `[data-lit]` in the same file, and the Library shows both at `/design/library/foundations#elevation`
> and `#bright-edge`. The board retired with its directory at the wiring. This file is kept only until
> the spec docs of retired boards are folded and deleted together (ROADMAP, "the lab").

## What was decided

**Dark mode gets both shadows, by role** (`depth=both`: "I now see how step, ring, lift, and float
work together. Very good work."). Four techniques, one per height, in both modes: the lighter panel
and the thin outline on every surface, a small shadow ONLY where one object really overlaps another
of its own lightness, a larger one under anything the page keeps living behind. A surface lying flat
takes neither. One geometry, two sizes, one alpha ramp per ground; paper kept its bytes.

**The bright edge is kept, and polished** (`face=keep`: "I love the bright edge. It's a really nice
subtle design touch, but I think the implementation could use a tweak to feel more polished and
beautiful. The transparent border radius also revealed some mismatches here in the preview
roundings."). It ships on three kinds of surface (a photograph or a video, a framed screen, the QR
card), on dark grounds only, as light falling away from the top edge rather than a flat line, on the
box that owns the radius.

**The streak of light is banked** (`sweep=skip`: "I love that shimmer as a banked effect for later...
The shimmer feels more like a delight moment. A couple dozen photos being uploaded in a single batch
would cover the top of a gallery in shimmer."). It stays in the glow engine, unwired.

**Earlier rounds, all shipped:** light sorts by what it is doing and a lamp needs a PLACE rather than
an object throwing it (round five); the Aurora is one light in three kept forms (the seam, the throw,
the field), never on a light ground, on an 8 second clock, placed as a mix composed for each section;
the publish flourish is the house five; the bloom and the beam are kept, and the halo only to light
objects from behind (round seven).

## What the wiring found that the board could not

Silent failures, each now held by `src/lib/elevation-policy.test.ts` or
`src/components/shared/lit-edge-contract.test.ts`, or written where the next agent will meet it:

- **`overflow: hidden` clips at the padding box, which is exactly where a border ends.** An edge
  drawn ON a border is cut off to the pixel on a clipping host. The canvas player rounds its canvas
  instead of clipping it; the contract refuses a bordered lit host that clips.
- **An unlayered rule outranks every Tailwind utility.** `marketing.css`'s card-stack recipe sets a
  bare `box-shadow`, so `shadow-lift` on the footer's photo pile did nothing (and the plate's old
  `shadow-none` never had). The pile's lift rides inline, the recipe's hairline re-stated first.
- **The build's fallback for `color-mix` is the unmixed colour.** Lightning CSS writes
  `var(--foreground)` in place of each mix for an engine without it, which would be a solid white
  frame round every photograph. The edge is generated only inside an `@supports` that requires it.
- **Sonner draws a toast's focus ring inside its `box-shadow`.** A rule that sets only the shadow
  deletes the keyboard's focus mark; the rule re-states it, in the house ring colour.
- **`cn()` files the two shadow utilities under shadow COLOUR**, as it always did `shadow-float`.
  Harmless today; one `theme.shadow` line in `src/lib/utils.ts` closes it.
- **A shadow that falls on a photograph does not follow the page's ground.** Paper's ramp is the
  faint one, and a photograph is as bright in light mode as in dark.

## Banked with the streak of light, for whoever wires it

- **A light that lands ON an object is drawn OVER it.** Round seven mounted the sweep behind an opaque
  frame the same size as its own box, so the band travelled where nobody could see it. Over media the
  light also wants an additive blend, or it reads as haze.
- **The engine re-keys only a bloom on `runId`.** A replay of any other shape is a remount by the
  caller.
- **The engine's sweep is a loop.** An arrival needs the same two layers played once, armed by arrival
  rather than paused by `useAmbientPause`.
- **The engine's resting ring is not under its travelling ring.** `[data-glw-edge-rest]` is a child of
  the host inset by 20 pixels times `--glw-scale`, while the travelling ring's box is the host's own
  edge (measured at scale 2 on a 400 by 300 host: the ring at 0, 0, the rest ring 40 pixels inside it).
