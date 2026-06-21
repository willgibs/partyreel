"use client";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";

// The GALLERY tab content: the album grid, bare (no card wrapper / heading - the tab label carries the
// name + count). Adding photos lives in the page's command bar (S3·3b·C). Items are plain,
// server-presigned objects (safe server -> client). Host-added media is auto-approved + seamless with
// guest media here; the data records the difference (guest_id IS NULL) if we ever surface it.
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
    // Rare state (S4·A5): the reassuring empty copy fades + rises in ([data-arrive]).
    return (
      <p data-arrive className="text-sm text-muted-foreground">
        {pendingCount > 0
          ? "Everything uploaded so far is awaiting your review above."
          : "No uploads yet. Add photos with the button above, or share the QR code with guests."}
      </p>
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
