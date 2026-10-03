import {
  OBJECT_EVENT,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";
import { slugify } from "@/lib/slug";

/**
 * THE DEMO, ROUND FOUR: the demo's own address and the hosts' addresses the
 * hero types, each party with what its event card says (its cover, its day,
 * how many came), the hues its light is drawn in, and the photographs its
 * stream pours with the guest who added each one (the credit in the
 * photograph's corner).
 *
 * ★ EVERY PHOTOGRAPH IS A STAND-IN, AND WHICH ONE DOES NOT MATTER (his round
 * one note: the whole media kit is replaced before launch). The band's twelve
 * stills are the only photographs the lab may show (bible 9), so a lake or a
 * reunion leans on the nearest still; what tells one party from the next on
 * this board is its address, its code, its card and the names on its
 * photographs. The month makes each party's own set (the Handoff's asset line).
 *
 * ★ PLACEHOLDER COPY IS JUDGED FOR ITS SIZE AND WRAPPING: every address runs
 * to the length a host would really type, every guest's name to a first
 * name's, and every card's line to the longest a real one would carry,
 * because the credit chip and the card are measured against the smallest
 * frame they ride on.
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

/** One party the hero types: its address, its card and its album. */
export type Party = {
  readonly slug: string;
  /** The card's cover: a `marketing-media.ts` id. */
  readonly cover: string;
  /** The card's day, as a host would print it. */
  readonly when: string;
  /** How many guests the card counts. */
  readonly guests: number;
  /**
   * Its light's three hues (OKLCH degrees), read by eye off its cover: the
   * door's room and the lamp take them, as production's door samples an
   * album's own (`door-light.ts`).
   */
  readonly hues: readonly [number, number, number];
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
  cover: "wedding-toast",
  when: "Sat, Oct 17",
  guests: OBJECT_EVENT.guests,
  hues: [70, 30, 300],
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
    cover: "wedding-petals",
    when: "Sat, Jun 13",
    guests: 86,
    hues: [60, 20, 350],
    pours: pours(
      [
        "wedding-petals",
        "wedding-golden",
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
    cover: "party-balloons",
    when: "Fri, Sep 4",
    guests: 41,
    hues: [340, 250, 300],
    pours: pours(
      [
        "party-balloons",
        "party-dj",
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
    cover: "festival-crowd",
    when: "Fri, Aug 21",
    guests: 12,
    hues: [55, 35, 230],
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
    cover: "reception-table",
    when: "Sat, Jul 11",
    guests: 57,
    hues: [45, 140, 20],
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
    cover: "party-dj",
    when: "Thu, Dec 10",
    guests: 64,
    hues: [270, 230, 320],
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

/**
 * What an address's code encodes: the link exactly as the hero prints it,
 * whatever origin the page is served from, so the code a visitor scans is
 * always the address they are reading (on a preview too).
 */
export const linkOf = (slug: string) => `https://${DOMAIN}${slug}`;

/**
 * The longest address a visitor may type into the field: every code is one
 * fixed grid (`qr.ts`), which holds the link to a slug of this length. The
 * product takes custom links to 50 characters, so the field carries what
 * they typed into the real flow, where the full rule applies.
 */
export const TYPED_MAX = 22;

/**
 * A visitor's keystrokes as a slug, through the product's own `slugify`
 * (apostrophes dropped, the rest to hyphens), keeping one trailing hyphen so
 * a separator can be typed before the word after it.
 */
export function typedSlugOf(raw: string): string {
  const tail = /[\s_-]$/.test(raw) ? "-" : "";
  const body = slugify(raw, TYPED_MAX);
  return (body ? body + tail : "").slice(0, TYPED_MAX);
}

/**
 * A card's name, read off its address the way a host's own words read:
 * `our-wedding` is "Our wedding", `my-30th` is "My 30th". The card that types
 * along with the address takes each prefix through this as it is typed.
 */
export function titleOf(slug: string): string {
  const words = slug.replace(/-+/g, " ").trimStart();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The first faces a card shows, in the order the party's guests added. */
export function facesOf(party: Party, n: number): readonly Guest[] {
  const seen: Guest[] = [];
  for (const p of party.pours) {
    if (seen.some((s) => s.name === p.guest.name)) continue;
    seen.push(p.guest);
    if (seen.length === n) break;
  }
  return seen;
}
