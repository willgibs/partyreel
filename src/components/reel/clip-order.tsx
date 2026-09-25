"use client";

import type { CSSProperties } from "react";
import { GripVertical, Play, Plus } from "lucide-react";

import type { GalleryItem } from "@/lib/events/gallery-reel";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { useSortableGrid } from "@/lib/shared/use-sortable-grid";
import { cn } from "@/lib/utils";

import { ROOM_FOCUS, ROOM_PRESS } from "./clip-room";

/**
 * THE ORDER: the clip's moments as a strip under the bench, the opening shot ringed, and the dashed
 * + that leads to the Moments tab. Hold one to move it while the clip keeps playing above, so the
 * consequence of a move is visible in the same breath as the gesture; there is no Done.
 *
 * ★ IT RIDES THE HOUSE SORTABLE UNCHANGED (`useSortableGrid`): an explicit `repeat(N, …)` makes N
 * columns and one row, so its two-axis slot maths collapses to a horizontal shuffle. The strip
 * SCROLLS ON A WRAPPER, never on the grid itself: the hook measures the grid's own box, which moves
 * with the scroll when the wrapper scrolls it, so a drop lands on the tile under the finger however
 * far along a long clip she is. Touch keeps the hook's press-to-grab, so a scroll never lifts a tile.
 *
 * ★ THE CUT IS SHOWN, NEVER HIDDEN. Past what the length plays, the moments stay in the strip,
 * dimmed, with one line saying how many will not play, so moving one earlier is how it gets back in.
 */
export function OrderStrip({
  items,
  fitting,
  lengthLabel,
  tile,
  onReorder,
  onAdd,
  className,
}: {
  /** The clip's moments, in order. */
  items: readonly GalleryItem[];
  /** How many of them the length plays. */
  fitting: number;
  /** The length they are cut at, for the line under the strip ("0:30"). */
  lengthLabel: string;
  /** A tile's width in px. */
  tile: number;
  onReorder: (ids: string[]) => void;
  /** The dashed +: the Moments tab. */
  onAdd: () => void;
  className?: string;
}) {
  const {
    order,
    draggingId,
    registerTile,
    setContainerRef,
    containerHandlers,
    tileHandleProps,
  } = useSortableGrid({ items: items as GalleryItem[], onReorder });
  const past = Math.max(0, items.length - fitting);
  const tileBox: CSSProperties = {
    width: tile,
    aspectRatio: UNIFORM_TILE_ASPECT,
  };

  return (
    <div data-clip-order className={cn("min-w-0", className)}>
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 overflow-x-auto pb-1">
          <div
            ref={setContainerRef}
            {...containerHandlers}
            role="list"
            aria-label="Your clip's order"
            style={{
              gridTemplateColumns: `repeat(${Math.max(order.length, 1)}, ${tile}px)`,
            }}
            className="grid w-max touch-pan-x gap-1.5 select-none"
          >
            {order.map((item, i) => (
              <div
                key={item.id}
                ref={registerTile(item.id)}
                {...tileHandleProps(item.id)}
                role="listitem"
                data-dragging={draggingId === item.id ? "" : undefined}
                data-clip-order-tile={i < fitting ? "plays" : "past"}
                style={tileBox}
                aria-label={`Moment ${i + 1} of ${order.length}${
                  i >= fitting ? ", past the length" : ""
                }. Press space, then the arrow keys to move it; space again to drop.`}
                className={cn(
                  "group relative cursor-grab touch-pan-x overflow-hidden rounded-[4px] bg-white/5 active:cursor-grabbing",
                  ROOM_FOCUS,
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a presigned preview */}
                <img
                  src={
                    item.previewUrl ?? (item.type === "video" ? "" : item.url)
                  }
                  alt=""
                  draggable={false}
                  className={cn(
                    "size-full object-cover",
                    i >= fitting && "opacity-35",
                  )}
                />
                {item.type === "video" ? (
                  <span
                    aria-hidden
                    className="absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full bg-black/55"
                  >
                    <Play className="size-1.5 fill-white text-white" />
                  </span>
                ) : null}
                {i === 0 ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-[4px] ring-2 ring-white/75 ring-inset"
                  />
                ) : null}
                {i === fitting && i > 0 ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-0.5 bg-white/70"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0.5 right-0.5 text-white/85 opacity-0 group-data-[dragging]:opacity-100"
                >
                  <GripVertical className="size-3 drop-shadow" />
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add moments"
          style={tileBox}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[4px] border border-dashed border-white/25 text-white/60 hover:border-white/45 hover:text-white",
            ROOM_FOCUS,
            ROOM_PRESS,
          )}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-1 text-micro text-white/40">
        {past > 0
          ? `${past} ${past === 1 ? "moment doesn't" : "moments don't"} fit in ${lengthLabel}. Move one earlier to play it.`
          : "Hold a moment to move it. The clip keeps playing."}
      </p>
    </div>
  );
}
