"use client";

import { useCallback, useState, type ImgHTMLAttributes } from "react";

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
 * ★ THE BROWSER SAYS IT TWO WAYS, AND BOTH ARE HEARD (crumbs-94, red-team 58b). An `error` event, for an image that fails
 * after React is listening; and, for one that failed BEFORE it, a read when the element is attached: the page's own HTML
 * names the `<img>`, the browser starts it at once (a HEIC from the HTTP cache, through the head's preload link, in about
 * 6 ms) and fires `error` while the script is still on its way, so `onError` attaches after the only `error` it would
 * ever have heard and the wall drew a broken image on every reload after the first. An image that is `complete` with
 * no `naturalWidth` is exactly that failure (`complete` is true for a broken one too), and the album's tile reads
 * `complete` in a callback ref for the same reason (`MediaTile`'s `imgRef`, crumbs-18). A callback ref and not a mount
 * effect, so the stand-in lands in the commit that attached the image, before the first paint.
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
  const imgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && src && img.complete && img.naturalWidth === 0) setUndrawn(src);
    },
    [src],
  );
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
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      onError={() => setUndrawn(src)}
    />
  );
}
