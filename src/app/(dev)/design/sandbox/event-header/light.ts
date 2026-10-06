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

/**
 * The cover's one lamp: the strongest hue of its photographs merged within
 * 20°, at their strongest intensity. ★ NO PHOTOGRAPH, NO COLOUR: before the
 * first photograph there is nothing to sample (production's cover shows its
 * house light, which is the house's, not the album's), so the edge waits
 * unlit, in the ground's own ink, the way Afterglow's waiting has no hue.
 */
export function lightOfCover(c: Case): { h: number; c: number } | null {
  const ids = c.stills.map((s) => s.id).filter((id) => SAMPLED[id]);
  if (ids.length === 0) return null;
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

/**
 * A lamp's colour in a register, gamut-fitted. ★ A THIN LINE IS CAPPED
 * BELOW AFTERGLOW'S WASH FLOOR (`cap`): the floor keeps a broad glow from
 * reading as a grey stain, but a line a pixel or two thick at that chroma
 * read as a painted stripe (fresh eyes: a dance floor's cover would draw a
 * teal one), so a line's chroma stops at the cap.
 */
function toneOf(
  h: number,
  c: number,
  register: keyof typeof REGISTER,
  dl = 0,
  cap = 1,
): string {
  const r = REGISTER[register];
  const hue = unOlive(h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(hue) + dl);
  const chroma = Math.min(cap, r.c, Math.max(CHROMA_FLOOR, c * r.boost));
  return css(fitChroma({ l, c: chroma, h: hue }));
}

/** The lamp at three depths across the row, left to right (a hashvatar's own richness). */
function band(
  light: { h: number; c: number },
  register: keyof typeof REGISTER,
  cap = 1,
) {
  const stops = [
    `${toneOf(light.h, light.c, register, 0.07, cap)} 17%`,
    `${toneOf(light.h, light.c, register, 0, cap)} 54%`,
    `${toneOf((light.h + 348) % 360, light.c, register, -0.07, cap)} 87%`,
  ];
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/** A hue moved `by` degrees toward `to` (the short way round). */
const toward = (h: number, to: number, by: number) => {
  const d = ((to - h + 540) % 360) - 180;
  return (h + Math.sign(d) * Math.min(by, Math.abs(d)) + 360) % 360;
};

/**
 * WHAT THE SEAM TAKE HANDS ITS SHEET, per ground: the source line (`core`),
 * the light just under it (`gold`) and its short fall (`fall`).
 *
 * ★ IN THE ROOM A HOT CORE AND A SHORT FALL: a pixel of near-white light
 * tinted by the lamp, two of the lamp itself, and a fall spent within a
 * dozen pixels (a long dim tail of warm light reads as brown on the room).
 * ★ ON PAPER A THIN OPAQUE LINE: the source line in paper's register (the
 * saturated, darker gold that reads on white), a pixel of glow under it and a
 * fall of four, the hue nudged ten degrees toward yellow (a translucent
 * orange on white turns peach).
 */
export function seamVars(c: Case, ground: Ground): Record<string, string> {
  const light = lightOfCover(c);
  const paper = ground === "paper";
  if (!light)
    return paper
      ? {
          "--eh-seam-core": "oklch(0.14 0.004 286 / 26%)",
          "--eh-seam-gold": "transparent",
          "--eh-seam-fall": "transparent",
        }
      : {
          "--eh-seam-core": "oklch(1 0 0 / 30%)",
          "--eh-seam-gold": "oklch(1 0 0 / 10%)",
          "--eh-seam-fall": "transparent",
        };
  if (paper) {
    const h = toward(light.h, 95, 10);
    const lamp = { h, c: light.c };
    return {
      "--eh-seam-core": band(lamp, "paperLine", 0.15),
      "--eh-seam-gold": band(lamp, "paper", 0.12),
      "--eh-seam-fall": band(lamp, "paper", 0.12),
    };
  }
  const core = css(fitChroma({ l: 0.95, c: 0.045, h: unOlive(light.h) }));
  return {
    "--eh-seam-core": `linear-gradient(${core}, ${core})`,
    "--eh-seam-gold": band(light, "room", 0.12),
    "--eh-seam-fall": band(light, "room", 0.12),
  };
}
