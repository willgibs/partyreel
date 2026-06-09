import { NextResponse } from "next/server";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import { resolveGalleryAccess } from "@/lib/events/gallery-access";
import {
  isEventOwner,
  loadGalleryForAccess,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Poll target for the guest event page's LIVE gallery. Body: { qr_token }. Returns the access-capped
// approved media (newest-first, presigned) + the resolved access level. This is a media surface, so it
// enforces the SAME gallery access as the page (resolveGalleryAccess + loadGalleryForAccess): gating
// only the RSC would be trivially bypassed by calling here directly. An account-required (or password)
// event caps a signed-out viewer to the teaser; the full set never leaves the server.
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
  const { items, teaserTotal } = await loadGalleryForAccess(event.data, access);
  return NextResponse.json({ ok: true, items, access, teaserTotal });
}
