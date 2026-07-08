// The engine STYLE CONTRACT: what a ported style must provide, and the environment its draw runs in.
// This is the canvas twin of the Remotion split (style-registry = pure ids, style-render = component +
// duration): a style here is { duration, assetNeeds, draw } instead of a React component. draw() is a
// pure function of (frame, props, assets) so the SAME pixels come out of the live rAF player and the
// frame-stepped encode loop, which is the whole Plan-A architecture (player == export).
//
// Design decisions the next 13 style ports should keep:
// - duration(props) stays pure arithmetic (planFor / a treatment's own math), mirroring styleDuration,
//   so players and encoders can size themselves without touching a canvas.
// - assetNeeds(props) declares derived per-clip assets (today: the pre-blurred washes) so assets.ts
//   builds them ONCE at load; draw() must never decode or blur inside the frame loop.
// - draw() renders ONE output frame in composition space (env.width x env.height) and must not
//   allocate canvases itself; layer compositing goes through env.scratch() (reused across frames).
// - Missing capability (ctx.filter, an unported overlay) => env.report(...) + a graceful skip, never
//   a throw: a reel with a weaker look still beats a crashed reel.

import type { ReelProps } from "../composition/reel-types";
import type { ReelAssets } from "./assets";

export type DrawEnv = {
  /** Composition-space output size (from reelDimensions, never hard-coded). */
  width: number;
  height: number;
  /** Whether ctx.filter accepts CSS filter strings here (Safari: false; grades are skipped there). */
  filterOk: boolean;
  /**
   * Reusable same-size scratch contexts, one per SLOT (created lazily, reused across frames).
   * Slots keep concurrent uses from clobbering each other within one frame: 0 = the partial-alpha
   * layer composite (fading a clip layer as ONE image; per-draw globalAlpha would double-blend
   * overlaps), 1 = the composition-signature content layer (weave/pulse/whip wrap the whole clip
   * stack), 2 = the whip-blur downsample. Default slot 0.
   */
  scratch: (slot?: number) => CanvasRenderingContext2D;
  /** Deduplicated capability/feature-gap reporting (console in dev, surfaced by the harness). */
  report: (message: string) => void;
};

export type ReelStyle = {
  /** The catalog styleId this implements (must match style-registry.ts). */
  id: string;
  /** Total output frames for these props; must equal the Remotion styleDuration for the same id. */
  duration: (props: ReelProps) => number;
  /** Which derived assets draw() consumes (built once by loadReelAssets): per-clip washes/halos +
   *  the shared grain tile. haloFilter carries the theme's full pre-blur color chain because the
   *  bright-pass must be baked BEFORE the blur (see buildHalo). */
  assetNeeds: (props: ReelProps) => {
    washes: boolean;
    grain?: boolean;
    haloFilter?: string | null;
  };
  /** Render output frame `frame` into ctx. Deterministic per (frame, props, assets). */
  draw: (
    ctx: CanvasRenderingContext2D,
    frame: number,
    props: ReelProps,
    assets: ReelAssets,
    env: DrawEnv,
  ) => void;
};
