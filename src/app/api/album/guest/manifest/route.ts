import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ALBUM_REFUSED,
  readGuestManifestPage,
} from "@/lib/db/queries/album-guest";
import { resolveAlbumViewer } from "@/lib/events/album-viewer.server";
import {
  ALBUM_MANIFEST_PAGE,
  parseCursor,
  type AlbumManifestPageBody,
} from "@/lib/events/album-wire";
import { reportAlbumRefused } from "@/lib/events/gallery-access.server";

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
 *
 * ★ AN EMPTY PAGE NEVER SAYS `full`. The client adopts a `full` page with no `next` as the album's
 * last one, so a page the reads' own gate refused answers locked (and is reported), never the empty
 * `full` page that would cut the album short on the client.
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
  if (viewer.kind === "gone") return noPage({ access: "none", gate: null });
  if (viewer.decision.access !== "full") return noPage(viewer.decision);

  const page = await readGuestManifestPage(
    viewer.event,
    after,
    ALBUM_MANIFEST_PAGE,
  );
  if (!page) {
    reportAlbumRefused(viewer.event.id, "manifest");
    return noPage(ALBUM_REFUSED);
  }
  return answer({
    ok: true,
    access: "full",
    gate: null,
    entries: page.entries,
    next: page.next,
  });
}

/** No page for this viewer: an empty one, carrying the door in front of them. */
function noPage(decision: Pick<AlbumManifestPageBody, "access" | "gate">) {
  return answer({
    ok: true,
    access: decision.access,
    gate: decision.gate,
    entries: [],
    next: null,
  });
}

function answer(payload: AlbumManifestPageBody) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function badRequest() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}
