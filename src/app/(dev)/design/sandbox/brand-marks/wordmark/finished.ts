import { WORDMARK_PATH } from "@/lib/brand/wordmark";

import { place } from "./geo";

/**
 * YOUR V1, FINISHED: the letters byte for byte, only spaced.
 *
 * His file is one path of ten closed shapes (`src/lib/brand/wordmark.ts`,
 * never retyped): the P and its counter, the a and its counter, the r, t and
 * y on their one bar, the second r joined to the first e and its eye, the
 * second e and its eye, the l. Three pairs nearly touch as drawn, measured
 * edge to edge in the 64-unit box: the P's bowl and the a (0.8), the two e's
 * (0.5) and the e and the l (1.9). At a poster's size that kiss is a
 * ligature's tension; at the nav's 22px a unit is a third of a pixel, so the
 * three pairs close into blots, which is where the eye snags.
 *
 * ★ THE SMALL CUT moves whole letters and nothing else: each kissing pair is
 * parted to 2.6 units, a pixel of air at 22px, so the word reads letter by
 * letter at every size production draws it (22px in the bars, 16px in the
 * admin's). The display cut stays his drawing exactly, for 48px and up.
 */

/** His shapes in file order, named, so a test or a reader can see which moves. */
const SHAPES = [
  "rty",
  "a",
  "a's counter",
  "re",
  "the first e's eye",
  "the second e",
  "its eye",
  "P",
  "P's counter",
  "l",
] as const;

/** How far each shape moves right in the small cut (units of the 64 box). */
const MOVE: Record<(typeof SHAPES)[number], number> = {
  P: 0,
  "P's counter": 0,
  a: 1.8,
  "a's counter": 1.8,
  rty: 1.8,
  re: 1.8,
  "the first e's eye": 1.8,
  "the second e": 1.8 + 2.1,
  "its eye": 1.8 + 2.1,
  l: 1.8 + 2.1 + 0.7,
};

const SUBPATHS = WORDMARK_PATH.split(/(?=M)/);

/** The display cut: his path exactly, in his 308 box. */
export const FINISHED_DISPLAY = { d: WORDMARK_PATH, w: 308 } as const;

/** The small cut, for 32px and under: the same shapes, three pairs parted. */
export const FINISHED_SMALL = (() => {
  if (SUBPATHS.length !== SHAPES.length)
    // His next file arrives with another count of shapes: draw it as is
    // rather than move the wrong letters.
    return { d: WORDMARK_PATH, w: 308 };
  const d = SUBPATHS.map((s, i) => place(s, MOVE[SHAPES[i]])).join("");
  return { d, w: 308 + MOVE.l };
})();
