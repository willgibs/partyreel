import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { getGuestCount } from "@/lib/db/queries/guest-events-admin";
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
 * payload). ★ A PENDING HEAL CARRIES NO ETAG (the door re-check's follow-up, `heal-validator`,
 * 2026-09-22): the earlier fix (DEFECT 2, `door-fixes`, 2026-09-21) believed the FUNCTION's own
 * `new Response(null, { status: 304, headers })` was the thing dropping `Set-Cookie`, and that
 * answering 200 instead dodged it. The re-check on the alias found the truth one step upstream:
 * VERCEL'S EDGE ITSELF converts a 200 into a 304 whenever the request's If-None-Match equals THAT
 * 200's own ETag, and it is the edge's conversion that drops `Set-Cookie`, whatever status the
 * function answered with (measured: an identical request with a non-matching validator got the
 * function's 200 intact with the cookie; the matching one got `HTTP/2 304` with the ETag echoed
 * and `Set-Cookie` gone, `x-vercel-cache: MISS` both times — the function ran both times). So the
 * function's status code was never the lever: a response the browser MUST receive can carry no
 * validator the browser might present back. While `bodyToken` differs from the cookie this
 * answers 200 with the real payload and deletes the ETag header entirely — one extra full
 * response per device per sixty days, with nothing left for the edge to match — and only a
 * validator match with NO heal pending still 304s (nothing to heal, so nothing is lost if the
 * edge rewrites it).
 *
 * ★ THE GUEST COUNT RIDES A 200, NEVER THE VALIDATOR. The header's "from M guests" is the server's
 * number (guest-flow.md, "Stats"), and a guest's own first upload is what moves it: only the server
 * can say whether that upload made a NEW guest. It is read AFTER the 304 check, so the steady poll
 * pays nothing for it; the change that moves it (an approved upload, a removal, a name, a
 * confirmation) changes the payload the ETag hashes, so it arrives on the same 200. Never on a
 * locked page (`none`), which reveals the name and the count of photographs only.
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
  let healPending = false;
  if (bodyToken && bodyToken !== cookieToken) {
    healPending = true;
    const write = guestSessionCookieWrite(event.data.id, bodyToken);
    if (write) headers.append("Set-Cookie", guestCookieHeaderValue(write));
    // ★ NO ETAG ON A PENDING HEAL. Vercel's edge, not this function, is what turns a matching
    // conditional request into a 304 and strips Set-Cookie doing it — so the only response the
    // edge can never rewrite is one with no validator on it at all. Deleting it here, rather than
    // returning a 304 ourselves, is the actual fix (see the head comment).
    headers.delete("ETag");
  }

  // Exact-match only (our poll client is the sole caller; no weak/list parsing). Never trips while
  // a heal is pending: that response carries no ETag above, so no If-None-Match could ever equal
  // it. A settled cookie with a matching validator still answers 304 here — nothing to heal, so it
  // costs nothing if Vercel's edge would have rewritten it anyway.
  if (!healPending && request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const [items, guestCount] = await Promise.all([
    presignGalleryRows(event.data, gallery),
    access === "none" || isDemo
      ? Promise.resolve(undefined)
      : getGuestCount(event.data),
  ]);
  return NextResponse.json(
    {
      ok: true,
      items,
      access,
      gate: decision.gate,
      teaserTotal: gallery.teaserTotal,
      ...(guestCount === undefined ? {} : { guestCount }),
    },
    { headers },
  );
}
