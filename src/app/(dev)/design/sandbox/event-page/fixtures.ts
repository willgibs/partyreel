import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE PARTY, WHOLE: MAYA & JAY'S WEDDING (the site's own fictional album, the
 * one every board follows), read at every moment its page lives through: the
 * evening Maya made it, the morning after (people have the code, nobody has
 * added), the night itself with photos landing, the Wednesday its photos
 * stopped, and a week on once she has closed adding. Priya is the guest whose
 * page the guest frames draw; Maya the host.
 *
 * ★ CARRIED, NEVER IMPORTED (every board's rule): presence, signature and
 * after-party retire into this board, so what it reuses of theirs (the stills'
 * sampled light, their intensities, the party's names, its numbers) is retyped
 * here, and their folders go in this lane.
 *
 * ★ THE STILLS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), local files, so
 * nothing waits on a network or a presign; the faces are production's
 * hashvatar for people who do not exist, never a portrait.
 */

/**
 * ★ AN EVENT HAS ONE NAME (the creative director's pass): production prints
 * `events.name` on the guest's cover, the hub and the card alike, so no frame
 * here draws a shorter name than the one Maya typed. (Earlier boards invented a
 * "Maya & Jay", which flattered every card and her head.)
 */
export const WEDDING = {
  key: "wedding",
  name: "Maya & Jay's Wedding",
  host: { name: "Maya", seed: "maya-lin" },
  /** `seedFor(events.id)` in production; an invented string here, so its colour is a fixture's too. */
  seed: "event-maya-and-jay",
  /** One day, a Saturday. */
  date: "2026-09-12",
  pretty: "https://partyreel.com/e/maya-and-jay",
  permanent: "https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f",
  note: "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
} as const;

/** WHAT THE ALBUM HOLDS AT A MOMENT, and what waits on Maya. */
export type Moment = {
  readonly key: "made" | "waiting" | "night" | "wednesday" | "week";
  /** How the moment is said over a frame. */
  readonly when: string;
  readonly album: number;
  readonly photos: number;
  readonly videos: number;
  readonly guests: number;
  readonly views: number;
  /** Uploads in Review. */
  readonly review: number;
  /** People waiting at her door. */
  readonly door: number;
  /** Whether guests can add right now. */
  readonly open: boolean;
  /**
   * Photos are landing now (the newest within a quarter hour, as the hub's
   * strip reads it): Live means this, never merely open (the creative
   * director's pass: a breathing Live on a quiet Wednesday says something is
   * happening when nothing is).
   */
  readonly landing: boolean;
};

/** Friday evening: Create has just made it; nobody has the code. */
export const MADE: Moment = {
  key: "made",
  when: "Friday, just made",
  album: 0,
  photos: 0,
  videos: 0,
  guests: 0,
  views: 0,
  review: 0,
  door: 0,
  open: true,
  landing: false,
};

/** Saturday morning: the code is out (23 have opened it), nobody has added yet. */
export const WAITING: Moment = {
  key: "waiting",
  when: "Saturday, 10 am",
  album: 0,
  photos: 0,
  videos: 0,
  guests: 0,
  views: 23,
  review: 0,
  door: 0,
  open: true,
  landing: false,
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
  review: 8,
  door: 2,
  open: true,
  landing: true,
};

/** Wednesday: the photos stopped on Monday; Close adding is offered (after-party's `over=offer`). */
export const WEDNESDAY: Moment = {
  key: "wednesday",
  when: "Wednesday",
  album: 214,
  photos: 198,
  videos: 16,
  guests: 41,
  views: 1286,
  review: 0,
  door: 0,
  open: true,
  landing: false,
};

/** A week on: she closed adding, and the album is its keepsake. */
export const WEEK: Moment = {
  key: "week",
  when: "A week on",
  album: 214,
  photos: 198,
  videos: 16,
  guests: 41,
  views: 1312,
  review: 0,
  door: 0,
  open: false,
  landing: false,
};

/** Priya, the guest: nine of the album's photographs are hers. */
export const PRIYA = { name: "Priya", seed: "guest-priya", added: 9 } as const;

/** A guest as a face draws her: a name, and the seed her colour comes from. */
export type Guest = { readonly name: string; readonly seed: string };

const g = (name: string): Guest => ({
  name,
  seed: `guest-${name.toLowerCase()}`,
});

/** The party's guests, newest first (presence's party, retyped). Faces ride the album only, never a card. */
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

/** The cover's six, as production's dissolve deals them (`pickCoverIds`): the reel's opening first. */
export const COVER_SIX: readonly Still[] = [
  still("reception-table", "50% 62%"),
  still("wedding-golden", "45% 45%"),
  still("wedding-toast"),
  still("wedding-arch", "50% 40%"),
  still("party-dj"),
  still("wedding-rings"),
];

/** Priya's own photograph that lands in the scrolled frame (her run's last). */
export const HERS = still("wedding-petals", "50% 30%");

/* ── the light the stills give off ─────────────────────────────────────── */

/** ONE LAMP: a hue, its share of the light, an optional depth and its own chroma. */
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
 * nothing invented (brand r2's read, retyped through presence's and signature's).
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

/* ── the album a frame draws ───────────────────────────────────────────── */

/**
 * AN ALBUM, AS A PAGE DRAWS IT: the event's one name, its host, its seed, its
 * day and link, the host's note, its photographs newest first and the reel's
 * opening six. The wedding is every frame's party; the rooftop is the second,
 * neon party the "Photos landing" frames also draw (the creative director's
 * pass: one warm album alone cannot show a light that varies by event, nor
 * whether a glow survives a neon party), and the lunch is the long name a card
 * is judged with.
 */
export type Album = {
  readonly key: "wedding" | "rooftop" | "lunch";
  readonly name: string;
  readonly host: { readonly name: string; readonly seed: string };
  readonly seed: string;
  readonly date: string | null;
  readonly pretty: string;
  readonly permanent: string;
  readonly note: string;
  /** Its photographs, newest first. */
  readonly stills: readonly Still[];
  /** The reel's opening six, as the cover deals them. */
  readonly cover: readonly Still[];
};

/** The wedding, whole. */
export const WEDDING_ALBUM: Album = {
  ...WEDDING,
  stills: ALBUM,
  cover: COVER_SIX,
};

/** A neon party: a summer rooftop, its light violet and magenta where the wedding's is gold. */
export const ROOFTOP: Album = {
  key: "rooftop",
  name: "Summer on the Roof",
  host: { name: "Omar", seed: "guest-omar" },
  seed: "event-summer-rooftop",
  date: "2026-07-18",
  pretty: "https://partyreel.com/e/summer-on-the-roof",
  permanent: "https://partyreel.com/e/8a6d2f1c0b9e4d7a3c5f1e0d2b4a6c8e",
  note: "The roof, the city, the whole summer. Drop in whatever you shot.",
  stills: [
    still("festival-lights"),
    still("party-dj"),
    still("concert-confetti"),
    still("festival-crowd"),
    still("party-balloons"),
    still("reception-hall"),
    still("wedding-toast"),
    still("festival-lights", "30% 50%"),
    still("party-dj", "70% 50%"),
    still("concert-confetti", "40% 40%"),
    still("festival-crowd", "60% 50%"),
    still("party-balloons", "40% 60%"),
  ],
  cover: [
    still("festival-lights"),
    still("party-dj"),
    still("concert-confetti"),
    still("festival-crowd"),
    still("party-balloons"),
    still("reception-hall"),
  ],
};

/** A long name (34 characters), the case a card has to survive. */
export const LUNCH: Album = {
  ...WEDDING_ALBUM,
  key: "lunch",
  name: "Grandma Rosa's 90th Birthday Lunch",
  host: { name: "Lucia", seed: "guest-lucia" },
  seed: "event-rosa-ninety",
};

/**
 * THE PRIVATE ALBUM IN THE CHAT, BY ITS LINK ALONE (the carried
 * `private-light`): its card may read nothing but its own address, so its
 * light is seeded by the link's token, never the event's seed (which would
 * take a lookup that tells a stranger an album stands behind the link). Ines's
 * party's own seed is another colour entirely, as the dashboard's tile shows.
 */
export const PRIVATE_LINK = "4c9c385ecae5960206ba4ecc469a0c64";

/* ── the other events, for the dashboard's tiles ───────────────────────── */

/** An event on Maya's dashboard: a name, its day, and its photographs (none for a party to come). */
export type OtherEvent = {
  readonly name: string;
  readonly seed: string;
  readonly date: string | null;
  readonly cover: Still | null;
  readonly live?: boolean;
};

export const OTHERS: readonly OtherEvent[] = [
  {
    name: "Maya & Jay's Wedding",
    seed: WEDDING.seed,
    date: WEDDING.date,
    cover: still("reception-table", "50% 62%"),
    live: true,
  },
  {
    name: "Ines turns 30",
    seed: "event-ines-thirty",
    date: "2026-10-24",
    cover: null,
  },
  {
    name: "Lake weekend",
    seed: "event-lake-weekend",
    date: null,
    cover: null,
  },
  {
    name: "Summer rooftop",
    seed: "event-summer-rooftop",
    date: "2026-07-18",
    cover: still("festival-lights"),
  },
];
