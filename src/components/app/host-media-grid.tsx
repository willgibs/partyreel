"use client";

import { useTransition } from "react";
import { Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  approveAllPendingAction,
  removeMediaAction,
  setMediaStatusAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
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

// Host moderation grid — the only place media controls live (MediaGrid stays
// presentational for the public album). Each tile carries status-aware controls:
//   pending  → Approve / Hide / Remove
//   approved → Hide / Remove
//   hidden   → Unhide / Remove
// Remove is behind a confirm Dialog. Controls sit at the TOP so they don't fight
// the native <video> controls at the bottom. All writes go through the Server
// Actions (which revalidate this path); we only toast on failure.

function HostMediaTile({
  eventId,
  item,
}: {
  eventId: string;
  item: GridMedia;
}) {
  const [isPending, startTransition] = useTransition();
  // Defensive default — listEventMedia never returns 'removed', and 'approved'
  // is the only status with no badge / the live state.
  const status = item.status ?? "approved";

  function run(action: () => Promise<ActionResult>, failTitle: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) return;
      toast.error(failTitle, { description: result.message });
    });
  }

  return (
    <li className="relative aspect-square overflow-hidden rounded-lg bg-black/10">
      <MediaTile item={item} />

      {status !== "approved" && (
        <Badge
          variant="secondary"
          className="absolute top-1.5 left-1.5 z-10 capitalize"
        >
          {status}
        </Badge>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/70 to-transparent p-1.5">
        {status === "pending" && (
          <Button
            type="button"
            size="icon-sm"
            disabled={isPending}
            aria-label="Approve"
            title="Approve"
            onClick={() =>
              run(
                () => setMediaStatusAction(eventId, item.id, "approved"),
                "Couldn't approve that item.",
              )
            }
          >
            <Check />
          </Button>
        )}
        {(status === "pending" || status === "approved") && (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            disabled={isPending}
            aria-label="Hide"
            title="Hide"
            onClick={() =>
              run(
                () => setMediaStatusAction(eventId, item.id, "hidden"),
                "Couldn't hide that item.",
              )
            }
          >
            <EyeOff />
          </Button>
        )}
        {status === "hidden" && (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            disabled={isPending}
            aria-label="Unhide"
            title="Unhide"
            onClick={() =>
              run(
                () => setMediaStatusAction(eventId, item.id, "approved"),
                "Couldn't unhide that item.",
              )
            }
          >
            <Eye />
          </Button>
        )}

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
    </li>
  );
}

export function HostMediaGrid({
  eventId,
  items,
}: {
  eventId: string;
  items: GridMedia[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <HostMediaTile key={item.id} eventId={eventId} item={item} />
      ))}
    </ul>
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
