"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Pause, Play, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FPS,
  type Orientation,
  reelDimensions,
  type ReelClip,
  type ReelProps,
  resolveTheme,
  StyleDispatch,
  styleDuration,
  THEME_LABELS,
  type ThemeId,
} from "@/lib/reel/composition";
import {
  DEFAULT_WATERMARK_VARIANT,
  setWatermarkVariantOverride,
  WATERMARK_VARIANTS,
  type WatermarkVariant,
} from "@/lib/reel/engine/canvas2d";
import {
  DEFAULT_BITRATE,
  ENCODE_BITRATES,
  encodeReel,
} from "@/lib/reel/engine/encode";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { ENGINE_STYLES } from "@/lib/reel/engine/registry";
import {
  type EngineSupport,
  probeEngineSupport,
} from "@/lib/reel/engine/support";

// LOCAL fixtures on purpose: the canvas side must read back pixels for the encode, and a cross-origin
// host without CORS (picsum, the style-catalog lab's source) TAINTS the canvas and kills the export.
// Mixed aspects so cover-vs-fit framing differences show on both sides (landscape media in a portrait
// reel is FIT with the theme backdrop; p12 is portrait and covers).
const FIXTURES: { src: string; w: number; h: number }[] = [
  { src: "/design/p01.jpg", w: 900, h: 600 },
  { src: "/design/p12.jpg", w: 700, h: 1050 },
  { src: "/design/p02.jpg", w: 900, h: 601 },
  { src: "/design/p03.jpg", w: 900, h: 600 },
  { src: "/design/p04.jpg", w: 800, h: 534 },
  { src: "/design/p05.jpg", w: 900, h: 600 },
  { src: "/design/p06.jpg", w: 900, h: 601 },
  { src: "/design/p07.jpg", w: 900, h: 600 },
];

const CLIPS: ReelClip[] = FIXTURES.map(({ src, w, h }) => ({
  url: src,
  type: "photo",
  width: w,
  height: h,
}));

// The styles this harness can grade = whatever the engine has ported (the registry is the single
// source, so a landing port appears in the picker automatically). Mood styleIds double as theme ids,
// so THEME_LABELS names them.
const PORTED_STYLE_IDS = Object.keys(ENGINE_STYLES);

export function ReelParity() {
  const [styleId, setStyleId] = useState("classic");
  const [seed, setSeed] = useState(73);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [watermark, setWatermark] = useState(true);
  // Dev-only: which T1 watermark candidate the canvas side stamps (the module-level
  // override feeds player + encode without prop-threading; reset on unmount).
  const [wmVariant, setWmVariant] = useState<WatermarkVariant>(
    DEFAULT_WATERMARK_VARIANT,
  );
  // null = both players free-run; a number = both frame-locked there (the exact-comparison mode).
  const [lockedFrame, setLockedFrame] = useState<number | null>(null);
  const [reports, setReports] = useState<string[]>([]);

  const [support, setSupport] = useState<EngineSupport | null>(null);
  const [bitrate, setBitrate] = useState<number>(DEFAULT_BITRATE);
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    mb: number;
    wallMs: number;
    seconds: number;
  } | null>(null);

  const remotionRef = useRef<PlayerRef>(null);

  const reelProps: ReelProps = useMemo(
    () => ({
      clips: CLIPS,
      theme: resolveTheme(styleId),
      seed,
      styleId,
      orientation,
      posterMode: true,
      watermark,
    }),
    [styleId, seed, orientation, watermark],
  );

  const durationInFrames = useMemo(
    () => Math.max(1, styleDuration(styleId, reelProps)),
    [styleId, reelProps],
  );
  const { width, height } = reelDimensions(orientation);
  const landscape = width > height;
  // Fixed tile widths (not max-w): the Remotion <Player> has no intrinsic size, so an auto-width
  // flex item would shrink-wrap it to nothing.
  const tileClass = landscape ? "w-[560px] max-w-full" : "w-[300px] max-w-full";

  const onReport = useCallback((message: string) => {
    setReports((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    let alive = true;
    probeEngineSupport(orientation).then((s) => {
      if (alive) setSupport(s);
    });
    return () => {
      alive = false;
    };
  }, [orientation]);

  // Feed the dev-only watermark override + clear it when leaving the harness so any
  // other canvas surface (reveal lab, composer) stamps the shipped default again.
  useEffect(() => {
    setWatermarkVariantOverride(wmVariant);
    return () => setWatermarkVariantOverride(null);
  }, [wmVariant]);

  // Frame-lock drives the Remotion side imperatively; the canvas side takes the frame as a prop.
  useEffect(() => {
    if (lockedFrame === null) return;
    remotionRef.current?.pause();
    remotionRef.current?.seekTo(lockedFrame);
  }, [lockedFrame]);

  const playBoth = () => {
    setLockedFrame(null);
    remotionRef.current?.seekTo(0);
    remotionRef.current?.play();
  };

  const pauseBoth = () => {
    const f = remotionRef.current?.getCurrentFrame() ?? 0;
    setLockedFrame(Math.min(f, durationInFrames - 1));
  };

  const encode = async () => {
    setEncoding(true);
    setEncodeError(null);
    setProgress(0);
    try {
      const encoded = await encodeReel(reelProps, {
        bitrate,
        onProgress: setProgress,
        onReport,
      });
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return {
          url: URL.createObjectURL(encoded.blob),
          mb: encoded.blob.size / 1024 / 1024,
          wallMs: encoded.wallMs,
          seconds: encoded.totalFrames / FPS,
        };
      });
    } catch (err) {
      setEncodeError(err instanceof Error ? err.message : String(err));
    } finally {
      setEncoding(false);
    }
  };

  // Re-key both players on the shared inputs so free-run playback restarts (roughly) in sync.
  // wmVariant is in the key so a variant flip re-renders the canvas side immediately.
  const restartKey = `${styleId}-${seed}-${orientation}-${watermark}-${wmVariant}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reel canvas parity</h1>
        <p className="text-sm text-muted-foreground">
          The Remotion composition and the canvas engine, same props, side by
          side. Free-run playback drifts slightly; use Pause to frame-lock both
          on one timeline and scrub for the exact comparison. Encode renders the
          canvas side to an mp4 via WebCodecs. Note: the watermark is a
          DELIBERATE delta since the T1 redesign; the canvas side stamps the new
          bottom-right lockup while the teardown-bound Remotion side keeps the
          old centered pill.
        </p>
      </header>

      {/* Shared inputs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <select
          value={styleId}
          onChange={(e) => {
            setStyleId(e.target.value);
            setLockedFrame(null);
          }}
          aria-label="Style (ported moods)"
          className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
        >
          {PORTED_STYLE_IDS.map((id) => (
            <option key={id} value={id}>
              {THEME_LABELS[id as ThemeId] ?? id} ({id})
            </option>
          ))}
        </select>
        <div className="h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={() => setSeed((s) => (s * 16807 + 1) % 1_000_000)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
        >
          <Shuffle className="size-4" /> Shuffle
        </button>
        <div className="h-5 w-px bg-border" aria-hidden />
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Orientation"
        >
          {(["portrait", "landscape"] as Orientation[]).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={o === orientation}
              onClick={() => setOrientation(o)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-transform ease-emphasis active:scale-95 ${o === orientation ? "bg-foreground text-background" : ""}`}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-pressed={watermark}
          onClick={() => setWatermark((w) => !w)}
          className={`rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95 ${watermark ? "bg-foreground text-background" : ""}`}
        >
          Watermark
        </button>
        {watermark ? (
          <select
            value={wmVariant}
            onChange={(e) => setWmVariant(e.target.value as WatermarkVariant)}
            aria-label="Watermark variant (canvas side)"
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            {WATERMARK_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
                {v === DEFAULT_WATERMARK_VARIANT ? " (default)" : ""}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-xs text-muted-foreground">
          seed {seed} · {durationInFrames} frames
        </span>
      </div>

      {/* Scrub lock */}
      <div className="flex items-center gap-3">
        {lockedFrame === null ? (
          <button
            type="button"
            onClick={pauseBoth}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
          >
            <Pause className="size-4" /> Pause + lock
          </button>
        ) : (
          <button
            type="button"
            onClick={playBoth}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
          >
            <Play className="size-4" /> Play both
          </button>
        )}
        <input
          type="range"
          min={0}
          max={durationInFrames - 1}
          value={lockedFrame ?? 0}
          disabled={lockedFrame === null}
          onChange={(e) => setLockedFrame(Number(e.target.value))}
          aria-label="Frame lock"
          className="w-full max-w-md accent-foreground disabled:opacity-40"
        />
        <span className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">
          {lockedFrame === null ? "free-running" : `frame ${lockedFrame}`}
        </span>
      </div>

      {/* Side by side */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="space-y-1.5">
          <div className="text-xs font-medium">Remotion (DOM)</div>
          <div
            className={`${tileClass} overflow-hidden rounded-xl border bg-black shadow-sm`}
          >
            <Player
              key={restartKey}
              ref={remotionRef}
              component={StyleDispatch}
              inputProps={reelProps}
              durationInFrames={durationInFrames}
              fps={FPS}
              compositionWidth={width}
              compositionHeight={height}
              autoPlay
              loop
              style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-medium">Canvas engine</div>
          <div className={tileClass}>
            <CanvasReelPlayer
              key={restartKey}
              reelProps={reelProps}
              frame={lockedFrame ?? undefined}
              showControls={false}
              onReport={onReport}
            />
          </div>
        </div>
        {result ? (
          <div className="space-y-1.5">
            <div className="text-xs font-medium">Encoded mp4</div>
            <div
              className={`${tileClass} overflow-hidden rounded-xl border bg-black shadow-sm`}
            >
              <video
                src={result.url}
                controls
                playsInline
                style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {result.seconds.toFixed(1)}s in{" "}
              {(result.wallMs / 1000).toFixed(1)}s (
              {(result.seconds / (result.wallMs / 1000)).toFixed(1)}x realtime)
              · {result.mb.toFixed(1)} MB ·{" "}
              <a
                className="underline"
                href={result.url}
                download="reel-canvas-parity.mp4"
              >
                download
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {/* Encode */}
      <section className="space-y-2 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Bitrate"
          >
            {ENCODE_BITRATES.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={b === bitrate}
                onClick={() => setBitrate(b)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95 ${b === bitrate ? "bg-foreground text-background" : ""}`}
              >
                {b / 1e6} Mbps
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={encode}
            disabled={encoding || !support?.canEncode}
            className="rounded-md border px-4 py-1.5 text-sm font-medium transition-transform ease-emphasis active:scale-95 disabled:opacity-40"
          >
            {encoding
              ? `Encoding ${Math.round(progress * 100)}%`
              : "Encode mp4"}
          </button>
          {encodeError ? (
            <span className="text-sm text-destructive">{encodeError}</span>
          ) : null}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {support === null
            ? "probing encoder support..."
            : `avc ${width}x${height}: ${support.canEncode ? "supported" : "NOT SUPPORTED"} · ctx.filter grades: ${support.ctxFilter ? "yes" : "no (grade skipped)"} · OffscreenCanvas: ${support.offscreenCanvas ? "yes" : "no"} · codecs: ${support.codecs.join(", ") || "none"}`}
        </div>
      </section>

      {/* Capability-gap reports from the engine (deduplicated) */}
      {reports.length > 0 ? (
        <section className="space-y-1 rounded-lg border border-amber-500/40 p-4">
          <div className="text-xs font-medium">Engine reports</div>
          <ul className="list-inside list-disc font-mono text-xs text-muted-foreground">
            {reports.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
