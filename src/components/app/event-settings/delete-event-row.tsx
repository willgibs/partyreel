"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteEventAction } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * DELETE, AS A QUIET ROW AT THE FOOT OF SETTINGS (event-settings r1, the summary's own foot): the red
 * of the destructive act on its own card, a line saying what it does, and today's centred confirm
 * (`confirm=dialog`, and the carried call `stacked`: a confirmation over a popup is a centred dialog).
 *
 * Soft-delete ONLY: `deleteEventAction` sets `deleted_at`, which frees the host's event slot. There is
 * deliberately NO "end event" path: events have no end date (anti-abuse, see tiers.ts), so deletion is
 * the only lifecycle exit. On success the action redirects to /dashboard (throws NEXT_REDIRECT), so the
 * toast only fires on a real failure.
 */
export function DeleteEventRow({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const [isDeleting, startDeleting] = useTransition();

  function onDelete() {
    startDeleting(async () => {
      const result = await deleteEventAction(eventId);
      if (!result || result.ok) return;
      toast.error("Couldn't delete the event.", {
        description: result.message,
      });
    });
  }

  return (
    <div data-settings-delete="" className="space-y-1.5">
      <Popup>
        <PopupTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg bg-card px-4 py-3 text-left text-sm font-medium text-destructive ring-1 ring-foreground/10 transition-colors duration-150 outline-none hover:bg-destructive/5 focus-halo motion-reduce:transition-none"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete event
          </button>
        </PopupTrigger>
        <PopupContent kind="confirm">
          {/* TRUTHFUL (QA #16): this path is softDeleteEvent: the trigger stamps purge_at = +30 days
              and Deleted has a working restore. The place is named with the app's one word for it,
              "Deleted": the dashboard's filter, the album's View menu and the lifecycle emails all
              say it, never "Trash" or "bin". */}
          <PopupHeader
            title={`Delete “${eventName}”?`}
            description={`This removes the event and everything guests uploaded from your album right away. It moves to Deleted, where you can restore it for ${RECENTLY_DELETED_WINDOW_DAYS} days before it is deleted for good.`}
          />
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Cancel</Button>
            </PopupClose>
            <Button
              variant="destructive"
              onClick={onDelete}
              working={isDeleting}
              workingLabel="Deleting"
            >
              Delete event
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
      <p className="px-1 text-caption text-muted-foreground">
        {`It moves to Deleted, where you can restore it for ${RECENTLY_DELETED_WINDOW_DAYS} days.`}
      </p>
    </div>
  );
}
