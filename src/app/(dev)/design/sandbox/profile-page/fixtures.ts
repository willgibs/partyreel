import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE CAST, SEEN FROM EVERY SIDE.
 *
 * Every picture on this board is the same wedding, so what moves between
 * options is the SHAPE of a person's page and the album's guest list, never
 * who is on it. It is a names-mode wedding (Maya turned Require verified
 * emails off), which is why the list is mostly typed names: a guest there
 * names herself at the door and stays Unverified until she confirms an email.
 * Four people answer the round-two questions:
 *
 *  - MAYA hosts. Two albums, one open and one password-locked, so her page's
 *    grid has both badges, and one party she chose to show as a guest. Each
 *    list is newest first, the order the page merges them in.
 *  - PRIYA confirmed an email, claimed a handle and chose to show two of the
 *    parties she went to; the third she never turned on, so it shows nowhere
 *    (a page publishes nothing until its owner chooses it).
 *  - JAY confirmed an email and never claimed a handle: a real account, and no
 *    page behind his name.
 *  - NINA typed a name at the door and nothing else: Unverified, the plain
 *    disc and the mark, and no page either.
 *  - `@maya-g` is a dead handle. It is not drawn: the 404 is not a decision on
 *    this board, and it stays a 404. Neither is a claimed page with nothing on
 *    it: what that page says is `identity-profile.page`'s question.
 *
 * ★ THE GUEST LIST IS EVERY UPLOADER, IN THE SHIPPED ORDER: the confirmed
 * accounts first (their own colour, a photograph where they set one, a link
 * only where they claimed a handle), then every typed name (the plain disc,
 * the mark, no link). `view-all`'s `count` control switches the wedding
 * between an ordinary 24 (`GUESTS`) and `GUESTS_BIG`, 240, a quarter of the
 * thousand Will imagined, so every option is read at both.
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

/* ── The names a quick look is tapped on ─────────────────────────────────── */

/**
 * ONE NAME OF EACH KIND the guest list really holds, for `quick-look`'s own
 * knob: a name with a page, a confirmed account with none, and a typed name.
 * What a look can show differs by kind, because a page is the only place a
 * person's chosen events live; what every kind has is the photographs they
 * added to this album, already public on it by name.
 */
export type Tapped = {
  id: string;
  name: string;
  kind: "page" | "confirmed" | "unverified";
  /** The page behind the name, when there is one. */
  person: Person | null;
  /** The colour a confirmed account wears; null is the plain disc. */
  seed: string | null;
  avatar: string | null;
  /** What they added to this wedding's album. */
  photosHere: GridMedia[];
};

export const TAPPED = {
  priya: {
    id: "g-0",
    name: PRIYA.name,
    kind: "page",
    person: PRIYA,
    seed: PRIYA.seed,
    avatar: PRIYA.avatar,
    photosHere: PRIYA.photos,
  },
  jay: {
    id: "g-5",
    name: "Jay Alder",
    kind: "confirmed",
    person: null,
    seed: "pp-jay",
    avatar: null,
    photosHere: roll("jay", "LPSPLP", 6),
  },
  nina: {
    id: "g-typed-0",
    name: "Nina Park",
    kind: "unverified",
    person: null,
    seed: null,
    avatar: null,
    photosHere: roll("nina", "PPLPTPSP", 9),
  },
} as const satisfies Record<string, Tapped>;
export type TappedId = keyof typeof TAPPED;
/** Nina is the default: at a names-mode party hers is the commonest name. */
export const tappedOf = (v: string | undefined): TappedId =>
  v === "priya" || v === "jay" ? v : "nina";

/* ── The wedding's guest list ────────────────────────────────────────────── */

/** A confirmed account, as the shipped list's profile card carries it. */
export type ProfileChip = {
  kind?: "profile";
  id: string;
  displayName: string | null;
  slug: string | null;
  avatarUrl: string | null;
  seed: string | null;
};

/** A typed name nobody proved, as the shipped list's Unverified entry carries it. */
export type UnverifiedChip = {
  kind: "unverified";
  id: string;
  displayName: string | null;
};

/** What `guest-list.tsx` renders, structurally (its own types sit behind a
 *  server-only import, so they are met rather than imported). */
export type Chip = ProfileChip | UnverifiedChip;

export const isUnverified = (c: Chip): c is UnverifiedChip =>
  c.kind === "unverified";

/**
 * TWENTY-FOUR UPLOADERS: EIGHT CONFIRMED, FIVE OF THEM WITH A HANDLE, THEN
 * SIXTEEN TYPED NAMES. The number is what makes the list a real question: a
 * wedding with two dozen uploaders is an ordinary wedding, and the list wraps
 * every one of them between the album and the footer.
 */
const CONFIRMED: { name: string; slug: string | null; avatar: string | null }[] =
  [
    { name: PRIYA.name, slug: PRIYA.slug, avatar: PRIYA.avatar },
    { name: "Sam Whitlock", slug: "sam", avatar: null },
    { name: "Noor Haddad", slug: "noor", avatar: pic(7) },
    { name: "Tomas Berg", slug: "tomasb", avatar: null },
    { name: "Fiona Doherty", slug: "fionad", avatar: null },
    { name: "Jay Alder", slug: null, avatar: null },
    { name: "Dele Adeyemi", slug: null, avatar: pic(10) },
    { name: "Ana Ferreira", slug: null, avatar: null },
  ];

const TYPED = [
  "Nina Park",
  "Hana Ito",
  "Marcus Lowe",
  "Zainab Musa",
  "Ellis Kwan",
  "Ravi Chandra",
  "Greta Lindqvist",
  "Oscar Mbeki",
  "Lena Fischer",
  "Kofi Mensah",
  "Ines Oliveira",
  "Danny Whelan",
  "Yusuf Karim",
  "Claire Bonnet",
  "Theo Novak",
  "Bea Camilleri",
];

/** One colour per person, the same on the list and in a look: keyed on the
 *  handle where there is one, the first name where there is not. */
const seedOf = (name: string, slug: string | null) =>
  `pp-${slug ?? name.split(" ")[0].toLowerCase()}`;

export const GUESTS: Chip[] = [
  ...CONFIRMED.map(
    ({ name, slug, avatar }, i): ProfileChip => ({
      id: `g-${i}`,
      displayName: name,
      slug,
      avatarUrl: avatar,
      seed: seedOf(name, slug),
    }),
  ),
  ...TYPED.map(
    (displayName, i): UnverifiedChip => ({
      kind: "unverified",
      id: `g-typed-${i}`,
      displayName,
    }),
  ),
];

/* ── The edge case: 240 uploaders ────────────────────────────────────────── */

/**
 * TWO HUNDRED AND FORTY, A QUARTER OF WILL'S IMAGINED THOUSAND.
 *
 * "I can imagine an edge case with a thousand guests, and you click 'View
 * All', and all of a sudden you have a page 100 screens tall all at once".
 * 240 is close enough to argue the same failure mode inside a board's reading
 * budget, and it is generated rather than typed by hand in the same mix as
 * the 24: a third confirmed (about a fifth of those with a handle, about a
 * third with a picture), then the typed names, so the two lists read as the
 * same wedding at two sizes rather than two different fixtures.
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

const BIG_CONFIRMED = 80;

export const GUESTS_BIG: Chip[] = Array.from(
  { length: 240 },
  (_, i): Chip =>
    i < BIG_CONFIRMED
      ? {
          id: `gb-${i}`,
          displayName: bigName(i),
          slug: i % 5 === 0 ? `guest${i}` : null,
          avatarUrl: i % 3 === 0 ? pic(i + 1) : null,
          seed: `pp-gb-${i}`,
        }
      : { kind: "unverified", id: `gb-${i}`, displayName: bigName(i) },
);

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
