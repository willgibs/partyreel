import {
  OBJECT_EVENT,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE DEMO, ROUND THREE: the demo's own address and the hosts' addresses the
 * hero types, each party with the photographs its stream pours and the guest
 * who added each one (the credit in the photograph's corner).
 *
 * ★ EVERY PHOTOGRAPH IS A STAND-IN, AND WHICH ONE DOES NOT MATTER (his round
 * one note: the whole media kit is replaced before launch). The band's twelve
 * stills are the only photographs the lab may show (bible 9), so a lake or a
 * reunion leans on the nearest still; what tells one party from the next on
 * this board is its address, its code and the names on its photographs. The
 * month makes each party's own set (the Handoff's asset line).
 *
 * ★ PLACEHOLDER COPY IS JUDGED FOR ITS SIZE AND WRAPPING: every address runs
 * to the length a host would really type, and every guest's name to a first
 * name's, because the credit chip is measured against the smallest
 * photograph it rides on.
 */

export type Guest = {
  /** The first name the credit says. */
  readonly name: string;
  /** The avatar's seeded colour, as the guest list seeds a face. */
  readonly seed: string;
};

/** One photograph the stream pours, and the guest who added it. */
export type Pour = {
  /** A `marketing-media.ts` id: the stand-in. */
  readonly photo: string;
  readonly guest: Guest;
};

/** One party the hero types: its address and its album. */
export type Party = {
  readonly slug: string;
  readonly pours: readonly Pour[];
};

const g = (name: string): Guest => ({
  name,
  seed: `df-guest-${name.toLowerCase()}`,
});

/** The guests, once, so a name keeps its face whichever party it is at. */
const RUBY = g("Ruby");
const JULES = g("Jules");
const THEO = g("Theo");
const DEV = g("Dev");
const MAYA = g("Maya");
const ALI = g("Ali");
const PRIYA = g("Priya");
const SAM = g("Sam");
const LEO = g("Leo");
const ANA = g("Ana");
const WALT = g("Walt");
const TOM = g("Tom");
const NINA = g("Nina");
const OMAR = g("Omar");
const CLARA = g("Clara");
const KAI = g("Kai");
const MIA = g("Mia");
const FINN = g("Finn");
const ROSA = g("Rosa");
const ZOE = g("Zoe");

/** The demo's own address (`slug=our-party`, his round two pick). */
export const DEMO_SLUG = "our-party";

/** Who added each of the band's twelve, in the band's own order. */
const OWN_GUESTS = [
  RUBY,
  JULES,
  THEO,
  DEV,
  MAYA,
  ALI,
  PRIYA,
  SAM,
  LEO,
  ANA,
  WALT,
  TOM,
] as const;

const pours = (
  photos: readonly string[],
  guests: readonly Guest[],
): readonly Pour[] =>
  photos.map((photo, i) => ({ photo, guest: guests[i % guests.length] }));

/**
 * THE DEMO'S OWN PARTY: the band's twelve as they ship, each credited. It is
 * every party at once, which is what the demo album holds (settled in round
 * two), so its stream is the one a first paint and reduced motion show.
 */
export const OWN: Party = {
  slug: DEMO_SLUG,
  pours: pours(STREAM_FRAMES, OWN_GUESTS),
};

/**
 * ★ THE HOSTS' ADDRESSES (round two's carried call `typed`, standing): five
 * parties in a host's own words, each pouring the stills nearest its kind and
 * credited to its own guests. Every address the demo prints is reserved to
 * it, so whichever code a visitor scans off the hero opens the demo.
 */
export const HOSTS: readonly Party[] = [
  {
    slug: "our-wedding",
    pours: pours(
      [
        "wedding-golden",
        "wedding-petals",
        "reception-hall",
        "wedding-rings",
        "wedding-arch",
        "wedding-toast",
        "reception-table",
      ],
      [CLARA, OMAR, RUBY, NINA, SAM, THEO, JULES],
    ),
  },
  {
    slug: "my-30th",
    pours: pours(
      [
        "party-dj",
        "party-balloons",
        "concert-confetti",
        "festival-lights",
        "reception-table",
        "wedding-toast",
      ],
      [MIA, KAI, ALI, DEV, JULES, RUBY],
    ),
  },
  {
    slug: "lake-weekend",
    pours: pours(
      [
        "festival-crowd",
        "wedding-arch",
        "wedding-golden",
        "festival-lights",
        "reception-table",
      ],
      [FINN, PRIYA, THEO, JULES, RUBY],
    ),
  },
  {
    slug: "our-reunion",
    pours: pours(
      [
        "reception-table",
        "party-balloons",
        "reception-hall",
        "wedding-arch",
        "wedding-golden",
        "wedding-toast",
      ],
      [ROSA, LEO, ANA, WALT, MAYA, OMAR],
    ),
  },
  {
    slug: "team-party",
    pours: pours(
      [
        "party-dj",
        "concert-confetti",
        "reception-hall",
        "festival-lights",
        "reception-table",
        "wedding-toast",
      ],
      [TOM, ZOE, DEV, ANA, KAI, JULES],
    ),
  },
];

/** Every party the loop visits, the demo's own first. */
export const PARTIES: readonly Party[] = [OWN, ...HOSTS];

/** The address's quiet half, as every event link prints it. */
export const DOMAIN = OBJECT_EVENT.domain;

/* ── the demo's door (the `door` decision) ───────────────────────────────── */

export type Person = {
  readonly name: string;
  readonly seed: string;
  readonly initial: string;
};

/** Portrait, square and landscape as a phone album mixes them. */
const P = 4 / 5;
const S = 1;
const L = 3 / 2;

/** One photograph at the album's head: its stand-in and the shape it is laid at. */
export type AlbumStill = {
  readonly photo: string;
  /** width / height, as the phone took it (the tile is object-cover). */
  readonly ratio: number;
  readonly video?: boolean;
};

/**
 * ★ THE DEMO'S HOST IS A PERSONA (round one's carried call `host`, standing):
 * a demo account of its own, never Will's. Under the `brand` door the host is
 * Partyreel itself, which is that option's whole point.
 */
export const DEMO_HOST: Person = {
  name: "Sam Okafor",
  seed: "df-sam",
  initial: "S",
};

export const PARTYREEL_HOST: Person = {
  name: "Partyreel",
  seed: "df-partyreel",
  initial: "P",
};

/** The album behind the door: its head and its first rows. */
export const ALBUM: {
  readonly items: number;
  readonly guests: number;
  readonly description: string;
  readonly stills: readonly AlbumStill[];
  /** The four the open door shows through it, newest first. */
  readonly through: readonly string[];
} = {
  items: 48,
  guests: 24,
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
  through: ["wedding-toast", "party-dj", "wedding-petals", "festival-crowd"],
};
