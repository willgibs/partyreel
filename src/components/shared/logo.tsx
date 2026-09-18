import { Aperture } from "lucide-react";

import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/brand/wordmark";
import { cn } from "@/lib/utils";

type LogoProps = {
  /**
   * Render only the mark (no wordmark), for tight spaces. ★ A STAND-IN: the v1
   * icon is still to come (Will, 2026-09-17: "I'll upload new v1 icon separately
   * later once complete"), so this is the placeholder Aperture tile and nothing
   * in production mounts it. It stays so a call site that needs a mark has one
   * name to ask for, and the day the icon lands this branch is the only edit.
   */
  markOnly?: boolean;
  /** Sizes the wordmark by its height (22px by default); the width follows. */
  className?: string;
};

/**
 * THE BRAND, AS THE V1 WORDMARK ALONE (Will, 2026-09-17: "The wordmark should
 * exist alone in the nav & footer"). Every door wears the same drawing: the
 * marketing header and footer, the mobile menu, the app and admin shells, the
 * guest header, the sign-in page and the two error screens all mount `<Logo />`
 * and nothing else, so there is no lockup to keep in step.
 *
 * ★ `currentColor`, NEVER A FILL OF ITS OWN. His file is white because it was
 * drawn on a dark artboard; here the ground decides (paper chapters, the app's
 * light mode, the ink footer), so the wordmark takes the text colour of wherever
 * it sits, exactly as the placeholder's type did.
 *
 * ★ SIZED BY HEIGHT. The drawing is 308 by 64 and its letters fill that box from
 * the top of the l to the tail of the y, so the default 22px wordmark has an
 * x-height near 13px and runs about 106px wide, which holds the bar's corner
 * the way the old tile and 18px type did together. A call site that needs
 * another size passes a height class; the width is always `auto`.
 *
 * Presentation only: wrap it in a <Link> at the call site rather than baking
 * navigation in here. It names itself to a screen reader, so a link around it
 * needs no second label unless it says where the link goes.
 */
export function Logo({ markOnly = false, className }: LogoProps) {
  if (markOnly) {
    return (
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground",
          className,
        )}
      >
        <Aperture className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox={WORDMARK_VIEWBOX}
      fill="currentColor"
      className={cn("block h-5.5 w-auto shrink-0", className)}
    >
      <path d={WORDMARK_PATH} />
    </svg>
  );
}
