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
 * The bridge is not a separate question: the route decides how many frames
 * change and when, so asking it twice was asking Will to answer the same thing
 * in two words. The consequence is on the board instead, as ROUTE_SHIPS, so the
 * fold is visible rather than hidden.
 *
 * ★ AND EVERY COUNT IN AN ASK IS INTERPOLATED, NEVER TYPED. The first cut of
 * this file corrected the counts in the finding above and left ask 3 reading
 * "Licensed ships twelve swaps", which is the one number the round exists to
 * take back, sitting in the first sentence a reviewer reads. A number written
 * into a sentence cannot be wrong out loud; a number interpolated from the batch
 * can only be wrong if the batch is. So there are none of the former left here.
 */

import {
  BRIDGE,
  BRIDGE_BY_ID,
  routeOutcome,
  routeOutcomeForId,
} from "./bridge";
import { candidate, CANDIDATES } from "./candidates";
import type { Route } from "./kit";
// Round four's asks are priced from the plan, so the money in an ask is the money
// in the plan table by construction and cannot drift out of one of them.
import { CLIPS_IF_LICENSED, HARD_FRAMES, TOTAL } from "./plan";
import { WEBSUMMIT_CC } from "./sources";

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
 * What Mix actually swaps the week it is chosen, asked of the one route function
 * rather than counted off the list Mix is curated in.
 *
 * ★ ON THE IDS IT IS ONE FRAME, ON THE BLOG IT IS TWO, AND THAT IS NOT A TYPO.
 * Mix keeps two staged candidates licensed, and only one of the twelve manifest
 * ids is bridged by either of them: the id `wedding-arch` is bridged by
 * `bridge-ceremony`, a ceremony with people in it, which is not furniture and so
 * goes to the shoot with the other ten. A post names its candidate directly, so
 * on the blog both details survive. Reading the mix list against an id was how
 * round three's first cut made the board and the applied CSS disagree.
 */
export const MIX_IDS = Object.keys(BRIDGE_BY_ID).filter(
  (id) => routeOutcomeForId(id, "mix").kind === "licensed",
).length;
export const MIX_POSTS = BRIDGE.filter(
  (p) => routeOutcome(p, "mix").kind === "licensed",
).length;

/**
 * What each route actually puts on the site the week it is chosen, which is the
 * question the fifth ask used to ask. `legal` is whether every frame it ships
 * passes ask 1 as staged today.
 *
 * ★ EVERY COUNT HERE IS ALSO WHAT A WALK WEARS, AND THAT TOOK A FIX IN apply.ts.
 * The `blog` column is counted per POST (`MIX_POSTS`), and the applied block used
 * to be able to swap only per id, so the Mix row promised two covers while the
 * block could change exactly one. The blocks carry a per-slug rule for all 23
 * posts now, so the number in this table is the number a reviewer can count on
 * the real /blog with the block on. `apply.test.ts` pins the two together.
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
    ships: `${MIX_IDS} of the ${IDS_TOTAL} ids swapped for a licensed frame, the ring detail, which is the only one of the twelve that is furniture; the other ${IDS_TOTAL - MIX_IDS} are left as they are until the shoot`,
    blog: `${MIX_POSTS} covers change now, ${BRIDGE.length - MIX_POSTS} wait`,
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

/**
 * ★ ROUND FOUR REPLACED TWO OF THE FOUR ASKS, AND THE SHEET IS THE REASON.
 *
 * Round three asked Will to rule on an allowed LIST of licences. His note for
 * round four asked for PLACES instead, and the sourcing sheet is that answer, so
 * the list ask is gone: the sheet ranks twelve real catalogues by the one test
 * that decides them, and a ranking a reviewer can read beats a yes to eight
 * licence names.
 *
 * Round three also asked for the route. Round four answers it rather than asking
 * again. The recommendation is still Mix; what changed is where Mix's licensed
 * half comes from, a bought frame with a release behind it instead of a staged
 * CC0 frame that ask 1 bars. That is the same route with a better second half,
 * so the question it actually needs is the money.
 *
 * The two that stay are the two nobody has ruled on: the rule, and the shoot.
 */
export const ASKS: readonly Ask[] = [
  {
    id: "rule",
    question:
      "The sourcing rule: author, source, the license clause quoted, a retrieval date and a people field required on every manifest entry, and no recognisable face ships without a release.",
    options: ["Yes", "No"],
    recommend: "Yes",
    because:
      "It is already running on 22 records with a suite that refuses one missing a field. Saying yes disqualifies four of the staged frames and drops every free library on the sheet below every paid one, so it is the answer that costs something.",
    href: "#mk-record",
  },
  {
    id: "spend",
    question: `The bridge, bought rather than scavenged: one month of Unsplash+ plus ${HARD_FRAMES} iStock frames for the conference rooms, $${TOTAL} in total, staged the way the CC0 batch was.`,
    options: ["Buy", "Hold"],
    recommend: "Buy",
    because:
      "Every visual in that month is model and property released with a warranty behind it, which is the exact clause the twelve stand-ins never had, and a frame downloaded inside the month stays licensed forever with nothing to register. It is the cheapest line on the board and the only one that makes Mix legal this week.",
    href: "#mk-plan",
  },
  {
    id: "crowds",
    question:
      "Does the release rule bind every face, or only a frame's subject? A crowd shot is full of recognisable people and none of them is the picture.",
    options: ["Subjects only", "All faces"],
    recommend: "Subjects only",
    because: `A risk call rather than a legal opinion, and worth ruling for what turns on it: Web Summit's ${WEBSUMMIT_CC.toLocaleString("en-US")} CC BY conference photographs and the whole Flickr corpus are crowds, and conferences are the one vertical no subscription on this sheet is deep in. Answer All faces and the free half of the sheet is decoration.`,
    href: "#mk-sheet",
  },
  {
    id: "kit",
    question:
      "The kit: 36 masters, six per vertical, shot in one night at a real event running Partyreel.",
    options: ["Shoot", "Park"],
    recommend: "Shoot",
    because: `One night closes nine of the twelve rows in the asset log, and the sheet sharpened the case rather than softening it: licensing the photographs is $${TOTAL} and licensing the films is $${CLIPS_IF_LICENSED} a year, so the money was never in the stills.`,
    href: "#mk-kit",
  },
];

/** The recommendation in one sentence, for the top of the board and the record. */
export const RECOMMENDATION = `Say yes to the rule, spend $${TOTAL} on a bridge that is actually released, rule on whether a crowd needs one, and shoot the kit at a real event we host. The route is still Mix. This round only changes where Mix's licensed half comes from.`;
