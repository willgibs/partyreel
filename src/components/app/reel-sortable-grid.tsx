"use client";

import { type CSSProperties } from "react";
import { GripVertical } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { CornerPlayBadge } from "@/components/shared/masonry";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { useSortableGrid } from "@/lib/shared/use-sortable-grid";
import { cn } from "@/lib/utils";

// The Reel section's drag-reorder surface: the uniform grid (matching the reel's browse layout) where each
// tile is a drag handle. Numbered 1·2·3 so the sequence is explicit; the whole tile is grabbable (mouse:
// drag immediately, touch: press-and-hold 450ms so a scroll never grabs). Operates on the FULL reel
// membership (a hidden in-reel item still shows, dimmed, so reorder commits the complete set the RPC's
// set-equality guard requires). The per-tile actions + lightbox are intentionally absent here — in reorder
// mode a tile does ONE thing. Powered by the generic, dependency-free useSortableGrid (pointer + FLIP).
export function ReelSortableGrid({
  items,
  onReorder,
}: {
  /** The full reel membership in current order (approved + hidden in-reel items). */
  items: GridMedia[];
  /** Persist the new order (the FULL membership ids). */
  onReorder: (orderedIds: string[]) => void;
}) {
  const {
    order,
    draggingId,
    registerTile,
    setContainerRef,
    containerHandlers,
    tileHandleProps,
  } = useSortableGrid({ items, onReorder });

  return (
    <div
      ref={setContainerRef}
      {...containerHandlers}
      // touch-none: in this focused reorder mode the grid isn't casually scrolled — dragging a tile to a
      // viewport edge autoscrolls, and Done exits to normal scroll. select-none: no text selection on drag.
      className="grid touch-none grid-cols-3 gap-[var(--gap-gallery)] select-none sm:grid-cols-4"
    >
      {order.map((it, i) => {
        const dimmed = it.status === "hidden";
        return (
          <div
            key={it.id}
            ref={registerTile(it.id)}
            {...tileHandleProps(it.id)}
            data-dragging={draggingId === it.id ? "" : undefined}
            style={
              {
                aspectRatio: UNIFORM_TILE_ASPECT,
                borderRadius: "var(--radius-tile)",
              } as CSSProperties
            }
            aria-label={`Reel position ${i + 1} of ${order.length}. Press space, then arrow keys to move; space again to drop.`}
            className="group relative w-full cursor-grab touch-none overflow-hidden bg-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:cursor-grabbing"
          >
            <div className={cn("size-full", dimmed && "opacity-30")}>
              <MediaTile item={it} playBadge="none" />
            </div>
            {it.type === "video" && <CornerPlayBadge />}

            {/* Position number (the sequence). */}
            <span className="pointer-events-none absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/55 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm">
              {i + 1}
            </span>
            {/* Grab affordance. */}
            <span className="pointer-events-none absolute top-1.5 right-1.5 text-white/85">
              <GripVertical className="size-4 drop-shadow" />
            </span>
            {/* A subtle drag scrim so a lifted tile reads as grabbed (the imperative transform adds the lift). */}
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-data-[dragging]:bg-black/15" />
          </div>
        );
      })}
    </div>
  );
}
