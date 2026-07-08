// FRAMED GALLERY (styleId "framed"): the guest's photos hung as matted, framed pieces in a bright
// white-cube gallery, a camera dollying along the wall and settling in front of each work, with a
// warm picture-light that swells as the dolly arrives. Source of truth:
// ../../composition/treatments/framed-gallery.tsx — the settle-and-hold travel curve, the piece
// geometry (molding/mat/bevel-cut well), the one proximity scalar and the 4-layer wall cast mirror
// it 1:1 (framed.test.ts pins values sampled from the real remotion interpolate/Easing). The dolly
// timeline is BESPOKE, ported exactly rather than routed through timeline.ts.
//
// Port notes (beyond the scene2d.ts device-space-shadow delta):
// - Pieces never rotate, so the wall casts use the exact body-free offset-trick shadows; the n===1
//   reverent push-in SCALES the plane (the offset trick breaks under a scaled CTM), so that solo
//   case switches to the body-fill strategy (the molding's own base color hides the overdraw).
// - The per-piece `filter: brightness()` wraps the whole framed element in CSS; brightness is a
//   linear per-channel map, so applying it per draw inside the piece composites to the same pixels
//   under source-over (the only inexactness is the whisper-alpha glass screen blend). Where
//   ctx.filter is unsupported (Safari) the port reports + scoped-darkens when the piece is dimmed
//   (the cinematic brightness-fallback precedent); the <=6% boost near center is carried by the
//   picture-light there instead.
// - Offscreen pieces are culled (the DOM never rasterizes them; the canvas otherwise would).

import { fitClip } from "../../composition/framing";
import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { seeded, seededPick, seededRange } from "../../composition/seed";
import type { ReelAssets } from "../assets";
import { containRect, coverRect } from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { cubicBezier, interp } from "../easing";
import {
  cssLinearGradient,
  fillEllipticalGradient,
  innerBorderRoundRect,
  insetShadowRoundRect,
  roundRectPath,
  shadowsRoundRect,
  type ShadowSpec,
} from "../scene2d";

const INTRO = 16;
const TRAVEL = 18;
const OUTRO = 40;

// A decisive accel + a long gentle "arrive" (the source's EASE_STEP bezier).
const EASE_STEP = cubicBezier(0.45, 0, 0.15, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const r1 = (v: number) => Number(v.toFixed(1)); // the source's toFixed(1) shadow values
const r3 = (v: number) => v.toFixed(3);

/** Frames the dolly holds on a piece — eased down as the wall fills (verbatim holdFrames). */
export function holdFrames(n: number): number {
  return Math.round(lerp(30, 22, clamp01((n - 6) / 6)));
}

export function framedDuration(n: number): number {
  return Math.max(1, INTRO + (n - 1) * TRAVEL + n * holdFrames(n) + OUTRO);
}

/** The settle-and-hold dolly position (0..n-1): hold on a piece, then ease to the next. */
export function travelAt(frame: number, n: number, hold: number): number {
  if (frame < INTRO) return interp(frame, [0, INTRO], [-0.1, 0], EASE_STEP);
  const t = frame - INTRO;
  const cycle = hold + TRAVEL;
  const idx = Math.min(Math.floor(t / cycle), n - 1);
  const local = t - idx * cycle;
  if (idx >= n - 1 || local < hold) return idx;
  return Math.min(idx + interp(local, [hold, cycle], [0, 1], EASE_STEP), n - 1);
}

export type FramedCamera = {
  travel: number;
  camMain: number;
  /** ONE proximity scalar: the spotlight swells, the room dims between pieces. */
  p: number;
  /** n===1 gets a slow reverent push-in instead of a dolly. */
  soloPush: number;
  spotA: number;
};

export function framedCamera(
  frame: number,
  n: number,
  width: number,
  height: number,
): FramedCamera {
  const landscape = width > height;
  const main = landscape ? width : height;
  const hold = holdFrames(n);
  const travel = travelAt(frame, n, hold);
  const camMain = travel * (main * 0.62);
  const nearest = Math.round(travel);
  const p = 1 - clamp(Math.abs(travel - nearest), 0, 1);
  const soloPush =
    n === 1
      ? interp(frame, [INTRO, INTRO + hold + OUTRO], [1, 1.05], EASE_STEP)
      : 1;
  return { travel, camMain, p, soloPush, spotA: 0.05 + 0.16 * p };
}

export type FramedPieceState = {
  material: "black" | "wood";
  aspect: number;
  sizeFrac: number;
  frameW: number;
  frameH: number;
  moldFace: number;
  matSide: number;
  matBottom: number;
  hasGroove: boolean;
  depthJ: number;
  crossJitter: number;
  /** This piece's dolly proximity -> brightness pop, cast depth, glass glaze. */
  pi: number;
  brightness: number;
  litA: number;
  castMul: number;
  leanScale: number;
  /** Plane-local position (the plane spans the full cross axis, so cross coords match the page). */
  left: number;
  top: number;
  glassAngle: number;
  cast: ShadowSpec[];
};

/** One framed piece's full geometry + proximity dynamics at a dolly position (verbatim math). */
export function framedPieceState(
  travel: number,
  i: number,
  clip: Pick<ReelClip, "width" | "height">,
  n: number,
  seed: number,
  width: number,
  height: number,
): FramedPieceState {
  const landscape = width > height;
  const main = landscape ? width : height;
  const cross = landscape ? height : width;
  const px = (v: number) => v * (main / 1080);
  const slot = main * 0.62;
  const crossCenter = landscape ? height * 0.46 : width * 0.5;

  const material = seededPick(seed, i, 31, [
    "black",
    "black",
    "black",
    "wood",
  ] as const);
  const aspect =
    clip.width && clip.height
      ? clamp(clip.width / clip.height, 0.7, 1.4)
      : seededPick(seed, i, 8, [4 / 5, 1, 5 / 4]);
  const sizeFrac = seededRange(
    seed,
    i,
    7,
    landscape ? 0.5 : 0.6,
    landscape ? 0.64 : 0.76,
  );
  const frameCrossDim = cross * sizeFrac;
  const frameMainDim = landscape
    ? frameCrossDim * aspect
    : frameCrossDim / aspect;
  const frameW = landscape ? frameMainDim : frameCrossDim;
  const frameH = landscape ? frameCrossDim : frameMainDim;
  const frameLong = Math.max(frameW, frameH);
  const frameShort = Math.min(frameW, frameH);

  const moldFace = frameLong * seededRange(seed, i, 30, 0.03, 0.04);
  // The over-matting trick: smaller works get a proportionally wider mat.
  const matFrac =
    seededRange(seed, i, 32, 0.13, 0.17) + (0.64 - sizeFrac) * 0.1;
  const matSide = frameShort * matFrac;
  const matBottom = matSide * 1.18;
  const hasGroove = seeded(seed, i, 33) > 0.45;
  const depthJ = seededRange(seed, i, 36, 0.88, 1.12);
  const crossJitter = frameShort * seededRange(seed, i, 34, -0.012, 0.012);

  const pi = interp(Math.abs(travel - i), [0, 1.3], [1, 0]);
  const brightness = lerp(0.86, 1.06, pi);
  const litA = lerp(0.13, 0.2, pi);
  const castMul = lerp(1, 1.3, pi);
  const leanScale = 1 + 0.025 * pi;

  const mainCoord = i * slot;
  const left = landscape
    ? mainCoord - frameW / 2
    : crossCenter - frameW / 2 + crossJitter;
  const top = landscape
    ? crossCenter - frameH / 2 + crossJitter
    : mainCoord - frameH / 2;

  // The 4-layer wall cast (structured instead of a CSS string; same formulas + toFixed rounding).
  const cast: ShadowSpec[] = [
    { dx: 0, dy: px(2), blur: px(3), color: `rgba(28,26,24,${r3(litA)})` },
    {
      dx: 0,
      dy: r1(frameLong * 0.018 * castMul * depthJ),
      blur: r1(frameLong * 0.028 * castMul * depthJ),
      color: "rgba(28,26,24,0.13)",
    },
    {
      dx: 0,
      dy: r1(frameLong * 0.04 * castMul * depthJ),
      blur: r1(frameLong * 0.07 * depthJ),
      spread: -r1(frameLong * 0.012),
      color: "rgba(28,26,24,0.10)",
    },
    {
      dx: px(4),
      dy: px(8),
      blur: r1(frameLong * 0.05),
      spread: -r1(frameLong * 0.016),
      color: "rgba(28,26,24,0.07)",
    },
  ];

  const glassAngle = 122 + clamp((i - travel) * 3, -6, 6);

  return {
    material,
    aspect,
    sizeFrac,
    frameW,
    frameH,
    moldFace,
    matSide,
    matBottom,
    hasGroove,
    depthJ,
    crossJitter,
    pi,
    brightness,
    litA,
    castMul,
    leanScale,
    left,
    top,
    glassAngle,
    cast,
  };
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  st: FramedPieceState,
  props: ReelProps,
  clip: ReelClip,
  asset: ReelAssets["clips"][number],
  env: DrawEnv,
  px: (v: number) => number,
  scaledPlane: boolean,
): void {
  const { left: x, top: y, frameW: w, frameH: h } = st;
  const r = px(2);
  const isWood = st.material === "wood";
  const moldBase = isWood ? "#b1895f" : "#141414";

  // The wall cast rides the UNSCALED shadow-caster box (the lean scales only the content, below).
  shadowsRoundRect(
    ctx,
    x,
    y,
    w,
    h,
    r,
    st.cast,
    scaledPlane ? moldBase : undefined, // the solo push scales the CTM -> body-fill strategy
  );

  ctx.save();
  // The reverent forward lean as the dolly centers the piece (CSS transform: scale, origin center).
  const ox = x + w / 2;
  const oy = y + h / 2;
  ctx.translate(ox, oy);
  ctx.scale(st.leanScale, st.leanScale);
  ctx.translate(-ox, -oy);

  // CSS wraps the piece in `filter: brightness()`; brightness is linear per channel, so per-draw
  // application composites identically under source-over (see the port notes).
  const bright = `brightness(${r3(st.brightness)})`;
  if (env.filterOk) ctx.filter = bright;

  // Molding (matte black / warm wood): lit top-lip + dark underside + rabbet ring for depth.
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = isWood
    ? cssLinearGradient(ctx, x, y, w, h, 168, [
        [0, "#c9a878"],
        [0.5, "#b1895f"],
        [1, "#9a7148"],
      ])
    : "#141414";
  ctx.fill();
  // The inset stack, painted last-to-first so the first CSS layer lands on top.
  insetShadowRoundRect(ctx, x, y, w, h, r, 0, 1, 2, "rgba(0,0,0,0.34)");
  innerBorderRoundRect(ctx, x, y, w, h, r, 1, "rgba(0,0,0,0.32)");
  insetShadowRoundRect(
    ctx,
    x,
    y,
    w,
    h,
    r,
    0,
    -1,
    0,
    isWood ? "rgba(60,40,20,0.40)" : "rgba(0,0,0,0.55)",
  );
  insetShadowRoundRect(
    ctx,
    x,
    y,
    w,
    h,
    r,
    0,
    1,
    0,
    isWood ? "rgba(255,240,214,0.22)" : "rgba(255,255,255,0.10)",
  );

  // The museum mat (warm cotton-rag, weighted bottom).
  const mx = x + st.moldFace;
  const my = y + st.moldFace;
  const mw = w - 2 * st.moldFace;
  const mh = h - 2 * st.moldFace;
  ctx.fillStyle = cssLinearGradient(
    ctx,
    mx,
    my,
    mw,
    mh,
    178,
    isWood
      ? [
          [0, "#f8f3e8"],
          [1, "#f3ebdc"],
        ]
      : [
          [0, "#f6f3ed"],
          [1, "#f0ece1"],
        ],
  );
  ctx.fillRect(mx, my, mw, mh);

  if (st.hasGroove) {
    // The v-groove scored into the mat (an empty inset-shadow outline in the source).
    const g = st.matSide * 0.5;
    const gx = mx + g;
    const gy = my + g;
    const gw = mw - 2 * g;
    const gh = mh - 2 * g;
    insetShadowRoundRect(
      ctx,
      gx,
      gy,
      gw,
      gh,
      0,
      0,
      1,
      0,
      "rgba(255,253,247,0.65)",
    );
    innerBorderRoundRect(ctx, gx, gy, gw, gh, 0, 1, "rgba(60,42,20,0.14)");
  }

  // Photo well — recessed under the 45deg bevel-cut window.
  const wx = mx + st.matSide;
  const wy = my + st.matSide;
  const ww = mw - 2 * st.matSide;
  const wh = mh - st.matSide - st.matBottom;
  const wr = px(1);
  roundRectPath(ctx, wx, wy, ww, wh, wr);
  ctx.fillStyle = "#0c0c0c";
  ctx.fill();
  innerBorderRoundRect(ctx, wx, wy, ww, wh, wr, 1, "rgba(0,0,0,0.16)");
  insetShadowRoundRect(
    ctx,
    wx,
    wy,
    ww,
    wh,
    wr,
    0,
    -1,
    2,
    "rgba(255,255,255,0.30)",
  );
  insetShadowRoundRect(ctx, wx, wy, ww, wh, wr, 0, 3, 6, "rgba(40,28,12,0.40)");
  innerBorderRoundRect(ctx, wx, wy, ww, wh, wr, 1.5, "#fffdf7");

  ctx.save();
  roundRectPath(ctx, wx, wy, ww, wh, wr);
  ctx.clip();
  if (asset && clip.url) {
    // fitClip decides from the FRAME box like the source (cover for near-matching aspects).
    const fit = fitClip(clip.width, clip.height, st.frameW, st.frameH);
    const rect =
      fit === "cover"
        ? coverRect(asset.width, asset.height, ww, wh)
        : containRect(asset.width, asset.height, ww, wh);
    if (env.filterOk) {
      ctx.filter = `${props.theme.grade} ${bright}`;
    } else {
      env.report("grade skipped: ctx.filter is unsupported in this browser");
    }
    ctx.drawImage(asset.image, wx + rect.x, wy + rect.y, rect.w, rect.h);
    if (env.filterOk) ctx.filter = bright;
  }
  // A whisper of museum glass — catches the diagonal light only as the piece centers.
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.5 + 0.5 * st.pi;
  ctx.fillStyle = cssLinearGradient(ctx, wx, wy, ww, wh, st.glassAngle, [
    [0, "rgba(255,253,247,0.07)"],
    [0.18, "rgba(255,253,247,0.02)"],
    [0.36, "rgba(255,253,247,0)"],
  ]);
  ctx.fillRect(wx, wy, ww, wh);
  ctx.restore();

  // The Safari scoped-darken fallback (dimmed pieces only; the boost leg is skipped, see notes).
  if (!env.filterOk && st.brightness < 0.999) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = `rgba(0,0,0,${r3(1 - st.brightness)})`;
    ctx.fill();
  }

  ctx.restore();
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
  const n = props.clips.length;
  const cam = framedCamera(frame, n, W, H);

  ctx.clearRect(0, 0, W, H);

  // The wall plaster on the fixed root (full frame, always covers — the tracking-seam fix).
  ctx.fillStyle = cssLinearGradient(ctx, 0, 0, W, H, 180, [
    [0, "#efede8"],
    [0.46, "#eceae5"],
    [1, "#e4e1da"],
  ]);
  ctx.fillRect(0, 0, W, H);
  // The room wall-wash pool (fixed light on the gate).
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.28 * H,
    rx: 0.8 * W,
    ry: 0.6 * H,
    stops: [
      [0, "rgba(255,255,255,0.45)"],
      [0.6, "rgba(255,255,255,0)"],
    ],
  });

  // Floor plane (parallax, landscape only) — a wide band so its edges never enter view.
  if (landscape) {
    ctx.save();
    ctx.translate(-cam.camMain * 0.42, 0);
    const fx = -main * 4;
    const fw = main * 9;
    const fy = H * 0.91;
    const fh = H * 0.09;
    ctx.fillStyle = cssLinearGradient(ctx, fx, fy, fw, fh, 180, [
      [0, "#e4e1da"],
      [1, "#d6d2c9"],
    ]);
    ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = "rgba(0,0,0,0.06)"; // the inset top lip seating the floor
    ctx.fillRect(fx, fy, fw, 1);
    ctx.restore();
  }

  // FRAMES plane: CSS `translate(-camMain) scale(soloPush)` about "left center" / "center top" —
  // both resolve to the page point (W/2, H/2) given the plane's placement.
  ctx.save();
  const planeX = landscape ? W / 2 : 0;
  const planeY = landscape ? 0 : H / 2;
  const olx = landscape ? 0 : W / 2; // the transform origin in plane-local coords
  const oly = landscape ? H / 2 : 0;
  ctx.translate(planeX + olx, planeY + oly);
  ctx.translate(landscape ? -cam.camMain : 0, landscape ? 0 : -cam.camMain);
  ctx.scale(cam.soloPush, cam.soloPush);
  ctx.translate(-olx, -oly);
  const scaledPlane = cam.soloPush !== 1;

  for (let i = 0; i < n; i++) {
    const st = framedPieceState(
      cam.travel,
      i,
      props.clips[i],
      n,
      props.seed,
      W,
      H,
    );
    // Cull pieces fully out of view along the main axis (skip when the solo push scales the CTM).
    if (!scaledPlane) {
      const margin = Math.max(st.frameW, st.frameH) * 0.25;
      const devMain =
        (landscape ? planeX + st.left : planeY + st.top) - cam.camMain;
      const extent = landscape ? st.frameW : st.frameH;
      if (devMain + extent + margin < 0 || devMain - margin > main) continue;
    }
    drawPiece(
      ctx,
      st,
      props,
      props.clips[i],
      assets.clips[i] ?? null,
      env,
      px,
      scaledPlane,
    );
  }
  ctx.restore();

  // SIGNATURE — the warm picture-light that swells as the dolly arrives at each piece.
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.42 * H,
    rx: 0.42 * W,
    ry: 0.46 * H,
    stops: [
      [0, `rgba(255,246,228,${r3(cam.spotA)})`],
      [0.4, `rgba(255,242,220,${r3(cam.spotA * 0.4)})`],
      [0.64, "rgba(255,242,220,0)"],
    ],
    composite: "screen",
  });
  // A whisper of warm-grey vignette (the white cube stays bright).
  fillEllipticalGradient(ctx, W, H, {
    cx: 0.5 * W,
    cy: 0.42 * H,
    rx: 1.0 * W,
    ry: 0.9 * H,
    stops: [
      [0.64, "rgba(120,116,108,0)"],
      [1, "rgba(120,116,108,0.11)"],
    ],
  });
}

export const FRAMED: ReelStyle = {
  id: "framed",
  duration: (props) => framedDuration(props.clips.length),
  // Fully procedural over the plain decoded clips.
  assetNeeds: () => ({ washes: false, grain: false, haloFilter: null }),
  draw,
};
