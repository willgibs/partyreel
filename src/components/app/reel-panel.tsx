"use client";

import { Clapperboard } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { useReel } from "@/components/reel/reel-provider";

// The REEL feed section's body: the host's curated highlight set (added via the clapperboard), in add-order.
// Bare (the section header — added by EventFeed — carries the name + count; the empty state is the shared
// FeedSectionEmpty). Reads the SHARED ReelProvider (hoisted around the feed) so an add in the gallery shows
// here instantly; renders the curated subset through the same HostMediaGrid (the chip is filled here; one tap
// un-reels + drops the tile). Approved-only (a hidden/removed item drops out). Highlight VIDEO gen is deferred.
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
      <FeedSectionEmpty
        icon={Clapperboard}
        title="Build your highlight reel"
        desc="Add favorite moments from the gallery with the clapperboard, and they'll collect here. Reel video generation is coming soon."
      />
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
