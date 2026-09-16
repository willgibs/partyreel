/**
 * THE ROUNDING BOARD'S NUMBERS (round two, 2026-09-14).
 *
 * One home for everything the board is asking Will to rule on, so the
 * specimens, the printed arithmetic and the CSS paste can never disagree: a
 * cell renders what `blockFor()` writes, and `blockFor()` writes what a ruling
 * lands.
 *
 * THREE AXES, because the tokens are three independent decisions and a board
 * that bundles them makes the ruling harder, not easier:
 *
 *   SURFACES  --radius, --radius-float, --radius-tile (+ --gap-gallery, which
 *             is pinned to the tile so a corner never opens a hole). Four
 *             candidates, A to D.
 *   ACTIONS   --radius-action, -lg, -sm. Three rungs, because "round actions"
 *             has a low end and a high end and today's 0.4 x height sits
 *             between them.
 *   THE LADDER  the seven derived steps (rounded-sm to rounded-4xl). Stock
 *             today; the retune exists because the multipliers were chosen
 *             against a 2px base and 1.8x of a round base is a shape nobody
 *             asked for.
 *
 * ★ THE LADDER CANNOT BE RETUNED WITH A TOKEN. `@theme inline` in theme.css
 * substitutes each derived step INTO its utility at build time, so
 * `rounded-xl` ships as `border-radius: calc(var(--radius) * 1.4)` and
 * `--radius-xl` is empty at runtime. That is why an override of --radius
 * restyles a whole subtree (the board's columns rely on it) and why a ladder
 * retune is a theme.css edit rather than a token. `ladderCss()` writes the
 * utilities directly so the board can SHOW the retune before anyone commits
 * to it; the ruling lands in theme.css's @theme inline block, one line a step.
 * (First found by the floating-surfaces board; confirmed here.)
 */

export type SurfaceValues = {
  /** --radius, the base every derived step is a multiple of. */
  radius: number;
  /** --radius-float, the floating layer's one corner (bible 15). */
  float: number;
  /** --radius-tile, a photograph in a tight-gap grid. */
  tile: number;
  /** --gap-gallery, pinned to the tile: gap below the radius opens holes. */
  gap: number;
};

export type SurfaceCandidate = {
  /**
   * ★ THE ID IS THE ASK'S OPTION ID (the clarity round, 2026-09-15). The
   * ledger joins a ruling to `a | b | c | d`, so the dock control, the board
   * state and this list all speak that and nothing else; a rename here without
   * a rename in spec.ts's `surface` control silently orphans an answer.
   */
  id: "a" | "b" | "c" | "d" | "live";
  /** A, B, C, D, or Live: what the paste and the applied badge call it. */
  letter: string;
  /** The option's own words, and the heading over every column it is judged in. */
  name: string;
  rationale: string;
  /** Absent on the live column, which reads whatever the tuner wrote. */
  values?: SurfaceValues;
  /** The ladder this candidate wants, stated rather than implied. */
  wants?: LadderId;
  /** What the candidate does at 375, where the tile is the whole argument
   *  (part G). One line, because a phone column has room for one. */
  phone: string;
};

export type ActionValues = {
  /** --radius-action, the nominal 40px button. */
  action: number;
  /** --radius-action-lg, the nominal 48px button. */
  lg: number;
  /** --radius-action-sm, the 32px button: the one the app actually ships. */
  sm: number;
};

export type ActionRung = {
  id: "today" | "pill" | "quiet";
  /** The option's own words: the heading over the column it is judged in. */
  name: string;
  /** The same rung in two words, for a frame title and the applied badge. */
  short: string;
  rationale: string;
  values: ActionValues;
};

export type LadderId = "stock" | "quarters";

/** The gap a tile radius wants. Below the radius, the four corners meeting at
 *  a junction open a visible diamond; 3px is the floor because the 3px gap is
 *  the album tell (press-sheet.tsx says so out loud). */
export function gapFor(tile: number): number {
  return Math.max(3, tile);
}

export const SURFACES: SurfaceCandidate[] = [
  {
    id: "a",
    letter: "A",
    name: "A, today",
    rationale:
      "2 / 8 / 3. Sharp surfaces, round actions, as shipped. The base is small enough that the seven derived steps are all within 4px of each other, so the ladder does nothing.",
    values: { radius: 2, float: 8, tile: 3, gap: 3 },
    wants: "stock",
    phone:
      "At 375 the tile corner is below one CSS pixel of visible arc. The grid reads as a contact sheet, which is the intent, and the cards read as panels.",
  },
  {
    id: "b",
    letter: "B",
    name: "B, square",
    rationale:
      "0 / 6 / 0. Bible 8 taken at its word: surfaces and photographs are square, the float rung stays round because sharp reads broken there, and the whole contrast is carried by the actions.",
    values: { radius: 0, float: 6, tile: 0, gap: 3 },
    wants: "stock",
    phone:
      "Square at 375 is the same object as square at 1440, which is the one honest thing about it. The menu is the only round shape left on the canvas.",
  },
  {
    id: "c",
    letter: "C",
    name: "C, soft",
    rationale:
      "8 / 12 / 4. Surfaces come up to meet the actions. The contrast narrows from eight times to two and survives, the tile keeps its photograph, and at a base of 8 the ladder starts to matter, so it takes the even one.",
    values: { radius: 8, float: 12, tile: 4, gap: 4 },
    wants: "quarters",
    phone:
      "The tile still reads as a corner at a guest's width and still leaves the photograph its edges. The card keeps a corner at this width and still reads as a card, not a lozenge.",
  },
  {
    id: "d",
    letter: "D",
    name: "D, one family",
    rationale:
      "14 / 14 / 6. Surfaces, floats and actions all read as one shape and the contrast is carried by size alone. Wants the quarter ladder: on stock, a plan card lands at 25.2 and a badge at 36.4.",
    values: { radius: 14, float: 14, tile: 6, gap: 6 },
    wants: "quarters",
    phone:
      "A 6px tile at 375 eats the corner of a photograph that is already small, and the 6px gap it pins takes another column of image out of the grid.",
  },
  {
    id: "live",
    letter: "Live",
    name: "Live, from the tuner",
    rationale:
      "Reads the tokens as the tuner writes them, so a knob moves this column and every real page together.",
    phone:
      "Whatever the panel is set to, on the canvas a guest holds. Drag the tile knob here and watch the gap follow it.",
  },
];

export const ACTIONS: ActionRung[] = [
  {
    id: "today",
    name: "Today, 0.4 of the height",
    short: "today's buttons",
    rationale:
      "16 / 19.2 / 12.8. The shipped ratio: round enough to read as pressable, short of a pill.",
    values: { action: 16, lg: 19.2, sm: 12.8 },
  },
  {
    id: "pill",
    name: "A full pill",
    short: "pill buttons",
    rationale:
      "999 everywhere. The full round, and the only rung whose shape does not depend on the height: it is the one rung the h-11 marketing CTA cannot fall off.",
    values: { action: 999, lg: 999, sm: 999 },
  },
  {
    id: "quiet",
    name: "Quiet, 0.2 of the height",
    short: "quiet buttons",
    rationale:
      "8 / 9.6 / 6.4. Half of today. An action still rounder than a surface under A and B, and indistinguishable from one under C and D.",
    values: { action: 8, lg: 9.6, sm: 6.4 },
  },
];

/** The seven derived steps, in the order theme.css declares them. */
export const STEPS = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;
export type Step = (typeof STEPS)[number];

/** Stock: the multipliers theme.css ships. Quarters: the retune, an even
 *  quarter a step, which is within half a pixel of stock at today's 2px base
 *  and only bites once the base is round. */
export const LADDERS: Record<LadderId, Record<Step, number>> = {
  stock: {
    sm: 0.6,
    md: 0.8,
    lg: 1,
    xl: 1.4,
    "2xl": 1.8,
    "3xl": 2.2,
    "4xl": 2.6,
  },
  quarters: {
    sm: 0.5,
    md: 0.75,
    lg: 1,
    xl: 1.25,
    "2xl": 1.5,
    "3xl": 1.75,
    "4xl": 2,
  },
};

/** Where each derived step actually lands, counted on the shipped tree
 *  (non-lab uses of the utility, 2026-09-14). The two dead rungs at the top
 *  are an ask, not an aside. */
export const STEP_CALL_SITES: Record<
  Step,
  { uses: number; where: string; specimen: string }
> = {
  sm: {
    uses: 8,
    where: "the tooltip arrow, a select item",
    specimen: "Tooltip",
  },
  md: {
    uses: 89,
    where: "menu rows, segmented thumbs",
    specimen: "A menu row",
  },
  lg: {
    uses: 105,
    where: "inputs, plates, the lab's own toggles",
    specimen: "Input",
  },
  xl: {
    uses: 66,
    where: "Card, and the dashboard event card",
    specimen: "Event card",
  },
  "2xl": {
    uses: 49,
    where: "the pricing plan cards, the help cards",
    specimen: "Plan card",
  },
  "3xl": {
    uses: 1,
    where: "zip-modal-demo.tsx, one panel on /features/sharing",
    specimen: "One modal",
  },
  "4xl": {
    uses: 2,
    where: "badge.tsx, and one label in attribution-stage.tsx",
    specimen: "Badge",
  },
};

/**
 * WHERE THE ACTION TOKENS ACTUALLY LAND, counted on the shipped tree
 * (2026-09-14, every non-lab `var(--radius-action*)`).
 *
 * ★ ROUND TWO GOT THIS WRONG AND THE BOARD SAID IT OUT LOUD: "three call
 * sites, all in the reel". The token has THIRTEEN raw uses in seven files, and
 * the one that matters is not a button at all. Recounted rather than repeated.
 */
export const ACTION_SITES = {
  /** button.tsx's own size variants: xs, sm, lg and their three icon twins. */
  derived: 6,
  /** Hand-written `var(--radius-action)` outside button.tsx: the reel (3),
   *  the guest reel overlay (2), the guest entry SHEET (1, at 1.4x) and the
   *  marketing footer's CTA (1). Only the first three are buttons at h-10. */
  raw: 7,
  lg: 1,
  files: 6,
} as const;

/** The board's answer, in one place, so the rail, the Apply button and every
 *  Proposal below can never drift apart. The five asks themselves live in
 *  spec.ts, which is what the template, the desk and the ledger read. */
export const ANSWER = {
  surface: "c" as SurfaceCandidate["id"],
  action: "today" as ActionRung["id"],
  ladder: "quarters" as LadderId,
} as const;

export function px(n: number): string {
  // Two decimals at most, and never a trailing zero: 19.2, not 19.20.
  return `${Math.round(n * 100) / 100}px`;
}

/** The step's value under a candidate, for the arithmetic the board prints. */
export function stepValue(
  radius: number,
  ladder: LadderId,
  step: Step,
): number {
  return radius * LADDERS[ladder][step];
}

/**
 * ★ THE CARD'S MULTIPLIER IS THE LADDER'S, NEVER A CONSTANT (round three).
 *
 * Card ships as `rounded-xl`, so its corner is the xl step: 1.4x under stock
 * and 1.25x under quarters. The board scopes a retune to a subtree
 * (`ladderCss("quarters", '[data-rnd-ladder="quarters"] ')`), so two columns
 * on one screen can be drawing different cards, and a cell that printed 1.4
 * captioned the answer column's 10px card as 11.2px. Everything the board
 * prints beside a card reads this instead.
 */
export function cardMultiplier(ladder: LadderId): number {
  return LADDERS[ladder].xl;
}

/** The ladder as CSS. `scope` prefixes every selector so the board can show a
 *  retune inside one column; the empty scope is the paste a ruling lands. */
export function ladderCss(ladder: LadderId, scope = ""): string {
  const m = LADDERS[ladder];
  const lines: string[] = [];
  for (const step of STEPS) {
    const v = `calc(var(--radius) * ${m[step]})`;
    lines.push(`${scope}.rounded-${step} { border-radius: ${v}; }`);
    lines.push(
      `${scope}.rounded-t-${step} { border-top-left-radius: ${v}; border-top-right-radius: ${v}; }`,
    );
    lines.push(
      `${scope}.rounded-b-${step} { border-bottom-left-radius: ${v}; border-bottom-right-radius: ${v}; }`,
    );
  }
  return lines.join("\n");
}

/**
 * THE PASTE. A surface candidate, an action rung and a ladder, written as the
 * block a ruling lands: the radius tokens live on `:root` ONLY (globals.css
 * says never to alias them to .surface-paper, because a paper chapter would
 * re-declare them and the tuner's inline value on <html> would stop piercing),
 * so `:root` is the whole selector list and there is nothing theme-dependent
 * here.
 */
export function blockFor(
  surface: SurfaceCandidate,
  action: ActionRung,
  ladder: LadderId,
): string {
  const v = surface.values;
  if (!v) return "";
  const head = `/* Rounding: surfaces ${surface.name}, ${action.short}, ${ladder === "quarters" ? "even quarters" : "the steps as they are today"}. */`;
  const root = [
    ":root {",
    `  --radius: ${px(v.radius)};`,
    `  --radius-float: ${px(v.float)};`,
    `  --radius-tile: ${px(v.tile)};`,
    `  --gap-gallery: ${px(v.gap)};`,
    `  --radius-action: ${px(action.values.action)};`,
    `  --radius-action-lg: ${px(action.values.lg)};`,
    `  --radius-action-sm: ${px(action.values.sm)};`,
    "}",
  ].join("\n");
  if (ladder === "stock") return `${head}\n${root}`;
  return [
    head,
    root,
    "",
    "/* The derived ladder, previewed as utilities. @theme inline bakes each",
    "   step into its utility at build time, so the ruling lands on the",
    "   multipliers in theme.css and not on a token. */",
    ladderCss(ladder),
  ].join("\n");
}

/** The label the tuner panel shows while a block is applied. */
export function blockLabel(
  surface: SurfaceCandidate,
  action: ActionRung,
  ladder: LadderId,
): string {
  const tail = ladder === "stock" ? "" : ", even quarters";
  return `rounding ${surface.name}, ${action.short}${tail}`;
}
