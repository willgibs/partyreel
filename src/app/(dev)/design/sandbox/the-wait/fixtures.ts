import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, ONE ROLL: Maya and Jay's, Saturday 10 October, on the album's
 * camera (Disposable), developing at 9 am on Sunday. The roll is 214 shots
 * from 14 guests; Priya, the guest the guest boards follow, shot nine of hers.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A board's
 * folder is deleted the day it retires, so this board reads no other board's
 * fixtures; the night's generator is round one's, ported.
 *
 * ★ THE NIGHT IS ONE LIST, IN THE ORDER IT WAS SHOT (`ROLL`), and every drawing
 * reads it: the contact sheet lays it out with production's own layout
 * (`layoutSheet`, the sync's count and its minutes), and the album lays the
 * same photographs newest first with production's rows engine. So a square and
 * the tile it grows into are one photograph, and the sheet and the album can
 * never disagree about the night.
 *
 * ★ THE PICTURES ARE THE STAND-INS EVERY BOARD REUSES (bible 9: no new asset,
 * nothing to track the rights of): the twelve marketing stills, and the nine
 * small party photographs of the guest ghost pack (Settings' album styles draw
 * them) for older squares only, where a photograph is a few pixels across. The
 * newest, which the album's first screens show large, are stills.
 */

export const EVENT = {
  name: "Maya & Jay",
  date: "2026-10-10",
  note: "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
} as const;

export const MAYA = { name: "Maya", seed: "tw-maya" } as const;
export const PRIYA = { name: "Priya", seed: "tw-priya" } as const;

/* ── the clock ───────────────────────────────────────────────────────────── */

/** Saturday 7 pm, the night's first minute, in the reader's own zone (as a guest's page reads it). */
const NIGHT_START = new Date(2026, 9, 10, 19, 0).getTime();

/** The develop time: 9 am on Sunday. */
export const DEVELOPS_AT = new Date(2026, 9, 11, 9, 0).toISOString();

/** Sunday 9:40 am: her first open after the develop, over breakfast. */
export const FIRST_OPEN_MS = new Date(2026, 9, 11, 9, 40).getTime();

/** Monday 8:10 pm: her second open, a day later. */
export const SECOND_OPEN_MS = new Date(2026, 9, 12, 20, 10).getTime();

/** A minute of the night as an instant. */
export const minuteAt = (minute: number) => NIGHT_START + minute * 60_000;

/* ── the pictures ────────────────────────────────────────────────────────── */

export type Picture = { id: string; src: string; w: number; h: number };

const still = (id: string): Picture => {
  const m = marketingImage(id);
  return { id, src: m.src, w: m.width, h: m.height };
};

/** The marketing stills, in an order that mixes the rooms. */
export const STILLS: readonly Picture[] = [
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

/** The guest ghost pack's small party photographs (240 by 160): only ever a square's picture. */
const GHOSTS: readonly Picture[] = Array.from({ length: 9 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: `ghost-${n}`, src: `/guest-ghost/g${n}.webp`, w: 240, h: 160 };
});

/* ── the night ───────────────────────────────────────────────────────────── */

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

/** How busy each minute is: the drinks, the toasts at 9:15, the first dance at 9:50, the floor till late. */
function busy(m: number): number {
  const bump = (c: number, w: number, h: number) =>
    h * Math.exp(-((m - c) ** 2) / (2 * w * w));
  return (
    0.3 +
    bump(45, 12, 1.1) +
    bump(135, 7, 2.4) +
    bump(170, 6, 2.8) +
    bump(214, 16, 2.1) +
    bump(290, 22, 1.4)
  );
}

/** One photograph of the roll. */
export type Photo = {
  /** Its id, and her shot's key on the sheet (`HerShot.key`). */
  id: string;
  /** Its place in the night, from 0 (the first shot) to 213. */
  n: number;
  /** Minutes after 7 pm on Saturday. */
  minute: number;
  /** When it was taken, epoch ms (its minute's start: the sync counts by the minute). */
  at: number;
  mine: boolean;
  picture: Picture;
  /** Width over height, as the camera shot it: 3:4 held upright, 4:3 on its side. */
  ratio: number;
  /** Where the picture sits in its box, so a still reused reads as another moment. */
  focus: string;
  /** A video's seconds. */
  video?: number;
};

export const ROLL_SIZE = { shots: 214, guests: 14 } as const;

/** Priya's nine, oldest first: the minute, the still, a video's seconds. */
const HERS: readonly { minute: number; still: string; video?: number }[] = [
  { minute: 72, still: "wedding-arch" },
  { minute: 107, still: "party-balloons" },
  { minute: 140, still: "wedding-rings" },
  { minute: 175, still: "party-dj", video: 6 },
  { minute: 198, still: "reception-table" },
  { minute: 213, still: "wedding-petals" },
  { minute: 245, still: "festival-lights" },
  { minute: 280, still: "concert-confetti" },
  { minute: 320, still: "festival-crowd" },
];

/** The night's last minute: 12:30 am. */
const LAST = 330;

/** The newest this many are stills (the album's first screens draw them large). */
const NEWEST_AS_STILLS = 48;

const FOCI = ["50% 50%", "30% 50%", "70% 45%", "50% 35%", "40% 60%", "62% 55%"];

/**
 * THE ROLL, IN THE ORDER IT WAS SHOT. Everyone's minutes fall where the party
 * bunched, hers at her own; within one minute hers come first, which is where
 * `layoutSheet` places hers among a minute's squares, so the list and the sheet
 * read the night the same way.
 */
export const ROLL: readonly Photo[] = (() => {
  const rand = seeded(1406);
  const from = 30;
  const weights = Array.from({ length: LAST - from }, (_, i) => busy(from + i));
  const sum = weights.reduce((a, b) => a + b, 0);
  const others = ROLL_SIZE.shots - HERS.length - 1;
  type Raw = {
    minute: number;
    mine: boolean;
    still?: string;
    video?: number;
  };
  const raw: Raw[] = [];
  for (let k = 0; k < others; k++) {
    let r = rand() * sum;
    let i = 0;
    while (i < weights.length - 1 && r > weights[i]) r -= weights[i++];
    raw.push({ minute: from + i, mine: false });
  }
  for (const h of HERS)
    raw.push({ minute: h.minute, mine: true, still: h.still, video: h.video });
  raw.push({ minute: LAST, mine: false });
  raw.sort((a, b) => a.minute - b.minute || Number(b.mine) - Number(a.mine));

  const total = raw.length;
  let lastStill = -1;
  return raw.map((r, n): Photo => {
    const newest = total - 1 - n < NEWEST_AS_STILLS;
    let picture: Picture;
    if (r.still) picture = still(r.still);
    else if (newest || rand() < 0.45) {
      // A still, never the one just before it.
      let s = Math.floor(rand() * STILLS.length);
      if (s === lastStill) s = (s + 1) % STILLS.length;
      lastStill = s;
      picture = STILLS[s]!;
    } else picture = GHOSTS[Math.floor(rand() * GHOSTS.length)]!;
    const upright = r.mine ? r.minute % 3 !== 0 : rand() < 0.68;
    return {
      id: r.mine ? `hers-${r.minute}` : `p${String(n).padStart(3, "0")}`,
      n,
      minute: r.minute,
      at: minuteAt(r.minute),
      mine: r.mine,
      picture,
      ratio: upright ? 3 / 4 : 4 / 3,
      focus: FOCI[Math.floor(rand() * FOCI.length)]!,
      video: r.video,
    };
  });
})();

/** The album's order: newest first, as the guest's album lays it. */
export const ALBUM: readonly Photo[] = [...ROLL].reverse();

/** Her own, oldest first. */
export const HERS_ON_ROLL: readonly Photo[] = ROLL.filter((p) => p.mine);

/** The cover's photographs: the reel's opening, six of the roll's brightest moments. */
export const COVER_STILLS: readonly Picture[] = [
  "wedding-petals",
  "wedding-toast",
  "party-dj",
  "wedding-golden",
  "concert-confetti",
  "reception-hall",
].map(still);

/** The premiere's opening frames (the reel's take, its first pass), in the order it plays them. */
export const PREMIERE_FRAMES: readonly Picture[] = [
  "wedding-petals",
  "wedding-toast",
  "party-dj",
  "wedding-rings",
  "concert-confetti",
].map(still);
