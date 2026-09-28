"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { HostAlbumProvider } from "@/components/app/event-feed/host-album";
import { type GridMedia } from "@/components/app/media-grid";
import type { HubAlbumSeed } from "@/lib/event/hub-album";

import { useReviewKeys } from "./review-keys";
import { useReviewLive } from "./review-live";
import { ReviewSection } from "./review-section";
import { useReviewTriage, type ReviewWrites } from "./use-review-triage";

/**
 * THE REVIEW ROOM'S CLIENT BOUNDARY: the room's state machine (`use-review-triage.ts`), its live
 * signal (`review-live.ts`, the hub's own album store, mounted here from the page's seed), its keys
 * (`review-keys.ts`) and the one section that draws it (`review-section.tsx`).
 *
 * ★ THE ROOM IS LIVE NOW, AS THE HUB IS (host-curation `arrivals=prompt`): the page seeds the host's
 * album store exactly as the hub does, so an upload that lands while the host reviews reaches the
 * room the moment it reaches the hub's Review card, and waits behind the line. Without a seed (the
 * Library's specimen) the room is still, and its writes are whatever it is handed.
 */
export function ReviewRoom({
  eventId,
  moderationOn,
  pendingItems,
  album,
  writes,
  claimPage = true,
}: {
  eventId: string;
  moderationOn: boolean;
  pendingItems: GridMedia[];
  /** The host's album as the page read it, for the live queue; absent off the room's page. */
  album?: { seed: HubAlbumSeed; qrToken: string };
  /** The verdicts' writes: the Server Functions by default (the Library hands fakes). */
  writes?: ReviewWrites;
  /** Whether a key pressed with nothing focused is the room's: the page's room, never a specimen. */
  claimPage?: boolean;
}) {
  const body = (
    <ReviewRoomBody
      eventId={eventId}
      moderationOn={moderationOn}
      pendingItems={pendingItems}
      writes={writes}
      claimPage={claimPage}
    />
  );
  return album ? (
    <HostAlbumProvider seed={album.seed} qrToken={album.qrToken}>
      {body}
    </HostAlbumProvider>
  ) : (
    body
  );
}

function ReviewRoomBody({
  eventId,
  moderationOn,
  pendingItems,
  writes,
  claimPage,
}: {
  eventId: string;
  moderationOn: boolean;
  pendingItems: GridMedia[];
  writes?: ReviewWrites;
  claimPage: boolean;
}) {
  const [enabling, setEnabling] = useState(false);
  const live = useReviewLive();
  const triage = useReviewTriage({
    eventId,
    items: pendingItems,
    moderationOn,
    live,
    writes,
  });
  const root = useRef<HTMLDivElement>(null);
  useReviewKeys({ rootRef: root, triage, claimPage });

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
    <div ref={root} data-review-room>
      <ReviewSection
        triage={triage}
        onEnableModeration={enableModeration}
        enabling={enabling}
        keys
      />
    </div>
  );
}
