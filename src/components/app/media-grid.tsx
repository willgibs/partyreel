"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff, VideoOff } from "lucide-react";

import { PlayBadge } from "@/components/shared/play-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { videoPosterSrc } from "@/lib/media/poster";
import type { UploaderFace } from "@/lib/media/uploader-identity";
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
   * The credit's face and door (crumbs-38): the uploader's photograph and colour and a door to their page,
   * resolved server-side (`lib/media/uploader-faces.ts`) where the surface shows faces: the album's own
   * Guests-list face for a confirmed sender (never a blocked person's, on a guest's view), the byline's for
   * the host, and a door only to a published page. Absent everywhere else, where the credit draws the plain disc.
   */
  uploaderFace?: UploaderFace | null;
  /**
   * Cross-event "Uploads" context (Phase 4), rendered as a subtle link in the lightbox (never on tiles).
   * Set ONLY by the personal Uploads gallery (a flat feed spanning events); the album/host grids omit
   * them, so their lightbox is unaffected. `eventQrToken` links the caption to that event's page.
   */
  eventName?: string | null;
  eventDateLabel?: string | null;
  eventQrToken?: string | null;
  /**
   * False where the viewer's like would be refused, so no heart is offered: set ONLY by the personal
   * Uploads feed, on an upload to an album that reads private to her (a private album's guest, or an
   * account the event blocked; `like_media` likes nothing there but the host's). Absent = likeable,
   * as on every other surface, whose LikesProvider already answers who may like.
   */
  likeable?: boolean;
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
  /**
   * A MARKETING STILL'S SIZED VARIANTS (mkt-polish), set ONLY where a marketing page draws its own
   * same-origin stills through this tile (the album page's stage, `stillVariants`): the image
   * optimizer's widths as a `srcSet` and the slot they fill as `sizes`, so the browser fetches and
   * decodes a still at its tile's size rather than its source file's. NEVER set by the product, whose
   * media is a short-lived presigned R2 URL the optimizer must not touch; a tile without it draws
   * exactly what it drew before the field existed. `url` stays the still's own path: it is the
   * fallback, and the object a tile keeps (`sameObject`). Derived from `url`, so the grid's
   * `sameItem` comparing `url` compares this too.
   */
  variants?: { srcSet: string; sizes: string };
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
 * THE PHOTOGRAPH A TILE OF THIS ITEM WILL DRAW AS AN <img>, EXACTLY THE ADDRESS IT WILL ASK FOR, or null
 * where it draws none: an item whose link has not landed (`url: ""`, the tile holds its shimmer), and a
 * video with no preview still (its own <video> poster frame, which has no fade to run). The address is
 * the tile's own (`tileSrc`), never a second reading of it: the browser hands a new <img> a photograph it
 * already holds only when the address is the very one it fetched. (A marketing still with `variants`
 * asks for whichever width its `srcSet` picks, so it is decoded ahead through `decodeTileImage` with the
 * same variants, never through this address.)
 */
export function tileImageSrc(
  item: Pick<GridMedia, "type" | "url" | "previewUrl">,
): string | null {
  if (item.type === "video" && !item.previewUrl) return null;
  return tileSrc(item, false) || null;
}

/**
 * FETCH AND DECODE A TILE'S PHOTOGRAPH INTO THIS DOCUMENT AHEAD OF ITS TILE (crumbs-23), so the <img>
 * a tile mounts on it is COMPLETE the moment it exists and `MediaTile` shows it at once (`data-instant`,
 * above) instead of fading it in. `ready` settles true when the photograph is decoded and false when it
 * could not be (a dead link, a file no engine can draw): it never rejects, and the caller decides how
 * long it will wait for it. The returned element is the caller's to HOLD until its tile has mounted: the
 * browser keeps a photograph only while something in the document still refers to it.
 *
 * A marketing still hands its `variants` too, and they are set before the address, as the tile's own
 * <img> sets them: the same `srcSet` and `sizes` in the same document pick the same width, which is the
 * one the tile will ask for.
 */
export function decodeTileImage(
  src: string,
  variants?: GridMedia["variants"],
): {
  image: HTMLImageElement;
  ready: Promise<boolean>;
} {
  const image = new Image();
  image.decoding = "async";
  if (variants) {
    image.sizes = variants.sizes;
    image.srcset = variants.srcSet;
  }
  image.src = src;
  const ready =
    typeof image.decode === "function"
      ? image.decode().then(
          () => true,
          () => false,
        )
      : new Promise<boolean>((resolve) => {
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
        });
  return { image, ready };
}

/**
 * Whether two presigned URLs name the same stored object: the same path, and
 * any query at all. A presign rolls about every 30 minutes by rewriting only
 * the query (its signature and expiry), so the path is the photograph.
 */
function sameObject(a: string, b: string): boolean {
  return a.split("?")[0] === b.split("?")[0];
}

/** The words a tile that cannot draw its photograph says (`TileStandIn`), in one place. */
export const TILE_STAND_IN = "Can’t show here";

/**
 * THE FORMATS A BROWSER MAY NOT DRAW, NAMED UNDER A STAND-IN, by the stored key's own extension (`original.<ext>`,
 * built server-side from the type, so it is the format and never a filename): a HEIC from an iPhone in Chrome or
 * Firefox, a QuickTime clip some browsers cannot play. A format every browser draws is never the reason, so it is
 * not named.
 */
const UNDRAWN_FORMAT: Record<string, string> = {
  heic: "HEIC",
  heif: "HEIF",
  avif: "AVIF",
  mov: "MOV",
  webm: "WebM",
};

/** The format a stand-in names for this address, or null. */
export function standInFormat(src: string): string | null {
  const ext = src.split(/[?#]/)[0]!.match(/\.([a-z0-9]+)$/i)?.[1];
  return ext ? (UNDRAWN_FORMAT[ext.toLowerCase()] ?? null) : null;
}

/**
 * ★ A PHOTOGRAPH THIS BROWSER CANNOT DRAW IS NAMED, NEVER BLANK (crumbs-90). Previews are made by the uploading
 * browser, so a HEIC sent from desktop Chrome, which cannot decode it, has none, and its tile serves the original:
 * wherever that cannot draw either (Chrome, Firefox, an Android phone) the tile was a shimmer for ever, a photograph
 * that read as still loading. Once nothing is left to try (no rolled link, no preview to fall back from) the tile says
 * so in the box it keeps, quietly: a mark, the words, and the format where it is the reason. Its words show only where
 * the box has room (a storage row's 44px thumbnail keeps the mark alone).
 */
function TileStandIn({ kind, src }: { kind: GridMedia["type"]; src: string }) {
  const Mark = kind === "video" ? VideoOff : ImageOff;
  const format = standInFormat(src);
  return (
    <span
      data-tile-stand-in={kind}
      className="@container relative flex size-full items-center justify-center bg-muted text-muted-foreground"
    >
      <span className="flex flex-col items-center gap-1 p-2 text-center">
        <Mark className="size-4 shrink-0" aria-hidden />
        <span className="hidden text-micro text-foreground @min-[5.5rem]:block">
          {TILE_STAND_IN}
        </span>
        {format && (
          <span className="hidden text-micro @min-[5.5rem]:block">
            {format}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Where a tile's photograph is. `pending`: on its way, the shimmer holds its place. `fade`: it landed after
 * its <img> mounted, and faded in. `instant`: it was complete when its <img> mounted, so it is simply there.
 */
type Landing = "pending" | "fade" | "instant";

export function MediaTile({
  item,
  playBadge = "center",
  eager = false,
}: {
  item: Pick<GridMedia, "type" | "url" | "previewUrl" | "variants">;
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
  // safe). A photograph that is already complete when its <img> mounts is shown at once instead, with no
  // fade to run (see `imgRef`), so it can never get stuck invisible at opacity-0 either.
  const [landing, setLanding] = useState<Landing>("pending");
  const loaded = landing !== "pending";
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
   *
   * ★ AND HER OWN UPLOAD LANDS ONCE (crumbs-32, from `crumbs-23`). An object
   * URL is this device's own picture of its upload, and the address that
   * replaces it is that same photograph's link, once it lands (half a second
   * later in a local walk). It used to run the landing again: the tile dropped
   * to the shimmer while the preview loaded (344 ms there) and faded in a second
   * time. A tile already showing its object URL takes the link IN PLACE: the
   * browser keeps drawing the picture it has until the new address is ready (an
   * <img>'s pending request), so nothing on screen changes but the bytes behind
   * it. Any other new object under a tile is a photograph landing, and fades in.
   */
  const latest = useRef(item);
  useEffect(() => {
    latest.current = item;
  });
  const [src, setSrc] = useState(() => tileSrc(item, false));
  const wanted = tileSrc(item, previewFailed);
  if (!sameObject(wanted, src)) {
    setSrc(wanted);
    if (!(loaded && wanted && src.startsWith("blob:"))) setLanding("pending");
  }

  /*
   * ★ A PHOTOGRAPH ALREADY COMPLETE WHEN ITS <img> MOUNTS SHOWS AT ONCE, NEVER FADES (crumbs-18). A photograph
   * the browser already holds (a stage decoded it before its row opened, a cached one, one that finished
   * before hydration) answers `complete` the moment its element exists. That is read here, in the commit's
   * own layout phase, so the state it sets lands before the first paint; it used to be read in a passive
   * effect, after it, which painted the tile transparent for a frame and then ran the 300ms fade over a
   * photograph with every byte in hand (a pushed arrival wiped in over it, against `arrival=push`:
   * "Nothing fades"). `data-instant` switches the transition off in that same commit, so a forced layout
   * between the two renders cannot start it either. A callback ref, not a mount effect: an <img> that
   * arrives after its tile (the paged album mints links per window) is read the same way.
   */
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete)
      setLanding((now) => (now === "pending" ? "instant" : now));
  }, []);

  /*
   * ★ NOTHING LEFT TO TRY IS SAID, NEVER LEFT TO SHIMMER (`TileStandIn`): the address that failed with no rolled link
   * and no preview to fall back from. Held by that address, so a different photograph under the tile (a new object)
   * draws afresh; the same object's next link is not asked again (a format this browser cannot decode fails alike,
   * and its original is the whole file), so the stand-in stays until the tile mounts again.
   */
  const [undrawable, setUndrawable] = useState<string | null>(null);

  const onTileImgError = () => {
    const now = latest.current;
    // A rolled link: the fresh one for the same photograph.
    const fresh = tileSrc(now, previewFailed);
    if (fresh !== src) {
      setSrc(fresh);
      setLanding("pending");
      return;
    }
    // The preview itself is broken: the original.
    if (!previewFailed && now.previewUrl) {
      setPreviewFailed(true);
      if (now.url !== src) {
        setSrc(now.url);
        setLanding("pending");
      }
      return;
    }
    setUndrawable(src);
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

  // Its own mark says what it is (a centred play badge would stand on it).
  if (undrawable === src) return <TileStandIn kind={item.type} src={src} />;

  const imgProps = {
    ref: imgRef,
    src,
    // A marketing still's sized variants (`GridMedia.variants`); absent on every product tile, where
    // React writes neither attribute and the markup is what it always was.
    sizes: item.variants?.sizes,
    srcSet: item.variants?.srcSet,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : ("auto" as const),
    // Decode off the main thread: a fling mounts dozens of photographs a second.
    decoding: "async" as const,
    onLoad: () => setLanding((now) => (now === "pending" ? "fade" : now)),
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
          data-instant={landing === "instant" ? "" : undefined}
          className={cn(
            "relative size-full object-cover transition-opacity duration-300 ease-out data-instant:transition-none",
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
            data-instant={landing === "instant" ? "" : undefined}
            className={cn(
              "relative size-full bg-black object-cover transition-opacity duration-300 ease-out data-instant:transition-none",
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
