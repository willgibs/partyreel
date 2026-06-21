"use client";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The host's Uploads card: the album gallery. Adding photos lives in the page's
// command bar now (S3·3b·C: the command Add + the floating Add + the upload panel),
// so this is gallery-only. The grid items are plain, server-presigned objects (safe
// to pass server -> client). Host-added media is auto-approved and indistinguishable
// from guest media here (one seamless album); the data records the difference
// (guest_id IS NULL) if we ever want to surface it.
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploads</CardTitle>
        <CardDescription>
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? "item" : "items"} in this album.`
            : "Photos and videos appear here, from guests or added by you."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          // The host can LIKE here (a normal like → their Liked album + the count).
          // The host is always signed in, so the provider's create-account path never fires.
          <LikesProvider mediaIds={items.map((i) => i.id)}>
            <HostMediaGrid eventId={eventId} items={items} shareUrl={shareUrl} />
          </LikesProvider>
        ) : (
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? "Everything uploaded so far is awaiting your review above."
              : "No uploads yet. Add photos with the button above, or share the QR code with guests."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
