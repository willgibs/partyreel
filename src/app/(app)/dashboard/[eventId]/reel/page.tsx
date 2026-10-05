import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { appNotFoundMetadata } from "@/app/(app)/not-found.metadata";
import { AppNotFoundScreen } from "@/app/(app)/not-found.screen";
import { getEvent, getReelProgress } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { developState } from "@/lib/disposable/reveal";
import { reelState, type ReelState } from "@/lib/event/reel-progress";

// The reel's state is the album's, read per request.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  // `getEvent` is request-cached, so this and the page below read the event once. An event that is gone or never
  // this host's is titled as the 404 it is (the hub's page says why).
  const event = await getEvent(eventId);
  return event ? { title: "Highlight reel" } : appNotFoundMetadata;
}

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
 *   - the reel is live and a develop time is ahead: over her own hub (`/dashboard/<id>?reel`,
 *     `hub-reel.tsx`), where the Reel card sends the same press, since the guests' page has no reel
 *     before the develop;
 *   - the reel is live and no develop is ahead (none set, or its time reached): straight into the
 *     guests' view;
 *   - anything short of that (the switch off, the platform lever off, or fewer than two photos
 *     that can play): back to the event's page, where the Reel card says what is left, or that
 *     the reel is off.
 */
export default async function ReelRedirectPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  // RLS-scoped and deleted-filtered: a missing, foreign or deleted event is a 404, never a
  // redirect that would confirm it exists. Drawn here, never thrown: the hub's page says why
  // (crumbs-28).
  if (!event) return <AppNotFoundScreen />;

  const [progress, liveReelFacts] = await Promise.all([
    getReelProgress([event.id]),
    getLiveReelServerFacts(event.id),
  ]);
  const state = reelState({
    showReel: event.show_reel,
    liveReelEnabled: liveReelFacts.liveReelEnabled,
    playable: progress.get(event.id) ?? 0,
  });
  redirect(whereItGoes(event, state));
}

/**
 * ★ A LIVE REEL PLAYS WHERE HER GUESTS' PAGE CAN SHOW IT (crumbs-69). Until a develop time ahead no guest sees a
 * photograph, her own included on `/e/<token>?reel` (no guest-path read takes the owner's exemption), so that page has
 * no reel to open and the old door used to land her on it anyway. The hub plays her own scope at any time, so while the
 * develop is ahead the door opens her reel there, as the Reel card does (`reel-card.tsx`, on the same `developState`
 * every develop reader shares). A reel that cannot play goes to the hub without `?reel`, where its card says why, and
 * the hub drops a `?reel` it cannot play besides.
 */
function whereItGoes(
  event: { id: string; qr_token: string; develops_at: string | null },
  state: ReelState,
): string {
  const hub = `/dashboard/${event.id}`;
  if (state !== "live") return hub;
  return developState(event.develops_at).kind === "waiting"
    ? `${hub}?reel`
    : `/e/${event.qr_token}?reel`;
}
