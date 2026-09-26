import { NextResponse } from "next/server";
import { z } from "zod";

import { getEvent } from "@/lib/db/queries/events";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { ALBUM_MEDIA_MAX_IDS, isAlbumId } from "@/lib/events/album-wire";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LINKS BY ID, FOR THE HOST: the guest's links (album/guest/media) for the host's own album, which
 * includes what a guest never sees (held and hidden items), each with its uploader's PROVED email
 * where there is one (resolveUploaderIdentity's rule; the host's mapper is the only builder that
 * carries an address) and its like count (`likes`, host-only: the guest's answer has no place for
 * one). Body: `{ ids }`, at most `ALBUM_MEDIA_MAX_IDS`. An id that is unknown, in the bin or another
 * event's comes back `missing`. The answer's one builder is `readHostLinksBody`, which the hub page
 * calls for its first window. Auth as the host's poll: `getUser()`, then the event through RLS, a 404
 * for anything that is not the caller's.
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

  const payload = await readHostLinksBody(supabase, event, ids);
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function badRequest() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}
