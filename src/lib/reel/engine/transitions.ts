// The @remotion/transitions presentations as PURE GEOMETRY, ported from the package's dist sources
// (presentations/{slide,wipe,flip,clock-wipe}.js; fade/cut stayed a plain alpha in styles/mood.ts).
// Each function maps (direction, eased progress) to what the DOM presentation renders, in canvas
// terms: layer translate offsets (slide), an entering clip polygon (wipe), a backface-culled axis
// scale (flip), a pie clip (clockWipe). Values are FRACTIONS of the frame so the draw scales them by
// the composition size; pins in transitions.test.ts sample the originals' switch arms.
//
// Compositing model these assume (styles/mood.ts): the EXITING layer draws first (under), the
// ENTERING layer on top, both fully opaque; a kind only clips/moves them. Two wipe facts worth a
// comment: the DOM version clip-paths BOTH layers, but the in/out polygons tile the frame exactly,
// so drawing the under layer UNclipped + clipping only the top yields identical pixels (the under
// pixels the DOM discards are exactly the ones the top paints over). And clockWipe only clips the
// ENTERING layer in the DOM too (exiting has clipPath undefined), so that one is verbatim.

import type { SlideDir } from "./reel-types";

/**
 * slide.js: the entering slide pushes the exiting one out in `dir`. Returns each layer's offset as
 * a FRACTION of the frame (x of width, y of height). The DOM version overlaps the two by an epsilon
 * (0.01% while in flight) so no background seam shows between their edges; replicated here (the
 * canvas edges antialias the same way) and dropped at progress 1 exactly like the source.
 */
export function slideOffsets(
  dir: SlideDir,
  progress: number,
): { enter: { x: number; y: number }; exit: { x: number; y: number } } {
  const p = progress;
  // presentationProgressWithEpsilonCorrection, in fraction terms (0.01% = 0.0001).
  const pe = p === 1 ? p : p - 0.0001;
  switch (dir) {
    case "from-left":
      return { enter: { x: -1 + p, y: 0 }, exit: { x: pe, y: 0 } };
    case "from-right":
      return { enter: { x: 1 - pe, y: 0 }, exit: { x: -p, y: 0 } };
    case "from-top":
      return { enter: { x: 0, y: -1 + p }, exit: { x: 0, y: pe } };
    case "from-bottom":
      return { enter: { x: 0, y: 1 - pe }, exit: { x: 0, y: -p } };
  }
}

/**
 * wipe.js makePolygonIn: the clip polygon of the ENTERING layer, as [x, y] FRACTION vertices.
 * The moods only sample the cardinal dirs (themes.ts), which are 4-vertex rects; ported verbatim.
 */
export function wipeEnterPolygon(
  dir: SlideDir,
  progress: number,
): [number, number][] {
  const p = progress;
  switch (dir) {
    case "from-left":
      return [
        [0, 0],
        [p, 0],
        [p, 1],
        [0, 1],
      ];
    case "from-top":
      return [
        [0, 0],
        [1, 0],
        [1, p],
        [0, p],
      ];
    case "from-right":
      return [
        [1, 0],
        [1, 1],
        [1 - p, 1],
        [1 - p, 0],
      ];
    case "from-bottom":
      return [
        [0, 1],
        [1, 1],
        [1, 1 - p],
        [0, 1 - p],
      ];
  }
}

/**
 * flip.js: the exiting layer rotates 0 -> +-180deg while the entering one rotates from the opposite
 * half toward 0, both with backface-visibility hidden, so each layer is VISIBLE only while its
 * rotation is within +-90deg (exiting: the first half, entering: the second). Canvas 2D has no
 * perspective matrix, so the rotation renders as the affine axis scale cos(rotation) about the
 * frame center (a CONSCIOUS DELTA: no foreshortening trapezoid; at the moods' transition speeds the
 * flip reads identically, and no mood theme samples flip today).
 */
export function flipScale(
  dir: SlideDir,
  progress: number,
  layer: "enter" | "exit",
): { axis: "x" | "y"; scale: number; visible: boolean } {
  const startEntering = dir === "from-right" || dir === "from-top" ? 180 : -180;
  const rotation =
    layer === "enter"
      ? startEntering * (1 - progress) // interpolate(p, [0,1], [start, 0])
      : -startEntering * progress; // interpolate(p, [0,1], [0, -start])
  const axis = dir === "from-top" || dir === "from-bottom" ? "y" : "x";
  const scale = Math.cos((rotation * Math.PI) / 180);
  // > 1e-6, not > 0: cos(90deg) is ~6e-17 in floats, and an edge-on layer must cull (backface).
  return { axis, scale, visible: scale > 1e-6 };
}

/**
 * clock-wipe.js: the entering layer is clipped to a pie that sweeps clockwise from 12 o'clock,
 * radius = half the frame diagonal (makePie at finishedRadius, translated to the frame center).
 * Appends the pie to ctx's current path; the caller clips.
 */
export function clockWipePath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
): void {
  const r = Math.sqrt(w * w + h * h) / 2;
  const cx = w / 2;
  const cy = h / 2;
  const start = -Math.PI / 2;
  if (progress <= 0) return; // empty pie: nothing visible
  if (progress >= 1) {
    ctx.rect(0, 0, w, h); // the full frame (the finished pie covers it)
    return;
  }
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r);
  ctx.arc(cx, cy, r, start, start + progress * Math.PI * 2, false);
  ctx.closePath();
}
