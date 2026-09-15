import { describe, expect, it } from "vitest";

import { RAMP_BY_ID, warm, warmthAt } from "./ramps";

/**
 * THE PROOF THAT CUTTING CANDIDATE C LOST NOTHING (round three).
 *
 * Round two's third candidate, "C. Film stock", was A's ladder at a
 * temperature: its own move list said "The spacing is A's exactly, so a ruling
 * between A and C is a ruling on temperature alone and nothing else moves". A
 * column that moves no step is a switch, so round three made it one
 * (`warm()` in ramps.ts) and gave the third of the board back.
 *
 * This file is the receipt. C's five published blocks are pinned here verbatim,
 * copied out of the manifest's paste section (docs/tracks/palette.md, "C. Film
 * stock"), and the test asserts that `warm(A)` still produces every one of
 * them. If the transform ever drifts, the ruling Will was shown stops being
 * available and this fails.
 *
 * ONE deliberate difference, asserted separately below: C left `.dark --ring`
 * at chroma 0 while writing `.surface-ink --ring` warm, at the same job on the
 * same ground. A transform cannot hold both answers; it takes the ink one.
 */

const C_ROUND_TWO = {
  light: {
    "--background": "oklch(0.977 0.004 85)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.998 0.003 85)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.998 0.003 85)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.998 0.003 85)",
    "--secondary": "oklch(0.925 0.006 85)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.948 0.005 85)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.925 0.006 85)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.89 0.007 85)",
    "--input": "oklch(0.89 0.007 85)",
    "--ring": "oklch(0.3 0 0)",
  },
  dark: {
    "--background": "oklch(0.145 0.005 60)",
    "--foreground": "oklch(0.955 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.955 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.955 0.002 85)",
    "--primary": "oklch(0.955 0.002 85)",
    "--primary-foreground": "oklch(0.145 0.005 60)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.955 0.002 85)",
    "--muted": "oklch(0.195 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.955 0.002 85)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": "oklch(0.85 0 0)",
  },
  ink: {
    "--background": "oklch(0.185 0.006 60)",
    "--foreground": "oklch(0.965 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.965 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.965 0.002 85)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.965 0.002 85)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.965 0.002 85)",
    "--muted": "oklch(0.235 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 14%)",
    "--ring": "oklch(0.965 0.002 85)",
    "--primary": "oklch(0.965 0.002 85)",
    "--primary-foreground": "oklch(0.185 0.006 60)",
    "--brand": "var(--primary)",
    "--brand-foreground": "var(--primary-foreground)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.09 0.004 60)",
    "--gallery-foreground": "oklch(0.965 0.002 85)",
    "--gallery-muted": "oklch(0.62 0.004 70)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.105 0.004 60)",
};

describe("the temperature transform reproduces round two's candidate C", () => {
  const warmA = warm(RAMP_BY_ID.a);

  it("reproduces C's light block token for token", () => {
    expect(warmA.light).toEqual(C_ROUND_TWO.light);
  });

  it("reproduces C's ink leaf, canvas and cinema ground", () => {
    expect(warmA.ink).toEqual(C_ROUND_TWO.ink);
    expect(warmA.gallery).toEqual(C_ROUND_TWO.gallery);
    expect(warmA.cinemaBackground).toEqual(C_ROUND_TWO.cinemaBackground);
  });

  it("reproduces C's dark block apart from the one value C wrote twice", () => {
    const { "--ring": ring, ...rest } = warmA.dark;
    const { "--ring": cRing, ...cRest } = C_ROUND_TWO.dark;
    expect(rest).toEqual(cRest);
    // The correction, recorded rather than hidden: C left the dark ring cold
    // and the ink ring warm, at the same job on the same ground.
    expect(cRing).toBe("oklch(0.85 0 0)");
    expect(ring).toBe("oklch(0.85 0.004 70)");
  });
});

describe("the rule the transform holds", () => {
  it("leaves ink on paper neutral and warms only the surfaces", () => {
    const light = warm(RAMP_BY_ID.a).light;
    // Every text step on paper keeps chroma 0, which is what lets black stay
    // crisp on a warm white.
    for (const token of [
      "--foreground",
      "--muted-foreground",
      "--faint",
      "--primary",
      "--ring",
    ]) {
      expect(light[token]).toMatch(/ 0 0\)$/);
    }
    expect(light["--background"]).toBe("oklch(0.977 0.004 85)");
  });

  it("leaves a veil alone, because it borrows the surface under it", () => {
    const dark = warm(RAMP_BY_ID.a).dark;
    expect(dark["--border"]).toBe("oklch(1 0 0 / 12%)");
    expect(dark["--input"]).toBe("oklch(1 0 0 / 16%)");
  });

  it("carries candidate B's whole ladder on one warmed room", () => {
    const b = warm(RAMP_BY_ID.b);
    // B derives every surface from the room by color-mix, so warming the room
    // is the entire change: the mixes are untouched strings.
    expect(b.dark["--background"]).toBe("oklch(0.125 0.005 60)");
    expect(b.dark["--card"]).toBe(RAMP_BY_ID.b.dark["--card"]);
    expect(b.dark["--muted"]).toBe(RAMP_BY_ID.b.dark["--muted"]);
  });

  it("sends the canvas less temperature than any room it sits under", () => {
    // The media well is the deepest ground in the set; a photograph should sit
    // on something close to black rather than on a tinted one.
    expect(warmthAt(0.09, true).chroma).toBeLessThan(
      warmthAt(0.145, true).chroma,
    );
    expect(warmthAt(0.145, true).chroma).toBeLessThan(
      warmthAt(0.325, true).chroma,
    );
  });

  it("is a no-op on a ramp that is already warm", () => {
    const once = warm(RAMP_BY_ID.a);
    expect(warm(once)).toEqual(once);
  });
});
