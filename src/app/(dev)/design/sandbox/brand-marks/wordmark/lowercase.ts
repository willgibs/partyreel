import { arc, cw, oval, poly, type Pt, rect, setWord } from "./geo";

/**
 * A LOWERCASE WORD ON THE RING: "partyreel" redrawn upright on one circle,
 * the Ring's own round, at the weight of the headings' Urbanist 700, so the
 * word, the icon and every heading read as one family.
 *
 * Drawn straight into production's 64 box on v1's own lines: the x-height
 * from 14.22 to the baseline at 50.79, the l rising to about 3 and the t to
 * about 7, the p and the y falling to 63, so it stands in the bar where v1
 * does. It is 316 wide, past production's 308, so the bar never shrinks it,
 * and the width is its weight and its spacing, never padding.
 *
 * Every shape is exact (`geo.ts`): solids clockwise, counters
 * counter-clockwise, nonzero fill, so a stem drawn over a bowl joins it and a
 * counter that reaches a stem never dents it.
 */

// THE LINES: v1's, in production's box.
const XT = 14.22;
const BL = 50.79;
const XH = BL - XT;
const MID = (XT + BL) / 2;
/** The middles of the l's and the t's cut tops, and the p's and the y's feet. */
const L_TOP = 3.2;
const T_TOP = 7.4;
const FOOT = 63;

/**
 * THE WEIGHT: Urbanist 700's stem at this x-height (122 on its 500), so the
 * word sits with the headings and holds at the admin's 16px (a stem of 2.25
 * pixels). Each stroke is corrected to look that one weight: a round at its
 * widest drawn heavier (a curve reads thinner than a straight as wide), a
 * horizontal lighter (it reads heavier), a diagonal a touch lighter, and the
 * e's bar lighter still so its eye stays open at 16px.
 */
const W = 9;
const W_ROUND = W * 1.04;
const W_FLAT = W * 0.9;
const W_DIAG = W * 0.95;
const W_BAR = W * 0.8;

/**
 * THE RING: one ellipse draws every round (the p's and the a's bowls, both
 * e's, the r's shoulder). It overshoots the x-height and the baseline, since
 * a round must pass a flat line to look as tall, and it is a hair wider than
 * tall, since a true circle reads narrow. Its counter is the ring's own
 * inside, as the icon's puck sits inside its ring.
 */
const O = 0.95;
const RY = XH / 2 + O;
const RX = RY * 1.02;

type Ellipse = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Points along an ellipse from `a0` to `a1` degrees (0 right, 90 down). */
const along = (e: Ellipse, a0: number, a1: number, n = 40): Pt[] =>
  arc(e.cx, e.cy, e.rx, e.ry, a0, a1, n);
const ovalOf = (e: Ellipse, asHole = false) =>
  oval(e.cx, e.cy, e.rx, e.ry, asHole);
/** The angle where an ellipse's upper half crosses the vertical at `x`. */
const upperAtX = (e: Ellipse, x: number) =>
  360 - deg(Math.acos((x - e.cx) / e.rx));
/** The angle where an ellipse's right half crosses the level at `y`. */
const rightAtY = (e: Ellipse, y: number) => deg(Math.asin((y - e.cy) / e.ry));
/** A point's own angle on the ellipse it lies on. */
const angleOf = (e: Ellipse, [x, y]: Pt) => {
  const a = deg(Math.atan2((y - e.cy) / e.ry, (x - e.cx) / e.rx));
  return a < 0 ? a + 360 : a;
};
/** Where a ray from the ring's centre at `a` degrees leaves an ellipse: a cut along the radius. */
function onRadius(e: Ellipse, a: number): Pt {
  const u = (RX - e.cx) / e.rx;
  const v = (MID - e.cy) / e.ry;
  const du = Math.cos(rad(a)) / e.rx;
  const dv = Math.sin(rad(a)) / e.ry;
  const A = du * du + dv * dv;
  const B = 2 * (u * du + v * dv);
  const t = (-B + Math.sqrt(B * B - 4 * A * (u * u + v * v - 1))) / (2 * A);
  return [RX + t * Math.cos(rad(a)), MID + t * Math.sin(rad(a))];
}

const RING: Ellipse = { cx: RX, cy: MID, rx: RX, ry: RY };
const INNER: Ellipse = { cx: RX, cy: MID, rx: RX - W_ROUND, ry: RY - W_FLAT };

/**
 * THE STEMS STAND ON THE RING'S TANGENT: the p's stem is laid along the
 * ring's left edge and the a's along its right, so their bowls are the e's
 * round exactly and the two letters mirror each other. The counter is the
 * ring's own, let out toward the stem until it just touches it, so the stem
 * keeps its width through the bowl, and the small notch where the round
 * leaves the stem's top keeps the join from filling in at the bars' 22px.
 */
const COUNTER: Ellipse = (() => {
  const right = 2 * RX - W_ROUND;
  return { cx: (right + W) / 2, cy: MID, rx: (right - W) / 2, ry: INNER.ry };
})();

/**
 * THE R'S SHOULDER: the ring's top-left quarter, carried 8° past its top and
 * cut along its radius, so the arm reaches rather than stops short. Its
 * underside is a flatter curve that meets the stem 29% down the x-height,
 * high as Urbanist's, so the shoulder springs from the stem instead of
 * sagging into it.
 */
const R_PAST = 8;
const R_UNDER: Ellipse = (() => {
  const k = (MID - (XT + 0.29 * XH)) / INNER.ry;
  return {
    cx: RX,
    cy: MID,
    rx: (RX - W) / Math.sqrt(1 - k * k),
    ry: INNER.ry,
  };
})();

/**
 * V1'S CUT: the tops of the t and the l are cut at the angle of v1's own
 * ascenders (a rise of 3.387 in 13.716, measured off his file), the one mark
 * of his hand kept, so the two tallest strokes rise the way his word ran. The
 * feet stay level: a cut foot reads as a slip.
 */
const CUT = 3.387 / 13.716;

/** A stem from `top` down to `foot`, its top cut at v1's angle when asked. */
function stem(x: number, top: number, foot: number, cut = false) {
  const r = cut ? (W * CUT) / 2 : 0;
  return poly(
    cw([
      [x, top + r],
      [x + W, top - r],
      [x + W, foot],
      [x, foot],
    ]),
  );
}

/**
 * THE Y: straight arms 18° off upright, meeting at a point 0.3 below the
 * baseline (a point must pass the line to look as if it sits on it), the
 * tail running on straight to the descender, cut level.
 *
 * ★ THE LEFT ARM IS DRAWN ONLY TO THE TAIL'S CENTRE LINE, so its end is
 * buried inside the tail and the join is one clean vertex. Cut level at the
 * baseline instead, its corner pokes out past the tail (the first draft's
 * broken y).
 */
const Y_ANGLE = 18;
const Y_DIP = 0.3;

/**
 * THE E: the ring opened at its lower right, its terminal cut along the
 * radius at 38° (open enough to read as an e at 16px, closed enough to stay a
 * ring), its bar 0.6 above the middle so the eye is a touch smaller than the
 * counter below it.
 *
 * ★ THE BAR ENDS ON THE OUTER ROUND, clipped by it: a rectangle laid across
 * the ring sticks out past the aperture (the first draft's e).
 */
const E_TERM = 38;
const E_BAR_UP = 0.6;

const GLYPHS: Record<string, () => { w: number; d: string }> = {
  p: () => ({
    w: 2 * RX,
    d: stem(0, XT, FOOT) + ovalOf(RING) + ovalOf(COUNTER, true),
  }),
  a: () => ({
    w: 2 * RX,
    d:
      ovalOf(RING) +
      ovalOf({ ...COUNTER, cx: 2 * RX - COUNTER.cx }, true) +
      stem(2 * RX - W, XT, BL),
  }),
  r() {
    const cut = 270 + R_PAST;
    // From inside the stem, round the ring's shoulder to the cut, then back
    // along the underside into the stem, which hides the closing edge.
    const arm: Pt[] = [
      ...along(RING, upperAtX(RING, W / 2), angleOf(RING, onRadius(RING, cut))),
      ...along(
        R_UNDER,
        angleOf(R_UNDER, onRadius(R_UNDER, cut)),
        upperAtX(R_UNDER, W - 0.3),
      ),
    ];
    return {
      w: Math.max(...arm.map(([x]) => x)),
      d: stem(0, XT, BL) + poly(cw(arm)),
    };
  },
  t() {
    // The bar reaches further right than left, toward the letter that follows.
    const left = W * 0.62;
    const w = left + W + W * 0.86;
    return { w, d: stem(left, T_TOP, BL, true) + rect(0, XT, w, W_FLAT) };
  },
  y() {
    const s = Math.tan(rad(Y_ANGLE));
    /** A diagonal stroke's width along a level line. */
    const hw = W_DIAG / Math.cos(rad(Y_ANGLE));
    const vx = s * (BL + Y_DIP - XT);
    const tail = (y: number) => 2 * vx - s * (y - XT);
    const arm = (y: number) => s * (y - XT);
    // Where the left arm's outer and inner edges cross the tail's centre line.
    const yOut = XT + (2 * vx + hw / 2) / (2 * s);
    const yIn = XT + (2 * vx - hw / 2) / (2 * s);
    return {
      w: 2 * vx + hw,
      d:
        poly(
          cw([
            [0, XT],
            [hw, XT],
            [arm(yIn) + hw, yIn],
            [arm(yOut), yOut],
          ]),
        ) +
        poly(
          cw([
            [tail(XT), XT],
            [tail(XT) + hw, XT],
            [tail(FOOT) + hw, FOOT],
            [tail(FOOT), FOOT],
          ]),
        ),
    };
  },
  e() {
    const bar = MID - E_BAR_UP;
    // The bowl: from the terminal clockwise round the ring to the bar's middle.
    const bowl = [
      ...along(
        RING,
        angleOf(RING, onRadius(RING, E_TERM)),
        360 + rightAtY(RING, bar),
        72,
      ),
      ...along(
        INNER,
        360 + rightAtY(INNER, bar),
        angleOf(INNER, onRadius(INNER, E_TERM)),
        72,
      ),
    ];
    // The bar: from inside the left stroke to the outer round, which clips its end.
    const top = bar - W_BAR / 2;
    const foot = bar + W_BAR / 2;
    const span: Pt[] = [
      [W_ROUND / 2, top],
      ...along(RING, rightAtY(RING, top), rightAtY(RING, foot), 8),
      [W_ROUND / 2, foot],
    ];
    return { w: 2 * RX, d: poly(cw(bowl)) + poly(cw(span)) };
  },
  l: () => ({ w: W, d: stem(0, L_TOP, BL, true) }),
};

/**
 * THE SPACING, BY OPTICAL AREA: each pair set to the same white across the
 * x-height band (about 11.2 units on average), each side's profile counted
 * 4.5 deep, the depth a small size's eye weighs: the air under an r's arm or
 * a t's bar counts for less than its area. The two open pairs that meet at
 * the x-height (r and t, t and y) land at about 4 units, a pixel at the
 * admin's 16px, the closest any two letters come, so nothing kisses.
 */
const GAP: Record<string, number> = {
  pa: 6.1,
  ar: 10.5,
  rt: 4.2,
  ty: 4,
  yr: 7.2,
  re: 5,
  ee: 5.6,
  el: 7.8,
};

export const LOWERCASE = setWord("partyreel", GLYPHS, 0, GAP);
