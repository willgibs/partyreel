"use client";

import { Clapperboard } from "lucide-react";

import { useReel } from "@/components/reel/reel-provider";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { cn } from "@/lib/utils";

// The "Add to reel" affordance (host curation, distinct from Like) as it appears in the LIGHTBOX's host
// curate group. Reads useReel() and renders NOTHING when no ReelProvider wraps the surface, so it's
// opt-in + HOST-ONLY (guest galleries have no provider). Visually distinct from Like: a Clapperboard
// glyph that turns the --reel VIOLET when in-reel (vs the like rose).
//
// ★ There used to be a second "row" variant, the hover-revealed chip on every gallery tile. host-app.md
// removed it: a five-chip hover fan on a dense masonry grid is a misclick trap, and reel membership is
// not a per-card decision. The reel is curated in ONE of three places now (the lightbox, where you are
// already looking at the moment; gallery bulk-Select; and the Studio's Moments picker, the primary
// door). Do not re-add a tile variant here without re-opening that ruling.
export function ReelButton({ item }: { item: { id: string } }) {
  const reel = useReel();
  if (!reel) return null;
  const inReel = reel.inReel(item.id);

  // Bare icon (size-5): white at rest, violet on hover (preview) + when in-reel (persistent). The
  // lightbox is client-only (ssr:false) so ActionTooltip is hydration-safe.
  return (
    <ActionTooltip label={inReel ? "Remove from reel" : "Add to reel"}>
      <button
        type="button"
        aria-pressed={inReel}
        aria-label={inReel ? "Remove from reel" : "Add to reel"}
        onClick={() => reel.toggle(item.id)}
        className={cn(
          "text-white/80 transition-[color,transform] duration-150 ease-emphasis outline-none hover:text-reel focus-visible:text-reel active:scale-90 motion-reduce:active:scale-100",
          inReel && "text-reel hover:text-reel",
        )}
      >
        <Clapperboard className={cn("size-5", inReel && "fill-reel/25")} />
      </button>
    </ActionTooltip>
  );
}
