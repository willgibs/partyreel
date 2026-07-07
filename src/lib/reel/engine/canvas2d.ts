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

// ---------------------------------------------------------------------------
// The free-tier watermark. Redesigned per Will's T1 ruling: the old CENTERED PILL
// (violet chip, heavy container) "looks really bad" and is gone. The stamp is now a
// bottom-right lockup: the in-app logomark + "partyreel.com" in refined type, with a
// subtle shadow/scrim treatment instead of a container. The DISPATCH layer still
// stamps it (registry.ts) so every style marks uniformly and a treatment reel can
// never export unmarked. The teardown-bound Remotion side intentionally keeps the
// old pill, so the parity harness shows a DELIBERATE watermark delta from now on.
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * The three T1 watermark candidates (a dev-only select on /design/reel-parity flips
 * them; production always stamps DEFAULT_WATERMARK_VARIANT):
 * - "scrim": the ghost lockup over a whisper of radial corner darkening, so it stays
 *   legible even on blown-out white footage without any visible container shape.
 * - "ghost": lockup + shadow only, the most invisible treatment (TikTok-corner style).
 * - "badge": the in-app logo chip (logo.tsx's rounded square, in its on-footage
 *   white flavor) with an ink aperture, the strongest brand read.
 */
export const WATERMARK_VARIANTS = ["scrim", "ghost", "badge"] as const;
export type WatermarkVariant = (typeof WATERMARK_VARIANTS)[number];
export const DEFAULT_WATERMARK_VARIANT: WatermarkVariant = "scrim";

// DEV-ONLY seam: the parity page sets this so encode + both players pick up the
// selected candidate without threading a prop through player/encode/registry.
// Production code must never call this; the default above is the shipped design.
let watermarkVariantOverride: WatermarkVariant | null = null;
export function setWatermarkVariantOverride(v: WatermarkVariant | null): void {
  watermarkVariantOverride = v;
}

/** Safe margin from the right + bottom edges, in composition px. Both orientations
 *  share the 1080 short side (1080x1920 / 1920x1080), so one px value reads the same
 *  proportionally in both; 48px keeps the lockup clear of player chrome + TV overscan. */
export const WATERMARK_MARGIN = 48;

/**
 * Pure lockup layout (exported for the vitest line-box pins). Height comes from the
 * text LINE BOX, not ink extents: the ink-metrics version rendered the old pill ~10%
 * short of the signed-off DOM one (a parity-review catch, kept as the rule here even
 * though the container is gone, so the mark/text optical centering stays stable
 * across fonts). Ink metrics are used only to baseline-center the glyphs (see draw).
 */
export function watermarkLayout(args: {
  w: number;
  h: number;
  textW: number;
  lineAscent: number;
  lineDescent: number;
  markSize: number;
  gap: number;
}): { x: number; centerY: number; lockupW: number; lockupH: number } {
  const { w, h, textW, lineAscent, lineDescent, markSize, gap } = args;
  const lockupW = markSize + gap + textW;
  const lockupH = Math.max(markSize, lineAscent + lineDescent);
  return {
    x: w - WATERMARK_MARGIN - lockupW,
    centerY: h - WATERMARK_MARGIN - lockupH / 2,
    lockupW,
    lockupH,
  };
}

// lucide "Aperture" geometry, replicated from the icon's 24x24 path data so the
// canvas mark is pixel-faithful to the in-app logomark (src/components/shared/logo.tsx
// renders <Aperture/>): a circle r=10 at (12,12) plus six blade lines whose endpoints
// sit on that circle, stroke 2, round caps.
// >>> REAL-LOGO SEAM: Will supplies the final logo asset later. When it lands, replace
// drawApertureMark with a drawImage of the preloaded asset (load it alongside the clip
// assets in assets.ts) and keep watermarkLayout + the variant treatments unchanged. <<<
const APERTURE_LINES: [number, number, number, number][] = [
  [14.31, 8, 20.05, 17.94],
  [9.69, 8, 21.17, 8],
  [7.38, 12, 13.12, 2.06],
  [9.69, 16, 3.95, 6.06],
  [14.31, 16, 2.83, 16],
  [16.62, 12, 10.88, 21.94],
];

function drawApertureMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(12, 12, 10, 0, Math.PI * 2);
  ctx.stroke();
  for (const [x1, y1, x2, y2] of APERTURE_LINES) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  variant: WatermarkVariant = watermarkVariantOverride ??
    DEFAULT_WATERMARK_VARIANT,
): void {
  ctx.save();
  ctx.font = `600 30px ${FONT_STACK}`;
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = "0.2px";
  }
  const text = "partyreel.com";
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || 22;
  const descent = metrics.actualBoundingBoxDescent || 7;
  const lineAscent = metrics.fontBoundingBoxAscent || ascent + 4;
  const lineDescent = metrics.fontBoundingBoxDescent || descent + 4;

  // Badge sizes derive from logo.tsx's ratios (28px chip, 6px radius, 16px icon,
  // 8px gap) scaled to a 38px chip so the lockup stays balanced against 30px type.
  const badge = variant === "badge";
  const markSize = badge ? 38 : 30;
  const gap = badge ? 11 : 12;
  const { x, centerY, lockupW } = watermarkLayout({
    w,
    h,
    textW: metrics.width,
    lineAscent,
    lineDescent,
    markSize,
    gap,
  });

  if (variant === "scrim") {
    // The legibility floor: a soft radial ellipse behind the lockup, peaking at only
    // ~0.28 alpha, so it reads as natural corner falloff (not a shape) on any footage.
    ctx.save();
    ctx.translate(x + lockupW / 2, centerY);
    ctx.scale(1, 0.45);
    const r = lockupW * 0.85;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "rgba(0,0,0,0.28)");
    g.addColorStop(0.55, "rgba(0,0,0,0.15)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }

  // The logomark. Ghost/scrim draw the bare aperture glyph in white (the mono
  // identity: no color chip on footage); badge draws the app chip in its
  // on-footage white flavor with an ink glyph.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 1;
  if (badge) {
    ctx.beginPath();
    ctx.roundRect(x, centerY - markSize / 2, markSize, markSize, 8);
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0)";
    drawApertureMark(
      ctx,
      x + (markSize - 22) / 2,
      centerY - 11,
      22,
      "rgba(18,18,18,0.92)",
    );
  } else {
    drawApertureMark(
      ctx,
      x,
      centerY - markSize / 2,
      markSize,
      "rgba(255,255,255,0.92)",
    );
  }
  ctx.restore();

  // The wordmark. Ink metrics baseline-center the glyphs on the lockup's optical
  // middle (the line box only sizes the lockup, above).
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + markSize + gap, centerY + (ascent - descent) / 2);
  ctx.restore();

  ctx.restore();
}
