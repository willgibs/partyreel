/**
 * WHAT A GALLERY ITEM IS TO THE LIVE REEL.
 *
 * The live reel reads the SAME payload the album holds — no second RPC, no second presign — so this
 * module takes the album's own item shape rather than inventing a parallel one. `LiveMediaItem` is a
 * structural SUPERTYPE of `GridMedia`: every field is optional but `id`, `type` and `url`, so the
 * provider hands its `GridMedia[]` straight in, and the `reelEligible` column the expand migration
 * adds (`media.reel_eligible`, "plays in the live reel") lands here the day `toGridItems` carries it
 * without a mapping layer in between to drift.
 *
 * ★ URLS ARE LOOKED UP, NEVER HELD. A presign is stable inside its 30-minute bucket and dead at 90
 * minutes (uploads-and-r2.md); the album's poll re-presigns on every bucket roll and hands a NEW
 * item object down. The source therefore reads a clip's url from the LATEST item at the moment it
 * builds a window, so an all-night loop refreshes for free. Nothing in live/ may cache a url.
 *
 * Pure: no DOM, no React, no server imports.
 */

import type { ReelClip } from "@/lib/reel/engine/reel-types";

export type LiveMediaItem = {
  id: string;
  type: "photo" | "video";
  /** The presigned original. Photos prefer `previewUrl`; a video's motion window reads this one. */
  url: string;
  /** The small WebP preview: a photo's still and a video's poster. Every reel surface draws these. */
  previewUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  /** `media.file_size_bytes`: the range reader's byte estimate. Unknown is allowed (it re-checks). */
  fileSizeBytes?: number | null;
  /** Absent on a surface that stamps nothing; anything not "approved" never reaches a take. */
  status?: "pending" | "approved" | "hidden" | "removed";
  createdAt?: string | null;
  /** guest_id, "host" or null — the take's per-uploader coverage (quick-add's own signal). */
  uploaderKey?: string | null;
  /** The caption's name, handed back through `onClipChange` (never drawn by the engine). */
  uploaderName?: string | null;
  isHost?: boolean;
  /** Host-only; where it is absent the take's likes term collapses to nothing, which is correct. */
  likeCount?: number;
  /**
   * `media.reel_eligible`: false for a clip added to the album, so the live reel never plays a reel.
   * ABSENT means eligible — a payload from before the column exists must not empty the reel.
   */
  reelEligible?: boolean;
  /**
   * ★ WHETHER THE ITEM HAS A STILL, SAID BY THE MANIFEST RATHER THAN BY A URL. On the paged album an
   * item's links arrive by id, a window or two ahead of its turn (`src/lib/album/resolver.ts`), so a
   * take planned over the whole album cannot read "has a still" off a url most items do not hold
   * yet. The manifest knows it outright: a photograph always has one (its preview, or the original),
   * a video only when it has a preview (its poster; the raw file is no image). ABSENT falls back to
   * the url, which is what a surface that still hands in linked items relies on.
   */
  drawable?: boolean;
};

/**
 * Whether an item may enter a take. Three gates, in the order they can fail:
 * a clip (`reelEligible === false`) is never in the order; a held, hidden or removed item is not part
 * of the album the reel mirrors; and an item with nothing drawable would only buy a theme-colour
 * hold, which reads as a bug rather than as a photograph.
 */
export function isReelEligible(item: LiveMediaItem): boolean {
  if (item.reelEligible === false) return false;
  if (item.status !== undefined && item.status !== "approved") return false;
  return item.drawable ?? Boolean(stillUrlFor(item));
}

/** The still the reel draws for this item: a photo's preview (original as the pre-preview fallback),
 *  a video's poster ONLY (never the raw file — the image decoder cannot read an mp4). */
export function stillUrlFor(item: LiveMediaItem): string {
  if (item.type === "video") return item.previewUrl ?? "";
  return item.previewUrl ?? item.url ?? "";
}

/**
 * The engine clip for an item.
 *
 * `videoWindowSec` is the ONE thing the Include-videos knob changes here: with videos off a video
 * holds exactly as long as a photograph (its poster is all there is to look at), and with them on it
 * holds the surface's window, which is the span the range reader (`engine/video/window-reader.ts`)
 * decodes.
 */
export function toReelClip(
  item: LiveMediaItem,
  opts: { videoWindowSec?: number | null } = {},
): ReelClip {
  const width = item.width ?? undefined;
  const height = item.height ?? undefined;
  const url = stillUrlFor(item);
  if (item.type === "video") {
    const window = opts.videoWindowSec ?? null;
    return {
      url,
      type: "video",
      width,
      height,
      ...(window
        ? {
            trimStartSec: 0,
            trimDurationSec: Math.min(window, item.durationSeconds ?? window),
          }
        : {}),
    };
  }
  return { url, type: "photo", width, height };
}
