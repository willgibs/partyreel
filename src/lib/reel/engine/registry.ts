// The canvas engine's style registry + frame dispatch: the twin of style-render.tsx's StyleDispatch
// for draw functions instead of React components. ALL 14 catalog styles are ported (8 moods + 6
// treatments); engineSupports() remains the seam callers use to gate canvas vs the Remotion path.
//
// THE WATERMARK RULE (carried over from style-render.tsx, do not weaken): the free-tier watermark
// (the bottom-right lockup, T1 redesign; see drawWatermark) is stamped HERE, in the dispatch layer,
// after the style draws, so every style (mood or treatment) marks uniformly and a treatment reel can
// never export unmarked. props.watermark stays server-tier-derived.

import type { ReelProps } from "./reel-types";
import type { ReelAssets } from "./assets";
import { detectCtxFilter, drawWatermark } from "./canvas2d";
import type { DrawEnv, ReelStyle } from "./contract";
import { CARDDECK } from "./styles/carddeck";
import { CINEMATIC } from "./styles/cinematic";
import { FILMSTRIP } from "./styles/filmstrip";
import { FRAMED } from "./styles/framed";
import { moodStyle } from "./styles/mood";
import { PARALLAX } from "./styles/parallax";
import { POLAROID } from "./styles/polaroid";
import { SCATTERED } from "./styles/scattered";

/** The full ported catalog (keyed by catalog styleId). All 8 moods render through the one generic
 *  mood draw (styles/mood.ts) parameterized by props.theme, mirroring the Remotion <Reel>; each of
 *  the 6 treatments is its own bespoke port (styles/<treatment>.ts). */
export const ENGINE_STYLES: Record<string, ReelStyle> = {
  classic: CINEMATIC,
  editorial: moodStyle("editorial"),
  mono: moodStyle("mono"),
  warm: moodStyle("warm"),
  dreamy: moodStyle("dreamy"),
  golden: moodStyle("golden"),
  punchy: moodStyle("punchy"),
  kinetic: moodStyle("kinetic"),
  polaroid: POLAROID,
  filmstrip: FILMSTRIP,
  scattered: SCATTERED,
  framed: FRAMED,
  carddeck: CARDDECK,
  parallax: PARALLAX,
};

/** Whether the canvas engine can render this styleId natively (vs the Remotion fallback). */
export function engineSupports(styleId: string | null | undefined): boolean {
  return Boolean(styleId && ENGINE_STYLES[styleId]);
}

/** Resolve a styleId to its engine style, falling back to Cinematic like resolveStyleEntry does. */
export function resolveEngineStyle(
  styleId: string | null | undefined,
): ReelStyle {
  return ENGINE_STYLES[styleId ?? ""] ?? CINEMATIC;
}

/** The per-style total frame count (drop-in for styleDuration on the engine side). */
export function engineStyleDuration(
  styleId: string | null | undefined,
  props: ReelProps,
): number {
  return resolveEngineStyle(styleId).duration(props);
}

/** Render one output frame: the style's draw + the uniform watermark stamp. */
export function drawReelFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  props: ReelProps,
  assets: ReelAssets,
  env: DrawEnv,
): void {
  resolveEngineStyle(props.styleId).draw(ctx, frame, props, assets, env);
  if (props.watermark) {
    drawWatermark(ctx, env.width, env.height);
  }
}

/** Build the DrawEnv for a target canvas: probed capabilities, a lazily-created reusable scratch
 *  layer (one per env, reused every frame), and once-only capability reporting. */
export function makeDrawEnv(
  canvas: HTMLCanvasElement,
  onReport?: (message: string) => void,
): DrawEnv {
  const width = canvas.width;
  const height = canvas.height;
  const scratchCtxs: (CanvasRenderingContext2D | null)[] = [];
  const reported = new Set<string>();
  return {
    width,
    height,
    filterOk: detectCtxFilter(),
    scratch: (slot = 0) => {
      let ctx = scratchCtxs[slot];
      if (!ctx) {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        ctx = c.getContext("2d");
        if (!ctx)
          throw new Error("2d context unavailable for the scratch layer");
        scratchCtxs[slot] = ctx;
      }
      return ctx;
    },
    report: (message) => {
      if (reported.has(message)) return;
      reported.add(message);
      console.warn(`[reel-engine] ${message}`);
      onReport?.(message);
    },
  };
}

/**
 * A module-level pool of FULL-composition-size scratch canvases, keyed `${w}x${h}` -> slot index.
 *
 * WHY pooled (and not per-env like makeDrawEnv's): the style rail mounts 14 thumb players at once
 * and each needs up to 4 scratch slots at FULL composition size (1080x1920 x 4 bytes ~ 8 MB each).
 * Per-env that is ~450 MB of canvas backing store for thumbnails. Pooled it is at most 4.
 *
 * ★ SAFETY INVARIANT (do not break): a frame draw is fully SYNCHRONOUS. drawReelFrame runs to
 * completion — no await, no rAF yield — before any other player's draw can begin, so two envs can
 * never hold the same scratch simultaneously. Every consumer also clearRect()s its slot before
 * painting (scene2d.drawAlphaLayer / drawLayerFiltered, mood.ts), so no pixels bleed between envs.
 * If a draw ever gains an async step, this pool MUST go back to per-env allocation.
 */
const scaledScratchPool = new Map<
  string,
  (CanvasRenderingContext2D | null)[]
>();

/**
 * The DrawEnv for a DOWNSCALED canvas (the style-rail thumbs). It reports the FULL composition dims,
 * because every style computes its geometry from env.width/height and must keep thinking full-res —
 * the shrink is a single pre-scale transform the CALLER brackets the draw with (see player.tsx's
 * maxDim). Scratch layers are therefore full-res too: a style draws into one natural-size and
 * blits it at (0,0), which the caller's transform lands correctly on the small canvas.
 *
 * `frame` is the FULL composition size (reelDimensions(orientation)), NOT the canvas backing size.
 * (Deviation from the plan's sketched `makeScaledDrawEnv(canvas, frame, …)`: the canvas argument
 * would be unused — the env deliberately ignores the backing store — so it is dropped.)
 */
export function makeScaledDrawEnv(
  frame: { width: number; height: number },
  onReport?: (message: string) => void,
): DrawEnv {
  const { width, height } = frame;
  const key = `${width}x${height}`;
  const reported = new Set<string>();
  return {
    width,
    height,
    filterOk: detectCtxFilter(),
    scratch: (slot = 0) => {
      let slots = scaledScratchPool.get(key);
      if (!slots) {
        slots = [];
        scaledScratchPool.set(key, slots);
      }
      let ctx = slots[slot];
      if (!ctx) {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        ctx = c.getContext("2d");
        if (!ctx)
          throw new Error("2d context unavailable for the scratch layer");
        slots[slot] = ctx;
      }
      return ctx;
    },
    report: (message) => {
      if (reported.has(message)) return;
      reported.add(message);
      console.warn(`[reel-engine] ${message}`);
      onReport?.(message);
    },
  };
}
