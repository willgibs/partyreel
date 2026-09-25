import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getEvent, getReelProgress } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { reelState } from "@/lib/event/reel-progress";

// The reel's state is the album's, read per request.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

export const metadata: Metadata = { title: "Highlight reel" };

/**
 * THE OLD REEL ROOM, NOW A REDIRECT (`reel-host`, Will 2026-09-25: `home=view`).
 *
 * The live reel makes itself, so there is no room to manage it in: the host's reel is the view the
 * guests watch (`/e/<token>?reel`, where the owner passes every gate and the owner's extras ride),
 * and the hub's Reel card is its door. This route lives on only because it was a published URL:
 * old bookmarks, a retired `?section=reel` deep link (`legacySectionRoom`), and the next-step chip
 * builds before this one. It never renders, so it keeps no skeleton.
 *
 * Where it sends a host:
 *   - the reel is live: straight into the view;
 *   - anything short of that (the switch off, the platform lever off, or fewer than two photos
 *     that can play): back to the event's page, where the Reel card says what is left, or that
 *     the reel is off.
 */
export default async function ReelRedirectPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  // RLS-scoped and deleted-filtered: a missing, foreign or deleted event is a 404, never a
  // redirect that would confirm it exists.
  if (!event) notFound();

  const [progress, liveReelFacts] = await Promise.all([
    getReelProgress([event.id]),
    getLiveReelServerFacts(event.id),
  ]);
  const state = reelState({
    showReel: event.show_reel,
    liveReelEnabled: liveReelFacts.liveReelEnabled,
    playable: progress.get(event.id) ?? 0,
  });
  redirect(
    state === "live" ? `/e/${event.qr_token}?reel` : `/dashboard/${event.id}`,
  );
}
