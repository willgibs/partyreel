# The floating layer: ruled, wired, and retired

> **STATUS: RULED AND SHIPPED** (Will, 2026-09-17, round seven: `direction=card`, `submenu=keep`,
> `radius=nested` confirmed by `roundness=nested`, `entrance=by-frequency`; the shadow ask left the
> round when the light board answered it with `depth=both`). Not a proposal any more, and it holds no
> values: the contract's one home is
> [`docs/systems/design-system.md`](../systems/design-system.md) ("The floating-layer contract"), its
> one source is [`src/components/ui/floating-layer.ts`](../../src/components/ui/floating-layer.ts),
> the menu's anatomy is `ui/dropdown-menu.tsx`, and
> [`floating-layer.test.ts`](../../src/components/ui/floating-layer.test.ts) is bible 15's first test.
> The board retired with its directory at the wiring. This file is kept only until the spec docs of
> retired boards are folded and deleted together (ROADMAP, "the lab").

## What was decided

**Card, as PARTS rather than as a shape** (`direction=card`: "Card is my overall favorite"). A menu
gets a title row saying what it belongs to, labelled groups, an icon rail so every label starts at one
x, a trailing column for the state you opened it to read, and a footer rail giving the action you
cannot undo a ground of its own. Each is a part a call site may leave out, because Card's own declared
cost is real: a two-row overflow wears the material, the corner, the entrance and the rail and says
nothing more.

**Glass's labels, and no glass** ("I like the more subtle group labels from Glass. I also do think the
glassy background would be more visually pleasant than the flat being used in Card now. However, I
prefer not to create a one-off instance of glass here. Rather, let's bank a near-term agent for a
dedicated Glass exploration across marketing and app so it feels more infused to our product."). The
label is sentence case with no tracking at 70 percent of the foreground; the surface stays opaque, and
the policy refuses a `backdrop-filter` on any panel until that exploration lands.

**Two levels, and the third cannot be composed** (`submenu=keep`: "Yes, this unlocks much more
comprehensive menus... However, we should not allow an additional third level of nesting. That gets
too complicated."). The cap is structural, not a note: each `Sub` publishes its depth and a third one
throws at render.

**An 8px panel around 4px rows** (`radius=nested`, confirmed by `roundness=nested`: "Still no visual
difference, but let's go with your pick for now. We can always adjust later once we start implementing
everything into the app."). Shipped as one derived pair off `--radius-float`, so his "adjust later" is
one token.

**Faster where you open often** (`entrance=by-frequency`). One entrance LANGUAGE per kind with bible
12 setting the clock inside it: instant 90/70 for the tooltip, the menu, the submenu and the select;
standard 200/150 for the popover, the dialog and the marketing nav; 300/200 for a sheet crossing the
screen. Reading bible 15 that way is what stops it disagreeing with bible 12, and the rewording of
rule 15 is Will's.

## What the wiring found that the board could not

- **The submenu bug is CONDITIONAL, not total**, which is why it reached production. The board
  reported that a nested submenu paints nothing; measured live, a submenu opened by HOVER on a
  settled parent paints fine. The real failure is that an un-portalled `SubContent` is a descendant of
  a panel that both scrolls and animates with a transform, and a transformed ancestor becomes the
  containing block for its `fixed` descendants: opened by a CLICK (which starts the parent's closing
  animation) it had a real measured box, its rows, and painted nothing. The Portal is still the fix;
  the contract is written against the condition rather than against "renders nothing".
- **Bible 15 had no test, and that is what the drift was made of.** Three primitives had each answered
  the corner, the entrance and the clock locally: the nav with `rounded-lg` and a stock shadow (fixed
  in the nav round), `select` with `rounded-md border` and no entrance at all, and three panels with
  three hand-typed clocks nobody had compared. A contract that lives in nine className strings cannot
  be held, so it is a module now.
- **A row's corner and its padding are ONE decision.** The nested pair only nests while the panel's
  padding equals the difference, so the rails inside a menu are all 4px and the derivation says so
  where it is written.
- **The label part was doing two jobs.** The account menu's identity block was a
  `DropdownMenuLabel` wearing a two-line flex column, so the part that names GROUPS also named the
  person. It is the title row now, which is what it always wanted to be.

## Still open, for whoever picks it up

- **The tenth surface is outside the family.** `guest/entry-shell.tsx` renders a raw vaul drawer that
  never goes through `ui/drawer.tsx`, with a literal radius, and it is the floating surface most
  people on this product will ever see. It was owned by another lane during this wiring.
- **`marketing/help/help-palette.tsx` builds its own floating panel** outside `src/components/ui/`,
  so it wears `rounded-float` by hand and the policy cannot reach it.
- **Compact, Paper and Lift** were refined rather than killed and landed nothing: a density variant, a
  no-shadow token block and an edgeless one. Nothing in the product asks for them yet.
