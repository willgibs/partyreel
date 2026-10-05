import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE HOST, TWO PARTIES, ONE NIGHT OF PHOTOGRAPHS: Maya's wedding (the site's
 * own fictional album, Maya & Jay's, the one every board follows) and her
 * 30th a month later, a dinner for eight; Priya is the guest who opens both.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so its fixtures are retyped here.
 *
 * ★ THE DATES MOVE WITH TODAY. The wedding is always a fortnight off, so its
 * develop is always ahead and every line Settings says about it ("develops
 * Sunday at 9 am") is a waiting album's, whichever day the board is opened.
 * Every frame portals after mount, so none of this is ever rendered twice.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset), laid out as one wedding night from the arch to the last dance, so
 * the album's order reads at a glance: daylight first, or the dance floor.
 */

/* ── the host and her parties ─────────────────────────────────────────── */

export const HOST = {
  name: "Maya",
  email: "maya@example.com",
  seed: "customize-maya",
} as const;

export const PRIYA = { name: "Priya", seed: "customize-priya" } as const;

/** A day `days` from today, as the calendar prints it (`YYYY-MM-DD`), in the reader's clock. */
function dayFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** An instant on a day from today, at an hour of the reader's clock. */
function atHour(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const WEDDING = {
  id: "c2e1d0a9-4b3f-4e2d-9c1b-7a6f5e4d3c2b",
  name: "Maya & Jay's Wedding",
  date: dayFromToday(13),
  guests: 150,
  /** 9 am the morning after: production's own default (`defaultDevelopAt`). */
  developsAt: atHour(14, 9),
  /** The noon Maya moves it to, the morning after. */
  developsAtNoon: atHour(14, 12),
} as const;

export const THIRTIETH = {
  name: "Maya's 30th",
  guests: 8,
  /** Its develop at her usual hour, the morning after a party a month off. */
  developsAtNoon: atHour(44, 12),
  developsAt: atHour(44, 9),
} as const;

/* ── the roll ─────────────────────────────────────────────────────────── */

/** Film's three sizes, the scale every disposable and every roll of 35 mm was sold in. */
export const FILM_SIZES = [12, 24, 36] as const;

/** Production's roll (`ROLL_SHOTS`), the size a host meets unless she picks. */
export const USUAL_ROLL = 24;

/** The board's bounds for any count (the manifest's Question): two digits on the camera's count. */
export const ROLL_MIN = 1;
export const ROLL_MAX = 99;

/** What each party's roll is in the frames: a small roll for a big wedding, a big one for a dinner. */
export const WEDDING_ROLL = 12;
export const DINNER_ROLL = 36;
/** The count a host types where film's three are not enough (a weekend away, a long dinner). */
export const OTHER_ROLL = 50;

/* ── the stills ───────────────────────────────────────────────────────── */

export type Photo = {
  id: string;
  src: string;
  /** Width over height, as the album's rows lay it. */
  ratio: number;
  /** Where the photograph's subject sits, for a crop. */
  focus: string;
};

const photo = (id: string, focus = "50% 50%"): Photo => {
  const m = marketingImage(id);
  return { id, src: m.src, ratio: m.width / m.height, focus };
};

/**
 * THE WEDDING NIGHT IN ORDER, first photograph to last: the arch before
 * anyone sits, the rings, the petals, golden hour, dinner, the toast, the
 * floor, and the confetti and the lights at the end.
 */
export const NIGHT: readonly Photo[] = [
  photo("wedding-arch", "50% 40%"),
  photo("wedding-rings"),
  photo("wedding-petals", "50% 30%"),
  photo("wedding-golden", "45% 45%"),
  photo("reception-table"),
  photo("reception-hall"),
  photo("wedding-toast"),
  photo("party-dj"),
  photo("concert-confetti"),
  photo("festival-lights"),
  photo("festival-crowd"),
];

/** At the party: what has landed by the dancing, the first eight of the night. */
export const AT_THE_PARTY: readonly Photo[] = NIGHT.slice(0, 8);

/** The cover's stills, the reel's first pass (production reads them off the reel's take). */
export const COVER: readonly Photo[] = [
  NIGHT[3]!,
  NIGHT[6]!,
  NIGHT[2]!,
  NIGHT[7]!,
];

/** The camera's live picture at the party: the toast under the string lights. */
export const IN_THE_FINDER = NIGHT[6]!;

/** The album's count, as its cover says it: a wedding of 150's night, and its party so far. */
export const ALBUM_COUNT = { party: 142, morning: 214 } as const;
