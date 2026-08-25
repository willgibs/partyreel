"use client";

/**
 * The Studio's FILMSTRIP DOCK: reorder the cut without leaving the room.
 *
 * The point of the dock (versus the feed's reorder MODE) is that nothing swaps
 * out: the reel keeps playing above while the host drags, so the consequence of a
 * reorder is visible in the same breath as the gesture. That is why this is a
 * single ROW rather than the feed's grid, and why there is no "Done".
 *
 * It rides the house useSortableGrid unchanged. That hook derives its column count
 * from the container's computed `gridTemplateColumns`, so an explicit
 * `repeat(N, …)` here makes N columns and exactly one row, which collapses its
 * 2-axis slot maths to a horizontal shuffle for free. Touch keeps the hook's 450ms
 * press-to-grab, so scrolling the dock never lifts a tile.
 */

import { GripVertical, Play, Plus } from "lucide-react";
import { type CSSProperties, type MouseEventHandler } from "react";

import { type GridMedia } from "@/components/app/media-grid";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { useSortableGrid } from "@/lib/shared/use-sortable-grid";
import { cn } from "@/lib/utils";

/** The dock's tile width. Small enough that a 12-moment reel fits without much
 *  scrolling, big enough that a face is still recognizable. */
const TILE_W = "2.75rem";

/**
 * The "+" door into the Moments picker, shaped as one more dock tile.
 *
 * It sits OUTSIDE the sortable container on purpose (as a trailing sibling, not a
 * grid child): useSortableGrid derives its slot maths from the container's children
 * matching `order`, so a non-draggable tile inside would be a phantom slot the drag
 * could swap into. Outside, it also stays pinned while a long strip scrolls, which
 * is what you want from a door.
 */
export function AddMomentsTile({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Choose moments"
      style={{ width: TILE_W, aspectRatio: UNIFORM_TILE_ASPECT }}
      className="flex shrink-0 items-center justify-center rounded-[4px] border border-dashed border-white/25 text-white/60 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100"
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}

export function StudioFilmstrip({
  items,
  coverMediaId,
  onReorder,
  trailing,
}: {
  /** The FULL reel membership in current order (approved + hidden), because the
   *  reorder RPC's set-equality guard requires the complete set. */
  items: GridMedia[];
  /** Marks the opening shot, so the dock shows where the reel starts. */
  coverMediaId: string | null;
  onReorder: (orderedIds: string[]) => void;
  /** Pinned beside the scrolling strip (the picker's "+" tile). Never a grid child. */
  trailing?: React.ReactNode;
}) {
  const {
    order,
    draggingId,
    registerTile,
    setContainerRef,
    containerHandlers,
    tileHandleProps,
  } = useSortableGrid({ items, onReorder });

  // The cover is hoisted to index 0 at render time, so the "first" badge follows
  // the actual opening shot rather than the raw position.
  const firstId = coverMediaId ?? order[0]?.id;

  return (
    <div>
      <div className="flex items-start gap-1.5">
        <div
          ref={setContainerRef}
          {...containerHandlers}
          style={
            {
              gridTemplateColumns: `repeat(${Math.max(order.length, 1)}, ${TILE_W})`,
            } as CSSProperties
          }
          // touch-pan-x, not touch-none: the dock has to stay horizontally
          // scrollable (that is how a long reel is reachable), while a vertical page
          // pan mid-drag is blocked. min-w-0 so the strip, not the trailing door, is
          // what gives way when the reel outgrows the row.
          className="grid min-w-0 touch-pan-x gap-1.5 overflow-x-auto pb-1 select-none"
        >
          {order.map((it, i) => (
            <div
              key={it.id}
              ref={registerTile(it.id)}
              {...tileHandleProps(it.id)}
              data-dragging={draggingId === it.id ? "" : undefined}
              style={
                {
                  aspectRatio: UNIFORM_TILE_ASPECT,
                  borderRadius: "4px",
                } as CSSProperties
              }
              aria-label={`Moment ${i + 1} of ${order.length}. Press space, then arrow keys to move; space again to drop.`}
              className="group relative w-full cursor-grab touch-pan-x overflow-hidden bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.previewUrl ?? it.url}
                alt=""
                className={cn(
                  "size-full object-cover",
                  it.status === "hidden" && "opacity-30",
                )}
              />
              {it.type === "video" ? (
                <span
                  aria-hidden
                  className="absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full bg-black/55"
                >
                  <Play className="size-1.5 fill-white text-white" />
                </span>
              ) : null}
              {it.id === firstId ? (
                <span
                  aria-hidden
                  className="absolute inset-0 ring-2 ring-white/70 ring-inset"
                />
              ) : null}
              {/* The grab affordance appears on the lifted tile only: 12 grip icons
                in a dock this small would read as noise. */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-0.5 right-0.5 text-white/85 opacity-0 group-data-[dragging]:opacity-100"
              >
                <GripVertical className="size-3 drop-shadow" />
              </span>
            </div>
          ))}
        </div>
        {trailing}
      </div>
      <p className="mt-1 text-center text-[10px] text-white/40">
        Hold a moment to reorder, the reel keeps playing
      </p>
    </div>
  );
}
