import type { GroundId } from "./fixtures";
import type { RecipeId } from "./recipes";

/**
 * WHAT WAS MEASURED, AND HOW (2026-09-18). The numbers a caption prints under a
 * frame, taken off a browser rather than out of a formula.
 *
 * ★ THE CAPTIONS ARE THE TRUTH WHEN THE WORDS DISAGREE WITH THEM. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of the words he picked (docs/PROGRAM.md), so nothing on
 * this board is computed from a recipe's numbers where it could be read off a
 * rendered pixel instead.
 *
 * CONTRAST: read off THE BOARD, not off a harness. The first pass drew the pill
 * on a page of its own and measured there, and it was measuring a different
 * crop of a different photograph: this board's lightbox cuts its ground to 3:4
 * and puts the pill at the foot. So the harness now drives the real board,
 * finds the action pill by its `data-gl-pill` mark inside the frame's own
 * document, hides its glyphs so only the material is in the shot, screenshots
 * exactly its box and puts pure white against what came back. `worst` is the
 * brightest twelfth across the pill, because a word sits on a twelfth of it
 * and not on the average.
 *
 * COST: Chrome's own compositor trace (`Display::DrawAndSwap` summed over the
 * run) across a three second scroll of forty tiles with four chips each, at 375
 * by 812, device pixel ratio 3, mobile emulation, the CPU throttled four times.
 * A backdrop filter makes the compositor open a render pass, copy the backdrop
 * in, filter it and draw it back, so that is where the work lands. Chrome
 * composites on the real GPU here even headless, so these are GPU milliseconds
 * over 180 frames, not software estimates; a phone's GPU is several times
 * slower than this Mac's, which is what the 4x throttle stands in for.
 *
 * The harness is 200 lines of Node over the DevTools protocol and reads
 * `recipes.ts` by regex so it cannot drift from the board; it is a tool rather
 * than a board file, so it is not committed. The Handoff carries its output.
 */

/** White text against the pill, per recipe and ground: mean, then worst patch. */
export const CONTRAST: Record<RecipeId, Record<GroundId, [number, number]>> = {
  today: { dark: [16.8, 15.43], mid: [9.69, 5.3], bright: [10.35, 6.67] },
  veil: { dark: [16.01, 14.58], mid: [8.69, 4.56], bright: [9.15, 5.68] },
  frost: { dark: [16.07, 14.88], mid: [9.52, 5.23], bright: [9.7, 6.06] },
  crystal: { dark: [13.07, 11.93], mid: [6.91, 3.72], bright: [6.73, 3.92] },
};

/** Compositor milliseconds over the three second phone scroll, per recipe. */
export const COST: Record<RecipeId, { full: number; quiet: number }> = {
  today: { full: 127, quiet: 114 },
  veil: { full: 170, quiet: 139 },
  frost: { full: 177, quiet: 169 },
  crystal: { full: 223, quiet: 208 },
};

/** The same run with no backdrop filter at all: the floor every figure is read against. */
export const FLAT_COST = 10;

/** The lightbox's own full-screen backdrop, measured the same way. */
export const BEHIND_COST = { wall: 8, album: 22, dim: 23 };

/** The host's row at 1440, in the recommended recipe: three discs against one bar. */
export const ROW_COST = { chips: 93, bar: 56 };

/** The one line every caption ends with, so the method travels with the number. */
export const METHOD =
  "measured: a 3s scroll at 375, DPR 3, CPU throttled 4x, Chrome's compositor trace";
