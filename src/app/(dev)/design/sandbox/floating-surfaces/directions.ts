/**
 * THE THREE DIRECTIONS (floating-surfaces, round four, 2026-09-15).
 *
 * Rounds one to three asked what today's floating layer should be TUNED to:
 * three radius rungs, two entrances, one shadow. Will's review moved the
 * question: "I don't really love our app design in general, dropdown/nested
 * menus included... I prefer to use this track to explore new dropdown menu
 * designs and variants of our existing floating surfaces, rather than nailing
 * the exact details of the current options."
 *
 * So this file answers the ground-up question instead (bible 22). If this
 * product had no menus, no popovers and no sheets, what would the floating
 * layer be, for a host on a laptop and a guest on a phone? Three answers, and
 * they are deliberately three different KINDS of answer rather than three
 * shades of one:
 *
 *   card     THE OBJECT. A floating surface is a small made object: opaque,
 *            titled, its groups labelled, its rows on a rail, its destructive
 *            action below a rule. It changes the ANATOMY.
 *   glass    THE ROOM. The album's colour is the product, so the layer lets it
 *            through: one translucent pane, lit along its top edge, with no
 *            boxes inside it at all. It changes the MATERIAL.
 *   command  THE MODEL. A host's menu is a search problem, not a tree. One
 *            surface with a field at the top, grouped rows, keyboard first, and
 *            no nested menus anywhere. It changes the MODEL.
 *
 * WHAT A DIRECTION IS, AS CODE. Two halves, and the board says which is which
 * rather than blurring them:
 *
 *   - the MATERIAL, the RADIUS and the MOTION are CSS over the real primitives'
 *     own data-slots, generated here in the same three scopes as the rungs
 *     (candidates.ts), so a direction is a paste: "Apply to the site" puts it on
 *     the real header nav, the real dashboard menus and the guest drawer.
 *   - the ANATOMY and the MODEL are components. They live in menus.tsx, built
 *     on the real primitives, and a ruling for card or command is a change to
 *     `src/components/ui/` that the wiring round lands. No paste can add a
 *     header rail or a search field, and the board never pretends otherwise.
 *
 * Values are derivations of the RAW tokens (--radius, --radius-float,
 * --radius-action), never numbers, so the rounding round's retune carries into
 * a direction by itself, and a derived token is never read at runtime (@theme
 * inline compiles --radius-md and friends into utilities and leaves them empty,
 * which silently invalidates any calc() that names one).
 */

import {
  ALL,
  ANCHORED,
  BOX,
  EDGE_ANY,
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_RIGHT,
  EDGE_TOP,
  ITEMS,
  MENUS,
  OPEN,
  RING,
  CLOSED,
  type Scope,
  darkGround,
  lightGround,
  guarded,
  inside,
  panels,
  prefix,
  root,
  state,
} from "./candidates";

/**
 * THE SEVEN, AND WHY THE CATALOG GREW (round six, the revamp, 2026-09-16).
 *
 * Round four drew three directions because three was what the question needed
 * to be asked at all: an anatomy answer, a material answer, a model answer.
 * Will's standing ruling since ("designing a few, or many, variations always
 * beats a mountain of research text") asks a round to return a CATALOG, and
 * four cards where one is the floor is three real choices. So the board carries
 * three more, each a coherent answer somebody could prefer for a reason they
 * could say out loud, and each one an answer to a cost the first four pay:
 *
 *   compact  CARD'S COST, ANSWERED. Card's own line is that a two-row overflow
 *            becomes furniture. Compact is the opposite anatomy: the smallest
 *            honest menu, dense rows, a hairline between groups, nothing added.
 *   paper    THE LAYER STOPS FLOATING. No shadow at all, a real border, a
 *            squarer corner: a panel printed on the page rather than hovering
 *            over it. The cheapest direction on the board and the quietest.
 *   lift     THE EDGE COMES OFF. No ring, no border, and the shadow does the
 *            whole job, in light and in dark. The opposite of paper, and the
 *            strongest reading of bible 10's "a layer over content".
 */
export const DIRECTIONS = [
  "today",
  "card",
  "glass",
  "command",
  "compact",
  "paper",
  "lift",
] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type DirectionMeta = {
  /** The name on the dock. */
  label: string;
  /** The frame caption, and the line the direction panel leads with. Short
   *  enough to sit under a 328px specimen without pushing the row of four out of
   *  line.
   *
   *  ★ WHAT A DIRECTION BELIEVES IS NOT HERE. That sentence is the candidate's
   *  `rationale` in spec.ts, which is the one list the answer block, the meta
   *  panel and the review ledger read; this file carries what a direction
   *  CHANGES, what it costs, and how far its paste reaches. */
  oneLine: string;
  /** What it changes, in the order a reader meets it. */
  changes: string[];
  /** The honest cost, because a direction with no cost is a sales pitch. */
  cost: string;
  /** What the paste carries, and what only a component change can carry. */
  paste: string;
};

export const DIRECTION_META: Record<Direction, DirectionMeta> = {
  today: {
    label: "Today",
    oneLine:
      "An anonymous list: no title, no groups, and Delete the event one row under Download everything.",
    changes: [
      "The baseline, kept on the dock so every comparison has a floor.",
      "Its own miss is measured below: the panel's corner does not nest around its rows.",
    ],
    cost: "Nothing, and that is the argument for it. It is also the layer Will says the app has outgrown.",
    paste: "Nothing to paste: this is the site as it stands.",
  },
  card: {
    label: "Card",
    oneLine:
      "A title, labelled groups, an icon rail, state on the right, and the row you cannot undo under its own rule.",
    changes: [
      "Anatomy: a header row carrying the menu's title, groups with quiet labels, a 20px icon rail, a trailing column for state or a shortcut, and a footer rail for the row you cannot undo.",
      "Material: opaque popover, the hairline ring kept, and the light board's float shadow in light AND in dark, so the object has weight on a photograph.",
      "Radius: the nested rung, so the lit row's corner sits concentric inside the panel's (bible 9).",
      "Motion: 160ms in and 110ms out, a fade plus a 4px travel toward the trigger plus a hair of scale, on the emphasis curve.",
    ],
    cost: "The most markup of the three: every menu gains a header, a rail and a footer, so a two-row menu is suddenly furniture. It is the right answer for the event menu and the wrong one for a three-row overflow.",
    paste:
      "The paste carries the material, the radius and the motion. The header, the rail and the footer are anatomy: a change to dropdown-menu.tsx in the wiring round.",
  },
  glass: {
    label: "Glass",
    oneLine:
      "The boxes taken out: one translucent pane of the room, lit along its top edge.",
    changes: [
      "Material: the popover surface at 74 percent in dark and 80 in light, over an 18px backdrop blur, with a hairline of light along the top edge and a border mixed from the foreground rather than a ring. Those two numbers were measured on the board, not chosen: at 62 percent a row label disappeared into the photograph under it.",
      "Anatomy by subtraction: no header, no separators that draw, no boxes. A section is a quiet label and a gap; the lit row is a full-bleed wash rather than a chip.",
      "Radius: the action family, because a pane of light has no corner of its own and takes the roundest family in the system.",
      "Motion: it condenses. 200ms in from a 5px blur and 0.96 scale, 120ms out, so the panel resolves out of the room instead of popping over it.",
    ],
    cost: "Three real costs. A backdrop blur is a compositing layer per open panel. Over a flat app ground it buys nothing at all, so on app-dark and app-light this direction is a slightly rounder panel, which the glass section shows. And every transparency is a contrast risk: the mix had to come up twice before a quiet label survived a busy photograph, and the tooltip had to stop being inverted or its dark text sat on a dark pane. Walk it on cinema first, then on app-light, and rule on both.",
    paste:
      "The paste carries all of it: material, radius and motion are CSS, so glass is the one direction that needs no component change to try on the real site.",
  },
  command: {
    label: "Command",
    oneLine:
      "The list replaced by a field you type into, its groups flattened under it, and no menu opening a second menu.",
    changes: [
      "Model: the submenu is deleted. Everything a nested menu held is flattened into one list with a group label, and typing two letters is how you get to it.",
      "Anatomy: the field IS the header, rows carry a leading icon and a trailing group hint, and a hint rail at the foot says what the keys do.",
      "On the phone the same component is a bottom sheet with the field pinned at the top, so the model does not need a keyboard to work.",
      "Motion: 90ms in, 70ms out, a fade and a 4px travel with no scale, because this is the surface a host opens most.",
      "Radius: 12px panel, 8px rows, the widest gap between panel and row of the three, so a dense list still reads as rows.",
    ],
    cost: "Discoverability moves from the tree to the field: a host who never types sees a shorter list than a nested menu would have shown them. And it is a HOST answer, not a marketing one: the header's mega-menu wearing a search field is over-built, which the board shows rather than hides.",
    paste:
      "The paste carries the material, the radius and the motion. The field, the filtering and the flattening are the direction: they are components, and they are the ruling.",
  },
  compact: {
    label: "Compact",
    oneLine:
      "The smallest honest menu: dense rows, a hairline between groups, state on the right, nothing added.",
    changes: [
      "Anatomy by density: rows at 26px instead of 32, labels at 13px, 4px of panel padding, a hairline rule carrying each group's name instead of a label row, and the trailing column kept because a value is why you opened the menu.",
      "Material: opaque, the hairline ring kept, and a contact shadow only, so the panel sits on the page rather than over it.",
      "Radius: a 6px panel around 2px rows, which is the squarest corner that still nests.",
      "Motion: 90ms in and 60ms out, a fade and a 4px travel with no scale, because a dense list that scales reads as a jolt.",
    ],
    cost: "It gives nothing back to a menu that is hard to read: no title, so an overflow on a page of four events still makes you remember which one it belongs to, and a destructive row separated by colour alone.",
    paste:
      "The paste carries the material, the radius, the motion and the density, because row height and type size are CSS. The hairline group rule is markup: a change to dropdown-menu.tsx.",
  },
  paper: {
    label: "Paper",
    oneLine:
      "Printed on the page rather than floating over it: no shadow anywhere, a real border, a squarer corner.",
    changes: [
      "Material: no shadow in either mode. The ring is replaced by a real 1px border, so the panel is told apart by an edge and a step of ground rather than by depth.",
      "Radius: a 5px panel around 1px rows, the squarest corner on the board.",
      "Motion: a pure fade, 120ms in and 90ms out, with no travel and no scale at all.",
      "Anatomy: today's, unchanged. This direction is a claim about material and nothing else, which is why it is the cheapest one here.",
    ],
    cost: "Over a photograph it has the least separation of anything on the board: an edge and a ground step, with no depth at all. In dark that is the whole argument of the shadow call, taken to its end.",
    paste:
      "The paste carries all of it. Paper needs no component change, so it is the one direction that could land the afternoon it is ruled.",
  },
  lift: {
    label: "Lift",
    oneLine:
      "The edge comes off: no ring and no border, with a doubled shadow doing the whole job in light and in dark.",
    changes: [
      "Material: no ring, no border. Two shadow layers, one tight and one wide, at roughly twice the float family's spread, in light AND in dark.",
      "Radius: a 14px panel around 10px rows, the roundest on the board, because a shape with no edge needs its corner to say where it ends.",
      "Motion: 180ms in, rising 8px with a hair of scale, 120ms out. The panel arrives from under the page rather than beside the trigger.",
      "Anatomy: today's, unchanged, for the same reason as paper. These two are the two ends of one question about material.",
    ],
    cost: "It departs from the shipped elevation contract by name: a shadow in dark, on every panel, as the only thing separating it from the page. On a flat app screen with no photograph under it, that is a smudge rather than a lift.",
    paste:
      "The paste carries all of it, and it is the direction that most needs walking on a real page: a shadow with no edge under it reads differently on paper, on the room and on a photograph.",
  },
};

/* -- THE RADIUS EACH DIRECTION PROPOSES ------------------------------------
   A direction is an identity, so it brings its own corner rather than waiting
   for the rung ruling. `card` IS the nested rung, which is the point: the
   object direction inherits the correction the corner row measures. */
const RADIUS: Record<
  Exclude<Direction, "today">,
  { item: string; panel: string; lg: string }
> = {
  card: {
    item: "calc(var(--radius-float) - 4px)",
    panel: "var(--radius-float)",
    lg: "calc(var(--radius-float) * 2)",
  },
  glass: {
    item: "calc(var(--radius-action) - 6px)",
    panel: "var(--radius-action)",
    lg: "calc(var(--radius-action) * 1.75)",
  },
  command: {
    item: "var(--radius-float)",
    panel: "calc(var(--radius-float) * 1.5)",
    lg: "calc(var(--radius-float) * 2.5)",
  },
  // 6px around 2px: the squarest pair that still nests inside 4px of padding.
  compact: {
    item: "calc(var(--radius-float) * 0.75 - 4px)",
    panel: "calc(var(--radius-float) * 0.75)",
    lg: "calc(var(--radius-float) * 1.5)",
  },
  // 5px around 1px, off the SURFACE token: a printed card is a surface, and the
  // surface family is where the site's squarest corner already lives.
  paper: {
    item: "calc(var(--radius) * 0.5)",
    panel: "calc(var(--radius) * 2.5)",
    lg: "calc(var(--radius) * 5)",
  },
  // 14px around 10px: a shape with no edge needs its corner to say where it ends.
  lift: {
    item: "calc(var(--radius-float) * 1.75 - 4px)",
    panel: "calc(var(--radius-float) * 1.75)",
    lg: "calc(var(--radius-float) * 3)",
  },
};

/** The radius block, shared by all three directions: two tokens exactly one
 *  row-padding apart plus a third for the big boxes, the same shape the rungs
 *  use so a ruling on either lands in the same three token names. */
function radiusBlock(dir: Exclude<Direction, "today">, scope: Scope): string {
  const v = RADIUS[dir];
  return `${root(scope)} {
  --flt-r-item: ${v.item};
  --flt-r: ${v.panel};
  --flt-r-lg: ${v.lg};
}
${panels(scope, MENUS)} {
  border-radius: var(--flt-r);
}
${panels(scope, BOX)} {
  border-radius: var(--flt-r-lg);
}
${panels(scope, EDGE_BOTTOM)} {
  border-radius: var(--flt-r-lg) var(--flt-r-lg) 0 0;
}
${panels(scope, EDGE_TOP)} {
  border-radius: 0 0 var(--flt-r-lg) var(--flt-r-lg);
}
${panels(scope, EDGE_RIGHT)} {
  border-radius: var(--flt-r-lg) 0 0 var(--flt-r-lg);
}
${panels(scope, EDGE_LEFT)} {
  border-radius: 0 var(--flt-r-lg) var(--flt-r-lg) 0;
}
${inside(scope, ALL, ITEMS)} {
  border-radius: var(--flt-r-item);
}`;
}

/** The travel direction a panel enters from, read off the side radix resolved.
 *  Shared by every direction's motion block. */
function travel(scope: Scope): string {
  const p = prefix(scope);
  return `${p}[data-side="bottom"] { --flt-dy: -4px; }
${p}[data-side="top"] { --flt-dy: 4px; }
${p}[data-side="left"] { --flt-dx: 4px; }
${p}[data-side="right"] { --flt-dx: -4px; }
${p}[data-slot="sheet-content"][data-side="top"] { --flt-edge-dx: 0; --flt-edge-dy: -100%; }
${p}[data-slot="sheet-content"][data-side="right"] { --flt-edge-dx: 100%; --flt-edge-dy: 0; }
${p}[data-slot="sheet-content"][data-side="left"] { --flt-edge-dx: -100%; --flt-edge-dy: 0; }`;
}

/* The float shadow is the LIGHT board's family, verbatim (docs/specs/light.md:
   one geometry, two sizes, one alpha ramp per ground). Every direction that
   casts, casts this: two boards proposing two dark shadows is the exact failure
   rule 15 exists to prevent. */
const FLOAT_LIGHT =
  "0 4px 8px -2px oklch(0 0 0 / 0.09), 0 8px 16px -4px oklch(0 0 0 / 0.13)";
const FLOAT_DARK =
  "0 4px 8px -2px oklch(0 0 0 / 0.5), 0 8px 16px -4px oklch(0 0 0 / 0.62)";

function cardCss(scope: Scope): string {
  return `/* DIRECTION "CARD": the floating surface as a made object. Opaque, weighted,
   nested at the corner, entering with a short lift toward its trigger. The
   anatomy (header, icon rail, footer rail) is markup, not this block. */
${radiusBlock("card", scope)}
${lightGround(scope)} {
  --flt-float: ${FLOAT_LIGHT};
}
${darkGround(scope)} {
  --flt-float: ${FLOAT_DARK};
}
${panels(scope, ALL)} {
  /* The ring is composed back in first: ring-1 is a box-shadow in Tailwind v4,
     so a bare box-shadow silently deletes the hairline the panel ships. */
  box-shadow: ${RING}, var(--flt-float);
  backdrop-filter: none;
}
${guarded(`@keyframes flt-card-in {
  from { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)) scale(0.985); }
}
@keyframes flt-card-out {
  to { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)) scale(0.985); }
}
@keyframes flt-card-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-card-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-card-in 160ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-card-out 110ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-card-edge-in 260ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-card-edge-out 180ms var(--ease-drawer) both;
}`)}`;
}

function glassCss(scope: Scope): string {
  return `/* DIRECTION "GLASS": one pane of the room. The popover surface at 72 percent
   over a backdrop blur, a hairline of light along the top edge, and a border
   mixed from the foreground rather than a ring, so the photographs under the
   panel stay part of the picture. Rounder than anything else on the site on
   purpose: a pane of light has no corner of its own. */
${radiusBlock("glass", scope)}
${lightGround(scope)} {
  --flt-glass: color-mix(in oklab, var(--popover) 80%, transparent);
  --flt-glass-edge: color-mix(in oklab, var(--foreground) 14%, transparent);
  --flt-glass-lit: inset 0 1px 0 0 oklch(1 0 0 / 0.65);
  --flt-float: ${FLOAT_LIGHT};
}
${darkGround(scope)} {
  /* Measured on the board rather than guessed. At 62 percent over the album a
     row label at 55 percent opacity disappears into a photograph, which is a
     pane you cannot read: the mix is 74 and the labels come up with it. A
     fainter lit edge for the same reason a 0.65 hairline on a dark room is a
     scratch rather than a light. */
  --flt-glass: color-mix(in oklab, var(--popover) 74%, transparent);
  --flt-glass-edge: color-mix(in oklab, var(--foreground) 18%, transparent);
  --flt-glass-lit: inset 0 1px 0 0 oklch(1 0 0 / 0.16);
  --flt-float: ${FLOAT_DARK};
}
${panels(scope, ALL)} {
  background: var(--flt-glass);
  backdrop-filter: blur(18px) saturate(1.5);
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  /* The ring is replaced rather than composed: a ring AND a border on a
     translucent pane draw two edges a pixel apart. */
  --tw-ring-shadow: 0 0 #0000;
  border: 1px solid var(--flt-glass-edge);
  box-shadow: var(--flt-glass-lit), var(--flt-float);
}
${inside(scope, ALL, ITEMS)} {
  /* No chip on the lit row: a wash the width of the pane, so the pane stays one
     surface rather than a tray of tiles. */
  margin-inline: -4px;
  padding-inline: 10px;
}
${panels(scope, `${MENUS}, ${BOX}`)} [data-slot$="-separator"] {
  background: color-mix(in oklab, var(--foreground) 12%, transparent);
}
/* THE TOOLTIP STOPS BEING INVERTED, and it has to. ui/tooltip.tsx ships
   bg-foreground with primary-foreground text, so a material that repaints the
   background and leaves the colour alone puts dark text on a dark pane: it was
   unreadable on the board before this line, which is the honest way to find it.
   In glass the tooltip is a chip of the same pane as everything else, arrow
   included. */
${panels(scope, '[data-slot="tooltip-content"]')} {
  color: var(--popover-foreground);
}
${prefix(scope)}[data-slot="tooltip-content"] > span > svg,
${prefix(scope)}[data-slot="tooltip-content"] svg[class*="rotate-45"] {
  background: var(--flt-glass);
  fill: var(--flt-glass);
}
${guarded(`@keyframes flt-glass-in {
  from { opacity: 0; filter: blur(5px); transform: scale(0.96); }
  to { opacity: 1; filter: blur(0px); transform: scale(1); }
}
@keyframes flt-glass-out {
  to { opacity: 0; filter: blur(4px); transform: scale(0.97); }
}
@keyframes flt-glass-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-glass-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-glass-in 200ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-glass-out 120ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-glass-edge-in 280ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-glass-edge-out 180ms var(--ease-drawer) both;
}`)}`;
}

function commandCss(scope: Scope): string {
  return `/* DIRECTION "COMMAND": the surface a host opens most, so it arrives in 90ms
   with no scale at all. Opaque and dense, a 12px panel around 8px rows, with a
   contact shadow under the float family so a list sitting on a photograph has
   an edge at the bottom. The field, the filtering and the deleted submenu are
   the direction; this block is what a paste can carry of it. */
${radiusBlock("command", scope)}
${lightGround(scope)} {
  --flt-float: 0 1px 2px 0 oklch(0 0 0 / 0.1), ${FLOAT_LIGHT};
}
${darkGround(scope)} {
  --flt-float: 0 1px 2px 0 oklch(0 0 0 / 0.45), ${FLOAT_DARK};
}
${panels(scope, ALL)} {
  box-shadow: ${RING}, var(--flt-float);
  backdrop-filter: none;
}
${guarded(`@keyframes flt-cmd-in {
  from { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-cmd-out {
  to { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-cmd-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-cmd-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-cmd-in 90ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-cmd-out 70ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-cmd-edge-in 220ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-cmd-edge-out 160ms var(--ease-drawer) both;
}`)}`;
}

function compactCss(scope: Scope): string {
  return `/* DIRECTION "COMPACT": the smallest honest menu. Dense rows, the squarest
   corner that still nests, a contact shadow rather than a float, and a clock
   fast enough for a surface opened dozens of times in a session (bible 12).
   The density IS the direction, so the row metrics are part of the paste. */
${radiusBlock("compact", scope)}
${lightGround(scope)} {
  --flt-float: 0 1px 2px 0 oklch(0 0 0 / 0.12), 0 2px 6px -2px oklch(0 0 0 / 0.1);
}
${darkGround(scope)} {
  --flt-float: 0 1px 2px 0 oklch(0 0 0 / 0.5);
}
${panels(scope, ALL)} {
  box-shadow: ${RING}, var(--flt-float);
  backdrop-filter: none;
}
${panels(scope, MENUS)} {
  padding: 4px;
}
${inside(scope, ALL, ITEMS)} {
  /* 26px rows: h-7 minus the two pixels a 13px label gives back. A menu you
     open forty times a night should fit on one screen. */
  min-height: 26px;
  padding-block: 2px;
  font-size: 13px;
  line-height: 1.3;
}
${guarded(`@keyframes flt-compact-in {
  from { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-compact-out {
  to { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-compact-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-compact-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-compact-in 90ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-compact-out 60ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-compact-edge-in 220ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-compact-edge-out 160ms var(--ease-drawer) both;
}`)}`;
}

function paperCss(scope: Scope): string {
  return `/* DIRECTION "PAPER": the layer stops floating. No shadow in either mode, a
   real border where the ring was, the squarest corner on the board, and a fade
   with no travel and no scale. What tells a panel from the page is an edge and
   a step of ground, which is exactly what the shadow call is asking about. */
${radiusBlock("paper", scope)}
${panels(scope, ALL)} {
  /* The ring is REPLACED rather than composed: a ring and a border a pixel
     apart on an opaque panel draw two edges (the glass block's own lesson). */
  --tw-ring-shadow: 0 0 #0000;
  border: 1px solid var(--border);
  box-shadow: none;
  backdrop-filter: none;
}
${guarded(`@keyframes flt-paper-in {
  from { opacity: 0; }
}
@keyframes flt-paper-out {
  to { opacity: 0; }
}
@keyframes flt-paper-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-paper-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-paper-in 120ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-paper-out 90ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-paper-edge-in 240ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-paper-edge-out 170ms var(--ease-drawer) both;
}`)}`;
}

function liftCss(scope: Scope): string {
  return `/* DIRECTION "LIFT": the edge comes off and the light does everything. Two
   shadow layers at roughly twice the float family's spread, in light AND in
   dark, with no ring and no border under them. It departs from the shipped
   elevation contract by name, which is the point: bible 10 allows a shadow
   where a layer sits over content, and this is that reading taken to its end. */
${radiusBlock("lift", scope)}
${lightGround(scope)} {
  --flt-float: 0 6px 12px -4px oklch(0 0 0 / 0.12), 0 16px 32px -8px oklch(0 0 0 / 0.16);
}
${darkGround(scope)} {
  --flt-float: 0 6px 12px -4px oklch(0 0 0 / 0.55), 0 16px 32px -8px oklch(0 0 0 / 0.7);
}
${panels(scope, ALL)} {
  --tw-ring-shadow: 0 0 #0000;
  border: 0;
  box-shadow: var(--flt-float);
  backdrop-filter: none;
}
${guarded(`@keyframes flt-lift-in {
  from { opacity: 0; transform: translateY(8px) scale(0.99); }
}
@keyframes flt-lift-out {
  to { opacity: 0; transform: translateY(4px) scale(0.99); }
}
@keyframes flt-lift-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-lift-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${travel(scope)}
${state(scope, ANCHORED, OPEN)} {
  animation: flt-lift-in 180ms var(--ease-emphasis) both;
}
${state(scope, ANCHORED, CLOSED)} {
  animation: flt-lift-out 120ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-lift-edge-in 280ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-lift-edge-out 180ms var(--ease-drawer) both;
}`)}`;
}

/** A direction as CSS, in any of the three scopes. "today" is the empty string:
 *  the site as it stands, with nothing overridden. */
export function directionCss(dir: Direction, scope: Scope): string {
  if (dir === "card") return cardCss(scope);
  if (dir === "glass") return glassCss(scope);
  if (dir === "command") return commandCss(scope);
  if (dir === "compact") return compactCss(scope);
  if (dir === "paper") return paperCss(scope);
  if (dir === "lift") return liftCss(scope);
  return "";
}

/** The label the tuner panel shows while a direction is applied to the site. */
export function directionLabel(dir: Direction): string {
  return `Floating layer: the ${DIRECTION_META[dir].label.toLowerCase()} direction`;
}
