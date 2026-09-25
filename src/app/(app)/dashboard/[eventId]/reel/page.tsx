import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReelPanel } from "@/components/app/reel-panel";
import { ReelProvider } from "@/components/reel/reel-provider";
import { ReelStageProvider } from "@/components/reel/reel-stage-provider";
import { ReelStudio } from "@/components/reel/reel-studio";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
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
 * THE REEL ROOM, as a route (R3; one of the hub's cards since
 * `event=hub`).
 *
 * A route and not a modal: the reel deserves a place you GO to, the room survives
 * a refresh, and the phone's back gesture means what it looks like it means.
 *
 * It loads the SAME items as the event page through the shared mapper, because the
 * Studio is a different view of one reel, not a second source of truth for it.
 *
 * ★ THE ROOM NOW HOLDS BOTH SIDES OF THE REEL'S BIRTH, and that is what let the
 * old redirect go. This route used to bounce a host with no reel back to
 * `?section=reel` — the feed section that could create one. The sections are
 * cards now and there is no such filter, so rather than re-point a redirect at
 * a surface that no longer exists, the room renders the BUILDER before birth
 * and the STUDIO after it. The hub's card reads "Create reel" until then, so
 * the door says what is behind it and never leads anywhere empty.
 */
export default async function ReelStudioPage({ params }: PageProps) {
  const { eventId } = await params;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  // Both lists are read WHOLE: the album slice (approved + hidden; pending
  // uploads live in the review queue, never in the reel) and every reel member.
  // The Studio's reorder set is their intersection, so a member missing from
  // either would hand `reorder_reel` a partial set it refuses as `stale`.
  const [media, uploaderIdentities, likeCounts, reelIds, reelConfig] =
    await Promise.all([
      listEventMedia(event.id, "album"),
      getUploaderIdentities(event.id),
      getEventLikeCounts(event.id),
      listReelItems(event.id),
      getReelConfig(event.id),
    ]);

  const visibleItems = await toHostGalleryItems({
    media,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });

  const crumbs = (
    <SetCrumbs
      trail={[
        { label: "Partyreel", href: "/dashboard" },
        { label: event.name, href: `/dashboard/${event.id}` },
        { label: "Reel" },
      ]}
    />
  );

  // ★ No config row means the reel has not been BORN yet, and birth belongs to
  // the builder's Create (that tap is the ratified reveal's trigger). The
  // builder is the room's pre-birth face; ReelStageProvider is what the
  // builder's create path reads.
  if (!reelConfig) {
    return (
      <div data-route-fade className="space-y-6">
        {crumbs}
        <PageHeading>Reel</PageHeading>
        <ReelProvider eventId={event.id} initialReelIds={reelIds}>
          <ReelStageProvider initialCreated={false}>
            <ReelPanel
              eventId={event.id}
              eventName={event.name}
              items={visibleItems}
              reelConfig={null}
              watermark={tier === "free"}
              tier={tier}
              guestVisible={false}
            />
          </ReelStageProvider>
        </ReelProvider>
      </div>
    );
  }

  return (
    <ReelProvider eventId={event.id} initialReelIds={reelIds}>
      {crumbs}
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
        guestVisible={reelConfig.guestVisible}
      />
    </ReelProvider>
  );
}
