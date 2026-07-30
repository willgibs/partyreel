"use client";

/**
 * THE STUDIO: a dedicated room for the reel, at its own route.
 *
 * Ruled a ROUTE and not a modal (Will, R3): the reel deserves a place you GO to,
 * it survives a refresh, and the phone's back gesture means what it looks like it
 * means. Inside, the canvas is the room. Everything else is either a dock under it
 * (reorder, without swapping modes) or a sheet that slides over it (the four
 * settings), so the reel is never off screen while the host works on it.
 *
 * The one loud action in here is Share, framed BY the canvas: the glow breathes on
 * the reel's own frame, because what is being published is the thing you are
 * looking at.
 */

import { Check, Download, Lock, Share2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import { useReel } from "@/components/reel/reel-provider";
import { useReelPublish } from "@/components/reel/reel-share-card";
import { ReelStitchingDialog } from "@/components/reel/reel-stitching-dialog";
import { StudioFilmstrip } from "@/components/reel/studio-filmstrip";
import { StyleWall } from "@/components/reel/style-rail";
import {
  NO_EXPORT_NOTICE,
  REEL_LENGTHS,
  useReelConfig,
} from "@/components/reel/use-reel-config";
import { rxpMs } from "@/components/reel/reveal-constants";
import { type GridMedia } from "@/components/app/media-grid";
import { type Tier } from "@/lib/constants/tiers";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type Sheet = "none" | "style" | "cover" | "length" | "layout";

const SHEETS: { id: Exclude<Sheet, "none">; label: string }[] = [
  { id: "style", label: "Style" },
  { id: "cover", label: "Cover" },
  { id: "length", label: "Length" },
  { id: "layout", label: "Layout" },
];

/** The dark-room chip: the Studio's own control language (the app's light chips
 *  would fight the room). */
function RoomChip({
  active,
  disabled,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-50 motion-reduce:active:scale-100",
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80",
        disabled && "border-dashed",
      )}
    >
      {children}
    </button>
  );
}

export function ReelStudio({
  eventId,
  eventName,
  items,
  reelConfig,
  watermark,
  tier,
  guestVisible,
}: {
  eventId: string;
  eventName: string;
  items: GridMedia[];
  reelConfig: ReelConfig | null;
  watermark: boolean;
  tier: Tier;
  guestVisible: boolean;
}) {
  const router = useRouter();
  const reel = useReel();
  const reduced = usePrefersReducedMotion();
  const config = useReelConfig({ eventId, items, reelConfig, watermark, tier });
  const publish = useReelPublish(eventId, guestVisible);

  const [sheet, setSheet] = useState<Sheet>("none");
  const [showControls, setShowControls] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const publishTimer = useRef<number | null>(null);
  // The trigger that opened the current sheet, so Escape can hand focus back
  // instead of dropping it on the document.
  const sheetTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(
    () => () => {
      if (publishTimer.current !== null)
        window.clearTimeout(publishTimer.current);
    },
    [],
  );

  const closeSheet = useCallback(() => {
    setSheet("none");
    sheetTrigger.current?.focus({ preventScroll: true });
  }, []);

  // Escape closes the open sheet. Registered only while one is open, so it never
  // competes with anything else for the key.
  useEffect(() => {
    if (sheet === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, closeSheet]);

  /** X: back to wherever the host came from, but REFRESH first. The event page is
   *  force-dynamic yet still route-cached on the client, so without this the feed
   *  would show the pre-Studio config (a stale style, an old cover). */
  function exit() {
    router.back();
    router.refresh();
  }

  function share() {
    if (publishing || publish.pending) return;
    if (reduced) {
      // No theater under reduced motion: the state just lands.
      publish.flip(true);
      return;
    }
    setPublishing(true);
    publish.flip(true);
    // The glow + the confirmation card ride ONE timer read from the same var the
    // CSS animates on, so retiming the knob retimes both halves together.
    publishTimer.current = window.setTimeout(
      () => setPublishing(false),
      rxpMs("--tune-rxp-pub-ms") + 900,
    );
  }

  const meta = formatReelMeta({
    durationLabel: formatReelDuration(config.effectiveSeconds),
    styleLabel: config.styleEntry.label,
    momentCount: config.timeline.length,
  });

  return (
    // The room: full-bleed, near-black, its own world. min-h-dvh (never vh) so
    // mobile browser chrome cannot push the dock off the bottom.
    <div
      data-rxp-studio
      className="fixed inset-x-0 top-0 z-40 flex h-dvh flex-col bg-[oklch(0.11_0_0)]"
    >
      {/* Header: exit left, the room's name, ONE loud action right. */}
      <div className="flex items-center justify-between gap-2 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={exit}
          aria-label="Close the studio"
          className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100"
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[9px] font-medium tracking-[0.24em] text-white/50 uppercase">
            The studio
          </p>
          <p className="truncate text-[11px] text-white/40">{meta}</p>
        </div>
        {!publish.shared ? (
          <button
            type="button"
            onClick={share}
            disabled={publishing || publish.pending}
            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Share2 className="size-3.5" aria-hidden />
            Share
          </button>
        ) : (
          <button
            type="button"
            onClick={() => publish.flip(false)}
            disabled={publish.pending}
            className="flex h-9 items-center gap-1 rounded-[var(--radius-action-sm)] border border-reel/50 px-3 text-xs font-medium text-[oklch(0.8_0.14_300)] transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Check className="size-3.5" aria-hidden />
            Shared
          </button>
        )}
      </div>

      {/* The canvas IS the room. Height-fit (aspect from h-full) so the WHOLE
          frame sits above the dock instead of sliding under it. */}
      <div className="relative min-h-0 flex-1 px-6">
        <div
          className={cn(
            "relative mx-auto h-full max-w-full",
            config.orientation === "landscape"
              ? "aspect-[16/9]"
              : "aspect-[9/16]",
          )}
        >
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            aria-pressed={showControls}
            aria-label={
              showControls ? "Hide playback controls" : "Show playback controls"
            }
            className="block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <CanvasReelPlayer
              reelProps={config.reelProps}
              showControls={showControls}
            />
          </button>
          {/* The publish beat: a violet glow breathing on the reel's OWN frame. */}
          {publishing ? (
            <div
              aria-hidden
              data-rxp-pubglow
              className="pointer-events-none absolute inset-0 rounded-xl"
            />
          ) : null}
        </div>
        {publishing ? (
          <div
            data-rxp-toastcard
            role="status"
            className="absolute inset-x-6 bottom-2 flex items-center gap-2 rounded-lg bg-white/95 p-2.5 shadow-lg"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-reel text-white"
            >
              <Check className="size-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-zinc-900">
                Guests can now watch
              </p>
              <p className="text-[10px] text-zinc-500">
                Live on the album page
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* The dock: reorder while the reel keeps playing. */}
      <div className="px-3 pt-2">
        {reel && config.membership.length > 1 ? (
          <StudioFilmstrip
            items={config.membership}
            coverMediaId={config.coverMediaId}
            onReorder={(ids) => void reel.reorder(ids)}
          />
        ) : null}
      </div>

      {/* The control tray: four sheets that slide over the canvas. */}
      <div className="flex items-center justify-center gap-1.5 px-3 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {SHEETS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-expanded={sheet === id}
            onClick={(e) => {
              sheetTrigger.current = e.currentTarget;
              setSheet(sheet === id ? "none" : id);
            }}
            className={cn(
              "flex h-8 items-center rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100",
              sheet === id
                ? "border-white bg-white text-zinc-900"
                : "border-white/20 text-white/80",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ONE sheet at a time, each mounted only while open. That is what makes the
          Style wall affordable: closing it drops 14 canvases, and the shared bitmap
          cache makes reopening cheap. NOT vaul: these are small, non-draggable
          panels over a canvas, so a drawer library's gesture machinery would only
          fight the filmstrip's own pointer handling. */}
      {sheet !== "none" ? (
        <div
          data-rxp-sheet
          role="dialog"
          aria-label={SHEETS.find((s) => s.id === sheet)?.label}
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
            sheet === "style" && "max-h-[52%] overflow-y-auto",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
              {SHEETS.find((s) => s.id === sheet)?.label}
            </p>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-full border border-white/15 text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          {sheet === "style" ? (
            <StyleWall
              reelProps={config.reelProps}
              styleId={config.styleId}
              onSelect={config.setStyleId}
            />
          ) : null}

          {sheet === "cover" ? (
            <div
              role="group"
              aria-label="Opening shot"
              className="flex items-center gap-1.5 overflow-x-auto pb-1"
            >
              <RoomChip
                active={config.coverMediaId == null}
                onClick={() => config.setCoverMediaId(null)}
              >
                Auto
              </RoomChip>
              {config.timeline.map((m, i) => {
                const active = m.id === config.coverMediaId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Use item ${i + 1} as the opening shot`}
                    aria-pressed={active}
                    onClick={() => config.setCoverMediaId(m.id)}
                    className={cn(
                      "shrink-0 overflow-hidden rounded-[4px] transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100",
                      active && "ring-2 ring-reel",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.previewUrl ?? m.url}
                      alt=""
                      className="h-16 w-9 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          {sheet === "length" ? (
            <>
              <div role="group" aria-label="Length" className="flex gap-1.5">
                {REEL_LENGTHS.map((l) => {
                  const locked = l.value != null && l.value > config.maxSeconds;
                  return (
                    <RoomChip
                      key={l.label}
                      active={l.value === config.lengthSeconds}
                      disabled={locked}
                      ariaLabel={locked ? `${l.label} (paid plans)` : undefined}
                      onClick={() => config.setLengthSeconds(l.value)}
                    >
                      {locked ? (
                        <Lock className="size-2.5" aria-hidden />
                      ) : null}
                      {l.label}
                    </RoomChip>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-white/45">
                Auto fits your moments into {config.maxSeconds} seconds.
              </p>
            </>
          ) : null}

          {sheet === "layout" ? (
            <div role="group" aria-label="Layout" className="flex gap-1.5">
              {(["portrait", "landscape"] as const).map((o) => (
                <RoomChip
                  key={o}
                  active={o === config.orientation}
                  onClick={() => config.setOrientation(o)}
                >
                  <span className="capitalize">{o}</span>
                </RoomChip>
              ))}
            </div>
          ) : null}

          {/* Download lives in the Length sheet's neighbourhood rather than the
              room's chrome: the room is for LOOKING, and the mp4 is a utility. */}
          {sheet === "length" ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              {config.exportSupported === false ? (
                <p className="text-[11px] text-white/45">{NO_EXPORT_NOTICE}</p>
              ) : (
                <button
                  type="button"
                  onClick={config.handleDownload}
                  disabled={config.downloading}
                  className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/20 px-3 text-[11px] font-medium text-white/80 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-60 motion-reduce:active:scale-100"
                >
                  <Download className="size-3.5" aria-hidden />
                  {config.downloading ? "Preparing…" : "Download video"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* The event's name, quietly, so the room still knows whose night it is. */}
      <p className="pointer-events-none absolute inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] text-center text-[10px] text-white/25">
        {eventName}
      </p>

      {config.encodeState ? (
        <ReelStitchingDialog
          open={config.stitchOpen}
          onOpenChange={config.handleStitchOpenChange}
          onRetry={config.handleDownload}
          encode={config.encodeState}
        />
      ) : null}
    </div>
  );
}
