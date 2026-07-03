// Canvas-2D draw primitives for the reel engine (DOM, no React). Each primitive replicates ONE CSS
// behavior the Remotion composition leans on, so the style modules compose them the way the JSX
// composed divs. Sources of truth are cited per primitive; the parity harness (/design/reel-parity)
// is where the replication is graded.
//
// The downsample-chain blur (buildWash) is the load-bearing trick from the proven spike
// (design/reel-spike): repeated half-size draws approximate a heavy gaussian with NO ctx.filter
// dependency (Safari has no ctx.filter) and near-zero per-frame cost, because the blur is built ONCE
// per clip at asset load and per-frame work is just a scaled draw.

export type CanvasImage = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

export type Rect = { x: number; y: number; w: number; h: number };

/** Intrinsic pixel size of any drawable source. */
export function sourceSize(src: CanvasImage): { w: number; h: number } {
  if (
    typeof HTMLImageElement !== "undefined" &&
    src instanceof HTMLImageElement
  ) {
    return { w: src.naturalWidth, h: src.naturalHeight };
  }
  return { w: src.width, h: src.height };
}

/** object-fit: cover placement of (sw x sh) into a (w x h) box at origin. */
export function coverRect(sw: number, sh: number, w: number, h: number): Rect {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh };
}

/** object-fit: contain placement of (sw x sh) into a (w x h) box at origin. */
export function containRect(
  sw: number,
  sh: number,
  w: number,
  h: number,
): Rect {
  const scale = Math.min(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh };
}

/** Draw a source cover-fit into a rect (the spike's drawCover). */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImage,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const { w: sw, h: sh } = sourceSize(src);
  if (sw <= 0 || sh <= 0) return;
  const r = coverRect(sw, sh, w, h);
  ctx.drawImage(src, x + r.x, y + r.y, r.w, r.h);
}

/**
 * The 46px-class blur, built by repeated downsampling (chain to ~1/16 size). Called ONCE per clip at
 * asset load (assets.ts); drawing the tiny result scaled up IS the blur. This is the production
 * replacement for the composition's `blur(46px)` backdrop washes.
 */
export function buildWash(src: CanvasImage): HTMLCanvasElement {
  const { w: sw, h: sh } = sourceSize(src);
  let from: CanvasImage = src;
  let w = Math.max(2, sw);
  let h = Math.max(2, sh);
  let out: HTMLCanvasElement | null = null;
  for (const factor of [0.5, 0.5, 0.25]) {
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(w * factor));
    c.height = Math.max(2, Math.round(h * factor));
    const cx = c.getContext("2d")!;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(from, 0, 0, c.width, c.height);
    from = c;
    out = c;
    w = c.width;
    h = c.height;
  }
  return out!;
}

let ctxFilterSupport: boolean | null = null;

/**
 * The probe core, split out pure so vitest can pin it (detectCtxFilter needs a real DOM).
 * ORDER MATTERS: the `"filter" in ctx` existence check MUST run BEFORE the assignment probe.
 * On a browser with no filter IDL attribute (the Safari case this exists for), assigning
 * `ctx.filter = "blur(2px)"` just creates a JS expando on the extensible context object, and the
 * readback returns "blur(2px)" verbatim, so an assign-then-readback probe alone returns true
 * exactly where it must return false. The readback check is still kept for an attribute that
 * exists but rejects/normalizes the value.
 */
export function probeCtxFilter(ctx: { filter?: string }): boolean {
  if (!("filter" in ctx)) return false;
  ctx.filter = "blur(2px)";
  return ctx.filter !== "none";
}

/** Whether ctx.filter (CSS filter strings on canvas) works here. Safari: no; the grade is skipped
 *  and reported there rather than crashing (a WebGL grade path is a later slice). */
export function detectCtxFilter(): boolean {
  if (ctxFilterSupport !== null) return ctxFilterSupport;
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctxFilterSupport = ctx !== null && probeCtxFilter(ctx);
  return ctxFilterSupport;
}

/**
 * effects.tsx "vignette": radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.46) 100%).
 * CSS sizes the ellipse to the farthest corner (radii w/sqrt2 x h/sqrt2); canvas gradients are
 * circular, so draw in a y-scaled space.
 */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const radius = (w / 2) * Math.SQRT2;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(0.5, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.46)");
  ctx.fillStyle = g;
  const sy = w / h;
  ctx.fillRect(-w / 2, (-h / 2) * sy, w, h * sy);
  ctx.restore();
}

/**
 * effects.tsx "letterbox": LANDSCAPE ONLY (portrait bars would clip the frame; the portrait Cinematic
 * feel comes from grade + freeze-go + vignette instead). Bars animate 0 -> 13% height over the first
 * 10 frames of the reel (a ~2.40:1 crop).
 */
export function drawLetterbox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
): void {
  if (w <= h) return;
  const t = Math.min(1, Math.max(0, frame / 10));
  const barH = (h * (t * 13)) / 100;
  if (barH <= 0) return;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);
  ctx.restore();
}

// The free-tier wordmark, ported from style-render.tsx's <Watermark/> (the same rule applies: the
// DISPATCH layer stamps it so every style marks uniformly; see registry.ts). All values are the
// Remotion pill's, in composition px. Conscious delta: canvas text centers on the middle baseline
// instead of a DOM flex line box, so vertical placement can differ by ~1px from the DOM pill.
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.font = `600 34px ${FONT_STACK}`;
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = "0.3px";
  }
  const text = "partyreel.com";
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || 25;
  const descent = metrics.actualBoundingBoxDescent || 8;

  const logo = 16;
  const gap = 10;
  const padX = 22;
  const padY = 12;
  const contentH = Math.max(logo, ascent + descent);
  const pillW = padX * 2 + logo + gap + textW;
  const pillH = padY * 2 + contentH;
  const x = (w - pillW) / 2;
  const y = h - 104 - pillH;
  const cy = y + pillH / 2;

  // Pill: rgba(10,10,10,0.34) fill, 1px rgba(255,255,255,0.16) border, fully rounded.
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(10,10,10,0.34)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Logo mark: 16x16, radius 4, the reel violet, soft shadow.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;
  ctx.beginPath();
  ctx.roundRect(x + padX, cy - logo / 2, logo, logo, 4);
  ctx.fillStyle = "#8b5cf6";
  ctx.fill();
  ctx.restore();

  // Wordmark text with the pill's text shadow.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + padX + logo + gap, cy + (ascent - descent) / 2);
  ctx.restore();

  ctx.restore();
}
