"use client";

// The live canvas reel player: a one-prop seam ({ reelProps }) driving the SAME drawReelFrame the
// encoder steps, so the preview pixels ARE the export pixels (one draw fn = player + export). rAF
// accumulates play time and renders the FLOORED frame index, so live playback samples exactly the
// discrete frames the mp4 will contain.
//
// It plays on mount (silent, so autoplay is never blocked), loops, shows controls, is visibility-aware
// (rAF pauses while the tab is hidden; time freezes so it resumes where it was), and reduced-motion
// respectful (prefers-reduced-motion starts paused on frame 0; play is one tap away).
//
// The optional `frame` prop makes the player CONTROLLED (draw exactly that frame, no rAF): the canvas
// style lab scrub-locks the player onto one frame with it. Leave it undefined for normal playback.

import { Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { FPS, reelDimensions } from "./constants";
import type { ReelProps } from "./reel-types";
import { loadReelAssets, type ReelAssets } from "./assets";
import type { DrawEnv } from "./contract";
import {
  drawReelFrame,
  engineStyleDuration,
  makeDrawEnv,
  resolveEngineStyle,
} from "./registry";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function CanvasReelPlayer({
  reelProps,
  frame,
  showControls = true,
  onReport,
}: {
  reelProps: ReelProps;
  /** Controlled frame: render exactly this frame and stop the clock (the harness scrub-lock). */
  frame?: number;
  showControls?: boolean;
  /** Capability-gap reports from the draw (deduplicated), surfaced by the harness. */
  onReport?: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<DrawEnv | null>(null);
  const timeRef = useRef(0); // seconds into the reel timeline (frozen while hidden/paused)

  // Assets are keyed to the props object that loaded them, so a props change instantly invalidates
  // the stale set (no synchronous setState reset needed) while the new decode is in flight.
  const [loaded, setLoaded] = useState<{
    props: ReelProps;
    assets: ReelAssets;
  } | null>(null);
  const assets = loaded && loaded.props === reelProps ? loaded.assets : null;

  // Reduced motion is an external system; the server snapshot says "reduced" so SSR/hydration render
  // paused, then the client store flips autoplay on where allowed.
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !prefersReduced;
  const [shownFrame, setShownFrame] = useState(0);

  const durationInFrames = useMemo(
    () => Math.max(1, engineStyleDuration(reelProps.styleId, reelProps)),
    [reelProps],
  );
  const { width, height } = reelDimensions(reelProps.orientation);
  const landscape = width > height;
  const controlled = frame !== undefined;

  const onReportRef = useRef(onReport);
  useEffect(() => {
    onReportRef.current = onReport;
  }, [onReport]);

  const drawFrame = useCallback(
    (f: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !assets) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // The env carries the reusable scratch layer; rebuild it when the orientation resizes the canvas.
      if (
        !envRef.current ||
        envRef.current.width !== canvas.width ||
        envRef.current.height !== canvas.height
      ) {
        envRef.current = makeDrawEnv(canvas, (m) => onReportRef.current?.(m));
      }
      drawReelFrame(ctx, f, reelProps, assets, envRef.current);
    },
    [reelProps, assets],
  );

  // Decode the clips ONCE per props change (assets.ts dedupes urls + builds any washes the style needs).
  useEffect(() => {
    const controller = new AbortController();
    loadReelAssets(reelProps.clips, {
      ...resolveEngineStyle(reelProps.styleId).assetNeeds(reelProps),
      frame: reelDimensions(reelProps.orientation),
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        timeRef.current = 0; // a fresh cut starts from the top
        setLoaded({ props: reelProps, assets: result });
      })
      .catch(() => {
        // Only the abort path rejects (per-clip failures resolve as null holds); nothing to do.
      });
    return () => controller.abort();
  }, [reelProps]);

  // The clock: rAF while playing; a single draw when controlled or paused.
  useEffect(() => {
    if (!assets) return;

    if (controlled) {
      const f = Math.min(Math.max(0, Math.floor(frame)), durationInFrames - 1);
      timeRef.current = f / FPS;
      drawFrame(f);
      return;
    }

    if (!playing) {
      drawFrame(Math.floor(timeRef.current * FPS) % durationInFrames);
      return;
    }

    let raf = 0;
    let lastTick: number | null = null;
    let lastDrawn = -1;
    const tick = (now: number) => {
      if (lastTick !== null) timeRef.current += (now - lastTick) / 1000;
      lastTick = now;
      const f = Math.floor(timeRef.current * FPS) % durationInFrames;
      if (f !== lastDrawn) {
        drawFrame(f);
        lastDrawn = f;
        setShownFrame(f);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause the clock (not just the paint) while the tab is hidden; resume where it left off.
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      lastTick = null;
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [assets, playing, controlled, frame, durationInFrames, drawFrame]);

  const scrubTo = (f: number) => {
    setUserPlaying(false);
    timeRef.current = f / FPS;
    drawFrame(f);
    setShownFrame(f);
  };

  return (
    <div
      className={`mx-auto w-full ${landscape ? "max-w-[640px]" : "max-w-[360px]"}`}
    >
      <div className="overflow-hidden rounded-xl border bg-black shadow-sm">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            width: "100%",
            aspectRatio: `${width} / ${height}`,
          }}
        />
      </div>
      {showControls && !controlled ? (
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserPlaying(!playing)}
            aria-label={playing ? "Pause" : "Play"}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border transition-transform ease-emphasis active:scale-95"
          >
            {playing ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={durationInFrames - 1}
            value={Math.min(shownFrame, durationInFrames - 1)}
            onChange={(e) => scrubTo(Number(e.target.value))}
            aria-label="Scrub"
            className="w-full accent-foreground"
          />
          <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
            {shownFrame}/{durationInFrames - 1}
          </span>
        </div>
      ) : null}
    </div>
  );
}
