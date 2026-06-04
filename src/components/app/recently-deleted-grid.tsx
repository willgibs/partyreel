"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  purgeMediaNowAction,
  restoreMediaAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { MediaLightbox } from "@/components/shared/media-lightbox";
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
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";

// The host "Recently deleted" MEDIA grid (event-detail). Models the admin ModerationGrid: the
// per-tile controls are SIBLINGS of the open-lightbox button (no nested interactive content), so
// tapping a control never opens the lightbox. The bin's only verbs are Restore (capacity-gated in
// the RPC -> safe + reversible, no confirm) and Delete permanently (irreversible -> skips the
// 30-day window, so it's behind a confirm Dialog). Items carry NO downloadUrl, so the lightbox
// hides Save (no original-file download from the bin). Writes go through the Phase-3 server
// actions, which revalidate this path; we toast on every outcome.

/** A bin item = a GridMedia plus its server-computed countdown (a stable integer dodges the
 * locale-date hydration mismatch). It's assignable to GridMedia, so the lightbox accepts it. */
export type BinMedia = GridMedia & { countdownDays: number };

function BinTile({
  eventId,
  item,
  index,
  onOpen,
}: {
  eventId: string;
  item: BinMedia;
  index: number;
  onOpen: (index: number) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onRestore() {
    startTransition(async () => {
      const result = await restoreMediaAction(eventId, item.id);
      if (result.ok) {
        toast.success("Restored. It's back in the album.");
        return;
      }
      // insufficient_space is the expected at-cap refusal -> offer the upgrade path.
      if (
        result.code === "insufficient_space" ||
        result.code === "event_limit"
      ) {
        toast.error(result.message, {
          action: { label: "Upgrade", onClick: () => router.push("/pricing") },
        });
        return;
      }
      toast.error("Couldn't restore that item.", {
        description: result.message,
      });
    });
  }

  function onPurge() {
    startTransition(async () => {
      const result = await purgeMediaNowAction(eventId, [item.id]);
      if (result.ok) {
        toast.success("Permanently deleted.");
        return;
      }
      toast.error("Couldn't delete that item.", {
        description: result.message,
      });
    });
  }

  return (
    <li
      data-media-tile
      className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={item.type === "photo" ? "View photo" : "Play video"}
        className="size-full cursor-pointer transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]"
      >
        <MediaTile item={item} />
      </button>

      <Badge variant="secondary" className="absolute top-1.5 left-1.5 z-10">
        {binCountdownLabel(item.countdownDays)}
      </Badge>

      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/70 to-transparent p-1.5">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          disabled={isPending}
          aria-label="Restore"
          title="Restore"
          onClick={onRestore}
        >
          <Undo2 />
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              disabled={isPending}
              aria-label="Delete permanently"
              title="Delete permanently"
            >
              <Trash2 />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete permanently?</DialogTitle>
              <DialogDescription>
                This skips the 30-day recovery window and deletes the file for
                good. It can&rsquo;t be undone.
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
                  onClick={onPurge}
                >
                  Delete permanently
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
}

export function RecentlyDeletedGrid({
  eventId,
  items,
}: {
  eventId: string;
  items: BinMedia[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, i) => (
          <BinTile
            key={item.id}
            eventId={eventId}
            item={item}
            index={i}
            onOpen={setOpenIndex}
          />
        ))}
      </ul>

      <MediaLightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
