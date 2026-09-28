import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, AND EVERYONE ITS DOOR TOUCHES.
 *
 * Maya and Jay's wedding on 14 June, hosted by Maya on Free: the party
 * `event-safety`, `identity-door` and `voice-guest` draw, so a reader who has
 * walked those boards recognises the room. Dom Hale, event-safety's bad actor,
 * is blocked already (`safety-wiring` builds that), so he stands in the Guests
 * room's Blocked foot and nowhere else.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s own
 * rule, carried): event-safety retires in `safety-wiring`, so what this board
 * ported from it lives here, copied.
 *
 * ★ THE ADDRESSES ARE `example.com` AND THE STILLS ARE THE BOOTSTRAP
 * PHOTOGRAPHS every board reuses (bible 9: no new asset, nothing to track).
 * Nothing here is a real person.
 */

export const EVENT = {
  name: "Maya & Jay",
  date: "14 June",
  /** The date field's own value, as the form holds it. */
  isoDate: "2026-06-14",
  /** What the join page says under the name (the event's description). */
  note: "Our wedding, and every photo you took of it.",
  token: "maya-jay",
  /** The album's size, photos and videos. */
  photos: 48,
  /** THE ONE COUNT (`getEventGuests`): approved uploaders, never the host. */
  guests: 8,
  /** The link's views, as the hub's metadata row counts them. */
  views: 112,
} as const;

export const HOST = {
  name: "Maya Chen",
  first: "Maya",
  seed: "es-maya",
} as const;

/** Somebody at this party, as the host's own room reads them. */
export type Person = {
  id: string;
  name: string;
  /** A CONFIRMED address, which only the host ever sees; null for a typed name. */
  email: string | null;
  /** Confirmed an email (a seeded face); false is a typed name (the plain disc and the mark). */
  verified: boolean;
  seed?: string;
  /** Live uploads in this album. */
  uploads: number;
};

/**
 * Everyone who added a photograph, the host's own list: confirmed guests first
 * with their addresses, then the typed names with the mark, the order
 * `getEventGuestList` returns them in.
 */
export const GUESTS: readonly Person[] = [
  {
    id: "leah",
    name: "Leah Park",
    email: "leah.park@example.com",
    verified: true,
    seed: "es-leah",
    uploads: 9,
  },
  {
    id: "sam",
    name: "Sam Okafor",
    email: "sam.okafor@example.com",
    verified: true,
    seed: "es-sam",
    uploads: 6,
  },
  {
    id: "ana",
    name: "Ana Ruiz",
    email: "ana.ruiz@example.com",
    verified: true,
    seed: "es-ana",
    uploads: 5,
  },
  {
    id: "noor",
    name: "Noor Haddad",
    email: "noor.haddad@example.com",
    verified: true,
    seed: "es-noor",
    uploads: 4,
  },
  {
    id: "theo",
    name: "Theo Grant",
    email: "theo.grant@example.com",
    verified: true,
    seed: "es-theo",
    uploads: 3,
  },
  {
    id: "marcus",
    name: "Marcus Lee",
    email: "marcus.lee@example.com",
    verified: true,
    seed: "es-marcus",
    uploads: 2,
  },
  { id: "priya", name: "Priya", email: null, verified: false, uploads: 4 },
  {
    id: "rose",
    name: "Grandma Rose",
    email: null,
    verified: false,
    uploads: 2,
  },
];

/** Two newcomers who confirmed an address and wait for Maya. */
export const NEWCOMERS = [
  {
    id: "ben",
    name: "Ben Ortiz",
    email: "ben.ortiz@example.com",
    seed: "es-ben",
    when: "2 min ago",
  },
  {
    id: "chloe",
    name: "Chloe Tan",
    email: "chloe.tan@example.com",
    seed: "es-chloe",
    when: "Just now",
  },
] as const;

/** Who is blocked (safety-wiring's per-event block, his `blocked=foot`). */
export const BLOCKED = [
  {
    id: "dom",
    name: "Dom Hale",
    email: "domhale88@example.com",
    verified: true,
    seed: "es-dom",
    uploads: 0,
    when: "Tonight, 9:14 pm",
  },
] as const;

/** People past the door who have not added a photograph (the `inside` ask). */
export const NO_PHOTOS: readonly Person[] = [
  {
    id: "ines",
    name: "Ines Varga",
    email: "ines.varga@example.com",
    verified: true,
    seed: "es-ines",
    uploads: 0,
  },
  {
    id: "tom",
    name: "Tom Achebe",
    email: "tom.achebe@example.com",
    verified: true,
    seed: "es-tom",
    uploads: 0,
  },
  { id: "bea", name: "Aunt Bea", email: null, verified: false, uploads: 0 },
];
/** Everyone past the door, photos or not: the count the `inside` count option says. */
export const INSIDE_TOTAL = 31;

/**
 * THE INVITE LIST: a wedding's worth. The first few are drawn; the rest are a
 * count, because two hundred rows is what the editor has to survive, not what a
 * picture of it has to show.
 */
export const INVITED = [
  "leah.park@example.com",
  "sam.okafor@example.com",
  "ana.ruiz@example.com",
  "noor.haddad@example.com",
  "theo.grant@example.com",
  "marcus.lee@example.com",
  "ben.ortiz@example.com",
  "chloe.tan@example.com",
] as const;
export const INVITED_TOTAL = 142;

/** A pasted column, the way a spreadsheet hands it over, two lines unreadable. */
export const PASTED = [
  "jules.moreau@example.com",
  "ravi.shah@example.com",
  "hannah.berg@example.com",
  "jay's mum",
  "otto.lind@example.com",
  "kim.ng@example",
  "lara.quinn@example.com",
] as const;
export const PASTED_FOUND = 36;
export const PASTED_BAD = ["jay's mum", "kim.ng@example"] as const;

/* ── the photographs ─────────────────────────────────────────────────────── */

const byId = (id: string) => {
  const img = MARKETING_IMAGES.find((m) => m.id === id);
  if (!img) throw new Error(`no bootstrap still called ${id}`);
  return img;
};

function still(
  key: string,
  imageId: string,
  extra: Partial<GridMedia> = {},
): GridMedia {
  const img = byId(imageId);
  return {
    id: key,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: img.width,
    height: img.height,
    ...extra,
  };
}

/** The wedding's own album: the photographs everyone came for. */
export const ALBUM: readonly GridMedia[] = [
  still("a1", "wedding-petals", {
    uploaderName: "Leah Park",
    isVerified: true,
  }),
  still("a2", "wedding-golden", {
    uploaderName: "Sam Okafor",
    isVerified: true,
  }),
  still("a3", "wedding-toast", { uploaderName: "Priya", isVerified: false }),
  still("a4", "reception-table", {
    uploaderName: "Ana Ruiz",
    isVerified: true,
  }),
  still("a5", "wedding-rings", {
    uploaderName: "Noor Haddad",
    isVerified: true,
  }),
  still("a6", "wedding-arch", { uploaderName: "Theo Grant", isVerified: true }),
  still("a7", "reception-hall", {
    uploaderName: "Leah Park",
    isVerified: true,
  }),
  still("a8", "party-balloons", {
    uploaderName: "Grandma Rose",
    isVerified: false,
  }),
];

/** The photograph the reel's looks are shown on (the event's own, as settings uses one). */
export const LOOK_STILL = ALBUM[2].url;

/**
 * THE REVIEW QUEUE on a night with review on, for the `queue` ask's Review:
 * four of everyone's, and three more landed since the host opened the room,
 * which his `arrivals=prompt` keeps behind a line rather than sliding in under
 * a thumb.
 */
export const QUEUE: readonly GridMedia[] = [
  still("w1", "wedding-toast", { status: "pending" }),
  still("w3", "reception-table", { status: "pending" }),
  still("w5", "wedding-golden", { status: "pending" }),
  still("w7", "wedding-rings", { status: "pending" }),
];
export const JUST_LANDED = 3;
