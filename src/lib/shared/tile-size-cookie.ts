/**
 * THE GALLERY'S DENSITY STEP, AND THE COOKIE IT PERSISTS IN: three steps, one
 * index shared by host and guest. The justified rows count photographs per row,
 * never pixels, so what a returning viewer picked is "which of the three steps":
 * 0 the largest photographs, 2 the densest.
 *
 * Pure + node-safe, so the server page (which reads the cookie and paints the
 * first frame) and the client control (which flips it) share ONE definition of
 * what a step is. Nothing here touches `next/headers`: the cookie NAME lives
 * here, the cookie ACCESS lives in the page and its Server Action, the same
 * split `events-view.ts` uses for the events list's cover/rows toggle (one house
 * pattern for "a device preference the server has to know before the first
 * byte").
 *
 * ★ WHY A COOKIE AND NOT localStorage. The step sizes a grid the SERVER already
 * streams: a local preference would paint the default on the server and re-lay
 * the WHOLE album after hydration on every load, a more jarring flash than a
 * toggle's own swap (a step change moves every row's breaks, not one row's
 * chrome). A cookie set by a Server Action is read during render, so the first
 * paint is already the step a returning host or guest picked. It is still
 * per-device, never a profile column; only the read/write mechanism differs
 * from localStorage.
 */

import { DEFAULT_ROW_STEP, isRowStep, type RowStep } from "./album-rows";

/** The cookie the control writes and the gallery reads. */
export const TILE_SIZE_COOKIE = "pr_tile_size";

/** A year: this is a preference, not a session fact (events-view.ts's own rule). */
export const TILE_SIZE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The step a cookie names: an index, and anything else the default, a pixel
 * width the masonry columns once wrote (300, 240, 180) included. Nothing has
 * written a width since the rows and only test devices held one, so a width is
 * no pick worth carrying across (crumbs-91 retired that mapping).
 */
export function resolveRowStep(raw: string | undefined | null): RowStep {
  // An empty value is no pick: `Number("")` is 0, the largest step, which nobody chose.
  if (raw === undefined || raw === null || raw.trim() === "")
    return DEFAULT_ROW_STEP;
  const n = Number(raw);
  return isRowStep(n) ? n : DEFAULT_ROW_STEP;
}

/** Sentence-case labels for the three steps, largest photographs first. */
export const ROW_STEP_LABEL: Record<RowStep, string> = {
  0: "Large",
  1: "Medium",
  2: "Small",
};
