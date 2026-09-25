/**
 * THE GALLERY'S TILE SIZE, AND THE COOKIE IT PERSISTS IN (`app-vocabulary` r1,
 * `gallery-controls-home=cluster` + `gallery-controls-persistence`).
 *
 * Pure + node-safe, so the server page (which reads the cookie and paints the
 * first frame) and the client control (which flips it) share ONE definition
 * of what a size is. Nothing here touches `next/headers`: the cookie NAME
 * lives here, the cookie ACCESS lives in the page and its Server Action —
 * the same split `events-view.ts` uses for the events list's cover/rows
 * toggle, on purpose (one house pattern for "a device preference the server
 * has to know before the first byte").
 *
 * ★ WHY A COOKIE AND NOT localStorage, OVERRULING THE BOARD'S OWN RULED
 * ANSWER (`gallery-controls-persistence=device`, which named localStorage).
 * `--album-column` sizes a grid the SERVER already streams: a local
 * preference would paint the wired default on the server and resize the
 * WHOLE album after hydration on every load, which is a more jarring flash
 * than the events-view toggle's own cards-to-rows swap (a column count
 * change reflows every tile's height, not just a row's chrome). A cookie set
 * by a Server Action is read during render, so the first paint is already
 * the size a returning host or guest picked. Localstorage remains the
 * RIGHT-SHAPED answer to "which device" (this is still per-device, never a
 * profile column); only the read/write MECHANISM changes.
 */

import { DEFAULT_ROW_STEP, isRowStep, type RowStep } from "./album-rows";

/** The cookie the control writes and the gallery reads. */
export const TILE_SIZE_COOKIE = "pr_tile_size";

/** A year: this is a preference, not a session fact (events-view.ts's own rule). */
export const TILE_SIZE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The three steps the board measured: 180 tight, 240 the wired default
 *  (Will, 2026-09-19, `tile=240`), 300 loose. A width, not a count — the
 *  control sets `--album-column`, and `masonry.tsx`'s columns follow it. */
export const TILE_SIZES = [180, 240, 300] as const;

export type TileSize = (typeof TILE_SIZES)[number];

export const DEFAULT_TILE_SIZE: TileSize = 240;

/** Sentence-case labels for the three steps, shared by every menu that lists
 *  them as a standalone row (`ViewMenu`'s Tile size group, `app-vocabulary`
 *  r2). `TileSizeControl` keeps its own lowercase strings for its
 *  `aria-label`s ("Tile size small" reads as one sentence continuing the
 *  control's own name), which is a different context and stays as it is. */
export const TILE_SIZE_LABEL: Record<TileSize, string> = {
  180: "Small",
  240: "Medium",
  300: "Large",
};

/**
 * THE ONE COOKIE NOW HOLDS A STEP INDEX (`album-columns` r2: three steps, one
 * index shared by host and guest). The justified rows count photographs per
 * row, never pixels, so what a returning viewer picked is "which of the three
 * steps": 0 the largest photographs, 2 the densest. The three legacy widths map
 * across by what they meant (300 loose is 0, 240 the wired default is 1, 180
 * tight is 2), so nobody's pick is lost at the switch.
 *
 * ★ BOTH READERS UNDERSTAND BOTH SPELLINGS UNTIL THE SURFACES SWITCH. Masonry's
 * surfaces still write and read widths (`setTileSizeAction`, `resolveTileSize`)
 * while the rows' surfaces will write the index; a cookie either one wrote reads
 * the same pick on the other, so the two never disagree about one device.
 * `TILE_SIZES` and its kin retire with the last masonry surface.
 */
const LEGACY_STEP: Record<TileSize, RowStep> = { 300: 0, 240: 1, 180: 2 };
const STEP_SIZE: Record<RowStep, TileSize> = { 0: 300, 1: 240, 2: 180 };

/** The step a cookie names: an index, or a legacy width mapped across. */
export function resolveRowStep(raw: string | undefined | null): RowStep {
  if (raw === undefined || raw === null || raw.trim() === "")
    return DEFAULT_ROW_STEP;
  const n = Number(raw);
  if (isRowStep(n)) return n;
  return (TILE_SIZES as readonly number[]).includes(n)
    ? LEGACY_STEP[n as TileSize]
    : DEFAULT_ROW_STEP;
}

/** Sentence-case labels for the three steps, largest photographs first. */
export const ROW_STEP_LABEL: Record<RowStep, string> = {
  0: "Large",
  1: "Medium",
  2: "Small",
};

export function resolveTileSize(raw: string | undefined | null): TileSize {
  if (raw === undefined || raw === null || raw.trim() === "")
    return DEFAULT_TILE_SIZE;
  const n = Number(raw);
  // A step index written by a rows surface reads as the width it stands for.
  if (isRowStep(n)) return STEP_SIZE[n];
  return (TILE_SIZES as readonly number[]).includes(n)
    ? (n as TileSize)
    : DEFAULT_TILE_SIZE;
}
