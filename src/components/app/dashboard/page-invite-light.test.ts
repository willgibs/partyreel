import { describe, expect, it } from "vitest";

import { HOUSE_LIGHT } from "@/components/app/event-feed/event-hub-head-edge";
import { orbFor } from "@/lib/avatar/gradient";
import { srgbToOklch } from "@/lib/shared/sampled-palette";

import {
  bodyBand,
  deepen,
  familiesOf,
  houseLit,
  lightOf,
  litFrom,
  single,
} from "./page-invite-light";

/**
 * THE LIGHT OF HER PAGE'S INVITATION (`account-moments` r2, `invite=plate`): read from her own photographs, as the board's
 * plate read it. Pinned, on pixels (no canvas): the families she photographed are found by colour and weighed; the light is
 * a key and at most one answer a quarter turn from it, in her photographs' proportion; a warm body falls away from yellow
 * and a cool one keeps its hue; and the ladder (photographs, then her seed, then the house) never fails.
 */

type Rgb = [number, number, number];
const AMBER: Rgb = [217, 119, 6];
const ORANGE: Rgb = [234, 88, 12];
const BLUE: Rgb = [37, 99, 235];
const GREEN: Rgb = [22, 163, 74];
const ROSE: Rgb = [225, 29, 72];
const GREY: Rgb = [128, 128, 128];
const WHITE: Rgb = [250, 250, 250];
const BLACK: Rgb = [10, 10, 10];

/** A strip of opaque pixels: each run is a colour and how many pixels of it. */
function strip(...runs: [Rgb, number][]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(runs.reduce((n, [, c]) => n + c, 0) * 4);
  let i = 0;
  for (const [[r, g, b], count] of runs)
    for (let k = 0; k < count; k++) {
      out.set([r, g, b, 255], i);
      i += 4;
    }
  return out;
}

const hueOf = ([r, g, b]: Rgb) => srgbToOklch(r, g, b).h;
const near = (a: number, b: number, within = 2) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b)) <= within;

describe("her colour families", () => {
  it("finds what she photographed by its colour, heaviest first", () => {
    const families = familiesOf(strip([AMBER, 100], [BLUE, 40]));
    expect(families).toHaveLength(2);
    expect(near(families[0]!.hue, hueOf(AMBER), 8)).toBe(true);
    expect(near(families[1]!.hue, hueOf(BLUE), 8)).toBe(true);
    expect(families[0]!.weight).toBeGreaterThan(families[1]!.weight);
  });

  it("★ reads a colour's neighbours as one family, never an average of two", () => {
    // Amber and orange are 17 degrees apart: one colour she photographed.
    const families = familiesOf(strip([AMBER, 60], [ORANGE, 60]));
    expect(families).toHaveLength(1);
    expect(near(families[0]!.hue, 50, 12)).toBe(true);
  });

  it("★ hears no hue from a grey, a black, a white or a transparent pixel", () => {
    expect(familiesOf(strip([GREY, 50], [WHITE, 50], [BLACK, 50]))).toEqual([]);
    const clear = strip([AMBER, 10]);
    for (let i = 3; i < clear.length; i += 4) clear[i] = 0;
    expect(familiesOf(clear)).toEqual([]);
  });
});

describe("the light from her families", () => {
  it("is the key alone along the whole edge when she photographed one colour", () => {
    const lit = lightOf(familiesOf(strip([AMBER, 100])), 0.12)!;
    expect(lit.from).toBe("photographs");
    expect(new Set(lit.edge.hues).size).toBe(1);
    expect(lit.edge.hues).toHaveLength(6);
    expect(lit.fill).toBe(1);
  });

  it("★ is a key and its answer: the key's four sixths from the left, the answer's last two, the answer softer than its key", () => {
    const lit = lightOf(familiesOf(strip([AMBER, 100], [BLUE, 40])), 0.12)!;
    const [k1, k2, k3, k4, a1, a2] = lit.edge.hues;
    expect(near(k1, hueOf(AMBER), 8)).toBe(true);
    expect([k2, k3, k4]).toEqual([k1, k1, k1]);
    expect(near(a1, hueOf(BLUE), 8)).toBe(true);
    expect(a2).toBe(a1);
    // Half strength, and the rest only as her photographs carry it; never as bright as its key.
    expect(lit.fill).toBeGreaterThan(0.5);
    expect(lit.fill).toBeLessThanOrEqual(0.85);
    expect(lit.fall).toHaveLength(6);
  });

  it("★ gives a hue she barely photographed no light of its own", () => {
    // Five blue pixels in a hundred and five: about six percent of her light.
    const lit = lightOf(familiesOf(strip([AMBER, 100], [BLUE, 5])), 0.12)!;
    expect(new Set(lit.edge.hues).size).toBe(1);
  });

  it("★ takes an answer only a quarter turn or more from the key: a near neighbour is no second light", () => {
    // Rose stands about 40 degrees from amber: its own family, but not an answer.
    const lit = lightOf(familiesOf(strip([AMBER, 100], [ROSE, 80])), 0.12)!;
    expect(new Set(lit.edge.hues).size).toBe(1);
    // Green stands 91 degrees off: a quarter turn, an answer.
    const green = lightOf(familiesOf(strip([AMBER, 100], [GREEN, 80])), 0.12)!;
    expect(new Set(green.edge.hues).size).toBe(2);
  });

  it("is nothing for a roll with no colour", () => {
    expect(lightOf([], 0.12)).toBeNull();
  });
});

describe("the body falls away from yellow", () => {
  it("★ deepens a warm hue toward its deeper neighbour, as far as it is yellow", () => {
    // Amber (58) sits below yellow (95): it falls toward red; a yellow-green above falls toward green.
    expect(deepen(95)).toBeCloseTo(95 + 20, 5);
    expect(deepen(58)).toBeLessThan(58);
    expect(deepen(58)).toBeGreaterThan(58 - 20);
  });

  it("keeps a cool hue's own colour: a dim blue is still blue", () => {
    expect(deepen(263)).toBeCloseTo(263, 5);
    expect(deepen(200)).toBeCloseTo(200, 5);
  });

  it("is a band of one stop a sixth, in oklab, left to right", () => {
    const band = bodyBand([58, 58, 58, 58, 263, 263], 0.12);
    expect(band.startsWith("linear-gradient(in oklab 90deg, ")).toBe(true);
    const stops = band.match(/\d+(\.\d+)?%/g)!;
    expect(stops).toEqual([
      "8.3%",
      "25.0%",
      "41.7%",
      "58.3%",
      "75.0%",
      "91.7%",
    ]);
  });
});

describe("Afterglow's ladder, which never fails", () => {
  it("★ is her photographs' light when there is colour in them", () => {
    const lit = litFrom(strip([AMBER, 100], [BLUE, 40]), "seed");
    expect(lit.from).toBe("photographs");
  });

  it("★ falls to her seed's own hue when the photographs hold no colour, or none could be read", () => {
    const seed = "a-seed";
    for (const px of [null, strip([GREY, 40], [WHITE, 40])]) {
      const lit = litFrom(px, seed);
      expect(lit.from).toBe("seed");
      expect(lit.edge.hues).toEqual(Array(6).fill(orbFor(seed).hue));
      expect(lit.fill).toBe(1);
    }
  });

  it("★ falls to the house ember when there is no seed either", () => {
    const lit = litFrom(null, "");
    expect(lit.from).toBe("house");
    expect(lit.edge).toBe(HOUSE_LIGHT);
    expect(lit).toEqual(houseLit());
    expect(lit.fall).toHaveLength(HOUSE_LIGHT.hues.length);
  });

  it("is one hue alone, at the room's full strength, when a single light is asked for", () => {
    const lit = single(120, 0.15, "seed");
    expect(lit.edge).toEqual({ hues: Array(6).fill(120), c: 0.15 });
    expect(lit.fall).toEqual(Array(6).fill(deepen(120)));
  });
});
