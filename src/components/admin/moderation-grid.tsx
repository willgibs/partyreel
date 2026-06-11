"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  removeMediaByOperatorAction,
  restoreMediaAction,
} from "@/app/admin/albums/actions";
import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { MediaTile } from "@/components/app/media-grid";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type ModerationGridItem } from "@/lib/moderation/operator-actions";

// The operator moderation grid (admin Albums browser). Reuses the shared MediaTile +
// MediaLightbox; the per-tile controls are SIBLINGS of the open-lightbox button (the
// HostMediaGrid pattern), so tapping a control never opens the lightbox. Active items get a
// Remove (behind a confirm Dialog — it's destructive-ish: pulled from public view now, hard
// -deleted after a 7-day grace); removed items get a Restore (safe + reversible, so no confirm).
// `mode="feed"` shows the album/host caption (linking to the drill-in); `mode="album"` omits it.

function ModerationTile({
  item,
  index,
  mode,
  onOpen,
}: {
  item: ModerationGridItem;
  index: number;
  mode: "feed" | "album";
  onOpen: (index: number) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<ActionResult>,
    successMsg: string,
    failTitle: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMsg);
        return;
      }
      toast.error(failTitle, { description: result.message });
    });
  }

  const isRemoved = item.status === "removed";

  return (
    <li className="relative aspect-square overflow-hidden rounded-lg bg-black/10">
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={item.type === "photo" ? "View photo" : "Play video"}
        className="size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
      >
        <MediaTile item={item} />
      </button>

      <Badge
        variant="secondary"
        className="absolute top-1.5 left-1.5 z-10 capitalize"
      >
        {item.status}
      </Badge>

      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/70 to-transparent p-1.5">
        {isRemoved ? (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            disabled={isPending}
            aria-label="Restore"
            title="Restore"
            onClick={() =>
              run(
                () => restoreMediaAction(item.id),
                "Restored. It is approved and back in the album.",
                "Couldn't restore that item.",
              )
            }
          >
            <Undo2 />
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                disabled={isPending}
                aria-label="Remove"
                title="Remove"
              >
                <Trash2 />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove this item?</DialogTitle>
                <DialogDescription>
                  It disappears from the guest album right away. It is
                  permanently deleted after a 7-day grace period, and you can
                  restore it until then.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => removeMediaByOperatorAction(item.id),
                        "Removed. It is pulled from the album.",
                        "Couldn't remove that item.",
                      )
                    }
                  >
                    Remove
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {mode === "feed" && (
        <Link
          href={`/admin/albums/${item.eventId}`}
          className="absolute inset-x-0 bottom-0 z-10 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-left text-xs text-white/90 hover:text-white"
          title={`${item.eventName}${item.hostLabel ? ` · ${item.hostLabel}` : ""}`}
        >
          <span className="font-medium">{item.eventName}</span>
          {item.hostLabel ? (
            <span className="text-white/70"> · {item.hostLabel}</span>
          ) : null}
        </Link>
      )}
    </li>
  );
}

export function ModerationGrid({
  items,
  mode,
}: {
  items: ModerationGridItem[];
  mode: "feed" | "album";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {items.map((item, i) => (
          <ModerationTile
            key={item.id}
            item={item}
            index={i}
            mode={mode}
            onOpen={setOpenIndex}
          />
        ))}
      </ul>

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
