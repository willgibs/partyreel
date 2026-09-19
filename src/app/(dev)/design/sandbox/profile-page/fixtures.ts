import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE CAST, SEEN FROM EVERY SIDE.
 *
 * Every picture on this board is the same six people and the same wedding, so
 * what moves between options is the SHAPE of a person's page and never who is
 * on it. The cast is the one the track asks for, and each member exists to make
 * a different question answerable:
 *
 *  - MAYA hosts. Two albums, one open and one password-locked, so the profile's
 *    hosted grid has both badges and the cover-masking rule (covers on open
 *    events only) is visible rather than described.
 *  - PRIYA only ever went to parties. Three attended, one of them hidden by her
 *    own key, and nothing hosted. Her page is the whole argument of `made-of`:
 *    today it is four words and two dates.
 *  - NOOR joined and has not been anywhere. The shared `EmptyState`.
 *  - JAY has no handle. On the guest list he is a chip that is not a link, and
 *    on the marketing page he is the person the sentence is about.
 *  - SAM is in a mutual block with the viewer, which is the one state where the
 *    page must NOT change shape (a vanishing control leaks the block).
 *  - `@maya-g` is a dead handle. It is not drawn: the 404 is not a decision on
 *    this board (the manifest's Questions say why), and it stays a 404.
 *
 * ★ EVERY PICTURE IS A MARKETING STILL, AND NOTHING NEW WAS ASKED FOR. The
 * fourteen bootstrap images are the only stills the repo holds; avatars are the
 * same files square-cropped by `object-cover`, exactly as the shipped page
 * crops a real one. No asset, no rights to track (Will, 2026-09-17/18).
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

/** Priya's third party, hidden from her profile by her own switch. It is in the
 *  fixture on purpose: the guest's key is what keeps it off every option's
 *  picture, so the one place it may legally appear is nowhere. Every option
 *  reads `attended`, and this one is not in it. */
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
 * A person's own frames, for the `wall` option. Declared at phone shapes and
 * cropped by the tile, because eleven of the fourteen stills are 3:2 landscapes
 * and a wall of those reads as a brick wall rather than an album.
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

/* ── The people ──────────────────────────────────────────────────────────── */

export type Person = {
  id: string;
  name: string;
  /** Null = no handle claimed, which is most people. */
  slug: string | null;
  avatar: string | null;
  /** The page's one fact today: "Joined <Month Year>". */
  joined: string;
  /** What the `line` option would carry, written by the person. */
  line: string;
  hosted: Party[];
  /** Surfaced by their hosts' guest lists, minus this person's own hides. */
  attended: Party[];
  /** Hidden from the profile by this person's own switch. Nothing renders it:
   *  it is here so "the guest's key works" is a fact of the fixture and not a
   *  promise in a comment. */
  hidden: Party[];
  /** The frames they added, across open albums that list them. */
  photos: GridMedia[];
};

export const MAYA: Person = {
  id: "u-maya",
  name: "Maya Okonjo",
  slug: "maya",
  avatar: pic(0),
  joined: "Joined March 2026",
  line: "Runs the parties, forgets to be in the photographs.",
  hosted: [WEDDING, RUBY],
  attended: [PRIYA_30],
  hidden: [],
  photos: roll("maya", "PLPSTPLPS", 1),
};

export const PRIYA: Person = {
  id: "u-priya",
  name: "Priya Raman",
  slug: "priya",
  avatar: pic(4),
  joined: "Joined June 2026",
  line: "Always the one with the camera out at midnight.",
  hosted: [],
  attended: [WEDDING, ENGAGEMENT],
  hidden: [CALDER],
  photos: roll("priya", "PPLTPSPLPPTL", 3),
};

export const NOOR: Person = {
  id: "u-noor",
  name: "Noor Haddad",
  slug: "noor",
  avatar: null,
  joined: "Joined September 2026",
  line: "",
  hosted: [],
  attended: [],
  hidden: [],
  photos: [],
};

export const SAM: Person = {
  id: "u-sam",
  name: "Sam Whitlock",
  slug: "sam",
  avatar: pic(7),
  joined: "Joined April 2026",
  line: "",
  hosted: [],
  attended: [WEDDING],
  hidden: [],
  photos: [],
};

export const PEOPLE = { maya: MAYA, priya: PRIYA, noor: NOOR } as const;
export type WhoId = keyof typeof PEOPLE;
/** Priya is the default, because hers is the page the round is about. */
export const whoOf = (v: string | undefined): WhoId =>
  v === "maya" || v === "noor" ? v : "priya";

/* ── The wedding's guest list ────────────────────────────────────────────── */

/** What the shipped `GuestList` takes, structurally (its own type is behind
 *  `server-only`, so it is met rather than imported). */
export type Chip = {
  id: string;
  displayName: string | null;
  slug: string | null;
  avatarMarker: string | null;
  avatarUrl: string | null;
};

/**
 * TWENTY-FOUR SIGNED-IN UPLOADERS, FIVE OF THEM WITH A HANDLE.
 *
 * The number is what makes `list` a real question: a wedding where two dozen
 * people were signed in is an ordinary wedding, and the shipped list wraps
 * every one of them between the album and the footer. The five handles are what
 * makes `named` a real question: picking "only people with a handle" is picking
 * a list of five, and the frame says so rather than the words.
 *
 * Nine carry a picture and the rest fall back to an initial, which is what a
 * real guest list looks like: an avatar is optional and a display name is not.
 */
const NAMES: [string, string | null][] = [
  ["Priya Raman", "priya"],
  ["Jay Alder", null],
  ["Sam Whitlock", "sam"],
  ["Noor Haddad", "noor"],
  ["Dele Adeyemi", null],
  ["Ana Ferreira", null],
  ["Tomas Berg", "tomasb"],
  ["Hana Ito", null],
  ["Marcus Lowe", null],
  ["Zainab Musa", null],
  ["Ellis Kwan", null],
  ["Fiona Doherty", "fionad"],
  ["Ravi Chandra", null],
  ["Greta Lindqvist", null],
  ["Oscar Mbeki", null],
  ["Lena Fischer", null],
  ["Kofi Mensah", null],
  ["Ines Oliveira", null],
  ["Danny Whelan", null],
  ["Yusuf Karim", null],
  ["Claire Bonnet", null],
  ["Theo Novak", null],
  ["Mira Solberg", null],
  ["Bea Camilleri", null],
];

export const GUESTS: Chip[] = NAMES.map(([displayName, slug], i) => ({
  id: `g-${i}`,
  displayName,
  slug,
  avatarMarker: null,
  avatarUrl: i % 3 === 0 ? pic(i + 1) : null,
}));

/** The same list, with only the claimed handles left standing. */
export const GUESTS_WITH_HANDLES = GUESTS.filter((g) => g.slug);

/** The chip that is the viewer's own, for the inline claim. */
export const MY_CHIP_INDEX = 1; // Jay Alder, no handle.

/* ── The album under it all ──────────────────────────────────────────────── */

/** The wedding album a guest-list decision is drawn under: enough tiles that
 *  the list is the thing between the photographs and the footer, which is where
 *  it really sits. */
export const ALBUM: GridMedia[] = roll(
  "album",
  "PLPTPSPLFPPL".replace(/F/g, "S"),
  0,
);

/** What the album says about itself, wherever a decision needs the line. */
export const EVENT = {
  name: WEDDING.name,
  host: "Maya",
  dateLabel: "14 June 2026",
  count: 214,
} as const;
