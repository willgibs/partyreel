import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE PARTY: MAYA & JAY'S WEDDING (the site's own fictional album, the one
 * every board follows), Priya the guest whose night the guest questions draw,
 * and her party: thirty-eight guests who have added to it, Theo adding now.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so what this board needs from brand
 * r2's (the stills' sampled light) is retyped here rather than imported.
 *
 * ★ THE FACES ARE FIXTURES, NEVER A REAL PERSON: invented names, each with a
 * seed of its own (`guest-<name>`, standing in for `seedFor` of a row's id),
 * so every face is production's hashvatar (`orbFor`, the mesh) for a person
 * who does not exist. ★ THE DRAW IS NOT PICKED: one naming scheme, whatever
 * hues it lands on, as a real party's random seeds would (the host keeps the
 * seed brand-marks drew her with). No guest here has a photograph of
 * herself: most guests never set one (a typed name at the door is a colour),
 * and the lab has no portrait (ASSETS row 41 asks for twenty; they would
 * replace a few of these discs, by name).
 *
 * ★ THE STILLS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), local files, so
 * nothing here waits on a network or a presign.
 */

export const WEDDING = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  host: { name: "Maya", seed: "maya-lin" },
  photos: 142,
  views: 486,
  /** The one count (`getEventGuests`): never the host, never a nameless row, never someone she blocked. */
  guests: 38,
  /** The date the cover prints: the day itself. */
  date: "2026-09-12",
} as const;

/** A guest as a row draws her: a name, and the seed her colour comes from. */
export type Guest = {
  readonly name: string;
  readonly seed: string;
  /** The still she added last, whose light a ring may wear (`newest=photo`, `newest=lands`). */
  readonly last: StillId;
};

const g = (name: string, last: StillId): Guest => ({
  name,
  seed: `guest-${name.toLowerCase()}`,
  last,
});

/** Priya, the guest whose night the guest questions draw: her first photo lands in the last beat. */
export const PRIYA = g("Priya", "party-dj");

/**
 * THE PARTY, NEWEST FIRST: each guest ordered by her own newest photograph in
 * the album (the row's carried `order`), Theo adding now. Thirty-eight, the
 * one count; Priya is not among them until her first photo lands.
 */
export const PARTY: readonly Guest[] = [
  g("Theo", "wedding-toast"),
  g("Ines", "reception-hall"),
  g("Sam", "wedding-petals"),
  g("Lena", "wedding-rings"),
  g("Omar", "party-balloons"),
  g("Nadia", "reception-table"),
  g("Ruben", "wedding-golden"),
  g("Chloe", "wedding-arch"),
  g("Marcus", "festival-lights"),
  g("Aiko", "concert-confetti"),
  g("Dev", "festival-crowd"),
  g("Hana", "wedding-toast"),
  g("Felix", "party-dj"),
  g("Zoe", "reception-table"),
  g("Kofi", "wedding-golden"),
  g("Elena", "wedding-petals"),
  g("Jonah", "reception-hall"),
  g("Mira", "wedding-rings"),
  g("Luca", "party-balloons"),
  g("Grace", "wedding-arch"),
  g("Arjun", "festival-lights"),
  g("Sofia", "wedding-toast"),
  g("Noah", "reception-table"),
  g("Yara", "concert-confetti"),
  g("Ben", "wedding-golden"),
  g("Iris", "wedding-petals"),
  g("Tomas", "party-dj"),
  g("Leah", "festival-crowd"),
  g("Kai", "reception-hall"),
  g("Ava", "wedding-rings"),
  g("Hugo", "party-balloons"),
  g("Nina", "wedding-arch"),
  g("Raj", "wedding-toast"),
  g("Clara", "reception-table"),
  g("Eli", "wedding-golden"),
  g("Maren", "wedding-petals"),
  g("Oscar", "festival-lights"),
  g("Tess", "concert-confetti"),
];

/** The party once Priya's first photo has landed: hers leads, one more in the count. */
export const PARTY_WITH_PRIYA: readonly Guest[] = [PRIYA, ...PARTY];

/* ── the stills ─────────────────────────────────────────────────────────── */

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

/** The album as Priya opens it, newest first. */
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

/** The cover's still (production dissolves through several; the board holds one). */
export const COVER = still("reception-table", "50% 62%");

/* ── the light the stills give off ─────────────────────────────────────── */

/** ONE LAMP: a hue and its share of the light, an optional depth and chroma. */
export type Lamp = {
  readonly h: number;
  readonly w: number;
  readonly dl?: number;
  readonly c?: number;
};
export type Light = readonly Lamp[];

/**
 * EVERY STILL'S OWN LIGHT, as production's sampler reads it
 * (`sampled-palette.ts`: a 32 px read, 24 hue buckets, chroma-weighted),
 * nothing invented (brand r2's read, retyped).
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

/** EVERY STILL'S INTENSITY: the 95th-percentile chroma of its midtones (a light is never louder than its photograph). */
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
 * A NEW PARTY: Maya made it last night and nobody has added yet (the
 * atmosphere's question). Its seed is `seedFor(events.id)` in production; here
 * an invented string, so its colour is a fixture's too.
 */
export const NEW_PARTY = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  seed: "event-maya-and-jay",
  date: "2026-09-12",
} as const;
