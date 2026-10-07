import type { RelationAct } from "@/components/social/relation-toggle";
import { marketingImage } from "@/lib/constants/marketing-media";

import type { PhotosId } from "./knobs";

/**
 * ONE GUEST, HER ACCOUNT, AND THE PEOPLE IN IT: Priya, who confirmed her
 * email at Maya & Jay's wedding (the site's own fictional album, the one every
 * board follows) and so has an account, with no public page of her own.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so its people are retyped here.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset).
 */

export type Person = {
  id: string;
  name: string;
  handle: string | null;
  seed: string;
};

/** Whoever's account this is: a guest with an account and no handle. */
export const PRIYA = {
  id: "am-priya",
  name: "Priya Shah",
  email: "priya.shah@example.com",
  seed: "am-priya",
  joined: "October 2026",
  /**
   * The address the setup would open on (`handleCandidates("Priya Shah")`'s
   * first, `account/profile/handle-suggestion.ts`): only a suggestion, never
   * hers until she finishes.
   */
  handle: "priya-shah",
} as const;

/** The host whose page Priya opens from the album. */
export const MAYA: Person = {
  id: "am-maya",
  name: "Maya Alvarez",
  handle: "maya",
  seed: "am-maya",
};

/** Someone she follows weeks later: her fortieth follow, the steady state. */
export const THEO: Person = {
  id: "am-theo",
  name: "Theo Grant",
  handle: "theog",
  seed: "am-theo",
};

/**
 * The people Priya follows, as Connections lists them the moment after she
 * followed Maya: newest first, so Maya heads it.
 */
export const FOLLOWING: readonly Person[] = [
  MAYA,
  { id: "am-sam", name: "Sam Okafor", handle: "samo", seed: "am-sam" },
  { id: "am-lena", name: "Lena Wu", handle: null, seed: "am-lena" },
  THEO,
];

/** The people she has blocked: Jordan, and Ray from a summer party. */
export const BLOCKED: readonly Person[] = [
  {
    id: "am-jordan",
    name: "Jordan Pike",
    handle: "jordanpike",
    seed: "am-jordan",
  },
  { id: "am-ray", name: "Ray Moss", handle: "raym", seed: "am-ray" },
];

/** How many follow Priya: a count only she sees, never names. */
export const FOLLOWERS = 3;

export type Party = {
  id: string;
  name: string;
  date: string;
  cover: string;
  role: "host" | "guest";
};

/** Maya's parties, as her public page's grid shows them. */
export const MAYA_PARTIES: readonly Party[] = [
  {
    id: "p1",
    name: "Maya & Jay's Wedding",
    date: "Oct 4, 2026",
    cover: marketingImage("wedding-golden").src,
    role: "host",
  },
  {
    id: "p2",
    name: "Jay's 40th",
    date: "Jun 21, 2026",
    cover: marketingImage("party-balloons").src,
    role: "host",
  },
  {
    id: "p3",
    name: "Ruby's 30th",
    date: "Mar 8, 2026",
    cover: marketingImage("party-dj").src,
    role: "guest",
  },
];

/** Theo's one shown party: the wedding, as a guest. */
export const THEO_PARTIES: readonly Party[] = [
  { ...MAYA_PARTIES[0]!, role: "guest" },
];

/**
 * The events Priya's page could show (`getMyAttendedEvents`: an approved
 * upload on a proved row), each private until she picks it in the setup's
 * third step: the wedding and a birthday she added photographs to.
 */
export const HER_EVENTS: readonly Party[] = [
  {
    id: "e1",
    name: "Maya & Jay's Wedding",
    date: "Oct 4, 2026",
    // The album's own cover (Maya's card wears it too), never one of her
    // uploads: a cover is the album's newest approved photograph, rarely hers.
    cover: marketingImage("wedding-golden").src,
    role: "guest",
  },
  {
    id: "e2",
    name: "Ruby's 30th",
    date: "Mar 8, 2026",
    cover: marketingImage("party-dj").src,
    role: "guest",
  },
];

/** Her events by the Photos knob: the wedding's pair, or a party night's. */
export const EVENT_SETS: Record<PhotosId, readonly Party[]> = {
  wedding: HER_EVENTS,
  party: [
    HER_EVENTS[1]!,
    {
      id: "e3",
      name: "Jay's 40th",
      date: "Jun 21, 2026",
      cover: marketingImage("party-balloons").src,
      role: "guest",
    },
  ],
};

/** Priya's own photographs and likes, across the wedding and a birthday. */
const STILLS = [
  "wedding-toast",
  "reception-table",
  "wedding-rings",
  "wedding-arch",
  "reception-hall",
  "wedding-petals",
  "party-dj",
  "festival-lights",
  "concert-confetti",
] as const;

export type Still = { id: string; src: string; ratio: number };

const still = (id: string, i: number): Still => {
  const m = marketingImage(id);
  return { id: `${id}-${i}`, src: m.src, ratio: m.width / m.height };
};

export const UPLOADS: readonly Still[] = STILLS.slice(0, 6).map(still);
export const LIKES: readonly Still[] = [...STILLS]
  .reverse()
  .map((id, i) => still(id, i + 10));

/**
 * Her uploads by the Photos knob (`knobs.ts`): the wedding's six, or five
 * from a party night, so the plate's light is seen to be read from them.
 */
export const UPLOAD_SETS: Record<PhotosId, readonly Still[]> = {
  wedding: UPLOADS,
  party: [
    "festival-lights",
    "concert-confetti",
    "party-dj",
    "festival-crowd",
    "party-balloons",
  ].map((id, i) => still(id, i + 20)),
};

/** Each relation write answers after a round trip and writes nothing. */
export const INERT: RelationAct = () =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 320));
