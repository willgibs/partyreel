"use client";

import { ReviewRoom } from "@/components/app/event-feed/review-room";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { SetCrumbs } from "@/components/shared/crumbs";

import { EVENT, NAME, QUEUE } from "../fixtures";

import { HostFrame } from "./settings";

/**
 * REVIEW: production's room, whole and inert, holding twelve of the wedding's
 * uploads: its head with the queue's count, its actions, its note and the
 * triage grid at the photograph's 2px.
 *
 * ★ THE ROOM WITHOUT ITS LIVE ALBUM (the Library's own specimen does the
 * same): no seed, so nothing polls, and its writes answer after a round trip
 * and change nothing, so a press here never approves anyone's upload.
 */
const answered = () =>
  new Promise<{ ok: true }>((resolve) =>
    setTimeout(() => resolve({ ok: true }), 320),
  );
const INERT: ReviewWrites = {
  approve: answered,
  reject: answered,
  undo: answered,
};

export function ReviewScreen() {
  return (
    <HostFrame>
      <div data-route-fade className="space-y-6">
        <SetCrumbs
          trail={[
            { label: "Partyreel", href: "/dashboard" },
            { label: NAME, href: `/dashboard/${EVENT.id}` },
            { label: "Review" },
          ]}
        />
        <ReviewRoom
          eventId={EVENT.id}
          moderationOn
          pendingItems={QUEUE}
          writes={INERT}
          claimPage={false}
        />
      </div>
    </HostFrame>
  );
}
