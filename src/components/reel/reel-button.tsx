"use client";

import { Clapperboard } from "lucide-react";

import { useReel } from "@/components/reel/reel-provider";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { cn } from "@/lib/utils";

// The "Add to reel" affordance (host curation, distinct from Like). Reads useReel() and renders NOTHING
// when no ReelProvider wraps the surface, so it's opt-in + HOST-ONLY (guest galleries have no provider).
// Visually distinct from Like: a Clapperboard glyph that turns the --reel VIOLET when in-reel (vs the
// like rose). Two variants mirror LikeButton:
//   * "row"      — the host tile overlay action row (mobile-visible, desktop hover-reveal; persists when
//                  in-reel so the violet clapperboard stays at-a-glance).
//   * "lightbox" — a bare icon for the viewer's host curate group, on every viewport.
export function ReelButton({
  item,
  variant,
}: {
  item: { id: string };
  variant: "row" | "lightbox";
}) {
  const reel = useReel();
  if (!reel) return null;
  const inReel = reel.inReel(item.id);

  if (variant === "row") {
    return (
      <button
        type="button"
        aria-pressed={inReel}
        aria-label={inReel ? "Remove from reel" : "Add to reel"}
        title={inReel ? "Remove from reel" : "Add to reel"}
        // Not in-reel = a hover-reveal chip that collapses at rest (data-reveal-chip); in-reel = a
        // persistent chip (no collapse) that the rest pack neatly around.
        data-reveal-chip={inReel ? undefined : ""}
        onClick={(e) => {
          e.stopPropagation();
          reel.toggle(item.id);
        }}
        className={cn(
          "ml-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm",
          "outline-none transition-[color,opacity,transform] duration-150 ease-emphasis hover:text-reel",
          "opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
          "active:scale-90 motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/70",
          // In-reel: violet + pinned visible (desktop too) so it reads at-a-glance.
          inReel && "text-reel opacity-100 md:opacity-100",
        )}
      >
        <Clapperboard className={cn("size-4", inReel && "fill-reel/25")} />
      </button>
    );
  }

  // "lightbox": the viewer control row. Bare icon (size-5): white at rest, violet on hover (preview) +
  // when in-reel (persistent). The lightbox is client-only (ssr:false) so ActionTooltip is hydration-safe.
  return (
    <ActionTooltip label={inReel ? "Remove from reel" : "Add to reel"}>
      <button
        type="button"
        aria-pressed={inReel}
        aria-label={inReel ? "Remove from reel" : "Add to reel"}
        onClick={() => reel.toggle(item.id)}
        className={cn(
          "text-white/80 outline-none transition-[color,transform] duration-150 ease-emphasis hover:text-reel focus-visible:text-reel active:scale-90 motion-reduce:active:scale-100",
          inReel && "text-reel hover:text-reel",
        )}
      >
        <Clapperboard className={cn("size-5", inReel && "fill-reel/25")} />
      </button>
    </ActionTooltip>
  );
}
