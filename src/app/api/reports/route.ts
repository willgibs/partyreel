import { NextResponse } from "next/server";

import { createReport } from "@/lib/db/mutations/report";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { reportSchema } from "@/lib/validation/report";

// POST a public report against an event (or a specific item). Anonymous: the
// qr_token in the body is the capability (ADR-0004); create_report validates
// it inside the RPC. INSERT-ONLY — reporting never hides content (anti-griefing),
// an operator reviews via /admin.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid report." },
      { status: 400 },
    );
  }

  const { qr_token, media_id, reason } = parsed.data;

  // Abuse limiter: report-bombing one event (per-(IP,event) cap) or across many hosts (cross-event breadth)
  // trips; a venue's rare legit reports never do. Fail OPEN — the qr_token capability is the real gate.
  let reportKeys: { ipHash: string; scopeHash: string } | null = null;
  try {
    reportKeys = abuseHashes(clientIp(request.headers), "report", qr_token);
    const gate = await checkAbuseRate(
      "report",
      reportKeys.ipHash,
      reportKeys.scopeHash,
    );
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message:
            "Too many reports from this network right now. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "report",
    });
    reportKeys = null;
  }

  const result = await createReport({
    qrToken: qr_token,
    mediaId: media_id ?? null,
    reason: reason || null,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "invalid_media"
          ? 400
          : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  if (reportKeys) {
    await recordAbuseEvent(
      "report",
      reportKeys.ipHash,
      reportKeys.scopeHash,
    ).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
