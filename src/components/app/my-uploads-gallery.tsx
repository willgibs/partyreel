"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { removeMyUploadAction } from "@/app/(app)/dashboard/actions";
import { MediaGrid, type GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";

// The personal cross-event "Uploads" gallery (Phase 4): a flat, newest-first grid of the viewer's OWN
// uploads (host + guest), reusing the public MediaGrid. View + per-item download in the lightbox, plus the
// ONE write this surface owns: delete-your-own (the lightbox Trash button -> remove_my_upload). NO host
// moderation (this is a personal feed, not an event album). The lightbox shows each item's event context.
// A truncation footer keeps the v1 cap honest; the empty state lives in the dashboard tab.
export function MyUploadsGallery({
  items,
  truncated,
}: {
  items: GridMedia[];
  truncated: boolean;
}) {
  const [, startTransition] = useTransition();
  // Optimistic removal: the deleted item drops from the grid instantly. The action's
  // revalidatePath("/dashboard") reconciles to server truth on success; on failure the item REAPPEARS
  // (the prop still holds it once the transition ends) and we toast -- no manual revert needed.
  const [optimisticItems, removeOptimistic] = useOptimistic(
    items,
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
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Likes toggle in place here (mode "keep"); delete-your-own is the separate Trash action. */}
      <LikesProvider mediaIds={optimisticItems.map((m) => m.id)}>
        <MediaGrid items={optimisticItems} onDeleteItem={handleDelete} />
      </LikesProvider>
      {truncated && (
        <p className="text-center text-xs text-muted-foreground">
          Showing your {optimisticItems.length} most recent uploads.
        </p>
      )}
    </div>
  );
}
