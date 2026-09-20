import { Play } from "lucide-react";

import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

// The "this is a video" affordance: a centered play button overlaid on a video
// poster. Shared by the grid thumbnail (MediaTile) and the lightbox NEIGHBOR video
// so a video peeking in mid-swipe is immediately recognizable (the lightbox CENTER
// uses the native <video controls> play button instead). `pointer-events-none` so it
// never intercepts a tap or swipe; the nearest positioned ancestor must be the tile/
// slot. `overlayClassName` lets a padded slot (the lightbox) match the media's inset
// so the badge lands on the media's center, not the slot's.
export function PlayBadge({
  size = "md",
  overlayClassName,
}: {
  size?: "md" | "lg";
  overlayClassName?: string;
}) {
  const circle = size === "lg" ? "size-16" : "size-10";
  const icon = size === "lg" ? "size-7" : "size-5";
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        overlayClassName,
      )}
    >
      <span
        className={cn(
          // The one material at the mark's blur (the `glass` wiring, 2026-09-20):
          // this was a flat 50 percent of the gallery ink, which read as a grey
          // disc over a bright poster frame and as a hole over a dark one.
          "flex items-center justify-center rounded-full text-white",
          GLASS_MARK,
          circle,
        )}
      >
        <Play
          className={cn(icon, "translate-x-px fill-current", GLASS_MARK_LIT)}
        />
      </span>
    </span>
  );
}
