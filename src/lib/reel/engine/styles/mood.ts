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

import { fitClip } from "../../composition/framing";
import type { PlannedClip } from "../../composition/layout";
import type { ReelProps, ReelTheme } from "../../composition/reel-types";
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
import { frameStateAt, planFor } from "../timeline";

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
 *  (a layer is multiple draws; per-draw globalAlpha would double-blend backdrop + media + shadow). */
function drawClipLayer(
  ctx: CanvasRenderingContext2D,
  clip: PlannedClip,
  localFrame: number,
  alpha: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  if (alpha <= 0) return;
  if (alpha >= 1) {
    paintClipLayer(ctx, clip, localFrame, props, assets, env);
    return;
  }
  const scratch = env.scratch();
  scratch.clearRect(0, 0, env.width, env.height);
  paintClipLayer(scratch, clip, localFrame, props, assets, env);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch.canvas, 0, 0);
  ctx.restore();
}

const PORTED_TRANSITIONS = new Set(["fade", "cut"]);

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
  if (sig.weave || sig.pulse || sig.flashOnCut || sig.whipBlur) {
    env.report(
      "composition signatures (weave/pulse/flash/whipBlur) are not ported yet; skipped",
    );
  }

  const state = frameStateAt(plan, frame);

  // TransitionSeries fade semantics: the exiting clip stays fully opaque below; the entering clip
  // fades in on top with the timing curve's progress. Outside a gap window there is one layer.
  if (state.under) {
    const under = plan.clips[state.under.clipIndex];
    drawClipLayer(ctx, under, state.under.localFrame, 1, props, assets, env);
  }
  let topAlpha = 1;
  if (state.transition) {
    if (!PORTED_TRANSITIONS.has(state.transition.gap.kind)) {
      env.report(
        `transition "${state.transition.gap.kind}" is not ported yet; rendered as a fade`,
      );
    }
    topAlpha = state.transition.progress;
  }
  const top = plan.clips[state.top.clipIndex];
  drawClipLayer(ctx, top, state.top.localFrame, topAlpha, props, assets, env);

  // Overlays persist across the whole reel (they sit OUTSIDE the TransitionSeries in Reel.tsx),
  // drawn in the theme's declared order like the Overlay map.
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
    } else {
      env.report(`overlay "${kind}" is not ported yet; skipped`);
    }
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
