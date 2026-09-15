/**
 * THE CANDIDATES, AS CSS (floating-surfaces, round two, 2026-09-14).
 *
 * Round one kept the rungs in board.css and described the paste in the record.
 * Two things were wrong with that. The board showed a stage-local approximation
 * of a candidate rather than the candidate, and the paste a ruling would land
 * was prose. So the rungs are generated here instead, from one table of values,
 * in three scopes:
 *
 *   "frame"  every panel in the frame document wears it (the board's knobs);
 *   "panel"  one panel wears it, by a class on the panel itself, which is what
 *            lets four rungs of a ladder share one document;
 *   "site"   the block a board hands the whole site through setCandidateCss,
 *            guarded by html:not([data-flt-frame]) so it never reaches the
 *            board's own frames and makes the "today" rung lie.
 *
 * The consequence is the point: what row 3 renders IS what "Apply to the site"
 * pastes, character for character apart from that guard. A rung cannot drift
 * from its proposal because there is only one of them.
 *
 * Every selector is a real primitive's own data-slot or class, never a stage
 * class, so the block is a legal paste. The wiring round moves these
 * declarations into the primitives' own className strings; the values are
 * written as derivations of the raw tokens, so the rounding round's retune of
 * --radius / --radius-float / --radius-action still carries.
 *
 * Nothing here has "use client": the scene route is a Server Component and has
 * to build the same CSS for the first paint.
 */

/* -- THE FAMILY, AS SELECTORS ----------------------------------------------
   Ten surfaces, not the nine of round one: guest/entry-shell.tsx renders a RAW
   vaul drawer ([data-entry-drawer]) that never goes through ui/drawer.tsx, and
   it is the floating surface the most people actually see (every guest who
   scans a QR meets it before anything else). It carries a literal radius,
   calc(var(--radius-action) * 1.4), which is the second literal on the layer
   after the tooltip arrow's. It belongs in the family. */

/** Anchored panels: the radius of a menu, and the surface every rung is about. */
export const MENUS = [
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dropdown-menu-sub-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="tooltip-content"]',
  '[data-slot="select-content"]',
  '[data-slot="navigation-menu-viewport"]',
  ".cn-toast",
].join(", ");

/** The centred box: one step larger than a menu under every rung. */
export const BOX = '[data-slot="dialog-content"]';

/* Edge-attached: only the corners that stay on screen round, so every side
   needs its own line. ALL FOUR, which round one did not have and which cost it
   the one call site that exists: ui/sheet.tsx is called exactly once in the
   product, by the marketing mobile menu, and that sheet enters from the TOP. A
   candidate that covered bottom and right reached nothing real. */
export const EDGE_BOTTOM = [
  '[data-slot="sheet-content"][data-side="bottom"]',
  '[data-vaul-drawer-direction="bottom"]',
  "[data-entry-drawer]",
].join(", ");

export const EDGE_TOP = [
  '[data-slot="sheet-content"][data-side="top"]',
  '[data-vaul-drawer-direction="top"]',
].join(", ");

/** The host's side sheet at 1440. */
export const EDGE_RIGHT = [
  '[data-slot="sheet-content"][data-side="right"]',
  '[data-vaul-drawer-direction="right"]',
].join(", ");

export const EDGE_LEFT = [
  '[data-slot="sheet-content"][data-side="left"]',
  '[data-vaul-drawer-direction="left"]',
].join(", ");

/** The rows inside a panel. Scoped UNDER a panel on purpose: [data-slot$="-item"]
 *  also matches navigation-menu-item, which is an <li> in the trigger bar and
 *  not a row in a panel at all. */
export const ITEMS = [
  '[data-slot$="-item"]',
  '[data-slot="dropdown-menu-sub-trigger"]',
  '[data-slot="navigation-menu-link"]',
].join(", ");

/** Every panel, for the light and the entrance (which do not care about size). */
export const ALL = [MENUS, BOX, EDGE_BOTTOM, EDGE_TOP, EDGE_RIGHT, EDGE_LEFT].join(
  ", ",
);

/** High-frequency: opened dozens of times in a working session. */
export const HIGH = [
  '[data-slot="tooltip-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dropdown-menu-sub-content"]',
  '[data-slot="select-content"]',
  '[data-slot="navigation-menu-viewport"]',
].join(", ");

/** Occasional: a decision, a confirmation, a piece of news. */
export const OCCASIONAL = [
  '[data-slot="popover-content"]',
  '[data-slot="dialog-content"]',
  ".cn-toast",
].join(", ");

/** The edge family keeps a slide on every rung: a sheet that zooms is a
 *  different component. Only its clock moves. The guest entry drawer is NOT in
 *  here: vaul drives its own transform for the drag, and an animation on top of
 *  that fights the gesture. */
export const EDGE_ANY = [
  '[data-slot="sheet-content"]',
  '[data-slot="drawer-content"]',
].join(", ");

export const OPEN = '[data-state="open"], [data-state="delayed-open"], [data-state="instant-open"]';
export const CLOSED = '[data-state="closed"]';

export type Scope = "frame" | "site" | { panel: string };

/** The guard that keeps a site-wide block out of the board's own frames, so the
 *  ladders keep telling the truth while a candidate is applied to the site. */
export const NOT_FRAME = "html:not([data-flt-frame])";

export function prefix(scope: Scope): string {
  return scope === "site" ? `${NOT_FRAME} ` : "";
}

/** Where a rung's custom properties are declared. */
export function root(scope: Scope): string {
  if (typeof scope === "object") return scope.panel;
  return scope === "site" ? NOT_FRAME : ":root";
}

/** Where a rung's DARK-GROUND values are declared, which is not simply the root
 *  selector with `.dark` bolted on. A panel-scoped rung declares its value ON
 *  the panel, and a custom property set on the element itself beats the same
 *  property inherited from <html> whatever the ground rule's specificity: the
 *  dark value has to land on the panel too, qualified by the ground as an
 *  ancestor. It cost the light ladder a round: every rung drew its LIGHT values
 *  on cinema and the dark answers were never actually on the board. */
export function darkRoot(scope: Scope): string {
  if (typeof scope === "object") {
    return `:is(.dark, .surface-ink) ${scope.panel}`;
  }
  return scope === "site"
    ? `${NOT_FRAME}:is(.dark, .surface-ink)`
    : ":is(.dark, .surface-ink)";
}

/** A selector for a group of panels under this scope. */
export function panels(scope: Scope, group: string): string {
  if (typeof scope === "object") return `:is(${group})${scope.panel}`;
  return `${prefix(scope)}:is(${group})`;
}

/** A selector for something INSIDE a panel under this scope. */
export function inside(scope: Scope, group: string, child: string): string {
  if (typeof scope === "object") return `${scope.panel} :is(${child})`;
  return `${prefix(scope)}:is(${group}) :is(${child})`;
}

/** A state selector on the panels themselves. */
export function state(scope: Scope, group: string, states: string): string {
  return `${panels(scope, group)}:is(${states})`;
}

/* -- 1. THE RADIUS ---------------------------------------------------------
   All three rungs obey bible 9 (anything drawn around an object takes the
   object's radius plus its offset): a menu's rows sit inside p-1, so the
   container is always the row radius + 4px. They differ in which end they
   anchor to, which is the actual question.

   Today anchors NEITHER end: an 8px container around 1.6px rows in 4px of
   padding, so the lit row's corner does not nest inside the panel's. Row 2 of
   the board measures that off the live DOM rather than asserting it. */

export const RADIUS_RUNGS = ["sharp", "nested", "round"] as const;
export type RadiusRung = (typeof RADIUS_RUNGS)[number];

type RadiusValues = { item: string; panel: string; lg: string; note: string };

/** Written as derivations of the RAW tokens, never as numbers: a derived token
 *  (--radius-md and the rest of the scale) is compiled into its utilities by
 *  @theme inline and is EMPTY at runtime, and an empty var inside a calc()
 *  invalidates the declaration silently. --radius, --radius-float and
 *  --radius-action are declared in globals.css :root and do resolve. */
export const RADIUS: Record<RadiusRung, RadiusValues> = {
  sharp: {
    item: "calc(var(--radius) * 0.8)",
    panel: "calc(var(--radius) * 0.8 + 4px)",
    lg: "calc((var(--radius) * 0.8 + 4px) * 2)",
    note: "the surface family: rows at the 1.6px surface radius, the panel only as round as what it holds",
  },
  nested: {
    item: "calc(var(--radius-float) - 4px)",
    panel: "var(--radius-float)",
    lg: "calc(var(--radius-float) * 2)",
    note: "today's ratified container, corrected: the 8px stays and the rows rise to meet it",
  },
  round: {
    item: "calc(var(--radius-action) * 0.5)",
    panel: "calc(var(--radius-action) * 0.5 + 4px)",
    lg: "calc(var(--radius-action) * 1.5)",
    note: "the action family: a menu is a cluster of things you press, so its rows round like buttons",
  },
};

export function radiusCss(rung: RadiusRung, scope: Scope): string {
  const v = RADIUS[rung];
  return `/* THE FLOATING RADIUS, rung "${rung}": ${v.note}.
   Two tokens exactly one row-padding apart, so the lit row nests (bible 9),
   and a third for the big boxes: a 5.6px corner on a full-width bottom sheet
   reads square. The wiring round names these --radius-float-item and
   --radius-float-lg in globals.css and drops this block. */
${root(scope)} {
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

/* -- 2. THE LIGHT IN DARK --------------------------------------------------
   Bible 10 as rewritten allows a shadow where a layer sits over content, and a
   floating layer is that case by definition, so the question in dark is a
   binary: nothing casts (the popover surface sits lighter than the ground and
   the ring draws the edge, which is what ships), or the shadow comes back.

   The "shadow" rung is NOT this board's invention: it is the light board's
   proposed --lgt-float family verbatim (docs/specs/light.md: one geometry, two
   sizes, one alpha ramp per ground; float is lift at double the offsets). Two
   boards proposing two different dark shadows would be the exact failure rule
   15 exists to prevent, so this board adopts that one and the two rulings
   collapse into one.

   THE RUNG composes var(--tw-ring-shadow) first. Round one wrote a bare
   box-shadow and silently deleted the ring the dropdown, the popover and the
   entry drawer ship (ring-1 is a box-shadow in Tailwind v4, so overriding the
   property erases it). The fallback covers the primitives with no ring. */

/* ROUND THREE CUT TWO OF THE THREE RUNGS, and both cuts are the same lesson:
   a ladder rung has to be a different ANSWER, not a different drawing.

   "Lighter is closer" was a rung and it is what ships: its block set
   box-shadow to the ring plus --shadow-float, which is the declaration already
   on the panel, so the ladder carried two columns that were the same column and
   the toggle offered "today" beside a rung that meant today. It is the baseline
   now, labelled as what ships, and the ladder is a binary: keep it, or let the
   shadow back in dark.

   "A lit edge" (a hairline of light along the top, a dark one under the bottom)
   was a third answer and the light board's doctrine rules it out of this job:
   the LIT FACE there is material, not elevation, and belongs to a face that is
   catching light (a media frame, a screen, a plate). A menu over content is the
   FLOAT case by that doctrine's own definition. Shipping it here would have
   asked Will to rule a second family into existence on a board whose whole
   argument is that the family should be one. */

export const LIGHT_RUNGS = ["shadow"] as const;
export type LightRung = (typeof LIGHT_RUNGS)[number];

/** The ring the primitive already ships, put back. */
export const RING = "var(--tw-ring-shadow, 0 0 #0000)";

export const LIGHT_LABEL: Record<LightRung, string> = {
  shadow: "a soft shadow",
};

export function lightCss(rung: LightRung, scope: Scope): string {
  const head = `/* THE LIGHT ON A FLOATING LAYER, rung "${rung}". Light ground first,
   dark ground second: what changes between them is the ALPHA, not the shape,
   because a shadow has to be darker than what it falls on and 6% of black over
   oklch(0.11) is arithmetically invisible. */`;
  return `${head}
${root(scope)} {
  /* ROUND THREE, an honesty fix. These two alphas were 0.12 and 0.16 while the
     block above claimed the light board's family verbatim; the light board's
     own sheet declares --lgt-float on a LIGHT ground as 0.09 and 0.13
     (docs/specs/light.md, its round-two correction: paper does not move, dark
     gains the ramp it never had). They are those numbers now, so the claim and
     the paste agree and a ruling on one board cannot contradict the other. */
  --flt-float:
    0 4px 8px -2px oklch(0 0 0 / 0.09), 0 8px 16px -4px oklch(0 0 0 / 0.13);
}
${darkRoot(scope)} {
  --flt-float:
    0 4px 8px -2px oklch(0 0 0 / 0.5), 0 8px 16px -4px oklch(0 0 0 / 0.62);
}
${panels(scope, ALL)} {
  box-shadow: ${RING}, var(--flt-float);
}`;
}

/* -- 3. THE ENTRANCE -------------------------------------------------------
   The rung that is a bible question rather than a number. Rule 15 says one
   entrance for the family; rule 12 says animate by frequency. On this family
   they disagree, and only Will can rule which wins.

   The keyframes are carried in the block itself, under the flt- prefix, so the
   paste stands alone on a real page where board.css is not loaded. */

/* ROUND THREE CUT THE THIRD RUNG. "Origin true" (grow from 0.92 with a 6px
   travel) was on round two's board and it is gone: it answers a different
   question from the one this row asks. The entrance ask is rule 15's one
   entrance against rule 12's by-frequency, which is a question about how FAST a
   surface moves and how many clocks the family keeps; origin true is one clock
   with a different shape, so it sat in the ladder splitting attention without
   changing the ruling. Two rungs, one word to rule. */
export const ENTRANCE_RUNGS = ["one-clock", "by-frequency"] as const;
export type EntranceRung = (typeof ENTRANCE_RUNGS)[number];

export const ENTRANCE_LABEL: Record<EntranceRung, string> = {
  "one-clock": "one clock",
  "by-frequency": "by frequency",
};

/** The travel direction, read off the side radix resolved, plus the keyframes.
 *  Shared by every rung, emitted once per block. */
function entranceBase(scope: Scope): string {
  const p = prefix(scope);
  return `@keyframes flt-zoom-in {
  from { opacity: 0; transform: scale(0.95); }
}
@keyframes flt-zoom-out {
  to { opacity: 0; transform: scale(0.95); }
}
@keyframes flt-slip-in {
  from { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-slip-out {
  to { opacity: 0; transform: translate(var(--flt-dx, 0px), var(--flt-dy, 0px)); }
}
@keyframes flt-edge-in {
  from { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
@keyframes flt-edge-out {
  to { transform: translate(var(--flt-edge-dx, 0), var(--flt-edge-dy, 100%)); }
}
${p}[data-side="bottom"] { --flt-dy: -6px; }
${p}[data-side="top"] { --flt-dy: 6px; }
${p}[data-side="left"] { --flt-dx: 6px; }
${p}[data-side="right"] { --flt-dx: -6px; }
${p}[data-slot="sheet-content"][data-side="top"] { --flt-edge-dx: 0; --flt-edge-dy: -100%; }
${p}[data-slot="sheet-content"][data-side="right"] { --flt-edge-dx: 100%; --flt-edge-dy: 0; }
${p}[data-slot="sheet-content"][data-side="left"] { --flt-edge-dx: -100%; --flt-edge-dy: 0; }`;
}

/** Bible 14: every animation lives inside the reduced-motion preference block.
 *  The wrap is per BLOCK rather than left to the separate reduced-motion patch,
 *  so an entrance candidate applied on its own is already correct for a reader
 *  who asked for less motion. The patch below is for the animations the
 *  PRIMITIVES ship, which have no such block and are the standing hole. */
export function guarded(body: string): string {
  return `@media (prefers-reduced-motion: no-preference) {\n${body
    .split("\n")
    .map((l) => (l ? `  ${l}` : l))
    .join("\n")}\n}`;
}

export function entranceCss(rung: EntranceRung, scope: Scope): string {
  const base = entranceBase(scope);
  if (rung === "one-clock") {
    return guarded(`/* THE ENTRANCE, rung "one clock": rule 15 taken literally. One origin-aware
   zoom-fade for the whole family at one beat, 175ms in and 120ms out on the
   emphasis curve, exits faster than enters. The edge family keeps its slide. */
${base}
${state(scope, ALL, OPEN)} {
  animation: flt-zoom-in 175ms var(--ease-emphasis) both;
}
${state(scope, ALL, CLOSED)} {
  animation: flt-zoom-out 120ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-edge-in 300ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-edge-out 200ms var(--ease-drawer) both;
}`);
  }
  return guarded(`/* THE ENTRANCE, rung "by frequency": rule 12 taken literally, applied to the
   family instead of to one control. A tooltip or a menu is opened fifty times
   in an evening, so it lands in 90ms on a fade plus the 6px travel with no zoom
   at all (the travel is the one --flt-dx/--flt-dy the base declares, so the
   number here is the number that runs); a
   popover, a dialog or a toast is occasional, so it keeps a 220ms beat. Two
   clocks, chosen by how often the surface appears. This is the rung that argues
   with rule 15's "one entrance", deliberately. */
${base}
${state(scope, HIGH, OPEN)} {
  animation: flt-slip-in 90ms var(--ease-emphasis) both;
}
${state(scope, HIGH, CLOSED)} {
  animation: flt-slip-out 70ms var(--ease-emphasis) both;
}
${state(scope, OCCASIONAL, OPEN)} {
  animation: flt-zoom-in 220ms var(--ease-emphasis) both;
}
${state(scope, OCCASIONAL, CLOSED)} {
  animation: flt-zoom-out 150ms var(--ease-emphasis) both;
}
${state(scope, EDGE_ANY, OPEN)} {
  animation: flt-edge-in 220ms var(--ease-drawer) both;
}
${state(scope, EDGE_ANY, CLOSED)} {
  animation: flt-edge-out 160ms var(--ease-drawer) both;
}`);
}

/* -- 4. THE REDUCED-MOTION GUARD -------------------------------------------
   Not a candidate, and NOT the hole round one reported. tw-animate-css ships no
   reduced-motion guard of its own, but globals.css:855 has carried a global one
   since 2026-06-11 (`@layer base`, every animation and transition clamped to
   0.01ms, `!important`, which is why it beats an unimportant utility in a higher
   layer), so the floating layer does not animate for a reader who asked for less
   motion. Measured, not assumed: with the preference forced on this board, all
   30 floating surfaces across the 18 frames come back at 0.01ms.

   What the family lacks is the FIRST line that guard's own comment names, a gate
   on the components themselves, and that is what this block is: a stop rather
   than a clamp. Safe to paste: `animation: none` does not strand a panel open,
   because radix's Presence unmounts immediately when the computed animation name
   is `none` (react-presence@1.1.5, index.mjs:59). The clamp is 0.01ms rather
   than 0 for the opposite reason, which the globals.css comment explains.

   The substring match is not laziness: the utilities are variant-prefixed
   (data-open:animate-in), so the class on the element is literally
   "data-open:animate-in" and a plain .animate-in selector matches nothing. */

export const REDUCED_MOTION_CSS = `@media (prefers-reduced-motion: reduce) {
  ${NOT_FRAME} :is([class*="animate-in"], [class*="animate-out"]) {
    animation: none !important;
  }
  ${NOT_FRAME} :is(${EDGE_ANY}, [data-entry-drawer], [data-entry-overlay]) {
    transition: none !important;
  }
}`;

/* -- ONE RUNG, SCOPED TO ONE PANEL -----------------------------------------
   What lets a ladder hold four answers in one document. The rung's class is the
   whole address: "flt-r-nested" carries both which dimension it is and which
   value, so a frame can turn a list of rung ids into its own sheet without a
   second table to keep in step. */

export function rungCss(rungId: string): string {
  if (!rungId) return "";
  const panel = `.${rungId}`;
  const value = rungId.slice(6);
  if (
    rungId.startsWith("flt-r-") &&
    (RADIUS_RUNGS as readonly string[]).includes(value)
  ) {
    return radiusCss(value as RadiusRung, { panel });
  }
  if (
    rungId.startsWith("flt-l-") &&
    (LIGHT_RUNGS as readonly string[]).includes(value)
  ) {
    return lightCss(value as LightRung, { panel });
  }
  if (
    rungId.startsWith("flt-e-") &&
    (ENTRANCE_RUNGS as readonly string[]).includes(value)
  ) {
    return entranceCss(value as EntranceRung, { panel });
  }
  return "";
}

/* -- THE WHOLE CONTRACT, AS ONE PASTE -------------------------------------- */

export type Knobs = {
  radius: RadiusRung | "off";
  entrance: EntranceRung | "off";
  light: LightRung | "off";
};

/** The three knobs, composed. "off" means the rung is left as it ships, so a
 *  contract with one knob set pastes only that knob: the ruling can land one
 *  line of the five at a time. */
export function contractCss(knobs: Knobs, scope: Scope): string {
  const parts: string[] = [];
  if (knobs.radius !== "off") parts.push(radiusCss(knobs.radius, scope));
  if (knobs.light !== "off") parts.push(lightCss(knobs.light, scope));
  if (knobs.entrance !== "off") parts.push(entranceCss(knobs.entrance, scope));
  return parts.join("\n\n");
}

/** The label the tuner panel shows while a block is applied. */
export function contractLabel(knobs: Knobs): string {
  const bits = [
    knobs.radius === "off" ? null : `radius ${knobs.radius}`,
    knobs.light === "off" ? null : `light ${LIGHT_LABEL[knobs.light]}`,
    knobs.entrance === "off" ? null : `entrance ${ENTRANCE_LABEL[knobs.entrance]}`,
  ].filter(Boolean);
  return bits.length ? `Floating layer: ${bits.join(", ")}` : "Floating layer: today";
}
