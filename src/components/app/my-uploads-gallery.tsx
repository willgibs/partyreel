"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { removeMyUploadAction } from "@/app/(app)/dashboard/actions";
import { type GridMedia } from "@/components/app/media-grid";
import {
  FeedMore,
  useFeedPages,
  type ReadFeedPage,
} from "@/components/app/my-feed-more";
import { LikesProvider } from "@/components/likes/likes-provider";
import { MasonryColumns } from "@/components/shared/masonry";
import type { FeedCursor } from "@/lib/db/queries/my-uploads";
import type { RowStep } from "@/lib/shared/album-rows";

// The personal cross-event "Uploads" gallery (Phase 4): a flat, newest-first grid of the viewer's OWN
// uploads (host + guest), rendered in the shared MasonryColumns. View + per-item download in the lightbox, plus the
// ONE write this surface owns: delete-your-own (the lightbox Trash button -> remove_my_upload). NO host
// moderation (this is a personal feed, not an event album). The lightbox shows each item's event context.
// Past its first 200, a Show more adds the next page (`my-feed-more.tsx`); the empty state lives in the owner mode.
//
// ★ ONE TRASH, TWO OUTCOMES, AND THE CONFIRM NAMES THE RIGHT ONE: an upload to somebody else's event is
// final (the guest arm marks it `removed_by_uploader`: never in that host's Deleted, never restorable), while
// an upload to an event the viewer hosts lands in its Deleted (the host arm). The owner mode marks the host
// arm's items `isHost` (owner-sections.tsx) and the lightbox reads it, so nothing here decides the words.
export function MyUploadsGallery({
  items,
  next = null,
  readMore,
  rowStep,
}: {
  /** Her newest page, read by the page. */
  items: GridMedia[];
  /** The cursor of the page after it, null when it is all of them. */
  next?: FeedCursor | null;
  /** How a Show more asks for the next page (the owner mode's Server Function). */
  readMore?: ReadFeedPage;
  /** The justified rows' step (the shared `pr_tile_size` cookie, read by the page). */
  rowStep?: RowStep;
}) {
  const [, startTransition] = useTransition();
  const feed = useFeedPages(items, next, readMore);
  // Optimistic removal: the deleted item drops from the grid instantly. On success the action's
  // revalidation brings back a first page without it, and a page she loaded drops it here (`drop`); on
  // failure the item REAPPEARS (the list still holds it once the transition ends) and we toast -- no
  // manual revert needed.
  const [optimisticItems, removeOptimistic] = useOptimistic(
    feed.items,
    (current, idToRemove: string) => current.filter((m) => m.id !== idToRemove),
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      const result = await removeMyUploadAction(id);
      if (!result.ok) {
        toast.error("Couldn't remove that upload.", {
          description: result.message,
        });
        return;
      }
      feed.drop(id);
    });
  }

  return (
    <div className="space-y-4">
      {/* Likes toggle in place here (mode "keep"), except on an upload to an album that reads
          private to her: `getMyUploadCards` marks it `likeable: false` and it offers no heart,
          since `like_media` would refuse it. Delete-your-own is the separate Trash action. */}
      <LikesProvider mediaIds={optimisticItems.map((m) => m.id)}>
        <MasonryColumns
          items={optimisticItems}
          onDeleteItem={handleDelete}
          layout="rows"
          rowStep={rowStep}
        />
      </LikesProvider>
      <FeedMore feed={feed} label="Show more of your uploads" />
    </div>
  );
}
