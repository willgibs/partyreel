import { NextResponse } from "next/server";
import { z } from "zod";

import { readHostAlbumMedia } from "@/lib/db/queries/album-host";
import { getEvent } from "@/lib/db/queries/events";
import { toHostAlbumLinks } from "@/lib/events/album-host-links";
import {
  ALBUM_MEDIA_MAX_IDS,
  isAlbumId,
  type AlbumLinksBody,
  type HostWhoTuple,
} from "@/lib/events/album-wire";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LINKS BY ID, FOR THE HOST: the guest's links (album/guest/media) for the host's own album, which
 * includes what a guest never sees (held and hidden items), each with its uploader's PROVED email
 * where there is one (resolveUploaderIdentity's rule; the host's mapper is the only builder that
 * carries an address). Body: `{ ids }`, at most `ALBUM_MEDIA_MAX_IDS`. An id that is unknown, in the
 * bin or another event's comes back `missing`. Auth as the host's poll: `getUser()`, then the event
 * through RLS, a 404 for anything that is not the caller's.
 */
const bodySchema = z.object({
  ids: z.array(z.string()).min(1).max(ALBUM_MEDIA_MAX_IDS),
});

export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return badRequest();
  const ids = [...new Set(parsed.data.ids)];
  if (!ids.every(isAlbumId)) return badRequest();

  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "No such event." },
      { status: 404 },
    );
  }

  const bucket = Number(presignBucketId(Date.now()));
  const now = Date.now();
  const { rows, identities } = await readHostAlbumMedia(
    supabase,
    event.id,
    ids,
  );
  const links = await toHostAlbumLinks(rows, {
    eventName: event.name,
    presign: (key, downloadFilename) =>
      presignDownload({ key, stable: true, downloadFilename }),
    identities,
  });
  const found = new Set(rows.map((r) => r.id));
  const payload: AlbumLinksBody<HostWhoTuple> = {
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
