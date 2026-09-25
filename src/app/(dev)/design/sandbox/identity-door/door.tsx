"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { KEYBOARD_H } from "./keyboard";

/**
 * THE DOOR'S CHROME: the scrim behind it, the phone sheet's two postures and
 * the desk's panel, the same in every direction.
 *
 * ★ THE PANEL IS OPAQUE, SO THE BLUR AND THE OVERLAY BELONG TO THE SCRIM
 * (`floating-layer.ts` has no translucent panels, and the glass ruling does not
 * lift that). The scrim is its own element between the album and the sheet,
 * never a filter on an ancestor of the album: a backdrop filter blurs what is
 * BEHIND the element it sits on (`glass-behind`'s own rule for the lightbox).
 *
 * ★ THE KEYBOARD RULE production is adopting, drawn as ground: with a field
 * focused, the sheet's bottom sits ON the keyboard's top and its height is the
 * visible area minus 12 px, the primary action pinned at its foot and the body
 * scrolling above it. Without a keyboard it is the product sheet it is today: a
 * bottom sheet capped at 85 percent of the screen, sized to its content.
 *
 * ★ A SHEET IS A POSITIONED BOX HOLDING A PAPER, never the paper itself, so a
 * direction can stand something BEHIND the paper's free edge (`peek`'s stills,
 * their feet tucked under it the way prints stand in a sleeve): the paper is
 * the stacking layer above them, and a child of the paper could never go under
 * its own background.
 */

export type ScrimSpec = {
  blur: number;
  /** Black, 0 to 1. */
  dim: number;
  brightness?: number;
  saturate?: number;
};

/** Today's scrim, `entry-shell.tsx`'s overlay: 10 percent black, `backdrop-blur-xs`. */
export const TODAY_SCRIM: ScrimSpec = { blur: 4, dim: 0.1 };

export function Scrim({ spec }: { spec: ScrimSpec }) {
  const filter = [
    `blur(${spec.blur}px)`,
    spec.brightness !== undefined ? `brightness(${spec.brightness})` : "",
    spec.saturate !== undefined ? `saturate(${spec.saturate})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      data-door-scrim
      aria-hidden
      className="fixed inset-0 z-40"
      style={
        {
          backgroundColor: `rgb(0 0 0 / ${spec.dim})`,
          backdropFilter: filter,
          WebkitBackdropFilter: filter,
        } as CSSProperties
      }
    />
  );
}

/** The paper's own material, quoted from `entry-shell.tsx` and the Sheet. */
const PAPER =
  "relative z-10 isolate flex min-h-0 flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer";

export type SheetParts = {
  /** Behind the paper, positioned against its free edge. */
  behind?: ReactNode;
  /** Inside the paper, under the content (a light across it). */
  glow?: ReactNode;
  head?: ReactNode;
  body: ReactNode;
  foot?: ReactNode;
};

export function PhoneSheet({
  keyboard,
  behind,
  glow,
  head,
  body,
  foot,
}: SheetParts & { keyboard: boolean }) {
  return (
    <div
      data-door-sheet="phone"
      data-door-kb-up={keyboard ? "" : undefined}
      className={cn(
        "fixed inset-x-0 z-50 flex flex-col",
        !keyboard && "bottom-0 max-h-[85%]",
      )}
      style={keyboard ? { top: 12, bottom: KEYBOARD_H } : undefined}
    >
      {behind}
      <div
        data-door-paper
        className={cn(
          PAPER,
          "flex-1 rounded-t-float ring-1 ring-foreground/10",
        )}
      >
        {glow}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-5">
          {head && (
            <div className={cn("shrink-0", keyboard ? "pb-2" : "pb-3")}>
              {head}
            </div>
          )}
          {/* With the keyboard up the body scrolls above the pinned foot, and
              its last 20 px fade, so what runs past the fold reads as more
              to scroll rather than as a hard cut. */}
          <div
            data-door-body
            className={cn(
              keyboard &&
                "door-scroll-fade min-h-0 flex-1 overflow-y-auto pb-4",
            )}
          >
            {body}
          </div>
          <div
            data-door-foot
            className={cn("shrink-0", keyboard ? "pt-3 pb-3" : "pt-5 pb-6")}
          >
            {foot}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The desk's panel: `ui/sheet.tsx`'s responsive side (`w-3/4 max-w-md`), held. */
export function DeskPanel({ behind, glow, head, body, foot }: SheetParts) {
  return (
    <div
      data-door-sheet="desk"
      className="fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-md"
    >
      {behind}
      <div
        data-door-paper
        className={cn(PAPER, "h-full w-full border-l border-border")}
      >
        {glow}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          {head && <div className="shrink-0 pb-4">{head}</div>}
          <div data-door-body>{body}</div>
          <div data-door-foot className="shrink-0 pt-5">
            {foot}
          </div>
        </div>
      </div>
    </div>
  );
}
