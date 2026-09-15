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
  darkRoot,
  guarded,
  inside,
  panels,
  prefix,
  root,
  state,
} from "./candidates";

export const DIRECTIONS = ["today", "card", "glass", "command"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type DirectionMeta = {
  /** The name on the dock. */
  label: string;
  /** One line: what this direction believes a floating surface is. */
  thesis: string;
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
    thesis:
      "What ships: an 8px opaque panel, a hairline ring, a zoom and fade at one clock, nothing casting in dark.",
    changes: [
      "The baseline, kept on the dock so every comparison has a floor.",
      "Its own miss is measured below: the panel's corner does not nest around its rows.",
    ],
    cost: "Nothing, and that is the argument for it. It is also the layer Will says the app has outgrown.",
    paste: "Nothing to paste: this is the site as it stands.",
  },
  card: {
    label: "Card",
    thesis:
      "A floating surface is a small made object. It has a title, its groups are labelled, its rows sit on an icon rail with their state on the right, and the action that cannot be undone sits under a rule of its own.",
    changes: [
      "Anatomy: a header row with the subject of the menu, sections with quiet labels, a 20px icon rail, a trailing column for state or a shortcut, and a footer rail for the destructive row.",
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
    thesis:
      "The album's colour is the product, so the floating layer should let it through. One translucent pane of the room, lit along its top edge, with no boxes inside it at all.",
    changes: [
      "Material: the popover surface at 72 percent over an 18px backdrop blur, a hairline of light along the top edge, a border mixed from the foreground rather than a ring.",
      "Anatomy by subtraction: no header, no separators that draw, no boxes. A section is a quiet label and a gap; the lit row is a full-bleed wash rather than a chip.",
      "Radius: the action family, because a pane of light has no corner of its own and takes the roundest family in the system.",
      "Motion: it condenses. 200ms in from a 5px blur and 0.96 scale, 120ms out, so the panel resolves out of the room instead of popping over it.",
    ],
    cost: "Two real costs. A backdrop blur is a compositing layer per open panel, and over a flat app ground it buys nothing at all: on app-dark and app-light this direction is a slightly rounder panel. Walk it on cinema first, then on app-light, and rule on both.",
    paste:
      "The paste carries all of it: material, radius and motion are CSS, so glass is the one direction that needs no component change to try on the real site.",
  },
  command: {
    label: "Command",
    thesis:
      "A host's menu is a search problem, not a tree. One surface with a field at the top, grouped rows underneath, keyboard first, and no nested menu anywhere in the product.",
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
${root(scope)} {
  --flt-float: ${FLOAT_LIGHT};
}
${darkRoot(scope)} {
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
${state(scope, ALL, OPEN)} {
  animation: flt-card-in 160ms var(--ease-emphasis) both;
}
${state(scope, ALL, CLOSED)} {
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
${root(scope)} {
  --flt-glass: color-mix(in oklab, var(--popover) 72%, transparent);
  --flt-glass-edge: color-mix(in oklab, var(--foreground) 14%, transparent);
  --flt-glass-lit: inset 0 1px 0 0 oklch(1 0 0 / 0.65);
  --flt-float: ${FLOAT_LIGHT};
}
${darkRoot(scope)} {
  /* Darker mix and a fainter lit edge: at 72 percent over a 0.11 room the panel
     reads as a hole rather than a pane, and a 0.65 hairline is a scratch. */
  --flt-glass: color-mix(in oklab, var(--popover) 62%, transparent);
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
${state(scope, ALL, OPEN)} {
  animation: flt-glass-in 200ms var(--ease-emphasis) both;
}
${state(scope, ALL, CLOSED)} {
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
${root(scope)} {
  --flt-float: 0 1px 2px 0 oklch(0 0 0 / 0.1), ${FLOAT_LIGHT};
}
${darkRoot(scope)} {
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
${state(scope, ALL, OPEN)} {
  animation: flt-cmd-in 90ms var(--ease-emphasis) both;
}
${state(scope, ALL, CLOSED)} {
  animation: flt-cmd-out 70ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-cmd-edge-in 220ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-cmd-edge-out 160ms var(--ease-drawer) both;
}`)}`;
}

/** A direction as CSS, in any of the three scopes. "today" is the empty string:
 *  the site as it stands, with nothing overridden. */
export function directionCss(dir: Direction, scope: Scope): string {
  if (dir === "card") return cardCss(scope);
  if (dir === "glass") return glassCss(scope);
  if (dir === "command") return commandCss(scope);
  return "";
}

/** The label the tuner panel shows while a direction is applied to the site. */
export function directionLabel(dir: Direction): string {
  return `Floating layer: the ${DIRECTION_META[dir].label.toLowerCase()} direction`;
}
