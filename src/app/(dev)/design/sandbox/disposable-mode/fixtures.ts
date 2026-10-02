import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, THE DESK'S OWN, SHOT ON A DISPOSABLE (Maya and Jay's, hosted by
 * Maya, 14 June), and the guest the guest boards already follow: Priya, with
 * a confirmed email.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every guest board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * another board's fixtures would tie this board's life to a folder it does
 * not own.
 *
 * ★ TWO MOMENTS, NEVER TWO WORLDS. The party at 10:40 pm (142 shots from 12
 * guests, Priya six into her 24) and the morning after (214 shots from 14
 * guests, developed at 9 am). Every decision draws one of the two, so a flip
 * between options moves the thing asked and nothing else.
 *
 * ★ THE STILLS ARE THE TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible 9:
 * no new asset, nothing to track the rights of), at their own ratios. Each
 * one stands in for the live camera's picture or for a developed shot, and
 * together they are the look's test set: real party photographs in twelve
 * different lights (`LOOK_SET`).
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  /** The date a disposable prints on every frame: 'YY M D. */
  stamp: "'26 6 14",
} as const;

export const PRIYA = { name: "Priya", seed: "dm-priya" } as const;

/** The roll, as settled: 24 shots each, developed at 9 the next morning. */
export const ROLL = {
  shots: 24,
  develops: "9 am",
} as const;

/** 10:40 pm at the party. */
export const PARTY = {
  time: "10:40 pm",
  shots: 142,
  guests: 12,
  /** Priya's own, so far. */
  hers: 6,
  /** Until 9 am, from 10:40 pm. */
  until: "10 h 20 min",
} as const;

/** Her shots left at 10:40 pm. */
export const LEFT = ROLL.shots - PARTY.hers;

/** The morning after, once it has developed. */
export const MORNING = {
  time: "9:02 am",
  shots: 214,
  guests: 14,
} as const;

/* ── the stills ──────────────────────────────────────────────────────────── */

/** A still, by its marketing id, as the rows and the cameras draw it. */
export type Still = { id: string; src: string; width: number; height: number };

const still = (id: string): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, width: m.width, height: m.height };
};

/** What the camera is pointed at: the toast under the string lights. */
export const SCENE = still("wedding-toast");

/** Her next subject, framed the moment after (the dance floor). */
export const NEXT_SCENE = still("party-dj");

/**
 * PRIYA'S SIX, newest first, each with the minute it was taken. One of them
 * is a video on a paid event (`video`), which the video decisions draw.
 */
export type Shot = {
  id: string;
  still: Still;
  time: string;
  /** Seconds, for a video. */
  video?: number;
};

export const HER_SHOTS: readonly Shot[] = [
  { id: "s6", still: still("wedding-petals"), time: "10:33" },
  { id: "s5", still: still("reception-table"), time: "10:18" },
  { id: "s4", still: still("party-dj"), time: "9:55", video: 6 },
  { id: "s3", still: still("wedding-rings"), time: "9:20" },
  { id: "s2", still: still("party-balloons"), time: "8:47" },
  { id: "s1", still: still("wedding-arch"), time: "8:12" },
];

/* ── the night, shot by shot ─────────────────────────────────────────────── */

/**
 * EVERY SHOT OF THE PARTY'S 142, in the order it landed: its minute (after
 * 7 pm), and whether it is Priya's. What a waiting room may know of a shot
 * that is not hers is exactly this (a place in the count and a minute), so
 * the rooms that draw the whole party draw it from here and from nothing
 * else.
 *
 * ★ SEEDED, SO THE NIGHT IS THE SAME NIGHT ON EVERY DRAW: the toasts at 9:15,
 * the first dance at 9:50 and the floor filling from 10:15 are where the
 * shots bunch, and Priya's six sit at their own minutes.
 */
export type NightShot = {
  n: number;
  /** Minutes after 7 pm. */
  minute: number;
  mine: boolean;
};

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How busy each minute of the night is, 7:30 pm to 10:40 pm. */
function busy(m: number): number {
  const bump = (c: number, w: number, h: number) =>
    h * Math.exp(-((m - c) ** 2) / (2 * w * w));
  return (
    0.3 +
    bump(45, 12, 1.1) + // the drinks, 7:45
    bump(135, 7, 2.4) + // the toasts, 9:15
    bump(170, 6, 2.8) + // the first dance, 9:50
    bump(214, 16, 2.1) // the floor, from 10:15
  );
}

/** Priya's six, at their minutes after 7 pm (8:12, 8:47, 9:20, 9:55, 10:18, 10:33). */
const HER_MINUTES = [72, 107, 140, 175, 198, 213];

/** The minute the last shot landed: 10:40 pm, just now. */
const NOW = 220;

function night(): NightShot[] {
  const rand = seeded(1406);
  const from = 30;
  const weights = Array.from({ length: NOW - from }, (_, i) => busy(from + i));
  const total = weights.reduce((a, b) => a + b, 0);
  const others = PARTY.shots - HER_MINUTES.length - 1;
  const minutes: { minute: number; mine: boolean }[] = [];
  for (let k = 0; k < others; k++) {
    let r = rand() * total;
    let i = 0;
    while (i < weights.length - 1 && r > weights[i]) r -= weights[i++];
    minutes.push({ minute: from + i, mine: false });
  }
  for (const m of HER_MINUTES) minutes.push({ minute: m, mine: true });
  minutes.sort((a, b) => a.minute - b.minute);
  minutes.push({ minute: NOW, mine: false });
  return minutes.map((s, i) => ({ n: i + 1, ...s }));
}

export const NIGHT: readonly NightShot[] = night();

/** "10:33", from minutes after 7 pm. */
export const clockOf = (minute: number) => {
  const h = 7 + Math.floor(minute / 60);
  const m = minute % 60;
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")}`;
};

/* ── the look's test set ─────────────────────────────────────────────────── */

/**
 * TWELVE REAL PARTY PHOTOGRAPHS IN TWELVE LIGHTS, the set a look is judged
 * on (Will's r2 `save` note: "feels like filters are going to make the
 * majority of guest photos worse that don't match the palette well"). Each
 * is named by its light, never by its subject, since the light is what a
 * look has to survive. The dock's Try your photos swaps in any photographs
 * on the reader's own device.
 */
export type LitStill = Still & { light: string };

const lit = (id: string, light: string): LitStill => ({ ...still(id), light });

export const LOOK_SET: readonly LitStill[] = [
  lit("wedding-toast", "String lights"),
  lit("party-dj", "A club's lights"),
  lit("reception-hall", "Daylight indoors"),
  lit("wedding-golden", "Golden hour"),
  lit("concert-confetti", "Blue stage light"),
  lit("party-balloons", "Pastel daylight"),
  lit("festival-lights", "Lasers"),
  lit("wedding-arch", "Overcast sky"),
  lit("festival-crowd", "A warm stage"),
  lit("wedding-rings", "Soft daylight"),
  lit("reception-table", "Window light"),
  lit("wedding-petals", "Open shade"),
];
