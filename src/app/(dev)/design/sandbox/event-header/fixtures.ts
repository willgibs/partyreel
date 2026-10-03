import type { HeadStill } from "@/components/guest/event-experience-head";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";

/**
 * ONE WEDDING, FROM THE HOST'S SIDE OF ITS CODE: Maya and Jay's, the party
 * every head board stands at, so the hub drawn here is the hub production
 * draws for it (`dashboard/[eventId]/page.tsx`) with its photographs, its
 * door and its night.
 *
 * Two moments, because a hub is judged at both ends of its life:
 *  - TONIGHT the party is live: 214 photos from 31 guests, the code opened 486
 *    times, 8 uploads held in Review and 2 people at the door (Maya lets each
 *    newcomer in herself), the reel playing;
 *  - THE WEEK BEFORE nothing is in the album, the code was never opened, and
 *    the checklist stands at the head of the hub (production's own).
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD: a board's folder
 * leaves whole when it retires. NOTHING HERE IS A REAL PERSON, and every
 * photograph is one of the bootstrap stills every board reuses (bible 9: no
 * new asset, nothing to track). The copy is placeholder, judged for size and
 * wrapping only.
 */

export const EVENT = {
  name: "Maya & Jay",
  /** `formatEventDate` reads it as production's head does. */
  date: "2026-09-12",
  description:
    "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
  /** What every code encodes (the permanent link a printed card carries). */
  joinUrl: "https://partyreel.com/e/9f3c2a71d84b4e06a1c5b8e2f0d97c31",
  /** What a host reads: her claimed slug. */
  prettyUrl: "https://partyreel.com/e/maya-and-jay",
  qrStyle: "classic",
} as const;

export const HOST = {
  name: "Maya",
  fullName: "Maya Alvarez",
  email: "maya@example.com",
  seed: "eh-maya",
} as const;

export type Still = { src: string; w: number; h: number };

const still = (
  id: Parameters<typeof marketingImage>[0],
  w?: number,
  h?: number,
): Still => {
  const m = marketingImage(id);
  return { src: m.src, w: w ?? m.width, h: h ?? m.height };
};

/**
 * THE ALBUM, NEWEST FIRST: mostly 3:2, the declared ratios varied as a real
 * party's are, so the rows read as an album rather than a contact sheet.
 */
export const ALBUM: readonly Still[] = [
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
  still("wedding-golden"),
  still("wedding-toast", 3, 4),
  still("reception-hall", 1, 1),
  still("wedding-arch"),
  still("reception-table", 4, 5),
  still("wedding-rings"),
];

/**
 * THE COVER'S PHOTOGRAPHS: the reel's opening stills, which is the rule the
 * hub's cover reads while the reel plays (`event-hub-head-stills.ts`), in the
 * shape production's head takes them (`HeadStill`).
 */
export const COVER: readonly HeadStill[] = [
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
].map((id) => ({ id, tile: marketingImage(id).src }));

/** The same stills as plain sources, for a picture that dissolves through them. */
export const REEL: readonly string[] = COVER.map((s) => s.tile);

/* ── the moments ──────────────────────────────────────────────────────────── */

export type Moment = "tonight" | "before";

export type HostFacts = {
  photos: number;
  guests: number;
  /** The code's opens and the album's views: production's "views" (`linkStats`). */
  views: number;
  /** People at the door waiting for her yes. */
  waiting: number;
  /** Uploads held in Review. */
  review: number;
  door: Door;
  reel: "live" | "short";
  /** How many photos the reel can play of the two it starts from. */
  reelHave: number;
  /** The days until the event's date (0 tonight). */
  daysToGo: number;
  /** The checklist's facts (`lib/events/readiness.ts`), as the server reads them. */
  ready: ReadyFacts;
};

const READY_BASE = {
  hasPassword: false,
  invited: 0,
  acceptingUploads: true,
  showReel: true,
  liveReelEnabled: true,
  eventDate: EVENT.date,
  description: EVENT.description,
  storagePct: 12,
} as const;

export const MOMENTS: Record<Moment, HostFacts> = {
  tonight: {
    photos: 214,
    guests: 31,
    views: 486,
    waiting: 2,
    review: 8,
    door: "approve",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: {
      ...READY_BASE,
      door: "approve",
      guestsIn: 31,
      approved: 214,
      playable: 2,
      opened: 486,
    },
  },
  // A Public album the week before: nothing in it, the code never opened, so
  // the checklist stands at the head (production's `list=head`).
  before: {
    photos: 0,
    guests: 0,
    views: 0,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "short",
    reelHave: 0,
    daysToGo: 6,
    ready: {
      ...READY_BASE,
      door: "open",
      guestsIn: 0,
      approved: 0,
      playable: 0,
      opened: 0,
    },
  },
};

/* ── the night ────────────────────────────────────────────────────────────── */

/** Minutes after midnight: the party's first photograph, and the frames' "now". */
export const NIGHT_FROM = 19 * 60 + 4;
export const NOW = 22 * 60 + 40;

/** How busy each minute of the night is: the drinks, dinner, the toasts, the first dance, the floor. */
function busy(m: number): number {
  const bump = (c: number, w: number, h: number) =>
    h * Math.exp(-((m - c) ** 2) / (2 * w * w));
  return (
    0.25 +
    bump(19 * 60 + 40, 14, 1.0) + // the drinks
    bump(20 * 60 + 20, 10, 0.55) + // dinner
    bump(20 * 60 + 55, 5, 2.3) + // the toasts
    bump(21 * 60 + 30, 4, 2.7) + // the first dance
    bump(22 * 60 + 8, 13, 1.7) + // the floor
    bump(22 * 60 + 33, 3, 1.5) // the last song before the cake
  );
}

/**
 * EVERY PHOTOGRAPH OF THE NIGHT AT ITS MINUTE, 214 of them, each placed at the
 * minute where its share of the night's busyness falls, so the same night is
 * drawn on every render and the busiest moments really are the tallest. A
 * host's real night is her album's own upload times, which every manifest
 * entry already carries in its order.
 */
export const NIGHT: readonly number[] = (() => {
  const minutes: number[] = [];
  const weights: number[] = [];
  let total = 0;
  for (let m = NIGHT_FROM; m <= NOW; m++) {
    const w = busy(m);
    weights.push(w);
    total += w;
  }
  const count = MOMENTS.tonight.photos;
  let acc = 0;
  let next = 0;
  for (let i = 0; i < weights.length && next < count; i++) {
    acc += weights[i];
    while (next < count && ((next + 0.5) / count) * total <= acc) {
      minutes.push(NIGHT_FROM + i);
      next++;
    }
  }
  return minutes;
})();

/**
 * The night as a line of `columns` heights, each the photographs within
 * `radius` minutes of its moment, weighed by how near (a soft window, so the
 * line reads as one breath of the party rather than a barcode of single
 * minutes, and a quiet stretch is low rather than empty).
 */
export function nightDensity(
  columns: number,
  radius: number,
): { at: number; n: number }[] {
  const span = NOW - NIGHT_FROM;
  return Array.from({ length: columns }, (_, i) => {
    const at = NIGHT_FROM + ((i + 0.5) / columns) * span;
    let n = 0;
    for (const m of NIGHT) {
      const d = Math.abs(m - at);
      if (d < radius) n += 1 - d / radius;
    }
    return { at, n };
  });
}

/** "7 pm", "10:40 pm": a minute after midnight as the dial and the strip say it. */
export function clock(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const half = h < 12 ? "am" : "pm";
  return m === 0
    ? `${h12} ${half}`
    : `${h12}:${String(m).padStart(2, "0")} ${half}`;
}

/* ── what waits in the rooms ──────────────────────────────────────────────── */

/** The 8 uploads held in Review tonight, newest first, each with who sent it. */
export const REVIEW: readonly { id: string; src: string; by: string }[] = [
  { id: "rv-1", src: still("party-dj").src, by: "Theo" },
  { id: "rv-2", src: still("wedding-petals").src, by: "Priya" },
  { id: "rv-3", src: still("festival-lights").src, by: "Theo" },
  { id: "rv-4", src: still("reception-table").src, by: "Sam" },
  { id: "rv-5", src: still("concert-confetti").src, by: "Lena" },
  { id: "rv-6", src: still("wedding-rings").src, by: "Priya" },
  { id: "rv-7", src: still("party-balloons").src, by: "Ade" },
  { id: "rv-8", src: still("wedding-golden").src, by: "Noor" },
];

/** The 2 people at the door tonight, waiting for Maya's yes. */
export const AT_THE_DOOR: readonly {
  name: string;
  seed: string;
  asked: string;
}[] = [
  { name: "Sam Okafor", seed: "eh-sam", asked: "Asked 3 min ago" },
  { name: "Lena Fischer", seed: "eh-lena", asked: "Asked 12 min ago" },
];

/** The guests the room lists first (of 31), each with what they added. */
export const GUESTS: readonly { name: string; seed: string; photos: number }[] =
  [
    { name: "Priya Shah", seed: "eh-priya", photos: 24 },
    { name: "Theo Martin", seed: "eh-theo", photos: 18 },
    { name: "Noor Haddad", seed: "eh-noor", photos: 15 },
    { name: "Ade Bello", seed: "eh-ade", photos: 12 },
    { name: "Grace Kim", seed: "eh-grace", photos: 11 },
    { name: "Jonah Reyes", seed: "eh-jonah", photos: 9 },
    { name: "Mila Novak", seed: "eh-mila", photos: 8 },
    { name: "Omar Said", seed: "eh-omar", photos: 7 },
  ];
