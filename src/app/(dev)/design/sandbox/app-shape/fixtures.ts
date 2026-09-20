import type { GridMedia } from "@/components/app/media-grid";
import { describeArrivals, pickArrivalWindow } from "@/lib/dashboard/arrivals";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import type { PulseTile } from "@/lib/db/queries/pulse";

/**
 * THREE HOSTS, EACH AT A DIFFERENT POINT: the fixtures `home-states` (app-shape
 * round two) draws its three asks on. Will approved the pulse (`home=pulse`,
 * 2026-09-20) while warning it needs to hold at both ends of a host's life, not
 * only on Maya's busiest Saturday: "it is likely worth more dashboard
 * explorations from here to figure out what feels best across all host states
 * (from a new empty host to a first-event-just-created host to a busy host)."
 *
 * ★ ROUND ONE'S FIXTURE IS KEPT, NOT REPLACED. Maya Chen and her Saturday night
 * (`EVENTS`, `HOST`, `STORAGE`, `ARRIVALS`) drew round one's eight decisions and
 * still draw `busy` here; this file only adds the two states she never was.
 * Round one's `QUEUE`, `REEL`, `GUESTS`, `MY_UPLOADS`, `MY_LIKES` and `SAVED`
 * drew the personal-feed and event-room previews of `home.tsx`, `event.tsx` and
 * `account.tsx`, all retired this round (their axes are ruled and wired); those
 * fixtures retired with them rather than sit unread.
 */

/* ── The photographs ─────────────────────────────────────────────────────── */

/** The shapes a phone's camera roll holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/**
 * ★ THE ORDER IS SEARCHED, NOT CYCLED (gallery-width's fixture, 2026-09-18).
 * Twelve stills over forty tiles repeat whatever the order, and a plain cycle
 * lines its repeats up so the same photograph lands twice in one row. This
 * order keeps a still off its own neighbours in the first screen at every
 * column count these frames draw.
 */
const ORDER = [
  2, 0, 10, 8, 11, 4, 1, 6, 9, 3, 5, 11, 7, 4, 8, 2, 10, 6, 9, 0, 1, 3, 8, 5,
  11, 7, 4, 2, 0, 1, 6, 9, 5, 8, 10, 7, 2, 3, 0, 11,
] as const;

/** About two thirds of the roll stands up, as a guest's phone shoots it. */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPPWPLTPFPLPSPWLP";

function roll(prefix: string, n: number, from = 0): GridMedia[] {
  return Array.from({ length: n }, (_, k) => {
    const i = (from + k) % ROLL.length;
    const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
    const [w, h] = SHAPES[ROLL[i] as keyof typeof SHAPES];
    return {
      id: `${prefix}-${k}`,
      type: "photo",
      url: img.src,
      downloadUrl: img.src,
      status: "approved",
      width: w * 400,
      height: h * 400,
    } satisfies GridMedia;
  });
}

/** The wedding's album: forty, because the widest frame here holds six columns. */
export const ALBUM: GridMedia[] = roll("album", 40);

/** What arrived across every event in the last hour, newest first. */
export const ARRIVALS: GridMedia[] = roll("new", 12, 21);

/** A `GridMedia` as the pulse's own presigned `PulseTile` (id, type, url only). */
const tileOf = (m: GridMedia): PulseTile => ({
  id: m.id,
  type: m.type,
  url: m.url,
});

/**
 * `pickArrivalWindow` and `describeArrivals` (`lib/dashboard/arrivals.ts`) want
 * real timestamps, not a hardcoded caption, so `busy` and `first` hand them
 * genuine `createdAt`s and read the real window and caption back — the same
 * function production calls, on data this file owns.
 *
 * ★ ONE `now`, READ ONCE. A module-level constant rather than `Date.now()`
 * inside a preview keeps every render and every screenshot agreeing with
 * itself for as long as the page stays open, exactly the purity `next-step.ts`
 * and `arrivals.ts` require of their own callers.
 */
export const NOW = Date.now();
export const TODAY = "2026-09-20";
export const TOMORROW = "2026-09-21";

/** `n` timestamps spread across the last `withinMinutes`, newest first. */
function minutesAgo(n: number, withinMinutes: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    new Date(NOW - Math.round((i / Math.max(1, n - 1)) * withinMinutes * 60_000)).toISOString(),
  );
}

/** Busy: twelve photographs this hour, across five events. */
export const BUSY_ARRIVALS: PulseTile[] = ARRIVALS.map(tileOf);
export const BUSY_ARRIVAL_TIMES: string[] = minutesAgo(BUSY_ARRIVALS.length, 55);

/**
 * Local midnight for `NOW`, the same shape `DashboardPage` computes once per
 * render and hands to `resolveNextSteps`/`getPulse`. Derived here rather than
 * inside a component so every preview reads one frozen clock rather than each
 * calling `new Date()` on its own render.
 */
export const START_OF_TODAY = new Date(
  new Date(NOW).getFullYear(),
  new Date(NOW).getMonth(),
  new Date(NOW).getDate(),
).getTime();

/**
 * The real window pick + caption for `BUSY_ARRIVAL_TIMES`, read through the
 * SAME two functions `getPulse` calls server-side — never a hand-typed
 * "12 in the last hour", which is exactly the kind of small lie `arrivals.ts`
 * exists to prevent.
 */
const busyWindow = pickArrivalWindow(BUSY_ARRIVAL_TIMES, NOW, START_OF_TODAY);
export const BUSY_ARRIVALS_CAPTION: string = describeArrivals(
  busyWindow.window,
  busyWindow.count,
  BUSY_ARRIVAL_TIMES[0] ?? null,
  NOW,
);

/* ── The events ──────────────────────────────────────────────────────────── */

export type HostEvent = {
  id: string;
  name: string;
  /** How the app writes the date today (`formatEventDate`'s output shape). */
  dateLabel: string;
  cover: string;
  /** Approved + hidden: what the event page's stat line counts. */
  items: number;
  /** The review queue. 0 when there is nothing waiting. */
  pending: number;
  guests: number;
  accepting: boolean;
  /** `YYYY-MM-DD`, matched against `next-step.ts`'s `tomorrowOf(TODAY)`. */
  eventDate: string | null;
  /** null when no reel has been made yet. */
  reelClips: number | null;
  /** Newest first, for the row a card's chrome may draw. */
  newest: GridMedia[];
};

const img = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/**
 * ★ BUSY, STRESS-TESTED. Round one's three events already forced a queue chip,
 * a reel-less event and a closed one; `collapsed` needs the band actually
 * crowded to argue anything, so two more events join Maya's Saturday, each
 * contributing ONE MORE next step through the real `resolveNextSteps`
 * precedence (`lib/dashboard/next-step.ts`): a second review queue (Trivia
 * Night), and an unopened event dated tomorrow with nothing in it yet, which
 * only reaches the PRINT step because it has no items to want a reel for
 * (Beach Bonfire). Five events, five steps, plus the storage line: six chips,
 * the whole reason this ask exists.
 */
export const BUSY_EVENTS: HostEvent[] = [
  {
    id: "wedding",
    name: "Maya & Jay's Wedding",
    dateLabel: "Saturday, 14 June",
    cover: img(0),
    items: 248,
    pending: 12,
    guests: 23,
    accepting: true,
    eventDate: null,
    reelClips: 8,
    newest: ARRIVALS.slice(0, 4),
  },
  {
    id: "trivia",
    name: "Trivia Night",
    dateLabel: "Thursday, 11 June",
    cover: img(3),
    items: 34,
    pending: 5,
    guests: 11,
    accepting: true,
    eventDate: null,
    reelClips: null,
    newest: ALBUM.slice(4, 8),
  },
  {
    id: "rooftop",
    name: "Rooftop Summer Party",
    dateLabel: "Friday, 16 May",
    cover: img(8),
    items: 86,
    pending: 0,
    guests: 9,
    accepting: true,
    eventDate: null,
    reelClips: null,
    newest: ALBUM.slice(12, 16),
  },
  {
    id: "sixtieth",
    name: "Dad's 60th",
    dateLabel: "Sunday, 6 April",
    cover: img(5),
    items: 41,
    pending: 0,
    guests: 4,
    accepting: false,
    eventDate: null,
    reelClips: 4,
    newest: ALBUM.slice(24, 28),
  },
  {
    id: "bonfire",
    name: "Beach Bonfire",
    dateLabel: "Monday, 21 September",
    cover: img(6),
    items: 0,
    pending: 0,
    guests: 0,
    accepting: true,
    eventDate: TOMORROW,
    reelClips: null,
    newest: [],
  },
];

/** A friend's event she saved: the events list's `saved` lens. */
export const BUSY_SAVED = {
  id: "engagement",
  name: "Priya & Sam's Engagement",
  host: "Priya",
  dateLabel: "Saturday, 3 May",
  cover: img(10),
};

/** The events bin: restore only, no purge (the dashboard's own "Deleted"). */
export const BUSY_DELETED = {
  id: "office-social",
  name: "Office Summer Social",
  dateLabel: "Friday, 11 July",
  cover: img(9),
  countdown: "22 days left",
};

export const HOST = {
  name: "Maya Chen",
  initial: "M",
  plan: "Pro",
} as const;

/** At the cap and past the amber line: 19.2 of 20 GB, 96 percent. */
export const BUSY_STORAGE = {
  used: 19.2 * 1024 ** 3,
  cap: 20 * 1024 ** 3,
  pct: 96,
  standby: 1.4 * 1024 ** 3,
} as const;

/* ── First: one event, made minutes ago ─────────────────────────────────── */

export const FIRST_HOST = {
  name: "Jordan Kim",
  initial: "J",
  plan: "Free",
} as const;

/**
 * ★ FREE, DELIBERATELY. `MAX_EVENTS.free` is 1 (`constants/tiers.ts`), so the
 * most common first event is also, immediately, an at-cap one: the create
 * button disables itself and the plan banner appears under every option here,
 * exactly as `DashboardPage` would actually render it. That interaction is a
 * real finding, not a distraction added for drama, so it is left to happen
 * rather than hidden by quietly making Jordan a Pro host.
 */
export const FIRST_EVENT: HostEvent = {
  id: "housewarming",
  name: "Jordan's Housewarming",
  dateLabel: "Saturday, 3 October",
  cover: img(4),
  items: 0,
  pending: 0,
  guests: 0,
  accepting: true,
  // Ten days out: neither today nor TOMORROW, so the baseline `pulse` option
  // reads exactly as a fresh event reads today, with no print step riding
  // along uninvited.
  eventDate: "2026-09-30",
  reelClips: null,
  newest: [],
};

export const FIRST_STORAGE = {
  used: 0,
  cap: 20 * 1024 ** 3,
  pct: 0,
  standby: 0,
} as const;

/** The event link the share-forward option puts in front of the host. */
export const JOIN_URL = "partyreel.com/e/jordans-housewarming";

/* ── Empty: nothing created yet ──────────────────────────────────────────── */

export const EMPTY_HOST = {
  name: "Alex Rivera",
  initial: "A",
  plan: "Free",
} as const;

export const EMPTY_STORAGE = {
  used: 0,
  cap: 20 * 1024 ** 3,
  pct: 0,
  standby: 0,
} as const;
