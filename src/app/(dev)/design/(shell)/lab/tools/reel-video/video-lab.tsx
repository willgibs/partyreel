"use client";

/**
 * THE RANGE-WINDOW VIDEO HARNESS (the reel round, 2026-09-22; Will's ruling "Range-window decode on
 * device"). The engine lane's proving ground: a real mov, a real webm and a portrait mp4, each
 * fetched BY BYTE RANGE from the sibling fixture route and decoded on this device into the ring the
 * synchronous draw reads. Every knob the product will carry is here, and every number the ladder
 * decides on is on screen: the toggle, the per-clip byte cap, the K-loop cadence, the session
 * ceiling, the window, the bytes actually read, the live reader count and the JS heap.
 *
 * It draws with the REAL engine (drawReelFrame over the real mood styles) on its own clock rather
 * than through CanvasReelPlayer, because the thing being proved is the cue-and-pump cadence around
 * the draw, not the player's chrome. The shipped player is untouched by this lane.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets, type ReelAssets } from "@/lib/reel/engine/assets";
import { FPS, reelDimensions } from "@/lib/reel/engine/constants";
import type { DrawEnv } from "@/lib/reel/engine/contract";
import {
  drawReelFrame,
  engineStyleDuration,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelClip, ReelProps } from "@/lib/reel/engine/reel-types";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { frameStateAt, planFor } from "@/lib/reel/engine/timeline";
import {
  createVideoByteLedger,
  VIDEO_CLIP_BYTE_CAP,
  VIDEO_MOTION_EVERY_N_LOOPS,
  VIDEO_SESSION_BYTE_CEILING,
  VIDEO_WINDOW_SEC,
} from "@/lib/reel/engine/video/budget";
import {
  readSaveData,
  videosDefaultOn,
  VIDEO_FALLBACK_LABEL,
} from "@/lib/reel/engine/video/ladder";
import {
  createVideoPlayback,
  type VideoPlayback,
} from "@/lib/reel/engine/video/prepare-frame";
import { createReaderDeck } from "@/lib/reel/engine/video/window-reader";

const MB = 1024 * 1024;

/** The fixture album: two videos whose ORIGINALS are range-read, and photos for context. */
type Fixture =
  | { kind: "photo"; id: string }
  | {
      kind: "video";
      id: string;
      /** The poster still, fetched whole like any photo. */
      poster: string;
      /** The ORIGINAL, fetched by range and decoded here. */
      original: string;
      width: number;
      height: number;
      durationSec: number;
      fileSizeBytes: number;
      note: string;
    };

const fixtureUrl = (name: string) =>
  `/design/lab/tools/reel-video/fixture/${name}`;

const FIXTURES: Fixture[] = [
  { kind: "photo", id: "wedding-golden" },
  {
    kind: "video",
    id: "mov",
    poster: fixtureUrl("landscape-poster.jpg"),
    original: fixtureUrl("landscape-10s.mov"),
    width: 854,
    height: 480,
    durationSec: 10,
    fileSizeBytes: 622_813,
    note: "QuickTime / h264, landscape (fit)",
  },
  { kind: "photo", id: "wedding-petals" },
  {
    kind: "video",
    id: "webm",
    poster: fixtureUrl("landscape-poster.jpg"),
    original: fixtureUrl("landscape-10s.webm"),
    width: 854,
    height: 480,
    durationSec: 10,
    fileSizeBytes: 693_305,
    note: "WebM / VP9, landscape (fit)",
  },
  { kind: "photo", id: "party-dj" },
  {
    kind: "video",
    id: "portrait",
    poster: fixtureUrl("portrait-poster.jpg"),
    original: fixtureUrl("portrait-10s.mp4"),
    width: 480,
    height: 854,
    durationSec: 10,
    fileSizeBytes: 547_223,
    note: "mp4 / h264, portrait (cover)",
  },
];

const CAPS = [
  { label: "64 KB (everything is over budget)", value: 64 * 1024 },
  { label: "512 KB", value: 512 * 1024 },
  { label: "6 MiB (the shipped cap)", value: VIDEO_CLIP_BYTE_CAP },
];
const CEILINGS = [
  { label: "1 MiB (exhausts in a loop or two)", value: 1 * MB },
  { label: "16 MiB", value: 16 * MB },
  { label: "200 MiB (the shipped ceiling)", value: VIDEO_SESSION_BYTE_CEILING },
];
const CADENCES = [1, 2, 3, 5];
const WINDOWS = [2, 4, VIDEO_WINDOW_SEC];

type Readout = {
  frame: number;
  loop: number;
  liveReaders: number;
  spentBytes: number;
  ceilingBytes: number;
  bytesRead: number;
  framesDecoded: number;
  decisions: { index: number; label: string; note: string }[];
  heapMB: number | null;
};

const EMPTY_READOUT: Readout = {
  frame: 0,
  loop: 0,
  liveReaders: 0,
  spentBytes: 0,
  ceilingBytes: VIDEO_SESSION_BYTE_CEILING,
  bytesRead: 0,
  framesDecoded: 0,
  decisions: [],
  heapMB: null,
};

function mb(bytes: number): string {
  return `${(bytes / MB).toFixed(2)} MB`;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Data Saver never changes mid-session; a stable no-op subscribe keeps the store from resubscribing. */
const NEVER_CHANGES = () => () => {};

/** The same external-store shape the shipped player uses: reduced motion is a system, not state. */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function heapMB(): number | null {
  const memory = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  return memory ? memory.usedJSHeapSize / MB : null;
}

export function ReelVideoLab() {
  const [styleId, setStyleId] = useState("classic");
  const [seed] = useState(73);
  const [capBytes, setCapBytes] = useState(VIDEO_CLIP_BYTE_CAP);
  const [ceilingBytes, setCeilingBytes] = useState(VIDEO_SESSION_BYTE_CEILING);
  const [everyNLoops, setEveryNLoops] = useState(VIDEO_MOTION_EVERY_N_LOOPS);
  const [windowSec, setWindowSec] = useState(VIDEO_WINDOW_SEC);
  const [readout, setReadout] = useState<Readout>(EMPTY_READOUT);
  const [failures, setFailures] = useState<string[]>([]);
  const [reports, setReports] = useState<string[]>([]);

  // Two external systems, read the way the shipped player reads them: the server snapshot says
  // "reduced" and "no Data Saver", so SSR and hydration agree, and a user choice overrides after.
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
  const saveData = useSyncExternalStore(
    NEVER_CHANGES,
    readSaveData,
    () => null,
  );
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !prefersReduced;
  const [videosOverride, setVideosOverride] = useState<boolean | null>(null);
  const includeVideos = videosOverride ?? videosDefaultOn(saveData);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<DrawEnv | null>(null);
  const playbackRef = useRef<VideoPlayback | null>(null);
  const loopRef = useRef(0);
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);
  const assetsRef = useRef<ReelAssets | null>(null);

  const composition = reelDimensions("portrait");
  // A phone-sized stage: the draw still runs in full composition space and is squeezed onto the
  // backing store by one pre-scale, exactly as the player's thumb path does.
  const backing = { width: 270, height: 480 };
  const scaleX = backing.width / composition.width;
  const scaleY = backing.height / composition.height;

  // ONE stable props object: the plan is memoized by its identity, and every clip's motion source
  // delegates through a ref so a knob can rebuild the playback without rebuilding the props.
  const reelProps: ReelProps = useMemo(() => {
    const clips: ReelClip[] = FIXTURES.map((fixture, index) => {
      if (fixture.kind === "photo") {
        const image = marketingImage(fixture.id);
        return {
          url: image.src,
          type: "photo" as const,
          width: image.width,
          height: image.height,
        };
      }
      return {
        url: fixture.poster,
        type: "video" as const,
        width: fixture.width,
        height: fixture.height,
        trimDurationSec: 6,
        video: {
          kind: "window" as const,
          frameAt: (localSec: number) =>
            playbackRef.current?.videoSourceFor(index).frameAt(localSec) ??
            null,
        },
      };
    });
    return {
      clips,
      theme: resolveTheme(styleId),
      seed,
      styleId,
      orientation: "portrait",
    };
  }, [styleId, seed]);

  const durationInFrames = useMemo(
    () => Math.max(1, engineStyleDuration(styleId, reelProps)),
    [styleId, reelProps],
  );

  // The playback owns the deck and the ledger: every structural knob rebuilds it (and disposes
  // whatever was open), while the toggle rides setIncludeVideos so a flick costs no reopen.
  useEffect(() => {
    const playback = createVideoPlayback({
      props: reelProps,
      frame: composition,
      deck: createReaderDeck(),
      ledger: createVideoByteLedger(ceilingBytes),
      everyNLoops,
      windowSec,
      capBytes,
      includeVideos: true,
      loopIndex: () => loopRef.current,
      sourceFor: (index) => {
        const fixture = FIXTURES[index];
        if (!fixture || fixture.kind !== "video") return null;
        return {
          clipKey: fixture.id,
          url: fixture.original,
          fileSizeBytes: fixture.fileSizeBytes,
          durationSec: fixture.durationSec,
        };
      },
      onFailure: (index, failure) => {
        const fixture = FIXTURES[index];
        const id = fixture?.kind === "video" ? fixture.id : `clip ${index}`;
        setFailures((prev) => {
          const line = `${id}: ${failure.kind}${
            failure.possibleExpiry ? " (possible expiry)" : ""
          }: ${failure.message}`;
          return prev.includes(line) ? prev : [...prev, line];
        });
      },
    });
    playbackRef.current = playback;
    return () => {
      playback.dispose();
      playbackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelProps, capBytes, ceilingBytes, everyNLoops, windowSec]);

  useEffect(() => {
    playbackRef.current?.setIncludeVideos(includeVideos);
  }, [includeVideos]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const onReport = useCallback((message: string) => {
    setReports((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);

  // Decode the posters once per props change (the same loader and shared bitmap cache the player uses).
  useEffect(() => {
    const controller = new AbortController();
    assetsRef.current = null;
    loadReelAssets(reelProps.clips, {
      ...resolveEngineStyle(reelProps.styleId).assetNeeds(reelProps),
      frame: backing,
      decode: sharedBitmapCache.decode,
      signal: controller.signal,
    })
      .then((assets) => {
        if (!controller.signal.aborted) assetsRef.current = assets;
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelProps]);

  // The clock, the cue and the draw. ONE rAF: the pump runs on its own promises outside it, which is
  // the whole point of the ring.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const plan = planFor(reelProps);

    const tick = (now: number) => {
      if (playingRef.current) elapsedRef.current += (now - last) / 1000;
      last = now;

      const absolute = Math.floor(elapsedRef.current * FPS);
      const frame = absolute % durationInFrames;
      loopRef.current = Math.floor(absolute / durationInFrames);

      const playback = playbackRef.current;
      const state = frameStateAt(plan, frame);
      if (playback) {
        // At most TWO keys a tick, which is exactly what the deck holds: during a transition the
        // two clips on screen; otherwise the playing clip and the one after it (the prefetch).
        const next = state.top.clipIndex + 1;
        const keys = state.under
          ? [state.under.clipIndex, state.top.clipIndex]
          : next < plan.clips.length
            ? [state.top.clipIndex, next]
            : [state.top.clipIndex];
        for (const index of keys) playback.cue(index);
      }

      const canvas = canvasRef.current;
      const assets = assetsRef.current;
      if (canvas && assets) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (!envRef.current) {
            envRef.current = makeScaledDrawEnv(composition, onReport);
          }
          ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
          drawReelFrame(ctx, frame, reelProps, assets, envRef.current);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelProps, durationInFrames, onReport]);

  // The readouts at 4 Hz: a state update per rAF would measure React, not the engine.
  useEffect(() => {
    const id = window.setInterval(() => {
      const playback = playbackRef.current;
      if (!playback) return;
      const stats = playback.stats();
      const decisions = playback.decisions();
      setReadout({
        frame: Math.floor(elapsedRef.current * FPS) % durationInFrames,
        loop: loopRef.current,
        liveReaders: stats.liveReaders,
        spentBytes: stats.spentBytes,
        ceilingBytes: stats.ceilingBytes,
        bytesRead: stats.bytesRead,
        framesDecoded: stats.framesDecoded,
        heapMB: heapMB(),
        decisions: FIXTURES.map((fixture, index) => {
          const decision = decisions.get(index);
          const label = fixture.kind === "video" ? fixture.id : fixture.id;
          if (!decision) return { index, label, note: "not cued yet" };
          return {
            index,
            label,
            note: decision.motion
              ? `motion ${decision.plan.windowSec.toFixed(1)}s (~${mb(
                  decision.plan.estimatedBytes,
                )}${decision.plan.shortened ? ", shortened" : ""})`
              : `poster: ${VIDEO_FALLBACK_LABEL[decision.reason]}`,
          };
        }).filter((row) => FIXTURES[row.index].kind === "video"),
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [durationInFrames]);

  const restart = () => {
    elapsedRef.current = 0;
    loopRef.current = 0;
  };

  /** A knob that rebuilds the playback also clears the failures the old one reported. Done in the
   *  handler rather than in the effect: a setState inside an effect body is a cascading render. */
  const knob =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setFailures([]);
      set(value);
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6">
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={backing.width}
            height={backing.height}
            className="rounded-xl border border-border bg-black"
            style={{ width: backing.width, height: backing.height }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUserPlaying(!playing)}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-muted/40"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={restart}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-muted/40"
            >
              Restart
            </button>
            <span className="text-xs text-muted-foreground">
              frame {readout.frame} / {durationInFrames} · loop {readout.loop}
            </span>
          </div>
        </div>

        <div className="min-w-[18rem] flex-1 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeVideos}
              onChange={(e) => setVideosOverride(e.target.checked)}
            />
            Include videos
            {saveData === true && (
              <span className="text-xs text-muted-foreground">
                (Data Saver is on: this device starts off)
              </span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Per-clip byte cap
            </span>
            <select
              value={capBytes}
              onChange={(e) => knob(setCapBytes)(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
            >
              {CAPS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Session ceiling
            </span>
            <select
              value={ceilingBytes}
              onChange={(e) => knob(setCeilingBytes)(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
            >
              {CEILINGS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className="block flex-1 text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                Motion every K loops
              </span>
              <select
                value={everyNLoops}
                onChange={(e) => knob(setEveryNLoops)(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
              >
                {CADENCES.map((k) => (
                  <option key={k} value={k}>
                    {k === 1 ? "every loop" : `every ${k} loops`}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1 text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                Window
              </span>
              <select
                value={windowSec}
                onChange={(e) => knob(setWindowSec)(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
              >
                {WINDOWS.map((w) => (
                  <option key={w} value={w}>
                    {w}s
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Style
            </span>
            <select
              value={styleId}
              onChange={(e) => knob(setStyleId)(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
            >
              {["classic", "mono", "warm", "dreamy", "punchy", "kinetic"].map(
                (id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">What each video is doing</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {readout.decisions.map((row) => (
              <li key={row.index}>
                <span className="text-foreground">{row.label}</span>: {row.note}
              </li>
            ))}
            {readout.decisions.length === 0 && <li>nothing cued yet</li>}
          </ul>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {FIXTURES.filter((f) => f.kind === "video").map((f) => (
              <li key={f.id}>
                <span className="text-foreground">{f.id}</span>: {f.note}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">The cost, live</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <dt>Live readers</dt>
            <dd className="text-foreground">{readout.liveReaders} / 2</dd>
            <dt>Charged this session</dt>
            <dd className="text-foreground">
              {mb(readout.spentBytes)} / {mb(readout.ceilingBytes)}
            </dd>
            <dt>Bytes read (live readers)</dt>
            <dd className="text-foreground">{mb(readout.bytesRead)}</dd>
            <dt>Frames decoded</dt>
            <dd className="text-foreground">{readout.framesDecoded}</dd>
            <dt>JS heap</dt>
            <dd className="text-foreground">
              {readout.heapMB === null
                ? "not reported here"
                : `${readout.heapMB.toFixed(1)} MB`}
            </dd>
          </dl>
          {failures.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-destructive">
              {failures.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {reports.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {reports.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
