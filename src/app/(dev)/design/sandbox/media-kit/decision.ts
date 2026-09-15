/**
 * THE DECISION, COMPUTED (the media-kit track, round three).
 *
 * Round two built the evidence. This file is the thing a ruling is actually made
 * on: the questions, in the order they have to be answered, each with its
 * one-word options, and every number in them derived from the staged batch and
 * the real posts rather than typed into a paragraph.
 *
 * ★ THE ROUND'S FINDING, AND IT IS A NUMBER. The rule this board proposes (a
 * recognisable face may not ship without a release) disqualifies four of the 22
 * staged frames, and three of them are load bearing: two carry manifest ids and
 * three carry blog posts. So the Licensed route does not fill twelve ids and 21
 * posts under its own rule, it fills ten and eighteen, and the two ids it cannot
 * fill are the dance floor and the DJ, which are the two frames a product about
 * parties needs most. Round two reported the raw counts and was optimistic by
 * exactly the amount the rule takes back.
 *
 * ★ FOUR ASKS, NOT FIVE. Round two asked the route AND the bridge separately.
 * The bridge is not a separate question: the route decides it (Licensed ships
 * twelve, Mix ships two, Ours ships none), so asking it twice was asking Will to
 * answer the same thing in two words. The consequence is on the board instead,
 * as ROUTE_SHIPS, so the fold is visible rather than hidden.
 */

import { BRIDGE, BRIDGE_BY_ID, MIX_LICENSED } from "./bridge";
import { candidate, CANDIDATES } from "./candidates";
import type { Route } from "./kit";

/** The frames the rule in ask 1 bars: a recognisable face and no release. */
export const BARRED = CANDIDATES.filter((c) => c.people === "identifiable");

/** Manifest ids whose bridge candidate is barred, so the swap cannot ship. */
export const BARRED_IDS = Object.entries(BRIDGE_BY_ID)
  .filter(([, key]) => candidate(key).people === "identifiable")
  .map(([id]) => id);

/** Posts whose candidate is barred: filled on the board, unshippable in fact. */
export const BARRED_POSTS = BRIDGE.filter(
  (p) => p.candidate && candidate(p.candidate).people === "identifiable",
);

/** Posts with any candidate at all, and the honest count once the rule applies. */
export const POSTS_FILLED = BRIDGE.filter((p) => p.candidate).length;
export const POSTS_EMPTY = BRIDGE.length - POSTS_FILLED;
export const POSTS_UNDER_RULE = POSTS_FILLED - BARRED_POSTS.length;

/** The twelve manifest ids, and how many a licensed swap can legally fill. */
export const IDS_TOTAL = Object.keys(BRIDGE_BY_ID).length;
export const IDS_UNDER_RULE = IDS_TOTAL - BARRED_IDS.length;

/**
 * What each route actually puts on the site the week it is chosen, which is the
 * question the fifth ask used to ask. `legal` is whether every frame it ships
 * passes ask 1 as staged today.
 */
export type RouteShipment = {
  route: Route;
  label: string;
  ships: string;
  blog: string;
  legal: boolean;
  cost: string;
  ends: string;
};

export const ROUTE_SHIPS: readonly RouteShipment[] = [
  {
    route: "mix",
    label: "Mix",
    ships: `${MIX_LICENSED.length} of the ${IDS_TOTAL} ids swapped for a licensed frame, the other ${IDS_TOTAL - MIX_LICENSED.length} left as they are until the shoot`,
    blog: "2 covers change now, 21 wait",
    legal: true,
    cost: "One night of photography, and two frames of staging",
    ends: "The day the kit lands, the two licensed frames are deleted",
  },
  {
    route: "ours",
    label: "Ours",
    ships: "Nothing until the shoot, and then all 36 masters at once",
    blog: "23 covers change on the same day",
    legal: true,
    cost: "One night of photography and a release at the door",
    ends: "It does not end, which is the point of it",
  },
  {
    route: "licensed",
    label: "Licensed",
    ships: `${IDS_UNDER_RULE} of the ${IDS_TOTAL} ids under the rule (${BARRED_IDS.join(" and ")} carry a face with no release)`,
    blog: `${POSTS_UNDER_RULE} of 23 covers, not ${POSTS_FILLED}`,
    legal: false,
    cost: "None, which is the whole of its case",
    ends: "It does not, and that is the risk in it",
  },
];

export type Ask = {
  id: string;
  /** The question, worded so the answer is one word. */
  question: string;
  /** The one-word answers, in the order they are offered. */
  options: readonly string[];
  /** The one this board recommends, which is always one of `options`. */
  recommend: string;
  /** One line: why, and what changes the moment the word is said. */
  because: string;
  /** The section on this board that argues it. */
  href: string;
};

export const ASKS: readonly Ask[] = [
  {
    id: "rule",
    question:
      "The sourcing rule: author, source, the license clause quoted, a retrieval date and a people field required on every manifest entry, and no recognisable face ships without a release.",
    options: ["Yes", "No"],
    recommend: "Yes",
    because:
      "It is already running on 22 records with a suite that refuses one missing a field. Saying yes is the thing that disqualifies four of the staged frames below, so it is the answer that costs something.",
    href: "#mk-record",
  },
  {
    id: "sources",
    question:
      "The allowed list: CC0, Pexels, Pixabay, Mixkit and Coverr in; Unsplash and CC BY out.",
    options: ["Yes", "Strike one"],
    recommend: "Yes",
    because:
      "Ten license pages, quoted clause by clause on the date read. Unsplash is out on the sentence that excludes recognisable people, which is the sentence the whole round turns on.",
    href: "#mk-sources",
  },
  {
    id: "route",
    question:
      "The route, which also decides the bridge: Licensed ships twelve swaps, Mix ships two, Ours ships none.",
    options: ["Mix", "Ours", "Licensed"],
    recommend: "Mix",
    because:
      "Licensed cannot be chosen under ask 1 as staged: two of its twelve frames carry a face with no release, and it has nothing at all for the corporate and conference half of the business. Mix is the dated version of it.",
    href: "#mk-bridge",
  },
  {
    id: "kit",
    question:
      "The kit: 36 masters, six per vertical, shot in one night at a real event running Partyreel.",
    options: ["Shoot", "Park"],
    recommend: "Shoot",
    because:
      "One night closes nine of the twelve rows in the asset log, because the squares, the portraits, the clips, the film, the cutout and the demo seed are all crops and cuts of it.",
    href: "#mk-kit",
  },
];

/** The recommendation in one sentence, for the top of the board and the record. */
export const RECOMMENDATION =
  "Say yes to the rule and the list, take Mix, and shoot the kit at a real event we host. Mix is Licensed with an end date, and the end date is the shoot.";
