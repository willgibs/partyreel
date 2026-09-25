"use client";

import { Heart } from "lucide-react";

import { useIsLiked, useLikes } from "@/components/likes/likes-provider";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import type { TileAction } from "@/components/shared/album-tile";
import { probeAlbumRender } from "@/components/shared/album-tile-probe";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * THE LIKE, IN THE THREE PLACES IT IS ALLOWED TO BE (the `glass` wiring,
 * 2026-09-20). Every one of them reads `useLikes()` and renders NOTHING without
 * a `LikesProvider`, so likes stay opt-in per gallery (the recovery bin and the
 * operator's grid are untouched).
 *
 * ★ A LIKED TILE IS A MARK, NOT A BUTTON (Will, `tiles`, 2026-09-20: "an active
 * like icon (not unliked to perform the action)"). `TileLikeMark` is that mark
 * and it is the ONLY like a phone sees on a tile; the toggle lives in the
 * lightbox at every width, and on the desk in the tile's hover row as one glyph
 * of the one pane (`useLikeAction`, fed to `MasonryColumns`'s `tileActions`).
 * The old `variant="tile"` / `variant="row"` chips are gone with `row=bar`: a
 * chip of its own is exactly the second blurred region that ruling retired.
 *
 * ★ EACH READS ITS OWN ID'S HEART (`useIsLiked`), never the whole liked set, so
 * a like re-renders the mark and the glyph of that one photograph and nothing
 * else in the album (`likes-provider.tsx`'s head note has the measurement).
 */

/** The like verb's words, by state: the bar's glyph and the viewer's button say the same. */
export function likeLabel(liked: boolean): string {
  return liked ? "Unlike" : "Like";
}

/**
 * ★ THE ROSE MARK CARRIES ITS OWN HAIRLINE, AND NO MATERIAL SAVES IT. Round two
 * measured the thing Will's first note named ("keeps an active icon a bit more
 * visible"): the `--like` rose reads 4.4:1 through Crystal over the brightest
 * photograph in the repo, under the 4.5:1 floor. A pane cannot fix a colour's
 * contrast, so the glyph wears a dark halo of its own (`glass-mark-lit`) and
 * keeps its meaning on any ground.
 */
export function TileLikeMark({
  item,
  count,
}: {
  item: { id: string };
  /** HOST-ONLY (fed server-side by get_event_like_counts; never a guest surface). */
  count?: number;
}) {
  const liked = useIsLiked(item.id);
  probeAlbumRender("mark", item.id);
  const showCount = typeof count === "number" && count > 0;
  // Nothing to say: a fresh album stays clean, which is the whole point of the
  // rule (an unliked tile has no like affordance at all).
  if (!liked && !showCount) return null;

  return (
    <span
      aria-hidden
      data-tile-mark="like"
      className={cn(
        "pointer-events-none absolute right-1.5 bottom-1.5 z-10 inline-flex h-5 items-center gap-1 rounded-full px-1.5",
        GLASS_MARK,
      )}
    >
      <Heart
        className={cn(
          "size-3",
          liked ? "fill-like text-like" : "fill-white text-white",
          GLASS_MARK_LIT,
        )}
      />
      {showCount && (
        <span
          className={cn(
            "text-micro font-medium text-white tabular-nums",
            GLASS_MARK_LIT,
          )}
        >
          {count}
        </span>
      )}
    </span>
  );
}

/**
 * The like as ONE GLYPH of the tile's hover pane (desk only; `MasonryColumns`
 * renders the pane and never lets one below `md`).
 *
 * ★ A FACTORY, NOT A PER-ITEM HOOK, and that is the rules of hooks rather than
 * a style. `tileActions(item)` runs once per tile inside the grid's render, so a
 * hook called in it would change its call count with the album's length. The
 * surface calls this ONCE and closes over the context. Returns a function giving
 * null without a `LikesProvider`, so a surface with no likes has one fewer verb.
 *
 * ★ `like: true` AND NO STATE OF ITS OWN. The action says what it is, and the
 * tile's glyph reads the heart live (`useIsLiked`), so the grid that declared
 * it never re-renders for a like and the action's content never changes with
 * one (which is what lets the memoized tile compare actions by content).
 */
export function useLikeAction(): (item: { id: string }) => TileAction | null {
  const likes = useLikes();
  return (item) => {
    if (!likes) return null;
    return {
      id: "like",
      label: likeLabel(false),
      icon: Heart,
      tone: "like",
      like: true,
      onSelect: () => likes.toggle(item.id),
    };
  };
}

/**
 * The viewer's like: a BARE icon matching the action pill's other glyphs
 * (size-5, no container), white at rest, rose on hover and when liked. The
 * lightbox is client-only (ssr:false) so this ActionTooltip is hydration-safe.
 */
export function LikeButton({ item }: { item: { id: string } }) {
  const likes = useLikes();
  const liked = useIsLiked(item.id);
  if (!likes) return null;

  return (
    <ActionTooltip label={likeLabel(liked)}>
      <button
        type="button"
        aria-pressed={liked}
        aria-label={likeLabel(liked)}
        onClick={() => likes.toggle(item.id)}
        className={cn(
          "text-white/80 transition-[color,transform] duration-150 ease-emphasis outline-none hover:text-like focus-visible:text-like active:scale-90 motion-reduce:active:scale-100",
          GLASS_MARK_LIT,
          liked && "text-like hover:text-like",
        )}
      >
        <Heart className={cn("size-5", liked && "fill-like/25")} />
      </button>
    </ActionTooltip>
  );
}

/**
 * HOST-ONLY like count inside the lightbox's action pill (a curation signal, fed
 * server-side via get_event_like_counts and never reaching a guest). BARE, like
 * every other glyph in that pane: the pill IS the surface, so a chip here would
 * be a second pane inside the first. Renders nothing at 0.
 */
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
        "pointer-events-none inline-flex items-center gap-1 text-caption font-medium text-white/80",
        GLASS_MARK_LIT,
        className,
      )}
    >
      <Heart className="size-4 fill-current" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
