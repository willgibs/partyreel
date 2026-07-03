"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CanvasSource,
  Mp4OutputFormat,
  BufferTarget,
  Output,
  canEncodeVideo,
  getEncodableVideoCodecs,
} from "mediabunny";

/**
 * The Plan-A spike engine: ONE draw function drives both the live rAF player
 * and the frame-stepped encode, which is the whole architectural claim (player
 * == export by the same pixels). The scene is deliberately representative of a
 * mood's per-frame work: a heavy blur wash background (done via the
 * DOWNSAMPLE-CHAIN trick, no ctx.filter needed - this IS the production blur
 * technique), a Ken-Burns cover-fit foreground in a rounded clip with a
 * shadow, crossfades, a CSS-filter-style grade, and the watermark.
 */

const W = 1080;
const H = 1920;
const FPS = 24;
const SLOT_SEC = 2.4; // per-photo hold
const CROSS_SEC = 0.7; // crossfade overlap
const PHOTOS = ["/design/p01.jpg", "/design/p02.jpg", "/design/p03.jpg", "/design/p04.jpg"];
const BITRATE = 8_000_000; // probes the "saner than Lambda's 12Mbps" size question too

type Assets = {
  photos: HTMLImageElement[];
  // Pre-blurred washes, one per photo: blurred ONCE at load (production does the
  // same per clip) - the per-frame cost is just the scaled draw.
  washes: HTMLCanvasElement[];
  filterSupported: boolean;
};

type SupportReport = {
  avc1080x1920: boolean;
  codecs: string[];
  ctxFilter: boolean;
  offscreen: boolean;
  ua: string;
};

type EncodeStats = {
  durationSec: number;
  wallMs: number;
  ratio: number; // media seconds per wall second; >= 1 means faster than realtime
  bytes: number;
  fps: number;
};

function detectCtxFilter(): boolean {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  if (!ctx) return false;
  ctx.filter = "blur(2px)";
  return ctx.filter !== "none";
}

/** The 46px-class blur, built by repeated downsampling (works everywhere,
 * cheap by construction: each pass is a tiny draw). */
function buildWash(img: HTMLImageElement): HTMLCanvasElement {
  let src: HTMLCanvasElement | HTMLImageElement = img;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  // Chain down to ~1/16 then back up one step: approximates a heavy gaussian.
  for (const factor of [0.5, 0.5, 0.25]) {
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(w * factor));
    c.height = Math.max(2, Math.round(h * factor));
    const cx = c.getContext("2d")!;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(src, 0, 0, c.width, c.height);
    src = c;
    w = c.width;
    h = c.height;
  }
  return src as HTMLCanvasElement;
}

function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** Draw a source cover-fit into a rect (like object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawSlide(
  ctx: CanvasRenderingContext2D,
  assets: Assets,
  index: number,
  local: number, // 0..1 through the slot
  alpha: number,
) {
  const img = assets.photos[index % assets.photos.length];
  const wash = assets.washes[index % assets.washes.length];
  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. The blur wash, darkened (the treatment-class heavy layer).
  drawCover(ctx, wash, wash.width, wash.height, 0, 0, W, H);
  ctx.fillStyle = "rgba(10,10,12,0.42)";
  ctx.fillRect(0, 0, W, H);

  // 2. Ken-Burns foreground in a rounded clip with a shadow.
  const pad = 84;
  const fw = W - pad * 2;
  const fh = Math.round(fw * 1.25);
  const fy = (H - fh) / 2;
  const zoom = 1.06 + 0.08 * easeInOut(local);
  const driftX = (local - 0.5) * 36;

  if (assets.filterSupported) ctx.filter = "saturate(1.12) contrast(1.06) brightness(1.02)";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.beginPath();
  ctx.roundRect(pad, fy, fw, fh, 24);
  ctx.fill(); // paints the shadow from the path
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, fy, fw, fh, 24);
  ctx.clip();
  ctx.translate(W / 2 + driftX, fy + fh / 2);
  ctx.scale(zoom, zoom);
  drawCover(ctx, img, img.naturalWidth, img.naturalHeight, -fw / 2, -fh / 2, fw, fh);
  ctx.restore();
  ctx.filter = "none";
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, t: number, assets: Assets) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);

  const slot = SLOT_SEC;
  const i = Math.floor(t / slot);
  const local = (t % slot) / slot;
  const crossK = Math.min(1, Math.max(0, (t % slot) / CROSS_SEC));

  // Outgoing slide finishes its fade while the incoming starts (crossfade).
  if (crossK < 1 && i > 0) drawSlide(ctx, assets, i - 1, 1, 1 - crossK);
  drawSlide(ctx, assets, i, local, crossK < 1 && i > 0 ? crossK : 1);

  // Watermark (drawn in-engine, exactly like production free tier will).
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("partyreel.com", W - 48, H - 56);
  ctx.restore();
}

async function loadAssets(): Promise<Assets> {
  const photos = await Promise.all(
    PHOTOS.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`load failed: ${src}`));
          img.src = src;
        }),
    ),
  );
  return { photos, washes: photos.map(buildWash), filterSupported: detectCtxFilter() };
}

export function ReelSpike() {
  const liveRef = useRef<HTMLCanvasElement>(null);
  const encodeRef = useRef<HTMLCanvasElement>(null);
  const assetsRef = useRef<Assets | null>(null);
  const rafRef = useRef<number>(0);

  const [support, setSupport] = useState<SupportReport | null>(null);
  const [liveFps, setLiveFps] = useState<number | null>(null);
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<EncodeStats | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Support probe + assets, once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [avc, codecs, assets] = await Promise.all([
          canEncodeVideo("avc", { width: W, height: H, bitrate: BITRATE }),
          getEncodableVideoCodecs(),
          loadAssets(),
        ]);
        if (!alive) return;
        assetsRef.current = assets;
        setSupport({
          avc1080x1920: avc,
          codecs,
          ctxFilter: assets.filterSupported,
          offscreen: typeof OffscreenCanvas !== "undefined",
          ua: navigator.userAgent,
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // The live player half: same drawFrame on rAF, with a rolling FPS meter.
  useEffect(() => {
    if (!support) return;
    const canvas = liveRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const t0 = performance.now();
    let frames = 0;
    let windowStart = t0;
    const tick = (now: number) => {
      const assets = assetsRef.current;
      if (assets) drawFrame(ctx, ((now - t0) / 1000) % (PHOTOS.length * SLOT_SEC), assets);
      frames += 1;
      if (now - windowStart >= 1000) {
        setLiveFps(Math.round((frames * 1000) / (now - windowStart)));
        frames = 0;
        windowStart = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [support]);

  const encode = useCallback(async (durationSec: number) => {
    const assets = assetsRef.current;
    const canvas = encodeRef.current;
    const ctx = canvas?.getContext("2d");
    if (!assets || !canvas || !ctx) return;
    setEncoding(true);
    setStats(null);
    setError(null);
    setProgress(0);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    try {
      const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
      const source = new CanvasSource(canvas, { codec: "avc", bitrate: BITRATE });
      output.addVideoTrack(source);
      await output.start();

      const totalFrames = Math.round(durationSec * FPS);
      const started = performance.now();
      for (let f = 0; f < totalFrames; f += 1) {
        drawFrame(ctx, f / FPS, assets);
        // add() applies encoder backpressure, so the loop cannot outrun WebCodecs.
        await source.add(f / FPS, 1 / FPS);
        if (f % 12 === 0) setProgress(f / totalFrames);
      }
      await output.finalize();
      const wallMs = performance.now() - started;
      const buffer = output.target.buffer!;
      const blob = new Blob([buffer], { type: "video/mp4" });
      setVideoUrl(URL.createObjectURL(blob));
      setStats({
        durationSec,
        wallMs: Math.round(wallMs),
        ratio: durationSec / (wallMs / 1000),
        bytes: blob.size,
        fps: Math.round((totalFrames * 1000) / wallMs),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEncoding(false);
      setProgress(1);
    }
    // videoUrl intentionally read-then-replaced; not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdict =
    support === null ? "probing..." : support.avc1080x1920 ? "AVC 1080x1920: SUPPORTED" : "AVC 1080x1920: NOT SUPPORTED";

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, display: "grid", gap: 20 }}>
      <h1 style={{ font: "700 28px/1.2 system-ui", margin: 0 }}>Reel engine spike</h1>
      <p style={{ margin: 0, opacity: 0.75, font: "15px/1.5 system-ui" }}>
        One draw function, two consumers: the live canvas below runs it on rAF (the future player);
        Encode steps it frame-by-frame through WebCodecs h264 into an mp4 (the future export).
      </p>

      <section
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          borderRadius: 8,
          padding: 16,
          font: "14px/1.7 ui-monospace, monospace",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>{verdict}</div>
        {support && (
          <>
            <div>encodable codecs: {support.codecs.join(", ") || "none"}</div>
            <div>ctx.filter grades: {support.ctxFilter ? "yes" : "NO (WebGL grade needed on this browser)"}</div>
            <div>OffscreenCanvas: {support.offscreen ? "yes" : "no"}</div>
            <div>live draw: {liveFps === null ? "-" : `${liveFps} fps (target ${FPS})`}</div>
            <div style={{ opacity: 0.6, wordBreak: "break-all" }}>{support.ua}</div>
          </>
        )}
        {error && <div style={{ color: "#f66" }}>error: {error}</div>}
      </section>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => encode(8)} disabled={encoding || !support?.avc1080x1920} style={btn}>
          Encode 8s
        </button>
        <button onClick={() => encode(30)} disabled={encoding || !support?.avc1080x1920} style={btn}>
          Encode 30s
        </button>
        {encoding && <span style={{ font: "14px ui-monospace" }}>{Math.round(progress * 100)}%</span>}
      </div>

      {stats && (
        <section
          style={{
            border: "1px solid rgba(100,200,120,0.5)",
            borderRadius: 8,
            padding: 16,
            font: "15px/1.8 ui-monospace, monospace",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {stats.durationSec}s reel encoded in {(stats.wallMs / 1000).toFixed(1)}s ({stats.ratio.toFixed(2)}x
            realtime, {stats.fps} fps)
          </div>
          <div>size: {(stats.bytes / 1024 / 1024).toFixed(1)} MB at {BITRATE / 1e6} Mbps</div>
        </section>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <figure style={{ margin: 0 }}>
          <canvas
            ref={liveRef}
            width={W}
            height={H}
            style={{ width: 270, height: 480, borderRadius: 8, background: "#000" }}
          />
          <figcaption style={cap}>live (rAF)</figcaption>
        </figure>
        {videoUrl && (
          <figure style={{ margin: 0 }}>
            <video
              src={videoUrl}
              controls
              playsInline
              style={{ width: 270, height: 480, borderRadius: 8, background: "#000" }}
            />
            <figcaption style={cap}>
              encoded mp4 · <a href={videoUrl} download="reel-spike.mp4">download</a>
            </figcaption>
          </figure>
        )}
      </div>

      {/* The encode target: full-res, kept offscreen-ish (tiny + hidden). */}
      <canvas ref={encodeRef} width={W} height={H} style={{ display: "none" }} />
    </div>
  );
}

const btn: React.CSSProperties = {
  font: "600 15px system-ui",
  padding: "10px 18px",
  borderRadius: 16,
  border: "1px solid rgba(128,128,128,0.5)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const cap: React.CSSProperties = { font: "13px ui-monospace, monospace", opacity: 0.7, marginTop: 6 };
