"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { MasonryColumns } from "@/components/shared/masonry";
import { EmptyState } from "@/components/shared/empty-state";
import type { RowStep } from "@/lib/shared/album-rows";

// The personal cross-event "Likes" gallery (Phase 5): a flat, newest-LIKED-first grid of every photo/video
// the viewer has liked, across all events, rendered in the shared MasonryColumns (view + per-item download in the
// lightbox). The one write this surface owns is UNLIKE: the heart (on a tile or in the lightbox) drops the
// item from this tab. The LikesProvider runs in mode="remove" and calls onRemoved AFTER the owner-RLS
// delete confirms, so we drop the tile then (a failed unlike re-fills the heart + toasts inside the
// provider, and the tile never phantom-removes). Counts are host-only, so none show here; every heart
// starts filled (the feed IS the viewer's likes).
//
// This component OWNS the empty state (not the dashboard tab) so that unliking the LAST item re-renders to
// "No likes yet" INSTANTLY -- unlike is a client-only RLS delete with no server revalidation, so the page's
// server-fetched count never updates; deciding empty here keeps it correct without a refetch.
export function MyLikesGallery({
  items,
  truncated,
  rowStep,
}: {
  items: GridMedia[];
  truncated: boolean;
  /** The justified rows' step (the shared `pr_tile_size` cookie, read by the page). */
  rowStep?: RowStep;
}) {
  // Confirmed-removed ids (post-unlike). Deriving the visible list from the prop + this set keeps it
  // correct even if `items` is re-provided. No useOptimistic here: unlike is a browser RLS delete with no
  // server revalidation, so the removal must STICK (useOptimistic would revert when its transition ends).
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const visible = items.filter((m) => !removed.has(m.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No likes yet"
        description="Tap the heart on any photo or video to save it here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LikesProvider
        mediaIds={visible.map((m) => m.id)}
        initialLikedIds={visible.map((m) => m.id)}
        mode="remove"
        onRemoved={(id) => setRemoved((prev) => new Set(prev).add(id))}
      >
        {/* No hover verbs (a personal feed is not an album to curate) and no
            like MARK: every tile here is liked by definition, so the mark would
            be wallpaper. The heart that unlikes is the lightbox's, at every
            width, which is exactly where `tiles` put it. */}
        <MasonryColumns
          items={visible}
          hideLikeMark
          layout="rows"
          rowStep={rowStep}
        />
      </LikesProvider>
      {truncated && (
        <p className="text-center text-xs text-muted-foreground">
          Showing your {visible.length} most recent likes.
        </p>
      )}
    </div>
  );
}
