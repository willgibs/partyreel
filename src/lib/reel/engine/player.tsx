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
//
// The optional `maxDim` prop makes it a THUMB: same draw, smaller backing store (see the maxDim block
// below). Absent, the full-res path is untouched — same statements, same pixels, so no RENDER_VERSION
// concern.

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
import { sharedBitmapCache } from "./asset-cache";
import { loadReelAssets, type ReelAssets } from "./assets";
import type { DrawEnv } from "./contract";
import {
  drawReelFrame,
  engineStyleDuration,
  makeDrawEnv,
  makeScaledDrawEnv,
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
  maxDim,
  showControls = true,
  onReport,
}: {
  reelProps: ReelProps;
  /** Controlled frame: render exactly this frame and stop the clock (the harness scrub-lock). */
  frame?: number;
  /**
   * Cap the canvas's LONGEST backing-store dimension at this many pixels (the style-rail thumbs pass
   * ~216). Same draw code, same composition geometry — only the rasterization is smaller, which is
   * where a thumb's cost actually lives. Omit for the full-res hero.
   */
  maxDim?: number;
  showControls?: boolean;
  /** Capability-gap reports from the draw (deduplicated), surfaced by the harness. */
  onReport?: (message: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<DrawEnv | null>(null);
  // The backing-store size the current env was built for. NOT `env.width` — a SCALED env reports the
  // FULL composition dims by design, so the old `env.width !== canvas.width` guard would rebuild it
  // every frame on a thumb. Equivalent for the full-res path (there env.width === canvas.width).
  const envKeyRef = useRef("");
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
  // Composition space: what every style computes its geometry in, and what the mp4 is encoded at.
  // Memoized so it can be a stable effect/callback dependency.
  const composition = useMemo(
    () => reelDimensions(reelProps.orientation),
    [reelProps.orientation],
  );
  const landscape = composition.width > composition.height;
  const controlled = frame !== undefined;

  // The THUMB path. `width`/`height` below are the canvas BACKING STORE; the draw still runs in full
  // composition space and is squeezed onto it by one pre-scale transform (in drawFrame). Two scales,
  // one per axis, both derived from the ROUNDED backing dims: rounding makes them differ by <0.5%
  // (invisible), and a single uniform scale would instead leave a sub-pixel transparent sliver on one
  // edge. Nothing in the engine calls setTransform (verified), so the pre-scale composes cleanly with
  // every style's own save/restore.
  const { width, height, scaleX, scaleY } = useMemo(() => {
    const longest = Math.max(composition.width, composition.height);
    if (maxDim === undefined || maxDim >= longest) {
      return { ...composition, scaleX: 1, scaleY: 1 };
    }
    const ratio = maxDim / longest;
    const w = Math.max(2, Math.round(composition.width * ratio));
    const h = Math.max(2, Math.round(composition.height * ratio));
    return {
      width: w,
      height: h,
      scaleX: w / composition.width,
      scaleY: h / composition.height,
    };
  }, [composition, maxDim]);
  const scaled = scaleX !== 1 || scaleY !== 1;

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
      const envKey = `${canvas.width}x${canvas.height}`;
      if (!envRef.current || envKeyRef.current !== envKey) {
        const report = (m: string) => onReportRef.current?.(m);
        envRef.current = scaled
          ? // Full composition dims + pooled full-res scratch: the styles never learn they're small.
            makeScaledDrawEnv(composition, report)
          : makeDrawEnv(canvas, report);
        envKeyRef.current = envKey;
      }
      if (!scaled) {
        drawReelFrame(ctx, f, reelProps, assets, envRef.current);
        return;
      }
      // Bracket the composition-space draw with the shrink, then hand the ctx back at identity so a
      // later full-res draw (an orientation flip, a maxDim removal) can never inherit a stale scale.
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      drawReelFrame(ctx, f, reelProps, assets, envRef.current);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    [reelProps, assets, scaled, scaleX, scaleY, composition],
  );

  // Decode the clips ONCE per props change (assets.ts dedupes urls + builds any washes the style needs).
  useEffect(() => {
    const controller = new AbortController();
    loadReelAssets(reelProps.clips, {
      ...resolveEngineStyle(reelProps.styleId).assetNeeds(reelProps),
      // A thumb normalizes its washes to the REDUCED frame: the wash chain is frame-relative, and
      // every wash is drawn dest-sized (drawCover), so building it small is pure savings.
      frame: { width, height },
      // Decode through the SHARED cache: the hero and the 14 rail thumbs run over the same first
      // clips, so they cost one decode between them instead of fifteen.
      decode: sharedBitmapCache.decode,
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
  }, [reelProps, width, height]);

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
    let running = false;
    let lastTick: number | null = null;
    let lastDrawn = -1;
    const tick = (now: number) => {
      if (lastTick !== null) timeRef.current += (now - lastTick) / 1000;
      lastTick = now;
      const f = Math.floor(timeRef.current * FPS) % durationInFrames;
      if (f !== lastDrawn) {
        drawFrame(f);
        lastDrawn = f;
        // Only the scrubber + the counter read shownFrame, so a chrome-less player (every thumb, the
        // Marquee/Studio hero) has no reason to re-render React 24x/second.
        if (showControls) setShownFrame(f);
      }
      raf = requestAnimationFrame(tick);
    };

    // The clock FREEZES rather than skips: `lastTick = null` on every stop, so the paused interval
    // never accumulates and playback resumes exactly where it left off.
    const start = () => {
      if (running) return;
      running = true;
      lastTick = null;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      lastTick = null;
    };

    // Two independent reasons to freeze: the tab is hidden, or this player is scrolled off-screen.
    // They're combined through one sync() so recovering from either doesn't resume while the other
    // still holds (and the `running` guard keeps that from ever spawning a second rAF loop).
    // Off-screen gating is what makes `?section=all` (Marquee + rail + gallery) cost nothing while
    // the host is looking at something else.
    let offscreen = false;
    const sync = () => {
      if (document.hidden || offscreen) stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", sync);

    let observer: IntersectionObserver | null = null;
    const wrap = wrapRef.current;
    if (wrap && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          offscreen = !entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      observer.observe(wrap);
    }

    return () => {
      stop();
      cancelAnimationFrame(raf); // belt-and-braces: stop() is a no-op if we never started
      document.removeEventListener("visibilitychange", sync);
      observer?.disconnect();
    };
  }, [
    assets,
    playing,
    controlled,
    frame,
    durationInFrames,
    drawFrame,
    showControls,
  ]);

  const scrubTo = (f: number) => {
    setUserPlaying(false);
    timeRef.current = f / FPS;
    drawFrame(f);
    setShownFrame(f);
  };

  return (
    <div
      ref={wrapRef}
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
