import { NextResponse } from "next/server";

import { createGuest } from "@/lib/db/mutations/guest";
import { joinSchema } from "@/lib/validation/upload";

// POST joins a guest to an event via the create_guest RPC (validated by the
// event's qr_token) and returns an opaque session_token — the guest's capability
// for subsequent uploads (ADR-0004). No account, no JWT.
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

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid join request." },
      { status: 400 },
    );
  }

  const { qr_token } = parsed.data;
  const result = await createGuest({
    qrToken: qr_token,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "email_required"
          ? 422
          : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  // Return only what the client needs to upload — guest_id stays internal.
  return NextResponse.json({
    ok: true,
    session_token: result.data.session_token,
    event_id: result.data.event_id,
  });
}
