// LAYERED PARALLAX (styleId "parallax"): each photo becomes an immersive full-frame moment — a
// huge, soft, color-bleeding blurred copy of ITSELF washes the frame (the far plane) while the
// crisp photo floats in front (the near plane), the two drifting at opposed rates, and each swap a
// staggered depth-dissolve (the wash leads, the photo condenses out of its own blur). Source of
// truth: ../../composition/treatments/layered-parallax.tsx — the cycle timeline, the stagger
// windows and the slide drift math mirror it 1:1 (parallax.test.ts pins values sampled from the
// real remotion interpolate/Easing). The dissolve timeline is BESPOKE, ported exactly rather than
// routed through timeline.ts.
//
// Port notes:
// - THE LOAD-BEARING ONE: the far plane's blur(46px)-class pass is the pre-built WASH asset (the
//   buildWash downsample chain, built ONCE per clip at load) — per-frame work is a scaled draw of
//   a tiny canvas, NEVER a full-resolution blur. The grade/brightness/saturate color legs apply on
//   that draw via ctx.filter; color-after-blur ordering is the accepted mood blur-backdrop delta.
//   Safari (no ctx.filter) reports the grade skip + scoped-darkens the wash to keep the depth read.
// - The near plane's transform is pure translate+scale, so it is BAKED into the draw geometry
//   (rect, radius, shadow and condense-blur values scale by fgSc) — exact, and it keeps the big
//   floating shadow on the body-free offset trick.
// - The photo's condense/melt blur (<= the 9px class, transition windows only) is a real
//   ctx.filter blur where supported; the Safari fallback is drawLayerFiltered's calibrated
//   downsample chain around the clipped cover draw (clip-before-blur edge softness differs there,
//   a Safari-only conscious delta on a ~1s window).

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { seeded } from "../../composition/seed";
import type { ReelAssets } from "../assets";
import { drawCover } from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { cubicBezier, interp } from "../easing";
import {
  drawLayerFiltered,
  fillEllipticalGradient,
  innerBorderRoundRect,
  roundRectPath,
  shadowsRoundRect,
  withLayerAlpha,
} from "../scene2d";

const HOLD = 44; // frames a photo holds (~1.8s at 24fps)
const TRANS = 22; // the depth-dissolve swap (~0.9s)
const CYCLE = HOLD + TRANS;
const TAIL = 28;
const INTRO = 14; // the first photo condenses in rather than snapping on

const EASE = cubicBezier(0.4, 0, 0.2, 1); // a smooth cinematic dissolve

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function parallaxDuration(n: number): number {
  return Math.max(1, INTRO + (n - 1) * CYCLE + HOLD + TAIL);
}

export type SlidePhase = {
  /** The slide's life progress: drives the drift, continuous across the swap (raw, un-clamped). */
  u01: number;
  bgOp: number;
  fgOp: number;
  fgScale: number;
  fgBlur: number;
};

export type ParallaxTimeline = {
  c: number;
  local: number;
  inTrans: boolean;
  transFrac: number;
  cur: SlidePhase;
  /** The incoming slide during a swap (its wash LEADS; the photo condenses after). */
  incoming: SlidePhase | null;
};

export function parallaxTimeline(
  frame: number,
  n: number,
  main: number,
): ParallaxTimeline {
  const px = (v: number) => v * (main / 1920);
  const t = Math.max(0, frame - INTRO);
  const rawC = Math.floor(t / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = t - c * CYCLE;
  const inTrans = !isLast && local > HOLD;
  const transFrac = inTrans ? interp(local, [HOLD, CYCLE], [0, 1], EASE) : 0;

  const BLUR = px(9); // how far the photo blurs condensing out of / melting into its wash

  let cur: SlidePhase;
  if (inTrans) {
    // Melts back into its wash: the photo leaves first (fades + blurs up), the colour lingers.
    cur = {
      u01: (t - c * CYCLE) / CYCLE,
      fgOp: interp(transFrac, [0, 0.72], [1, 0]),
      bgOp: interp(transFrac, [0.3, 1], [1, 0]),
      fgScale: lerp(1, 1.05, transFrac),
      fgBlur: lerp(0, px(6), transFrac),
    };
  } else {
    // Holding — with the first photo condensing in over the intro.
    const intro = c === 0 ? interp(frame, [0, INTRO], [0, 1], EASE) : 1;
    cur = {
      u01: (t - c * CYCLE) / CYCLE,
      bgOp: intro,
      fgOp: intro,
      fgScale: lerp(0.985, 1, intro),
      fgBlur: lerp(BLUR, 0, intro),
    };
  }

  const incoming: SlidePhase | null = inTrans
    ? {
        u01: (t - (c + 1) * CYCLE) / CYCLE, // negative until its own cycle starts (raw)
        bgOp: interp(transFrac, [0, 0.62], [0, 1]),
        fgOp: interp(transFrac, [0.3, 1], [0, 1]),
        fgScale: lerp(0.95, 1, transFrac),
        fgBlur: lerp(BLUR, 0, transFrac),
      }
    : null;

  return { c, local, inTrans, transFrac, cur, incoming };
}

export type SlideLayout = {
  cardW: number;
  cardH: number;
  bgScale: number;
  bgX: number;
  bgY: number;
  fgSc: number;
  fgX: number;
  fgY: number;
  fgRadius: number;
};

/** One slide's drift geometry: the float sizes to the PHOTO's own aspect (never cropped); the
 *  wash pushes bigger one way, the float drifts smaller the other -> the parallax (verbatim). */
export function slideLayout(
  clip: Pick<ReelClip, "width" | "height">,
  i: number,
  u01: number,
  fgScale: number,
  seed: number,
  width: number,
  height: number,
): SlideLayout {
  const aspect = clip.width && clip.height ? clip.width / clip.height : 1;
  const boxW = width * 0.86;
  const boxH = height * 0.8;
  const wide = aspect > boxW / boxH;
  const cardW = wide ? boxW : boxH * aspect;
  const cardH = wide ? boxW / aspect : boxH;

  const dir = seeded(seed, i, 40) > 0.5 ? 1 : -1;
  const dirY = seeded(seed, i, 41) > 0.5 ? 1 : -1;
  const d = u01 - 0.5; // centered so the drift crosses zero mid-hold

  return {
    cardW,
    cardH,
    bgScale: lerp(1.16, 1.32, u01),
    bgX: dir * d * width * 0.07,
    bgY: dirY * d * height * 0.045,
    fgSc: lerp(1.0, 1.05, u01) * fgScale,
    fgX: -dir * d * width * 0.024,
    fgY: -dirY * d * height * 0.017,
    fgRadius: Math.min(cardW, cardH) * 0.045,
  };
}

// The wash is the room here (full-frame, undarkened), so the raw downsample chain's bilinear-block
// structure reads dirtier than the DOM's silky gaussian at this prominence (the mood blur-backdrop
// draws the same wash darkened behind a fitted photo, where it passed parity). ONE extra ~1px
// gaussian at WASH scale (a one-time, per-clip pass on the tiny cached canvas; a down-up resample
// cycle where ctx.filter is missing) removes the block structure below the wash-pixel period —
// per-frame work stays a single scaled draw, never a full-resolution blur.
const smoothedWashes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function smoothWash(
  wash: HTMLCanvasElement,
  filterOk: boolean,
): HTMLCanvasElement {
  const cached = smoothedWashes.get(wash);
  if (cached) return cached;
  const w = wash.width;
  const h = wash.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const g = out.getContext("2d");
  if (!g) return wash;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  if (filterOk) {
    g.filter = "blur(1.2px)";
    g.drawImage(wash, 0, 0);
  } else {
    const tmp = document.createElement("canvas");
    tmp.width = Math.max(2, Math.round(w / 2));
    tmp.height = Math.max(2, Math.round(h / 2));
    const tg = tmp.getContext("2d");
    if (!tg) return wash;
    tg.imageSmoothingEnabled = true;
    tg.imageSmoothingQuality = "high";
    tg.drawImage(wash, 0, 0, tmp.width, tmp.height);
    g.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, w, h);
  }
  smoothedWashes.set(wash, out);
  return out;
}

function drawSlide(
  ctx: CanvasRenderingContext2D,
  clip: ReelClip,
  asset: ReelAssets["clips"][number],
  i: number,
  phase: SlidePhase,
  props: ReelProps,
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const main = Math.max(W, H);
  const px = (v: number) => v * (main / 1920);

  // Posterless/failed media: a theme-colour hold at the slide's combined presence.
  if (!clip.url || !asset) {
    ctx.save();
    ctx.globalAlpha = Math.max(phase.bgOp, phase.fgOp);
    ctx.fillStyle = props.theme.background;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return;
  }

  const lay = slideLayout(clip, i, phase.u01, phase.fgScale, props.seed, W, H);

  // FAR plane — the blurred, colour-bleeding wash of the same photo (+ its framing overlays).
  withLayerAlpha(ctx, env, phase.bgOp, (c) => {
    if (asset.wash) {
      c.save();
      // CSS: cover Img + `translate(bgX,bgY) scale(bgScale)` about the frame center. The wash IS
      // the blur(46px) leg; only the colour legs run here (see the port notes).
      c.translate(W / 2 + lay.bgX, H / 2 + lay.bgY);
      c.scale(lay.bgScale, lay.bgScale);
      if (env.filterOk) {
        c.filter = `${props.theme.grade} brightness(0.68) saturate(1.34)`;
      }
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      drawCover(c, smoothWash(asset.wash, env.filterOk), -W / 2, -H / 2, W, H);
      c.restore();
      if (!env.filterOk) {
        env.report("grade skipped: ctx.filter is unsupported in this browser");
        c.fillStyle = "rgba(0,0,0,0.32)"; // the brightness(0.68) leg, scoped to the wash
        c.fillRect(0, 0, W, H);
      }
    } else {
      env.report('the parallax far plane needs washes: declare them in assetNeeds');
    }
    // A soft vignette so the float reads against its own wash (kept light, colour stays vivid).
    fillEllipticalGradient(c, W, H, {
      cx: 0.5 * W,
      cy: 0.48 * H,
      rx: 0.94 * W,
      ry: 0.86 * H,
      stops: [
        [0.44, "rgba(0,0,0,0)"],
        [1, "rgba(0,0,0,0.44)"],
      ],
    });
    // A soft key glow lifting the float off the wash.
    fillEllipticalGradient(c, W, H, {
      cx: 0.5 * W,
      cy: 0.46 * H,
      rx: 0.46 * W,
      ry: 0.38 * H,
      stops: [
        [0, "rgba(255,252,246,0.08)"],
        [0.7, "rgba(255,252,246,0)"],
      ],
      composite: "screen",
    });
  });

  // NEAR plane — the crisp photo floating in front (parallaxing slower than its wash). The
  // translate+scale transform is BAKED into the geometry (exact; see the port notes).
  withLayerAlpha(ctx, env, phase.fgOp, (c) => {
    const s = lay.fgSc;
    const w = lay.cardW * s;
    const h = lay.cardH * s;
    const x = W / 2 + lay.fgX - w / 2;
    const y = H / 2 + lay.fgY - h / 2;
    const r = lay.fgRadius * s;

    // The large, soft floating shadow seating the photo ABOVE its wash.
    shadowsRoundRect(c, x, y, w, h, r, [
      { dx: 0, dy: px(44) * s, blur: px(96) * s, color: "rgba(0,0,0,0.5)" },
      { dx: 0, dy: px(16) * s, blur: px(40) * s, color: "rgba(0,0,0,0.4)" },
      { dx: 0, dy: px(4) * s, blur: px(10) * s, color: "rgba(0,0,0,0.32)" },
    ]);
    // The hairline inset ring paints below the cover-fit photo, like the DOM (kept for parity).
    roundRectPath(c, x, y, w, h, r);
    c.fillStyle = "#000";
    c.fill();
    innerBorderRoundRect(c, x, y, w, h, r, 1, "rgba(255,255,255,0.07)");

    const blur = phase.fgBlur > 0.2 ? phase.fgBlur * s : 0;
    const paintPhoto = (pc: CanvasRenderingContext2D, filter: string | null) => {
      pc.save();
      roundRectPath(pc, x, y, w, h, r);
      pc.clip();
      if (filter !== null && env.filterOk) {
        pc.filter = filter;
      }
      drawCover(pc, asset.image, x, y, w, h);
      pc.restore();
    };

    if (!env.filterOk) {
      env.report("grade skipped: ctx.filter is unsupported in this browser");
      if (blur > 0) {
        // Safari: the condense blur through the calibrated downsample chain (slots 1 + 2).
        drawLayerFiltered(c, env, { blurPx: Number(blur.toFixed(2)) }, (fc) =>
          paintPhoto(fc, null),
        );
      } else {
        paintPhoto(c, null);
      }
    } else {
      const grade = props.theme.grade;
      paintPhoto(c, blur > 0 ? `${grade} blur(${blur.toFixed(2)}px)` : grade);
    }
  });
}

function draw(
  ctx: CanvasRenderingContext2D,
  frame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const n = props.clips.length;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = props.theme.background;
  ctx.fillRect(0, 0, W, H);
  if (n === 0) return;

  const tl = parallaxTimeline(frame, n, Math.max(W, H));

  drawSlide(
    ctx,
    props.clips[tl.c],
    assets.clips[tl.c] ?? null,
    tl.c,
    tl.cur,
    props,
    env,
  );
  // The incoming photo — its wash LEADS (the room re-colors), then the photo condenses out of it.
  if (tl.incoming && props.clips[tl.c + 1]) {
    drawSlide(
      ctx,
      props.clips[tl.c + 1],
      assets.clips[tl.c + 1] ?? null,
      tl.c + 1,
      tl.incoming,
      props,
      env,
    );
  }
}

export const PARALLAX: ReelStyle = {
  id: "parallax",
  duration: (props) => parallaxDuration(props.clips.length),
  // The far plane consumes the pre-blurred washes (built once at load; the whole point).
  assetNeeds: () => ({ washes: true, grain: false, haloFilter: null }),
  draw,
};
