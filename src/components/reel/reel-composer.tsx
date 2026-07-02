"use client";

import { Check, Clapperboard, Clock, Download, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { type GridMedia } from "@/components/app/media-grid";
import { ReelPlayer } from "@/components/reel/reel-player";
import { useReel } from "@/components/reel/reel-provider";
import { ReelStitchingDialog } from "@/components/reel/reel-stitching-dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import {
  DEFAULT_STYLE_ID,
  type Orientation,
  resolveStyleEntry,
  STYLE_CATALOG,
  STYLE_IDS,
} from "@/lib/reel/composition";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LENGTHS: { label: string; value: number | null }[] = [
  { label: "Auto", value: null },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
];

function rpcOk(data: unknown): boolean {
  return (
    !!data && typeof data === "object" && (data as { ok?: boolean }).ok === true
  );
}

/**
 * The live reel COMPOSER: the @remotion/player hero + the controls (style · orientation · cover · length).
 * All client-side + $0 — picking a style/orientation re-renders the player instantly; nothing encodes. The
 * seed is deterministic per reel (no shuffle — one stable, reproducible take). Config persists (debounced)
 * via upsert_reel_config, which lazily creates the reel row on the first edit. Reads the shared ReelProvider
 * so adds/removes/reorders in the grid below reflect live. The player == the export (WYSIWYG).
 */
export function ReelComposer({
  eventId,
  items,
  reelConfig,
  watermark,
}: {
  eventId: string;
  /** All visible gallery items (already presigned); the reel is a subset by id. */
  items: GridMedia[];
  reelConfig: ReelConfig | null;
  /** Free tier → stamp the partyreel.com wordmark in the live player (mirrors the export). */
  watermark: boolean;
}) {
  const reel = useReel();
  const orderedIds = useMemo(() => reel?.orderedIds ?? [], [reel?.orderedIds]);

  // The chosen catalog style — from the stored style_id, else the legacy theme (if it's a valid style id),
  // else the default mood.
  const [styleId, setStyleId] = useState<string>(() => {
    if (reelConfig?.styleId && STYLE_IDS.includes(reelConfig.styleId)) return reelConfig.styleId;
    if (reelConfig?.theme && STYLE_IDS.includes(reelConfig.theme)) return reelConfig.theme;
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
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(
    () => reelConfig?.lengthSeconds ?? null,
  );
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
        lengthSeconds,
        posterMode: true,
        watermark,
      }),
    [orderedIds, byId, styleId, seed, orientation, coverMediaId, lengthSeconds, watermark],
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
  }, [eventId, styleId, orientation, seed, lengthSeconds, coverMediaId, supabase]);

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

  // Download → render the .mp4. Cached unchanged reels come back ready instantly; otherwise a render
  // kicks off and the Stitching modal polls until it lands. A presigned attachment URL → an <a> click.
  const [downloading, setDownloading] = useState(false);
  const [stitchOpen, setStitchOpen] = useState(false);

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

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await persistConfig();
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
        setStitchOpen(true); // processing → the modal polls until it's ready
      }
    } catch {
      toast.error("Couldn't start your reel video. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [eventId, persistConfig, downloadReel]);

  return (
    <div className="space-y-3">
      <ReelPlayer reelProps={reelProps} />

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

        {/* Length — auto, or a tier-capped duration. */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Length"
        >
          <Clock className="size-3.5 text-muted-foreground" aria-hidden />
          {LENGTHS.map((l) => {
            const active = l.value === lengthSeconds;
            return (
              <Button
                key={l.label}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setLengthSeconds(l.value)}
              >
                {l.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Download → the .mp4. The tip makes the preview-vs-export quality gap explicit (the player runs
          on fast previews; the download renders from full-res originals). */}
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
        <p className="text-xs text-muted-foreground">
          This preview is optimized for speed. Your download renders in full
          quality.
        </p>
      </div>

      <ReelStitchingDialog
        eventId={eventId}
        open={stitchOpen}
        onOpenChange={setStitchOpen}
        onReady={downloadReel}
        onRetry={handleDownload}
      />
    </div>
  );
}
