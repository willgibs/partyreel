"use client";

/**
 * THE MARQUEE: the Reel section once a reel exists (host-app.md ruling 4, amended by
 * host-app.md).
 *
 * R3 gave the reel a FACE in the feed. R3.1 took away everything else. Will's
 * alias review of the shipped build ruled that a feed section is a VISUAL surface
 * and had been over-controlled: the style rail, layout, cover, length, the moments
 * grid and the download row all read as a settings page wedged into a scroll of
 * media. So the marquee now carries exactly four things, and nothing else may be
 * added here:
 *
 *   1. the status chip + the door to the Studio,
 *   2. the poster (a live paused player, the reel's face),
 *   3. the share card,
 *   4. nothing.
 *
 * Every control GRADUATED to the Studio (`/dashboard/[eventId]/reel`), which is the
 * exclusive room for working on the reel. Adding one back here re-opens the exact
 * composition Will ruled against. The pre-Create builder is untouched: quick-add,
 * Create and the reveal stay feed moments, because birth is a feed event.
 *
 * A performance consequence worth keeping: the feed now mounts ZERO thumbnail
 * canvases. The poster is this section's only player, and it is IO-gated.
 */

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  formatReelDuration,
  formatReelMeta,
  PosterCard,
} from "@/components/reel/poster-card";
import {
  type ReelPublishController,
  ReelShareCard,
  ReelStatusChip,
} from "@/components/reel/reel-share-card";
import { type ReelConfigController } from "@/components/reel/use-reel-config";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";

export function ReelMarquee({
  eventId,
  eventName,
  config,
  publish,
}: {
  eventId: string;
  eventName: string;
  config: ReelConfigController;
  publish: ReelPublishController;
}) {
  const { styleEntry, effectiveSeconds, timeline, reelProps } = config;

  const meta = formatReelMeta({
    durationLabel: formatReelDuration(effectiveSeconds),
    styleLabel: styleEntry.label,
    momentCount: timeline.length,
  });

  return (
    <div className="space-y-3">
      {/* The section's own status row. The chip lives HERE and not in the feed's
          section header, which is ratified as a locked-height label row. The
          Studio door sits beside it because the floating action bar (the ruled
          entry point) only appears once the page is scrolled: a section with no
          visible door at the top of the page would be a dead end. Since R3.1 the
          door is also the ONLY way to reach any control, so it is load-bearing
          rather than a shortcut. */}
      <div className="flex min-h-7 items-center justify-between gap-2">
        <ReelStatusChip shared={publish.shared} />
        <Link
          href={`/dashboard/${eventId}/reel`}
          className="flex items-center gap-1 rounded text-[11px] font-medium text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open studio
          <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>

      {/* The poster: the reel's face. The SAME component the guest card uses, so
          what the host made and what the guest meets read as one thing. */}
      <PosterCard
        eventName={eventName}
        meta={meta}
        media={<CanvasReelPlayer reelProps={reelProps} showControls={false} />}
      />

      <ReelShareCard publish={publish} />
    </div>
  );
}
