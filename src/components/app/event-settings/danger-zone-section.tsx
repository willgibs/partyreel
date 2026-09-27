"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteEventAction } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

// Settings · Danger zone. Self-contained (outside the settings <Form>): owns the
// delete action + its pending state. Soft-delete ONLY: deleteEventAction sets
// deleted_at, which frees the host's event slot. There is deliberately NO "end
// event" path - events have no end date (anti-abuse, see tiers.ts), so deletion is
// the only lifecycle exit. On success the action redirects to /dashboard (throws
// NEXT_REDIRECT), so the toast only fires on a real failure.
export function DangerZoneSection({
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
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Deleting an event removes it and frees up a slot on your plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* A CONFIRMATION over the settings (`popups` r1: `confirm=dialog`, and
            the carried call `stacked`: a confirmation over a popup is a centred
            dialog, at every width). */}
        <Popup>
          <PopupTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Delete event
            </Button>
          </PopupTrigger>
          <PopupContent kind="confirm">
            {/* TRUTHFUL (QA #16): this path is softDeleteEvent — the trigger stamps
                purge_at = +30 days and Deleted has a working restore. "Permanently...
                can't be undone" would be wrong in BOTH directions: a host who deleted by
                mistake would never think to look for it, and a host deleting for privacy
                would be misinformed about what we still hold. The place is named with the
                app's one word for it, "Deleted": the dashboard's filter, the album's View
                menu and the lifecycle emails all say it, never "Trash" or "bin". */}
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
                disabled={isDeleting}
                onClick={onDelete}
              >
                {isDeleting ? "Deleting…" : "Delete event"}
              </Button>
            </PopupFooter>
          </PopupContent>
        </Popup>
      </CardContent>
    </Card>
  );
}
