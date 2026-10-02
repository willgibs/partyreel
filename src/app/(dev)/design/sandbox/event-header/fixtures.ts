import { marketingImage } from "@/lib/constants/marketing-media";
import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";

/**
 * ONE WEDDING, SEEN FROM BOTH SIDES OF ITS CODE: Maya and Jay's, the party the
 * door boards stand at (`locked-door` draws its door), so the head a guest
 * walks into after the door's reveal is the head of the same album.
 *
 * Two moments each side, because a head is judged at both ends of its life:
 *  - the GUEST meets the album in full swing (214 photos from 31 guests, the
 *    reel playing), or as the first guest of the night, before anything is in
 *    it (no photograph to lead with, which is the case a photo-led head owes);
 *  - the HOST opens her hub tonight (the party live: 2 people at the door, 8
 *    photos waiting in Review), or the week before (nothing in the album, the
 *    code never opened, the checklist at the head).
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s
 * rule, carried by every board since): a board's folder leaves whole when it
 * retires. NOTHING HERE IS A REAL PERSON, and every photograph is one of the
 * bootstrap stills every board reuses (bible 9: no new asset, nothing to
 * track). The copy is placeholder, judged for size and wrapping only.
 */

export const EVENT = {
  name: "Maya & Jay",
  /** `formatEventDate` reads it as both heads do. */
  date: "2026-09-12",
  /** The host's note to her guests: a real one's length, so a head wraps as it will. */
  description:
    "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
  /** What every code encodes (the permanent link a printed card carries). */
  joinUrl: "https://partyreel.com/e/9f3c2a71d84b4e06a1c5b8e2f0d97c31",
  /** What a host reads: her claimed slug. */
  prettyUrl: "https://partyreel.com/e/maya-and-jay",
  qrStyle: "classic",
} as const;

/** The host, as the bylines, the bar's account and her own plate need her. */
export const HOST = {
  name: "Maya",
  fullName: "Maya Alvarez",
  email: "maya@example.com",
  seed: "eh-maya",
} as const;

/** The guest reading the album: a name she typed at the door (the header's name menu). */
export const GUEST = { name: "Priya" } as const;

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
 * THE ALBUM, NEWEST FIRST. The stills are mostly 3:2, so the declared ratios
 * vary as a real party's do (a tile is `object-cover`), and the rows read as
 * an album rather than a contact sheet.
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
 * THE REEL'S OPENING STILLS: the server's own take (`readHubReel`: who
 * uploaded, how liked), which Settings already shows the reel's looks on. A
 * head that leads with photographs leads with these, never with whichever
 * upload happened to land last.
 */
export const REEL: readonly string[] = [
  still("wedding-toast").src,
  still("reception-hall").src,
  still("wedding-golden").src,
  still("wedding-arch").src,
];

/** The album's newest previews, which the door's light samples and its opening shows. */
export const NEWEST: readonly string[] = ALBUM.slice(0, 4).map((p) => p.src);

/** The guest's two moments. */
export type GuestMoment = "full" | "empty";

export const GUEST_MOMENTS: Record<
  GuestMoment,
  { photos: number; guests: number; reel: boolean }
> = {
  full: { photos: 214, guests: 31, reel: true },
  empty: { photos: 0, guests: 0, reel: false },
};

/** The host's two moments. */
export type HostMoment = "tonight" | "before";

export type HostFacts = {
  photos: number;
  guests: number;
  views: number;
  /** People at the door waiting for her yes (a gate's alone). */
  waiting: number;
  /** Photographs held in Review. */
  review: number;
  door: Door;
  reel: "live" | "short" | "off";
  /** The checklist's facts (`lib/events/readiness.ts`), the server's read. */
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

export const HOST_MOMENTS: Record<HostMoment, HostFacts> = {
  // Maya lets each newcomer in herself (the door's `approve` gate), so a party
  // in full swing has people at the door and photographs in Review: every
  // signal the head carries is lit at once.
  tonight: {
    photos: 214,
    guests: 31,
    views: 486,
    waiting: 2,
    review: 8,
    door: "approve",
    reel: "live",
    ready: {
      ...READY_BASE,
      door: "approve",
      guestsIn: 31,
      approved: 214,
      playable: 2,
      opened: 486,
    },
  },
  // The week before: a Public album, nothing in it, the code never opened.
  // The checklist stands at the head, which is production's `list=head`.
  before: {
    photos: 0,
    guests: 0,
    views: 0,
    waiting: 0,
    review: 0,
    door: "open",
    reel: "short",
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
