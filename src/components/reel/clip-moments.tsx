"use client";

import type { CSSProperties } from "react";
import { EyeOff, Play } from "lucide-react";

import type { GalleryItem } from "@/lib/events/gallery-reel";
import {
  CLIP_FILL_LABEL,
  CLIP_FILLS,
  type ClipFill,
} from "@/lib/reel/clip-selection";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

import { PanelLabel, ROOM_FOCUS, RoomChip } from "./clip-room";

/**
 * THE MOMENTS: the album pool as reel-cut round 2's `dial` option drew it, with the fills (the
 * reel's picks, Only mine, Everything), every moment in the clip numbered in clip order and the rest
 * dimmed, and the host's hidden photographs captioned "Hidden · Show".
 *
 * ★ THE BADGE IS A POSITION, NOT A TICK: in a clip, where matters more than whether, and the number
 * is the bridge between the pool and the order strip. A moment past what the length plays keeps its
 * number, quieter, so the pool agrees with the strip about where the clip is cut.
 *
 * ★ A BIG ALBUM STAYS CHEAP. Every tile is a small preview, loaded lazily, and a tile off screen
 * skips its layout and paint (`content-visibility`), so a pool of thousands scrolls like a pool of
 * dozens.
 */

const TILE_STYLE: CSSProperties = {
  aspectRatio: UNIFORM_TILE_ASPECT,
  contentVisibility: "auto",
  containIntrinsicSize: "auto 120px",
};

export function MomentsPool({
  grid,
  ids,
  fitting,
  fill,
  ownCount,
  onFill,
  onToggle,
  onShow,
  cols,
  className,
}: {
  /** What the pool draws, in the album's order: the takeable moments and the host's hidden ones. */
  grid: readonly GalleryItem[];
  /** The clip's moments, in order. */
  ids: readonly string[];
  /** How many of them the length plays. */
  fitting: number;
  /** The fill the clip last started from; null once she has edited it by hand. */
  fill: ClipFill | null;
  /** How many moments are hers: Only mine is offered only when there is something to fill with. */
  ownCount: number;
  onFill: (fill: ClipFill) => void;
  onToggle: (id: string) => void;
  /** The host's Show on a hidden photograph (absent for a guest, who never meets one). */
  onShow?: (id: string) => void;
  cols: number;
  className?: string;
}) {
  const at = new Map(ids.map((id, i) => [id, i + 1]));
  return (
    <section data-clip-moments className={className}>
      <PanelLabel aside={`${fitting} in your clip`}>Moments</PanelLabel>
      <div
        role="group"
        aria-label="Start from"
        className="-mx-1 mb-3 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5"
      >
        {CLIP_FILLS.map((f) => (
          <RoomChip
            key={f}
            active={f === fill}
            disabled={f === "mine" && ownCount === 0}
            title={
              f === "mine" && ownCount === 0
                ? "Nothing of yours is in the album yet"
                : undefined
            }
            onClick={() => onFill(f)}
          >
            {CLIP_FILL_LABEL[f]}
          </RoomChip>
        ))}
      </div>
      <ul
        aria-label="The album"
        className="grid gap-[var(--gap-gallery)]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {grid.map((item) => (
          <li key={item.id} style={TILE_STYLE} className="relative min-w-0">
            {item.status === "hidden" ? (
              <HiddenTile item={item} onShow={onShow} />
            ) : (
              <MomentTile
                item={item}
                at={at.get(item.id)}
                plays={(at.get(item.id) ?? 0) <= fitting}
                total={ids.length}
                onToggle={onToggle}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function stillOf(item: GalleryItem): string {
  return item.previewUrl ?? (item.type === "video" ? "" : item.url);
}

function MomentTile({
  item,
  at,
  plays,
  total,
  onToggle,
}: {
  item: GalleryItem;
  /** Its place in the clip, 1-based; undefined when it is out. */
  at?: number;
  /** Inside what the length plays. */
  plays: boolean;
  total: number;
  onToggle: (id: string) => void;
}) {
  const inClip = at !== undefined;
  const kind = item.type === "video" ? "video" : "photo";
  return (
    <button
      type="button"
      aria-pressed={inClip}
      aria-label={
        inClip
          ? `Moment ${at} of ${total}, a ${kind}. Take it out of your clip`
          : `A ${kind}. Add it to your clip`
      }
      onClick={() => onToggle(item.id)}
      data-clip-moment={inClip ? (plays ? "in" : "past") : "out"}
      className={cn(
        "absolute inset-0 block overflow-hidden rounded-[var(--radius-tile)] bg-white/5",
        ROOM_FOCUS,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a url that expires) */}
      <img
        src={stillOf(item)}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          "size-full object-cover transition-opacity duration-150 motion-reduce:transition-none",
          inClip ? (plays ? "opacity-100" : "opacity-60") : "opacity-55",
        )}
      />
      {inClip ? (
        // The ring sits OVER the photograph: an inset ring on the button itself paints under its
        // own content, where the image covers it.
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[var(--radius-tile)] ring-inset",
            plays ? "ring-2 ring-white" : "ring-1 ring-white/40",
          )}
        />
      ) : null}
      {inClip ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-1 left-1 flex size-5 items-center justify-center rounded-full text-micro font-semibold tabular-nums",
            plays ? "bg-white text-zinc-900" : "bg-white/40 text-zinc-900",
          )}
        >
          {at}
        </span>
      ) : (
        <span
          aria-hidden
          className="absolute top-1 left-1 size-4 rounded-full border border-white/70 bg-black/20"
        />
      )}
      {item.type === "video" ? (
        <span
          aria-hidden
          className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-black/55"
        >
          <Play className="size-2 fill-white text-white" />
        </span>
      ) : null}
    </button>
  );
}

/**
 * THE HOST'S HIDDEN PHOTOGRAPH (`blocked=caption`): dimmed, the eye mark, and "Hidden · Show"
 * readable before anyone taps, Show its own control. A hidden photograph is never in a clip, so the
 * tile itself takes no tap; Show puts it back in the album and then into the clip.
 */
function HiddenTile({
  item,
  onShow,
}: {
  item: GalleryItem;
  onShow?: (id: string) => void;
}) {
  return (
    <div
      data-clip-moment="hidden"
      className="absolute inset-0 overflow-hidden rounded-[var(--radius-tile)] bg-white/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a presigned preview */}
      <img
        src={stillOf(item)}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover opacity-30"
      />
      <span
        aria-hidden
        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white/80"
      >
        <EyeOff className="size-2.5" />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 px-1 py-1 text-micro text-white/85">
        <span>Hidden</span>
        <span aria-hidden className="text-white/40">
          ·
        </span>
        {onShow ? (
          <button
            type="button"
            onClick={() => onShow(item.id)}
            aria-label="Show it in the album again and add it to your clip"
            className={cn(
              "rounded-sm font-semibold text-white underline underline-offset-2",
              ROOM_FOCUS,
            )}
          >
            Show
          </button>
        ) : null}
      </span>
    </div>
  );
}
