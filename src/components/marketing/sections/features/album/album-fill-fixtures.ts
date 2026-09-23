/**
 * THE FILLING ALBUM'S FIXTURES (the /features/album round, 2026-09-02).
 *
 * A table in LANDING ORDER. The first `seedCount` entries are the resting
 * album (the frame the server renders, oldest at the bottom of each column);
 * everything after lands one per beat, NEWEST AT THE TOP, exactly as the real
 * guest album prepends (src/components/guest/live-gallery.tsx). Columns are
 * EXPLICIT (never CSS `columns`, which balances column-major and would put a
 * new arrival somewhere other than the top) and heights are authored so each
 * column's seeds already overfill the frame's clip: an arrival then pushes
 * older tiles out of the bottom instead of growing the frame, and the page
 * never reflows.
 *
 * Deterministic on purpose (no Math.random): the server and the client must
 * agree on the first frame. `by` feeds the guest count only; the real album
 * shows a name in the lightbox, not on the tile, so no chip is drawn here.
 * Every `by` counts now: the identity reshape (2026-09-21) retired the
 * "Anonymous" display state along with the concept, since every upload
 * carries a name, verified or marked.
 */
export type AlbumFixture = {
  /** A marketing manifest id (marketingImage throws on a typo). */
  id: string;
  /** The column in the 3-column layout; a 2-column grid takes `col % 2`. */
  col: 0 | 1 | 2;
  /** Tile height at the hero's full width, in px (scaled by the grid). */
  h: number;
  /** The uploader's display name, for the "from N guests" line. */
  by: string;
  /** A video wears the product's small corner play badge. */
  kind?: "photo" | "video";
};

/** The hero's clip height at full scale; each column's seeds must overfill it. */
export const HERO_FRAME_H = 372;
export const HERO_SEED_COUNT = 6;

export const HERO_FIXTURES: readonly AlbumFixture[] = [
  // The resting album: two per column, summed past HERO_FRAME_H.
  { id: "wedding-golden", col: 0, h: 196, by: "Maya" },
  { id: "reception-table", col: 1, h: 206, by: "Jay" },
  { id: "party-balloons", col: 2, h: 182, by: "Priya" },
  { id: "reception-hall", col: 0, h: 186, by: "Sam" },
  { id: "party-dj", col: 1, h: 176, by: "Theo" },
  { id: "wedding-arch", col: 2, h: 200, by: "Maya" },
  // The arrivals, newest first as they land.
  { id: "wedding-toast", col: 1, h: 160, by: "Maya" },
  { id: "wedding-rings", col: 0, h: 152, by: "Jay" },
  { id: "concert-confetti", col: 2, h: 168, by: "Noor", kind: "video" },
  { id: "festival-crowd", col: 1, h: 150, by: "Priya" },
  { id: "wedding-petals", col: 0, h: 172, by: "Jay" },
  { id: "festival-lights", col: 2, h: 144, by: "Alex" },
];

/** The "everywhere" pair: a smaller resting set and a short loop of arrivals. */
export const EVERYWHERE_FRAME_H = 236;
export const EVERYWHERE_SEED_COUNT = 6;

export const EVERYWHERE_FIXTURES: readonly AlbumFixture[] = [
  { id: "wedding-golden", col: 0, h: 128, by: "Maya" },
  { id: "party-balloons", col: 1, h: 118, by: "Priya" },
  { id: "reception-table", col: 2, h: 132, by: "Jay" },
  { id: "wedding-rings", col: 0, h: 120, by: "Jay" },
  { id: "party-dj", col: 1, h: 130, by: "Sam" },
  { id: "wedding-toast", col: 2, h: 116, by: "Maya" },
  // The loop: one arrival per column, so every column moves in turn.
  { id: "festival-crowd", col: 0, h: 122, by: "Priya" },
  { id: "wedding-arch", col: 1, h: 112, by: "Noor" },
  { id: "concert-confetti", col: 2, h: 126, by: "Alex", kind: "video" },
];
