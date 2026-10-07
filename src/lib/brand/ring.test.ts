import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrast } from "@/lib/avatar/gradient";

import {
  EMBER,
  EMBER_LAMPS,
  RING_MONO,
  RING_TILE,
  ringArt,
  ringCutFor,
  ringMarkup,
  ringMonoSvg,
} from "./ring";

/**
 * WHAT THE RING OWES EVERY PLACE AN ICON LIVES (brand-marks r1,
 * `icon=ember`): the ember's key at the top-left, a whole ring at every size
 * (never a moon), each size its own cut, inside any launcher's mask, and an
 * inline copy that never borrows another's ids.
 */

/** A hex colour as the luminance maths reads it. */
const lchOf = (hexColour: string) => {
  const n = parseInt(hexColour.slice(1), 16);
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [lin(n >> 16), lin((n >> 8) & 255), lin(n & 255)];
  // Linear sRGB to OKLab, for `contrast`'s OKLCH input.
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: L,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
};

describe("the Ring's cuts", () => {
  it("cuts by where a size really lives: a tab, a favicon, a home screen, the master", () => {
    expect(ringCutFor(16).id).toBe("tab");
    expect(ringCutFor(20).id).toBe("tab");
    expect(ringCutFor(32).id).toBe("favicon");
    expect(ringCutFor(40).id).toBe("favicon");
    expect(ringCutFor(60).id).toBe("home");
    expect(ringCutFor(180).id).toBe("home");
    expect(ringCutFor(1024).id).toBe("master");
    // No blur at a tab's size: it thickens the lit side into a crescent.
    expect(ringCutFor(16).glow).toBe(0);
    expect(ringArt(16).glow).toHaveLength(0);
    expect(ringArt(16).corona).toHaveLength(0);
  });

  it("is a whole ring at every size, never a moon: the far side stays an ember, never the tile", () => {
    // ★ The far side is never spent to nothing: a ring lit on one side and
    // dark on the other is, at a tab's size, the crescent every dark-mode
    // switch draws. So at a tab's and a favicon's size the far side stays lit
    // off the tile, more the smaller the icon, and at every size it keeps an
    // ember's chroma (a deep red, never a brown smudge, never the tile's grey).
    const tile = lchOf(RING_TILE[0]);
    const far = (size: number) => {
      const band = ringArt(size).band.map((w) => lchOf(w.fill));
      const darkest = band.reduce((a, b) => (b.l < a.l ? b : a));
      return { contrast: contrast(darkest, tile), chroma: darkest.c };
    };
    expect(far(16).contrast).toBeGreaterThan(1.7);
    expect(far(32).contrast).toBeGreaterThan(1.5);
    expect(far(16).contrast).toBeGreaterThan(far(32).contrast);
    expect(far(32).contrast).toBeGreaterThan(far(180).contrast);
    for (const size of [16, 32, 180, 1024])
      expect(far(size).chroma, `${size}`).toBeGreaterThan(0.05);
    expect(tile.c).toBeLessThan(0.02);
  });

  it("is key-lit from the top-left, deepening to the bottom-right", () => {
    for (const size of [16, 32, 180, 1024]) {
      const band = ringArt(size).band;
      const lum = band.map((w) => lchOf(w.fill).l);
      const brightest = lum.indexOf(Math.max(...lum));
      const darkest = lum.indexOf(Math.min(...lum));
      // Wedge i spans i/n of the turn from the crown, clockwise.
      const angle = (i: number) => ((i + 0.5) * 360) / band.length;
      expect(Math.abs(angle(brightest) - 315), `${size}`).toBeLessThan(15);
      expect(Math.abs(angle(darkest) - 135), `${size}`).toBeLessThan(15);
    }
  });

  it("stands inside the 80% circle a launcher's mask always keeps", () => {
    // The maskable icon is drawn full bleed at the home screen's cut: its
    // band's outer edge must sit inside a radius of 0.4 of the tile.
    for (const size of [60, 1024]) {
      const o = ringCutFor(size);
      expect(o.rDisc + o.gap + o.band, o.id).toBeLessThan(0.4);
    }
  });
});

describe("the Ring's markup", () => {
  it("prefixes every id it draws, so two inline Rings never share one", () => {
    const markup = ringMarkup({ size: 180, id: "x1" });
    const ids = [...markup.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(3);
    for (const id of ids) expect(id.startsWith("x1")).toBe(true);
    for (const ref of markup.matchAll(/url\(#([^)]+)\)/g))
      expect(ids).toContain(ref[1]);
  });

  it("clips to the home screen's corner, fills the box, or stands bare, as asked", () => {
    expect(ringMarkup({ size: 16 })).toContain("clip-path=");
    const square = ringMarkup({ size: 180, shape: "square" });
    expect(square).not.toContain("clip-path=");
    expect(square).toContain('<rect width="1024" height="1024"');
    const bare = ringMarkup({ size: 1024, shape: "bare" });
    expect(bare).not.toContain("<rect");
    expect(bare).not.toContain("clip-path=");
  });

  it("draws the mono ring in one ink, its gap a hole any ground shows through", () => {
    const svg = ringMonoSvg({ size: 1024, ink: "#101010" });
    expect(
      [...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]),
    ).toEqual(["#101010"]);
    expect(svg).toContain('fill-rule="evenodd"');
    expect(RING_MONO.disc).toBeLessThan(RING_MONO.inner);
    expect(RING_MONO.inner).toBeLessThan(1);
  });
});

describe("the house ember's one home", () => {
  const globals = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const token = (name: string) =>
    globals
      .match(
        new RegExp(`--${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`),
      )
      ?.slice(1)
      .map(Number);

  it("is globals.css's --ember-1..4, stop for stop", () => {
    EMBER.forEach((stop, i) =>
      expect(token(`ember-${i + 1}`), `--ember-${i + 1}`).toEqual([
        stop.l,
        stop.c,
        stop.h,
      ]),
    );
  });

  it("relights the five lamps the foot's seam and the confetti read as --ember-lamp-1..5", () => {
    expect(EMBER_LAMPS).toHaveLength(5);
    expect(EMBER_LAMPS[0]).toEqual({
      l: EMBER[0].l,
      c: EMBER[0].c,
      h: EMBER[0].h,
    });
    expect(EMBER_LAMPS[4]).toEqual({
      l: EMBER[3].l,
      c: EMBER[3].c,
      h: EMBER[3].h,
    });
    EMBER_LAMPS.forEach((lamp, i) =>
      expect(token(`ember-lamp-${i + 1}`), `--ember-lamp-${i + 1}`).toEqual([
        lamp.l,
        lamp.c,
        lamp.h,
      ]),
    );
  });
});
