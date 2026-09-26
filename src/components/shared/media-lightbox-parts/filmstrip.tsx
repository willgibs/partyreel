"use client";

import { memo } from "react";
import { Play } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { cn } from "@/lib/utils";

/**
 * THE DESK'S FILMSTRIP (`next=peek`, Will 2026-09-24: "where we have more room
 * on desktop lightboxes, a more subtle film strip may be cool to include").
 * Restrained on purpose: small dim frames at the foot, the current one lifted,
 * and nothing at all on a phone or a touch screen (the viewer mounts it only for
 * a fine pointer on a wide window), where the peek and the swipe are the way
 * through.
 *
 * ★ A WINDOW, NEVER THE ALBUM. The scale probe holds 1,145 photographs; a strip
 * of every one would be a thousand <img> requests to show fifteen. It draws the
 * current frame's seven neighbours each side, keyed by id so a step slides the
 * frames it keeps rather than redrawing them, and a frame entering the window
 * fades in. The viewer asks its link source for exactly these frames
 * (`onNeedLinks`, reach `FILMSTRIP_REACH`), so a frame fills in as its link lands.
 *
 * ★ EAGER PICTURES, NOT `loading="lazy"`: the media-viewer board found a lazy
 * strip that never loaded (Blink resolves lazy loading against the top window),
 * and fifteen previews in view are cheap.
 */

export const FILMSTRIP_REACH = 7;
const FRAME = 30; // a frame's footprint, px, gap included

export const Filmstrip = memo(function Filmstrip({
  items,
  index,
  onJump,
}: {
  items: readonly GridMedia[];
  index: number;
  onJump: (index: number) => void;
}) {
  const from = Math.max(0, index - FILMSTRIP_REACH);
  const to = Math.min(items.length - 1, index + FILMSTRIP_REACH);
  const frames = [];
  for (let k = from; k <= to; k++) frames.push(k);

  return (
    <div
      data-lightbox-filmstrip
      className="pointer-events-auto relative h-11"
      style={{ width: (FILMSTRIP_REACH * 2 + 1) * FRAME }}
    >
      {frames.map((k) => {
        const item = items[k];
        const current = k === index;
        const label = `${item.type === "video" ? "Video" : "Photo"} ${k + 1} of ${items.length}`;
        // ★ A FRAME WITH NO LINK YET IS AN EMPTY FRAME, NEVER `src=""`: the
        // paged album's unlinked item has an empty url, which a browser
        // resolves against the PAGE and fetches. `||`, not `??`, so an empty
        // string falls through to the frame's own fill like a missing one.
        const src =
          item.previewUrl || (item.type === "photo" ? item.url : "") || null;
        return (
          <ActionTooltip key={item.id} label={label}>
            <button
              type="button"
              aria-label={label}
              aria-current={current ? "true" : undefined}
              onClick={() => onJump(k)}
              data-lightbox-frame
              style={{
                // Each frame sits at its distance from the current one, so a
                // step moves the frames the window keeps (a transition on one
                // composited property) instead of redrawing the strip.
                transform: `translateX(${(k - index) * FRAME}px) scale(${current ? 1.12 : 1})`,
              }}
              className={cn(
                "absolute bottom-0 left-1/2 -ml-3 h-9 w-6 overflow-hidden rounded-[3px] bg-white/10 outline-none",
                "transition-[transform,opacity,scale] duration-200 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
                current
                  ? "opacity-100 ring-2 ring-white"
                  : "opacity-45 hover:opacity-90",
              )}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  loading="eager"
                  className="size-full object-cover"
                />
              ) : null}
              {item.type === "video" && (
                <Play
                  aria-hidden
                  className="absolute inset-0 m-auto size-2.5 fill-white text-white drop-shadow"
                />
              )}
            </button>
          </ActionTooltip>
        );
      })}
    </div>
  );
});
