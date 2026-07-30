// POLAROID STACK (styleId "polaroid"), the first canvas-ported TREATMENT: instant prints tossed onto
// a growing heap on a warm tabletop, each DEVELOPING in (dark/desaturated/soft -> full image) as it
// lands. Source of truth: ../../composition/treatments/polaroid-stack.tsx — every constant, seeded
// stream and formula below mirrors it 1:1 (polaroid.test.ts pins state values sampled from the real
// remotion spring/interpolate). The treatment's timeline is BESPOKE (drop cadence + tail, not the
// mood plan), so it is ported exactly rather than routed through timeline.ts.
//
// Port notes (beyond the scene2d.ts device-space-shadow delta):
// - The spring entry (damping 14 / stiffness 110 / mass 0.8) OVERSHOOTS; transform channels use raw
//   lerp on p (CSS interpolate extends past the range) — only opacity/develop/KB are clamped.
// - The develop filter (grade + brightness/saturate/contrast/blur ramp) needs ctx.filter; where it's
//   unsupported (Safari) the port reports + falls back to a scoped black-overlay darken so the
//   develop-in still reads (the cinematic brightness-fallback precedent).

import { FPS } from "../constants";
import type { ReelProps } from "../reel-types";
import { seeded, seededRange } from "../seed";
import type { ReelAssets } from "../assets";
import { drawCover } from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { interp } from "../easing";
import {
  cssLinearGradient,
  fillEllipticalGradient,
  innerBorderRoundRect,
  insetShadowRoundRect,
  roundRectPath,
  shadowsRoundRect,
  withLayerAlpha,
} from "../scene2d";
import { springValue } from "../spring";

const DROP_INTERVAL = 22; // a lively build (prints keep landing while earlier ones still develop)
const TAIL = 46; // hold on the full, settled heap

const SPRING = { damping: 14, stiffness: 110, mass: 0.8 };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const round1 = (v: number) => Math.round(v * 10) / 10; // the source's toFixed(1) shadow values

export function polaroidDuration(n: number): number {
  return Math.max(1, n * DROP_INTERVAL + TAIL);
}

type Spot = { x: number; y: number; rot: number };

// Where a print settles in the heap (pileSpot, verbatim): footprint grows with sqrt(build progress),
// newer prints sit a touch higher, seeded angle + jitter keeps it hand-tossed.
function pileSpot(i: number, n: number, seed: number, base: number): Spot {
  const t = n > 1 ? i / (n - 1) : 0;
  const spread = base * (0.015 + 0.055 * Math.sqrt(t));
  const ang = seededRange(seed, i, 20, 0, Math.PI * 2);
  const x =
    Math.cos(ang) * spread + seededRange(seed, i, 2, -0.03, 0.03) * base;
  const y =
    Math.sin(ang) * spread * 0.66 +
    seededRange(seed, i, 3, -0.03, 0.03) * base -
    t * base * 0.05;
  return { x, y, rot: seededRange(seed, i, 1, -11, 11) };
}

export type PolaroidPrintState = {
  p: number;
  tx: number;
  ty: number;
  rot: number;
  sc: number;
  squashY: number;
  op: number;
  dev: number;
  kb: number;
  zLift: number;
};

/** The full per-print animation state at a frame (null before the print's drop starts). Pure — the
 *  vitest pins sample this against the Remotion component's math. */
export function polaroidPrintState(
  frame: number,
  i: number,
  n: number,
  seed: number,
  width: number,
  height: number,
): PolaroidPrintState | null {
  const base = Math.min(width, height);
  const dropStart = i * DROP_INTERVAL;
  if (frame < dropStart) return null;
  const local = frame - dropStart;
  const t = n > 1 ? i / (n - 1) : 0;

  const p = springValue(local, FPS, SPRING);
  const spot = pileSpot(i, n, seed, base);
  const sizeF = 1 + t * 0.06; // the freshest memory sits biggest on top

  // Toss variety: ~40% slide in from a side, the rest drop from above; each carries extra spin.
  const slideIn = seeded(seed, i, 7) > 0.6;
  const dir = seeded(seed, i, 8) > 0.5 ? 1 : -1;
  const fromRot =
    spot.rot + (slideIn ? dir * 14 : seeded(seed, i, 4) > 0.5 ? 22 : -22);
  const fromX = slideIn ? dir * width * 0.9 : 0;
  const fromY = slideIn ? -height * 0.12 : -height * 1.2;

  // Raw lerp on p (NOT clamped): the spring overshoot carries these past their targets — the bounce.
  const tx = lerp(fromX, spot.x, p);
  const ty = lerp(fromY, spot.y, p);
  const rot = lerp(fromRot, spot.rot, p);
  const sc = lerp(1.12, 1, p) * sizeF;
  const op = interp(p, [0, 0.22], [0, 1]);

  // A tactile landing flex as the print slaps onto the pile (a brief scaleY dip on contact).
  const land = Math.max(0, 1 - Math.abs(p - 0.82) / 0.1);
  const squashY = 1 - land * 0.05;

  // SIGNATURE — develop-in: lands dark + desaturated + soft, resolves to full over ~1.1s.
  const dev = interp(local, [8, 8 + FPS * 1.1], [0, 1]);

  // A whisper of Ken-Burns inside the print so the settled pile still breathes.
  const kb = interp(local, [0, DROP_INTERVAL * 3], [1.02, 1.06]);

  const zLift = 0.45 + 0.55 * t; // higher in the heap -> a deeper cast
  return { p, tx, ty, rot, sc, squashY, op, dev, kb, zLift };
}

function drawPrint(
  c: CanvasRenderingContext2D,
  st: PolaroidPrintState,
  props: ReelProps,
  asset: ReelAssets["clips"][number],
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const base = Math.min(W, H);
  const cardW = base * 0.5;
  const borderSide = cardW * 0.045;
  const borderBottom = cardW * 0.16; // the classic thick Polaroid chin
  const photo = cardW - borderSide * 2; // the content box is square (photo x photo)
  const cardH = photo + borderSide + borderBottom;
  const left = (W - cardW) / 2;
  const top = (H - cardH) / 2;

  // CSS: transform-origin "center 62%", transform: translate rotate scale scaleY.
  const ox = left + cardW / 2;
  const oy = top + cardH * 0.62;
  c.translate(ox, oy);
  c.translate(st.tx, st.ty);
  c.rotate((st.rot * Math.PI) / 180);
  c.scale(st.sc, st.sc * st.squashY);
  c.translate(-ox, -oy);

  // The chunky warm grounded shadow stack (deeper for prints higher in the heap).
  const zl = st.zLift;
  shadowsRoundRect(
    c,
    left,
    top,
    cardW,
    cardH,
    6,
    [
      {
        dx: 0,
        dy: round1(base * 0.004),
        blur: round1(base * 0.006),
        color: "rgba(24,14,6,0.5)",
      },
      {
        dx: 0,
        dy: round1(base * 0.012 * zl),
        blur: round1(base * 0.02 * zl),
        color: "rgba(26,15,7,0.4)",
      },
      {
        dx: 0,
        dy: round1(base * 0.03 * zl),
        blur: round1(base * 0.05 * zl),
        color: "rgba(22,12,5,0.34)",
      },
    ],
    "#faf7f0",
  );

  // The card: warm paper with the milled top-edge highlight.
  roundRectPath(c, left, top, cardW, cardH, 6);
  c.fillStyle = cssLinearGradient(c, left, top, cardW, cardH, 160, [
    [0, "#fdfbf6"],
    [1, "#f7f3ea"],
  ]);
  c.fill();
  insetShadowRoundRect(
    c,
    left,
    top,
    cardW,
    cardH,
    6,
    0,
    1,
    0,
    "rgba(255,255,255,0.7)",
  );

  // The recessed photo well (its inset shading shows only until the image covers it, like the DOM).
  const px = left + borderSide;
  const py = top + borderSide;
  c.fillStyle = "#141210";
  c.fillRect(px, py, photo, photo);
  innerBorderRoundRect(c, px, py, photo, photo, 0, 1, "rgba(30,20,10,0.14)");
  insetShadowRoundRect(
    c,
    px,
    py,
    photo,
    photo,
    0,
    0,
    2,
    5,
    "rgba(20,12,6,0.28)",
  );

  if (asset) {
    c.save();
    c.beginPath();
    c.rect(px, py, photo, photo);
    c.clip();
    // CSS `scale` on the Img: about the image center, cropping within the overflow-hidden well.
    c.translate(px + photo / 2, py + photo / 2);
    c.scale(st.kb, st.kb);
    if (env.filterOk) {
      c.filter =
        `${props.theme.grade} brightness(${(0.34 + st.dev * 0.66).toFixed(3)})` +
        ` saturate(${(0.18 + st.dev * 0.82).toFixed(3)})` +
        ` contrast(${(0.82 + st.dev * 0.18).toFixed(3)})` +
        ` blur(${((1 - st.dev) * 3).toFixed(2)}px)`;
      drawCover(c, asset.image, -photo / 2, -photo / 2, photo, photo);
    } else {
      env.report("grade skipped: ctx.filter is unsupported in this browser");
      drawCover(c, asset.image, -photo / 2, -photo / 2, photo, photo);
      // The scoped fallback keeps the develop-in READ (a black-overlay darken tracking the
      // brightness ramp); the saturate/contrast/blur legs are skipped with the grade.
      const dark = 0.66 * (1 - st.dev);
      if (dark > 0.002) {
        c.filter = "none";
        c.fillStyle = `rgba(0,0,0,${dark.toFixed(3)})`;
        c.fillRect(-photo / 2, -photo / 2, photo, photo);
      }
    }
    c.restore();
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
  ctx.clearRect(0, 0, W, H);

  // A warm, dim, intimate tabletop (warmer than the Card deck's cool charcoal).
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.44 * H,
    rx: 1.2 * W,
    ry: 0.92 * H,
    stops: [
      [0, "#241c14"],
      [0.46, "#17110b"],
      [1, "#0c0806"],
    ],
  });
  // A soft warm key pooled where the heap builds.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.4 * H,
    rx: 0.58 * W,
    ry: 0.46 * H,
    stops: [
      [0, "rgba(255,232,196,0.14)"],
      [0.44, "rgba(255,226,184,0.05)"],
      [0.68, "rgba(255,226,184,0)"],
    ],
    composite: "screen",
  });

  const n = props.clips.length;
  for (let i = 0; i < n; i++) {
    const st = polaroidPrintState(frame, i, n, props.seed, W, H);
    if (!st) continue;
    withLayerAlpha(ctx, env, st.op, (c) =>
      drawPrint(c, st, props, assets.clips[i] ?? null, env),
    );
  }

  // A quiet warm vignette that cradles the pile.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.46 * H,
    rx: 0.9 * W,
    ry: 0.82 * H,
    stops: [
      [0.58, "rgba(10,6,3,0)"],
      [1, "rgba(10,6,3,0.5)"],
    ],
  });
}

export const POLAROID: ReelStyle = {
  id: "polaroid",
  duration: (props) => polaroidDuration(props.clips.length),
  // Fully procedural over the plain decoded clips: no washes, no grain tile, no halos.
  assetNeeds: () => ({ washes: false, grain: false, haloFilter: null }),
  draw,
};
