import { NextResponse } from "next/server";

import { getEvent } from "@/lib/db/queries/events";
import { listRecentlyDeletedMedia } from "@/lib/db/queries/media";
import { toBinEntry, type BinManifestBody } from "@/lib/event/bin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE BIN'S LIST, FOR THE HUB'S DELETED FILTER (the paged bin, `lib/event/bin.ts`): every item the
 * host can still restore, newest-removed first, as ids, shapes and countdowns with no link at all.
 * The windowed rows then ask `bin/media` for the links of what they mount.
 *
 * The list is the bin's own read (`listRecentlyDeletedMedia`: removed by the host, never a guest's own
 * withdrawal, inside the recovery window, read whole on a keyset), so what this answers is exactly
 * what Restore can act on.
 *
 * AUTH: `getUser()` re-validates the JWT (the proxy is no boundary), and the event comes back through
 * `getEvent`, RLS-scoped and filtered on `deleted_at`: a foreign, missing or deleted event is a 404,
 * never a refusal, so this route never says an event exists.
 */
export async function GET(
  _request: Request,
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

  const rows = await listRecentlyDeletedMedia(event.id);
  const payload: BinManifestBody = {
    ok: true,
    entries: rows.map(toBinEntry),
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
