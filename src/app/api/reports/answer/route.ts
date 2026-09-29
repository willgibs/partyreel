import { NextResponse } from "next/server";
import { z } from "zod";

import { answerProof } from "@/lib/db/mutations/report";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { isProofToken, proofTokenHash } from "@/lib/reports/proof-token";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";

// POST the reporter's answer to an operator's Ask for proof (admin-triage r2, `proof=confirm`). The token in the
// body is the capability (the mail to the address she confirmed carried it, and only its hash is stored); it names
// one open report, takes one answer, and dies with it. Anonymous by design: she may have no session on this
// device, and the mail already proved the address. Rate-limited like a report (breadth across links is the
// scraper's shape); a used, closed or unknown link answers one 404, so the route is no oracle for which it was.
const answerSchema = z.object({
  token: z.string(),
  answer: z
    .string()
    .trim()
    .min(1, "Write your answer first.")
    .max(2000, "Keep your answer under 2000 characters."),
});

const GONE = {
  ok: false,
  code: "gone",
  message:
    "This link has already been used, or the report it belongs to is closed.",
};

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
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "bad_request",
        message: parsed.error.issues[0]?.message ?? "Invalid answer.",
      },
      { status: 400 },
    );
  }
  if (!isProofToken(parsed.data.token)) {
    return NextResponse.json(GONE, { status: 404 });
  }
  const tokenHash = proofTokenHash(parsed.data.token);

  let keys: { ipHash: string; scopeHash: string } | null = null;
  try {
    keys = abuseHashes(clientIp(request.headers), "report", tokenHash);
    const gate = await checkAbuseRate("report", keys.ipHash, keys.scopeHash);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message: "Too many tries from this network. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "report_answer",
    });
    keys = null;
  }

  const result = await answerProof({ tokenHash, answer: parsed.data.answer });
  if (keys) {
    await recordAbuseEvent("report", keys.ipHash, keys.scopeHash).catch(
      () => {},
    );
  }
  if (!result.ok) {
    if (result.code === "unknown") {
      captureError("security", new Error("report answer write failed"), {
        route: "reports/answer",
      });
      return NextResponse.json(
        {
          ok: false,
          code: "unknown",
          message: "Couldn't add your answer. Please try again.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(GONE, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
