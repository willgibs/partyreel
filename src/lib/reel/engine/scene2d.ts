// CSS-SCENE primitives for the treatment ports (DOM, no React): each helper replicates ONE CSS
// behavior the treatment JSX leaned on (linear/radial gradients, layered box-shadows, inset shadows,
// element opacity, a filtered layer composite), so the treatment styles compose them the way the
// components composed divs. The mood renderer predates this module and keeps its inline equivalents
// (parity-verified there; do not churn it) — new bespoke scenes should build from here.
//
// Conscious deltas shared by everything below (the cinematic.ts precedent, accepted for v1):
// - ctx.shadow* blur/offsets live in DEVICE space, so a shadow on a rotated/scaled print does not
//   rotate with it like CSS box-shadow does; at the treatments' small angles (±11deg) and near-1
//   scales the difference is subliminal.
// - CSS spread radii are emulated by inflating the shape (exact for the rounded rects used here).

import type { DrawEnv } from "./contract";

export type GradStop = readonly [offset: number, color: string];

export type ShadowSpec = {
  dx: number;
  dy: number;
  blur: number;
  color: string;
  /** CSS box-shadow spread: the shape is inflated by this much before the shadow pass. */
  spread?: number;
};

/** beginPath + roundRect in one call (r may be 0 for a plain rect). */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * A CanvasGradient replicating CSS linear-gradient(angle, ...) over the given box: 0deg points up,
 * angles run clockwise, and the gradient line is sized to the box the CSS way
 * (|w*sin| + |h*cos|, through the center).
 */
export function cssLinearGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angleDeg: number,
  stops: readonly GradStop[],
): CanvasGradient {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const g = ctx.createLinearGradient(
    cx - dx * half,
    cy - dy * half,
    cx + dx * half,
    cy + dy * half,
  );
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/**
 * Fill the whole (w x h) canvas with an ELLIPTICAL radial gradient (CSS radial-gradient with an
 * explicit rx/ry size at a center point). Canvas gradients are circular, so the fill runs in a
 * y-scaled space (the drawVignette trick, generalized). Percent sizes in the CSS source map to
 * rx = pW * w, ry = pH * h.
 */
export function fillEllipticalGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    stops: readonly GradStop[];
    composite?: GlobalCompositeOperation;
    alpha?: number;
  },
): void {
  const { cx, cy, rx, ry, stops } = opts;
  ctx.save();
  if (opts.composite) ctx.globalCompositeOperation = opts.composite;
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  const sy = rx / ry;
  ctx.fillRect(-cx, -cy * sy, w, h * sy);
  ctx.restore();
}

// Far enough that the helper shape never shows, small enough to stay in float precision.
const SHADOW_OFF = 100000;

/**
 * The OUTER layers of a CSS box-shadow stack on a rounded rect. Layers are painted last-to-first so
 * the first listed ends up on top, matching CSS.
 *
 * Two body strategies:
 * - bodyFill OMITTED (default, use whenever the CTM is unrotated): the shape draws out of view and
 *   only its shadow lands in frame (shadowOffset is CTM-independent) — body-free, exact, and safe
 *   for spread halos whose inflated shape must never itself show.
 * - bodyFill GIVEN (required under a ROTATED CTM, where the offset trick breaks: the path moves
 *   along the rotated axis but the shadow offset stays device-space): each pass fills the shape
 *   body too; pass the element's own base color so the anti-aliased edge blends toward it and the
 *   later real fill hides the overdraw.
 */
export function shadowsRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  layers: readonly ShadowSpec[],
  bodyFill?: string,
): void {
  ctx.save();
  ctx.fillStyle = bodyFill ?? "#000";
  const off = bodyFill === undefined ? SHADOW_OFF : 0;
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    const s = l.spread ?? 0;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = l.blur;
    ctx.shadowOffsetX = l.dx + off;
    ctx.shadowOffsetY = l.dy;
    roundRectPath(
      ctx,
      x - s - off,
      y - s,
      w + 2 * s,
      h + 2 * s,
      Math.max(0, r + s),
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * One INSET box-shadow layer on a rounded rect (the clipped-donut trick: a ring outside the shape,
 * clipped to the shape, so only its shadow lands inside). blur 0 + an offset gives the crisp
 * 1px-highlight kind of inset the treatments use for paper bevels.
 */
export function insetShadowRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  dx: number,
  dy: number,
  blur: number,
  color: string,
): void {
  const pad = blur + Math.abs(dx) + Math.abs(dy) + 8;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(x - pad, y - pad, w + 2 * pad, h + 2 * pad);
  ctx.roundRect(x, y, w, h, r);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
  ctx.fillStyle = "#000"; // the ring body is clipped out; only its shadow paints
  ctx.fill("evenodd");
  ctx.restore();
}

/** A crisp inner border (CSS `inset 0 0 0 Npx`): stroke at 2N clipped to the shape = N inside. */
export function innerBorderRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  width: number,
  color: string,
): void {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.lineWidth = width * 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

/**
 * CSS element opacity for a multi-draw element: at partial alpha the element paints onto the shared
 * scratch layer (slot 0) and composites as ONE image, so its own overlapping draws (shadow + card +
 * photo) don't double-blend (the mood renderer's drawClipLayer rule). NESTED alpha layers (a fading
 * element inside a fading group, e.g. the card deck's intro drop) must pass a distinct slot for the
 * inner layer or the outer composite gets clobbered mid-paint — slot 3 is reserved for that.
 */
export function withLayerAlpha(
  ctx: CanvasRenderingContext2D,
  env: DrawEnv,
  alpha: number,
  paint: (c: CanvasRenderingContext2D) => void,
  slot = 0,
): void {
  if (alpha <= 0) return;
  if (alpha >= 1) {
    ctx.save();
    paint(ctx);
    ctx.restore();
    return;
  }
  const scratch = env.scratch(slot);
  scratch.clearRect(0, 0, env.width, env.height);
  scratch.save();
  paint(scratch);
  scratch.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch.canvas, 0, 0);
  ctx.restore();
}

/**
 * A whole LAYER drawn through `filter: brightness() blur()` + `transform: scale()` (the film-strip
 * pull-down blur, the scattered-prints board recede). The layer paints to the content scratch
 * (slot 1); where ctx.filter works the composite applies the real CSS filter chain (exact parity);
 * the Safari fallback is the mood renderer's calibrated two-stage downsample chain for the blur
 * (slot 2, k ~ 1.8 * radius) plus an in-layer source-atop darken for brightness (the cinematic
 * brightness-fallback precedent, scoped to the layer's own pixels).
 */
export function drawLayerFiltered(
  ctx: CanvasRenderingContext2D,
  env: DrawEnv,
  opts: { blurPx?: number; brightness?: number; scale?: number },
  paint: (c: CanvasRenderingContext2D) => void,
): void {
  const { width: W, height: H } = env;
  const blur = opts.blurPx ?? 0;
  const brightness = opts.brightness ?? 1;
  const scale = opts.scale ?? 1;

  const content = env.scratch(1);
  content.clearRect(0, 0, W, H);
  content.save();
  paint(content);
  content.restore();

  if (brightness !== 1 && !env.filterOk) {
    content.save();
    content.globalCompositeOperation = "source-atop";
    content.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, 1 - brightness)).toFixed(3)})`;
    content.fillRect(0, 0, W, H);
    content.restore();
  }

  let src: HTMLCanvasElement = content.canvas;
  const srcX = 0; // downsample stages stack vertically, so only y moves
  let srcY = 0;
  let sw = W;
  let sh = H;
  if (blur > 0 && !env.filterOk) {
    const k = Math.max(1.15, blur * 1.8);
    const aux = env.scratch(2);
    aux.imageSmoothingEnabled = true;
    aux.imageSmoothingQuality = "high";
    sw = Math.max(2, Math.round(W / k));
    sh = Math.max(2, Math.round(H / k));
    if (k <= 2) {
      aux.clearRect(0, 0, Math.min(W, sw + 2), Math.min(H, sh + 2));
      aux.drawImage(content.canvas, 0, 0, W, H, 0, 0, sw, sh);
    } else {
      const hw = Math.round(W / 2);
      const hh = Math.round(H / 2);
      aux.clearRect(0, 0, Math.min(W, hw + 2), Math.min(H, hh + 2));
      aux.drawImage(content.canvas, 0, 0, W, H, 0, 0, hw, hh);
      srcY = hh + 2;
      aux.clearRect(0, srcY, Math.min(W, sw + 2), sh + 2);
      aux.drawImage(aux.canvas, 0, 0, hw, hh, srcX, srcY, sw, sh);
    }
    src = aux.canvas;
  }

  ctx.save();
  if (env.filterOk && (blur > 0 || brightness !== 1)) {
    const parts: string[] = [];
    if (brightness !== 1) parts.push(`brightness(${brightness.toFixed(3)})`);
    if (blur > 0) parts.push(`blur(${blur}px)`);
    ctx.filter = parts.join(" ");
  }
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, srcX, srcY, sw, sh, -W / 2, -H / 2, W, H);
  ctx.restore();
}
