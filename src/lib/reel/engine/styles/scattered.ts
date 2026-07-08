// SCATTERED PRINTS (styleId "scattered"): lab prints laid into a premium editorial flat-lay on a warm
// lightbox (a seeded golden-angle field, never a grid), then the HERO print (the last one, near
// center) rises off the pile toward the camera while the board dims + recedes. Source of truth:
// ../../composition/treatments/scattered-prints.tsx — placement, springs, the lift timeline and the
// lifting-paper shadow physics mirror it 1:1 (scattered.test.ts pins state values sampled from the
// real remotion spring/interpolate/Easing). The build/lift timeline is BESPOKE, ported exactly
// rather than routed through timeline.ts.
//
// Port notes (beyond the scene2d.ts device-space-shadow delta):
// - The board's rack-focus recede (brightness + blur + scale) rides scene2d's drawLayerFiltered:
//   exact CSS parity where ctx.filter works, the darken+downsample fallback on Safari.
// - The paper/linen tooth (two soft-light repeating stripe sets at ~2% alpha) is drawn once into a
//   cached full-size layer; stripe phase vs the CSS gradient origin differs (a conscious delta on a
//   barely-visible texture).

import { FPS } from "../../composition/constants";
import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { seeded, seededPick, seededRange } from "../../composition/seed";
import type { ReelAssets } from "../assets";
import { drawCover } from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { EASE, interp } from "../easing";
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

const SETTLE = 26;
const HERO_BEAT = 10;
const LIFT = 40;
const OUTRO = 40;

const SPRING = { damping: 17, stiffness: 140, mass: 0.8 };
const MOUNTS = ["#f7f2e9", "#f3ede2", "#efe9dd", "#fcfbf8"] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const r2 = (v: number) => v.toFixed(2); // the source's toFixed(2) shadow rounding
const r3 = (v: number) => v.toFixed(3);

/** Frames between print landings — eased down as the pile grows (verbatim dropInterval). */
export function dropInterval(n: number): number {
  return Math.round(lerp(18, 12, clamp01((n - 6) / 8)));
}

export function scatteredDuration(n: number): number {
  return Math.max(1, (n - 1) * dropInterval(n) + SETTLE + HERO_BEAT + LIFT + OUTRO);
}

type Spot = { cx: number; cy: number; rot: number };

// Seeded golden-angle (phyllotaxis) placement; the hero is reserved a near-center, near-level slot;
// small counts get bespoke layouts (verbatim place()).
export function place(i: number, n: number, seed: number, landscape: boolean): Spot {
  const isHero = i === n - 1;
  if (n === 1) return { cx: 0.5, cy: 0.46, rot: seededRange(seed, 0, 1, -3, 3) };
  if (n === 2) {
    return i === 0
      ? { cx: 0.4, cy: 0.56, rot: 5 }
      : { cx: 0.58, cy: 0.42, rot: -3 };
  }
  if (isHero) return { cx: 0.5, cy: 0.46, rot: seededRange(seed, i, 1, -3, 3) };

  const aspectX = landscape ? 1.3 : 1.0;
  const aspectY = landscape ? 1.0 : 1.06;
  const angle = i * 2.39996 + seededRange(seed, i, 20, -0.5, 0.5);
  const rNorm = 0.1 + 0.4 * Math.sqrt(i / n);
  const r = rNorm * seededRange(seed, i, 22, 0.86, 1.14);
  const cx = clamp(
    0.5 + r * Math.cos(angle) * aspectX + seededRange(seed, i, 11, -0.045, 0.045),
    0.1,
    0.9,
  );
  const cy = clamp(
    0.5 + r * Math.sin(angle) * aspectY + seededRange(seed, i, 12, -0.045, 0.045),
    0.1,
    0.9,
  );
  return { cx, cy, rot: seededRange(seed, i, 1, -11, 11) };
}

export type ScatteredTimeline = {
  di: number;
  buildEnd: number;
  lift: number;
  heroFloat: number;
  heroPress: number;
  boardDim: number;
  boardScale: number;
  boardBlur: number;
};

/** The reel-level lift timeline (pure; pinned against the Remotion component's math). */
export function scatteredTimeline(frame: number, n: number, base: number): ScatteredTimeline {
  const di = dropInterval(n);
  const buildEnd = (n - 1) * di + SETTLE;
  const lift = interp(frame, [buildEnd + HERO_BEAT, buildEnd + HERO_BEAT + LIFT], [0, 1], EASE);
  // A whisper of life on the held hero — eased in from zero amplitude AND phase after the lift.
  const liftEnd = buildEnd + HERO_BEAT + LIFT;
  const floatAmp = interp(frame, [liftEnd + 4, liftEnd + 20], [0, base * 0.003]);
  const heroFloat = Math.sin((frame - liftEnd) * 0.08) * floatAmp;
  // The hero winds up (a brief press) over the beat just before it releases into the lift.
  const antP = interp(frame, [buildEnd, buildEnd + HERO_BEAT], [0, 1]);
  const heroPress = antP * (1 - lift);
  // The board dims + recedes + softens as the hero rises (rack-focus depth cue).
  const boardDim = lerp(1, 0.92, lift);
  const boardScale = lerp(1, 0.985, lift);
  const boardBlur = lift * base * 0.0026;
  return { di, buildEnd, lift, heroFloat, heroPress, boardDim, boardScale, boardBlur };
}

export type ScatteredPrintState = {
  p: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  rot: number;
  sc: number;
  op: number;
  squash: number;
  mountW: number;
  mountH: number;
  photoW: number;
  photoH: number;
  side: number;
  bottom: number;
};

/** One print's full state at a frame (null before its drop). lift/anticip are 0 for board prints. */
export function scatteredPrintState(
  frame: number,
  i: number,
  clip: Pick<ReelClip, "width" | "height">,
  n: number,
  seed: number,
  width: number,
  height: number,
  lift: number,
  anticip: number,
): ScatteredPrintState | null {
  const landscape = width > height;
  const base = Math.min(width, height);
  const di = dropInterval(n);
  const isHero = i === n - 1;
  const buildStart = i * di;
  if (frame < buildStart) return null;
  const p = springValue(frame - buildStart, FPS, SPRING);

  const spot = place(i, n, seed, landscape);
  const sizeMax = lerp(0.4, 0.32, clamp01((n - 6) / 8));
  const sizeFrac = isHero ? sizeMax + 0.04 : seededRange(seed, i, 5, 0.21, sizeMax);
  const printShort = base * sizeFrac;

  const aspect =
    clip.width && clip.height
      ? clamp(clip.width / clip.height, 0.72, 1.4)
      : seededPick(seed, i, 23, [4 / 5, 1, 5 / 4]);
  const wide = aspect >= 1;
  const photoW = wide ? printShort * aspect : printShort;
  const photoH = wide ? printShort : printShort / aspect;
  const side = printShort * 0.052;
  const bottom = printShort * 0.09;
  const mountW = photoW + side * 2;
  const mountH = photoH + side + bottom;

  // Entry: a controlled toss — fall from just above (or a short edge slide), overshoot, settle.
  const slide = seeded(seed, i, 7) > 0.7 && !isHero;
  const dir = seeded(seed, i, 8) > 0.5 ? 1 : -1;
  const fromRot = spot.rot + (seeded(seed, i, 4) > 0.5 ? 12 : -12);
  const fromX = slide ? dir * base * 0.1 : 0;
  const fromY = slide ? -base * 0.12 : -base * 0.42;
  const txEntry = lerp(fromX, 0, p); // raw lerp: the spring overshoot IS the bounce
  const tyEntry = lerp(fromY, 0, p);
  const scEntry = lerp(1.1, 1, p);
  const rotEntry = lerp(fromRot, spot.rot, p);
  const op = interp(p, [0, 0.18], [0, 1]);

  // A tactile landing squash — the weight of paper hitting the surface.
  const land = Math.max(0, 1 - Math.abs(p - 0.86) / 0.08);
  const squash = 1 - land * 0.016;

  // Hero lift stacks on the settled entry: wind-up press, then rise + grow + straighten + center.
  const heroScale = landscape ? 1.14 : 1.18;
  const tx = txEntry + (0.5 * width - spot.cx * width) * 0.4 * lift;
  const ty = tyEntry - base * 0.05 * lift + base * 0.012 * anticip;
  const sc = scEntry * lerp(1, heroScale, lift) * (1 - 0.02 * anticip);
  const rot = lerp(rotEntry, 0, lift);

  return { p, cx: spot.cx, cy: spot.cy, tx, ty, rot, sc, op, squash, mountW, mountH, photoW, photoH, side, bottom };
}

/** The 4-layer warm grounded shadow + the hero's detach layer (groundShadow, structured instead of a
 *  CSS string; same formulas + the same toFixed rounding). The paper-bevel insets are drawn apart. */
export function scatteredGroundShadow(
  ps: number,
  settleP: number,
  lift: number,
  depthJ: number,
): ShadowSpec[] {
  const offX = ps * 0.01;
  const contactBlur = lerp(ps * 0.16, ps * 0.006, settleP);
  const contactA = lerp(0.3, 0.05, lift);
  const ease = 0.6 + 0.4 * settleP; // cast layers ease in with the settle
  const grow = 1 + lift * 1.3; // ~2.3x at full lift
  const layers: ShadowSpec[] = [
    {
      dx: 0,
      dy: ps * 0.004,
      blur: Number(r2(contactBlur)),
      color: `rgba(46,30,12,${r3(contactA)})`,
    },
    {
      dx: Number(r2(offX)),
      dy: Number(r2(ps * 0.016 * ease)),
      blur: Number(r2(ps * 0.026 * ease)),
      color: "rgba(50,32,12,0.22)",
    },
    {
      dx: Number(r2(offX)),
      dy: Number(r2(ps * 0.034 * ease * grow)),
      blur: Number(r2(ps * 0.054 * ease * grow)),
      color: `rgba(52,32,10,${r3(0.2 * depthJ)})`,
    },
    {
      dx: Number(r2(offX)),
      dy: Number(r2(ps * 0.06 * ease * grow)),
      blur: Number(r2(ps * 0.1 * ease * grow)),
      color: `rgba(48,30,10,${r3(0.18 * depthJ)})`,
    },
  ];
  if (lift > 0.001) {
    layers.push({
      dx: Number(r2(offX)),
      dy: Number(r2(ps * 0.16 * lift)),
      blur: Number(r2(ps * 0.24 * lift)),
      color: `rgba(40,26,8,${r3(0.16 * lift)})`,
    });
  }
  return layers;
}

// The paper/linen tooth: two repeating-linear stripe sets (96deg / 6deg, 2px on a 5px period),
// drawn ONCE into a full-size layer per canvas size (2 sizes max) and soft-light composited.
const toothCache = new Map<string, HTMLCanvasElement>();

function drawStripes(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  angleDeg: number,
  color: string,
): void {
  const rad = (angleDeg * Math.PI) / 180;
  // The CSS gradient direction; stripes run perpendicular to it.
  const phi = Math.atan2(-Math.cos(rad), Math.sin(rad));
  g.save();
  g.translate(w / 2, h / 2);
  g.rotate(phi);
  const L = Math.hypot(w, h) / 2 + 8;
  g.fillStyle = color;
  for (let x = -L; x < L; x += 5) g.fillRect(x, -L, 2, L * 2);
  g.restore();
}

function toothLayer(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  const cached = toothCache.get(key);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  drawStripes(g, w, h, 96, "rgba(120,96,60,0.018)");
  drawStripes(g, w, h, 6, "rgba(120,96,60,0.012)");
  toothCache.set(key, c);
  return c;
}

function drawPrint(
  c: CanvasRenderingContext2D,
  st: ScatteredPrintState,
  i: number,
  props: ReelProps,
  asset: ReelAssets["clips"][number],
  env: DrawEnv,
  lift: number,
): void {
  const { width: W, height: H } = env;
  const left = st.cx * W - st.mountW / 2;
  const top = st.cy * H - st.mountH / 2;

  // CSS: transform-origin center; transform: translate rotate scale scaleY(squash).
  const ox = left + st.mountW / 2;
  const oy = top + st.mountH / 2;
  c.translate(ox, oy);
  c.translate(st.tx, st.ty);
  c.rotate((st.rot * Math.PI) / 180);
  c.scale(st.sc, st.sc * st.squash);
  c.translate(-ox, -oy);

  const printShort = Math.min(st.photoW, st.photoH);
  const depthJ = seededRange(props.seed, i, 22, 0.86, 1.14);
  const mount = seededPick(props.seed, i, 21, MOUNTS);
  shadowsRoundRect(
    c,
    left,
    top,
    st.mountW,
    st.mountH,
    3,
    scatteredGroundShadow(printShort, st.p, lift, depthJ), // raw p, like the source (no clamp)
    mount, // rotated CTM -> the body-fill strategy (the mount's own paper color)
  );

  // The mount (matte paper) + the milled-edge bevel.
  roundRectPath(c, left, top, st.mountW, st.mountH, 3);
  c.fillStyle = mount;
  c.fill();
  insetShadowRoundRect(c, left, top, st.mountW, st.mountH, 3, 0, 1, 0, "rgba(255,255,255,0.55)");
  insetShadowRoundRect(c, left, top, st.mountW, st.mountH, 3, 0, -1, 0, "rgba(74,52,28,0.12)");

  // The recessed glossy photo (its recess shading shows only until the image covers it).
  const bx = left + st.side;
  const by = top + st.side;
  roundRectPath(c, bx, by, st.photoW, st.photoH, 1);
  c.fillStyle = "#181410";
  c.fill();
  innerBorderRoundRect(c, bx, by, st.photoW, st.photoH, 1, 1, "rgba(46,30,12,0.07)");
  const recessA = `rgba(40,26,10,${(0.16 + 0.04 * lift).toFixed(3)})`;
  if (lift > 0.5) {
    insetShadowRoundRect(c, bx, by, st.photoW, st.photoH, 1, 0, 2, 5, recessA);
  } else {
    insetShadowRoundRect(c, bx, by, st.photoW, st.photoH, 1, 0, 1, 3, recessA);
  }

  c.save();
  roundRectPath(c, bx, by, st.photoW, st.photoH, 1);
  c.clip();
  if (asset) {
    c.save();
    if (env.filterOk) {
      c.filter = props.theme.grade;
    } else {
      env.report("grade skipped: ctx.filter is unsupported in this browser");
    }
    drawCover(c, asset.image, bx, by, st.photoW, st.photoH);
    c.restore();
  }
  // Semi-gloss sheen on the emulsion only (matte paper, glossy photo).
  const glossTop = lerp(0.16, 0.22, lift);
  const glossAngle = 122 + seededRange(props.seed, i, 25, -8, 8) + lift * 8;
  c.globalCompositeOperation = "screen";
  c.fillStyle = cssLinearGradient(c, bx, by, st.photoW, st.photoH, glossAngle, [
    [0, `rgba(255,255,255,${glossTop.toFixed(3)})`],
    [0.24, "rgba(255,255,255,0.04)"],
    [0.46, "rgba(255,255,255,0)"],
    [0.88, "rgba(255,255,255,0.06)"],
  ]);
  c.fillRect(bx, by, st.photoW, st.photoH);
  c.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  frame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const landscape = W > H;
  const base = Math.min(W, H);
  const n = props.clips.length;
  const tl = scatteredTimeline(frame, n, base);

  ctx.clearRect(0, 0, W, H);

  // The warm lightbox surface.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.34 * H,
    rx: 1.35 * W,
    ry: 1.05 * H,
    stops: [
      [0, "#efe9df"],
      [0.46, "#e3dbcd"],
      [1, "#d2c5b0"],
    ],
  });
  // Warm key-light pool the gloss + shadows agree with.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.38 * W,
    cy: 0.28 * H,
    rx: 1.2 * W,
    ry: 0.8 * H,
    stops: [
      [0, "rgba(255,247,232,0.55)"],
      [0.5, "rgba(255,247,232,0)"],
    ],
  });

  const heroIndex = n - 1;
  const paintBoard = (c: CanvasRenderingContext2D): void => {
    for (let i = 0; i < n; i++) {
      if (i === heroIndex) continue;
      const st = scatteredPrintState(frame, i, props.clips[i], n, props.seed, W, H, 0, 0);
      if (!st) continue;
      withLayerAlpha(c, env, st.op, (cc) =>
        drawPrint(cc, st, i, props, assets.clips[i] ?? null, env, 0),
      );
    }
  };

  // The board of non-hero prints (dims + recedes + softens on the hero lift).
  if (tl.lift > 0) {
    drawLayerFiltered(
      ctx,
      env,
      {
        brightness: Number(tl.boardDim.toFixed(3)),
        blurPx: tl.boardBlur > 0.15 ? Number(tl.boardBlur.toFixed(2)) : 0,
        scale: tl.boardScale,
      },
      paintBoard,
    );
  } else {
    paintBoard(ctx);
  }

  // The hero, on top, in its own float-translated layer so only it lifts.
  const heroSt =
    n > 0
      ? scatteredPrintState(
          frame,
          heroIndex,
          props.clips[heroIndex],
          n,
          props.seed,
          W,
          H,
          tl.lift,
          tl.heroPress,
        )
      : null;
  if (heroSt) {
    withLayerAlpha(ctx, env, heroSt.op, (c) => {
      c.translate(0, tl.heroFloat);
      drawPrint(c, heroSt, heroIndex, props, assets.clips[heroIndex] ?? null, env, tl.lift);
    });
  }

  // A whisper of paper/linen tooth across the whole scene (prints included).
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = "soft-light";
  ctx.drawImage(toothLayer(W, H), 0, 0);
  ctx.restore();

  // A minimal warm vignette that centers the eye + deepens a hair on the lift.
  fillEllipticalGradient(
    ctx,
    W,
    H,
    landscape
      ? {
          cx: 0.5 * W,
          cy: 0.46 * H,
          rx: 0.88 * W,
          ry: 0.6 * H,
          stops: [
            [0.56, "rgba(70,50,28,0)"],
            [1, `rgba(70,50,28,${(0.1 + 0.04 * tl.lift).toFixed(3)})`],
          ],
        }
      : {
          cx: 0.5 * W,
          cy: 0.46 * H,
          rx: 0.72 * W,
          ry: 0.78 * H,
          stops: [
            [0.56, "rgba(70,50,28,0)"],
            [1, `rgba(70,50,28,${(0.16 + 0.05 * tl.lift).toFixed(3)})`],
          ],
        },
  );
}

export const SCATTERED: ReelStyle = {
  id: "scattered",
  duration: (props) => scatteredDuration(props.clips.length),
  // Fully procedural over the plain decoded clips.
  assetNeeds: () => ({ washes: false, grain: false, haloFilter: null }),
  draw,
};
