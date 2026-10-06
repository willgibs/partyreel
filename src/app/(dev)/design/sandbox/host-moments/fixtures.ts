import { marketingImage } from "@/lib/constants/marketing-media";
import { GIGABYTE } from "@/lib/constants/tiers";

/**
 * ONE HOST, ONE WEDDING, FOUR MOMENTS OF ITS RUN: Maya & Jay's wedding (the
 * site's own fictional album, the one every board follows), tonight, with 31
 * guests in and three people waiting at the door; and Maya's storage the
 * month after, over her plan.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so its fixtures are retyped here.
 *
 * ★ THE PARTY IS TONIGHT, WHATEVER DAY THE BOARD IS OPENED: its date is
 * today and its develop is 9 am tomorrow (production's own default,
 * `defaultDevelopAt`), so every line production says about it reads as the
 * night itself ("Develops tomorrow at 9:00 AM").
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset).
 */

/* ── the host and her party ───────────────────────────────────────────── */

export const HOST = {
  name: "Maya",
  email: "maya@example.com",
  seed: "host-moments-maya",
} as const;

/** Today as the calendar prints it (`YYYY-MM-DD`), in the reader's clock. */
function dayFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** An instant on a day from today, at an hour and minute of the reader's clock. */
function at(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const EVENT = {
  id: "8d6c5b4a-3f2e-4d1c-9b8a-7f6e5d4c3b2a",
  name: "Maya & Jay's Wedding",
  date: dayFromToday(0),
  joinUrl: "https://partyreel.com/e/maya-and-jay",
  qrStyle: "classic",
} as const;

/** The night's clock: 9:40 pm, the dancing, when every moment of the party is drawn. */
export const TONIGHT = at(0, 21, 40);

/** The develop she adds mid-party: 9 am tomorrow, production's default. */
export const DEVELOPS_AT = at(1, 9).toISOString();

/** Who is in, and who waits, the night of the party. */
export const PARTY = { in: 31, waiting: 3 } as const;

/** Her guests' camera: a roll of 24, and how far into it Priya is when the develop time lands. */
export const ROLL = { size: 24, priyaUsed: 19 } as const;

/* ── people ───────────────────────────────────────────────────────────── */

export type Person = {
  name: string;
  email: string;
  seed: string;
  asked: string;
};

/** The three at the door, oldest ask first, as At the door lists them. */
export const AT_THE_DOOR: readonly Person[] = [
  {
    name: "Sam Okafor",
    email: "sam.okafor@example.com",
    seed: "hm-sam",
    asked: "12 minutes ago",
  },
  {
    name: "Lena",
    email: "lena.w@example.com",
    seed: "hm-lena",
    asked: "6 minutes ago",
  },
  {
    name: "Dev Kapoor",
    email: "dev.k@example.com",
    seed: "hm-dev",
    asked: "2 minutes ago",
  },
];

/** The one she declines: the newest ask, someone neither of them knows. */
export const DECLINED = AT_THE_DOOR[2]!;

/** A few of the 31 in, as the room's list draws them. */
export const GUESTS: readonly { name: string; seed: string }[] = [
  { name: "Priya", seed: "hm-priya" },
  { name: "Theo", seed: "hm-theo" },
  { name: "Ade", seed: "hm-ade" },
  { name: "Jo", seed: "hm-jo" },
  { name: "Rosa", seed: "hm-rosa" },
  { name: "Ben", seed: "hm-ben" },
];

export const PRIYA = GUESTS[0]!;

/* ── storage, the month after ─────────────────────────────────────────── */

/** Production's own unit: every storage figure is counted in it (`formatBytes`). */
const GB = GIGABYTE;

/** Her plan and what she stores against it: Pro 100 GB, 105.25 GB stored (5.3 GB over, as production rounds a gap up), 1.8 GB of it in Deleted. */
export const STORAGE = {
  plan: "Pro 100 GB",
  capBytes: 100 * GB,
  storedBytes: Math.round(105.25 * GB),
  deletedBytes: Math.round(1.8 * GB),
  /** The grace's last day, as the banner prints it. */
  deadline: "November 5",
} as const;

export const OVER_BYTES = STORAGE.storedBytes - STORAGE.capBytes;

/** Her largest items, largest first, as What's using space lists them (videos lead). */
export const LARGEST: readonly {
  id: string;
  kind: "video" | "photo";
  bytes: number;
  album: string;
  by: string;
  length?: string;
}[] = [
  {
    id: "v1",
    kind: "video",
    bytes: 1.42 * GB,
    album: EVENT.name,
    by: "Theo",
    length: "11:48",
  },
  {
    id: "v2",
    kind: "video",
    bytes: 1.18 * GB,
    album: EVENT.name,
    by: "Ade",
    length: "9:52",
  },
  {
    id: "v3",
    kind: "video",
    bytes: 0.96 * GB,
    album: "Jay's 40th",
    by: "You",
    length: "8:01",
  },
  {
    id: "v4",
    kind: "video",
    bytes: 0.71 * GB,
    album: EVENT.name,
    by: "Priya",
    length: "5:57",
  },
  {
    id: "v5",
    kind: "video",
    bytes: 0.64 * GB,
    album: "Jay's 40th",
    by: "Jo",
    length: "5:20",
  },
  {
    id: "v6",
    kind: "video",
    bytes: 0.52 * GB,
    album: EVENT.name,
    by: "Rosa",
    length: "4:21",
  },
  {
    id: "v7",
    kind: "video",
    bytes: 0.41 * GB,
    album: EVENT.name,
    by: "Ben",
    length: "3:25",
  },
  { id: "p1", kind: "photo", bytes: 0.048 * GB, album: EVENT.name, by: "Theo" },
];

/* ── the stills ───────────────────────────────────────────────────────── */

export type Photo = { id: string; src: string; ratio: number; focus: string };

const photo = (id: string, focus = "50% 50%"): Photo => {
  const m = marketingImage(id);
  return { id, src: m.src, ratio: m.width / m.height, focus };
};

/** The wedding night in order, the arch to the last dance. */
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
];

/** The camera's live picture at 9:40 pm: the toast under the string lights. */
export const IN_THE_FINDER = NIGHT[6]!;
