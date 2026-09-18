/**
 * THE GLASS RECIPES, AS NUMBERS (the `glass` track, round one, 2026-09-18).
 *
 * Will banked this exploration by name when he declined a one-off glass panel
 * on the floating layer: "let's bank a near-term agent for a dedicated Glass
 * exploration across marketing and app so it feels more infused to our
 * product." Round one draws it where glass exists for a reason, which is the
 * app's chrome over photographs, so the material is decided once here and every
 * surface then wears the winner.
 *
 * ★ FOUR NUMBERS AND TWO EDGES, NOTHING ELSE. A recipe is a blur radius, a
 * backdrop brightness, a backdrop saturation, a tint alpha painted over the
 * blurred backdrop, and two optional hairlines. Naming them as numbers is what
 * lets the board say what each option IS rather than what it feels like, and it
 * is what the cost harness reads to reproduce the material outside React.
 *
 * ★ BRIGHTNESS IS THE MOVE THAT MAKES GLASS LEGIBLE. A blur does not change the
 * mean luminance under a pill, so a near-clear pane over a bright photograph
 * loses its white text however wide the blur. Today's pill answers that with a
 * flat 55 percent black, which also paints the photograph out. `brightness()`
 * inside the backdrop filter darkens what is behind WITHOUT flattening its
 * colour, so a recipe can be far more transparent than today's at the same
 * legibility. That is the whole argument the board is asking him to judge, and
 * the contrast numbers on the step are measured off the rendered pill rather
 * than computed from these values.
 *
 * ★ THIS FILE IS PURE DATA ON PURPOSE. `spec.ts` reads it for the option
 * labels, `glass.css` gets the same numbers as custom properties through
 * `recipeVars`, and the cost harness reads it by regex, so there is one home
 * for every number the board prints.
 */

export type RecipeId = "today" | "veil" | "frost" | "crystal";

export type Recipe = {
  readonly id: RecipeId;
  /** The name the board prints. */
  readonly name: string;
  /** `backdrop-filter: blur()`, in px. */
  readonly blur: number;
  /** `backdrop-filter: brightness()`. 1 leaves the photograph alone. */
  readonly brightness: number;
  /** `backdrop-filter: saturate()`. */
  readonly saturate: number;
  /** The black painted OVER the blurred backdrop, as an alpha. */
  readonly tint: number;
  /** The 1px white highlight along the top edge, as an alpha. 0 = none. */
  readonly edge: number;
  /** The 1px white hairline all the way round, as an alpha. 0 = none. */
  readonly ring: number;
};

/**
 * The four, from today's pill to the most transparent pane the system could
 * wear. They are deliberately CLOSE: the question is how much glass, not
 * whether to have any, and two that read the same is a finding.
 */
export const RECIPES: Readonly<Record<RecipeId, Recipe>> = {
  /** The product's pill today: `bg-black/55 backdrop-blur-sm`, measured. */
  today: {
    id: "today",
    name: "Today",
    blur: 8,
    brightness: 1,
    saturate: 1,
    tint: 0.55,
    edge: 0,
    ring: 0,
  },
  veil: {
    id: "veil",
    name: "Veil",
    blur: 16,
    brightness: 0.62,
    saturate: 1.25,
    tint: 0.18,
    edge: 0,
    ring: 0,
  },
  frost: {
    id: "frost",
    name: "Frost",
    blur: 26,
    brightness: 0.55,
    saturate: 1.6,
    tint: 0.12,
    edge: 0.16,
    ring: 0,
  },
  crystal: {
    id: "crystal",
    name: "Crystal",
    blur: 42,
    brightness: 0.68,
    saturate: 2,
    tint: 0.04,
    edge: 0.28,
    ring: 0.1,
  },
};

export const recipeOf = (v: string | undefined): Recipe =>
  v && v in RECIPES ? RECIPES[v as RecipeId] : RECIPES.frost;

/**
 * THE QUIET GRADE, DERIVED FROM THE FULL ONE, NEVER TYPED SEPARATELY.
 *
 * A badge you only read (the attribution pill, a play badge, a like count) is
 * not a surface you act on, and drawing it in the full recipe makes a page of
 * photographs read as a page of panes. The quiet grade halves the blur (which
 * is roughly a quarter of the cost, since a backdrop blur scales with the
 * radius over the region), drops both hairlines, and pays for the lost darkness
 * with a little more tint so the small type holds. Deriving it means the
 * recipe decision moves both grades at once, which is what makes it a SYSTEM
 * rather than two materials.
 */
export function quietOf(r: Recipe): Recipe {
  return {
    ...r,
    id: r.id,
    blur: Math.round(r.blur * 0.5),
    saturate: 1 + (r.saturate - 1) * 0.5,
    brightness: r.brightness + (1 - r.brightness) * 0.25,
    tint: Math.min(0.6, r.tint + 0.1),
    edge: 0,
    ring: 0,
  };
}

/** A flat scrim: the same tint, no backdrop filter at all. The control every
 *  cost number is read against, and a real option on the tile steps. */
export function flatOf(r: Recipe): Recipe {
  return {
    ...r,
    blur: 0,
    brightness: 1,
    saturate: 1,
    tint: 0.5,
    edge: 0,
    ring: 0,
  };
}

/**
 * A recipe as the custom properties `glass.css` reads. Written as a style
 * object rather than a class so a preview can wear a recipe the sheet has never
 * heard of, which is what lets the quiet grade be derived instead of authored.
 */
export function recipeVars(r: Recipe): Record<string, string> {
  return {
    "--gl-blur": `${r.blur}px`,
    "--gl-brightness": String(r.brightness),
    "--gl-saturate": String(r.saturate),
    "--gl-tint": String(r.tint),
    "--gl-edge": String(r.edge),
    "--gl-ring": String(r.ring),
  };
}

/** The one line the board prints under an option: the recipe, in its numbers. */
export function recipeLine(r: Recipe): string {
  const parts = [
    `blur ${r.blur}px`,
    r.brightness === 1 ? null : `brightness ${r.brightness}`,
    r.saturate === 1 ? null : `saturate ${r.saturate}`,
    `black ${Math.round(r.tint * 100)}%`,
    r.edge ? `a ${Math.round(r.edge * 100)}% top edge` : null,
    r.ring ? `a ${Math.round(r.ring * 100)}% hairline` : null,
  ].filter(Boolean);
  return parts.join(", ");
}
