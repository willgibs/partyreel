"use client";

import type { ReactNode } from "react";

import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventSheet } from "@/lib/event/sections";

/**
 * THE ONE PANEL A ROOM OPENS IN (Will, event-header r2 `rooms=over`, 2026-10-03: "This feels phenomenally more
 * fluid, natural, and intuitive"): Review and Guests stand where Settings stands, a panel from the right edge over
 * the hub at a desk and the whole screen under a back arrow that names the event in a hand, so one row of doors does
 * one thing and the album she left stays mounted and scrolled behind it.
 *
 * ★ THE SETTINGS KIND, AND SETTINGS' OWN HEAD (`popup-kinds.ts`, `settings=panel`): the room's name over the
 * event's, the close in the corner, the panel itself focused at a desk (a place read before it is touched), and in a
 * hand the bar whose arrow names the event. `routed`, because the room rides the hub's address (`?room=`), which
 * already puts it in history and lets a phone's Back close it. Its width is the kind's, so the three rooms are one
 * panel to the pixel and moving between them never jumps.
 *
 * ★ `data-room-panel` NAMES THE ROOM ON THE DIALOG ITSELF: the room inside reads its own panel as its page, never as
 * another layer up (`review-keys.ts`), and a test or a red-team finds which room stands.
 */
export function RoomPanel({
  room,
  open,
  onOpenChange,
  title,
  eventName,
  children,
}: {
  room: EventSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eventName: string;
  children: ReactNode;
}) {
  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupContent kind="settings" routed data-room-panel={room}>
        <PopupHeader title={title} description={eventName} back={eventName} />
        {/* ★ BLOCK FLOW, as Settings' body: the body is the scroller, and nothing in it may shrink to fit. */}
        <PopupBody className="space-y-6 pb-6">{children}</PopupBody>
      </PopupContent>
    </Popup>
  );
}

/**
 * A ROOM'S PLACE WHILE WHAT IT SHOWS ARRIVES (its chunk, its queue's links, its list): the room's own shapes in the
 * Skeleton's shimmer (still under reduced motion), so the panel stands at once and fills in, never a spinner in an
 * empty panel. `grid` is Review's tiles, `list` the Guests room's rows.
 */
export function RoomShimmer({ shape }: { shape: "grid" | "list" }) {
  return (
    <div data-room-reading={shape} aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading</span>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>
      {shape === "grid" ? (
        <>
          <Skeleton className="h-4 w-64 max-w-full" />
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
