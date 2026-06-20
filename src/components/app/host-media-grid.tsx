"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Download, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  approveAllPendingAction,
  removeMediaAction,
  setMediaStatusAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";
import { LikeButton, LikeCountBadge } from "@/components/likes/like-button";
import { ActionTooltip } from "@/components/shared/action-tooltip";
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
// emil "monochrome at rest, color on hover/state" rule) + styled hover tooltips:
// approve=green, hide=amber, remove=red, save/download=blue, like=rose-when-liked.
//   Desktop: the full suite (moderation + download + like) reveals on hover.
//   Mobile (no hover): only Download + Like are visible top-right; Hide/Remove move to
//   the lightbox. A HIDDEN item is the exception — its amber "Show" marker persists
//   (mobile + off-hover), like the liked heart, so hidden is unmistakable + 1-tap to show.
// HIDDEN media also renders at 30% opacity (via MasonryColumns `dimItem`) — a second
// active-vs-hidden signal. Moderation is OPTIMISTIC (instant UI; the action runs in the
// background and reverts + toasts on failure), so there is no revalidation lag.

// One action-icon: a circular dark chip, white at rest, COLOR on direct hover/state.
const ACTION_BASE =
  "flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm outline-none transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90 motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/70";

// The optimistic overlay over the server-rendered items: a status flip or a removal,
// applied instantly so the tile + the lightbox reflect the change with no round-trip;
// useOptimistic resyncs to the server items when the action's revalidation lands (and
// reverts on failure).
type OptimisticChange =
  | { type: "status"; id: string; status: "approved" | "hidden" }
  | { type: "remove"; id: string };

function applyChange(items: GridMedia[], change: OptimisticChange): GridMedia[] {
  if (change.type === "remove") return items.filter((it) => it.id !== change.id);
  return items.map((it) =>
    it.id === change.id ? { ...it, status: change.status } : it,
  );
}

type Moderation = {
  setStatus: (item: GridMedia, status: "approved" | "hidden") => void;
  remove: (item: GridMedia) => void;
};

// The ONE home for the host moderation actions + their copy/toasts (3c.2), shared by the
// tile overlay AND the lightbox curate group (both read the same optimistic items). Each
// handler applies the optimistic change FIRST (instant feedback), then runs the server
// action; `setStatus` derives the intent from the transition for the right error copy +
// the "Hidden from everyone" success toast (Will: fires from BOTH the tile and the
// lightbox). On failure the optimistic state reverts (useOptimistic) and we toast.
function useModeration(
  eventId: string,
  applyOptimistic: (change: OptimisticChange) => void,
): Moderation {
  const [, startTransition] = useTransition();

  const setStatus = (item: GridMedia, status: "approved" | "hidden") => {
    const intent =
      status === "hidden"
        ? "hide"
        : item.status === "hidden"
          ? "unhide"
          : "approve";
    const failTitle =
      intent === "hide"
        ? "Couldn't hide that item."
        : intent === "unhide"
          ? "Couldn't unhide that item."
          : "Couldn't approve that item.";
    startTransition(async () => {
      applyOptimistic({ type: "status", id: item.id, status });
      const result = await setMediaStatusAction(eventId, item.id, status);
      if (!result.ok) {
        toast.error(failTitle, { description: result.message });
        return;
      }
      if (intent === "hide") toast.success("Hidden from everyone");
    });
  };

  const remove = (item: GridMedia) => {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: item.id });
      const result = await removeMediaAction(eventId, item.id);
      if (!result.ok) {
        toast.error("Couldn't remove that item.", {
          description: result.message,
        });
      }
    });
  };

  return { setStatus, remove };
}

function HostTileOverlay({
  item,
  setStatus,
  remove,
}: {
  item: GridMedia;
  setStatus: Moderation["setStatus"];
  remove: Moderation["remove"];
}) {
  // Defensive default — listEventMedia never returns 'removed', and 'approved'
  // is the live state.
  const status = item.status ?? "approved";

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
        {/* Moderation: DESKTOP-only hover-reveal (3c.2). On mobile (no hover) it's gone
            — hide/remove move to the lightbox; the mobile tile keeps Like + Save only. */}
        <div className="hidden items-center gap-1 transition-opacity duration-150 ease-emphasis md:flex md:opacity-0 md:group-hover:opacity-100">
          {status === "pending" && (
            <ActionTooltip label="Approve">
              <button
                type="button"
                aria-label="Approve"
                className={cn(ACTION_BASE, "hover:text-success")}
                onClick={() => setStatus(item, "approved")}
              >
                <Check className="size-4" />
              </button>
            </ActionTooltip>
          )}
          {(status === "pending" || status === "approved") && (
            <ActionTooltip label="Hide">
              <button
                type="button"
                aria-label="Hide"
                className={cn(ACTION_BASE, "hover:text-warning")}
                onClick={() => setStatus(item, "hidden")}
              >
                <EyeOff className="size-4" />
              </button>
            </ActionTooltip>
          )}

          <Dialog>
            <ActionTooltip label="Remove">
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Remove"
                  className={cn(ACTION_BASE, "hover:text-destructive")}
                >
                  <Trash2 className="size-4" />
                </button>
              </DialogTrigger>
            </ActionTooltip>
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
                  <Button variant="destructive" onClick={() => remove(item)}>
                    Remove
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* HIDDEN marker: a PERSISTENT amber Show (mobile + off-hover, like the liked
            heart) — the unmistakable "this is hidden from guests" state + a 1-tap show.
            Replaces the hover-reveal Unhide on hidden tiles. */}
        {status === "hidden" && (
          <ActionTooltip label="Show">
            <button
              type="button"
              aria-label="Show"
              className={cn(ACTION_BASE, "text-warning")}
              onClick={() => setStatus(item, "approved")}
            >
              <Eye className="size-4" />
            </button>
          </ActionTooltip>
        )}

        {/* Download (save the original): mobile-visible, desktop hover-reveal; blue on hover. */}
        {item.downloadUrl && (
          <ActionTooltip label="Save">
            <a
              href={item.downloadUrl}
              download
              aria-label="Save"
              className={cn(
                ACTION_BASE,
                "opacity-100 hover:text-save focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
              )}
            >
              <Download className="size-4" />
            </a>
          </ActionTooltip>
        )}

        {/* Like: FAR-RIGHT, persists when liked (a host like = a normal like). Carries its
            own tooltip. No-op without a LikesProvider (e.g. the pending-review grid). */}
        <LikeButton item={item} variant="row" />
      </div>
    </>
  );
}

export function HostMediaGrid({
  eventId,
  items,
  shareUrl,
}: {
  eventId: string;
  items: GridMedia[];
  // The event JOIN url, for the lightbox Share (3c.2) — never a presigned media URL.
  shareUrl?: string;
}) {
  // ONE optimistic source over the server items, shared by the tiles AND the lightbox
  // (both render from optimisticItems), so a hide/approve/remove updates instantly with
  // no revalidation lag; it reverts on failure. ONE moderation hook drives both surfaces.
  const [optimisticItems, applyOptimistic] = useOptimistic(items, applyChange);
  const { setStatus, remove } = useModeration(eventId, applyOptimistic);
  // clampAspect: moderation ergonomics. dimItem: hidden media -> 30% (active-vs-hidden).
  return (
    <MasonryColumns
      items={optimisticItems}
      viewerIsHost
      clampAspect
      shareUrl={shareUrl}
      onSetStatus={setStatus}
      onRemove={remove}
      dimItem={(item) => item.status === "hidden"}
      renderOverlay={(item) => (
        <HostTileOverlay item={item} setStatus={setStatus} remove={remove} />
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
