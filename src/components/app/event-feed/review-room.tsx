"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { type GridMedia } from "@/components/app/media-grid";

import { ReviewSection } from "./review-section";
import { useReviewTriage } from "./use-review-triage";

/**
 * THE REVIEW ROOM'S CLIENT BOUNDARY. `EventFeed` used to own the triage machine
 * and share it with the floating action bar; in a room there is no second
 * reader, so this is the thin wrapper that owns it and hands it to the one
 * section that draws it.
 *
 * `ReviewSection` is untouched and keeps its four states (pending, caught-up,
 * moderation-off teaser, and the inline result), which is why the room needed
 * no new triage UI at all — only a page to put it on.
 */
export function ReviewRoom({
  eventId,
  moderationOn,
  pendingItems,
}: {
  eventId: string;
  moderationOn: boolean;
  pendingItems: GridMedia[];
}) {
  const [enabling, setEnabling] = useState(false);
  const triage = useReviewTriage({ eventId, items: pendingItems, moderationOn });

  async function enableModeration() {
    if (enabling) return;
    setEnabling(true);
    const res = await updateEventAction(eventId, {
      moderation_mode: "hold_for_approval",
    });
    if (!res.ok) {
      toast.error(res.message || "Couldn't turn on review. Please try again.");
    } else {
      toast.success("Review is on. New uploads wait here for approval.");
    }
    setEnabling(false);
  }

  return (
    <ReviewSection
      triage={triage}
      onEnableModeration={enableModeration}
      enabling={enabling}
    />
  );
}
