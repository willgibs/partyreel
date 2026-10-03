import type { HeadStill } from "@/components/guest/event-experience-head";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";

/**
 * SIX ALBUMS, FROM THE HOST'S SIDE OF THEIR CODES: Maya and Jay's wedding
 * (the party every head board stands at, tonight and the week before) and
 * the four shapes his note named, where a head that leans on a timeline
 * breaks: a weekend over three days, a morning ceremony whose photographs all
 * land before lunch, a party with no date set, and a slow trickle that runs
 * for months.
 *
 *  - TONIGHT the wedding is on: 214 photos from 31 guests, the code opened 486
 *    times, 8 uploads held in Review and 2 people at the door;
 *  - THE WEEK BEFORE nothing is in the album and the checklist stands at the
 *    head of the hub (production's own);
 *  - A WEEKEND, October 2 to 4 (a range of days, no times: the end date
 *    `event-dates` wires), its third day on now: 312 photos from 18 people;
 *  - A MORNING, October 3, 9 to 11:40, and it is now evening: 148 photos, the
 *    newest nine hours old;
 *  - NO DATE: a 90th birthday whose host never set one, 64 photos;
 *  - A TRICKLE, Sunday dinners since June, two or three photos a week: 41.
 *
 * ★ EVERY ALBUM'S ARRIVALS ARE DRAWN, NOT DESCRIBED: each photograph has the
 * minute it landed (`arrivals`), dealt from the album's own busy moments by a
 * seeded generator, so every frame draws the same album on every render and
 * an option that reads the album reads a real one. A host's real arrivals are
 * her manifest's own times (`album-wire.ts`: every entry carries `t`).
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

/** An album of a few stills, their declared ratios varied as a real album's are. */
const albumOf = (ids: readonly string[]): Still[] => {
  const ratios: readonly (readonly [number, number] | null)[] = [
    null,
    [4, 5],
    null,
    [1, 1],
    [3, 4],
    null,
  ];
  return Array.from({ length: 12 }, (_, i) => {
    const r = ratios[i % ratios.length];
    const id = ids[(i * 5 + (i >> 1)) % ids.length] as Parameters<
      typeof marketingImage
    >[0];
    return r ? still(id, r[0], r[1]) : still(id);
  });
};

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

export type CaseId =
  | "tonight"
  | "before"
  | "weekend"
  | "morning"
  | "undated"
  | "trickle";

/** The order the facts' frames stand in: the wedding at both ends of its life, then his four shapes. */
export const CASE_ORDER: readonly CaseId[] = [
  "tonight",
  "before",
  "weekend",
  "morning",
  "undated",
  "trickle",
];

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
  /** The days until the event's date (0 once it has come). */
  daysToGo: number;
  /** The checklist's facts (`lib/events/readiness.ts`), as the server reads them. */
  ready: ReadyFacts;
};

/** Who added photos, newest first: a name and the seed production colours a face by. */
export type Face = { name: string; seed: string };

export type Case = HostFacts & {
  id: CaseId;
  /** The frame's own title: which album, at which moment. */
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
  /** The album under the cover, newest first (its colours are its photographs'). */
  album: readonly Still[];
  /** Who added, newest first (`guests` of them, the first few named). */
  faces: readonly Face[];
  /** The newest drop: who, how many, how long ago, and its first photograph. */
  latest: { who: string; n: number; ago: string; src: string } | null;
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

/** A crowd's first names, dealt to whoever is not named: placeholder, judged for size. */
const NAMES = [
  "Theo",
  "Priya",
  "Noor",
  "Ade",
  "Grace",
  "Jonah",
  "Mila",
  "Omar",
  "Sam",
  "Lena",
  "Ines",
  "Rui",
  "Jo",
  "Luca",
  "Ana",
  "Kofi",
  "Hana",
  "Eli",
  "Zara",
  "Ben",
  "Maren",
  "Tomas",
  "Yuki",
  "Ravi",
  "Clara",
  "Felix",
  "Nia",
  "Oskar",
  "Leah",
  "Dev",
  "Ruth",
  "Ivo",
];

/** `n` faces, newest first, starting from the named ones (each seeded by its album and place). */
function facesOf(album: string, n: number, first: readonly string[]): Face[] {
  const pool = [...first, ...NAMES.filter((x) => !first.includes(x))];
  return Array.from({ length: n }, (_, i) => ({
    name: pool[i % pool.length],
    seed: `eh-${album}-${i}`,
  }));
}

const WEDDING = cover([
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
  "wedding-petals",
  "reception-table",
]);

export const CASES: Record<CaseId, Case> = {
  tonight: {
    id: "tonight",
    title: "Tonight, the wedding on",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: true,
    photos: 214,
    guests: 31,
    views: 486,
    waiting: 2,
    review: 8,
    door: "approve",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: ready(EVENT.date, "approve", 31, 214, 486),
    // 7:04 pm to 10:40 pm: the drinks, dinner, the toasts, the first dance, the floor.
    arrivals: arrivalsOf(
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
    ),
    stills: WEDDING,
    album: ALBUM,
    faces: facesOf("tonight", 31, ["Theo", "Priya", "Noor", "Ade"]),
    latest: {
      who: "Theo",
      n: 3,
      ago: "just now",
      src: marketingImage("party-dj").src,
    },
  },
  before: {
    id: "before",
    title: "The week before, nothing in it",
    name: EVENT.name,
    slug: "maya-and-jay",
    date: EVENT.date,
    end: null,
    live: false,
    photos: 0,
    guests: 0,
    views: 0,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "short",
    reelHave: 0,
    daysToGo: 6,
    ready: ready(EVENT.date, "open", 0, 0, 0),
    arrivals: [],
    stills: [],
    album: ALBUM,
    faces: [],
    latest: null,
  },
  weekend: {
    id: "weekend",
    title: "A weekend, its third day on",
    name: "Lakeside weekend",
    slug: "lakeside-weekend",
    date: "2026-10-02",
    end: "2026-10-04",
    day: 3,
    live: true,
    photos: 312,
    guests: 18,
    views: 140,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: ready("2026-10-02", "open", 18, 312, 140),
    // Friday night's arrival, Saturday's lake and long night, Sunday's slow morning, on now.
    arrivals: arrivalsOf(
      31,
      312,
      [
        { at: hm(19, 30), spread: 50, weight: 0.8 },
        { at: hm(22, 40), spread: 30, weight: 0.5 },
        { at: DAY + hm(11, 30), spread: 70, weight: 0.9 },
        { at: DAY + hm(15, 0), spread: 40, weight: 1.1 },
        { at: DAY + hm(21, 20), spread: 60, weight: 1.3 },
        { at: 2 * DAY + hm(11, 0), spread: 60, weight: 0.6 },
        { at: 2 * DAY + hm(15, 40), spread: 20, weight: 0.5 },
      ],
      hm(17, 50),
      2 * DAY + hm(16, 6),
    ),
    stills: cover([
      "festival-lights",
      "festival-crowd",
      "concert-confetti",
      "party-dj",
      "party-balloons",
    ]),
    album: albumOf(["festival-lights", "festival-crowd", "concert-confetti", "party-dj", "party-balloons"]),
    faces: facesOf("weekend", 18, ["Jo", "Kofi", "Hana"]),
    latest: {
      who: "Jo",
      n: 8,
      ago: "4 min ago",
      src: marketingImage("festival-crowd").src,
    },
  },
  morning: {
    id: "morning",
    title: "A morning, its photos all before lunch",
    name: "Ines & Rui",
    slug: "ines-and-rui",
    date: "2026-10-03",
    end: null,
    live: false,
    photos: 148,
    guests: 22,
    views: 260,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: ready("2026-10-03", "open", 22, 148, 260),
    // 9 to 11:40 in the morning; it is now a quarter past nine at night.
    arrivals: arrivalsOf(
      47,
      148,
      [
        { at: hm(9, 15), spread: 8, weight: 0.6 },
        { at: hm(10, 5), spread: 6, weight: 1.2 },
        { at: hm(10, 40), spread: 12, weight: 1 },
        { at: hm(11, 20), spread: 10, weight: 0.7 },
      ],
      hm(9, 0),
      hm(11, 40),
    ),
    stills: cover(["wedding-arch", "wedding-petals", "wedding-rings"]),
    album: albumOf(["wedding-arch", "wedding-petals", "wedding-rings", "wedding-golden"]),
    faces: facesOf("morning", 22, ["Ana", "Clara", "Rui"]),
    latest: {
      who: "Ana",
      n: 5,
      ago: "9 hours ago",
      src: marketingImage("wedding-petals").src,
    },
  },
  undated: {
    id: "undated",
    title: "No date set",
    name: "Rosa turns 90",
    slug: "rosa-turns-90",
    date: null,
    end: null,
    live: false,
    photos: 64,
    guests: 15,
    views: 92,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: ready(null, "open", 15, 64, 92),
    // One evening, then a few late arrivals over the week after.
    arrivals: arrivalsOf(
      90,
      64,
      [
        { at: hm(19, 30), spread: 50, weight: 1 },
        { at: 2 * DAY + hm(12, 0), spread: 200, weight: 0.12 },
        { at: 6 * DAY + hm(20, 0), spread: 100, weight: 0.1 },
      ],
      hm(18, 0),
      7 * DAY,
    ),
    stills: cover(["party-balloons", "reception-table", "wedding-toast"]),
    album: albumOf(["party-balloons", "reception-table", "wedding-toast", "reception-hall"]),
    faces: facesOf("undated", 15, ["Luca", "Ruth", "Ivo"]),
    latest: {
      who: "Luca",
      n: 4,
      ago: "2 days ago",
      src: marketingImage("party-balloons").src,
    },
  },
  trickle: {
    id: "trickle",
    title: "A trickle, two or three a week",
    name: "Sunday dinners",
    slug: "sunday-dinners",
    date: "2026-06-07",
    end: null,
    live: false,
    photos: 41,
    guests: 7,
    views: 58,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "live",
    reelHave: 2,
    daysToGo: 0,
    ready: ready("2026-06-07", "open", 7, 41, 58),
    // A Sunday most weeks since June, a few photos from whoever cooked.
    arrivals: arrivalsOf(
      7,
      41,
      Array.from({ length: 16 }, (_, w) => ({
        at: w * 7 * DAY + hm(20, 30),
        spread: 30,
        weight: w % 4 === 2 ? 0.3 : 1,
      })),
      hm(19, 0),
      16 * 7 * DAY,
    ),
    stills: cover(["reception-table", "wedding-toast", "reception-hall"]),
    album: albumOf(["reception-table", "wedding-toast", "reception-hall", "wedding-golden"]),
    faces: facesOf("trickle", 7, ["Sam", "Lena", "Eli"]),
    latest: {
      who: "Sam",
      n: 2,
      ago: "3 days ago",
      src: marketingImage("reception-table").src,
    },
  },
};

/** The two moments the doors are drawn at: the wedding tonight, and the week before. */
export type Moment = "tonight" | "before";

export const MOMENTS: Record<Moment, Case> = {
  tonight: CASES.tonight,
  before: CASES.before,
};

/* ── when the event is ───────────────────────────────────────────────────── */

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});
const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day, at: new Date(Date.UTC(y, m - 1, day)) };
};

/**
 * THE EVENT'S DAYS AS THE HEAD SAYS THEM: "September 12, 2026" (production's
 * `formatEventDate`), a range in one line ("October 2–4, 2026", an en dash,
 * the month said once), and nothing at all where no date is set. A stand-in
 * for the formatter `event-dates` wires with the end date.
 */
export function whenOf(c: Pick<Case, "date" | "end">): string | null {
  if (!c.date) return null;
  const a = parse(c.date);
  const month = MONTH.format(a.at);
  if (!c.end || c.end === c.date) return `${month} ${a.day}, ${a.y}`;
  const b = parse(c.end);
  if (b.y === a.y && b.m === a.m) return `${month} ${a.day}–${b.day}, ${a.y}`;
  return `${month} ${a.day} – ${MONTH.format(b.at)} ${b.day}, ${b.y}`;
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
