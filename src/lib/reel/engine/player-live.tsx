"use client";

/**
 * THE LIVE REEL PLAYER — a sibling of CanvasReelPlayer for a SOURCE instead of a fixed cut
 * (the live reel, 2026-09-22).
 *
 * Same engine, same `drawReelFrame`, same pixels. What changes is everything around the draw:
 *
 * - ★ A MONOTONIC CLOCK THE PLAYER OWNS AND NEVER RESETS. The fixed player zeroes its clock on every
 *   props identity, which is right for a cut and fatal for a loop: a new upload, a refreshed presign
 *   or a style switch would each send the reel back to its first photograph. Here the clock only
 *   goes forward, and every plan swap moves the OFFSET between the clock and the window's own
 *   timeline instead of touching the clock.
 * - ★ ROLLING WINDOWS. Two windows are planned and decoded ahead through the shared bitmap cache;
 *   the window on screen and its neighbours are RETAINED (asset-cache.ts) so the LRU can never close
 *   a bitmap mid-draw, and the window two behind is released. A 300-photograph album therefore costs
 *   what a six-photograph one costs.
 * - ★ THE TICK CANNOT DIE. The draw is wrapped: a throw reports through `onFailure` and the rAF
 *   keeps running, so a bad bitmap costs one hold rather than the rest of the night, and a blank
 *   loop is never silent.
 * - ★ A DROP IS IMMEDIATE. When the clip on screen leaves the payload, the player asks the source
 *   for a cutaway and jumps to the frame where the style's shortest transition begins.
 *
 * Kept from the fixed player, deliberately: visibility and intersection gating (the clock FREEZES,
 * it does not skip), reduced motion (nothing plays until something asks), and the `maxDim` thumb
 * path (a smaller backing store, the styles still thinking full-res).
 *
 * ★ THE SOURCE IS THE CALLER'S. This player retains and releases windows, and gives every retain
 * back when it unmounts, but it never disposes the source: a provider may keep one across a
 * remount, and the harness swaps players over the same album.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LiveMediaItem } from "@/lib/reel/live/items";
import {
  DEFAULT_SURFACE,
  videoWindowSec,
  type Surface,
} from "@/lib/reel/live/pacing";
import type { ClipSource } from "@/lib/reel/live/source";
import type { ReelLook, ReelWindow } from "@/lib/reel/live/window";

import type { ReelAssets } from "./assets";
import { FPS, reelDimensions, type Orientation } from "./constants";
import type { DrawEnv } from "./contract";
import {
  drawReelFrame,
  makeDrawEnv,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "./registry";
import { clipStartFrames, frameStateAt } from "./timeline";
import { createVideoByteLedger } from "./video/budget";
import { createVideoPlayback, type VideoPlayback } from "./video/prepare-frame";
import { createReaderDeck, type ReaderDeck } from "./video/window-reader";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** How many windows are planned and decoded ahead of the one on screen. */
const PREFETCH_AHEAD = 2;

/** What `onFrame` reports once per tick (through a latest-ref, never React state). */
export type LiveFrameState = {
  /** The player's own clock, in frames. NEVER decreases, for any reason. */
  globalFrame: number;
  /** The frame drawn within the current window's plan. */
  localFrame: number;
  windowIndex: number;
  loopIndex: number;
  clipId: string | null;
  /** Cumulative decode failures and draw throws. */
  failures: number;
  /** The range reader's session numbers, where this window has motion video at all. */
  video: {
    liveReaders: number;
    bytesRead: number;
    framesDecoded: number;
    spentBytes: number;
  } | null;
};

export type LiveReelPlayerProps = {
  source: ClipSource;
  /** A MOOD id; a treatment falls back to the default mood (the loop is moods only). */
  styleId: string;
  surface?: Surface;
  /** The board's pacing multiplier on top of the surface factor. */
  holdScale?: number;
  orientation?: Orientation;
  /** The live reel carries no mark on any tier; the knob exists for the harness. */
  watermark?: boolean;
  /** Videos play their motion window (`reel-engine-video`); off, they hold their poster. */
  includeVideos?: boolean;
  /**
   * Controlled play state. OMITTED, reduced motion decides (paused where it is set), which is the
   * fixed player's rule; PASSED, the caller's control owns it and reduced motion is the initial
   * value the caller was handed.
   */
  paused?: boolean;
  /** Cap the canvas's longest backing-store dimension (the album tile's thumb). */
  maxDim?: number;
  className?: string;
  /** The item now on screen: the caption, the "just added by" beat, the tap-to-jump. */
  onClipChange?: (item: LiveMediaItem | null) => void;
  /** Cumulative failures. Never silent: a loop that blanks must be reportable. */
  onFailure?: (count: number) => void;
  /** Per tick. The harness's readout, and the pin that the clock never goes backward. */
  onFrame?: (state: LiveFrameState) => void;
  /** Capability gaps from the draw (deduplicated by the env). */
  onReport?: (message: string) => void;
};

type Active = {
  window: ReelWindow;
  assets: ReelAssets;
  /** The window's motion-video wiring, or null where the look has videos off. */
  playback: VideoPlayback | null;
};

function lookKeyOf(look: ReelLook): string {
  return [
    look.styleId,
    look.surface,
    look.holdScale ?? 1,
    look.orientation ?? "portrait",
    look.watermark ? "w" : "-",
    look.includeVideos ? "v" : "p",
  ].join("~");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function LiveReelPlayer({
  source,
  styleId,
  surface = DEFAULT_SURFACE,
  holdScale,
  orientation,
  watermark = false,
  includeVideos = false,
  paused,
  maxDim,
  className,
  onClipChange,
  onFailure,
  onFrame,
  onReport,
}: LiveReelPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<DrawEnv | null>(null);
  const envKeyRef = useRef("");
  const [started, setStarted] = useState(false);

  const look: ReelLook = useMemo(
    () => ({
      styleId,
      surface,
      holdScale,
      orientation,
      watermark,
      includeVideos,
    }),
    [styleId, surface, holdScale, orientation, watermark, includeVideos],
  );

  const composition = useMemo(() => reelDimensions(orientation), [orientation]);
  const landscape = composition.width > composition.height;

  // The THUMB path, identical to the fixed player's: the draw runs in full composition space and is
  // squeezed onto a smaller backing store by one pre-scale bracket.
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

  // Latest-refs for everything the rAF loop reads, synced in effects (never written during render),
  // so the loop is created ONCE and a re-render can never restart the clock.
  const lookRef = useRef(look);
  const cbRef = useRef({ onClipChange, onFailure, onFrame, onReport });
  const frameRef = useRef({ width, height, scaleX, scaleY });
  const playingRef = useRef(false);

  useEffect(() => {
    lookRef.current = look;
  }, [look]);
  useEffect(() => {
    cbRef.current = { onClipChange, onFailure, onFrame, onReport };
  }, [onClipChange, onFailure, onFrame, onReport]);
  useEffect(() => {
    frameRef.current = { width, height, scaleX, scaleY };
  }, [width, height, scaleX, scaleY]);
  useEffect(() => {
    playingRef.current =
      started && (paused === undefined ? !prefersReducedMotion() : !paused);
  }, [started, paused]);

  // The whole runtime lives in one ref: the clock, the windows, the offsets. React state would cost
  // a re-render per frame, and the only thing the tree needs to know is that it has begun.
  const rt = useRef({
    elapsedSec: 0,
    frameOffset: 0,
    index: 0,
    active: null as Active | null,
    ahead: new Map<number, Active>(),
    loading: new Set<number>(),
    failures: 0,
    lastClipId: null as string | null,
    lookKey: "",
    revision: -1,
    cuttingAway: false,
    splicing: false,
    needsAhead: false,
    generation: 0,
    // ★ ONE deck and ONE ledger for the whole session, across every window. The deck's ceiling of
    // two live readers and the ledger's session byte cap are SESSION promises (reel-engine-video):
    // per-window instances would multiply both by however many windows a night rolls through.
    deck: null as ReaderDeck | null,
    ledger: null as ReturnType<typeof createVideoByteLedger> | null,
    disposed: false,
  });

  const bumpFailures = useCallback((n: number) => {
    if (n <= 0) return;
    rt.current.failures += n;
    cbRef.current.onFailure?.(rt.current.failures);
  }, []);

  /**
   * Hang the range-window reader's motion source on this window's video clips (reel-engine-video's
   * `createVideoPlayback`), and hand it the surface's own window length so the ONE pacing factor
   * reaches the video too. With videos off nothing is built and every video draws its poster, which
   * is also every failure's answer.
   */
  const attachVideo = useCallback(
    (win: ReelWindow): VideoPlayback | null => {
      const look = lookRef.current;
      if (!look.includeVideos) return null;
      if (!win.props.clips.some((clip) => clip.type === "video")) return null;

      const state = rt.current;
      state.deck ??= createReaderDeck();
      state.ledger ??= createVideoByteLedger();

      const playback = createVideoPlayback({
        props: win.props,
        frame: reelDimensions(win.props.orientation),
        deck: state.deck,
        ledger: state.ledger,
        windowSec: videoWindowSec(look.surface, look.holdScale),
        includeVideos: true,
        // The K-loop cadence is charged per LOOP of the reel, which for a live reel is the take's
        // own loop, not a window's.
        loopIndex: () => win.loopIndex,
        sourceFor: (index) => {
          const item = source.itemFor(win.ids[index] ?? "");
          if (!item || item.type !== "video" || !item.url) return null;
          return {
            clipKey: item.id,
            // The ORIGINAL, read from the LATEST item: a bucket roll hands the reader a new url
            // rather than a dead one.
            url: item.url,
            fileSizeBytes: item.fileSizeBytes ?? null,
            durationSec: item.durationSeconds ?? null,
          };
        },
        onFailure: (index, failure) => {
          cbRef.current.onReport?.(
            `video ${win.ids[index] ?? index}: ${failure.kind}${
              failure.possibleExpiry ? " (possible expiry)" : ""
            }`,
          );
        },
      });

      win.props.clips.forEach((clip, index) => {
        if (clip.type !== "video") return;
        clip.video = {
          kind: "window",
          frameAt: (localSec: number) =>
            playback.videoSourceFor(index).frameAt(localSec),
        };
      });
      return playback;
    },
    [source],
  );

  /** Plan and decode a window. `source.prepare` retains its stills before anything draws them. */
  const loadWindow = useCallback(
    async (index: number, l: ReelLook): Promise<Active | null> => {
      const win = source.windowAt(index, l);
      if (!win) return null;
      // ★ THE MOTION WIRING IS ATTACHED BEFORE THE DECODE. `loadReelAssets` copies `clip.video` onto
      // the asset as it builds it, so a source hung on the clip afterwards would be invisible to
      // half the draw. One playback per WINDOW (clip indices are the window's own), over the ONE
      // session deck and ledger.
      const playback = attachVideo(win);
      const style = resolveEngineStyle(win.props.styleId);
      const assets = await source.prepare(win, {
        needs: style.assetNeeds(win.props),
        frame: {
          width: frameRef.current.width,
          height: frameRef.current.height,
        },
      });
      return { window: win, assets, playback };
    },
    [source, attachVideo],
  );

  /** Keep PREFETCH_AHEAD windows planned and decoded past the one on screen. */
  const ensureAhead = useCallback(() => {
    const state = rt.current;
    const l = lookRef.current;
    const key = lookKeyOf(l);
    for (let step = 1; step <= PREFETCH_AHEAD; step++) {
      const index = state.index + step;
      if (state.ahead.has(index) || state.loading.has(index)) continue;
      state.loading.add(index);
      const generation = state.generation;
      void loadWindow(index, l)
        .then((next) => {
          state.loading.delete(index);
          if (state.disposed || !next) return;
          // Overtaken: the look moved, or the order did. Drop it; the retry is the next tick.
          if (state.lookKey !== key || state.generation !== generation) {
            next.playback?.dispose();
            return;
          }
          state.ahead.set(index, next);
          bumpFailures(next.assets.failures);
        })
        .catch(() => {
          state.loading.delete(index);
        });
    }
  }, [loadWindow, bumpFailures]);

  /**
   * Throw the prefetch away: a splice, a drop or a look change has rewritten what comes next.
   *
   * ★ IT BUMPS A GENERATION. A load already in flight has ALREADY planned its window against the
   * order that just changed, and when it resolves it would quietly install that stale window as the
   * prefetch — which is how a soak froze on one photograph for fifty-one seconds. The generation is
   * what lets the resolver know it was overtaken. A stale window's retains are deliberately NOT
   * given back here: its index will release in the ordinary course, and releasing now would free the
   * stills the REPLACEMENT window at that index has since pinned.
   */
  const dropAhead = useCallback(() => {
    const state = rt.current;
    state.generation += 1;
    for (const [index, active] of state.ahead) {
      active.playback?.dispose();
      source.release(index);
    }
    state.ahead.clear();
  }, [source]);

  // ── The first window ─────────────────────────────────────────────────────
  useEffect(() => {
    const state = rt.current;
    state.disposed = false;
    let alive = true;
    state.lookKey = lookKeyOf(lookRef.current);
    void loadWindow(0, lookRef.current).then((first) => {
      if (!alive || !first) return;
      state.active = first;
      state.index = 0;
      state.frameOffset = 0;
      state.revision = source.revision();
      source.setCurrentWindow(0);
      bumpFailures(first.assets.failures);
      setStarted(true);
      ensureAhead();
    });
    return () => {
      alive = false;
      state.disposed = true;
    };
  }, [loadWindow, source, ensureAhead, bumpFailures]);

  // ── A look change: re-plan in place, keep the picture ────────────────────
  // The bitmaps stay (keyed by url in the shared cache, and retained by this window), so only the
  // style-derived artifacts rebuild; the old window keeps drawing until the new one lands, and the
  // clip on screen keeps its phase, so the clock never moves backward.
  useEffect(() => {
    const state = rt.current;
    const key = lookKeyOf(look);
    if (state.lookKey === "" || state.lookKey === key) {
      state.lookKey = key;
      return;
    }
    state.lookKey = key;
    dropAhead();

    let alive = true;
    const from = state.active;
    void loadWindow(state.index, look).then((swapped) => {
      if (!alive || state.disposed || !swapped) return;
      const globalFrame = Math.floor(state.elapsedSec * FPS);
      if (from) {
        state.frameOffset = rephase(
          from,
          swapped,
          globalFrame - state.frameOffset,
          globalFrame,
        );
      }
      from?.playback?.dispose();
      state.active = swapped;
      bumpFailures(swapped.assets.failures);
      ensureAhead();
    });
    return () => {
      alive = false;
    };
  }, [look, loadWindow, dropAhead, ensureAhead, bumpFailures]);

  // ── The clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const state = rt.current;
    let raf = 0;
    let running = false;
    let lastTick: number | null = null;
    let lastDrawn = -1;
    let lastWindow: ReelWindow | null = null;

    const draw = (local: number, active: Active) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { scaleX: sx, scaleY: sy } = frameRef.current;
      const isScaled = sx !== 1 || sy !== 1;
      const envKey = `${canvas.width}x${canvas.height}`;
      if (!envRef.current || envKeyRef.current !== envKey) {
        const report = (m: string) => cbRef.current.onReport?.(m);
        envRef.current = isScaled
          ? makeScaledDrawEnv(
              reelDimensions(active.window.props.orientation),
              report,
            )
          : makeDrawEnv(canvas, report);
        envKeyRef.current = envKey;
      }
      // ★ The tick survives a bad frame: a detached bitmap, a style reaching for a capability this
      // browser lacks. One hold is lost; the loop is not.
      try {
        if (!isScaled) {
          drawReelFrame(
            ctx,
            local,
            active.window.props,
            active.assets,
            envRef.current,
          );
        } else {
          ctx.setTransform(sx, 0, 0, sy, 0, 0);
          drawReelFrame(
            ctx,
            local,
            active.window.props,
            active.assets,
            envRef.current,
          );
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      } catch (err) {
        bumpFailures(1);
        cbRef.current.onReport?.(
          `frame ${local} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

    /**
     * ★ AN ARRIVAL BECOMES THE NEXT PHOTOGRAPH, not the next window's. The source rebuilds the
     * current window to open on the clip playing right now with the arrivals immediately behind it;
     * because that clip keeps its own `indexOffset`, its hold and motion are identical in both
     * plans, so the swap happens at the frame we are on and nothing moves. Waiting for the ordinary
     * handover instead would have put an upload up to a whole window away — measured at eleven
     * seconds on a six-clip window, which is not "spliced within seconds".
     */
    const spliceNow = async (from: Active, clipId: string) => {
      try {
        const win = source.rewindowAt(from.window, clipId, lookRef.current);
        if (!win) return;
        dropAhead();
        const playback = attachVideo(win);
        const style = resolveEngineStyle(win.props.styleId);
        const assets = await source.prepare(win, {
          needs: style.assetNeeds(win.props),
          frame: {
            width: frameRef.current.width,
            height: frameRef.current.height,
          },
        });
        if (state.disposed || state.active !== from) return;
        const globalNow = Math.floor(state.elapsedSec * FPS);
        const next = { window: win, assets, playback };
        from.playback?.dispose();
        state.frameOffset = rephase(
          from,
          next,
          globalNow - state.frameOffset,
          globalNow,
        );
        state.active = next;
        bumpFailures(assets.failures);
        ensureAhead();
      } finally {
        state.splicing = false;
      }
    };

    const cutAway = async (from: Active, clipId: string) => {
      try {
        const cut = source.cutawayFrom(from.window, clipId, lookRef.current);
        if (!cut) return;
        const playback = attachVideo(cut);
        const style = resolveEngineStyle(cut.props.styleId);
        const assets = await source.prepare(cut, {
          needs: style.assetNeeds(cut.props),
          frame: {
            width: frameRef.current.width,
            height: frameRef.current.height,
          },
        });
        if (state.disposed || state.active !== from) return;
        // The clock stays where it is; the OFFSET puts the next drawn frame on the first frame of
        // the shortest transition out.
        state.frameOffset =
          Math.floor(state.elapsedSec * FPS) - cut.resumeFrame;
        from.playback?.dispose();
        state.active = { window: cut, assets, playback };
        bumpFailures(assets.failures);
      } finally {
        state.cuttingAway = false;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (lastTick !== null && playingRef.current) {
        state.elapsedSec += (now - lastTick) / 1000;
      }
      lastTick = now;
      if (!state.active) return;

      // A splice or a drop rewrote what is ahead: the prefetch is stale. Checked here rather than in
      // an effect because the source can change outside React's render (the album's doorbell).
      //
      // ★ THE PREFETCH IS NOT REBUILT YET. Planning the next window CONSUMES the arrival queue (it
      // is where an arrival lands when a rewindow is not possible), so re-filling it here would take
      // the upload the splice below is about to put on screen and hide it a whole window away. It
      // happens at the foot of the tick instead, once the splice has had its chance.
      const revision = source.revision();
      if (revision !== state.revision) {
        state.revision = revision;
        dropAhead();
        state.needsAhead = true;
      }

      const globalFrame = Math.floor(state.elapsedSec * FPS);
      let local = globalFrame - state.frameOffset;

      // One resolve per tick: what is on screen, and whether a transition is in flight.
      const shown = frameStateAt(state.active.window.plan, Math.max(0, local));
      const onScreen = state.active.window.ids[shown.top.clipIndex] ?? null;

      // The clip on screen has left the payload: cut away on the next frame.
      if (onScreen && !source.isLive(onScreen) && !state.cuttingAway) {
        state.cuttingAway = true;
        void cutAway(state.active, onScreen);
      }

      // An upload landed: re-open the window on the clip playing now, arrivals right behind it.
      // Only mid-hold, so no transition is ever cut in half by the swap.
      if (
        onScreen &&
        !state.splicing &&
        !state.cuttingAway &&
        shown.transition === null &&
        source.pendingCount() > 0
      ) {
        state.splicing = true;
        state.needsAhead = false; // the rewindow re-fills the prefetch itself
        void spliceNow(state.active, onScreen);
      }

      // ★ THE PREFETCH HEALS ITSELF, AND WAITS ITS TURN. Every tick, not only on an event: a load
      // that was overtaken (a splice, a look change) leaves a hole, and an event-driven refill would
      // never fill it — the reel would run to the end of its window and hold one photograph for ever.
      // It is two Map lookups when there is nothing to do.
      //
      // But NOT while an arrival is queued: planning the next window is what CONSUMES the queue, so
      // a prefetch here would take the upload the rewindow above is about to put on screen and hide
      // it a whole window away. Measured, when it did exactly that: 11.4 seconds and five clips,
      // every time an upload happened to land during a transition (when the rewindow has to wait).
      // The wait is bounded by a transition, which is under a second.
      if (!state.splicing && source.pendingCount() === 0) {
        state.needsAhead = false;
        ensureAhead();
      }

      // Motion video: cue at most TWO clips, which is exactly what the reader deck holds — the two
      // on screen during a transition, otherwise the one playing and the one after it.
      const playback = state.active.playback;
      if (playback) {
        const top = shown.top.clipIndex;
        const after = top + 1;
        const cues = shown.under
          ? [shown.under.clipIndex, top]
          : after < state.active.window.plan.clips.length
            ? [top, after]
            : [top];
        for (const index of cues) playback.cue(index);
      }

      // The handover: the next window opens on THIS one's last clip and the swap lands mid-hold, at
      // a frame where no transition is in flight and both plans agree about the picture.
      if (local >= state.active.window.handoverFrame) {
        const next = state.ahead.get(state.index + 1);
        if (next) {
          state.ahead.delete(state.index + 1);
          const previous = state.index;
          const leaving = state.active.window;
          // ★ THE RESUME FRAME IS THE LEAVING WINDOW'S (the small-album seam, 2026-09-24): its
          // `handoverOffset` is how far into the shared clip its entering transition ended, plus
          // however far past the handover this tick landed (never past the frame actually drawn,
          // which a late prefetch holds at the window's last). It used to read the INCOMING
          // window's offset, which is the entering gap of a clip one window further on: every
          // handover moved the shared clip by the difference between two transition lengths.
          const drawn = Math.min(
            local,
            Math.max(0, leaving.plan.totalFrames - 1),
          );
          const resume =
            leaving.handoverOffset + Math.max(0, drawn - leaving.handoverFrame);
          // The window we are leaving keeps no readers: the incoming one cues its own.
          state.active.playback?.dispose();
          state.index = next.window.index;
          state.frameOffset = globalFrame - resume;
          state.active = next;
          source.setCurrentWindow(state.index);
          if (previous >= 1) source.release(previous - 1);
          ensureAhead();
          local = globalFrame - state.frameOffset;
        }
      }

      // Nothing ready yet: HOLD the last frame rather than run off the end of the plan. The clock
      // keeps its own time and the offset absorbs the wait, so nothing jumps when the window lands.
      const active = state.active;
      const lastFrame = Math.max(0, active.window.plan.totalFrames - 1);
      if (local > lastFrame) {
        state.frameOffset += local - lastFrame;
        local = lastFrame;
      }
      if (local < 0) local = 0;

      if (local !== lastDrawn || active.window !== lastWindow) {
        draw(local, active);
        lastDrawn = local;
        lastWindow = active.window;
      }

      const clipId = clipIdAt(active, local);
      if (clipId !== state.lastClipId) {
        state.lastClipId = clipId;
        cbRef.current.onClipChange?.(
          clipId ? (source.itemFor(clipId) ?? null) : null,
        );
      }
      cbRef.current.onFrame?.({
        globalFrame,
        localFrame: local,
        windowIndex: active.window.index,
        loopIndex: active.window.loopIndex,
        clipId,
        failures: state.failures,
        video: active.playback ? active.playback.stats() : null,
      });
    };

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

    // Two independent reasons to freeze — a hidden tab, an off-screen player — through one sync(),
    // so recovering from either never resumes while the other still holds.
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
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", sync);
      observer?.disconnect();
    };
  }, [source, ensureAhead, dropAhead, bumpFailures, attachVideo]);

  // Every retain this player took, given back. The SOURCE is not disposed: it is the caller's.
  useEffect(() => {
    const state = rt.current;
    return () => {
      state.disposed = true;
      for (const [index, active] of state.ahead) {
        active.playback?.dispose();
        source.release(index);
      }
      state.ahead.clear();
      state.active?.playback?.dispose();
      source.release(state.index);
      if (state.index >= 1) source.release(state.index - 1);
    };
  }, [source]);

  // ★ NO FRAME, ON PURPOSE. The fixed player draws its own lit border because it is always the
  // studio's screen; the live reel is a tile at the head of an album, a full-bleed view and a wall,
  // and each of those frames it differently. So this renders the canvas and nothing else, and the
  // caller's `className` is the frame. The bright edge (`data-lit`, and its entry in
  // shared/lit-edge-contract.test.ts) belongs to whichever surface the boards rule it onto.
  return (
    <div
      ref={wrapRef}
      className={
        className ??
        `mx-auto w-full ${landscape ? "max-w-[640px]" : "max-w-[360px]"}`
      }
      data-live-reel={started ? "playing" : "loading"}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl bg-black"
        style={{
          display: "block",
          width: "100%",
          aspectRatio: `${width} / ${height}`,
        }}
      />
    </div>
  );
}

/** The media id drawn on top at this frame of a window. */
function clipIdAt(active: Active, frame: number): string | null {
  const state = frameStateAt(active.window.plan, Math.max(0, frame));
  return active.window.ids[state.top.clipIndex] ?? null;
}

/**
 * Keep the picture across a style switch: the clip on screen stays on screen, at the same fraction
 * of its (new) hold, so the swap reads as a change of grade and pacing rather than as a jump cut.
 * The returned offset is what keeps the player's own clock monotonic while the window's timeline
 * moves underneath it.
 */
function rephase(
  from: Active,
  to: Active,
  localFrame: number,
  globalFrame: number,
): number {
  const fromState = frameStateAt(from.window.plan, Math.max(0, localFrame));
  const clipId = from.window.ids[fromState.top.clipIndex];
  const index = clipId ? to.window.ids.indexOf(clipId) : -1;
  if (index < 0) return globalFrame - Math.max(0, localFrame);
  const fromClip = from.window.plan.clips[fromState.top.clipIndex];
  const phase =
    fromClip && fromClip.durationInFrames > 0
      ? fromState.top.localFrame / fromClip.durationInFrames
      : 0;
  const starts = clipStartFrames(to.window.plan);
  const toClip = to.window.plan.clips[index];
  const local = Math.round(
    starts[index] + phase * (toClip?.durationInFrames ?? 0),
  );
  return globalFrame - Math.max(0, local);
}
