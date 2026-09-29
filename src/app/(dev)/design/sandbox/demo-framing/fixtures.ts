import {
  OBJECT_EVENT,
  OBJECT_PRINTS,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE DEMO'S STORIES: five parties, each with its host, its guests, the four
 * prints its card carries, the head of the album it opens, and its name five
 * ways (the `names` decision), so every frame on the board reads one table.
 *
 * ★ THE WEDDING IS TODAY'S CARD, BYTE FOR BYTE. Its prints are `OBJECT_PRINTS`
 * and its first-names link is `OBJECT_EVENT.slug`, read from the production
 * constant rather than retyped, so "as the card is today" cannot drift from
 * the card that ships. Its album is the lab's shared stand-in wedding's name
 * (`gallery-fixtures.ts`), because no wedding album exists today: the card
 * opens "Partyreel Demo" (`DEMO_TODAY` below).
 *
 * ★ EVERY PHOTOGRAPH IS A STAND-IN, NAMED AS ONE. The band's twelve stills are
 * the only photographs the lab may show (bible 9: nothing borrowed, nothing to
 * track), and they are a wedding set with a few parties and a festival, so a
 * lake or a reunion is drawn with the nearest still and judged for its layout.
 * `makes` is what the Higgsfield month makes for each print instead (ASSETS
 * rows 33 and 34 name the picked party's four), and the board prints it under
 * the frames so the story is judged on what it will show.
 *
 * ★ PLACEHOLDER COPY IS JUDGED FOR ITS SIZE AND WRAPPING: the names run to the
 * length a host would really type, which is what the card's link column is
 * measured against.
 */

export type StoryId = "wedding" | "birthday" | "weekend" | "reunion" | "work";
export type NamesId =
  | "first-names"
  | "voice"
  | "occasion"
  | "family"
  | "playful";

/** An event's name as the product says it: the title and the custom link. */
export type Naming = { readonly title: string; readonly slug: string };

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

/** One photograph at the album's head: its stand-in and the shape it is laid at. */
export type AlbumStill = {
  readonly photo: string;
  /** width / height, as the phone took it (the tile is object-cover). */
  readonly ratio: number;
  readonly video?: boolean;
};

export type Album = {
  readonly naming: Naming;
  readonly host: Person;
  /** The byline's date, when the event carries one (the carried call `date`). */
  readonly date?: string;
  readonly items: number;
  readonly guests: number;
  /** The line under the title, in the host's own words. */
  readonly description: string;
  /** The head of the rows, newest first. */
  readonly stills: readonly AlbumStill[];
};

export type Story = {
  readonly id: StoryId;
  readonly host: Person;
  /** Everyone who added a photograph: the card counts the rest past its four. */
  readonly guests: number;
  /** What the seeded album holds (the asset ask sizes it). */
  readonly items: number;
  readonly prints: readonly [CardPrint, CardPrint, CardPrint, CardPrint];
  readonly description: string;
  readonly stills: readonly AlbumStill[];
  readonly names: Readonly<Record<NamesId, Naming>>;
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

/** Today's four prints, with what each will really show. */
const WEDDING_MAKES = [
  "the exit under the petals",
  "the rings over the bouquet",
  "the long table at dusk",
  "the toast, filmed",
] as const;

const WEDDING_GUESTS = ["Ruby N.", "Sam O.", "Theo C.", "Jules P."] as const;

export const STORIES: Readonly<Record<StoryId, Story>> = {
  wedding: {
    id: "wedding",
    host: person("Mia Calder", "mia"),
    guests: OBJECT_EVENT.guests,
    items: 48,
    prints: OBJECT_PRINTS.map((p, i) => ({
      photo: p.photo,
      makes: WEDDING_MAKES[i],
      guest: { name: WEDDING_GUESTS[i], seed: p.seed, initial: p.initial },
      video: "video" in p ? p.video : undefined,
    })) as unknown as Story["prints"],
    description:
      "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
    stills: [
      { photo: "wedding-golden", ratio: L },
      { photo: "wedding-petals", ratio: P },
      { photo: "wedding-arch", ratio: S },
      { photo: "reception-hall", ratio: L },
      { photo: "wedding-toast", ratio: P, video: true },
      { photo: "wedding-rings", ratio: L },
    ],
    names: {
      "first-names": { title: "Mia & Theo's Wedding", slug: OBJECT_EVENT.slug },
      voice: { title: "Our wedding", slug: "our-wedding" },
      occasion: { title: "The garden wedding", slug: "garden-wedding" },
      family: { title: "The Calder wedding", slug: "calder-wedding" },
      playful: { title: "Happily ever after", slug: "happily-ever-after" },
    },
  },
  birthday: {
    id: "birthday",
    host: person("Sam Okafor", "sam"),
    guests: 24,
    items: 48,
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
        photo: "wedding-toast",
        makes: "the toast, filmed",
        guest: person("Dev M.", "dev"),
        video: true,
      },
    ],
    description:
      "Everything from Saturday night. Add whatever you took, whenever you get to it.",
    stills: [
      { photo: "party-dj", ratio: L },
      { photo: "party-balloons", ratio: P },
      { photo: "concert-confetti", ratio: S },
      { photo: "reception-table", ratio: L },
      { photo: "wedding-toast", ratio: P, video: true },
      { photo: "festival-lights", ratio: L },
    ],
    names: {
      "first-names": { title: "Sam's 30th", slug: "sams-30th" },
      voice: { title: "My 30th", slug: "my-30th" },
      occasion: { title: "The big 3-0", slug: "the-big-30" },
      family: { title: "Sam Okafor's 30th", slug: "sam-okafor-30" },
      playful: { title: "30 and thriving", slug: "30-and-thriving" },
    },
  },
  weekend: {
    id: "weekend",
    host: person("Nina Hayes", "nina"),
    guests: 9,
    items: 48,
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
    description:
      "Three days, one lake house, everyone's photos. Add yours before the drive home.",
    stills: [
      { photo: "festival-crowd", ratio: L },
      { photo: "wedding-arch", ratio: P },
      { photo: "wedding-golden", ratio: S },
      { photo: "reception-table", ratio: L },
      { photo: "festival-lights", ratio: P, video: true },
      { photo: "concert-confetti", ratio: L },
    ],
    names: {
      "first-names": {
        title: "Nina's lake weekend",
        slug: "ninas-lake-weekend",
      },
      voice: { title: "Our lake weekend", slug: "our-lake-weekend" },
      occasion: { title: "The lake weekend", slug: "lake-weekend" },
      family: { title: "The Hayes at the lake", slug: "hayes-at-the-lake" },
      playful: { title: "Lake daze", slug: "lake-daze" },
    },
  },
  reunion: {
    id: "reunion",
    host: person("Rose Parker", "rose"),
    guests: 28,
    items: 48,
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
    description:
      "Every Parker in one album. Add the photos only you took, old ones too.",
    stills: [
      { photo: "reception-table", ratio: L },
      { photo: "party-balloons", ratio: P },
      { photo: "reception-hall", ratio: S },
      { photo: "wedding-arch", ratio: L },
      { photo: "wedding-toast", ratio: P, video: true },
      { photo: "wedding-golden", ratio: L },
    ],
    names: {
      "first-names": { title: "Rose & Walt's reunion", slug: "rose-and-walt" },
      voice: { title: "Our family reunion", slug: "our-reunion" },
      occasion: { title: "The family reunion", slug: "family-reunion" },
      family: { title: "The Parker reunion", slug: "parker-reunion" },
      playful: { title: "All of us", slug: "all-of-us" },
    },
  },
  work: {
    id: "work",
    host: person("Priya Shah", "priya-host"),
    guests: 31,
    items: 48,
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
    description: "The whole team, one album. Add what you took before Monday.",
    stills: [
      { photo: "party-dj", ratio: L },
      { photo: "concert-confetti", ratio: P },
      { photo: "reception-hall", ratio: S },
      { photo: "festival-lights", ratio: L },
      { photo: "wedding-toast", ratio: P, video: true },
      { photo: "reception-table", ratio: L },
    ],
    names: {
      "first-names": { title: "Priya's holiday party", slug: "priyas-party" },
      voice: { title: "Our holiday party", slug: "our-holiday-party" },
      occasion: { title: "The holiday party", slug: "holiday-party" },
      family: { title: "The Larkspur holiday party", slug: "larkspur-party" },
      playful: { title: "Friday, finally", slug: "friday-finally" },
    },
  },
};

export const STORY_IDS = Object.keys(STORIES) as StoryId[];
export const NAMES_IDS: readonly NamesId[] = [
  "first-names",
  "voice",
  "occasion",
  "family",
  "playful",
];

/**
 * THE DEMO AS IT STANDS (read off the live row, 2026-09-29): "Partyreel Demo"
 * at /e/partyreel-demo, hosted on Will's own account, dated July 9, 2026, nine
 * photographs and videos from three named guests, and a line that says it is
 * a demo. Its photographs are the seed's test fixtures; the stills here stand
 * in for them.
 */
export const DEMO_TODAY: Album = {
  naming: { title: "Partyreel Demo", slug: "partyreel-demo" },
  host: person("Will Gibson", "will"),
  date: "July 9, 2026",
  items: 9,
  guests: 3,
  description: "Try uploading to our (fake) event!",
  stills: [
    { photo: "festival-lights", ratio: L },
    { photo: "wedding-golden", ratio: P },
    { photo: "party-dj", ratio: S },
    { photo: "reception-hall", ratio: L },
    { photo: "concert-confetti", ratio: P, video: true },
    { photo: "wedding-arch", ratio: L },
  ],
};

/** The album a story opens, named one of the five ways. */
export function albumOf(story: Story, names: NamesId): Album {
  return {
    naming: story.names[names],
    host: story.host,
    items: story.items,
    guests: story.guests,
    description: story.description,
    stills: story.stills,
  };
}

/** The card's own link, as it prints its two halves. */
export const DOMAIN = OBJECT_EVENT.domain;

/** How many guests the card counts in past its four prints. */
export const restOf = (guests: number) => guests - OBJECT_PRINTS.length;
