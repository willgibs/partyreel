// The canvas engine's style registry + frame dispatch: the twin of style-render.tsx's StyleDispatch
// for draw functions instead of React components. Grows one entry per ported style; until all 14 land,
// engineSupports() lets callers decide whether to render a style on canvas or keep the Remotion path.
//
// THE WATERMARK RULE (carried over from style-render.tsx, do not weaken): the free-tier watermark
// (the bottom-right lockup, T1 redesign; see drawWatermark) is stamped HERE, in the dispatch layer,
// after the style draws, so every style (mood or treatment) marks uniformly and a treatment reel can
// never export unmarked. props.watermark stays server-tier-derived.

import type { ReelProps } from "../composition/reel-types";
import type { ReelAssets } from "./assets";
import { detectCtxFilter, drawWatermark } from "./canvas2d";
import type { DrawEnv, ReelStyle } from "./contract";
import { CINEMATIC } from "./styles/cinematic";
import { FILMSTRIP } from "./styles/filmstrip";
import { moodStyle } from "./styles/mood";
import { POLAROID } from "./styles/polaroid";

/** The styles ported to canvas so far (keyed by catalog styleId). All 8 moods render through the one
 *  generic mood draw (styles/mood.ts) parameterized by props.theme, mirroring the Remotion <Reel>;
 *  the 6 treatments land one bespoke port at a time (styles/<treatment>.ts). */
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
