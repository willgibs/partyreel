import { EVENT_TYPES, getEventType } from "@/lib/constants/events";

/**
 * THE FOUR TYPES AS THIS BOARD DRAWS THEM.
 *
 * ★ THE PAGE'S OWN WORDS WHERE THE PAGE KEEPS THEM, FIXTURE WORDS WHERE A
 * CONCEPT CHANGES THEM. `events.ts` is the single source and this lane never
 * edits it, so the control options read the real headline, subhead, intro and
 * themes straight out of it, and only the lines a concept INVENTS (a statement
 * cut from the intro, a demo door's promise) live here, marked as fixtures.
 * That way "today, measured" is genuinely today.
 *
 * ★ AND THE HONEST-STILL SPLIT IS A FACT, NOT A CHOICE. The bootstrap manifest
 * has six wedding subjects and four party ones; it has no conference and no
 * trip subject, and the ruling on the shipped pages is that a photograph never
 * promises the wrong event (a banquet tent read as a wedding, a festival crowd
 * as a rave). So `stills` is EMPTY for conferences and trips on purpose, and
 * every concept below has to say what it does when a type has no photograph.
 * That is why weddings is the worked type and conferences is the second one:
 * between them they are the whole problem.
 */
export type TypeFixture = {
  slug: string;
  navLabel: string;
  singular: string;
  /** The real page's H1 and subhead, from the single source. */
  headline: string;
  subhead: string;
  intro: string;
  themes: readonly string[];
  /**
   * Landscape manifest ids honest for this type, strongest first. Empty when
   * the manifest has none, which is a concept's hardest case.
   */
  stills: readonly string[];
  /** The one object this type's media belongs to, named for the concepts. */
  object: string;
  /** FIXTURE. The intro's own claim, cut in two for a statement beat. */
  statement: { big: string; quiet: string };
  /** FIXTURE. What a demo door promises, in demo-event's recommended words. */
  door: string;
};

const real = (slug: string) => {
  const t = getEventType(slug);
  if (!t) throw new Error(`Unknown event type: ${slug}`);
  return t;
};

export const TYPES: Record<string, TypeFixture> = {
  weddings: {
    slug: "weddings",
    navLabel: real("weddings").navLabel,
    singular: real("weddings").singularLabel,
    headline: real("weddings").headline,
    subhead: real("weddings").subhead,
    intro: real("weddings").intro,
    themes: real("weddings").nestedThemes,
    stills: [
      "wedding-golden",
      "wedding-arch",
      "reception-hall",
      "wedding-toast",
      "reception-table",
      "wedding-rings",
    ],
    object: "the album on the table",
    statement: {
      big: "The most photographed day of your life.",
      quiet: "Almost none of those photos ever reach you.",
    },
    door: "A real wedding album. 128 photos from 31 guests.",
  },
  conferences: {
    slug: "conferences",
    navLabel: real("conferences").navLabel,
    singular: real("conferences").singularLabel,
    headline: real("conferences").headline,
    subhead: real("conferences").subhead,
    intro: real("conferences").intro,
    themes: real("conferences").nestedThemes,
    stills: [],
    object: "the badge every attendee wears",
    statement: {
      big: "Your team cannot be everywhere.",
      quiet: "Every attendee in the room already is.",
    },
    door: "A real conference feed. 214 photos from 63 attendees.",
  },
};

/** The worked type, and the one that has no photograph. */
export const WEDDINGS = TYPES.weddings;
export const CONFERENCES = TYPES.conferences;

/** Both, in the order every concept draws them. */
export const DRAWN: readonly TypeFixture[] = [WEDDINGS, CONFERENCES];

/** The four, for the directory and the hub. */
export const ALL_SLUGS = EVENT_TYPES.map((t) => t.slug);

/**
 * The still a type's CARD leads with, matching the shipped directory's own
 * choice so "today, measured" is today, and empty where the artifact leads.
 */
export const CARD_STILL: Record<string, string | null> = {
  weddings: "wedding-arch",
  parties: "party-balloons",
  conferences: null,
  trips: null,
};

/** The frames a type's ROOM is built from: landscape only (a portrait still
 *  cropped full bleed throws its subject away, which is `ROOM_FRAMES`' own
 *  rule). Weddings has six; conferences has none, and the concept says so. */
export const ROOM_BY_TYPE: Record<string, readonly string[]> = {
  weddings: [
    "wedding-golden",
    "wedding-arch",
    "reception-hall",
    "wedding-toast",
    "reception-table",
  ],
  conferences: [],
};

/** FIXTURE. The reel's own clips, which is what makes the flanking stills a
 *  fact rather than decoration: these are the frames `hero-candidate-01` was
 *  actually cut from (its recipe's `clipIds`). */
export const REEL_CLIPS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-petals",
  "party-dj",
  "wedding-toast",
] as const;
