import { GIGABYTE } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { Door } from "@/lib/event/door/door";

import type { MomentId } from "./knobs";

/**
 * TWO HOSTS ON THE SAME THREE DAYS: MAYA WITH ONE EVENT, JO WITH FORTY.
 *
 * Maya made her 30th (Friday 2 October 2026) on an Event Pass; she let each
 * guest in herself, and before it she had only ever added photos to a
 * friend's wedding. Jo plans parties for a living, on Pro: forty events since
 * New Year's Day 2025, six of them inside a week of the night, three still
 * filling, one paused, one with a late upload nobody has reviewed. The board's
 * Moment knob (`knobs.ts`) picks the day both of them open the dashboard on.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD: a board's folder
 * leaves whole when it retires. ★ NOTHING HERE IS A REAL PERSON, and every
 * photograph is one of the twelve bootstrap stills every board reuses (bible
 * 9: no new asset to make or track). Forty covers from twelve photographs
 * would read as twelve covers three times, so each cover is a CROP of a still
 * (a position and a zoom), the way a real album's photographs differ: the
 * table's flowers, the bride's bouquet in the low sun, the confetti's top
 * corner. ★ Copy is placeholder judged for size and wrapping: names run to a
 * real event's length.
 */

/* ── photographs ────────────────────────────────────────────────────────── */

/** One photograph: a still and the crop that makes it this event's. */
export type Photo = {
  id: string;
  src: string;
  /** `object-position`, and the origin the zoom grows from. */
  pos: string;
  /** 1 is the whole still; 1.8 is a detail of it. */
  zoom: number;
};

const crop = (still: string, n: number, pos = "50% 50%", zoom = 1): Photo => ({
  id: `${still}-${n}`,
  src: marketingImage(still).src,
  pos,
  zoom,
});

/** Every crop the board draws, by a name that says what it shows. */
export const PH = {
  confetti: crop("concert-confetti", 0),
  confettiSky: crop("concert-confetti", 1, "25% 25%", 1.8),
  confettiHands: crop("concert-confetti", 2, "60% 85%", 1.7),
  confettiLights: crop("concert-confetti", 3, "85% 30%", 1.8),
  stage: crop("festival-crowd", 0),
  stageGlow: crop("festival-crowd", 1, "50% 35%", 1.7),
  stageCrowd: crop("festival-crowd", 2, "30% 85%", 1.8),
  lights: crop("festival-lights", 0),
  lightsLeft: crop("festival-lights", 1, "20% 40%", 1.8),
  lightsRight: crop("festival-lights", 2, "70% 30%", 1.7),
  balloons: crop("party-balloons", 0),
  balloonsLeft: crop("party-balloons", 1, "30% 30%", 1.9),
  balloonsRight: crop("party-balloons", 2, "75% 25%", 1.8),
  dj: crop("party-dj", 0),
  djDeck: crop("party-dj", 1, "70% 60%", 1.7),
  djSmoke: crop("party-dj", 2, "20% 40%", 1.8),
  hall: crop("reception-hall", 0),
  hallCentre: crop("reception-hall", 1, "35% 60%", 1.7),
  hallWindows: crop("reception-hall", 2, "75% 40%", 1.8),
  table: crop("reception-table", 0),
  tableFlowers: crop("reception-table", 1, "55% 40%", 1.8),
  tablePlates: crop("reception-table", 2, "80% 70%", 1.7),
  arch: crop("wedding-arch", 0),
  archFlowers: crop("wedding-arch", 1, "45% 45%", 1.7),
  archDrape: crop("wedding-arch", 2, "70% 50%", 1.8),
  golden: crop("wedding-golden", 0),
  goldenBouquet: crop("wedding-golden", 1, "55% 60%", 1.6),
  goldenLight: crop("wedding-golden", 2, "35% 40%", 1.7),
  rings: crop("wedding-rings", 0),
  ringsHands: crop("wedding-rings", 1, "40% 40%", 1.8),
  ringsBouquet: crop("wedding-rings", 2, "35% 75%", 1.7),
  toast: crop("wedding-toast", 0),
  toastLights: crop("wedding-toast", 1, "45% 30%", 1.7),
  toastGlass: crop("wedding-toast", 2, "80% 55%", 1.8),
  petals: crop("wedding-petals", 0),
  petalsKiss: crop("wedding-petals", 1, "50% 40%", 1.6),
} as const;

/* ── the shapes ─────────────────────────────────────────────────────────── */

/** What one event holds on the day the dashboard is opened. */
export type Facts = {
  /** In the album (approved). */
  approved: number;
  /** People who added to it. */
  guests: number;
  /** People waiting at the door for the host to let them in. */
  waiting: number;
  /** Uploads waiting on the host's review. */
  pending: number;
  /** Visits to the event's link, the host's own included. */
  opened: number;
  acceptingUploads: boolean;
  description: string | null;
  hasPassword: boolean;
  /** Arrived since the host last looked at the dashboard (the `since` strip). */
  fresh: number;
};

export type DashEvent = {
  id: string;
  name: string;
  /** `YYYY-MM-DD`. */
  date: string | null;
  door: Door;
  showReel: boolean;
  /** The cover the event's tile wears. */
  cover: Photo;
  /** Its newest photographs first, for a stage, a strip or a row. */
  photos: readonly Photo[];
  facts: Facts;
};

/** An event this account added photos to at somebody else's party (guest by upload). */
export type GuestEvent = {
  id: string;
  name: string;
  date: string;
  byline: string;
  cover: Photo;
};

export type Host = {
  id: "maya" | "jo";
  name: string;
  seed: string;
  email: string;
  plan: {
    name: string;
    /** `MAX_EVENTS` for the plan: null is unlimited. */
    events: number | null;
    capBytes: number;
    usedBytes: number;
  };
  /** Hosted, in the order the account made them (newest first). */
  events: readonly DashEvent[];
  guest: readonly GuestEvent[];
  /** Soft-deleted, inside the 30 days. */
  deleted: number;
  /** The viewer's calendar day, `YYYY-MM-DD`. */
  today: string;
  /** The time on the frame, for the words that need one. */
  clock: string;
  /** When the dashboard was last opened, in words (the `since` strip). */
  lastLooked: string;
};

/* ── the days ───────────────────────────────────────────────────────────── */

export const DAYS: Record<
  MomentId,
  { today: string; clock: string; lastLooked: string }
> = {
  before: {
    today: "2026-09-25",
    clock: "7:30 pm",
    lastLooked: "Tuesday at 9 am",
  },
  night: {
    today: "2026-10-02",
    clock: "9:40 pm",
    lastLooked: "yesterday at 6 pm",
  },
  after: {
    today: "2026-10-03",
    clock: "10:15 am",
    lastLooked: "last night at 9:40 pm",
  },
};

const SITE_NOTE =
  "Add everything you take tonight, blurry ones included. We'll put the best on the big screen.";

const facts = (f: Partial<Facts>): Facts => ({
  approved: 0,
  guests: 0,
  waiting: 0,
  pending: 0,
  opened: 0,
  acceptingUploads: true,
  description: SITE_NOTE,
  hasPassword: false,
  fresh: 0,
  ...f,
});

/** Facts that differ by the day, and the same facts every day otherwise. */
const by = (
  m: MomentId,
  days: Partial<Record<MomentId, Partial<Facts>>>,
  base: Partial<Facts> = {},
): Facts => facts({ ...base, ...(days[m] ?? {}) });

/* ── Maya: one event ────────────────────────────────────────────────────── */

const MAYA_PARTY: readonly Photo[] = [
  PH.balloons,
  PH.toast,
  PH.dj,
  PH.confettiSky,
  PH.tableFlowers,
  PH.lightsLeft,
  PH.toastGlass,
  PH.balloonsRight,
  PH.djSmoke,
  PH.confetti,
  PH.lights,
  PH.stageGlow,
];

function maya(m: MomentId): Host {
  const party: DashEvent = {
    id: "maya-30th",
    name: "Maya's 30th",
    date: "2026-10-02",
    door: "approve",
    showReel: true,
    cover: PH.balloons,
    photos: m === "before" ? [] : MAYA_PARTY,
    facts: by(
      m,
      {
        before: { description: null, opened: 0 },
        night: {
          approved: 142,
          guests: 23,
          waiting: 2,
          opened: 31,
          fresh: 142,
        },
        after: { approved: 312, guests: 41, opened: 58, fresh: 170 },
      },
      {},
    ),
  };
  return {
    id: "maya",
    name: "Maya",
    seed: "hd-maya",
    email: "maya@example.com",
    plan: {
      name: "Event Pass",
      events: 1,
      capBytes: 75 * GIGABYTE,
      usedBytes:
        m === "before"
          ? 0.02 * GIGABYTE
          : m === "night"
            ? 0.6 * GIGABYTE
            : 1.3 * GIGABYTE,
    },
    events: [party],
    guest: [
      {
        id: "maya-guest-wedding",
        name: "Priya & Sam's Wedding",
        date: "2026-08-15",
        byline: "Hosted by Priya",
        cover: PH.petals,
      },
    ],
    deleted: 0,
    ...DAYS[m],
  };
}

/* ── Jo: forty events ───────────────────────────────────────────────────── */

type Row = Omit<DashEvent, "facts" | "showReel"> & {
  showReel?: boolean;
  facts: (m: MomentId) => Facts;
};

/** A party long over: its album whole, its door as it was left. */
const past =
  (approved: number, guests: number, extra: Partial<Facts> = {}) =>
  () =>
    facts({ approved, guests, opened: guests * 3, ...extra });

const JO_ROWS: readonly Row[] = [
  {
    id: "jo-nye-grand",
    name: "New Year's Eve at The Grand",
    date: "2026-12-31",
    door: "open",
    cover: PH.confettiLights,
    photos: [],
    facts: () => facts({ description: null }),
  },
  {
    id: "jo-holiday-26",
    name: "Harbour & Co Holiday Party",
    date: "2026-12-12",
    door: "approve",
    cover: PH.lightsRight,
    photos: [],
    facts: () => facts({ opened: 3 }),
  },
  {
    id: "jo-offsite",
    name: "Brightwater Offsite",
    date: "2026-10-07",
    door: "password",
    cover: PH.hallWindows,
    photos: [],
    facts: () => facts({ opened: 2 }),
  },
  {
    id: "jo-christening",
    name: "Ava's Christening",
    date: "2026-10-04",
    door: "open",
    cover: PH.archFlowers,
    photos: [],
    facts: (m) => by(m, { after: { opened: 2 } }),
  },
  {
    id: "jo-wedding",
    name: "Ines & Tom's Wedding",
    date: "2026-10-03",
    door: "invite",
    cover: PH.golden,
    photos: [PH.golden, PH.goldenBouquet, PH.rings, PH.arch],
    facts: (m) =>
      by(m, {
        before: { opened: 6 },
        night: { opened: 14 },
        after: { opened: 22, approved: 9, guests: 4, fresh: 9 },
      }),
  },
  {
    id: "jo-rehearsal",
    name: "Ines & Tom's Rehearsal Dinner",
    date: "2026-10-02",
    door: "approve",
    cover: PH.table,
    photos: [
      PH.toast,
      PH.tableFlowers,
      PH.hallCentre,
      PH.toastLights,
      PH.ringsHands,
      PH.goldenLight,
      PH.tablePlates,
      PH.hall,
      PH.toastGlass,
      PH.table,
      PH.ringsBouquet,
      PH.archDrape,
    ],
    facts: (m) =>
      by(m, {
        before: { opened: 9 },
        night: { approved: 86, guests: 19, waiting: 2, opened: 40, fresh: 86 },
        after: { approved: 204, guests: 44, opened: 61, fresh: 118 },
      }),
  },
  {
    id: "jo-sweet16",
    name: "Mila's Sweet 16",
    date: "2026-09-30",
    door: "open",
    cover: PH.lights,
    photos: [PH.lights, PH.djSmoke, PH.balloonsLeft, PH.confettiHands],
    facts: (m) =>
      by(m, {
        before: { opened: 12 },
        night: { approved: 164, guests: 31, pending: 6, opened: 88, fresh: 12 },
        after: { approved: 166, guests: 31, pending: 6, opened: 90, fresh: 2 },
      }),
  },
  {
    id: "jo-gala",
    name: "The Harbour Gala",
    date: "2026-09-26",
    door: "invite",
    cover: PH.hall,
    photos: [PH.hall, PH.hallCentre, PH.toastLights, PH.stageGlow],
    facts: (m) =>
      by(m, {
        before: { opened: 51 },
        night: {
          approved: 418,
          guests: 96,
          pending: 18,
          opened: 240,
          fresh: 9,
        },
        after: { approved: 418, guests: 96, pending: 18, opened: 244 },
      }),
  },
  {
    id: "jo-leo40",
    name: "Leo Turns 40",
    date: "2026-09-19",
    door: "open",
    cover: PH.djDeck,
    photos: [PH.djDeck, PH.confetti, PH.dj],
    facts: (m) =>
      by(m, {
        before: { approved: 226, guests: 38, opened: 120, fresh: 31 },
        night: { approved: 233, guests: 38, opened: 131, fresh: 2 },
        after: { approved: 233, guests: 38, opened: 131 },
      }),
  },
  {
    id: "jo-northwind",
    name: "Northwind Summer Social",
    date: "2026-08-21",
    door: "open",
    cover: PH.stage,
    photos: [PH.stage, PH.stageCrowd],
    facts: past(512, 120, { pending: 1 }),
  },
  {
    id: "jo-engagement",
    name: "Sofia & Dev's Engagement",
    date: "2026-08-08",
    door: "invite",
    cover: PH.ringsHands,
    photos: [],
    facts: past(141, 29),
  },
  {
    id: "jo-shower",
    name: "Mara's Baby Shower",
    date: "2026-07-25",
    door: "open",
    cover: PH.balloonsLeft,
    photos: [],
    facts: past(96, 22),
  },
  {
    id: "jo-kestrel-launch",
    name: "Kestrel Labs Launch Night",
    date: "2026-07-10",
    door: "approve",
    cover: PH.lightsLeft,
    photos: [],
    facts: past(274, 64),
  },
  {
    id: "jo-ruth-ade",
    name: "Ruth & Ade's Wedding",
    date: "2026-06-27",
    door: "invite",
    cover: PH.arch,
    photos: [],
    facts: past(902, 140),
  },
  {
    id: "jo-reunion",
    name: "Class of 2016 Reunion",
    date: "2026-06-13",
    door: "open",
    cover: PH.stageCrowd,
    photos: [],
    facts: past(188, 47),
  },
  {
    id: "jo-oliver1",
    name: "Oliver's First Birthday",
    date: "2026-05-30",
    door: "open",
    cover: PH.balloonsRight,
    photos: [],
    facts: past(77, 18),
  },
  {
    id: "jo-spring-arts",
    name: "Spring Gala for the Arts",
    date: "2026-05-16",
    door: "approve",
    cover: PH.hallCentre,
    photos: [],
    facts: past(365, 81, { acceptingUploads: false }),
  },
  {
    id: "jo-hen",
    name: "Priya's Hen Weekend",
    date: "2026-05-02",
    door: "invite",
    cover: PH.confettiHands,
    photos: [],
    facts: past(210, 16),
  },
  {
    id: "jo-lunar",
    name: "Lunar New Year Dinner",
    date: "2026-02-17",
    door: "open",
    cover: PH.tablePlates,
    photos: [],
    facts: past(120, 34),
  },
  {
    id: "jo-juniper",
    name: "Juniper & Co Winter Party",
    date: "2026-01-23",
    door: "approve",
    cover: PH.lightsRight,
    photos: [],
    facts: past(247, 58),
  },
  {
    id: "jo-nye-25",
    name: "New Year's Eve 2025",
    date: "2025-12-31",
    door: "open",
    cover: PH.confettiSky,
    photos: [],
    facts: past(433, 102),
  },
  {
    id: "jo-holiday-25",
    name: "Harbour & Co Holiday Party 2025",
    date: "2025-12-13",
    door: "approve",
    cover: PH.toastLights,
    photos: [],
    facts: past(288, 70),
  },
  {
    id: "jo-theo-ana",
    name: "Theo & Ana's Wedding",
    date: "2025-11-22",
    door: "invite",
    cover: PH.goldenBouquet,
    photos: [],
    facts: past(654, 118),
  },
  {
    id: "jo-halloween",
    name: "Halloween at the Lodge",
    date: "2025-10-31",
    door: "open",
    cover: PH.djSmoke,
    photos: [],
    facts: past(199, 52),
  },
  {
    id: "jo-dani30",
    name: "Dani's 30th",
    date: "2025-10-11",
    door: "open",
    cover: PH.balloons,
    photos: [],
    facts: past(156, 33),
  },
  {
    id: "jo-supper",
    name: "Autumn Supper Club",
    date: "2025-09-27",
    door: "approve",
    cover: PH.tableFlowers,
    photos: [],
    facts: past(64, 14),
  },
  {
    id: "jo-grace-femi",
    name: "Grace & Femi's Wedding",
    date: "2025-09-06",
    door: "invite",
    cover: PH.petalsKiss,
    photos: [],
    facts: past(711, 132),
  },
  {
    id: "jo-brightwater-25",
    name: "Brightwater Summer Party",
    date: "2025-08-15",
    door: "open",
    cover: PH.lights,
    photos: [],
    facts: past(302, 76),
  },
  {
    id: "jo-graduation",
    name: "Sam's Graduation",
    date: "2025-07-12",
    door: "open",
    cover: PH.confetti,
    photos: [],
    facts: past(93, 21),
  },
  {
    id: "jo-midsummer",
    name: "Midsummer on the Roof",
    date: "2025-06-21",
    door: "approve",
    cover: PH.stageGlow,
    photos: [],
    facts: past(177, 40),
  },
  {
    id: "jo-hana-joel",
    name: "Hana & Joel's Wedding",
    date: "2025-06-07",
    door: "invite",
    cover: PH.archDrape,
    photos: [],
    facts: past(588, 109),
  },
  {
    id: "jo-rosa",
    name: "Rosa's Retirement",
    date: "2025-05-23",
    door: "open",
    cover: PH.toastGlass,
    photos: [],
    facts: past(81, 25),
  },
  {
    id: "jo-spring-25",
    name: "Spring Gala 2025",
    date: "2025-05-10",
    door: "approve",
    cover: PH.hallWindows,
    photos: [],
    facts: past(340, 77),
  },
  {
    id: "jo-kai",
    name: "Kai's Bar Mitzvah",
    date: "2025-04-26",
    door: "invite",
    cover: PH.dj,
    photos: [],
    facts: past(256, 61),
  },
  {
    id: "jo-easter",
    name: "Easter Brunch",
    date: "2025-04-20",
    door: "open",
    cover: PH.ringsBouquet,
    photos: [],
    facts: past(58, 15),
  },
  {
    id: "jo-kestrel-5",
    name: "Kestrel Labs Five Years",
    date: "2025-03-28",
    door: "approve",
    cover: PH.lightsLeft,
    photos: [],
    facts: past(221, 55),
  },
  {
    id: "jo-elena",
    name: "Elena's Baby Shower",
    date: "2025-03-08",
    door: "open",
    cover: PH.balloonsRight,
    photos: [],
    facts: past(72, 19),
  },
  {
    id: "jo-valentine",
    name: "Valentine's Supper",
    date: "2025-02-14",
    door: "open",
    cover: PH.tableFlowers,
    photos: [],
    facts: past(49, 12),
  },
  {
    id: "jo-winter-ball",
    name: "Winter Ball 2025",
    date: "2025-01-24",
    door: "approve",
    cover: PH.hallCentre,
    photos: [],
    facts: past(398, 90),
  },
  {
    id: "jo-swim",
    name: "New Year's Day Swim",
    date: "2025-01-01",
    door: "open",
    cover: PH.stageCrowd,
    photos: [],
    facts: past(66, 17),
  },
];

/** Forty, by construction: the board's number, held where it is made. */
export const JO_EVENT_COUNT = JO_ROWS.length;

function jo(m: MomentId): Host {
  return {
    id: "jo",
    name: "Jo",
    seed: "hd-jo",
    email: "jo@example.com",
    plan: {
      name: "Pro",
      events: null,
      capBytes: 500 * GIGABYTE,
      usedBytes: 361 * GIGABYTE,
    },
    // An album shows photographs only once it holds some: the gala the day
    // before it has its cover crop in the fixture and none on the page.
    events: JO_ROWS.map(({ facts: at, showReel = true, photos, ...row }) => {
      const f = at(m);
      return {
        ...row,
        showReel,
        photos: f.approved > 0 ? photos : [],
        facts: f,
      };
    }),
    guest: [
      {
        id: "jo-guest-callum",
        name: "Callum's 50th",
        date: "2026-03-14",
        byline: "Hosted by Callum",
        cover: PH.toast,
      },
    ],
    deleted: 1,
    ...DAYS[m],
  };
}

export type HostId = Host["id"];

export function hostAt(id: HostId, m: MomentId): Host {
  return id === "maya" ? maya(m) : jo(m);
}
