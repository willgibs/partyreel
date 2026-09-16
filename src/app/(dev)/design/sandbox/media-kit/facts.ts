import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { FRAME_COUNT, SHEET_COUNT } from "./catalogue";
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
  SOURCES,
  VERTICAL_LABEL,
  WEBSUMMIT_CC,
  WEBSUMMIT_TOTAL,
} from "./sources";

/**
 * EVERY NUMBER THE SPEC QUOTES, IN ONE PLACE (the migration wave, 2026-09-15;
 * cut to what round six still says, 2026-09-16).
 *
 * The spec's strings are the ruling surface, and this board's oldest rule is
 * that a count on that surface is computed rather than typed: round three
 * shipped an ask whose first sentence carried the one number the round existed
 * to take back, because the number was a word in a string. So `spec.ts`
 * interpolates, and everything it interpolates is here.
 *
 * ★ THE TWELVE ARE COUNTED OFF THE PRODUCTION MANIFEST, not off a board file.
 * Rounds one to five counted them through the blog bridge, which left the
 * board's oldest number one deletion away from being a literal again. The
 * manifest IS the fact: `MARKETING_IMAGES` is what ships, so a thirteenth still
 * landing on the site moves this board's prose the same day.
 *
 * ★ IT IS A DEFAULT EXPORT, AND THAT IS NOT A STYLE CHOICE. `lab-review.mjs`
 * reads a spec as TEXT with no build step and takes the board to be the first
 * `{` after `defineBoard(`. Named imports above that call are safe (the palette
 * board proves it), but a brace-free import keeps this file's own history
 * legible: a second named import under the `defineBoard(` line WOULD be read as
 * the board, and every ruling on this board would then be refused.
 */
const FACTS = {
  /** The stills on the marketing site today, counted off what ships. */
  ids: MARKETING_IMAGES.length,
  /** The places, and the shoot that would replace all of them. */
  sources: SOURCES.length,
  masters: MASTERS.length,
  /** The sheet: the pulls and the frames drawn from the sources' own CDNs. */
  sheetPulls: SHEET_COUNT,
  frames: FRAME_COUNT,
  /** The exposure, recomputed from the tree by exposure.test.ts. */
  productionFiles: PRODUCTION_FILES,
  routes: ROUTES.length,
  marketingPages: MARKETING_PAGES,
  /** The money, read off the sources' own cards by plan.ts. */
  total: TOTAL,
  unsplashMonth: UNSPLASH_MONTH,
  istockFrame: ISTOCK_FRAME,
  hardFrames: HARD_FRAMES,
  clipsYear: CLIPS_IF_LICENSED,
  /** The two counts ask 3 turns on, formatted as they are read. */
  webSummit: WEBSUMMIT_CC.toLocaleString("en-US"),
  webSummitAll: WEBSUMMIT_TOTAL.toLocaleString("en-US"),
  /** The vertical labels, so the dock's control cannot drift from the sheet. */
  vertical: VERTICAL_LABEL,
} as const;

export default FACTS;
