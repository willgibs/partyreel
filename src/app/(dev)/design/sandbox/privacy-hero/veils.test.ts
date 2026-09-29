import { describe, expect, it } from "vitest";

import { CANVAS, optionMeans } from "@/components/lab";
import { marketingImage } from "@/lib/constants/marketing-media";

import { PHOTO, PHOTO_ID, type PhotoId } from "./knobs";
import { PRIVACY_HERO } from "./spec";
import {
  BEAM,
  beamCycleMs,
  beamKeyframes,
  beamPhotos,
  beamShotDelayMs,
  beamSlotMs,
  CLEARANCE_PX,
  distanceToRect,
  DRIFT,
  GLIMPSE,
  glimpseCycleMs,
  HEADER_PX,
  LENS,
  lensKeyframes,
  lensPath,
  lockupRect,
  VEILS,
} from "./veils";

/**
 * ROUND FOUR'S WORDS AGAINST THE VEILS' OWN NUMBERS, and the one promise every
 * variation's geometry makes: nothing settles on the words. The discipline
 * round three's `concepts.test.ts` held for its four concepts, carried to the
 * veil's four.
 */

const MODES = ["desktop", "phone"] as const;
const ask = PRIVACY_HERO.asks[0];
const tile = (id: string) =>
  optionMeans(
    ask.options.find((o) => (typeof o === "string" ? o : o.id) === id)!,
  )!;

describe("the ask offers exactly the four veils", () => {
  it("its options are VEILS, in order", () => {
    expect(ask.options.map((o) => (typeof o === "string" ? o : o.id))).toEqual([
      ...VEILS,
    ]);
  });
});

describe("each option states its veil's own numbers", () => {
  it("the drift", () => {
    const t = tile("drift");
    expect(t).toContain(`${DRIFT.washPx.desktop}px disc`);
    expect(t).toContain(`blurred ${DRIFT.blurPx.desktop}px`);
    expect(t).toContain(`${Math.round(DRIFT.baseOpacity * 100)}%`);
    expect(t).toContain(`${DRIFT.windowPx.desktop}px window`);
    expect(t).toContain(`every ${DRIFT.cycleMs / 1000} seconds`);
  });

  it("the lens", () => {
    const t = tile("lens");
    expect(t).toContain(`${LENS.lensPx.desktop}px pane`);
    expect(t).toContain(`rests ${LENS.restMs / 1000} seconds`);
    // "each of its four places", in the cost line.
    const costs = ask.options.find(
      (o) => typeof o !== "string" && o.id === "lens",
    );
    expect(JSON.stringify(costs)).toContain(
      ["zero", "one", "two", "three", "four", "five", "six"][
        LENS.rests.desktop.length
      ],
    );
  });

  it("the beam", () => {
    const t = tile("beam");
    expect(t).toContain(`in ${BEAM.passMs / 1000} seconds`);
    expect(t).toContain(`${BEAM.count} photographs`);
  });

  it("the glimpses", () => {
    const t = tile("glimpse");
    const ds = GLIMPSE.spots.desktop.map((s) => s.d);
    expect(t).toContain(`${Math.min(...ds)} to ${Math.max(...ds)}px`);
    expect(t).toContain(`every ${GLIMPSE.stepMs / 1000} seconds`);
  });
});

describe("the drift is round three's veil, byte for byte", () => {
  it("keeps every number round three drew", () => {
    // Round three's `VEIL` (git show cdc979a6:"src/app/(dev)/design/sandbox/
    // privacy-hero/concepts.ts"): a retune here is a new veil, not the one
    // he picked.
    expect(DRIFT).toEqual({
      washPx: { desktop: 860, phone: 480 },
      blurPx: { desktop: 44, phone: 26 },
      baseOpacity: 0.55,
      windowPx: { desktop: 230, phone: 140 },
      cycleMs: 9000,
    });
  });
});

describe("nothing a variation settles on sits on the words", () => {
  it("every lens rest clears the lockup and sits whole on the canvas, under the header", () => {
    for (const mode of MODES) {
      const r = LENS.lensPx[mode] / 2;
      for (const p of LENS.rests[mode]) {
        const where = `${mode} rest at (${p.x}, ${p.y})`;
        expect(
          distanceToRect(p, lockupRect(mode)) - r,
          `${where} is too near the words`,
        ).toBeGreaterThanOrEqual(CLEARANCE_PX);
        expect(p.x - r, where).toBeGreaterThanOrEqual(0);
        expect(p.x + r, where).toBeLessThanOrEqual(CANVAS[mode].w);
        expect(p.y - r, where).toBeGreaterThanOrEqual(HEADER_PX);
        expect(p.y + r, where).toBeLessThanOrEqual(CANVAS[mode].h);
      }
    }
  });

  it("every glimpse clears the lockup and sits whole on the canvas, under the header", () => {
    for (const mode of MODES) {
      for (const s of GLIMPSE.spots[mode]) {
        const where = `${mode} spot at (${s.x}, ${s.y})`;
        expect(
          distanceToRect(s, lockupRect(mode)) - s.d / 2,
          `${where} is too near the words`,
        ).toBeGreaterThanOrEqual(CLEARANCE_PX);
        expect(s.x - s.d / 2, where).toBeGreaterThanOrEqual(0);
        expect(s.x + s.d / 2, where).toBeLessThanOrEqual(CANVAS[mode].w);
        expect(s.y - s.d / 2, where).toBeGreaterThanOrEqual(HEADER_PX);
        expect(s.y + s.d / 2, where).toBeLessThanOrEqual(CANVAS[mode].h);
      }
    }
  });

  it("consecutive glimpses open on opposite sides of the words", () => {
    // Two spots are open at once only while one closes and the next opens,
    // so each pair must stand across the lockup's middle from each other.
    for (const mode of MODES) {
      const spots = GLIMPSE.spots[mode];
      const cx = CANVAS[mode].w / 2;
      const rect = lockupRect(mode);
      const cy = (rect.y0 + rect.y1) / 2;
      spots.forEach((a, i) => {
        const b = spots[(i + 1) % spots.length];
        const across =
          Math.sign(a.x - cx) !== Math.sign(b.x - cx) ||
          Math.sign(a.y - cy) !== Math.sign(b.y - cy);
        expect(across, `${mode} spots ${i} and ${i + 1}`).toBe(true);
      });
    }
  });
});

describe("the lens's clock", () => {
  it("is its rests plus its glides, each glide at one speed with a floor", () => {
    for (const mode of MODES) {
      const { stops, cycleMs, glidesMs } = lensPath(mode);
      const rests = LENS.rests[mode];
      expect(cycleMs).toBe(
        rests.length * LENS.restMs + glidesMs.reduce((s, g) => s + g, 0),
      );
      rests.forEach((a, i) => {
        const b = rests[(i + 1) % rests.length];
        const ms =
          (Math.hypot(b.x - a.x, b.y - a.y) / LENS.pxPerS[mode]) * 1000;
        expect(glidesMs[i]).toBeGreaterThanOrEqual(LENS.minGlideMs);
        expect(
          Math.abs(glidesMs[i] - Math.max(ms, LENS.minGlideMs)),
        ).toBeLessThanOrEqual(5);
      });
      // Monotonic, closed on the first rest.
      for (let i = 1; i < stops.length; i++)
        expect(stops[i].at).toBeGreaterThanOrEqual(stops[i - 1].at);
      expect(stops[0]).toMatchObject({ at: 0, ...rests[0] });
      expect(stops.at(-1)).toMatchObject({ at: 1, ...rests[0] });
    }
  });

  it("moves the view exactly against the pane, so the clearing shows what is behind it", () => {
    for (const mode of MODES) {
      const css = lensKeyframes(mode, "k");
      const pane = /@keyframes k\{(.*?)\}@keyframes/.exec(css)![1];
      const view = /@keyframes k-view\{(.*)\}$/.exec(css)![1];
      const moves = (block: string) =>
        [...block.matchAll(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/g)].map(
          (m) => [Number(m[1]), Number(m[2])],
        );
      const a = moves(pane);
      const b = moves(view);
      expect(a.length).toBe(lensPath(mode).stops.length);
      a.forEach(([x, y], i) => {
        expect(b[i][0]).toBe(-x);
        expect(b[i][1]).toBe(-y);
      });
    }
  });
});

describe("the beam's clocks", () => {
  it("crosses once per photograph, the whole succession one cycle", () => {
    expect(beamSlotMs()).toBe(BEAM.passMs + BEAM.beatMs);
    expect(beamCycleMs()).toBe(BEAM.count * beamSlotMs());
  });

  it("has exactly one photograph fully in at the start of every crossing", () => {
    // A shot's opacity at a time, read off the keyframes it runs.
    const css = beamKeyframes("desktop", "k");
    const shot = /@keyframes k-shot\{(.*)\}$/.exec(css)![1];
    const frames = [...shot.matchAll(/([\d.]+)%\{opacity:([\d.]+)\}/g)].map(
      (m) => [Number(m[1]) / 100, Number(m[2])] as const,
    );
    const opacityAt = (p: number) => {
      for (let i = 1; i < frames.length; i++) {
        const [p0, o0] = frames[i - 1];
        const [p1, o1] = frames[i];
        if (p <= p1) return o0 + ((o1 - o0) * (p - p0)) / (p1 - p0 || 1);
      }
      return frames.at(-1)![1];
    };
    const cycle = beamCycleMs();
    for (let turn = 0; turn < BEAM.count; turn++) {
      for (const into of [0, BEAM.passMs / 2, BEAM.passMs]) {
        const t = turn * beamSlotMs() + into;
        const seen = Array.from({ length: BEAM.count }, (_, i) => {
          const p = (((t - beamShotDelayMs(i)) % cycle) + cycle) % cycle;
          return opacityAt(p / cycle);
        });
        // Only this turn's photograph, and fully (to the keyframes' own
        // rounding, a thousandth of a percent): the dissolve lives in the
        // beat, never under a crossing.
        expect(seen[turn]).toBeCloseTo(1, 3);
        seen.forEach((o, i) => {
          if (i !== turn) expect(o).toBeCloseTo(0, 3);
        });
      }
    }
  });

  it("opens on the knob's photograph and never repeats one", () => {
    for (const id of Object.values(PHOTO_ID)) {
      const photos = beamPhotos(id);
      expect(photos[0]).toBe(id);
      expect(new Set(photos).size).toBe(BEAM.count);
      for (const p of photos) expect(() => marketingImage(p)).not.toThrow();
    }
  });
});

describe("the glimpses' clock", () => {
  it("never has more than two spots open at once", () => {
    const life = GLIMPSE.openMs + GLIMPSE.holdMs + GLIMPSE.closeMs;
    expect(life).toBeLessThanOrEqual(2 * GLIMPSE.stepMs);
    for (const mode of MODES)
      expect(glimpseCycleMs(mode)).toBe(
        GLIMPSE.spots[mode].length * GLIMPSE.stepMs,
      );
  });
});

describe("the photograph knob", () => {
  it("offers a still the manifest holds for every option, defaulting to the toast", () => {
    expect(PHOTO.default).toBe("toast");
    for (const o of PHOTO.options)
      expect(() => marketingImage(PHOTO_ID[o.id as PhotoId])).not.toThrow();
    expect(PHOTO_ID.crowd).toBe("festival-crowd");
  });
});
