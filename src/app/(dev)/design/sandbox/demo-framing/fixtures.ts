import {
  OBJECT_EVENT,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE DEMO, ROUND TWO: one album of every kind of party, at an address in a
 * host's own words, and the hosts' addresses the typewriter types.
 *
 * ★ EVERY PHOTOGRAPH IS A STAND-IN, AND WHICH ONE DOES NOT MATTER (his round
 * one note: the whole media kit is replaced before launch). The band's twelve
 * stills are the only photographs the lab may show (bible 9: nothing
 * borrowed), so a lake or a reunion is drawn with the nearest still and judged
 * for its layout and its motion; `makes` names what the month makes instead.
 *
 * ★ PLACEHOLDER COPY IS JUDGED FOR ITS SIZE AND WRAPPING: every address runs to
 * the length a host would really type, because the card's link column is what
 * each is measured against, and the typewriter types all of them into it.
 */

/** The address options (the `slug` decision): the demo's own, in a host's own words. */
export type AddressId =
  | "our-party"
  | "my-party"
  | "our-big-night"
  | "our-wedding";

export const ADDRESS_IDS: readonly AddressId[] = [
  "our-party",
  "my-party",
  "our-big-night",
  "our-wedding",
];

/**
 * ★ THE ALBUM IS TITLED IN THE ADDRESS'S OWN WORDS (the lane's carried call
 * `title`, which retires round one's `names`): the card, the album's head and
 * the welcome say one name, so each option is drawn in all three.
 */
export const ADDRESSES: Readonly<
  Record<AddressId, { slug: string; title: string }>
> = {
  "our-party": { slug: "our-party", title: "Our party" },
  "my-party": { slug: "my-party", title: "My party" },
  "our-big-night": { slug: "our-big-night", title: "Our big night" },
  "our-wedding": { slug: "our-wedding", title: "Our wedding" },
};

export type Person = {
  readonly name: string;
  /** The avatar's seeded colour, as the guest list seeds a face. */
  readonly seed: string;
  readonly initial: string;
};

/** One print on the card: its stand-in, what it will really show, who added it. */
export type CardPrint = {
  /** A `marketing-media.ts` id: the stand-in. */
  readonly photo: string;
  /** What the month makes in its place. */
  readonly makes: string;
  readonly guest: Person;
  /** The one a guest filmed: the card marks it with the album's play mark. */
  readonly video?: boolean;
};

export type Prints = readonly [CardPrint, CardPrint, CardPrint, CardPrint];

/** One photograph at the album's head: its stand-in and the shape it is laid at. */
export type AlbumStill = {
  readonly photo: string;
  /** width / height, as the phone took it (the tile is object-cover). */
  readonly ratio: number;
  readonly video?: boolean;
};

export type Album = {
  readonly naming: { readonly title: string; readonly slug: string };
  readonly host: Person;
  readonly items: number;
  readonly guests: number;
  /** The line under the title, in the host's own words. */
  readonly description: string;
  /** The head of the rows, newest first. */
  readonly stills: readonly AlbumStill[];
};

const person = (name: string, key: string): Person => ({
  name,
  seed: `df-${key}`,
  initial: name.slice(0, 1),
});

/** Portrait, square and landscape as a phone album mixes them. */
const P = 4 / 5;
const S = 1;
const L = 3 / 2;

/**
 * ★ THE DEMO'S HOST IS A PERSONA (round one's carried call `host`, carried
 * again): a demo account of its own, named in the byline and the welcome,
 * never Will's own account.
 */
export const DEMO_HOST = person("Sam Okafor", "sam");

/** Everyone who added a photograph: the card counts the rest past its four. */
export const DEMO_GUESTS = 24;

/**
 * THE CARD'S FOUR PRINTS AT REST: four kinds of party in one album, which is
 * the settled line (any host sees their event in it) made visible on the card.
 */
export const DEMO_PRINTS: Prints = [
  {
    photo: "wedding-petals",
    makes: "a wedding's exit under the petals",
    guest: person("Ruby N.", "ruby"),
  },
  {
    photo: "party-balloons",
    makes: "30 in balloons over a door",
    guest: person("Jules P.", "jules"),
  },
  {
    photo: "festival-crowd",
    makes: "friends round a lake-house fire",
    guest: person("Theo C.", "theo"),
  },
  {
    photo: "wedding-toast",
    makes: "a team's toast, filmed",
    guest: person("Dev M.", "dev"),
    video: true,
  },
];

/** The album the card opens, titled in its address's words (see `ADDRESSES`). */
export function demoAlbum(address: AddressId): Album {
  return {
    naming: ADDRESSES[address],
    host: DEMO_HOST,
    items: 48,
    guests: DEMO_GUESTS,
    description:
      "Everything from the night, in one place. Add whatever you took, whenever you get to it.",
    stills: [
      { photo: "party-dj", ratio: L },
      { photo: "wedding-petals", ratio: P },
      { photo: "festival-crowd", ratio: S },
      { photo: "reception-table", ratio: L },
      { photo: "wedding-toast", ratio: P, video: true },
      { photo: "party-balloons", ratio: L },
    ],
  };
}

/**
 * ONE PARTY THE TYPEWRITER TYPES: its address, the four prints its card
 * shows, and the photographs the stream pours for it (`together`) or deals
 * round the address (`centre`).
 */
export type Party = {
  readonly slug: string;
  readonly prints: Prints;
  /** `marketing-media.ts` ids, in the order the stream pours them. */
  readonly pours: readonly string[];
};

/**
 * ★ THE HOSTS' ADDRESSES (the lane's carried call `typed`): round one's five
 * parties, each in a host's words and each short enough to set whole in the
 * card's column at a phone (the caption measures every one). Every address
 * the demo prints is reserved to it, so a visitor who types one lands on the
 * demo, whichever it was.
 */
export const HOSTS: readonly Party[] = [
  {
    slug: "our-wedding",
    prints: [
      {
        photo: "wedding-petals",
        makes: "the exit under the petals",
        guest: person("Ruby N.", "ruby"),
      },
      {
        photo: "wedding-rings",
        makes: "the rings over the bouquet",
        guest: person("Sam O.", "sam-o"),
      },
      {
        photo: "reception-table",
        makes: "the long table at dusk",
        guest: person("Theo C.", "theo"),
      },
      {
        photo: "wedding-toast",
        makes: "the toast, filmed",
        guest: person("Jules P.", "jules"),
        video: true,
      },
    ],
    pours: [
      "wedding-golden",
      "wedding-petals",
      "reception-hall",
      "wedding-rings",
      "wedding-arch",
      "wedding-toast",
      "reception-table",
    ],
  },
  {
    slug: "my-30th",
    prints: [
      {
        photo: "party-balloons",
        makes: "30 in balloons over the door",
        guest: person("Ruby N.", "ruby"),
      },
      {
        photo: "reception-table",
        makes: "the cake, thirty candles lit",
        guest: person("Jules P.", "jules"),
      },
      {
        photo: "party-dj",
        makes: "the dance floor at midnight",
        guest: person("Ali K.", "ali"),
      },
      {
        photo: "concert-confetti",
        makes: "the confetti, filmed",
        guest: person("Dev M.", "dev"),
        video: true,
      },
    ],
    pours: [
      "party-dj",
      "party-balloons",
      "concert-confetti",
      "festival-lights",
      "reception-table",
    ],
  },
  {
    slug: "lake-weekend",
    prints: [
      {
        photo: "wedding-arch",
        makes: "the lake from the end of the dock",
        guest: person("Theo C.", "theo"),
      },
      {
        photo: "reception-table",
        makes: "dinner on the porch",
        guest: person("Priya S.", "priya"),
      },
      {
        photo: "festival-crowd",
        makes: "everyone round the fire",
        guest: person("Jules P.", "jules"),
      },
      {
        photo: "wedding-golden",
        makes: "the jump off the dock, filmed",
        guest: person("Ruby N.", "ruby"),
        video: true,
      },
    ],
    pours: [
      "festival-crowd",
      "wedding-arch",
      "wedding-golden",
      "festival-lights",
      "reception-table",
    ],
  },
  {
    slug: "our-reunion",
    prints: [
      {
        photo: "reception-hall",
        makes: "three generations on the steps",
        guest: person("Maya P.", "maya"),
      },
      {
        photo: "reception-table",
        makes: "the long lunch",
        guest: person("Leo P.", "leo"),
      },
      {
        photo: "party-balloons",
        makes: "the cousins' sack race",
        guest: person("Ana P.", "ana"),
      },
      {
        photo: "wedding-toast",
        makes: "Grandpa's toast, filmed",
        guest: person("Walt P.", "walt"),
        video: true,
      },
    ],
    pours: [
      "reception-table",
      "party-balloons",
      "reception-hall",
      "wedding-arch",
      "wedding-golden",
    ],
  },
  {
    slug: "team-party",
    prints: [
      {
        photo: "reception-hall",
        makes: "the studio, dressed for it",
        guest: person("Tom R.", "tom"),
      },
      {
        photo: "concert-confetti",
        makes: "the photo booth",
        guest: person("Ana L.", "ana-l"),
      },
      {
        photo: "party-dj",
        makes: "the dance floor",
        guest: person("Dev M.", "dev"),
      },
      {
        photo: "wedding-toast",
        makes: "the team toast, filmed",
        guest: person("Jules P.", "jules"),
        video: true,
      },
    ],
    pours: [
      "party-dj",
      "concert-confetti",
      "reception-hall",
      "festival-lights",
      "reception-table",
    ],
  },
];

/**
 * EVERY PARTY A LOOP VISITS, the demo's own first: its prints are the four
 * kinds of party, and its stream is the band's own twelve, as today. A host's
 * address that IS the demo's own (`our-wedding` picked as the demo's) is
 * dropped, so it is never typed over itself.
 */
export function partiesFor(address: AddressId): readonly Party[] {
  const own: Party = {
    slug: ADDRESSES[address].slug,
    prints: DEMO_PRINTS,
    pours: STREAM_FRAMES,
  };
  return [own, ...HOSTS.filter((h) => h.slug !== own.slug)];
}

/** The card's own link, as it prints its two halves. */
export const DOMAIN = OBJECT_EVENT.domain;

/** How many guests the card counts in past its four prints. */
export const REST = DEMO_GUESTS - DEMO_PRINTS.length;
