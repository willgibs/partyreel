/**
 * A LETTER'S GEOMETRY, AS SVG PATH DATA: the redrawn wordmarks are built from
 * a handful of exact shapes, every one a closed path, solids clockwise on the
 * screen (y down) and counters counter-clockwise, so the whole word fills under
 * SVG's default `nonzero` rule as one union with its holes: a stem written over
 * a bowl joins it, and a counter written inside a bowl opens it. No boolean
 * library, no font file: the drawing is the data, in the 308 by 64 box the
 * production wordmark lives in (`src/lib/brand/wordmark.ts`).
 */

export type Pt = readonly [number, number];

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** Signed area on the screen: positive is clockwise with y pointing down. */
export function area(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export const cw = (pts: readonly Pt[]): Pt[] =>
  area(pts) >= 0 ? [...pts] : [...pts].reverse();
export const ccw = (pts: readonly Pt[]): Pt[] =>
  area(pts) < 0 ? [...pts] : [...pts].reverse();

/** A closed polygon, in the order given. */
export const poly = (pts: readonly Pt[]) =>
  `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;

/** A solid rectangle. */
export const rect = (x: number, y: number, w: number, h: number) =>
  poly(
    cw([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]),
  );

/** A hole rectangle. */
export const hole = (x: number, y: number, w: number, h: number) =>
  poly(
    ccw([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]),
  );

/** Points along an ellipse from `a0` to `a1` degrees (0 is right, 90 down), inclusive. */
export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  n = 48,
): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** A whole ellipse, solid (or a hole). */
export const oval = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  asHole = false,
) => {
  const pts = arc(cx, cy, rx, ry, 0, 360, 96).slice(0, -1);
  return poly(asHole ? ccw(pts) : cw(pts));
};

/** The band between two ellipses from `a0` to `a1` degrees, its ends cut along the radius. */
export function band(
  cx: number,
  cy: number,
  outer: readonly [number, number],
  inner: readonly [number, number],
  a0: number,
  a1: number,
  n = 72,
) {
  const o = arc(cx, cy, outer[0], outer[1], a0, a1, n);
  const i = arc(cx, cy, inner[0], inner[1], a1, a0, n);
  return poly(cw([...o, ...i]));
}

/**
 * A diagonal stroke cut level at both ends: from the line y0 to the line y1,
 * its centre running x0 to x1, as wide across the stroke as `w`.
 */
export function slab(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const hw = (w * len) / Math.abs(y1 - y0) / 2;
  return poly(
    cw([
      [x0 - hw, y0],
      [x0 + hw, y0],
      [x1 + hw, y1],
      [x1 - hw, y1],
    ]),
  );
}

/** Every coordinate pair in a path built here (M, L and Z only), moved and scaled. */
export function place(d: string, dx: number, dy = 0, s = 1) {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    return `${f(Number(x) * s + dx)} ${f(Number(y) * s + dy)}`;
  });
}

/** A path's bounds (M, L and Z paths only). */
export function bounds(d: string) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const m of d.matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/**
 * A word set from its glyphs: each drawn at x 0 in its own box, laid left to
 * right with the track and each pair's own space between boxes.
 */
export function setWord(
  word: string,
  glyphs: Readonly<Record<string, () => { w: number; d: string }>>,
  track: number,
  kern: Readonly<Record<string, number>> = {},
) {
  let x = 0;
  let d = "";
  for (let i = 0; i < word.length; i++) {
    const g = glyphs[word[i]]();
    d += place(g.d, x);
    x += g.w;
    if (i < word.length - 1) x += track + (kern[word[i] + word[i + 1]] ?? 0);
  }
  return { d, w: x };
}
