import { GIGABYTE } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * MAYA AND JAY'S WEDDING, THE MORNING AFTER, AND WHAT SHE SENDS TO HER DRIVE.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD: a board's folder
 * leaves whole when it retires. NOTHING HERE IS A REAL PERSON OR A REAL
 * ADDRESS (every address is `example.com`), and every photograph is one of the
 * bootstrap stills every board reuses (no new asset, nothing to track). The
 * copy is placeholder, judged for size and wrapping; the numbers agree with
 * each other everywhere they appear (the counts, the sizes, the clock).
 */

export const EVENT = {
  name: "Maya & Jay",
  /** How the cover and the folder say its day. */
  day: "12 Sep 2026",
  /** The folder a send makes in her Drive (the design note's names). */
  folder: "Maya & Jay · 12 Sep 2026",
  slug: "maya-and-jay",
  guests: 31,
} as const;

export const HOST = {
  name: "Maya",
  /** Her Partyreel sign-in and the Google account she connects: one person, one address. */
  email: "maya@example.com",
  plan: "Pro 100 GB",
} as const;

/** The album, as her Originals take it: what a send moves. */
export const ALBUM_BYTES = {
  photos: 5 * GIGABYTE,
  clips: 2.4 * GIGABYTE,
} as const;
export const ALBUM_COUNT = { photos: 1226, clips: 58 } as const;
export const TOTAL_COUNT = ALBUM_COUNT.photos + ALBUM_COUNT.clips;
export const TOTAL_BYTES = ALBUM_BYTES.photos + ALBUM_BYTES.clips;

/** Her Google Drive: 15 GB, 2.4 GB used, so 12.6 GB free (the free-space line she reads). */
export const DRIVE = {
  capBytes: 15 * GIGABYTE,
  usedBytes: 2.4 * GIGABYTE,
} as const;
export const DRIVE_FREE = DRIVE.capBytes - DRIVE.usedBytes;

/** Mid-send, 9 minutes in: 412 of the 1,284 sent, 2.4 of the 7.4 GB. */
export const MID = { sent: 412, sentBytes: 2.4 * GIGABYTE, minutesLeft: 16 } as const;

/** Her storage on Pro 100 GB the morning after: her albums and her Deleted. */
export const STORAGE = {
  capBytes: 100 * GIGABYTE,
  /** Every album she keeps, Maya & Jay's 7.4 GB included. */
  activeBytes: 88.6 * GIGABYTE,
  deletedBytes: 1.3 * GIGABYTE,
} as const;

/** Her other albums, as Your events and What's using space list them (bytes as her originals weigh). */
export const ALBUMS = [
  { id: "maya-jay", name: "Maya & Jay", day: "12 Sep", bytes: TOTAL_BYTES, items: TOTAL_COUNT, cover: "wedding-golden" },
  { id: "jay-40", name: "Jay turns 40", day: "2 Aug", bytes: 4.1 * GIGABYTE, items: 612, cover: "party-balloons" },
  { id: "lake-week", name: "Lake week", day: "14–20 Jul", bytes: 2.6 * GIGABYTE, items: 388, cover: "festival-lights" },
  { id: "engagement", name: "Engagement party", day: "8 Mar", bytes: 1.9 * GIGABYTE, items: 301, cover: "reception-hall" },
  { id: "nye", name: "New Year's Eve", day: "31 Dec", bytes: 0.9 * GIGABYTE, items: 164, cover: "concert-confetti" },
  { id: "garden", name: "Garden lunch", day: undefined, bytes: 0.4 * GIGABYTE, items: 72, cover: "reception-table" },
] as const;

/** The three she picks on Your events to send in one go. */
export const PICKED_ALBUMS = new Set(["maya-jay", "jay-40", "lake-week"]);

/**
 * THE DAILY LIMIT'S OWN ALBUM: Google takes 750 GB a day per account, which no
 * guests' wedding meets, so its frame is a videographer's album of raw clips.
 */
export const BIG = {
  name: "Ana & Sol",
  folder: "Ana & Sol · 3 Oct 2026",
  items: 9412,
  sent: 7688,
  bytes: 918 * GIGABYTE,
  sentBytes: 750 * GIGABYTE,
  resumesAt: "9:14 pm tomorrow",
} as const;

/** The two files a partly-done send could not move, as the album names them. */
export const STUCK = [
  { name: "2026-09-12 23.41.07 · Theo.mov", why: "Google wouldn't take it after 5 tries" },
  { name: "2026-09-12 23.52.19 · Theo.mov", why: "Google wouldn't take it after 5 tries" },
] as const;

export type Still = { src: string; w: number; h: number };

const still = (id: string, w?: number, h?: number): Still => {
  const m = marketingImage(id);
  return { src: m.src, w: w ?? m.width, h: h ?? m.height };
};

/** The album, newest first: the stills at a real party's mix of shapes. */
export const PHOTOS: readonly Still[] = [
  still("wedding-toast"),
  still("wedding-golden", 4, 5),
  still("reception-table"),
  still("wedding-petals"),
  still("wedding-rings", 1, 1),
  still("reception-hall"),
  still("wedding-arch", 3, 4),
  still("party-dj"),
  still("festival-lights", 4, 3),
  still("concert-confetti"),
  still("party-balloons", 4, 5),
  still("festival-crowd"),
];

export const photoAt = (i: number): Still => PHOTOS[i % PHOTOS.length]!;

export const coverOf = (id: string): string => marketingImage(id).src;

/**
 * HER DRIVE'S FOLDER, as the send names it (the design note: when it reached
 * the album, in her time zone, then who sent it; a second in the same second
 * takes " (2)"). The guests are typed names, as her album names them.
 */
export const FILES = [
  { at: "2026-09-12 16.02.44", who: "Priya", ext: "jpg", bytes: 4.2, kind: "photo" },
  { at: "2026-09-12 16.02.51", who: "Priya", ext: "jpg", bytes: 3.9, kind: "photo" },
  { at: "2026-09-12 16.40.12", who: "Maya", ext: "heic", bytes: 2.8, kind: "photo" },
  { at: "2026-09-12 17.15.03", who: "Theo", ext: "mov", bytes: 61.4, kind: "clip" },
  { at: "2026-09-12 18.27.30", who: "Sam", ext: "jpg", bytes: 5.1, kind: "photo" },
  { at: "2026-09-12 19.48.09", who: "Jo", ext: "jpg", bytes: 4.6, kind: "photo" },
  { at: "2026-09-12 21.14.05", who: "Priya", ext: "jpg", bytes: 4.4, kind: "photo" },
  { at: "2026-09-12 21.14.05", who: "Priya", ext: "jpg", bytes: 4.3, kind: "photo", second: true },
  { at: "2026-09-12 22.06.58", who: "Ade", ext: "jpg", bytes: 3.7, kind: "photo" },
  { at: "2026-09-12 23.30.21", who: "Sam", ext: "mp4", bytes: 48.2, kind: "clip" },
  { at: "2026-09-13 09.12.40", who: "Jo", ext: "jpg", bytes: 4.0, kind: "photo" },
] as const;

/** The short ids the zip's names carry (the first 8 of each media id). */
export const SHORT_IDS = [
  "0b7c21fa", "1e94d3a2", "2c5f8e10", "3a1d77c4", "4f0e2b96", "5d8a14ce",
  "6b3c90f1", "7e2a58d3", "8c41f07a", "9a6e3d25", "a3f7c1e8",
] as const;
