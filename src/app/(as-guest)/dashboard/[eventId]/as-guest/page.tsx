import { randomInt } from "node:crypto";

import type { Metadata } from "next";
import { cookies } from "next/headers";

import { readAsGuest } from "@/app/(app)/dashboard/[eventId]/as-guest.server";
import { appNotFoundMetadata } from "@/app/(app)/not-found.metadata";
import { AppNotFoundScreen } from "@/app/(app)/not-found.screen";
import { AsGuestView } from "@/components/app/share/as-guest-view";
import {
  ALBUM_WIDTH_COOKIE,
  parseAlbumWidth,
} from "@/components/shared/album-window-plan";
import { getEvent } from "@/lib/db/queries/events";
import { AS_GUEST_FRAMED, AS_GUEST_FRAMED_PARAM } from "@/lib/event/sections";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
} from "@/lib/shared/tile-size-cookie";

// The album's first window is presigned per request, and the view is her album as it stands: never cached.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  // An event that is gone or never this host's is titled as the 404 it is (the hub's page says why).
  return event
    ? { title: `As a guest · ${event.name}`, robots: { index: false } }
    : appNotFoundMetadata;
}

/**
 * SEE IT AS A GUEST, AS A PAGE (event-header r2, `rooms=over`): her album exactly as a let-in guest meets it, from the
 * guests' own read (`as-guest.server.ts`) drawn by the guest page's own pieces (`as-guest-view.tsx`). Her hub opens it
 * in a phone over the dimmed hub at a desk and as the whole screen in a hand (`as-guest-stage.tsx`, framed: the hub's
 * stage carries the way back); "Open it in a new tab" opens it here, where its header's way back is its own.
 *
 * ★ IT IS NEVER THE GUEST PAGE ITSELF (`/e/<token>`, `wait-wiring`'s): there her session is the owner, and the owner
 * meets no door, holds her own uploads to delete and sees the reel's host extras. This page reads as a guest and
 * shows as one.
 */
export default async function AsGuestPage({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  const framed =
    (await searchParams)[AS_GUEST_FRAMED_PARAM] === AS_GUEST_FRAMED;
  // ★ THE ONE READ THAT DECIDES IT COMES FIRST (crumbs-28): an event gone, never hers, or no id at all draws the host
  // app's own not-found, here and never thrown, with nothing else read (the guests' read asks it again, cached).
  const view = (await getEvent(eventId)) ? await readView(eventId) : null;
  if (!view) return <AsGuestNotFound />;
  const { read, rowStep, albumWidth, rhythmSeed } = view;
  const { event } = read;
  return (
    <AsGuestView
      event={{
        id: event.id,
        qr_token: event.qr_token,
        name: event.name,
        description: event.description,
        event_date: event.event_date,
        host_display_name: event.host_display_name,
        qr_style: event.qr_style,
        accepting_uploads: event.accepting_uploads,
        show_reel: event.show_reel,
        capture: event.capture,
      }}
      joinUrl={read.joinUrl}
      galleryPromise={read.galleryPromise}
      stats={read.stats}
      host={read.host}
      guests={read.guests}
      shut={read.shut}
      initialRowStep={rowStep}
      firstPaintWidth={albumWidth}
      rhythmSeed={rhythmSeed}
      back={framed ? null : `/dashboard/${event.id}`}
    />
  );
}

/**
 * The guests' read with the album's first paint decided before any byte, as the guest page decides it: the density
 * step and the width the album last laid its rows at, and a fresh rhythm per visit. Null where the door shows nothing.
 */
async function readView(eventId: string) {
  const jar = await cookies();
  const rowStep = resolveRowStep(jar.get(TILE_SIZE_COOKIE)?.value);
  const albumWidth = parseAlbumWidth(jar.get(ALBUM_WIDTH_COOKIE)?.value);
  const rhythmSeed = randomInt(1_000_000);
  const read = await readAsGuest(eventId, {
    step: rowStep,
    rhythm: "double",
    seed: rhythmSeed,
    width: albumWidth,
  });
  return read ? { read, rowStep, albumWidth, rhythmSeed } : null;
}

/** The host app's own not-found, in the guest canvas: this group draws no shell to stand it in (as `(print)`'s). */
function AsGuestNotFound() {
  return (
    <main className="flex flex-1 flex-col px-5 py-8">
      <AppNotFoundScreen />
    </main>
  );
}
