/**
 * THE STAGED CANDIDATE BATCH (the media-kit track, rounds one and two).
 *
 * Every record here is ALSO written into public/design/media-kit/provenance.json
 * beside the files, and provenance.test.ts pins the two together field by field.
 * That duplication is deliberate: a human opening the directory has to be able to
 * read the provenance without a build step, and a provenance record that only one
 * of the two copies knows about is exactly how this goes quietly wrong.
 *
 * ★ THE SHAPE IS THE PROPOSAL. These six fields are what the rule adds to a
 * MARKETING_IMAGES entry (spec section 1.2): `author`, `sourceUrl`, `license`,
 * `clause`, `retrieved` and `people`. `clause` is the sentence of the license that
 * permits the use, quoted rather than named, because a source can vanish and a
 * platform name proves nothing about what was agreed (Videvo, spec 4.2). `people`
 * is the field that decides whether a frame may sit on a page that makes a claim:
 * no free tier supplies a model release, so `identifiable` means "not without one".
 *
 * Every file is CC0, cut from the pre-5-June-2017 Unsplash archive that Wikimedia
 * Commons mirrors. License and clause are therefore the same string on all 24 and
 * live as constants rather than per record; the day a second license enters, they
 * become fields and the test below stops being satisfiable by a constant.
 */

/** Whether a person in the frame could be recognised. The release question (spec 1.4). */
export type PeopleInFrame = "none" | "unidentifiable" | "identifiable";

export type Candidate = {
  /** Stable key; the bridge and the sheet reference THIS, never the path. */
  key: string;
  file: string;
  /** Described by eye at intake, never inherited from the file name. */
  subject: string;
  author: string;
  sourceUrl: string;
  /** The original upload the Commons file mirrors, where the page records one. */
  upstream: string | null;
  created: string;
  people: PeopleInFrame;
  width: number;
  height: number;
  bytes: number;
  /** 1 if it was staged by the survey round, 2 by the second, harder search. */
  staged: 1 | 2;
  /** Where this frame fails the rule, or where its subject drifts. Never buried. */
  caution: string | null;
};

/** The license every staged file is under, and the sentence that permits the use. */
export const CANDIDATE_LICENSE = "CC0 1.0";
export const CANDIDATE_LICENSE_URL =
  "https://creativecommons.org/publicdomain/zero/1.0/";
export const CANDIDATE_CLAUSE =
  "You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.";
/** Why each file qualifies, recorded once because it is the same argument 24 times. */
export const CANDIDATE_BASIS =
  "The Commons file page carries the Unsplash template, which Commons applies only to media published on Unsplash before 5 June 2017, when its sitewide license was CC0; the API reports CC0 for the file.";
export const CANDIDATE_RETRIEVED = "2026-09-14";

export const CANDIDATES: readonly Candidate[] = [
  {
    key: "wedding-golden",
    file: "wedding-golden.jpg",
    subject: "A couple walking away down a rural road, backlit, seen from behind",
    author: "Andrew Itaga",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bride_and_groom_on_rural_road_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/Kx22w26HUd8",
    created: "2016-03-31",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 103286,
    staged: 1,
    caution: null,
  },
  {
    key: "concert-confetti",
    file: "concert-confetti.jpg",
    subject: "A small venue crowd in silhouette against a lit stage",
    author: "Jorge Gordo",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Concert_TUYA_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/W2UH8LdD3Tc",
    created: "2017-02-08",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 33712,
    staged: 1,
    caution: null,
  },
  {
    key: "wedding-rings",
    file: "wedding-rings.jpg",
    subject: "Two hands, a ring, nothing else in frame",
    author: "Rachael Crowe",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Groom_holds_bride%27s_hand_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/yI-GZRkbJ08",
    created: "2016-03-29",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 45594,
    staged: 1,
    caution: null,
  },
  {
    key: "party-dj",
    file: "party-dj.jpg",
    subject: "A DJ at the decks under stage light and smoke",
    author: "Thomas Habr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Party_Night_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/X4e8n5ncOEs",
    created: "2017-01-22",
    people: "identifiable",
    width: 1200,
    height: 800,
    bytes: 81361,
    staged: 1,
    caution: "One identifiable performer. Under rule 1.4 this frame needs a release we do not hold, so it cannot ship as it stands.",
  },
  {
    key: "wedding-toast",
    file: "wedding-toast.jpg",
    subject: "Hands clinking beer glasses over a restaurant table",
    author: "Yutacar",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Restaurant_Swan_Lake_Beer,_Agano-shi,_Niigata-pref,_Japan_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/JKMnm3CIncw",
    created: "2015-08-02",
    people: "unidentifiable",
    width: 1200,
    height: 798,
    bytes: 54821,
    staged: 1,
    caution: "Subject drift: a restaurant, not a wedding. Superseded for the wedding-toast slot by bridge-toast-couple; kept because it is the right frame for a post about a bar.",
  },
  {
    key: "festival-lights",
    file: "festival-lights.jpg",
    subject: "Stage light beams through smoke over a crowd, one hand raised",
    author: "Daniel Robert",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Smoke_and_light_beams_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/MRxD-J9-4ps",
    created: "2013-10-07",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 59990,
    staged: 1,
    caution: null,
  },
  {
    key: "wedding-arch",
    file: "wedding-arch.jpg",
    subject: "An empty ceremony aisle, tall floral arrangements either side",
    author: "Shardayyy Photography",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aisle_for_a_Wedding_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/fJzmPe-a0eU",
    created: "2016-07-24",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 87315,
    staged: 1,
    caution: "An empty room, which is the fault the frame it replaces already has. Right for a timeline that starts before the guests, wrong everywhere else.",
  },
  {
    key: "bridge-birthday-cake",
    file: "bridge-birthday-cake.jpg",
    subject: "A lit birthday cake carried across a dark room toward someone seen from behind, string lights beyond",
    author: "Sergei Solovev snight",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Happy_Birthday!_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/XmefirQLMfY",
    created: "2016-12-26",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 103693,
    staged: 2,
    caution: "The figure carrying the cake is cropped at the chin; check the master before any frame ships.",
  },
  {
    key: "bridge-birthday-candles",
    file: "bridge-birthday-candles.jpg",
    subject: "A cake in a dark room with letter candles spelling happy birthday, lit",
    author: "Stephanie McCabe stephaniemccabe",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Happy_birthday_candles_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/nTqbkNSxICw",
    created: "2016-02-17",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 49999,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-balloons",
    file: "bridge-balloons.jpg",
    subject: "Polka dot balloons on ribbons against a white brick wall",
    author: "Sofiya Levchenko sofelini",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Party_balloons_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/l6yLVM-FJxc",
    created: "2016-11-21",
    people: "none",
    width: 1030,
    height: 1200,
    bytes: 114750,
    staged: 2,
    caution: "High key, cool and empty of people, which is the same fault as the stand-in it replaces. It fixes the subject and not the frame.",
  },
  {
    key: "bridge-dancefloor",
    file: "bridge-dancefloor.jpg",
    subject: "A DJ at the decks over a packed floor, smoke and a mirror ball above",
    author: "Matty Adame omgitsmattyvee",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dance_club_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/nLUb9GThIcg",
    created: "2017-06-01",
    people: "identifiable",
    width: 1200,
    height: 800,
    bytes: 150726,
    staged: 2,
    caution: "One identifiable performer and readable faces on the floor. Needs a release nobody here holds.",
  },
  {
    key: "bridge-long-table",
    file: "bridge-long-table.jpg",
    subject: "A table from above at brunch, hands reaching in over plates and cups",
    author: "Ali Inay inayali",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Brunching_with_Friends_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/y3aP9oo9Pjc",
    created: "2015-02-25",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 135617,
    staged: 2,
    caution: "Daylight and cool, where the stand-in is a reception table under warm light.",
  },
  {
    key: "bridge-toast-couple",
    file: "bridge-toast-couple.jpg",
    subject: "A couple on steps holding champagne flutes, cropped at the neck",
    author: "Jason Briscoe jbriscoe",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cheers_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/Pn0XP2Klbcw",
    created: "2016-10-31",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 93023,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-wedding-guests",
    file: "bridge-wedding-guests.jpg",
    subject: "A row of guests holding small bouquets, cropped at the neck",
    author: "Tamara Menzi itstamaramenzi",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Wedding_guests_with_flowers_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/D1-W7fywGbw",
    created: "2017-03-20",
    people: "none",
    width: 1200,
    height: 738,
    bytes: 74828,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-wedding-detail",
    file: "bridge-wedding-detail.jpg",
    subject: "A couple and a bouquet at close range, cropped at the chest",
    author: "Luis Tosta luis_tosta",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Wedding_Day_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/MEZDyn98La8",
    created: "2017-05-16",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 95087,
    staged: 2,
    caution: "High key, which fights the dark warm grade the kit is specified in.",
  },
  {
    key: "bridge-ceremony",
    file: "bridge-ceremony.jpg",
    subject: "A stone church from the back of the aisle, guests seated, sunflowers on the pews",
    author: "Josh Applegate joshapplegate",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sunflowers_down_aisle_stone_church_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/ToKSfdmznKg",
    created: "2016-09-25",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 152479,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-crowd-hands",
    file: "bridge-crowd-hands.jpg",
    subject: "Hands raised in silhouette against a lit stage",
    author: "Chad Kirchoff cakirchoff",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Houston_audience_lifting_up_hands_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/ivqGyYLtBI8",
    created: "2016-10-03",
    people: "unidentifiable",
    width: 1200,
    height: 676,
    bytes: 73880,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-festival-dusk",
    file: "bridge-festival-dusk.jpg",
    subject: "A festival crowd at dusk, hands up, string lights overhead",
    author: "Ezra Jeffrey emcomeau",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cheering_concertgoers_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/pPquxoraq_M",
    created: "2016-03-25",
    people: "identifiable",
    width: 1200,
    height: 800,
    bytes: 148673,
    staged: 2,
    caution: "Readable faces across the front of the crowd. Needs a release nobody here holds.",
  },
  {
    key: "bridge-offsite-fire",
    file: "bridge-offsite-fire.jpg",
    subject: "A circle of friends around a fire in a canyon at the end of the day",
    author: "Phil Coffman philcoffman",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Happy_young_people_near_fire_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/anV_zgNDZhc",
    created: "2016-11-10",
    people: "identifiable",
    width: 1200,
    height: 800,
    bytes: 141845,
    staged: 2,
    caution: "Readable faces around the fire. Needs a release nobody here holds.",
  },
  {
    key: "bridge-trip-silhouettes",
    file: "bridge-trip-silhouettes.jpg",
    subject: "A group in silhouette on a mirrored flat at sunset",
    author: "Mario Purisic mariopurisic",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Crowd_at_a_party_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/jG1z5o7NCq4",
    created: "2015-12-20",
    people: "unidentifiable",
    width: 1200,
    height: 800,
    bytes: 85132,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-portrait-dusk",
    file: "bridge-portrait-dusk.jpg",
    subject: "Two people in silhouette against a dusk sky, hand in hand, shot portrait",
    author: "Caleb Ekeroth calebekeroth",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sunset_beach_couple_(Unsplash).jpg",
    upstream: "https://unsplash.com/photos/wSBQFWF77lI",
    created: "2015-03-16",
    people: "unidentifiable",
    width: 800,
    height: 1200,
    bytes: 20567,
    staged: 2,
    caution: null,
  },
  {
    key: "bridge-meeting-hands",
    file: "bridge-meeting-hands.jpg",
    subject: "Laptops, a notebook and two pairs of hands at a meeting table",
    author: "helloquence",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Helloquence-61189.jpg",
    upstream: "https://unsplash.com/photos/5fNmWej4tAA",
    created: "2016-01-30",
    people: "none",
    width: 1200,
    height: 800,
    bytes: 91195,
    staged: 2,
    caution: "It reads as a stock office photograph, which is the exact thing rule 18 exists to keep off the site.",
  },];

const BY_KEY = new Map(CANDIDATES.map((c) => [c.key, c]));

/** Throws on an unknown key: a typo fails a test rather than rendering a hole. */
export function candidate(key: string): Candidate {
  const c = BY_KEY.get(key);
  if (!c) throw new Error(`Unknown staged candidate: ${key}`);
  return c;
}

export function candidateSrc(key: string): string {
  return `/design/media-kit/${candidate(key).file}`;
}

/** The count the board quotes: how many of the batch carry a face. */
export const IDENTIFIABLE = CANDIDATES.filter(
  (c) => c.people === "identifiable",
);
