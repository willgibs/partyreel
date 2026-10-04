"use client";

import { portalSkinProps } from "@/components/marketing/chrome/portal-skin";
import { TapTooltip } from "@/components/ui/tooltip";

/**
 * A MATRIX ROW'S FINE PRINT, OPEN TO A CURSOR, A KEY AND A FINGER (red-team 52's MEDIUM: "a tap focuses the label and
 * the trigger stays closed", so on a phone Uploads and Deleted, the published terms of two limits, could not be
 * read at all).
 *
 * ★ THE PRIMITIVE REFUSES A FINGER ON PURPOSE (`ui/tooltip.tsx`, crumbs-33: a tap's focus opened a tooltip whose arrow
 * landed under the finger and lost the click, on controls whose name is their label). Here the words ARE the thing
 * asked for, so the row's label wears `TapTooltip`, the one press model the glyph count and the code's corner mark
 * wear too: a tap opens the words and the next tap on the label, a tap anywhere else, the page scrolling or Escape puts
 * them away, and a tap on the words themselves does too. A key's Enter or Space toggles, a cursor's hover and focus
 * open them, and its click keeps them open.
 *
 * ★ A GUTTER AT THE GLASS (`collisionPadding`): at 375 the words used to sit flush against the screen's edge (red-team
 * 52's NIT); they hold the page's own 16 px side gutter now (the floating layer's own is 8, `floatingGutter`).
 *
 * ★ A FINGER'S TARGET PAST THE TEXT, without growing the row: the label is one line of text, and the press that
 * misses it opens nothing.
 */

/** The page's side gutter, kept between the words and the glass at the narrowest widths. */
const GUTTER = 16;

export function RowTip({ label, tip }: { label: string; tip: string }) {
  return (
    // Portaled → carries the skin itself (THE PORTAL RULE). "cinema" since the table's chapter went dark: a portaled
    // surface cannot read the room it was opened from.
    <TapTooltip
      words={tip}
      {...portalSkinProps("cinema")}
      side="top"
      collisionPadding={GUTTER}
    >
      <button
        type="button"
        className="relative cursor-help text-left font-medium underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']"
      >
        {label}
      </button>
    </TapTooltip>
  );
}
