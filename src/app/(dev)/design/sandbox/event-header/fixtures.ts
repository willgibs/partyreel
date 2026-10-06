import type { HeadStill } from "@/components/guest/event-experience-head";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";

/**
 * MAYA AND JAY'S WEDDING, FROM THE HOST'S SIDE OF ITS CODE, AT THE FOUR
 * MOMENTS THE DOORS ARE DRAWN AT:
 *
 *  - TONIGHT the wedding is on: 214 photos from 31 guests, 8 uploads held in
 *    Review and 2 people at the door (every door has something in it);
 *  - AT ITS PEAK the floor is full: 140 uploads in Review and 12 at the door,
 *    so a badge reaches its cap ("99+") and a two-figure count stands;
 *  - THE WEEK BEFORE nothing is in the album, the checklist stands at the head
 *    of the hub (production's own) and Settings has steps left;
 *  - THE WEEK AFTER she has paused uploads: 236 photos, nothing waits, and
 *    Settings says Paused (the call G4), the code's corner its pause.
 *
 * ★ THE ALBUM'S ARRIVALS ARE DRAWN, NOT DESCRIBED: each photograph has the
 * minute it landed (`arrivals`), dealt from the night's busy moments by a
 * seeded generator, so the cover's strip draws the same album on every render.
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
 * THE WEDDING'S ALBUM, NEWEST FIRST: mostly 3:2, the declared ratios varied as
 * a real party's are, so the rows read as an album rather than a contact sheet.
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

const cover = (ids: readonly string[]): HeadStill[] =>
  ids.map((id) => ({ id, tile: marketingImage(id).src }));

/**
 * THE WEDDING'S COVER: the reel's opening stills, which is the rule the hub's
 * cover reads while the reel plays (`event-hub-head-stills.ts`), in the shape
 * production's head takes them (`HeadStill`).
 */
export const COVER: readonly HeadStill[] = cover([
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
]);

/** The same stills as plain sources, for a picture that dissolves through them. */
export const REEL: readonly string[] = COVER.map((s) => s.tile);

/* ── the arrivals ─────────────────────────────────────────────────────────── */

/** A seeded generator (mulberry32): the same album on every render. */
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

/**
 * A busy moment of an album: a minute it centres on (minutes from the album's
 * own first day, at midnight), how far either side it spreads, and how much
 * of the album lands in it.
 */
type Busy = { at: number; spread: number; weight: number };

/**
 * EVERY PHOTOGRAPH'S MINUTE, oldest first: drops (the photos one guest adds
 * with one press of Add, a few seconds apart) dealt into the album's busy
 * moments until the count is reached, never earlier than `from` or later than
 * `to`. A drop is one to a dozen photos, most of them small, as a real
 * album's are.
 */
function arrivalsOf(
  seed: number,
  count: number,
  moments: readonly Busy[],
  from: number,
  to: number,
): number[] {
  const rand = seeded(seed);
  const total = moments.reduce((s, m) => s + m.weight, 0);
  const normal = () => {
    // Box and Muller's pair, one half: a moment's drops gather round its centre.
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const out: number[] = [];
  while (out.length < count) {
    let pick = rand() * total;
    let m = moments[0];
    for (const x of moments) {
      pick -= x.weight;
      if (pick <= 0) {
        m = x;
        break;
      }
    }
    const at = Math.min(to, Math.max(from, m.at + normal() * m.spread));
    // Most drops are a photo or three; about one in six is a run of up to a dozen.
    const size = Math.min(
      count - out.length,
      rand() < 0.17 ? 6 + Math.floor(rand() * 7) : 1 + Math.floor(rand() * 3),
    );
    for (let i = 0; i < size; i++) out.push(Math.min(to, at + i * 0.12));
  }
  return out.sort((a, b) => a - b);
}

const DAY = 24 * 60;
const hm = (h: number, m = 0) => h * 60 + m;

/* ── the six albums ───────────────────────────────────────────────────────── */

/** The four moments the doors are drawn at. */
export type CaseId = "tonight" | "peak" | "before" | "after";

export type HostFacts = {
  photos: number;
  guests: number;
  /** People at the door waiting for her yes. */
  waiting: number;
  /** Uploads held in Review. */
  review: number;
  door: Door;
  reel: "live" | "short";
  /** How many photos the reel can play of the two it starts from. */
  reelHave: number;
  /** The days until the event's date (0 once it has come). */
  daysToGo: number;
  /**
   * From the day after the event's date the checklist steps aside and the
   * Settings door stops counting (production's `checklistOver`).
   */
  over: boolean;
  /** The checklist's facts (`lib/events/readiness.ts`), as the server reads them. */
  ready: ReadyFacts;
};

export type Case = HostFacts & {
  id: CaseId;
  /** The frame's own title: which moment. */
  title: string;
  name: string;
  /** Her claimed link's last part, read under the code. */
  slug: string;
  /** The event's day (or a range's first), or null where the host never set one. */
  date: string | null;
  /** A range's last day (`event-dates`, settled with him: days, never times). */
  end: string | null;
  /** While a range is on, which of its days today is. */
  day?: number;
  /** Photos landing now (the newest within a quarter of an hour): the head's lit state. */
  live: boolean;
  /** Every photograph's minute, oldest first (`photos` long). */
  arrivals: readonly number[];
  /** The cover's photographs. */
  stills: readonly HeadStill[];
  /** The album under the cover, newest first. */
  album: readonly Still[];
};

const READY_BASE = {
  hasPassword: false,
  invited: 0,
  acceptingUploads: true,
  showReel: true,
  liveReelEnabled: true,
  description: EVENT.description,
  storagePct: 12,
} as const;

const ready = (
  date: string | null,
  door: Door,
  guestsIn: number,
  approved: number,
  opened: number,
): ReadyFacts => ({
  ...READY_BASE,
  eventDate: date,
  door,
  guestsIn,
  approved,
  playable: Math.min(2, approved),
  opened,
});

const WEDDING = cover([
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
  "wedding-petals",
  "reception-table",
]);

/** The wedding night's arrivals: 7:04 pm to 10:40 pm, the drinks, dinner, the toasts, the first dance, the floor. */
const NIGHT = arrivalsOf(
  12,
  214,
  [
    { at: hm(19, 40), spread: 16, weight: 1 },
    { at: hm(20, 20), spread: 10, weight: 0.5 },
    { at: hm(20, 55), spread: 6, weight: 1.4 },
    { at: hm(21, 30), spread: 5, weight: 1.6 },
    { at: hm(22, 8), spread: 14, weight: 1.3 },
    { at: hm(22, 34), spread: 4, weight: 0.8 },
  ],
  hm(19, 4),
  hm(22, 40),
);

/** The week after: the night, then the stragglers' photos over the next days, until she paused uploads. */
const AFTER = [
  ...NIGHT,
  ...arrivalsOf(
    44,
    22,
    [
      { at: DAY + hm(11, 0), spread: 90, weight: 1 },
      { at: 2 * DAY + hm(20, 0), spread: 60, weight: 0.6 },
      { at: 4 * DAY + hm(13, 0), spread: 120, weight: 0.4 },
    ],
    DAY + hm(9, 0),
    5 * DAY,
  ),
].sort((a, b) => a - b);

export const CASES: Record<CaseId, Case> = {
  tonight: {
    id: "tonight",
    title: "Tonight, the party on",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: true,
    photos: 214,
    guests: 31,
    waiting: 2,
    review: 8,
    door: "approve",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    over: false,
    ready: ready(EVENT.date, "approve", 31, 214, 486),
    arrivals: NIGHT,
    stills: WEDDING,
    album: ALBUM,
  },
  peak: {
    id: "peak",
    title: "Tonight, at its peak",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: true,
    photos: 214,
    guests: 31,
    waiting: 12,
    review: 140,
    door: "approve",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    over: false,
    ready: ready(EVENT.date, "approve", 31, 214, 486),
    arrivals: NIGHT,
    stills: WEDDING,
    album: ALBUM,
  },
  before: {
    id: "before",
    title: "The week before",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: false,
    photos: 0,
    guests: 0,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "short",
    reelHave: 0,
    daysToGo: 6,
    over: false,
    ready: ready(EVENT.date, "open", 0, 0, 0),
    arrivals: [],
    stills: [],
    album: ALBUM,
  },
  after: {
    id: "after",
    title: "The week after, uploads paused",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: false,
    photos: 236,
    guests: 34,
    waiting: 0,
    review: 0,
    door: "approve",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    over: true,
    ready: {
      ...ready(EVENT.date, "approve", 34, 236, 612),
      acceptingUploads: false,
    },
    arrivals: AFTER,
    stills: WEDDING,
    album: ALBUM,
  },
};

/** The Moment knob's ids: the case each one draws. */
export type Moment = CaseId;

/* ── when the event is ───────────────────────────────────────────────────── */

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});
const MON = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day, at: new Date(Date.UTC(y, m - 1, day)) };
};

/**
 * THE EVENT'S DAYS AS THE HEAD SAYS THEM: "September 12, 2026" (production's
 * `formatEventDate`), a range in one line ("October 2–4, 2026", an en dash,
 * the month said once), and nothing at all where no date is set; in a hand,
 * the month short, so the line keeps to one line beside the code. A stand-in
 * for the formatter `event-dates` wires with the end date.
 */
export function whenOf(
  c: Pick<Case, "date" | "end">,
  short = false,
): string | null {
  if (!c.date) return null;
  const month = (d: Date) => (short ? MON : MONTH).format(d);
  const a = parse(c.date);
  if (!c.end || c.end === c.date) return `${month(a.at)} ${a.day}, ${a.y}`;
  const b = parse(c.end);
  if (b.y === a.y && b.m === a.m)
    return `${month(a.at)} ${a.day}–${b.day}, ${a.y}`;
  return `${month(a.at)} ${a.day} – ${month(b.at)} ${b.day}, ${b.y}`;
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
