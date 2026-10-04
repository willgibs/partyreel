import type { GuestEventCardData } from "@/lib/dashboard/guest-events";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { DeletedEvent, HostedEvent } from "@/lib/dashboard/home-view";
import { homeContext, hostedEvent } from "@/lib/dashboard/testing/home";
import { GIGABYTE, type Tier } from "@/lib/constants/tiers";
import type { Door } from "@/lib/event/door/door";
import { uploadsLabel } from "@/lib/events/visibility-labels";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { formatEventDate } from "@/lib/utils";

import { type CropId, photo } from "./crops";

/**
 * SIX HOSTS ON ONE QUIET TUESDAY, IN PRODUCTION'S OWN SHAPES, from one event
 * to two hundred (his r2 note: "design for users with 1 to maybe 10 events in
 * mind as the primary expectation, but ensure it scales up to dozens or
 * hundreds").
 *
 * Every event is a `HostedEvent` (`lib/dashboard/home-view.ts`), made through
 * production's own test factory (`lib/dashboard/testing/home.ts`), so the page
 * every frame draws is composed by production's `buildHomeView` from the facts
 * production's page would have read.
 *
 *  - MAYA has one event, her 30th ten days ago, and a friend's wedding she
 *    added photos to.
 *  - NIA has three and dated none: a wedding she made last night, still empty,
 *    and two older albums. NIA A WEEK ON is the same wedding dated (a weekend,
 *    Saturday to Sunday), its code opened and its door set: the week before.
 *  - ARI has ten, a family's two years: birthdays, a lake weekend, a book club
 *    nobody dated, a housewarming she made last night.
 *  - JO plans parties for a living: forty since New Year's Day 2025, saving
 *    three 2025 weddings for their couples' anniversaries.
 *  - RAE runs a venue: two hundred events since January 2023, made by a seeded
 *    generator so the count is real and every name reads like an event's.
 *  - LENA has five and a full week (`details`, H6): her 40th last Saturday,
 *    a team lunch on Thursday, and Sunday's pancakes, an album nobody dated
 *    whose photos landed this week.
 *
 * ★ RANGES AND THE NEWEST LEAD ARE DRAWN AS SETTLED (`event-dates` wires them
 * this round): an event may carry a last day (`end`, a range of days, no
 * times), and on a quiet day the newest event leads the stage. Production's
 * types hold no end date yet, so a range lives here (`Host.ends`) and the
 * board's own words say it (`model.ts`, `rangeWords`).
 *
 * ★ THE DAY IS TUESDAY 10 NOVEMBER 2026, MID-MORNING, AND NO PARTY IS ON ITS
 * DAY: a live stage listens to its album's doorbell (a Realtime socket) and a
 * frame must never reach it. ★ NOTHING HERE IS A REAL PERSON, and every
 * photograph is a crop of a bootstrap still (`crops.ts`). ★ Copy is placeholder
 * judged for size and wrapping: names run to a real event's length.
 */

export const TODAY = "2026-11-10";

export type HostId =
  | "maya"
  | "nia"
  | "nia-week"
  | "ari"
  | "jo"
  | "rae"
  | "lena";

export type Host = {
  id: HostId;
  name: string;
  email: string;
  seed: string;
  plan: { name: string; tier: Tier; capBytes: number; usedBytes: number };
  ctx: HomeContext;
  /** Every live hosted event, newest made first (`listEvents`' order). */
  hosted: HostedEvent[];
  /** The events she added to, masked as their albums' own doors mask them. */
  guests: GuestEventCardData[];
  deleted: DeletedEvent[];
  /** Who added to each album (`getEventGuests`), for the stage's numbers. */
  people: Record<string, number>;
  /** Each event's album, newest first: the stand-in event page draws it. */
  albums: Record<string, string[]>;
  /** A ranged event's last day, `YYYY-MM-DD` (`event-dates`, drawn as settled). */
  ends: Record<string, string>;
  /** Her opens, newest first, as Try it opens the page: Recent and Last opened read them. */
  trail: string[];
};

/* ── the albums ───────────────────────────────────────────────────────── */

const WEDDING: readonly CropId[] = [
  "golden",
  "ringsHands",
  "archFlowers",
  "petalsKiss",
  "toastLights",
  "goldenBouquet",
  "rings",
  "arch",
  "petals",
  "toast",
  "goldenLight",
  "ringsBouquet",
  "archDrape",
  "toastGlass",
];
const PARTY: readonly CropId[] = [
  "balloons",
  "djDeck",
  "confettiSky",
  "lightsLeft",
  "balloonsRight",
  "dj",
  "confettiHands",
  "lights",
  "balloonsLeft",
  "djSmoke",
  "confetti",
  "lightsRight",
  "confettiLights",
];
const EVENING: readonly CropId[] = [
  "hall",
  "tableFlowers",
  "stageGlow",
  "hallCentre",
  "tablePlates",
  "stage",
  "hallWindows",
  "table",
  "stageCrowd",
  "toastLights",
  "lights",
];
const THEMES = { wedding: WEDDING, party: PARTY, evening: EVENING } as const;
type Theme = keyof typeof THEMES;

/** An album's photographs from a theme, starting at `n`: a different cover per event. */
function album(theme: Theme, n: number, count: number): string[] {
  const set = THEMES[theme];
  return Array.from({ length: count }, (_, i) =>
    photo(set[(n + i * 3) % set.length]!),
  );
}

/* ── one event, as the page reads it ──────────────────────────────────── */

type Spec = {
  id: string;
  name: string;
  /** The host's date, `YYYY-MM-DD`, or none. */
  date: string | null;
  /** A range's last day (`event-dates`, drawn as settled). */
  end?: string;
  /** The day she made it. */
  made: string;
  /** Its album's look and where in it the cover falls; none is an empty album. */
  look?: [Theme, number];
  approved?: number;
  pending?: number;
  waiting?: number;
  /** The day its photographs last landed: the day after its last day unless said. */
  last?: string;
  door?: Door;
  paused?: boolean;
  /** Readiness's own reads, made for an event before its day (`page.tsx`'s rounds). */
  opened?: number;
  qrStyle?: string;
  description?: string | null;
};

const NOTE =
  "Add everything you take, blurry ones included. We'll keep the best for the album.";

function dayAfter(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().slice(0, 10);
}

function event(s: Spec): HostedEvent {
  const filled = (s.approved ?? 0) > 0;
  const stills = s.look && filled ? album(s.look[0], s.look[1], 4) : [];
  const lastDay = filled
    ? (s.last ?? (s.date ? dayAfter(s.end ?? s.date) : null))
    : null;
  // Before its day: a date still to come, or no day at all (an undated album with nothing in it).
  const before = s.date ? s.date > TODAY : !lastDay;
  return hostedEvent({
    id: s.id,
    name: s.name,
    date: s.date,
    lastArrival: lastDay
      ? { at: `${lastDay}T21:30:00.000Z`, day: lastDay }
      : null,
    createdAt: `${s.made}T15:00:00.000Z`,
    door: s.door ?? "open",
    hasPassword: s.door === "password",
    acceptingUploads: !s.paused,
    showReel: true,
    description: s.description === undefined ? NOTE : s.description,
    approved: s.approved ?? 0,
    pending: s.pending ?? 0,
    waiting: s.waiting ?? 0,
    playable: Math.min(s.approved ?? 0, 8),
    // Readiness is read for an event before its day only, as the page reads it.
    ready: before ? { opened: s.opened ?? 0, guestsIn: 0 } : null,
    arrivals: { today: 0, lastHour: 0 },
    qrToken: `hd${s.id.replace(/[^a-z0-9]/g, "")}`,
    qrStyle: s.qrStyle ?? "classic",
    stills,
    uploadsLabel: uploadsLabel(!s.paused),
    dateLabel: s.date ? formatEventDate(s.date) : "No date set",
  });
}

/** The album an event's page shows: its stills, then more of its look. */
function albumOf(s: Spec): string[] {
  if (!s.look || !s.approved) return [];
  return album(s.look[0], s.look[1], Math.min(12, Math.max(4, s.approved)));
}

function guest(
  id: string,
  name: string,
  date: string,
  hostName: string,
  cover: CropId,
): GuestEventCardData {
  return {
    eventId: id,
    lastUploadAt: `${dayAfter(date)}T10:00:00.000Z`,
    href: `/e/hd${id.replace(/[^a-z0-9]/g, "")}`,
    name,
    dateLabel: formatEventDate(date),
    byline: `Hosted by ${hostName}`,
    coverUrl: photo(cover),
    accessible: true,
    passwordProtected: false,
  };
}

function host(
  base: Omit<Host, "hosted" | "albums" | "ctx" | "people" | "ends"> & {
    specs: Spec[];
    storagePct: number;
  },
): Host {
  const { specs, storagePct, ...rest } = base;
  return {
    ...rest,
    ctx: homeContext(TODAY, { storagePct }),
    hosted: specs
      .map(event)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    albums: Object.fromEntries(specs.map((s) => [s.id, albumOf(s)])),
    people: Object.fromEntries(
      specs.map((s) => [s.id, Math.round((s.approved ?? 0) / 7)]),
    ),
    ends: Object.fromEntries(
      specs.filter((s) => s.end).map((s) => [s.id, s.end!]),
    ),
  };
}

/* ── Maya: one event ──────────────────────────────────────────────────── */

const MAYA = host({
  id: "maya",
  name: "Maya",
  email: "maya@example.com",
  seed: "hd-maya",
  plan: {
    name: "Event Pass",
    tier: "event_pass",
    capBytes: 75 * GIGABYTE,
    usedBytes: 1.3 * GIGABYTE,
  },
  storagePct: 2,
  specs: [
    {
      id: "maya-30th",
      name: "Maya's 30th",
      date: "2026-10-31",
      made: "2026-09-01",
      look: ["party", 0],
      approved: 312,
      door: "approve",
    },
  ],
  guests: [
    guest(
      "maya-guest-wedding",
      "Priya & Sam's Wedding",
      "2026-08-15",
      "Priya",
      "petals",
    ),
  ],
  deleted: [],
  trail: ["maya-30th"],
});

/* ── Nia: three events, none dated; and the same three a week on ──────── */

const NIA_OLDER: Spec[] = [
  {
    id: "nia-engagement",
    name: "Our Engagement Party",
    date: null,
    made: "2026-09-20",
    look: ["wedding", 4],
    approved: 64,
    last: "2026-09-26",
  },
  {
    id: "nia-trying",
    name: "Trying it out",
    date: null,
    made: "2026-09-12",
    look: ["party", 5],
    approved: 4,
    last: "2026-09-12",
  },
];

const NIA_BASE = {
  name: "Nia",
  email: "nia@example.com",
  seed: "hd-nia",
  plan: {
    name: "Pro",
    tier: "pro" as const,
    capBytes: 100 * GIGABYTE,
    usedBytes: 0.4 * GIGABYTE,
  },
  storagePct: 1,
  guests: [],
  deleted: [],
  // She made the wedding last night, so it is the last thing she opened.
  trail: ["nia-wedding", "nia-engagement", "nia-trying"],
};

const NIA = host({
  ...NIA_BASE,
  id: "nia",
  specs: [
    // Just made: Create's own defaults, nothing set, the code never opened.
    {
      id: "nia-wedding",
      name: "Nia & Alex's Wedding",
      date: null,
      made: "2026-11-09",
      description: null,
      qrStyle: "rounded",
    },
    ...NIA_OLDER,
  ],
});

/**
 * THE WEEK BEFORE: the same wedding dated (a weekend, Saturday to Sunday, so a
 * range is drawn as settled), its door an invite list, its welcome written and
 * its code opened twelve times; still not one photograph.
 */
const NIA_WEEK = host({
  ...NIA_BASE,
  id: "nia-week",
  specs: [
    {
      id: "nia-wedding",
      name: "Nia & Alex's Wedding",
      date: "2026-11-14",
      end: "2026-11-15",
      made: "2026-11-09",
      door: "invite",
      opened: 12,
      qrStyle: "rounded",
      description:
        "Welcome! Add every photo you take this weekend, from the ceremony to Sunday's brunch.",
    },
    ...NIA_OLDER,
  ],
});

/* ── Ari: ten events ──────────────────────────────────────────────────── */

const ARI = host({
  id: "ari",
  name: "Ari",
  email: "ari@example.com",
  seed: "hd-ari",
  plan: {
    name: "Pro",
    tier: "pro",
    capBytes: 100 * GIGABYTE,
    usedBytes: 9.6 * GIGABYTE,
  },
  storagePct: 10,
  specs: [
    {
      id: "ari-housewarming",
      name: "Ari & Lou's Housewarming",
      date: "2026-11-28",
      made: "2026-11-09",
      opened: 2,
      qrStyle: "dots",
    },
    {
      id: "ari-dad70",
      name: "Dad's 70th",
      date: "2026-10-17",
      made: "2026-09-20",
      look: ["evening", 2],
      approved: 186,
      pending: 3,
    },
    {
      id: "ari-mila6",
      name: "Mila Turns Six",
      date: "2026-09-05",
      made: "2026-08-10",
      look: ["party", 3],
      approved: 94,
    },
    {
      id: "ari-lake",
      name: "Lake Weekend",
      date: "2026-08-14",
      end: "2026-08-16",
      made: "2026-07-02",
      look: ["evening", 7],
      approved: 241,
    },
    {
      id: "ari-office",
      name: "Office Summer Social",
      date: "2026-07-24",
      made: "2026-07-01",
      look: ["party", 9],
      approved: 133,
    },
    {
      id: "ari-engagement",
      name: "Ari & Lou's Engagement",
      date: "2026-06-20",
      made: "2026-05-11",
      look: ["wedding", 3],
      approved: 312,
      door: "invite",
    },
    {
      id: "ari-bookclub",
      name: "Book Club Supper",
      date: null,
      made: "2026-05-02",
      look: ["evening", 4],
      approved: 18,
      last: "2026-05-02",
    },
    {
      id: "ari-nye",
      name: "New Year's at Ours",
      date: "2025-12-31",
      made: "2025-12-01",
      look: ["party", 6],
      approved: 207,
    },
    {
      id: "ari-garden",
      name: "Grandma's Garden Party",
      date: "2025-07-12",
      made: "2025-06-20",
      look: ["wedding", 10],
      approved: 76,
    },
    {
      id: "ari-trying",
      name: "Trying it out",
      date: null,
      made: "2025-06-01",
      look: ["party", 1],
      approved: 3,
      last: "2025-06-01",
    },
  ],
  guests: [
    guest(
      "ari-guest-jess",
      "Jess & Tom's Wedding",
      "2026-09-19",
      "Jess",
      "goldenLight",
    ),
  ],
  deleted: [],
  trail: ["ari-dad70", "ari-mila6", "ari-lake", "ari-bookclub"],
});

/* ── Jo: forty events ─────────────────────────────────────────────────── */

const JO_SPECS: Spec[] = [
  // Coming up: a launch made on Sunday with no date yet, and the year's two big nights.
  {
    id: "jo-spring-launch",
    name: "Kestrel Labs Spring Launch",
    date: null,
    made: "2026-11-08",
    description: null,
  },
  {
    id: "jo-nye-grand",
    name: "New Year's Eve at The Grand",
    date: "2026-12-31",
    made: "2026-10-20",
  },
  {
    id: "jo-holiday-26",
    name: "Harbour & Co Holiday Party",
    date: "2026-12-12",
    made: "2026-09-01",
    door: "approve",
    opened: 4,
    qrStyle: "rounded",
  },
  // 2026, the lull's far side: the last party five weeks ago, a two-day offsite.
  {
    id: "jo-offsite",
    name: "Brightwater Offsite",
    date: "2026-10-06",
    end: "2026-10-07",
    made: "2026-08-30",
    look: ["evening", 6],
    approved: 88,
    door: "password",
  },
  {
    id: "jo-christening",
    name: "Ava's Christening",
    date: "2026-10-04",
    made: "2026-09-02",
    look: ["wedding", 8],
    approved: 57,
  },
  {
    id: "jo-ines-tom",
    name: "Ines & Tom's Wedding",
    date: "2026-10-03",
    made: "2026-07-14",
    look: ["wedding", 0],
    approved: 402,
    door: "invite",
  },
  {
    id: "jo-rehearsal",
    name: "Ines & Tom's Rehearsal Dinner",
    date: "2026-10-02",
    made: "2026-07-14",
    look: ["evening", 1],
    approved: 204,
    door: "approve",
  },
  {
    id: "jo-sweet16",
    name: "Mila's Sweet 16",
    date: "2026-09-30",
    made: "2026-08-12",
    look: ["party", 7],
    approved: 166,
    pending: 6,
  },
  {
    id: "jo-gala",
    name: "The Harbour Gala",
    date: "2026-09-26",
    made: "2026-06-30",
    look: ["evening", 0],
    approved: 418,
    pending: 18,
    door: "invite",
  },
  {
    id: "jo-leo40",
    name: "Leo Turns 40",
    date: "2026-09-19",
    made: "2026-08-01",
    look: ["party", 1],
    approved: 233,
  },
  {
    id: "jo-northwind",
    name: "Northwind Summer Social",
    date: "2026-08-21",
    made: "2026-07-01",
    look: ["evening", 5],
    approved: 512,
  },
  {
    id: "jo-engagement",
    name: "Sofia & Dev's Engagement",
    date: "2026-08-08",
    made: "2026-07-03",
    look: ["wedding", 1],
    approved: 141,
    door: "invite",
  },
  {
    id: "jo-shower",
    name: "Mara's Baby Shower",
    date: "2026-07-25",
    made: "2026-06-20",
    look: ["party", 4],
    approved: 96,
  },
  {
    id: "jo-kestrel-launch",
    name: "Kestrel Labs Launch Night",
    date: "2026-07-10",
    made: "2026-05-28",
    look: ["party", 3],
    approved: 274,
    door: "approve",
  },
  {
    id: "jo-ruth-ade",
    name: "Ruth & Ade's Wedding",
    date: "2026-06-27",
    made: "2026-03-11",
    look: ["wedding", 6],
    approved: 902,
    door: "invite",
  },
  {
    id: "jo-reunion",
    name: "Class of 2016 Reunion",
    date: "2026-06-13",
    made: "2026-04-30",
    look: ["evening", 8],
    approved: 188,
  },
  {
    id: "jo-oliver1",
    name: "Oliver's First Birthday",
    date: "2026-05-30",
    made: "2026-05-02",
    look: ["party", 2],
    approved: 77,
  },
  {
    id: "jo-spring-arts",
    name: "Spring Gala for the Arts",
    date: "2026-05-16",
    made: "2026-03-20",
    look: ["evening", 3],
    approved: 365,
    door: "approve",
    paused: true,
  },
  {
    id: "jo-hen",
    name: "Priya's Hen Weekend",
    date: "2026-05-01",
    end: "2026-05-03",
    made: "2026-03-29",
    look: ["party", 6],
    approved: 210,
    door: "invite",
  },
  {
    id: "jo-lunar",
    name: "Lunar New Year Dinner",
    date: "2026-02-17",
    made: "2026-01-20",
    look: ["evening", 4],
    approved: 120,
  },
  {
    id: "jo-juniper",
    name: "Juniper & Co Winter Party",
    date: "2026-01-23",
    made: "2025-12-15",
    look: ["party", 11],
    approved: 247,
    door: "approve",
  },
  // 2025.
  {
    id: "jo-nye-25",
    name: "New Year's Eve 2025",
    date: "2025-12-31",
    made: "2025-11-02",
    look: ["party", 9],
    approved: 433,
  },
  {
    id: "jo-holiday-25",
    name: "Harbour & Co Holiday Party 2025",
    date: "2025-12-13",
    made: "2025-09-30",
    look: ["evening", 9],
    approved: 288,
    door: "approve",
  },
  {
    id: "jo-theo-ana",
    name: "Theo & Ana's Wedding",
    date: "2025-11-22",
    made: "2025-06-02",
    look: ["wedding", 2],
    approved: 654,
    door: "invite",
  },
  {
    id: "jo-halloween",
    name: "Halloween at the Lodge",
    date: "2025-10-31",
    made: "2025-09-24",
    look: ["party", 5],
    approved: 199,
  },
  {
    id: "jo-dani30",
    name: "Dani's 30th",
    date: "2025-10-11",
    made: "2025-09-10",
    look: ["party", 0],
    approved: 156,
  },
  {
    id: "jo-supper",
    name: "Autumn Supper Club",
    date: "2025-09-27",
    made: "2025-09-01",
    look: ["evening", 2],
    approved: 64,
    door: "approve",
  },
  {
    id: "jo-grace-femi",
    name: "Grace & Femi's Wedding",
    date: "2025-09-06",
    made: "2025-03-15",
    look: ["wedding", 9],
    approved: 711,
    door: "invite",
  },
  {
    id: "jo-brightwater-25",
    name: "Brightwater Summer Party",
    date: "2025-08-15",
    made: "2025-07-01",
    look: ["party", 8],
    approved: 302,
  },
  {
    id: "jo-graduation",
    name: "Sam's Graduation",
    date: "2025-07-12",
    made: "2025-06-14",
    look: ["party", 10],
    approved: 93,
  },
  {
    id: "jo-midsummer",
    name: "Midsummer on the Roof",
    date: "2025-06-21",
    made: "2025-05-20",
    look: ["evening", 7],
    approved: 177,
    door: "approve",
  },
  {
    id: "jo-hana-joel",
    name: "Hana & Joel's Wedding",
    date: "2025-06-07",
    made: "2025-01-18",
    look: ["wedding", 5],
    approved: 588,
    door: "invite",
  },
  {
    id: "jo-rosa",
    name: "Rosa's Retirement",
    date: "2025-05-23",
    made: "2025-04-25",
    look: ["evening", 10],
    approved: 81,
  },
  {
    id: "jo-spring-25",
    name: "Spring Gala 2025",
    date: "2025-05-10",
    made: "2025-03-01",
    look: ["evening", 6],
    approved: 340,
    door: "approve",
  },
  {
    id: "jo-kai",
    name: "Kai's Bar Mitzvah",
    date: "2025-04-26",
    made: "2025-02-20",
    look: ["party", 12],
    approved: 256,
    door: "invite",
  },
  {
    id: "jo-kestrel-5",
    name: "Kestrel Labs Five Years",
    date: "2025-03-28",
    made: "2025-02-10",
    look: ["evening", 1],
    approved: 221,
    door: "approve",
  },
  {
    id: "jo-elena",
    name: "Elena's Baby Shower",
    date: "2025-03-08",
    made: "2025-02-05",
    look: ["party", 4],
    approved: 72,
  },
  {
    id: "jo-valentine",
    name: "Valentine's Supper",
    date: "2025-02-14",
    made: "2025-01-20",
    look: ["wedding", 11],
    approved: 49,
  },
  {
    id: "jo-winter-ball",
    name: "Winter Ball 2025",
    date: "2025-01-24",
    made: "2024-12-01",
    look: ["evening", 3],
    approved: 398,
    door: "approve",
  },
  {
    id: "jo-swim",
    name: "New Year's Day Swim",
    date: "2025-01-01",
    made: "2024-12-10",
    look: ["party", 6],
    approved: 66,
  },
];

/** Forty, by construction: the board's number, held where it is made. */
export const JO_EVENT_COUNT = JO_SPECS.length;

/**
 * The three 2025 weddings she is saving, in the order she opened them: Theo &
 * Ana's first, Hana & Joel's last.
 */
export const JO_THREE = [
  "jo-theo-ana",
  "jo-grace-femi",
  "jo-hana-joel",
] as const;

const JO = host({
  id: "jo",
  name: "Jo",
  email: "jo@example.com",
  seed: "hd-jo",
  plan: {
    name: "Pro",
    tier: "pro",
    capBytes: 500 * GIGABYTE,
    usedBytes: 361 * GIGABYTE,
  },
  storagePct: 72,
  specs: JO_SPECS,
  guests: [
    guest("jo-guest-callum", "Callum's 50th", "2026-03-14", "Callum", "toast"),
  ],
  deleted: [
    {
      id: "jo-deleted-copy",
      name: "Copy of Harbour & Co Holiday Party",
      date: null,
      dateLabel: "No date set",
      coverUrl: null,
      deletedAt: "2026-11-05T12:00:00.000Z",
      countdown: binCountdownLabel(25),
    },
  ],
  // The morning after she saved all three: the weddings at the head of her
  // opens, then the October wedding whose album she sent and the two she is
  // setting up.
  trail: [
    ...[...JO_THREE].reverse(),
    "jo-ines-tom",
    "jo-holiday-26",
    "jo-spring-launch",
  ],
});

/* ── Rae: two hundred events ──────────────────────────────────────────── */

/** A small seeded generator (mulberry32): the same two hundred on every load. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUPLES = [
  "Grace & Femi",
  "Hana & Joel",
  "Ines & Tom",
  "Ruth & Ade",
  "Sofia & Dev",
  "Priya & Sam",
  "Lena & Marco",
  "Zara & Kwame",
  "Ellie & Finn",
  "Noor & Idris",
  "Bea & Callum",
  "Maya & Jay",
  "Ola & Kenji",
  "Iris & Mateo",
  "Ama & Luke",
];
const COMPANIES = [
  "Harbour & Co",
  "Kestrel Labs",
  "Brightwater",
  "Northwind",
  "Juniper & Co",
  "Fieldhouse",
  "Saltmarsh Studio",
  "Orchard Bank",
];
const COMPANY_NIGHTS = [
  "Holiday Party",
  "Summer Social",
  "Launch Night",
  "Awards Dinner",
  "Offsite",
];
const PEOPLE = [
  "Leo",
  "Mila",
  "Dani",
  "Oliver",
  "Rosa",
  "Kai",
  "Elena",
  "Sam",
  "Ava",
  "Mara",
  "Callum",
  "Nadia",
  "Hugo",
  "Tess",
];
const BIRTHDAYS = ["30th", "40th", "50th", "21st", "Sweet 16", "60th"];
const HOUSE_NIGHTS = [
  "Winter Ball",
  "Spring Gala",
  "Supper Club",
  "Midsummer on the Roof",
  "Jazz on the Terrace",
  "Harvest Long Table",
  "Charity Auction",
  "Quiz Night",
];

const THEME_OF = {
  wedding: "wedding",
  company: "evening",
  birthday: "party",
  house: "evening",
} as const;

const DAY_MS = 86_400_000;
const iso = (t: number): string => new Date(t).toISOString().slice(0, 10);

/** The old wedding the board sends Rae back to: a 2023 album, screens down any list. */
export const RAE_TARGET = "rae-theo-ana-2023";

function raeSpecs(): Spec[] {
  const rand = seeded(2023);
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(rand() * list.length)]!;
  const out: Spec[] = [];
  const start = Date.UTC(2023, 0, 7);
  const last = Date.UTC(2026, 10, 2);
  const step = (last - start) / 186;
  const seen = new Set<string>();
  for (let i = 0; i < 187; i++) {
    const at = start + i * step + Math.floor(rand() * 2) * DAY_MS;
    const date = iso(at);
    const kind = pick(["wedding", "company", "birthday", "house"] as const);
    const year = date.slice(0, 4);
    let name =
      kind === "wedding"
        ? `${pick(COUPLES)}'s Wedding`
        : kind === "company"
          ? `${pick(COMPANIES)} ${pick(COMPANY_NIGHTS)}`
          : kind === "birthday"
            ? `${pick(PEOPLE)}'s ${pick(BIRTHDAYS)}`
            : pick(HOUSE_NIGHTS);
    // A name a venue runs every year carries its year, as planners name them.
    if (seen.has(name)) name = `${name} ${year}`;
    if (seen.has(name)) name = `${name} (${Number(date.slice(5, 7))})`;
    seen.add(name);
    const multi = kind === "company" && name.includes("Offsite");
    out.push({
      id: `rae-${i}`,
      name,
      date,
      end: multi ? iso(at + DAY_MS) : undefined,
      made: iso(at - (21 + Math.floor(rand() * 70)) * DAY_MS),
      look: [THEME_OF[kind], Math.floor(rand() * 13)],
      approved: 40 + Math.floor(rand() * 860),
      pending: rand() < 0.05 ? 1 + Math.floor(rand() * 20) : 0,
      door: pick(["open", "approve", "invite", "open"] as const),
    });
  }
  // The wedding the frames go back for, among its year's.
  out.push({
    id: RAE_TARGET,
    name: "Theo & Ana's Wedding",
    date: "2023-11-18",
    made: "2023-05-02",
    look: ["wedding", 2],
    approved: 688,
    door: "invite",
  });
  // What is coming, and what nobody dated yet.
  out.push(
    {
      id: "rae-winter-gala",
      name: "Harbourview Winter Gala",
      date: "2026-11-21",
      made: "2026-09-14",
      door: "approve",
      opened: 31,
    },
    {
      id: "rae-nye",
      name: "New Year's Eve on the Terrace",
      date: "2026-12-31",
      made: "2026-10-01",
    },
    {
      id: "rae-holiday",
      name: "Orchard Bank Holiday Party 2026",
      date: "2026-12-11",
      made: "2026-10-12",
      door: "invite",
    },
    {
      id: "rae-tasting",
      name: "Winter Menu Tasting",
      date: null,
      made: "2026-11-06",
      description: null,
    },
    {
      id: "rae-spring-27",
      name: "Spring Gala 2027",
      date: null,
      made: "2026-10-28",
    },
    {
      id: "rae-staff",
      name: "Staff Party",
      date: null,
      made: "2026-10-30",
      look: ["party", 4],
      approved: 41,
      last: "2026-10-31",
    },
    {
      id: "rae-walkthrough",
      name: "Venue Walkthrough Photos",
      date: null,
      made: "2026-03-02",
      look: ["evening", 5],
      approved: 58,
      last: "2026-03-04",
    },
    {
      id: "rae-terrace-test",
      name: "Terrace Lights Test",
      date: null,
      made: "2025-05-19",
      look: ["evening", 10],
      approved: 12,
      last: "2025-05-19",
    },
    {
      id: "rae-trying",
      name: "Trying it out",
      date: null,
      made: "2023-01-03",
      look: ["party", 2],
      approved: 6,
      last: "2023-01-03",
    },
    {
      id: "rae-sample",
      name: "Sample Album for Couples",
      date: null,
      made: "2024-02-11",
      look: ["wedding", 7],
      approved: 36,
      last: "2024-02-12",
    },
    {
      id: "rae-open-day",
      name: "Wedding Open Day",
      date: "2026-01-18",
      made: "2025-12-02",
      look: ["wedding", 12],
      approved: 144,
    },
    {
      id: "rae-roof-27",
      name: "Midsummer on the Roof 2027",
      date: null,
      made: "2026-11-02",
    },
  );
  return out;
}

const RAE_SPECS = raeSpecs();

/** Two hundred, by construction. */
export const RAE_EVENT_COUNT = RAE_SPECS.length;

const RAE = host({
  id: "rae",
  name: "Rae",
  email: "rae@example.com",
  seed: "hd-rae",
  plan: {
    name: "Pro",
    tier: "pro",
    capBytes: 2000 * GIGABYTE,
    usedBytes: 1240 * GIGABYTE,
  },
  storagePct: 62,
  specs: RAE_SPECS,
  guests: [
    guest(
      "rae-guest-awards",
      "Venue of the Year Awards",
      "2025-03-20",
      "Hospitality Guild",
      "stageGlow",
    ),
    guest("rae-guest-gina", "Gina's Leaving Do", "2024-08-30", "Gina", "toast"),
  ],
  deleted: [
    {
      id: "rae-deleted-test",
      name: "Test (delete me)",
      date: null,
      dateLabel: "No date set",
      coverUrl: null,
      deletedAt: "2026-11-01T12:00:00.000Z",
      countdown: binCountdownLabel(21),
    },
  ],
  trail: ["rae-winter-gala", "rae-tasting", "rae-holiday", "rae-staff"],
});

/* ── Lena: five events and a full week (H6) ──────────────────────────── */

/**
 * THE WEEK'S OWN CASE (`details`, H6): two dated parties either side of
 * today, and an album she never dated whose photos landed on Sunday, which
 * the week as built leaves out ("the week holds dated parties only").
 */
const LENA = host({
  id: "lena",
  name: "Lena",
  email: "lena@example.com",
  seed: "hd-lena",
  plan: {
    name: "Pro",
    tier: "pro",
    capBytes: 100 * GIGABYTE,
    usedBytes: 3.1 * GIGABYTE,
  },
  storagePct: 3,
  specs: [
    {
      id: "lena-lunch",
      name: "Team Lunch",
      date: "2026-11-12",
      made: "2026-10-22",
      opened: 3,
      qrStyle: "dots",
    },
    {
      id: "lena-pancakes",
      name: "Sunday Pancakes",
      date: null,
      made: "2026-11-08",
      look: ["evening", 3],
      approved: 23,
      last: "2026-11-08",
    },
    {
      id: "lena-40th",
      name: "Lena's 40th",
      date: "2026-11-07",
      made: "2026-10-10",
      look: ["party", 2],
      approved: 128,
    },
    {
      id: "lena-halloween",
      name: "Halloween at Ours",
      date: "2026-10-31",
      made: "2026-10-01",
      look: ["party", 8],
      approved: 96,
    },
    {
      id: "lena-book-club",
      name: "Book Club",
      date: null,
      made: "2026-06-02",
      look: ["evening", 6],
      approved: 14,
      last: "2026-06-02",
    },
  ],
  guests: [],
  deleted: [],
  trail: ["lena-pancakes", "lena-40th", "lena-lunch"],
});

export const HOSTS: Record<HostId, Host> = {
  maya: MAYA,
  nia: NIA,
  "nia-week": NIA_WEEK,
  ari: ARI,
  jo: JO,
  rae: RAE,
  lena: LENA,
};

/** An event's day as the page places it (`dayOf`), or a guest album's: what a sort by date reads. */
export function dayById(h: Host): ReadonlyMap<string, string | null> {
  const out = new Map<string, string | null>();
  for (const e of h.hosted) out.set(e.id, e.date ?? e.lastArrival?.day ?? null);
  for (const g of h.guests) out.set(g.eventId, g.lastUploadAt.slice(0, 10));
  for (const d of h.deleted) out.set(d.id, d.date);
  return out;
}
