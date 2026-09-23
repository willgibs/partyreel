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

export function resolveTileSize(raw: string | undefined | null): TileSize {
  const n = Number(raw);
  return (TILE_SIZES as readonly number[]).includes(n)
    ? (n as TileSize)
    : DEFAULT_TILE_SIZE;
}
