import { after, NextResponse } from "next/server";

import { createReport } from "@/lib/db/mutations/report";
import { createProfileReport } from "@/lib/db/mutations/social";
import { readEventName } from "@/lib/db/queries/reports";
import { captureWarning } from "@/lib/observability/sentry";
import { INSTANT_HIDE_KIND } from "@/lib/reports/kinds";
import { alertUrgentReport, readReporter } from "@/lib/reports/reporter.server";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation/report";

// POST a public report against an event (or a specific item), or against a
// PERSON. Album arm: the qr_token in the body is the capability
// (database-security.md) that create_report validates inside the RPC; a signed-in
// reporter is read here with getUser() and never taken from the body. Person arm
// (Will, `block=report`, 2026-09-19): SIGNED IN, re-verified here with
// getUser() because a public profile presents no capability of its own and an
// anonymous person-report endpoint is a harassment primitive.
//
// ★ THE REPORT ITSELF IS NEVER GATED (admin-triage r2, his word in chat): anyone, signed in or not, files one,
// and a child-abuse report heads the queue. What the reporter's session adds is only what it proves: a
// CONFIRMED address, kept on the report until it closes (so an operator can ask for proof), and, on a
// child-abuse report of an item, the instant hide (create_report's, with its limits). Every other report is
// INSERT-ONLY and never hides content (anti-griefing); an operator reviews via /admin/reports, and a
// child-abuse report tells the operator at once (alertUrgentReport, after the response).
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

  const { qr_token, media_id, profile_id, reason, kind } = parsed.data;

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
    return NextResponse.json({ ok: true, hid: false });
  }

  // The album arm. The schema's refine guarantees a token here.
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

  // Who is reporting, as the session says (nobody, signed in, or confirmed): never the body's word.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reporter = readReporter(user);

  const reportKind = kind ?? "other";
  const result = await createReport({
    qrToken: qr_token,
    mediaId: media_id ?? null,
    reason: reason || null,
    kind: reportKind,
    reporter,
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

  const { report_id, hid, event_id } = result.data;
  if (reportKind === INSTANT_HIDE_KIND && event_id) {
    // After the response: the reporter's toast never waits on the operator's inbox.
    after(async () => {
      const eventName = await readEventName(event_id).catch(() => null);
      await alertUrgentReport({
        reportId: report_id,
        eventId: event_id,
        eventName: eventName ?? "an album",
        hidden: hid,
      });
    });
  }
  return NextResponse.json({ ok: true, hid });
}
