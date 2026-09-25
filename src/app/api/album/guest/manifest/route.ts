import { NextResponse } from "next/server";
import { z } from "zod";

import { readGuestManifestPage } from "@/lib/db/queries/album-guest";
import { resolveAlbumViewer } from "@/lib/events/album-viewer.server";
import {
  ALBUM_MANIFEST_PAGE,
  parseCursor,
  type AlbumManifestPageBody,
} from "@/lib/events/album-wire";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE REST OF A LONG MANIFEST, FOR A GUEST. The poll's manifest carries its first
 * `ALBUM_MANIFEST_PAGE` entries and a `next` cursor when the album is longer; the client pages the
 * rest here, `{ qr_token, after, session_token? }`, each page answering the next cursor until null.
 *
 * Every page re-checks the decision, so a guest who loses full access mid-read (a host who turns a
 * gate on, a password cookie that expires) gets an empty page and the poll's own answer next. The
 * pages carry no version: the client holds the one its poll read BEFORE the first page, which is what
 * makes a change landing between two pages arrive by the next delta rather than go missing.
 */
const bodySchema = z.object({
  qr_token: z.string().min(1).max(200),
  after: z.unknown(),
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
  const after = parseCursor(parsed.data.after);
  if (!after) return badRequest();

  const viewer = await resolveAlbumViewer(
    parsed.data.qr_token,
    parsed.data.session_token,
  );
  const decision =
    viewer.kind === "gone"
      ? { access: "none" as const, gate: null }
      : viewer.decision;
  const page =
    viewer.kind === "viewer" && decision.access === "full"
      ? await readGuestManifestPage(viewer.event, after, ALBUM_MANIFEST_PAGE)
      : null;

  const payload: AlbumManifestPageBody = {
    ok: true,
    access: page ? "full" : decision.access,
    gate: page ? null : decision.gate,
    entries: page?.entries ?? [],
    next: page?.next ?? null,
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function badRequest() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}
