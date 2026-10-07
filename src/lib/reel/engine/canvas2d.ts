// Canvas-2D draw primitives for the reel engine (DOM, no React). Each primitive replicates ONE CSS
// behavior the Remotion composition leans on, so the style modules compose them the way the JSX
// composed divs. Sources of truth are cited per primitive; the parity harness (/design/lab/tools/reel-parity)
// is where the replication is graded.
//
// The downsample-chain blur (buildWash) is the load-bearing trick from the proven spike
// (design/reel-spike): repeated half-size draws approximate a heavy gaussian with NO ctx.filter
// dependency (Safari has no ctx.filter) and near-zero per-frame cost, because the blur is built ONCE
// per clip at asset load and per-frame work is just a scaled draw.

import {
  RING_DISC,
  RING_MONO,
  RING_SQUIRCLE,
  RING_TILE,
  ringArt,
} from "@/lib/brand/ring";

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
 * A blur built by repeated downsampling: drawing the tiny result scaled up IS the blur (no ctx.filter
 * dependency, near-zero per-frame cost). Calibration from the proven spike: a chain to ~1/16 size
 * reads as the composition's blur(46px), so effective radius ~ 2.9px per unit of upscale.
 */
export function buildDownsampleBlur(
  src: CanvasImage,
  factors: readonly number[],
): HTMLCanvasElement {
  const { w: sw, h: sh } = sourceSize(src);
  let from: CanvasImage = src;
  let w = Math.max(2, sw);
  let h = Math.max(2, sh);
  let out: HTMLCanvasElement | null = null;
  for (const factor of factors) {
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

/** The ~1/16 chain = the 46px-class backdrop wash (clip-media's blur(46px) negative space). */
export const WASH_FACTORS = [0.5, 0.5, 0.25] as const;

/**
 * Built ONCE per clip at asset load (assets.ts); per-frame work is just a scaled draw.
 *
 * With a frame given, the wash is normalized to FRAME space: the source is cover-rastered toward
 * the frame first and the chain lands at ~frame/16, so the effective blur stays the composition's
 * FIXED blur(46px) class for ANY media resolution. The DOM blur is frame-space; the source-relative
 * chain read ~3x too sharp on a 12MP photo and ~3x too soft on the small lab fixtures (the
 * treatments parity-verify catch, 2026-07-08). Without a frame: the legacy source-relative chain
 * (the spike calibration; kept for callers with no frame context).
 */
export function buildWash(
  src: CanvasImage,
  frame?: { width: number; height: number },
): HTMLCanvasElement {
  if (!frame) return buildDownsampleBlur(src, WASH_FACTORS);
  // Cover-crop into a frame-aspect working canvas at frame/4 (one bounded resample step), then
  // halve twice to frame/16; multi-step keeps the resample smooth (one giant step blocks up).
  const w4 = Math.max(2, Math.round(frame.width / 4));
  const h4 = Math.max(2, Math.round(frame.height / 4));
  const work = document.createElement("canvas");
  work.width = w4;
  work.height = h4;
  const wx = work.getContext("2d")!;
  wx.imageSmoothingEnabled = true;
  wx.imageSmoothingQuality = "high";
  const { w: sw, h: sh } = sourceSize(src);
  const r = coverRect(sw, sh, w4, h4);
  wx.drawImage(src, r.x, r.y, r.w, r.h);
  return buildDownsampleBlur(work, WASH_FRAME_CHAIN);
}

// Frame-normalized chain depth, calibrated VISUALLY against the DOM's blur(px(46)) in the parity
// harness (2026-07-08): frame/4 -> /32. The spike's "2.9px per unit upscale" constant does not
// transfer across chain shapes (fewer accumulated resamples read sharper at the same final size),
// so this is an empirical match, not derived.
const WASH_FRAME_CHAIN = [0.5, 0.5, 0.5] as const;

// ---------------------------------------------------------------------------
// Halation (clip-media.tsx's highlight-only bloom): a bright-pass of the clip
// (`${grade} brightness(0.5) contrast(2.4) saturate(1.15)`), blurred ~18px, screen-blended over the
// media at the signature's opacity. The bright-pass MUST run BEFORE the blur (contrast clipping does
// not commute with the convolution: blur-then-crush re-sharpens the bloom edges), so assets.ts bakes
// color + blur into one halo canvas per clip at load.

/** The remaining chain AFTER the half-size color pass: 0.5 * (0.5 * 0.64) ~ 1/6 = the 18px class. */
export const HALO_BLUR_FACTORS = [0.5, 0.64] as const;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The manual bright-pass for browsers without ctx.filter (Safari): CSS-spec math for
 * brightness(0.5) contrast(2.4) saturate(1.15), each filter's output clamped like CSS does. The
 * theme GRADE part of the chain is intentionally absent here, consistent with the per-frame media
 * grade being skipped on the same browsers (the halo must bloom from the same pixels the media
 * shows). Exported pure for the vitest pins.
 */
export function applyBrightPass(data: Uint8ClampedArray): void {
  const s = 1.15; // saturate()
  const rr = 0.213 + 0.787 * s;
  const rg = 0.715 - 0.715 * s;
  const rb = 0.072 - 0.072 * s;
  const gr = 0.213 - 0.213 * s;
  const gg = 0.715 + 0.285 * s;
  const gb = 0.072 - 0.072 * s;
  const br = 0.213 - 0.213 * s;
  const bg = 0.715 - 0.715 * s;
  const bb = 0.072 + 0.928 * s;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    // brightness(0.5) -> contrast(2.4) (clamped per filter, like the CSS pipeline)
    r = clamp01(clamp01(r * 0.5) * 2.4 - 0.7);
    g = clamp01(clamp01(g * 0.5) * 2.4 - 0.7);
    b = clamp01(clamp01(b * 0.5) * 2.4 - 0.7);
    // saturate(1.15)
    data[i] = clamp01(rr * r + rg * g + rb * b) * 255;
    data[i + 1] = clamp01(gr * r + gg * g + gb * b) * 255;
    data[i + 2] = clamp01(br * r + bg * g + bb * b) * 255;
  }
}

/**
 * Build a clip's halation halo: half-size color pass (ctx.filter with the full grade + bright-pass
 * chain where supported; the manual bright-pass otherwise), then the downsample chain for the blur.
 * Conscious delta vs the CSS blur(18px): the radius tracks SOURCE pixels, not composition pixels
 * (identical to the accepted wash behavior; guest media is near composition scale).
 */
export function buildHalo(
  src: CanvasImage,
  colorFilter: string,
  filterOk: boolean,
): HTMLCanvasElement {
  const { w: sw, h: sh } = sourceSize(src);
  const first = document.createElement("canvas");
  first.width = Math.max(2, Math.round(sw * 0.5));
  first.height = Math.max(2, Math.round(sh * 0.5));
  const cx = first.getContext("2d", { willReadFrequently: !filterOk })!;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  if (filterOk) {
    cx.filter = colorFilter;
    cx.drawImage(src, 0, 0, first.width, first.height);
  } else {
    cx.drawImage(src, 0, 0, first.width, first.height);
    const px = cx.getImageData(0, 0, first.width, first.height);
    applyBrightPass(px.data);
    cx.putImageData(px, 0, 0);
  }
  return buildDownsampleBlur(first, HALO_BLUR_FACTORS);
}

// ---------------------------------------------------------------------------
// Grain (effects.tsx): the EXACT same feTurbulence SVG the Remotion side tiles as a background-image,
// decoded once as an image asset (assets.ts) so the canvas tile is pixel-identical, then pattern-tiled
// at 180px / 0.07 alpha / overlay blend. Static across frames, like the DOM one.
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";

export const GRAIN_TILE_URI = `data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}`;

// Pattern cache keyed per context: createPattern allocated per frame is pure GC churn in the
// 30fps draw / flat-out encode loops (the contract's build-once rule). Keyed on ctx (not tile)
// because a pattern's cross-context portability is not guaranteed everywhere; each ctx draws
// every frame, so the per-ctx cache still hits 100% after the first frame.
const grainPatternCache = new WeakMap<
  CanvasRenderingContext2D,
  { tile: CanvasImage; pattern: CanvasPattern }
>();

export function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tile: CanvasImage,
): void {
  const cached = grainPatternCache.get(ctx);
  let pattern = cached && cached.tile === tile ? cached.pattern : null;
  if (!pattern) {
    pattern = ctx.createPattern(tile, "repeat");
    if (pattern) grainPatternCache.set(ctx, { tile, pattern });
  }
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
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
 * The three T1 watermark candidates (a dev-only select on /design/lab/tools/reel-parity flips
 * them; production always stamps DEFAULT_WATERMARK_VARIANT):
 * - "scrim": the ghost lockup over a whisper of radial corner darkening, so it stays
 *   legible even on blown-out white footage without any visible container shape.
 * - "ghost": lockup + shadow only, the most invisible treatment (TikTok-corner style).
 * - "badge": the icon itself, the Ring on its dark tile in its own colours, the strongest
 *   brand read.
 *
 * T2 grading (Will, 2026-07-08, on-device): scrim and ghost read indistinguishable
 * and BOTH beat badge; scrim stays the shipped default. Keep all three behind the
 * parity-page switch: the real mark has arrived (the Ring, brand-marks r1), so the set
 * is Will's to re-grade on a device whenever he looks again.
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

/**
 * THE MARK ON FOOTAGE: the Ring (brand-marks r1, `src/lib/brand/ring.ts`, the icon's one home),
 * drawn here from its own geometry so a reel's corner and a phone's home screen sign with the
 * same object, synchronously and per frame (no image to load, no taint).
 *
 * ★ ON FOOTAGE IT IS THE MONO RING (scrim, ghost): the puck and its ring in the lockup's
 * white, the gap between them the footage, in the tab's bold proportions so it holds at a
 * reel's 30 pixels (a third of that on a phone). One ink beside the words, never the colour
 * icon floating on a photograph: the icon's ember lives on its own dark tile, which is the
 * badge (below).
 */
function drawRingMono(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  ctx.save();
  ctx.beginPath();
  for (const k of [1, RING_MONO.inner, RING_MONO.disc]) {
    ctx.moveTo(cx + r * k, cy);
    ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
  }
  ctx.fillStyle = color;
  // Three concentric circles, even-odd: the ring, the gap the footage shows through, the puck.
  ctx.fill("evenodd");
  ctx.restore();
}

/**
 * THE ICON ON FOOTAGE (badge): the Ring on its dark tile in its own colours, every piece the
 * icon file's own (its tile's gradient in a home screen's corner, the glow at the key where
 * the canvas can blur, the band's wedges, the matte puck), drawn in the 1024 box under the
 * caller's transform.
 */
function paintRingIcon(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  size: number,
): void {
  const art = ringArt(size);
  const o = art.cut;
  const squircle = new Path2D(RING_SQUIRCLE);
  ctx.save();
  ctx.scale(size / 1024, size / 1024);
  const tile = ctx.createLinearGradient(0, 0, 0, 1024);
  tile.addColorStop(0, RING_TILE[0]);
  tile.addColorStop(1, RING_TILE[1]);
  ctx.fillStyle = tile;
  ctx.fill(squircle);
  ctx.clip(squircle);
  // The glow and the corona are the band's light blurred; a canvas without ctx.filter
  // (Safari) draws the ring and the puck alone, which is still the whole mark.
  const blurred = (wedges: typeof art.glow, blur: number, alpha: number) => {
    if (!wedges.length || !detectCtxFilter()) return;
    ctx.save();
    // ctx.filter blurs in the canvas's own pixels, under no transform: the box's units scaled down.
    ctx.filter = `blur(${(blur * size).toFixed(2)}px)`;
    for (const w of wedges) {
      ctx.fillStyle = w.fill;
      ctx.globalAlpha = alpha * (w.opacity ?? 1);
      ctx.fill(new Path2D(w.d));
    }
    ctx.restore();
  };
  blurred(art.corona, o.corona, o.coronaOp);
  blurred(art.glow, o.glowBlur, o.glow);
  for (const w of art.band) {
    ctx.fillStyle = w.fill;
    ctx.fill(new Path2D(w.d));
  }
  // The puck: the SVG's radial gradient in its own box (centre at 42% and 22%, radius 95%).
  const rD = art.rDisc;
  const box = 512 - rD;
  const puck = ctx.createRadialGradient(
    box + 0.42 * 2 * rD,
    box + 0.22 * 2 * rD,
    0,
    box + 0.42 * 2 * rD,
    box + 0.22 * 2 * rD,
    0.95 * 2 * rD,
  );
  puck.addColorStop(0, RING_DISC[0]);
  puck.addColorStop(0.7, RING_DISC[1]);
  ctx.fillStyle = puck;
  ctx.beginPath();
  ctx.arc(512, 512, rD, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * ★ PAINTED ONCE PER SIZE, STAMPED EVERY FRAME: the icon is a hundred wedges and two blurs,
 * which a reel would pay at every frame of an encode, so it is drawn once onto a canvas of its
 * own and stamped with `drawImage` (the caller's shadow then falls under its tile alone, as
 * an object set on the footage). Where no canvas of its own can be made, it paints in place.
 */
const RING_ICONS = new Map<number, HTMLCanvasElement | OffscreenCanvas>();

function drawRingIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  let icon = RING_ICONS.get(size);
  if (!icon) {
    const px = Math.max(1, Math.round(size));
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(px, px)
        : typeof document !== "undefined"
          ? Object.assign(document.createElement("canvas"), {
              width: px,
              height: px,
            })
          : null;
    const own = canvas?.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!canvas || !own) {
      ctx.save();
      ctx.translate(x, y);
      paintRingIcon(ctx, size);
      ctx.restore();
      return;
    }
    paintRingIcon(own, size);
    icon = canvas;
    RING_ICONS.set(size, icon);
  }
  ctx.drawImage(icon, x, y, size, size);
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

  // The badge is the icon at 38px (a home screen's tile beside 30px type); the mono Ring
  // is the type's own 30px.
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

  // The mark: the Ring. Ghost and scrim draw the mono Ring in the lockup's white (one ink on
  // footage, beside the words); badge draws the icon itself, the Ring on its tile.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 1;
  if (badge) {
    drawRingIcon(ctx, x, centerY - markSize / 2, markSize);
  } else {
    drawRingMono(
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
