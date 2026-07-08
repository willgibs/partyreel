"use client";

import {
  Check,
  Clapperboard,
  Clock,
  Download,
  Lock,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { type GridMedia } from "@/components/app/media-grid";
import { useReel } from "@/components/reel/reel-provider";
import {
  type ReelEncodeState,
  ReelStitchingDialog,
} from "@/components/reel/reel-stitching-dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  clampReelSeconds,
  MAX_REEL_SECONDS,
  type Tier,
} from "@/lib/constants/tiers";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import {
  DEFAULT_STYLE_ID,
  type Orientation,
  resolveStyleEntry,
  STYLE_CATALOG,
  STYLE_IDS,
} from "@/lib/reel/composition";
import { encodeReel } from "@/lib/reel/engine/encode";
import { shouldClientEncode } from "@/lib/reel/engine/encode-gate";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { probeEngineSupport } from "@/lib/reel/engine/support";
import type {
  ReelUploadBeginResponse,
  ReelUploadBody,
  ReelUploadErrorResponse,
  ReelUploadFinalizeResponse,
  ReelUploadMintResponse,
} from "@/lib/reel/upload-contract";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Every tier sees every option; a value past the tier cap renders LOCKED (the house upgrade-hint
// pattern, like the password/slug settings) — the visible-but-locked 60s IS the upgrade nudge.
const LENGTHS: { label: string; value: number | null }[] = [
  { label: "Auto", value: null },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
];

function rpcOk(data: unknown): boolean {
  return (
    !!data && typeof data === "object" && (data as { ok?: boolean }).ok === true
  );
}

/**
 * The live reel COMPOSER: the CANVAS-ENGINE player hero (CanvasReelPlayer — the same drawReelFrame
 * the encoder steps, so the preview pixels ARE the export pixels) + the controls (style ·
 * orientation · cover · length). All client-side + $0 — picking a style/orientation re-renders the
 * player instantly; nothing encodes. The seed is deterministic per reel (no shuffle — one stable,
 * reproducible take). Config persists (debounced) via upsert_reel_config, which lazily creates the
 * reel row on the first edit. Reads the shared ReelProvider so adds/removes/reorders in the grid
 * below reflect live.
 *
 * Download video runs one of TWO paths, decided per browser by the WebCodecs probe:
 *  - CLIENT ENCODE (the default; Plan A Phase C): encodeReel() renders the mp4 on-device from the
 *    SAME props the player shows, saves it locally, and uploads it to the reel output key via the
 *    host-authed /api/reel/upload begin→mint→finalize handshake (cached exactly like Lambda output).
 *  - LAMBDA FALLBACK (no WebCodecs): the untouched server render via /api/reel/render + the poll.
 * Do NOT import @remotion/player here — the Remotion twin lives on only for the parity harness
 * until the R8 teardown.
 */
export function ReelComposer({
  eventId,
  items,
  reelConfig,
  watermark,
  tier,
}: {
  eventId: string;
  /** All visible gallery items (already presigned); the reel is a subset by id. */
  items: GridMedia[];
  reelConfig: ReelConfig | null;
  /** Free tier → stamp the partyreel.com wordmark in the live player (mirrors the export). */
  watermark: boolean;
  /** The host's billing tier — drives the length cap (30s Free / 60s paid, ADR-0021). UX only;
   *  the reel-config RPC and the render path re-enforce server-side. */
  tier: Tier;
}) {
  const reel = useReel();
  const orderedIds = useMemo(() => reel?.orderedIds ?? [], [reel?.orderedIds]);

  // The chosen catalog style — from the stored style_id, else the legacy theme (if it's a valid style id),
  // else the default mood.
  const [styleId, setStyleId] = useState<string>(() => {
    if (reelConfig?.styleId && STYLE_IDS.includes(reelConfig.styleId))
      return reelConfig.styleId;
    if (reelConfig?.theme && STYLE_IDS.includes(reelConfig.theme))
      return reelConfig.theme;
    return DEFAULT_STYLE_ID;
  });
  const [orientation, setOrientation] = useState<Orientation>(() =>
    reelConfig?.orientation === "landscape" ? "landscape" : "portrait",
  );
  // The seed is deterministic per reel (no shuffle) — one stable, reproducible take.
  const seed = useMemo(
    () => reelConfig?.seed ?? defaultReelSeed(eventId),
    [reelConfig?.seed, eventId],
  );
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    () => reelConfig?.coverMediaId ?? null,
  );
  // The tier length cap (ADR-0021). A stored value past the cap (a downgraded host) initializes
  // clamped, so the UI never shows a locked option as active; the next save persists the clamp
  // (matching what the server would store anyway).
  const maxSeconds = MAX_REEL_SECONDS[tier];
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(() => {
    const stored = reelConfig?.lengthSeconds ?? null;
    return stored != null && stored > maxSeconds ? maxSeconds : stored;
  });
  const [styleOpen, setStyleOpen] = useState(false);

  const byId = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);

  // The in-reel, approved media (for the cover picker thumbnails) in reel order.
  const reelMedia = useMemo(
    () =>
      orderedIds
        .map((id) => byId.get(id))
        .filter((m): m is GridMedia => !!m && m.status === "approved"),
    [orderedIds, byId],
  );

  const reelProps = useMemo(
    () =>
      buildReelProps({
        orderedIds,
        byId,
        styleId,
        seed,
        orientation,
        coverMediaId,
        // The tier clamp, applied to the PREVIEW too: Auto fills up to the cap (30/60), so the
        // player shows exactly what the export renders (the render path applies the same clamp).
        lengthSeconds: clampReelSeconds(tier, lengthSeconds),
        posterMode: true,
        watermark,
      }),
    [
      orderedIds,
      byId,
      styleId,
      seed,
      orientation,
      coverMediaId,
      lengthSeconds,
      tier,
      watermark,
    ],
  );

  // The single config-persist (upsert_reel_config lazily creates the reel row). Shared by the debounced
  // auto-save AND the Download handler (which flushes the latest config FIRST, so the rendered .mp4
  // matches exactly what the player shows — no debounce race).
  const supabase = useMemo(() => createClient(), []);
  const persistConfig = useCallback(async (): Promise<boolean> => {
    const args: {
      p_event_id: string;
      p_style_id: string;
      p_orientation: string;
      p_seed: number;
      p_length_seconds?: number;
      p_cover_media_id?: string;
    } = {
      p_event_id: eventId,
      p_style_id: styleId,
      p_orientation: orientation,
      p_seed: seed,
    };
    // Omit (→ SQL default null) to CLEAR length/cover; pass to set.
    if (lengthSeconds != null) args.p_length_seconds = lengthSeconds;
    if (coverMediaId != null) args.p_cover_media_id = coverMediaId;
    const { data, error } = await supabase.rpc("upsert_reel_config", args);
    if (error || !rpcOk(data)) {
      toast.error("Couldn't save your reel settings.");
      return false;
    }
    return true;
  }, [
    eventId,
    styleId,
    orientation,
    seed,
    lengthSeconds,
    coverMediaId,
    supabase,
  ]);

  // Debounced auto-save. Skips the first run (the config is already server truth / defaults) so just
  // viewing the reel never writes; a real edit (style/orientation/cover/length) lazily upserts the row.
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persistConfig();
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [persistConfig]);

  // Download → the .mp4, via one of two paths (see the component JSDoc). `encodeState` doubles as
  // the mode flag for the shared progress dialog: set = on-device encode, null = the Lambda poll.
  const [downloading, setDownloading] = useState(false);
  const [stitchOpen, setStitchOpen] = useState(false);
  const [encodeState, setEncodeState] = useState<ReelEncodeState | null>(null);
  const encodeAbortRef = useRef<AbortController | null>(null);

  const downloadReel = useCallback((url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    // The presigned URL carries Content-Disposition: attachment, so the file saves (the download attr
    // is just a hint cross-origin).
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  // Save the just-encoded blob straight from memory (no round-trip through R2 for the host's copy).
  const saveBlobLocally = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on a delay: the browser needs the URL alive until the save stream opens.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, []);

  const closeEncode = useCallback(() => {
    encodeAbortRef.current = null;
    setEncodeState(null);
    setStitchOpen(false);
  }, []);

  // Closing the dialog mid-encode is the cancel gesture (the pipeline is local, so it just stops).
  const handleStitchOpenChange = useCallback(
    (open: boolean) => {
      if (!open && encodeState) {
        encodeAbortRef.current?.abort();
        closeEncode();
        return;
      }
      setStitchOpen(open);
    },
    [encodeState, closeEncode],
  );

  const postUpload = useCallback(async (body: ReelUploadBody) => {
    const res = await fetch("/api/reel/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | ReelUploadBeginResponse
      | ReelUploadMintResponse
      | ReelUploadFinalizeResponse
      | ReelUploadErrorResponse
      | null;
    return { ok: res.ok && data?.ok === true, data };
  }, []);

  /** The on-device export pipeline: begin (cache?) → encode → local save → mint → PUT → finalize. */
  const runClientEncode = useCallback(async () => {
    const begin = await postUpload({ phase: "begin", event_id: eventId });
    if (!begin.ok || begin.data?.ok !== true || !("mode" in begin.data)) {
      const message =
        begin.data && "message" in begin.data ? begin.data.message : null;
      toast.error(
        message ?? "Couldn't start your reel video. Please try again.",
      );
      return;
    }
    if (begin.data.mode === "cached") {
      // Nothing changed since the last export: the stored mp4 IS this config's output.
      downloadReel(begin.data.downloadUrl);
      toast.success("Your reel is ready.");
      return;
    }
    const { hash, filename } = begin.data;

    const controller = new AbortController();
    encodeAbortRef.current = controller;
    setEncodeState({ stage: "encoding", progress: 0 });
    setStitchOpen(true);

    // Encode the EXACT props the player is showing (the literal-WYSIWYG claim of the canvas engine).
    let blob: Blob;
    try {
      const encoded = await encodeReel(reelProps, {
        signal: controller.signal,
        onProgress: (progress) =>
          setEncodeState((s) =>
            s?.stage === "encoding" ? { stage: "encoding", progress } : s,
          ),
      });
      blob = encoded.blob;
    } catch {
      if (controller.signal.aborted) return; // host cancelled — already cleaned up
      setEncodeState({ stage: "error" });
      return;
    }
    if (controller.signal.aborted) return;

    // The host's artifact FIRST: save the local copy the moment the encode lands, so a flaky
    // network can never take the video away. The upload below only feeds the cached online copy.
    saveBlobLocally(blob, filename);

    setEncodeState({ stage: "uploading" });
    try {
      const mint = await postUpload({
        phase: "mint",
        event_id: eventId,
        hash,
        size_bytes: blob.size,
      });
      if (!mint.ok || mint.data?.ok !== true || !("uploadUrl" in mint.data)) {
        throw new Error("mint refused");
      }
      const put = await fetch(mint.data.uploadUrl, {
        method: "PUT",
        headers: mint.data.headers,
        body: blob,
        signal: controller.signal,
      });
      if (!put.ok) throw new Error("upload failed");
      const fin = await postUpload({
        phase: "finalize",
        event_id: eventId,
        hash,
      });
      if (!fin.ok) throw new Error("finalize refused");
      toast.success("Your reel is ready.");
    } catch {
      if (!controller.signal.aborted) {
        // The video is already on the device; only the stored copy (the instant re-download +
        // future guest surface) is missing. Say so honestly, don't fail the download.
        toast.warning(
          "Your video downloaded, but we couldn't store an online copy. The next download will re-create it.",
        );
      }
    } finally {
      closeEncode();
    }
  }, [
    eventId,
    reelProps,
    postUpload,
    downloadReel,
    saveBlobLocally,
    closeEncode,
  ]);

  /** The untouched Lambda fallback (no WebCodecs): trigger the server render + poll via the dialog. */
  const runLambdaRender = useCallback(async () => {
    try {
      const res = await fetch("/api/reel/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(
          data?.message ?? "Couldn't start your reel video. Please try again.",
        );
        return;
      }
      if (data.status === "ready" && data.downloadUrl) {
        downloadReel(data.downloadUrl);
        toast.success("Your reel is ready.");
      } else {
        setEncodeState(null);
        setStitchOpen(true); // processing → the modal polls until it's ready
      }
    } catch {
      toast.error("Couldn't start your reel video. Please try again.");
    }
  }, [eventId, downloadReel]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Flush the latest config FIRST so the export matches exactly what the player shows.
      await persistConfig();
      // Per-browser path decision: probe WebCodecs at the CURRENT orientation's dimensions. A probe
      // failure reads as "can't encode" and falls back to Lambda (never a broken download).
      const support = await probeEngineSupport(orientation).catch(() => null);
      if (shouldClientEncode(support, styleId)) {
        await runClientEncode();
      } else {
        await runLambdaRender();
      }
    } finally {
      setDownloading(false);
    }
  }, [persistConfig, orientation, styleId, runClientEncode, runLambdaRender]);

  return (
    <div className="space-y-3">
      <CanvasReelPlayer reelProps={reelProps} />

      {/* Auto-magic controls — no timeline, no sliders; just a vibe + a re-roll. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {/* Style — the catalog picker (media-first moods + stylized treatments); scales as it grows. */}
        <Popover open={styleOpen} onOpenChange={setStyleOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Wand2 />
              {resolveStyleEntry(styleId).label}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            {(["mood", "treatment"] as const).map((kind) => (
              <div key={kind} className="mb-1.5 last:mb-0">
                <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
                  {kind === "mood" ? "Media-first" : "Stylized"}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {STYLE_CATALOG.filter((s) => s.kind === kind).map((s) => {
                    const active = s.id === styleId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStyleId(s.id);
                          setStyleOpen(false);
                        }}
                        className={cn(
                          "rounded-md border px-2 py-1.5 text-left text-xs transition-transform ease-emphasis active:scale-[0.98]",
                          active
                            ? "border-primary bg-primary/5 font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>

        <div className="h-5 w-px bg-border" aria-hidden />

        {/* Orientation — portrait 9:16 / landscape 16:9; every style adapts to both. */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Orientation"
        >
          {(["portrait", "landscape"] as const).map((o) => {
            const active = o === orientation;
            return (
              <Button
                key={o}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setOrientation(o)}
                className="capitalize"
              >
                {o}
              </Button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-border" aria-hidden />

        {/* Cover — pin the opening shot. */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Clapperboard />
              Cover
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <p className="mb-2 px-1 text-xs text-muted-foreground">
              Opening shot
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCoverMediaId(null)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border text-[0.7rem] text-muted-foreground transition-colors ease-emphasis active:scale-[0.97]",
                  coverMediaId == null && "border-primary text-foreground",
                )}
              >
                Auto
              </button>
              {reelMedia.map((m) => {
                const active = m.id === coverMediaId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCoverMediaId(m.id)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-md border transition-transform ease-emphasis active:scale-[0.97]",
                      active && "ring-2 ring-primary",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.previewUrl ?? m.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {active && (
                      <span className="absolute top-0.5 right-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-5 w-px bg-border" aria-hidden />

        {/* Length — auto, or a tier-capped duration. Options past the cap render locked (UX only;
            the config RPC + render path clamp server-side). */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Length"
        >
          <Clock className="size-3.5 text-muted-foreground" aria-hidden />
          {LENGTHS.map((l) => {
            const active = l.value === lengthSeconds;
            const locked = l.value != null && l.value > maxSeconds;
            return (
              <Button
                key={l.label}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                disabled={locked}
                aria-label={locked ? `${l.label} (paid plans)` : undefined}
                onClick={() => setLengthSeconds(l.value)}
              >
                {locked && <Lock aria-hidden />}
                {l.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* The length caption: what Auto does + (on Free) the house upgrade hint for the locked 60s. */}
      <p className="text-xs text-muted-foreground">
        Auto fills your reel up to {maxSeconds} seconds.
        {tier === "free" && (
          <>
            {" "}
            60-second reels are a paid feature.{" "}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Upgrade to enable
            </Link>
            .
          </>
        )}
      </p>

      {/* Download → the .mp4 (client encode when the browser can, Lambda otherwise). The old
          "preview is optimized for speed" tip is gone on purpose: with the canvas engine the
          preview and the encoded export are the same pixels. */}
      <div className="flex flex-col gap-1.5 border-t pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Button type="button" onClick={handleDownload} disabled={downloading}>
            <Download />
            {downloading ? "Preparing…" : "Download video"}
          </Button>
          {watermark && (
            <span className="text-xs text-muted-foreground">
              Free reels include a small partyreel.com mark.
            </span>
          )}
        </div>
      </div>

      <ReelStitchingDialog
        eventId={eventId}
        open={stitchOpen}
        onOpenChange={handleStitchOpenChange}
        onReady={downloadReel}
        onRetry={handleDownload}
        encode={encodeState}
      />
    </div>
  );
}
