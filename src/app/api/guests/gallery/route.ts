import { NextResponse } from "next/server";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import { resolveGalleryAccess } from "@/lib/events/gallery-access";
import {
  galleryEtagFor,
  isEventOwner,
  loadGalleryRowsForAccess,
  presignGalleryRows,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Poll target for the guest event page's LIVE gallery. Body: { qr_token }. Returns the access-capped
// approved media (newest-first, presigned) + the resolved access level. This is a media surface, so it
// enforces the SAME gallery access as the page (resolveGalleryAccess + the gallery loaders): gating
// only the RSC would be trivially bypassed by calling here directly. An account-required (or password)
// event caps a signed-out viewer to the teaser; the full set never leaves the server.
//
// CONDITIONAL (Phase 3): the response carries a strong ETag (content + access + presign bucket,
// gallery-fingerprint.ts); a matching If-None-Match answers a bare 304 BEFORE any presigning, so the
// steady-state poll costs one rows query and ~0 bytes. SECURITY: access is part of the fingerprint --
// an ETag can never validate across access levels (red-teamed). The not-found/private early return
// deliberately carries NO ETag (it must never 304-validate a real payload).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  const qrToken =
    body && typeof body === "object" && "qr_token" in body
      ? (body as { qr_token: unknown }).qr_token
      : null;
  if (typeof qrToken !== "string" || qrToken.length === 0) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  const event = await getEventByQrToken(qrToken);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json({
      ok: true,
      items: [],
      access: "none",
      teaserTotal: null,
    });
  }

  // Same access computation as the RSC. Skip the demo (always full). Authorize with getUser(), never
  // getSession(); the owner select runs only when signed in.
  const isDemo = isDemoToken(qrToken);
  let isAuthed = false;
  let isOwner = false;
  if (!isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isEventOwner(event.data.id, user.id, supabase);
    }
  }
  const unlocked =
    event.data.visibility === "password"
      ? await isUnlocked(event.data.id)
      : true;
  const access = isDemo
    ? "full"
    : resolveGalleryAccess(event.data, {
        isOwner,
        isAuthed,
        isUnlocked: unlocked,
      });
  const gallery = await loadGalleryRowsForAccess(event.data, access);
  const etag = galleryEtagFor(access, gallery);
  const headers = { ETag: etag, "Cache-Control": "private, no-store" };

  // Exact-match only (our poll client is the sole caller; no weak/list parsing).
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const items = await presignGalleryRows(event.data, gallery);
  return NextResponse.json(
    { ok: true, items, access, teaserTotal: gallery.teaserTotal },
    { headers },
  );
}
