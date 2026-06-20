"use client";

import { useEffect, useRef, useState } from "react";

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
  /**
   * Likes (Phase 5). `likeCount` is HOST-ONLY (set solely on the host management gallery via
   * get_event_like_counts; never on a guest surface) and drives the read-only count badge/chip. Omitted on
   * surfaces without likes (guest galleries, recovery bin, operator), leaving them unchanged. (Per-user
   * liked/heart state is owned by the LikesProvider, NOT carried on the item.)
   */
  likeCount?: number;
  /**
   * Natural media geometry + video length (Phase 4 masonry/badges). Write-once at create_media,
   * so immutable per id (they ride OUTSIDE the gallery ETag fingerprint). Null on rows uploaded
   * before client-side measurement existed; consumers fall back to a 1:1 tile.
   */
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
};

// Presentational thumbnail shared by every gallery surface (the shared
// MasonryColumns, the host moderation + bin grids, the operator report). Renders
// straight <img>/<video> from presigned URLs (next/image is wrong here — presigned
// URLs are short-lived and per-request, so optimization/caching would break them).
// Video renders WITHOUT `controls` (a poster-frame thumbnail + a play badge): a
// controls-less <video> is non-interactive, so the tile can be wrapped in a
// <button> that opens the lightbox, where the video actually plays. No
// status/controls/host concerns live here — keep it a clean primitive every
// surface reuses. It renders from only `type` + `url`, so it also accepts thinner
// shapes (e.g. the operator report thumbnail) that have no downloadUrl/lightbox.
//
// (This file also homes the GridMedia type. The legacy square-grid MediaGrid was
// retired in S3·3a once every surface had moved to MasonryColumns.)
export function MediaTile({
  item,
  playBadge = "center",
}: {
  item: Pick<GridMedia, "type" | "url">;
  /** "none" lets a caller (the guest masonry) supply its own corner badge. */
  playBadge?: "center" | "none";
}) {
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
      {playBadge === "center" && <PlayBadge />}
    </>
  );
}
