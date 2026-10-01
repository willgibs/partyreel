import { getImageProps } from "next/image";

import type { MarketingImage } from "@/lib/constants/marketing-media";

/**
 * A MARKETING STILL AT ITS SLOT'S SIZE (mkt-polish): the derivative path a marketing still takes where it
 * is drawn by the product's own album tile (`MediaTile`, which draws a presigned URL as it is and never
 * through the optimizer). The stand-ins are 700 to 900px sources decoded into tiles a third that wide
 * (about 2 MB each, 18.6 MB for the album page's stage at 1440), and the generated stills that replace
 * them in the Higgsfield month will be larger still, so the size lives here, never in the files: the
 * image optimizer's widths as a `srcSet` (Next's own `getImageProps`, the same derivatives every
 * `next/image` on the site is served from), picked by the browser against the `sizes` the slot declares.
 * A still dropped into the manifest later inherits it with no hand-resize.
 *
 * The slot's `sizes` is the call site's to say, because only it knows how wide its tile stands; a sizes
 * wider than the slot buys bytes nobody sees, and a narrower one blurs the photograph.
 */
export function stillVariants(
  still: Pick<MarketingImage, "src" | "width" | "height">,
  sizes: string,
): { srcSet: string; sizes: string } {
  const { props } = getImageProps({
    src: still.src,
    width: still.width,
    height: still.height,
    sizes,
    alt: "",
  });
  return { srcSet: props.srcSet ?? "", sizes };
}
