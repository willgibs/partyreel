import { WORDMARK_PATH } from "@/lib/brand/wordmark";

/**
 * YOUR V1, FINISHED: the letters byte for byte, only spaced.
 *
 * His file is one path of ten closed shapes (`src/lib/brand/wordmark.ts`,
 * never retyped): the r, t and y on their one bar, the a and its counter, the
 * second r joined to the first e and its eye, the second e and its eye, the P
 * and its counter, the l. The display cut (48px and up) is that path exactly.
 *
 * THE SMALL CUT, for production's 22px (every bar and the foot) and 16px (the
 * admin's bar), moves whole shapes right and nothing else. Measured edge to
 * edge in the 64-unit box, three pairs touch as drawn: the y's arm and the
 * second r's stem at the top line (0.10), the two e's (0.47), the P's bowl and
 * the a (0.77). At 22px a unit is a third of a pixel, so each closes into a
 * blot, and the bar seems to run on from the t through the second r. The rest
 * of his white is even (5.0 to 6.3 units across the x-height, inside his two
 * joins too), so the cut parts the three to one even seam and gives the two
 * open pairs the same breath: his rhythm, a step looser, as a small size wants.
 *
 *   nearest edge to edge   P|a   a|r   y|r   e|e   e|l
 *   as drawn               0.77  2.22  0.10  0.47  1.87
 *   small cut              2.40  3.10  1.86  2.55  2.76
 *
 * Seen at 22 and 16px, ink on paper and in the room, at a device pixel ratio
 * of 2 and of 1: every pair keeps a seam at least 80% paper at 22px on a
 * laptop, and none closes even at 16px on a 1x monitor. Nothing inside a shape
 * moves, so his ligature on the r-t-y bar and the r joined to the first e stay
 * his; parting y|r is what keeps the bar's ligature reading as the one he
 * drew. The word grows 7.5 units (315.5 wide, under 3px more at 22px).
 *
 * ★ HIS PATH DRAWS WITH H (twenty of them), so a move must move every H's x
 * as well as each M's and L's: `geo.ts`'s `place` reads only x-y pairs (it is
 * for the shapes drawn there) and, run on his path, bent his letters by up to
 * 3.9 units. `moveRight` below reads the commands.
 */

/** His shapes in file order, named, so a reader can see which moves. */
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

type Shape = (typeof SHAPES)[number];

/**
 * WHAT EACH PAIR OPENS BY in the small cut, in units of the 64 box: each the
 * least that leaves the pair its seam at 22px in every pixel phase and keeps
 * it open at 16px, with a|r and e|l given the same breath so the white between
 * letters stays as even as he drew it.
 */
const OPEN = {
  /** The P's bowl rides the a's shoulder 0.77 apart along a stretch, the longest kiss. */
  "P|a": 1.8,
  /** Never touching (2.22, at the a's foot), but the tightest white once the rest open. */
  "a|r": 0.9,
  /** His bar would run on into the second r: the y's arm meets its stem 0.10 apart. */
  "y|r": 1.8,
  /** The bowls touch at their waists, 0.47 apart: round against round needs the most. */
  "e|e": 2.1,
  /** 1.87 at the e's tail; opened as a|r is, so the two open pairs match. */
  "e|l": 0.9,
} as const;

/** The word's six pieces left to right, each the shapes that move as one, after the pair that opens before it. */
const PIECES: readonly (readonly [
  keyof typeof OPEN | null,
  readonly Shape[],
])[] = [
  [null, ["P", "P's counter"]],
  ["P|a", ["a", "a's counter"]],
  ["a|r", ["rty"]],
  ["y|r", ["re", "the first e's eye"]],
  ["e|e", ["the second e", "its eye"]],
  ["e|l", ["l"]],
];

/** How far each shape moves right: everything opened to its left. */
const MOVE = (() => {
  const move: Partial<Record<Shape, number>> = {};
  let x = 0;
  for (const [pair, shapes] of PIECES) {
    if (pair) x = Math.round((x + OPEN[pair]) * 1000) / 1000;
    for (const shape of shapes) move[shape] = x;
  }
  return move;
})();

/** A number from his file moved by `by`, exactly: his digits kept, no float noise. */
function plus(n: string, by: number): string {
  const places = Math.max(n.split(".")[1]?.length ?? 0, 3);
  const scale = 10 ** places;
  const sum = Math.round(Number(n) * scale) + Math.round(by * scale);
  return (sum / scale).toFixed(places).replace(/\.?0+$/, "");
}

/** One shape moved right: every x moves (an M's or L's first number, every H), every y stays. */
function moveRight(shape: string, by: number): string {
  if (!by) return shape;
  let command = "";
  let isX = true;
  return shape.replace(/[MLHVZ]|-?\d*\.?\d+/g, (token) => {
    if (/[MLHVZ]/.test(token)) {
      command = token;
      isX = true;
      return token;
    }
    if (command === "H") return plus(token, by);
    if (command === "V") return token;
    const moved = isX ? plus(token, by) : token;
    isX = !isX;
    return moved;
  });
}

/** Absolute straight lines only (M, L, H, V, Z), the commands `moveRight` reads. */
const PLAIN = /^(?:[MLHVZ]|-?\d*\.?\d+|[\s,])+$/;

const SUBPATHS = WORDMARK_PATH.split(/(?=M)/);

/** The display cut: his path exactly, in his 308 box. */
export const FINISHED_DISPLAY = { d: WORDMARK_PATH, w: 308 } as const;

/** The small cut, for production's 22px and 16px: the same shapes, spaced. */
export const FINISHED_SMALL = (() => {
  if (SUBPATHS.length !== SHAPES.length || !PLAIN.test(WORDMARK_PATH))
    // His next file arrives with another count of shapes, or curves: draw it
    // as is rather than move the wrong letters.
    return { d: WORDMARK_PATH, w: 308 };
  const d = SUBPATHS.map((s, i) => moveRight(s, MOVE[SHAPES[i]] ?? 0)).join("");
  return { d, w: 308 + (MOVE.l ?? 0) };
})();
