"use client";

/**
 * The GUEST gallery masonry (Phase 4, the ratified V2 "creative separation"
 * grid): CSS columns flow tiles at their NATURAL aspect ratios (3px gaps +
 * 3px tile radius, the Phase-1 rounding decision). Guest-only - the host /
 * personal grids keep MediaGrid's square grid until Phase 5.
 *
 * - aspect-ratio is set from the plumbed width/height (1:1 fallback for
 *   pre-measure-era rows), so the layout reserves space BEFORE images load
 *   (no CLS) and the columns balance deterministically.
 * - Stagger: only the SEED render gets per-tile entrance delays (--tile-i,
 *   capped in globals.css); doorbell/poll arrivals get 0 so a new photo
 *   appears immediately, not after a queue of delays.
 * - Videos wear a small CORNER play badge (the ratified subtle marker); the
 *   shared centered PlayBadge stays for non-guest surfaces.
 * - NOTE: CSS columns are column-major (newest flow DOWN the left column).
 *   Ratified in the lab; flagged for live review.
 */
import { useState } from "react";
import type { CSSProperties } from "react";
import { Check, Play, RefreshCw } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { LikeButton } from "@/components/likes/like-button";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";

function tileAspect(item: GridMedia): string {
  return item.width && item.height ? `${item.width} / ${item.height}` : "1 / 1";
}

/** An in-flight upload rendered as a gallery tile (Phase 4: progress lives IN
 *  the gallery, not a separate file list). `url` is a local object URL. */
export type PendingTile = {
  queueId: string;
  url: string;
  kind: "photo" | "video";
  status: "queued" | "uploading" | "error";
  progress: number;
  error?: string;
};

export function GuestMasonry({
  items,
  pending = [],
  justLandedIds,
  onRetryPending,
}: {
  items: GridMedia[];
  /** In-flight uploads, rendered FIRST (newest activity leads the flow). */
  pending?: PendingTile[];
  /** Media ids that JUST landed (the ~2.5s green --success check window). */
  justLandedIds?: Set<string>;
  /** Tap-to-retry for an errored pending tile. */
  onRetryPending?: (queueId: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // The ids present at FIRST render: only these stagger (later arrivals enter
  // instantly). useState initializer = render-once capture, no ref-in-render.
  const [seededIds] = useState(() => new Set(items.map((m) => m.id)));

  return (
    <>
      <div
        className="columns-2 gap-[3px]"
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {pending.map((p) => (
          <div
            key={p.queueId}
            data-media-tile
            style={{ borderRadius: "var(--radius-tile)" } as CSSProperties}
            className="relative mb-[3px] w-full overflow-hidden bg-black/10"
          >
            {/* The local preview sizes itself (natural blob dimensions). */}
            {p.kind === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL
              <img
                src={p.url}
                alt=""
                className={p.status === "error" ? "w-full opacity-40" : "w-full"}
              />
            ) : (
              <video
                src={p.url}
                muted
                playsInline
                preload="metadata"
                className={
                  p.status === "error"
                    ? "w-full bg-black opacity-40"
                    : "w-full bg-black"
                }
              />
            )}
            {p.status !== "error" ? (
              // Uploading: a thin progress bar in a soft scrim strip at the
              // tile's foot (the ratified in-gallery progress treatment).
              <div className="absolute inset-x-0 bottom-0 bg-black/35 p-1.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <div
                    data-pending-progress
                    className="h-full rounded-full bg-white transition-[width] duration-200 ease-emphasis"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              // Error: dimmed preview + the retry affordance covering the tile.
              <button
                type="button"
                onClick={() => onRetryPending?.(p.queueId)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
              >
                <RefreshCw className="size-4" aria-hidden />
                <span className="text-xs font-medium">Tap to retry</span>
              </button>
            )}
          </div>
        ))}
        {items.map((item, i) => (
          <div
            key={item.id}
            data-media-tile
            style={
              {
                aspectRatio: tileAspect(item),
                borderRadius: "var(--radius-tile)",
                "--tile-i": seededIds.has(item.id) ? i : 0,
              } as CSSProperties
            }
            className="group relative mb-[3px] w-full overflow-hidden bg-black/10"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={item.type === "photo" ? "View photo" : "Play video"}
              className="size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
            >
              <MediaTile item={item} playBadge="none" />
            </button>
            {item.type === "video" && (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm"
              >
                <Play className="ml-px size-2.5 fill-white text-white" />
              </span>
            )}
            {justLandedIds?.has(item.id) && (
              // The ~2.5s "it landed" confirmation: state feedback is always
              // colored (--success), then the badge unmounts.
              <span
                aria-hidden
                data-just-landed
                className="pointer-events-none absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-success text-success-foreground"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            {/* Desktop hover-reveal like button (no-op without a LikesProvider). */}
            <LikeButton item={item} variant="tile" />
          </div>
        ))}
      </div>

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        viewerIsHost={false}
      />
    </>
  );
}
