"use client";

import { Pause, Play, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_WATERMARK_VARIANT,
  setWatermarkVariantOverride,
  WATERMARK_VARIANTS,
  type WatermarkVariant,
} from "@/lib/reel/engine/canvas2d";
import type { Orientation } from "@/lib/reel/engine/constants";
import { FPS, reelDimensions } from "@/lib/reel/engine/constants";
import {
  DEFAULT_BITRATE,
  ENCODE_BITRATES,
  encodeReel,
} from "@/lib/reel/engine/encode";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import {
  ENGINE_STYLES,
  engineStyleDuration,
} from "@/lib/reel/engine/registry";
import type { ReelClip, ReelProps } from "@/lib/reel/engine/reel-types";
import { resolveStyleEntry, styleThemeId } from "@/lib/reel/engine/style-registry";
import {
  type EngineSupport,
  probeEngineSupport,
} from "@/lib/reel/engine/support";
import { marketingImage } from "@/lib/constants/marketing-media";
import { resolveTheme } from "@/lib/reel/engine/themes";

// LOCAL fixtures on purpose: the canvas reads back pixels for the encode, and a cross-origin host
// without CORS (picsum) TAINTS the canvas and kills the export. Mixed aspects so cover-vs-fit framing
// shows (landscape media in a portrait reel is FIT with the theme backdrop; p12 is portrait and covers).
// One fixture is a VIDEO whose url is a still standing in for the client-generated poster WebP, so the
// browser visually proves a video slot draws its poster (not a black hold) across every style.
const FIXTURES: { src: string; w: number; h: number; type?: "video" }[] = [
  { src: "/design/p01.jpg", w: 900, h: 600 },
  { src: "/design/p12.jpg", w: 700, h: 1050 },
  { src: "/design/p02.jpg", w: 900, h: 601, type: "video" }, // a video item: url = its poster still
  { src: "/design/p03.jpg", w: 900, h: 600 },
  { src: "/design/p04.jpg", w: 800, h: 534 },
  { src: "/design/p05.jpg", w: 900, h: 600 },
  { src: "/design/p06.jpg", w: 900, h: 600 },
  { src: "/design/p07.jpg", w: 900, h: 600 },
];

const CLIPS: ReelClip[] = FIXTURES.map(({ src, w, h, type }) => ({
  url: src,
  type: type ?? "photo",
  width: w,
  height: h,
}));

// Dev-only clip SETS (Track B F4): the lab pack above stays the default; the
// marketing sets pull same-origin manifest media so hero-loop candidates render
// from the real curated set. Composed by id so a manifest swap re-points them.
const marketingClip = (id: string): ReelClip => {
  const m = marketingImage(id);
  return { url: m.src, type: "photo", width: m.width, height: m.height };
};

const CLIP_SETS: { id: string; label: string; clips: ReelClip[] }[] = [
  { id: "lab", label: "Lab pack (current)", clips: CLIPS },
  {
    id: "mkt-wedding",
    label: "Marketing: wedding arc",
    clips: ["wedding-golden", "wedding-rings", "wedding-arch", "wedding-petals", "wedding-toast", "reception-table"].map(marketingClip),
  },
  {
    id: "mkt-party",
    label: "Marketing: party arc",
    clips: ["party-balloons", "reception-hall", "party-dj", "concert-confetti"].map(marketingClip),
  },
  {
    id: "mkt-festival",
    label: "Marketing: festival arc",
    clips: ["festival-lights", "festival-crowd", "concert-confetti", "party-dj"].map(marketingClip),
  },
  {
    id: "mkt-mixed",
    label: "Marketing: mixed 6",
    clips: ["wedding-golden", "party-balloons", "festival-crowd", "wedding-petals", "party-dj", "wedding-toast"].map(marketingClip),
  },
];

// The styles this browser can show = whatever the engine has (the registry is the single source, so a
// new style appears here automatically); the catalog names them.
const STYLE_IDS = Object.keys(ENGINE_STYLES);

/**
 * The REEL CANVAS STYLE BROWSER (lab). Every reel style rendered by the canvas engine on shared props:
 * pick a style/orientation/seed, watch it play, frame-lock + scrub for a still look at any moment, and
 * export the mp4 via the on-device WebCodecs encoder (the same engine.encode path the composer ships).
 * The watermark-variant picker is dev-only tuning. (This was the DOM-vs-canvas parity harness; the
 * Remotion side was torn down 2026-07-08, so it's canvas-only now.)
 */
export function ReelCanvasStyles() {
  const [styleId, setStyleId] = useState("classic");
  const [clipSetId, setClipSetId] = useState("lab");
  const [seed, setSeed] = useState(73);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [watermark, setWatermark] = useState(true);
  // Dev-only: which T1 watermark candidate the canvas stamps (the module-level override feeds the player
  // + encode without prop-threading; reset on unmount).
  const [wmVariant, setWmVariant] = useState<WatermarkVariant>(
    DEFAULT_WATERMARK_VARIANT,
  );
  // null = free-run; a number = frame-locked there (the scrub-a-still mode).
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

  // The selected set's clips: a stable per-set reference, so the memo below
  // re-derives exactly when the set changes.
  const clips = useMemo(
    () => (CLIP_SETS.find((s) => s.id === clipSetId) ?? CLIP_SETS[0]).clips,
    [clipSetId],
  );

  const reelProps: ReelProps = useMemo(
    () => ({
      clips,
      // A treatment renders with its NATIVE theme (polaroid -> warm, ...), exactly like
      // build-reel-props resolves it; a mood's styleId IS its themeId (a pass-through).
      theme: resolveTheme(styleThemeId(styleId)),
      seed,
      styleId,
      orientation,
      watermark,
    }),
    [clips, styleId, seed, orientation, watermark],
  );

  const durationInFrames = useMemo(
    () => Math.max(1, engineStyleDuration(styleId, reelProps)),
    [styleId, reelProps],
  );
  const { width, height } = reelDimensions(orientation);
  const landscape = width > height;
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

  // Feed the dev-only watermark override + clear it when leaving the lab so any other canvas surface
  // (reveal lab, composer) stamps the shipped default again.
  useEffect(() => {
    setWatermarkVariantOverride(wmVariant);
    return () => setWatermarkVariantOverride(null);
  }, [wmVariant]);

  const play = () => setLockedFrame(null);
  // Lock to frame 0 to scrub; the range below moves it. (The canvas player takes the frame as a prop,
  // so no imperative control is needed.)
  const pause = () => setLockedFrame(0);

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

  // Re-key the player on the shared inputs so free-run playback restarts. wmVariant is in the key so a
  // variant flip re-renders immediately; the clip-set id so a set change restarts from frame 0.
  const restartKey = `${clipSetId}-${styleId}-${seed}-${orientation}-${watermark}-${wmVariant}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reel canvas styles</h1>
        <p className="text-sm text-muted-foreground">
          Every reel style on the canvas engine, on shared props. Pick a style,
          orientation, and seed; Pause to frame-lock and scrub for a still look
          at any moment. Encode renders the reel to an mp4 via WebCodecs (the
          same on-device path the composer ships).
        </p>
      </header>

      {/* Shared inputs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <select
          value={clipSetId}
          onChange={(e) => setClipSetId(e.target.value)}
          aria-label="Clip set"
          className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
        >
          {CLIP_SETS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="h-5 w-px bg-border" aria-hidden />
        <select
          value={styleId}
          onChange={(e) => {
            setStyleId(e.target.value);
            setLockedFrame(null);
          }}
          aria-label="Style"
          className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
        >
          {STYLE_IDS.map((id) => (
            <option key={id} value={id}>
              {resolveStyleEntry(id).label} ({id})
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
            aria-label="Watermark variant"
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
            onClick={pause}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
          >
            <Pause className="size-4" /> Pause + lock
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
          >
            <Play className="size-4" /> Play
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

      {/* Player + the encoded result */}
      <div className="flex flex-wrap items-start gap-6">
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
                download="reel-canvas-styles.mp4"
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
