"use client";

import { type GridMedia } from "@/components/app/media-grid";
import { ReelSortableGrid } from "@/components/app/reel-sortable-grid";
import { ReelBuilder } from "@/components/reel/reel-builder";
import { ReelMarquee } from "@/components/reel/reel-marquee";
import { useReel } from "@/components/reel/reel-provider";
import { useReelReorder } from "@/components/reel/reel-reorder-provider";
import { useReelPublish } from "@/components/reel/reel-share-card";
import { useReelStage } from "@/components/reel/reel-stage-provider";
import { useReelConfig } from "@/components/reel/use-reel-config";
import { type Tier } from "@/lib/constants/tiers";
import { type ReelConfig } from "@/lib/db/queries/reel";

/**
 * The REEL feed section's body — now a LIFECYCLE SWITCH (R3).
 *
 * A first visit and a hundredth visit finally differ:
 *   no config row → ReelBuilder (curate, then Create fires the ratified reveal)
 *   config row    → ReelMarquee (the poster, the labeled controls, the share card)
 *   reorder mode  → the sortable grid (unchanged)
 *
 * ★ The switch is on the CONFIG ROW, not on membership. Create-birth means the
 * row's existence IS the reel's birth certificate, so a LEGACY reel (curated
 * before this round, config already upserted) correctly lands straight in the
 * Marquee rather than being asked to "create" something it already has. The live
 * answer comes from ReelStageProvider, because the birth happens client-side and
 * the section must swap without a navigation.
 *
 * useReelConfig is mounted ONCE here and passed down, so the builder's Create and
 * the Marquee's controls share one debounce timer and one ReelProps memo.
 */
export function ReelPanel({
  eventId,
  eventName,
  items,
  shareUrl,
  reelConfig,
  watermark,
  tier,
  guestVisible = false,
}: {
  eventId: string;
  /** The event's name — the poster card's title and the reveal's title card. */
  eventName: string;
  /** All visible (approved + hidden) gallery items. */
  items: GridMedia[];
  shareUrl?: string;
  /** The stored reel config (style/seed/length/cover); null until first created. */
  reelConfig: ReelConfig | null;
  /** Free tier → the live player + the .mp4 export carry the partyreel.com wordmark. */
  watermark: boolean;
  /** The host's billing tier — the length cap derives from it (ADR-0021). */
  tier: Tier;
  /**
   * highlight_reels.guest_visible — is the reel already shared with guests?
   * TODO(track-C): getReelConfig gains this field on Track C's branch; until the
   * merge the page passes nothing and the DB default (false) applies.
   */
  guestVisible?: boolean;
}) {
  const reel = useReel();
  const reorder = useReelReorder();
  const stage = useReelStage();
  const config = useReelConfig({ eventId, items, reelConfig, watermark, tier });
  const publish = useReelPublish(eventId, guestVisible);

  // Reorder mode: the sortable uniform grid over the FULL membership (a hidden
  // in-reel item still shows, dimmed, so reorder commits the complete set the
  // RPC's set-equality guard requires). Untouched by this round.
  if (reorder?.reorderMode && reel) {
    return (
      <ReelSortableGrid
        items={config.membership}
        onReorder={(ids) => reel.reorder(ids)}
      />
    );
  }

  const created = stage?.created ?? reelConfig != null;

  if (!created) {
    return (
      <ReelBuilder
        eventId={eventId}
        eventName={eventName}
        approved={items.filter((m) => m.status === "approved")}
        config={config}
        onShare={() => publish.flip(true)}
        sharing={publish.pending}
      />
    );
  }

  return (
    <ReelMarquee
      eventId={eventId}
      eventName={eventName}
      shareUrl={shareUrl}
      config={config}
      publish={publish}
    />
  );
}
