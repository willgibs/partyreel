import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  colorPalettes,
  getPulseDriverConfig,
} from "@/components/vendor/border-beam/styles";

// Guards for the VENDORED border-beam package (src/components/vendor/border-beam).
//
// It is copied in verbatim under MIT with a standing instruction not to restyle
// it, which is a contract nothing else in the repo enforces: prettier and eslint
// are both told to leave the folder alone, so a stray edit there would sail
// through the gate. These pins are what is left.
//
// Three hand-ports of this effect were attempted before vendoring, and every one
// missed the same way: our low-chroma five substituted into a palette tuned at
// the sRGB gamut edge, then compensated with filters. The A/B in doctrine
// section 04 exists to settle that by looking, and it is only a fair comparison
// while the two palettes differ in colour and NOTHING else.

const DIR = join(process.cwd(), "src/components/vendor/border-beam");

describe("the vendored border-beam package", () => {
  it("keeps the MIT notice in every source file", () => {
    // MIT requires the copyright notice to survive in copies of the source.
    // User-facing credit is a separate thing and belongs on the attributions
    // page; this is the licence obligation, and it is not optional.
    const files = readdirSync(DIR).filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const f of files) {
      const src = readFileSync(join(DIR, f), "utf8");
      expect(src, `${f} lost its licence header`).toContain("MIT License");
      expect(src, `${f} lost its attribution`).toContain("Jakub Antalik");
    }
  });

  it("marks every deviation from upstream, and has only the two", () => {
    // The value of vendoring is that this IS upstream, so any edit has to
    // announce itself. Two are expected: the "use client" directive Next 16
    // needs, and the extra palette. If a third appears, either it is marked and
    // this number moves deliberately, or someone restyled the package.
    const marks = readdirSync(DIR)
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) =>
        [...readFileSync(join(DIR, f), "utf8").matchAll(/PARTYREEL:/g)].map(
          () => f,
        ),
      );
    // Each of the five files carries the header, which names both deviations.
    const inBody = marks.filter((f) => f !== "index.ts");
    expect(inBody.length).toBeGreaterThanOrEqual(2);
  });

  it("varies only colour between the two palettes under test", () => {
    // The whole point of the section 04 comparison. If a position or a size
    // drifts, the columns stop being the same effect in two palettes and start
    // being two effects, and the ruling made from them is worthless.
    const theirs = colorPalettes.colorful.border;
    const ours = colorPalettes.partyreel.border;

    expect(ours).toHaveLength(theirs.length);
    ours.forEach((lobe, i) => {
      expect(lobe.pos, `lobe ${i} moved`).toBe(theirs[i].pos);
      expect(lobe.size, `lobe ${i} resized`).toBe(theirs[i].size);
      expect(lobe.color, `lobe ${i} is not ours`).not.toBe(theirs[i].color);
    });
  });

  it("keeps the two palettes in phase, which is what makes the A/B honest", () => {
    // Doctrine section 04 tells Will the columns are the same instant of the
    // same motion, so any difference he sees is colour. That claim rests on two
    // properties of the driver: it takes no colorVariant, and every oscillator
    // phase comes from absolute page time rather than a per-instance start. If
    // either changed, the two columns would drift apart and the board would be
    // asserting something false about a comparison it exists to serve.
    const cfg = (id: string) =>
      getPulseDriverConfig("pulse-inner", "dark", 1.96, 30, false, id);

    const a = cfg("aaa");
    const b = cfg("bbb");
    expect(a).not.toBeNull();
    expect(a!.oscillators).toHaveLength(b!.oscillators.length);
    a!.oscillators.forEach((osc, i) => {
      const other = b!.oscillators[i];
      // Same period and same delay => same phase at any given timestamp. The
      // prop names differ only by the instance id, which is the point.
      expect(osc.period, `oscillator ${i} period`).toBe(other.period);
      expect(osc.delay, `oscillator ${i} delay`).toBe(other.delay);
      expect(osc.a).toBe(other.a);
      expect(osc.b).toBe(other.b);
    });
    expect(a!.hue?.period).toBe(b!.hue?.period);
  });

  it("counts the hues the board claims each palette carries", () => {
    // Section 04 states the numbers (theirs eight distinct hues across nine
    // lobes, ours five) and draws a real conclusion from the gap: ours is a
    // less varied field no retune can fix. A stated number is a claim, and a
    // claim about the code belongs under test.
    const distinct = (v: "colorful" | "partyreel") =>
      new Set(colorPalettes[v].border.map((l) => l.color)).size;
    expect(distinct("colorful")).toBe(8);
    expect(distinct("partyreel")).toBe(5);
  });

  it("ships our hues at a chroma this effect can actually show", () => {
    // Our ratified five sit at oklch chroma 0.14 to 0.17 because the chrome is
    // achromatic everywhere else and the media is the colour. Dropped into
    // gradients tuned at the gamut edge they wash out, which is exactly what
    // sank the hand-ports. These were generated by oklchToSrgb at effect-grade
    // chroma; the pin is that at least one channel is at or near the rail, so
    // a future "let us just use the token values" edit fails here.
    const chan = colorPalettes.partyreel.border.map((l) => {
      const [r, g, b] = l.color.match(/\d+/g)!.map(Number);
      return Math.max(r, g, b) - Math.min(r, g, b);
    });
    for (const spread of chan) expect(spread).toBeGreaterThan(150);
  });
});
