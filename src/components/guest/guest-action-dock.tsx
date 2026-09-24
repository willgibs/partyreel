"use client";

/**
 * THE GUEST'S ACTIONS, DOCKED ONCE THE ROW HAS SCROLLED AWAY (`chrome=both`,
 * Will 2026-09-20, verbatim: "I like this because you see the actions higher on
 * the page when first landing, and then keep them visible as you continue.").
 *
 * ★ IT IS THE SECOND HALF OF ONE ANSWER, NOT A SECOND PLACE FOR THE ACTIONS.
 * Round one's `chrome=dock` carried his own objection to a dock ALONE ("having
 * the actions tucked in the bottom right is one of the last places a guest's
 * eye will reach, especially if they don't know to look for upload in the first
 * place"), and round two answered it: the page still lands on the full-width
 * row under the event's name, and this bar takes over the moment that row
 * leaves the screen. So a guest never has to discover the dock to find Add —
 * they have already used or read the row it grew out of.
 *
 * ★ AND IT REPLACES THE FLOATING PILL OUTRIGHT. The pill carried Add and only
 * Add, which left Invite unreachable past the first screen of a 200-photograph
 * album — the gap his "always accessible, no matter how deep into the album you
 * get" names. `floating-add-button.tsx` stays on disk (three lab boards and the
 * Library draw it) but nothing in the product mounts it any more.
 *
 * ★ A GRADIENT, NOT A HAIRLINE. The album runs to the window's edge, so the
 * dock's ground is photographs: a 1px rule across them reads as a crop, where a
 * scrim lets the last row dissolve into the page's own paper under the buttons.
 * No glass either — `lib/glass.ts` is media chrome (a tile's marks, the
 * lightbox), and bible 15 keeps a surface the page lives behind opaque.
 *
 * ★ HIDDEN IS `inert`, NOT UNMOUNTED, so the bar can travel out the way it
 * travelled in (an unmount has no exit) while its two buttons leave the tab
 * order and the accessibility tree entirely at the top of the page. The clock
 * is the floating layer's own edge beat — this is a surface crossing an edge,
 * which is exactly what `floatingClock.edge` is for — read off the contract
 * rather than typed here (bible 15).
 */
import { ImageUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

export function GuestActionDock({
  hidden,
  uploadingCount,
  onAdd,
  invite,
}: {
  /** The row is still on screen: the dock waits, inert, off the bottom edge. */
  hidden: boolean;
  /** The live queue count, in the same words the pill used to say them. */
  uploadingCount: number;
  /**
   * Omitted where the ROW omits Add too — uploads closed, a teaser, or an empty
   * album whose own centred CTA is the primary. The dock carries what the row
   * carries and never invents an action the page above it does not offer.
   */
  onAdd?: () => void;
  /**
   * Invite, as a slot. The trigger owns a Sheet of its own (`GuestShare`), and
   * a dock that imported it would be a chrome component that knows what a QR
   * code is; this way the bar is exactly its own layout and its own entrance.
   */
  invite?: ReactNode;
}) {
  // Nothing to dock is nothing to draw, scrim included.
  if (!onAdd && !invite) return null;
  return (
    <div
      data-guest-dock=""
      data-hidden={hidden ? "" : undefined}
      // React 19 renders the boolean `inert` attribute; it takes the buttons out
      // of the tab order AND the accessibility tree, which `pointer-events-none`
      // alone never did.
      inert={hidden}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40",
        // The edge beat, from the contract: 300ms in, 200ms back out.
        //
        // ★ `translate`, NOT `transform`. Tailwind v4's translate utilities set
        // the STANDALONE `translate` property, so a transition naming
        // `transform` animates nothing at all and the bar teleports: measured
        // here at 1440 (computed `transform: none`, `translate: 0px 16px`).
        "transition-[translate,opacity] duration-300 ease-emphasis",
        "data-hidden:opacity-0 data-hidden:duration-200",
        // ★ THE FADE IS THE BASELINE AND THE TRAVEL IS THE EXTRA (the house
        // idiom, `floatingCrossSlide`'s own note): `prefers-reduced-motion`
        // keeps the cross-fade every state already carries and drops the 16px,
        // rather than leaving a translate at zero distance racing an opacity.
        "motion-safe:data-hidden:translate-y-4",
      )}
    >
      {/* The album dissolving into the page's paper, so the bar has a ground
          that is not somebody's photograph. */}
      <div
        aria-hidden
        className="h-10 bg-gradient-to-t from-background to-transparent"
      />
      <div
        role="group"
        aria-label="Album actions"
        className={cn(
          "pointer-events-auto flex items-center gap-2 bg-background px-5",
          // The safe area, so the bar clears a notched phone's home indicator.
          "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          // At a desk the album is the window and the bar is not: the pair sits
          // where a cursor already is rather than stretching to 1920.
          "sm:justify-end",
        )}
      >
        {invite}
        {onAdd && (
          <Button
            type="button"
            size="lg"
            onClick={onAdd}
            className="flex-[2] active:scale-[0.98] motion-reduce:active:scale-100 sm:flex-none"
          >
            <ImageUp /> Add photos
            {uploadingCount > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-micro tabular-nums">
                {formatCount(uploadingCount)} uploading
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
