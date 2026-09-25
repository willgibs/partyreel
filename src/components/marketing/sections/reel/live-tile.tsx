"use client";

import { Clapperboard } from "lucide-react";

import { LivingStills, useLivingClock } from "@/components/app/living-stills";
import { PosterCard } from "@/components/reel/poster-card";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * THE HIGHLIGHT REEL TILE, AS THE ALBUM WEARS IT: the app's own PosterCard
 * (the guest tile's frame, gradient and violet line, reel/live-reel.tsx) over
 * the app's own calm dissolve (LivingStills, the host card's living face), so
 * the motion a visitor meets on /reel is the motion they meet again on their
 * own album (bible 8: one system). The corner is the tile's glyph
 * (`reel-front` `badge=glyph`: a 24px glass-mark disc holding a 12px
 * clapperboard) and the words are the tile's verbatim; nothing here is a
 * recorded video, because the tile never is one.
 *
 * The clock runs only on screen, in a visible tab and never under reduced
 * motion (useLivingClock), where the first still holds with its gradient: the
 * tile complete at rest.
 */
const STILLS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-toast",
].map((id) => marketingImage(id).src);

export function LiveTile() {
  const { ref, at } = useLivingClock<HTMLDivElement>(STILLS.length);
  return (
    <div ref={ref}>
      <PosterCard
        eventName="Highlight reel"
        meta="Make your own clip to share"
        chip={
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-white",
              GLASS_MARK,
            )}
          >
            <Clapperboard className={cn("size-3", GLASS_MARK_LIT)} />
          </span>
        }
        media={
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
            <LivingStills stills={STILLS} at={at} />
          </div>
        }
      />
    </div>
  );
}
