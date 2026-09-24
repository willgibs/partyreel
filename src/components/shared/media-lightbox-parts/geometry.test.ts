import { describe, expect, it } from "vitest";

import {
  CHROME,
  ZOOM_MAX,
  ZOOM_REST,
  coverFrame,
  dismissCommits,
  dismissPose,
  fitRect,
  mediaBox,
  onScreen,
  panBounds,
  peekMetrics,
  pinchZoom,
  restShift,
  rubber,
  seenFrame,
  settleZoom,
  slotShift,
  strideFor,
  zoomAbout,
  type Rect,
} from "./geometry";

/**
 * The viewer's arithmetic, held to what Will SEES rather than to formulas: a
 * sliver of each neighbour at the edge at rest, the photograph under the finger
 * following it one to one, nothing jumping at the swap after a commit, a pinch
 * that keeps the point under the fingers where it is, and a flight that starts
 * exactly on the tile's crop.
 */

const PHONE = { width: 375, height: 812 };
const DESK = { width: 1440, height: 900 };

/** Screen x of a slot's media left edge for a track offset (the track keeps three full-width cells). */
function leftEdge(
  slot: -1 | 0 | 1,
  offset: number,
  W: number,
  fit: Rect,
  shift: number,
) {
  return slot * W + offset + fit.left + shift;
}

function boxAt(stage: typeof PHONE) {
  const { peek, gap } = peekMetrics(stage.width);
  return {
    peek,
    box: mediaBox(stage, {
      top: CHROME.top,
      bottom: CHROME.bottom,
      side: peek + gap,
    }),
  };
}

describe("the neighbours' sliver", () => {
  it("is 28 px in a hand and 96 at a desk, holding past both", () => {
    expect(peekMetrics(375)).toEqual({ peek: 28, gap: 8 });
    expect(peekMetrics(1440)).toEqual({ peek: 96, gap: 64 });
    expect(peekMetrics(320)).toEqual({ peek: 28, gap: 8 });
    expect(peekMetrics(2560)).toEqual({ peek: 96, gap: 64 });
    const mid = peekMetrics(900);
    expect(mid.peek).toBeGreaterThan(28);
    expect(mid.peek).toBeLessThan(96);
  });

  it("shows exactly `peek` px of each neighbour's own edge at rest, whatever its shape", () => {
    for (const stage of [PHONE, DESK]) {
      const { peek, box } = boxAt(stage);
      const W = stage.width;
      const portrait = fitRect({ width: 3000, height: 4000 }, box)!;
      const landscape = fitRect({ width: 4000, height: 3000 }, box)!;
      const widths = {
        prev: portrait.width,
        current: landscape.width,
        next: landscape.width,
      };
      const prevShift = slotShift(-1, 0, W, peek, widths);
      const nextShift = slotShift(1, 0, W, peek, widths);
      const prevRight =
        leftEdge(-1, 0, W, portrait, prevShift) + portrait.width;
      const nextLeft = leftEdge(1, 0, W, landscape, nextShift);
      expect(prevRight).toBeCloseTo(peek, 6);
      expect(nextLeft).toBeCloseTo(W - peek, 6);
    }
  });

  it("never lets a sliver reach the photograph between them", () => {
    const { peek, box } = boxAt(PHONE);
    const fit = fitRect({ width: 3000, height: 4000 }, box)!;
    const w = { prev: fit.width, current: fit.width, next: fit.width };
    const prevRight =
      leftEdge(
        -1,
        0,
        PHONE.width,
        fit,
        slotShift(-1, 0, PHONE.width, peek, w),
      ) + fit.width;
    expect(leftEdge(0, 0, PHONE.width, fit, 0)).toBeGreaterThan(prevRight);
  });
});

describe("a swipe", () => {
  const { peek, box } = boxAt(PHONE);
  const W = PHONE.width;
  const a = fitRect({ width: 3000, height: 4000 }, box)!; // current, a portrait
  const b = fitRect({ width: 4000, height: 3000 }, box)!; // previous, a landscape

  it("carries the photograph under the finger one to one (it never stands off)", () => {
    const w = { prev: b.width, current: a.width, next: a.width };
    for (const offset of [-120, -10, 0, 40, 200]) {
      expect(slotShift(0, offset, W, peek, w)).toBe(0);
      expect(leftEdge(0, offset, W, a, 0) - leftEdge(0, 0, W, a, 0)).toBe(
        offset,
      );
    }
  });

  it("centres the neighbour exactly when the track has moved one stride", () => {
    const w = { prev: b.width, current: a.width, next: a.width };
    const stride = strideFor(W, a.width, peek);
    const prevLeft = leftEdge(
      -1,
      stride,
      W,
      b,
      slotShift(-1, stride, W, peek, w),
    );
    expect(prevLeft).toBeCloseTo(b.left, 6);
  });

  it("moves nothing at the swap: the old current rests where the commit left it", () => {
    const stride = strideFor(W, a.width, peek);
    // At the end of the commit toward the previous one, the old current is here...
    const endOfCommit = leftEdge(0, stride, W, a, 0);
    // ...and after the swap it is the NEXT neighbour of the new current (b), at rest.
    const asNext = leftEdge(
      1,
      0,
      W,
      a,
      slotShift(1, 0, W, peek, { prev: null, current: b.width, next: a.width }),
    );
    expect(asNext).toBeCloseTo(endOfCommit, 6);
  });

  it("keeps an even gap between photographs of one shape all the way across", () => {
    const w = { prev: a.width, current: a.width, next: a.width };
    const gapAt = (offset: number) =>
      leftEdge(0, offset, W, a, 0) -
      (leftEdge(-1, offset, W, a, slotShift(-1, offset, W, peek, w)) + a.width);
    const g0 = gapAt(0);
    expect(gapAt(40)).toBeCloseTo(g0, 6);
    expect(gapAt(strideFor(W, a.width, peek) * 0.7)).toBeCloseTo(g0, 6);
  });

  it("is today's full-width swipe when a size is unknown", () => {
    expect(strideFor(W, null, peek)).toBe(W);
    expect(restShift(W, null, peek)).toBe(0);
    const w = { prev: null, current: null, next: null };
    expect(slotShift(-1, 120, W, peek, w)).toBe(0);
    expect(slotShift(1, -120, W, peek, w)).toBe(0);
  });
});

describe("fit", () => {
  it("contains, centres, and never enlarges past the file's own pixels", () => {
    const box = { left: 36, top: 64, width: 303, height: 680 };
    const big = fitRect({ width: 3000, height: 4000 }, box)!;
    expect(big.width).toBeCloseTo(303, 6);
    expect(big.height).toBeCloseTo(404, 6);
    expect(big.top).toBeCloseTo(64 + (680 - 404) / 2, 6);
    const small = fitRect({ width: 200, height: 100 }, box)!;
    expect(small).toEqual({
      left: 36 + 51.5,
      top: 64 + 290,
      width: 200,
      height: 100,
    });
    expect(fitRect(null, box)).toBeNull();
    expect(fitRect({ width: 0, height: 10 }, box)).toBeNull();
  });
});

describe("the flights", () => {
  const fit: Rect = { left: 36, top: 200, width: 303, height: 404 };
  const tile: Rect = { left: 20, top: 500, width: 160, height: 160 };

  function parse(frame: { transform: string; clipPath: string }) {
    const [dx, dy, s] = frame.transform
      .match(/-?[\d.]+(?:e-?\d+)?/g)!
      .map(Number);
    const [iy, ix, r] = frame.clipPath
      .match(/-?[\d.]+(?:e-?\d+)?/g)!
      .map(Number);
    return { dx, dy, s, iy, ix, r };
  }

  it("starts on the tile's crop: the visible box is the tile, and the picture covers it", () => {
    const f = parse(coverFrame(fit, tile, 4));
    // The scaled picture covers the tile on both axes (object-cover)...
    expect(fit.width * f.s).toBeGreaterThanOrEqual(tile.width - 1e-6);
    expect(fit.height * f.s).toBeGreaterThanOrEqual(tile.height - 1e-6);
    // ...the clip leaves exactly the tile's box, centred on the tile...
    expect((fit.width - 2 * f.ix) * f.s).toBeCloseTo(tile.width, 6);
    expect((fit.height - 2 * f.iy) * f.s).toBeCloseTo(tile.height, 6);
    expect(fit.left + fit.width / 2 + f.dx).toBeCloseTo(
      tile.left + tile.width / 2,
      6,
    );
    expect(fit.top + fit.height / 2 + f.dy).toBeCloseTo(
      tile.top + tile.height / 2,
      6,
    );
    // ...with the tile's own corner on screen.
    expect(f.r * f.s).toBeCloseTo(4, 6);
  });

  it("holds a dragged or pinched photograph where it is seen", () => {
    const seen: Rect = { left: 60, top: 300, width: 242.4, height: 323.2 };
    const f = parse(seenFrame(fit, seen, 4));
    expect(f.s).toBeCloseTo(0.8, 6);
    expect(fit.left + fit.width / 2 + f.dx).toBeCloseTo(
      seen.left + seen.width / 2,
      6,
    );
    expect(f.ix).toBe(0);
  });

  it("knows a tile scrolled off the screen is no destination", () => {
    expect(onScreen(tile, PHONE)).toBe(true);
    expect(onScreen({ ...tile, top: -400 }, PHONE)).toBe(false);
    expect(onScreen({ ...tile, top: 900 }, PHONE)).toBe(false);
  });
});

describe("the close-up", () => {
  const fit: Rect = { left: 36, top: 204, width: 303, height: 404 };
  const center = { x: fit.left + fit.width / 2, y: fit.top + fit.height / 2 };
  const map = (
    z: { s: number; tx: number; ty: number },
    p: { x: number; y: number },
  ) => ({
    x: center.x + z.tx + z.s * (p.x - center.x),
    y: center.y + z.ty + z.s * (p.y - center.y),
  });

  it("keeps the point under the fingers under the fingers", () => {
    const mid = { x: 250, y: 300 };
    const z = pinchZoom({ ...ZOOM_REST, mid, dist: 100 }, mid, 200, center);
    expect(z.s).toBeCloseTo(2, 6);
    const under = map(z, mid);
    expect(under.x).toBeCloseTo(mid.x, 6);
    expect(under.y).toBeCloseTo(mid.y, 6);
  });

  it("pans with the midpoint while it scales", () => {
    const start = { ...ZOOM_REST, mid: { x: 200, y: 400 }, dist: 100 };
    const z = pinchZoom(start, { x: 230, y: 380 }, 150, center);
    const moved = map(z, start.mid);
    expect(moved.x).toBeCloseTo(230, 6);
    expect(moved.y).toBeCloseTo(380, 6);
  });

  it("lets go under fit back to fit, and past three back to three around the same point", () => {
    expect(settleZoom({ s: 0.8, tx: 12, ty: -40 }, fit, PHONE, center)).toEqual(
      ZOOM_REST,
    );
    const anchor = { x: 200, y: 420 };
    const over = zoomAbout(ZOOM_REST, 3.4, anchor, anchor, center);
    const back = settleZoom(over, fit, PHONE, anchor);
    expect(back.s).toBe(ZOOM_MAX);
    const b = panBounds(fit, back.s, PHONE);
    expect(back.tx).toBeGreaterThanOrEqual(b.x.min);
    expect(back.tx).toBeLessThanOrEqual(b.x.max);
  });

  it("never pans an edge inside the stage, and pins an axis that fits", () => {
    const b = panBounds(fit, 2, PHONE);
    const w = fit.width * 2;
    // At the right-most pan the left edge sits exactly on the stage's left edge.
    expect(center.x + b.x.max - w / 2).toBeCloseTo(0, 6);
    expect(center.x + b.x.min + w / 2).toBeCloseTo(PHONE.width, 6);
    // 404 * 2 = 808 < 812: the height still fits, so it stays on its centre.
    expect(b.y).toEqual({ min: 0, max: 0 });
    // A pull past the edge resists instead of stopping dead.
    const pulled = rubber(b.x.max + 100, b.x, 60);
    expect(pulled).toBeGreaterThan(b.x.max);
    expect(pulled).toBeLessThan(b.x.max + 100);
  });
});

describe("the way out", () => {
  it("follows a pull down, shrinking a little, while the ground thins", () => {
    const rest = dismissPose(0, 812);
    expect(rest).toEqual({ y: 0, scale: 1, ground: 1 });
    const pulled = dismissPose(200, 812);
    expect(pulled.y).toBe(200);
    expect(pulled.scale).toBeLessThan(1);
    expect(pulled.ground).toBeLessThan(1);
    expect(pulled.ground).toBeGreaterThan(0);
  });

  it("resists a pull up and changes nothing else", () => {
    const up = dismissPose(-200, 812);
    expect(up.y).toBeLessThan(0);
    expect(up.y).toBeGreaterThan(-200);
    expect(up.scale).toBe(1);
    expect(up.ground).toBe(1);
  });

  it("leaves on distance or on a flick, never on a nudge or a pull up", () => {
    expect(dismissCommits(140, 0.1, 812)).toBe(true);
    expect(dismissCommits(40, 0.6, 812)).toBe(true);
    expect(dismissCommits(40, 0.1, 812)).toBe(false);
    expect(dismissCommits(10, 2, 812)).toBe(false);
    expect(dismissCommits(-300, 3, 812)).toBe(false);
  });
});
