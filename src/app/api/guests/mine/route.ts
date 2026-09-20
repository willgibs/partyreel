/**
 * WHICH PHOTOGRAPHS IN THIS ALBUM ARE THIS ANONYMOUS GUEST'S. Body:
 * `{ qr_token, session_token }` → `{ ok: true, ids: [...] }`.
 *
 * Will, `yours`, 2026-09-20: "A guest can delete any photo they've personally
 * uploaded, ever." A signed-in viewer's list is computed in the page RSC (it
 * already has the user); an ANONYMOUS guest's identity is the device-bound
 * session token, which the page never sees — it lives in the browser's own
 * storage — so the browser asks for the list here and `live-gallery.tsx` caches
 * the answer for the session.
 *
 * ★ THE SERVER DECIDES, NOT THE BROWSER, and that is the whole reason this
 * route exists rather than a client-side ledger of what this tab uploaded. A
 * ledger would cover only uploads made after it shipped, would be lost with the
 * tab, and would be a client ASSERTION of ownership sitting one step away from
 * a delete. The list is read from the guest rows the token actually owns.
 *
 * ★ IT IS NOT IN THE GALLERY PAYLOAD, deliberately. `/api/guests/gallery`'s
 * ETag fingerprints content + access, which is shared by every viewer at that
 * access level; folding a per-VIEWER field into it would either break the
 * conditional poll or leak one guest's list to another.
 *
 * ★ THE TOKEN TRAVELS IN THE BODY, never the URL (a capability in a query
 * string ends up in a log, a referrer and somebody's history).
 *
 * An unknown token, a wrong event, a private event and an empty album all
 * answer the same empty list: from a browser they must be indistinguishable.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { listSessionMediaIds } from "@/lib/db/mutations/guest-media";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mineSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
});

/** The empty answer, used for every "no" this route is allowed to give. */
const NONE = { ok: true as const, ids: [] as string[] };

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

  const parsed = mineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token, session_token } = parsed.data;

  // The join limiter's BREADTH signal, checked and not recorded. Checked,
  // because one IP asking about many DISTINCT events is a token harvester and
  // a venue is exactly one event. Not recorded, because this runs once per
  // guest page load: counting it into the per-(IP, event) backstop would let a
  // busy venue's ordinary browsing consume a ceiling that was sized for joins.
  // Fails OPEN, like every other guest route — the session token is the gate.
  try {
    const keys = abuseHashes(clientIp(request.headers), "join", qr_token);
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
  }

  const event = await getEventByQrToken(qr_token);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json(NONE);
  }

  const ids = await listSessionMediaIds({
    eventId: event.data.id,
    sessionToken: session_token,
  });
  // Never cacheable: the answer is per session token.
  return NextResponse.json(
    { ok: true, ids },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
