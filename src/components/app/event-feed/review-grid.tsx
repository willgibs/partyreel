"use client";

import { type CSSProperties, useState } from "react";
import { Check, Play, X } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { tileAspect } from "@/lib/media/tile-aspect";

// The inline pending-review grid (the dense triage surface that replaces the takeover's grid).
// Natural-ratio masonry (columns, matching the album + the ratified lab look), media-forward.
// Two modes, driven by useReviewTriage:
//   • browse  → a tap peeks the media full-bleed (you can't judge a video from a poster); no
//               selection, so scrolling the "All" feed never selects by accident.
//   • select  → a tap toggles selection (checkmark + dim); the floating bar drives the bulk action.
// Reuses the shared CSS hooks: [data-review-tile] is NOT used here (no entrance theater on an
// always-present host surface), but [data-exiting] (the fade+scale removal beat) + [data-check-pop]
// (the checkmark micro-pop) are. Plain MediaTile <img>/<video> poster — never next/image (its
// optimizer 400s on presigned R2 URLs).
export function ReviewGrid({
  items,
  selectMode,
  selected,
  exiting,
  onToggle,
}: {
  items: GridMedia[];
  selectMode: boolean;
  selected: Set<string>;
  exiting: Set<string>;
  onToggle: (id: string) => void;
}) {
  // A lightweight peek overlay (browse mode): the host inspects a photo/video before approving,
  // without pulling the full gallery lightbox graph onto this surface.
  const [preview, setPreview] = useState<GridMedia | null>(null);

  return (
    <>
      <div className="columns-2 gap-[var(--gap-gallery)] sm:columns-3">
        {items.map((it) => {
          const isSelected = selected.has(it.id);
          return (
            <div
              key={it.id}
              data-exiting={exiting.has(it.id) ? "" : undefined}
              style={
                {
                  aspectRatio: tileAspect(it, false),
                  borderRadius: "var(--radius-tile)",
                } as CSSProperties
              }
              className="relative mb-[var(--gap-gallery)] w-full overflow-hidden break-inside-avoid bg-black/10 transition-[opacity,transform] duration-150 ease-emphasis"
            >
              <MediaTile item={it} playBadge="none" />

              {/* The full-tile tap target: toggles selection in select mode, peeks in browse mode. */}
              <button
                type="button"
                onClick={() =>
                  selectMode ? onToggle(it.id) : setPreview(it)
                }
                aria-pressed={selectMode ? isSelected : undefined}
                aria-label={
                  selectMode
                    ? isSelected
                      ? "Deselect"
                      : "Select"
                    : "Preview"
                }
                className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              />

              {/* Video marker: in browse mode a ▶ hints "tap to play"; in select mode it sits above
                  the select layer so a tap peeks the video instead of selecting (judge, then select). */}
              {it.type === "video" && (
                <button
                  type="button"
                  onClick={() => setPreview(it)}
                  aria-label="Preview video"
                  className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white outline-none transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Play className="size-4 translate-x-px fill-current" />
                </button>
              )}

              {/* Selection overlay + checkmark (select mode only; visual, never blocks clicks). */}
              {selectMode && (
                <>
                  <span
                    className={`pointer-events-none absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                  />
                  <span
                    className="pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-colors"
                    style={
                      isSelected
                        ? { borderColor: "#fff", background: "var(--success)" }
                        : {
                            borderColor: "rgba(255,255,255,0.85)",
                            background: "rgba(0,0,0,0.35)",
                          }
                    }
                  >
                    {isSelected && (
                      <Check data-check-pop className="size-3.5 text-white" />
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
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
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
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}
