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
import { ReelButton } from "@/components/reel/reel-button";
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
// controls ride in via `renderOverlay` as a HOVER-REVEALED action row painted over the
// open-lightbox button as SIBLINGS, so tapping a control never opens the lightbox.
// Per-action COLOR on direct hover (approve=green, hide=amber, remove=red, save=blue,
// like=rose-when-liked). Tile actions use NATIVE `title` tooltips — styled radix tooltips
// are LIGHTBOX-ONLY (Will, 2026-06-20 redo: tiles already reveal on hover, so a styled
// tooltip there is near-redundant + ~50 radix Tooltips on the grid was a hydration risk).
//   Desktop: the full suite reveals on hover. Mobile: Download + Like only; hide/remove
//   move to the lightbox. A HIDDEN item is the exception — its amber Show marker PERSISTS
//   (off-hover + mobile, like the liked heart), 1-tap to show, atop the 30% dim.
// Moderation is OPTIMISTIC (instant tile + lightbox via useOptimistic; the action runs in
// the background and reverts + toasts on failure) — no revalidation lag.

// One action-icon: a circular dark chip, white at rest, COLOR on direct hover/state.
const ACTION_BASE =
  "flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm outline-none transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90 motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/70";

// The optimistic overlay over the server-rendered items: a status flip or a removal,
// applied instantly so the tile + lightbox reflect the change with no round-trip;
// useOptimistic resyncs to the server items when the action's revalidation lands (and
// reverts on failure).
type OptimisticChange =
  | { type: "status"; id: string; status: "approved" | "hidden" }
  | { type: "remove"; id: string };

function applyChange(
  items: GridMedia[],
  change: OptimisticChange,
): GridMedia[] {
  if (change.type === "remove")
    return items.filter((it) => it.id !== change.id);
  return items.map((it) =>
    it.id === change.id ? { ...it, status: change.status } : it,
  );
}

type Moderation = {
  setStatus: (item: GridMedia, status: "approved" | "hidden") => void;
  remove: (item: GridMedia) => void;
};

// The ONE home for the host moderation actions + their copy/toasts, shared by the tile
// overlay AND the lightbox curate group (both read the same optimistic items). Each handler
// applies the optimistic change FIRST (instant), then runs the server action; the intent
// drives the error copy + the "Hidden from everyone" WARNING toast (amber, fires from BOTH
// the tile and the lightbox - state-colored toast policy: hide = warning, not success).
// On failure the optimistic state reverts (useOptimistic).
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
      if (intent === "hide") toast.warning("Hidden from everyone");
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
  const status = item.status ?? "approved";

  return (
    <>
      {/* HOST-ONLY like COUNT (read-only curation signal, distinct from the host's own
          like toggle in the row): bottom-RIGHT, hidden at 0. */}
      <LikeCountBadge
        count={item.likeCount}
        className="absolute right-1.5 bottom-1.5 z-10"
      />

      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
        {/* Moderation: DESKTOP-only hover-reveal. Mobile: gone (hide/remove → lightbox). */}
        <div className="hidden items-center gap-1 transition-opacity duration-150 ease-emphasis md:flex md:opacity-0 md:group-hover:opacity-100">
          {status === "pending" && (
            <button
              type="button"
              aria-label="Approve"
              title="Approve"
              className={cn(ACTION_BASE, "hover:text-success")}
              onClick={() => setStatus(item, "approved")}
            >
              <Check className="size-4" />
            </button>
          )}
          {(status === "pending" || status === "approved") && (
            <button
              type="button"
              aria-label="Hide"
              title="Hide"
              className={cn(ACTION_BASE, "hover:text-warning")}
              onClick={() => setStatus(item, "hidden")}
            >
              <EyeOff className="size-4" />
            </button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
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
                  <Button variant="destructive" onClick={() => remove(item)}>
                    Remove
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* HIDDEN marker: a PERSISTENT amber Show (mobile + off-hover, like the liked
            heart) — the unmistakable "hidden from guests" state + a 1-tap show. */}
        {status === "hidden" && (
          <button
            type="button"
            aria-label="Show"
            title="Show"
            className={cn(ACTION_BASE, "text-warning")}
            onClick={() => setStatus(item, "approved")}
          >
            <Eye className="size-4" />
          </button>
        )}

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

        {/* Add to reel (host curation): grouped with the editorial actions, BEFORE Like.
            APPROVED-only (you curate visible media into the reel). Violet clapperboard when
            in-reel. No-op without a ReelProvider (guest galleries + the pending-review grid). */}
        {item.status === "approved" && (
          <ReelButton item={item} variant="row" />
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
  shareUrl,
}: {
  eventId: string;
  items: GridMedia[];
  // The event JOIN url, for the lightbox Share — never a presigned media URL.
  shareUrl?: string;
}) {
  // ONE optimistic source over the server items, shared by the tiles AND the lightbox
  // (both render from optimisticItems), so a hide/approve/remove updates instantly with no
  // revalidation lag; it reverts on failure. ONE moderation hook drives both surfaces.
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
