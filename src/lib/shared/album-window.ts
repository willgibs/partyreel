/**
 * THE ALBUM'S WINDOW, AS ARITHMETIC (the album-window lane): which rows of a
 * justified album to mount, how tall the spacers around them stand, and how far
 * to scroll so that nothing a reader is looking at moves when the rows above it
 * change. Pure: no DOM, no React, so every rule is a node test away.
 *
 * WHY A WINDOW. A 1,145-photograph album drew 16,000 DOM nodes, and every one of
 * them paid for every style recalculation (measured on the scale page). Rows are
 * the one layout where a window is exact: a row's height is known before it is
 * drawn (the engine's whole pixels), so its top is a prefix sum and the rows in
 * view are a binary search, with no measuring and no guessing.
 *
 * ★ ROWS, NEVER TILES, ARE THE UNIT. The window mounts whole rows, so a mounted
 * row always fills the box edge to edge and the flex line under it is exactly
 * the engine's; a spacer stands for everything above and below.
 */

/** Rows as the window reads them: their heights, and the ids they hold. */
export type WindowRow = {
  readonly height: number;
  readonly ids: readonly string[];
};

/**
 * THE PREFIX SUM: `tops[r]` is row r's top from the album's own top, and
 * `tops[n]` the album's height plus one trailing gap. One pass, whole pixels in,
 * whole pixels out.
 */
export function rowTops(
  rows: readonly { height: number }[],
  gap: number,
): Float64Array {
  const tops = new Float64Array(rows.length + 1);
  for (let r = 0; r < rows.length; r++)
    tops[r + 1] = tops[r] + rows[r].height + gap;
  return tops;
}

/** The album's height: the last row's bottom (0 for no rows). */
export function albumHeight(tops: Float64Array, gap: number): number {
  const n = tops.length - 1;
  return n > 0 ? tops[n] - gap : 0;
}

/** Row r's bottom edge. */
export function rowBottom(tops: Float64Array, r: number, gap: number): number {
  return tops[r + 1] - gap;
}

/**
 * THE ROW AT y: the last row whose top is at or above y, by binary search (the
 * first row for anything above the album, the last for anything below it). A y
 * in the gap under a row answers that row.
 */
export function rowAt(tops: Float64Array, y: number): number {
  const n = tops.length - 1;
  if (n <= 0) return 0;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tops[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The viewport, in the album's own coordinates: its top (negative above the album) and height. */
export type ViewBox = { readonly top: number; readonly height: number };

/**
 * HOW FAR PAST THE SCREEN THE WINDOW REACHES, in viewports: one behind (the way
 * back is a flick away, and a reader who just scrolled past a row may come back
 * to it) and two ahead (the way a reader is going, far enough that the next rows
 * are drawn and their photographs requested before they arrive).
 */
export const OVERSCAN = { behind: 1, ahead: 2 } as const;

/**
 * THE ROWS A VIEW MOUNTS: every row that meets the view grown by the overscan,
 * as an inclusive range, or null for an album with no rows.
 */
export function windowRange(
  tops: Float64Array,
  view: ViewBox,
  overscan: { behind: number; ahead: number } = OVERSCAN,
): [number, number] | null {
  if (tops.length - 1 <= 0) return null;
  const h = Math.max(1, view.height);
  return [
    rowAt(tops, view.top - overscan.behind * h),
    rowAt(tops, view.top + h * (1 + overscan.ahead)),
  ];
}

/**
 * THE MOUNTED RANGES: the window, plus any row that must stay mounted wherever
 * the reader scrolls (the keyboard's focused tile, so focus is never dropped on
 * the floor), sorted and merged. Two ranges that touch are one.
 */
export function mountedRanges(
  window: readonly [number, number] | null,
  pins: readonly number[] = [],
): [number, number][] {
  const all: [number, number][] = [];
  if (window) all.push([window[0], window[1]]);
  for (const r of pins) if (r >= 0) all.push([r, r]);
  all.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const r of all) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

/** Whether two sets of ranges mount exactly the same rows. */
export function sameRanges(
  a: readonly (readonly [number, number])[],
  b: readonly (readonly [number, number])[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++)
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  return true;
}

/**
 * THE SPACERS: what stands for the unmounted rows before the first range,
 * between each pair and after the last, each carrying the gaps on its own
 * edges, so a mounted row sits at exactly the top the prefix sum gives it.
 */
export function spacerHeights(
  tops: Float64Array,
  ranges: readonly (readonly [number, number])[],
  gap: number,
): { before: number; between: number[]; after: number } {
  const n = tops.length - 1;
  if (ranges.length === 0 || n <= 0)
    return { before: 0, between: [], after: albumHeight(tops, gap) };
  const between: number[] = [];
  for (let i = 0; i + 1 < ranges.length; i++)
    between.push(tops[ranges[i + 1][0]] - tops[ranges[i][1] + 1] + gap);
  const last = ranges[ranges.length - 1][1];
  return {
    before: tops[ranges[0][0]],
    between,
    after: tops[n] - tops[last + 1],
  };
}

/* ── Anchoring ──────────────────────────────────────────────────────────── */

/**
 * A POINT THE VIEW KEEPS STILL: the photograph `id`, at `fraction` of its
 * height, sitting `offset` px below the view's top. The first candidate that is
 * still in the album is the one kept (a hide can take the first away).
 */
export type AnchorPoint = {
  readonly id: string;
  readonly offset: number;
  readonly fraction: number;
};

/** Every id's row, for a layout; computed once per layout object. */
const ROW_OF = new WeakMap<object, Map<string, number>>();
export function rowIndex(rows: readonly WindowRow[]): Map<string, number> {
  let map = ROW_OF.get(rows);
  if (!map) {
    map = new Map();
    for (let r = 0; r < rows.length; r++)
      for (const id of rows[r].ids) map.set(id, r);
    ROW_OF.set(rows, map);
  }
  return map;
}

/**
 * THE TOP ANCHOR: the photographs of the first row showing at the view's top,
 * each at its row's top (then the next row's, as the fallback a hide can need).
 * `anchorable` skips what is not a photograph (the head's upload tiles come and
 * go by themselves and would drag the view with them).
 */
export function topAnchor(
  rows: readonly WindowRow[],
  tops: Float64Array,
  gap: number,
  viewTop: number,
  anchorable: (id: string) => boolean = () => true,
): AnchorPoint[] {
  if (rows.length === 0) return [];
  let r = rowAt(tops, viewTop);
  if (rowBottom(tops, r, gap) <= viewTop && r + 1 < rows.length) r++;
  const out: AnchorPoint[] = [];
  for (let q = r; q < Math.min(rows.length, r + 2); q++)
    for (const id of rows[q].ids)
      if (anchorable(id))
        out.push({ id, offset: tops[q] - viewTop, fraction: 0 });
  return out;
}

/**
 * WHERE THE VIEW MUST STAND for the first surviving anchor to sit where it sat,
 * in the new layout: a new view top, or null when no candidate survived.
 */
export function anchoredViewTop(
  anchors: readonly AnchorPoint[],
  rows: readonly WindowRow[],
  tops: Float64Array,
): number | null {
  const rowOf = rowIndex(rows);
  for (const a of anchors) {
    const r = rowOf.get(a.id);
    if (r === undefined) continue;
    return tops[r] + a.fraction * rows[r].height - a.offset;
  }
  return null;
}

/**
 * THE SCROLL THAT KEEPS AN ANCHOR STILL: how far the first anchor present in
 * both layouts moved, in the album's own px (null when none survived). It is a
 * difference of two positions in the album, never a position on screen, so a
 * view read a frame late cannot throw it off: the scroll is applied relative to
 * wherever the reader actually is.
 */
export function anchorShift(
  anchors: readonly AnchorPoint[],
  before: { rows: readonly WindowRow[]; tops: Float64Array },
  after: { rows: readonly WindowRow[]; tops: Float64Array },
): number | null {
  const was = rowIndex(before.rows);
  const now = rowIndex(after.rows);
  for (const a of anchors) {
    const r0 = was.get(a.id);
    const r1 = now.get(a.id);
    if (r0 === undefined || r1 === undefined) continue;
    return (
      after.tops[r1] +
      a.fraction * after.rows[r1].height -
      (before.tops[r0] + a.fraction * before.rows[r0].height)
    );
  }
  return null;
}

/**
 * HOW LONG A TOUCH SCROLL MUST BE STILL before the window may move it: a scroll
 * written during a flick's momentum stops the flick dead on iOS (and jolts it
 * elsewhere), so a change that needs one waits until the reader lets go.
 */
export const MOMENTUM_IDLE_MS = 150;

/** Whether a change that moves the view by `shift` px must wait for the scroll to settle. */
export function holdForMomentum({
  touch,
  shift,
  sinceScroll,
}: {
  touch: boolean;
  shift: number;
  sinceScroll: number;
}): boolean {
  return touch && Math.abs(shift) > 0.5 && sinceScroll < MOMENTUM_IDLE_MS;
}
