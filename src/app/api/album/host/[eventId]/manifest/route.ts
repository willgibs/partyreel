import { NextResponse } from "next/server";
import { z } from "zod";

import { readHostManifestPage } from "@/lib/db/queries/album-host";
import { getEvent } from "@/lib/db/queries/events";
import {
  ALBUM_MANIFEST_PAGE,
  parseCursor,
  type AlbumManifestPageBody,
} from "@/lib/events/album-wire";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE REST OF A LONG HOST MANIFEST: the guest manifest route's twin (album/guest/manifest), for an
 * album past `ALBUM_MANIFEST_PAGE` items. Body: `{ after }`, the cursor the previous page returned.
 * Auth as the host's poll: `getUser()`, then the event through RLS, a 404 for anything else.
 */
const bodySchema = z.object({ after: z.unknown() });

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
  const after = parsed.success ? parseCursor(parsed.data.after) : null;
  if (!after) return badRequest();

  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "No such event." },
      { status: 404 },
    );
  }

  const page = await readHostManifestPage(
    supabase,
    event.id,
    after,
    ALBUM_MANIFEST_PAGE,
  );
  const payload: AlbumManifestPageBody = {
    ok: true,
    access: "full",
    gate: null,
    entries: page.entries,
    next: page.next,
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function badRequest() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}
