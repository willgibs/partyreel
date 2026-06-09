"use client";

import { useEffect, useRef, useState } from "react";

import { MediaLightbox } from "@/components/shared/media-lightbox";
import { PlayBadge } from "@/components/shared/play-badge";
import { videoPosterSrc } from "@/lib/media/poster";
import { cn } from "@/lib/utils";

export type GridMedia = {
  id: string;
  type: "photo" | "video";
  /** Short-lived presigned URL for INLINE render — built server-side; never a raw R2 key. */
  url: string;
  /**
   * Presigned `attachment` URL that saves the original (see lib/r2/presign.ts). OPTIONAL: the
   * recovery "Recently deleted" bin omits it (no original-file download from the bin), which
   * hides the lightbox Save button. Album/host grids always set it.
   */
  downloadUrl?: string;
  status?: "pending" | "approved" | "hidden" | "removed";
  /**
   * Uploader attribution (Phase 2), rendered as a subtle caption in the lightbox (never on tiles).
   * Resolved server-side. `uploaderName` is the public display name (null = anonymous OR, defensively,
   * an unresolved name -> caption hides). `isHost` -> a "Host" badge. `isAnonymous` -> "Anonymous" +
   * the info popover. `uploaderEmail` is HOST-GALLERY-ONLY: it is populated ONLY on the host dashboard
   * path and NEVER on any guest surface (email-safety by construction).
   */
  uploaderName?: string | null;
  isHost?: boolean;
  isAnonymous?: boolean;
  uploaderEmail?: string | null;
  /**
   * Cross-event "Uploads" context (Phase 4), rendered as a subtle link in the lightbox (never on tiles).
   * Set ONLY by the personal Uploads gallery (a flat feed spanning events); the album/host grids omit
   * them, so their lightbox is unaffected. `eventQrToken` links the caption to that event's page.
   */
  eventName?: string | null;
  eventDateLabel?: string | null;
  eventQrToken?: string | null;
};

// Presentational thumbnail shared by the public album (MediaGrid below) and the
// host moderation grid (host-media-grid.tsx). Renders straight <img>/<video> from
// presigned URLs (next/image is wrong here — presigned URLs are short-lived and
// per-request, so optimization/caching would break them). Video renders WITHOUT
// `controls` (a poster-frame thumbnail + a play badge): a controls-less <video>
// is non-interactive, so the tile can be wrapped in a <button> that opens the
// lightbox, where the video actually plays. No status/controls/host concerns live
// here — keep it a clean primitive both surfaces reuse. It renders from only
// `type` + `url`, so it also accepts thinner shapes (e.g. the operator report
// thumbnail) that have no downloadUrl/lightbox.
export function MediaTile({ item }: { item: Pick<GridMedia, "type" | "url"> }) {
  // Fade a photo in on load so presigned images don't pop in jarringly (opacity-only -> reduced-motion
  // safe). The `complete` check covers a cached image that finished loading before React attached onLoad,
  // so it can never get stuck invisible at opacity-0.
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  if (item.type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
      <img
        ref={imgRef}
        src={item.url}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    );
  }
  return (
    <>
      <video
        // iOS shows a black box without this poster fragment — see videoPosterSrc.
        src={videoPosterSrc(item.url)}
        preload="metadata"
        muted
        playsInline
        className="size-full bg-black object-cover"
      />
      <PlayBadge />
    </>
  );
}

// Public-album grid. Tiles are buttons that open the shared lightbox (full-screen
// view + Save); the grid owns the open index so prev/next walks the whole set.
// Host moderation controls live in HostMediaGrid, never here. The OPTIONAL
// `onDeleteItem` is the one per-item action this grid exposes: the personal
// "Uploads" tab passes it to surface a delete button in the lightbox; the public
// album omits it (read-only). On delete we close the viewer and hand the id up —
// the parent owns the list (optimistic removal), so the tile just disappears.
export function MediaGrid({
  items,
  onDeleteItem,
}: {
  items: GridMedia[];
  onDeleteItem?: (id: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={item.id}
            data-media-tile
            className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={item.type === "photo" ? "View photo" : "Play video"}
              className="size-full cursor-pointer transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]"
            >
              <MediaTile item={item} />
            </button>
          </li>
        ))}
      </ul>

      <MediaLightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        viewerIsHost={false}
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
