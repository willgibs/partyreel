import { BRIDGE } from "./bridge";
import { CANDIDATES } from "./candidates";
import { FRAME_COUNT, SHEET_COUNT } from "./catalogue";
import {
  BARRED_IDS,
  IDS_TOTAL,
  IDS_UNDER_RULE,
  MIX_IDS,
  MIX_POSTS,
  POSTS_FILLED,
  POSTS_UNDER_RULE,
} from "./decision";
import { MARKETING_PAGES, PRODUCTION_FILES, ROUTES } from "./exposure";
import {
  CLIPS_IF_LICENSED,
  HARD_FRAMES,
  ISTOCK_FRAME,
  TOTAL,
  UNSPLASH_MONTH,
} from "./plan";
import { MASTERS } from "./shoot";
import {
  ALLOWED_SOURCES,
  BARRED_SOURCES,
  SOURCES,
  VERTICAL_LABEL,
  WEBSUMMIT_CC,
} from "./sources";

/**
 * EVERY NUMBER THE SPEC QUOTES, IN ONE PLACE (the migration wave, 2026-09-15).
 *
 * The spec's strings are the ruling surface, and this board's oldest rule is
 * that a count on that surface is computed rather than typed: round three
 * shipped an ask whose first sentence carried the one number the round existed
 * to take back, because the number was a word in a string. So `spec.ts`
 * interpolates, and everything it interpolates is here.
 *
 * ★ IT IS A DEFAULT EXPORT, AND THAT IS NOT A STYLE CHOICE. `lab-review.mjs`
 * validates a pasted ruling against the spec by SCANNING it with no build step,
 * and it finds the board object as the first `{` after the first `defineBoard`.
 * A named import below that line (`import { BRIDGE } from "./bridge"`) is that
 * brace, so the scanner parsed the import list as the board, found no asks, and
 * refused every ruling on this board with "rule is not an ask on media-kit".
 * One brace-free import keeps the spec readable by it. The scanner's assumption
 * is the fragile half and the fix belongs in that script (match `defineBoard(`
 * rather than `defineBoard`); it is asked for in this track's Handoff, and until
 * it lands, a spec with a second named import silently loses its ledger.
 */
const FACTS = {
  /** The twelve manifest ids, and the ten a licensed swap can legally fill. */
  ids: IDS_TOTAL,
  idsUnderRule: IDS_UNDER_RULE,
  barredIds: BARRED_IDS.join(" and "),
  /** The blog: every post, the filled ones, and the honest count under the rule. */
  posts: BRIDGE.length,
  postsFilled: POSTS_FILLED,
  postsUnderRule: POSTS_UNDER_RULE,
  /** What Mix swaps the week it is chosen, on the ids and on the blog. */
  mixIds: MIX_IDS,
  mixPosts: MIX_POSTS,
  /** The staged batch, and the shoot that replaces it. */
  candidates: CANDIDATES.length,
  masters: MASTERS.length,
  /** The exposure, recomputed from the tree by exposure.test.ts. */
  productionFiles: PRODUCTION_FILES,
  routes: ROUTES.length,
  marketingPages: MARKETING_PAGES,
  /** The sheet: the places, the two halves of the ranking, and the pulls. */
  sources: SOURCES.length,
  allowed: ALLOWED_SOURCES.length,
  barredSources: BARRED_SOURCES.length,
  sheetPulls: SHEET_COUNT,
  frames: FRAME_COUNT,
  /** The money, read off the sources' own cards by plan.ts. */
  total: TOTAL,
  unsplashMonth: UNSPLASH_MONTH,
  istockFrame: ISTOCK_FRAME,
  hardFrames: HARD_FRAMES,
  istockSpend: HARD_FRAMES * ISTOCK_FRAME,
  clipsYear: CLIPS_IF_LICENSED,
  /** The one catalogue count a ruling turns on, formatted as it is read. */
  webSummit: WEBSUMMIT_CC.toLocaleString("en-US"),
  /** The vertical labels, so the dock's control cannot drift from the sheet. */
  vertical: VERTICAL_LABEL,
} as const;

export default FACTS;
