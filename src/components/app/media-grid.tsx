"use client";

import { useEffect, useRef, useState } from "react";

import { PlayBadge } from "@/components/shared/play-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { videoPosterSrc } from "@/lib/media/poster";
import { cn } from "@/lib/utils";

export type GridMedia = {
  id: string;
  type: "photo" | "video";
  /** Short-lived presigned URL for INLINE render — built server-side; never a raw R2 key. */
  url: string;
  /**
   * Short-lived presigned URL for the small WebP PREVIEW variant (client-generated at upload). TILE-ONLY:
   * MediaTile serves `previewUrl ?? url` and falls back to `url` on error. The lightbox + Save always use
   * the full-res `url`/`downloadUrl`. Null/absent on pre-feature rows or when generation was skipped.
   */
  previewUrl?: string | null;
  /**
   * Presigned `attachment` URL that saves the original (see lib/r2/presign.ts). OPTIONAL: the
   * recovery "Recently deleted" bin omits it (no original-file download from the bin), which
   * hides the lightbox Save button. Album/host grids always set it.
   */
  downloadUrl?: string;
  status?: "pending" | "approved" | "hidden" | "removed";
  /**
   * Uploader attribution (Phase 2), rendered as a subtle caption in the lightbox (never on tiles).
   * Resolved server-side by the ONE precedence rule (lib/media/uploader-identity.ts).
   * `uploaderName` is the public display name (null = nobody named: a row minted before names
   * were asked, or a deleted account's surviving upload -> the caption shows no name, never an
   * invented one). `isHost` -> a "Host" badge. `isVerified` false -> the unverified mark beside the
   * name (the identity reshape, 2026-09-21: a name with no proved email is shown AND marked, never
   * hidden). `uploaderEmail` is HOST-GALLERY-ONLY: populated ONLY on the host dashboard path and
   * NEVER on any guest surface (email-safety by construction).
   */
  uploaderName?: string | null;
  isHost?: boolean;
  isVerified?: boolean;
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
  /**
   * Quick-add signals (R3). NEVER RENDERED — they feed `pickQuickAdd`, which needs to know WHEN a
   * moment was uploaded and BY WHOM to blend recency with per-guest coverage. Optional, so every
   * surface that runs no quick-add stays exactly as it was (only the host dashboard populates them).
   * `uploaderKey` is a grouping key: a guest_id, "host", or null (one shared anonymous bucket).
   * Deliberately NOT the email — see the uploaderEmail note above; this must stay safe to carry.
   */
  createdAt?: string | null;
  uploaderKey?: string | null;
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
/** The URL a tile draws for an item: the small preview, or the original when there is none (or it broke). */
function tileSrc(
  item: Pick<GridMedia, "url" | "previewUrl">,
  previewFailed: boolean,
): string {
  return item.previewUrl && !previewFailed ? item.previewUrl : item.url;
}

/**
 * Whether two presigned URLs name the same stored object: the same path, and
 * any query at all. A presign rolls about every 30 minutes by rewriting only
 * the query (its signature and expiry), so the path is the photograph.
 */
function sameObject(a: string, b: string): boolean {
  return a.split("?")[0] === b.split("?")[0];
}

export function MediaTile({
  item,
  playBadge = "center",
  eager = false,
}: {
  item: Pick<GridMedia, "type" | "url" | "previewUrl">;
  /** "none" lets a caller (the guest masonry) supply its own corner badge. */
  playBadge?: "center" | "none";
  /**
   * The album's first row: fetched at once and first (`loading=eager`,
   * `fetchpriority=high`), because it is the largest paint a guest waits for;
   * everything else waits until it nears the screen.
   */
  eager?: boolean;
}) {
  // Fade a photo in on load so presigned images don't pop in jarringly (opacity-only -> reduced-motion
  // safe). The `complete` check covers a cached image that finished loading before React attached onLoad,
  // so it can never get stuck invisible at opacity-0.
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  // The small preview self-heals: if it 404s / fails (missing, expired, an old preview-less row whose key
  // somehow errored), flip to the full-res original (photo) or the <video> poster (video). Guarded so a
  // failing ORIGINAL can't loop.
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewOk = !!item.previewUrl && !previewFailed;

  /*
   * ★ THE SRC A TILE MOUNTED WITH IS THE SRC IT KEEPS, UNTIL IT BREAKS (the
   * album-window lane). The album re-reads its links about every half hour, and
   * each re-read hands every tile a new URL for the same photograph (a new
   * signature on the same object). Written straight through, that re-fetched
   * and re-decoded every photograph on screen, and flashed the shimmer under
   * each one, for nothing. So the drawn URL is state: a new link for the same
   * object is remembered and used only when the drawn one fails (an expired
   * signature is exactly such a failure), and a different object replaces it.
   */
  const latest = useRef(item);
  useEffect(() => {
    latest.current = item;
  });
  const [src, setSrc] = useState(() => tileSrc(item, false));
  const wanted = tileSrc(item, previewFailed);
  if (!sameObject(wanted, src)) {
    setSrc(wanted);
    setLoaded(false);
  }

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  const onTileImgError = () => {
    const now = latest.current;
    // A rolled link: the fresh one for the same photograph.
    const fresh = tileSrc(now, previewFailed);
    if (fresh !== src) {
      setSrc(fresh);
      setLoaded(false);
      return;
    }
    // The preview itself is broken: the original.
    if (!previewFailed && now.previewUrl) {
      setPreviewFailed(true);
      if (now.url !== src) {
        setSrc(now.url);
        setLoaded(false);
      }
    }
  };

  /*
   * ★ THE SHIMMER IS HIDDEN WHEN THE PHOTOGRAPH LANDS, NEVER REMOVED. Taking a
   * node out is a layout change, and a tile in a flex box is no layout boundary
   * however contained it is, so every photograph that landed mid-scroll re-ran
   * its whole album's flex layout (measured on a throttled phone's fling
   * through 1,145 photographs). Hidden, the landing is a paint: the skeleton
   * stays, invisible and still (`data-done` stops its shimmer in an album's
   * sheet, `animate-none` everywhere else).
   */
  const shimmer = (
    <Skeleton
      data-done={loaded ? "" : undefined}
      aria-hidden
      className={cn(
        "absolute inset-0 size-full rounded-none",
        loaded && "invisible animate-none",
      )}
    />
  );

  /*
   * ★ NO LINK YET, NO IMAGE. The paged album mints links per window (`lib/album/links.ts`), so a tile
   * can mount a beat before its links land. It holds its skeleton until they do, rather than an
   * `<img src="">`, which React refuses with an error and a browser answers with a failed load.
   */
  if (!src) {
    return <span className="relative block size-full">{shimmer}</span>;
  }

  const imgProps = {
    ref: imgRef,
    src,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : ("auto" as const),
    // Decode off the main thread: a fling mounts dozens of photographs a second.
    decoding: "async" as const,
    onLoad: () => setLoaded(true),
    onError: onTileImgError,
  };

  if (item.type === "photo") {
    // Serve the tiny preview when present; else the full-res original (the slow cold fetch). A shimmer
    // skeleton fills the tile until it decodes, then it fades in (the parent clips with overflow-hidden).
    return (
      <span className="relative block size-full">
        {shimmer}
        {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable */}
        <img
          {...imgProps}
          alt=""
          className={cn(
            "relative size-full object-cover transition-opacity duration-300 ease-out",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
    );
  }

  // Video: a preview poster IMAGE (no <video> fetch — the big bandwidth win) when present; else the
  // <video> poster frame (today's behavior) as the fallback.
  if (previewOk) {
    return (
      <>
        <span className="relative block size-full">
          {shimmer}
          {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable */}
          <img
            {...imgProps}
            alt=""
            className={cn(
              "relative size-full bg-black object-cover transition-opacity duration-300 ease-out",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
        {playBadge === "center" && <PlayBadge />}
      </>
    );
  }
  return (
    <>
      <video
        // iOS shows a black box without this poster fragment — see videoPosterSrc.
        // `src` is the kept URL (see above): a rolled link re-fetches nothing.
        src={videoPosterSrc(src)}
        preload="metadata"
        muted
        playsInline
        onError={onTileImgError}
        className="size-full bg-black object-cover"
      />
      {playBadge === "center" && <PlayBadge />}
    </>
  );
}
