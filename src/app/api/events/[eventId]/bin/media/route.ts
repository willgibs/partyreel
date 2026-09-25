import { NextResponse } from "next/server";
import { z } from "zod";

import { getEvent } from "@/lib/db/queries/events";
import { readBinMediaByIds } from "@/lib/db/queries/media";
import { BIN_MEDIA_MAX_IDS, type BinLinksBody } from "@/lib/event/bin";
import { isAlbumId } from "@/lib/events/album-wire";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A WINDOW OF THE BIN'S LINKS (the paged bin, `lib/event/bin.ts`). Body: `{ ids }`, at most
 * `BIN_MEDIA_MAX_IDS`. Each id still in this event's bin (removed by the host, inside the window) comes
 * back with its tile (the preview, or the original) and its inline original, stable-presigned and
 * dated the album's way (the bucket read BEFORE minting, and the server's clock), so the album's link
 * store dates and re-mints them. No attachment: nothing is saved from the bin. Anything else (restored
 * since, purged, a guest's own withdrawal, another event's) is `missing`.
 *
 * AUTH: as the bin's list: `getUser()`, then the event through RLS, a 404 for anything else.
 */
const bodySchema = z.object({
  ids: z.array(z.string()).min(1).max(BIN_MEDIA_MAX_IDS),
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

  const b = Number(presignBucketId(Date.now()));
  const now = Date.now();
  const rows = await readBinMediaByIds(supabase, event.id, ids, now);
  const links = await Promise.all(
    rows.map(async (m) => {
      const [view, preview] = await Promise.all([
        presignDownload({ key: m.original_key, stable: true }),
        m.preview_key
          ? presignDownload({ key: m.preview_key, stable: true })
          : Promise.resolve(null),
      ]);
      return [m.id, preview ?? view, preview ? view : null, "", null] as const;
    }),
  );
  const found = new Set(rows.map((r) => r.id));
  const payload: BinLinksBody = {
    ok: true,
    access: "full",
    gate: null,
    b,
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
