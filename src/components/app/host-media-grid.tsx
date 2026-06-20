"use client";

import { useTransition } from "react";
import { Check, Download, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  approveAllPendingAction,
  removeMediaAction,
  setMediaStatusAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";
import { LikeButton, LikeCountBadge } from "@/components/likes/like-button";
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
import { cn } from "@/lib/utils";

// Host moderation grid — the only place media controls live. The grid is the shared
// MasonryColumns (natural ratios, clamped for moderation ergonomics); the per-tile
// controls ride in via `renderOverlay` as a HOVER-REVEALED action row (matching the
// guest like-button elegance), painted over the open-lightbox button as SIBLINGS, so
// tapping a control never opens the lightbox. Per-action COLOR on direct hover (the
// emil "monochrome at rest, color on hover/state" rule): approve=green, hide=amber,
// remove=red, save/download=blue, like=rose-when-liked.
//   Desktop: the full suite (moderation + download + like) reveals on hover.
//   Mobile (no hover): only Download + Like are visible top-right; Hide/Remove move to
//   the lightbox (deletes are rare; an active tile is approved or moderation-off, so a
//   direct hide is uncommon too).
// HIDDEN media renders at 30% opacity (via MasonryColumns `dimItem`) — a clear
// active-vs-hidden mark while both stay in the gallery. All writes go through the Server
// Actions (which revalidate this path); we only toast on failure.

// One action-icon: a circular dark chip, white at rest, COLOR on direct hover.
const ACTION_BASE =
  "flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm outline-none transition-[color,transform] duration-150 ease-emphasis active:scale-90 motion-reduce:active:scale-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white/70";

function HostTileOverlay({
  eventId,
  item,
}: {
  eventId: string;
  item: GridMedia;
}) {
  const [isPending, startTransition] = useTransition();
  // Defensive default — listEventMedia never returns 'removed', and 'approved'
  // is the live state.
  const status = item.status ?? "approved";

  function run(action: () => Promise<ActionResult>, failTitle: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) return;
      toast.error(failTitle, { description: result.message });
    });
  }

  return (
    <>
      {/* HOST-ONLY like COUNT (a read-only curation signal, distinct from the host's own
          like toggle in the row): bottom-RIGHT, clear of the top action row, the
          bottom-left corner play badge, and the dim. Hidden at 0. */}
      <LikeCountBadge
        count={item.likeCount}
        className="absolute right-1.5 bottom-1.5 z-10"
      />

      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
        {/* Moderation: desktop hover-reveal. MOBILE stays visible for now (no hover) so
            mobile hosts keep tile moderation; it moves to the lightbox in 3c.2 (then this
            becomes `hidden md:flex` per the spec — Like+Save only on mobile tiles). */}
        <div className="flex items-center gap-1 opacity-100 transition-opacity duration-150 ease-emphasis md:opacity-0 md:group-hover:opacity-100">
          {status === "pending" && (
            <button
              type="button"
              disabled={isPending}
              aria-label="Approve"
              title="Approve"
              className={cn(ACTION_BASE, "hover:text-success")}
              onClick={() =>
                run(
                  () => setMediaStatusAction(eventId, item.id, "approved"),
                  "Couldn't approve that item.",
                )
              }
            >
              <Check className="size-4" />
            </button>
          )}
          {(status === "pending" || status === "approved") && (
            <button
              type="button"
              disabled={isPending}
              aria-label="Hide"
              title="Hide"
              className={cn(ACTION_BASE, "hover:text-warning")}
              onClick={() =>
                run(
                  () => setMediaStatusAction(eventId, item.id, "hidden"),
                  "Couldn't hide that item.",
                )
              }
            >
              <EyeOff className="size-4" />
            </button>
          )}
          {status === "hidden" && (
            <button
              type="button"
              disabled={isPending}
              aria-label="Unhide"
              title="Unhide"
              className={cn(ACTION_BASE, "hover:text-warning")}
              onClick={() =>
                run(
                  () => setMediaStatusAction(eventId, item.id, "approved"),
                  "Couldn't unhide that item.",
                )
              }
            >
              <Eye className="size-4" />
            </button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                aria-label="Remove"
                title="Remove"
                className={cn(ACTION_BASE, "hover:text-destructive")}
              >
                <Trash2 className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove this item?</DialogTitle>
                <DialogDescription>
                  It disappears from the album right away and is permanently
                  deleted after a short grace period. Guests won&rsquo;t see it.
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
                        () => removeMediaAction(eventId, item.id),
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
        </div>

        {/* Download (save the original): mobile-visible, desktop hover-reveal; blue on hover. */}
        {item.downloadUrl && (
          <a
            href={item.downloadUrl}
            download
            aria-label="Save"
            title="Save"
            className={cn(
              ACTION_BASE,
              "opacity-100 hover:text-save focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
            )}
          >
            <Download className="size-4" />
          </a>
        )}

        {/* Like: FAR-RIGHT, persists when liked (a host like = a normal like). No-op
            without a LikesProvider (e.g. the pending-review grid). */}
        <LikeButton item={item} variant="row" />
      </div>
    </>
  );
}

export function HostMediaGrid({
  eventId,
  items,
}: {
  eventId: string;
  items: GridMedia[];
}) {
  // clampAspect: moderation ergonomics. dimItem: hidden media -> 30% (active-vs-hidden).
  return (
    <MasonryColumns
      items={items}
      viewerIsHost
      clampAspect
      dimItem={(item) => item.status === "hidden"}
      renderOverlay={(item) => (
        <HostTileOverlay eventId={eventId} item={item} />
      )}
    />
  );
}

export function ApproveAllPendingButton({
  eventId,
  count,
}: {
  eventId: string;
  count: number;
}) {
  const [isPending, startTransition] = useTransition();

  function onApproveAll() {
    startTransition(async () => {
      const result = await approveAllPendingAction(eventId);
      if (result.ok) {
        toast.success(
          count === 1 ? "Approved 1 item." : `Approved ${count} items.`,
        );
        return;
      }
      toast.error("Couldn't approve the pending items.", {
        description: result.message,
      });
    });
  }

  return (
    <Button type="button" size="sm" disabled={isPending} onClick={onApproveAll}>
      <Check /> Approve all
    </Button>
  );
}
