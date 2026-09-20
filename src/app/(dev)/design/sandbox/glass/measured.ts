import type { GroundId } from "./fixtures";
import type { EdgeId } from "./recipes";

/**
 * WHAT WAS MEASURED, AND HOW (round two, 2026-09-20). The numbers a caption
 * prints under a frame, taken off a browser rather than out of a formula.
 *
 * ★ THE CAPTIONS ARE THE TRUTH WHEN THE WORDS DISAGREE WITH THEM. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of the words he picked (docs/PROGRAM.md), so nothing on
 * this board is computed from a material's numbers where it could be read off a
 * rendered pixel instead.
 *
 * ★ EVERY FIGURE HERE IS RE-MEASURED, NOT CARRIED OVER. Round one measured its
 * pill on round one's scene; round two's sheet crops the same photographs
 * differently and puts the same pane in a different place on them, so a number
 * inherited from round one would be a number about a picture nobody is looking
 * at any more.
 *
 * ★ THE ACTIVE MARK IS MEASURED HERE FOR THE FIRST TIME, and it is the round's
 * whole reason. "This one because it's a bit darker and keeps an active icon a
 * bit more visible" (Will, `recipe=frost`) is a claim about a rose glyph on a
 * pane, and no round had ever drawn one. `ACTIVE` is the resolved `--like`
 * colour (rgb 250 85 112, read out of the browser rather than out of the token)
 * against the measured pane beneath it: the pane comes off the screen, the
 * glyph's colour off the running stylesheet, so neither is guessed.
 *
 * ★ AND THE CAPTURE IS THE WHOLE VIEWPORT, CROPPED IN NODE. This cost an hour
 * to learn and it is the same disease `lab:demo` reports as UNPAINTED, one
 * layer down: `Page.captureScreenshot` with a `clip` makes Chrome recomposite
 * at a different surface size and a backdrop-filter layer does not survive it.
 * Every clipped pane came back pure black, which reads as a contrast of 20.49
 * against white on all nine states. The unclipped capture of the same page
 * paints the glass perfectly.
 *
 * CONTRAST: read off THE BOARD. The harness drives /design/lab/glass on the
 * lane's own dev server, pushes the board's state through the URL, reaches into
 * the frame's own document for each pane by its `data-gl-pane` mark, hides
 * everything marked `data-gl-ink` so only the material is in the shot, shoots
 * the viewport and slices the pane out of it. `worst` is the twelfth of the
 * pane where the ratio is lowest, because a glyph sits on a twelfth of a pane
 * and not on its average.
 *
 * COST: Chrome's own compositor trace (`Display::DrawAndSwap` summed over the
 * run) across a three second scroll of forty tiles carrying the three permitted
 * marks, at 375 by 812, device pixel ratio 3, mobile emulation, the CPU
 * throttled four times, three runs with the median taken. The rig is built from
 * `recipes.ts` by regex and outside React, so the figure is about the material
 * rather than about a framework. A phone's GPU is several times slower than
 * this Mac's, which is what the throttle stands in for. The figures are read
 * against each other and against the no-filter floor, never against round one's:
 * that run composited 180 frames and this one composites 72.
 *
 * The harness is about 400 lines of Node over the DevTools protocol; it is a
 * tool rather than a board file, so it is not committed. The Handoff carries
 * its output.
 */

/** The three materials round two asks. */
export type MaterialId = "frost" | "crystal" | "white";
/** Those three plus the shipped pill, which only the cost figures include. */
export type CostId = MaterialId | "today";

type ByGround<T> = Record<GroundId, T>;
/** A contrast reading: the whole pane, then its worst twelfth. */
type Read = readonly [mean: number, worst: number];

/**
 * White text on the LIGHTBOX'S ACTION PILL, the surface the material is decided
 * on. All three carry it on every photograph, which is itself the finding:
 * Frost's darkened backdrop is doing the work, not its tint, so the tint's
 * colour is free to be the question.
 */
export const CONTRAST: Record<MaterialId, ByGround<Read>> = {
  frost: { dark: [16.74, 14.41], mid: [14.57, 8.66], bright: [10.51, 9.53] },
  crystal: { dark: [14.64, 13.26], mid: [11.87, 7.04], bright: [7.5, 7.05] },
  white: { dark: [11.04, 9.06], mid: [9.25, 5.51], bright: [6.54, 6.06] },
};

/**
 * THE ROSE ACTIVE MARK ON A MOBILE CARD, which is his first criterion and the
 * number this round exists to produce. Frost keeps it half a point clear of
 * Crystal and nearly two clear of White on both photographs where it is legible
 * at all; over the brightest one every material fails it, which is a finding
 * for the wiring rather than a way to choose between them.
 */
export const ACTIVE: Record<MaterialId, ByGround<Read>> = {
  frost: { dark: [5.46, 5.3], mid: [5.7, 5.52], bright: [1.59, 1.44] },
  crystal: { dark: [4.77, 4.44], mid: [5.07, 4.72], bright: [1.05, 1.01] },
  white: { dark: [3.7, 3.61], mid: [3.95, 3.83], bright: [1.05, 1.01] },
};

/**
 * White text on the REEL'S OWN PANE, its worst twelfth. One number per material
 * rather than three, because the reel plays its own footage and the ground knob
 * cannot reach it. This is the measured answer to "for this reel demo the white
 * glass looks better": it is true, and it is true because the reel is the one
 * surface where White has headroom to spare.
 */
export const REEL_READ: Record<MaterialId, number> = {
  frost: 15.98,
  crystal: 13.94,
  white: 10.58,
};

/**
 * The lightbox's ATTRIBUTION CAPSULE, worst twelfth, at the 11px it ships at.
 * `grades=one` makes it wear the full material and his note expects it to
 * become a control, so it is the smallest type the material has to carry:
 * White drops it to 4.19 over the middling photograph, just under the 4.5 small
 * text asks for, and Crystal to 4.7.
 */
export const CREDIT: Record<MaterialId, ByGround<number>> = {
  frost: { dark: 15.72, mid: 6.59, bright: 7.08 },
  crystal: { dark: 12.99, mid: 4.7, bright: 4.99 },
  white: { dark: 10.34, mid: 4.19, bright: 4.47 },
};

/**
 * Compositor milliseconds over the three second phone scroll, the median of
 * three runs. ★ THE MATERIAL CHOICE IS FREE: the three are inside the
 * run-to-run spread of each other (Frost's three runs were 23, 24 and 26), so
 * nothing here should be decided on cost. What costs is HAVING glass at all,
 * which is about six times the no-filter floor, and that was ruled in round one.
 */
export const COST: Record<CostId, number> = {
  today: 21,
  frost: 24,
  crystal: 24,
  white: 23,
};

/** The same run with no backdrop filter at all: the floor every figure is read against. */
export const FLAT_COST = 4;
/** Frames the compositor drew in that run, so the millisecond is a rate and not a mystery. */
export const COST_FRAMES = 72;

/**
 * THE SHARE OF A PANE'S OUTLINE YOU CAN SEE, as a percentage: how much of its
 * top and bottom runs stand at least 8 of 255 clear of the photograph behind
 * them, which is about where an edge stops being an edge at arm's length.
 *
 * This is what decides the second question. Over the middling photograph a
 * Frost pane with no hairline loses 41 percent of its outline into the picture;
 * one lip recovers it to 81 and the double edge to 97. Over the darkest one all
 * three sit inside each other's noise, which is worth saying on the board
 * rather than hiding: the double edge earns its keep on the hard photographs.
 */
export const EDGE_SEEN: Record<MaterialId, Record<EdgeId, ByGround<number>>> = {
  frost: {
    none: { dark: 93, mid: 59, bright: 85 },
    lip: { dark: 93, mid: 81, bright: 96 },
    double: { dark: 84, mid: 97, bright: 97 },
  },
  crystal: {
    none: { dark: 94, mid: 90, bright: 97 },
    lip: { dark: 94, mid: 94, bright: 99 },
    double: { dark: 90, mid: 97, bright: 88 },
  },
  white: {
    none: { dark: 88, mid: 91, bright: 93 },
    lip: { dark: 84, mid: 99, bright: 96 },
    double: { dark: 81, mid: 99, bright: 85 },
  },
};

/**
 * How far the top lip stands off the pane's own interior, on 0 to 255: what a
 * highlight IS, measured rather than declared. It barely moves with the
 * photograph, which is the argument for it: the body's separation is at the
 * mercy of the picture and the lip's is not.
 */
export const EDGE_LIP: Record<MaterialId, Record<EdgeId, number>> = {
  frost: { none: 0.8, lip: 17, double: 37.1 },
  crystal: { none: 0.2, lip: 15.7, double: 34.3 },
  white: { none: 0.8, lip: 14.5, double: 31.6 },
};

/** The one line every contrast caption ends with, so the method travels with the number. */
export const METHOD =
  "measured on the rendered pane, its glyphs hidden, inside this board's own frame";

/** The one line every cost caption ends with. */
export const COST_METHOD =
  "a 3s scroll of 40 marked tiles at 375, DPR 3, CPU throttled 4x, Chrome's compositor trace, the median of three runs";
