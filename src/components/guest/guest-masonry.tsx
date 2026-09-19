"use client";

/**
 * The GUEST gallery masonry (Phase 4, the ratified V2 "creative separation"
 * grid): CSS columns flow tiles at their NATURAL aspect ratios, on the ONE
 * gallery gap and the photograph's corner (--gap-gallery pinned to
 * --radius-tile, Will's `gap=pinned`, 2026-09-18). CSS columns have no row
 * gap, so the vertical gap is each tile's bottom margin, on the same token.
 * Guest-only - the host / personal grids keep MediaGrid's square grid until
 * Phase 5.
 *
 * - The COLUMNS are the shared rule (GALLERY_COLUMNS in shared/masonry.tsx):
 *   two at a phone, then as many ~240px tiles as the window holds. It is read
 *   from there and never re-typed here, because the guest album and the host's
 *   grids answering the same ruling with two copies of one class string is how
 *   they drift (Will's `host=same`, 2026-09-19).
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
import { Check, Download, Play, RefreshCw } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { tileAspect } from "@/lib/media/tile-aspect";
import { LikeButton } from "@/components/likes/like-button";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";

// Uses the SHARED tile-aspect helper (this file used to carry its own copy,
// which had no bound at all): natural ratios are preserved, but a client-
// declared absurdity like 1 / 100000000 can no longer render a kilometre-tall
// tile and wreck the album. `clamp` stays off here on purpose, since the guest
// gallery's natural ratios are the ratified masonry look.

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
  shareUrl,
}: {
  items: GridMedia[];
  /** In-flight uploads, rendered FIRST (newest activity leads the flow). */
  pending?: PendingTile[];
  /** Media ids that JUST landed (the ~2.5s green --success check window). */
  justLandedIds?: Set<string>;
  /** Tap-to-retry for an errored pending tile. */
  onRetryPending?: (queueId: string) => void;
  /** The event JOIN url for the lightbox Share button (guest surface only). */
  shareUrl?: string;
}) {
  // Target the open item by ID, never by array position: `items` mutates under
  // an open lightbox (the doorbell/poll prepends newly-approved media, an
  // optimistic upload prepends its own tile, a host removal drops one), and a
  // stored index would silently start pointing at a DIFFERENT photo the moment
  // anything landed. The index handed to the lightbox is derived per render.
  const [openId, setOpenId] = useState<string | null>(null);
  const openAt = openId ? items.findIndex((m) => m.id === openId) : -1;
  // -1 covers both "closed" and "the open item just vanished from the album",
  // which the lightbox reads as closed.
  const openIndex = openAt >= 0 ? openAt : null;
  // The ids present at FIRST render: only these stagger (later arrivals enter
  // instantly). useState initializer = render-once capture, no ref-in-render.
  const [seededIds] = useState(() => new Set(items.map((m) => m.id)));

  return (
    <>
      <div
        className={GALLERY_COLUMNS}
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {pending.map((p) => (
          <div
            key={p.queueId}
            data-media-tile
            // The bright edge ([data-lit], globals.css) sits on the box that
            // owns the tile radius, on a pending tile as on a landed one, so a
            // photo does not gain an edge at the moment it finishes uploading.
            data-lit=""
            style={{ borderRadius: "var(--radius-tile)" } as CSSProperties}
            className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
          >
            {/* The local preview sizes itself (natural blob dimensions). */}
            {p.kind === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL
              <img
                src={p.url}
                alt=""
                className={
                  p.status === "error" ? "w-full opacity-40" : "w-full"
                }
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
            data-lit=""
            style={
              {
                aspectRatio: tileAspect(item),
                borderRadius: "var(--radius-tile)",
                "--tile-i": seededIds.has(item.id) ? i : 0,
              } as CSSProperties
            }
            className="group relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
          >
            <button
              type="button"
              onClick={() => setOpenId(item.id)}
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
            {/* Desktop hover-reveal action row (3c): Download (blue) + Like FAR-RIGHT
                (pink when liked, persists off-hover). Same color language as the host,
                minus moderation. Desktop-only (the container is hidden md:flex); mobile
                guests act in the lightbox. Like is a no-op without a LikesProvider. */}
            <div className="absolute top-1.5 right-1.5 z-10 hidden items-center gap-1 md:flex">
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  download
                  aria-label="Save"
                  title="Save"
                  className="flex size-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-[color,opacity,transform] duration-150 ease-emphasis group-hover:opacity-100 hover:text-save focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                >
                  <Download className="size-4" />
                </a>
              )}
              <LikeButton item={item} variant="row" />
            </div>
          </div>
        ))}
      </div>

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenId(null)}
        // Swipe/arrow navigation still speaks in positions; translate straight
        // back to the id so the next mutation can't shift it either.
        onIndexChange={(i) => setOpenId(items[i]?.id ?? null)}
        viewerIsHost={false}
        shareUrl={shareUrl}
      />
    </>
  );
}
