"use client";

import { type ReactNode } from "react";
import { Check, ChevronLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  floatingPanel,
  floatingPopupShapes,
  floatingRow,
} from "@/components/ui/floating-layer";
import {
  type DialogShape,
  isDialogShape,
  type PopupKind,
  shapeFor,
} from "@/components/ui/popup-kinds";
import { cn } from "@/lib/utils";

import type { ScreenId } from "./screens";

/**
 * THE POPUP KINDS, QUOTED FROM THE ONE TABLE (`ui/popup-kinds.ts`; ported from
 * `event-safety/kinds.tsx`). Every popup on this board names its kind and
 * reads its shape off production's own row for the width it is drawn at, so
 * when Will moves a kind the board moves with it: settings is his unfocused
 * panel at a desk and its own screen under a back arrow in a hand; a quick
 * choice is a menu under the words that asked at a desk and rows at the thumb
 * in a hand.
 *
 * ★ QUOTED, NEVER MOUNTED: `PopupContent` sits in a Radix portal, which renders
 * on the lab page's document rather than inside the frame being judged. The
 * element below wears production's own classes instead (the shapes from
 * `floatingPopupShapes`, keyed by the `data-shape` it sets, and the content
 * and overlay strings `popup.tsx` keeps private, copied because it does not
 * export them). Nothing opens or closes: every control is `tabIndex={-1}`,
 * drawn at rest, so reduced motion has nothing to honour.
 */

/** A desk or a hand, as the product's one breakpoint reads the frame. */
export const deskOf = (screen: ScreenId) => screen === "1440";

/** `popup.tsx`'s scrim, quoted: the Dialog's and the Sheet's, never drawn behind a whole screen. */
const OVERLAY = cn(
  "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
  "data-[shape=screen]:invisible data-[shape=cover]:invisible",
);

/** `popup.tsx`'s content element, quoted: the column every shape stands on. */
const CONTENT =
  "fixed z-50 flex flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer outline-none";

/**
 * ONE POPUP OF ONE KIND, AT ONE WIDTH: the head, the body that scrolls and an
 * optional foot, the three parts `PopupContent` draws in every shape. A hand's
 * `screen` heads with its bar (the back arrow naming where Back returns, the
 * title centred, the line under it); every other shape heads with the title
 * and its line and carries the close in its corner.
 *
 * ★ `up` IS THE ONE THING PRODUCTION DOES NOT DRAW YET: a place one level into
 * the settings (the summary's group page). In a hand it is simply the bar's
 * back arrow naming Settings, which is already the kind's grammar; at a desk
 * it is a small back row above the title, the panel's close staying in its
 * corner.
 */
export function PopupQuote({
  kind,
  screen,
  title,
  description,
  back,
  up,
  size = "sm",
  bodyClassName,
  foot,
  children,
}: {
  kind: PopupKind;
  screen: ScreenId;
  title: ReactNode;
  description?: ReactNode;
  /** Where a hand's back arrow returns, in words. */
  back?: string;
  /** A level in: where the back row returns at a desk (and the bar's arrow in a hand). */
  up?: string;
  size?: "sm" | "md" | "lg";
  bodyClassName?: string;
  foot?: ReactNode;
  children: ReactNode;
}) {
  const wanted = shapeFor(kind, deskOf(screen));
  const shape: DialogShape = isDialogShape(wanted)
    ? wanted
    : deskOf(screen)
      ? "dialog"
      : "sheet";
  const bar = shape === "screen";
  return (
    <>
      <div aria-hidden data-shape={shape} className={OVERLAY} />
      <div
        data-slot="popup-content"
        data-kind={kind}
        data-shape={shape}
        data-size={size}
        className={cn(CONTENT, floatingPopupShapes)}
      >
        {bar ? (
          <div data-slot="popup-header" className="shrink-0 border-b">
            <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="sm"
                tabIndex={-1}
                className="max-w-full gap-0.5 justify-self-start px-1.5 text-muted-foreground"
              >
                <ChevronLeft className="size-5" />
                <span className="truncate">{up ?? back ?? "Back"}</span>
              </Button>
              <p className="max-w-[55vw] truncate text-center font-heading text-base font-medium text-foreground">
                {title}
              </p>
              <span aria-hidden />
            </div>
            {description ? (
              <p className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        ) : (
          <div
            data-slot="popup-header"
            className="flex shrink-0 flex-col gap-1 p-4 pr-12"
          >
            {up ? (
              <Button
                variant="ghost"
                size="sm"
                tabIndex={-1}
                className="-mt-1 mb-1 -ml-2 gap-0.5 self-start px-1.5 text-muted-foreground"
              >
                <ChevronLeft className="size-4" />
                {up}
              </Button>
            ) : null}
            <p className="font-heading text-card-title font-medium text-pretty text-foreground">
              {title}
            </p>
            {description ? (
              <p className="text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        )}
        <div
          data-slot="popup-body"
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4",
            bar && "pt-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {foot}
        {!bar && (
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Close"
            className={cn(
              "absolute",
              shape === "dialog" || shape === "wide"
                ? "top-2 right-2"
                : "top-3 right-3",
            )}
          >
            <X />
          </Button>
        )}
      </div>
    </>
  );
}

/* ── a quick choice: a menu at a desk, rows at the thumb in a hand ────────── */

/** `responsive-menu.tsx`'s two row shapes, quoted (it keeps them private). */
const DESK_ROW =
  "flex min-h-9 w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm outline-none select-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";
const HAND_ROW =
  "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-base outline-none select-none [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

export type ChoiceRow = {
  label: string;
  hint?: string;
  /** The value it holds now: a check at its end. */
  on?: boolean;
  /** The row the host is about to press (the frame's reach). */
  next?: boolean;
};

/**
 * THE ONE RESPONSIVE MENU, AT REST (`ui/responsive-menu.tsx`, the `choice`
 * kind): in a hand its rows rise to the thumb over the page's own scrim with
 * Cancel beneath; at a desk it is the menu under the words that asked, which
 * the caller stands where those words are (`anchor`). A row is the act, so
 * there is no Save under the rows.
 */
export function ChoiceQuote({
  screen,
  title,
  rows,
  anchor,
  reach = false,
}: {
  screen: ScreenId;
  title: string;
  rows: readonly ChoiceRow[];
  /** At a desk: where the menu stands, relative to the words that asked. */
  anchor?: string;
  /** The whole choice is what the frame measures (no one row is next). */
  reach?: boolean;
}) {
  const hand = shapeFor("choice", deskOf(screen)) === "rows";
  const list = rows.map((r) => (
    <span
      key={r.label}
      data-set-reach={r.next ? "" : undefined}
      className={cn(
        hand ? HAND_ROW : DESK_ROW,
        floatingRow,
        r.next && "bg-accent",
      )}
    >
      <span className="min-w-0 flex-1">{r.label}</span>
      {r.hint ? (
        <span
          className={cn(
            "shrink-0 text-muted-foreground",
            hand ? "text-sm" : "text-xs",
          )}
        >
          {r.hint}
        </span>
      ) : null}
      {r.on ? <Check aria-hidden /> : null}
    </span>
  ));
  if (hand) {
    return (
      <>
        <div
          aria-hidden
          className="fixed inset-0 z-[60] bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        />
        <div
          data-slot="responsive-menu-rows"
          className="fixed inset-x-2 bottom-2 z-[60] flex flex-col gap-2 text-sm"
        >
          <div
            data-set-reach={reach ? "" : undefined}
            className={cn("p-1", floatingPanel)}
          >
            <p className="px-3 pt-2.5 pb-2 text-center text-xs text-pretty text-muted-foreground">
              {title}
            </p>
            {list}
          </div>
          <span
            className={cn(
              "flex h-12 shrink-0 items-center justify-center text-base font-medium",
              floatingPanel,
            )}
          >
            Cancel
          </span>
        </div>
      </>
    );
  }
  return (
    <div
      data-slot="responsive-menu"
      data-set-reach={reach ? "" : undefined}
      className={cn(
        "absolute z-20 flex w-72 flex-col p-1 text-sm",
        floatingPanel,
        anchor,
      )}
    >
      {list}
    </div>
  );
}
