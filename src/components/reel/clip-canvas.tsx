"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets, type ReelAssets } from "@/lib/reel/engine/assets";
import { FPS, reelDimensions } from "@/lib/reel/engine/constants";
import type { DrawEnv } from "@/lib/reel/engine/contract";
import {
  drawReelFrame,
  engineStyleDuration,
  makeDrawEnv,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { cn } from "@/lib/utils";

/**
 * ONE CANVAS OF A CLIP: the hero that plays it and every look's still, drawn by the SAME
 * `drawReelFrame` the encoder steps, so what a maker watches is the file she gets.
 *
 * ★ WHY NOT `CanvasReelPlayer`. The shipped player owns its own play state (it starts paused under
 * reduced motion and only its own controls, a scrubber and a frame counter, can start it) and caps
 * itself at 360 px. The creator's hero needs play and pause from the room's own control, at the
 * size its box gives it, and the looks need a still each; so this is the player's draw path with
 * the state handed in: `playing` loops the clip, anything else draws `frame` and stops the clock.
 *
 * ★ WHAT KEEPS FOURTEEN LOOKS AND A HERO CHEAP: a look passes `frame` (one draw, no clock) and a
 * small `maxDim` (the backing store shrinks, the composition does not), every canvas decodes through
 * the shared bitmap cache (the hero and the fourteen looks cost one decode set), and the clock stops
 * while the tab is hidden (the time freezes, so it resumes where it was).
 */
export function ClipCanvas({
  props,
  playing = false,
  frame,
  maxDim,
  label,
  className,
}: {
  props: ReelProps;
  /** Loop the clip. Off, the canvas draws `frame` (or where the clock stopped) and waits. */
  playing?: boolean;
  /** The frame a still shows, and the one a paused hero rests on. */
  frame?: number;
  /** The backing store's longest side in pixels; the composition is drawn into it scaled. */
  maxDim?: number;
  /** What this picture is, for a reader with no pictures. */
  label: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<{ key: string; env: DrawEnv } | null>(null);
  const timeRef = useRef(0);

  const composition = useMemo(
    () => reelDimensions(props.orientation),
    [props.orientation],
  );
  const { width, height, scale } = useMemo(() => {
    const longest = Math.max(composition.width, composition.height);
    if (maxDim === undefined || maxDim >= longest) {
      return { ...composition, scale: null };
    }
    const ratio = maxDim / longest;
    const w = Math.max(2, Math.round(composition.width * ratio));
    const h = Math.max(2, Math.round(composition.height * ratio));
    return {
      width: w,
      height: h,
      scale: { x: w / composition.width, y: h / composition.height },
    };
  }, [composition, maxDim]);

  const duration = useMemo(
    () =>
      props.clips.length === 0
        ? 1
        : Math.max(1, engineStyleDuration(props.styleId, props)),
    [props],
  );

  // Assets are keyed to the props that loaded them, so a new clip never draws with the old set.
  const [loaded, setLoaded] = useState<{
    props: ReelProps;
    assets: ReelAssets;
  } | null>(null);
  const assets = loaded && loaded.props === props ? loaded.assets : null;

  useEffect(() => {
    if (props.clips.length === 0) return;
    const controller = new AbortController();
    loadReelAssets(props.clips, {
      ...resolveEngineStyle(props.styleId).assetNeeds(props),
      frame: { width, height },
      decode: sharedBitmapCache.decode,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        // A changed clip starts from its top: the new look's own opening, not the old one's middle.
        timeRef.current = 0;
        setLoaded({ props, assets: result });
      })
      .catch(() => {
        // Only an abort rejects (a still that fails to decode resolves as a colour hold).
      });
    return () => controller.abort();
  }, [props, width, height]);

  const draw = useCallback(
    (f: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !assets) return;
      const key = `${canvas.width}x${canvas.height}`;
      if (envRef.current?.key !== key) {
        envRef.current = {
          key,
          env: scale ? makeScaledDrawEnv(composition) : makeDrawEnv(canvas),
        };
      }
      const env = envRef.current.env;
      if (!scale) {
        drawReelFrame(ctx, f, props, assets, env);
        return;
      }
      ctx.setTransform(scale.x, 0, 0, scale.y, 0, 0);
      drawReelFrame(ctx, f, props, assets, env);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    [assets, composition, props, scale],
  );

  useEffect(() => {
    if (!assets) return;
    if (!playing) {
      const rest =
        frame !== undefined
          ? Math.floor(frame)
          : Math.floor(timeRef.current * FPS);
      const f = Math.min(Math.max(0, rest), duration - 1);
      timeRef.current = f / FPS;
      draw(f);
      return;
    }
    let raf = 0;
    let last: number | null = null;
    let drawn = -1;
    const tick = (now: number) => {
      if (last !== null) timeRef.current += (now - last) / 1000;
      last = now;
      const f = Math.floor(timeRef.current * FPS) % duration;
      if (f !== drawn) {
        draw(f);
        drawn = f;
      }
      raf = requestAnimationFrame(tick);
    };
    // The clock freezes rather than skips while the tab is hidden: `last = null` on every stop.
    const start = () => {
      cancelAnimationFrame(raf);
      last = null;
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [assets, playing, frame, duration, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      data-clip-canvas={assets ? "drawn" : "loading"}
      className={cn("block size-full bg-[oklch(0.16_0_0)]", className)}
    />
  );
}
