// The GENERIC MOOD RENDERER: every media-first mood (Cinematic/Film/Pulse/Kinetic/Editorial/Sunset/
// Noir/Float) is this one draw parameterized by props.theme (already resolved upstream in
// build-reel-props), exactly like the Remotion side renders every mood through the one <Reel>.
// A mood's registry entry is moodStyle(id) — the per-style files stay thin bindings.
//
// Remotion sources of truth per behavior (cite these when tuning, port changes BOTH ways):
// - layers + transition compositing: Reel.tsx (TransitionSeries assembly) + the presentation math in
//   @remotion/transitions/dist/presentations/{fade,slide,wipe,flip,clock-wipe}.js, ported to pure
//   geometry in ../transitions.ts.
// - clip media (cover/fit, backdrop, framed shadow, inset, grade, halation): clip-media.tsx.
// - Ken-Burns characters: Reel.tsx computeMotion, ported in ../motion.ts.
// - composition signatures (weave/pulse/flash/whipBlur): Reel.tsx, ported in ../signatures.ts.
// - overlays: effects.tsx (letterbox is LANDSCAPE-ONLY, vignette is a farthest-corner ellipse; the
//   mood signature overlays grain/bloom/lightsweep/softedge live in ../overlays.ts).
//
// NOT yet ported (report + graceful skip; no MOOD needs them — they belong to the treatment/lab
// slices): lightleak/flares/colorwash overlays and the confetti/bokeh/sparkle particle fields.

import { fitClip } from "../framing";
import type { PlannedClip } from "../layout";
import type { ReelProps, ReelTheme } from "../reel-types";
import type { ReelAssets } from "../assets";
import {
  containRect,
  coverRect,
  drawCover,
  drawGrain,
  drawLetterbox,
  drawVignette,
} from "../canvas2d";
import type { DrawEnv, ReelStyle } from "../contract";
import { computeMotion, dampForFit, type Move } from "../motion";
import { drawBloom, drawLightsweep, drawSoftedge } from "../overlays";
import { signatureFrameState } from "../signatures";
import { clipStartFrames, frameStateAt, planFor } from "../timeline";
import {
  clockWipePath,
  flipScale,
  slideOffsets,
  wipeEnterPolygon,
} from "../transitions";

function paintClipLayer(
  ctx: CanvasRenderingContext2D,
  clip: PlannedClip,
  localFrame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  const { width: W, height: H } = env;
  const theme: ReelTheme = props.theme;
  const sig = theme.signature ?? {};
  const asset = assets.clips[clip.index] ?? null;

  // Posterless/failed media: a solid theme-background hold (the timeline still reflects curation),
  // exactly like Reel.tsx's ClipLayer empty-url branch.
  if (!clip.url || !asset) {
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const raw = computeMotion(
    theme.motionStyle ?? "drift",
    localFrame,
    clip.durationInFrames,
    clip.motion,
    W,
  );
  // fitClip decides from the CLIP's declared source dims (unknown -> cover, the safe default).
  const fit = fitClip(clip.width, clip.height, W, H);
  const mv: Move = fit === "fit" ? dampForFit(raw) : raw;

  const inset = sig.inset ?? 0;
  const showBackdrop = fit === "fit" || inset > 0;

  if (showBackdrop) {
    // clip-media.tsx baseColor: paper -> sig.paper, none -> transparent, else the theme background.
    if (theme.backdrop === "paper") {
      ctx.fillStyle = sig.paper ?? "#f2efe7";
      ctx.fillRect(0, 0, W, H);
    } else if (theme.backdrop !== "none") {
      ctx.fillStyle = theme.background ?? "#0a0a0a";
      ctx.fillRect(0, 0, W, H);
    }
    if (theme.backdrop === "blur") {
      if (asset.wash) {
        // The Noir/Float negative space: a cover draw of the clip's own pre-blurred wash, darkened
        // (CSS: `${grade} brightness(0.55) blur(46px)` + scale(1.1); the wash IS the blur).
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1.1, 1.1);
        if (env.filterOk) ctx.filter = `${theme.grade} brightness(0.55)`;
        drawCover(ctx, asset.wash, -W / 2, -H / 2, W, H);
        ctx.restore();
        if (!env.filterOk) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        env.report('backdrop "blur" needs washes: declare them in assetNeeds');
      }
    }
  }

  // The (possibly inset) media box; content clips at its edge like the overflow-hidden box div.
  const bx = inset * W;
  const by = inset * H;
  const bw = W - 2 * bx;
  const bh = H - 2 * by;

  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.clip();

  // CSS individual transform properties resolve translate -> rotate -> scale about the box center.
  ctx.translate(bx + bw / 2 + mv.tx, by + bh / 2 + mv.ty);
  ctx.rotate((mv.rotate * Math.PI) / 180);
  ctx.scale(mv.scale, mv.scale);

  const rect =
    fit === "cover"
      ? coverRect(asset.width, asset.height, bw, bh)
      : containRect(asset.width, asset.height, bw, bh);

  ctx.save();
  if (env.filterOk) {
    ctx.filter = theme.grade;
  } else {
    env.report("grade skipped: ctx.filter is unsupported in this browser");
  }
  // A framed (contained, no inset card) photo floats on a soft drop-shadow (clip-media isFramed).
  if (fit === "fit" && inset <= 0) {
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
  }
  ctx.drawImage(
    asset.image,
    -bw / 2 + rect.x,
    -bh / 2 + rect.y,
    rect.w,
    rect.h,
  );
  ctx.restore(); // drop the grade filter + shadow before the halo (its chain is baked in)

  // Halation (Film/Noir): the pre-built bright-pass halo rides the SAME motion transform + fit rect
  // as the media, screen-blended at the signature opacity (clip-media's halation Img; photos only).
  if (sig.halation && clip.type === "photo") {
    if (asset.halo) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = sig.halation;
      ctx.drawImage(
        asset.halo,
        -bw / 2 + rect.x,
        -bh / 2 + rect.y,
        rect.w,
        rect.h,
      );
      ctx.restore();
    } else {
      env.report("halation needs halos: declare haloFilter in assetNeeds");
    }
  }

  ctx.restore();
}

/** Draw one clip layer, at full alpha directly or composited through the scratch layer when fading
 *  (a layer is multiple draws; per-draw globalAlpha would double-blend backdrop + media + shadow).
 *  `prepare` applies a transition's whole-layer transform/clip (slide translate, wipe/clockWipe
 *  clip, flip scale) inside the save/restore that wraps the layer's paint. */
function drawClipLayer(
  ctx: CanvasRenderingContext2D,
  clip: PlannedClip,
  localFrame: number,
  alpha: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
  prepare?: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (alpha <= 0) return;
  if (alpha >= 1) {
    ctx.save();
    prepare?.(ctx);
    paintClipLayer(ctx, clip, localFrame, props, assets, env);
    ctx.restore();
    return;
  }
  const scratch = env.scratch();
  scratch.clearRect(0, 0, env.width, env.height);
  scratch.save();
  prepare?.(scratch);
  paintClipLayer(scratch, clip, localFrame, props, assets, env);
  scratch.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch.canvas, 0, 0);
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
  const theme = props.theme;
  const plan = planFor(props);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, W, H);
  if (plan.clips.length === 0) return;

  const sig = theme.signature ?? {};
  const state = frameStateAt(plan, frame);

  // TransitionSeries semantics: inside a gap window the exiting clip renders below (under) and the
  // entering clip on top; the KIND decides how the two composite for the timing curve's progress
  // (transitions.ts carries the per-kind geometry ported from @remotion/transitions). Outside a gap
  // window there is exactly one full-alpha layer. A closure because the composition signatures
  // (below) may need the whole stack on a scratch layer instead of the output canvas.
  const paintClipStack = (out: CanvasRenderingContext2D): void => {
    const top = plan.clips[state.top.clipIndex];
    const tr = state.transition;
    if (!tr || !state.under) {
      drawClipLayer(out, top, state.top.localFrame, 1, props, assets, env);
      return;
    }
    const under = plan.clips[state.under.clipIndex];
    const uf = state.under.localFrame;
    const tf = state.top.localFrame;
    const p = tr.progress;
    const kind = tr.gap.kind;
    const dir = tr.gap.dir ?? "from-left";
    if (kind === "slide") {
      // Both layers move: the entering slide pushes the exiting one out (each fully opaque).
      const { enter, exit } = slideOffsets(dir, p);
      drawClipLayer(out, under, uf, 1, props, assets, env, (c) =>
        c.translate(exit.x * W, exit.y * H),
      );
      drawClipLayer(out, top, tf, 1, props, assets, env, (c) =>
        c.translate(enter.x * W, enter.y * H),
      );
    } else if (kind === "wipe") {
      // The under layer draws whole; the top clips to the wipe polygon (the in/out polygons tile
      // the frame, so this equals the DOM's clip-both rendering; see transitions.ts).
      drawClipLayer(out, under, uf, 1, props, assets, env);
      const poly = wipeEnterPolygon(dir, p);
      drawClipLayer(out, top, tf, 1, props, assets, env, (c) => {
        c.beginPath();
        poly.forEach(([x, y], i) =>
          i === 0 ? c.moveTo(x * W, y * H) : c.lineTo(x * W, y * H),
        );
        c.closePath();
        c.clip();
      });
    } else if (kind === "flip") {
      // Backface culling means at most one layer is visible per frame (both at 90deg = neither).
      const exit = flipScale(dir, p, "exit");
      if (exit.visible) {
        drawClipLayer(out, under, uf, 1, props, assets, env, (c) => {
          c.translate(W / 2, H / 2);
          c.scale(
            exit.axis === "x" ? exit.scale : 1,
            exit.axis === "y" ? exit.scale : 1,
          );
          c.translate(-W / 2, -H / 2);
        });
      }
      const enter = flipScale(dir, p, "enter");
      if (enter.visible) {
        drawClipLayer(out, top, tf, 1, props, assets, env, (c) => {
          c.translate(W / 2, H / 2);
          c.scale(
            enter.axis === "x" ? enter.scale : 1,
            enter.axis === "y" ? enter.scale : 1,
          );
          c.translate(-W / 2, -H / 2);
        });
      }
    } else if (kind === "clockWipe") {
      drawClipLayer(out, under, uf, 1, props, assets, env);
      drawClipLayer(out, top, tf, 1, props, assets, env, (c) => {
        c.beginPath();
        clockWipePath(c, W, H, p);
        c.clip();
      });
    } else {
      // fade + cut (a 2-frame fade): under opaque below, top fades in with the eased progress.
      drawClipLayer(out, under, uf, 1, props, assets, env);
      drawClipLayer(out, top, tf, p, props, assets, env);
    }
  };

  // Composition signatures (Reel.tsx): weave/pulse transform + whip blur wrap the WHOLE clip stack
  // (they sit on the AbsoluteFill around the TransitionSeries, INSIDE the overlays; the flash lands
  // after the overlays, below). When active, the stack renders to the content scratch (slot 1; the
  // fade composite holds slot 0) and comes back blurred and/or transformed.
  const ss = signatureFrameState(
    sig,
    frame,
    props.seed,
    clipStartFrames(plan),
    plan.gaps,
  );
  const hasTransform =
    ss.weaveX !== 0 || ss.weaveY !== 0 || ss.pulseScale !== 1;
  const hasBlur = ss.whip > 0.05; // Reel.tsx's own threshold
  if (hasTransform || hasBlur) {
    const content = env.scratch(1);
    content.clearRect(0, 0, W, H);
    paintClipStack(content);
    let src: HTMLCanvasElement = content.canvas;
    const srcX = 0; // stages stack vertically, so only y moves
    let srcY = 0;
    let sw = W;
    let sh = H;
    // The whip blur. Where ctx.filter works (the player/export browsers), a REAL blur() on the
    // compositing draw = exact CSS parity with Reel.tsx's `filter: blur(whip px)`. The Safari
    // fallback is a two-stage downsample chain in the aux scratch (slot 2; regions cleared +2px so
    // edge smoothing can't bleed stale pixels), calibrated in the harness against the real filter
    // (k ~ 1.8 * whip; downsample blurs saturate below the gaussian, a Safari-only conscious
    // delta on a 2-5 frame window mid-slide).
    if (hasBlur && !env.filterOk) {
      const k = Math.max(1.15, ss.whip * 1.8);
      const aux = env.scratch(2);
      aux.imageSmoothingEnabled = true;
      aux.imageSmoothingQuality = "high";
      sw = Math.max(2, Math.round(W / k));
      sh = Math.max(2, Math.round(H / k));
      if (k <= 2) {
        aux.clearRect(0, 0, Math.min(W, sw + 2), Math.min(H, sh + 2));
        aux.drawImage(content.canvas, 0, 0, W, H, 0, 0, sw, sh);
      } else {
        // Stage 1: half size at y=0; stage 2: the remaining 2/k factor stacked below it.
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
    // CSS order: the blur filters the element, THEN translate(weave) scale(pulse) maps it (about
    // the element center, the transform-origin default).
    if (hasBlur && env.filterOk) {
      ctx.filter = `blur(${ss.whip}px)`;
    }
    ctx.translate(ss.weaveX + W / 2, ss.weaveY + H / 2);
    ctx.scale(ss.pulseScale, ss.pulseScale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, srcX, srcY, sw, sh, -W / 2, -H / 2, W, H);
    ctx.restore();
  } else {
    paintClipStack(ctx);
  }

  // Overlays persist across the whole reel (they sit OUTSIDE the TransitionSeries in Reel.tsx),
  // drawn in the theme's declared order like the Overlay map. t = whole-reel progress (the DOM
  // side's useCurrentFrame()/durationInFrames), which drives the animated ones.
  const t = plan.totalFrames > 0 ? frame / plan.totalFrames : 0;
  for (const kind of theme.overlays ?? []) {
    if (kind === "vignette") {
      drawVignette(ctx, W, H);
    } else if (kind === "letterbox") {
      drawLetterbox(ctx, W, H, frame);
    } else if (kind === "grain") {
      if (assets.grain) {
        drawGrain(ctx, W, H, assets.grain);
      } else {
        env.report(
          'the "grain" overlay needs its tile: declare grain in assetNeeds',
        );
      }
    } else if (kind === "bloom") {
      drawBloom(ctx, W, H, t);
    } else if (kind === "lightsweep") {
      drawLightsweep(ctx, W, H, t);
    } else if (kind === "softedge") {
      drawSoftedge(ctx, W, H);
    } else {
      env.report(`overlay "${kind}" is not ported yet; skipped`);
    }
  }

  // The cut-strobe flash (Pulse) renders LAST, over the overlays, exactly where Reel.tsx puts it
  // (the screen-blended white AbsoluteFill after the Overlay map).
  if (ss.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = ss.flash * 0.5;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

/** The halation pre-blur color chain (clip-media's filter string, minus the trailing blur the
 *  downsample chain replaces). Exported for the assetNeeds pins. */
export function halationFilterFor(theme: ReelTheme): string | null {
  return theme.signature?.halation
    ? `${theme.grade} brightness(0.5) contrast(2.4) saturate(1.15)`
    : null;
}

/** Bind the generic mood renderer to a catalog styleId (a mood's styleId === its themeId). */
export function moodStyle(id: string): ReelStyle {
  return {
    id,
    // The mood duration IS the plan's total (identical to styleDuration for a mood styleId).
    duration: (props) => Math.max(1, planFor(props).totalFrames),
    // Derived assets by theme: washes for the blur backdrop (Noir/Float), the grain tile for the
    // grain overlay (Film/Noir), halos for the halation signature (Film/Noir).
    assetNeeds: (props) => ({
      washes: props.theme.backdrop === "blur",
      grain: (props.theme.overlays ?? []).includes("grain"),
      haloFilter: halationFilterFor(props.theme),
    }),
    draw,
  };
}
