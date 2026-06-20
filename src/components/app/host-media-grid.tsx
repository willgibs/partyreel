"use client";

import { useTransition } from "react";
import { Check, Download, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

// The ONE home for the host moderation actions + their copy/toasts (3c.2), shared by
// the tile overlay (per-tile instance -> per-tile pending) AND the lightbox curate
// group (HostMediaGrid's grid-level instance). `setStatus` derives the intent from the
// transition for the right error copy + the "Hidden from everyone" success toast (Will:
// fires from BOTH the tile and the lightbox). All writes revalidate this path; we toast
// failures (+ the one hide success).
function useModeration(eventId: string) {
  const [isPending, startTransition] = useTransition();

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
      const result = await removeMediaAction(eventId, item.id);
      if (!result.ok) {
        toast.error("Couldn't remove that item.", {
          description: result.message,
        });
      }
    });
  };

  return { setStatus, remove, isPending };
}

function HostTileOverlay({
  eventId,
  item,
}: {
  eventId: string;
  item: GridMedia;
}) {
  const { setStatus, remove, isPending } = useModeration(eventId);
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
            — hide/remove move to the lightbox; the mobile tile keeps Like + Save only
            (deletes are rare; an active tile is approved or moderation-off, so a direct
            hide is uncommon too). */}
        <div className="hidden items-center gap-1 transition-opacity duration-150 ease-emphasis md:flex md:opacity-0 md:group-hover:opacity-100">
          {status === "pending" && (
            <button
              type="button"
              disabled={isPending}
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
              disabled={isPending}
              aria-label="Hide"
              title="Hide"
              className={cn(ACTION_BASE, "hover:text-warning")}
              onClick={() => setStatus(item, "hidden")}
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
              onClick={() => setStatus(item, "approved")}
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
                    onClick={() => remove(item)}
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
  shareUrl,
}: {
  eventId: string;
  items: GridMedia[];
  // The event JOIN url, for the lightbox Share (3c.2) — never a presigned media URL.
  shareUrl?: string;
}) {
  // Grid-level moderation handlers for the lightbox curate group (one open item at a
  // time, so a grid-level transition is fine). The per-tile overlay owns its OWN
  // instance (per-tile pending); both share the copy/toasts via the hook.
  const { setStatus, remove } = useModeration(eventId);
  // clampAspect: moderation ergonomics. dimItem: hidden media -> 30% (active-vs-hidden).
  return (
    <MasonryColumns
      items={items}
      viewerIsHost
      clampAspect
      shareUrl={shareUrl}
      onSetStatus={setStatus}
      onRemove={remove}
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
