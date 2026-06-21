"use client";

import { Clapperboard } from "lucide-react";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { useReel } from "@/components/reel/reel-provider";

// The REEL tab content: the host's curated highlight set (added via the clapperboard), in add-order.
// Bare (no card wrapper / heading - the tab label carries the name + count). Reads the SHARED
// ReelProvider (hoisted around both tabs) so an add in the gallery shows here instantly; renders the
// curated subset through the same HostMediaGrid (the chip is filled here; one tap un-reels + drops the
// tile). Approved-only (a hidden/removed item drops out). The highlight VIDEO generation is deferred.
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

  if (reelItems.length === 0) {
    return (
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
            Add favorite moments from the gallery with the clapperboard, and
            they&rsquo;ll collect here. Reel video generation is coming soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LikesProvider mediaIds={reelItems.map((i) => i.id)}>
        <HostMediaGrid eventId={eventId} items={reelItems} shareUrl={shareUrl} />
      </LikesProvider>
      <p className="text-xs text-muted-foreground">
        Reel video generation is coming soon. For now, this is your curated set.
      </p>
    </div>
  );
}
