import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE CAST, SEEN FROM EVERY SIDE.
 *
 * Every picture on this board is the same wedding, so what moves between
 * options is the SHAPE of a person's page, never who is on it. It is a
 * names-mode wedding (Maya turned Require verified emails off). Two people
 * answer the round-two questions:
 *
 *  - MAYA hosts. Two albums, one open and one password-locked, so her page's
 *    grid has both badges, and one party she chose to show as a guest. Each
 *    list is newest first, the order the page merges them in.
 *  - PRIYA confirmed an email, claimed a handle and chose to show two of the
 *    parties she went to; the third she never turned on, so it shows nowhere
 *    (a page publishes nothing until its owner chooses it).
 *  - `@maya-g` is a dead handle. It is not drawn: the 404 is not a decision on
 *    this board, and it stays a 404. Neither is a claimed page with nothing on
 *    it: what that page says is `identity-profile.page`'s question.
 *
 * (The guest list and its three kinds of name, Priya, Jay and Nina, left with
 * `view-all` and `quick-look` for the `popups` board, 2026-09-27.)
 *
 * ★ EVERY PICTURE IS A MARKETING STILL, AND NOTHING NEW WAS ASKED FOR. The
 * bootstrap images are the only stills the repo holds; avatars are the same
 * files square-cropped by `object-cover`, exactly as the shipped page crops a
 * real one. No asset, no rights to track (Will, 2026-09-17/18).
 *
 * ★ NOT ONE ROW HERE IS REAL. No id, name, handle or date corresponds to
 * anything in Supabase; nothing on this board reads or writes a row.
 */

const IMG = MARKETING_IMAGES.map((m) => m.src);
const pic = (i: number) => IMG[i % IMG.length];

/* ── The parties ─────────────────────────────────────────────────────────── */

/** What the shipped `EventCard` needs, plus the badge the profile passes it. */
export type Party = {
  id: string;
  name: string;
  dateLabel: string;
  /** Null when the event is not open: the profile masks covers on gated events. */
  cover: string | null;
  /** "Password" | "Private" | null, exactly as `statusLabel` takes it. */
  lock: string | null;
};

export const WEDDING: Party = {
  id: "p-wedding",
  name: "Maya & Jay's Wedding",
  dateLabel: "14 Jun 2026",
  cover: pic(0),
  lock: null,
};

const RUBY: Party = {
  id: "p-ruby",
  name: "Ruby's 30th",
  dateLabel: "2 Jul 2026",
  cover: null,
  lock: "Password",
};

const PRIYA_30: Party = {
  id: "p-priya30",
  name: "Priya's 30th",
  dateLabel: "9 May 2026",
  cover: pic(2),
  lock: null,
};

const ENGAGEMENT: Party = {
  id: "p-engagement",
  name: "Noor and Sam's engagement",
  dateLabel: "21 Mar 2026",
  cover: pic(8),
  lock: null,
};

/** Priya's third party, never turned on for her page. It is in the fixture on
 *  purpose: nothing publishes until its owner chooses it, so the one place it
 *  may legally appear is nowhere. Every option reads `attended`, and this one
 *  is not in it. */
const CALDER: Party = {
  id: "p-calder",
  name: "The Calder family reunion",
  dateLabel: "11 Jun 2026",
  cover: pic(5),
  lock: null,
};

/* ── The photographs a person added ──────────────────────────────────────── */

/** The shapes a phone's camera roll actually holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  L: [4, 3],
  S: [1, 1],
  T: [9, 16],
} as const;

/**
 * A person's own frames. Declared at phone shapes and cropped by the tile,
 * because eleven of the fourteen stills are 3:2 landscapes and a wall of those
 * reads as a brick wall rather than an album.
 */
function roll(prefix: string, letters: string, from: number): GridMedia[] {
  return [...letters].map((letter, i) => {
    const [w, h] = SHAPES[letter as keyof typeof SHAPES];
    return {
      id: `${prefix}-${i}`,
      type: "photo" as const,
      url: pic(from + i * 3),
      downloadUrl: pic(from + i * 3),
      status: "approved" as const,
      width: w * 400,
      height: h * 400,
    };
  });
}

/* ── The people with a page ──────────────────────────────────────────────── */

export type Person = {
  id: string;
  name: string;
  /** The handle: a page exists only because this does. */
  slug: string;
  /** `seedFor(profiles.id)` stand-in: the colour the person wears everywhere. */
  seed: string;
  avatar: string | null;
  /** The page's one fact today: "Joined <Month Year>". */
  joined: string;
  /** The line under the name, written by the person. */
  line: string;
  hosted: Party[];
  /** Attended AND chosen for the page by this person (the opt-in). */
  attended: Party[];
  /** Attended and never turned on. Nothing renders it: it is here so "nothing
   *  until chosen" is a fact of the fixture and not a promise in a comment. */
  unshown: Party[];
  /** The frames they added to this wedding's album. */
  photos: GridMedia[];
};

export const MAYA: Person = {
  id: "u-maya",
  name: "Maya Okonjo",
  slug: "maya",
  seed: "pp-maya",
  avatar: pic(0),
  joined: "Joined March 2026",
  line: "Runs the parties, forgets to be in the photographs.",
  hosted: [RUBY, WEDDING],
  attended: [PRIYA_30],
  unshown: [],
  photos: roll("maya", "PLPSTPLPS", 1),
};

export const PRIYA: Person = {
  id: "u-priya",
  name: "Priya Raman",
  slug: "priya",
  seed: "pp-priya",
  avatar: pic(4),
  joined: "Joined June 2026",
  line: "Always the one with the camera out at midnight.",
  hosted: [],
  attended: [WEDDING, ENGAGEMENT],
  unshown: [CALDER],
  photos: roll("priya", "PPLTPSPLPPTL", 3),
};

/** Whose PAGE `way-back` draws: the two people this wedding has a page for. */
export const PEOPLE = { maya: MAYA, priya: PRIYA } as const;
export type WhoId = keyof typeof PEOPLE;
/** Priya is the default, because hers is the page the round is about. */
export const whoOf = (v: string | undefined): WhoId =>
  v === "maya" ? v : "priya";

/** What the album says about itself, wherever a decision needs the line. */
export const EVENT = {
  name: WEDDING.name,
  host: "Maya",
  dateLabel: "14 June 2026",
  count: 214,
} as const;
