"use client";

import { Clapperboard } from "lucide-react";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { useReel } from "@/components/reel/reel-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The Reel tab: the host's curated highlight set (the media added via the clapperboard), in add-order.
// Reads the SHARED ReelProvider (hoisted around both tabs) so an add in Uploads shows here instantly,
// and renders the curated subset through the same HostMediaGrid (the chip is filled violet here; one tap
// un-reels + drops the tile). Approved-only (a hidden/removed item drops out). The highlight VIDEO
// generation is deferred - this is the curated input set.
export function ReelPanel({
  eventId,
  items,
  shareUrl,
}: {
  eventId: string;
  /** All visible (approved + hidden) gallery items; filtered here to the in-reel, approved set. */
  items: GridMedia[];
  shareUrl?: string;
}) {
  const reel = useReel();
  const byId = new Map(items.map((i) => [i.id, i]));
  // The provider's Set is insertion-ordered, so this preserves add-order; approved-only.
  const reelItems = (reel?.orderedIds ?? [])
    .map((id) => byId.get(id))
    .filter((m): m is GridMedia => !!m && m.status === "approved");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reel</CardTitle>
        <CardDescription>
          {reelItems.length > 0
            ? `${reelItems.length} ${reelItems.length === 1 ? "moment" : "moments"} in your highlight reel.`
            : "Your highlight reel, curated from the album."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reelItems.length > 0 ? (
          <div className="space-y-4">
            <LikesProvider mediaIds={reelItems.map((i) => i.id)}>
              <HostMediaGrid
                eventId={eventId}
                items={reelItems}
                shareUrl={shareUrl}
              />
            </LikesProvider>
            <p className="text-xs text-muted-foreground">
              Reel video generation is coming soon. For now, this is your
              curated set.
            </p>
          </div>
        ) : (
          <div
            data-arrive
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Clapperboard className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Build your highlight reel</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add favorite moments from Uploads with the clapperboard, and
                they&rsquo;ll collect here. Reel video generation is coming
                soon.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
