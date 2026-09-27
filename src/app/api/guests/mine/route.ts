/**
 * WHICH PHOTOGRAPHS IN THIS ALBUM ARE THIS ANONYMOUS GUEST'S. Body:
 * `{ qr_token, session_token }` → `{ ok: true, ids: [...] }`.
 *
 * A guest can delete any photo they personally uploaded, with no time limit.
 * A signed-in viewer's list is computed in the page RSC (it
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

import {
  listOwnUploadStatuses,
  listSessionMediaIds,
} from "@/lib/db/mutations/guest-media";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { TRACKER_TELLS_REFUSAL } from "@/lib/guest/upload-tracker";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mineSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
});

/**
 * ★ HER TRACKER'S ASK (`statuses: true`, `guest-capture` r1 `tracker=button`): where each of her
 * uploads here stands, `{ ok, items: [{ id, status }] }`, newest first. The one place a refusal can
 * be learned, since the album's sync moves only in and out of `approved` (`listOwnUploadStatuses`
 * says why). The token is optional here because an ACCOUNT speaks for its own rows: signed in, the
 * viewer is `getUser()`'s (never `getSession()`, a cookie is no boundary), and the answer is the
 * token's unclaimed row plus the account's rows at this event. Statuses only, of her own uploads:
 * never an identity, never a link.
 */
const statusesSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1).optional(),
  statuses: z.literal(true),
});

/** The empty answer, used for every "no" this route is allowed to give. */
const NONE = { ok: true as const, ids: [] as string[] };

/** Every answer is per viewer: never cacheable. */
const PRIVATE = { "Cache-Control": "private, no-store" };

/**
 * The join limiter's BREADTH signal, checked and not recorded. Checked, because one IP asking about
 * many DISTINCT events is a token harvester and a venue is exactly one event. Not recorded, because
 * this runs once per guest page load: counting it into the per-(IP, event) backstop would let a busy
 * venue's ordinary browsing consume a ceiling that was sized for joins. Fails OPEN, like every other
 * guest route — the session token is the gate. Returns the refusal, or null to go on.
 */
async function breadthRefusal(
  request: Request,
  qrToken: string,
): Promise<Response | null> {
  try {
    const keys = abuseHashes(clientIp(request.headers), "join", qrToken);
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
  return null;
}

async function answerStatuses(
  request: Request,
  input: { qr_token: string; session_token?: string },
): Promise<Response> {
  const refused = await breadthRefusal(request, input.qr_token);
  if (refused) return refused;

  const event = await getEventByQrToken(input.qr_token);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json({ ok: true, items: [] }, { headers: PRIVATE });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const items = await listOwnUploadStatuses({
    eventId: event.data.id,
    sessionToken: input.session_token ?? null,
    userId: user?.id ?? null,
  });
  // `host-curation`'s `told` is the flag's to answer: at `never` a refusal is not hers to learn.
  const told = TRACKER_TELLS_REFUSAL
    ? items
    : items.filter((item) => item.status !== "refused");
  return NextResponse.json({ ok: true, items: told }, { headers: PRIVATE });
}

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

  const asked = statusesSchema.safeParse(body);
  if (asked.success) return answerStatuses(request, asked.data);

  const parsed = mineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token, session_token } = parsed.data;

  const refused = await breadthRefusal(request, qr_token);
  if (refused) return refused;

  const event = await getEventByQrToken(qr_token);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json(NONE);
  }

  const ids = await listSessionMediaIds({
    eventId: event.data.id,
    sessionToken: session_token,
  });
  // Never cacheable: the answer is per session token.
  return NextResponse.json({ ok: true, ids }, { headers: PRIVATE });
}
