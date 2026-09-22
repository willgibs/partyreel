"use client";

import {
  Clapperboard,
  ListChecks,
  MonitorPlay,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { EVENT, LIVE_ALBUM_COUNT } from "./fixtures";

/**
 * THE HUB'S HEADER AND CARDS ROW, QUOTED (`[eventId]/page.tsx` and
 * `event-feed/event-cards-row.tsx`'s own shapes and classes: the code at the
 * left of the title, a row of room cards). The real code is `StyledQr`
 * (touches `window` on construction); the placeholder square here stands in
 * for it at the same size, the way `share-parts.tsx` does for the sheet.
 *
 * ★ `screen`'s ONE varying thing. `withScreenButton` adds a fifth door beside
 * the four shipped rooms; everything else about the header and the row is
 * held exactly as `event=hub` shipped it.
 */
export function HubHeader() {
  return (
    <div className="flex items-center gap-4 px-6 pt-6">
      <div className="flex size-[72px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
        <QrCode className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="truncate font-heading text-page">{EVENT.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{EVENT.date}</span>
          <span>{LIVE_ALBUM_COUNT} photos</span>
          <span>{EVENT.guests} contributors</span>
        </div>
      </div>
    </div>
  );
}

const ROOMS = [
  { id: "review", label: "Review", value: "All caught up", Icon: ListChecks },
  { id: "reel", label: "Reel", value: "18 clips", Icon: Clapperboard },
  { id: "guests", label: "Guests", value: "34 contributors", Icon: Users },
  { id: "settings", label: "Settings", value: "Public", Icon: Settings },
] as const;

export function HubCardsRow({
  withScreenButton,
}: {
  /** `screen=hub`: a fifth door beside the four rooms. */
  withScreenButton?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="This event"
      className="flex gap-2 overflow-x-auto px-6 py-2"
    >
      {ROOMS.map(({ id, label, value, Icon }) => (
        <div
          key={id}
          className="flex h-24 w-36 shrink-0 flex-col justify-between gap-1 rounded-xl border border-border p-3 sm:w-40"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            {label}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {value}
          </span>
        </div>
      ))}

      {withScreenButton && (
        <div
          data-rh-screen-door
          className="flex h-24 w-36 shrink-0 flex-col justify-between gap-1 rounded-xl border border-reel/50 bg-reel/5 p-3 sm:w-40"
        >
          <MonitorPlay className="size-4 shrink-0 text-reel" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            Play on a screen
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Full-bleed, on a wall
          </span>
        </div>
      )}
    </div>
  );
}
