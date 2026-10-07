import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE PARTY: MAYA & JAY'S WEDDING (the site's own fictional album, the one
 * every board follows), Priya the guest whose night the guest questions draw.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so what this board needs from brand
 * r2's (the stills' sampled light) is retyped here rather than imported.
 *
 * ★ THE STILLS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), local files, so
 * nothing here waits on a network or a presign.
 */

export const WEDDING = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  host: { name: "Maya", seed: "signature-maya" },
  guest: { name: "Priya", seed: "signature-priya" },
  photos: 142,
  guests: 38,
  /** The date the cover prints: the night itself. */
  date: "2026-09-12",
} as const;

/** A still's id: one of the bootstrap twelve. */
export type StillId =
  | "wedding-golden"
  | "reception-table"
  | "party-balloons"
  | "concert-confetti"
  | "wedding-rings"
  | "reception-hall"
  | "party-dj"
  | "wedding-toast"
  | "festival-lights"
  | "festival-crowd"
  | "wedding-arch"
  | "wedding-petals";

export type Still = {
  id: StillId;
  src: string;
  /** Width over height. */
  ratio: number;
  /** Where the subject sits, for a crop (`object-position`). */
  focus: string;
};

export const still = (id: StillId, focus = "50% 50%"): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, ratio: m.width / m.height, focus };
};

/** The album as Priya opens it, newest first: what the guests have sent by the dancing. */
export const ALBUM: readonly Still[] = [
  still("wedding-toast"),
  still("reception-hall"),
  still("reception-table"),
  still("wedding-golden", "45% 45%"),
  still("wedding-petals", "50% 30%"),
  still("wedding-rings"),
  still("wedding-arch", "50% 40%"),
  still("party-dj"),
  still("festival-lights"),
  still("concert-confetti"),
  still("party-balloons"),
  still("festival-crowd"),
];

/** The cover's still, the one the Seam is born under (the cover dissolves through more; it holds this one here). */
export const COVER = still("reception-table", "50% 62%");

/* ── the light the stills give off ─────────────────────────────────────── */

/**
 * ONE LAMP: a hue and its share of the light (and an optional depth, the
 * hashvatar's way to be rich: one hue read at several lightnesses).
 */
export type Lamp = {
  readonly h: number;
  readonly w: number;
  readonly dl?: number;
  /** The light's own chroma (its photograph's intensity), capped by the register. */
  readonly c?: number;
};
export type Light = readonly Lamp[];

/**
 * EVERY STILL'S OWN LIGHT, as production's sampler reads it
 * (`sampled-palette.ts`: a 32 px read, 24 hue buckets, chroma-weighted),
 * nothing invented (brand r2's read, retyped from `brand/afterglow/system.tsx`).
 */
export const SAMPLED: Record<StillId, Light> = {
  "wedding-golden": [{ h: 53.4, w: 1 }],
  "reception-table": [
    { h: 67.3, w: 0.63 },
    { h: 216.3, w: 0.23 },
    { h: 112.6, w: 0.14 },
  ],
  "party-balloons": [
    { h: 83.3, w: 0.44 },
    { h: 186.8, w: 0.26 },
    { h: 353.5, w: 0.25 },
  ],
  "concert-confetti": [
    { h: 261.2, w: 0.83 },
    { h: 306.7, w: 0.17 },
  ],
  "wedding-rings": [{ h: 40.7, w: 1 }],
  "reception-hall": [
    { h: 247.6, w: 0.5 },
    { h: 56.2, w: 0.44 },
    { h: 109.7, w: 0.06 },
  ],
  "party-dj": [
    { h: 262.5, w: 0.63 },
    { h: 307.9, w: 0.37 },
  ],
  "wedding-toast": [{ h: 67.4, w: 1 }],
  "festival-lights": [
    { h: 261.3, w: 0.69 },
    { h: 322.5, w: 0.17 },
    { h: 202.6, w: 0.14 },
  ],
  "festival-crowd": [{ h: 37.9, w: 1 }],
  "wedding-arch": [
    { h: 130.1, w: 0.8 },
    { h: 68, w: 0.2 },
  ],
  "wedding-petals": [
    { h: 49.9, w: 0.4 },
    { h: 95.8, w: 0.35 },
    { h: 263.7, w: 0.25 },
  ],
};

/**
 * EVERY STILL'S INTENSITY: the 95th-percentile chroma of its midtones. A light
 * is never louder than its photograph: the arch at noon glows softly, the
 * laser show at full.
 */
export const INTENSITY: Record<StillId, number> = {
  "wedding-golden": 0.063,
  "reception-table": 0.12,
  "party-balloons": 0.141,
  "concert-confetti": 0.102,
  "wedding-rings": 0.095,
  "reception-hall": 0.082,
  "party-dj": 0.126,
  "wedding-toast": 0.098,
  "festival-lights": 0.231,
  "festival-crowd": 0.115,
  "wedding-arch": 0.051,
  "wedding-petals": 0.064,
};

/**
 * A STILL'S BOTTOM EDGE, IN PLACE: the dominant hue of each sixth of its last
 * rows, left to right (the Seam's own colours, read where it is born).
 */
export const EDGE: Partial<Record<StillId, readonly number[]>> = {
  "concert-confetti": [9, 294, 308, 309, 293, 277],
  "wedding-toast": [50, 141, 52, 69, 51, 40],
  "reception-table": [114, 97, 65, 54, 64, 52],
  "wedding-arch": [138, 129, 129, 129, 140, 131],
  "party-balloons": [82, 67, 81, 68, 68],
  "festival-lights": [233, 246, 233, 220, 233, 247],
};

/**
 * THE HOUSE EMBER (brand r2, every take): where there is no photograph and no
 * seed, the house lamps lit as one glow from the top-left, amber where the key
 * light falls, warming through coral to a deep ember. Never side by side.
 */
export const HOUSE: Light = [
  { h: 80, w: 0.34, dl: 0.06 },
  { h: 52, w: 0.3 },
  { h: 34, w: 0.22, dl: -0.04 },
  { h: 24, w: 0.14, dl: -0.1 },
];

/** Production's house five, as the door's lamp and the shutter fall back to them (`door-light.ts`). */
export const HOUSE_FIVE: readonly number[] = [25, 85, 155, 255, 305];

/**
 * THE NIGHT, AS THE HUB'S FACTS STRIP READS ONE (`HubFactsStrip`'s
 * `arrivals`: minutes since the epoch, oldest first): a board has no album
 * store, so the hub is handed the night itself. Each press of Add lands a run
 * half a minute apart; the gaps are the evening's shape (the ceremony's rush,
 * dinner's lull, the toasts, the dancing).
 */
const PRESSES: ReadonlyArray<readonly [gap: number, photos: number]> = [
  [0, 3],
  [6, 5],
  [4, 9],
  [11, 6],
  [3, 12],
  [19, 4],
  [8, 7],
  [13, 3],
  [24, 2],
  [31, 3],
  [18, 1],
  [14, 8],
  [5, 13],
  [4, 15],
  [9, 6],
  [17, 5],
  [6, 11],
  [5, 14],
  [13, 7],
  [4, 10],
  [6, 12],
  [3, 6],
  [9, 8],
  [11, 6],
  [7, 4],
  [15, 3],
];

export function nightArrivals(newest: number): number[] {
  const presses: number[] = [];
  let at = 0;
  for (const [gap] of PRESSES) presses.push((at += gap));
  const shift = newest - at;
  const out: number[] = [];
  PRESSES.forEach(([, photos], i) => {
    for (let k = 0; k < photos; k++) out.push(shift + presses[i]! - k * 0.5);
  });
  return out.sort((a, b) => a - b);
}
