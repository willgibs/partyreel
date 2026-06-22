"use client";

import { ImageOff } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";

// The GALLERY feed section's body: the album grid, bare (the section header — added by EventFeed — carries
// the name + count; the empty state is the shared FeedSectionEmpty). Adding photos lives in the page's
// command bar. Items are plain, server-presigned objects (safe server -> client). Host-added media is
// auto-approved + seamless with guest media here; the data records the difference (guest_id IS NULL).
export function EventUploads({
  eventId,
  items,
  pendingCount,
  shareUrl,
}: {
  eventId: string;
  items: GridMedia[];
  pendingCount: number;
  // The event JOIN url, threaded to the host lightbox Share (3c.2).
  shareUrl?: string;
}) {
  if (items.length === 0) {
    // Rare state: the reassuring empty copy fades + rises in (FeedSectionEmpty's [data-arrive]), the same
    // centered treatment as the Reel + Review empty states (the section header is added by EventFeed).
    return (
      <FeedSectionEmpty
        icon={ImageOff}
        title={pendingCount > 0 ? "Everything's in Review" : "No uploads yet"}
        desc={
          pendingCount > 0
            ? "Everything uploaded so far is waiting in Review."
            : "Add photos with the button above, or share the QR code with guests."
        }
      />
    );
  }
  // The host can LIKE here (a normal like → their Liked album + the count). The host is always signed
  // in, so the provider's create-account path never fires.
  return (
    <LikesProvider mediaIds={items.map((i) => i.id)}>
      <HostMediaGrid eventId={eventId} items={items} shareUrl={shareUrl} />
    </LikesProvider>
  );
}
