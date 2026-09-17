# The type scale: ruled, wired, and retired

> **STATUS: RULED AND SHIPPED** (Will, 2026-09-17: `ladder=b`, `tracking=adopt`, `not-found=on-ladder`,
> no notes). Not a proposal any more, and it holds no numbers: the ladder's one home is
> [`docs/systems/design-system.md`](../systems/design-system.md) ("The type ladder"), its one source
> is the `@theme` block in `src/app/theme.css`, and the Library draws it at true size from those live
> tokens at `/design/library/foundations#ladder`. The board retired with its directory at the wiring.
> This file is kept only until the spec docs of retired boards are folded and deleted together
> (ROADMAP, "the lab").

## What was decided

**B, rungs**, on both halves of the site. One rung set from 12 to 160 with the ratio widening as it
climbs, because one ratio cannot serve a 160px masthead and a 14px label. Nine named steps, six for
marketing and three for the app, named ONCE: `CardTitle` is one component shipping on /pricing and on
the dashboard, and two sets would have had to answer which one it wears.

**The law is the travel, not the sizes.** A marketing step moves exactly four rungs between 375 and
1440, an app step moves one, the card step moves none. That is bible 2 ("marketing may be louder,
scale included") written as arithmetic rather than as judgement.

**Each size carries its own spacing** (`tracking=adopt`), tighter as it climbs, in place of the flat
-0.03em that `font-heading` applied from 160px down to 16px. **The dead-link title joined the set**
(`not-found=on-ladder`): it was the one h1 on the site set in the body face.

## What the wiring found that the board could not

Three failures that are invisible in a source file, all three now held by
`src/lib/type-ladder-policy.test.ts`:

- **A step may not take a name the colour namespace owns.** Tailwind v4 resolves `text-*` as a colour
  before a font size, so the board's `card` step beside the long-standing `--color-card` would have
  been a token no className could ever reach. It ships as `card-title`.
- **`cn()` drops a step it has never heard of.** tailwind-merge does not read the stylesheet, so an
  unknown `text-*` falls into its colour group: `cn("font-heading text-chapter text-white")` returned
  `font-heading text-white`. The ladder is declared in `src/lib/utils.ts` for that reason.
- **A step beats `font-heading`, and a `tracking-*` beats the step.** Tailwind sorts the utilities
  layer by property, so a custom `@utility` lands before the size utilities and the step's own
  letter-spacing wins; but `tracking-tight` resolves to 0em here and cancels it through
  `--tw-tracking`. The flat value stays in `font-heading` as the fallback for everything off the
  ladder.
