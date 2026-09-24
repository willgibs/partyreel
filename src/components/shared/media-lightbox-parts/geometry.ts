/**
 * THE VIEWER'S GEOMETRY, PURE (media-viewer r1: `grow`, `peek`, `pinch`,
 * `down`). Every number the gestures and the flights move by is decided here,
 * from sizes the component measures, so the arithmetic is unit-tested in the
 * node project and the component only applies it. No DOM, no React.
 *
 * Coordinates are CSS px. A "slot" is one full stage-width cell of the swipe
 * track (the track keeps its three cells, so its transform and its pins are
 * exactly what they were); inside a slot the photograph sits at its FIT RECT,
 * and a neighbour stands off that place by its PEEK SHIFT.
 */

export type Size = { width: number; height: number };
export type Rect = { left: number; top: number; width: number; height: number };
export type Point = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/* ── the chrome's room ───────────────────────────────────────────────────── */

/**
 * The px the chrome occupies at each edge, the ONE source for both the media
 * box (what a photograph may fill) and the chrome's own offsets, so a
 * photograph at fit never sits under its credit or its capsule. Each is added
 * to the matching safe-area inset.
 *  - TOP: the face-led credit's row (0.625rem above, a two-line capsule, air).
 *  - BOTTOM: the floating action capsule (1rem above the edge, 40 px, air).
 *  - VIDEO: a video's transport (play, the scrubber, the time), stacked above
 *    the capsule.
 *  - FILMSTRIP: the desk's strip under the capsule, which lifts the capsule.
 */
export const CHROME = {
  top: 64,
  bottom: 68,
  capsuleGap: 16,
  video: 44,
  filmstrip: 54,
} as const;

/**
 * THE NEIGHBOURS' SLIVER, AND THE AIR BESIDE IT (`next=peek`: "a sliver of the
 * one before and the one after", 28 px at 375 and 96 px at 1440 in the brief).
 * Between the two it runs linearly, and past them it holds. The gap is the dark
 * between a sliver and the photograph: 8 px in a hand, 64 at a desk.
 */
export function peekMetrics(stageWidth: number): { peek: number; gap: number } {
  const t = clamp((stageWidth - 375) / (1440 - 375), 0, 1);
  return {
    peek: Math.round(28 + (96 - 28) * t),
    gap: Math.round(8 + (64 - 8) * t),
  };
}

/** The rect a photograph may fill inside a slot, in slot coordinates. */
export function mediaBox(
  stage: Size,
  insets: { top: number; bottom: number; side: number },
): Rect {
  return {
    left: insets.side,
    top: insets.top,
    width: Math.max(0, stage.width - 2 * insets.side),
    height: Math.max(0, stage.height - insets.top - insets.bottom),
  };
}

/**
 * A photograph's rect at FIT, centred in its box: contained, and never
 * enlarged past the file's own pixels (the shipped `max-w-full max-h-full`
 * rule, kept, so a small old upload is not blown up soft). Null when the size
 * is unknown (a pre-measure row before its file loads).
 */
export function fitRect(
  natural: Size | null | undefined,
  box: Rect,
): Rect | null {
  if (!natural || !(natural.width > 0) || !(natural.height > 0)) return null;
  if (!(box.width > 0) || !(box.height > 0)) return null;
  const s = Math.min(1, box.width / natural.width, box.height / natural.height);
  const width = natural.width * s;
  const height = natural.height * s;
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
  };
}

/* ── the peek ────────────────────────────────────────────────────────────── */

/**
 * How far one swipe carries the photograph under the finger: from centred to
 * the place where only `peek` px of its edge is left on screen. With the track
 * moving by exactly this, the photograph follows the finger ONE TO ONE and
 * arrives where it will rest as a neighbour, so the swap after a commit moves
 * nothing. Unknown width = the whole slot (today's swipe, no peek).
 */
export function strideFor(
  slotWidth: number,
  mediaWidth: number | null,
  peek: number,
): number {
  if (mediaWidth === null) return slotWidth;
  return Math.max(1, (slotWidth + mediaWidth) / 2 - peek);
}

/** The stand-off that puts `peek` px of a neighbour's own edge on screen at rest. */
export function restShift(
  slotWidth: number,
  mediaWidth: number | null,
  peek: number,
): number {
  if (mediaWidth === null) return 0;
  return peek + (slotWidth - mediaWidth) / 2;
}

/**
 * A slot's media offset from its centred place, for a track offset `offset`
 * (positive = dragged toward the previous one). The current photograph never
 * stands off (it follows the finger); a neighbour stands off by its rest shift
 * and, as the track carries it in, runs to exactly the place that centres it
 * when the track has moved one stride. Sign: +x is right.
 */
export function slotShift(
  slot: -1 | 0 | 1,
  offset: number,
  slotWidth: number,
  peek: number,
  widths: { prev: number | null; current: number | null; next: number | null },
): number {
  if (slot === 0) return 0;
  const stride = strideFor(slotWidth, widths.current, peek);
  const arrive = slotWidth - stride; // the stand-off that centres it at one stride
  if (slot === -1) {
    const rest = restShift(slotWidth, widths.prev, peek);
    const p = clamp(offset / stride, 0, 1);
    return rest + (arrive - rest) * p;
  }
  const rest = restShift(slotWidth, widths.next, peek);
  const p = clamp(-offset / stride, 0, 1);
  return 0 - (rest + (arrive - rest) * p) || 0; // never -0
}

/* ── the flights ─────────────────────────────────────────────────────────── */

export type Frame = { transform: string; clipPath: string };

/**
 * THE GROWING PHOTOGRAPH'S FIRST FRAME (and the dropping one's last). The
 * element is laid out at its fit rect `from`; this frame scales and moves it so
 * it COVERS `to` exactly the way the tile's object-cover crop did, and clips it
 * to that box with the tile's own corner. Played to the identity frame, the
 * crop lets go and the photograph grows into place: "out of a tile, the tile
 * expands to fill the screen; out of the reel, the frame lets go of its crop".
 */
export function coverFrame(from: Rect, to: Rect, radius: number): Frame {
  const s = Math.max(to.width / from.width, to.height / from.height);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const ix = Math.max(0, (from.width - to.width / s) / 2);
  const iy = Math.max(0, (from.height - to.height / s) / 2);
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${s})`,
    clipPath: `inset(${iy}px ${ix}px round ${radius / s}px)`,
  };
}

/**
 * The frame that holds an element laid out at `from` where it is SEEN now
 * (`seen`, its bounding rect with every transform applied): the drop starts
 * from wherever a drag, a pinch or a peek left the photograph, never from a
 * jump back to its resting place.
 */
export function seenFrame(from: Rect, seen: Rect, radius: number): Frame {
  const s = seen.width / from.width;
  const dx = seen.left + seen.width / 2 - (from.left + from.width / 2);
  const dy = seen.top + seen.height / 2 - (from.top + from.height / 2);
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${s})`,
    clipPath: `inset(0px 0px round ${radius / s}px)`,
  };
}

/** The resting frame, with the element's own corner. */
export function restFrame(radius: number): Frame {
  return {
    transform: "translate(0px, 0px) scale(1)",
    clipPath: `inset(0px 0px round ${radius}px)`,
  };
}

/** True when a rect is on screen at all (a tile scrolled away is not a destination). */
export function onScreen(rect: Rect, viewport: Size): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left + rect.width > 0 &&
    rect.top + rect.height > 0 &&
    rect.left < viewport.width &&
    rect.top < viewport.height
  );
}

/* ── the close-up ────────────────────────────────────────────────────────── */

/** `closeup=pinch`: "up to three times". */
export const ZOOM_MAX = 3;
/** How far a pinch may overshoot either end before it resists harder. */
export const ZOOM_UNDER = 0.6;
export const ZOOM_OVER = 3.6;

export type Zoom = { s: number; tx: number; ty: number };
export const ZOOM_REST: Zoom = { s: 1, tx: 0, ty: 0 };

/**
 * The scale and translation that keep the point that was under the pinch's
 * midpoint at its start under the midpoint now (and so pan with it). The
 * element scales about its own centre `center` (screen coordinates at rest).
 */
export function pinchZoom(
  start: Zoom & { mid: Point; dist: number },
  mid: Point,
  dist: number,
  center: Point,
): Zoom {
  const raw = start.s * (dist / Math.max(1, start.dist));
  const s = clamp(raw, ZOOM_UNDER, ZOOM_OVER);
  return zoomAbout(start, s, start.mid, mid, center);
}

/**
 * Zoom from `from` to scale `s`, keeping the content under `anchor` under
 * `to` (the same point for a double tap or a wheel; the moving midpoint for a
 * pinch).
 */
export function zoomAbout(
  from: Zoom,
  s: number,
  anchor: Point,
  to: Point,
  center: Point,
): Zoom {
  const k = s / from.s;
  return {
    s,
    tx: to.x - center.x - k * (anchor.x - center.x - from.tx),
    ty: to.y - center.y - k * (anchor.y - center.y - from.ty),
  };
}

type Range = { min: number; max: number };

/**
 * How far a photograph at scale `s` may be panned: on an axis where it is
 * larger than the stage its edges may not come inside the stage; on one where
 * it fits it stays on its fit centre.
 */
export function panBounds(
  fit: Rect,
  s: number,
  stage: Size,
): { x: Range; y: Range } {
  const cx = fit.left + fit.width / 2;
  const cy = fit.top + fit.height / 2;
  const w = fit.width * s;
  const h = fit.height * s;
  const axis = (c: number, size: number, room: number): Range =>
    size > room
      ? { min: room - (c + size / 2), max: -(c - size / 2) }
      : { min: 0, max: 0 };
  return { x: axis(cx, w, stage.width), y: axis(cy, h, stage.height) };
}

/** Diminishing returns past a limit: a pull that slows instead of a wall. */
export function resist(over: number, limit: number): number {
  if (limit <= 0) return 0;
  return limit * (1 - 1 / (Math.abs(over) / limit + 1)) * Math.sign(over);
}

/** A value held inside a range, with a rubber band beyond it while a finger is down. */
export function rubber(v: number, range: Range, limit: number): number {
  if (v < range.min) return range.min + resist(v - range.min, limit);
  if (v > range.max) return range.max + resist(v - range.max, limit);
  return v;
}

/**
 * Where a zoom SETTLES when the fingers lift: under fit it goes home ("letting
 * go under fit settles back"), past three it comes back to three around the
 * same point, and the pan is brought inside its bounds.
 */
export function settleZoom(
  z: Zoom,
  fit: Rect,
  stage: Size,
  anchor: Point,
): Zoom {
  if (z.s <= 1.001) return ZOOM_REST;
  let next = z;
  if (z.s > ZOOM_MAX) {
    const center = { x: fit.left + fit.width / 2, y: fit.top + fit.height / 2 };
    next = zoomAbout(z, ZOOM_MAX, anchor, anchor, center);
  }
  const b = panBounds(fit, next.s, stage);
  return {
    s: next.s,
    tx: clamp(next.tx, b.x.min, b.x.max),
    ty: clamp(next.ty, b.y.min, b.y.max),
  };
}

/* ── the way out ─────────────────────────────────────────────────────────── */

/**
 * `wayout=down`: how the photograph answers a finger pulling it down. It
 * follows, shrinking a little as it goes, and the ground behind it thins so the
 * album shows through; pulled UP it resists and nothing else changes.
 */
export function dismissPose(
  dy: number,
  stageHeight: number,
): {
  y: number;
  scale: number;
  ground: number;
} {
  const h = Math.max(1, stageHeight);
  if (dy <= 0) return { y: resist(dy, h * 0.08), scale: 1, ground: 1 };
  const p = clamp(dy / h, 0, 1);
  return { y: dy, scale: 1 - 0.25 * p, ground: 1 - Math.min(0.85, p * 1.6) };
}

/** Whether a released pull-down leaves: far enough, or a flick. */
export function dismissCommits(
  dy: number,
  velocity: number,
  stageHeight: number,
): boolean {
  if (dy <= 0) return false;
  return dy > stageHeight * 0.14 || (velocity > 0.35 && dy > 24);
}
