import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, TWO ALBUMS THAT HOLD PHOTOS BACK (Maya and Jay's, hosted by
 * Maya, Saturday 10 October), and the guest the guest boards follow: Priya.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A board's
 * folder is deleted the day it retires, so this board never reads another's
 * fixtures: the night's generator below is ported from `disposable-mode`'s,
 * whose folder `disposable-camera` deletes when it wires the camera.
 *
 * ★ THE TWO ALBUMS ARE THE TWO WAYS PHOTOS WAIT (`lib/disposable/reveal.ts`):
 *  - HELD: free uploads, held for Maya's approval. At 10:40 pm she has let
 *    nothing in yet (she is dancing): 38 wait from 9 guests, Priya's three
 *    among them, her third landing as the frame is drawn. This is the album
 *    Will walked into, the one that "vanished back to the empty state".
 *  - DEVELOPING: the album's camera, developing at 9 am. At 10:40 pm 142
 *    shots from 12 guests are sealed, Priya six into her 24.
 * Then the arrivals: 11:20 pm, when Maya lets 24 of the held in from her
 * phone, and 9 am, when the roll develops (214 shots from 14 guests).
 *
 * ★ WHAT A GUEST MAY KNOW OF ANYONE ELSE'S PHOTO IS A NUMBER AND A MINUTE
 * (`album_changes_since`'s `waiting: {count, minutes}`, never an id). Every
 * drawing of everyone's waiting photos is drawn from `NIGHT_*` below and from
 * nothing else; only Priya's own carry a picture.
 *
 * ★ THE STILLS ARE THE MARKETING PHOTOGRAPHS EVERY BOARD REUSES (bible 9: no
 * new asset, nothing to track the rights of).
 */

export const EVENT = {
  name: "Maya & Jay",
  date: "2026-10-10",
  note: "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
  link: "partyreel.com/e/maya-and-jay",
} as const;

export const MAYA = { name: "Maya", seed: "tw-maya" } as const;
export const PRIYA = { name: "Priya", seed: "tw-priya" } as const;

/** The develop time, as the album says it, and the wait from 10:40 pm. */
export const DEVELOP = { at: "9 am", until: "10 h 20 min" } as const;

/** The camera's roll (the server's count). */
export const ROLL = 24;

/* ── the stills ──────────────────────────────────────────────────────────── */

export type Still = { id: string; src: string; w: number; h: number };

export const still = (id: string): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, w: m.width, h: m.height };
};

/** Every party photograph the board draws a developed album from, in an order that mixes the rooms. */
export const PARTY_STILLS: readonly Still[] = [
  "wedding-toast",
  "party-dj",
  "wedding-golden",
  "reception-table",
  "festival-lights",
  "wedding-rings",
  "party-balloons",
  "wedding-arch",
  "concert-confetti",
  "wedding-petals",
  "reception-hall",
  "festival-crowd",
].map(still);

/** One of hers: its picture, the minute she took it, and whether it is a video. */
export type Shot = {
  id: string;
  still: Still;
  time: string;
  /** Minutes after 7 pm, where the night's drawings place it. */
  minute: number;
  /** A video's seconds. */
  video?: number;
};

const shot = (
  id: string,
  stillId: string,
  time: string,
  minute: number,
  video?: number,
): Shot => ({ id, still: still(stillId), time, minute, video });

/* ── the night, shot by shot ─────────────────────────────────────────────── */

/** One photo of the night: its place in the count, its minute after 7 pm, and whether it is hers. */
export type NightShot = { n: number; minute: number; mine: boolean };

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

/** How busy each minute of the night is: the drinks, the toasts at 9:15, the first dance at 9:50, the floor. */
function busy(m: number): number {
  const bump = (c: number, w: number, h: number) =>
    h * Math.exp(-((m - c) ** 2) / (2 * w * w));
  return (
    0.3 +
    bump(45, 12, 1.1) +
    bump(135, 7, 2.4) +
    bump(170, 6, 2.8) +
    bump(214, 16, 2.1)
  );
}

/** 10:40 pm, in minutes after 7 pm: now. */
export const NOW = 220;

/**
 * A NIGHT OF `total` PHOTOS, SEEDED (the same night on every draw): the
 * others' minutes fall where the party bunched, hers sit at their own, and the
 * last lands at `last` (10:40 pm, just now).
 */
function night(
  seed: number,
  total: number,
  hers: readonly number[],
  last = NOW,
  lastMine = false,
): NightShot[] {
  const rand = seeded(seed);
  const from = 30;
  const weights = Array.from({ length: last - from }, (_, i) => busy(from + i));
  const sum = weights.reduce((a, b) => a + b, 0);
  const others = total - hers.length - (lastMine ? 0 : 1);
  const minutes: { minute: number; mine: boolean }[] = [];
  for (let k = 0; k < others; k++) {
    let r = rand() * sum;
    let i = 0;
    while (i < weights.length - 1 && r > weights[i]) r -= weights[i++];
    minutes.push({ minute: from + i, mine: false });
  }
  for (const m of hers) minutes.push({ minute: m, mine: true });
  minutes.sort((a, b) => a.minute - b.minute);
  if (!lastMine) minutes.push({ minute: last, mine: false });
  return minutes.map((s, i) => ({ n: i + 1, ...s }));
}

/* ── the held album: free uploads, held for Maya ─────────────────────────── */

/** Priya's three, newest first: the third lands at 10:40 pm as the frame is drawn. */
export const HELD_HERS: readonly Shot[] = [
  shot("h3", "wedding-toast", "10:40", 220),
  shot("h2", "party-dj", "9:55", 175),
  shot("h1", "party-balloons", "8:47", 107),
];

export const HELD = {
  time: "10:40 pm",
  /** Everyone's waiting, hers included (the sync's own count). */
  waiting: 38,
  guests: 9,
  /** Let in so far: none, Maya is dancing. */
  inAlbum: 0,
} as const;

export const NIGHT_HELD: readonly NightShot[] = night(
  2210,
  HELD.waiting,
  HELD_HERS.map((s) => s.minute),
  NOW,
  true,
);

/** 11:20 pm: Maya lets 24 in from her phone; three more landed since 10:40. */
export const TRICKLE = {
  time: "11:20 pm",
  letIn: 24,
  waiting: 38 + 3 - 24,
  /** Of Priya's three, the two Maya let in (ids), and the one that still waits. */
  hersIn: ["h1", "h2"] as readonly string[],
} as const;

/* ── the developing album: the camera, developing at 9 am ────────────────── */

/** Priya's six of 24, newest first (one a six-second video). */
export const DEV_HERS: readonly Shot[] = [
  shot("d6", "wedding-petals", "10:33", 213),
  shot("d5", "reception-table", "10:18", 198),
  shot("d4", "party-dj", "9:55", 175, 6),
  shot("d3", "wedding-rings", "9:20", 140),
  shot("d2", "party-balloons", "8:47", 107),
  shot("d1", "wedding-arch", "8:12", 72),
];

export const DEV = {
  time: "10:40 pm",
  waiting: 142,
  guests: 12,
  inAlbum: 0,
} as const;

export const NIGHT_DEV: readonly NightShot[] = night(
  1406,
  DEV.waiting,
  DEV_HERS.map((s) => s.minute),
);

/** 9 am the morning after: the roll developed. */
export const MORNING = {
  time: "9:00 am",
  shots: 214,
  guests: 14,
  hers: 9,
} as const;

/** Priya's nine by the end of the night, newest first: the six, then three more after 10:40. */
export const MORNING_HERS: readonly Shot[] = [
  shot("d9", "festival-crowd", "12:20", 320),
  shot("d8", "concert-confetti", "11:40", 280),
  shot("d7", "festival-lights", "11:05", 245),
  ...DEV_HERS,
];

/** The whole night the roll developed from, its last photo at 12:30 am. */
export const NIGHT_MORNING: readonly NightShot[] = night(
  3141,
  MORNING.shots,
  MORNING_HERS.map((s) => s.minute),
  330,
);

/** The album's photographs once they arrive, repeated to a real album's depth. */
export function albumStills(n: number, offset = 0): Still[] {
  return Array.from(
    { length: n },
    (_, i) => PARTY_STILLS[(i + offset) % PARTY_STILLS.length]!,
  );
}

/** Five-minute bins of a night: how many photos landed in each, and how many were hers. */
export function binsOf(
  shots: readonly NightShot[],
  size = 5,
): { minute: number; n: number; mine: number }[] {
  const bins = new Map<number, { n: number; mine: number }>();
  for (const s of shots) {
    const b = Math.floor(s.minute / size) * size;
    const cur = bins.get(b) ?? { n: 0, mine: 0 };
    cur.n += 1;
    if (s.mine) cur.mine += 1;
    bins.set(b, cur);
  }
  return [...bins.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, v]) => ({ minute, ...v }));
}

/** A minute after 7 pm as the night reads it: "9:55 pm". */
export function clockOf(minute: number): string {
  const h = 7 + Math.floor(minute / 60);
  const m = minute % 60;
  const hh = h > 12 ? h - 12 : h;
  return `${hh}:${String(m).padStart(2, "0")} ${h >= 12 ? "am" : "pm"}`;
}
