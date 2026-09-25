import { NextResponse } from "next/server";
import { z } from "zod";

import { readGuestAlbumMedia } from "@/lib/db/queries/album-guest";
import { toGuestAlbumLinks } from "@/lib/events/album-guest-links";
import { resolveAlbumViewer } from "@/lib/events/album-viewer.server";
import {
  ALBUM_MEDIA_MAX_IDS,
  isAlbumId,
  type AlbumLinksBody,
} from "@/lib/events/album-wire";
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LINKS BY ID, FOR A GUEST: presigned links for the items a window has on screen or about to play,
 * never the whole album. Body: `{ qr_token, ids, session_token? }`, at most `ALBUM_MEDIA_MAX_IDS`
 * distinct ids.
 *
 * Only a viewer the decision lets in whole (`full`) gets links; a teaser or locked viewer, a private
 * or unknown album, and a password album without its unlock cookie get none, every asked id back in
 * `missing` (the teaser's nine travel inline on the poll). An id that is unknown, gone, held, hidden
 * or another album's is `missing` too, so the answer says nothing about which. The rows are read by
 * id (`inChunks`), minted in the current presign bucket (`b`, read before minting, so a bucket that
 * rolls mid-request only makes a link outlive the client's estimate), and attributed by name and two
 * flags, never an address (`album-guest-links.ts`).
 *
 * Nothing here writes a cookie: the heal is the poll's (album-viewer.server.ts).
 */
const bodySchema = z.object({
  qr_token: z.string().min(1).max(200),
  ids: z.array(z.string()).min(1).max(ALBUM_MEDIA_MAX_IDS),
  session_token: z.string().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return badRequest();
  const ids = [...new Set(parsed.data.ids)];
  // A malformed id can never be a media id: refused whole, like any malformed body.
  if (!ids.every(isAlbumId)) return badRequest();

  const viewer = await resolveAlbumViewer(
    parsed.data.qr_token,
    parsed.data.session_token,
  );
  if (viewer.kind === "gone") return nothing(ids, "none", null);
  if (viewer.decision.access !== "full") {
    return nothing(ids, viewer.decision.access, viewer.decision.gate);
  }

  const bucket = Number(presignBucketId(Date.now()));
  const now = Date.now();
  const read = await readGuestAlbumMedia(viewer.event, ids, {
    attribute: !viewer.isDemo,
  });
  if (!read) return nothing(ids, "none", viewer.decision.gate);

  const links = await toGuestAlbumLinks(read.rows, {
    eventName: viewer.event.name,
    presign: (key, downloadFilename) =>
      presignDownload({ key, stable: true, downloadFilename }),
    identities: read.identities,
  });
  const found = new Set(read.rows.map((r) => r.id));
  const payload: AlbumLinksBody = {
    ok: true,
    access: "full",
    gate: null,
    b: bucket,
    now,
    links,
    missing: ids.filter((id) => !found.has(id)),
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function badRequest() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}

/** No links at all: every asked id comes back missing. */
function nothing(
  ids: string[],
  access: GalleryAccess,
  gate: GalleryGate | null,
) {
  const payload: AlbumLinksBody = {
    ok: true,
    access,
    gate,
    b: Number(presignBucketId(Date.now())),
    now: Date.now(),
    links: [],
    missing: ids,
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
