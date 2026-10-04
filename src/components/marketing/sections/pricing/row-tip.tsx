"use client";

import { useRef, useState } from "react";

import { portalSkinProps } from "@/components/marketing/chrome/portal-skin";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * A MATRIX ROW'S FINE PRINT, OPEN TO A CURSOR, A KEY AND A FINGER (red-team 52's MEDIUM: "a tap focuses the label and
 * the trigger stays closed", so on a phone Uploads and Deleted, the published terms of two limits, could not be
 * read at all).
 *
 * ★ THE PRIMITIVE REFUSES A FINGER ON PURPOSE (`ui/tooltip.tsx`, crumbs-33: a tap's focus opened a tooltip whose arrow
 * landed under the finger and lost the click, on controls whose name is their label). Here the words ARE the thing
 * asked for, so the row's label answers the press itself, as the glyph count and the code's corner mark do
 * (`ui/glyph-count.tsx`): a tap opens the words and the next tap on the label, a tap anywhere else (radix reads the
 * touch's click), the page scrolling or Escape puts them away; a tap on the words themselves does too. A key's Enter
 * or Space toggles, and a cursor's hover and focus open them exactly as before.
 *
 * ★ A CURSOR'S CLICK KEEPS THEM OPEN AND NEVER BLINKS THEM SHUT. Radix dismisses an open tooltip at the PRESS of
 * anything outside its words, its own trigger included, and the click then reopens them a beat later; the press on
 * this label is not an outside press (`onPointerDownOutside`), so the words that hover opened stay put under a click.
 * Another row's label is outside, so a second tap elsewhere in the table still puts this one away.
 *
 * ★ A GUTTER AT THE GLASS (`collisionPadding`): at 375 the words used to sit flush against the screen's edge (red-team
 * 52's NIT); they hold the page's own 16 px side gutter now.
 *
 * ★ A FINGER'S TARGET PAST THE TEXT, without growing the row: the label is one line of text, and the press that
 * misses it opens nothing.
 */

/** The page's side gutter, kept between the words and the glass at the narrowest widths. */
const GUTTER = 16;

export function RowTip({ label, tip }: { label: string; tip: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // How the press about to click began, and whether the words stood open under it: radix closes an open tooltip at
  // the press, so the click alone could not tell a tap that opens them from one that puts them away.
  const press = useRef<{ touch: boolean; wasOpen: boolean } | null>(null);
  // What last pressed the words themselves, so a finger's tap on them puts them away and a cursor's click does not
  // (a cursor may be selecting a phrase to copy).
  const onWords = useRef("");

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        ref={triggerRef}
        onPointerDown={(event) => {
          press.current = {
            touch: event.pointerType !== "mouse",
            wasOpen: open,
          };
          // Radix closes an open tooltip on any press of its trigger; the click below decides instead.
          event.preventDefault();
        }}
        onClick={(event) => {
          // Radix's own click closes the tooltip; this one owns what a press does.
          event.preventDefault();
          const began = press.current;
          press.current = null;
          if (!began) {
            // No pointer behind it (a key's Enter or Space, an assistive technology's activation): a toggle.
            setOpen((o) => !o);
          } else if (began.touch) {
            setOpen(!began.wasOpen);
          } else {
            setOpen(true);
          }
        }}
        className="relative cursor-help text-left font-medium underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']"
      >
        {label}
      </TooltipTrigger>
      {/* Portaled → carries the skin itself (THE PORTAL RULE). "cinema" since the table's chapter went dark: a
          portaled surface cannot read the room it was opened from. */}
      <TooltipContent
        {...portalSkinProps("cinema")}
        side="top"
        collisionPadding={GUTTER}
        onPointerDownOutside={(event) => {
          // A press on this row's own label is the label's to decide (its click, above), never a dismissal.
          if (triggerRef.current?.contains(event.target as Node | null)) {
            event.preventDefault();
          }
        }}
        onPointerDown={(event) => {
          onWords.current = event.pointerType;
        }}
        onClick={() => {
          if (onWords.current && onWords.current !== "mouse") setOpen(false);
        }}
      >
        <span className="max-w-60 text-pretty">{tip}</span>
      </TooltipContent>
    </Tooltip>
  );
}
