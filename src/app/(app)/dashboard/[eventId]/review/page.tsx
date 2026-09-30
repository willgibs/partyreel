import type { Metadata } from "next";

import { appNotFoundMetadata } from "@/app/(app)/not-found.metadata";
import { AppNotFoundScreen } from "@/app/(app)/not-found.screen";
import { HostCreditLookProvider } from "@/components/app/event-blocks/credit-look";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { getEvent } from "@/lib/db/queries/events";
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { listEventMedia } from "@/lib/db/queries/media";
import { planHubManifest, seedFrom } from "@/lib/event/host-album.server";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { toHostGalleryItems } from "@/lib/event/gallery-items";
import { getRequestAuth } from "@/lib/supabase/request-auth";

// Presigned URLs are per-request + short-lived, so this route must never be
// statically cached (the same reason as the hub).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  // An event that is gone or never this host's is titled as the 404 it is (the hub's page says why).
  return event ? { title: `Review · ${event.name}` } : appNotFoundMetadata;
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
 * ★ THE ROOM IS LIVE (host-curation `arrivals=prompt`). The page seeds the
 * host's album store exactly as the hub does (`planHubManifest`: the version,
 * the counts and the manifest's first page, read in one snapshot), with no
 * links, since the room draws its own queue; the store moves it from there on
 * the host's poll and doorbell, and an upload that lands while the host is here
 * waits behind the room's line. Nothing re-renders this page to show one.
 */
export default async function EventReviewPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  // Drawn here, never thrown: the hub's page says why (crumbs-28).
  if (!event) return <AppNotFoundScreen />;

  // The queue ALONE, read whole: the `pending` slice pages to its last item, so
  // the room presigns what it shows and nothing else, and reaches the queue's
  // oldest upload however large the album around it grows. Beside it, the
  // host's manifest for the live signal (the hub's own first sync).
  const { supabase } = await getRequestAuth();
  const [pending, uploaderIdentities, likeCounts, plan, noLinks] =
    await Promise.all([
      listEventMedia(event.id, "pending"),
      getUploaderIdentities(event.id),
      getEventLikeCounts(event.id),
      planHubManifest(supabase, event.id),
      readHostLinksBody(supabase, event, []),
    ]);
  const pendingItems = await toHostGalleryItems({
    media: pending,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });

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
      {/* The uploader's name on the peek opens their look, with its quiet Block (event-safety
          `entry=all`, the uploader in Review). */}
      <HostCreditLookProvider>
        <ReviewRoom
          eventId={event.id}
          moderationOn={event.moderation_mode === "hold_for_approval"}
          pendingItems={pendingItems}
          album={{
            seed: seedFrom(event.id, plan, noLinks),
            qrToken: event.qr_token,
          }}
        />
      </HostCreditLookProvider>
    </div>
  );
}
