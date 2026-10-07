import { describe, expect, it } from "vitest";

import {
  chromaOf,
  edgeBand,
  edgeHues,
  fillGreys,
  HOUSE_LIGHT,
  intensityOf,
  SEGMENTS,
  threeAtMost,
  type Thumb,
  unOlive,
  visibleCrop,
} from "./event-hub-head-edge";

/**
 * THE SEAM'S COLOURS (event-header r6, the Seam made Afterglow's): which edge is read, how a sixth with no colour of its own
 * is filled, how many hues a light may have, and how strong it may be. How the light looks is the browser's and the walk's;
 * what is held here is every rule that decides its colours, read off pixels made to say one thing each.
 */

type Rgb = readonly [number, number, number];
const RED: Rgb = [220, 30, 30];
const BLUE: Rgb = [30, 60, 220];
const GREEN: Rgb = [40, 180, 60];
const GREY: Rgb = [128, 128, 128];

/** A photograph painted by a function of its own pixel. */
function thumb(
  w: number,
  h: number,
  paint: (x: number, y: number) => Rgb,
): Thumb {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * w + x) * 4;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = 255;
    }
  return { w, h, px };
}

/** A hue's distance round the wheel. */
const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

describe("the crop the eye sees", () => {
  it("is the middle band of a landscape photograph at a desk's wide cover", () => {
    // 1600x1200 behind a 1440x400 cover: scaled to the width, 444px of its height show, centred.
    const crop = visibleCrop(1600, 1200, 1440, 400);
    expect(crop.vw).toBeCloseTo(1600);
    expect(crop.vh).toBeCloseTo(444.44, 1);
    expect(crop.y0).toBeCloseTo((1200 - 444.44) / 2, 1);
    expect(crop.x0).toBeCloseTo(0);
  });

  it("is the whole height and a centred width in a hand's taller cover", () => {
    const crop = visibleCrop(1600, 1200, 375, 328);
    expect(crop.vh).toBeCloseTo(1200);
    expect(crop.y0).toBeCloseTo(0);
    expect(crop.vw).toBeCloseTo(375 / (328 / 1200), 1);
    expect(crop.x0).toBeCloseTo((1600 - crop.vw) / 2, 1);
  });
});

describe("the edge's six hues", () => {
  it("reads the bottom of what shows, sixth by sixth, left to right", () => {
    // A photograph whose last rows are red on the left half and blue on the right.
    const t = thumb(120, 90, (x, y) => (y > 84 ? (x < 60 ? RED : BLUE) : GREY));
    const hues = edgeHues(t, 120, 90)!;
    expect(hues).toHaveLength(SEGMENTS);
    const [red] = edgeHues(
      thumb(6, 6, () => RED),
      6,
      6,
    )!;
    const [blue] = edgeHues(
      thumb(6, 6, () => BLUE),
      6,
      6,
    )!;
    hues.slice(0, 3).forEach((h) => expect(gap(h, red)).toBeLessThan(15));
    hues.slice(3).forEach((h) => expect(gap(h, blue)).toBeLessThan(15));
  });

  it("★ reads the edge at the cover's own size: a wide cover's foot is the photograph's middle, a hand's its bottom", () => {
    // Green just above the middle's foot, red along the true bottom.
    const t = thumb(160, 120, (_x, y) =>
      y >= 116 ? RED : y >= 76 && y < 86 ? GREEN : GREY,
    );
    // A 3.6:1 desk cover shows rows ~38 to ~82 of it, so its foot is the green band.
    const desk = edgeHues(t, 1440, 400)!;
    const [green] = edgeHues(
      thumb(6, 6, () => GREEN),
      6,
      6,
    )!;
    desk.forEach((h) => expect(gap(h, green)).toBeLessThan(15));
    // A hand's cover shows the whole height, so its foot is the photograph's own bottom, red.
    const hand = edgeHues(t, 375, 328)!;
    const [red] = edgeHues(
      thumb(6, 6, () => RED),
      6,
      6,
    )!;
    hand.forEach((h) => expect(gap(h, red)).toBeLessThan(15));
  });

  it("borrows the photograph's own key for an edge with no colour of its own", () => {
    // A grey foot under a blue photograph: the light is the photograph's blue, never a hue read off a grey.
    const t = thumb(60, 60, (_x, y) => (y > 50 ? GREY : BLUE));
    const hues = edgeHues(t, 60, 60)!;
    const [blue] = edgeHues(
      thumb(6, 6, () => BLUE),
      6,
      6,
    )!;
    hues.forEach((h) => expect(gap(h, blue)).toBeLessThan(15));
  });

  it("has nothing to give where the photograph has no colour at all", () => {
    expect(
      edgeHues(
        thumb(40, 30, () => GREY),
        40,
        30,
      ),
    ).toBeNull();
  });

  it("reads nothing off an empty box or an empty picture", () => {
    expect(
      edgeHues(
        thumb(10, 10, () => RED),
        0,
        400,
      ),
    ).toBeNull();
    expect(
      edgeHues({ w: 0, h: 0, px: new Uint8ClampedArray() }, 100, 100),
    ).toBeNull();
  });
});

describe("a sixth with no colour of its own", () => {
  it("borrows its nearest coloured neighbour, the left one first", () => {
    expect(fillGreys([null, 30, null, null, 200, null], 100)).toEqual([
      30, 30, 30, 200, 200, 200,
    ]);
  });

  it("takes the photograph's key where no sixth has a colour", () => {
    expect(fillGreys([null, null, null], 120)).toEqual([120, 120, 120]);
  });

  it("gives nothing where neither the edge nor the photograph has one", () => {
    expect(fillGreys([null, null], null)).toBeNull();
  });
});

describe("at most three hues to a light (brand r2: a fourth is the rainbow creeping back in)", () => {
  it("keeps the three largest families and gives every sixth its nearest", () => {
    const out = threeAtMost([10, 20, 100, 200, 300, 15]);
    expect(new Set(out).size).toBeLessThanOrEqual(3);
    // The reds gathered into one family, in place.
    expect(out[0]).toBe(out[1]);
    expect(out[0]).toBe(out[5]);
    expect(gap(out[0], 15)).toBeLessThan(10);
  });

  it("leaves a light of three or fewer hues as it is", () => {
    expect(threeAtMost([30, 30, 200, 200, 300, 300])).toEqual([
      30, 30, 200, 200, 300, 300,
    ]);
  });
});

describe("how strong a photograph's light is", () => {
  it("reads a grey photograph's midtones as no intensity, and a saturated one's as its own", () => {
    expect(intensityOf(thumb(8, 8, () => GREY).px)).toBeCloseTo(0, 2);
    expect(intensityOf(thumb(8, 8, () => RED).px)).toBeGreaterThan(0.15);
  });

  it("★ is never louder than its photograph, inside the room's range", () => {
    expect(chromaOf(0)).toBe(0.07);
    expect(chromaOf(0.1)).toBeCloseTo(0.115);
    expect(chromaOf(0.3)).toBe(0.15);
  });
});

describe("the light drawn in the edge's colours", () => {
  it("is a band left to right, each sixth's tone at the centre of its share", () => {
    const band = edgeBand(
      { hues: [30, 30, 30, 260, 260, 260], c: 0.12 },
      "glow",
    );
    expect(band.startsWith("linear-gradient(in oklab 90deg, ")).toBe(true);
    const stops = band.match(/oklch\([^)]*\) [\d.]+%/g) ?? [];
    expect(stops).toHaveLength(6);
    expect(stops[0]).toMatch(/ 8\.3%$/);
    expect(stops[5]).toMatch(/ 91\.7%$/);
  });

  it("★ never goes olive: the band the eye reads as mud goes to the clean light it nearly was", () => {
    expect(unOlive(100)).toBe(80);
    expect(unOlive(120)).toBe(138);
    expect(unOlive(60)).toBe(60);
    expect(unOlive(200)).toBe(200);
  });

  it("is the house's dusk, amber to coral, where the cover has no photograph to give one", () => {
    expect(HOUSE_LIGHT.hues).toHaveLength(SEGMENTS);
    HOUSE_LIGHT.hues.forEach((h) => expect(h).toBeGreaterThanOrEqual(20));
    HOUSE_LIGHT.hues.forEach((h) => expect(h).toBeLessThanOrEqual(85));
  });
});
