"use client";

import { type CSSProperties, useState } from "react";
import { Check, Play, X } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import {
  CornerPlayBadge,
  GALLERY_COLUMNS,
  GALLERY_UNIFORM_COLUMNS,
} from "@/components/shared/masonry";
import { GLASS, GLASS_BEHIND, GLASS_MARK } from "@/lib/glass";
import { tileAspect, UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

// The shared selectable masonry — one natural-ratio grid that BOTH the Review triage and the Gallery
// album bulk-select render. Media-forward (columns, matching the album look). Reuses the shared CSS
// hooks: [data-exiting] (the fade+scale removal beat) + [data-check-pop] (the checkmark micro-pop).
// Plain MediaTile <img>/<video> poster — never next/image (its optimizer 400s on presigned R2 URLs).
//
// Two configurations:
//   • enablePreview (Review) → a tap in BROWSE mode peeks the media full-bleed (you can't judge a video
//     from a poster); a tap in SELECT mode toggles; the video ▶ always peeks.
//   • no preview (Gallery)   → there is no browse mode (the grid only mounts while selecting), so every
//     tap toggles; videos wear the static corner play badge, no peek graph pulled onto the album.
export type SelectableMediaGridProps = {
  items: GridMedia[];
  selectMode: boolean;
  selected: Set<string>;
  exiting: Set<string>;
  onToggle: (id: string) => void;
  /** Review = true (browse peek + preview modal). Gallery = false (tap always toggles). */
  enablePreview?: boolean;
  /** Must MATCH the surface's normal grid so toggling select never reflows tile heights — the
   *  gallery clamps extreme ratios (MasonryColumns clampAspect), the review queue does not. */
  clampAspect?: boolean;
  /** "masonry" (Gallery album select — the "wow") vs "uniform" (Review — a fixed-aspect grid for
   *  standardized selection hit-targets). Mirrors MasonryColumns. */
  layout?: "masonry" | "uniform";
};

export function SelectableMediaGrid({
  items,
  selectMode,
  selected,
  exiting,
  onToggle,
  enablePreview = false,
  clampAspect = false,
  layout = "masonry",
}: SelectableMediaGridProps) {
  const uniform = layout === "uniform";
  // A lightweight peek overlay (browse mode only): inspect a photo/video before approving, without
  // pulling the full gallery lightbox graph onto this surface.
  const [preview, setPreview] = useState<GridMedia | null>(null);

  return (
    <>
      <div className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}>
        {items.map((it) => {
          const isSelected = selected.has(it.id);
          return (
            <div
              key={it.id}
              data-exiting={exiting.has(it.id) ? "" : undefined}
              style={
                {
                  aspectRatio: uniform
                    ? UNIFORM_TILE_ASPECT
                    : tileAspect(it, clampAspect),
                  borderRadius: "var(--radius-tile)",
                } as CSSProperties
              }
              className={
                uniform
                  ? "relative w-full overflow-hidden bg-black/10 transition-[opacity,transform] duration-150 ease-emphasis"
                  : "relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10 transition-[opacity,transform] duration-150 ease-emphasis"
              }
            >
              <MediaTile item={it} playBadge="none" />

              {/* The full-tile tap target: toggles selection in select mode, peeks in browse mode
                  (peek only exists when previews are enabled). */}
              <button
                type="button"
                onClick={() =>
                  selectMode
                    ? onToggle(it.id)
                    : enablePreview
                      ? setPreview(it)
                      : undefined
                }
                aria-pressed={selectMode ? isSelected : undefined}
                aria-label={
                  selectMode ? (isSelected ? "Deselect" : "Select") : "Preview"
                }
                className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              />

              {/* Video marker. With previews on, the ▶ sits above the select layer so a tap peeks the
                  video instead of selecting (judge, then select). Without previews (the album), it's the
                  shared static corner badge — non-interactive, the whole tile just toggles. */}
              {it.type === "video" &&
                (enablePreview ? (
                  <button
                    type="button"
                    onClick={() => setPreview(it)}
                    aria-label="Preview video"
                    className={cn(
                      "absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white outline-none",
                      "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white active:scale-90 motion-reduce:active:scale-100",
                      GLASS_MARK,
                    )}
                  >
                    <Play className="size-4 translate-x-px fill-current" />
                  </button>
                ) : (
                  <CornerPlayBadge />
                ))}

              {/* Selection overlay + checkmark (select mode only; visual, never blocks clicks). */}
              {selectMode && (
                <>
                  <span
                    className={`pointer-events-none absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                  />
                  {/* ★ THE CHECK IS A MARK, IN THE ONE MATERIAL, and its SELECTED
                      state keeps its colour: state feedback is always coloured
                      (--success), which is the rule glass does not get to soften.
                      Unselected it is the material with the material's own hairline,
                      so an empty check no longer needs a hand-typed ring. */}
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full",
                      isSelected
                        ? "bg-success text-success-foreground ring-2 ring-white"
                        : GLASS_MARK,
                    )}
                  >
                    {isSelected && (
                      <Check data-check-pop className="size-3.5" />
                    )}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Peek overlay: a fixed full-bleed view of the tapped media; backdrop / ✕ / Escape closes.
          Rendered at the feed root (fixed), so it sits above the sticky pills + the floating bar. */}
      {enablePreview && preview && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            // The peek stands on the same ground the lightbox does (`behind=album`):
            // the queue behind it, blurred at half brightness. Its children paint
            // above the filter, so the media it exists to show is never in it.
            GLASS_BEHIND,
          )}
          onClick={() => setPreview(null)}
        >
          {preview.type === "video" ? (
            <video
              src={preview.url}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[94vw] rounded-md"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it
            <img
              src={preview.url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[94vw] rounded-md object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
            className={cn(
              "absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white outline-none",
              "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
              GLASS,
            )}
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}
