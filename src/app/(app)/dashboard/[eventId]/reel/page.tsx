import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ReelProvider } from "@/components/reel/reel-provider";
import { ReelStudio } from "@/components/reel/reel-studio";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import { getEvent } from "@/lib/db/queries/events";
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { listEventMedia } from "@/lib/db/queries/media";
import { getProfile } from "@/lib/db/queries/profile";
import { getReelConfig, listReelItems } from "@/lib/db/queries/reel";
import { toHostGalleryItems } from "@/lib/event/gallery-items";

// Presigned media URLs are per-request + short-lived, so this route must never be
// statically cached (same reason as the event page).
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? `The studio · ${event.name}` : "The studio" };
}

/**
 * THE REEL STUDIO, as a route (ruled by Will, R3).
 *
 * A route and not a modal: the reel deserves a place you GO to, the room survives
 * a refresh, and the phone's back gesture means what it looks like it means.
 *
 * It loads the SAME items as the event page through the shared mapper, because the
 * Studio is a different view of one reel, not a second source of truth for it.
 */
export default async function ReelStudioPage({ params }: PageProps) {
  const { eventId } = await params;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  const [media, uploaderIdentities, likeCounts, reelIds, reelConfig] =
    await Promise.all([
      listEventMedia(event.id),
      getUploaderIdentities(event.id),
      getEventLikeCounts(event.id),
      listReelItems(event.id),
      getReelConfig(event.id),
    ]);

  // ★ No config row means the reel has not been BORN yet, and birth belongs to the
  // builder's Create (that tap is the ratified reveal's trigger). So the Studio is
  // a post-birth room only: send a host who arrives early back to the section that
  // can actually create it, rather than showing them an empty room.
  if (!reelConfig) redirect(`/dashboard/${event.id}?section=reel`);

  const galleryItems = await toHostGalleryItems({
    media,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });
  // Pending uploads live in the review queue, never in the reel.
  const visibleItems = galleryItems.filter((m) => m.status !== "pending");

  return (
    <ReelProvider eventId={event.id} initialReelIds={reelIds}>
      <ReelStudio
        eventId={event.id}
        eventName={event.name}
        items={visibleItems}
        reelConfig={reelConfig}
        // Free reels carry the partyreel.com wordmark (the upgrade nudge); the
        // player mirrors it so the host sees what they will download. The render
        // route re-derives it server-side, so the client flag is cosmetic only.
        watermark={tier === "free"}
        tier={tier}
        // TODO(track-C): getReelConfig gains `guestVisible` on Track C's branch;
        // swap this literal for reelConfig.guestVisible at integration.
        guestVisible={false}
      />
    </ReelProvider>
  );
}
