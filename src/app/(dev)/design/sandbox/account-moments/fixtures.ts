import type { RelationAct } from "@/components/social/relation-toggle";
import { marketingImage } from "@/lib/constants/marketing-media";

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
} as const;

/** The host whose page Priya opens from the album. */
export const MAYA: Person = {
  id: "am-maya",
  name: "Maya Alvarez",
  handle: "maya",
  seed: "am-maya",
};

/** A guest at the wedding Priya would rather not have following her. */
export const JORDAN: Person = {
  id: "am-jordan",
  name: "Jordan Pike",
  handle: "jordanpike",
  seed: "am-jordan",
};

/** The people Priya follows, as Connections lists them. */
export const FOLLOWING: readonly Person[] = [
  MAYA,
  { id: "am-sam", name: "Sam Okafor", handle: "samo", seed: "am-sam" },
  { id: "am-lena", name: "Lena Wu", handle: null, seed: "am-lena" },
  { id: "am-theo", name: "Theo Grant", handle: "theog", seed: "am-theo" },
];

/** The one she unfollows while tidying. */
export const SAM = FOLLOWING[1]!;

/** The people she has blocked: Jordan, and Ray from a summer party. */
export const BLOCKED: readonly Person[] = [
  JORDAN,
  { id: "am-ray", name: "Ray Moss", handle: "raym", seed: "am-ray" },
];

/** The one she unblocks while tidying. */
export const RAY = BLOCKED[1]!;

/** How many follow Priya: a count only she sees, never names. */
export const FOLLOWERS = 3;

/** Maya's parties, as her public page's grid shows them. */
export const MAYA_PARTIES: readonly {
  id: string;
  name: string;
  date: string;
  cover: string;
  role: "host" | "guest";
}[] = [
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

/** Jordan's one shown party. */
export const JORDAN_PARTIES = [MAYA_PARTIES[0]!].map((p) => ({
  ...p,
  role: "guest" as const,
}));

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

/** Each relation write answers after a round trip and writes nothing. */
export const INERT: RelationAct = () =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 320));
