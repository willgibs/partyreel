import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE PARTY, AFTER IT: MAYA & JAY'S WEDDING (the site's own fictional album,
 * the one every board follows) on Saturday 12 September 2026, read at three
 * moments after it: the night itself (the numbers presence drew it at), the
 * morning after (Sunday at 9, the camera rolls of the night in), and a week
 * on (the trickle stopped). Priya is the guest whose return the guest
 * questions draw; Maya the host whose morning after the host's do.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so what this board needs from
 * presence's and brand's (the stills' sampled light, the party's names) is
 * retyped here rather than imported.
 *
 * ★ THE STILLS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), local files, so
 * nothing here waits on a network or a presign; the faces are production's
 * hashvatar for people who do not exist, never a portrait.
 */

/** The party, and its numbers at each moment the board reads it at. */
export const WEDDING = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  host: { name: "Maya", seed: "maya-lin" },
  /** The day itself: one day, a Saturday. */
  date: "2026-09-12",
  /** The custom link Maya set, as her hub's link row prints it. */
  pretty: "https://partyreel.com/e/maya-and-jay",
  permanent: "https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f",
  note: "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
} as const;

/** WHAT THE ALBUM HOLDS AT A MOMENT: its count (photos and videos), its kinds, its guests and its views. */
export type Moment = {
  readonly key: "night" | "morning" | "week";
  /** How the moment is said over a frame. */
  readonly when: string;
  readonly album: number;
  readonly photos: number;
  readonly videos: number;
  readonly guests: number;
  readonly views: number;
};

/** Saturday, 10 pm: the party at its height (presence's numbers). */
export const NIGHT: Moment = {
  key: "night",
  when: "Saturday, 10 pm",
  album: 142,
  photos: 134,
  videos: 8,
  guests: 38,
  views: 486,
};

/** Sunday, 9 am: the morning after, the night's camera rolls in. */
export const MORNING: Moment = {
  key: "morning",
  when: "Sunday, 9 am",
  album: 186,
  photos: 174,
  videos: 12,
  guests: 39,
  views: 812,
};

/** A week on: the trickle has stopped, the link has been shared round the family. */
export const WEEK: Moment = {
  key: "week",
  when: "A week on",
  album: 214,
  photos: 198,
  videos: 16,
  guests: 41,
  views: 1286,
};

/** Priya, the guest who comes back: nine of the album's photographs are hers. */
export const PRIYA = { name: "Priya", seed: "guest-priya", added: 9 } as const;

/** A guest as a face draws her: a name, and the seed her colour comes from. */
export type Guest = { readonly name: string; readonly seed: string };

const g = (name: string): Guest => ({
  name,
  seed: `guest-${name.toLowerCase()}`,
});

/** The party's guests, newest first (presence's party, retyped): faces never ride a card, only the album. */
export const PARTY: readonly Guest[] = [
  "Theo",
  "Ines",
  "Sam",
  "Lena",
  "Omar",
  "Nadia",
  "Ruben",
  "Chloe",
  "Marcus",
  "Aiko",
  "Dev",
  "Hana",
].map(g);

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

/** The album, newest first (a wedding's twelve: the bootstrap stills in the night's own run). */
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

/** The cover's still: the reel's opening (production dissolves through six; a frame holds one). */
export const COVER = still("reception-table", "50% 62%");

/** The cover's six, as production's dissolve deals them (`pickCoverIds`): the reel's opening first. */
export const COVER_SIX: readonly Still[] = [
  COVER,
  still("wedding-golden", "45% 45%"),
  still("wedding-toast"),
  still("wedding-arch", "50% 40%"),
  still("party-dj"),
  still("wedding-rings"),
];

/** Priya's own nine, as the Yours lens finds them (the stills she took, the night's order). */
export const HERS: readonly Still[] = [
  still("wedding-arch", "50% 40%"),
  still("wedding-petals", "50% 30%"),
  still("wedding-rings"),
  still("reception-table"),
  still("wedding-toast"),
  still("party-dj"),
  still("festival-lights"),
  still("party-balloons"),
  still("wedding-golden", "45% 45%"),
];

/* ── the light the stills give off ─────────────────────────────────────── */

/** ONE LAMP: a hue and its share of the light. */
export type Lamp = { readonly h: number; readonly w: number };
export type Light = readonly Lamp[];

/**
 * EVERY STILL'S OWN LIGHT, as production's sampler reads it
 * (`sampled-palette.ts`: a 32 px read, 24 hue buckets, chroma-weighted),
 * nothing invented (brand r2's read, retyped through presence's).
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
 * THE ALBUM'S OWN LIGHT: its cover's six read together, at most three hues,
 * heaviest first (Aperture: colour from the photographs, at most three hues a
 * light). Read off the samples above, never typed: a wedding of warm golds
 * with one cool note from the hall.
 */
export const ALBUM_LIGHT: Light = (() => {
  const buckets = new Map<number, number>();
  for (const s of COVER_SIX)
    for (const lamp of SAMPLED[s.id]) {
      // 30° buckets: two golds a few degrees apart are one lamp.
      const b = Math.round(lamp.h / 30) % 12;
      buckets.set(b, (buckets.get(b) ?? 0) + lamp.w);
    }
  const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const sum = top.reduce((n, [, w]) => n + w, 0);
  return top.map(([b, w]) => ({ h: b * 30, w: w / sum }));
})();
