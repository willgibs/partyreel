import { arc, ccw, cw, place, poly, rect, setWord, slab } from "./geo";

/**
 * A NAMEPLATE, REDRAWN: PARTYREEL in wide capitals, spaced the way a camera
 * engraves its name on its body (Aperture's hand: the readout's own voice, the
 * spaced capitals a camera prints a state in, made the mark).
 *
 * Drawn at a cap height of 100 and placed in production's 64 box with its
 * capitals standing exactly where v1's lowercase stands (from its x-height,
 * 14.22, to its baseline, 50.79), so it sits on the bar's line where v1 did.
 * It has no descender, so it needs no small cut of its own: its open spacing
 * is already a text size's.
 */

const H = 100;
/** The stem; horizontals are a touch thinner, so the two read as one weight. */
const W = 12.5;
const HW = 11;
const TRACK = 30;

/** A bowl (P, R): straight arms from the stem and a half-ellipse cap, its right edge at `right`. */
function bowl(right: number, bottom: number) {
  const ry = bottom / 2;
  const rx = Math.min(ry * 1.12, right * 0.5);
  const cx = right - rx;
  const outer = [
    [0, 0],
    [cx, 0],
    ...arc(cx, ry, rx, ry, -90, 90, 48).slice(1, -1),
    [cx, bottom],
    [0, bottom],
  ] as const;
  const irx = rx - W * 1.04;
  const iry = ry - HW;
  const inner = [
    [W, HW],
    [cx, HW],
    ...arc(cx, ry, irx, iry, -90, 90, 48).slice(1, -1),
    [cx, bottom - HW],
    [W, bottom - HW],
  ] as const;
  return { d: poly(cw(outer)) + poly(ccw(inner)), cx };
}

const GLYPHS: Record<string, () => { w: number; d: string }> = {
  P() {
    const w = 70;
    return { w, d: rect(0, 0, W, H) + bowl(w, 56).d };
  },
  R() {
    const w = 74;
    const b = bowl(w - 2, 54);
    const leg = slab(b.cx + 2, 54 - HW / 2, w - W * 0.62, H, W * 1.02);
    return { w, d: rect(0, 0, W, H) + b.d + leg };
  },
  A() {
    const w = 86;
    const apex = w / 2;
    const left = slab(apex, 0, W * 0.62, H, W * 1.02);
    const right = slab(apex, 0, w - W * 0.62, H, W * 1.02);
    const y = 66;
    const t = y / H;
    const xl = apex + (W * 0.62 - apex) * t;
    const xr = apex + (w - W * 0.62 - apex) * t;
    return { w, d: left + right + rect(xl, y, xr - xl, HW * 0.95) };
  },
  T() {
    const w = 74;
    return { w, d: rect(0, 0, w, HW) + rect((w - W) / 2, 0, W, H) };
  },
  Y() {
    const w = 82;
    const jy = 54;
    const c = w / 2;
    return {
      w,
      d:
        slab(W * 0.62, 0, c, jy, W * 1.02) +
        slab(w - W * 0.62, 0, c, jy, W * 1.02) +
        rect(c - W / 2, jy - 6, W, H - jy + 6),
    };
  },
  E() {
    const w = 62;
    return {
      w,
      d:
        rect(0, 0, W, H) +
        rect(0, 0, w, HW) +
        rect(0, (H - HW) / 2, w - 6, HW) +
        rect(0, H - HW, w, HW),
    };
  },
  L() {
    const w = 58;
    return { w, d: rect(0, 0, W, H) + rect(0, H - HW, w, HW) };
  },
};

/** An open pair takes less than the track, so the spaces read even. */
const KERN: Record<string, number> = {
  PA: -12,
  AR: -10,
  RT: -8,
  TY: -6,
  YR: -8,
};

const CAP_TOP = 14.22;
const BASELINE = 50.79;

export const NAMEPLATE = (() => {
  const set = setWord("PARTYREEL", GLYPHS, TRACK, KERN);
  const s = (BASELINE - CAP_TOP) / H;
  return { d: place(set.d, 0, CAP_TOP, s), w: set.w * s };
})();
