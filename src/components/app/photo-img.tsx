"use client";

import { useState, type ImgHTMLAttributes } from "react";

import { TileStandIn } from "@/components/app/media-grid";
import { cn } from "@/lib/utils";

/**
 * A PHOTOGRAPH THIS BROWSER CANNOT DRAW IS NAMED ON EVERY SURFACE THAT DRAWS ONE, NEVER A BROKEN IMAGE (crumbs-93,
 * red-team 58's NIT, from crumbs-90's stand-in that reached the album's tile alone). Previews are made by the
 * uploading browser, so a HEIC sent from a desktop Chrome has none, and every read that falls back to the original
 * (the stage's live wall, a card's cover) hands the browser a file it may not decode: the stage drew a broken-image
 * glyph on black where the album's tile said "Can't show here / HEIC".
 *
 * This is the `<img>` of any such surface: until the browser says it cannot draw `src` it is that image, in the classes
 * it was given, and from then on the album's own stand-in (`TileStandIn`: a mark, the words and the format where it is
 * the reason, the words only where the box has room) fills the very box the image filled, in the same classes (so an
 * absolutely placed cover, a fading still and a 24 px pill each keep their geometry). A different `src` (the next
 * still, a rolled link) is asked afresh.
 *
 * Decorative copies of a photograph (a card's 12 percent ground, the stage's blurred light) stay plain images: a
 * decoration that cannot draw is nothing to name, and an ornament that says "can't show" is a failure of its own.
 */
export function PhotoImg({
  src,
  className,
  alt = "",
  ...rest
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string }) {
  const [undrawn, setUndrawn] = useState<string | null>(null);
  if (undrawn === src) {
    return (
      <span
        data-photo-stand-in=""
        className={cn("block overflow-hidden", className)}
      >
        <TileStandIn kind="photo" src={src} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a presigned R2 URL, never optimizable
    <img
      {...rest}
      src={src}
      alt={alt}
      className={className}
      onError={() => setUndrawn(src)}
    />
  );
}
