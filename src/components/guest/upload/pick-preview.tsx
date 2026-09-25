"use client";

/**
 * A PICKED FILE, DRAWN — AND NAMED WHEN IT CANNOT BE.
 *
 * ★ THE FAILURE THIS EXISTS FOR IS SILENT. A pending tile renders an `<img>` or
 * a `<video>` straight off the object URL, so an iPhone `.mov` (and a HEIC
 * anywhere outside Safari) draws an EMPTY BLACK BOX for its whole upload:
 * the one file a guest is least sure about is the one the page shows them
 * nothing of. `shared/upload-thumbnail.tsx` answers the same moment by HIDING
 * the broken element, which is the same nothing with the space taken back. Here
 * the box keeps its place and says the file's name and size instead, because on
 * the review step, in the album's own stack and in the failure sheet the whole
 * question a guest is answering is "is that the right file".
 *
 * ★ `onError` IS THE ONLY HONEST TEST. Whether a browser can draw a HEIC or a
 * QuickTime clip is a per-browser, per-codec answer no MIME table gets right
 * (Safari draws both, Chrome draws neither, and a `.mov` carrying H.264 plays in
 * some Chromes and not others). So the element is given its chance and the
 * stand-in takes over the moment it fails, which is also the moment a reader
 * would otherwise be looking at a black square.
 */
import { useState } from "react";
import { FileVideo } from "lucide-react";

import { videoPosterSrc } from "@/lib/media/poster";
import { cn, formatBytes } from "@/lib/utils";

export function PickPreview({
  file,
  url,
  fit = "cover",
  className,
}: {
  file: File;
  /**
   * The object URL, minted and revoked by whoever OWNS this file: the album's
   * in-flight ledger for an upload, `usePickUrls` for the two sheets. Never
   * minted here — an element that mints its own and revokes it on unmount
   * paints a revoked URL on React's StrictMode remount, and every preview draws
   * the stand-in instead of the photograph. Absent for the one frame before the
   * owner's effect has run, which is invisible: the box is already drawn.
   */
  url?: string;
  /**
   * `cover` fills a box the caller shaped (a review tile, a sheet row).
   * `natural` lets the file's own ratio decide the height, which is what an
   * album tile does — a photograph must not change shape at the moment it
   * finishes uploading.
   */
  fit?: "cover" | "natural";
  /** The box. The caller owns the size and the corner; this owns what is in it. */
  className?: string;
}) {
  const [drawable, setDrawable] = useState(true);
  const isVideo = file.type.startsWith("video/");
  const media = fit === "cover" ? "size-full object-cover" : "w-full";
  const showStandIn = !drawable;

  return (
    <span
      data-pick-preview
      className={cn(
        "relative block overflow-hidden rounded-tile bg-muted",
        // A natural-fit box takes its height from the media inside it, so an
        // undrawable file (or the frame before its URL exists) would collapse
        // it to nothing: it needs a shape of its own exactly where there is no
        // picture to give it one.
        fit === "natural" && (showStandIn || !url) && "aspect-square",
        className,
      )}
    >
      {url &&
        !showStandIn &&
        (isVideo ? (
          <video
            src={videoPosterSrc(url)}
            className={media}
            preload="metadata"
            muted
            playsInline
            onError={() => setDrawable(false)}
          />
        ) : (
          // blob: URLs cannot go through next/image (no configured hostname).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={media}
            onError={() => setDrawable(false)}
          />
        ))}
      {showStandIn && (
        <span
          data-pick-stand-in
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-2 text-center text-muted-foreground"
        >
          <FileVideo className="size-4 shrink-0" aria-hidden />
          <span className="w-full truncate text-micro text-foreground">
            {file.name}
          </span>
          <span className="text-micro">{formatBytes(file.size)}</span>
        </span>
      )}
    </span>
  );
}
