"use client";

import { Heart } from "lucide-react";

import { useLikes } from "@/components/likes/likes-provider";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { cn } from "@/lib/utils";

// The like affordance. Reads useLikes() and renders NOTHING when no LikesProvider wraps the surface, so
// it's opt-in per gallery (the recovery bin / host moderation grid stay untouched). Two variants:
//   * "tile"     — a subtle overlay in the gallery-tile corner, DESKTOP-ONLY (hover-reveal; stays visible
//                  once liked). Mobile likes happen in the viewer. stopPropagation so it never opens the
//                  lightbox.
//   * "lightbox" — a ghost icon button for the viewer control row, on every viewport.
// No count is shown here: counts are host-only (LikeCountBadge, fed server-side), never on these surfaces.
export function LikeButton({
  item,
  variant,
}: {
  item: { id: string };
  variant: "tile" | "lightbox" | "row";
}) {
  const likes = useLikes();
  if (!likes) return null;
  const liked = likes.isLiked(item.id);

  if (variant === "tile") {
    return (
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        onClick={(e) => {
          e.stopPropagation();
          likes.toggle(item.id);
        }}
        className={cn(
          "absolute top-1.5 right-1.5 z-10 hidden size-7 cursor-pointer items-center justify-center rounded-full",
          "bg-black/35 text-white backdrop-blur-sm md:flex",
          "transition-[color,opacity,transform] duration-150 ease-emphasis hover:text-like",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          "active:scale-90 motion-reduce:active:scale-100",
          // A liked tile keeps its filled rose heart visible even without hover (at-a-glance
          // feedback) — the --like state color, universal across guest + host (Will, 2026-06-20).
          liked && "text-like opacity-100",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
      </button>
    );
  }

  // "row": flow-positioned (the parent action row places it FAR-RIGHT, host + guest);
  // VISIBLE on mobile (no hover there), hover-revealed on desktop, and persists once
  // liked so the rose heart stays at-a-glance even off-hover (the icon never shifts as
  // the rest of the row collapses). Rose = the --like state color on the liked heart.
  if (variant === "row") {
    return (
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        title={liked ? "Unlike" : "Like"}
        onClick={(e) => {
          e.stopPropagation();
          likes.toggle(item.id);
        }}
        className={cn(
          "flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm",
          "outline-none transition-[color,opacity,transform] duration-150 ease-emphasis hover:text-like",
          "opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
          "active:scale-90 motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/70",
          // Liked: rose, filled, and pinned visible (desktop too).
          liked && "text-like opacity-100 md:opacity-100",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
      </button>
    );
  }

  // "lightbox": the viewer control row, on every viewport. A BARE icon matching the
  // pill's other actions (size-5, no Button container): white at rest, rose on hover
  // (preview) + when liked (filled, persistent at rest AND hover). The lightbox is
  // client-only (ssr:false) so this ActionTooltip is hydration-safe.
  return (
    <ActionTooltip label={liked ? "Unlike" : "Like"}>
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        onClick={() => likes.toggle(item.id)}
        className={cn(
          "text-white/80 outline-none transition-[color,transform] duration-150 ease-emphasis hover:text-like focus-visible:text-like active:scale-90 motion-reduce:active:scale-100",
          liked && "text-like hover:text-like",
        )}
      >
        <Heart className={cn("size-5", liked && "fill-current")} />
      </button>
    </ActionTooltip>
  );
}

// HOST-ONLY like count (curation signal). Pure presentational — fed server-side via get_event_like_counts
// (never reaches a guest). Renders nothing at 0 (a fresh album stays clean). Positioned by the caller.
export function LikeCountBadge({
  count,
  className,
}: {
  count: number | undefined;
  className?: string;
}) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm",
        className,
      )}
    >
      <Heart className="size-3 fill-current" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
