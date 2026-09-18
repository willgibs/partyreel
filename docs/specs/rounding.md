# The rounding: ruled, wired, and retired

> **STATUS: RULED AND SHIPPED** (Will, 2026-09-18, round seven: `family=c`, `actions=today`,
> `ladder=quarters` ("This keeps the final pixel calculations much cleaner."), `dead-rungs=drop`,
> `gap=pinned`). Not a proposal any more, and it holds no values: the tokens' one home is the `:root`
> block of [`src/app/globals.css`](../../src/app/globals.css), the derived steps are
> [`src/app/theme.css`](../../src/app/theme.css), the rule is
> [`docs/systems/design-system.md`](../systems/design-system.md) ("Rounding: sharp surfaces, round
> actions"), and the Library draws and measures every corner at `/design/library/foundations#radius`.
> The board retired with its directory at the wiring. This file is kept only until the spec docs of
> retired boards are folded and deleted together (ROADMAP, "the lab").

## What was decided

**Family C, soft** (`family=c`): an 8px surface, a 12px floating layer with its rows derived 4px
tighter, and a 4px photograph. At 8px a card finally has a corner you can see, and a 16px button is
still twice as round as the surface under it, so a control still reads as the pressable thing. `Card`
wears the surface token itself (`rounded-lg`), which is what "an 8px card" meant.

**The buttons where they ship** (`actions=today`): 0.4 of their height, with the two things the
option's own words carried. The 44px button is a named `cta` size at 1.1x the action corner, which
replaced 45 call sites forcing `size="lg"` up to h-11 and retired the 48px rung; and the guest entry
sheet moved onto the floating corner, off a button's.

**The derived steps in quarters** (`ladder=quarters`): 0.5 / 0.75 / 1 / 1.25 / 1.5 of `--radius`, and
**the top two dropped** (`dead-rungs=drop`), set to `initial` so Tailwind's own 24 and 32px defaults
cannot come back; the Badge that was faking a pill with `rounded-4xl` is `rounded-full`.

**The gap pinned** (`gap=pinned`): `--gap-gallery` is `max(3px, var(--radius-tile))`, so the gap
follows the photograph's corner and four corners never open a hole; every album-like grid wears the
token, and every photograph corner that was a literal wears `rounded-tile`.
