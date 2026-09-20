"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useTransition } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  purgeMediaNowAction,
  restoreMediaAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";
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
import { GLASS, GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

// The host "Recently deleted" MEDIA grid (event-detail). Reuses the shared
// MasonryColumns (natural ratios, clamped for control legibility); the per-tile
// controls ride in via `renderOverlay` as SIBLINGS of the open-lightbox button,
// so tapping a control never opens the lightbox. The bin's only verbs are Restore
// (capacity-gated in the RPC -> safe + reversible, no confirm) and Delete
// permanently (irreversible -> skips the 30-day window, so it's behind a confirm
// Dialog). Items carry NO downloadUrl, so the lightbox hides Save (no
// original-file download from the bin), and the viewer is read-only (NOT the host
// moderation viewer). Writes go through the Phase-3 server actions, which
// revalidate this path; we toast on every outcome.

/** A bin item = a GridMedia plus its server-computed countdown (a stable integer dodges the
 * locale-date hydration mismatch). It's assignable to GridMedia, so the lightbox accepts it. */
export type BinMedia = GridMedia & { countdownDays: number };

function BinTileOverlay({
  eventId,
  item,
}: {
  eventId: string;
  item: BinMedia;
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
    <>
      {/* The countdown is a MARK, so it stays at every width: it is the only
          thing that makes this grid different from the album. */}
      <span
        className={cn(
          "pointer-events-none absolute top-1.5 left-1.5 z-10 inline-flex h-5 items-center rounded-full px-2 text-micro font-medium text-white",
          GLASS_MARK,
        )}
      >
        {binCountdownLabel(item.countdownDays)}
      </span>

      {/* The bin's two verbs, in the one pane the grid draws. Restore is
          capacity-gated in the RPC (safe + reversible, no confirm); Delete
          permanently skips the 30-day window, so it stays behind a confirm.
          The Dialog lives HERE rather than in the row because the row is a
          declared action set and a trigger is a component. */}
      <div className="absolute top-1.5 right-1.5 z-10 hidden md:block">
        <Dialog>
          <div
            data-reveal-chip
            style={{ "--reveal-max": "4rem" } as CSSProperties}
            className={cn(
              "flex items-center gap-0.5 rounded-full p-0.5",
              GLASS,
            )}
          >
            <button
              type="button"
              disabled={isPending}
              aria-label="Restore"
              title="Restore"
              onClick={onRestore}
              className={BIN_ACTION}
            >
              <Undo2 className="size-4" />
            </button>
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                aria-label="Delete permanently"
                title="Delete permanently"
                className={cn(BIN_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-4" />
              </button>
            </DialogTrigger>
          </div>
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
    </>
  );
}

/** One glyph of the bin's pane: no surface of its own (`row=bar`). */
const BIN_ACTION =
  "flex size-6 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-[color,transform] duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50";

export function RecentlyDeletedGrid({
  eventId,
  items,
}: {
  eventId: string;
  items: BinMedia[];
}) {
  // clampAspect keeps the countdown + restore/purge controls legible on extreme
  // ratios (same moderation-ergonomics reason as the main host grid).
  return (
    <MasonryColumns
      items={items}
      clampAspect
      renderOverlay={(item) => <BinTileOverlay eventId={eventId} item={item} />}
    />
  );
}
