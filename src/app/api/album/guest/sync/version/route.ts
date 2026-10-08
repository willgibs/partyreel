import { NextResponse } from "next/server";
import { z } from "zod";

import {
  albumEdgeKey,
  albumIsOpenToAnyone,
  fullAlbumEtag,
} from "@/app/api/album/guest/sync/edge.server";
import {
  ALBUM_EDGE_WINDOW_MS,
  ALBUM_TOKEN_HEADER,
  windowInReach,
  type AlbumVersionAnswer,
} from "@/lib/album/edge-version";
import { readGuestAlbumVersions } from "@/lib/db/queries/album-guest";
import { getEventByQrTokenForAnyone } from "@/lib/db/queries/guest-events";
import { developIfDue } from "@/lib/disposable/develop.server";
import { loadGalleryReel } from "@/lib/events/gallery-access.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AN OPEN ALBUM'S "HAS ANYTHING CHANGED?", FOR THE CDN TO KEEP (X5; the why is `lib/album/edge-version.ts`).
 * `GET ?k=<the album's edge key>&w=<the window>`, the capability in the `x-album-token` header.
 *
 * WHAT IT ANSWERS: `{kind: "version", v}`, the album's full-access validator (the sync's own ETag, one recipe:
 * `edge.server.ts`), and the only answer the CDN may keep, for its window alone; `{kind: "ask"}` for anything
 * else (unknown, private, a door, a password, an email or an upload asked first), saying nothing of which; or
 * `{kind: "clock", now}` for a window off this server's clock. A malformed ask, or a key that is not the
 * token's, is a 400. None of those is kept anywhere.
 *
 * ★ NOTHING HERE KNOWS WHO IS ASKING, ON PURPOSE. The CDN hands one fill to every holder of the URL, so the
 * answer must be nobody's: the event is read with no identity (`getEventByQrTokenForAnyone`: no session, so no
 * block masks it and no owner unmasks it), no cookie and no session is read, nothing is written to the
 * response but the answer (never a `Set-Cookie`, which would also stop the CDN keeping it), and the browser
 * sends no cookie at all (`credentials: "omit"`, the transport). The viewer's own answer is the sync route's.
 *
 * ★ THE DEVELOP, AS THE POLL ALWAYS ASKED IT: an album the read says is due develops before its version is read
 * (`developIfDue`), so a parked room's next window is still the write that moves the album for everyone; it
 * costs nothing more than the sync route's own, once a window at most.
 *
 * No request limiter, like the sync route it stands in front of: a read behind the capability, and the CDN
 * answers a lit room's repeats without running this at all.
 */
const querySchema = z.object({
  k: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  w: z.string().regex(/^\d{1,15}$/),
});
const tokenSchema = z.string().min(1).max(200);

/** A shared answer: the browser may reuse nothing unasked, and the CDN keeps it for its window (and Vercel alone sees that). */
const SHARED_HEADERS = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Vercel-CDN-Cache-Control": `max-age=${ALBUM_EDGE_WINDOW_MS / 1000}`,
};
const NO_STORE = "private, no-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = querySchema.safeParse({
    k: url.searchParams.get("k"),
    w: url.searchParams.get("w"),
  });
  const token = tokenSchema.safeParse(request.headers.get(ALBUM_TOKEN_HEADER));
  // The key must be this token's: no one fills one album's key with another album's answer.
  if (
    !query.success ||
    !token.success ||
    albumEdgeKey(token.data) !== query.data.k
  ) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400, headers: { "Cache-Control": NO_STORE } },
    );
  }

  const now = Date.now();
  if (!windowInReach(Number(query.data.w), now))
    return unshared({ kind: "clock", now });

  const read = await getEventByQrTokenForAnyone(token.data);
  if (!read.ok || !albumIsOpenToAnyone(read.data))
    return unshared({ kind: "ask" });
  const event = read.data;

  await developIfDue(event);
  // An open album reads for anyone (the reads' own gate passes it without a cookie); a refusal here would be
  // the gate disagreeing with the decision, which the sync route answers and reports for the viewer.
  const versions = await readGuestAlbumVersions(event);
  if (!versions) return unshared({ kind: "ask" });
  const reel = await loadGalleryReel(event, "full");
  const answer: AlbumVersionAnswer = {
    kind: "version",
    v: fullAlbumEtag(event, reel, versions),
  };
  return NextResponse.json(answer, { headers: SHARED_HEADERS });
}

/** An answer no cache keeps: the same for everyone, but never the open album's, so never shared. */
function unshared(answer: AlbumVersionAnswer) {
  return NextResponse.json(answer, { headers: { "Cache-Control": NO_STORE } });
}
