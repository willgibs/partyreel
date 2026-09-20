/**
 * AN ANONYMOUS GUEST REMOVES THEIR OWN PHOTOGRAPH. Body:
 * `{ qr_token, session_token, media_id }`.
 *
 * Will, `yours`, 2026-09-20: "A guest can delete any photo they've personally
 * uploaded, ever." His answer at approval: final for the host too.
 *
 * A signed-in guest does NOT come through here — they have an account, so
 * `removeMyUploadGuestAction` (the page's Server Function) calls
 * `remove_my_upload` under their own session, from any device, for ever. This
 * route is the path for the identity that has nothing else: the device-bound
 * session token on the guest row.
 *
 * ★ THE TOKEN IS NEVER A CLAIM. `remove_my_upload_by_session` is service-role
 * only (revoked from public, anon and authenticated: database-security.md) and
 * validates the token INSIDE the function against the media's own guest row —
 * unclaimed, same event, event not deleted. So this route holds no ownership
 * logic of its own and could not be tricked into skipping any.
 *
 * ★ A WRONG TOKEN AND SOMEBODY ELSE'S PHOTOGRAPH ANSWER DIFFERENTLY ON PURPOSE,
 * and neither answer leaks: a malformed token is 403 (it is not a token at
 * all), while a well-formed token that simply does not own this media is 404 —
 * the same 404 as a media id that does not exist. Nothing here ever says "that
 * one is someone else's".
 *
 * Idempotent: removing an already-removed photograph is a 200. The tile is gone
 * either way, and a second tap on a slow phone must not read as a failure.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { removeMyUploadBySession } from "@/lib/db/mutations/guest-media";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const removeSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
  media_id: z.uuid(),
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

  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token, session_token, media_id } = parsed.data;

  // The join limiter (venue-safe: breadth catches a scraper walking many
  // events, the per-(IP, event) backstop catches a runaway bot; a wedding is
  // ONE event and never trips it). Fails OPEN on a limiter outage, like every
  // guest route — the RPC's own ownership check is the real gate.
  let keys: { ipHash: string; scopeHash: string } | null = null;
  try {
    keys = abuseHashes(clientIp(request.headers), "join", qr_token);
    const gate = await checkAbuseRate("join", keys.ipHash, keys.scopeHash);
    if (!gate.allowed) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "join",
    });
    keys = null;
  }

  // The write inherits the page's read gate: a private event reveals nothing
  // and accepts nothing (the RPC would refuse anyway — this is the belt).
  const event = await getEventByQrToken(qr_token);
  if (!event.ok) {
    return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });
  }
  if (event.data.visibility === "private") {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 403 },
    );
  }

  const outcome = await removeMyUploadBySession({
    sessionToken: session_token,
    mediaId: media_id,
  });

  if (outcome === "removed") {
    // Record the write for the breadth signal (best-effort, never blocking).
    if (keys) {
      await recordAbuseEvent("join", keys.ipHash, keys.scopeHash).catch(
        () => {},
      );
    }
    return NextResponse.json({ ok: true });
  }
  if (outcome === "unauthorized") {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 403 },
    );
  }
  if (outcome === "not_found") {
    return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: false, code: "unknown" }, { status: 500 });
}
