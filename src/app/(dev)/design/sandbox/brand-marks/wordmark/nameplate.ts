import { area, ccw, cw, place, poly, rect, setWord, type Pt } from "./geo";

/**
 * A NAMEPLATE: PARTYREEL drawn as an extended grotesque in spaced capitals,
 * the way a camera engraves its name on its body (a Hasselblad's, a Leica's
 * top plate), so the mark speaks in the readout's own voice: the spaced
 * capitals a camera prints a state in, made the mark.
 *
 * Drawn at a cap height of 1000 (y down: the cap line at 0, the baseline at
 * 1000) from exact shapes, then set in production's 64 box on v1's baseline
 * (50.79) at a cap height of 40: at the bars' 22px its capitals stand 13.75px,
 * a step above the nav's 14px links (10px capitals), so it holds the corner
 * the way v1 does without its weight.
 *
 * ★ 394 UNITS WIDE, past v1's 308: the paste widens production's svg to it
 * (136px in the bars, where v1 is 106px), so landing it means
 * `src/lib/brand/wordmark.ts` takes this width as its viewBox and aspect, and
 * a frame that sizes the word by its height alone must leave it the room.
 *
 * THE CRAFT, each a reason:
 * - One weight read four ways: the stem at 16.5% of the cap (a medium that
 *   neither thins at 16px nor blots at 22px), horizontals a touch thinner
 *   (the eye reads a level stroke heavier), diagonals thinner across their
 *   stroke than the stem (a slant reads heavier), a bowl's thickest a hair
 *   over the stem (a curve reads lighter).
 * - Wide letters, not wide spacing alone: P, R, A and T near the cap's width
 *   and the A past it, the E and L narrower than the bowls, as an extended
 *   grotesque proportions them.
 * - Every junction thinned where small sizes blot: the bowls' lower arms
 *   rise into the stem, the A's strokes taper into its flat apex, the Y's
 *   arms into their crotch.
 * - Spacing by area, measured from the outlines (below), never by box.
 * - No ornament: the camera's restraint is the idea, so the drawing alone
 *   carries it.
 */

const H = 1000;
/** The stem. */
const V = 165;
/** Horizontals a touch thinner than the stem, so the two read as one weight. */
const HZ = 145;
/** A diagonal across its stroke, thinner than the stem: a slanted stroke reads heavier. */
const DG = 160;
/** A bowl at its thickest, a hair over the stem: a curve reads lighter than a straight. */
const CV = 172;
/** The rounds' squareness (2 is an ellipse): an extended grotesque's shoulder, its counter a touch squarer so the shoulder never thickens. */
const SQ = 2.8;
const SQ_IN = 3;
/** How far a bowl's underside rises as its lower arm meets the stem, and over what run. */
const JOIN = 12;
const JOIN_RUN = 170;

/** The A: its apex cut flat at about the stem's width; its bar's top, low, so the counter above stays open at 16px. */
const A_APEX = 170;
const A_BAR = 655;
/** How far the A's counter peaks above where its strokes' parallel edges would meet. */
const APEX_LIFT = 50;
/** The R's leg: its lean (across over down) from the bowl's floor to a foot past the bowl. */
const R_LEAN = 0.62;
/** Where the Y's arms reach its stem, and how far below their parallel meeting its crotch sits. */
const Y_STEM = 590;
const Y_TAPER = 30;

/** Points along a superellipse of squareness `n` from `t0` to `t1` degrees (0 is right, 90 down), inclusive. */
function squircle(
  cx: number,
  cy: number,
  a: number,
  b: number,
  n: number,
  t0: number,
  t1: number,
  steps = 36,
): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((t0 + ((t1 - t0) * i) / steps) * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    out.push([
      cx + a * Math.sign(c) * Math.abs(c) ** (2 / n),
      cy + b * Math.sign(s) * Math.abs(s) ** (2 / n),
    ]);
  }
  return out;
}

/**
 * A bowl (P, R): a straight arm out from the stem along the cap line, a
 * squarish round, and a straight arm back to the stem whose underside is at
 * `bottom`. Its counter is a round of its own, the horizontal's weight in
 * from the arms and the curve's from the side (★ never the outline offset by
 * the stroke: offsetting a squarish curve pinches the counter's corners into
 * kinks). The counter keeps a level floor while the underside rises into the
 * stem: that three-way join is where a bowl blots at the bars' size.
 */
function bowl(right: number, bottom: number, round: number) {
  const b = bottom / 2;
  const cx = right - round;
  const rise: Pt[] = [];
  for (let i = 8; i >= 0; i--) {
    const u = i / 8;
    rise.push([V + JOIN_RUN * u, bottom - JOIN * (1 - u) ** 2]);
  }
  const outer: Pt[] = [
    [0, 0],
    ...squircle(cx, b, round, b, SQ, -90, 90),
    ...rise,
    [0, bottom - JOIN],
  ];
  const inner: Pt[] = [
    [V, HZ],
    ...squircle(cx, b, round - CV, b - HZ, SQ_IN, -90, 90),
    [V, bottom - HZ],
  ];
  return poly(cw(outer)) + poly(ccw(inner));
}

const GLYPHS: Record<string, () => { w: number; d: string }> = {
  /** The P's bowl sits a little lower than the R's, so it is not top-heavy over its open foot. */
  P() {
    const w = 800;
    return { w, d: rect(0, 0, V, H) + bowl(w, 565, 340) };
  },
  /**
   * The R's leg springs from the bowl's floor and strides past the bowl, so
   * the letter stands on two feet; its top is buried in the bowl's arm.
   */
  R() {
    const w = 850;
    const top = 545 - HZ * 0.6;
    const f = DG * 1.04 * Math.hypot(1, R_LEAN);
    const run = (H - top) * R_LEAN;
    const leg = poly(
      cw([
        [w - f - run, top],
        [w - run, top],
        [w, H],
        [w - f, H],
      ]),
    );
    return { w, d: rect(0, 0, V, H) + bowl(790, 545, 335) + leg };
  },
  /**
   * The A: two strokes from a flat apex, the left a hair lighter than the
   * right (the grotesque's memory of the pen), drawn as one outline with its
   * counter cut out above a low bar.
   */
  A() {
    const w = 1010;
    const xl = (w - A_APEX) / 2;
    const xr = (w + A_APEX) / 2;
    const lean = xl / H;
    const fl = DG * 0.97 * Math.hypot(1, lean);
    const fr = DG * 1.03 * Math.hypot(1, lean);
    const barH = HZ * 0.94;
    const li = (y: number): Pt => [fl + lean * (H - y), y];
    const ri = (y: number): Pt => [w - fr - lean * (H - y), y];
    // Where the strokes' inner edges would meet if they ran parallel: the
    // counter peaks above it, so the strokes taper into the apex.
    const yc = H - (w - fr - fl) / (2 * lean);
    const outer: Pt[] = [
      [xl, 0],
      [xr, 0],
      [w, H],
      [w - fr, H],
      ri(A_BAR + barH),
      li(A_BAR + barH),
      [fl, H],
      [0, H],
    ];
    const counter: Pt[] = [[li(yc)[0], yc - APEX_LIFT], ri(A_BAR), li(A_BAR)];
    return { w, d: poly(cw(outer)) + poly(ccw(counter)) };
  },
  T() {
    const w = 860;
    return { w, d: rect(0, 0, w, HZ) + rect((w - V) / 2, 0, V, H) };
  },
  /** The Y: two arms cut level at the cap line, meeting the stem a little below the middle. */
  Y() {
    const w = 960;
    const c = w / 2;
    const lean = (c - V / 2) / Y_STEM;
    const top = DG * Math.hypot(1, lean);
    const crotch: Pt = [c, (c - top) / lean + Y_TAPER];
    return {
      w,
      d: poly(
        cw([
          [0, 0],
          [top, 0],
          crotch,
          [w - top, 0],
          [w, 0],
          [c + V / 2, Y_STEM],
          [c + V / 2, H],
          [c - V / 2, H],
          [c - V / 2, Y_STEM],
        ]),
      ),
    };
  },
  /**
   * The E: its middle arm shortest and a hair thinner, set a touch above the
   * middle (level with the P's lower arm), its foot the longest, so it stands.
   */
  E() {
    const w = 700;
    const midH = HZ * 0.96;
    return {
      w,
      d:
        rect(0, 0, V, H) +
        rect(0, 0, w - 12, HZ) +
        rect(0, 490 - midH / 2, w - 58, midH) +
        rect(0, H - HZ, w, HZ),
    };
  },
  L() {
    const w = 650;
    return { w, d: rect(0, 0, V, H) + rect(0, H - HZ, w, HZ) };
  },
};

/**
 * SPACING BY AREA, NOT BY BOX: each side of a letter is measured for the
 * white it lets into a gap (at every height, how far its ink stands back from
 * its box, counted only to OPEN deep so a counter never counts whole), and
 * each pair is closed by its two sides' white, so every gap holds the same
 * white as two stems TRACK apart. So the open pairs (P-A, A-R, R-T, T-Y,
 * Y-R) close up by their measure, and a redrawn letter respaces itself.
 */
const OPEN = 160;
const TRACK = 480;

/** A letter's white on its left and its right, as a mean depth in units. */
function sides(g: { w: number; d: string }): readonly [number, number] {
  const solids = g.d
    .split("Z")
    .filter((s) => s.includes("M"))
    .map((s) =>
      [...s.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
        (m) => [Number(m[1]), Number(m[2])] as const,
      ),
    )
    .filter((p) => area(p) > 0);
  let left = 0;
  let right = 0;
  let rows = 0;
  for (let y = 5; y < H; y += 10, rows++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of solids) {
      for (let i = 0; i < p.length; i++) {
        const [x1, y1] = p[i];
        const [x2, y2] = p[(i + 1) % p.length];
        // An edge crossing this height, half-open so a vertex counts once.
        if (y1 <= y !== y2 <= y) {
          const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
      }
    }
    left += Math.min(OPEN, lo);
    right += Math.min(OPEN, g.w - hi);
  }
  return [left / rows, right / rows];
}

const WORD = "PARTYREEL";

/**
 * What the measure cannot see, set by eye: the P's open foot and the A's
 * open shoulder face each other across their gap, so the pair holds more
 * white than either side's capped measure (measured, its inks come no
 * nearer than 500 units; every other pair's come within 200 to 380).
 */
const EYE: Record<string, number> = { PA: -40 };

const KERN = (() => {
  const out: Record<string, number> = {};
  for (let i = 0; i < WORD.length - 1; i++) {
    const pair = WORD[i] + WORD[i + 1];
    const white = sides(GLYPHS[WORD[i]]())[1] + sides(GLYPHS[WORD[i + 1]]())[0];
    out[pair] = (EYE[pair] ?? 0) - white;
  }
  return out;
})();

const CAP = 40;
const BASELINE = 50.79;

export const NAMEPLATE = (() => {
  const set = setWord(WORD, GLYPHS, TRACK, KERN);
  const s = CAP / H;
  return { d: place(set.d, 0, BASELINE - CAP, s), w: set.w * s };
})();
