import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { getEvent } from "@/lib/db/queries/events";
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { listEventMedia } from "@/lib/db/queries/media";
import { toHostGalleryItems } from "@/lib/event/gallery-items";

// Presigned URLs are per-request + short-lived, so this route must never be
// statically cached (the same reason as the hub).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? `Review · ${event.name}` : "Review" };
}

/**
 * THE REVIEW ROOM (Will, `nav=crumbs` + `event=hub`: the cards are "a door into
 * each room", and the crumb trail is "Partyreel / the event / the room").
 *
 * The queue was a SECTION of the old stacked feed, floated to the top by
 * urgency. As a room it is simply the page — which is what triage actually
 * wants, because a host clearing twelve photographs is doing one thing and the
 * album underneath was never part of it. The card on the hub carries the count
 * and ticks it down when they come back.
 *
 * `ReviewSection` and `use-review-triage` are imported unchanged: the state
 * machine that ran the inline queue is the state machine that runs the room.
 */
export default async function EventReviewPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const [media, uploaderIdentities, likeCounts] = await Promise.all([
    listEventMedia(event.id),
    getUploaderIdentities(event.id),
    getEventLikeCounts(event.id),
  ]);
  const items = await toHostGalleryItems({
    media,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });
  const pendingItems = items.filter((m) => m.status === "pending");

  return (
    <div data-route-fade className="space-y-6">
      <SetCrumbs
        trail={[
          { label: "Partyreel", href: "/dashboard" },
          { label: event.name, href: `/dashboard/${event.id}` },
          { label: "Review" },
        ]}
      />
      <PageHeading>Review</PageHeading>
      <HostSelectionProvider>
        <ReviewRoom
          eventId={event.id}
          moderationOn={event.moderation_mode === "hold_for_approval"}
          pendingItems={pendingItems}
        />
      </HostSelectionProvider>
    </div>
  );
}
