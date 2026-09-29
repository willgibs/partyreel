import { hostEvent } from "@/components/app/event-settings/testing/host-event";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import type { Door } from "@/lib/event/door/door";

import type { JobEvent, ReadyFacts } from "./readiness";

/**
 * MAYA'S 30TH, THREE MOMENTS, AND THE THREE EVENTS ON HER DASHBOARD.
 *
 * One host, one party: Maya made her 30th an hour ago (named it, picked a
 * code style, touched nothing else), then seeded three photos and set the
 * date without ever opening the code, then the night before had everything
 * done. The same three moments are drawn under every home the checklist
 * could live in, so a reader compares homes, never events.
 *
 * Her dashboard holds three: the 30th, a wedding she is hosting next month
 * (Private, she lets each guest in herself), and last summer's reunion, long
 * done. Friday 2 October 2026 is "today" for every date the drawings read.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD: a board's folder
 * leaves whole when it retires. ★ NOTHING HERE IS A REAL PERSON, and every
 * photograph is one of the bootstrap stills every board reuses (bible 9: no
 * new asset, nothing to track). ★ The event row is production's own test
 * fixture (`hostEvent`, the wizard's defaults), so a field this board does not
 * set is exactly what a new event carries.
 */

export const SITE = "https://partyreel.com";
export const TODAY = "2026-10-02";
export const HOST = { name: "Maya", seed: "er-maya" } as const;

export type Photo = { id: string; src: string; w: number; h: number };

const photo = (id: string): Photo => {
  const m = marketingImage(id);
  return { id, src: m.src, w: m.width, h: m.height };
};

/** Her own photos first (the seed), then her guests'. */
const ROLL: readonly Photo[] = [
  "party-balloons",
  "party-dj",
  "festival-lights",
  "reception-table",
  "concert-confetti",
  "festival-crowd",
  "wedding-toast",
  "reception-hall",
  "wedding-petals",
  "wedding-golden",
  "wedding-arch",
  "wedding-rings",
].map(photo);

export const THIRTIETH_ID = "8b1f5e0a-30a0-4c30-8a30-000000000030";
export const THIRTIETH_TOKEN = "3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f";

/* ── the 30th, three moments ─────────────────────────────────────────────── */

export type MomentId = "fresh" | "seeded" | "ready";

export type Moment = {
  id: MomentId;
  /** The frame's title: when this is, in her week. */
  title: string;
  facts: ReadyFacts;
  photos: readonly Photo[];
  /** People who have added to it (the one count). */
  guests: number;
};

const BASE: ReadyFacts = {
  door: "open",
  hasPassword: false,
  guestsIn: 0,
  invited: 0,
  acceptingUploads: true,
  approved: 0,
  playable: 0,
  showReel: true,
  liveReelEnabled: true,
  eventDate: null,
  description: null,
  opened: 0,
  storagePct: 1,
};

export const NOTE =
  "Add everything you take tonight, blurry ones included. We'll put the best on the big screen.";

export const MOMENTS: Record<MomentId, Moment> = {
  fresh: {
    id: "fresh",
    title: "An hour after Create",
    facts: BASE,
    photos: [],
    guests: 0,
  },
  seeded: {
    id: "seeded",
    title: "Three photos in, the code never opened",
    facts: {
      ...BASE,
      approved: 3,
      playable: 3,
      eventDate: "2026-10-10",
    },
    photos: ROLL.slice(0, 3),
    guests: 0,
  },
  ready: {
    id: "ready",
    title: "The night before, everything done",
    facts: {
      ...BASE,
      approved: 12,
      playable: 12,
      eventDate: "2026-10-10",
      description: NOTE,
      opened: 6,
      guestsIn: 4,
    },
    photos: ROLL,
    guests: 4,
  },
};

export const MOMENT_ORDER: readonly MomentId[] = ["fresh", "seeded", "ready"];

/** The 30th's row at a moment, as production's settings read it. */
export function eventAt(m: Moment, door: Door = m.facts.door): HostEvent {
  return hostEvent({
    id: THIRTIETH_ID,
    name: "Maya's 30th",
    qr_token: THIRTIETH_TOKEN,
    qr_style: "classic",
    event_date: m.facts.eventDate,
    description: m.facts.description,
    door,
    visibility: door === "open" ? "open" : "private",
    has_password: door === "password",
    accepting_uploads: m.facts.acceptingUploads,
    show_reel: m.facts.showReel,
    allow_videos: true,
  });
}

/** The door's own numbers at a moment. */
export function countsAt(m: Moment, waiting = 0): DoorCounts {
  return {
    in: m.facts.guestsIn,
    inByName: 0,
    waiting,
    invited: m.facts.invited,
    joined: 0,
  };
}

export const THIRTIETH_URL = `${SITE}/e/${THIRTIETH_TOKEN}`;
export const THIRTIETH_READABLE = "partyreel.com/e/3f0c1d2e…";

/* ── the code's five doors (the `door` ask) ──────────────────────────────── */

export type DoorStateId =
  | "public"
  | "approve"
  | "password"
  | "only-me"
  | "paused";

export type DoorState = {
  id: DoorStateId;
  title: string;
  door: Door;
  acceptingUploads: boolean;
  waiting: number;
};

export const DOOR_STATES: readonly DoorState[] = [
  {
    id: "public",
    title: "Public, uploads open",
    door: "open",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "approve",
    title: "Private, you let each in, 2 waiting",
    door: "approve",
    acceptingUploads: true,
    waiting: 2,
  },
  {
    id: "password",
    title: "Private, a password",
    door: "password",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "only-me",
    title: "Only me",
    door: "private",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "paused",
    title: "Public, uploads paused",
    door: "open",
    acceptingUploads: false,
    waiting: 0,
  },
];

/* ── her dashboard: three events, two days ───────────────────────────────── */

export type DashEvent = JobEvent & {
  dateLabel: string;
  cover: Photo | null;
  stills: readonly Photo[];
  review: boolean;
};

const thirtieth: DashEvent = {
  id: THIRTIETH_ID,
  name: "Maya's 30th",
  dateLabel: "October 10",
  ...MOMENTS.seeded.facts,
  pending: 0,
  waiting: 0,
  reelItems: 3,
  cover: ROLL[0]!,
  stills: ROLL.slice(0, 3),
  review: false,
};

const wedding: DashEvent = {
  id: "8b1f5e0a-30a0-4c30-8a30-00000000ad01",
  name: "Sam & Alex's Wedding",
  dateLabel: "November 14",
  ...BASE,
  door: "approve",
  eventDate: "2026-11-14",
  description: "Everything from the ceremony and the dancing after.",
  opened: 3,
  pending: 0,
  waiting: 0,
  reelItems: 0,
  cover: null,
  stills: [],
  review: true,
};

const reunion: DashEvent = {
  id: "8b1f5e0a-30a0-4c30-8a30-0000000e2025",
  name: "The Lake Reunion",
  dateLabel: "July 19, 2025",
  ...BASE,
  approved: 214,
  playable: 214,
  reelItems: 214,
  eventDate: "2025-07-19",
  description: "Five days at the lake, every photo from everyone.",
  opened: 88,
  guestsIn: 23,
  pending: 0,
  waiting: 0,
  cover: photo("wedding-arch"),
  stills: [photo("wedding-arch"), photo("wedding-petals")],
  review: false,
};

export type DayId = "quiet" | "busy";

export const DAYS: Record<
  DayId,
  { id: DayId; title: string; events: readonly DashEvent[]; storagePct: number }
> = {
  quiet: {
    id: "quiet",
    title: "A quiet Friday: nothing waits on any event",
    events: [thirtieth, wedding, reunion],
    storagePct: 38,
  },
  busy: {
    id: "busy",
    title: "The 30th's night: two at its door, twelve to review",
    events: [
      { ...thirtieth, door: "approve", waiting: 2, opened: 9 },
      { ...wedding, pending: 12 },
      reunion,
    ],
    storagePct: 38,
  },
};

export const DAY_ORDER: readonly DayId[] = ["quiet", "busy"];
