import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import type { GalleryDecision } from "@/lib/events/gallery-access";
import {
  galleryEtagFor,
  isEventOwner,
  loadGalleryRowsForAccess,
  presignGalleryRows,
  resolveViewerDecision,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import {
  guestCookieHeaderValue,
  guestSessionCookieWrite,
  isSessionTokenShape,
  readGuestSessionCookie,
} from "@/lib/guest/session-cookie";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Poll target for the guest event page's LIVE gallery. Body: `{ qr_token, session_token? }`.
 * Returns the access-capped approved media (newest-first, presigned), the resolved access level and
 * the GATE behind it. This is a media surface, so it enforces the SAME decision as the page
 * (`resolveViewerDecision` + the gallery loaders): gating only the RSC would be trivially bypassed
 * by calling here directly. An account-required (or password) event caps a signed-out viewer to the
 * teaser; so does an event requiring an upload from a guest who has not made one. The full set
 * never leaves the server.
 *
 * ★ THE SESSION TOKEN IS OPTIONAL, AND IT IS THE HEAL. The server reads the identity from the
 * `pr_guest_<eventId>` cookie, which an RSC can see and localStorage is not. A browser that holds a
 * token from before this round (or on a second device, or after a cookie clear) sends it in the
 * BODY once and this route writes the cookie, so the next render resolves the same guest the
 * browser thinks it is. Only a token that actually RESOLVED to this event's row is written: the
 * decision is made with it first, and nothing is set unless the gate read recognised it.
 *
 * CONDITIONAL (Phase 3): the response carries a strong ETag (content + decision + presign bucket,
 * gallery-fingerprint.ts); a matching If-None-Match answers a bare 304 BEFORE any presigning, so
 * the steady-state poll costs one rows query and ~0 bytes. SECURITY: the access level AND the gate
 * are part of the fingerprint -- an ETag can never validate across either (red-teamed). The
 * not-found/private early return deliberately carries NO ETag (it must never 304-validate a real
 * payload). ★ A 304 CARRIES THE COOKIE TOO: `new Response(null, { status: 304 })` with no headers
 * would drop a heal on the one response the steady-state poll almost always gets.
 */
const bodySchema = z.object({
  qr_token: z.string().min(1),
  /** This browser's stored session token, for the cookie heal. Never trusted beyond a lookup. */
  session_token: z.string().min(1).optional(),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const qrToken = parsed.data.qr_token;

  const event = await getEventByQrToken(qrToken);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json({
      ok: true,
      items: [],
      access: "none",
      gate: null,
      teaserTotal: null,
    });
  }

  // Same decision as the RSC. Skip the demo (always full). Authorize with getUser(), never
  // getSession(); the owner select runs only when signed in.
  const isDemo = isDemoToken(qrToken);
  let isAuthed = false;
  let isOwner = false;
  let userId: string | null = null;
  if (!isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isEventOwner(event.data.id, user.id, supabase);
    }
  }
  const unlocked =
    event.data.visibility === "password"
      ? await isUnlocked(event.data.id)
      : true;

  // The body's token wins over the cookie's ONLY as the identity to resolve with; whether it is
  // then written is decided below, and only when it differs from what the request already carried.
  const cookieToken = isDemo ? null : await readGuestSessionCookie(event.data.id);
  const bodyToken =
    !isDemo && isSessionTokenShape(parsed.data.session_token)
      ? parsed.data.session_token
      : null;
  const sessionToken = bodyToken ?? cookieToken;

  const decision: GalleryDecision = isDemo
    ? { access: "full", gate: null }
    : await resolveViewerDecision(event.data, {
        isOwner,
        isAuthed,
        isUnlocked: unlocked,
        userId,
        sessionToken,
      });
  const access = decision.access;
  const gallery = await loadGalleryRowsForAccess(event.data, access);
  const etag = galleryEtagFor(decision, gallery);
  const headers = new Headers({
    ETag: etag,
    "Cache-Control": "private, no-store",
  });

  /* THE HEAL. A body token that differs from the cookie is adopted, so the next SERVER render
     resolves this guest rather than an anonymous one. Deliberately unconditional on the gate read's
     answer beyond the shape guard: `get_upload_gate` returns the same shape for an unknown token as
     for a known uncontributed one, so "did it resolve" is not observable here, and writing a
     well-formed token that resolves to nothing costs exactly nothing (every consumer looks it up).
     A token that is not 64 hex never gets this far. */
  if (bodyToken && bodyToken !== cookieToken) {
    const write = guestSessionCookieWrite(event.data.id, bodyToken);
    if (write) headers.append("Set-Cookie", guestCookieHeaderValue(write));
  }

  // Exact-match only (our poll client is the sole caller; no weak/list parsing).
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const items = await presignGalleryRows(event.data, gallery);
  return NextResponse.json(
    {
      ok: true,
      items,
      access,
      gate: decision.gate,
      teaserTotal: gallery.teaserTotal,
    },
    { headers },
  );
}
