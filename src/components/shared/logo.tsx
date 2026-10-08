import { useId } from "react";

import { ringCutFor, ringMarkup } from "@/lib/brand/ring";
import {
  WORDMARK_DISPLAY,
  WORDMARK_SMALL,
  type WordmarkCutId,
} from "@/lib/brand/wordmark";
import { cn } from "@/lib/utils";

type LogoProps = {
  /**
   * The icon alone, the Ring (brand-marks r1, `icon=ember`), for a place that
   * wants the mark rather than the word: never beside the wordmark (the word
   * stands alone in the bars and the foot; the Ring alone on tabs and home
   * screens). Nothing in production mounts it yet.
   */
  markOnly?: boolean;
  /** The Ring's edge in CSS pixels (28 by default), which picks its cut. Ignored by the word. */
  size?: number;
  /**
   * The word's cut: `small` (the default) for every size under 48px, the bars
   * and the foot; `display` from 48px up. A call site that sizes the word
   * larger than the bars names the cut its height wears (`wordmarkCutFor`).
   */
  cut?: WordmarkCutId;
  /** Sizes the wordmark by its height (22px by default); the width follows. */
  className?: string;
};

/**
 * THE BRAND, AS THE WORDMARK ALONE (Will, 2026-09-17: "The wordmark should
 * exist alone in the nav & footer"; finished at brand-marks r1). Every door
 * wears the same drawing: the marketing header and footer, the mobile menu, the
 * app and admin shells, the guest header, the sign-in page and the two error
 * screens all mount `<Logo />` and nothing else, so there is no lockup to keep
 * in step.
 *
 * ★ `currentColor`, NEVER A FILL OF ITS OWN. His file is white because it was
 * drawn on a dark artboard; here the ground decides (paper chapters, the app's
 * light mode, the ink footer), so the wordmark takes the text colour of
 * wherever it sits.
 *
 * ★ SIZED BY HEIGHT, AND CUT FOR IT. The drawing is 64 units tall and its
 * letters fill that box from the top of the l to the tail of the y, so the
 * default 22px wordmark has an x-height near 13px and runs about 108px wide.
 * Under 48px it wears the small cut, his letters a step further apart so no
 * two blot at a bar's size; from 48px up the display cut, parted a hair
 * (`src/lib/brand/wordmark.ts` measures both). The width is always `auto`.
 *
 * Presentation only: wrap it in a <Link> at the call site rather than baking
 * navigation in here. It names itself to a screen reader, so a link around it
 * needs no second label unless it says where the link goes.
 */
export function Logo({
  markOnly = false,
  size = 28,
  cut = "small",
  className,
}: LogoProps) {
  if (markOnly) return <RingMark size={size} className={className} />;
  const word = cut === "display" ? WORDMARK_DISPLAY : WORDMARK_SMALL;
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox={word.viewBox}
      fill="currentColor"
      data-cut={word.id}
      className={cn("block h-5.5 w-auto shrink-0", className)}
    >
      <path d={word.d} />
    </svg>
  );
}

/**
 * THE RING, INLINE: the icon's one drawing (`ringMarkup`, `src/lib/brand/
 * ring.ts`, the same markup every icon file is written from) at its cut for
 * `size`, on its dark tile in a home screen's corner. Its gradient, clip and
 * filter ids are the instance's own (`useId`), since an SVG id is
 * document-global and two Rings on one page would otherwise share the first's.
 * The markup is the module's own constant drawing, never anything a person
 * typed.
 */
function RingMark({ size, className }: { size: number; className?: string }) {
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      data-cut={ringCutFor(size).id}
      className={cn("block shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: ringMarkup({ size, id }) }}
    />
  );
}
