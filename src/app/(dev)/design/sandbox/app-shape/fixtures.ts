import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE HOST, ONE SATURDAY NIGHT: the fixtures every option on this board is
 * drawn on.
 *
 * Maya is hosting a wedding that is happening RIGHT NOW (248 in the album, 12
 * waiting on her, a reel half made, 23 guests), she hosted a rooftop party last
 * month, she is closing out her dad's birthday, she saved a friend's event, she
 * deleted one, and she is at 96 percent of her storage. That is deliberately
 * the BUSIEST honest day a Partyreel host has: a shape that holds here holds on
 * a quiet Tuesday, and the reverse is how the app got to where it is.
 *
 * ★ THE NUMBERS ARE THE ONES THE APP WOULD SHOW. `itemCount` is what the event
 * page's stat line counts (approved + hidden, never pending), `pending` is the
 * review queue, `guests` is distinct contributors. So an option that claims to
 * say "what needs you" is drawn against a day that has something to say.
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

/** The twelve waiting on Maya. Pending, so the review grid dims them. */
export const QUEUE: GridMedia[] = roll("queue", 12, 7).map((m) => ({
  ...m,
  status: "pending" as const,
}));

/** What arrived across every event in the last hour, newest first. */
export const ARRIVALS: GridMedia[] = roll("new", 12, 21);

/** The reel's cut, as the studio's filmstrip holds it. */
export const REEL: GridMedia[] = roll("reel", 8, 3);

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
  views: number;
  /** null when no reel has been made yet. */
  reelClips: number | null;
  accepting: boolean;
  visibility: "Public" | "Password" | "Private";
  /** Newest first, for the strip a row or a wall draws. */
  newest: GridMedia[];
  /** What the app would say needs doing, or null when nothing does. */
  needs: string | null;
};

const img = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

export const EVENTS: HostEvent[] = [
  {
    id: "wedding",
    name: "Maya & Jay's Wedding",
    dateLabel: "Saturday, 14 June",
    cover: img(0),
    items: 248,
    pending: 12,
    guests: 23,
    views: 184,
    reelClips: 8,
    accepting: true,
    visibility: "Public",
    newest: ARRIVALS.slice(0, 6),
    needs: "12 photos waiting for you",
  },
  {
    id: "rooftop",
    name: "Rooftop Summer Party",
    dateLabel: "Friday, 16 May",
    cover: img(8),
    items: 86,
    pending: 0,
    guests: 9,
    views: 61,
    reelClips: null,
    accepting: true,
    visibility: "Password",
    newest: ALBUM.slice(12, 18),
    needs: "No reel yet",
  },
  {
    id: "sixtieth",
    name: "Dad's 60th",
    dateLabel: "Sunday, 6 April",
    cover: img(5),
    items: 41,
    pending: 0,
    guests: 4,
    views: 28,
    reelClips: 4,
    accepting: false,
    visibility: "Private",
    newest: ALBUM.slice(24, 30),
    needs: null,
  },
];

/** The one she is inside for every event-page option. */
export const LIVE = EVENTS[0];

/** A friend's event she saved: the sixth chip's contents on the home. */
export const SAVED = {
  name: "Priya & Sam's Engagement",
  host: "Priya",
  dateLabel: "Saturday, 3 May",
  cover: img(10),
};

/** The events bin: restore only, no purge (the dashboard's "Deleted"). */
export const DELETED_EVENT = {
  name: "Office Summer Social",
  dateLabel: "Friday, 11 July",
  cover: img(6),
  countdown: "22 days left",
};

/* ── Everything else on the day ──────────────────────────────────────────── */

export const HOST = {
  name: "Maya Chen",
  email: "maya@chen.co",
  initial: "M",
  plan: "Pro",
  slug: "maya",
  followers: 41,
  following: 18,
} as const;

/**
 * At the cap and past the amber line: 19.2 of 20 GB, 96 percent, with 1.4 GB
 * still standing by in the bins. Every option that draws the meter draws it
 * loud, because a strip that only matters at 96 percent has to be judged at 96.
 */
export const STORAGE = {
  used: 19.2 * 1024 ** 3,
  cap: 20 * 1024 ** 3,
  pct: 96,
  standby: 1.4 * 1024 ** 3,
} as const;

/** Named, signed-in uploaders on the wedding (the Guests section's list). */
export const GUESTS = [
  { name: "Jay Ortega", initial: "J", items: 41 },
  { name: "Nina Patel", initial: "N", items: 28 },
  { name: "Tom Reilly", initial: "T", items: 22 },
  { name: "Grace Liu", initial: "G", items: 19 },
  { name: "Owen Marsh", initial: "O", items: 14 },
  { name: "Sadie Cole", initial: "S", items: 11 },
] as const;

/** Her own media, the two personal feeds the home mixes in today. */
export const MY_UPLOADS: GridMedia[] = roll("mine", 9, 31);
export const MY_LIKES: GridMedia[] = roll("liked", 9, 15);

/** The event link every share surface shows. */
export const JOIN_URL = "partyreel.com/e/maya-and-jay";
