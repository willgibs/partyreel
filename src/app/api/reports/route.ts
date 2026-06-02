import { NextResponse } from "next/server";

import { createReport } from "@/lib/db/mutations/report";
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

  return NextResponse.json({ ok: true });
}
