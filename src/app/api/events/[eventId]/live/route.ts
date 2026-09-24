import { NextResponse } from "next/server";

import { getEvent } from "@/lib/db/queries/events";
import { readAlbumCounts, readNewestAlbumUpdate } from "@/lib/db/queries/media";
import { hostEtag } from "@/lib/events/host-fingerprint";
import { createClient } from "@/lib/supabase/server";

// Reads auth cookies and runs RLS-scoped reads (Node).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * IS ANYTHING NEW? — the host hub's cheap question (Will, `first=live`,
 * 2026-09-21: "It lands while she is looking. The empty room gives way to the
 * tile, the count moves, a Live pip").
 *
 * ★ WHY THIS ROUTE EXISTS AT ALL, GIVEN THE DOORBELL. The Realtime doorbell the
 * hub subscribes to fires from a DB trigger that watches the APPROVED-VISIBLE
 * set (`20260611220000_gallery_doorbell.sql`, lines 28-45), so on a moderated
 * event a guest's upload lands in Review and rings nobody. The host is the one
 * person who needs to hear that. This route is the second channel, and it is
 * deliberately the cheapest thing in the product that can answer: two head
 * counts and a one-row read (the host fingerprint says why those three), no
 * presigns, and a 304 with no body at all when nothing moved. Its cost does not
 * grow with the album: nothing here lists media, so no read can stop at 1,000.
 *
 * ★ AND WHY IT ANSWERS A QUESTION RATHER THAN RETURNING AN ALBUM. The hub page
 * is a dozen queries plus three presigns per item. A poll that fetched the album
 * would be the most expensive poll in the product and would still not update
 * the page, which is server-rendered. So the client asks this, and only a
 * CHANGED answer spends a `router.refresh()`. Nothing refreshes on a timer.
 *
 * AUTH: `getUser()` re-validates the JWT (the proxy refreshes the cookie and is
 * not a security boundary), and the event comes back through `getEvent`, which
 * is RLS-scoped and filters `deleted_at` — a foreign, missing or deleted event
 * resolves to null and is answered as a 404 rather than as a refusal, so this
 * route never reveals that an event exists.
 */
export async function GET(
  request: Request,
  // Next 16: params is a Promise.
  { params }: { params: Promise<{ eventId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in." },
      { status: 401 },
    );
  }

  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "No such event." },
      { status: 404 },
    );
  }

  // The same split the hub page makes: pending lives in the Review room,
  // approved and hidden are the album, and removed (the bin) is in neither.
  const [{ album, pending }, newestUpdatedAt] = await Promise.all([
    readAlbumCounts(supabase, event.id),
    readNewestAlbumUpdate(supabase, event.id),
  ]);

  const etag = hostEtag({
    eventId: event.id,
    album,
    pending,
    newestUpdatedAt,
  });
  const headers = {
    ETag: etag,
    // A validator is only ever useful against the origin: a shared cache must
    // never hold one host's answer, and a browser cache must not answer for us.
    "Cache-Control": "private, no-store",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  return NextResponse.json(
    { ok: true, etag, pending, count: album },
    { headers },
  );
}
