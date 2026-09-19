import { NextResponse } from "next/server";

import { createReport } from "@/lib/db/mutations/report";
import { createProfileReport } from "@/lib/db/mutations/social";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation/report";

// POST a public report against an event (or a specific item), or against a
// PERSON. Album arm: anonymous, and the qr_token in the body is the capability
// (database-security.md) that create_report validates inside the RPC. Person arm
// (Will, `block=report`, 2026-09-19): SIGNED IN, re-verified here with
// getUser() because a public profile presents no capability of its own and an
// anonymous person-report endpoint is a harassment primitive.
//
// INSERT-ONLY on both arms — reporting never hides content and never blocks
// anyone (anti-griefing); an operator reviews via /admin/reports.
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

  const { qr_token, media_id, profile_id, reason } = parsed.data;

  // The person arm runs BEFORE the limiter's scope is built, because its scope
  // is the profile rather than an event link. Signed-in only: the menu that
  // opens this dialog renders only for a signed-in non-self viewer, and a route
  // handler is its own entry point (database-security.md).
  if (profile_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "unauthorized",
          message: "Sign in to report someone.",
        },
        { status: 401 },
      );
    }

    // Same limiter, scoped to the reported PERSON: report-bombing one profile
    // trips, and so does spraying reports across many. Fail OPEN, as the album
    // arm does; the signed-in gate is the real one here.
    let personKeys: { ipHash: string; scopeHash: string } | null = null;
    try {
      personKeys = abuseHashes(clientIp(request.headers), "report", profile_id);
      const gate = await checkAbuseRate(
        "report",
        personKeys.ipHash,
        personKeys.scopeHash,
      );
      if (!gate.allowed) {
        return NextResponse.json(
          {
            ok: false,
            code: "rate_limited",
            message:
              "Too many reports from this network right now. Please try again later.",
          },
          {
            status: 429,
            headers: { "Retry-After": String(gate.retryAfterSec) },
          },
        );
      }
    } catch {
      captureWarning("security", "abuse_limiter_unavailable_fail_open", {
        kind: "report",
      });
      personKeys = null;
    }

    const result = await createProfileReport({
      profileId: profile_id,
      reason: reason || null,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, message: result.message },
        { status: result.code === "unauthorized" ? 401 : 400 },
      );
    }
    if (personKeys) {
      await recordAbuseEvent(
        "report",
        personKeys.ipHash,
        personKeys.scopeHash,
      ).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  // The album arm, unchanged. The schema's refine guarantees a token here.
  if (!qr_token) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid report." },
      { status: 400 },
    );
  }

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
