// CARD DECK (styleId "carddeck"): a premium deck dealt on a table under a dealer's lamp — a
// hand-set stack holds the top card, then FLICKS it away (wind-up press -> accelerating whip toward
// a seeded corner, motion-blurred) while the card beneath SPRINGS forward into focus, the visible
// deck thickness (edge slivers) thinning as the reel deals through. Source of truth:
// ../../composition/treatments/card-deck.tsx — the deal timeline, rest poses, promotion spring and
// throw math mirror it 1:1 (carddeck.test.ts pins values sampled from the real remotion
// spring/interpolate/Easing). The deal cycle is BESPOKE, ported exactly rather than routed through
// timeline.ts.
//
// Port notes (beyond the scene2d.ts device-space-shadow delta):
// - Cards carry seeded tilts (a rotated CTM), so the grounded card shadow uses the body-fill
//   strategy (the card stock's own mid tone hides the overdraw).
// - The whip's whole-card motion blur rides scene2d's drawLayerFiltered: a real ctx.filter blur
//   where supported, the calibrated downsample chain on Safari. CSS also blurs the card's shadow
//   with it; both paths do too (the shadow paints inside the filtered layer).
// - CSS puts `filter: brightness()` on the card-stock div; like the framed port it is applied per
//   draw (linear map commutes with source-over), with the shadow pass left unfiltered
//   (brightness of a black shadow is a no-op). Safari reports + scoped-darkens dimmed cards.
// - The felt tooth (a repeating-radial dot field tiled at ~4px, 3% alpha overlay) is a rasterized
//   dot-tile pattern; subpixel ring speckle differs (the filmstrip grain-tooth precedent). The
//   table contact-shadow's extra blur(base*0.012) is dropped: the gradient already falls to zero
//   well inside its box, so the blur only softened an invisible edge.

import { FPS } from "../constants";
import type { ReelProps } from "../reel-types";
import { seeded, seededRange } from "../seed";
import type { ReelAssets } from "../assets";
import { drawCover } from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { cubicBezier, interp } from "../easing";
import {
  cssLinearGradient,
  drawLayerFiltered,
  fillEllipticalGradient,
  innerBorderRoundRect,
  insetShadowRoundRect,
  roundRectPath,
  shadowsRoundRect,
  type ShadowSpec,
  withLayerAlpha,
} from "../scene2d";
import { springValue } from "../spring";

const HOLD = 26; // frames a card rests as the top (~1.1s at 24fps)
const FLICK = 12; // frames of the throw + promotion (~0.5s)
const CYCLE = HOLD + FLICK;
const TAIL = 28; // the final card rests
const INTRO = 12; // the deck is placed on the table
const STACK = 3; // real cards drawn behind the top
const MAX_SLIVERS = 4; // implied extra depth (edge slivers) beneath the visible stack

// A wind-up release that ACCELERATES the card off the table.
const EASE_THROW = cubicBezier(0.42, 0, 0.86, 0.36);
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3; // Easing.out(Easing.cubic)

const SPRING = { damping: 15, stiffness: 210, mass: 0.7 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const clamp01 = (t: number) => clamp(t, 0, 1);
const r1 = (v: number) => Number(v.toFixed(1));
const r3 = (v: number) => v.toFixed(3);

export function cardDeckDuration(n: number): number {
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

export type DeckGeometry = {
  cardW: number;
  cardH: number;
  cardShort: number;
  radius: number;
  pad: number;
  step: number;
  cx: number;
  cy: number;
};

/** Uniform card geometry (a real deck IS uniform) — tall portrait / wide landscape from one core. */
export function deckGeometry(width: number, height: number): DeckGeometry {
  const landscape = width > height;
  const base = Math.min(width, height);
  const cardShort = base * 0.62;
  const cardLong = cardShort * 1.4;
  const cardW = landscape ? cardLong : cardShort;
  const cardH = landscape ? cardShort : cardLong;
  return {
    cardW,
    cardH,
    cardShort,
    radius: cardShort * 0.05,
    pad: cardShort * 0.035,
    step: base * 0.02,
    cx: width / 2 - cardW / 2,
    cy: height / 2 - cardH / 2,
  };
}

export type DeckTimeline = {
  c: number;
  local: number;
  inFlick: boolean;
  swipeFrame: number;
  introP: number;
  introY: number;
  wind: number;
  go: number;
  sp: number;
  throwDir: 1 | -1;
  throwUp: number;
};

export function deckTimeline(
  frame: number,
  n: number,
  base: number,
  seed: number,
): DeckTimeline {
  const rawC = Math.floor(frame / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = frame - c * CYCLE;
  const inFlick = !isLast && local >= HOLD;
  const swipeFrame = local - HOLD;

  const introP = interp(frame, [0, INTRO], [0, 1], easeOutCubic);
  const introY = (1 - introP) * -base * 0.05;

  // The wind-up (a brief press, consumed as the throw releases) + the accelerating throw.
  const windRaw = inFlick ? interp(swipeFrame, [0, 3], [0, 1]) : 0;
  const go = inFlick ? interp(swipeFrame, [1, FLICK], [0, 1], EASE_THROW) : 0;
  const wind = windRaw * (1 - go);
  // The cards behind PROMOTE with a spring so the new top arrives with a lively settle.
  const sp = inFlick ? springValue(swipeFrame, FPS, SPRING) : 0;

  return {
    c,
    local,
    inFlick,
    swipeFrame,
    introP,
    introY,
    wind,
    go,
    sp,
    throwDir: seeded(seed, c, 2) > 0.5 ? 1 : -1,
    throwUp: seededRange(seed, c, 6, -0.1, 0.28),
  };
}

export type Pose = {
  scale: number;
  tx: number;
  ty: number;
  rot: number;
  bright: number;
  op: number;
};

/** The resting transform at stack depth (0 = top): the seeded hand-set tilt + lateral jitter,
 *  sinking + dimming with depth. depth STACK+1 rests at op 0 (the incoming card). */
export function restPose(
  depth: number,
  tilt: number,
  jx: number,
  step: number,
): Pose {
  const d = Math.max(0, depth);
  return {
    scale: 1 - d * 0.045,
    tx: jx * (1 + d * 0.22),
    ty: d * step,
    rot: tilt * (1 + d * 0.16),
    bright: 1 - d * 0.075,
    op: d > STACK ? 0 : 1 - d * 0.05,
  };
}

export type CardState = Pose & {
  blur: number;
  /** 0 at rest -> 1 fully thrown (drives the shadow spread + gloss catch). */
  lift: number;
  glossAngle: number;
  glossA: number;
  z: number;
};

/** One card's full state at a frame (i = clip index, depth = i - tl.c). */
export function cardState(
  i: number,
  tl: DeckTimeline,
  geom: DeckGeometry,
  seed: number,
  width: number,
  height: number,
): CardState {
  const base = Math.min(width, height);
  const depth = i - tl.c;
  const tilt = seededRange(seed, i, 1, -4, 4);
  const jx = seededRange(seed, i, 3, -0.03, 0.03) * geom.cardShort;

  let pose: Pose;
  let blur = 0;
  let lift = 0;
  if (depth === 0 && tl.inFlick) {
    // The top card flies off toward a seeded corner, lifting toward the lamp, fading as it clears.
    const { go, wind, throwDir, throwUp } = tl;
    lift = go;
    const throwX = go * throwDir * (width * 0.5 + geom.cardW);
    const throwY = go * (-throwUp * height * 0.5) - go * base * 0.03;
    pose = {
      tx: jx + throwX,
      ty: wind * base * 0.02 + throwY,
      rot: tilt - throwDir * 5 * wind + go * throwDir * 22,
      scale: (1 - 0.03 * wind) * (1 + go * 0.08),
      bright: 1 + go * 0.06,
      op: interp(go, [0.5, 0.92], [1, 0]),
    };
    blur = base * 0.02 * Math.sin(clamp01(go) * Math.PI);
  } else if (depth === 0) {
    // The resting top card — brightens into focus over its first frames as the top.
    const p = restPose(0, tilt, jx, geom.step);
    pose = { ...p, bright: interp(tl.local, [0, 6], [0.94, 1]) };
  } else if (tl.inFlick) {
    // Behind cards promote depth -> depth-1 on the spring (the incoming deepest fades in from 0).
    const from = restPose(depth, tilt, jx, geom.step);
    const to = restPose(depth - 1, tilt, jx, geom.step);
    pose = {
      tx: lerp(from.tx, to.tx, tl.sp),
      ty: lerp(from.ty, to.ty, tl.sp),
      rot: lerp(from.rot, to.rot, tl.sp),
      scale: lerp(from.scale, to.scale, tl.sp),
      bright: lerp(from.bright, to.bright, tl.sp),
      op: lerp(from.op, to.op, tl.sp),
    };
  } else {
    pose = restPose(depth, tilt, jx, geom.step);
  }

  return {
    ...pose,
    blur,
    lift,
    glossAngle:
      122 + seededRange(seed, i, 25, -10, 10) + lift * tl.throwDir * 12,
    glossA: clamp(0.16 - depth * 0.03 + lift * 0.08, 0, 0.24),
    z: 100 - depth,
  };
}

/** The 2 OUTER layers of the grounded card shadow (the insets are drawn apart) — tight when
 *  resting, spreading + softening as the top card lifts to flick (same toFixed rounding). */
export function cardShadowLayers(
  step: number,
  base: number,
  lift: number,
): ShadowSpec[] {
  return [
    {
      dx: 0,
      dy: r1(step * 0.5 + base * 0.05 * lift),
      blur: r1(step * 0.9 + base * 0.09 * lift),
      color: `rgba(12,10,14,${r3(0.4 - 0.16 * lift)})`,
    },
    {
      dx: 0,
      dy: r1(base * 0.006),
      blur: r1(base * 0.014),
      color: "rgba(12,10,14,0.3)",
    },
  ];
}

export type SliverState = {
  effDepth: number;
  left: number;
  top: number;
  w: number;
  h: number;
  op: number;
  z: number;
};

/** Edge sliver k beneath the visible stack (they ride the promotion spring). */
export function sliverState(
  k: number,
  tl: DeckTimeline,
  geom: DeckGeometry,
  seed: number,
  width: number,
): SliverState {
  const effDepth = STACK + 1 + k - (tl.inFlick ? tl.sp : 0);
  const sScale = Math.max(0.7, 1 - effDepth * 0.045);
  const sw = geom.cardW * sScale;
  const sJx =
    seededRange(seed, tl.c + STACK + 1 + k, 3, -0.02, 0.02) * geom.cardShort;
  return {
    effDepth,
    left: width / 2 - sw / 2 + sJx,
    top: geom.cy + effDepth * geom.step,
    w: sw,
    h: geom.step * 1.7,
    op: clamp(0.9 - k * 0.16, 0.2, 0.9),
    z: 100 - Math.round(effDepth),
  };
}

/** How many edge slivers remain (the deck visibly THINS as the reel deals through it). */
export function sliverCount(n: number, c: number): number {
  return clamp(n - 1 - c - (STACK + 1), 0, MAX_SLIVERS);
}

const CARD_STOCK_MID = "#f3efe7"; // the body-fill tone under the stock gradient

// The felt tooth: CSS repeating-radial-gradient(circle at 50% 40%, white 0.5px, transparent 3px)
// tiled at ~4px. Rasterized once per tile size (2 sizes max) and pattern-filled.
const feltCache = new Map<number, HTMLCanvasElement | null>();
const feltPatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern>();

function feltTile(size: number): HTMLCanvasElement | null {
  const s = Math.max(2, Math.round(size));
  const cached = feltCache.get(s);
  if (cached !== undefined) return cached;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d");
  if (!g) {
    feltCache.set(s, null);
    return null;
  }
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.arc(s * 0.5, s * 0.4, 0.55, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.5)";
  g.lineWidth = 0.5;
  g.beginPath();
  g.arc(s * 0.5, s * 0.4, 3, 0, Math.PI * 2);
  g.stroke();
  feltCache.set(s, c);
  return c;
}

function drawCard(
  c: CanvasRenderingContext2D,
  st: CardState,
  geom: DeckGeometry,
  props: ReelProps,
  asset: ReelAssets["clips"][number],
  env: DrawEnv,
  base: number,
): void {
  const { cardW, cardH, radius, pad, cx, cy } = geom;

  // CSS: transform-origin "center 60%"; transform: translate rotate scale.
  const ox = cx + cardW / 2;
  const oy = cy + cardH * 0.6;
  c.translate(ox, oy);
  c.translate(st.tx, st.ty);
  c.rotate((st.rot * Math.PI) / 180);
  c.scale(st.scale, st.scale);
  c.translate(-ox, -oy);

  // The grounded shadow (rotated CTM -> body-fill; brightness leaves black shadows unchanged).
  shadowsRoundRect(
    c,
    cx,
    cy,
    cardW,
    cardH,
    radius,
    cardShadowLayers(geom.step, base, st.lift),
    CARD_STOCK_MID,
  );

  const bright = `brightness(${r3(st.bright)})`;
  if (env.filterOk) c.filter = bright;

  // The card stock + its lip/border insets (painted last-to-first, CSS order).
  roundRectPath(c, cx, cy, cardW, cardH, radius);
  c.fillStyle = cssLinearGradient(c, cx, cy, cardW, cardH, 158, [
    [0, "#faf8f3"],
    [0.58, "#f3efe7"],
    [1, "#ebe6db"],
  ]);
  c.fill();
  innerBorderRoundRect(
    c,
    cx,
    cy,
    cardW,
    cardH,
    radius,
    1,
    "rgba(20,16,24,0.16)",
  );
  insetShadowRoundRect(
    c,
    cx,
    cy,
    cardW,
    cardH,
    radius,
    0,
    1,
    0,
    "rgba(255,255,255,0.75)",
  );

  // The recessed photo well (fits onto the card stock, cover per Will's call for THIS style).
  const wx = cx + pad;
  const wy = cy + pad;
  const ww = cardW - 2 * pad;
  const wh = cardH - 2 * pad;
  const wr = radius * 0.62;
  roundRectPath(c, wx, wy, ww, wh, wr);
  c.fillStyle = "#efeae0";
  c.fill();
  insetShadowRoundRect(c, wx, wy, ww, wh, wr, 0, 2, 5, "rgba(30,22,10,0.16)");
  innerBorderRoundRect(c, wx, wy, ww, wh, wr, 1, "rgba(40,30,14,0.10)");

  c.save();
  roundRectPath(c, wx, wy, ww, wh, wr);
  c.clip();
  if (asset) {
    if (env.filterOk) {
      c.filter = `${props.theme.grade} ${bright}`;
    } else {
      env.report("grade skipped: ctx.filter is unsupported in this browser");
    }
    drawCover(c, asset.image, wx, wy, ww, wh);
    if (env.filterOk) c.filter = bright;
  }
  // The semi-gloss sheen catching the dealer's lamp, sweeping as the card flicks.
  c.globalCompositeOperation = "screen";
  c.fillStyle = cssLinearGradient(c, wx, wy, ww, wh, st.glossAngle, [
    [0, `rgba(255,255,255,${r3(st.glossA)})`],
    [0.26, "rgba(255,255,255,0.03)"],
    [0.48, "rgba(255,255,255,0)"],
  ]);
  c.fillRect(wx, wy, ww, wh);
  c.restore();

  // The Safari scoped-darken fallback (dimmed stack depths; the <=6% throw boost is skipped).
  if (!env.filterOk && st.bright < 0.999) {
    roundRectPath(c, cx, cy, cardW, cardH, radius);
    c.fillStyle = `rgba(0,0,0,${r3(1 - st.bright)})`;
    c.fill();
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  frame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const base = Math.min(W, H);
  const n = props.clips.length;
  const geom = deckGeometry(W, H);
  const tl = deckTimeline(frame, n, base, props.seed);

  ctx.clearRect(0, 0, W, H);

  // A premium card table: the warm dealer's-lamp pool over deep charcoal.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.34 * H,
    rx: 0.92 * W,
    ry: 0.7 * H,
    stops: [
      [0, "#2c2a31"],
      [0.52, "#1a1920"],
      [1, "#0e0d12"],
    ],
  });
  // Faint felt tooth on the table (see the port notes for the tile delta).
  const tile = feltTile(base * 0.004);
  if (tile) {
    let pattern = feltPatterns.get(ctx);
    if (!pattern) {
      const p = ctx.createPattern(tile, "repeat");
      if (p) {
        feltPatterns.set(ctx, p);
        pattern = p;
      }
    }
    if (pattern) {
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // The deck group (drops in on the intro).
  withLayerAlpha(ctx, env, tl.introP, (g) => {
    g.translate(0, tl.introY);

    // The stack's soft contact shadow grounding the whole deck.
    const shW = geom.cardW * 1.12;
    const shH = geom.cardH * 0.16;
    fillEllipticalGradient(g, W, H, {
      cx: W / 2,
      cy: geom.cy + geom.cardH * 0.9 + shH / 2,
      rx: shW / 2,
      ry: shH / 2,
      stops: [
        [0, "rgba(0,0,0,0.5)"],
        [0.7, "rgba(0,0,0,0)"],
      ],
    });

    // Slivers + cards painted in zIndex order (ties: DOM order, slivers before cards).
    type Item = { z: number; seq: number; paint: () => void };
    const items: Item[] = [];
    const count = sliverCount(n, tl.c);
    for (let k = 0; k < count; k++) {
      const sl = sliverState(k, tl, geom, props.seed, W);
      items.push({
        z: sl.z,
        seq: k,
        paint: () => {
          // Element opacity over shadow + body + lip -> one composited layer, like the cards.
          // Slot 3: this layer nests inside the intro group's slot-0 composite.
          withLayerAlpha(
            g,
            env,
            sl.op,
            (gc) => {
              const r = geom.radius * 0.5;
              shadowsRoundRect(gc, sl.left, sl.top, sl.w, sl.h, r, [
                { dx: 0, dy: 2, blur: 5, color: "rgba(12,10,14,0.28)" },
              ]);
              roundRectPath(gc, sl.left, sl.top, sl.w, sl.h, r);
              gc.fillStyle = cssLinearGradient(
                gc,
                sl.left,
                sl.top,
                sl.w,
                sl.h,
                180,
                [
                  [0, "#f4f0e7"],
                  [1, "#ddd7cb"],
                ],
              );
              gc.fill();
              insetShadowRoundRect(
                gc,
                sl.left,
                sl.top,
                sl.w,
                sl.h,
                r,
                0,
                1,
                0,
                "rgba(255,255,255,0.6)",
              );
            },
            3,
          );
        },
      });
    }
    const deepest = Math.min(tl.c + STACK + 1, n - 1);
    for (let i = deepest; i >= tl.c; i--) {
      const st = cardState(i, tl, geom, props.seed, W, H);
      const asset = assets.clips[i] ?? null;
      items.push({
        z: st.z,
        seq: 1000 + (deepest - i),
        paint: () => {
          // Slot 3: the per-card opacity layer nests inside the intro group's slot-0 composite.
          withLayerAlpha(
            g,
            env,
            st.op,
            (gc) => {
              if (st.blur > 0.25) {
                drawLayerFiltered(
                  gc,
                  env,
                  { blurPx: Number(st.blur.toFixed(2)) },
                  (fc) => drawCard(fc, st, geom, props, asset, env, base),
                );
              } else {
                drawCard(gc, st, geom, props, asset, env, base);
              }
            },
            3,
          );
        },
      });
    }
    items
      .sort((a, b) => a.z - b.z || a.seq - b.seq)
      .forEach((item) => item.paint());
  });

  // SIGNATURE — the warm dealer's lamp the cards' highlights + shadows agree with.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.3 * H,
    rx: 0.58 * W,
    ry: 0.44 * H,
    stops: [
      [0, "rgba(255,247,232,0.16)"],
      [0.42, "rgba(255,243,222,0.05)"],
      [0.66, "rgba(255,243,222,0)"],
    ],
    composite: "screen",
  });
  // A quiet vignette that seats the table into the dark.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.44 * H,
    rx: 0.92 * W,
    ry: 0.82 * H,
    stops: [
      [0.56, "rgba(0,0,0,0)"],
      [1, "rgba(0,0,0,0.42)"],
    ],
  });
}

export const CARDDECK: ReelStyle = {
  id: "carddeck",
  duration: (props) => cardDeckDuration(props.clips.length),
  // Fully procedural over the plain decoded clips.
  assetNeeds: () => ({ washes: false, grain: false, haloFilter: null }),
  draw,
};
