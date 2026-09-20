/**
 * THE GLASS MATERIAL, AS NUMBERS (the `glass` track; round one 2026-09-18,
 * round two 2026-09-20).
 *
 * Round one asked how much glass a surface you press should be and Will picked
 * Frost, with the round's only unfinished sentence attached: "It was between
 * this and Crystal. This one because it's a bit darker and keeps an active icon
 * a bit more visible, but I also liked the Crystal's double edge for more
 * contrast in any situation. Maybe worth a second round of exploration to
 * clarify, so we can nail our glass from the start." Two questions later he
 * picked the reel's WHITE pane over the same recipe and said why: "I don't want
 * to have separate glass treatments and would prefer to find a global that
 * works everywhere... It probably would have looked better on the mobile media
 * card icon background glass as well."
 *
 * So round two carries three bodies and nothing else, and the tint's COLOUR is
 * now a dimension of the material rather than a second material (`tintRgb`).
 * White is Frost's filter exactly with its tint turned white, which is what
 * makes the pair a one-variable comparison instead of two designs.
 *
 * ★ FIVE NUMBERS AND TWO EDGES, NOTHING ELSE. A recipe is a blur radius, a
 * backdrop brightness, a backdrop saturation, a tint (a colour and an alpha)
 * painted over the blurred backdrop, and two optional hairlines. Naming them as
 * numbers is what lets the board say what each option IS rather than what it
 * feels like, and it is what the measuring harness reads to reproduce the
 * material outside React.
 *
 * ★ BRIGHTNESS IS THE MOVE THAT MAKES GLASS LEGIBLE. A blur does not change the
 * mean luminance under a pill, so a near-clear pane over a bright photograph
 * loses its white text however wide the blur. `brightness()` inside the backdrop
 * filter darkens what is behind WITHOUT flattening its colour, so a recipe can
 * be far more transparent than today's flat 55 percent black at the same
 * legibility. Every contrast number on this board is measured off the rendered
 * pane rather than computed from these values.
 *
 * ★ THE QUIET GRADE AND THE FLAT CONTROL ARE GONE, AND THAT IS A RULING, NOT A
 * TIDY-UP (`grades=one`, 2026-09-20: "This feels more consistent across
 * surfaces that are close to each other, else it looks weird they're
 * different"). One grade means one material, so `quietOf` and `flatOf` have no
 * caller left; `veil` went with the recipe he ruled out, and `tiles` went to his
 * own rule (an active like mark, a video play mark, a subtle like count, every
 * action in the lightbox). A board carries only what is still open, and the
 * answers live for ever in docs/reviews/glass.json.
 *
 * ★ THIS FILE IS PURE DATA ON PURPOSE. `glass.css` gets these numbers as custom
 * properties through `recipeVars`, and the measuring harness reads them by regex
 * so it cannot drift from the board; there is one home for every number a
 * caption prints.
 */

export type RecipeId = "today" | "frost" | "crystal" | "white";

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
  /**
   * The tint's colour as an `r g b` triple, painted OVER the blurred backdrop.
   * Round two's whole question lives here: black sinks the photograph, white
   * lifts it, and the filter underneath is identical.
   */
  readonly tintRgb: string;
  /** The tint's alpha. */
  readonly tint: number;
  /** The 1px white highlight along the top edge, as an alpha. 0 = none. */
  readonly edge: number;
  /** The 1px white hairline all the way round, as an alpha. 0 = none. */
  readonly ring: number;
};

const BLACK = "0 0 0";
const WHITE = "255 255 255";

/**
 * The three bodies round two asks, and the shipped pill they are read against.
 * `today` stays because every cost figure is read against something real, and
 * because a reviewer is allowed to ask what the app looks like now.
 */
export const RECIPES: Readonly<Record<RecipeId, Recipe>> = {
  /** The product's pill today: `bg-black/55 backdrop-blur-sm`, measured. */
  today: {
    id: "today",
    name: "Today",
    blur: 8,
    brightness: 1,
    saturate: 1,
    tintRgb: BLACK,
    tint: 0.55,
    edge: 0,
    ring: 0,
  },
  /** The ruled recipe, unchanged from round one. */
  frost: {
    id: "frost",
    name: "Frost",
    blur: 26,
    brightness: 0.55,
    saturate: 1.6,
    tintRgb: BLACK,
    tint: 0.12,
    edge: 0.16,
    ring: 0,
  },
  /** The one he kept looking back at, for its double edge. */
  crystal: {
    id: "crystal",
    name: "Crystal",
    blur: 42,
    brightness: 0.68,
    saturate: 2,
    tintRgb: BLACK,
    tint: 0.04,
    edge: 0.28,
    ring: 0.1,
  },
  /**
   * ★ FROST'S FILTER, ITS TINT TURNED WHITE. The reel ships `bg-white/12
   * backdrop-blur-sm` and he picked it there, then asked whether it should be
   * the global. Drawn any other way this would be a second design and the
   * comparison would prove nothing: one variable moves, and it is the only one
   * his note names.
   */
  white: {
    id: "white",
    name: "White",
    blur: 26,
    brightness: 0.55,
    saturate: 1.6,
    tintRgb: WHITE,
    tint: 0.12,
    edge: 0.16,
    ring: 0,
  },
};

export const recipeOf = (v: string | undefined): Recipe =>
  v && v in RECIPES ? RECIPES[v as RecipeId] : RECIPES.frost;

/* ── the edge, freed from the body ────────────────────────────────────────── */

export type EdgeId = "lip" | "double" | "none";

/**
 * ★ THE EDGE IS A SEPARATE DECISION BECAUSE HIS NOTE SEPARATED IT. "This one
 * because it's a bit darker... but I also liked the Crystal's double edge" is
 * two judgements about two independent properties, and asking them as one set
 * of options forces the compromise he has already said he does not want. So the
 * bodies are drawn with their NATIVE edges, which is how he saw them in round
 * one and what his memory of those tiles is of, and then the winner's edge is
 * re-asked on its own: Frost's darkness wearing Crystal's double edge is two
 * presses away rather than unreachable.
 *
 * The hairlines are white on every body, white glass included: they are the
 * light catching the pane's lip, not a colour the material chooses.
 */
export const EDGES: Readonly<Record<EdgeId, { edge: number; ring: number }>> = {
  /** Frost's: one bright lip along the top, the light landing on the pane. */
  lip: { edge: 0.16, ring: 0 },
  /** Crystal's: the lip taken up, plus a hairline all the way round. */
  double: { edge: 0.28, ring: 0.1 },
  /** None: the material separates by its own darkness or lightness alone. */
  none: { edge: 0, ring: 0 },
};

export const edgeOf = (v: string | undefined): EdgeId =>
  v === "double" || v === "none" ? v : "lip";

/** A recipe wearing an edge set that is not its own (the `edge` decision). */
export function withEdge(r: Recipe, e: EdgeId): Recipe {
  return { ...r, ...EDGES[e] };
}

/* ── the material as CSS ──────────────────────────────────────────────────── */

/**
 * A recipe as the custom properties `glass.css` reads. Written as a style object
 * rather than a class so a preview can wear a material the sheet has never heard
 * of, which is what lets the edge decision re-skin the winner without a second
 * rule.
 */
export function recipeVars(r: Recipe): Record<string, string> {
  return {
    "--gl-blur": `${r.blur}px`,
    "--gl-brightness": String(r.brightness),
    "--gl-saturate": String(r.saturate),
    "--gl-tint-rgb": r.tintRgb,
    "--gl-tint": String(r.tint),
    "--gl-edge": String(r.edge),
    "--gl-ring": String(r.ring),
  };
}

/** The one line the board prints under an option: the material, in its numbers. */
export function recipeLine(r: Recipe): string {
  const colour = r.tintRgb === WHITE ? "white" : "black";
  const parts = [
    `blur ${r.blur}px`,
    r.brightness === 1 ? null : `the backdrop at ${r.brightness}`,
    r.saturate === 1 ? null : `saturate ${r.saturate}`,
    `${Math.round(r.tint * 100)} percent ${colour}`,
    r.edge ? `a ${Math.round(r.edge * 100)} percent top lip` : null,
    r.ring ? `a ${Math.round(r.ring * 100)} percent hairline` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

/** The edge in its numbers, for the second decision's captions. */
export function edgeLine(e: EdgeId): string {
  const { edge, ring } = EDGES[e];
  if (!edge && !ring) return "no hairline at all";
  return [
    edge ? `a ${Math.round(edge * 100)} percent top lip` : null,
    ring ? `a ${Math.round(ring * 100)} percent hairline all round` : null,
  ]
    .filter(Boolean)
    .join(" and ");
}
