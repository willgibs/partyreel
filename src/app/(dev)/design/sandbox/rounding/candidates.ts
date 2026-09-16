/**
 * THE ROUNDING BOARD'S NUMBERS (round six, the catalog rebuild, 2026-09-16).
 *
 * One home for everything the board asks Will to rule on, so the cards, the
 * printed arithmetic and the CSS paste can never disagree: a preview renders
 * what `blockFor()` writes, and `blockFor()` writes what a ruling lands.
 *
 * ★ A FAMILY IS A WHOLE ANSWER, NOT AN AXIS (this round's one structural
 * change). Rounds one to five asked three independent questions at once
 * (surfaces, actions, the ladder) and let a reader assemble an answer out of
 * three switches, which is the "six configs that aren't clearly explained"
 * Will ruled against on the palette board. A FAMILY now names every corner at
 * once: the surface, the floating layer, the photograph and the gap between
 * photographs. Six of them, each a position somebody could argue for out loud,
 * ruled card by card.
 *
 * The two axes that are NOT a family survive as asks, because they are true
 * whichever family wins: the button RUNG (0.4 of the height, a pill, or half
 * of today) and the derived LADDER (the seven steps above the card's corner).
 * Both are board-wide switches, so flipping one redraws every card.
 *
 * ★ THE LADDER CANNOT BE RETUNED WITH A TOKEN. `@theme inline` in theme.css
 * substitutes each derived step INTO its utility at build time, so
 * `rounded-xl` ships as `border-radius: calc(var(--radius) * 1.4)` and
 * `--radius-xl` is empty at runtime. That is why an override of --radius
 * restyles a whole subtree (every card on the catalog relies on it) and why a
 * ladder retune is a theme.css edit rather than a token. `ladderCss()` writes
 * the utilities directly so the board can SHOW the retune before anyone
 * commits to it; the ruling lands in theme.css's @theme inline block, one line
 * a step. (First found by the floating-surfaces board; confirmed here.)
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

export type LadderId = "stock" | "quarters";

export type SurfaceCandidate = {
  /**
   * ★ THE ID IS THE CARD'S ID AND THE CONTROL'S OPTION ID. The ledger joins a
   * ruling to it (`item:c=keep`), the Pick button writes it into the `family`
   * control, and A and B name it; a rename in one place without the other two
   * silently orphans an answer.
   */
  id: string;
  /** The name on the card, the column and the frame caption. */
  name: string;
  /** The card's one line, in words a stranger knows. */
  one: string;
  /** The builder's own call, drawn as the card's pill. */
  verdict: "ship" | "refine" | "kill";
  /** The board's own pick, marked with a dot on its card. */
  recommended?: boolean;
  rationale: string;
  values: SurfaceValues;
  /** What it does at 375, where the photograph is the whole argument. */
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

/** The gap a tile radius wants. Below the radius, the four corners meeting at
 *  a junction open a visible diamond; 3px is the floor because the 3px gap is
 *  the album tell (press-sheet.tsx says so out loud). */
export function gapFor(tile: number): number {
  return Math.max(3, tile);
}

/**
 * THE SIX FAMILIES.
 *
 * Four are the board's standing A to D, kept because three rounds of
 * conversation refer to them by letter and because they are still the corners
 * of the space. Two are written from the ground up for this round, where the
 * four had a real gap:
 *
 *  E, print   decouples the photograph from the surface. Every other family
 *             moves the two together and nothing says they have to: a corner
 *             crops the image, and a square photograph cannot open a hole in
 *             the album's gap.
 *  F, half a step is the cheapest change that is visible at all. The
 *             photograph does not move, so the fifty-two hand-written 3px
 *             corners on the site keep agreeing with the token and a ruling
 *             costs no sweep.
 */
export const SURFACES: SurfaceCandidate[] = [
  {
    id: "a",
    name: "A, today",
    one: "The site exactly as it ships: a 2px card, an 8px menu, a 3px photograph.",
    verdict: "kill",
    values: { radius: 2, float: 8, tile: 3, gap: 3 },
    rationale:
      "The one to come back to: a ruling of A is a ruling to change no line.",
    phone:
      "At 375 the photograph's corner is under a pixel of visible arc, so the grid reads as a contact sheet and a card reads as a plain panel.",
  },
  {
    id: "b",
    name: "B, square",
    one: "Bible 8 taken at its word: cards and photographs square, menus alone stay round.",
    verdict: "refine",
    values: { radius: 0, float: 6, tile: 0, gap: 3 },
    rationale:
      "The honest version of the claim A only asserts. Deliberate on a dark chapter, unfinished on paper, which is the half that needs work.",
    phone:
      "Square at 375 is the same object as square at 1440, which is the one honest thing about it. The menu is the only round shape left on screen.",
  },
  {
    id: "c",
    name: "C, soft",
    one: "Surfaces come up to meet the buttons: a corner you can see, with the button still the roundest thing on screen.",
    verdict: "ship",
    recommended: true,
    values: { radius: 8, float: 12, tile: 4, gap: 4 },
    rationale:
      "The contrast narrows from eight to one down to two and survives, the photograph keeps its edges, and a card finally has a corner.",
    phone:
      "The photograph still reads as a corner at a guest's width and keeps its edges. The card holds its shape without becoming a lozenge.",
  },
  {
    id: "d",
    name: "D, one family",
    one: "One shape for everything: cards, menus and buttons all read alike, with size alone telling them apart.",
    verdict: "kill",
    values: { radius: 14, float: 14, tile: 6, gap: 6 },
    rationale:
      "The simplest to state and the one that gives up the most: at 14 the card out-rounds the button, which is bible 8 upside down.",
    phone:
      "A 6px corner at 375 eats the corner of a photograph that is already small, and the 6px gap it pins takes another slice out of the grid.",
  },
  {
    id: "e",
    name: "E, print",
    one: "Soft chrome around square photographs: a print in a mat. The one family that moves the two apart.",
    verdict: "refine",
    values: { radius: 10, float: 14, tile: 0, gap: 3 },
    rationale:
      "A corner crops the image, so the chrome softens and the photograph does not. It also closes the album's gap: a square tile cannot open a hole.",
    phone:
      "The grid runs edge to edge with nothing taken off any photograph, inside the softest card on the board. That contrast is the whole look.",
  },
  {
    id: "f",
    name: "F, half a step",
    one: "The smallest change you can see: a 6px card, a 10px menu, the photograph left exactly where it is.",
    verdict: "refine",
    values: { radius: 6, float: 10, tile: 3, gap: 3 },
    rationale:
      "The photograph does not move, so the fifty-two hand-written 3px corners keep agreeing and a ruling costs no sweep.",
    phone:
      "The card reads as rounded and the grid is untouched, which is what makes it cheap: at 375 nothing about the photographs changes.",
  },
];

/** The board's own pick. */
export const RECOMMENDED = "c";

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
      "999 everywhere. The only rung whose shape does not depend on the height, so the odd 44px button cannot fall off it.",
    values: { action: 999, lg: 999, sm: 999 },
  },
  {
    id: "quiet",
    name: "Quiet, 0.2 of the height",
    short: "quiet buttons",
    rationale:
      "8 / 9.6 / 6.4. Half of today. Still rounder than a surface under A and B, and indistinguishable from one under C, D and E.",
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
    where: "a tooltip arrow, a select item",
    specimen: "Tooltip",
  },
  md: {
    uses: 89,
    where: "menu rows, segmented thumbs",
    specimen: "A menu row",
  },
  lg: {
    uses: 105,
    where: "inputs and plates",
    specimen: "Input",
  },
  xl: {
    uses: 66,
    where: "Card, the event card",
    specimen: "Event card",
  },
  "2xl": {
    uses: 49,
    where: "the plan cards, the help cards",
    specimen: "Plan card",
  },
  "3xl": {
    uses: 1,
    where: "one panel, on /features/sharing",
    specimen: "One modal",
  },
  "4xl": {
    uses: 2,
    where: "Badge, and one label",
    specimen: "Badge",
  },
};

/**
 * WHERE THE ACTION TOKENS ACTUALLY LAND, counted on the shipped tree
 * (2026-09-14, every non-lab `var(--radius-action*)`).
 *
 * ★ ROUND TWO GOT THIS WRONG AND THE BOARD SAID IT OUT LOUD: "three call
 * sites, all in the reel". The token has THIRTEEN raw uses in seven files, and
 * the one that matters is not a button at all.
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

/** The board's answer, in one place, so the Pick, the Apply button and the
 *  paste can never drift. The asks themselves live in spec.ts, which is what
 *  the template, the desk and the ledger read. */
export const ANSWER = {
  family: RECOMMENDED,
  action: "today" as ActionRung["id"],
  ladder: "quarters" as LadderId,
} as const;

export function px(n: number): string {
  // Two decimals at most, and never a trailing zero: 19.2, not 19.20.
  return `${Math.round(n * 100) / 100}px`;
}

/** The step's value under a family, for the arithmetic the board prints. */
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
 * (`ladderCss("quarters", '[data-rnd-ladder="quarters"] ')`), so two cards on
 * one screen can be drawing different cards, and a cell that printed 1.4
 * captioned a 10px card as 11.2px. Everything printed beside a card reads this.
 */
export function cardMultiplier(ladder: LadderId): number {
  return LADDERS[ladder].xl;
}

/**
 * THE CARD'S FOUR FACTS, generated so a fact and a preview cannot disagree.
 *
 * The fourth one is the only place the board states bible 8's actual claim as
 * a number: a button is the pressable thing, so it has to out-round the
 * surface under it. Five of the six families leave the button where it ships,
 * and the RATIO is what separates them; under D it inverts, which is the
 * shortest case against D anyone has made in six rounds.
 */
export function factsFor(
  c: SurfaceCandidate,
): readonly (readonly [string, string])[] {
  const base = c.values.radius;
  const button = ACTIONS[0].values.action;
  const ratio =
    base === 0
      ? "against a square card"
      : `${Math.round((button / base) * 10) / 10}x the surface`;
  return [
    ["Surfaces", px(base)],
    ["Menus", px(c.values.float)],
    ["Photographs", `${px(c.values.tile)}, ${px(c.values.gap)} gap`],
    ["Buttons", `${px(button)}, ${ratio}`],
  ];
}

/** The ladder as CSS. `scope` prefixes every selector so the board can show a
 *  retune inside one card; the empty scope is the paste a ruling lands. */
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
 * THE PASTE. A family, an action rung and a ladder, written as the block a
 * ruling lands: the radius tokens live on `:root` ONLY (globals.css says never
 * to alias them to .surface-paper, because a paper chapter would re-declare
 * them and an inline value on <html> would stop piercing), so `:root` is the
 * whole selector list and there is nothing theme-dependent here.
 */
export function blockFor(
  surface: SurfaceCandidate,
  action: ActionRung,
  ladder: LadderId,
): string {
  const v = surface.values;
  const head = `/* Rounding: ${surface.name}, ${action.short}, ${ladder === "quarters" ? "even quarters" : "the steps as they are today"}. */`;
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

/** The label the applied badge shows while a block is standing. */
export function blockLabel(
  surface: SurfaceCandidate,
  action: ActionRung,
  ladder: LadderId,
): string {
  const tail = ladder === "stock" ? "" : ", even quarters";
  return `rounding ${surface.name}, ${action.short}${tail}`;
}

/** One family by id, or null for "nothing picked". */
export function familyById(id: string | undefined): SurfaceCandidate | null {
  return SURFACES.find((c) => c.id === id) ?? null;
}

/** One action rung by id, defaulting to the shipped one. */
export function rungById(id: string | undefined): ActionRung {
  return ACTIONS.find((a) => a.id === id) ?? ACTIONS[0];
}
