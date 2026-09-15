// @policy: shared · The vendored beam stays vendored
// @refuses: a drifted copy of the vendored border-beam, or an import that reaches around it.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { srgbToOklch } from "@/lib/shared/sampled-palette";

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

  it("marks every deviation from upstream", () => {
    // The value of vendoring is that this IS upstream, so any edit has to
    // announce itself.
    //
    // ★ THIS IS AN EXACT PIN, NOT A FLOOR (fixed at the glow merge,
    // 2026-08-31). It read toBeGreaterThanOrEqual(2) against an actual 11, so
    // it passed no matter what anyone did to the folder, under a name that
    // promised the opposite. Prettier and the em-dash scanner are both told to
    // look away here, so this file is the whole integrity story for ~3,000
    // lines of third-party code and it has to be able to fail.
    //
    // The 11 is 4 file headers (BorderBeam, pulseDriver, styles, types; each
    // names the deviations) + 7 in-body sites: the palette at styles.ts:222,
    // the union member at types.ts:49, the "use client" note at
    // BorderBeam.tsx:21, and four *Base rename-and-respread edits at
    // styles.ts:340/486/550/649 (load-bearing under strict TS: indexing a
    // 4-key object with a 5-member union is TS7053, so do not revert them).
    // Moving this number is fine; moving it WITHOUT reading the diff is not.
    const marks = readdirSync(DIR)
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) =>
        [...readFileSync(join(DIR, f), "utf8").matchAll(/PARTYREEL:/g)].map(
          () => f,
        ),
      );
    // Each of the five files carries the header, which names both deviations.
    const inBody = marks.filter((f) => f !== "index.ts");
    expect(
      inBody.length,
      "a vendored file gained or lost a PARTYREEL: mark",
    ).toBe(11);
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

  it("never hands the beam a hard-coded radius", () => {
    // The bug Will caught: a 16px chromatic ring drawn around a 3.6px card,
    // because the specimens were rounded like the reference library and then
    // handed its literal radius. Omitting `borderRadius` makes the library read
    // the child's own computed radius, so the ring is whatever the object is
    // and the nested layers follow. The ONE legitimate literal is section 04's
    // right-hand column, which exists to show the library's own 16px against
    // our tokens, and it lives in a className rather than in this prop.
    const boards = [
      "src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx",
      "src/app/(dev)/design/sandbox/glow-moments-variants.tsx",
    ];
    for (const rel of boards) {
      // Comments stripped first: these files EXPLAIN the bug, and a pin that
      // trips on its own explanation teaches the next agent to delete the
      // explanation rather than keep the fix.
      const src = readFileSync(join(process.cwd(), rel), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const literals = [...src.matchAll(/borderRadius=\{[^}]*\}/g)].map(
        (m) => m[0],
      );
      expect(literals, `${rel} passes a radius to BorderBeam`).toEqual([]);
      // And no specimen invents one in a class either: every radius on these
      // boards comes from a token, so `rounded-[14px]` and friends are out.
      // `rounded-[1px]` is a QR module, not a surface, and `rounded-[16px]` is
      // the named comparison column.
      const arbitrary = [...src.matchAll(/rounded-\[(\d+)px\]/g)]
        .map((m) => m[1])
        .filter((px) => px !== "1" && px !== "16");
      expect(arbitrary, `${rel} has off-token radii`).toEqual([]);
    }
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
    expect(chan.length, "no partyreel border lobes found").toBe(9);
    for (const spread of chan) expect(spread).toBeGreaterThan(150);
  });

  it("is a DERIVED register of the lamp set, not a second palette", () => {
    // The open question this closes: the beam looked like it had introduced a
    // rogue chroma register recorded as "our palette". It had not. These values
    // are our own five hues run through glow-contrast.ts's oklchToSrgb and
    // raised to effect-grade chroma, with HUE HELD EXACTLY. That makes it the
    // LIVE register of the lamp set (design-system.md), and the test above is
    // its other half: that one pins the raised chroma, this one pins that the
    // raise did not move the hue.
    //
    // It has to live here as literal rgb() rather than var(--lamp-N): styles.ts
    // regex-parses these strings to derive alpha and attenuation variants
    // (withAlpha / attenuate), so a token would produce silently broken
    // gradients. A test is the only thing that can hold the two in sync.
    const LAMP_HUES = [25, 85, 155, 255, 305];
    const every = [
      ...colorPalettes.partyreel.border.map((l) => l.color),
      colorPalettes.partyreel.spike.primary,
      colorPalettes.partyreel.spike.secondary,
      colorPalettes.partyreel.spikeLt.primary,
      colorPalettes.partyreel.spikeLt.secondary,
    ];
    expect(every.length, "no partyreel colours found").toBe(13);
    const strays: string[] = [];
    for (const c of every) {
      const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map(Number);
      const { h } = srgbToOklch(r, g, b);
      // Tolerance is wide on purpose: a gamut-edge sRGB projection of an oklch
      // hue does drift a few degrees, and the failure worth catching is a
      // SIXTH hue appearing, not a two-degree rounding difference.
      const nearest = Math.min(
        ...LAMP_HUES.map((L) =>
          Math.min(Math.abs(h - L), 360 - Math.abs(h - L)),
        ),
      );
      if (nearest > 12) strays.push(`${c} -> hue ${h.toFixed(1)}deg`);
    }
    expect(
      strays,
      `The beam's LIVE register must stay the lamp set's five hues (25/85/155/255/305). ` +
        `Off-hue colours are a second palette, which is the thing the light system exists to prevent:\n${strays.join("\n")}`,
    ).toEqual([]);
  });
});
