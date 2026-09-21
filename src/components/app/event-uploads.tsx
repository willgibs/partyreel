"use client";

import { Clock } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";

// The GALLERY feed section's body: the album grid, bare (the section header — added by EventGallery —
// carries the name + count). Items are plain, server-presigned objects (safe server -> client).
// Host-added media is auto-approved + seamless with guest media here; the data records the
// difference (guest_id IS NULL).
//
// ★ THE ZERO STATE IS A LAUNCH LIST NOW (Will, `empty=list`, 2026-09-21: "Three
// things the app already knows, as three things she can finish"). It arrives as
// a SLOT rather than being built here, because the list is derived from the
// event's own nulls and this is a client island: passing the rendered element
// down keeps the event row on the server, where it already is, instead of
// threading `event_date` and `description` through the album's props.
//
// ★ THE PENDING VARIANT STAYS ITS OWN THING. "Everything's in Review" is not an
// empty event — it is a full one whose host has not looked yet, and a launch
// list there would ask her to print table cards while photographs wait.
export function EventUploads({
  eventId,
  items,
  pendingCount,
  shareUrl,
  launchList,
}: {
  eventId: string;
  items: GridMedia[];
  pendingCount: number;
  // The event JOIN url, threaded to the host lightbox Share (3c.2).
  shareUrl?: string;
  /** The server-rendered launch list, shown only before the first photograph. */
  launchList?: React.ReactNode;
}) {
  if (items.length === 0) {
    if (pendingCount > 0) {
      return (
        <FeedSectionEmpty
          icon={Clock}
          title="Everything's in Review"
          desc="Everything uploaded so far is waiting in Review."
        />
      );
    }
    return <>{launchList}</>;
  }
  // The host can LIKE here (a normal like → their Liked album + the count). The host is always signed
  // in, so the provider's create-account path never fires.
  return (
    <LikesProvider mediaIds={items.map((i) => i.id)}>
      {/* selectable: the album opts into bulk-select (long-press + the floating bulk bar). */}
      <HostMediaGrid eventId={eventId} items={items} shareUrl={shareUrl} selectable />
    </LikesProvider>
  );
}
