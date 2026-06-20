"use client";

/**
 * The shared masonry primitive (Phase 5 S2a): CSS columns flow GridMedia tiles
 * at their NATURAL aspect ratios (3px gaps + 3px tile radius), lifted from the
 * guest masonry's proven math (guest-masonry.tsx) into ONE reusable grid the
 * host surfaces share. A near-drop-in replacement for MediaGrid (same items +
 * onDeleteItem + lightbox ownership) that lays tiles out as masonry instead of a
 * uniform square grid. The guest masonry stays its OWN component for now (a
 * pinned live surface); converging it onto this primitive is a recorded follow-up.
 *
 * - aspectRatio comes from the plumbed width/height (1:1 fallback for
 *   pre-measure rows) so the layout reserves space BEFORE images load (no CLS),
 *   and `break-inside-avoid` keeps a tile from splitting across columns.
 * - `clampAspect` bounds extreme ratios into a browseable band — the host
 *   MODERATION-ergonomics escape hatch (object-cover crops the overflow); OFF by
 *   default, so personal feeds keep true ratios.
 * - `stagger` is the per-tile entrance cascade (--tile-i, seed render only). OFF
 *   on host surfaces (a management tool gets no arrival theater); kept as a prop
 *   for the future guest convergence. The gentle [data-media-tile] mount fade
 *   (globals.css) still applies, synchronized (--tile-i defaults to 0).
 * - Videos wear the shared CORNER play badge (the ratified subtle marker).
 * - `renderOverlay` injects per-tile chrome (the host moderation control bar +
 *   status/like badges, the recovery-bin countdown + restore/purge) as a SIBLING
 *   of the open-lightbox button, painted on top (it's the LAST child). Its
 *   controls are real `<button>`s, so tapping one never opens the lightbox (no
 *   stopPropagation needed — same contract as the old square grids). `viewerIsHost`
 *   threads to the lightbox (host gets its own viewer affordances). The component
 *   is generic in the item type so a caller (the bin) can render overlay chrome
 *   off its own extra fields (e.g. BinMedia.countdownDays) without a cast.
 */
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Play } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { LikeButton } from "@/components/likes/like-button";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
// The tile aspect-ratio math lives in a pure module (node-unit tested + reusable
// by host grids without pulling this client component's lightbox graph in).
import { tileAspect } from "@/lib/media/tile-aspect";

/** The subtle corner play marker for video tiles (shared with the guest masonry). */
export function CornerPlayBadge() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm"
    >
      <Play className="ml-px size-2.5 fill-white text-white" />
    </span>
  );
}

export function MasonryColumns<T extends GridMedia>({
  items,
  onDeleteItem,
  stagger = false,
  clampAspect = false,
  viewerIsHost = false,
  renderOverlay,
}: {
  items: T[];
  /** Surfaces the lightbox Delete (the personal Uploads feed); omitted = read-only. */
  onDeleteItem?: (id: string) => void;
  stagger?: boolean;
  clampAspect?: boolean;
  /** Threads to the lightbox (host viewer affordances). Default false (guest/read-only). */
  viewerIsHost?: boolean;
  /** Per-tile chrome on top of the lightbox button (moderation bar, bin controls). */
  renderOverlay?: (item: T) => ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Only the FIRST render staggers (later arrivals enter instantly). Captured
  // once via the useState initializer (no ref-in-render). Unused when stagger=false.
  const [seededIds] = useState(() => new Set(items.map((m) => m.id)));

  return (
    <>
      <div
        className="columns-2 gap-[3px] sm:columns-3"
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            data-media-tile
            // Host tiles (stagger off) opt out of the arrival fade-rise (emil: no
            // entrance theater on host); guest convergence (stagger on) keeps it.
            data-static={stagger ? undefined : ""}
            style={
              {
                aspectRatio: tileAspect(item, clampAspect),
                borderRadius: "var(--radius-tile)",
                ...(stagger
                  ? { "--tile-i": seededIds.has(item.id) ? i : 0 }
                  : {}),
              } as CSSProperties
            }
            className="group relative mb-[3px] w-full overflow-hidden bg-black/10 break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={item.type === "photo" ? "View photo" : "Play video"}
              className="size-full cursor-pointer outline-none transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]"
            >
              <MediaTile item={item} playBadge="none" />
            </button>
            {item.type === "video" && <CornerPlayBadge />}
            {/* Desktop hover-reveal like button (no-op without a LikesProvider). */}
            <LikeButton item={item} variant="tile" />
            {/* Per-tile chrome LAST so it paints over the lightbox button; its own
                buttons capture the tap (the lightbox never opens behind them). */}
            {renderOverlay?.(item)}
          </div>
        ))}
      </div>

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        viewerIsHost={viewerIsHost}
        onDeleteCurrent={
          onDeleteItem
            ? (item) => {
                setOpenIndex(null);
                onDeleteItem(item.id);
              }
            : undefined
        }
      />
    </>
  );
}
