"use client";

import { ChevronRight } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { DropdownMenuHeader } from "@/components/ui/dropdown-menu";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { buildNotifications } from "@/lib/notifications/build";
import { cn } from "@/lib/utils";

import { EVENT, GALLERY_ITEMS, stillOf, WAITING } from "./fixtures";
import { AppBar } from "./parts-hub";

/**
 * THE COUNTS A WAITING QUEUE WEARS, for the merged `review` question: the
 * header bell, the dashboard card's amber chip and Review's own header. Drawn
 * on the host's phone, the device a host carries at their own party.
 *
 * ★ THE BELL'S ROW COMES FROM THE REAL BUILDER, never typed by hand:
 * `buildNotifications` is pure, so the panel draws exactly the copy a host gets
 * today, and `agree` draws the one line it would change (the event named, the
 * queue as its destination) beside it.
 */

/** The bell's review row as wired, for a caption to quote: its copy and where it lands. */
export const AS_WIRED = buildNotifications({
  pendingCount: WAITING,
  storageGraceUntil: null,
  tier: "pro",
  tierExpiresAt: null,
  recoverySoonestPurgeAt: null,
  announcements: [],
  announcementsSeenAt: "2026-09-19T00:00:00.000Z",
  now: new Date("2026-08-15T21:20:00.000Z"),
}).items.find((i) => i.kind === "review");

/** `review=agree`: the bell, open, naming the event and leading to its queue. */
export function BellPanelAgree() {
  return (
    <div
      data-rh-bell-panel="agree"
      className={cn(
        "absolute top-full right-0 z-40 mt-2 w-72 p-1",
        floatingPanel,
      )}
    >
      <DropdownMenuHeader meta={`${WAITING} new`}>
        Notifications
      </DropdownMenuHeader>
      <div className={cn("flex items-start gap-2 px-2 py-2", floatingRow)}>
        <span
          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
          aria-hidden
        />
        <div data-rh-said="" className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm leading-tight font-medium">
            {WAITING} uploads to review
          </p>
          <p className="text-xs text-muted-foreground">{EVENT.name}</p>
        </div>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}

/** `review=card`: the dashboard, where the event card's chip is the only count. */
export function PhoneDashboard() {
  return (
    <div
      data-rh-dashboard=""
      className="min-h-full bg-background text-foreground"
    >
      <AppBar device="phone" bell={0} />
      <div className="space-y-3 px-4 py-5">
        <p className="text-label font-semibold text-muted-foreground uppercase">
          Your events
        </p>
        <div className="pointer-events-none space-y-3">
          <EventCard
            href="#"
            name={EVENT.name}
            coverUrl={stillOf(GALLERY_ITEMS[0])}
            dateLabel="15 Aug"
            itemsLabel="18 items"
            statusLabel="Open"
            pendingCount={WAITING}
          />
          <EventCard
            href="#"
            name="Ruby's 30th"
            coverUrl={stillOf(GALLERY_ITEMS[9])}
            dateLabel="2 Oct"
            itemsLabel="1 item"
            statusLabel="Open"
          />
        </div>
      </div>
    </div>
  );
}
