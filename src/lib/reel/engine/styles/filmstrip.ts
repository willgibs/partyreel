// FILM STRIP (styleId "filmstrip"): a 35mm strip threaded through a projector gate, advancing
// INTERMITTENTLY (hold, then a fast eased pull with a motion blur) so each frame registers at the lit
// gate. Source of truth: ../../composition/treatments/film-strip.tsx — geometry (KS 4-perf layout),
// timings (HOLD/ADVANCE cycle) and light math mirror it 1:1 (filmstrip.test.ts pins state values
// sampled from the real remotion interpolate/Easing). The intermittent timeline is BESPOKE, ported
// exactly rather than routed through timeline.ts.
//
// Port notes (beyond the scene2d.ts device-space-shadow delta):
// - The pull-down blur is a real ctx.filter blur on the cells layer where supported (exact CSS
//   parity); the Safari fallback is the mood renderer's calibrated downsample chain (a conscious,
//   capability-guard delta on the 2-11 blurred frames per pull).
// - The static celluloid grain tooth (a repeating-radial-gradient of subpixel rings at 5% alpha) is
//   replicated as a pattern tile of the same ring geometry; rasterization speckle differs at the
//   subpixel level (a conscious delta on a barely-visible texture).

import type { ReelProps } from "../../composition/reel-types";
import { seeded } from "../../composition/seed";
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
} from "../scene2d";

const HOLD = 30;
const ADVANCE = 12;
const CYCLE = HOLD + ADVANCE;
const TAIL = 26;
const PERFS = 4; // the classic 4-perf 35mm pull

const EASE_PULL = cubicBezier(0.55, 0, 0.1, 1); // a mechanical film pull-down

export function filmStripDuration(n: number): number {
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

/** Which strip position (fractional clip index) is at the gate: hold flat, then the eased pull. */
export function stripPosition(frame: number, n: number): number {
  const idx = Math.floor(frame / CYCLE);
  const local = frame - idx * CYCLE;
  const adv = local <= HOLD ? 0 : interp(local, [HOLD, CYCLE], [0, 1], EASE_PULL);
  return Math.min(idx + adv, n - 1);
}

export type FilmStripState = {
  pos: number;
  offset: number;
  blurAmt: number;
  flick: number;
};

/** The per-frame strip state (pure; the vitest pins sample this against the Remotion math). */
export function filmStripState(
  frame: number,
  n: number,
  seed: number,
  width: number,
  height: number,
): FilmStripState {
  const landscape = width > height;
  const main = landscape ? width : height;
  const pos = stripPosition(frame, n);
  const cellMain = main * 0.52;
  const offset = main / 2 - cellMain / 2 - pos * cellMain;

  // SIGNATURE — pull-down motion-blur during the ADVANCE tail (capped so held frames stay crisp).
  const localCyc = frame % CYCLE;
  const advancing = localCyc > HOLD && pos < n - 1;
  const blurAmt = advancing
    ? Math.sin(((localCyc - HOLD) / ADVANCE) * Math.PI) * main * 0.009
    : 0;

  // SIGNATURE — a steady warm gate-lamp breathe (shallow + slow, not a strobe).
  const flick = 0.92 + 0.08 * (0.5 + 0.5 * Math.sin(frame * 1.0 + seed));

  return { pos, offset, blurAmt, flick };
}

/** A perf's bloom alpha: seeded per-hole variance + a boost as it passes the lit gate. */
export function perfGlow(
  seed: number,
  i: number,
  k: number,
  e: number,
  distGate: number,
  main: number,
): number {
  const gateBoost = Math.max(0, 0.12 * (1 - Math.min(1, distGate / (main * 0.3))));
  const variance = (seeded(seed, i * PERFS + k, e + 1) - 0.5) * 0.1;
  return Math.min(0.72, 0.45 + variance + gateBoost);
}

// The static celluloid grain tooth: the source tiles a repeating-radial-gradient (0.5px rings on a
// 0.6px period) at backgroundSize px(3). The tile is rebuilt only when the size changes (2 sizes max).
const toothTileCache = new Map<number, HTMLCanvasElement>();

function toothTile(size: number): HTMLCanvasElement {
  const s = Math.max(2, Math.round(size));
  const cached = toothTileCache.get(s);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  g.strokeStyle = "rgba(255,250,240,0.5)";
  g.lineWidth = 0.5;
  const cx = s / 2;
  const maxR = cx * Math.SQRT2;
  for (let r = 0.25; r < maxR; r += 0.6) {
    g.beginPath();
    g.arc(cx, cx, r, 0, Math.PI * 2);
    g.stroke();
  }
  toothTileCache.set(s, c);
  return c;
}

function drawCells(
  c: CanvasRenderingContext2D,
  frame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
  st: FilmStripState,
): void {
  const { width: W, height: H } = env;
  const landscape = W > H;
  const main = landscape ? W : H;
  const cross = landscape ? H : W;
  const px = (v: number) => v * (main / 1080); // hold shadow/glow proportions at any render scale
  const n = props.clips.length;

  const stripCross = cross * 0.8;
  const cellMain = main * 0.52;
  const sprocket = stripCross * 0.14; // the celluloid rebate carrying the perfs
  const darkMask = stripCross * 0.03; // bare base between the perf rows + the image
  const photoCross = stripCross - sprocket * 2 - darkMask * 2;
  const photoMain = cellMain * 0.86; // leaves the inter-frame gutter of bare base
  const pitch = cellMain / PERFS;
  const perfShort = sprocket * 0.6; // across the margin
  const perfLong = Math.min(perfShort * 1.41, 0.46 * pitch); // KS 1.41:1, clamped to the pitch
  const perfRadius = Math.min(perfShort, perfLong) * 0.22; // crisp rounded rect, never a pill
  const gateCenter = main / 2;

  for (let i = 0; i < n; i++) {
    const mainCoord = st.offset + i * cellMain;
    if (mainCoord > main + cellMain || mainCoord < -cellMain) continue;
    const cellW = landscape ? cellMain : stripCross;
    const cellH = landscape ? stripCross : cellMain;
    const left = landscape ? mainCoord : (W - stripCross) / 2;
    const top = landscape ? (H - stripCross) / 2 : mainCoord;
    const pw = landscape ? photoMain : photoCross;
    const ph = landscape ? photoCross : photoMain;

    // The celluloid base: warm-neutral with a convex sheen ACROSS the thickness axis.
    roundRectPath(c, left, top, cellW, cellH, px(1.5));
    c.fillStyle = cssLinearGradient(
      c,
      left,
      top,
      cellW,
      cellH,
      landscape ? 180 : 90, // "to bottom" / "to right"
      [
        [0, "#120e0a"],
        [0.2, "#1f1810"],
        [0.5, "#261d14"],
        [0.8, "#1d160f"],
        [1, "#110d09"],
      ],
    );
    c.fill();
    // The base's inset stack (white ring under the black ring, like the CSS layer order).
    innerBorderRoundRect(c, left, top, cellW, cellH, px(1.5), 1, "rgba(255,244,224,0.07)");
    innerBorderRoundRect(c, left, top, cellW, cellH, px(1.5), 1, "rgba(0,0,0,0.6)");
    insetShadowRoundRect(c, left, top, cellW, cellH, px(1.5), 0, 0, px(20), "rgba(0,0,0,0.45)");

    // Two edges of 4 backlit KS perforations, evenly pitched along the cell's main axis. Each hole's
    // bloom varies a touch (seeded) + brightens as it passes the gate.
    for (let e = 0; e < 2; e++) {
      const nearOff = (sprocket - perfShort) / 2;
      const crossPos = e === 0 ? nearOff : stripCross - sprocket + nearOff;
      for (let k = 0; k < PERFS; k++) {
        const mp = ((k + 0.5) / PERFS) * cellMain;
        const distGate = Math.abs(mainCoord + mp - gateCenter);
        const glowA = perfGlow(props.seed, i, k, e, distGate, main);
        const glowB = glowA * 0.44;
        const rx = left + (landscape ? mp - perfLong / 2 : crossPos);
        const ry = top + (landscape ? crossPos : mp - perfLong / 2);
        const rw = landscape ? perfLong : perfShort;
        const rh = landscape ? perfShort : perfLong;
        // The two bloom halos (outer, with CSS spread -> inflated shapes).
        shadowsRoundRect(
          c,
          rx,
          ry,
          rw,
          rh,
          perfRadius,
          [
            {
              dx: 0,
              dy: 0,
              blur: px(5),
              spread: px(0.5),
              color: `rgba(255,236,190,${glowA.toFixed(3)})`,
            },
            {
              dx: 0,
              dy: 0,
              blur: px(13),
              spread: px(2),
              color: `rgba(255,224,170,${glowB.toFixed(3)})`,
            },
          ],
          // no bodyFill: the CTM is unrotated, so the exact body-free offset trick applies
        );
        // The backlit hole (the gate lamp glowing THROUGH the perf): the CSS
        // radial-gradient(75% 75% at 50% 45%) drawn in ellipse space, clipped to the perf shape.
        c.save();
        roundRectPath(c, rx, ry, rw, rh, perfRadius);
        c.clip();
        c.translate(rx + rw / 2, ry + rh * 0.45);
        c.scale(1, rh / rw); // ellipse: gradient radii track each axis
        const g = c.createRadialGradient(0, 0, 0, 0, 0, rw * 0.75);
        g.addColorStop(0, "#fff7ea");
        g.addColorStop(0.5, "#f6ead2");
        g.addColorStop(1, "#e8d9bb");
        c.fillStyle = g;
        c.fillRect(-rw, (-rh * (rw / rh)) * 1.5, rw * 2, rh * (rw / rh) * 3);
        c.restore();
        insetShadowRoundRect(c, rx, ry, rw, rh, perfRadius, 0, 1, px(2), "rgba(60,32,10,0.45)");
        insetShadowRoundRect(c, rx, ry, rw, rh, perfRadius, 0, -1, px(1), "rgba(255,240,210,0.28)");
      }
    }

    // The photo well at the gate window.
    const bx = left + (cellW - pw) / 2;
    const by = top + (cellH - ph) / 2;
    roundRectPath(c, bx, by, pw, ph, 2);
    c.fillStyle = "#000";
    c.fill();
    innerBorderRoundRect(c, bx, by, pw, ph, 2, 1, "rgba(0,0,0,0.85)");
    insetShadowRoundRect(c, bx, by, pw, ph, 2, 0, 1, 0, "rgba(255,240,210,0.08)");
    insetShadowRoundRect(c, bx, by, pw, ph, 2, 0, 0, px(18), "rgba(0,0,0,0.45)");

    const asset = assets.clips[i];
    if (props.clips[i].url && asset) {
      c.save();
      roundRectPath(c, bx, by, pw, ph, 2);
      c.clip();
      if (env.filterOk) {
        c.filter = props.theme.grade;
      } else {
        env.report("grade skipped: ctx.filter is unsupported in this browser");
      }
      drawCover(c, asset.image, bx, by, pw, ph);
      c.restore();
    }
    // The hairline outer ring (spread 0.5, no blur): a half-in/half-out stroke reads the same.
    c.save();
    roundRectPath(c, bx, by, pw, ph, 2);
    c.lineWidth = 1;
    c.strokeStyle = "rgba(255,246,226,0.05)";
    c.stroke();
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
  const landscape = W > H;
  const main = landscape ? W : H;
  const px = (v: number) => v * (main / 1080);
  const st = filmStripState(frame, props.clips.length, props.seed, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0806";
  ctx.fillRect(0, 0, W, H);

  // The strip layer, blurred during the pull (the same >0.2px threshold as the DOM): scene2d's
  // filtered-layer composite = a real ctx.filter blur where supported, else the downsample chain.
  if (st.blurAmt > 0.2) {
    drawLayerFiltered(ctx, env, { blurPx: st.blurAmt }, (c) =>
      drawCells(c, frame, props, assets, env, st),
    );
  } else {
    drawCells(ctx, frame, props, assets, env, st);
  }

  // Static celluloid grain tooth (never animated -> byte-stable WYSIWYG).
  const tile = toothTile(px(3));
  const pattern = ctx.createPattern(tile, "repeat");
  if (pattern) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // A 1px specular highlight skating along the strip thickness center (the lamp on moving celluloid).
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  if (landscape) {
    ctx.fillRect(0, H / 2 - px(0.75), W, px(1.5));
  } else {
    ctx.fillRect(W / 2 - px(0.75), 0, px(1.5), H);
  }
  ctx.restore();

  // Off-gate dimming: fully opaque warm-black at the very ends, clear over the gate.
  ctx.fillStyle = cssLinearGradient(ctx, 0, 0, W, H, landscape ? 90 : 180, [
    [0, "rgba(10,8,6,1)"],
    [0.06, "rgba(10,8,6,1)"],
    [0.3, "rgba(10,8,6,0)"],
    [0.7, "rgba(10,8,6,0)"],
    [0.94, "rgba(10,8,6,1)"],
    [1, "rgba(10,8,6,1)"],
  ]);
  ctx.fillRect(0, 0, W, H);

  // The warm gate lamp (screen-blended -> adds light onto the centered photo + the perfs).
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.5 * H,
    rx: 0.56 * W,
    ry: 0.32 * H,
    stops: [
      [0, `rgba(255,235,198,${(0.18 * st.flick).toFixed(3)})`],
      [0.38, `rgba(255,228,178,${(0.07 * st.flick).toFixed(3)})`],
      [0.64, "rgba(255,228,178,0)"],
    ],
    composite: "screen",
  });
}

export const FILMSTRIP: ReelStyle = {
  id: "filmstrip",
  duration: (props) => filmStripDuration(props.clips.length),
  // Fully procedural over the plain decoded clips (its grain tooth is its own tile, not the
  // feTurbulence overlay tile).
  assetNeeds: () => ({ washes: false, grain: false, haloFilter: null }),
  draw,
};
