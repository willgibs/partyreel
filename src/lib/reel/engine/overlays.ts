// The mood SIGNATURE overlays, PORTED from effects.tsx (the source of truth for every constant;
// change that file and this one together or the parity harness shows the drift). Each is a CSS
// radial-gradient the composition screen-blends over the whole reel; canvas radial gradients are
// CIRCULAR, so every ellipse draws through one shared y-scaled-space primitive (the same trick
// drawVignette uses). Pure value functions are split out for the vitest pins; t is the whole-reel
// progress (frame / totalFrames), exactly useCurrentFrame()/durationInFrames on the DOM side.
//
// grain + vignette + letterbox stay in canvas2d.ts (they predate this module and other styles use
// them); this module is the bloom/lightsweep/softedge trio only. The remaining effects.tsx overlays
// (lightleak/flares/colorwash + the particle fields) belong to the treatment ports, not a mood.

/** effects.tsx "bloom": the breathing highlight-halation alpha. */
export function bloomAlpha(t: number): number {
  return 0.1 + 0.05 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
}

/** effects.tsx "lightsweep": the sweep center's x position in percent (-15% -> 115% over the reel). */
export function lightsweepX(t: number): number {
  return -15 + t * 130;
}

/**
 * One CSS radial-gradient ellipse, screen-blended: radial-gradient(rx ry at cx cy, stops...) where
 * rx is a fraction of the WIDTH and ry of the HEIGHT (the CSS two-value radius syntax). Stops are
 * [offset 0..1, rgba color] along the ray, like CSS color-stop percents.
 */
function fillRadialScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stops: readonly [number, string][],
): void {
  const rxPx = rx * w;
  const ryPx = ry * h;
  if (rxPx <= 0 || ryPx <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx * w, cy * h);
  ctx.scale(1, ryPx / rxPx); // draw the circle in y-scaled space -> the CSS ellipse
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rxPx);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  ctx.fillStyle = g;
  // Cover the whole frame in the scaled space (the gradient is transparent past its last stop).
  const sy = rxPx / ryPx;
  ctx.fillRect(-cx * w, -cy * h * sy, w, h * sy);
  ctx.restore();
}

/** effects.tsx "bloom" (Film, Sunset, Float): a soft warm halation at (50%, 40%) that breathes. */
export function drawBloom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
): void {
  const a = bloomAlpha(t);
  fillRadialScreen(ctx, w, h, 0.5, 0.4, 0.72, 0.56, [
    [0, `rgba(255,240,214,${a})`],
    [0.68, "rgba(255,240,214,0)"],
  ]);
}

/** effects.tsx "lightsweep" (Sunset): a slow warm light sweeping across the reel at y 32%. */
export function drawLightsweep(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
): void {
  fillRadialScreen(ctx, w, h, lightsweepX(t) / 100, 0.32, 0.42, 0.8, [
    [0, "rgba(255,214,156,0.2)"],
    [0.55, "rgba(255,214,156,0)"],
  ]);
}

/** effects.tsx "softedge" (Float): the dreamy soft-focus edge falloff (a foggy glow at the edges). */
export function drawSoftedge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  fillRadialScreen(ctx, w, h, 0.5, 0.48, 0.78, 0.72, [
    [0.52, "rgba(255,250,246,0)"],
    [1, "rgba(255,250,246,0.22)"],
  ]);
}
