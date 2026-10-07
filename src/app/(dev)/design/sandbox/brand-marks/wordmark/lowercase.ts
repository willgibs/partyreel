import { band, oval, rect, setWord, slab } from "./geo";

/**
 * A LOWERCASE WORD, REDRAWN ON THE RING: "partyreel" drawn on circles, the
 * bowls of its p, a and e the Ring's own round, upright and unhurried, in the
 * same family as the headings' Urbanist.
 *
 * Drawn straight into production's 64 box on v1's own lines: its x-height
 * from 14.22 to the baseline at 50.79, the ascenders of t and l and the
 * descenders of p and y within the box, so it stands in the bar where v1 does.
 */

const XT = 14.22;
const BL = 50.79;
const XH = BL - XT;
const ASC = 4;
const DESC = 63;
/** The stem. */
const W = 7.2;
/** A round letter overshoots the x-height and the baseline, so it looks as tall as a flat one. */
const O = 0.7;
const R = XH / 2 + O;
/** A hair wider than tall, so a circle looks round. */
const RX = R * 1.02;
const MID = XT + XH / 2;

/** A ring bowl, its counter nudged toward the stem it joins so the join is not a blot. */
function ring(cx: number, toward: -1 | 0 | 1 = 0) {
  return (
    oval(cx, MID, RX, R) +
    oval(cx + toward * 0.9, MID, RX - W, R - W * 0.94, true)
  );
}

const GLYPHS: Record<string, () => { w: number; d: string }> = {
  p() {
    const w = W + RX * 2 - W * 0.5;
    return { w, d: rect(0, XT, W, DESC - XT) + ring(W * 0.5 + RX, -1) };
  },
  a() {
    const w = RX * 2 - W * 0.5 + W;
    return { w, d: ring(RX, 1) + rect(w - W, XT, W, XH) };
  },
  r() {
    const w = W + 13;
    const cx = W + 10;
    const arm = band(
      cx,
      MID + 2,
      [14.5, R + 2],
      [14.5 - W * 0.9, R + 2 - W * 0.92],
      180,
      268,
      40,
    );
    return { w, d: rect(0, XT, W, XH) + arm };
  },
  t() {
    const w = W + 14;
    return {
      w,
      d: rect(5.5, ASC + 6, W, BL - ASC - 6) + rect(0, XT, w, W * 0.86),
    };
  },
  y() {
    const w = 36;
    return {
      w,
      d:
        slab(W * 0.6, XT, w / 2 + 1, BL, W) + slab(w - W * 0.6, XT, 5, DESC, W),
    };
  },
  e() {
    const w = RX * 2;
    const bowl = band(
      RX,
      MID,
      [RX, R],
      [RX - W * 0.98, R - W * 0.94],
      32,
      360,
      80,
    );
    const bar = rect(W * 0.4, MID - W * 0.42, RX * 2 - W * 0.8, W * 0.84);
    return { w, d: bowl + bar };
  },
  l() {
    return { w: W, d: rect(0, ASC, W, BL - ASC) };
  },
};

const SPACE = 3.4;
const KERN: Record<string, number> = {
  rt: -1.6,
  ty: -2.2,
  yr: -2.2,
  re: -0.6,
  ee: 0.4,
  el: 0.6,
};

export const LOWERCASE = setWord("partyreel", GLYPHS, SPACE, KERN);
