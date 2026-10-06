import { css, fitChroma } from "@/lib/avatar/gradient";

import type { Case } from "./fixtures";
import type { Ground } from "./scene";

/**
 * THE COVER'S LIGHT, AS AFTERGLOW DRAWS LIGHT (brand r1, Will's desk-4 pick:
 * "light is the brand, never paint"): every colour off a photograph is the
 * light it gives off, drawn only as a Ring, a Seam or a Bloom, one per screen.
 * The seam take (`cards-seam.tsx`) makes the hub's one light the Seam born
 * where the cover's photograph ends, so this file says what colour that light
 * is, on each ground, from the cover's own photographs.
 *
 * ★ THE VALUES ARE BRAND R1'S, CARRIED, NEVER INVENTED (a board never imports
 * another board's folder, so they are quoted here): each still's sampled hues
 * and intensity off production's sampler with Afterglow's one refinement
 * (nothing fanned out round the wheel), the registers its Seam is drawn in,
 * its two corrections (yellows sit higher; no light goes olive) and its floor.
 * The brand's polish round may retune them; the wiring reads them from one
 * home then.
 *
 * ★ ONE LAMP, ONE HUE AT THREE DEPTHS (Afterglow's "a wall is ONE lamp", kept
 * to its strongest hue): the cover's six photographs merged by hue, the
 * strongest taken and read at three depths the way a hashvatar is one hue at
 * several, so a golden wedding throws a golden light, never a spectrum along
 * the row (his bar: "not like a junior designer was told to build a rainbow
 * app").
 */

/** A still's sampled hues and their shares (brand r1's `SAMPLED`, the cover's six). */
const SAMPLED: Record<string, readonly { h: number; w: number }[]> = {
  "wedding-toast": [{ h: 67.4, w: 1 }],
  "reception-hall": [
    { h: 247.6, w: 0.5 },
    { h: 56.2, w: 0.44 },
    { h: 109.7, w: 0.06 },
  ],
  "wedding-golden": [{ h: 53.4, w: 1 }],
  "wedding-arch": [
    { h: 130.1, w: 0.8 },
    { h: 68, w: 0.2 },
  ],
  "wedding-petals": [
    { h: 49.9, w: 0.4 },
    { h: 95.8, w: 0.35 },
    { h: 263.7, w: 0.25 },
  ],
  "reception-table": [
    { h: 67.3, w: 0.63 },
    { h: 216.3, w: 0.23 },
    { h: 112.6, w: 0.14 },
  ],
};

/** A still's intensity: the 95th-percentile chroma of its midtones (brand r1's `INTENSITY`). */
const INTENSITY: Record<string, number> = {
  "wedding-toast": 0.098,
  "reception-hall": 0.082,
  "wedding-golden": 0.063,
  "wedding-arch": 0.051,
  "wedding-petals": 0.064,
  "reception-table": 0.12,
};

/**
 * Before the first photograph the cover is production's house light (its two
 * pools, coral at 25° and a step toward amber at 55°, `event-experience-head.css`),
 * so its seam is lit by that same warmth, the two merged: the light under a
 * cover is the light in it. (Afterglow would give an empty album its seed's
 * hue; production's cover does not draw the seed yet.) ★ NEVER THE CORAL
 * ALONE: on paper's register it lands a step from Afterglow's Fault red.
 */
const HOUSE = { h: 40, c: 0.15 } as const;

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};
const mixHue = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

/** A photograph's light chroma: its own intensity, lifted a seventh, inside the room's range. */
const chromaOf = (id: string) =>
  Math.min(0.15, Math.max(0.07, (INTENSITY[id] ?? 0.1) * 1.15));

/** The cover's one lamp: the strongest hue of its photographs merged within 20°, at their strongest intensity. */
export function lightOfCover(c: Case): { h: number; c: number } {
  const ids = c.stills.map((s) => s.id).filter((id) => SAMPLED[id]);
  if (ids.length === 0) return HOUSE;
  const merged: { h: number; w: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const near = merged.find((m) => hueGap(m.h, lamp.h) < 20);
      if (near) {
        const w = near.w + lamp.w;
        near.h = mixHue(near.h, lamp.h, lamp.w / w);
        near.w = w;
      } else merged.push({ ...lamp });
    }
  const top = merged.sort((a, b) => b.w - a.w)[0];
  return { h: top.h, c: Math.max(...ids.map(chromaOf)) };
}

/**
 * THE SEAM'S REGISTERS (brand r1's `REGISTER`): light is born bright at its
 * source and falls off fast, on both grounds; on paper higher, more chromatic
 * and a third of the reach, "the way sun through a door's gap lies on a white
 * wall".
 */
const REGISTER = {
  room: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  roomLine: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
  paper: { l: 0.9, lift: 0.03, c: 0.16, boost: 1.6 },
  paperLine: { l: 0.78, lift: 0.06, c: 0.17, boost: 1.6 },
} as const;

/** How far a hue sits toward yellow (yellows need more lightness to read as light, never brown). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((hueGap(h, 95) / 70) * Math.PI) / 2));

/** No light goes olive: the band the eye reads as mud once dimmed is pulled to the clean light it nearly was. */
const unOlive = (h: number) => (h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h);

/** A light is never drawn under the chroma that reads as light (never a grey stain). */
const CHROMA_FLOOR = 0.13;

function toneOf(
  h: number,
  c: number,
  register: keyof typeof REGISTER,
  dl = 0,
): string {
  const r = REGISTER[register];
  const hue = unOlive(h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(hue) + dl);
  return css(
    fitChroma({ l, c: Math.min(r.c, Math.max(CHROMA_FLOOR, c * r.boost)), h: hue }),
  );
}

/** The lamp at three depths across the row, left to right (a hashvatar's own richness). */
function band(light: { h: number; c: number }, register: keyof typeof REGISTER) {
  const stops = [
    `${toneOf(light.h, light.c, register, 0.07)} 17%`,
    `${toneOf(light.h, light.c, register)} 54%`,
    `${toneOf((light.h + 348) % 360, light.c, register, -0.07)} 87%`,
  ];
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/** What the seam take hands its sheet: the glow's band, the source line's band, and the edge a card catches. */
export function seamVars(c: Case, ground: Ground): Record<string, string> {
  const light = lightOfCover(c);
  const paper = ground === "paper";
  return {
    "--eh-seam-glow": band(light, paper ? "paper" : "room"),
    "--eh-seam-line": band(light, paper ? "paperLine" : "roomLine"),
    "--eh-seam-edge": toneOf(light.h, light.c, paper ? "paperLine" : "roomLine"),
  };
}
