import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, ONE BAD ACTOR, AND EVERYONE THE CLOSED DOORS TOUCH.
 *
 * Maya and Jay's wedding on 14 June, hosted by Maya: the same party
 * `identity-door` and `voice-guest` draw, so a reader who has walked those
 * boards recognises the room. What this board adds is the person it exists
 * for. Dom Hale confirmed an email at the door (domhale88@example.com), so
 * every photograph he adds carries a proved address, and he keeps adding ones
 * nobody wants: festival lasers and a nightclub at a wedding. Maya can hide
 * each one; nothing today stops the next. Rick is the same trouble on a
 * names-only party: a typed name and nothing else, which is why a block on him
 * can only hold on the one browser he used.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s own
 * rule, carried): a board's directory leaves with its ruling, and
 * `sandbox/gallery-fixtures.ts` is being reshaped by another lane this round.
 *
 * ★ THE ADDRESSES ARE `example.com` AND THE STILLS ARE THE TWELVE BOOTSTRAP
 * PHOTOGRAPHS every board reuses (bible 18: no new asset, nothing to track).
 * Nothing here is a real person.
 */

export const EVENT = {
  name: "Maya & Jay",
  date: "14 June",
  token: "maya-jay",
  /** The album's size, photos and videos, before the block moves Dom's out. */
  photos: 48,
  /** THE ONE COUNT (`getEventGuests`): approved uploaders, never the host. */
  guests: 9,
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

/** The bad actor on this board: a confirmed address, so the block holds everywhere. */
export const DOM: Person = {
  id: "dom",
  name: "Dom Hale",
  email: "domhale88@example.com",
  verified: true,
  seed: "es-dom",
  uploads: 7,
};

/**
 * The same trouble on a names-only party: a typed name and one browser. A block
 * on Rick holds on that browser alone, which is why the block's sheet offers
 * Require verified emails beside him.
 */
export const RICK: Person = {
  id: "rick",
  name: "Rick",
  email: null,
  verified: false,
  uploads: 5,
};

/**
 * Everyone else who added a photograph, the host's own list: confirmed guests
 * first with their addresses, then the typed names with the mark, exactly the
 * order `getEventGuestList` returns them in. Dom sits among them until the
 * block takes him off.
 */
export const GUESTS: readonly Person[] = [
  { id: "leah", name: "Leah Park", email: "leah.park@example.com", verified: true, seed: "es-leah", uploads: 9 },
  { id: "sam", name: "Sam Okafor", email: "sam.okafor@example.com", verified: true, seed: "es-sam", uploads: 6 },
  DOM,
  { id: "ana", name: "Ana Ruiz", email: "ana.ruiz@example.com", verified: true, seed: "es-ana", uploads: 5 },
  { id: "noor", name: "Noor Haddad", email: "noor.haddad@example.com", verified: true, seed: "es-noor", uploads: 4 },
  { id: "theo", name: "Theo Grant", email: "theo.grant@example.com", verified: true, seed: "es-theo", uploads: 3 },
  { id: "marcus", name: "Marcus Lee", email: "marcus.lee@example.com", verified: true, seed: "es-marcus", uploads: 2 },
  { id: "priya", name: "Priya", email: null, verified: false, uploads: 4 },
  { id: "rose", name: "Grandma Rose", email: null, verified: false, uploads: 2 },
];

/** The same list once Dom is out: off the list and every count in one step. */
export const GUESTS_AFTER: readonly Person[] = GUESTS.filter(
  (p) => p.id !== DOM.id,
);

/** Two newcomers who confirmed an address and wait for Maya (approve newcomers). */
export const NEWCOMERS = [
  { id: "ben", name: "Ben Ortiz", email: "ben.ortiz@example.com", seed: "es-ben", when: "2 min ago" },
  { id: "chloe", name: "Chloe Tan", email: "chloe.tan@example.com", seed: "es-chloe", when: "Just now" },
] as const;

/** Who is blocked, as the host's list reads them after this evening. */
export const BLOCKED = [
  { ...DOM, when: "Tonight, 9:14 pm", note: "7 uploads in Deleted" },
  { ...RICK, when: "Tonight, 8:02 pm", note: "On one browser only" },
] as const;

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

/** The two doors of an invite list: an address on it, and one that is not. */
export const LISTED = { name: "Ana Ruiz", email: "ana.ruiz@example.com" } as const;
export const UNLISTED = { name: "Kev", email: "kev.m.1991@example.com" } as const;

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
  still("a1", "wedding-petals", { uploaderName: "Leah Park", isVerified: true }),
  still("a2", "wedding-golden", { uploaderName: "Sam Okafor", isVerified: true }),
  still("a3", "wedding-toast", { uploaderName: "Priya", isVerified: false }),
  still("a4", "reception-table", { uploaderName: "Ana Ruiz", isVerified: true }),
  still("a5", "wedding-rings", { uploaderName: "Noor Haddad", isVerified: true }),
  still("a6", "wedding-arch", { uploaderName: "Theo Grant", isVerified: true }),
  still("a7", "reception-hall", { uploaderName: "Leah Park", isVerified: true }),
  still("a8", "party-balloons", { uploaderName: "Grandma Rose", isVerified: false }),
];

/**
 * DOM'S SEVEN, the reason for the board: a nightclub, festival lasers and a
 * concert crowd, at a wedding. Nothing graphic is needed to make the point; a
 * stranger filling someone's album with somebody else's night is enough.
 */
export const DOM_UPLOADS: readonly GridMedia[] = [
  still("d1", "festival-lights"),
  still("d2", "party-dj"),
  still("d3", "concert-confetti"),
  still("d4", "festival-crowd"),
  still("d5", "festival-lights"),
  still("d6", "party-dj"),
  still("d7", "concert-confetti"),
].map((m) => ({
  ...m,
  uploaderName: DOM.name,
  isVerified: true,
  uploaderEmail: DOM.email,
}));

/** The photograph Maya has open when she decides: one of Dom's, credited. */
export const OPEN_ITEM: GridMedia = { ...DOM_UPLOADS[1], likeCount: 0 };
/** Its place in the album, as the credit's counter reads it. */
export const OPEN_POSITION = "17 of 48";

/** Rick's five, on the names-only party. */
export const RICK_UPLOADS: readonly GridMedia[] = DOM_UPLOADS.slice(0, 5).map(
  (m, i) => ({
    ...m,
    id: `r${i + 1}`,
    uploaderName: RICK.name,
    isVerified: false,
    uploaderEmail: null,
  }),
);

/**
 * THE REVIEW QUEUE on a moderated night: Dom's three waiting among four of
 * everyone else's. What Maya hides here is what the `review` entry answers.
 */
export const WAITING: readonly GridMedia[] = [
  still("w1", "wedding-toast", { status: "pending" }),
  { ...DOM_UPLOADS[0], id: "w2", status: "pending" },
  still("w3", "reception-table", { status: "pending" }),
  { ...DOM_UPLOADS[3], id: "w4", status: "pending" },
  still("w5", "wedding-golden", { status: "pending" }),
  { ...DOM_UPLOADS[2], id: "w6", status: "pending" },
  still("w7", "wedding-rings", { status: "pending" }),
];
/** The three of Dom's Maya has just hidden. */
export const HIDDEN_IDS: ReadonlySet<string> = new Set(["w2", "w4", "w6"]);
