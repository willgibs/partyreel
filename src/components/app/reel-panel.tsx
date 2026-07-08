"use client";

import { Clapperboard, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { HostMediaGrid } from "@/components/app/host-media-grid";
import { type GridMedia } from "@/components/app/media-grid";
import { ReelSortableGrid } from "@/components/app/reel-sortable-grid";
import { type Tier } from "@/lib/constants/tiers";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { LikesProvider } from "@/components/likes/likes-provider";
import { ReelComposer } from "@/components/reel/reel-composer";
import { useReel } from "@/components/reel/reel-provider";
import { useReelReorder } from "@/components/reel/reel-reorder-provider";
import { Button } from "@/components/ui/button";

// Auto-fill: a one-tap "zero to reel" — seed an empty reel with a random batch of the gallery's approved
// media, then refine. Shown only when there's enough to make a reel worth watching.
const AUTOFILL_MIN = 4;
const AUTOFILL_MAX = 12;

// The REEL feed section's body: the host's curated highlight set (added via the clapperboard), in add-order.
// Bare (the section header — added by EventFeed — carries the name + count; the empty state is the shared
// FeedSectionEmpty). Reads the SHARED ReelProvider (hoisted around the feed) so an add in the gallery shows
// here instantly; renders the curated subset through the same HostMediaGrid (the chip is filled here; one tap
// un-reels + drops the tile). Approved-only (a hidden/removed item drops out). Highlight VIDEO gen is deferred.
export function ReelPanel({
  eventId,
  items,
  shareUrl,
  reelConfig,
  watermark,
  tier,
}: {
  eventId: string;
  /** All visible (approved + hidden) gallery items; filtered here to the in-reel, approved set. */
  items: GridMedia[];
  shareUrl?: string;
  /** The composer config (theme/seed/length/cover); null until first composed. Consumed by the
   *  reel composer (mounts the live CanvasReelPlayer). */
  reelConfig: ReelConfig | null;
  /** Free tier → the live player + the .mp4 export carry the partyreel.com wordmark. */
  watermark: boolean;
  /** The host's billing tier — the composer derives its length cap from it (ADR-0021). */
  tier: Tier;
}) {
  const reel = useReel();
  const reorder = useReelReorder();
  const byId = new Map(items.map((i) => [i.id, i]));
  // The provider's Set is insertion-ordered, so this preserves add-order. The FULL membership (approved +
  // any hidden in-reel item) — reorder commits the complete set the RPC's set-equality guard requires.
  const membership = (reel?.orderedIds ?? [])
    .map((id) => byId.get(id))
    .filter((m): m is GridMedia => !!m);
  // Browse shows the approved subset (a hidden in-reel item drops out, as before).
  const reelItems = membership.filter((m) => m.status === "approved");

  if (membership.length === 0) {
    return (
      <ReelEmptyState
        reel={reel}
        approved={items.filter((m) => m.status === "approved")}
      />
    );
  }

  // Reorder mode: the sortable uniform grid over the full membership; Done (the header) exits.
  if (reorder?.reorderMode && reel) {
    return (
      <ReelSortableGrid
        items={membership}
        onReorder={(ids) => reel.reorder(ids)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* The live composer (player hero + theme/shuffle/cover/length + Download) sits on top... */}
      <ReelComposer
        eventId={eventId}
        items={items}
        reelConfig={reelConfig}
        watermark={watermark}
        tier={tier}
      />
      {/* ...over the editable curated filmstrip (add/remove via the clapperboard, reorder via the
          header). A uniform grid (a legible sequence), not the gallery's natural-ratio masonry. */}
      <LikesProvider mediaIds={reelItems.map((i) => i.id)}>
        <HostMediaGrid
          eventId={eventId}
          items={reelItems}
          shareUrl={shareUrl}
          layout="uniform"
        />
      </LikesProvider>
    </div>
  );
}

// The empty reel: the teaser + a one-tap "Fill from gallery" auto-fill (zero-to-reel, then refine). A
// sub-component so its `filling` state never sits in ReelPanel's conditional branches.
function ReelEmptyState({
  reel,
  approved,
}: {
  reel: ReturnType<typeof useReel>;
  approved: GridMedia[];
}) {
  const [filling, setFilling] = useState(false);
  const canFill = !!reel && approved.length >= AUTOFILL_MIN;

  async function fillFromGallery() {
    if (!reel) return;
    setFilling(true);
    // A random batch (up to AUTOFILL_MAX) of approved media — add_to_reel is idempotent + approved-only.
    const pick = [...approved]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(AUTOFILL_MAX, approved.length))
      .map((m) => m.id);
    try {
      const added = await reel.addMany(pick);
      if (added > 0) toast.success(`Added ${added} to your reel.`);
    } finally {
      setFilling(false);
    }
  }

  return (
    <FeedSectionEmpty
      icon={Clapperboard}
      title="Build your highlight reel"
      desc="Add favorite moments from the gallery with the clapperboard and they collect here, ready to watch as a reel."
      action={
        canFill ? (
          <Button
            type="button"
            size="sm"
            onClick={fillFromGallery}
            disabled={filling}
          >
            <Sparkles />
            {filling ? "Filling…" : "Fill from gallery"}
          </Button>
        ) : undefined
      }
    />
  );
}
