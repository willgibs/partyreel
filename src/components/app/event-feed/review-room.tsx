"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { HostAlbumProvider } from "@/components/app/event-feed/host-album";
import { type GridMedia } from "@/components/app/media-grid";
import { RoomShimmer } from "@/components/app/share/room-panel";
import { Button } from "@/components/ui/button";
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
  titled = true,
}: {
  eventId: string;
  moderationOn: boolean;
  pendingItems: GridMedia[];
  /** The host's album as the page read it, for the live queue; absent where the hub's own album is above it. */
  album?: { seed: HubAlbumSeed; qrToken: string };
  /** The verdicts' writes: the Server Functions by default (the Library hands fakes). */
  writes?: ReviewWrites;
  /** Whether a key pressed with nothing focused is the room's: the room's own place, never a specimen. */
  claimPage?: boolean;
  /** The room draws its own title; false where its panel titles it (over the hub). */
  titled?: boolean;
}) {
  const body = (
    <ReviewRoomBody
      eventId={eventId}
      moderationOn={moderationOn}
      pendingItems={pendingItems}
      writes={writes}
      claimPage={claimPage}
      titled={titled}
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
  titled,
}: {
  eventId: string;
  moderationOn: boolean;
  pendingItems: GridMedia[];
  writes?: ReviewWrites;
  claimPage: boolean;
  titled: boolean;
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
        titled={titled}
      />
    </div>
  );
}

/**
 * THE REVIEW ROOM OVER THE HUB (event-header r2, `rooms=over`): the room in its panel, its queue read off the hub's
 * own album rather than a page's read. The hub's manifest already holds every upload waiting (each flagged), and its
 * link store mints their tiles with the credit and the proved address the host's look shows, exactly as the room
 * reads an arrival (`review-live.ts`'s `media`). So opening Review asks the server for the queue's links and nothing
 * else, and a deep link onto the room (the bell) finds them already minted with the hub's first window
 * (`page.tsx`), so the queue stands at once.
 *
 * ★ THE QUEUE IS SEEDED ONCE, WHEN IT IS WHOLE: the room ranks what it is first handed and holds anything a later
 * render brings behind its line (`use-review-triage.ts`), so it mounts only once the queue it opened on has its
 * links, its shimmer standing meanwhile. An upload that lands after that is an arrival, counted on the line as it is
 * in the room's own page. One whose link could not be minted is an arrival too, asked again when it is folded in;
 * a queue none of whose links came back says so, with Try again, never "all caught up" over a queue it could not
 * read.
 */
export function ReviewRoomFromHub({
  eventId,
  moderationOn,
}: {
  eventId: string;
  moderationOn: boolean;
}) {
  const live = useReviewLive();
  const [queue, setQueue] = useState<
    | { state: "reading" }
    | { state: "read"; items: GridMedia[] }
    | { state: "failed" }
  >({ state: "reading" });
  const [attempt, setAttempt] = useState(0);
  const liveRef = useRef(live);
  useEffect(() => {
    liveRef.current = live;
  });
  const ready = live !== null;
  useEffect(() => {
    const now = liveRef.current;
    if (!now) return;
    let alive = true;
    const waiting = now.waiting;
    void now.media(waiting).then(
      (items) => {
        if (!alive) return;
        setQueue(
          waiting.length > 0 && items.length === 0
            ? { state: "failed" }
            : { state: "read", items },
        );
      },
      () => {
        if (alive) setQueue({ state: "failed" });
      },
    );
    return () => {
      alive = false;
    };
  }, [ready, attempt]);

  // Off the hub (no album above it) the room is still: nothing to read a queue from.
  if (!live) {
    return (
      <ReviewRoom
        eventId={eventId}
        moderationOn={moderationOn}
        pendingItems={[]}
        titled={false}
      />
    );
  }
  if (queue.state === "failed") {
    return (
      <div
        data-review-unread=""
        className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5"
      >
        <p className="text-sm text-muted-foreground">
          Couldn&rsquo;t load what&rsquo;s waiting.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setQueue({ state: "reading" });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (queue.state === "reading") return <RoomShimmer shape="grid" />;
  return (
    <ReviewRoom
      eventId={eventId}
      moderationOn={moderationOn}
      pendingItems={queue.items}
      titled={false}
    />
  );
}
