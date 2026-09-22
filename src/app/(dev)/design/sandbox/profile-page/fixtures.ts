import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE CAST, SEEN FROM EVERY SIDE.
 *
 * Every picture on this board is the same wedding, so what moves between
 * options is the SHAPE of a person's page and the album's guest list, never
 * who is on it. The cast is the one round one asked for, and each member
 * still answers a round-two question:
 *
 *  - MAYA hosts. Two albums, one open and one password-locked, so the
 *    profile's hosted grid has both badges. Her quick-look card carries three
 *    covers, the busiest `SmallCovers` draws before it would need a "+N more".
 *  - PRIYA only ever went to parties: two attended, one hidden by her own key,
 *    nothing hosted. Her page is `quick-look`'s ordinary case and the one this
 *    round's previews default to (the page the round is about).
 *  - NOOR joined and has not been anywhere: the shared `EmptyState` on the
 *    full page, and "nothing here yet" on the quick-look card.
 *  - JAY has no handle: a chip that is not a link, wherever a chip still
 *    renders.
 *  - `@maya-g` is a dead handle. It is not drawn: the 404 is not a decision on
 *    this board (the manifest's Questions say why), and it stays a 404.
 *
 * ★ ROUND TWO ADDS ONE FIXTURE: `GUESTS_BIG`, 240 signed-in uploaders, Will's
 * own edge case scaled down a factor of four from his imagined thousand. The
 * round-one cast of 24 (`GUESTS`) stays for the ordinary wedding; `view-all`'s
 * `count` control switches between them so both scales sit in the same frame.
 *
 * ★ SAM, `GUESTS_WITH_HANDLES` AND `MY_CHIP_INDEX` LEFT WITH ROUND ONE. They
 * answered `block` (a mutual block's viewer) and `named`/`claim` (a handles-
 * only membership, one marked chip); all three are ruled, so nothing on this
 * board varies a viewer's relationship or a membership rule any more.
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

/* ── The edge case: 240 signed-in uploaders ──────────────────────────────── */

/**
 * TWO HUNDRED AND FORTY, A QUARTER OF WILL'S IMAGINED THOUSAND.
 *
 * "I can imagine an edge case with a thousand guests, and you click 'View
 * All', and all of a sudden you have a page 100 screens tall all at once".
 * 240 is close enough to argue the same failure mode inside a board's reading
 * budget, and it is generated rather than typed
 * by hand: the same ratios round one's 24 used (about a fifth with a handle,
 * about a third with a picture), so the two lists read as the same wedding at
 * two sizes rather than two different fixtures.
 */
const FIRST_NAMES = [
  "Priya", "Jay", "Sam", "Noor", "Dele", "Ana", "Tomas", "Hana", "Marcus",
  "Zainab", "Ellis", "Fiona", "Ravi", "Greta", "Oscar", "Lena", "Kofi", "Ines",
  "Danny", "Yusuf", "Claire", "Theo", "Mira", "Bea", "Leon", "Amara", "Felix",
  "Junko", "Otis", "Sade", "Piotr", "Naledi", "Quinn", "Rosa", "Iker",
  "Meiling", "Bram", "Aisha", "Dov", "Wren",
] as const;
const LAST_NAMES = [
  "Raman", "Alder", "Whitlock", "Haddad", "Adeyemi", "Ferreira", "Berg",
  "Ito", "Lowe", "Musa", "Kwan", "Doherty", "Chandra", "Lindqvist", "Mbeki",
  "Fischer", "Mensah", "Oliveira", "Whelan", "Karim", "Bonnet", "Novak",
  "Solberg", "Camilleri", "Reyes",
] as const;

/** Decorrelated on purpose: `i % 40` alone would repeat First Last pairs in
 *  visible blocks of 40, which reads as generated rather than a guest list. */
function bigName(i: number): string {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
  return `${first} ${last}`;
}

export const GUESTS_BIG: Chip[] = Array.from({ length: 240 }, (_, i) => ({
  id: `gb-${i}`,
  displayName: bigName(i),
  slug: i % 5 === 0 ? `guest${i}` : null,
  avatarMarker: null,
  avatarUrl: i % 3 === 0 ? pic(i + 1) : null,
}));

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
