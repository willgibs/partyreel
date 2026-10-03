import qrcode from "qrcode-generator";

/**
 * THE CODE'S GRID, PURE (`code.tsx` draws it): the one version every address
 * is encoded at, where a data dot may stand, and the matrix of a value. No
 * React, no stylesheet, no env, so `qr.test.ts` reads it in the node project
 * and the hero's server render agrees with the browser's.
 */

/** Every code's version: 33 modules, the smallest that holds every address at Q. */
export const VERSION = 4;
export const ECC = "Q";
/** Modules a side. */
export const MODULES = 17 + 4 * VERSION;
export const MID = MODULES / 2;

/** The heart's radius, and the white kept round it, in modules. */
export const HEART_R = 3.4;
export const CLEAR_R = HEART_R + 0.75;

/** A data dot's radius, in modules (the `dots` preset's own share). */
export const DOT_R = 0.42;

/** The code's ink: the paper's own near-black, at a scanner's contrast. */
export const INK = "#0b0b0c";

/** How many rings the bloom runs over, centre to corner. */
export const RINGS = Math.ceil(Math.hypot(MID, MID) / 1.5) + 1;

export const finder = (r: number, c: number) =>
  (r < 7 && c < 7) ||
  (r < 7 && c >= MODULES - 7) ||
  (r >= MODULES - 7 && c < 7);

export type Cell = {
  readonly i: number;
  readonly x: number;
  readonly y: number;
};

/** Every place a data dot can stand, grouped by its ring out from the heart. */
export const CELLS_BY_RING: readonly (readonly Cell[])[] = (() => {
  const rings: Cell[][] = Array.from({ length: RINGS }, () => []);
  for (let r = 0; r < MODULES; r++)
    for (let c = 0; c < MODULES; c++) {
      if (finder(r, c)) continue;
      const x = c + 0.5;
      const y = r + 0.5;
      const d = Math.hypot(x - MID, y - MID);
      if (d < CLEAR_R) continue;
      rings[Math.min(RINGS - 1, Math.floor((d - CLEAR_R) / 1.5))].push({
        i: r * MODULES + c,
        x,
        y,
      });
    }
  return rings;
})();

const MATRICES = new Map<string, Uint8Array>();

/** The code for one value, solved once a value. */
export function matrixOf(value: string): Uint8Array {
  const hit = MATRICES.get(value);
  if (hit) return hit;
  const qr = qrcode(VERSION, ECC);
  qr.addData(value);
  qr.make();
  const m = new Uint8Array(MODULES * MODULES);
  for (let r = 0; r < MODULES; r++)
    for (let c = 0; c < MODULES; c++)
      m[r * MODULES + c] = qr.isDark(r, c) ? 1 : 0;
  MATRICES.set(value, m);
  return m;
}
